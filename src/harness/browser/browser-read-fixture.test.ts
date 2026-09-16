import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { CloudflareBrowserRun } from "../../infrastructure/browser/cloudflare-browser-run.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { inspectProbePage, runBrowserReadProbe } from "../../eval/restaurant/agent-loop/browser-read-probe.js";

const url = "https://www.tablecheck.com/en/fixture";
const identity = '<h1>Fixture restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a>';

// Live H003 reached observed party controls but passed dom: references as CSS selectors.
// Exercise real Executor -> runtime -> DOM for both session implementations. The model
// and network are synthetic; the resulting date/party display is the independent oracle.
for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} applies authoritative date and party through observed DOM references`, async () => {
    const runtime = localFixture(`<title>Read-only availability</title>
      <select aria-label="Party size"><option value="2">2</option><option value="10">10</option></select>
      <input aria-label="Visit date" type="date" value="2026-09-07">
      <output id="result">2026-09-07 / 2</output>
      <script>for (const el of document.querySelectorAll('select,input')) el.oninput=()=>{
        document.querySelector('output').textContent=document.querySelector('input').value+' / '+document.querySelector('select').value;
      };</script>`, runtimeKind);
    let step = 0;
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: {
      async decide(input) {
        const party = ++step === 1;
        const target = input.observation.targets.find((item) => item.label === (party ? "Party size" : "Visit date"));
        assert.ok(target);
        if (party) {
          assert.equal(target.value, "2", "the current select value is not inferred from the first option");
          assert.deepEqual(target.options, [
            { value: "2", label: "2", selected: true, disabled: false },
            { value: "10", label: "10", selected: false, disabled: false },
          ]);
        }
        return party
          ? { type: "SELECT_AUTHORITATIVE", targetRef: target.ref, field: "PARTY_SIZE", reason: "Apply the requested party." }
          : { type: "FILL_AUTHORITATIVE", targetRef: target.ref, field: "DATE", reason: "Apply the requested date." };
      },
    } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({
        taskId: "fixture:observed-inputs", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-18", partySize: 10, timeWindow: { earliest: "17:30", latest: "22:00" }, hardCriteria: [] },
        objective: "Apply the authoritative date and party size to a public availability query.",
        completion: (snapshot) => ({ complete: /2026-09-18 \/ 10/.test(snapshot.text), reason: "The complete requested parameters are not visible." }),
      });
      assert.equal(result.status, "COMPLETED", JSON.stringify(result));
      assert.match(result.snapshot.text, /2026-09-18 \/ 10/);
    } finally { await executor.close(); }
  });
}

/** Real Chromium, wholly intercepted local HTML; all other network requests are aborted. */
function localFixture(html: string | Record<string, string>, runtimeKind: "LOCAL" | "CLOUDFLARE_SESSION" = "LOCAL") {
  const pages = typeof html === "string" ? { [url]: html } : html;
  const browserType = {
    async launch(options: Parameters<typeof chromium.launch>[0]) {
      const browser = await chromium.launch(options);
      const createContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions) => {
        const context = await createContext(contextOptions);
        await context.route("**/*", (route) => {
          const body = pages[route.request().url()];
          return body === undefined
            ? route.abort()
            : route.fulfill({ contentType: body.startsWith("{") ? "application/json; charset=utf-8" : "text/html; charset=utf-8", body });
        });
        return context;
      };
      return browser;
    },
  };
  if (runtimeKind === "CLOUDFLARE_SESSION") {
    return new CloudflareBrowserRun({
      accountId: "fixture", apiToken: "fixture", engineMode: "CHROMIUM_ONLY",
      // Replace only the remote connection; exercise the production Cloudflare session on local Chromium.
      connectOverCdp: async () => {
        const browser = await browserType.launch({ headless: true });
        await browser.newContext();
        return browser;
      },
    });
  }
  return new LocalPlaywrightChromium({ browserType });
}

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

test("explicit fixture takeover changes the same page and rechecks identity", async () => {
  const runtime = localFixture(`<title>Just a moment...</title><button id="human">Continue fixture</button>
    <script>document.getElementById('human').onclick=()=>{document.title='Restaurant'; document.body.innerHTML=${JSON.stringify(identity)};};</script>`);
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate(url);
    const sessionId = session.metadata.sessionId;
    assert.equal(inspectProbePage({ url }, await session.snapshot()).pageState, "BOT_CHALLENGE");
    // This simulates a human only on the local Fixture; it never operates a website challenge.
    await session.click("#human");
    await session.waitFor("h1", 1_000);
    const result = inspectProbePage({ url, expectedCandidate: {
      restaurant: { id: "other", outletName: "Another restaurant", address: "Another address", sourceIds: { phone: "03-9999-9999" }, provenance: {} },
      matchReasons: [], warnings: [], executionConfidence: "LOW",
    } }, await session.snapshot());
    assert.equal(session.metadata.sessionId, sessionId);
    assert.equal(result.pageState, "CONTENT_OBSERVED");
    assert.ok("identity" in result);
    assert.notEqual(result.identity.confidence, "HIGH");
    assert.equal(result.availabilityConclusion, "NOT_ESTABLISHED");
  } finally { await session.close(); }
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
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: decision });
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
      completion: (snapshot) => ({ complete: /Sushi Inase/.test(snapshot.text), reason: "The local public result is not yet visible." }),
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
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: {
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
      completion: (snapshot) => ({ complete: /Cancellation: free until noon/.test(snapshot.text), reason: "The public terms page is not yet visible." }),
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
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: {
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
      completion: (snapshot) => ({ complete: snapshot.title === "Availability Results", reason: "The public result is not ready." }),
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
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: {
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
      completion: (snapshot) => ({ complete: snapshot.title === "Selected date", reason: "The exact date is not visibly selected." }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(step, 2);
  } finally { await executor.close(); }
});

test("shared executor applies, reopens, and resets permitted public filters without booking", async () => {
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
  const executor = new BrowserTaskExecutor(runtime, {
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
      if (step <= 3) {
        const sushi = find("Sushi");
        assert.equal(sushi.checked, step === 2);
        return { type: "SET_CHECKED", targetRef: sushi.ref, checked: step !== 2, reason: "Apply the observed public Sushi filter." };
      }
      if (step === 4) {
        const minimum = find("Minimum budget");
        const maximum = find("Maximum budget");
        assert.deepEqual([minimum.value, minimum.min, minimum.max, minimum.valueText], ["5000", "0", "50000", "JPY 5,000"]);
        assert.deepEqual([maximum.value, maximum.min, maximum.max, maximum.valueText], ["20000", "0", "50000", "JPY 20,000"]);
        return { type: "ADJUST_RANGE", targetRef: minimum.ref, direction: "INCREASE", reason: "Move the observed lower budget bound one displayed-currency step." };
      }
      if (step === 5) {
        const minimum = find("Minimum budget");
        assert.deepEqual([minimum.value, minimum.valueText, find("Maximum budget").valueText], ["6000", "JPY 6,000", "JPY 20,000"], "the observation must read the changed lower bound and retain the distinct upper amount");
        const region = find("Filters");
        assert.equal(region.scrollable, true);
        return { type: "SCROLL_REGION", targetRef: region.ref, direction: "DOWN", reason: "Read the next visible filter region." };
      }
      if (step === 6) {
        const update = find("Update filters");
        return { type: "CLICK", targetRef: update.ref, reason: "Apply the observed public search filters." };
      }
      if (step === 7) {
        const reopen = find("Open filters");
        return { type: "CLICK", targetRef: reopen.ref, reason: "Re-open the observed public filter panel to confirm it retained its state." };
      }
      const reset = find("Reset filters");
      return { type: "CLICK", targetRef: reset.ref, reason: "Reset the observed public filters without submitting a reservation." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url: searchUrl });
    const result = await executor.runSkill({
      taskId: "fixture:filters", source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, hardCriteria: [] }, objective: "Read a public filtered result without booking.",
      // This synthetic source explicitly defines only these controls as query filters.
      // No production source gains permission from DOM labels or this fixture.
      permitQueryControl: ({ control, snapshot }) => snapshot.url === searchUrl &&
        ((control.kind === "CHECKBOX" && control.label === "Sushi") || (control.kind === "RANGE" && control.label === "Minimum budget")),
      completion: (snapshot) => ({ complete: /sushi=true;minimumBudget=6000;maximumBudget=20000;scrolled=true;reopened=true;reset=sushi:false,minimum:5000,maximum:20000/.test(snapshot.text), reason: "The public filter update, retained panel state, and reset state are not all visibly confirmed." }),
    });
    assert.equal(result.status, "COMPLETED", JSON.stringify(result));
    assert.equal(step, 8);
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
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: decision });
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
test("Web refresh replaces commercial terms and cites the displayed fact source", async () => {
  const { LOCAL_WORKSPACE_PAGE } = await import("../../web/local-workspace-page.js");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.clock.install({ time: new Date() });
  const old = { evidenceId: "old", candidateId: "a", kind: "RESTAURANT_FACT", sourceUrl: "https://source.example/old", claims: { coursePriceYen: 7500, noShowTerms: "No-show: old rule" } };
  const current = { ...old, evidenceId: "new", sourceUrl: "https://source.example/current", claims: { coursePriceYen: 8000, cancellationTerms: "Cancellation: current rule" } };
  const discoveryOnly = { ...old, candidateId: "b", provider: "GOOGLE_PLACES", sourceUrl: "https://maps.example/b", claims: { websiteUri: "https://venue.example" } };
  let refreshed = false;
  const view = () => ({
    mode: "FIXTURE", case: { caseId: "case", title: "Compare restaurants", status: "ACTIVE", phase: "PRESENT_RESULTS", taskVersion: refreshed ? 2 : 1 },
    conversation: { id: "conversation", messages: [] }, activities: [],
    restaurant: { intentDraft: { target: { goal: "AVAILABILITY" } }, missingRequiredFields: [], candidates: [{ restaurant: { id: "a", outletName: "Cafe A", address: "Tokyo" } }, { restaurant: { id: "b", outletName: "Discovery only", address: "Tokyo" } }], presentedCandidateIds: ["a"], availability: { a: [{ dateTime: "2026-09-18T19:00:00+09:00", source: "TABLECHECK", displayExpiresAt: new Date(Date.now() + (refreshed ? 600000 : -600000)).toISOString() }] }, availabilityChecks: { a: { status: "AVAILABLE", checkedAt: new Date(Date.now() - 600000).toISOString(), displayExpiresAt: new Date(Date.now() + (refreshed ? 600000 : -600000)).toISOString() } }, readEvidence: [old, current], currentFactEvidence: refreshed ? [current, discoveryOnly] : [old, discoveryOnly] },
  });
  try {
    await page.route("**/*", async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/") return route.fulfill({ contentType: "text/html", body: LOCAL_WORKSPACE_PAGE });
      if (path.endsWith("/events")) return route.abort();
      if (path.endsWith("/refresh")) refreshed = true;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(path === "/api/cases" ? { cases: [view().case] } : path === "/api/session" ? { user: { id: "fixture" } } : { view: view() }) });
    });
    await page.goto("https://workspace.example/");
    await page.getByRole("button", { name: /Compare restaurants/ }).click();
    await page.getByText("No-show: old rule", { exact: false }).waitFor();
    assert.match(await page.locator("#artifact").innerText(), /Availability expired/);
    assert.doesNotMatch(await page.locator("#artifact").innerText(), /Evidence-grounded result/);
    await page.getByRole("button", { name: "Refresh availability" }).click();
    await page.getByText("Cancellation: current rule", { exact: false }).waitFor();
    assert.equal(await page.locator(".candidate").count(), 1, "discovery-only Google facts must not appear as an investigated result");
    const text = await page.locator(".candidate").innerText();
    assert.match(text, /8,000/);
    assert.doesNotMatch(text, /7,500|No-show: old rule/);
    assert.equal(await page.getByRole("link", { name: "Terms source" }).getAttribute("href"), current.sourceUrl);
    assert.match(text, /Evidence-grounded result/);
    await page.clock.fastForward(660_000);
    assert.match(await page.locator("#artifact").innerText(), /Availability expired/);
    assert.doesNotMatch(await page.locator("#artifact").innerText(), /Evidence-grounded result/);
  } finally { await browser.close(); }
});

// Sanitized structural fixture derived from the 2026-09-16 live Budget observation.
// Uses the source contract, registry, executor and real Chromium; no live network.
test("TableCheck Budget contract permits its slider and query Update, not consent", async () => {
  const { permitsTableCheckQueryControl } = await import("../../integrations/tablecheck/tablecheck-public-query.js");
  const searchUrl = "https://www.tablecheck.com/en/japan/search";
  const runtime = localFixture({ [searchUrl]: `<title>Budget</title><div role="dialog" aria-modal="true" aria-labelledby="heading">
    <h2 id="heading">Budget</h2><form class="Form_f1pf9bb6" onsubmit="event.preventDefault();history.replaceState({},'', '?budget_dinner_avg_min=1000');document.title='Applied';">
    <div role="slider" tabindex="0" class="rc-slider-handle rc-slider-handle-1" aria-valuemin="0" aria-valuemax="15" aria-valuenow="0" style="width:20px;height:20px" onkeydown="this.setAttribute('aria-valuenow','1');document.querySelector('output').textContent='¥1,000';"></div>
    <div role="slider" class="rc-slider-handle rc-slider-handle-2" aria-valuemin="0" aria-valuemax="15" aria-valuenow="15" style="width:20px;height:20px"></div>
    <output>¥0</output><label><input type="checkbox">利用規約に同意する</label><button type="submit">Update</button></form></div>` });
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
    if (++step === 1) return { type: "ADJUST_RANGE", targetRef: input.observation.targets.find(t => t.kind === "RANGE" && t.value === "0")!.ref, direction: "INCREASE", reason: "Public budget query" };
    return { type: "CLICK", targetRef: input.observation.targets.find(t => t.label === "Update")!.ref, reason: "Apply budget query" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ session, signal, source: "TABLECHECK", stage: "DISCOVERY", allowedOrigins: ["https://www.tablecheck.com"], url: searchUrl });
    const snapshot = await session.snapshot();
    const consent = (await session.observeControls!()).find(c => c.kind === "CHECKBOX")!;
    assert.equal(permitsTableCheckQueryControl({ control: consent, snapshot, action: "SET_CHECKED" }), false);
    const result = await executor.runSkill({ taskId: "budget-contract", session, signal, source: "TABLECHECK", stage: "DISCOVERY", allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "fixture" }, hardCriteria: [] }, objective: "Read public budget query", permitQueryControl: permitsTableCheckQueryControl, completion: page => ({ complete: page.title === "Applied" && new URL(page.url).searchParams.get("budget_dinner_avg_min") === "1000", reason: "Budget not applied" }) });
    assert.equal(result.status, "COMPLETED");
    assert.match(result.snapshot.text, /¥1,000/);
    assert.equal((await session.observeControls!()).find(c => c.kind === "CHECKBOX")?.checked, false);
  } finally { await executor.close(); }
});

// Live failure: paragraph dates were absent; numeric guest buttons were mistaken for days.
// Exercise source hints -> production Executor -> both Playwright sessions; inventory is NOT implied.
for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} selects Tabelog paragraph dates and labelled guests without treating time options as slots`, async () => {
    const { tabelogQueryControlHints, hasTabelogSelectedQuery } = await import("../../integrations/tabelog/tabelog-query-controls.js");
    const { parseTabelogAvailabilitySlots } = await import("../../integrations/tabelog/tabelog-page-parser.js");
    const sourceUrl = "https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
    const html = `<h1>Restaurant 1</h1><p>1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Phone</a><p>Reserve Guests</p><div class="p-booking-calendar" style="display:none">
      <p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="9" data-day="17">17</p>
      <p class="js-calendar-day-target is-selectable" data-year="2026" data-month="9" data-day="20">20</p>
      <button type="button" class="js-people-button is-active">2</button><button type="button" class="js-people-button">4</button>
      <input type="hidden" class="js-people-hidden-value" value="2">
      <button data-state="disabled" data-date="2026-9-16" type="button">Disabled date</button>
      <button class="js-time-button" type="button">7:00 PM</button>
      </div><a href="https://social.example/restaurant">Official website</a>
      <script>
      setTimeout(()=>document.querySelector('.p-booking-calendar').style.display='block',150);
      document.querySelectorAll('.js-calendar-day-target').forEach(el=>el.onclick=()=>{document.querySelector('.is-current').classList.remove('is-current');el.classList.add('is-current')});
      document.querySelectorAll('.js-people-button').forEach(el=>el.onclick=()=>{document.querySelector('.is-active').classList.remove('is-active');el.classList.add('is-active');document.querySelector('input').value=el.textContent});
      </script>`;
    let calls = 0;
    const searchUrl = "https://tabelog.com/en/rstLst/?sw=Restaurant%201";
    const searchHtml = `<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`;
    const executor = new BrowserTaskExecutor(localFixture({[sourceUrl]:html,[searchUrl]:searchHtml}, runtimeKind), { modelDecision: { async decide(input) {
      assert.ok(!input.observation.targets.some(target=>target.label === "Disabled date"));
      assert.ok(!input.observation.targets.some(target=>target.label.includes("7:00 PM")), "booking time buttons are evidence-only, not model actions");
      const field = ++calls === 1 ? "DATE" as const : "PARTY_SIZE" as const;
      const label = field === "DATE" ? "Date 2026-09-20" : "Guests 4";
      const target = input.observation.targets.find(target=>target.label === label);
      assert.ok(target, label);
      assert.equal(input.observation.targets.filter(target=>target.label === "Guests 4").length, 1);
      return { type: "CLICK_AUTHORITATIVE", field, targetRef: target.ref, reason: "Apply exact request" };
    } }, maxModelCallsPerCandidate: 2 });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABELOG", "AVAILABILITY");
    try {
      const { fixtureCandidates } = await import("../restaurant-fixtures.js");
      const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
      const candidate = structuredClone(fixtureCandidates[0]!);
      candidate.restaurant.sourceIds.phone = "03-1111-2222";
      const result = await new TabelogBrowserAvailability(executor).check({
        candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-20",partySize:4,
        timeWindow:{earliest:"18:30",latest:"19:30"},hardCriteria:[],
      },signal);
      const snapshot = await session.snapshot();
      assert.equal(hasTabelogSelectedQuery(snapshot,"2026-09-20",4),true);
      assert.equal(hasTabelogSelectedQuery(snapshot,"2026-09-17",2),false);
      assert.deepEqual(parseTabelogAvailabilitySlots(snapshot),{availableSlots:[],hasExplicitSlotUi:false});
      assert.equal(result.offers.length,0,"query options alone cannot establish inventory");
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode,"EXTRACTION_FAILED");
      assert.equal(calls,2,"production Adapter must reach the shared model loop");
    } finally { await executor.close(); }
  });
}

