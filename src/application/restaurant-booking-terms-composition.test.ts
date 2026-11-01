import assert from "node:assert/strict";
import test from "node:test";
import {bookingTermsComposition,cancellationQuote,cancellationAnswer,cardQuote,japaneseQuote,japaneseAnswer} from "./fixtures/booking-terms-composition.js";

type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
async function capture(f:Fixture,label:string){
  if(process.env.PRAXIS_B1_TERMS_CAPTURE==="1")console.log("B1_TERMS_COMPOSITION_RAW "+Buffer.from(JSON.stringify({label,...await f.artifact()})).toString("base64"));
}
const questions=(f:Fixture)=>f.requests.filter(item=>item.request.purpose==="restaurant_page_question");

for(const provider of ["TABELOG","TABLECHECK"] as const)test(`B1 selected ${provider} outlet proactively acquires same-channel cancellation and card terms through ordinary composition`,async()=>{
  const f=await bookingTermsComposition({provider});
  try{
    const initial=await f.initial();assert.ok(initial.restaurant.bookingHandoffs?.length);assert.deepEqual(initial.restaurant.bookingHandoffs![0]!.terms,[]);assert.equal(questions(f).length,0,"Unselected candidates do not trigger terms reads");
    const selected=await f.select(),h=selected.restaurant.bookingHandoffs?.[0];assert.ok(h);
    assert.equal(selected.restaurant.selectedCandidateId,h.candidateId);
    assert.equal(h.provider,provider);assert.deepEqual(h.terms.map(t=>t.label),[cancellationAnswer,"Card required"]);
    const readUrl=provider==="TABLECHECK"?f.url+"?date=2026-11-11&time=19%3A00&num_people=2&availability_format=datetime&availability_mode=same_meal_time":f.url;
    assert.deepEqual(h.terms.flatMap(t=>t.citations.map(c=>[c.text,c.url,c.readAt])),[[cancellationQuote,readUrl,f.source.referenceTime],[cardQuote,readUrl,f.source.referenceTime]]);
    assert.equal(questions(f).length,2);assert.equal(h.sourceSelection,"UNKNOWN");
    assert.ok(questions(f).every(item=>item.turn==="SELECTED"));
    const count=f.requests.length;await f.project();await f.project();assert.equal(f.requests.length,count,"Projection performs no model or source I/O");
    await capture(f,provider+"-proactive");
  }finally{await f.close();}
});

test("B1 reuses the actual admitted G1 cancellation answer without another model call, before or after selection",async()=>{
  const f=await bookingTermsComposition();
  try{
    await f.initial();const v=await f.question();assert.equal(v.restaurant.pageQuestion?.result?.status,"ANSWERED");
    assert.deepEqual(v.restaurant.bookingHandoffs![0]!.terms.map(t=>t.label),[cancellationAnswer]);assert.equal(questions(f).length,1);
    const n=f.requests.length;await f.project();assert.equal(f.requests.length,n);await capture(f,"admitted-reuse");
    await f.select();const before=questions(f).length;const after=await f.question();
    assert.equal(questions(f).length,before+1,"Only the user's explicit G1 question calls the model; no B1 duplicate");
    assert.equal(after.restaurant.bookingHandoffs![0]!.terms[0]!.label,cancellationAnswer);await capture(f,"selected-admitted-reuse");
  }finally{await f.close();}
});

test("B1 carries both observed language policies and separate English paraphrases when G1 reports conflict",async()=>{
  const f=await bookingTermsComposition({conflict:true});
  try{
    await f.initial();const v=await f.select(),h=v.restaurant.bookingHandoffs![0]!;
    assert.equal(h.cancellationNotice,"Cancellation terms differ between the Japanese and English pages");
    assert.equal(h.cancellationConfirmation,"Confirm cancellation terms on the website");
    assert.deepEqual(h.terms.map(t=>t.label),["Japanese page: "+japaneseAnswer,"English page: "+cancellationAnswer,"Card required"]);
    assert.equal(h.terms[0]!.citations[0]!.text,japaneseQuote);assert.equal(h.terms[1]!.citations[0]!.text,cancellationQuote);
    assert.ok(!new URL(h.terms[0]!.citations[0]!.url).pathname.startsWith("/en/"));assert.ok(new URL(h.terms[1]!.citations[0]!.url).pathname.startsWith("/en/"));
    assert.equal(questions(f).length,4,"Two extra per-language paraphrases share the original budget");
    assert.ok(f.sourceCalls.some(c=>c.url===f.url.replace("/en/","/")));await capture(f,"conflict");
  }finally{await f.close();}
});

