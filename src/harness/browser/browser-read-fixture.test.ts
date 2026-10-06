import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { CloudflareBrowserRun } from "../../infrastructure/browser/cloudflare-browser-run.js";
import { PlaywrightControlRegistry } from "../../infrastructure/browser/playwright-browser-controls.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
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
        const option = input.observation.targets.find(item => item.kind === "OPTION" && item.ownerRef === target.ref && item.label === "10");
        return party
          ? { type: "CHOOSE_OPTION", targetRef: option!.ref, field: "PARTY_SIZE", reason: "Apply the requested party." }
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

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} wakes for delayed visible query state and ignores hidden state`, async () => {
    const runtime = localFixture(`<title>Query state</title>
      <button id="trigger" type="button">Trigger visible update</button><button id="apply" type="button">Apply</button><select id="party"><option value="2" selected>2</option><option value="4">4</option></select>
      <p id="noise">Still loading</p><script>
        document.querySelector('#trigger').onclick=()=>window.setTimeout(()=>document.querySelector('#noise').textContent='Unrelated page message',20);
        document.querySelector('#apply').onclick=()=>window.setTimeout(()=>{
          const party=document.querySelector('#party');party.value='4';party.disabled=true;
        },20);
      </script>`, runtimeKind);
    const session = await runtime.openSession({ signal: new AbortController().signal });
    try {
      await session.navigate(url);
      const beforeNoise = await session.snapshot();
      assert.notEqual(beforeNoise.interactiveState, undefined);
      await session.click("#trigger");
      assert.equal(await session.waitForChange!(beforeNoise, 80), true, "visible text wakes a fresh read but cannot itself accept a result");
      const beforeApply = await session.snapshot();
      assert.match(beforeApply.interactiveState ?? "", /"value":"2"/);
      assert.match(beforeApply.interactiveState ?? "", /"disabled":false/);
      await session.click("#apply");
      assert.equal(await session.waitForChange!(beforeApply, 250), true, "a delayed selected value or disabled state wakes the bounded wait");
      const after = await session.snapshot();
      assert.match(after.interactiveState ?? "", /\"value\":\"4\"/);
      assert.match(after.interactiveState ?? "", /\"disabled\":true/);
    } finally { await session.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} ignores hidden form mutations but wakes for a visible property-only control mutation`, async () => {
    const runtime = localFixture(`<title>Wait projection</title>
      <input id="analytics" type="hidden" value="before"><input id="hidden-style" value="before" style="visibility:hidden">
      <button id="apply" type="button">Apply</button><input id="consent" type="checkbox" aria-label="Observed state"><script>
        window.setTimeout(()=>{document.querySelector('#analytics').value='after';document.querySelector('#hidden-style').value='after'},20);
        document.querySelector('#apply').onclick=()=>window.setTimeout(()=>{document.querySelector('#consent').checked=true},20);
      </script>`, runtimeKind);
    const session = await runtime.openSession({ signal: new AbortController().signal });
    try {
      await session.navigate(url);
      const beforeHidden = await session.snapshot();
      assert.equal(await session.waitForChange!(beforeHidden, 80), false, "hidden analytics and visibility:hidden inputs are not query-state progress");
      const beforeChecked = await session.snapshot();
      assert.match(beforeChecked.interactiveState ?? "", /"checked":false/);
      await session.click("#apply");
      assert.equal(await session.waitForChange!(beforeChecked, 120), true, "a visible checked property mutation wakes a fresh read");
      assert.match((await session.snapshot()).interactiveState ?? "", /\"checked\":true/);
    } finally { await session.close(); }
  });
}

for (const order of ["party-first", "date-first"] as const) test(`TableCheck real Chromium Adapter completes a dynamic scrollable guest query (${order}) within 24 operations`, async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.outletName = "Fixture restaurant";
  candidate.restaurant.address = "1-1 Tokyo Fixture Street";
  candidate.restaurant.sourceIds = { tablecheck: "fixture", tablecheckNativeGuideUri: url };
  const guestOptions = Array.from({ length: 11 }, (_, index) => {
    const count = index === 10 ? "10+" : String(index + 1);
    return `<div role="option" ${count === "10" ? 'onclick="selectGuest()"' : ""}>${count} ${count === "1" ? "guest" : "guests"}</div>`;
  }).join("");
  const runtime = localFixture(`<title>TableCheck query</title>${identity}
    <style>#guests{height:170px;overflow-y:auto}#guests [role=option]{height:26px}</style>
    <div data-testid="Venue Availability"><form method="post">
    <button id="next" type="button" onclick="nextMonth()">Next month</button>
    <button id="date" type="button" data-testid="day" data-date="2026-10-2" hidden onclick="selectDate()">Friday 2</button>
    <div data-testid="Venue Pax Select" id="pax-2"><button id="party" type="button" role="combobox" aria-controls="guests" aria-expanded="false" onclick="openParty()">Any party size</button>
    <div id="guests" role="listbox" aria-label="Guest choices" hidden>${guestOptions}</div></div>
    <input id="actual-date" type="hidden" value=""><input id="actual-pax" type="hidden" value="">
    <div data-testid="Venue Time Select" id="time-19:00"></div><div id="slots"></div><output id="selected">No selected request</output>
    <button type="submit">Book</button></form></div>
    <script>let dateSelected=false,guestSelected=false;function openParty(){const list=document.querySelector('#guests');list.hidden=false;document.querySelector('#party').setAttribute('aria-expanded','true')}
    function nextMonth(){document.querySelector('#date').hidden=false;document.querySelector('#next').hidden=true}
    function selectDate(){dateSelected=true;document.querySelector('#actual-date').value='2026-10-02';document.querySelector('#date').setAttribute('aria-selected','true');maybeResult()}
    function selectGuest(){guestSelected=true;document.querySelector('#actual-pax').value='10';document.querySelector('[data-testid="Venue Pax Select"]').id='pax-10';document.querySelector('#party').textContent='10 guests';document.querySelector('#party').setAttribute('aria-expanded','false');document.querySelector('#guests').hidden=true;maybeResult()}
    function maybeResult(){if(!dateSelected||!guestSelected)return;document.querySelector('#selected').textContent='2026-10-02 / 10 guests';const slot=document.createElement('a');slot.href='/en/shops/fixture/reserve?start_date=2026-10-02&pax=10&start_time=19:00';slot.textContent='19:00';document.querySelector('#slots').append(slot)}</script>`);
  const actions: string[] = [];
  const events: import("../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const executor = new BrowserTaskExecutor(runtime, {
    maxOperationsPerCandidate: 24,
    onDiagnostic: event => events.push(event),
    modelDecision: { async decide(input) {
      const targets = input.observation.targets;
      const party = targets.find(item => item.role === "combobox" && (item.label === "Any party size" || item.label === "10 guests"));
      const next = targets.find(item => item.label === "Next month");
      const date = targets.find(item => item.label === "Friday 2");
      const list = targets.find(item => item.role === "listbox" && item.scrollable);
      const ten = targets.find(item => item.label === "10 guests" && item.kind === "OPTION");
      const tenPlus = targets.find(item => item.label === "10+ guests");
      if (tenPlus) assert.equal(tenPlus.availableActions?.includes("CHOOSE_OPTION:PARTY_SIZE"), false, "10+ is not an exact party of ten");
      const selectDate = () => ({ type: "CLICK_AUTHORITATIVE" as const, targetRef: date!.ref, field: "DATE" as const, reason: "Select exact date." });
      const openParty = () => ({ type: "CLICK" as const, targetRef: party!.ref, reason: "Open the observed party choices." });
      const partyIsTen = party?.label === "10 guests";
      const nextMonth = () => ({ type: "CLICK" as const, targetRef: next!.ref, reason: "Reveal the next observed calendar month." });
      const scrollGuests = () => ({ type: "SCROLL_REGION" as const, targetRef: list!.ref, direction: "DOWN" as const, reason: "Reveal the next observed options in this list." });
      const chooseTen = () => ({ type: "CHOOSE_OPTION" as const, targetRef: ten!.ref, field: "PARTY_SIZE" as const, reason: "Select exactly ten guests." });
      const needScroll = () => {
        assert.equal(targets.some(item => item.label === "10 guests" && item.kind === "OPTION"), false, "the exact option exists in the page but is not actionable before its owner list is scrolled");
        actions.push("SCROLL");
        return scrollGuests();
      };
      if (order === "party-first") {
        if (!partyIsTen && party && !list && !ten) { actions.push("PARTY"); return openParty(); }
        if (next) { actions.push("NEXT"); return nextMonth(); }
        if (list && !ten) return needScroll();
        if (!partyIsTen && ten) { actions.push("TEN"); return chooseTen(); }
        assert.ok(date && !date.selected, "the exact date remains actionable after the selected party is confirmed");
        actions.push("DATE");
        return selectDate();
      }
      if (next) { actions.push("NEXT"); return nextMonth(); }
      if (date && !date.selected) { actions.push("DATE"); return selectDate(); }
      if (!partyIsTen && party && !list && !ten) { actions.push("PARTY"); return openParty(); }
      if (list && !ten) return needScroll();
      assert.ok(!partyIsTen && ten, "the exact option becomes observable only after scrolling its existing owner list");
      actions.push("TEN");
      return chooseTen();
    } },
  });
  const signal = new AbortController().signal;
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-10-02", partySize: 10,
      timeWindow: { earliest: "17:30", latest: "22:00" }, hardCriteria: [],
    }, signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify({ result, actions, events }));
    assert.equal(result.offers.length, 1);
    assert.ok(actions.includes("SCROLL"));
    assert.deepEqual(actions, order === "party-first"
      ? ["PARTY", "NEXT", "SCROLL", "TEN", "DATE"]
      : ["NEXT", "DATE", "PARTY", "SCROLL", "TEN"]);
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    const finalPage = await session.snapshot();
    assert.match(finalPage.text, /2026-10-02 \/ 10 guests/);
    assert.match(finalPage.html, /id="actual-date"[^>]*value="2026-10-02"/);
    assert.match(finalPage.html, /id="actual-pax"[^>]*value="10"/);
    assert.match(finalPage.html, /data-date="2026-10-2"[^>]*aria-selected="true"/);
    assert.match(finalPage.html, /id="pax-10"/);
    assert.match(finalPage.html, /href="\/en\/shops\/fixture\/reserve\?start_date=2026-10-02&amp;pax=10&amp;start_time=19:00"/);
    assert.equal(events.some(event => event.event === "BUDGET_EXHAUSTED"), false);
    assert.ok(events.filter(event => event.event === "OPERATION_STARTED").length <= 24);
  } finally { await executor.close(); }
});