// The real guide's skeleton and disabled selected day formerly triggered a pointless model click.
// Production Adapter must wait, bind date/party/time, and return UNAVAILABLE without model inference.
test("TableCheck waits for its guide result and grounds exact-query empty availability", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const html = '<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form><button type="button" data-testid="day" data-date="2026-9-16" aria-selected="true" data-state="disabled">16</button><div data-testid="Venue Pax Select" id="pax-2"></div><div data-testid="Venue Time Select" id="time-19:00"></div><span class="skeleton"></span></form></div><script>setTimeout(()=>{document.querySelector(".skeleton").outerHTML=\'<span data-testid="Venue Unavailable Msg">We could not find a table on Sep 16th for the selected mealtime</span>\'},200)</script>';
  const searchUrl = tableCheckDiscoveryUrl(candidate);
  const executor = new BrowserTaskExecutor(localFixture({[searchUrl]:`<a href="${sourceUrl}">Restaurant 1</a>`,[sourceUrl]:html}),{modelDecision:{async decide(){assert.fail("ready explicit empty result should need no model")}}});
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-16",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"},hardCriteria:[]},new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"UNAVAILABLE",JSON.stringify(result));
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode,"NO_MATCHING_SLOT");
    assert.equal(result.offers.length,0);
  } finally { await executor.close(); }
});

