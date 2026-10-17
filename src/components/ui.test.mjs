import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(url) {
  try {
    return await readFile(new URL(url, import.meta.url), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

const [app, form, list, html] = await Promise.all([
  source("../App.tsx"),
  source("./EntryForm.tsx"),
  source("./EntryList.tsx"),
  source("../../index.html"),
]);

test("the app connects storage, reminders, and entry actions", () => {
  assert.match(app, /loadEntries/);
  assert.match(app, /saveEntries/);
  assert.match(app, /getUpcomingReminders/);
  assert.match(app, /<EntryForm\b/);
  assert.match(app, /onAdd=\{handleAdd\}/);
  assert.match(app, /<EntryList\b/);
  assert.match(app, /onDelete=\{handleDelete\}/);
  assert.match(app, /onUndo=\{handleUndo\}/);
  assert.match(app, /Start a fresh notebook/);
  assert.match(app, /createObjectURL/);
});

test("the form labels every value it asks a person to enter", () => {
  assert.match(form, /aria-label="Add an entry"/);
  assert.match(form, /htmlFor="entry-kind"/);
  assert.match(form, /htmlFor="entry-date"/);
  assert.match(form, /htmlFor="entry-note"/);
  assert.match(form, /htmlFor="entry-weight"/);
  assert.match(form, /htmlFor="entry-reminder-date"/);
});

test("the list exposes dates, deletion, and undo to assistive technology", () => {
  assert.match(list, /<time\b[^>]*dateTime=\{entry\.date\}/);
  assert.match(list, /aria-label=\{deleteEntryLabel\(entry, index, entries\.length\)\}/);
  assert.match(list, /role="status"/);
  assert.match(list, />Undo</);
});

test("the page has a mount point and loads the React entry file", () => {
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /src="\/src\/main\.tsx"/);
});
