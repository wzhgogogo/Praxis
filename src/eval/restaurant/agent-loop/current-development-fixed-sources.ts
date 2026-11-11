import {fixtureGetSession} from "../../../harness/fixtures/observed-get-session.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET, type LiveReadInvestigationBudget } from "../../../application/live-read-investigation-budget.js";
import { createLiveReadAssembly } from "../../../integrations/restaurant-search/live-read-assembly.js";
import { googlePlacesDiscoveryPack } from "../../../integrations/restaurant-search/source-packs.js";
import type { BrowserPageControl, BrowserRuntime, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import type { CurrentDevelopmentSourceScenario, FixedSourceObservation } from "./current-development-source-scenarios.js";
import { safeRecord, traceBrowserSession } from "./runners/browser-case-slice-evidence.js";

export type FixedSourceCoverageGap = {
  source: "GOOGLE_SEARCH" | "GOOGLE_DETAILS" | "WEBSITE" | "TABLECHECK" | "BROWSER";
  stage: string;
  request: string;
  candidateId?: string;
  reason: string;
};

export type FixedSourceObservationTime = {
  source: "GOOGLE" | "WEBSITE" | "TABLECHECK";
  stage: string;
  observedAt: string;
  sampleCapturedAt?: string;
  candidateId?: string;
};

export type FixedSourceCalls = {
  search: number;
  facts: number;
  availability: number;
  namedPlace: number;
  website: number;
  browserNavigations: string[];
  /** Redacted source chronology from the production browser adapters. */
  browserTrace: Array<{ sequence: number; at: string; kind: string; detail: unknown }>;
  coverageGaps: FixedSourceCoverageGap[];
  observations: FixedSourceObservationTime[];
};

export interface FixedSourceClock { now(): Date | string; }

/** Constructed model transport, not a fact oracle: select only complete page rows. */
export function scriptedSourceFacts(request: ModelRequest): ModelResponse | undefined {
  if (request.purpose !== "restaurant_source_facts") return undefined;
  if (request.promptVersion !== "2" || request.outputSchema.version !== "2") throw new Error("Expected Source facts Prompt/Schema 2");
  const input = JSON.parse(request.messages.find(message => message.role === "user")!.content) as {
    sourceDocument: { statements: Array<{ id: string; text: string; sourceRole: string }> };
  };
  const selections = input.sourceDocument.statements.flatMap(statement => {
    if (statement.sourceRole !== "SOURCE_TEXT" || !/\b(?:course|lunch set|chef['’]s omakase dinner)\b/iu.test(statement.text)) return [];
    return [{ firstStatementId: statement.id, lastStatementId: statement.id, role: "COURSE",
      priceStatementId: /(?:JPY|[¥￥])\s*\d|\d[\d,]*\s*円/u.test(statement.text) ? statement.id : "" }];
  });
  return { invocationId: "scripted-source-facts", provider: "FIXTURE", model: "current-page-statements",
    outputText: JSON.stringify({ selections }), finishReason: "TOOL_CALLS", latencyMs: 0 };
}

/** The fixed omakase control cites actual menu prose, never the outlet name. */
export function scriptedOmakaseJudgment(request: ModelRequest): ModelResponse {
  const input = JSON.parse(request.messages.find(message => message.role === "user")!.content) as {
    sourceDocuments: Array<{ id: string; statements: Array<{ id: string; text: string }> }>;
  };
  const selected = input.sourceDocuments.flatMap(document => document.statements
    .filter(statement => /\bomakase\b/iu.test(statement.text) && /\bcourse\b|chef['’]s omakase dinner/iu.test(statement.text))
    .map(statement => ({ documentId: document.id, statementIds: [statement.id] })))[0];
  return { invocationId: "scripted-omakase-judgment", provider: "FIXTURE", model: "current-page-statements", finishReason: "TOOL_CALLS", latencyMs: 0,
    outputText: JSON.stringify({ sourceSelections: selected ? [selected] : [], judgments: selected ? [{ criterion: "omakase", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: [selected.documentId] }] : [] }) };
}

function gap(record: FixedSourceCoverageGap): Error {
  return Object.assign(new Error("Fixed-source coverage gap: " + record.reason), {
    code: "FIXTURE_COVERAGE_GAP",
    fixedSourceCoverageGap: record,
  });
}

function tokens(value: string): string[] {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean).map((token) => token.endsWith("s") ? token.slice(0, -1) : token);
}

function discoverable(observation: FixedSourceObservation, query: string): boolean {
  const queryTokens = new Set(tokens(query));
  return observation.searchTerms.some((term) => tokens(term).some((token) => token.length > 2 && queryTokens.has(token)));
}

function asIso(clock: FixedSourceClock): string {
  const value = clock.now();
  return typeof value === "string" ? value : value.toISOString();
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function matchesSelector(html: string, selector: string): boolean {
  // The production Adapter waits for a visible Venue Availability region that
  // has no skeleton descendant.  This controlled transport has no skeleton
  // renderer, so retain the observed region selector rather than treating its
  // harmless readiness predicate as an unavailable fixture control.
  const value = selector.trim().replace(/:not\(:has\([^)]*\)\)$/, "");
  if (!value) return false;
  const id = value.match(/^#([\w-]+)$/);
  if (id) return new RegExp("\\bid=[\"'][^\"']*\\b" + escapeRegExp(id[1]!) + "\\b[^\"']*[\"']", "i").test(html);
  const className = value.match(/^\.([\w-]+)$/);
  if (className) return new RegExp("\\bclass=[\"'][^\"']*\\b" + escapeRegExp(className[1]!) + "\\b[^\"']*[\"']", "i").test(html);
  const hrefContains = value.match(/^a\[href\*=[\"']([^\"']+)[\"']\]$/);
  if (hrefContains) return new RegExp("<a\\b[^>]*\\bhref=[\"'][^\"']*" + escapeRegExp(hrefContains[1]!) + "[^\"']*[\"']", "i").test(html);
  const dataEquals = value.match(/^\[data-([\w-]+)=[\"']([^\"']+)[\"']\]$/);
  if (dataEquals) return new RegExp("\\bdata-" + dataEquals[1]! + "=[\"']" + escapeRegExp(dataEquals[2]!) + "[\"']", "i").test(html);
  return false;
}

function googlePlace(observation: FixedSourceObservation,discovery=false) {
  const source = observation.google;
  return {
    id: source.placeId,
    displayName: { text: source.displayName },
    formattedAddress: source.address,
    location: source.coordinates,
    types: ["restaurant"],
    nationalPhoneNumber: source.phone,
    // LOCAL_CONSTRUCTION: availability-positive controls explicitly publish
    // the configured source entrance in Text Search; Details keeps the website.
    websiteUri: discovery&&source.discoveryWebsiteUri?source.discoveryWebsiteUri:(discovery&&!source.websiteUri.startsWith("https://www.tablecheck.com/")||!observation.websiteFacts)&&observation.tableCheck&&observation.availability
      ? "https://www.tablecheck.com"+observation.tableCheck.reservationEntryPath : source.websiteUri,
    googleMapsUri: source.googleMapsUri,
  };
}

/**
 * Production Google/fact/browser adapters backed by a small offline source
 * environment. Transport is replaced; interpretation, grounding, Router and
 * browser availability are the production path. Each observation reads the
 * injected controlled clock at the point it is actually acquired.
 */
export function createCurrentDevelopmentFixedSources(
  scenario: CurrentDevelopmentSourceScenario,
  clock: FixedSourceClock,
  model: ModelGateway,
  limits: LiveReadInvestigationBudget = LIVE_READ_DEBUG_INVESTIGATION_BUDGET,
) {
  const observations = [...scenario.observations];
  const byId = new Map(observations.map((item) => [item.google.placeId, item]));
  const calls: FixedSourceCalls = {
    search: 0, facts: 0, availability: 0, namedPlace: 0, website: 0,
    coverageGaps: [], observations: [], browserNavigations: [], browserTrace: [],
  };
  const observed = (
    source: FixedSourceObservationTime["source"],
    stage: string,
    options: Pick<FixedSourceObservationTime, "candidateId" | "sampleCapturedAt"> = {},
  ) => {
    const event = { source, stage, observedAt: asIso(clock), ...options };
    calls.observations.push(event);
    return event.observedAt;
  };
  const sourceGap = (record: FixedSourceCoverageGap) => {
    calls.coverageGaps.push(record);
    return gap(record);
  };
  const client = new GooglePlacesClient({ apiKey: "mock-key", fetchImplementation: async (url, init) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { textQuery?: string; includedTypes?: string[]; locationRestriction?: {circle?:{center:{latitude:number;longitude:number};radius:number}} };
      const query = body.textQuery ?? "";
      const landmark = observations.find((item) => item.landmark && tokens(item.landmark.displayName).join("") === tokens(query).join(""))?.landmark;
      if (landmark) {
        calls.namedPlace++;
        observed("GOOGLE", "LANDMARK");
        return new Response(JSON.stringify({ places: [{ id: "landmark:" + landmark.displayName, displayName: { text: landmark.displayName }, location: landmark.coordinates, types: ["train_station"] }] }), { status: 200 });
      }
      calls.search++;
      observed("GOOGLE", "SEARCH");
      const circle = String(url).endsWith('/places:searchNearby') ? body.locationRestriction?.circle : undefined;
      const matches = circle ? observations.filter(item => {
        const point=item.google.coordinates;
        const dy=(point.latitude-circle.center.latitude)*111_320;
        const dx=(point.longitude-circle.center.longitude)*111_320*Math.cos(circle.center.latitude*Math.PI/180);
        return body.includedTypes?.includes('restaurant') && Math.hypot(dx,dy)<=circle.radius;
      }) : observations.filter(item=>discoverable(item,query));
      return new Response(JSON.stringify({ places: matches.map(observation=>googlePlace(observation,true)) }), { status: 200 });
    }
    const placeId = decodeURIComponent(String(url).split("/").at(-1) ?? "");
    const source = byId.get(placeId);
    if (!source) throw sourceGap({
      source: "GOOGLE_DETAILS", stage: "DETAILS", request: "placeId=" + placeId,
      ...(placeId ? { candidateId: placeId } : {}), reason: "Google details are not configured for this legal candidate",
    });
    calls.facts++;
    observed("GOOGLE", "DETAILS", { candidateId: source.google.placeId, ...(source.websiteFacts ? { sampleCapturedAt: source.websiteFacts.sampleCapturedAt } : {}) });
    if (source.google.detailStatus === "NOT_FOUND") return new Response(JSON.stringify({ error: "configured not found" }), { status: 404 });
    // Constructed Details may expose the existing public reservation entrance
    // when this scenario has no separately configured official-site document.
    // The menu stays on that page, never manufactured on the identity guide.
    const details = googlePlace(source);
    if (!source.websiteFacts && source.tableCheck && source.availability) {
      details.websiteUri = "https://www.tablecheck.com" + source.tableCheck.reservationEntryPath;
    }
    return new Response(JSON.stringify(details), { status: 200 });
  } });
  let browserTraceSequence = 0,sourceStage="";
  const recordBrowserTrace = (kind: string, detail: unknown) => {
    const sequence = ++browserTraceSequence;
    calls.browserTrace.push({ sequence, at: asIso(clock), kind, detail: safeRecord(detail) });
    return sequence;
  };
  const rawBrowser: BrowserRuntime = { readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession: async () => {
    let query="",selectedDate="",selectedGuests="";
    let page: BrowserSnapshot | undefined;
    const sourceForTableCheckPath = (pathname: string) => observations.find((item) => {
      const path = item.tableCheck?.reservationEntryPath;
      return path !== undefined && (pathname === path || pathname === path + "/reserve" || pathname === path + "/reserve/landing");
    });
    const session:import("../../../infrastructure/browser/browser-runtime.js").BrowserSession={
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: asIso(clock),readNetworkBoundary:"INSTALLED" },
      navigate: async (target: string) => {
        calls.browserNavigations.push(target);
        const url = new URL(target);
        recordBrowserTrace("MOCK_DOCUMENT_READ",{mode:"LOCAL_CONSTRUCTION",networkRequests:[{outcome:"ADMITTED",origin:url.origin,pathname:url.pathname,method:"GET",resourceType:"document",queryKeys:[...url.searchParams.keys()]}]});
        const websiteSource = observations.find((item) => item.google.websiteUri === target);
        if (websiteSource && url.hostname !== "www.tablecheck.com") {
          if (!websiteSource.websiteFacts) throw sourceGap({
            source: "WEBSITE", stage: "FACTS", request: target, candidateId: websiteSource.google.placeId,
            reason: "Website facts are not configured for this legal source page",
          });
          calls.website++;
          observed("WEBSITE", "FACTS", { candidateId: websiteSource.google.placeId, sampleCapturedAt: websiteSource.websiteFacts.sampleCapturedAt });
          // LOCAL_CONSTRUCTION: the same fixture merchant explicitly publishes
          // its independent TableCheck entrance; area routing cannot infer one.
          page = { url: target, title: websiteSource.google.displayName, text: websiteSource.google.displayName,
            html: "<main id=\"restaurant-facts\"><script type=\"application/ld+json\">" + JSON.stringify({ "@type": "Restaurant", name: websiteSource.google.displayName, address: websiteSource.google.address, servesCuisine: websiteSource.websiteFacts.types, openingHours: websiteSource.websiteFacts.hours }) + "</script>" + (websiteSource.tableCheck ? '<a href="https://www.tablecheck.com'+websiteSource.tableCheck.reservationEntryPath+'">Reservation entrance</a>' : '') + "</main>" };
          return;
        }
        if (url.hostname !== "www.tablecheck.com") throw sourceGap({
          source: "BROWSER", stage: "NAVIGATE", request: target, reason: "Browser origin " + url.origin + " is not configured",
        });
        if (url.pathname === "/en/japan/search") {
          const requested = url.searchParams.get("search_text") ?? "";
          const rawMatches = requested ? observations.filter((item) => tokens(item.google.displayName).every((token) => tokens(requested).includes(token))) : observations;
          const matches = rawMatches.filter((item) => item.tableCheck?.discoveryListed !== false);
          if (requested && !matches.length && !rawMatches.some((item) => item.tableCheck?.discoveryListed === false)) throw sourceGap({
            source: "TABLECHECK", stage: "DISCOVERY", request: target, reason: "TableCheck discovery has no configured outlet for " + requested,
          });
          observed("TABLECHECK", "DISCOVERY");
          const links = matches.flatMap((item) => item.tableCheck ? ["<a href=\"" + item.tableCheck.reservationEntryPath + "?search_text=" + encodeURIComponent(requested) + "\">" + item.tableCheck.displayName + "</a>"] : []).join("");
          page = { url: target, title: "Map search", text: matches.length ? matches.map((item) => item.google.displayName).join(" ") : "0 venues found", html: "<section id=\"tablecheck-results\">" + links + "</section>" };
          return;
        }
        const source = sourceForTableCheckPath(url.pathname);
        if (!source || !source.tableCheck) throw sourceGap({
          source: "TABLECHECK", stage: "PAGE", request: target, reason: "TableCheck page " + url.pathname + " is not configured",
        });
        const tableCheck = source.tableCheck;
        observed("TABLECHECK", "IDENTITY", { candidateId:source.google.placeId });
        const inventory = source.availability;
        if(!inventory){page={url:target,title:tableCheck.displayName,text:tableCheck.displayName,
          html:`<h1>${tableCheck.displayName}</h1><p>${tableCheck.address}</p><a href="tel:${tableCheck.phone}">${tableCheck.phone}</a>`};return;}
        if(!selectedDate)selectedDate=inventory.date;
        if(!selectedGuests)selectedGuests=String(inventory.partySize);
        // Constructed public menu page: preserve the independently authored
        // TableCheck identity, not the Google identity. Layout references:
        // dom-change/tablecheck-detail-nakamata.html.gz, uncompressed SHA
        // 6b7e758fb3135f057a3aec19cf844971b24fc8cb65a7b34cd72decf70dc7eba0;
        // restaurant-prices/tablecheck-recorded-menu.html, SHA
        // 2a625d0641b5b2824170a4a263c9ac68aac3017057b14afac84cdefd327f1f68.
        // These are structure references, not replayed facts for synthetic shops.
        const identityHtml = "<script type=\"application/ld+json\">"+JSON.stringify({"@type":"Restaurant",name:tableCheck.displayName,address:tableCheck.address,telephone:tableCheck.phone})+"</script><h1>" + tableCheck.displayName + "</h1><p>" + tableCheck.address + "</p><a href=\"tel:" + tableCheck.phone.replace(/\s/g, "") + "\">" + tableCheck.phone + "</a>";
        const publicMenu = "<section><p>" + inventory.menuText + "</p></section>";
        const identityText = [tableCheck.displayName, tableCheck.address, tableCheck.phone, inventory.menuText];
        // LOCAL_CONSTRUCTION embedded guide widget, using the structure of
        // src/integrations/tablecheck/fixtures/ginza-bistro-empty.json (2026-10-09).
        // No saved stock response is relocated and no reserve document is opened.
        if(selectedDate!==inventory.date||selectedGuests!==String(inventory.partySize))throw sourceGap({source:"TABLECHECK",stage:"AVAILABILITY",candidateId:source.google.placeId,
          request:target+" [start_date="+selectedDate+",num_people="+selectedGuests+"]",reason:"No fixture inventory matches the requested date or party size"});
        if(sourceStage!=="FACTS")calls.availability++;
        observed("TABLECHECK", "AVAILABILITY", { candidateId: source.google.placeId, sampleCapturedAt: inventory.sampleCapturedAt });
        const slots = inventory.visibleSlots.map((slot) => "<a href=\"" + tableCheck.reservationEntryPath + "/reserve?start_date=" + inventory.date + "&amp;pax=" + inventory.partySize + "&amp;start_time=" + slot + "\"><button class=\"time-slot is-available\" data-time=\"" + slot + "\">" + slot + "</button></a>").join("");
        page = { url: target, title: tableCheck.displayName, text: [...identityText,inventory.date,String(inventory.partySize)+" guests",...(inventory.status==="UNAVAILABLE"?["There are no available tables for this time period"]:inventory.visibleSlots)].join("\n"),
          html: identityHtml + publicMenu + `<form><label>Date<input type="date" name="reservation[start_date]" value="${selectedDate}"></label><label>Guests<select name="reservation[num_people_adult]"><option selected value="${selectedGuests}">${selectedGuests} guests</option></select></label></form>` + "<div data-testid=\"Venue Availability\" data-selected-date=\"" + inventory.date + "\" data-pax=\"" + inventory.partySize + "\">" +
            (inventory.status === "UNAVAILABLE" ? "<p>There are no available tables for this time period</p><section id=\"availability-results\" data-availability-state=\"empty\" data-date=\"" + inventory.date + "\" data-pax=\"" + inventory.partySize + "\"></section>" : "<section id=\"availability-results\" data-availability-state=\"complete\">" + slots + "</section>") + "</div>" };
      },
      snapshot: async () => { if (!page) throw sourceGap({ source: "BROWSER", stage: "SNAPSHOT", request: "<none>", reason: "Browser snapshot occurred before navigation" }); return page; },
      observeControls: async ():Promise<BrowserPageControl[]> => {
        if(!page)return[];
        const u=new URL(page.url);
        const search:BrowserPageControl[]=[
          {id:"query",stableKey:"query",kind:"INPUT",role:"searchbox",type:"search",label:"Restaurant search",value:query,structure:{tag:"INPUT",name:"search_text",classes:[],dialogLabel:"",formClass:"",sliderCount:0},formMethod:"GET",formObservation:{owner:"source-form",visibleLines:["Restaurant search","Search"]},visible:true,disabled:false},
          {id:"submit",stableKey:"submit",kind:"BUTTON",role:"button",label:"Search",type:"submit",formMethod:"GET",formObservation:{owner:"source-form",visibleLines:["Restaurant search","Search"]},visible:true,disabled:false}];
        if(u.pathname==="/en/japan/search")return search;
        const source=sourceForTableCheckPath(u.pathname),inventory=source?.availability;if(!inventory)return[];
        return[...search,
          {id:"date",stableKey:"date",kind:"INPUT",role:"textbox",label:"Date",type:"date",value:selectedDate,structure:{tag:"INPUT",name:"reservation[start_date]",classes:[],dialogLabel:"",formClass:"",sliderCount:0},visible:true,disabled:false},
          {id:"guests",stableKey:"guests",kind:"SELECT",role:"combobox",label:"Guests",value:selectedGuests,options:[1,2,3,4,5,6].map(n=>({value:String(n),label:n+" guests",selected:String(n)===selectedGuests,disabled:false})),visible:true,disabled:false},
          {id:"region",stableKey:"region",kind:"REGION",role:"region",label:"Venue Availability",visible:true,disabled:false},
        ];
      },
      click:async id=>{if(id!=="submit")throw sourceGap({source:"BROWSER",stage:"CLICK",request:id,reason:"Not a current public submit"});await session.navigate("https://www.tablecheck.com/en/japan/search?search_text="+encodeURIComponent(query));},
      fill:async(id,value)=>{if(id==="query"){query=value;return;}if(id!=="date"||!page)throw sourceGap({source:"BROWSER",stage:"FILL",request:id,reason:"Not a current field"});selectedDate=value;await session.navigate(page.url);},
      select:async(id,value)=>{if(id!=="guests"||!page)throw sourceGap({source:"BROWSER",stage:"SELECT",request:id,reason:"Not a current option"});selectedGuests=value;await session.navigate(page.url);return[value];},
      waitForSettled: async () => true,
      waitFor: async (selector) => {
        if (!page || !matchesSelector(page.html, selector)) throw sourceGap({
          source: "BROWSER", stage: "WAIT_FOR", request: selector, reason: "The requested browser wait target is not present in the configured page",
        });
      },
      screenshot: async () => new Uint8Array(), close: async () => {},
    };return session;
  } };
  const browser: BrowserRuntime = { readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession: async (input) => traceBrowserSession(fixtureGetSession(await rawBrowser.openSession(input)), "TABLECHECK", recordBrowserTrace) };
  const assembly = createLiveReadAssembly({ ...limits, packs: [googlePlacesDiscoveryPack] }, {
    google: client, browser, model, clock: { now: () => new Date(asIso(clock)) },
    onBrowserDiagnostic: diagnostic => {sourceStage=diagnostic.stage;recordBrowserTrace("EXECUTOR_DIAGNOSTIC", diagnostic);},
  });
  return {
    ...assembly,
    browser,
    calls,
  };
}
