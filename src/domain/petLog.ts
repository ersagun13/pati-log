export type EntryKind = "weight" | "care" | "note";

export interface Entry {
  id: string;
  kind: EntryKind;
  date: string;
  note: string;
  weightKg?: number;
  reminderDate?: string;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateEntry(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "Entry must be an object.";
  }

  const entry = value as Partial<Entry>;
  if (typeof entry.id !== "string" || entry.id.trim() === "") return "Entry needs an ID.";
  if (entry.kind !== "weight" && entry.kind !== "care" && entry.kind !== "note") {
    return "Choose a valid entry type.";
  }
  if (!isIsoDate(entry.date)) return "Enter a valid date.";
  if (typeof entry.note !== "string" || entry.note.trim() === "") return "Add a short note.";

  if (entry.kind === "weight") {
    if (typeof entry.weightKg !== "number" || !Number.isFinite(entry.weightKg) || entry.weightKg <= 0) {
      return "Enter a weight greater than zero.";
    }
  } else if (entry.weightKg !== undefined) {
    return "Only weight entries can include a weight.";
  }

  if (entry.reminderDate !== undefined && !isIsoDate(entry.reminderDate)) {
    return "Enter a valid reminder date.";
  }

  return null;
}

export function addEntry(entries: Entry[], entry: Entry): Entry[] {
  const problem = validateEntry(entry);
  if (problem) throw new Error(problem);
  if (entries.some((item) => item.id === entry.id)) {
    throw new Error("An entry with this ID already exists.");
  }

  return [{ ...entry, note: entry.note.trim() }, ...entries];
}

export function getUpcomingReminders(entries: Entry[], today: string, days = 30): Entry[] {
  if (!isIsoDate(today) || !Number.isFinite(days)) return [];

  const lastDay = new Date(`${today}T00:00:00.000Z`);
  lastDay.setUTCDate(lastDay.getUTCDate() + Math.max(0, Math.floor(days)));
  const through = lastDay.toISOString().slice(0, 10);

  return entries
    .filter((entry) => entry.reminderDate !== undefined && entry.reminderDate >= today && entry.reminderDate <= through)
    .slice()
    .sort((left, right) => {
      const byDate = (left.reminderDate ?? "").localeCompare(right.reminderDate ?? "");
      if (byDate !== 0) return byDate;
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    });
}

export function removeEntry(entries: Entry[], id: string): { entries: Entry[]; deleted?: Entry } {
  const deleted = entries.find((entry) => entry.id === id);
  if (!deleted) return { entries };
  return { entries: entries.filter((entry) => entry.id !== id), deleted };
}

export function restoreEntry(entries: Entry[], deleted: Entry): Entry[] {
  if (entries.some((entry) => entry.id === deleted.id)) return entries;
  return [deleted, ...entries];
}

export function exportEntries(entries: Entry[]): string {
  if (!Array.isArray(entries) || entries.some((entry) => validateEntry(entry) !== null)) {
    throw new Error("Cannot export an invalid entry list.");
  }

  return JSON.stringify({ format: "pati-log", version: 1, entries }, null, 2);
}
