import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { startWorkspaceFixture } from '/private/tmp/praxis-3c-unified/src/harness/workspace-fixture-server.ts';

const baseMessage = "Find a table for two in Tokyo on 2026-11-26 at 18:00";
const base = {schemaVersion: "4", facts: [
  {field: "TARGET", operation: "ASSERT", value: {kind: "TARGET", goal: "AVAILABILITY", query: "dinner in Tokyo", selectionScope: "OPEN_ENDED", goalBasis: {type: "BOOKING_WORDING", reason: "Explicit table request", quotes: ["Find a table"]}}},
  {field: "DATE", operation: "ASSERT", value: {kind: "DATE", value: "2026-11-26", raw: "2026-11-26"}},
  {field: "TIME_WINDOW", operation: "ASSERT", value: {kind: "TIME_WINDOW", earliest: "18:00", latest: "18:00", raw: "18:00"}},
  {field: "PARTY_SIZE", operation: "ASSERT", value: {kind: "PARTY_SIZE", value: 2}},
  {field: "AREA", operation: "ASSERT", value: {kind: "AREA", query: "Tokyo"}},
]};
const newDate = {field: "DATE", operation: "CORRECT", value: {kind: "DATE", value: "2026-11-28", raw: "11月28日"}};
const newTime = {field: "TIME_WINDOW", operation: "CORRECT", value: {kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 pm"}};
const relativeDate = {field: "DATE", operation: "CORRECT", value: {kind: "DATE", relativeOffsetDays: 3, raw: "大后天"}};
const rows = [
 {name: "explicit date without DATE control", message: "Make it tomorrow at 7 pm.", facts: [newTime], expected: "2026-11-25"},
 {name: "explicit move with omitted DATE", message: "Move it to tomorrow at 7 pm.", facts: [newTime], expected: "2026-11-25"},
];
const ref = "2026-11-24T10:00:00+09:00";
const user = "workspace-user";
for (const row of rows) {
  const host = await startWorkspaceFixture({semanticProposal(message) {
    if (message === baseMessage) return structuredClone(base);
    assert.equal(message, row.message);
    return {schemaVersion: "4", facts: structuredClone(row.facts)};
  }});
  try {
    host.clock.advance(Date.parse(ref) - host.clock.now().valueOf());
    await host.application.store.upsertUser({id: user, displayName: "Offline review"}, host.clock.now().toISOString());
    const settled = async (caseId) => {
      const until = Date.now() + 10000;
      while (Date.now() < until) {
        const view = await host.application.getCase(user, caseId);
        if (!view.restaurant.progress.active) return view;
        await delay(10);
      }
      throw Error("Offline fixture read didn't settle");
    };
    const {case: created} = await host.application.createCase(user, baseMessage, "review-initial");
    const prior = await settled(created.caseId);
    assert.equal(prior.restaurant.intentDraft?.date, "2026-11-26");
    assert.ok(host.providerCalls.length);
    const before = host.providerCalls.length;
    await host.application.submitMessage({userId: user, conversationId: prior.case.conversationId, expectedVersion: prior.case.taskVersion, requestId: "review-edit", message: row.message});
    const after = await settled(created.caseId);
    const calls = host.providerCalls.slice(before);
    const dates = [...new Set(calls.map(call => call.date))];
    const times = [...new Set(calls.map(call => call.timeWindow.earliest))];
    const result = {case: row.name, message: row.message, expected: row.expected, draftDate: after.restaurant.intentDraft?.date, phase: after.case.phase, dates, times, pass: row.expected === null ? after.case.phase === "NEEDS_INPUT" && calls.length === 0 : dates.length === 1 && dates[0] === row.expected && times.length === 1 && times[0] === "19:00"};
    process.stdout.write(JSON.stringify(result) + "\n");
  } finally {
    await host.close();
  }
}

