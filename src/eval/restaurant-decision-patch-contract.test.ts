import assert from "node:assert/strict";
import { test } from "node:test";

import type { DecisionState } from "./restaurant-decision-eval-contract.js";
import { canonicalizeDecisionStateForComparison } from "./restaurant-decision-eval-canonicalization.js";
import {
  RESTAURANT_DECISION_PATCH_SCHEMA,
  validateDecisionStateContract,
  validateDecisionStatePatchContract,
} from "./restaurant-decision-patch-contract.js";

test("Restaurant Decision Patch Contract publishes a closed machine-readable schema", () => {
  assert.equal(RESTAURANT_DECISION_PATCH_SCHEMA.type, "object");
  assert.equal(RESTAURANT_DECISION_PATCH_SCHEMA.$id.endsWith(":4"), true);
  assert.equal(RESTAURANT_DECISION_PATCH_SCHEMA.additionalProperties, false);
  assert.equal(RESTAURANT_DECISION_PATCH_SCHEMA.$defs.setBlock.additionalProperties, false);
  assert.equal(RESTAURANT_DECISION_PATCH_SCHEMA.$defs.deltaBlock.additionalProperties, false);
  assert.deepEqual(
    Object.keys(RESTAURANT_DECISION_PATCH_SCHEMA.$defs.deltaBlock.properties),
    ["preferences", "hardConstraints"],
  );
});

test("Restaurant Decision Patch Contract accepts typed preferences and hard constraints", () => {
  const result = validateDecisionStatePatchContract({
    set: { location: { kind: "AREA", query: "Kameido" } },
    add: {
      preferences: [
        { facet: "CUISINE", value: "Japanese food", polarity: "PREFER" },
        { facet: "FORMALITY", value: "FORMAL", polarity: "AVOID" },
      ],
      hardConstraints: [
        { kind: "SMOKING_POLICY", value: "FULLY_NON_SMOKING" },
        { kind: "ALLERGY", allergen: "PEANUT", severity: "SEVERE" },
      ],
    },
  });

  assert.equal(result.valid, true);
});

test("Restaurant Decision Patch Contract rejects legacy strings and uncontrolled synonyms", () => {
  const legacy = validateDecisionStatePatchContract({ add: { negativePreferences: ["too formal"] } });
  const uncontrolled = validateDecisionStatePatchContract({
    add: { preferences: [{ facet: "FORMALITY", value: "too formal", polarity: "AVOID" }] },
  });
  const misplacedTravel = validateDecisionStatePatchContract({
    add: { preferences: [{ facet: "TRAVEL", value: "farther", polarity: "PREFER" }] },
  });

  assert.equal(legacy.valid, false);
  assert.equal(uncontrolled.valid, false);
  assert.equal(misplacedTravel.valid, false);
});

test("Restaurant Decision Patch Contract rejects contradictory add/remove operations", () => {
  const result = validateDecisionStatePatchContract({
    add: { preferences: [{ facet: "VIBE", value: "QUIET", polarity: "PREFER" }] },
    remove: { preferences: [{ facet: "VIBE", value: "QUIET", polarity: "PREFER" }] },
  });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.issues.some((item) => item.message.includes("cannot add and remove")), true);
  }
});

test("Restaurant Decision State Contract and comparison treat semantic lists as sets", () => {
  const first: DecisionState = {
    target: { kind: "OPEN" },
    preferences: [
      { facet: "VIBE", value: "QUIET", polarity: "PREFER" },
      { facet: "CUISINE", value: "Japanese food", polarity: "PREFER" },
    ],
    hardConstraints: [{ kind: "ALLERGY", allergen: "peanut", severity: "SEVERE" }],
  };
  const second: DecisionState = {
    target: { kind: "OPEN" },
    preferences: [
      { facet: "CUISINE", value: "JAPANESE", polarity: "PREFER" },
      { facet: "VIBE", value: "QUIET", polarity: "PREFER" },
    ],
    hardConstraints: [{ kind: "ALLERGY", allergen: "PEANUT", severity: "SEVERE" }],
  };

  assert.deepEqual(validateDecisionStateContract(first), []);
  assert.deepEqual(canonicalizeDecisionStateForComparison(first), canonicalizeDecisionStateForComparison(second));
});
