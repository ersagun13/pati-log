import assert from "node:assert/strict";
import test from "node:test";
import { deleteEntryLabel } from "./entryLabels.ts";

test("delete labels distinguish same-day entries and include useful context", () => {
  const entries = [
    { id: "one", kind: "note", date: "2026-10-17", note: "Fed breakfast before work." },
    { id: "two", kind: "care", date: "2026-10-17", note: "Cleaned the water bowl." },
  ];
  const labels = entries.map((entry, index) => deleteEntryLabel(entry, index, entries.length));

  assert.notEqual(labels[0], labels[1]);
  assert.match(labels[0], /note entry 1 of 2/i);
  assert.match(labels[0], /2026-10-17/);
  assert.match(labels[0], /Fed breakfast before work/);
  assert.match(labels[1], /care entry 2 of 2/i);
});

test("weight delete labels include the recorded weight", () => {
  const label = deleteEntryLabel(
    { id: "weight-1", kind: "weight", date: "2026-10-17", note: "Morning check", weightKg: 4.2 },
    0,
    1,
  );

  assert.match(label, /weight entry 1 of 1/i);
  assert.match(label, /4.2 kg/);
});