test("native Tabelog detail uses real local Chromium controls before accepting its bound vacancy response", async () => {
  const { dynamicTabelogSourcePages, date, reference } = await import("../../eval/restaurant/agent-loop/native-fixed-source-pages.js");
  const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.id = "tabelog:en/tokyo/A1304/A130401/100";
  candidate.restaurant.outletName = "Native Dynamic Tabelog 100";
  candidate.restaurant.address = "Shibuya 100, Tokyo";
  candidate.restaurant.sourceIds = {
    tabelog: "en/tokyo/A1304/A130401/100",
    tabelogNativeDetailUri: "https://tabelog.com/en/tokyo/A1304/A130401/100/",
  };
  const actions: string[] = [];
  const executor = new BrowserTaskExecutor(dynamicTabelogSourcePages(), { modelDecision: { async decide(input) {
    const dateTarget = input.observation.targets.find((target) => target.label === "Date 2026-08-19");
    const guestsTarget = input.observation.targets.find((target) => target.label === "Guests 2");
    if (dateTarget && !dateTarget.selected) {
      actions.push("DATE");
      return { type: "CLICK_AUTHORITATIVE" as const, targetRef: dateTarget.ref, field: "DATE" as const, reason: "Select the observed requested date." };
    }
    assert.ok(guestsTarget && !guestsTarget.selected, "the unselected exact party control is exposed after the date selection");
    actions.push("PARTY_SIZE");
    return { type: "CLICK_AUTHORITATIVE" as const, targetRef: guestsTarget.ref, field: "PARTY_SIZE" as const, reason: "Select the observed requested party size." };
  } } });
  const signal = new AbortController().signal;
  try {
    const read = await new TabelogBrowserAvailability(executor, () => reference.toISOString()).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date, partySize: 2,
      timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: ["omakase"],
    }, signal);
    const session = await executor.acquire(signal, "TABELOG", "AVAILABILITY");
    const page = await session.snapshot();
    assert.equal(read.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(read));
    assert.equal(read.offers.length, 1);
    assert.deepEqual(actions, ["DATE", "PARTY_SIZE"]);
    assert.equal(read.offers[0]?.dateTime, "2026-08-19T19:00:00+09:00");
    assert.match(page.html, /class="js-calendar-day-target is-selectable is-current"[^>]*data-year="2026"[^>]*data-month="8"[^>]*data-day="19"/);
    assert.match(page.html, /js-people-hidden-value" type="hidden" value="2"/);
    const vacancy = page.responses?.find((response) => response.url.includes("/en/booking/calendar/find_vacancy/"));
    assert.deepEqual(vacancy?.body, {
      base_date: { year: 2026, month: 8, day: 19 }, members: 2,
      selection: { 0: { time: "19:00", url: "/en/booking/form_course/new?rcd=100&member=2&visit_date=20260819&visit_time=1900" } },
    });
  } finally {
    await executor.close();
  }
});

for (const outcome of ["AVAILABLE", "UNAVAILABLE"] as const) {
test(`native dynamic Tabelog ${outcome} reaches formal H001 ${outcome === "AVAILABLE" ? "presentation" : "TableCheck continuation and no verified result"} with page-owned query evidence`, async () => {
  const { dynamicTabelogSourcePages, center, date, reference } = await import("../../eval/restaurant/agent-loop/native-fixed-source-pages.js");
  const { traceBrowserSession } = await import("../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js");
  const { GooglePlacesClient } = await import("../../integrations/google/google-places-client.js");
  const { GooglePlacesRestaurantSearch } = await import("../../integrations/google/google-places-restaurant-search.js");
  const { composeNativeRestaurantRead } = await import("../../integrations/restaurant-search/native-read-composition.js");
  const { LiveBrowserAvailability } = await import("../../integrations/restaurant-availability/live-browser-availability.js");
  const { createHybridReadComposition } = await import("../../eval/restaurant/agent-loop/hybrid-read-composition.js");
  const { evaluateRestaurantHybridLiveArtifact } = await import("../../eval/restaurant/agent-loop/diagnostic-evaluator.js");
  const { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } = await import("../../eval/restaurant/agent-loop/live-case-materializer.js");
  const trace: Array<{ kind: string; detail: unknown }> = [];
  const rawRuntime = dynamicTabelogSourcePages({ result: outcome });
  const runtime = { openSession: async (input: { signal: AbortSignal }) => traceBrowserSession(
    await rawRuntime.openSession(input), "TABELOG", (kind, detail) => { trace.push({ kind, detail }); return trace.length; },
  ) };
  const reply = (outputText: string, purpose: string) => ({ invocationId: purpose, provider: "FIXTURE" as const, model: "scripted-formal-browser", outputText, finishReason: "TOOL_CALLS" as const, latencyMs: 0 });
  const browserActions: string[] = [];
  let modelCalls = 0;
  let availabilityReadFirst = false;
  const model: import("../../core/model/contracts.js").ModelGateway = { async complete(request) {
    assert.ok(++modelCalls <= 50, "the formal local composition retains its total model-call ceiling");
    if (request.purpose === "restaurant_semantic_interpret") return reply(JSON.stringify({ schemaVersion: "3", facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase spot", selectionScope: "OPEN_ENDED" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: date, raw: "tonight" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", strength: "HARD", polarity: "POSITIVE" } },
    ] }), request.purpose);
    if (request.purpose === "restaurant_fact_judgment") {
      const input = JSON.parse(request.messages.find(item => item.role === "user")!.content) as { sourceDocuments: Array<{ id: string; statements: Array<{ id: string; text: string }> }> };
      const selected = input.sourceDocuments.flatMap(document => document.statements.filter(item => /omakase course/i.test(item.text)).map(item => ({ documentId: document.id, statementIds: [item.id] })))[0];
      return reply(JSON.stringify({ sourceSelections: selected ? [selected] : [], judgments: selected ? [{ criterion: "omakase", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: [selected.documentId] }] : [] }), request.purpose);
    }
    if (request.purpose === "browser_read_decide") {
      const input = JSON.parse(request.messages.find(item => item.role === "user")!.content) as { observation: { targets: Array<{ ref: string; label: string; selected?: boolean }> } };
      const dateTarget = input.observation.targets.find(target => target.label === "Date 2026-08-19" && !target.selected);
      const partyTarget = input.observation.targets.find(target => target.label === "Guests 2" && !target.selected);
      const target = dateTarget ?? partyTarget;
      assert.ok(target, "the browser model receives only the remaining observed authoritative control");
      browserActions.push(dateTarget ? "DATE" : "PARTY_SIZE");
      return reply(JSON.stringify({ action: "CLICK_AUTHORITATIVE", targetRef: target.ref, authoritativeField: dateTarget ? "DATE" : "PARTY_SIZE", requestedState: "NONE", reason: "Choose the observed requested query value." }), request.purpose);
    }
    if (request.purpose === "restaurant_agent_decide") {
      const context = (JSON.parse(request.messages.find(item => item.role === "user")!.content) as { context: {
        factInvestigableCandidateIds?: string[]; checkableCandidateIds?: string[]; presentation?: Array<{ candidateId: string; eligible: boolean }>;
        searchAvailability?: { available: boolean }; readCompletion?: { allowed: boolean };
      } }).context;
      const eligible = context.presentation?.filter(item => item.eligible).map(item => item.candidateId) ?? [];
      const action = (type: string, candidateIds: string[] = []) => ({ type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "Use current evidence" });
      // The real model legally checked availability before it requested a
      // same-source fact read. Keep that ordering here so the later fact
      // observation must retire the former availability-read fact citation.
      if (outcome === "AVAILABLE" && !availabilityReadFirst && context.checkableCandidateIds?.length) {
        availabilityReadFirst = true;
        return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds)), request.purpose);
      }
      if (context.factInvestigableCandidateIds?.length) return reply(JSON.stringify(action("INVESTIGATE_CANDIDATE_FACTS", context.factInvestigableCandidateIds)), request.purpose);
      if (context.checkableCandidateIds?.length) return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds)), request.purpose);
      if (eligible.length) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
      if (context.searchAvailability?.available) return reply(JSON.stringify(action("SEARCH_RESTAURANTS")), request.purpose);
      if (context.readCompletion?.allowed) return reply(JSON.stringify(action("END_READ")), request.purpose);
      assert.fail(`No permitted formal agent action: ${JSON.stringify(context)}`);
    }
    assert.fail(`Unexpected fixture model purpose ${request.purpose}`);
  } };
  const google = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => new Response(JSON.stringify({ places: [{ id: "shibuya", displayName: { text: "Shibuya" }, formattedAddress: "Shibuya, Tokyo", location: center, types: ["train_station"], addressComponents: [{ longText: "Tokyo", types: ["locality"] }] }] }), { status: 200 }) }), () => reference.toISOString(), 10, { maxRequests: 5 });
  const native = composeNativeRestaurantRead(google, runtime, model, undefined, undefined, undefined, () => reference.toISOString());
  const availability = new LiveBrowserAvailability(runtime, model, { now: () => reference.toISOString(), maxModelCallsTotal: 50 });
  const taskId = `native-dynamic-tabelog-formal:${outcome}`;
  const composition = createHybridReadComposition({ taskId, runId: `run:${taskId}`, clock: { now: () => reference }, model, search: native.search, facts: native.facts, availability, loop: { maxSteps: 30, timeoutMs: 300_000 } });
  const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find(item => item.id === "h001")!;
  const semantic = await composition.interpretAndDispatch({ taskId, message: String(frozen.content), referenceTime: frozen.reference_time, timezone: "Asia/Tokyo" });
  assert.equal(semantic.status, "PROPOSED");
  const loop = await composition.coordinator.run(taskId);
  const state = composition.runtime.snapshot(taskId).domainState;
  const candidateId = "tabelog:en/tokyo/A1304/A130401/100";
  assert.equal(state.availabilityChecks[candidateId]?.status, outcome, JSON.stringify(state));
  // The reducer's check is intentionally compact; the provider identity lives
  // on the accepted AVAILABILITY evidence it names, rather than on a duplicate
  // check field.
  const availabilityEvidence = state.readEvidence.find((item) => item.kind === "AVAILABILITY" && item.candidateId === candidateId);
  assert.equal(availabilityEvidence?.entityMatch?.confidence, "HIGH");
  assert.equal(state.factChecks?.[candidateId]?.status, "COMPLETED");
  const sourceFacts = state.readEvidence.filter((evidence) => evidence.candidateId === candidateId
    && evidence.kind === "RESTAURANT_FACT" && evidence.provider !== "MODEL_JUDGMENT");
  assert.ok(sourceFacts.length > 0);
  assert.ok(sourceFacts.every((evidence) => evidence.observedAt === reference.toISOString()),
    "native source facts use the controlled composition clock rather than wall time");
  assert.ok(state.candidates.find((candidate) => candidate.restaurant.id === candidateId)?.matchReasons
    .includes("Verified HARD criterion from source: omakase"));
  assert.deepEqual(browserActions, ["DATE", "PARTY_SIZE"], "request values must come from real observed DOM actions");
  const navigations = trace.filter(item => item.kind === "SESSION_CALL" && (item.detail as { method?: string }).method === "navigate")
    .map(item => (item.detail as { args: string[] }).args[0]!);
  assert.match(navigations[0]!, /^https:\/\/tabelog\.com\/en\/tokyo\/rstLst\//);
  const tableCheckSearches = navigations.filter(value => new URL(value).hostname === "www.tablecheck.com");
  if (outcome === "AVAILABLE") {
    assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify(state));
    assert.deepEqual(state.presentedResults?.candidateIds, [candidateId]);
    assert.deepEqual(tableCheckSearches, [], "the qualified first source delivers directly");
    const reads = composition.trajectories.steps.filter(step => step.actionValidation?.status === "ALLOWED"
      && (step.agentAction?.type === "CHECK_AVAILABILITY" || step.agentAction?.type === "INVESTIGATE_CANDIDATE_FACTS"));
    assert.deepEqual(reads.slice(0, 2).map(step => step.agentAction?.type), ["CHECK_AVAILABILITY", "INVESTIGATE_CANDIDATE_FACTS"]);
    const superseded = state.factChecks?.[candidateId]?.supersededEvidenceIds ?? [];
    assert.ok(superseded.some(id => id.includes("tabelog-hard-criteria")), "the later same-source fact read must retire the availability-read fact");
    const cited = new Set(state.presentedResults?.evidenceIds ?? []);
    assert.equal(superseded.some(id => cited.has(id)), false, "presentation must not revive a superseded availability-read fact");
    const currentFactIds = (state.factChecks?.[candidateId]?.evidenceIds ?? []).filter(id =>
      state.readEvidence.some(evidence => evidence.evidenceId === id && evidence.kind === "RESTAURANT_FACT"),
    );
    assert.ok(currentFactIds.length > 0 && currentFactIds.every(id => cited.has(id)), "presentation cites the latest same-source fact record");
    assert.equal(loop.status, "TERMINAL");
    const artifact = {
      schemaVersion: "1", mode: "SYNTHETIC_CONTROL", status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "h001", runId: `run:${taskId}`,
      materializedCase: frozen, semantic, finalSnapshot: composition.runtime.snapshot(taskId), trajectories: composition.trajectories.steps,
      events: composition.runtime.eventLog, loop, sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: "LOCAL_CHROMIUM_DYNAMIC_FIXED_PAGE" },
      runCeilings: { maxAutomaticBrowserMs: 300_000, maxAgentSteps: 30, maxBrowserModelCallsTotal: 50, maxModelCalls: 50 },
      resourceUsage: { elapsedMs: 1, modelCallsStarted: modelCalls, browserModelCalls: browserActions.length, agentDecisions: 0, googleRequests: { total: 1, namedPlaceResolution: 1, discovery: 0, placeDetails: 0 } },
    };
    const encoded = JSON.stringify(artifact);
    const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: "dynamic-availability-first.execution.json", sha256: createHash("sha256").update(encoded).digest("hex") });
    assert.equal(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation.findings));
  } else {
    assert.equal(state.phase, "NO_VERIFIED_RESULT", JSON.stringify(state));
    assert.equal(state.presentedResults, undefined);
    assert.equal(Object.values(state.availability).flat().length, 0);
    assert.equal(tableCheckSearches.length, 1, "Tabelog UNAVAILABLE must cause an actual second-source navigation");
    assert.equal(new URL(tableCheckSearches[0]!).pathname, "/en/japan/search");
    assert.equal(state.searchContinuation?.nativeStage, "TABLECHECK_DONE");
    assert.match(state.noVerifiedResult?.remainingGaps.join(" ") ?? "", /bounded Tabelog and TableCheck native batches/);
    const steps = composition.trajectories.steps;
    assert.equal(steps.some(step => step.agentAction?.type === "PRESENT_RESULTS"), false);
    const funnels = steps.flatMap(step => step.executionMetadata?.nativeDiscoveryFunnel ? [step.executionMetadata.nativeDiscoveryFunnel] : []);
    assert.deepEqual(funnels.map(funnel => ({ source: funnel.source, raw: funnel.rawSourceLinks,
      parsed: funnel.parsedOutlets, inspected: funnel.inspectedOutlets, accepted: funnel.accepted,
      rejected: funnel.rejected.length, deferred: funnel.deferredByBatchCap.length, exhausted: funnel.sourceExhausted })), [
      { source: "TABELOG", raw: 1, parsed: 1, inspected: 1, accepted: 1, rejected: 0, deferred: 0, exhausted: "UNKNOWN" },
      { source: "TABLECHECK", raw: 0, parsed: 0, inspected: 0, accepted: 0, rejected: 0, deferred: 0, exhausted: true },
    ]);
    assert.ok(steps.findIndex(step => step.executionMetadata?.provider === "TABLECHECK")
      > steps.findIndex(step => step.agentAction?.type === "CHECK_AVAILABILITY"), "source continuation follows the first-source availability read");
    assert.equal(steps.at(-1)?.agentAction?.type, "END_READ");
  }
  // The second-source snapshot is empty; retain the last first-source query observation as the oracle.
  const finalSnapshot = [...trace].reverse().find(item => {
    const snapshot = item.detail as { queryRegions?: unknown[]; responses?: Array<{ body?: { base_date?: unknown } }> };
    return item.kind === "SNAPSHOT" && (snapshot.queryRegions?.length ?? 0) > 0
      && snapshot.responses?.some(response => response.body?.base_date !== undefined);
  })?.detail as { queryRegions?: Array<{ markup: string }>; responses?: Array<{ body?: { base_date?: { year?: number; month?: number; day?: number }; members?: number; selection?: unknown[] } }> } | undefined;
  assert.ok(finalSnapshot?.queryRegions?.length, "the artifact-safe trace retains the provider booking region");
  assert.equal(finalSnapshot?.responses?.at(-1)?.body?.base_date?.day, 19);
  assert.equal(finalSnapshot?.responses?.at(-1)?.body?.members, 2);
  assert.match(finalSnapshot!.queryRegions![0]!.markup, /js-calendar-day-target is-selectable is-current[^>]*data-year="2026"[^>]*data-month="8"[^>]*data-day="19"/);
  assert.match(finalSnapshot!.queryRegions![0]!.markup, /js-people-button is-active[^>]*>2<\/button>/);
  if (outcome === "UNAVAILABLE") {
    const body = finalSnapshot?.responses?.at(-1)?.body;
    assert.deepEqual({ base_date: body?.base_date, members: body?.members }, {
      base_date: { year: 2026, month: 8, day: 19 }, members: 2,
    }, "empty vacancy responses still retain the final source query date and party");
    // The artifact sanitizer omits an empty selection array.  Its absence is
    // not stock proof; the provider page's explicit unavailable slot drives
    // the UNAVAILABLE outcome above.
    assert.equal("selection" in (body ?? {}), false);
  }
});
}

