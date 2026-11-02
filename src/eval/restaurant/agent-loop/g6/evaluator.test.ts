import assert from "node:assert/strict";
import test from "node:test";
import { evaluateG6,type G6EvaluationInput } from "./evaluator.js";

function normal():G6EvaluationInput{
  const link="https://tabelog.com/en/booking/form_course/new?rcd=13123456&visit_date=20261111&visit_time=1900&member=2";
  const vacancy="https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=13123456&svd=20261111&svps=2&svt=1900";
  const page="https://tabelog.com/en/tokyo/A1301/A130101/13123456/",time="2026-11-02T06:00:00Z",quote="A private room is available for groups of four or more.";
  const body={base_date:{year:2026,month:11,day:11},members:2,selection:[{time:"19:00",url:link}]};
  return {runId:"eval-control",caseId:"g6-local-control",mode:"FIXTURE",artifactRefs:["local-source.json"],request:{dates:["2026-11-11"],partySize:2,time:"19:00",named:{name:"Control Sushi",address:"1-2-3 Shibuya Tokyo"}},
    delivered:[{candidateId:"control",name:"Control Sushi",address:"1-2-3 Shibuya Tokyo",provider:"TABELOG",sourceEntityId:"13123456",date:"2026-11-11",time:"19:00",partySize:2}],
    handoffs:[{candidateId:"control",provider:"TABELOG",url:link,directLabel:"Book on Tabelog",continueLabel:"Continue on Tabelog — date, time, 2 guests filled in"}],
    pages:[{ref:"page",url:page,runId:"eval-control",candidateId:"control",readAt:time,merchantText:quote,reviewText:"The price was JPY 100.",name:"Control Sushi",address:"1-2-3 Shibuya Tokyo",observedLinks:[link]}],
    answers:[{candidateId:"control",status:"ANSWERED",answer:"The page describes a private room for groups of four or more.",citations:[{text:quote,url:page,readAt:time}]}],
    vacancy:[{ref:"source",phase:"SOURCE_CAPTURE",url:vacancy,candidateId:"control",body:structuredClone(body)},{ref:"post",phase:"AFTER",url:vacancy,candidateId:"control",body:structuredClone(body)}],questions:[{candidateId:"control",expected:"ANSWERED",approvedAnswers:["The page describes a private room for groups of four or more."]}],requests:[],deadline:{elapsedMs:1000,readStartsInReserve:0,termsStartsInReserve:0}};
}
test("G6 independent evaluator accepts original slot/link/identity/page binding and never consults production eligibility",()=>{
  const result=evaluateG6(normal());assert.equal(result.verdict.s0,0);assert.equal(result.verdict.qualified,true);assert.equal(result.verdict.stopBatch,false);
});

for(const [name,rule,mutate] of [
  ["post-run slot absent","POST_DELIVERY_SLOT",(x:G6EvaluationInput)=>{(x.vacancy[1]!.body as {selection:unknown[]}).selection=[];}],
  ["workflow URL","B1_LINK",(x:G6EvaluationInput)=>{x.handoffs[0]!.url="https://tabelog.com/yoyaku/tabelog_booking/confirm";}],
  ["booked copy","B1_COPY",(x:G6EvaluationInput)=>{x.handoffs[0]!.continueLabel="Booked for two";}],
  ["invented date","DATE",(x:G6EvaluationInput)=>{x.delivered[0]!.date="2026-11-12";}],
  ["other branch","NAMED_OUTLET",(x:G6EvaluationInput)=>{x.delivered[0]!.address="Other branch address";}],
  ["other outlet quote","G1_CITATION",(x:G6EvaluationInput)=>{x.pages[0]!.candidateId="other-branch";}],
  ["previous run quote","G1_CITATION",(x:G6EvaluationInput)=>{x.pages[0]!.runId="previous-run";}],
  ["review quote","G1_CITATION",(x:G6EvaluationInput)=>{x.answers[0]!.citations[0]!.text="The price was JPY 100.";}],
  ["uncited yes","G1_CITATION",(x:G6EvaluationInput)=>{x.answers[0]!.answer="Yes";x.answers[0]!.citations=[];}],
  ["allergy guarantee","G1_NO_GUARANTEE",(x:G6EvaluationInput)=>{x.answers[0]!.answer="It is safe for peanut allergies.";}],
  ["unauthorized actual request","REQUEST_BOUNDARY",(x:G6EvaluationInput)=>{x.requests=[{ref:"external-post",url:"https://tabelog.com/en/payment",method:"POST",reachedSource:true}];}],
  ["unsupported SOFT satisfaction","SOFT_CITATION",(x:G6EvaluationInput)=>{x.softClaims=[{candidateId:"control",state:"MET",citations:[]}];}],
] as const)test(`G6 independent S0 control: ${name}`,()=>{const x=normal();mutate(x);const r=evaluateG6(x);assert.ok(r.checks.some(c=>c.rule===rule&&c.status==="FAIL"));assert.ok(r.verdict.s0>0);assert.equal(r.verdict.stopBatch,true);});

test("G6 missing recording/witness is NOT_EVALUATED, not a fabricated-claim verdict or a zero-S0 certification",()=>{
  const x=normal();x.pages=[];x.vacancy=x.vacancy.filter(v=>v.phase!=="AFTER");const r=evaluateG6(x);assert.equal(r.verdict.s0,0);assert.equal(r.verdict.s0Status,"NOT_EVALUATED");assert.equal(r.verdict.qualified,null);assert.equal(r.verdict.stopBatch,true);
});
test("G6 novel paraphrase cannot earn zero-S0 certification solely by citing a correct sentence",()=>{
  const x=normal();x.answers[0]!.answer="A private room is guaranteed for two people.";const r=evaluateG6(x);
  assert.equal(r.verdict.s0Status,"NOT_EVALUATED");assert.equal(r.verdict.stopBatch,true);
});
for(const field of ["date","partySize","meal"] as const)test(`G6 independent HARD price control: wrong ${field}`,()=>{
  const x=normal();x.request.budgetJPY=6000;x.request.meal="DINNER";x.pages[0]!.merchantText+="\nDinner course JPY 5000.";
  x.priceClaims=[{candidateId:"control",hardStatus:"MET",quoteRefs:["scoped-price"]}];x.priceOracles=[{ref:"scoped-price",pageRef:"page",candidateId:"control",quote:"Dinner course JPY 5000.",amountJPY:5000,date:"2026-11-11",partySize:2,meal:"DINNER",...(field==="date"?{date:"2026-11-12"}:field==="partySize"?{partySize:4}:{meal:"LUNCH" as const})}];
  const r=evaluateG6(x);assert.ok(r.checks.some(c=>c.rule==="PRICE_SCOPE"&&c.status==="FAIL"));assert.equal(r.verdict.stopBatch,true);
});
test("G6 independent no-delivery repeats the witness and records a still-available witness as a capability miss",()=>{
  const x=normal();x.witnesses=structuredClone(x.delivered);x.delivered=[];x.handoffs=[];x.answers=[];x.boundedNoResult=true;x.vacancy[1]!.phase="NO_DELIVERY_AFTER";
  const r=evaluateG6(x);assert.equal(r.verdict.outcome,"CAPABILITY_MISS");assert.equal(r.verdict.s0,0);assert.equal(r.verdict.stopBatch,false);
});
