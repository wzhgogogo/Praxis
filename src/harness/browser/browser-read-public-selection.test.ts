import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { url, localFixture } from "./browser-read-test-fixtures.js";

test("Chromium observes public selection, native checked values and a calendar day without a private child shape", async () => {
  const runtime = localFixture(`<fieldset><legend>Guests</legend><button class="is-active" value="1">1</button><button aria-pressed="true" value="2">2</button></fieldset>
    <fieldset><legend>Native choice</legend><input type="radio" aria-label="Native selected option" value="2" checked></fieldset>
    <div><span>People</span><button aria-pressed="true" value="3">3</button></div>
    <table><caption>Nov 2026</caption><tr><td><section><span aria-current="date">3</span></section></td></tr></table>`);
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 30_000, maxModelCallsPerCandidate: 1, maxModelCallsTotal: 1, maxOperationsPerCandidate: 12,
    modelDecision: { async decide(input) {
      const targets = input.observation.targets;
      assert.notEqual(targets.find(t => t.value === "1" && t.controlGroupLabel === "Guests")?.selected, true, "class-only state cannot suppress a legal action");
      assert.equal(targets.find(t => t.value === "2" && t.controlGroupLabel === "Guests")?.selected, true);
      assert.equal(targets.find(t => t.label === "Native selected option")?.selected, true);
      assert.equal(targets.find(t => t.value === "3" && t.controlGroupLabel === "People")?.selected, true, "a visible group label survives private marker changes");
      assert.equal(targets.find(t => t.calendarDate === "2026-11-03")?.selected, true, "day state is public ARIA, independent of p children");
      return { type: "REQUEST_HUMAN_HELP", reason: "Public selection observations checked." };
    } } });
  const signal = new AbortController().signal;
  try {
    const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
    await executor.navigate({ session, source: "FIXTURE", stage: "AVAILABILITY", signal, allowedOrigins: [new URL(url).origin], url });
    const result = await executor.runSkill({ taskId: "public-selection", source: "FIXTURE", stage: "AVAILABILITY", session, signal, allowedOrigins: [new URL(url).origin], goal: { outlet: { name: "Constructed fixture" }, date: "2026-11-03", partySize: 2, hardCriteria: [] }, objective: "Observe public selection", completion: () => ({ complete: false, reason: "Read current controls" }) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  } finally { await executor.close(); }
});