// Regression from the live 4-person failure: disabled selected day is evidence,
// and ARIA combobox/options must be operable without allowing booking submission.
for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
 test(`${runtimeKind} TableCheck changes guests through a read-only ARIA combobox without repeating the selected date`, async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const html = `<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form method="post">
    <button type="button">Sep 19th</button><button type="button" data-testid="day" data-date="2026-9-19" aria-selected="true" disabled>19</button>
    <div data-testid="Venue Pax Select" id="pax-2"><input role="combobox" aria-readonly="true" aria-label="Any party size" aria-expanded="false" style="pointer-events:none" onkeydown="if(event.key==='ArrowDown')openList(this,'guests')"></div>
    <div id="guests" role="listbox" hidden><div role="option" onclick="document.querySelector('#pax-2').id='pax-4';finishChoice()">4 guests</div></div>
    <div data-testid="Venue Time Select" id="time-20:00"><input role="combobox" aria-readonly="true" aria-label="Time" aria-expanded="false" style="pointer-events:none" onkeydown="if(event.key==='ArrowDown')openList(this,'times')"></div>
    <div id="times" role="listbox" hidden><div role="option" onclick="document.getElementById('time-20:00').id='time-19:00';finishChoice()">19:00</div><div role="option" onclick="document.body.dataset.outside='changed';finishChoice()">20:00</div></div>
    <div id="result"></div><button type="submit">Book</button></form></div>
    <script>function openList(input,id){document.getElementById(id).hidden=false;input.setAttribute('aria-expanded','true')}
    function finishChoice(){document.querySelectorAll('[role=listbox]').forEach(e=>e.hidden=true);document.querySelectorAll('[role=combobox]').forEach(e=>e.setAttribute('aria-expanded','false'));const time=document.querySelector('[data-testid="Venue Time Select"]').id.slice(5);document.querySelector('#result').innerHTML='<a href="/en/shops/restaurant1/reserve?start_date=2026-09-19&pax=4&start_time='+time+'">'+time+'</a>'}</script>`;
  let calls=0;const diagnostics:string[]=[];
  const executor = new BrowserTaskExecutor(localFixture({[tableCheckDiscoveryUrl(candidate)]:`<a href="${sourceUrl}">Restaurant 1</a>`,[sourceUrl]:html},runtimeKind),{maxOperationsPerCandidate:80,onDiagnostic:d=>{if(d.event==="REJECTED"||d.event==="MODEL_ACTION")diagnostics.push(d.detail??"")},modelDecision:{async decide(input){
    calls++;
    assert.ok(!input.observation.targets.some(t=>t.label==='Sep 19th'),"selected disabled calendar day must prevent repeated date trigger clicks");
    if(calls===2 || calls>=4) assert.ok(!input.observation.targets.some(t=>t.role==='combobox'&&t.label===(calls===2?'Any party size':'Time')), 'an already open list must not invite another open action');
    const label=calls===1?'Any party size':calls===2?'4 guests':calls===3?'Time':calls===6?'19:00':'20:00';
    const target=input.observation.targets.find(t=>t.label===label&&t.role===(calls===1||calls===3?'combobox':'option'));
    assert.ok(target);assert.equal(target.kind,'BUTTON');
    return calls===1||calls===3||calls===5?{type:'CLICK',targetRef:target.ref,reason:'Open choices or test rejected out-of-window click'}:{type:'CLICK_AUTHORITATIVE',field:calls===2?'PARTY_SIZE':'TIME',targetRef:target.ref,reason:'Select observed authoritative query choice'};
  }}});
  try {
    const signal=new AbortController().signal;
    const result=await new TableCheckBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:'2026-09-19',partySize:4,timeWindow:{earliest:'18:30',latest:'19:30'},hardCriteria:[]},signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,'AVAILABLE',JSON.stringify({result,calls,diagnostics}));
    assert.equal(result.offers.length,1);assert.equal(calls,6);
    const session=await executor.acquire(signal,'TABLECHECK','AVAILABILITY');
    assert.ok(!(await session.snapshot()).html.includes('data-outside="changed"'),'neither authoritative nor generic clicks may select outside the allowed time window');
  } finally {await executor.close();}
});
}


