import { validateEntry, type Entry } from "./domain/petLog.ts";

export const STORAGE_KEY = "pati-log";
export const STORAGE_VERSION = 1;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StorageLoadResult {
  entries: Entry[];
  status: "ready" | "corrupt" | "unavailable";
  message: string | null;
}

const corruptResult = (message = "Saved entries could not be read. The saved data was left untouched."): StorageLoadResult => ({
  entries: [],
  status: "corrupt",
  message,
});

const unavailableResult = (): StorageLoadResult => ({
  entries: [],
  status: "unavailable",
  message: "Browser storage is unavailable in this tab. You can still export a backup, but entries will not survive a reload.",
});

export function loadEntries(storage: StorageLike | null): StorageLoadResult {
  if (!storage) return unavailableResult();

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return unavailableResult();
  }

  if (raw === null) return { entries: [], status: "ready", message: null };

  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return corruptResult();
  }

  if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return corruptResult();
  const notebook = saved as { version?: unknown; entries?: unknown };
  if (notebook.version !== STORAGE_VERSION || !Array.isArray(notebook.entries)) {
    return corruptResult("This saved notebook format is not supported here. The saved data was left untouched.");
  }
  if (notebook.entries.some((entry) => validateEntry(entry) !== null)) return corruptResult();

  return { entries: notebook.entries as Entry[], status: "ready", message: null };
}

export function saveEntries(storage: StorageLike, entries: Entry[]): void {
  if (!Array.isArray(entries) || entries.some((entry) => validateEntry(entry) !== null)) {
    throw new Error("Cannot save an invalid entry list.");
  }

  storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, entries }));
}
