import assert from "node:assert/strict";
import test from "node:test";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { composeNativeRestaurantRead } from "../restaurant-search/native-read-composition.js";
import { NativeSourceFactRead } from "./native-source-facts.js";
import { assessRestaurantConditions } from "../../domains/restaurant/condition-states.js";
const url="https://tabelog.com/en/tokyo/A1301/A130101/13111111/",time="2026-10-29T10:00:00Z";
const candidate={restaurant:{id:"quoted-merchant",outletName:"Public Venue",address:"1 Ginza, Tokyo",sourceIds:{tabelog:"tokyo/A1301/A130101/13111111",tabelogNativeDetailUri:url},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH" as const};
const text="We serve sushi cuisine.";
const page={url,title:"Public Venue",text:[candidate.restaurant.outletName,candidate.restaurant.address,text].join("\n"),html:`<link rel="canonical" href="${url}"><script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name:candidate.restaurant.outletName,address:candidate.restaurant.address})}</script><h1>Public Venue</h1><p>${text}</p>`,settlement:"SETTLED" as const};
const runtime:BrowserRuntime={async openSession(){return {metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:time},async navigate(target){assert.equal(target,url);},async snapshot(){return page;},async observeControls(){return[];},async click(){},async fill(){},async select(){return[];},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};}};
const limits={maxAutomaticElapsedMs:30000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24};
const intent={timezone:"Asia/Tokyo" as const,area:{query:"Ginza"},criteria:[{text:"sushi",strength:"HARD" as const,polarity:"POSITIVE" as const}]};

test("shared Web/Hybrid fact composition answers from class-free merchant prose through model citations",async()=>{
 const calls:string[]=[];
 const gateway:ModelGateway={async complete(request){
  calls.push(request.purpose);const data=JSON.parse(request.messages[1]!.content);
  let output;
  if(request.purpose==="restaurant_source_facts"){
   const row=data.sourceDocument.statements.find((s:{text:string})=>s.text===text);
   output={selections:[{firstStatementId:row.id,lastStatementId:row.id,role:"CATEGORY",priceStatementId:""}]};
  }else{
   assert.equal(request.purpose,"restaurant_fact_judgment");const doc=data.sourceDocuments[0];const row=doc.statements.find((s:{text:string})=>s.text===text);
   output={sourceSelections:[{documentId:doc.id,statementIds:[row.id]}],judgments:[{criterion:"sushi",outcome:"SUPPORTED",scope:"RESTAURANT_CATEGORY_TYPE",evidenceIds:[doc.id]}]};
  }
  return {invocationId:"source-fixture",provider:"FIXTURE",model:"fixture",finishReason:"TOOL_CALLS",latencyMs:0,outputText:JSON.stringify(output)};
 }};
 const google={async inspectFacts(){throw Error("native-bound reads must not invoke Google");}} as unknown as Parameters<typeof composeNativeRestaurantRead>[0];
 const assembly=composeNativeRestaurantRead(google,runtime,gateway,{totalModelCalls:0},undefined,undefined,()=>time,limits,limits);
 const result=await assembly.facts.inspectFacts({candidateIds:[candidate.restaurant.id],candidates:[candidate],intent,readRunId:"g3-quoted-facts"},new AbortController().signal);
 assert.equal(assessRestaurantConditions(intent,result.evidence)[0]?.status,"MET","the actual shared composition must retain a verbatim source role when private fields are absent");
 assert.deepEqual(calls,["restaurant_source_facts","restaurant_fact_judgment"]);
 assert.ok(result.evidence.some(f=>f.sourceFieldQuotes?.some(q=>q.quote===text&&q.sourceUrl===url)),"current same-outlet quotation reaches the real evidence result");
});

test("G1 page capture keeps identity and source text without spending a fact or menu model call",async()=>{
 let judgments=0,quotes=0,pages=0;
 const sourceModel:ModelGateway={async complete(){quotes++;throw Error("question acquisition must not interpret menus");}};
 const reader=new NativeSourceFactRead(limits,runtime,{async judge(){judgments++;return {evidence:[]};}},()=>time,undefined,undefined,undefined,undefined,()=>{pages++;},sourceModel);
 const result=await reader.inspectFacts({candidateIds:[candidate.restaurant.id],candidates:[candidate],intent,readRunId:"question-run",capturePagesOnly:true},new AbortController().signal);
 assert.equal(pages,1,"existing HIGH identity verification precedes the source observer");
 assert.equal(judgments,0,"a page question does not repeat the original HARD interpretation");assert.equal(quotes,0);
 assert.ok(result.evidence.some(e=>e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH"));
});
