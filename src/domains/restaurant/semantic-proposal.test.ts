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
      { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 3, source: "EXPLICIT" } },
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

test("Semantic Proposal Contract accepts only an explicit or closed-party source for a party count", () => {
  const inferred = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2, source: "INFERRED_CLOSED_PARTY" } }],
  });
  assert.equal(inferred.valid, true);

  const invalid = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2, source: "MODEL_GUESS" } }],
  });
  assert.equal(invalid.valid, false);
  if (!invalid.valid) assert.match(invalid.errors.join(" "), /must match PARTY_SIZE/);
});

test("Semantic Proposal Contract carries an explicit open-ended recommendation count but rejects it for a named outlet", () => {
  const openEnded = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{
      field: "TARGET", operation: "ASSERT",
      value: { kind: "TARGET", goal: "RECOMMENDATION", query: "restaurants near Shibuya", selectionScope: "OPEN_ENDED", requestedResultCount: 5 },
    }],
  });
  assert.equal(openEnded.valid, true);

  const invalidNamedCount = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{
      field: "TARGET", operation: "ASSERT",
      value: { kind: "TARGET", goal: "RECOMMENDATION", query: "Sushi A", selectionScope: "SPECIFIC_OUTLET", requestedResultCount: 2 },
    }],
  });
  assert.equal(invalidNamedCount.valid, false);
  if (!invalidNamedCount.valid) assert.match(invalidNamedCount.errors.join(" "), /must match TARGET/);
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

test("explicit date and clock values require the raw user expression promised by the strict transport contract", () => {
  const missingRaw = validateRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-14" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:30" } },
    ],
  });
  assert.equal(missingRaw.valid, false);
  if (!missingRaw.valid) {
    assert.deepEqual(missingRaw.errors, [
      "facts[0].value must match DATE",
      "facts[1].value must match TIME_WINDOW",
    ]);
  }
});
