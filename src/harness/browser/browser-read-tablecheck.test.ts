import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import { url, identity, exactGuideAvailabilityUrl, localFixture } from "./browser-read-test-fixtures.js";

test("TableCheck waits for its guide result and grounds exact-query empty availability", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const html = '<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form><button type="button" data-testid="day" data-date="2026-9-16" aria-selected="true" data-state="disabled">16</button><div data-testid="Venue Pax Select" id="pax-2"></div><div data-testid="Venue Time Select" id="time-19:00"></div><span class="skeleton"></span></form></div><script>setTimeout(()=>{document.querySelector(".skeleton").outerHTML=\'<span data-testid="Venue Unavailable Msg">We could not find a table on Sep 16th for the selected mealtime</span>\'},200)</script>';
  const searchUrl = tableCheckDiscoveryUrl(candidate);
  const requestedUrl = exactGuideAvailabilityUrl(sourceUrl, "2026-09-16", 2, "19:00");
  const executor = new BrowserTaskExecutor(localFixture({
    [searchUrl]: `<a href="${sourceUrl}">Restaurant 1</a>`,
    [sourceUrl]: html,
    [requestedUrl]: html,
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide() { assert.fail("ready explicit empty result should need no model"); } } });
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-16",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"},hardCriteria:[]},new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"UNAVAILABLE",JSON.stringify(result));
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode,"NO_MATCHING_SLOT");
    assert.equal(result.offers.length,0);
  } finally { await executor.close(); }
});

test("real Chromium TableCheck source observation completes inside the current 45s provider window", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const resultLink = "/en/shops/restaurant1/reserve?start_date=2026-09-16&num_people=2&start_time=19:00";
  const requestedSourceUrl = exactGuideAvailabilityUrl(sourceUrl, "2026-09-16", 2, "19:00");
  const delayedPage = `<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form><input name="reservation[start_date]" value="2026-09-16"><select name="reservation[num_people_adult]"><option value="2" selected>2</option></select></form><span class="skeleton"></span><div id="result"></div></div><script>setTimeout(()=>{document.querySelector('.skeleton').remove();const link=document.createElement('a');link.href='${resultLink}';link.textContent='19:00';document.querySelector('#result').append(link)},100)</script>`;
  const delayedSourceObservation = (runtime: BrowserRuntime): BrowserRuntime => ({
    async openSession(input) {
      const raw = await runtime.openSession(input);
      let delayNextSourceSnapshot = false;
      let cancelDelay: (() => void) | undefined;
      const session = Object.create(raw) as BrowserSession;
      session.navigate = async (target, options) => {
        await raw.navigate(target, options);
        // The production Adapter now navigates through the exact guide query
        // before its first availability snapshot.  Delay that source read,
        // not the earlier identity guide navigation.
        delayNextSourceSnapshot = target === requestedSourceUrl;
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
      [tableCheckDiscoveryUrl(candidate)]: `<a href="${sourceUrl}">Restaurant 1</a>`,
      [sourceUrl]: delayedPage,
      [requestedSourceUrl]: delayedPage,
    })), {maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxElapsedMsPerCandidate: 60_000, maxElapsedMsPerProvider: providerBudgetMs, maxAutomaticElapsedMs: 60_000,
      onDiagnostic: diagnostic => diagnostics.push(diagnostic) });
    try {
      const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
        date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, new AbortController().signal);
      return { result, elapsedMs: Date.now() - startedAt, diagnostics };
    } finally { await executor.close(); }
  };
  // Keep the current 31s observation as the regression; the retired 30s
  // configuration is historical evidence, not a second product path.
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
  const correctSearchUrl = `${correctUrl}?search_text=${encodeURIComponent(query)}`;
  const requestedUrl = exactGuideAvailabilityUrl(correctUrl, "2026-09-16", 2, "19:00");
  const resultHtml = `<a href="${otherUrl}?search_text=${encodeURIComponent(query)}">Other Restaurant</a><a href="${correctSearchUrl}">Restaurant 1</a>`;
  const correctHtml = '<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability" data-selected-date="2026-09-16" data-pax="2"><section data-availability-state="complete"><a href="/en/shops/restaurant1/reserve?start_date=2026-09-16&num_people=2&start_time=19:00">19:00</a></section></div>';
  const executor = new BrowserTaskExecutor(localFixture({
    [searchUrl]: resultHtml,
    [otherUrl]: '<h1>Other Restaurant</h1><a href="tel:03-9999-8888">Phone</a>',
    [correctUrl]: correctHtml,
    [correctSearchUrl]: correctHtml,
    [requestedUrl]: correctHtml,
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide() { assert.fail("known feasible guide requires no browser model action"); } } });
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
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    modelDecisionCalls += 1;
    assert.equal(input.observation.url, reserve, "wait only for the selected reservation form");
    assert.equal(modelDecisionCalls, 1, "one bounded wait suffices for the controlled update");
    return { type: "WAIT", reason: "Wait for the selected request's result to load" };
  } } });
  const signal = new AbortController().signal;
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
      date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, signal);
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    const finalPage = await session.snapshot();
    assert.equal(modelDecisionCalls, 0, "navigation settles the current result without spending a model WAIT");
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
  const executor = new BrowserTaskExecutor(localFixture({[tableCheckDiscoveryUrl(candidate)]:`<a href="${sourceUrl}">Restaurant 1</a>`,[sourceUrl]:html},runtimeKind),{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate:80,onDiagnostic:d=>{if(d.event==="REJECTED"||d.event==="MODEL_ACTION"||d.event==="METHOD_INCOMPLETE"||d.event==="POST_ACTION_VERIFIED")diagnostics.push(`${d.event}: ${d.detail??""}`)},modelDecision:{async decide(input){
    calls++;
    assert.deepEqual(input.observation.targets.find(t=>t.label==='Sep 19th')?.availableActions,[],"selected disabled calendar day retains state evidence but cannot repeat the date trigger");
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


