import assert from "node:assert/strict";
import test from "node:test";
import { classifyDomChange } from "../dom-change/classification.js";

test("G2 classification retains honest unknown and catches contradictory/new claims independently", () => {
  assert.equal(classifyDomChange({ day: "FULL", slot: null }, { day: "FULL", slot: null }, true).verdict, "PASS");
  assert.equal(classifyDomChange({ day: "FULL", slot: null }, { day: null, slot: null }, true).verdict, "DEGRADED_HONEST");
  assert.equal(classifyDomChange({ day: "FULL" }, { day: "SELECTABLE" }, true).verdict, "FAIL");
  assert.equal(classifyDomChange({ slot: null }, { slot: "19:00" }, true).verdict, "FAIL");
  assert.equal(classifyDomChange({ day: "FULL" }, { day: null }, false).verdict, "INVALID_MUTATION");
});
