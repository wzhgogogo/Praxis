import assert from "node:assert/strict";
import { test } from "node:test";

import { loadBrowserReadSkills } from "./browser-read-skills.js";
import { tableCheckDiscoveryPack, tabelogDiscoveryPack } from "../../integrations/restaurant-search/source-packs.js";

test("Browser Skills load source guidance only when the injected pack supplies it", () => {
  const tableCheck = loadBrowserReadSkills("availability-source", tableCheckDiscoveryPack.skillPath);
  const tabelog = loadBrowserReadSkills("availability-source", tabelogDiscoveryPack.skillPath);
  const website = loadBrowserReadSkills("website");
  assert.match(tableCheck.generic, /untrusted content/i);
  assert.match(tableCheck.source, /TableCheck/);
  assert.match(tabelog.source, /Tabelog/);
  assert.match(tabelog.source, /exact requested value.*availableActions/s);
  assert.match(tabelog.source, /ADVANCE_TO_AUTHORITATIVE/);
  assert.match(tabelog.source, /unexplored relevant parent or catch-all category/);
  assert.doesNotMatch(tabelog.source, /keyword-removal link/);
  assert.notEqual(tableCheck.source, tabelog.source);
  assert.match(website.source, /candidate website/i);
});
