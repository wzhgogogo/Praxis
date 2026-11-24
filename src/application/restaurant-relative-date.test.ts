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
] as const;

for (const row of cases) test(`Round27 SEM-1 actual message and availability: ${row.name}`, { timeout: 25_000 }, async () => {
  const initialDate = "initialDate" in row ? row.initialDate : "2026-11-25";
  const seedMessage = initialMessage.replace("2026-11-25", initialDate);
  const seed: RestaurantSemanticProposal = { ...initial, facts: initial.facts.map(fact => fact.field === "DATE"
    ? { ...fact, value: { kind: "DATE", value: initialDate, raw: initialDate } } : fact) };
  const host = await startWorkspaceFixture({ semanticProposal(message) {
    if (message === seedMessage) return structuredClone(seed);
    return { schemaVersion: "4", facts: [
      ...("date" in row ? [{ field: "DATE" as const, operation: "CORRECT" as const, value: row.date }] : []),
      { field: "TIME_WINDOW", operation: "CORRECT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "timeRaw" in row ? row.timeRaw : "晚上七点" } },
    ] };
  } });
  async function settled(caseId: string) {
    const until = Date.now() + 10_000;
    while (Date.now() < until) {
      const view = await host.application.getCase(userId, caseId);
      if (!view.restaurant.progress.active) return view;
      await delay(10);
    }
    throw new Error("Read did not settle");
  }
  try {
    host.clock.advance(Date.parse(referenceTime) - host.clock.now().valueOf());
    await host.application.store.upsertUser({ id: userId, displayName: "Fixture" }, host.clock.now().toISOString());
    const created = await host.application.createCase(userId, seedMessage, "initial");
    const prior = await settled(created.case.caseId);
    assert.equal(prior.restaurant.intentDraft?.date, initialDate);
    assert.ok(host.providerCalls.length, "Initial real composition reached the availability port");
    const before = host.providerCalls.length;
    await host.application.submitMessage({ userId, conversationId: prior.case.conversationId, expectedVersion: prior.case.taskVersion, requestId: "relative-edit", message: row.message });
    const view = await settled(created.case.caseId);
    const calls = host.providerCalls.slice(before);
    console.info(JSON.stringify({ mode: "OFFLINE_FAKE_MODEL_PGLITE", scenario: row.name, phase: view.case.phase, persistedDate: view.restaurant.intentDraft?.date, availabilityDates: [...new Set(calls.map(call => call.date))], availabilityCalls: calls.length }));
    if ("expected" in row) {
      assert.equal(view.restaurant.intentDraft?.date, row.expected);
      assert.ok(calls.length, "The edited plan must actually reach availability");
      assert.deepEqual([...new Set(calls.map(call => call.date))], [row.expected]);
      assert.ok(calls.every(call => call.timeWindow.earliest === "19:00" && call.timeWindow.latest === "19:00"));
    } else {
      assert.equal(view.case.phase, "NEEDS_INPUT");
      assert.ok(view.restaurant.clarificationQuestion);
      assert.equal(calls.length, 0, "Ambiguous user dates must not query inherited or guessed dates");
    }
  } finally { await host.close(); }
});
