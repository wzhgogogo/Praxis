import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { runBrowserReadProbe } from "../../eval/restaurant/agent-loop/browser-read-probe.js";
import { url, identity, localFixture } from "./browser-read-test-fixtures.js";

test("real browser waits for the requested page update instead of reporting stale slots", async () => {
  const runtime = localFixture(`${identity}
    <div id="availability" data-selected-date="2026-09-06" data-pax="2"><button class="time-slot" data-available="true" data-time="19:00">19:00</button></div>
    <script>setTimeout(() => { const panel = document.getElementById('availability'); panel.dataset.selectedDate='2026-09-07'; panel.innerHTML='<button class="time-slot" data-available="true" data-time="20:00">20:00</button>'; panel.dataset.ready='true'; }, 250);</script>`);
  const result = await runBrowserReadProbe(runtime, { url, readySelector: '#availability[data-ready="true"]', schedule: { date: "2026-09-07", partySize: 2 } });
  assert.equal(result.pageState, "CONTENT_OBSERVED");
  assert.ok("slotsDetected" in result);
  assert.deepEqual(result.slotsDetected, ["20:00"]);
  assert.equal(result.requestSelection, "OBSERVED_MATCH");
  assert.equal(result.controlOperation, "NOT_ATTEMPTED");
  assert.equal(result.availabilityConclusion, "NOT_ESTABLISHED");
});

test("a requested ready marker that never appears fails within the probe deadline", async () => {
  const session = await localFixture(identity).openSession({ signal: new AbortController().signal });
  try {
    await assert.rejects(runBrowserReadProbe({ openSession: async () => session }, { url, readySelector: "#never-ready", timeoutMs: 1_500 }), { code: "BROWSER_TIMEOUT" });
  } finally { await session.close(); }
});

