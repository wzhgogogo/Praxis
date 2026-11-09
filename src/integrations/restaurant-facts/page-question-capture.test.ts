import assert from "node:assert/strict";
import test from "node:test";
import { captureQuote, captureReadAt, pageQuestionCaptureFixture } from "./fixtures/page-question-capture.js";

for (const source of ["GOOGLE","TABELOG","TABLECHECK"] as const) test(`G1 ${source} acquires a bound page without a HARD gap through the production composition`,async()=>{
  const f=pageQuestionCaptureFixture(source);
  const result=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
  assert.equal(result.status,"ANSWERED",`${source} must reach the question model from a freshly read page`);
  assert.ok(result.status==="ANSWERED");assert.equal(result.candidateId,f.input.candidate.restaurant.id);
  assert.deepEqual(result.citations.map(c=>[c.text,c.url,c.readAt]),[[captureQuote,f.url,captureReadAt]],"literal merchant text and read metadata must reach the answer");
  assert.deepEqual(f.seen.navigations,[f.url]);
  assert.equal(f.seen.requests.filter(r=>r.purpose==="restaurant_page_question").length,1);
  assert.ok(f.seen.requests.every(r=>["browser_read_decide","restaurant_page_question"].includes(r.purpose)),"page capture never repeats original HARD/menu judgment");
  assert.deepEqual(f.input.intent.criteria,[],"a page question does not invent a HARD criterion");
});

test("G1 page capture with no merchant statement yields NOT_STATED after reading, rather than NO_BOUND_PAGE",async()=>{
  const f=pageQuestionCaptureFixture("GOOGLE");f.page.text=f.page.text.replace(captureQuote,"");f.page.html=f.page.html.replace(captureQuote,"");
  const result=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
  assert.equal(result.status,"NOT_STATED","actual absence can be stated only after a bound page reaches the question model");
  assert.deepEqual(result.checkedPages,[{url:f.url,readAt:captureReadAt}]);
  assert.equal(f.seen.requests.filter(r=>r.purpose==="restaurant_page_question").length,1);
});

test("G1 same-name foreign outlet pages produce no answerable page",async t=>{
  for(const source of ["GOOGLE","TABELOG","TABLECHECK"] as const) await t.test(source,async()=>{
    const f=pageQuestionCaptureFixture(source);const other=f.url.replace(/13111111|capture-venue|\/venue$/u,part=>part==="13111111"?"13999999":part==="capture-venue"?"other-venue":"/other-venue");
    f.page.url=other;f.page.html=f.page.html.replaceAll(f.url,other).replaceAll("1-1 Ginza, Tokyo","99 Kyoto, Kyoto");f.page.text=f.page.text.replace("1-1 Ginza, Tokyo","99 Kyoto, Kyoto");
    const result=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
    assert.equal(result.status,"UNVERIFIED","same name cannot bypass exact outlet binding");assert.deepEqual(result.checkedPages,[]);
    assert.equal(f.seen.requests.filter(r=>r.purpose==="restaurant_page_question").length,0);
  });
});

test("G1 a genuinely read previous-run page cannot replace a failed fresh-run acquisition",async()=>{
  const f=pageQuestionCaptureFixture("TABELOG");
  await f.assembly.facts.inspectFacts({capturePagesOnly:true,candidateIds:[f.input.candidate.restaurant.id],candidates:[f.input.candidate],intent:f.input.intent,readRunId:"previous-run"},new AbortController().signal);
  assert.deepEqual(f.seen.navigations,[f.url],"the old cache came from the production reader, not a hand-bound page");
  f.seen.onNavigate=()=>{throw Error("fixture fresh read is unavailable");};
  const result=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
  assert.equal(result.status,"UNVERIFIED");assert.deepEqual(result.checkedPages,[]);
  assert.equal(f.seen.requests.filter(r=>r.purpose==="restaurant_page_question").length,0,"old-run text must not reach the answer model");
  assert.equal(f.seen.navigations.length,2,"a different run requires a new read");
});

test("G1 independent deadline and cancellation still constrain fresh acquisition",async t=>{
  await t.test("deadline already exhausted",async()=>{
    const f=pageQuestionCaptureFixture("GOOGLE");f.input.readContext.deadlineAt=captureReadAt;
    const result=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
    assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED");assert.deepEqual(result.checkedPages,[]);
    assert.equal(f.seen.googleReads,0);assert.deepEqual(f.seen.navigations,[]);assert.deepEqual(f.seen.requests,[]);
  });
  await t.test("cancel during acquisition; next question has a fresh scope",async()=>{
    const f=pageQuestionCaptureFixture("GOOGLE");const controller=new AbortController();f.seen.onNavigate=()=>controller.abort(new DOMException("Fixture cancellation","AbortError"));
    await assert.rejects(()=>f.assembly.questions.answerQuestion(f.input,controller.signal),{name:"AbortError"});
    assert.equal(f.seen.requests.filter(r=>r.purpose==="restaurant_page_question").length,0);
    f.seen.onNavigate=undefined;
    const next=await f.assembly.questions.answerQuestion({...f.input,requestId:"next-question"},new AbortController().signal);
    assert.equal(next.status,"ANSWERED","cancellation must not consume another question's page or model budget");
  });
});

