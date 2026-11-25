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
const newTime = {field: "TIME_WINDOW", operation: "CORRECT", value: {kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "晚上7点"}};
const confirm = {field:"DATE",operation:"CONFIRM"};
const absolute = {field:"DATE",operation:"CORRECT",value:{kind:"DATE",value:"2026-11-28",raw:"2026-11-28"}};
const friday = {field:"DATE",operation:"CORRECT",value:{kind:"DATE",weekday:"FRIDAY",raw:"周五"}};
const tomorrow = {field:"DATE",operation:"CORRECT",value:{kind:"DATE",relativeDay:"TOMORROW",raw:"tomorrow"}};
const englishTime = {...newTime,value:{...newTime.value,raw:"7 pm"}};
const rows = [
  {name:"structured date editor ignores fabricated DATE raw",message:"Change Thu, Nov 26 to 2026-11-28",facts:[{...absolute,value:{...absolute.value,value:"2026-11-27",raw:"2026-11-27"}}],expected:"2026-11-28",allowClarify:true,expectedTime:"18:00"},
  {name:"explicit typed ISO edit ignores fabricated DATE raw",message:"改成2026-11-28晚上7点",facts:[{...absolute,value:{...absolute.value,value:"2026-11-27",raw:"2026-11-27"}},newTime],expected:"2026-11-28",allowClarify:true},
  {name:"structured date editor exact raw control",message:"Change Thu, Nov 26 to 2026-11-28",facts:[absolute],expected:"2026-11-28",expectedTime:"18:00"},

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
        if (!view.restaurant.progress.active && !host.application.activeReads.has(caseId) && !host.application.preparingHandles.has(caseId)) return view;
        await delay(10);
      }
      throw Error("Offline fixture read didn't settle");
    };
    const {case: created} = await host.application.createCase(user, baseMessage, "review-initial");
    const prior = await settled(created.caseId);
    assert.equal(prior.restaurant.intentDraft?.date, "2026-11-26");
    assert.ok(host.providerCalls.length);
    const before = host.providerCalls.length, searchBefore = host.searches.length;
    const decisionBefore = host.requests.filter(request => request.purpose === 'restaurant_agent_decide').length;
    await host.application.submitMessage({userId: user, conversationId: prior.case.conversationId, expectedVersion: prior.case.taskVersion, requestId: "review-edit", message: row.message});
    const after = await settled(created.caseId);
    const calls = host.providerCalls.slice(before);
    const dates = [...new Set(calls.map(call => call.date))];
    const times = [...new Set(calls.map(call => call.timeWindow.earliest))];
    const queriedTarget = row.expected !== null && dates.length === 1 && dates[0] === row.expected
      && times.length === 1 && times[0] === (row.expectedTime || "19:00");
    const searchCalls = host.searches.length - searchBefore;
    const decisionCalls = host.requests.filter(request => request.purpose === 'restaurant_agent_decide').length - decisionBefore;
    const clarified = after.case.phase === 'NEEDS_INPUT' && Boolean(after.restaurant.clarificationQuestion) && calls.length === 0 && searchCalls === 0 && decisionCalls === 0;
    const pass = queriedTarget || clarified && (row.expected === null || row.allowClarify === true);
    const result = {case: row.name, message: row.message, expected: row.expected,
      draftDate: after.restaurant.intentDraft?.date, phase: after.case.phase, dates, times, searchCalls, decisionCalls, pass};
    process.stdout.write(JSON.stringify(result) + "\n");
  } finally {
    await host.close();
  }
}

