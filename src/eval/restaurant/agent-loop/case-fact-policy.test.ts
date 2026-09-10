import assert from "node:assert/strict";
import test from "node:test";

import { assessH002NegativeTypeCriterion, H002_NEGATIVE_TYPE_POLICY, RESTAURANT_CASE_FACT_POLICY_VERSION } from "./case-fact-policy.js";

test("H002 negative type policy is case-scoped and fails unknown facts closed", () => {
  assert.equal(RESTAURANT_CASE_FACT_POLICY_VERSION, "restaurant-case-fact-policy@1");
  assert.equal(H002_NEGATIVE_TYPE_POLICY.caseId, "h002");
  assert.equal(H002_NEGATIVE_TYPE_POLICY.unknown, "CONTINUE_OR_REPORT_UNKNOWN");
  assert.ok(H002_NEGATIVE_TYPE_POLICY.rules.every((rule) => rule.acceptedCuisineFacts.length > 0));
});

test("H002 exclusion evaluation needs an explicit restaurant type fact and never uses keyword absence", () => {
  assert.equal(assessH002NegativeTypeCriterion("hot pot", []), "UNKNOWN");
  assert.equal(assessH002NegativeTypeCriterion("spicy food", ["restaurant"]), "UNKNOWN");
  assert.equal(assessH002NegativeTypeCriterion("spicy food", ["japanese restaurant"]), "SATISFIES");
  assert.equal(assessH002NegativeTypeCriterion("hot pot", ["shabu shabu restaurant"]), "VIOLATES");
  assert.equal(assessH002NegativeTypeCriterion("spicy food", ["sichuan restaurant"]), "VIOLATES");
});
