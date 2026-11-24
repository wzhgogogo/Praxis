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
    ["3天后", "2026-11-27"], ["三天后", "2026-11-27"], ["in 3 days", "2026-11-27"], ["两天后", "2026-11-26"], ["三百六十五天后", "2027-11-24"],
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

test("ADR-0052 binds selected dates, not excluded mentions or uncertain day ranges", () => {
  const calendar: RestaurantSemanticProposal = { schemaVersion: "4", facts: [
    { field: "DATE", operation: "CORRECT", value: { kind: "DATE", value: "2026-11-28", raw: "11月28日" } },
  ] };
  for (const message of ["后天不行，改成11月28日晚上七点", "后天我没空，改成11月28日晚上七点", "后天我有安排，11月28日晚上七点"]) {
    const corrected = compileRestaurantSemanticProposal(calendar, { ...context, message });
    assert.equal(corrected.status, "COMPILED", message);
    if (corrected.status === "COMPILED") assert.equal(corrected.patch.date, "2026-11-28", message);
  }
  for (const message of ["大概两三天后晚上七点", "两三天后", "两到三天后", "大约三天后", "三天后左右", "后天不行，只改晚上七点", "后天还是11月28日我还没定，晚上七点", "后天我还没定，晚上七点", "后天还是周六晚上七点", "周六还是后天晚上七点", "day after tomorrow or Saturday", "Saturday or day after tomorrow"]) {
    assert.equal(compileRestaurantSemanticProposal({ schemaVersion: "4", facts: [] }, { ...context, message }).status, "CONFLICT", message);
  }
  assert.equal(compileRestaurantSemanticProposal(calendar, { ...context, message: "后天还是11月28日晚上七点" }).status, "CONFLICT");
  for (const raw of ["周六", "Saturday"]) {
    const weekday: RestaurantSemanticProposal = { schemaVersion: "4", facts: [
      { field: "DATE", operation: "CORRECT", value: { kind: "DATE", weekday: "SATURDAY", raw } },
    ] };
    const result = compileRestaurantSemanticProposal(weekday, { ...context, message: `后天我没空，改成${raw}晚上七点` });
    assert.equal(result.status, "COMPILED", raw);
    if (result.status === "COMPILED") assert.equal(result.patch.date, "2026-11-28", raw);
    assert.equal(compileRestaurantSemanticProposal(weekday, { ...context, message: `后天还是${raw}晚上七点` }).status, "CONFLICT", raw);
  }
});
