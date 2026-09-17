import assert from "node:assert/strict";
import test from "node:test";

import { requiresEvaluationLocation } from "./evaluation-location-selection.js";

test("a frozen evaluation coordinate is selected only for NEAR_USER, never a named area", () => {
  assert.equal(requiresEvaluationLocation({ semantic: { location: { value: "Shibuya", relation: "NEAR" } } }), false);
  assert.equal(requiresEvaluationLocation({ semantic: { location: { value: "nearby", relation: "NEAR_USER" } } }), true);
  assert.equal(requiresEvaluationLocation({ semantic: { location: { value: "nearby" } } }), false);
});
