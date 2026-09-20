import assert from "node:assert/strict";
import test from "node:test";

import {
  CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX,
  RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS,
  categoryNegativeFactJudgmentInput,
} from "./category-negative-fact-judgment-matrix.js";

test("the exposed F1-F8 category-negative matrix is fixed at sixteen zero-retry provider attempts", () => {
  assert.deepEqual(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.map((item) => item.id), ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"]);
  assert.equal(RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS, 2);
  assert.equal(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.length * RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS, 16);
  assert.deepEqual(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.filter((item) => item.expected === "BLOCKED").map((item) => item.id), ["F1", "F2", "F8"]);
  assert.deepEqual(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.filter((item) => item.expected === "ELIGIBLE_UNKNOWN").map((item) => item.id), ["F3", "F4", "F5", "F6", "F7"]);
});

test("F8 binds a source-stated McDonald's HIGH identity to a generic same-source type without pre-seeding fast food", () => {
  const f8 = categoryNegativeFactJudgmentInput(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX[7]!, 1);
  assert.equal(f8.candidate.restaurant.outletName, "McDonald's Matrix");
  assert.equal(f8.evidence[0]?.kind, "ENTITY_MATCH");
  assert.equal(f8.evidence[0]?.entityMatch?.confidence, "HIGH");
  assert.equal(f8.evidence[0]?.sourceEntityId, f8.evidence[1]?.sourceEntityId);
  assert.deepEqual(f8.evidence[1]?.claims.restaurantTypeFacts, ["restaurant"]);
  assert.equal(f8.intent.criteria[0]?.text, "fast food");
  assert.equal(f8.intent.criteria[0]?.polarity, "NEGATIVE");
});