test("generic controlled browser path completes a local read-only page task without a site-specific adapter method", async () => {
  const runtime = localFixture(`<title>Search</title><button id="show" data-praxis-read-only="true">Show results</button>
    <main id="result">Loading</main><script>document.getElementById('show').onclick=()=>{document.title='Results'; document.getElementById('result').textContent='Sushi Inase';};</script>`);
  let step = 0;
  const decision: BrowserReadActionDecisionPort = {
    async decide(input) {
      step += 1;
      if (step === 1) {
        const target = input.observation.targets.find((item) => item.label === "Show results");
        assert.ok(target, "model only receives observed target references");
        return { type: "CLICK", targetRef: target.ref, reason: "reveal read-only search results" };
      }
      return { type: "COMPLETE", reason: "results are visible for deterministic parsing" };
    },
  };
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
  const session = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal: new AbortController().signal, allowedOrigins: ["https://www.tablecheck.com"], url });
  const result = await executor.runSkill({
      taskId: "fixture:generic-browser",
      source: "TABLECHECK",
      stage: "DISCOVERY",
      session,
      signal: new AbortController().signal,
      allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Show local public search results.",
      completion: (snapshot) => ({ complete: /Sushi Inase/.test(snapshot.text), reason: "The local public result is not yet visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.snapshot.title, "Results");
    assert.match(result.snapshot.text, /Sushi Inase/);
  } finally {
    await executor.close();
  }
});

test("an observed public target-blank link switches the same session to a new page before reading its terms", async () => {
  const termsUrl = "https://www.tablecheck.com/en/fixture/terms";
  const runtime = localFixture({
    [url]: `<title>Fixture restaurant</title><a href="${termsUrl}" target="_blank">Read public cancellation terms</a>`,
    [termsUrl]: "<title>Public terms</title><main>Cancellation: free until noon. No-show fee: not stated.</main>",
  });
  let decisions = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
    async decide(input) {
      decisions += 1;
      if (decisions === 1) {
        const link = input.observation.targets.find((target) => target.label === "Read public cancellation terms");
        assert.ok(link);
        return { type: "OPEN_LINK", targetRef: link.ref, reason: "Read the observed public terms page." };
      }
      assert.equal(input.observation.url, termsUrl, "the next decision must observe the popup page, not the parent");
      return { type: "COMPLETE", reason: "Public terms are visible for deterministic source parsing." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "FACTS");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const parent = await session.snapshot();
    const result = await executor.runSkill({
      taskId: "fixture:public-popup-terms", source: "TABLECHECK", stage: "FACTS", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture Restaurant" }, hardCriteria: [] },
      objective: "Read an observed public terms page without login or booking.",
      completion: (snapshot) => ({ complete: /Cancellation: free until noon/.test(snapshot.text), reason: "The public terms page is not yet visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.snapshot.url, termsUrl);
    assert.notEqual(result.snapshot.pageId, parent.pageId, "the active page identity must change within the same session");
    assert.equal(decisions, 1, "completion runs after the post-link snapshot; no stale parent decision is allowed");
  } finally { await executor.close(); }
});

test("real DOM observation exposes an unlabelled-id role button and calendar navigation without permitting submission", async () => {
  const runtime = localFixture(`<title>Calendar</title><div role="button" tabindex="0" aria-label="Next month">›</div><main>August</main>
    <script>
      document.querySelector('[role=button]').onclick=()=>{document.body.innerHTML='<button data-date="2026-09-07" aria-label="September 7, 2026">7</button><main>September</main>'; document.querySelector('button').onclick=()=>{document.title='Availability Results'; document.body.innerHTML='<div data-selected-date="2026-09-07" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>';};};
    </script>`);
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
    async decide(input) {
      step += 1;
      if (step === 1) {
        const next = input.observation.targets.find((target) => target.role === "button" && target.label === "Next month");
        assert.ok(next);
        return { type: "CLICK", targetRef: next.ref, reason: "show the requested calendar month" };
      }
      const day = input.observation.targets.find((target) => target.value === "2026-09-07");
      assert.ok(day);
      return { type: "CLICK_AUTHORITATIVE", targetRef: day.ref, field: "DATE", reason: "select the Router-bound date" };
    },
  } });
  const session = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal: new AbortController().signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({
      taskId: "fixture:calendar", source: "TABLECHECK", stage: "AVAILABILITY", session, signal: new AbortController().signal,
      allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Select the verified date and wait for the public slot result.",
      completion: (snapshot) => ({ complete: snapshot.title === "Availability Results", reason: "The public result is not ready.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(step, 2);
  } finally { await executor.close(); }
});

test("an active language dialog blocks background calendar actions until the dialog is closed", async () => {
  const runtime = localFixture(`<title>Calendar</title>
    <button data-date="2026-09-07" aria-label="September 7, 2026">7</button>
    <dialog open aria-modal="true" aria-label="Language" style="position:fixed"><button id="continue" type="button">Continue in English</button></dialog>
    <script>
      document.getElementById('continue').onclick=()=>document.querySelector('dialog').remove();
      document.querySelector('[data-date]').onclick=()=>{document.title='Selected date'; document.body.dataset.selected='2026-09-07';};
    </script>`);
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
    async decide(input) {
      step += 1;
      if (step === 1) {
        assert.equal(input.observation.targets.some((target) => target.value === "2026-09-07"), false, "background calendar remains observed state but is not an operable target under a modal");
        const dialog = input.observation.targets.find((target) => target.label === "Continue in English");
        assert.ok(dialog);
        return { type: "CLICK", targetRef: dialog.ref, reason: "Close the observed language dialog." };
      }
      const date = input.observation.targets.find((target) => target.value === "2026-09-07");
      assert.ok(date);
      return { type: "CLICK_AUTHORITATIVE", targetRef: date.ref, field: "DATE", reason: "Select the Router-bound date after the modal closes." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({
      taskId: "fixture:modal-calendar", source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Close only the active public language dialog, then select the authoritative date.",
      completion: (snapshot) => ({ complete: snapshot.title === "Selected date", reason: "The exact date is not visibly selected.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(step, 2);
  } finally { await executor.close(); }
});

test("shared executor keeps unguarded public filters unavailable", async () => {
  const searchUrl = "https://www.tablecheck.com/en/japan/search";
  const runtime = localFixture({ [searchUrl]: `<title>Filters</title><form method="get">
    <input id="sushi" type="checkbox" aria-label="Sushi">
    <div id="minimum" role="slider" tabindex="0" aria-label="Minimum budget" aria-valuemin="0" aria-valuemax="50000" aria-valuenow="5000" aria-valuetext="JPY 5,000" style="width:100px;height:20px"></div>
    <div id="maximum" role="slider" tabindex="0" aria-label="Maximum budget" aria-valuemin="0" aria-valuemax="50000" aria-valuenow="20000" aria-valuetext="JPY 20,000" style="width:100px;height:20px"></div>
    <div id="filters" role="dialog" aria-label="Filters" data-praxis-scroll-region style="height:20px;overflow:auto"><div style="height:1000px">Long public filter details</div></div>
    <button id="update" type="button">Update filters</button><button id="reopen" type="button">Open filters</button><button id="reset" type="button">Reset filters</button><output id="result">pending</output></form>
    <script>
      const filters=document.getElementById('filters');
      filters.onscroll=()=>filters.dataset.scrolled='true';
      const result=document.getElementById('result');
      for (const id of ['minimum','maximum']) document.getElementById(id).onkeydown=(event)=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;const element=event.currentTarget;const next=Number(element.getAttribute('aria-valuenow'))+(event.key==='ArrowRight'?1000:-1000);element.setAttribute('aria-valuenow',String(next));element.setAttribute('aria-valuetext','JPY '+next.toLocaleString('en-US'));};
      document.getElementById('update').onclick=()=>{document.title='Filtered'; result.dataset.applied='sushi='+document.getElementById('sushi').checked+';minimumBudget='+document.getElementById('minimum').getAttribute('aria-valuenow')+';maximumBudget='+document.getElementById('maximum').getAttribute('aria-valuenow')+';scrolled='+Boolean(filters.dataset.scrolled); result.textContent=result.dataset.applied;};
      document.getElementById('reopen').onclick=()=>{filters.dataset.reopened='true'; result.textContent='filters reopened;'+(result.dataset.applied||'');};
      document.getElementById('reset').onclick=()=>{document.getElementById('sushi').checked=false;for(const [id,value] of [['minimum',5000],['maximum',20000]]){const element=document.getElementById(id);element.setAttribute('aria-valuenow',String(value));element.setAttribute('aria-valuetext','JPY '+value.toLocaleString('en-US'));}result.textContent=(result.dataset.applied||'')+';reopened='+Boolean(filters.dataset.reopened)+';reset=sushi:'+document.getElementById('sushi').checked+',minimum:'+document.getElementById('minimum').getAttribute('aria-valuenow')+',maximum:'+document.getElementById('maximum').getAttribute('aria-valuenow');};
    </script>` });
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12,
    // This scenario deliberately exercises eight read-only control transitions.
    // Keep the production default unchanged; the fixture needs room to observe
    // each post-condition rather than shortcutting the interaction.
    maxOperationsPerCandidate: 52,
    maxModelCallsPerCandidate: 10,
    modelDecision: {
    async decide(input) {
      step += 1;
      const find = (label: string) => {
        const target = input.observation.targets.find((item) => item.label === label);
        assert.ok(target, `expected observed ${label}`);
        return target;
      };
      if (step === 1) {
        const sushi = find("Sushi");
        assert.deepEqual(sushi.availableActions, [], "a local fixture without an installed boundary must retain the narrow action policy");
        return { type: "REQUEST_HUMAN_HELP", reason: "No installed read boundary permits public query controls." };
      }
      throw new Error("unexpected extra model decision");
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url: searchUrl });
    const result = await executor.runSkill({
      taskId: "fixture:filters", source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, hardCriteria: [] }, objective: "Read a public filtered result without booking.",
      completion: () => ({ complete: false, reason: "No guarded action should run." }),
    });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP", JSON.stringify(result));
    assert.equal(step, 1);
  } finally { await executor.close(); }
});

// Real production observation, with native and ARIA-backed slider states. No model/network.
test("slider observations follow native properties and ARIA state in both directions", async () => {
  const runtime = localFixture(`<input type="range" aria-label="Native" min="0" max="15" value="15">
    <div role="slider" aria-label="Budget upper" tabindex="0" style="width:100px;height:20px"
      aria-valuemin="0" aria-valuemax="15" aria-valuenow="10"
      onkeydown="this.setAttribute('aria-valuenow',Number(this.getAttribute('aria-valuenow'))+(event.key==='ArrowRight'?1:-1))"></div>`);
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate(url);
    for (const [label, initial] of [["Native", 15], ["Budget upper", 10]] as const) {
      for (const [key, expected] of [["ArrowLeft", initial - 1], ["ArrowRight", initial]] as const) {
        const control = (await session.observeControls!()).find(c => c.label === label)!;
        assert.deepEqual([control.min, control.max], ["0", "15"]);
        await session.press!(control.id, key);
        const after = (await session.observeControls!()).find(c => c.label === label)!;
        assert.equal(after.value, String(expected));
      }
    }
  } finally { await session.close(); }
});

// Actual strict-wire Decision -> Executor -> Chromium. An unsafe model proposal must
// not become consent even when it names a valid current observed checkbox.
test("a model cannot consent by setting an unclassified checkbox", async () => {
  const runtime = localFixture(`<title>Not accepted</title><input type="checkbox"
    aria-label="利用規約に同意する" onchange="document.title='TERMS_ACCEPTED'">`);
  let calls = 0;
  const decision = new ModelBrowserReadActionDecision({ async complete(request) {
    const context = JSON.parse(request.messages[1]!.content);
    const target = context.observation.targets.find((t: { kind: string }) => t.kind === "CHECKBOX");
    const action = ++calls === 1 && target
      ? { action: "SET_CHECKED", targetRef: target.ref, requestedState: "CHECKED" }
      : { action: "REQUEST_HUMAN_HELP", targetRef: "", requestedState: "NONE" };
    return { invocationId: "fixture-consent", provider: "FIXTURE", model: "fixture", outputText: JSON.stringify({ ...action, authoritativeField: "NONE", reason: "Page asks to agree" }), finishReason: "TOOL_CALLS", latencyMs: 1 };
  } });
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    await executor.runSkill({ taskId: "fixture:no-consent", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] },
      objective: "Read only; never accept terms", completion: () => ({ complete: false, reason: "No public result" }) });
    assert.equal((await session.snapshot()).title, "Not accepted");
    assert.equal((await session.observeControls!()).find(c => c.kind === "CHECKBOX")?.checked, false);
    assert.equal(calls, 2, "strict-wire model proposal actually reached the executor");
  } finally { await executor.close(); }
});

// Visible fixed/nested layers must exclude background and parent controls; hidden
// dialogs must not capture the registry once the active layers are dismissed.
test("nested and hidden dialogs preserve only the active layer's targets", async () => {
  const runtime = localFixture(`<button aria-label="Background">Background</button>
    <div id="outer" role="dialog" aria-modal="true" style="position:fixed;inset:10px">
      <button aria-label="Outer close" onclick="document.getElementById('outer').remove()">Outer close</button>
      <div id="inner" role="dialog" aria-modal="true" style="position:fixed;inset:30px">
        <button aria-label="Inner close" onclick="document.getElementById('inner').remove()">Inner close</button>
      </div>
    </div><div role="dialog" aria-modal="true" style="display:none"><button>Hidden</button></div>`);
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate(url);
    const controls = () => session.observeControls!();
    let observed = await controls();
    assert.equal(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true);
    assert.equal(observed.find(c => c.label === "Outer close" && c.kind === "BUTTON")?.blockedByActiveLayer, true);
    await session.click(observed.find(c => c.label === "Inner close" && c.kind === "BUTTON")!.id);
    observed = await controls();
    assert.equal(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true);
    const outer = observed.find(c => c.label === "Outer close" && c.kind === "BUTTON")!;
    assert.notEqual(outer.blockedByActiveLayer, true);
    await session.click(outer.id);
    observed = await controls();
    assert.notEqual(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true);
  } finally { await session.close(); }
});

// Production Web HTML with HTTP responses replaced. The API's current-fact field
// is the display contract; retained history must never be used as its fallback.

for (const field of ["PARTY_SIZE", "TIME"] as const) test(`C5a one choice reveals a clipped ${field} option inside its current list`, async () => {
  const expected = field === "PARTY_SIZE" ? "10 guests" : "19:00";
  const choices = field === "PARTY_SIZE" ? Array.from({ length: 12 }, (_, i) => `${i + 1} guests`) : ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
  const runtime = localFixture(`<style>#choices{height:80px;width:220px;overflow:auto}[role=option]{height:30px}</style>
    <button role="combobox" aria-label="${field}" aria-expanded="true" aria-controls="choices">${field}</button>
    <div id="choices" role="listbox">${choices.map(choice => `<div role="option" onclick="document.querySelector('button').setAttribute('aria-label','${choice}');document.querySelector('button').setAttribute('aria-expanded','false');document.querySelector('#choices').hidden=true;document.body.dataset.choice='${choice}'">${choice}</div>`).join("")}</div>`);
  let calls = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    calls++;
    const choice = input.observation.targets.find(target => target.kind === "OPTION" && target.label === expected);
    assert.ok(choice, "clipped requested option must be offered");
    assert.equal(choice.outsideViewport, true);
    assert.deepEqual(choice.availableActions, [`CHOOSE_OPTION:${field}`]);
    return { type: "CHOOSE_OPTION", targetRef: choice.ref, field, reason: "Choose the current requested option; executor owns scrolling" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
  try {
    await executor.navigate({ session, signal, source: "FIXTURE", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:clipped-choice", source: "FIXTURE", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, partySize: 10, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Select one observed query option", completion: snapshot => ({ complete: snapshot.html.includes(`data-choice="${expected}"`), reason: "Choice not observed", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.equal(result.status, "COMPLETED"); assert.equal(calls, 1);
    assert.match(result.snapshot.html, new RegExp(`data-choice="${expected}"`));
  } finally { await executor.close(); }
});

test("C5a excludes disabled, occluded and noncurrent list options", async () => {
  const runtime = localFixture(`<style>#current{position:relative;width:220px;height:150px}[role=option]{height:30px}.cover{position:absolute;left:0;top:30px;width:220px;height:30px;background:white;z-index:3}</style>
    <button role="combobox" aria-label="Guests" aria-expanded="true" aria-controls="current">Guests</button>
    <div id="current" role="listbox"><div role="option" aria-disabled="true">10 guests</div><div role="option">11 guests</div><div class="cover">Obscuring layer</div><div role="option">9 guests</div></div>
    <div id="other" role="listbox"><div role="option">12 guests</div></div>`);
  let calls = 0; let observed: unknown;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    calls++; observed = input.observation.targets;
    for (const label of ["10 guests", "11 guests", "12 guests"]) assert.equal(input.observation.targets.some(target => target.kind === "OPTION" && target.label === label), false, label);
    assert.equal(input.observation.targets.some(target => target.label === "9 guests"), true, "an unrelated enabled choice remains observed");
    return { type: "REQUEST_HUMAN_HELP", reason: "Requested choice is not actionable" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
  try {
    await executor.navigate({ session, signal, source: "FIXTURE", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:choice-boundary", source: "FIXTURE", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture" }, partySize: 10, hardCriteria: [] }, objective: "Observe safe choices", completion: () => ({ complete: false, reason: "Requested choice absent" }) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP", JSON.stringify(observed)); assert.equal(calls, 1);
  } finally { await executor.close(); }
});