test("button name metadata does not replace visible time or Reserve safety label", async () => {
  const runtime = localFixture(`<button name="action" value="slot-20" type="button">20:00</button><button name="action" value="reserve" type="button">Reserve</button>`);
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
    const time = input.observation.targets.find(target => target.label === "20:00");
    const reserve = input.observation.targets.find(target => target.label === "Reserve");
    assert.ok(time?.availableActions?.includes("CLICK"));
    assert.equal(reserve?.availableActions?.includes("CLICK"), false);
    assert.equal(reserve?.rejectionReason, "WRITE_PROHIBITED");
    return { type: "REQUEST_HUMAN_HELP", reason: "Read-only label audit complete" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    await executor.runSkill({ taskId: "button-visible-label", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Audit public controls",
      completion: () => ({ complete: false, reason: "No availability" }) });
  } finally { await executor.close(); }
});

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} chooses a visible time option with an opaque native value and reads it back`, async () => {
    const runtime = localFixture(`<title>Public time query</title>
      <label for="arrival">Arrival time</label><select id="arrival" aria-label="Arrival time">
        <option value="">Choose time</option><option value="1763593200000">7:00 PM</option><option value="1763600400000">9:00 PM</option>
      </select><output id="selected">No time selected</output>
      <script>document.querySelector('select').onchange=event=>{document.body.dataset.selections=(document.body.dataset.selections||'')+event.target.value+';';document.querySelector('output').textContent=event.target.selectedOptions[0].textContent;if(event.target.value==='1763593200000'){const other=document.createElement('select');other.setAttribute('aria-label','Unrelated');document.body.prepend(other)}};</script>`, runtimeKind);
    const attempted: string[] = [];
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
      const owner = input.observation.targets.find(target => target.kind === "SELECT" && target.label === "Arrival time");
      assert.ok(owner);
      const desired = input.observation.targets.find(target => target.kind === "OPTION" && target.ownerRef === owner.ref && target.label === (attempted.length ? "7:00 PM" : "9:00 PM"));
      assert.ok(desired);
      attempted.push(desired.label);
      return { type: "CHOOSE_OPTION", targetRef: desired.ref, field: "TIME", reason: "Choose the observed arrival time." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({
        taskId: "fixture:opaque-time", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-18", partySize: 2, timeWindow: { earliest: "18:30", latest: "19:30" }, hardCriteria: [] },
        objective: "Choose a requested public query time.",
        completion: (snapshot, controls) => ({ complete: /7:00 PM/.test(snapshot.text) && controls.some(control => control.kind === "SELECT" && control.value === "1763593200000"), reason: "The requested time is not selected." }),
      });
      assert.equal(result.status, "COMPLETED");
      assert.deepEqual(attempted, ["9:00 PM", "7:00 PM"]);
      assert.equal(result.controls.find(control => control.kind === "SELECT" && control.label === "Arrival time")?.value, "1763593200000");
      // Read page effects independently of the Registry: a final correct value
      // must not conceal an earlier out-of-request selection.
      const actual = await session.snapshot();
      assert.match(actual.html, /data-selections="1763593200000;"/);
      assert.match(actual.html, /<output id="selected">7:00 PM<\/output>/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} binds a button combobox to its own listbox option through the strict browser wire`, async () => {
    const runtime = localFixture(`<button type="button" role="combobox" aria-controls="arrival-list" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('arrival-list').hidden=false">Choose time</button>
      <ul id="arrival-list" role="listbox" hidden><li role="option" onclick="document.querySelector('button').setAttribute('aria-label','7:15 PM');document.querySelector('button').setAttribute('aria-expanded','false');document.getElementById('arrival-list').hidden=true;document.querySelector('output').textContent='Selection settled'">7:15 PM</li></ul><output>Waiting</output>`, runtimeKind);
    let calls = 0;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; label: string; ownerRef?: string; availableActions?: string[] }> } };
      calls += 1;
      if (calls === 1) assert.equal(payload.observation.targets.filter(target => target.label === "Arrival time").length, 1, "button combobox is observed once");
      const target = calls === 1 ? payload.observation.targets.find(item => item.kind === "BUTTON" && item.label === "Arrival time")
        : payload.observation.targets.find(item => item.kind === "OPTION" && item.label === "7:15 PM" && item.ownerRef);
      assert.ok(target);
      assert.ok(target.availableActions?.includes(calls === 1 ? "CLICK" : "CHOOSE_OPTION:TIME"));
      return { invocationId: `fixture:button-combobox:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : "CHOOSE_OPTION", targetRef: target.ref, authoritativeField: calls === 1 ? "NONE" : "TIME", requestedState: "NONE", reason: "Choose the observed query control" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: decision });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "fixture:button-combobox", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
        objective: "Choose the observed arrival time.", completion: snapshot => ({ complete: /Selection settled/.test(snapshot.text), reason: "The choice has not settled." }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(calls, 2);
      assert.equal(result.controls.find(control => control.role === "combobox")?.label, "7:15 PM");
    } finally { await executor.close(); }
  });
}

for (const initialTime of ["17:30", "19:00"] as const) {
  test(`empty input reads its own selected display and ${initialTime === "17:30" ? "confirms a changed option" : "avoids a duplicate choice"}`, async () => {
    const runtime = localFixture(`<div data-testid="Value Container" id="other-value"><div class="fixture-singleValue">19:00</div><input role="combobox" aria-label="Other time" aria-readonly="true" aria-expanded="false" value=""></div>
      <div>Nearby time: 19:00</div>
      <div data-testid="Value Container" id="time-value"><div class="fixture-singleValue">${initialTime}</div><div><input id="time-input" role="combobox" aria-label="Time" aria-readonly="true" aria-expanded="false" value="" onkeydown="if(event.key==='ArrowDown'){this.setAttribute('aria-expanded','true');this.setAttribute('aria-controls','time-options');document.getElementById('time-options').hidden=false}"></div></div>
      <div id="time-options" role="listbox" hidden><div role="option" onclick="document.querySelector('#time-value .fixture-singleValue').textContent='19:00';document.body.dataset.selectedTime='19:00';document.getElementById('time-input').setAttribute('aria-expanded','false');document.getElementById('time-input').removeAttribute('aria-controls');document.getElementById('time-options').hidden=true">19:00</div></div>
      <script>document.body.dataset.selectedTime='${initialTime}'</script>`, "LOCAL");
    let calls = 0;
    const seenValues: Array<string | undefined> = [];
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string; value?: string; ownerRef?: string }> } };
      calls += 1;
      const time = payload.observation.targets.find(target => target.role === "combobox" && target.label === "Time");
      seenValues.push(time?.value);
      const option = payload.observation.targets.find(target => target.kind === "OPTION" && target.label === "19:00" && target.ownerRef);
      const action = calls === 1 && time?.value === "19:00" ? "COMPLETE" : calls === 1 ? "CLICK" : option ? "CHOOSE_OPTION" : "REQUEST_HUMAN_HELP";
      return { invocationId: `fixture:proxy-time:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action, targetRef: action === "CLICK" ? time?.ref : action === "CHOOSE_OPTION" ? option?.ref : "", authoritativeField: action === "CHOOSE_OPTION" ? "TIME" : "NONE", requestedState: "NONE", reason: "Use the current bound time value" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: decision });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const initialControls = await session.observeControls!();
      assert.equal(initialControls.find(control => control.role === "combobox" && control.label === "Time")?.value, initialTime);
      const result = await executor.runSkill({ taskId: `fixture:proxy-time:${initialTime}`, source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Confirm the currently selected time.", completion: snapshot => ({ complete: /data-selected-time="19:00"/.test(snapshot.html), reason: "The actual page state has not selected 19:00." }) });
      assert.equal(result.status, "COMPLETED", JSON.stringify({ seenValues, controls: result.controls.filter(control => control.role === "combobox") }));
      if (initialTime === "17:30") {
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Time")?.value, "19:00", JSON.stringify(result.controls.filter(control => control.role === "combobox")));
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Time")?.controlledListboxId, undefined);
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Other time")?.value, "19:00");
        assert.deepEqual(seenValues, ["17:30", undefined]);
        assert.equal(calls, 2);
      } else {
        assert.equal(calls, 0, "the already selected page needs no redundant model action");
        assert.deepEqual(seenValues, []);
      }
      const settled = await session.snapshot();
      assert.match(settled.html, /data-selected-time="19:00"/);
      assert.match(settled.html, /id="time-input"[^>]*value=""/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} keeps the observed option node when unrelated buttons arrive during model decision`, async () => {
    const runtime = localFixture(`<button id="arrival" type="button" role="combobox" aria-controls="choices" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('choices').hidden=false">Arrival time</button>
      <ul id="choices" role="listbox" hidden>${["17:30", "18:00", "18:30", "19:00"].map(time => `<li role="option" onclick="document.body.dataset.selections=(document.body.dataset.selections||'')+'${time};';document.getElementById('arrival').setAttribute('aria-label','${time}');document.getElementById('arrival').setAttribute('aria-expanded','false');document.getElementById('choices').hidden=true;document.querySelector('output').textContent='Selection settled'">${time}</li>`).join("")}</ul>
      <button id="shift" type="button" onclick="for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.textContent='Late page navigation '+i;document.body.prepend(b)}">Fixture layout change</button>
      <button id="style" type="button" onclick="[...document.querySelectorAll('[role=option]')].find(item=>item.textContent==='19:00').style.color='red'">Fixture style change</button><output>Waiting</output>`, runtimeKind);
    let calls = 0;
    let session!: Awaited<ReturnType<typeof runtime.openSession>>;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string }> } };
      calls += 1;
      if (calls > 2) return { invocationId: `fixture:shifted-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: "REQUEST_HUMAN_HELP", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "The selected time did not match." }) };
      const target = payload.observation.targets.find(item => calls === 1 ? item.role === "combobox" : item.kind === "OPTION" && item.label === "19:00");
      assert.ok(target);
      if (calls === 2) { await session.click("#shift"); await session.click("#style"); }
      return { invocationId: `fixture:shifted-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : "CHOOSE_OPTION", targetRef: target.ref, authoritativeField: calls === 1 ? "NONE" : "TIME", requestedState: "NONE", reason: "Choose the observed 19:00 option" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: decision });
    const signal = new AbortController().signal;
    session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "fixture:shifted-option", source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Choose the observed 19:00 time.", completion: snapshot => ({ complete: /Selection settled/.test(snapshot.text), reason: "No selected time." }) });
      assert.equal(result.controls.find(control => control.role === "combobox")?.label, "19:00");
      assert.equal(result.status, "COMPLETED");
      assert.equal(calls, 2);
      assert.match((await session.snapshot()).html, /data-selections="19:00;"/, "the page actually received only the requested selection");
    } finally { await executor.close(); }
  });
}

for (const mutation of ["role-change", "replacement", "legal-replacement"] as const) {
  test(`changed observed option ${mutation} is rejected before execution`, async () => {
    const canRecover = mutation === "legal-replacement";
    const runtime = localFixture(`<button id="arrival" type="button" role="combobox" aria-controls="choices" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('choices').hidden=false">Arrival time</button>
      <ul id="choices" role="listbox" hidden><li role="option" onclick="document.body.dataset.executed='yes';document.getElementById('arrival').setAttribute('aria-label','19:00')">19:00</li></ul>
      <button id="mutate" type="button" onclick="mutateOption()">Change control</button>
      <script>function mutateOption(){const option=document.querySelector('[role=option]');${canRecover ? "option.replaceWith(option.cloneNode(true))" : mutation === "replacement" ? "const next=document.createElement('button');next.type='submit';next.textContent='19:00';next.onclick=()=>document.body.dataset.executed='yes';option.replaceWith(next)" : "option.setAttribute('role','button');option.setAttribute('type','submit')"}}</script>`, "LOCAL");
    let calls = 0;
    const rejections: string[] = [];
    let session!: Awaited<ReturnType<typeof runtime.openSession>>;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string }> } };
      calls += 1;
      const target = payload.observation.targets.find(item => calls === 1 ? item.role === "combobox" : item.kind === "OPTION" && item.label === "19:00");
      if (calls === 2) await session.click("#mutate");
      const chooseOption = calls === 2 || (canRecover && calls === 3);
      return { invocationId: `fixture:stale-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : chooseOption ? "CHOOSE_OPTION" : "REQUEST_HUMAN_HELP", targetRef: calls === 1 || chooseOption ? target?.ref : "", authoritativeField: chooseOption ? "TIME" : "NONE", requestedState: "NONE", reason: "Use only the currently observed option" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: decision, maxModelCallsPerCandidate: 3,
      onDiagnostic: item => { if (item.event === "REJECTED") rejections.push(item.detail ?? ""); } });
    const signal = new AbortController().signal;
    session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: `fixture:stale-option:${mutation}`, source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Choose the observed 19:00 time.", completion: snapshot => ({ complete: snapshot.html.includes('data-executed="yes"'), reason: "No selected time." }) });
      assert.equal(result.status, canRecover ? "COMPLETED" : "REQUESTED_HUMAN_HELP");
      assert.equal(calls, 3);
      assert.ok(rejections.some(detail => detail.includes("Observed target changed or detached")), "the old observed node is rejected before a fresh decision");
      if (canRecover) {
        assert.match(result.snapshot.html, /data-executed="yes"/);
        assert.equal(result.controls.find(control => control.role === "combobox")?.label, "19:00");
      } else assert.doesNotMatch(result.snapshot.html, /data-executed="yes"/);
    } finally { await executor.close(); }
  });
}

