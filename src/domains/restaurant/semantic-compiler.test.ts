import assert from "node:assert/strict";
import { test } from "node:test";

import { compileRestaurantSemanticProposal } from "./semantic-compiler.js";
import type { RestaurantSemanticProposal } from "./semantic-proposal.js";
import { applyRestaurantIntentPatch } from "./intent-state.js";

const criterion = (
  text: string,
  polarity: "POSITIVE" | "NEGATIVE" = "POSITIVE",
  strength: "HARD" | "SOFT" | "UNSPECIFIED" = "UNSPECIFIED",
) => ({ kind: "CRITERION" as const, text, polarity, strength });

test("Restaurant Semantic Compiler translates independent corrections and criterion negations", () => {
  const proposal: RestaurantSemanticProposal = {
    schemaVersion: "3",
    facts: [
      { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 3 } },
      { field: "AREA", operation: "CORRECT", value: { kind: "AREA", query: "Shibuya" } },
      { field: "CRITERION", operation: "NEGATE", value: criterion("yakiniku") },
    ],
  };

  assert.deepEqual(compileRestaurantSemanticProposal(proposal), {
    status: "COMPILED",
    patch: {
      schemaVersion: "3",
      partySize: 3,
      area: { query: "Shibuya" },
      removeCriteria: [{ text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
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

  for (const facts of [[areaClear, areaSet], [areaSet, areaClear]]) {
    assert.deepEqual(compileRestaurantSemanticProposal({ schemaVersion: "3", facts }), {
      status: "CONFLICT",
      conflict: {
        code: "CONTRADICTORY_PROPOSAL",
        affectedFields: ["AREA"],
        message: "The proposal both clears and sets AREA in one user turn",
      },
    });
  }
});

test("criterion ASSERT adds, CORRECT replaces, and NEGATE removes deterministically", () => {
  const omakase = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "CRITERION", operation: "ASSERT", value: criterion("omakase") }],
  });
  assert.equal(omakase.status, "COMPILED");
  if (omakase.status !== "COMPILED") return;
  const first = applyRestaurantIntentPatch(undefined, omakase.patch);

  const quietPrivateRoom = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      { field: "CRITERION", operation: "CORRECT", value: criterion("quiet", "POSITIVE", "SOFT") },
      { field: "CRITERION", operation: "CORRECT", value: criterion("private room", "POSITIVE", "SOFT") },
    ],
  });
  assert.equal(quietPrivateRoom.status, "COMPILED");
  if (quietPrivateRoom.status !== "COMPILED") return;
  const corrected = applyRestaurantIntentPatch(first, quietPrivateRoom.patch);
  assert.deepEqual(corrected.criteria, [
    { text: "quiet", polarity: "POSITIVE", strength: "SOFT" },
    { text: "private room", polarity: "POSITIVE", strength: "SOFT" },
  ]);

  const removeQuiet = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "CRITERION", operation: "NEGATE", value: criterion("quiet", "POSITIVE", "SOFT") }],
  });
  assert.equal(removeQuiet.status, "COMPILED");
  if (removeQuiet.status !== "COMPILED") return;
  assert.deepEqual(applyRestaurantIntentPatch(corrected, removeQuiet.patch).criteria, [
    { text: "private room", polarity: "POSITIVE", strength: "SOFT" },
  ]);
});

test("Restaurant Semantic Compiler reports contradictory criterion additions and negations", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      { field: "CRITERION", operation: "ASSERT", value: criterion("no spicy", "NEGATIVE", "HARD") },
      { field: "CRITERION", operation: "NEGATE", value: criterion("no spicy", "NEGATIVE", "HARD") },
    ],
  });

  assert.deepEqual(result, {
    status: "CONFLICT",
    conflict: {
      code: "CONTRADICTORY_PROPOSAL",
      affectedFields: ["CRITERION"],
      message: "The proposal both adds and negates the same CRITERION value",
    },
  });
});
