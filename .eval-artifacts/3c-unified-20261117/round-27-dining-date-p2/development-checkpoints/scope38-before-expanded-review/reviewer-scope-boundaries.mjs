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
  {name:"explicit ISO date control",message:"把日期改到2026-11-28，晚上7点",facts:[absolute,newTime],expected:"2026-11-28"},
  {name:"explicit ISO edit with contradictory CONFIRM",message:"把日期改到2026-11-28，晚上7点",facts:[confirm,newTime],expected:"2026-11-28",allowClarify:true},
  {name:"explicit weekday control",message:"改成周五晚上7点",facts:[friday,newTime],expected:"2026-11-27"},
  {name:"explicit weekday edit with contradictory CONFIRM",message:"改成周五晚上7点",facts:[confirm,newTime],expected:"2026-11-27",allowClarify:true},
  {name:"budget undecided, dining date fixed",message:"I haven't decided how much to spend on dinner tomorrow. Make it 7 pm.",facts:[tomorrow,englishTime],expected:"2026-11-25"},
  {name:"dining date genuinely undecided",message:"Dinner tomorrow or the day after tomorrow at 7 pm.",facts:[tomorrow,englishTime],expected:null},
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
    const queriedTarget = row.expected !== null && dates.length === 1 && dates[0] === row.expected
      && times.length === 1 && times[0] === "19:00";
    const clarified = after.case.phase === "NEEDS_INPUT" && calls.length === 0;
    const pass = queriedTarget || clarified && (row.expected === null || row.allowClarify === true);
    const result = {case: row.name, message: row.message, expected: row.expected,
      draftDate: after.restaurant.intentDraft?.date, phase: after.case.phase, dates, times, pass};
    process.stdout.write(JSON.stringify(result) + "\n");
  } finally {
    await host.close();
  }
}