test("a visible option from another listbox cannot be claimed by the expanded combobox", async () => {
  const runtime = localFixture(`<input role="combobox" aria-readonly="true" aria-controls="expected" aria-expanded="true" aria-label="Arrival time">
    <div id="expected" role="listbox"><div role="option">6:00 PM</div></div>
    <div id="unrelated" role="listbox"><div role="option" onclick="document.body.dataset.foreign='clicked'">7:00 PM</div></div>`);
  const diagnostics: string[] = [];
  let calls = 0;
  const executor = new BrowserTaskExecutor(runtime, { onDiagnostic: item => { if (item.event === "REJECTED") diagnostics.push(item.detail ?? ""); }, modelDecision: {
    async decide(input) {
      if (++calls > 1) return { type: "REQUEST_HUMAN_HELP", reason: "No bound option remains." };
      const foreign = input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM");
      assert.ok(foreign);
      assert.equal(foreign.ownerRef, undefined);
      return { type: "CHOOSE_OPTION", targetRef: foreign.ref, field: "TIME", reason: "Try the visible option." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:wrong-owner", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Select a bound public query time.", completion: () => ({ complete: false, reason: "No selection confirmed." }) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
    assert.ok(diagnostics.some(detail => detail.includes("no observed parent combobox")));
    assert.doesNotMatch(result.snapshot.html, /data-foreign="clicked"/);
  } finally { await executor.close(); }
});

for (const variant of ["disabled", "unchanged", "complete"] as const) {
  test(`native option ${variant} cannot be signed off as a selected time`, async () => {
    const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose</option><option value="opaque" ${variant === "disabled" ? "disabled" : ""}>7:00 PM</option></select><output>Waiting</output>
      <script>document.querySelector('select').onchange=event=>{ ${variant !== "disabled" ? "event.target.value='';document.querySelector('output').textContent='Inventory ready';" : ""} };</script>`);
    const diagnostics: string[] = [];
    let calls = 0;
    const executor = new BrowserTaskExecutor(runtime, { onDiagnostic: item => { if (item.event === "REJECTED" || item.detail === "OPTION_VALUE_NOT_CONFIRMED") diagnostics.push(item.detail ?? ""); }, modelDecision: {
      async decide(input) {
        if (++calls > 1) return variant === "complete"
          ? { type: "COMPLETE", reason: "The independent result changed." }
          : { type: "REQUEST_HUMAN_HELP", reason: "Selection did not persist." };
        const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM");
        assert.ok(option);
        return { type: "CHOOSE_OPTION", targetRef: option.ref, field: "TIME", reason: "Try the observed time." };
      },
    } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: `fixture:${variant}`, source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
        objective: "Select a public query time.", completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No result yet." }) });
      assert.equal(result.status, variant === "complete" ? "NO_SAFE_ACTION" : "REQUESTED_HUMAN_HELP");
      assert.ok(diagnostics.some(detail => variant === "disabled" ? detail.includes("disabled") : detail === "OPTION_VALUE_NOT_CONFIRMED"));
      assert.notEqual(result.controls.find(control => control.kind === "SELECT")?.value, "opaque");
    } finally { await executor.close(); }
  });
}

test("an asynchronously applied option can complete after a later selected-value observation", async () => {
  const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose</option><option value="opaque">7:00 PM</option></select><output>Waiting</output>
    <button id="settle" type="button" onclick="document.querySelector('select').value='opaque';document.querySelector('output').textContent='Inventory ready / 7:00 PM';document.body.dataset.settled='yes'">Fixture release</button>
    <script>document.querySelector('select').onchange=event=>{event.target.value='';document.querySelector('output').textContent='Inventory ready';};</script>`);
  let calls = 0;
  let session!: Awaited<ReturnType<typeof runtime.openSession>>;
  const executor = new BrowserTaskExecutor(runtime, { maxModelCallsPerCandidate: 2, modelDecision: { async decide(input) {
    if (++calls > 1) {
      assert.equal(input.observation.targets.find(target => target.kind === "SELECT")?.options?.find(option => option.selected)?.value, "", "inventory readiness does not confirm the selected time");
      // Release only after the pending state was observed; no wall-clock race.
      await session.click("#settle");
      return { type: "WAIT", targetRef: input.observation.targets.find(target => target.kind === "SELECT")!.ref, reason: "Wait for the selected value." };
    }
    return { type: "CHOOSE_OPTION", targetRef: input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM")!.ref, field: "TIME", reason: "Choose the observed time." };
  } } });
  const signal = new AbortController().signal;
  session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:async-option", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Observe the requested time after it settles.",
      completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No inventory result yet." }) });
    assert.ok((await session.snapshot()).html.includes('data-settled="yes"'), "completion requires actual selected-value settlement");
    assert.equal(result.status, "COMPLETED");
    assert.equal(calls, 2);
    assert.equal(result.controls.find(control => control.kind === "SELECT")?.value, "opaque");
  } finally { await executor.close(); }
});

test("an unconfirmed time choice cannot be replaced by a successful party choice", async () => {
  const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose time</option><option value="time-opaque">7:00 PM</option></select>
    <select aria-label="Party size"><option value="2">2</option><option value="4">4 guests</option></select><output>Waiting</output>
    <script>document.querySelectorAll('select')[0].onchange=event=>{event.target.value='';document.querySelector('output').textContent='Inventory ready';};</script>`);
  let calls = 0;
  const diagnostics: string[] = [];
  const executor = new BrowserTaskExecutor(runtime, { onDiagnostic: item => { if (item.event === "REJECTED") diagnostics.push(item.detail ?? ""); }, modelDecision: { async decide(input) {
    calls += 1;
    if (calls === 3) return { type: "COMPLETE", reason: "The result text changed." };
    const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === (calls === 1 ? "7:00 PM" : "4 guests"));
    assert.ok(option);
    return { type: "CHOOSE_OPTION", targetRef: option.ref, field: calls === 1 ? "TIME" : "PARTY_SIZE", reason: "Choose an observed request option." };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:cross-option", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, partySize: 4, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Confirm both requested values.", completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No result yet." }) });
    assert.equal(result.status, "NO_SAFE_ACTION");
    assert.ok(diagnostics.some(detail => detail.includes("previous option is still unconfirmed")));
    assert.equal(result.controls.find(control => control.label === "Party size")?.value, "2");
  } finally { await executor.close(); }
});

/** Real Chromium, wholly intercepted local HTML; all other network requests are aborted. */
function localFixture(html: string | Record<string, string>, runtimeKind: "LOCAL" | "CLOUDFLARE_SESSION" = "LOCAL", delayedNavigation?: { url: string; release: Promise<void>; finished(): void }) {
  const pages = typeof html === "string" ? { [url]: html } : html;
  const browserType = {
    async launch(options: Parameters<typeof chromium.launch>[0]) {
      const browser = await chromium.launch(options);
      const createContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions) => {
        const context = await createContext(contextOptions);
        await context.route("**/*", async (route) => {
          if (route.request().url() === delayedNavigation?.url) {
            await delayedNavigation.release;
            try { await route.fulfill({ contentType: "text/html; charset=utf-8", body: "<title>Late old page</title><h1>Old candidate</h1>" }); }
            catch { /* Closing the timed-out session may already have canceled the old request. */ }
            finally { delayedNavigation.finished(); }
            return;
          }
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

test("Chromium control observation discards only a handle confirmed disconnected between reads", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<button id="transient">Transient</button><button id="attached">Attached</button><button id="disabled" disabled>Disabled</button>');
    const registry = new PlaywrightControlRegistry();
    let removed = false;
    const observedPage = {
      locator(selector: string) {
        const locator = page.locator(selector);
        if (!selector.startsWith("button,")) return locator;
        return {
          elementHandles: async () => (await locator.elementHandles()).map((handle, index) => {
            if (index !== 0) return handle;
            const evaluate = handle.evaluate.bind(handle) as (...args: any[]) => Promise<unknown>;
            return new Proxy(handle, {
              get(target, property, receiver) {
                if (property === "evaluate") return async (...args: any[]) => {
                  const result = await evaluate(...args);
                  if (!removed) {
                    removed = true;
                    await page.locator("#transient").evaluate(element => element.remove());
                  }
                  return result;
                };
                const value = Reflect.get(target, property, receiver);
                return typeof value === "function" ? value.bind(target) : value;
              },
            });
          }),
        };
      },
      url: () => page.url(),
    } as Parameters<PlaywrightControlRegistry["observe"]>[0];
    const controls = await registry.observe(observedPage);
    assert.equal(removed, true);
    assert.deepEqual(controls.map(control => [control.label, control.disabled]), [["Attached", false], ["Disabled", true]]);
  } finally { await browser.close(); }
});

test("Chromium control observation preserves an attached control-read failure", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<button id="attached">Attached</button>');
    const registry = new PlaywrightControlRegistry();
    const observedPage = {
      locator(selector: string) {
        const locator = page.locator(selector);
        if (!selector.startsWith("button,")) return locator;
        return {
          elementHandles: async () => (await locator.elementHandles()).map(handle => new Proxy(handle, {
            get(target, property, receiver) {
              if (property === "isDisabled") return async () => { throw new Error("CONTROL_READ_FAILURE"); };
              const value = Reflect.get(target, property, receiver);
              return typeof value === "function" ? value.bind(target) : value;
            },
          })),
        };
      },
      url: () => page.url(),
    } as Parameters<PlaywrightControlRegistry["observe"]>[0];
    await assert.rejects(registry.observe(observedPage), /CONTROL_READ_FAILURE/);
  } finally { await browser.close(); }
});

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} projects TableCheck search wrapper as combobox and only its native input as fillable`, async () => {
    const saved = readFileSync(new URL("./fixtures/tablecheck-search-control-20260929.html", import.meta.url), "utf8");
    const runtime = localFixture(saved, runtimeKind);
    let projected = false;
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
      const wrapper = input.observation.targets.find(target => target.role === "combobox" && target.kind === "BUTTON");
      const field = input.observation.targets.find(target => target.label === "Sushi tonight for 2 in Ginza" && target.kind === "INPUT");
      assert.ok(wrapper?.availableActions?.includes("CLICK"));
      assert.equal(wrapper!.availableActions?.some(action => action.startsWith("FILL")), false);
      assert.equal(field?.availableActions?.some(action => action.startsWith("FILL")), false, "no unbound free-text model fill");
      projected = true;
      return { type: "REQUEST_HUMAN_HELP", reason: "No code-bound search text is supplied" };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await session.navigate(url);
      const controls = await session.observeControls!();
      const outer = controls.find(control => control.structure?.tag === "DIV" && control.role === "combobox");
      const inner = controls.find(control => control.structure?.tag === "INPUT" && control.structure.name === "search_text");
      assert.equal(outer?.kind, "BUTTON");
      assert.equal(inner?.kind, "INPUT");
      assert.equal(inner?.label, "Sushi tonight for 2 in Ginza");
      await assert.rejects(session.fill(outer!.id, "Sushi"));
      await session.fill(inner!.id, "Sushi");
      assert.equal((await session.observeControls!()).find(control => control.structure?.name === "search_text")?.value, "Sushi");
      await executor.runSkill({ taskId: "saved-search-control", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Inspect the search field",
        completion: () => ({ complete: false, reason: "No query result" }) });
      assert.equal(projected, true);
    } finally { await executor.close(); }
  });

  test(`${runtimeKind} completes an exact bound search suggestion without clicking its covered background control`, async () => {
    const query = "vegetarian restaurants near Central Station";
    const saved = readFileSync(new URL("./fixtures/tablecheck-search-control-20260929.html", import.meta.url), "utf8");
    // Synthetic interaction around the saved wrapper and the Oct 7 observed
    // listbox/quoted query option shape; this is not a saved-response Replay.
    const runtime = localFixture(`${saved}
      <style>[role=combobox]{height:40px}#background{position:absolute;top:60px;left:10px;width:400px;height:40px}
      [role=listbox]{position:absolute;top:50px;left:0;width:450px;height:150px;background:white;z-index:2}
      [role=option]{height:50px}</style>
      <button id="background" type="button">Find availability</button>
      <div id="search-suggestions" role="listbox" hidden>
        <div role="option" aria-selected="false" aria-label='"${query}"' id="exact">Search for: "${query}"</div>
        <div role="option" aria-selected="false">Nearby</div>
      </div><output></output><script>
      const wrapper=document.querySelector('[role=combobox]'), field=wrapper.querySelector('input'), list=document.querySelector('[role=listbox]');
      field.value=${JSON.stringify(query)};
      wrapper.onclick=()=>{wrapper.setAttribute('aria-expanded','true');list.hidden=false};
      document.querySelector('#background').onclick=()=>{document.querySelector('output').textContent='WRONG_BACKGROUND_ACTION'};
      document.querySelector('#exact').onclick=()=>{wrapper.setAttribute('aria-expanded','false');list.hidden=true;
        document.querySelector('output').innerHTML='<a href="/en/public-result">Public result for '+field.value+'</a>'};
      </script>`, runtimeKind);
    let decisions = 0;
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
      decisions++;
      const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === `"${query}"`);
      if (!option) {
        const wrapper = input.observation.targets.find(target => target.role === "combobox");
        assert.ok(wrapper?.availableActions?.includes("CLICK"));
        return { type: "CLICK", targetRef: wrapper!.ref, reason: "Open the public query suggestions." };
      }
      assert.ok(option.availableActions?.includes("CHOOSE_OPTION:RETRIEVAL"), "the exact bound retrieval option must be actionable");
      assert.equal(input.observation.targets.some(target => target.label === "Find availability"), false, "the listbox-covered background control is not an action target");
      assert.equal(input.observation.targets.find(target => target.label === "Nearby")?.availableActions?.includes("CHOOSE_OPTION:RETRIEVAL"), false, "a different suggestion cannot replace the bound query");
      assert.equal(input.observation.targets.find(target => target.label === "Search")?.availableActions?.includes("CLICK"), false, "query selection grants no general submit permission");
      if (decisions === 2) return { type: "CHOOSE_OPTION", targetRef: input.observation.targets.find(target => target.label === "Nearby")!.ref, field: "RETRIEVAL", reason: "Counterexample: attempt an unrelated suggestion." };
      assert.match(input.progress, /label conflicts with the authoritative request/);
      return { type: "CHOOSE_OPTION", targetRef: option.ref, field: "RETRIEVAL", reason: "Submit the exact observed query suggestion." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "bound-search-suggestion", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Public search" }, retrievalExpression: query, hardCriteria: [] }, objective: "Find public result links for the bound query",
        completion: snapshot => ({ complete: snapshot.text.includes(`Public result for ${query}`), reason: "No result link observed" }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(decisions, 3);
      assert.equal(result.controls.find(control => control.role === "combobox")?.value, query);
      assert.equal(result.controls.find(control => control.role === "combobox")?.expanded, false);
      assert.equal(result.snapshot.text.includes("WRONG_BACKGROUND_ACTION"), false);
    } finally { await executor.close(); }
  });

  for (const offset of [0, 1400]) test(`${runtimeKind} opens an observed covered public result at offset ${offset}`, async () => {
    const detail = "https://www.tablecheck.com/en/ginza-iwa?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.65860374437126&geo_longitude=139.74541383382513&search_text=omakase+ginza";
    const savedCard = readFileSync(new URL("./fixtures/tablecheck-ginza-card-20260929.html", import.meta.url), "utf8");
    const runtime = localFixture({
      [url]: savedCard.replace("</style>", `</style><div style="height:${offset}px"></div>`),
      [detail]: "<title>Ginza iwa</title><h1>Ginza iwa detail</h1>",
    }, runtimeKind);
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
      const link = input.observation.targets.find(target => target.label === "Ginza iwa");
      assert.ok(link?.availableActions?.includes("OPEN_LINK"));
      return { type: "OPEN_LINK", targetRef: link!.ref, reason: "Open observed public result." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "covered-link", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Ginza iwa" }, hardCriteria: [] }, objective: "Open a public result",
        completion: snapshot => ({ complete: snapshot.url === detail && snapshot.text.includes("Ginza iwa detail"), reason: "Detail not observed" }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(result.snapshot.url, detail);
    } finally { await executor.close(); }
  });
}

test("Tabelog category discovery expands observed links and removes the keyword within the same area", async () => {
  const areaRoot = "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/";
  const keywordUrl = `${areaRoot}?sw=omakase`;
  const categoryWithKeyword = `${areaRoot}sushi/?sw=omakase`;
  const categoryUrl = `${areaRoot}sushi/`;
  const runtime = localFixture({
    [keywordUrl]: `<title>Keyword results</title><h1>Shibuya restaurant search</h1>
      <h2>Search by category</h2><a class="list-sidebar__item-target" href="#" id="js-leftnavi-genre-anchor"><span class="list-sidebar__item-title">All</span></a>
      <nav id="categories" hidden><a href="${categoryWithKeyword}">Sushi</a></nav>
      <p>One keyword result</p><script>
      document.querySelector('#js-leftnavi-genre-anchor').onclick=event=>{event.preventDefault();document.querySelector('#categories').hidden=false};
      </script>`,
    [categoryWithKeyword]: `<title>Filtered category results</title><h1>Shibuya Sushi</h1>
      <p>Keyword: omakase</p><a href="${categoryUrl}">Remove keyword omakase</a><p>One keyword result</p>`,
    [categoryUrl]: `<title>Category results</title><h1>Shibuya Sushi</h1><p>Expanded category results</p>
      <a class="list-rst__rst-name-target" href="/en/tokyo/A1303/A130301/13000001/">New public restaurant</a>`,
  });
  const visited: string[] = [];
  let categoryControlActions: string[] | undefined;
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
    visited.push(input.observation.url);
    assert.deepEqual(input.goal.hardCriteria, ["omakase"], "retrieval navigation does not rewrite the HARD criterion");
    let label: string;
    if (visited.length === 1) {
      assert.equal(input.observation.targets.some(target => target.label === "Sushi"), false, "a hidden category is not an observed target");
      label = "All";
    } else if (visited.length === 2) {
      assert.equal(input.observation.url, keywordUrl, "opening category navigation keeps the current result page");
      label = "Sushi";
    } else {
      assert.equal(input.observation.url, categoryWithKeyword, "the observed category link first retains the keyword");
      label = "Remove keyword omakase";
    }
    const target = input.observation.targets.find(item => item.label === label);
    assert.ok(target);
    if (label === "All") {
      categoryControlActions = target.availableActions;
      return { type: "CLICK", targetRef: target.ref, reason: "Expand the observed Search by category control." };
    }
    assert.ok(target.availableActions?.includes("OPEN_LINK"));
    assert.equal(target.availableActions?.includes("CLICK"), false, "a category URL is still public navigation, not a same-page control");
    return { type: "OPEN_LINK", targetRef: target.ref, reason: "Follow the observed public category navigation." };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABELOG", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABELOG", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://tabelog.com"], url: keywordUrl });
    const result = await executor.runSkill({ taskId: "observed-category-discovery", source: "TABELOG", stage: "DISCOVERY", session, signal,
      allowedOrigins: ["https://tabelog.com"], goal: { outlet: { name: "omakase", address: "Shibuya" }, hardCriteria: ["omakase"] },
      objective: "Use an observed related category and remove the keyword while keeping the same area.",
      completion: snapshot => ({ complete: snapshot.url === categoryUrl && snapshot.text.includes("Expanded category results"), reason: "The current category list still needs to be observed without the keyword." }) });
    assert.deepEqual(categoryControlActions, ["CLICK"], "the fragment UI control exposes its actual click action");
    assert.equal(result.status, "COMPLETED");
    assert.deepEqual(visited, [keywordUrl, keywordUrl, categoryWithKeyword]);
    assert.equal(new URL(result.snapshot.url).pathname, new URL(categoryUrl).pathname);
    assert.equal(result.snapshot.url.startsWith(areaRoot), true);
    assert.equal(new URL(result.snapshot.url).searchParams.has("sw"), false);
    assert.equal(result.snapshot.title, "Category results");
    assert.ok(result.controls.some(control => control.kind === "LINK" && control.label === "New public restaurant"));
  } finally { await executor.close(); }
});

test("saved Tabelog calendar keeps hidden future dates and disabled guests out of ready state", async () => {
  const { tabelogQueryControlHints, tabelogQueryControlsRestricted, tabelogRequestedDateState, TABELOG_QUERY_READY_SELECTOR } = await import("../../integrations/tabelog/tabelog-query-controls.js");
  const { traceBrowserSession, safeRecord } = await import("../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js");
  const sourceUrl = "https://tabelog.com/en/tokyo/A1303/A130301/13308491/";
  const saved = readFileSync(new URL("./fixtures/tabelog-teppen-calendar-20260929.html", import.meta.url), "utf8");
  const runtime = localFixture({ [sourceUrl]: `<style>.is-hidden{display:none}</style>${saved}` });
  const session = await runtime.openSession({ signal: new AbortController().signal });
  const trace: Array<{ sequence: number; kind: string; detail: unknown }> = [];
  const observed = traceBrowserSession(session, "TABELOG", (kind, detail) => {
    const sequence = trace.length + 1;
    trace.push({ sequence, kind, detail: safeRecord(detail) });
    return sequence;
  });
  try {
    await observed.navigate(sourceUrl);
    const snapshot = await observed.snapshot();
    const controls = await observed.observeControls!(tabelogQueryControlHints(snapshot));
    assert.equal(controls.some(control => control.label.startsWith("Date ")), false);
    assert.equal(controls.filter(control => /^Guests \d+$/.test(control.label)).every(control => control.disabled), true);
    assert.equal(tabelogQueryControlsRestricted(snapshot, controls, 2), true);
    assert.equal(tabelogQueryControlsRestricted(snapshot, controls, 10), false);
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-28"), "FULL");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-29"), "PHONE_ONLY");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-30"), "CLOSED");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-10-01"), "UNOBSERVED", "hidden future month is not the current query surface");
    const snapshotRecord = trace.find(event => event.kind === "SNAPSHOT")!;
    const region = (snapshotRecord.detail as { queryRegions: Array<{ markup: string; computedVisibility: string }> }).queryRegions[0]!;
    assert.match(region.markup, /p-booking-calendar__day-num--closed">30<\/span>/);
    assert.equal(region.computedVisibility, "UNKNOWN");
    const controlsRecord = trace.find(event => event.kind === "CONTROLS")!;
    assert.equal((controlsRecord.detail as { totalObserved: number }).totalObserved, controls.length);
    assert.equal((controlsRecord.detail as { controls: unknown[] }).controls.length, controls.length);
    assert.equal((controlsRecord.detail as { snapshotSequence: number }).snapshotSequence, snapshotRecord.sequence);
    await assert.rejects(observed.waitFor(TABELOG_QUERY_READY_SELECTOR, 250));
  } finally { await session.close(); }
});

