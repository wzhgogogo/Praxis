import assert from "node:assert/strict";
import { test } from "node:test";

import { compileRestaurantSemanticProposal } from "./semantic-compiler.js";
import type { RestaurantSemanticProposal } from "./semantic-proposal.js";

test("Restaurant Semantic Compiler deterministically translates corrections and negations", () => {
  const proposal: RestaurantSemanticProposal = {
    schemaVersion: "1",
    facts: [
      {
        field: "PARTY_SIZE",
        operation: "CORRECT",
        value: { kind: "PARTY_SIZE", value: 3 },
      },
      { field: "AREA", operation: "NEGATE" },
      {
        field: "AREA",
        operation: "CORRECT",
        value: { kind: "AREA", query: "Shibuya" },
      },
      {
        field: "CUISINE",
        operation: "NEGATE",
        value: { kind: "CUISINE", value: "yakiniku" },
      },
    ],
  };

  assert.deepEqual(compileRestaurantSemanticProposal(proposal), {
    status: "COMPILED",
    patch: {
      schemaVersion: "1",
      partySize: 3,
      area: { query: "Shibuya" },
      removeCuisines: ["yakiniku"],
    },
  });
});

test("Restaurant Semantic Compiler records one-turn contradictions without mutating state", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "1",
    facts: [
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 3 } },
    ],
  });

  assert.deepEqual(result, {
    status: "CONFLICT",
    conflict: {
      code: "CONTRADICTORY_PROPOSAL",
      affectedFields: ["PARTY_SIZE"],
      message: "The proposal supplies conflicting PARTY_SIZE values in one user turn",
    },
  });
});
