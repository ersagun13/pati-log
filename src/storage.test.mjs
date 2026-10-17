import assert from "node:assert/strict";
import test from "node:test";

let storageModule;
try {
  storageModule = await import("./storage.ts");
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

function requireFunction(name) {
  assert.equal(typeof storageModule?.[name], "function", `storage.ts must export ${name}`);
  return storageModule[name];
}

class MemoryStorage {
  #items = new Map();

  getItem(key) {
    return this.#items.get(key) ?? null;
  }

  setItem(key, value) {
    this.#items.set(key, String(value));
  }
}

const validEntry = {
  id: "entry-1",
  kind: "care",
  date: "2026-10-17",
  note: "Water bowl cleaned.",
  reminderDate: "2026-10-24",
};

test("loadEntries treats a new browser profile as an empty notebook", () => {
  const loadEntries = requireFunction("loadEntries");
  const result = loadEntries(new MemoryStorage());

  assert.deepEqual(result.entries, []);
  assert.equal(result.status, "ready");
  assert.equal(result.message, null);
});

test("saveEntries writes the current version and loadEntries restores it", () => {
  const loadEntries = requireFunction("loadEntries");
  const saveEntries = requireFunction("saveEntries");
  const storage = new MemoryStorage();

  saveEntries(storage, [validEntry]);
  const result = loadEntries(storage);

  assert.deepEqual(result.entries, [validEntry]);
  assert.equal(result.status, "ready");
});

test("saveEntries rejects duplicate entry IDs", () => {
  const saveEntries = requireFunction("saveEntries");
  const storage = new MemoryStorage();
  const duplicate = { ...validEntry, note: "A second entry with the same ID." };

  assert.throws(() => saveEntries(storage, [validEntry, duplicate]), /invalid entry list/i);
  assert.equal(storage.getItem("pati-log"), null);
});

test("loadEntries preserves corrupt data and returns a recovery message", () => {
  const loadEntries = requireFunction("loadEntries");
  const storage = new MemoryStorage();
  storage.setItem("pati-log", "not json");

  const result = loadEntries(storage);

  assert.deepEqual(result.entries, []);
  assert.equal(result.status, "corrupt");
  assert.match(result.message, /could not be read/i);
  assert.equal(storage.getItem("pati-log"), "not json");
});

test("loadEntries reports unsupported storage versions without deleting them", () => {
  const loadEntries = requireFunction("loadEntries");
  const storage = new MemoryStorage();
  const unsupported = JSON.stringify({ version: 88, entries: [validEntry] });
  storage.setItem("pati-log", unsupported);

  const result = loadEntries(storage);

  assert.equal(result.status, "corrupt");
  assert.deepEqual(result.entries, []);
  assert.equal(storage.getItem("pati-log"), unsupported);
});

test("loadEntries rejects duplicate IDs and leaves the saved notebook untouched", () => {
  const loadEntries = requireFunction("loadEntries");
  const storage = new MemoryStorage();
  const raw = JSON.stringify({ version: 1, entries: [validEntry, { ...validEntry, note: "Duplicate ID." }] });
  storage.setItem("pati-log", raw);

  const result = loadEntries(storage);

  assert.equal(result.status, "corrupt");
  assert.deepEqual(result.entries, []);
  assert.equal(storage.getItem("pati-log"), raw);
});

test("loadEntries reports unavailable browser storage without throwing", () => {
  const loadEntries = requireFunction("loadEntries");

  assert.deepEqual(loadEntries(null), {
    entries: [],
    status: "unavailable",
    message: "Browser storage is unavailable in this tab. You can still export a backup, but entries will not survive a reload.",
  });
});