test("Tabelog Adapter consumes loading-to-restricted calendar without model action or timeout", async () => {
  const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
  const searchUrl = "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201";
  const calendarUrl = "https://tabelog.com/fixture-calendar";
  const saved = readFileSync(new URL("./fixtures/tabelog-teppen-calendar-20260929.html", import.meta.url), "utf8");
  const loading = `<style>.is-hidden{display:none}</style><h1>Restaurant 1</h1><p>1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Phone</a><div class="p-booking-calendar">Reserve Guests — Loading calendar</div>
    <script>setTimeout(async()=>{document.querySelector('.p-booking-calendar').outerHTML=await(await fetch('/fixture-calendar')).text()},150)</script>`;
  const executor = new BrowserTaskExecutor(localFixture({
    [searchUrl]: `<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`,
    [sourceUrl]: loading, [calendarUrl]: saved,
  }), { modelDecision: { async decide() { assert.fail("restricted current query must not start the model loop"); } } });
  try {
    const result = await new TabelogBrowserAvailability(executor).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-09-30", partySize: 2,
      timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [],
    }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABELOG_REQUEST_DATE_CLOSED_ON_CALENDAR");
    assert.equal(result.offers.length, 0);
  } finally { await executor.close(); }
});

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} retires a real Chromium session after a delayed failed navigation`, async () => {
    const failedUrl = "https://www.tablecheck.com/en/delayed-failure";
    let releaseOld!: () => void;
    let oldFinished!: () => void;
    const release = new Promise<void>(resolve => { releaseOld = resolve; });
    const finished = new Promise<void>(resolve => { oldFinished = resolve; });
    const runtime = localFixture({ [url]: "<title>Fresh page</title><h1>New candidate</h1>" }, runtimeKind, { url: failedUrl, release, finished: oldFinished });
    const executor = new BrowserTaskExecutor(runtime);
    const signal = new AbortController().signal;
    executor.beginCandidate("failed");
    const failedSession = await executor.acquire(signal, "TABLECHECK", "IDENTITY");
    await assert.rejects(
      executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", session: failedSession, signal, allowedOrigins: ["https://www.tablecheck.com"], url: failedUrl, timeoutMs: 30 }),
      { code: "BROWSER_RUNTIME_FAILED" },
    );
    executor.beginCandidate("next");
    const freshSession = await executor.acquire(signal, "TABLECHECK", "IDENTITY");
    try {
      assert.notEqual(freshSession, failedSession);
      await executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      assert.match((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal })).text, /New candidate/);
      releaseOld();
      await finished;
      assert.match((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal })).text, /New candidate/);
    } finally { await executor.close(); }
  });
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

// Sanitized structural fixture from the observed public reservation category
// form: the host form is POST, but the only executor action is changing an
// observed radio and reading the resulting public slot. No submit is allowed.
for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} confirms one permitted TableCheck service category and its bound result without submitting`, async () => {
    const { permitsTableCheckAvailabilityServiceCategory } = await import("../../integrations/tablecheck/tablecheck-public-query.js");
    const categoryUrl = "https://www.tablecheck.com/en/fixture/reserve/landing";
    const runtime = localFixture({ [categoryUrl]: `<title>Service category</title>
      <form id="reservation-form" class="simple_form form-horizontal reserveform" method="post"></form>
        <style>input[type=radio]{position:absolute;width:1px;height:1px;clip:rect(0 0 0 0)}</style>
        <label><input form="reservation-form" type="radio" name="reservation[service_category]" value="sushi" aria-label="Bell Sushi">Bell Sushi</label>
        <label><input form="reservation-form" type="radio" name="reservation[service_category]" value="bar" aria-label="The Bellwood" checked>The Bellwood</label>
        <button form="reservation-form" type="submit" onclick="document.title='SUBMITTED'">Reserve</button>
      <output id="inventory"><a href="/en/fixture/reserve/landing?start_date=2026-10-07&amp;num_people=2&amp;start_time=19:00&amp;service_category=bar">19:00</a></output>
      <script>document.documentElement.dataset.changes='0'; document.querySelectorAll('input[type=radio]').forEach(input=>input.onchange=()=>{
        if(!input.checked)return; document.documentElement.dataset.changes=String(Number(document.documentElement.dataset.changes)+1); document.getElementById('inventory').innerHTML=input.value==='sushi'
          ? '<a href="/en/fixture/reserve/landing?start_date=2026-10-07&amp;num_people=2&amp;start_time=19:00&amp;service_category=sushi">19:00</a>'
          : '<a href="/en/fixture/reserve/landing?start_date=2026-10-07&amp;num_people=2&amp;start_time=19:00&amp;service_category=bar">19:00</a>';
      });</script>` }, runtimeKind);
    let decisions = 0;
    const executor = new BrowserTaskExecutor(runtime, { modelDecision: { async decide(input) {
      const sushi = input.observation.targets.find(target => target.kind === "RADIO" && target.label === "Bell Sushi");
      assert.ok(sushi, "the public category radio is observed as a radio, not as a generic input");
      assert.equal(sushi.checked, false);
      decisions += 1;
      return { type: "SET_CHECKED", targetRef: sushi.ref, checked: true, reason: "Read the observed public category's availability." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ session, signal, source: "TABLECHECK", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"], url: categoryUrl });
      const before = await session.snapshot();
      const beforeControls = await session.observeControls!();
      const sushi = beforeControls.find(control => control.kind === "RADIO" && control.label === "Bell Sushi")!;
      const bar = beforeControls.find(control => control.kind === "RADIO" && control.label === "The Bellwood")!;
      assert.equal(permitsTableCheckAvailabilityServiceCategory({ control: sushi, snapshot: before, action: "SET_CHECKED" }), true);
      assert.equal(permitsTableCheckAvailabilityServiceCategory({ control: { ...sushi, structure: { ...sushi.structure!, name: "account[service_category]" } }, snapshot: before, action: "SET_CHECKED" }), false);
      assert.equal(permitsTableCheckAvailabilityServiceCategory({ control: bar, snapshot: { ...before, url: "https://www.tablecheck.com/en/account/edit" }, action: "SET_CHECKED" }), false);
      await session.setChecked!(bar.id, true);
      assert.match((await session.snapshot()).html, /data-changes="0"/, "an already selected native radio remains idempotent");
      const result = await executor.runSkill({ taskId: "service-category", session, signal, source: "TABLECHECK", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture" }, date: "2026-10-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: ["omakase"] },
        objective: "Read public service-category availability only.", permitQueryControl: permitsTableCheckAvailabilityServiceCategory,
        completion: (page, controls) => ({ complete: /service_category=sushi/.test(page.html) && controls.filter(control => control.kind === "RADIO" && control.checked).length === 1 && controls.some(control => control.kind === "RADIO" && control.label === "Bell Sushi" && control.checked), reason: "The requested category and its new public result are not both observed." }),
      });
      assert.equal(result.status, "COMPLETED", JSON.stringify(result));
      assert.equal(decisions, 1);
      assert.match(result.snapshot.html, /service_category=sushi/);
      assert.notEqual(result.snapshot.title, "SUBMITTED");
    } finally { await executor.close(); }
  });
}

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
    const searchUrl = "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201";
    const searchHtml = `<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`;
    const executor = new BrowserTaskExecutor(localFixture({[sourceUrl]:html,[searchUrl]:searchHtml}, runtimeKind), { modelDecision: { async decide(input) {
      const disabledDate = input.observation.targets.find(target=>target.label === "Disabled date");
      assert.equal(disabledDate?.disabled, true);
      assert.deepEqual(disabledDate?.availableActions, []);
      assert.equal(disabledDate?.rejectionReason, "DISABLED");
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

test("real Chromium TableCheck source observation crosses the retired 30s provider window but completes inside 45s", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const resultLink = "/en/shops/restaurant1/reserve?start_date=2026-09-16&num_people=2&start_time=19:00";
  const delayedPage = `<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form><input name="reservation[start_date]" value="2026-09-16"><select name="reservation[num_people_adult]"><option value="2" selected>2</option></select></form><span class="skeleton"></span><div id="result"></div></div><script>setTimeout(()=>{document.querySelector('.skeleton').remove();const link=document.createElement('a');link.href='${resultLink}';link.textContent='19:00';document.querySelector('#result').append(link)},100)</script>`;
  const delayedSourceObservation = (runtime: BrowserRuntime): BrowserRuntime => ({
    async openSession(input) {
      const raw = await runtime.openSession(input);
      let delayNextSourceSnapshot = false;
      let cancelDelay: (() => void) | undefined;
      const session = Object.create(raw) as BrowserSession;
      session.navigate = async (target, options) => {
        await raw.navigate(target, options);
        delayNextSourceSnapshot = target === sourceUrl;
      };
      session.snapshot = async () => {
        if (delayNextSourceSnapshot) {
          delayNextSourceSnapshot = false;
          await new Promise<void>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            const finish = () => {
              if (timer) clearTimeout(timer);
              input.signal.removeEventListener("abort", onAbort);
              cancelDelay = undefined;
            };
            const onAbort = () => {
              finish();
              reject(new Error("parent aborted delayed source observation"));
            };
            cancelDelay = () => {
              finish();
              reject(new Error("source observation closed"));
            };
            timer = setTimeout(() => {
              finish();
              resolve();
            }, 31_000);
            input.signal.addEventListener("abort", onAbort, { once: true });
          });
        }
        return raw.snapshot();
      };
      session.close = async () => {
        cancelDelay?.();
        await raw.close();
      };
      return session;
    },
  });
  const run = async (providerBudgetMs: number) => {
    const diagnostics: import("../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
    const startedAt = Date.now();
    const executor = new BrowserTaskExecutor(delayedSourceObservation(localFixture({
      [tableCheckDiscoveryUrl(candidate)]: `<a href="${sourceUrl}">Restaurant 1</a>`, [sourceUrl]: delayedPage,
    })), { maxElapsedMsPerCandidate: 60_000, maxElapsedMsPerProvider: providerBudgetMs, maxAutomaticElapsedMs: 60_000,
      onDiagnostic: diagnostic => diagnostics.push(diagnostic) });
    try {
      const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
        date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, new AbortController().signal);
      return { result, elapsedMs: Date.now() - startedAt, diagnostics };
    } finally { await executor.close(); }
  };
  const retiredWindow = await run(30_000);
  assert.equal(retiredWindow.result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN", JSON.stringify(retiredWindow.result));
  assert.ok(retiredWindow.elapsedMs >= 29_000, `the retired provider deadline must cut off the delayed source read, elapsed ${retiredWindow.elapsedMs}ms`);
  assert.ok(retiredWindow.diagnostics.some(item => item.event === "OPERATION_FAILED" && item.lifecycle.failureCode === "BROWSER_TIMEOUT"), JSON.stringify(retiredWindow.diagnostics));
  const extendedWindow = await run(45_000);
  assert.equal(extendedWindow.result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(extendedWindow.result));
  assert.ok(extendedWindow.elapsedMs >= 30_000, `the extended provider window must retain the delayed source observation, elapsed ${extendedWindow.elapsedMs}ms`);
  assert.ok(extendedWindow.diagnostics.some(item => item.event === "OPERATION_FINISHED" && item.detail === "SNAPSHOT"), JSON.stringify(extendedWindow.diagnostics));
  assert.equal(extendedWindow.result.offers.length, 1, "the current post-update slot is grounded through the production Adapter");
});

test("TableCheck handles multiple current search links and reads only the identity-bound outlet", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const searchUrl = tableCheckDiscoveryUrl(candidate);
  const query = new URL(searchUrl).searchParams.get("search_text")!;
  const correctUrl = "https://www.tablecheck.com/en/restaurant1";
  const otherUrl = "https://www.tablecheck.com/en/other-restaurant";
  const resultHtml = `<a href="${otherUrl}?search_text=${encodeURIComponent(query)}">Other Restaurant</a><a href="${correctUrl}?search_text=${encodeURIComponent(query)}">Restaurant 1</a>`;
  const correctHtml = '<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability" data-selected-date="2026-09-16" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>';
  const executor = new BrowserTaskExecutor(localFixture({
    [searchUrl]: resultHtml,
    [otherUrl]: '<h1>Other Restaurant</h1><a href="tel:03-9999-8888">Phone</a>',
    [correctUrl]: correctHtml,
  }), { modelDecision: { async decide() { assert.fail("known feasible guide requires no browser model action"); } } });
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
      date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(result));
    assert.equal(result.offers.length, 1);
  } finally { await executor.close(); }
});

