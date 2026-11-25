import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { startWorkspaceFixture } from "../harness/workspace-fixture-server.js";
import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";

const referenceTime = "2026-11-24T10:00:00+09:00";
const userId = "workspace-user";
const initialMessage = "Find a table for two in Tokyo on 2026-11-25 at 18:00";
const initial: RestaurantSemanticProposal = { schemaVersion: "4", facts: [
  { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "dinner in Tokyo", selectionScope: "OPEN_ENDED", goalBasis: { type: "BOOKING_WORDING", reason: "Explicit fixture table request", quotes: ["Find a table"] } } },
  { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-11-25", raw: "2026-11-25" } },
  { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "18:00", latest: "18:00", raw: "18:00" } },
  { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
  { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Tokyo" } },
] };
const cases = [
  { name: "today", message: "今天晚上七点", date: { kind: "DATE", relativeDay: "TODAY", raw: "今天" }, expected: "2026-11-24" },
  { name: "tomorrow", message: "明天晚上七点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "明天" }, expected: "2026-11-25" },
  { name: "correct offset", message: "改成后天晚上七点", date: { kind: "DATE", relativeOffsetDays: 2, raw: "后天" }, expected: "2026-11-26" },
  { name: "wrong tomorrow", message: "改成后天晚上七点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "后天" }, expected: "2026-11-26" },
  { name: "long DATE.raw corrects TOMORROW", message: "改成后天晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "后天晚上7点" }, expected: "2026-11-26" },
  { name: "long DATE.raw rejects wrong qualified weekday", message: "下周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-11-27", raw: "下周五晚上7点" } },
  { name: "long DATE.raw rejects wrong ISO date", message: "2026-11-28 19:00", timeRaw: "19:00", date: { kind: "DATE", value: "2026-11-25", raw: "2026-11-28 19:00" } },
  { name: "long DATE.raw rejects wrong yearless date", message: "11月28日晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-11-25", raw: "11月28日晚上7点" } },
  { name: "long DATE.raw rejects two date words", message: "明天或后天晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "明天或后天" } },
  { name: "long DATE.raw rejects clipped offset", message: "大后天晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", relativeOffsetDays: 2, raw: "后天晚上7点" } },
  { name: "wrong calendar", message: "改成后天晚上七点", date: { kind: "DATE", value: "2026-11-25", raw: "后天" }, expected: "2026-11-26" },
  { name: "three days", message: "大后天晚上七点", date: { kind: "DATE", relativeOffsetDays: 3, raw: "大后天" }, expected: "2026-11-27" },
  { name: "four days", message: "4天后晚上七点", date: { kind: "DATE", relativeOffsetDays: 4, raw: "4天后" }, expected: "2026-11-28" },
  { name: "one week", message: "一周后晚上七点", date: { kind: "DATE", relativeOffsetDays: 7, raw: "一周后" }, expected: "2026-12-01" },
  { name: "cross month", referenceTime: "2026-11-30T10:00:00+09:00", initialDate: "2026-12-01", message: "后天晚上七点", date: { kind: "DATE", relativeOffsetDays: 2, raw: "后天" }, expected: "2026-12-02" },
  { name: "cross year", referenceTime: "2026-12-30T10:00:00+09:00", initialDate: "2026-12-31", message: "大后天晚上七点", date: { kind: "DATE", relativeOffsetDays: 3, raw: "大后天" }, expected: "2027-01-02" },
  { name: "shortened relative raw", message: "大后天晚上七点", date: { kind: "DATE", relativeOffsetDays: 2, raw: "后天" } },
  { name: "ordinary weekday mismatch", message: "周五晚上七点", date: { kind: "DATE", weekday: "SATURDAY", raw: "周五" } },
  { name: "ordinary Friday cannot move one full week", message: "周五晚上七点", date: { kind: "DATE", value: "2026-12-04", raw: "周五" } },
  { name: "this week from adjacent prefix", message: "本周五，4人，izakaya，涩谷，19:00", timeRaw: "19:00", date: { kind: "DATE", weekday: "FRIDAY", raw: "周五" }, expected: "2026-11-27" },
  { name: "this week mismatching weekday", message: "本周五，4人，izakaya，涩谷，19:00", timeRaw: "19:00", date: { kind: "DATE", weekday: "SATURDAY", raw: "周五" } },
  { name: "next week from adjacent prefix", message: "下周五晚上七点", date: { kind: "DATE", weekday: "FRIDAY", raw: "周五" } },
  { name: "next week complete weekday proposal", message: "改到下周五晚上7点。", timeRaw: "晚上7点", date: { kind: "DATE", weekday: "FRIDAY", raw: "下周五" }, expected: "2026-12-04" },
  { name: "next week wrong weekday proposal", message: "改到下周五晚上7点。", timeRaw: "晚上7点", date: { kind: "DATE", weekday: "SATURDAY", raw: "下周五" } },
  { name: "next week valid date", message: "下周五晚上七点", date: { kind: "DATE", value: "2026-12-04", raw: "下周五" }, expected: "2026-12-04" },
  { name: "wrong year for yearless date", message: "11月28日晚上七点", date: { kind: "DATE", value: "2027-11-28", raw: "11月28日" } },
  { name: "yearless date crosses year", referenceTime: "2026-12-28T10:00:00+09:00", initialDate: "2026-12-29", message: "1月3日晚上七点", date: { kind: "DATE", value: "2027-01-03", raw: "1月3日" }, expected: "2027-01-03" },
  { name: "invalid yearless date", message: "2月30日晚上七点", date: { kind: "DATE", value: "2027-02-28", raw: "2月30日" } },
  { name: "fabricated raw", message: "2026-11-28晚上七点", date: { kind: "DATE", value: "2026-11-27", raw: "2026-11-27" } },
  ...["2-3天后", "-1天后", "500天后", "两三天后"].map(raw => ({ name: "invalid offset " + raw, message: raw + "晚上七点", date: { kind: "DATE" as const, relativeOffsetDays: 2, raw } })),
  { name: "structured omission", message: "Change Tue, Nov 25 to 2026-11-28", noTime: true },
  { name: "structured confirmation conflicts", message: "Change Tue, Nov 25 to 2026-11-28", noTime: true, confirm: true },
  { name: "structured target replaces wrong raw", message: "Change Tue, Nov 25 to 2026-11-28", noTime: true, expectedTime: "18:00", date: { kind: "DATE", value: "2026-11-27", raw: "2026-11-27" }, expected: "2026-11-28" },
  { name: "background flight with selected weekday", message: "明天早上飞东京，帮我订周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", weekday: "FRIDAY", raw: "周五" }, expected: "2026-11-27" },
  { name: "background landing with selected ISO", message: "Tomorrow morning I land, please book 2026-11-28 at 7pm", timeRaw: "7pm", date: { kind: "DATE", value: "2026-11-28", raw: "2026-11-28" }, expected: "2026-11-28" },
  { name: "background flight without DATE", message: "明天早上飞东京，把晚餐时间改成8点", timeRaw: "8点", expectedTime: "20:00", expected: "2026-11-25" },
  { name: "background flight punctuation without DATE", message: "明天早上，到东京，把晚餐时间改成8点", timeRaw: "8点", expectedTime: "20:00", expected: "2026-11-25" },
  { name: "background flight recommendation", fresh: true, recommendation: true, message: "明天早上飞东京，推荐几家涩谷寿喜锅" },
  { name: "keep date while changing time", message: "晚餐日期不变，只把时间改成晚上7点", timeRaw: "晚上7点", confirm: true, expected: "2026-11-25" },
  { name: "omitted free-text DATE delegates to model", message: "改成后天晚上七点", expected: "2026-11-25" },
  { name: "date confirmation without any edit remains a no-op", message: "日期不变", noTime: true, confirm: true, unchanged: true },
  { name: "ordinary missing area still reaches ASK_USER", fresh: true, ordinaryMissing: true, message: "Find a table for two on 2026-11-25 at 18:00" },
] as const;

for (const row of cases) test(`Round28 ADR-0053 actual message and availability: ${row.name}`, { timeout: 25_000 }, async () => {
  const initialDate = "initialDate" in row ? row.initialDate : "2026-11-25";
  const expectedTime = "expectedTime" in row ? row.expectedTime : "19:00";
  const seedMessage = initialMessage.replace("2026-11-25", initialDate);
  const seed: RestaurantSemanticProposal = { ...initial, facts: initial.facts.map(fact => fact.field === "DATE"
    ? { ...fact, value: { kind: "DATE", value: initialDate, raw: initialDate } } : fact) };
  const host = await startWorkspaceFixture({ ...("ordinaryMissing" in row ? { beerDiscoveryQuery: "ordinary-ask-area" } : {}), semanticProposal(message) {
    if (message === seedMessage) return structuredClone(seed);
    assert.equal(message, row.message);
    if ("ordinaryMissing" in row) return { ...seed, facts: seed.facts.filter(fact => fact.field !== "AREA").map(fact => fact.value?.kind === "TARGET" ? { ...fact, value: { ...fact.value, query: "dinner" } } : fact) };
    if ("recommendation" in row) return { schemaVersion: "4", facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "sukiyaki in Shibuya", selectionScope: "OPEN_ENDED", goalBasis: { type: "JUDGMENT", reason: "User requests recommendations", quotes: [message] } } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shibuya" } },
    ] };
    return { schemaVersion: "4", facts: [
      ...("date" in row ? [{ field: "DATE" as const, operation: "CORRECT" as const, value: row.date }] : []),
      ...("confirm" in row ? [{ field: "DATE" as const, operation: "CONFIRM" as const }] : []),
      ...("noTime" in row ? [] : [{ field: "TIME_WINDOW" as const, operation: "CORRECT" as const, value: { kind: "TIME_WINDOW" as const, earliest: expectedTime, latest: expectedTime, raw: "timeRaw" in row ? row.timeRaw : "晚上七点" } }]),
    ] };
  } });
  async function settled(caseId: string, assistantCount: number) {
    const until = Date.now() + 10_000;
    while (Date.now() < until) {
      const view = await host.application.getCase(userId, caseId);
      if (!view.restaurant.progress.active && !view.restaurant.sourceReadContext?.handleId
        && view.conversation.messages.filter(message => message.role === "ASSISTANT").length >= assistantCount) return view;
      await delay(10);
    }
    throw new Error("Read did not settle");
  }
  try {
    host.clock.advance(Date.parse("referenceTime" in row ? row.referenceTime : referenceTime) - host.clock.now().valueOf());
    await host.application.store.upsertUser({ id: userId, displayName: "Fixture" }, host.clock.now().toISOString());
    if ("fresh" in row) {
      const created = await host.application.createCase(userId, row.message, "fresh-recommendation");
      const view = await settled(created.case.caseId, 1);
      const decisionCalls = host.requests.filter(request => request.purpose === "restaurant_agent_decide").length;
      console.info(JSON.stringify({ mode: "OFFLINE_FAKE_MODEL_PGLITE", scenario: row.name, phase: view.case.phase, persistedDate: view.restaurant.intentDraft?.date, searchCalls: host.searches.length, decisionCalls, readHandleIdle: !view.restaurant.sourceReadContext?.handleId, availabilityDates: [], availabilityCalls: host.providerCalls.length }));
      if ("ordinaryMissing" in row) {
        assert.equal(view.case.phase, "NEEDS_INPUT");
        assert.ok(view.restaurant.clarificationQuestion);
        assert.ok(decisionCalls, "Ordinary missing fields must still let the loop ASK_USER");
        assert.equal(host.searches.length, 0);
        assert.equal(host.providerCalls.length, 0);
        return;
      }
      assert.equal(view.restaurant.intentDraft?.target?.goal, "RECOMMENDATION");
      assert.equal(view.restaurant.intentDraft?.date, undefined);
      assert.ok(host.searches.length, "A background date must not prevent recommendation search");
      assert.equal(host.providerCalls.length, 0);
      return;
    }
    const created = await host.application.createCase(userId, seedMessage, "initial");
    const prior = await settled(created.case.caseId, 1);
    assert.equal(prior.restaurant.intentDraft?.date, initialDate);
    assert.ok(host.providerCalls.length, "Initial real composition reached the availability port");
    const before = host.providerCalls.length;
    const searchBefore = host.searches.length;
    const decisionsBefore = host.requests.filter(request => request.purpose === "restaurant_agent_decide").length;
    await host.application.submitMessage({ userId, conversationId: prior.case.conversationId, expectedVersion: prior.case.taskVersion, requestId: "relative-edit", message: row.message });
    const view = await settled(created.case.caseId, 2);
    const calls = host.providerCalls.slice(before);
    const decisions = host.requests.filter(request => request.purpose === "restaurant_agent_decide").length - decisionsBefore;
    console.info(JSON.stringify({ mode: "OFFLINE_FAKE_MODEL_PGLITE", scenario: row.name, phase: view.case.phase, persistedDate: view.restaurant.intentDraft?.date, searchCalls: host.searches.length - searchBefore, decisionCalls: decisions, readHandleIdle: !view.restaurant.sourceReadContext?.handleId, availabilityDates: [...new Set(calls.map(call => call.date))], availabilityTimes: [...new Set(calls.map(call => call.timeWindow.earliest))], availabilityCalls: calls.length }));
    if ("unchanged" in row) {
      assert.equal(view.case.phase, "PRESENT_RESULTS");
      assert.deepEqual(view.restaurant.intentDraft, prior.restaurant.intentDraft);
      assert.equal(view.restaurant.requirementRevision, prior.restaurant.requirementRevision);
      assert.equal(calls.length, 0);
      assert.equal(host.searches.length, searchBefore);
      assert.equal(decisions, 0);
      return;
    }
    if ("expected" in row) {
      assert.equal(view.restaurant.intentDraft?.date, row.expected);
      assert.ok(calls.length, "The edited plan must actually reach availability");
      assert.deepEqual([...new Set(calls.map(call => call.date))], [row.expected]);
      assert.ok(calls.every(call => call.timeWindow.earliest === expectedTime && call.timeWindow.latest === expectedTime));
    } else {
      assert.equal(view.case.phase, "NEEDS_INPUT");
      assert.ok(view.restaurant.clarificationQuestion);
      assert.equal(calls.length, 0, "Ambiguous user dates must not query inherited or guessed dates");
      assert.equal(host.searches.length, searchBefore);
      assert.equal(decisions, 0, "Recorded semantic conflicts wait before restaurant decisions");
    }
  } finally { await host.close(); }
});
