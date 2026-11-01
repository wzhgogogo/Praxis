import assert from "node:assert/strict";
import type { ModelGateway, ModelRequest } from "../../../core/model/contracts.js";
import type { RestaurantCandidate, RestaurantCandidateFactRead } from "../../../domains/restaurant/contracts.js";
import type { RestaurantPageQuestionRequest } from "../../../domains/restaurant/page-question.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { composeNativeRestaurantRead } from "../../restaurant-search/native-read-composition.js";

// Minimal synthetic merchant, 2026-11-01; no historical run, pre-bound page or network.
export const captureReadAt = "2026-11-01T10:00:00.000Z";
export const captureQuote = "Credit cards accepted: Visa and MasterCard.";
export function pageQuestionCaptureFixture(source: "GOOGLE" | "TABELOG" | "TABLECHECK", actualRuntime?: BrowserRuntime, websiteUrl = "https://capture.example/venue") {
  const url = source === "GOOGLE" ? websiteUrl : source === "TABELOG"
    ? "https://tabelog.com/en/tokyo/A1301/A130101/13111111/" : "https://www.tablecheck.com/en/capture-venue";
  const candidate: RestaurantCandidate = {restaurant:{id:"capture-merchant",outletName:"Capture Sushi",address:"1-1 Ginza, Tokyo",provenance:{},sourceIds:source === "GOOGLE" ? {googleWebsiteUri:url}
    : source === "TABELOG" ? {tabelog:"tokyo/A1301/A130101/13111111",tabelogNativeDetailUri:url} : {tablecheck:"capture-venue",tablecheckNativeGuideUri:url}},matchReasons:[],warnings:[],executionConfidence:"HIGH"};
  const page: BrowserSnapshot = {url,title:candidate.restaurant.outletName,text:[candidate.restaurant.outletName,candidate.restaurant.address,captureQuote].join("\n"),settlement:"SETTLED",
    html:`<link rel="canonical" href="${url}"><script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name:candidate.restaurant.outletName,address:candidate.restaurant.address})}</script><h1>${candidate.restaurant.outletName}</h1><p>${candidate.restaurant.address}</p><p>${captureQuote}</p>`};
  const seen = {requests:[] as ModelRequest[],navigations:[] as string[],googleReads:0,onNavigate:undefined as (()=>void)|undefined};
  const model: ModelGateway = {async complete(request) {
    seen.requests.push(structuredClone(request));
    let output: unknown;
    if (request.purpose === "browser_read_decide") output={action:"COMPLETE",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"Hand the observed merchant page to code; no business conclusion."};
    else {
      assert.equal(request.purpose,"restaurant_page_question","capture must not call HARD or menu interpretation");
      const documents=JSON.parse(request.messages[1]!.content).sourceDocuments as Array<{id:string;statements:Array<{id:string;text:string}>}>;
      const document=documents.find(d=>d.statements.some(s=>s.text===captureQuote));
      output=document ? {status:"ANSWERED",answer:"The page states that Visa and MasterCard are accepted.",sensitiveCategory:"NONE",sourceConflict:false,
        citations:[{documentId:document.id,statementId:document.statements.find(s=>s.text===captureQuote)!.id,quote:captureQuote}]}
        : {status:"NOT_STATED",answer:null,sensitiveCategory:"NONE",sourceConflict:false,citations:[]};
    }
    return {invocationId:"capture-fixture",provider:"FIXTURE",model:"fixture",finishReason:"TOOL_CALLS",latencyMs:0,outputText:JSON.stringify(output)};
  }};
  const runtime: BrowserRuntime = actualRuntime ?? {async openSession(input) {return {
    metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:captureReadAt},
    async navigate(target) {seen.navigations.push(target);seen.onNavigate?.();input.signal.throwIfAborted();},async snapshot(){input.signal.throwIfAborted();return structuredClone(page);},
    async observeControls(){return[];},async click(){},async fill(){},async select(){return[];},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){},
  };}};
  const google = {executionRoute:"STRUCTURED_ADAPTER" as const,async inspectFacts(): Promise<RestaurantCandidateFactRead> {
    assert.equal(source,"GOOGLE","native page acquisition must not invoke Google");seen.googleReads++;
    return {evidence:[{evidenceId:"capture-google-fact",kind:"RESTAURANT_FACT",provider:"GOOGLE_PLACES",candidateId:candidate.restaurant.id,sourceEntityId:"fixture-place",observedAt:captureReadAt,requestFingerprint:"fixture",claims:{...(candidate.restaurant.sourceIds.googleWebsiteUri?{websiteUri:candidate.restaurant.sourceIds.googleWebsiteUri}:{})}}],
      factChecks:{[candidate.restaurant.id]:{status:"COMPLETED",checkedAt:captureReadAt,evidenceIds:["capture-google-fact"]}},metadata:{provider:"GOOGLE_PLACES",route:"STRUCTURED_ADAPTER",latencyMs:0}};
  }} as unknown as Parameters<typeof composeNativeRestaurantRead>[0];
  const limits={maxAutomaticElapsedMs:30_000,maxModelCallsPerCandidate:3,maxModelCallsTotal:3,maxOperationsPerCandidate:24};
  const assembly=composeNativeRestaurantRead(google,runtime,model,{totalModelCalls:0},undefined,undefined,()=>captureReadAt,limits,limits);
  const input: RestaurantPageQuestionRequest = {requestId:"capture-question",question:"Do they accept credit cards?",candidate,
    intent:{timezone:"Asia/Tokyo",target:{goal:"AVAILABILITY",query:"Capture Sushi"},area:{query:"Ginza"},date:"2026-11-11",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"},criteria:[]},
    readContext:{runId:"capture-run",startedAt:captureReadAt,deadlineAt:"2026-11-01T10:01:00.000Z"}};
  return {assembly,input,page,seen,url};
}