test("TableCheck form waits past old inventory until a current same-outlet slot link appears", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const guide = "https://www.tablecheck.com/en/restaurant1";
  const reserve = "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-16&pax=2";
  const link = "/en/shops/restaurant1/reserve?start_date=2026-09-16&pax=2&start_time=19:00";
  const guideHtml = `<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"></div><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", "@id": guide, acceptsReservations: reserve.split("?")[0] })}</script>`;
  const formHtml = `<h1>Restaurant 1</h1><form><input name="reservation[start_date]" value="2026-09-16"><select name="reservation[num_people_adult]"><option value="2" selected>2</option></select></form><section data-availability-state="complete" data-date="2026-09-15" data-pax="4"><button class="time-slot is-available" data-time="19:00">19:00</button></section><div id="fresh"></div><script>setTimeout(()=>{const a=document.createElement('a');a.href='${link}';a.textContent='19:00';document.getElementById('fresh').appendChild(a)},200)</script>`;
  let modelDecisionCalls = 0;
  const executor = new BrowserTaskExecutor(localFixture({
    [tableCheckDiscoveryUrl(candidate)]: `<a href="${guide}">Restaurant 1</a>`, [guide]: guideHtml, [reserve]: formHtml,
  }), { modelDecision: { async decide(input) {
    modelDecisionCalls += 1;
    assert.equal(input.observation.url, reserve, "wait only for the selected reservation form");
    assert.equal(modelDecisionCalls, 1, "one bounded wait suffices for the controlled update");
    const target = input.observation.targets[0];
    assert.ok(target, "the current page supplies an observed wait target");
    return { type: "WAIT", targetRef: target.ref, reason: "Wait for the selected request's result to load" };
  } } });
  const signal = new AbortController().signal;
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
      date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, signal);
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    const finalPage = await session.snapshot();
    assert.equal(modelDecisionCalls, 1);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
    assert.match(finalPage.html, /start_time=19:00/, "the current request link arrived before availability was accepted");
    assert.match(finalPage.html, /data-date="2026-09-15"/, "old inventory remained on the page but was not accepted");
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
    <div data-testid="Venue Pax Select" id="pax-2"><input role="combobox" aria-controls="guests" aria-readonly="true" aria-label="Any party size" aria-expanded="false" style="pointer-events:none" onkeydown="if(event.key==='ArrowDown')openList(this,'guests')"></div>
    <div id="guests" role="listbox" hidden><div role="option" onclick="document.querySelector('#pax-2 input').value='4 guests';document.querySelector('#pax-2').id='pax-4';finishChoice()">4 guests</div></div>
    <div data-testid="Venue Time Select" id="time-20:00"><div data-testid="Value Container"><div class="fixture-singleValue">20:00</div><div><input role="combobox" aria-readonly="true" aria-label="Time" aria-expanded="false" value="" style="pointer-events:none" onkeydown="if(event.key==='ArrowDown')openList(this,'times')"></div></div></div>
    <div id="times" role="listbox" hidden><div role="option" onclick="document.getElementById('time-20:00').querySelector('.fixture-singleValue').textContent='19:00';document.getElementById('time-20:00').id='time-19:00';finishChoice()">19:00</div><div role="option" onclick="document.body.dataset.outside='changed';finishChoice()">20:00</div></div>
    <div id="result"></div><button type="submit">Book</button></form></div>
    <script>function openList(input,id){document.getElementById(id).hidden=false;input.setAttribute('aria-expanded','true');input.setAttribute('aria-controls',id)}
    function finishChoice(){document.querySelectorAll('[role=listbox]').forEach(e=>e.hidden=true);document.querySelectorAll('[role=combobox]').forEach(e=>{e.setAttribute('aria-expanded','false');e.removeAttribute('aria-controls')});const time=document.querySelector('[data-testid="Venue Time Select"]').id.slice(5);document.querySelector('#result').innerHTML='<a href="/en/shops/restaurant1/reserve?start_date=2026-09-19&pax=4&start_time='+time+'">'+time+'</a>'}</script>`;
  let calls=0;const diagnostics:string[]=[];
  const executor = new BrowserTaskExecutor(localFixture({[tableCheckDiscoveryUrl(candidate)]:`<a href="${sourceUrl}">Restaurant 1</a>`,[sourceUrl]:html},runtimeKind),{maxOperationsPerCandidate:80,onDiagnostic:d=>{if(d.event==="REJECTED"||d.event==="MODEL_ACTION"||d.event==="METHOD_INCOMPLETE"||d.event==="POST_ACTION_VERIFIED")diagnostics.push(`${d.event}: ${d.detail??""}`)},modelDecision:{async decide(input){
    calls++;
    assert.ok(!input.observation.targets.some(t=>t.label==='Sep 19th'),"selected disabled calendar day must prevent repeated date trigger clicks");
    if(calls===2 || calls>=4) assert.ok(!input.observation.targets.some(t=>t.role==='combobox'&&t.label===(calls===2?'Any party size':'Time')), 'an already open list must not invite another open action');
    const label=calls===1?'Any party size':calls===2?'4 guests':calls===3?'Time':calls===6?'19:00':'20:00';
    const target=input.observation.targets.find(t=>t.label===label&&t.role===(calls===1||calls===3?'combobox':'option'));
    assert.ok(target);assert.equal(target.kind,calls===1||calls===3?'BUTTON':'OPTION');
    return calls===1||calls===3||calls===5?{type:'CLICK',targetRef:target.ref,reason:'Open choices or test rejected out-of-window click'}:{type:'CHOOSE_OPTION',field:calls===2?'PARTY_SIZE':'TIME',targetRef:target.ref,reason:'Select observed authoritative query choice'};
  }}});
  try {
    const signal=new AbortController().signal;
    const result=await new TableCheckBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:'2026-09-19',partySize:4,timeWindow:{earliest:'18:30',latest:'19:30'},hardCriteria:[]},signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,'AVAILABLE',JSON.stringify({result,calls,diagnostics}));
    assert.equal(result.offers.length,1);assert.equal(calls,6);
    const session=await executor.acquire(signal,'TABLECHECK','AVAILABILITY');
    const selectedControls = await session.observeControls!();
    assert.equal(selectedControls.find(control=>control.role==='combobox'&&control.label==='Any party size')?.value,'4 guests');
    assert.equal(selectedControls.find(control=>control.role==='combobox'&&control.label==='Time')?.value,'19:00');
    assert.equal(selectedControls.find(control=>control.role==='combobox'&&control.label==='Time')?.controlledListboxId,undefined);
    assert.match((await session.snapshot()).html, /aria-label="Time"[^>]*value=""/, "the production Adapter consumed the proxy display while input.value remained empty");
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
    const pages={ [sourceUrl]:html,"https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201":`<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`,[endpoint+"?member=2"]:payload(2,"19:00"),[endpoint+"?member=4"]:payload(4,"18:45"),"https://tabelog.com/unrelated.json":JSON.stringify({private:"must not capture"}) };
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