test("G1 missing website stays unknown without a HARD model; ordinary no-gap facts still skip the website",async()=>{
  const ordinary=pageQuestionCaptureFixture("GOOGLE");
  await ordinary.assembly.facts.inspectFacts({candidateIds:[ordinary.input.candidate.restaurant.id],candidates:[ordinary.input.candidate],intent:ordinary.input.intent,readRunId:"ordinary"},new AbortController().signal);
  assert.deepEqual(ordinary.seen.navigations,[],"ordinary fact reads remain gap-driven");assert.deepEqual(ordinary.seen.requests,[]);
  const missing=pageQuestionCaptureFixture("GOOGLE");delete missing.input.candidate.restaurant.sourceIds.googleWebsiteUri;
  const result=await missing.assembly.questions.answerQuestion(missing.input,new AbortController().signal);
  assert.ok(result.status==="UNVERIFIED"&&result.reason==="NO_BOUND_PAGE");assert.deepEqual(result.checkedPages,[]);
  assert.deepEqual(missing.seen.navigations,[]);assert.deepEqual(missing.seen.requests,[],"capture-only with no entry does not fall into the no-candidates HARD branch");
});

test("capture-only bypasses the composition's HARD judge in both website and no-entry branches",async t=>{
  const {GoogleThenWebsiteFactRead}=await import("./google-then-website-facts.js");
  for(const hasEntry of [true,false])await t.test(hasEntry?"website entry":"no website entry",async()=>{
    const f=pageQuestionCaptureFixture("GOOGLE");const id=f.input.candidate.restaurant.id;
    if(!hasEntry)delete f.input.candidate.restaurant.sourceIds.googleWebsiteUri;
    const facts={evidence:[],factChecks:{[id]:{status:"COMPLETED" as const,checkedAt:captureReadAt,evidenceIds:[]}},metadata:{provider:"GOOGLE_PLACES" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};
    let websites=0,judgments=0;
    const chain=new GoogleThenWebsiteFactRead({executionRoute:"STRUCTURED_ADAPTER",async inspectFacts(){return structuredClone(facts);}},
      {executionRoute:"GENERIC_BROWSER",async inspectFacts(request){assert.equal(request.capturePagesOnly,true);websites++;return {...structuredClone(facts),metadata:{provider:"RESTAURANT_WEBSITE",route:"GENERIC_BROWSER",latencyMs:0}};}},
      {async judge(){judgments++;return {evidence:[]};}});
    await chain.inspectFacts({capturePagesOnly:true,candidateIds:[id],candidates:[f.input.candidate],intent:f.input.intent,readRunId:"capture-run"},new AbortController().signal);
    assert.equal(websites,hasEntry?1:0,"capture controls the existing website branch independently of HARD gaps");
    assert.equal(judgments,0,"capture-only must not invoke either outer HARD judgment branch");
  });
});

test("G1 refreshes a pending fact-cache page before answering",async()=>{
 const f=pageQuestionCaptureFixture("TABELOG");f.page.settlement="PENDING";
 await f.assembly.facts.inspectFacts({candidateIds:[f.input.candidate.restaurant.id],candidates:[f.input.candidate],intent:f.input.intent,readRunId:f.input.readContext.runId},new AbortController().signal);
 assert.equal(f.assembly.questions.currentPages(f.input.readContext,f.input.candidate.restaurant.id)[0]?.snapshot.settlement,"PENDING","Ordinary fact capture retains the unsettled source without granting a whole-page answer");
 f.page.settlement="SETTLED";
 const answer=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
 assert.equal(answer.status,"ANSWERED","A pending cache is a reason to acquire a complete page within the existing question budget");
 assert.equal(f.seen.navigations.length,1,"The current exact outlet page is reobserved without navigation");
 assert.equal(f.seen.requests.filter(r=>r.purpose==="restaurant_page_question").length,1);
});


test("G1 a still-busy refreshed page stays incomplete with no answer model call",async()=>{
 const f=pageQuestionCaptureFixture("TABELOG");f.page.settlement="PENDING";
 f.page.settlementDiagnostics={url:f.url,pendingByType:{xhr:1},oldestPendingMs:0,blockingDataRequests:1,busySelectors:[],visibleTextChanging:false};
 await f.assembly.facts.inspectFacts({candidateIds:[f.input.candidate.restaurant.id],candidates:[f.input.candidate],intent:f.input.intent,readRunId:f.input.readContext.runId},new AbortController().signal);
 const answer=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
 assert.ok(answer.status==="UNVERIFIED"&&answer.reason==="INCOMPLETE_PAGE");
 assert.equal(f.seen.requests.filter(r=>r.purpose==="restaurant_page_question").length,0);
 assert.equal(f.seen.navigations.length,1,"The still-pending current exact page is observed once without navigation or loops");
});
