import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { loadFrozenLiveCases, materializeLiveCase, RESTAURANT_READ_DEVELOPMENT_CASE_PATH, RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION } from "./live-case-materializer.js";

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

test("live materialization independently resolves a right-now clock in Tokyo instead of retaining frozen case time", () => {
  const source = {
    id: "h005", reference_time: "2026-08-19T16:00:00+08:00", content: "open tables right now",
    semantic: { date: { expression: "right now", value: "2026-08-19" }, time: { expression: "right now", value: "16:00" } },
    tool_requirements: { task_critical_arguments: { date: "2026-08-19", time: "16:00" } },
  };
  const result = materializeLiveCase(source, "2026-09-14T09:27:30+09:00");
  assert.equal(result.semantic?.date?.value, "2026-09-14");
  assert.equal(result.semantic?.time?.value, "09:27");
  assert.equal((result.tool_requirements as { task_critical_arguments: { time: string } }).task_critical_arguments.time, "09:27");
  assert.equal(result.materialization.resolvedTokyoTime, "09:27");
  assert.equal(source.semantic.time.value, "16:00");
});

test("current development inputs preserve the archived user messages and have one parameter oracle", async () => {
  const archivePath = "docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml";
  const current = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  const historical = await loadFrozenLiveCases(archivePath);
  assert.equal(createHash("sha256").update(await readFile(archivePath)).digest("hex"), "2e32c2c3642a9d480f81c6ba06641925be98981b16d6f8235e461b4d9adac98b");
  assert.deepEqual(current.map(item => item.id), ["h001", "h002", "h003", "h004", "h005"]);
  assert.deepEqual(current.map(({ id, content }) => ({ id, content })), historical.map(({ id, content }) => ({ id, content })));
  for (const item of current) {
    assert.equal(item.dataset, RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION);
    assert.deepEqual(Object.keys(item).sort(), ["acceptance", "content", "dataset", "id", "reference_time", "semantic"]);
  }
});

test("real case loader through materialization and evaluator agrees with independent current request expectations", async () => {
  // Contract test boundary: actual dataset loader → materializer → evaluator.
  // No semantic model, source execution or final-result qualification is simulated here.
  const criterion = (text: string, polarity = "POSITIVE", strength = "HARD") => ({ text, polarity, strength });
  const point = (time: string) => ({ earliest: time, latest: time });
  const expected = [
    { goal: "AVAILABILITY", date: "2026-09-16", partySize: 2, timeWindow: point("19:00"), area: { query: "near Shibuya" }, criteria: [criterion("omakase")] },
    { goal: "AVAILABILITY", date: "2026-09-19", partySize: 2, area: { query: "near Higashi-Ginza" }, timeWindow: point("18:30"), criteria: [criterion("good for a first date", "POSITIVE", "SOFT"), criterion("around 10,000 yen per person", "POSITIVE", "SOFT"), criterion("Sichuan/Hunan cuisine", "NEGATIVE"), criterion("hot pot restaurant", "NEGATIVE")] },
    { goal: "AVAILABILITY", date: "2026-09-18", partySize: 10, area: { query: "nearby" }, timeWindow: { earliest: "17:30", latest: "22:00" }, criteria: [criterion("team dinner", "POSITIVE", "UNSPECIFIED"), criterion("around 3,000 yen per person", "POSITIVE", "SOFT"), criterion("good for drinks", "POSITIVE", "UNSPECIFIED"), criterion("private room", "POSITIVE", "SOFT")] },
    { goal: "RECOMMENDATION", date: "2026-09-16", area: { query: "nearby" }, timeWindow: { earliest: "12:00", latest: "17:00" }, criteria: [criterion("cafe"), criterion("good for meeting a friend", "POSITIVE", "SOFT")] },
    { goal: "AVAILABILITY", date: "2026-09-16", partySize: 4, area: { query: "nearby" }, timeWindow: point("12:00"), criteria: [criterion("local food"), criterion("fast food", "NEGATIVE")] },
  ];
  const cases = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  for (const [index, item] of cases.entries()) {
    const { goal, ...request } = expected[index]!;
    const materializedCase = materializeLiveCase(item, "2026-09-16T03:00:00.000Z");
    const artifact = { materializedCase, finalSnapshot: { domainState: { intentDraft: { ...request, target: { goal } } } } };
    const evaluate = () => evaluateRestaurantHybridLiveArtifact(artifact, { path: "contract-test", sha256: "a".repeat(64) }).findings.find(f => f.dimension === "AUTHORITATIVE_CONDITIONS")!;
    assert.equal(evaluate().status, "SATISFIED", `${item.id}: ${JSON.stringify(evaluate())}`);
    if (item.id === "h002") assert.equal((materializedCase.semantic as Record<string, unknown>).party_size, 2);
    if (item.id === "h003") assert.deepEqual((materializedCase.semantic as Record<string, any>).time, { expression: "after work", type: "TIME_WINDOW", start: "17:30", end: "22:00" });
    artifact.finalSnapshot.domainState.intentDraft.target.goal = goal === "RECOMMENDATION" ? "AVAILABILITY" : "RECOMMENDATION";
    // Keep the mutated availability request complete to isolate the wrong-goal
    // assertion; incomplete records are separately classified NOT_EVALUATED.
    artifact.finalSnapshot.domainState.intentDraft.timeWindow ??= point("19:00");
    assert.equal(evaluate().status, "NOT_SATISFIED", `${item.id}: changing delivery goal must conflict`);
  }
});

test("relative expectation updates never rewrite literal dates or times in the actual user message", () => {
  const content = "Find tables right now; my note from 2026-08-19 at 16:00 is historical.";
  const result = materializeLiveCase({ id: "input-preservation", reference_time: "2026-08-19T16:00:00+09:00", content,
    semantic: { date: { expression: "right now", value: "2026-08-19" }, time: { expression: "right now", value: "16:00" } },
  }, "2026-09-16T03:00:00.000Z");
  assert.equal(result.semantic?.date?.value, "2026-09-16");
  assert.equal(result.semantic?.time?.value, "12:00");
  assert.equal(result.content, content);
});
