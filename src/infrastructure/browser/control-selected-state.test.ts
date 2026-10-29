import assert from "node:assert/strict";
import { test } from "node:test";
import { hasSelectedControlState } from "./control-selected-state.js";

test("selection uses public ARIA state and never a private class", () => {
  for (const name of ["active", "selected", "current", "checked", "is-active", "is-selected", "is-current", "is-checked", "fixture-choice"]) {
    assert.equal(hasSelectedControlState({ class: name }), false, `${name} alone is not selected evidence`);
    assert.equal(hasSelectedControlState({ class: name, "aria-pressed": "true" }), true);
  }
  for (const key of ["aria-selected", "aria-pressed", "aria-checked"]) {
    assert.equal(hasSelectedControlState({ [key]: "true" }), true);
    assert.equal(hasSelectedControlState({ [key]: "false", class: "is-active" }), false);
    assert.equal(hasSelectedControlState({ [key]: "mixed" }), false);
  }
  for (const value of ["true", "page", "step", "location", "date", "time"]) assert.equal(hasSelectedControlState({ "aria-current": value }), true);
});
