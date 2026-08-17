import assert from "node:assert/strict";
import { test } from "node:test";

import { compileRestaurantSemanticProposal } from "./semantic-compiler.js";
import type { RestaurantSemanticProposal } from "./semantic-proposal.js";
import { applyRestaurantIntentPatch } from "./intent-state.js";

test("Restaurant Semantic Compiler translates independent corrections and negations", () => {
  const proposal: RestaurantSemanticProposal = {
    schemaVersion: "1",
    facts: [
      {
        field: "PARTY_SIZE",
        operation: "CORRECT",
        value: { kind: "PARTY_SIZE", value: 3 },
      },
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

test("Restaurant Semantic Compiler rejects singleton clear-and-set combinations independent of fact order", () => {
  const areaSet = {
    field: "AREA" as const,
    operation: "CORRECT" as const,
    value: { kind: "AREA" as const, query: "Shibuya" },
  };
  const areaClear = { field: "AREA" as const, operation: "NEGATE" as const };

  for (const facts of [
    [areaClear, areaSet],
    [areaSet, areaClear],
  ]) {
    assert.deepEqual(
      compileRestaurantSemanticProposal({ schemaVersion: "1", facts }),
      {
        status: "CONFLICT",
        conflict: {
          code: "CONTRADICTORY_PROPOSAL",
          affectedFields: ["AREA"],
          message: "The proposal both clears and sets AREA in one user turn",
        },
      },
    );
  }
});

test("collection ASSERT adds, CORRECT replaces, and NEGATE removes deterministically", () => {
  const korean = compileRestaurantSemanticProposal({
    schemaVersion: "1",
    facts: [{ field: "CUISINE", operation: "ASSERT", value: { kind: "CUISINE", value: "Korean" } }],
  });
  assert.equal(korean.status, "COMPILED");
  if (korean.status !== "COMPILED") return;
  const first = applyRestaurantIntentPatch(undefined, korean.patch);

  const thai = compileRestaurantSemanticProposal({
    schemaVersion: "1",
    facts: [{ field: "CUISINE", operation: "CORRECT", value: { kind: "CUISINE", value: "Thai" } }],
  });
  assert.equal(thai.status, "COMPILED");
  if (thai.status !== "COMPILED") return;
  const corrected = applyRestaurantIntentPatch(first, thai.patch);
  assert.deepEqual(corrected.cuisines, ["Thai"]);

  const removeThai = compileRestaurantSemanticProposal({
    schemaVersion: "1",
    facts: [{ field: "CUISINE", operation: "NEGATE", value: { kind: "CUISINE", value: "Thai" } }],
  });
  assert.equal(removeThai.status, "COMPILED");
  if (removeThai.status !== "COMPILED") return;
  assert.deepEqual(applyRestaurantIntentPatch(corrected, removeThai.patch).cuisines, []);
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
