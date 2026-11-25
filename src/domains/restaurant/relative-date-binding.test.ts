import assert from "node:assert/strict";
import test from "node:test";
import { bindRestaurantRelativeDate } from "./relative-date-binding.js";
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

type DateValue = Extract<NonNullable<RestaurantSemanticProposal["facts"][number]["value"]>, { kind: "DATE" }>;
function compile(message: string, date?: DateValue, operation: "ASSERT" | "CONFIRM" | "NEGATE" = "ASSERT", referenceTime = context.referenceTime) {
  const facts: RestaurantSemanticProposal["facts"] = [
    { field: "TIME_WINDOW", operation: "CORRECT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 pm" } },
    ...(date || operation !== "ASSERT" ? [{ field: "DATE" as const, operation, ...(date ? { value: date } : {}) }] : []),
  ];
  return compileRestaurantSemanticProposal({ schemaVersion: "4", facts }, { ...context, referenceTime, message });
}
function expectDate(result: ReturnType<typeof compile>, date: string | undefined) {
  assert.equal(result.status, "COMPILED");
  if (result.status === "COMPILED") assert.equal(result.patch.date, date);
}
const literal = (raw: string, value: string): DateValue => ({ kind: "DATE", raw, value });
const friday = (raw: string): DateValue => ({ kind: "DATE", weekday: "FRIDAY", raw });

test("ADR-0053 ordinary and qualified weekdays compare the complete Tokyo date", () => {
  expectDate(compile("周五晚上7点", friday("周五")), "2026-11-27");
  assert.equal(compile("周五晚上7点", literal("周五", "2026-12-04")).status, "CONFLICT", "A different Friday is still a different date");
  assert.equal(compile("周五晚上7点", { kind: "DATE", weekday: "SATURDAY", raw: "周五" }).status, "CONFLICT");
  expectDate(compile("本周五，4人，izakaya，涩谷，19:00", friday("周五")), "2026-11-27");
  assert.equal(compile("下周五晚上7点", friday("周五")).status, "CONFLICT");
  expectDate(compile("next Friday at 7 pm", literal("Friday", "2026-12-04")), "2026-12-04");
  assert.equal(compile("this Friday", friday("this Friday"), "ASSERT", "2026-11-28T10:00:00+09:00").status, "CONFLICT");
});

test("ADR-0053 complete DATE quotes bind offsets and reject truncated, invented and invalid dates", () => {
  for (const [message, raw] of [
    ["大后天晚上7点", "后天"], ["day after tomorrow", "tomorrow"], ["11月28日", "11月2日"], ["123天后", "23天后"],
    ["2026年11月28日", "11月28日"], ["yesterdayish", "yesterday"], ["2026-11-28", "2026-11-27"],
    ["2-3天后", "2-3天后"], ["-1天后", "-1天后"], ["500天后", "500天后"], ["两三天后", "两三天后"],
    ["2026-02-30", "2026-02-30"], ["2月30日", "2月30日"], ["11月28日", "11月28日"],
  ] as const) assert.equal(compile(message, literal(raw, "2027-11-28")).status, "CONFLICT", message + " / " + raw);
  expectDate(compile("改成后天晚上7点", literal("后天", "2026-11-25")), "2026-11-26");
  expectDate(compile("Dinner ＴＯＭＯＲＲＯＷ", literal("Tomorrow", "2026-11-28")), "2026-11-25");
  expectDate(compile("2026年11月28日", literal("2026年11月28日", "2026-11-28")), "2026-11-28");
  expectDate(compile("1/3", literal("1/3", "2027-01-03"), "ASSERT", "2026-12-28T10:00:00+09:00"), "2027-01-03");
});

test("ADR-0053 binds a date quoted with time and keeps the model's original DATE.raw", () => {
  const raw = "后天晚上7点";
  const tomorrow: DateValue = { kind: "DATE", raw, relativeDay: "TOMORROW" };
  expectDate(compile("改成" + raw, tomorrow), "2026-11-26");
  expectDate(compile(raw + "，就" + raw, tomorrow), "2026-11-26");
  expectDate(compile("后天，还是后天", { ...tomorrow, raw: "后天，还是后天" }), "2026-11-26");
  const bound = bindRestaurantRelativeDate({ schemaVersion: "4", facts: [
    { field: "DATE", operation: "CORRECT", value: tomorrow },
  ] }, raw, context);
  assert.equal(bound.status, "BOUND");
  if (bound.status === "BOUND") {
    assert.deepEqual(bound.proposal.facts[0]?.value, { kind: "DATE", raw, relativeOffsetDays: 2 });
  }

  expectDate(compile("下周五晚上7点", literal("下周五晚上7点", "2026-12-04")), "2026-12-04");
  expectDate(compile("2026-11-28 19:00", literal("2026-11-28 19:00", "2026-11-28")), "2026-11-28");
  expectDate(compile("11月28日晚上7点", literal("11月28日晚上7点", "2026-11-28")), "2026-11-28");
  expectDate(compile("周五前一天", literal("前一天", "2026-11-26")), "2026-11-26");
});

test("ADR-0053 rejects ambiguous or clipped quotes and checks dates inside longer quotes", () => {
  const tomorrow: DateValue = { kind: "DATE", raw: "明天或后天", relativeDay: "TOMORROW" };
  const examples: ReadonlyArray<readonly [string, DateValue]> = [
    ["下周五晚上7点", literal("下周五晚上7点", "2026-11-27")],
    ["2026-11-28 19:00", literal("2026-11-28 19:00", "2026-11-25")],
    ["11月28日晚上7点", literal("11月28日晚上7点", "2026-11-25")],
    ["明天或后天晚上7点", tomorrow],
    ["大后天晚上7点", { kind: "DATE", raw: "后天晚上7点", relativeOffsetDays: 2 }],
    ["本周五，下周五", friday("周五")],
  ];
  for (const [message, date] of examples) assert.equal(compile(message, date).status, "CONFLICT", message);
});

test("ADR-0053 treats the structured date chooser as authoritative", () => {
  const message = "Change Thu, Nov 26 to 2026-11-28";
  for (const operation of ["ASSERT", "CONFIRM", "NEGATE"] as const) assert.equal(compile(message, undefined, operation).status, "CONFLICT");
  expectDate(compile(message, literal("2026-11-27", "2026-11-27")), "2026-11-28");
  assert.equal(compile("Change Thu, Nov 26 to 2026-02-30", literal("2026-02-30", "2026-02-30")).status, "CONFLICT");
});

test("ADR-0053 leaves sentence interpretation and DATE omission to the model", () => {
  expectDate(compile("明天早上飞东京，帮我订周五晚上7点", friday("周五")), "2026-11-27");
  expectDate(compile("Tomorrow morning I land, please book 2026-11-28 at 7pm", literal("2026-11-28", "2026-11-28")), "2026-11-28");
  for (const text of ["明天早上飞东京，把晚餐时间改成8点", "明天早上，到东京，把晚餐时间改成8点", "明天早上飞东京，推荐几家涩谷寿喜锅", "改成后天晚上七点"]) expectDate(compile(text), undefined);
  expectDate(compile("晚餐日期不变，只把时间改成晚上7点", undefined, "CONFIRM"), undefined);
});
