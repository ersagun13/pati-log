import type { Entry } from "../domain/petLog.ts";

export function deleteEntryLabel(entry: Entry, index: number, total: number): string {
  const detail = entry.kind === "weight" && typeof entry.weightKg === "number"
    ? `${entry.weightKg} kg`
    : entry.note.trim().replace(/\s+/g, " ").slice(0, 48);

  return `Delete ${entry.kind} entry ${index + 1} of ${total} from ${entry.date}: ${detail}`;
}