for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} Tabelog Adapter grounds passive exact-query responses and clears them on navigation`, async () => {
    const {TabelogBrowserAvailability}=await import("../../integrations/tabelog/tabelog-browser-availability.js");
    const {fixtureCandidates}=await import("../restaurant-fixtures.js");
    const candidate=structuredClone(fixtureCandidates[0]!);candidate.restaurant.sourceIds.phone="03-1111-2222";
    const sourceUrl="https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
    const endpoint="https://tabelog.com/en/booking/calendar/find_vacancy/";
    const html=`<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><p>Reserve Guests</p>
      <div class="rstdtl-course-list js-rstdtl-course-list"><span class="rstdtl-course-list__course-title-text">Seasonal lunch course</span><p class="rstdtl-course-list__desc">Lunch only, 11:30 to 14:00.</p><del>JPY 9,000</del><span class="rstdtl-course-list__price-num">JPY<em>8,000</em><span>（Price including tax）per person</span></span><dl class="rstdtl-course-list__course-rule"><dt>Number of people</dt><dd>2 - 4</dd></dl></div>
      <div class="p-booking-calendar">
      <p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="9" data-day="17">17</p>
      <p class="js-calendar-day-target is-selectable" data-year="2026" data-month="9" data-day="20">20</p>
      <button type="button" class="js-people-button is-active">2</button><button type="button" class="js-people-button">4</button>
      <input type="hidden" class="js-people-hidden-value" value="2"></div>
      <script>function query(){fetch('/en/booking/calendar/find_vacancy/?member='+document.querySelector('input').value);fetch('/unrelated.json')}
      document.querySelectorAll('.js-calendar-day-target').forEach(el=>el.onclick=()=>{document.querySelector('.is-current').classList.remove('is-current');el.classList.add('is-current');query()});
      document.querySelectorAll('.js-people-button').forEach(el=>el.onclick=()=>{document.querySelector('.is-active').classList.remove('is-active');el.classList.add('is-active');document.querySelector('input').value=el.textContent;query()});</script>`;
    const payload=(members:number,time:string)=>JSON.stringify({base_date:{year:2026,month:9,day:20},members,selection:{0:{time,url:`/en/booking/form_course/new?rcd=13292459&member=${members}&visit_date=20260920&visit_time=${time.replace(':','')}`}}});
    const pages={ [sourceUrl]:html,"https://tabelog.com/en/rstLst/?sw=Restaurant%201":`<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`,[endpoint+"?member=2"]:payload(2,"19:00"),[endpoint+"?member=4"]:payload(4,"18:45"),"https://tabelog.com/unrelated.json":JSON.stringify({private:"must not capture"}) };
    let calls=0;
    const executor=new BrowserTaskExecutor(localFixture(pages,runtimeKind),{modelDecision:{async decide(input){const field=++calls===1?"DATE" as const:"PARTY_SIZE" as const;if(calls===2)assert.ok(!input.observation.targets.some(t=>t.label==="Date 2026-09-20"), "selected date is evidence, not a repeat action");const target=input.observation.targets.find(t=>t.label===(field==="DATE"?"Date 2026-09-20":"Guests 4"));assert.ok(target);return {type:"CLICK_AUTHORITATIVE",field,targetRef:target.ref,reason:"Exact query"}}},maxModelCallsPerCandidate:2});
    const signal=new AbortController().signal;
    try{
      const result=await new TabelogBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-20",partySize:4,timeWindow:{earliest:"18:30",latest:"19:30"},hardCriteria:[]},signal);
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"AVAILABLE",JSON.stringify(result));
      assert.equal(result.offers.length,1);assert.match(result.offers[0]!.dateTime,/T18:45/);
      const listed = result.evidence.find(item => item.kind === "RESTAURANT_FACT")?.claims;
      assert.deepEqual(listed?.listedCourseDetails, ["Seasonal lunch course — JPY 8,000 （Price including tax）per person; Number of people 2 - 4. Lunch only, 11:30 to 14:00."]);
      assert.equal(listed?.coursePriceYen, undefined, "a listed lunch course is not the dinner offer price");
      assert.equal(result.offers[0]!.price, undefined);
      const session=await executor.acquire(signal,"TABELOG","AVAILABILITY");
      const snapshot=await session.snapshot();assert.ok(snapshot.responses?.length);assert.ok(snapshot.responses.every(r=>r.url.startsWith(endpoint)));
      await session.navigate(sourceUrl);assert.deepEqual((await session.snapshot()).responses,[]);
    }finally{await executor.close()}
  });
}

test("workspace New case survives a late initial case-list response", async () => {
  const { LOCAL_WORKSPACE_PAGE } = await import('../../web/local-workspace-page.js');
  const browser = await chromium.launch({headless:true});
  let release!: () => void;
  const pending = new Promise<void>(resolve => {release = resolve});
  let oldCaseRequests = 0;
  try {
    const page = await browser.newPage();
    await page.route('https://workspace.test/**',async route => {
      const path = new URL(route.request().url()).pathname;
      if(path === '/') return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});
      if(path === '/api/cases') {
        await pending;
        return route.fulfill({json:{cases:[{caseId:'old-case',title:'Old case',status:'COMPLETED',phase:'PRESENT_RESULTS'}]}});
      }
      if(path === '/api/cases/old-case') oldCaseRequests++;
      return route.fulfill({json:{}});
    });
    await page.goto('https://workspace.test/');
    await page.locator('#workspace').waitFor({state:'visible'});
    await page.locator('#new-case').click();
    const response = page.waitForResponse(r=>r.url()==='https://workspace.test/api/cases');
    release(); await response;
    await page.locator('.case-link').waitFor();
    await page.waitForTimeout(100);
    assert.equal(oldCaseRequests,0,'a late list must not select a case after the user chose New case');
    assert.equal(await page.locator('#case-title').innerText(),'Start a case');
  } finally {release();await browser.close()}
});
