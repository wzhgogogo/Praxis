import assert from "node:assert/strict";
import test from "node:test";
import { compileRestaurantSemanticProposal } from "./semantic-compiler.js";
import { RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA, validateRestaurantSemanticProposal, type RestaurantSemanticProposal } from "./semantic-proposal.js";

const context = { referenceTime: "2026-11-24T23:50:00+09:00", timezone: "Asia/Tokyo" as const };
const offset = (days: number): RestaurantSemanticProposal => ({ schemaVersion: "4", facts: [
  { field: "DATE", operation: "CORRECT", value: { kind: "DATE", relativeOffsetDays: days, raw: `in ${days} days` } },
] });

test("ADR-0052 DATE offset schema is bounded and compiler preserves distinct conflict identities", () => {
  assert.match(JSON.stringify(RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA), /"relativeOffsetDays":\{"type":"integer","minimum":2,"maximum":365\}/);
  for (const days of [2, 3, 365]) assert.equal(validateRestaurantSemanticProposal(offset(days)).valid, true);
  for (const days of [-1, 0, 1, 2.5, 366, NaN]) assert.equal(validateRestaurantSemanticProposal(offset(days)).valid, false, String(days));
  for (const facts of [[...offset(2).facts, ...offset(3).facts], [...offset(3).facts, ...offset(2).facts]]) {
    const result = compileRestaurantSemanticProposal({ schemaVersion: "4", facts }, context);
    assert.equal(result.status, "CONFLICT");
    if (result.status === "CONFLICT") assert.deepEqual(result.conflict.affectedFields, ["DATE"]);
  }
});

test("ADR-0052 supported current-message phrases repair DATE omission from trusted Tokyo day", () => {
  for (const [message, expected] of [
    ["今天", "2026-11-24"], ["today", "2026-11-24"], ["明天", "2026-11-25"], ["tomorrow", "2026-11-25"],
    ["后天", "2026-11-26"], ["day after tomorrow", "2026-11-26"], ["大后天", "2026-11-27"],
    ["3天后", "2026-11-27"], ["三天后", "2026-11-27"], ["in 3 days", "2026-11-27"],
    ["一周后", "2026-12-01"], ["in a week", "2026-12-01"], ["in 30 days", "2026-12-24"],
  ] as const) {
    const result = compileRestaurantSemanticProposal({ schemaVersion: "4", facts: [] }, { ...context, message });
    assert.equal(result.status, "COMPILED", message);
    if (result.status === "COMPILED") assert.equal(result.patch.date, expected, message);
  }
  for (const message of ["后天或大后天", "today or tomorrow", "in 366 days", "-2天后", "in 2.5 days"]) {
    assert.equal(compileRestaurantSemanticProposal({ schemaVersion: "4", facts: [] }, { ...context, message }).status, "CONFLICT", message);
  }
  assert.equal(compileRestaurantSemanticProposal({ schemaVersion: "4", facts: [{ field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" } }] }, { ...context, message: "Only change the time to seven" }).status, "CONFLICT", "model-only raw cannot invent a relative date");
});

test("ADR-0052 day offsets use Tokyo natural days across month, year and UTC date boundaries", () => {
  for (const [referenceTime, days, expected] of [
    ["2026-11-30T23:55:00+09:00", 2, "2026-12-02"],
    ["2026-12-30T23:55:00+09:00", 3, "2027-01-02"],
    ["2026-11-23T16:05:00Z", 2, "2026-11-26"],
  ] as const) {
    const result = compileRestaurantSemanticProposal(offset(days), { referenceTime, timezone: "Asia/Tokyo" });
    assert.equal(result.status, "COMPILED");
    if (result.status === "COMPILED") {
      assert.equal(result.patch.date, expected);
      assert.equal(result.patch.temporalResolution?.date?.basis, `RELATIVE_OFFSET_DAYS:${days}`);
      assert.equal(result.patch.temporalResolution?.referenceTime, referenceTime);
    }
  }
});
