import assert from "node:assert/strict";
import test from "node:test";

let petLog;
try {
  petLog = await import("./petLog.ts");
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

function requireFunction(name) {
  assert.equal(typeof petLog?.[name], "function", `petLog.ts must export ${name}`);
  return petLog[name];
}

const note = (overrides = {}) => ({
  id: "entry-1",
  kind: "note",
  date: "2026-10-17",
  note: "  Took the long path home.  ",
  ...overrides,
});

test("addEntry trims a note and leaves the original list alone", () => {
  const addEntry = requireFunction("addEntry");
  const original = [];
  const result = addEntry(original, note());

  assert.deepEqual(original, []);
  assert.equal(result[0].note, "Took the long path home.");
});

test("addEntry requires a real date and a non-empty note", () => {
  const addEntry = requireFunction("addEntry");

  assert.throws(() => addEntry([], note({ note: "  " })), /note/i);
  assert.throws(() => addEntry([], note({ date: "2026-02-30" })), /date/i);
  assert.throws(() => addEntry([], note({ date: "17/10/2026" })), /date/i);
});

test("weight entries require a finite positive weight", () => {
  const addEntry = requireFunction("addEntry");

  assert.throws(() => addEntry([], note({ kind: "weight" })), /weight/i);
  assert.throws(() => addEntry([], note({ kind: "weight", weightKg: 0 })), /weight/i);
  assert.throws(() => addEntry([], note({ kind: "weight", weightKg: Infinity })), /weight/i);
  assert.equal(addEntry([], note({ kind: "weight", weightKg: 4.25 })).length, 1);
});

test("reminders exclude past dates and sort by date then id", () => {
  const getUpcomingReminders = requireFunction("getUpcomingReminders");
  const entries = [
    note({ id: "z", reminderDate: "2026-10-20" }),
    note({ id: "old", reminderDate: "2026-10-16" }),
    note({ id: "b", reminderDate: "2026-10-19" }),
    note({ id: "a", reminderDate: "2026-10-19" }),
    note({ id: "far", reminderDate: "2026-11-17" }),
  ];

  assert.deepEqual(
    getUpcomingReminders(entries, "2026-10-17", 30).map((entry) => entry.id),
    ["a", "b", "z"],
  );
});

test("removeEntry returns the removed entry and restoreEntry prevents duplicates", () => {
  const removeEntry = requireFunction("removeEntry");
  const restoreEntry = requireFunction("restoreEntry");
  const entries = [note(), note({ id: "entry-2", date: "2026-10-16" })];
  const removed = removeEntry(entries, "entry-1");

  assert.equal(removed.deleted.id, "entry-1");
  assert.deepEqual(removed.entries.map((entry) => entry.id), ["entry-2"]);
  assert.deepEqual(restoreEntry(removed.entries, removed.deleted).map((entry) => entry.id), ["entry-1", "entry-2"]);
  assert.deepEqual(restoreEntry(entries, note()), entries);
});

test("exportEntries creates a versioned JSON backup that round-trips", () => {
  const exportEntries = requireFunction("exportEntries");
  const entries = [note({ reminderDate: "2026-10-20" })];
  const backup = JSON.parse(exportEntries(entries));

  assert.equal(backup.format, "pati-log");
  assert.equal(backup.version, 1);
  assert.deepEqual(backup.entries, entries);
});

test("exportEntries rejects duplicate entry IDs", () => {
  const exportEntries = requireFunction("exportEntries");

  assert.throws(
    () => exportEntries([note(), note({ note: "A second entry with the same ID." })]),
    /invalid entry list/i,
  );
});
