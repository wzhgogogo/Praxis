import assert from "node:assert/strict";
import { test } from "node:test";

import { loadBrowserReadSkills } from "./browser-read-skills.js";

test("Browser Skills load the common read boundary plus only the requested source guidance", () => {
  const tableCheck = loadBrowserReadSkills("TABLECHECK");
  const tabelog = loadBrowserReadSkills("TABELOG");
  assert.match(tableCheck.generic, /untrusted content/i);
  assert.match(tableCheck.source, /TableCheck/);
  assert.match(tabelog.source, /Tabelog/);
  assert.notEqual(tableCheck.source, tabelog.source);
});
