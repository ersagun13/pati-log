import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let readme = "";
try {
  readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

test("README describes where entries live and how backups work", () => {
  assert.match(readme, /current browser profile/i);
  assert.match(readme, /localStorage/i);
  assert.match(readme, /pati-log-backup\.json/);
});

test("README sets the notebook and veterinary guidance limits", () => {
  assert.match(readme, /not veterinary guidance/i);
  assert.match(readme, /import/i);
});

test("README gives install, run, test, typecheck, and build commands", () => {
  for (const command of ["npm install", "npm run dev", "npm test", "npm run typecheck", "npm run build"]) {
    assert.ok(readme.includes(command), `README should include ${command}`);
  }
  assert.match(readme, /Node\.js 22/i);
});

test("the example is explicitly fictional", () => {
  assert.match(readme, /fictional/i);
  assert.match(readme, /Long walk in the park/);
});