for(const wrongPage of ["SHOP","CHANNEL"] as const)test(`B1 hides ${wrongPage} G1 pages without losing the source link`,async()=>{
  const f=await bookingTermsComposition({wrongPage});
  try{await f.initial();const v=await f.select();assert.ok(v.restaurant.selectedCandidateId);assert.ok(v.restaurant.bookingHandoffs?.length);assert.deepEqual(v.restaurant.bookingHandoffs![0]!.terms,[]);assert.equal(questions(f).length,0,"No identity-bound page reaches the G1 model");await capture(f,wrongPage);}
  finally{await f.close();}
});

test("B1 omits unstated policy and card requirements, and never carries previous-run terms",async()=>{
  const f=await bookingTermsComposition();
  try{await f.initial();const good=await f.select();assert.equal(good.restaurant.bookingHandoffs![0]!.terms.length,2);
    f.omitTerms();const next=await f.select();assert.ok(next.restaurant.bookingHandoffs?.length);assert.deepEqual(next.restaurant.bookingHandoffs![0]!.terms,[]);
    assert.notEqual(next.restaurant.sourceReadContext?.runId,good.restaurant.sourceReadContext?.runId);
    assert.equal(questions(f).length,4);assert.ok(questions(f).slice(-2).every(q=>JSON.parse(q.response.outputText).status==="NOT_STATED"));await capture(f,"not-stated-new-run");
  }finally{await f.close();}
});

test("B1 shares the real run model ceiling and drops optional terms when that budget is spent",async()=>{
  let f!:Fixture,drained=false;
  f=await bookingTermsComposition({maxCalls:20,onQuestion:async request=>{
    if(drained)return;drained=true;const id=f.counted.currentTaskId();assert.ok(id);
    // Competing constructed model I/O consumes the SAME real gateway scope.
    // No State, terms, evidence, counter or precomputed handoff is injected.
    for(let n=0;n<20&&(f.counted.remainingCalls(id)??0)>0;n++)await f.counted.complete({...request,purpose:"fixture_budget_work"});
  }});
  try{await f.initial();const v=await f.select();assert.ok(v.restaurant.selectedCandidateId);assert.ok(v.restaurant.bookingHandoffs?.length);assert.deepEqual(v.restaurant.bookingHandoffs![0]!.terms,[]);
    assert.equal(f.counted.usage(v.case.rootTaskId)?.calls,20);assert.equal(questions(f).length,1,"No second term call beyond the exhausted shared budget");await capture(f,"budget");
  }finally{await f.close();}
});

test("B1 discards late terms on cancellation while keeping its qualified handoff",async()=>{
  let release!:()=>void,started!:()=>void;const gate=new Promise<void>(r=>release=r),seen=new Promise<void>(r=>started=r);
  const f=await bookingTermsComposition({onQuestion:async()=>{started();await gate;}});
  let pending:Promise<unknown>|undefined;
  try{await f.initial();pending=f.select();let timer:ReturnType<typeof setTimeout>|undefined;
    try{await Promise.race([seen,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Terms did not reach model transport")),5000);})]);}finally{if(timer)clearTimeout(timer);}
    const signal=f.termsSignal;assert.ok(signal);const cancelling=f.cancel();
    await new Promise<void>((resolve,reject)=>{if(signal.aborted){resolve();return;}const timer=setTimeout(()=>reject(new Error("Cancellation did not reach the existing fact read signal")),5000);signal.addEventListener("abort",()=>{clearTimeout(timer);resolve();},{once:true});});
    release();await Promise.all([cancelling,pending]);const v=await f.project();
    assert.ok(v.restaurant.bookingHandoffs?.length);assert.deepEqual(v.restaurant.bookingHandoffs![0]!.terms,[]);await capture(f,"cancelled");
  }finally{release();if(pending)await pending;await f.close();}
});

test("B1 drops expired G1 pages and enclosing-deadline output independently of its still-current link",async()=>{
  const f=await bookingTermsComposition();
  try{await f.initial();const before=await f.select();assert.equal(before.restaurant.bookingHandoffs![0]!.terms.length,2);f.clock.advance(500_001);
    const after=await f.project();assert.ok(after.restaurant.bookingHandoffs?.length);assert.deepEqual(after.restaurant.bookingHandoffs![0]!.terms,[]);await capture(f,"expired-pages");
  }finally{await f.close();}
  let late!:Fixture;late=await bookingTermsComposition({onQuestion:()=>{late.clock.advance(500_001);}});
  try{await late.initial();const v=await late.select();assert.ok(v.restaurant.bookingHandoffs?.length);assert.deepEqual(v.restaurant.bookingHandoffs![0]!.terms,[]);assert.equal(questions(late).length,1);await capture(late,"deadline");}
  finally{await late.close();}
});
