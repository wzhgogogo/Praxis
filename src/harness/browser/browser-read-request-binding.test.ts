import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { test } from "node:test";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { url, identity, localFixture } from "./browser-read-test-fixtures.js";

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
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
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
        completion: (snapshot) => ({ complete: /2026-09-18 \/ 10/.test(snapshot.text), reason: "The complete requested parameters are not visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
      });
      assert.equal(result.status, "COMPLETED", JSON.stringify(result));
      assert.match(result.snapshot.text, /2026-09-18 \/ 10/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} settles delayed visible query state`, async () => {
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
      assert.equal(await session.waitForSettled!(beforeNoise, 700), true, "visible text wakes a fresh read but cannot itself accept a result");
      const beforeApply = await session.snapshot();
      assert.match(beforeApply.interactiveState ?? "", /"value":"2"/);
      assert.match(beforeApply.interactiveState ?? "", /"disabled":false/);
      await session.click("#apply");
      assert.equal(await session.waitForSettled!(beforeApply, 700), true, "a delayed selected value or disabled state wakes the bounded wait");
      const after = await session.snapshot();
      assert.match(after.interactiveState ?? "", /\"value\":\"4\"/);
      assert.match(after.interactiveState ?? "", /\"disabled\":true/);
    } finally { await session.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} settles hidden and property-only control mutations without treating either as inventory`, async () => {
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
      assert.equal(await session.waitForSettled!(beforeHidden, 80), false, "hidden analytics and visibility:hidden inputs are not query-state progress");
      const beforeChecked = await session.snapshot();
      assert.match(beforeChecked.interactiveState ?? "", /"checked":false/);
      await session.click("#apply");
      assert.equal(await session.waitForSettled!(beforeChecked, 700), true, "a visible checked property mutation wakes a fresh read");
      assert.match((await session.snapshot()).interactiveState ?? "", /\"checked\":true/);
    } finally { await session.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} recovers once from a visible header obstruction and re-observes before the next click`, async () => {
    const runtime = localFixture(`<title>Obstructed query</title>
      <style>#blocker{position:fixed;inset:0 auto auto 0;width:100%;height:90px;z-index:3;background:#fff}</style>
      <button id="apply" type="button" style="position:relative;z-index:1" onclick="document.querySelector('#result').textContent='Current availability 19:00'">Find availability</button>
      <header id="blocker"><strong>Search suggestions</strong></header><output id="result">Select the public query.</output>
      <script>addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelector('#blocker')?.remove()})</script>`, runtimeKind);
    const diagnostics: import("../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
    let decisions = 0;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
      onDiagnostic: event => diagnostics.push(event),
      modelDecision: { async decide(input) {
        decisions += 1;
        const action = input.observation.targets.find(target => target.label === "Find availability");
        assert.ok(action);
        return { type: "CLICK", targetRef: action.ref, reason: "Run the observed public query." };
      } },
    });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({
        taskId: `fixture:obstruction:${runtimeKind}`, source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Run the public availability query.",
        completion: snapshot => ({ complete: /Current availability 19:00/.test(snapshot.text), reason: "The current public result is not visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
      });
      assert.equal(result.status, "COMPLETED", JSON.stringify(result));
      assert.equal(decisions, 2, "the recovery must re-observe and obtain a fresh proposal");
      assert.ok(diagnostics.some(event => event.detail === "ACTION_OBSTRUCTED"));
      assert.ok(diagnostics.some(event => event.detail === "ACTION_OBSTRUCTION_RECOVERED:header"));
    } finally { await executor.close(); }
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
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12,
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
      const chooseTen = () => {
        assert.equal(ten!.outsideViewport, true, "the requested option is exposed while clipped by the list");
        return { type: "CHOOSE_OPTION" as const, targetRef: ten!.ref, field: "PARTY_SIZE" as const, reason: "Select exactly ten guests; executor reveals it." };
      };
      if (order === "party-first") {
        if (!partyIsTen && party && !list && !ten) { actions.push("PARTY"); return openParty(); }
        if (next) { actions.push("NEXT"); return nextMonth(); }
        if (!partyIsTen && ten) { actions.push("TEN"); return chooseTen(); }
        assert.ok(date && !date.selected, "the exact date remains actionable after the selected party is confirmed");
        actions.push("DATE");
        return selectDate();
      }
      if (next) { actions.push("NEXT"); return nextMonth(); }
      if (date && !date.selected) { actions.push("DATE"); return selectDate(); }
      if (!partyIsTen && party && !list && !ten) { actions.push("PARTY"); return openParty(); }
      assert.ok(!partyIsTen && ten, "the exact option remains selectable in its existing owner list");
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
    assert.equal(actions.includes("SCROLL"), false, "revealing an option consumes no model decision");
    assert.deepEqual(actions, order === "party-first"
      ? ["PARTY", "NEXT", "TEN", "DATE"]
      : ["NEXT", "DATE", "PARTY", "TEN"]);
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
  const executor = new BrowserTaskExecutor(dynamicTabelogSourcePages(), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
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
  const { createLiveReadAssembly } = await import("../../integrations/restaurant-search/live-read-assembly.js");
  const { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } = await import("../../application/live-read-investigation-budget.js");
  const { LiveBrowserAvailability } = await import("../../integrations/restaurant-availability/live-browser-availability.js");
  const { createHybridReadComposition } = await import("../../eval/restaurant/agent-loop/hybrid-read-composition.js");
  const { evaluateRestaurantHybridLiveArtifact } = await import("../../eval/restaurant/agent-loop/diagnostic-evaluator.js");
  const { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } = await import("../../eval/restaurant/agent-loop/live-case-materializer.js");
  const trace: Array<{ sequence: number; at: string; kind: string; detail: unknown }> = [];
  const rawRuntime = dynamicTabelogSourcePages({ result: outcome });
  const runtime = { openSession: async (input: { signal: AbortSignal }) => traceBrowserSession(
    await rawRuntime.openSession(input), "TABELOG", (kind, detail) => { const sequence = trace.length + 1; trace.push({ sequence, at: reference.toISOString(), kind, detail }); return sequence; },
  ) };
  const reply = (outputText: string, purpose: string) => ({ invocationId: purpose, provider: "FIXTURE" as const, model: "scripted-formal-browser", outputText, finishReason: "TOOL_CALLS" as const, latencyMs: 0 });
  const browserActions: string[] = [];
  let modelCalls = 0;
  let availabilityReadFirst = false;
  const model: import("../../core/model/contracts.js").ModelGateway = { async complete(request) {
    assert.ok(++modelCalls <= 50, "the formal local composition retains its total model-call ceiling");
    if (request.purpose === "restaurant_discovery_retrieval") {
      const input = JSON.parse(request.messages.find(item => item.role === "user")!.content);
      return reply(JSON.stringify({ choice: input.current ? "KEEP" : "KEYWORD", keyword: input.current ? "" : "omakase", criterionRef: input.current ? "" : "criterion:0", generalRef:'',categoryUrl: "", reason: "Controlled retrieval; preserve the current sparse source result." }), request.purpose);
    }
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
      const input = JSON.parse(request.messages.find(item => item.role === "user")!.content) as { observation: { targets: Array<{ ref: string; label: string; selected?: boolean; availableActions?: string[] }> } };
      const region = input.observation.targets.find(target => target.label === "Shibuya" && target.availableActions?.includes("OPEN_LINK"));
      if (region) return reply(JSON.stringify({ action: "OPEN_LINK", targetRef: region.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Select the observed region before reading its list." }), request.purpose);
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
  const google = new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => new Response(JSON.stringify({ places: [{ id: "shibuya", displayName: { text: "Shibuya" }, formattedAddress: "Shibuya, Tokyo", location: center, types: ["train_station"], addressComponents: [{ longText: "Tokyo", types: ["locality"] }] }] }), { status: 200 }) });
  const native = createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET, { google, browser: runtime, model, clock: { now: () => reference } });
  const taskId = `native-dynamic-tabelog-formal:${outcome}`;
  const composition = createHybridReadComposition({ taskId, runId: `run:${taskId}`, clock: { now: () => reference }, model, ...native });
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
      sourceTrace: { browserTrace: trace },
      runCeilings: native.runCeilings,
      resourceUsage: { elapsedMs: 1, modelCallsStarted: modelCalls, browserModelCalls: browserActions.length, agentDecisions: 0, googleRequests: { total: 1, namedPlaceResolution: 1, discovery: 0, placeDetails: 0, reverseAddressObservation: 0 } },
    };
    const encoded = JSON.stringify(artifact);
    const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: "dynamic-availability-first.execution.json", sha256: createHash("sha256").update(encoded).digest("hex") });
    assert.equal(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation.findings));
  } else {
    assert.equal(state.phase, "NO_VERIFIED_RESULT", JSON.stringify(state));
    assert.equal(state.presentedResults, undefined);
    assert.equal(Object.values(state.availability).flat().length, 0);
    assert.equal(tableCheckSearches.length, 1, "Tabelog UNAVAILABLE causes one ordinary second-source query; unsupported TableCheck filters are skipped");
    assert.equal(new URL(tableCheckSearches[0]!).pathname, "/en/japan/search");
    assert.equal(state.searchContinuation?.exhausted, true);
    assert.match(state.noVerifiedResult?.remainingGaps.join(" ") ?? "", /bounded discovery plan/);
    const steps = composition.trajectories.steps;
    assert.equal(steps.some(step => step.agentAction?.type === "PRESENT_RESULTS"), false);
    const funnels = steps.flatMap(step => step.executionMetadata?.nativeDiscoveryFunnel ? [step.executionMetadata.nativeDiscoveryFunnel] : []);
    assert.deepEqual(funnels.map(funnel => ({ source: funnel.source, raw: funnel.rawSourceLinks,
      parsed: funnel.parsedOutlets, inspected: funnel.inspectedOutlets, accepted: funnel.accepted,
      rejected: funnel.rejected.length, deferred: funnel.deferredByBatchCap.length, exhausted: funnel.sourceExhausted })), [
      { source: "TABELOG", raw: 1, parsed: 1, inspected: 1, accepted: 1, rejected: 0, deferred: 0, exhausted: "UNKNOWN" },
      { source: "TABLECHECK", raw: 0, parsed: 0, inspected: 0, accepted: 0, rejected: 0, deferred: 0, exhausted: "UNKNOWN" },
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
    }, "the no-matching-slot response retains the final source query date and party");
    assert.equal(body?.selection?.length, 1);
    assert.equal((body?.selection?.[0] as {time?:string} | undefined)?.time, "21:00", "only the independently bound source slot outside the requested window supports this negative result");
  }
});
}
