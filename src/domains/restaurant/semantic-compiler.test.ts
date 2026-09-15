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

test("Restaurant Semantic Compiler preserves the user delivery goal independently of party size", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "afternoon cafe for two" } }],
  });
  assert.deepEqual(result, {
    status: "COMPILED",
    patch: { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "afternoon cafe for two" } },
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

test("Restaurant Semantic Compiler materializes Tokyo relative time in code and records its basis", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TODAY", raw: "today" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", raw: "this afternoon" } },
    ],
  }, { referenceTime: "2026-09-14T00:30:00-07:00", timezone: "Asia/Tokyo" });
  assert.deepEqual(result, {
    status: "COMPILED",
    patch: {
      schemaVersion: "3", date: "2026-09-14", timeWindow: { earliest: "12:00", latest: "17:00" },
      temporalResolution: {
        policyVersion: "restaurant-temporal-materialization@2",
        referenceTime: "2026-09-14T00:30:00-07:00", timezone: "Asia/Tokyo",
        date: { expression: "today", resolvedDate: "2026-09-14", basis: "TODAY" },
        timeWindow: { expression: "this afternoon", resolvedTimeWindow: { earliest: "12:00", latest: "17:00" }, basis: "DAYPART:AFTERNOON" },
      },
    },
  });
});

test("Restaurant Semantic Compiler carries a relative offset across Tokyo midnight without model date arithmetic", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", relativeOffsetMinutes: 120, raw: "in two hours" } }],
  }, { referenceTime: "2026-09-14T21:30:00.000Z", timezone: "Asia/Tokyo" });
  assert.equal(result.status, "COMPILED");
  if (result.status === "COMPILED") {
    assert.equal(result.patch.date, "2026-09-15");
    assert.deepEqual(result.patch.timeWindow, { earliest: "08:30", latest: "08:30" });
    assert.equal(result.patch.temporalResolution?.timeWindow?.basis, "RELATIVE_OFFSET_MINUTES:120");
  }
});

test("an explicit calendar date wins over a relative clock date while retaining the relative clock", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", weekday: "FRIDAY", raw: "this Friday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", relativeOffsetMinutes: 0, raw: "after work" } },
    ],
  }, { referenceTime: "2026-09-14T08:20:55.000Z", timezone: "Asia/Tokyo" });
  assert.equal(result.status, "COMPILED");
  if (result.status === "COMPILED") {
    assert.equal(result.patch.date, "2026-09-18");
    assert.deepEqual(result.patch.timeWindow, { earliest: "17:20", latest: "17:20" });
  }
});

test("after work remains an original broad query rather than an invented 18:00-20:00 promise", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", weekday: "FRIDAY", raw: "Friday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTER_WORK", raw: "after work" } },
    ],
  }, { referenceTime: "2026-09-14T08:20:55.000Z", timezone: "Asia/Tokyo" });
  assert.equal(result.status, "COMPILED");
  if (result.status === "COMPILED") {
    assert.equal(result.patch.date, "2026-09-18");
    assert.deepEqual(result.patch.timeWindow, { earliest: "17:30", latest: "22:00" });
    assert.deepEqual(result.patch.temporalResolution?.timeWindow, {
      expression: "after work", resolvedTimeWindow: { earliest: "17:30", latest: "22:00" }, basis: "DAYPART:AFTER_WORK_BROAD_WINDOW",
    });
  }
});

test("this afternoon carries its Tokyo date so a timed recommendation cannot bypass opening-hours evidence", () => {
  const result = compileRestaurantSemanticProposal({
    schemaVersion: "3",
    facts: [{ field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", relativeDay: "TODAY", raw: "this afternoon" } }],
  }, { referenceTime: "2026-09-14T08:20:55.000Z", timezone: "Asia/Tokyo" });
  assert.equal(result.status, "COMPILED");
  if (result.status === "COMPILED") {
    assert.equal(result.patch.date, "2026-09-14");
    assert.deepEqual(result.patch.timeWindow, { earliest: "12:00", latest: "17:00" });
  }
});
