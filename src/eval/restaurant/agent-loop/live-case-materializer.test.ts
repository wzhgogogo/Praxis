import assert from "node:assert/strict";
import { test } from "node:test";

import { materializeLiveCase } from "./live-case-materializer.js";

test("live materialization resolves tonight and updates every dependent date without mutating source", () => {
  const source = {
    id: "h001", reference_time: "2026-08-19T16:20:00+08:00", content: "tonight at 7 PM",
    semantic: { date: { expression: "tonight", value: "2026-08-19" } },
    tool_requirements: { task_critical_arguments: { date: "2026-08-19" } },
    recommendation_requirements: { task_critical_eligibility: ["available on 2026-08-19 at 19:00"] },
  };
  const result = materializeLiveCase(source, "2026-08-20T16:20:00+09:00");
  assert.equal(result.semantic?.date?.value, "2026-08-20");
  assert.deepEqual((result.tool_requirements as { task_critical_arguments: { date: string } }).task_critical_arguments.date, "2026-08-20");
  assert.deepEqual((result.recommendation_requirements as { task_critical_eligibility: string[] }).task_critical_eligibility, ["available on 2026-08-20 at 19:00"]);
  assert.equal(source.semantic.date.value, "2026-08-19");
});

test("live materialization handles this Friday and this afternoon in Asia/Tokyo", () => {
  const friday = materializeLiveCase({ id: "h003", reference_time: "", semantic: { date: { expression: "this Friday", value: "2026-08-21" } } }, "2026-08-20T12:00:00+09:00");
  const afternoon = materializeLiveCase({ id: "h004", reference_time: "", semantic: { date: { expression: "this afternoon", value: "2026-08-19" } } }, "2026-08-20T12:00:00+09:00");
  assert.equal(friday.semantic?.date?.value, "2026-08-21");
  assert.equal(afternoon.semantic?.date?.value, "2026-08-20");
});
