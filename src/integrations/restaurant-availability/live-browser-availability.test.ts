import {scriptedBrowserObservation} from "../../harness/fixtures/restaurant-observation-model.js";
import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { LiveBrowserAvailability } from "./live-browser-availability.js";
import { tableCheckDiscoveryUrl } from "../tablecheck/tablecheck-page-parser.js";

test("production composition shares one literal-fragment model proposal across both source searches", async () => {
  const subject = structuredClone(fixtureCandidates[0]!);
  Object.assign(subject.restaurant, { outletName: "Dengana Akabane", sourceIds: { googlePlaces: "same-google-place", phone: "03-1111-2222" } });
  const original = structuredClone(subject);
  const tcOriginal = tableCheckDiscoveryUrl(subject), tcAlternative = new URL(tcOriginal);
  tcAlternative.searchParams.set("search_text", "Dengana");
  const pages:BrowserSnapshot[] = [
    { url: tcOriginal, title: "Search", text: "No venues found", html: "No venues found" },
    { url: tcAlternative.toString(), title: "Search", text: "No venues found", html: "No venues found" },
    { url: "https://tabelog.com/en/tokyo/rstLst/?sw=Dengana%20Akabane", title: "Search", text: "No restaurants match", html: "No restaurants match" },
    { url: "https://tabelog.com/en/tokyo/rstLst/?sw=Dengana", title: "Search", text: "Dengana", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/123/">Dengana</a>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Dengana", text: "Dengana", html: `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: "Dengana", address: subject.restaurant.address, telephone: "03-1111-2222" })}</script>` },
  ];
  const session=new Session(pages.slice(0,2)),other=new Session(pages.slice(2));let opens=0;
  const budget = { totalModelCalls: 0, maxModelCalls: 120 }; let calls = 0,browserCalls=0;
  const availability = new LiveBrowserAvailability({ readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession: async () => [session,other][opens++]! }, { async complete(request) {
    const browser=scriptedBrowserObservation(request);if(browser){browserCalls++;return browser;}
    calls++; assert.equal(request.purpose, "restaurant_named_source_query");
    assert.deepEqual(JSON.parse(request.messages[1]!.content), { name: subject.restaurant.outletName, address: subject.restaurant.address });
    return { invocationId: "fixture-query", provider: "FIXTURE", model: "fixture", outputText: '{"field":"name","fragment":"Dengana"}', finishReason: "TOOL_CALLS", latencyMs: 0 };
  } }, { browserBudget: budget, maxModelCallsPerCandidate: 20, maxModelCallsTotal: 120, maxOperationsPerCandidate: 80, maxAutomaticElapsedMs: 30_000 });
  availability.beginReadRun();
  const result = await availability.check({ candidateIds: [subject.restaurant.id], candidates: [subject], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.deepEqual([...session.queriesObserved,...other.queriesObserved],["Dengana Akabane","Dengana","Dengana Akabane","Dengana"],"Both sources expose original then fragment results; the source seed itself has no fabricated query");
  assert.equal(calls, 1); assert.equal(budget.totalModelCalls, calls+browserCalls);
  assert.equal(result.offers.length, 0, "same-outlet identity alone is not inventory");
  assert.ok(result.evidence.some(e => e.entityMatch?.confidence === "HIGH"));
  assert.equal(session.closed, 0, "run-scoped sessions remain open until the run ends");
  assert.deepEqual(subject, original);
  await availability.endReadRun();
  assert.equal(session.closed, 1);assert.equal(other.closed,1);
});

class Session implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, sessionId: "local:shared-live-composition", startedAt: "2026-09-07T00:00:00.000Z",readNetworkBoundary:"INSTALLED" as const };
  openedPages: string[] = [];
  readonly queriesObserved:string[]=[];
  closed = 0;
  private page = -1;
  private currentUrl="";private query="";private submitted=false;
  constructor(private readonly pages: BrowserSnapshot[]) {}
  async navigate(url: string): Promise<void> { this.openedPages.push(url); this.page = Math.min(this.page + 1, this.pages.length - 1);this.currentUrl=this.pages[this.page]!.url;this.submitted=new URL(this.currentUrl).searchParams.has("sw")||new URL(this.currentUrl).searchParams.has("search_text"); }
  async snapshot(): Promise<BrowserSnapshot> {const u=new URL(this.currentUrl),q=u.searchParams.get("search_text")??u.searchParams.get("sw");if(q&&this.queriesObserved.at(-1)!==q)this.queriesObserved.push(q);return {...this.pages[this.page]!,url:this.currentUrl}; }
  async observeControls():Promise<import("../../infrastructure/browser/browser-runtime.js").BrowserPageControl[]>{const form={owner:"public-search",visibleLines:["Restaurant name","Search"]};const html=this.pages[this.page]!.html;const selected:import("../../infrastructure/browser/browser-runtime.js").BrowserPageControl[]= [...html.matchAll(/<select name="(party|date)"><option(?: selected)? value="([^"]+)"/g)].map(m=>({id:m[1]!,stableKey:m[1]!,kind:"SELECT",role:"combobox",label:m[1]==="date"?"Date":"Guests",value:m[2]!,options:[{value:m[2]!,label:m[2]!,selected:true,disabled:false}],visible:true,disabled:false}));return[...selected,{id:"query",stableKey:"query",kind:"INPUT",role:"searchbox",label:"Restaurant name",type:"search",value:this.query,structure:{tag:"INPUT",name:this.currentUrl.includes("tablecheck")?"search_text":"sw",classes:[],dialogLabel:"",formClass:"",sliderCount:0},formMethod:"GET",formObservation:form,visible:true,disabled:false},{id:"submit",stableKey:"submit",kind:"BUTTON",role:"button",label:"Search",type:"submit",formMethod:"GET",formObservation:form,visible:true,disabled:false}];}
  async click(): Promise<void> {if(this.submitted||!/(?:japan\/search|rstLst)/.test(new URL(this.pages[this.page]!.url).pathname))this.page=Math.min(this.page+1,this.pages.length-1);this.submitted=true;const u=new URL(new URL(this.currentUrl).hostname.includes("tablecheck")?"https://www.tablecheck.com/en/japan/search":"https://tabelog.com/en/rstLst/");u.searchParams.set(u.hostname.includes("tablecheck")?"search_text":"sw",this.query);this.currentUrl=u.toString();this.openedPages.push(this.currentUrl);}
  async fill(_id:string,value:string): Promise<void> {this.query=value;}
  async select(_selector: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async waitForSettled(): Promise<boolean> { return true; }
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closed += 1; }
}

const neverCalledModel: ModelGateway = {
  async complete(_request: ModelRequest): Promise<ModelResponse> { return scriptedBrowserObservation(_request)!; },
};

test("one-shot Live composition initializes each source context and closes both after fallback", async () => {
  const candidate = fixtureCandidates[0]!;
  const request: RestaurantAvailabilityRequest = {
    candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date,
    timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"],
  };
  const empty = new Session([{ url: "https://www.tablecheck.com/en/japan/search", title: "Map Search", text: "No venues found", html: "<main>No venues found</main>" }]);
  const session = new Session([
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201", title: "Tabelog search", text: "Restaurant 1", html: '<article><a href="/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button><div class="genre">yakiniku</div>', responses: [{url:'https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=123&svd=20260805&svps=2',status:200,sequence:1,observedAt:'2026-08-05T09:00:00Z',body:{base_date:{year:2026,month:8,day:5},members:2,selection:[{time:'19:00',url:'/en/booking/form_course/new?rcd=123&member=2&visit_date=20260805&visit_time=1900'}]}}] },
  ]);
  let opens = 0;
  const runtime: BrowserRuntime = { readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession: async () => { opens += 1; return [empty,session][opens-1]!; } };
  const diagnostics: BrowserExecutionDiagnostic[] = [];
  const result = await new LiveBrowserAvailability(runtime, neverCalledModel, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 20, maxModelCallsTotal: 120, maxOperationsPerCandidate: 80,
    onBrowserDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(request, new AbortController().signal);
  assert.equal(opens, 2,"Each source requires its own first observed source seed");
  assert.equal(empty.closed,1);
  assert.equal(session.closed, 1);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE",JSON.stringify({checks:result.availabilityChecks,events:diagnostics.filter(d=>["REJECTED","OPERATION_FAILED","METHOD_INCOMPLETE"].includes(d.event))}));
  assert.deepEqual(result.metadata.providerAttempts?.map((attempt) => attempt.provider), ["TABLECHECK", "TABELOG"]);
  assert.deepEqual(diagnostics.filter(item => item.event === "PROVIDER_STARTED").map(item => item.source), ["TABLECHECK", "TABELOG"]);
  assert.deepEqual(diagnostics.filter(item => item.event === "PROVIDER_FINISHED").map(item => item.lifecycle.outcome), ["FINISHED", "FINISHED"]);
  assert.ok(diagnostics.filter(item => item.event === "OPERATION_STARTED").every(item => item.lifecycle.candidateRuntimeOperations >= item.lifecycle.providerRuntimeOperations));
});

test("Live composition reuses a source-observed Hajime entrance across candidate batches, but re-identifies it", async () => {
  // Production composition starts at LiveBrowserAvailability; only browser and
  // model transports are fixtures. This catches a per-adapter cache that dies
  // between Agent batches, but does not claim anything about a live site.
  const teppen = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "shibuya-sushi-teppen", outletName: "Shibuya Sushi Teppen", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const hajime = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "shibuya-namikibashi-sushi-hajime", outletName: "Shibuya Namikibashi Sushi Hajime", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const hajimePage: BrowserSnapshot = {
    url: "https://www.tablecheck.com/en/sushihajime-shibuya", title: "Shibuya Namikibashi Sushi Hajime - TableCheck",
    text: "Shibuya Namikibashi Sushi Hajime\nAddress\n1-1 Shinjuku, Tokyo\nPhone\n03-1111-2222",
    html: '<h1>Shibuya Namikibashi Sushi Hajime</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">03-1111-2222</a><a href="/en/sushihajime-shibuya/reserve/landing">Book a table</a>',
  };
  const pendingGuide={...hajimePage,html:hajimePage.html+'<div data-testid="Venue Availability"><p>No public inventory has loaded</p></div>'};
  const readyGuide={...hajimePage,text:hajimePage.text+" 2026-08-05 2 guests 19:00",html:hajimePage.html+'<form><select name="date"><option value="2026-08-05">2026-08-05</option></select><select name="party"><option value="2">2</option></select></form><div data-testid="Venue Availability"><a href="https://www.tablecheck.com/en/sushihajime-shibuya/reserve?start_date=2026-08-05&num_people=2&start_time=19:00">19:00</a></div>'};
  // LOCAL_CONSTRUCTION, embedded guide structure follows ginza-bistro-empty.json.
  const first = new Session([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Sushi+Teppen", title: "Map Search", text: "venues", html: '<a href="/en/sushihajime-shibuya">Shibuya Namikibashi Sushi Hajime</a>' },
    pendingGuide,
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Namikibashi+Sushi+Hajime", title: "Map Search", text: "No venues found", html: "<main>No venues found</main>" },
    readyGuide,
  ]);
  const second = new Session([
    { url: "https://tabelog.com/en/rstLst/?sw=Shibuya%20Sushi%20Teppen", title: "Just a moment...", text: "verify you are human", html: "" },
  ]);
  let opens = 0;
  const runtime: BrowserRuntime = { readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession: async () => [first, second][opens++]! };
  const availability = new LiveBrowserAvailability(runtime, neverCalledModel, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 20, maxModelCallsTotal: 120, maxOperationsPerCandidate: 80,alternativeSearch:async()=>undefined });
  const toRequest = (item: typeof teppen): RestaurantAvailabilityRequest => ({ candidateIds: [item.restaurant.id], candidates: [item], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: [] });
  availability.beginReadRun();
  await availability.check(toRequest(teppen), new AbortController().signal);
  const result = await availability.check(toRequest(hajime), new AbortController().signal);
  await availability.endReadRun();
  assert.equal(result.availabilityChecks[hajime.restaurant.id]?.status, "AVAILABLE");
  assert.deepEqual(first.queriesObserved,["Shibuya Sushi Teppen","Shibuya Namikibashi Sushi Hajime"],"Current candidate still performs its own observed search");
  assert.equal(first.openedPages.filter(url=>url==="https://www.tablecheck.com/en/sushihajime-shibuya").length,2,"The observed guide is independently re-read for the later candidate");
  assert.ok(first.openedPages.every(url=>!url.includes("/reserve")),"No stock read opens a booking workflow");
});

test("Live composition clears observed TableCheck entrances when a read run ends", async () => {
  // Same production start point as the cross-batch test. A fresh read run must
  // not inherit Teppen's observed Hajime link, even when its own discovery is
  // explicitly empty.
  const teppen = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "teppen-prior-run", outletName: "Shibuya Sushi Teppen", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const hajime = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "hajime-fresh-run", outletName: "Shibuya Namikibashi Sushi Hajime", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const first = new Session([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Sushi+Teppen", title: "Map Search", text: "venues", html: '<a href="/en/sushihajime-shibuya">Shibuya Namikibashi Sushi Hajime</a>' },
    { url: "https://www.tablecheck.com/en/sushihajime-shibuya", title: "Hajime", text: "Hajime", html: '<h1>Shibuya Namikibashi Sushi Hajime</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Call</a>' },
    { url: "https://tabelog.com/en/rstLst/?sw=Shibuya%20Sushi%20Teppen", title: "Just a moment...", text: "verify you are human", html: "" },
  ]);
  const second = new Session([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Namikibashi+Sushi+Hajime", title: "Map Search", text: "No venues found", html: "<main>No venues found</main>" },
    { url: "https://tabelog.com/en/rstLst/?sw=Shibuya%20Namikibashi%20Sushi%20Hajime", title: "Just a moment...", text: "verify you are human", html: "" },
  ]);
  let opens = 0;
  const challenge = () => new Session([{url:"https://tabelog.com/en/rstLst/",title:"Just a moment...",text:"verify you are human",html:""}]);
  const sourceSessions=[first,challenge(),second,challenge()];
  const runtime: BrowserRuntime = { readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession: async () => sourceSessions[opens++]! };
  const availability = new LiveBrowserAvailability(runtime, neverCalledModel, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 20, maxModelCallsTotal: 120, maxOperationsPerCandidate: 80 });
  const toRequest = (item: typeof teppen): RestaurantAvailabilityRequest => ({ candidateIds: [item.restaurant.id], candidates: [item], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: [] });
  availability.beginReadRun();
  await availability.check(toRequest(teppen), new AbortController().signal);
  await availability.endReadRun();
  availability.beginReadRun();
  const result = await availability.check(toRequest(hajime), new AbortController().signal);
  await availability.endReadRun();
  assert.equal(result.availabilityChecks[hajime.restaurant.id]?.status, "UNKNOWN");
  assert.equal(second.openedPages.includes("https://www.tablecheck.com/en/sushihajime-shibuya"), false);
});
