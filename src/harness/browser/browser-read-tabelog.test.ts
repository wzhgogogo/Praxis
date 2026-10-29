import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { test } from "node:test";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import { url, localFixture } from "./browser-read-test-fixtures.js";

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
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
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
      completion: snapshot => ({ complete: snapshot.url === categoryUrl && snapshot.text.includes("Expanded category results"), reason: "The current category list still needs to be observed without the keyword.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
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
  const { tabelogQueryControlHints, tabelogQueryControlsRestricted, tabelogRequestedDateState } = await import("../../integrations/tabelog/tabelog-query-controls.js");
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
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-28"), "UNOBSERVED");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-29"), "UNOBSERVED");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-30"), "UNOBSERVED");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-10-01"), "UNOBSERVED", "hidden future month is not the current query surface");
    const snapshotRecord = trace.find(event => event.kind === "SNAPSHOT")!;
    const region = (snapshotRecord.detail as { queryRegions: Array<{ markup: string; computedVisibility: string }> }).queryRegions[0]!;
    assert.match(region.markup, /p-booking-calendar__day-num--closed">30<\/span>/);
    assert.equal(region.computedVisibility, "UNKNOWN");
    const controlsRecord = trace.find(event => event.kind === "CONTROLS")!;
    assert.equal((controlsRecord.detail as { totalObserved: number }).totalObserved, controls.length);
    assert.equal((controlsRecord.detail as { controls: unknown[] }).controls.length, controls.length);
    assert.equal((controlsRecord.detail as { snapshotSequence: number }).snapshotSequence, snapshotRecord.sequence);
    assert.equal(await observed.waitForSettled!(snapshot, 500), true, "restricted ready state may be settled without offering a requested guest control");
  } finally { await session.close(); }
});

