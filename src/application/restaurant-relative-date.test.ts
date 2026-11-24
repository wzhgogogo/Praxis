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
  { name: "correct offset", message: "改成后天晚上七点", date: { kind: "DATE", relativeOffsetDays: 2, raw: "后天" }, expected: "2026-11-26" },
  { name: "wrong tomorrow", message: "改成后天晚上七点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "后天" }, expected: "2026-11-26" },
  { name: "wrong calendar", message: "改成后天晚上七点", date: { kind: "DATE", value: "2026-11-25", raw: "后天" }, expected: "2026-11-26" },
  { name: "omitted DATE", message: "改成后天晚上七点", expected: "2026-11-26" },
  { name: "ambiguous dates", message: "改成后天或大后天晚上七点", date: { kind: "DATE", relativeOffsetDays: 2, raw: "后天" } },
  { name: "time only carries date", message: "只改晚上七点", expected: "2026-11-25" },
  { name: "explicit calendar correction control", initialDate: "2026-11-26", message: "改成11月28日晚上七点", date: { kind: "DATE", value: "2026-11-28", raw: "11月28日" }, expected: "2026-11-28" },
  { name: "excluded relative day preserves calendar correction", initialDate: "2026-11-26", message: "后天不行，改成11月28日晚上七点", date: { kind: "DATE", value: "2026-11-28", raw: "11月28日" }, expected: "2026-11-28" },
  { name: "approximate day range with omitted DATE", initialDate: "2026-11-26", message: "大概两三天后晚上七点" },
  { name: "incidental relative mention preserves selected calendar DATE", initialDate: "2026-11-26", message: "后天我没空，改成11月28日晚上七点", date: { kind: "DATE", value: "2026-11-28", raw: "11月28日" }, expected: "2026-11-28" },
  { name: "undecided relative and calendar dates with omitted DATE", initialDate: "2026-11-26", message: "后天还是11月28日我还没定，晚上七点" },
  { name: "competing relative and calendar dates despite modeled DATE", initialDate: "2026-11-26", message: "后天还是11月28日晚上七点", date: { kind: "DATE", value: "2026-11-28", raw: "11月28日" } },
  { name: "weekday correction control", initialDate: "2026-11-26", message: "改成周六晚上七点", date: { kind: "DATE", weekday: "SATURDAY", raw: "周六" }, expected: "2026-11-28" },
  { name: "incidental relative mention preserves selected weekday DATE", initialDate: "2026-11-26", message: "后天我没空，改成周六晚上七点", date: { kind: "DATE", weekday: "SATURDAY", raw: "周六" }, expected: "2026-11-28" },
  { name: "competing relative and weekday dates despite modeled DATE", initialDate: "2026-11-26", message: "后天还是周六晚上七点", date: { kind: "DATE", weekday: "SATURDAY", raw: "周六" } },
  { name: "competing relative and weekday dates with omitted DATE", initialDate: "2026-11-26", message: "后天还是周六晚上七点" },
  { name: "competing weekday then relative date with omitted DATE", initialDate: "2026-11-26", message: "周六还是后天晚上七点" },
  { name: "tonight dining control", initialDate: "2026-11-26", message: "Make it tonight at 7 pm.", timeRaw: "7 pm", date: { kind: "DATE", relativeDay: "TODAY", raw: "tonight" }, expected: "2026-11-24" },
  { name: "tonight dining DATE with background relative day", initialDate: "2026-11-26", message: "I'm flying out tomorrow, so make dinner tonight at 7 pm.", timeRaw: "7 pm", date: { kind: "DATE", relativeDay: "TODAY", raw: "tonight" }, expected: "2026-11-24" },
  { name: "keep dining date time edit control", initialDate: "2026-11-26", message: "Keep the date, just change dinner to 7 pm.", timeRaw: "7 pm", expected: "2026-11-26" },
  { name: "keep dining date ignores background relative day", initialDate: "2026-11-26", message: "I land in Tokyo tomorrow. Keep the date, just change dinner to 7 pm.", timeRaw: "7 pm", expected: "2026-11-26" },
  { name: "omitted tonight dining DATE with background relative day", initialDate: "2026-11-26", message: "I'm flying out tomorrow, so make dinner tonight at 7 pm.", timeRaw: "7 pm", expected: "2026-11-24" },
  { name: "background relative day does not turn time edit into DATE", initialDate: "2026-11-26", message: "I land in Tokyo tomorrow. Just change dinner to 7 pm.", timeRaw: "7 pm", expected: "2026-11-26" },
  { name: "date-first background does not turn time edit into DATE", initialDate: "2026-11-26", message: "Tomorrow I arrive in Tokyo. Change dinner to 7 pm.", timeRaw: "7 pm", expected: "2026-11-26" },
  { name: "connected weekday alternatives retain comma boundary", initialDate: "2026-11-26", message: "后天，还是周六晚上七点？", date: { kind: "DATE", weekday: "SATURDAY", raw: "周六" } },
  { name: "explicit Make date edit with omitted DATE", initialDate: "2026-11-26", message: "Make it tomorrow at 7 pm.", timeRaw: "7 pm", expected: "2026-11-25" },
  { name: "explicit Move date edit with omitted DATE", initialDate: "2026-11-26", message: "Move it to tomorrow at 7 pm.", timeRaw: "7 pm", expected: "2026-11-25" },
  { name: "explicit Change date edit with omitted DATE", initialDate: "2026-11-26", message: "Change it to tomorrow at 7 pm.", timeRaw: "7 pm", expected: "2026-11-25" },
  { name: "standalone dining fragment selects tonight with omitted DATE", initialDate: "2026-11-26", message: "Dinner tonight at 7 pm.", timeRaw: "7 pm", expected: "2026-11-24" },
  { name: "unresolved relative clock dining scope needs clarification", initialDate: "2026-11-26", message: "Tomorrow at 7 pm might be my arrival time or dinner time.", timeRaw: "7 pm" },
  { name: "descriptive other dining event does not change current plan DATE", initialDate: "2026-11-26", message: "I have dinner tomorrow elsewhere. Just change this plan's dinner to 7 pm.", timeRaw: "7 pm", expected: "2026-11-26" },
  { name: "DATE CONFIRM explicit keep-date control", initialDate: "2026-11-28", message: "日期不变，只改晚上7点", timeRaw: "晚上7点", confirm: true, expected: "2026-11-28" },
  { name: "DATE CORRECT explicit correction against CONFIRM control", initialDate: "2026-11-28", message: "改成后天晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", relativeOffsetDays: 2, raw: "后天" }, expected: "2026-11-26" },
  { name: "DATE CONFIRM contradicts explicit date correction", initialDate: "2026-11-28", message: "改成后天晚上7点", timeRaw: "晚上7点", confirm: true },
  { name: "single tomorrow dining control", initialDate: "2026-11-28", message: "我们明天晚上7点去吃寿喜锅", timeRaw: "晚上7点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "明天" }, expected: "2026-11-25" },
  { name: "excluded first tomorrow does not mask selected second occurrence", initialDate: "2026-11-28", message: "不要明天中午，我们明天晚上7点去吃寿喜锅", timeRaw: "晚上7点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "明天" }, expected: "2026-11-25" },
  { name: "weekday after separate background sentence control", initialDate: "2026-11-28", message: "我明天或后天到东京。晚餐就订周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", weekday: "FRIDAY", raw: "周五" }, expected: "2026-11-27" },
  { name: "selected weekday excludes background arrival alternatives", initialDate: "2026-11-28", message: "我明天或后天到东京，但晚餐就订周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", weekday: "FRIDAY", raw: "周五" }, expected: "2026-11-27" },
  { name: "recommendation search control", message: "推荐几家涩谷寿喜锅", recommendation: true, fresh: true },
  { name: "approximate background date does not block recommendation search", message: "大概3天后到东京，推荐几家涩谷寿喜锅", recommendation: true, fresh: true },
  { name: "eight oclock time-only control", initialDate: "2026-11-28", message: "只把时间改成8点", timeRaw: "8点", expectedTime: "20:00", expected: "2026-11-28" },
  { name: "background departure range does not block time-only edit", initialDate: "2026-11-28", message: "我还有2-3天后才飞，只把时间改成8点", timeRaw: "8点", expectedTime: "20:00", expected: "2026-11-28" },
  { name: "undecided restaurant does not make selected dining date uncertain", initialDate: "2026-11-26", message: "I haven't decided on a restaurant for dinner tomorrow. Make it 7 pm.", timeRaw: "7 pm", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" }, expected: "2026-11-25" },
  { name: "explicit date subject repairs omitted DATE", initialDate: "2026-11-28", message: "其余条件不变，日期改成后天晚上7点", timeRaw: "晚上7点", expected: "2026-11-26" },
  { name: "ISO correction control", initialDate: "2026-11-26", message: "把日期改到2026-11-28，晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-11-28", raw: "2026-11-28" }, expected: "2026-11-28" },
  { name: "DATE CONFIRM contradicts explicit ISO correction", initialDate: "2026-11-26", message: "把日期改到2026-11-28，晚上7点", timeRaw: "晚上7点", confirm: true },
  { name: "Friday correction control", initialDate: "2026-11-26", message: "改成周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", weekday: "FRIDAY", raw: "周五" }, expected: "2026-11-27" },
  { name: "DATE CONFIRM contradicts explicit weekday correction", initialDate: "2026-11-26", message: "改成周五晚上7点", timeRaw: "晚上7点", confirm: true },
  { name: "undecided budget does not make selected dining date uncertain", initialDate: "2026-11-26", message: "I haven't decided how much to spend on dinner tomorrow. Make it 7 pm.", timeRaw: "7 pm", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" }, expected: "2026-11-25" },
  { name: "English or the still connects competing dining dates", initialDate: "2026-11-26", message: "Dinner tomorrow or the day after tomorrow at 7 pm.", timeRaw: "7 pm", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" } },
  { name: "ISO raw owns inconsistent model calendar value", initialDate: "2026-11-26", message: "把日期改到2026-11-28，晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-11-27", raw: "2026-11-28" }, expected: "2026-11-28" },
  { name: "weekday raw owns inconsistent model weekday value", initialDate: "2026-11-26", message: "改成周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", weekday: "SATURDAY", raw: "周五" }, expected: "2026-11-27" },
  { name: "timed dinner occurrence beats same raw in background alternatives", initialDate: "2026-11-26", message: "我朋友明天或后天到东京，不过我自己的晚餐就订明天晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "明天" }, expected: "2026-11-25" },
  { name: "fixed dinner before background alternatives is not a last-occurrence rule", initialDate: "2026-11-26", message: "我自己的晚餐就订明天晚上7点，我朋友明天或后天到东京", timeRaw: "晚上7点", date: { kind: "DATE", relativeDay: "TOMORROW", raw: "明天" }, expected: "2026-11-25" },
  { name: "structured date editor target rejects DATE CONFIRM", initialDate: "2026-11-26", message: "Change Thu, Nov 26 to 2026-11-28", confirm: true, noTime: true },
  { name: "qualified next week is never reduced to nearest Friday", initialDate: "2026-11-26", message: "改成下周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-12-04", raw: "下周五" }, expected: "2026-12-04" },
  { name: "wrong calendar week must clarify without availability", initialDate: "2026-11-26", message: "改成下周五晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-11-27", raw: "下周五" } },
  { name: "past this Friday never rolls into next week", referenceTime: "2026-11-28T10:00:00+09:00", initialDate: "2026-12-01", message: "Make it this Friday at 7 pm.", timeRaw: "7 pm", date: { kind: "DATE", weekday: "FRIDAY", raw: "this Friday" } },
  { name: "structured date editor omission cannot silently retain old date", initialDate: "2026-11-26", message: "Change Thu, Nov 26 to 2026-11-28", noTime: true },
  { name: "full Chinese calendar raw owns inconsistent model date", initialDate: "2026-11-26", message: "把日期改到2026年11月28日，晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-11-27", raw: "2026年11月28日" }, expected: "2026-11-28" },
  { name: "date confirmation without any edit remains a no-op", initialDate: "2026-11-26", message: "日期不变", confirm: true, noTime: true, unchanged: true },
  { name: "ordinary missing area still reaches ASK_USER", initialDate: "2026-11-26", message: "Find a table for two on 2026-11-26 at 18:00", ordinaryMissing: true, fresh: true },
  { name: "structured target rejects fabricated model raw and value", initialDate: "2026-11-26", message: "Change Thu, Nov 26 to 2026-11-28", noTime: true, expectedTime: "18:00", date: { kind: "DATE", value: "2026-11-27", raw: "2026-11-27" }, expected: "2026-11-28" },
  { name: "explicit ISO target rejects fabricated model raw and value", initialDate: "2026-11-26", message: "改成2026-11-28晚上7点", timeRaw: "晚上7点", date: { kind: "DATE", value: "2026-11-27", raw: "2026-11-27" }, expected: "2026-11-28" },
  { name: "structured ISO raw control preserves existing clock", initialDate: "2026-11-26", message: "Change Thu, Nov 26 to 2026-11-28", noTime: true, expectedTime: "18:00", date: { kind: "DATE", value: "2026-11-28", raw: "2026-11-28" }, expected: "2026-11-28" },
] as const;

for (const row of cases) test(`Round27 SEM-1 actual message and availability: ${row.name}`, { timeout: 25_000 }, async () => {
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
