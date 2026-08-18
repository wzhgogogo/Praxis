import assert from "node:assert/strict";
import { test } from "node:test";

import {
  RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA,
  validateRestaurantSemanticProposal,
} from "./semantic-proposal.js";

test("Semantic Proposal Contract accepts stable slots and open criteria without a taxonomy", () => {
  const valid = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 3 } },
      { field: "AREA", operation: "NEGATE" },
      {
        field: "CRITERION",
        operation: "ASSERT",
        value: { kind: "CRITERION", text: "omakase", polarity: "POSITIVE", strength: "UNSPECIFIED" },
      },
      {
        field: "CRITERION",
        operation: "ASSERT",
        value: { kind: "CRITERION", text: "no spicy", polarity: "NEGATIVE", strength: "HARD" },
      },
      { field: "DATE", operation: "CONFIRM" },
    ],
  });

  assert.equal(valid.valid, true);
});

test("Semantic Proposal Contract rejects internal protocols and invalid operation/value combinations", () => {
  const invalid = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      {
        field: "AREA",
        operation: "NEGATE",
        value: { kind: "AREA", query: "Shinjuku" },
      },
    ],
    statePatch: { phase: "SEARCHING" },
  });

  assert.equal(invalid.valid, false);
  if (!invalid.valid) {
    assert.match(invalid.errors.join(" "), /unsupported fields/);
    assert.match(invalid.errors.join(" "), /not allowed when negating a singleton/);
  }
});

test("Semantic Proposal Contract rejects collection CONFIRM because it has no deterministic effect", () => {
  const result = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "CRITERION", operation: "CONFIRM" }],
  });
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /CONFIRM is unsupported/);
});

test("DeepSeek transport schema uses only supported string constraints while local validation rejects blanks", () => {
  const serializedSchema = JSON.stringify(RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA);
  assert.equal(serializedSchema.includes("minLength"), false);
  assert.equal(serializedSchema.includes("maxLength"), false);

  const result = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      {
        field: "CRITERION",
        operation: "ASSERT",
        value: { kind: "CRITERION", text: "   ", polarity: "POSITIVE", strength: "UNSPECIFIED" },
      },
    ],
  });
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /must match CRITERION/);
});