test("real Chromium recovers a Tabelog busy page once and still grounds the exact request", async () => {
  const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const sourceUrl = "https://tabelog.com/en/tokyo/A1303/A130301/13293469/";
  const queryUrl='https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=13293469&svd=20260805&svps=2&svt=1900';
  const pages = { [sourceUrl]: await readFile(new URL("../../../.eval-artifacts/p2-2-selection-20261019/followup/busy-inputs/p20-h001-a1.snapshot-0033.html", import.meta.url), "utf8"),
    [queryUrl]:JSON.stringify({base_date:{year:2026,month:8,day:5},members:2,selection:{0:{time:'19:00',url:'/en/booking/form_course/new?rcd=13293469&member=2&visit_date=20260805&visit_time=1900'}}}) };
  const good = '<title>Restaurant 1</title><h1 class="restaurant-name">Restaurant 1</h1><p class="restaurant-address">1-1 Shinjuku, Tokyo</p><p>予約 人数</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><div class="p-booking-calendar"><button class="is-selected" data-year="2026" data-month="8" data-day="5">5</button><fieldset><legend>Guests</legend><button aria-pressed="true" data-value="2">2</button></fieldset></div>'+`<script>fetch('${queryUrl}')</script>`;
  const raw = localFixture(pages), arrivals: Array<{url:string;at:number}> = [], diagnostics: BrowserExecutionDiagnostic[] = [];
  const runtime: BrowserRuntime = { async openSession(input) {
    const session = await raw.openSession(input);
    return new Proxy(session, { get(target, key) {
      if (key === "navigate") return async (...args: Parameters<typeof session.navigate>) => { arrivals.push({url:args[0],at:performance.now()}); if (arrivals.length === 2) pages[sourceUrl] = good; return target.navigate(...args); };
      const value = Reflect.get(target,key,target); return typeof value === "function" ? value.bind(target) : value;
    } });
  } };
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 15_000, maxOperationsPerCandidate: 24, maxModelCallsTotal: 1, maxModelCallsPerCandidate: 1, onDiagnostic: row => { diagnostics.push(row); } });
  const candidate = structuredClone(fixtureCandidates[0]!);candidate.restaurant.sourceIds = { googleWebsiteUri: "https://tabelog.com/tokyo/A1303/A130301/13293469/" };
  try {
    const result = await new TabelogBrowserAvailability(executor).check({ candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-08-05",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"},hardCriteria:[] }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"AVAILABLE",JSON.stringify(result));
    assert.equal(result.offers[0]?.partySize,2);assert.equal(result.offers[0]?.dateTime.slice(0,16),"2026-08-05T19:00");
    assert.ok(arrivals.every(row=>row.url===sourceUrl));assert.ok(arrivals[1]!.at-arrivals[0]!.at>=1_000);
    assert.equal(diagnostics.filter(row=>row.event==="OPERATION_STARTED"&&row.detail==="WAIT_FOR_SOURCE_RETRY").length,1);
    assert.equal(diagnostics.filter(row=>row.event==="MODEL_DECISION_STARTED").length,0);
  } finally { await executor.close(); }
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
    [sourceUrl]: loading, [calendarUrl]: saved.replace(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi, ""),
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide() { assert.fail("restricted current query must not start the model loop"); } } });
  try {
    const result = await new TabelogBrowserAvailability(executor).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-09-30", partySize: 2,
      timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [],
    }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED");
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
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
    const signal = new AbortController().signal;
    executor.beginCandidate("failed");
    const failedSession = await executor.acquire(signal, "TABLECHECK", "IDENTITY");
    await assert.rejects(
      executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", session: failedSession, signal, allowedOrigins: ["https://www.tablecheck.com"], url: failedUrl, timeoutMs: 30 }),
      { code: "BROWSER_TIMEOUT" },
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


for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} selects Tabelog paragraph dates and labelled guests without treating time options as slots`, async () => {
    const { tabelogQueryControlHints, hasTabelogSelectedQuery } = await import("../../integrations/tabelog/tabelog-query-controls.js");
    const { parseTabelogAvailabilitySlots } = await import("../../integrations/tabelog/tabelog-page-parser.js");
    const sourceUrl = "https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
    const html = `<h1>Restaurant 1</h1><p>1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Phone</a><p>Reserve Guests</p><div class="p-booking-calendar" style="display:none">
      <p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="9" data-day="17" aria-label="Date 2026-09-17" aria-current="date">17</p>
      <p class="js-calendar-day-target is-selectable" data-year="2026" data-month="9" data-day="20" aria-label="Date 2026-09-20">20</p>
      <fieldset><legend>Guests</legend><button type="button" class="p-booking-calendar__people-button js-people-button is-active" aria-pressed="true">2</button><button type="button" class="p-booking-calendar__people-button js-people-button" aria-pressed="false">4</button>
      <input type="hidden" class="js-people-hidden-value" value="2"></fieldset>
      <button data-state="disabled" data-date="2026-9-16" type="button">Disabled date</button>
      <button class="p-booking-calendar__time-button js-time-button" data-time="1900" type="button">7:00 PM</button>
      </div><a href="https://social.example/restaurant">Official website</a>
      <script>
      setTimeout(()=>document.querySelector('.p-booking-calendar').style.display='block',150);
      document.querySelectorAll('.js-calendar-day-target').forEach(el=>el.onclick=()=>{const old=document.querySelector('.is-current');old.classList.remove('is-current');old.removeAttribute('aria-current');el.classList.add('is-current');el.setAttribute('aria-current','date')});
      document.querySelectorAll('.js-people-button').forEach(el=>el.onclick=()=>{const old=document.querySelector('.is-active');old.classList.remove('is-active');old.setAttribute('aria-pressed','false');el.classList.add('is-active');el.setAttribute('aria-pressed','true');document.querySelector('input').value=el.textContent});
      </script>`;
    let calls = 0;
    const searchUrl = "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201";
    const searchHtml = `<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`;
    const executor = new BrowserTaskExecutor(localFixture({[sourceUrl]:html,[searchUrl]:searchHtml}, runtimeKind), { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
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
      assert.deepEqual(parseTabelogAvailabilitySlots(snapshot,{date:"2026-09-20",partySize:4}),{availableSlots:[],hasExplicitSlotUi:false});
      assert.equal(result.offers.length,0,"query options alone cannot establish inventory");
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode,"EXTRACTION_FAILED");
      assert.equal(calls,2,"production Adapter must reach the shared model loop");
    } finally { await executor.close(); }
  });
}

// The real guide's skeleton and disabled selected day formerly triggered a pointless model click.
// Production Adapter must wait, bind date/party/time, and return UNAVAILABLE without model inference.

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
 for (const markup of ["legacy", "current"] as const) {
  test(`${runtimeKind} ${markup} Tabelog Adapter grounds passive exact-query responses and clears them on navigation`, async () => {
    const {TabelogBrowserAvailability}=await import("../../integrations/tabelog/tabelog-browser-availability.js");
    const {fixtureCandidates}=await import("../restaurant-fixtures.js");
    const candidate=structuredClone(fixtureCandidates[0]!);candidate.restaurant.sourceIds.phone="03-1111-2222";
    const sourceUrl="https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
    const endpoint="https://tabelog.com/en/booking/calendar/find_vacancy"+(markup==="legacy"?"/":"");
    let html=`<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><p>Reserve Guests</p>
      <div class="rstdtl-course-list js-rstdtl-course-list"><span class="rstdtl-course-list__course-title-text">Seasonal lunch course</span><p class="rstdtl-course-list__desc">Lunch only, 11:30 to 14:00.</p><del>JPY 9,000</del><span class="rstdtl-course-list__price-num">JPY<em>8,000</em><span>（Price including tax）per person</span></span><dl class="rstdtl-course-list__course-rule"><dt>Number of people</dt><dd>2 - 4</dd></dl></div>
      <div class="p-booking-calendar">
      <p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="9" data-day="17" aria-label="Date 2026-09-17" aria-current="date">17</p>
      <p class="js-calendar-day-target is-selectable" data-year="2026" data-month="9" data-day="20" aria-label="Date 2026-09-20">20</p>
      <fieldset><legend>Guests</legend><fieldset><legend>Guests</legend><button type="button" class="p-booking-calendar__people-button js-people-button is-active" aria-pressed="true">2</button><button type="button" class="p-booking-calendar__people-button js-people-button" aria-pressed="false">4</button>
      <input type="hidden" class="js-people-hidden-value" value="2"></fieldset></fieldset><button type="button" class="p-booking-calendar__time-button" data-time="1845">6:45 PM</button></div>
      <script>function query(){fetch('${endpoint}?member='+document.querySelector('.p-booking-calendar__people-button.is-active').textContent);fetch('/unrelated.json')}
      document.querySelectorAll('.js-calendar-day-target').forEach(el=>el.onclick=()=>{const old=document.querySelector('.is-current');old.classList.remove('is-current');old.removeAttribute('aria-current');el.classList.add('is-current');el.setAttribute('aria-current','date');query()});
      document.querySelectorAll('.js-people-button').forEach(el=>el.onclick=()=>{const old=document.querySelector('.is-active');old.classList.remove('is-active');old.setAttribute('aria-pressed','false');el.classList.add('is-active');el.setAttribute('aria-pressed','true');const hidden=document.querySelector('input');if(hidden)hidden.value=el.textContent;query()});</script>`;
    if(markup==="current") html=html.replace(/<p class="js-calendar-day-target([^"]*)"([^>]*)>([^<]*)<\/p>/g,'<button type="button" class="p-booking-calendar__day$1"$2>$3</button>').replaceAll('js-calendar-day-target','p-booking-calendar__day').replaceAll('js-people-button','current-people-control');
    if(markup==="current") html=html.replace('<input type="hidden" class="js-people-hidden-value" value="2">','');
    const payload=(members:number,time:string)=>JSON.stringify({base_date:{year:2026,month:9,day:20},members,selection:{0:{time,url:`/en/booking/form_course/new?rcd=13292459&member=${members}&visit_date=20260920&visit_time=${time.replace(':','')}`}}});
    const pages={ [sourceUrl]:html,"https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201":`<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`,[endpoint+"?member=2"]:payload(2,"19:00"),[endpoint+"?member=4"]:payload(4,"18:45"),"https://tabelog.com/unrelated.json":JSON.stringify({private:"must not capture"}) };
    let calls=0, sourceFactsCalls=0;
    const sourceFactsModel: import("../../core/model/contracts.js").ModelGateway = {async complete(input){
      sourceFactsCalls++;assert.equal(input.purpose,"restaurant_source_facts");
      const rows=JSON.parse(input.messages[1]!.content).sourceDocument.statements;
      const first=rows.findIndex((row:{text:string})=>row.text.startsWith("Seasonal lunch course"));
      const last=rows.findIndex((row:{text:string})=>/2\s*-\s*4/.test(row.text));assert.ok(first>=0&&last>=first);
      return {invocationId:"source-menu-fixture",provider:"FIXTURE",model:"fixture",finishReason:"TOOL_CALLS",latencyMs:0,outputText:JSON.stringify({selections:[{firstStatementId:rows[first].id,lastStatementId:rows[last].id,priceStatementId:rows.slice(first,last+1).find((s:{text:string})=>/JPY|[¥￥円]/u.test(s.text))!.id,role:"COURSE"}]})};
    }};
    const executor=new BrowserTaskExecutor(localFixture(pages,runtimeKind),{ maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(input){assert.equal(input.observation.targets.some(t=>t.label==="Booking time 6:45 PM"&&(t.availableActions?.length??0)>0),false,"time has no model action");const field=++calls===1?"DATE" as const:"PARTY_SIZE" as const;if(calls===2)assert.deepEqual(input.observation.targets.find(t=>t.label==="Date 2026-09-20")?.availableActions, [], "selected date remains evidence without a repeat action");const target=input.observation.targets.find(t=>t.label===(field==="DATE"?"Date 2026-09-20":"Guests 4"));assert.ok(target);return {type:"CLICK_AUTHORITATIVE",field,targetRef:target.ref,reason:"Exact query"}}},maxModelCallsPerCandidate:3});
    const signal=new AbortController().signal;
    try{
      const result=await new TabelogBrowserAvailability(executor, undefined, 5, {sourceFactsModel}).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-20",partySize:4,timeWindow:{earliest:"18:30",latest:"19:30"},hardCriteria:[]},signal);
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"AVAILABLE",JSON.stringify(result));
      assert.equal(result.offers.length,1);assert.match(result.offers[0]!.dateTime,/T18:45/);
      const listed = result.evidence.find(item => item.kind === "RESTAURANT_FACT" && item.claims.listedCourseDetails)?.claims;
      assert.ok(Array.isArray(listed?.listedCourseDetails) && listed.listedCourseDetails.length===1);
      const quotedCourse=String(listed.listedCourseDetails[0]).replace(/\s+/g," ");
      for(const text of ["Seasonal lunch course","Lunch only, 11:30 to 14:00.","JPY","8,000","Price including tax","Number of people","2 - 4"]) assert.ok(quotedCourse.includes(text),text);
      assert.equal(sourceFactsCalls,1,"one cached-page source selection is charged alongside two browser choices");
      assert.equal(listed?.coursePriceYen, undefined, "a listed lunch course is not the dinner offer price");
      assert.equal(result.offers[0]!.price, undefined);
      const session=await executor.acquire(signal,"TABELOG","AVAILABILITY");
      const snapshot=await session.snapshot();assert.ok(snapshot.responses?.length);assert.ok(snapshot.responses.every(r=>r.url.startsWith(endpoint)));
      await session.navigate(sourceUrl);assert.deepEqual((await session.snapshot()).responses,[]);
    }finally{await executor.close()}
  });
}
 }
