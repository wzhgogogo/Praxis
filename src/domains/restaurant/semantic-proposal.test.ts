import assert from "node:assert/strict";
import { test } from "node:test";

import { validateRestaurantSemanticProposal } from "./semantic-proposal.js";

test("Semantic Proposal Contract accepts only the closed language-level schema", () => {
  const valid = validateRestaurantSemanticProposal({
    schemaVersion: "1",
    facts: [
      {
        field: "PARTY_SIZE",
        operation: "CORRECT",
        value: { kind: "PARTY_SIZE", value: 3 },
      },
      { field: "AREA", operation: "NEGATE" },
      {
        field: "CUISINE",
        operation: "NEGATE",
        value: { kind: "CUISINE", value: "yakiniku" },
      },
      { field: "DATE", operation: "CONFIRM" },
    ],
  });

  assert.equal(valid.valid, true);
});

test("Semantic Proposal Contract rejects internal protocols and invalid operation/value combinations", () => {
  const invalid = validateRestaurantSemanticProposal({
    schemaVersion: "1",
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
