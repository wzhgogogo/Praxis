import assert from "node:assert/strict";
import test from "node:test";
import { mkdir,writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RestaurantCaseView } from "../../../../application/agent-workspace.js";
import { createG6Session, G6_USER, type G6Session } from "./session.js";
import { g6Fixture,type G6FixtureKind } from "./fixtures.js";

async function control(kind:G6FixtureKind,work:(session:G6Session,f:Awaited<ReturnType<typeof g6Fixture>>,view:RestaurantCaseView)=>Promise<void>) {
  const f=await g6Fixture(kind),session=await createG6Session(f);
  let view:RestaurantCaseView|undefined,error:unknown;
  try {view=await session.create(f.request);await work(session,f,view);}
  catch(e){error=e;throw e;}
  finally {
    if(process.env.PRAXIS_G6_CAPTURE_DIR){
      await mkdir(process.env.PRAXIS_G6_CAPTURE_DIR,{recursive:true});
      await writeFile(join(process.env.PRAXIS_G6_CAPTURE_DIR,kind+".json"),JSON.stringify({kind,mode:"LOCAL_CONSTRUCTION_NOT_REPLAY",status:error?"FAIL":"PASS",error:error instanceof Error?{name:error.name,message:error.message,stack:error.stack}:null,
        ...(view?{view:await session.view(view.case.caseId),artifact:await session.application.exportReadArtifact(view.case.caseId)}:{}),calls:session.calls,sources:f.events,snapshots:f.snapshots,mutation:f.markerMaps},null,2)+"\n",{flag:"wx"});
    }
    await session.close();
  }
}

for(const kind of ["RENAMED","CONTROL_FALLBACK"] as const)test(`G6 capability ${kind}: observed controls reach current response-bound presentation`,async()=>{
  await control(kind,async(session,f,view)=>{
    assert.equal(view.case.phase,"PRESENT_RESULTS","Root production composition must deliver after source controls are observed");
    const id=view.restaurant.presentedCandidateIds?.[0];assert.ok(id);
    assert.equal(view.restaurant.availabilityChecks[id]?.status,"AVAILABLE");
    assert.equal(view.restaurant.availability[id]?.[0]?.dateTime,"2026-11-11T19:00:00+09:00");
    const actions=session.calls.filter(c=>c.request.purpose==="browser_read_decide").map(c=>JSON.parse(c.response!.outputText));
    assert.ok(actions.some(a=>a.action==="FILL_AUTHORITATIVE"&&a.authoritativeField==="DATE"),"Date must come from an observed public input");
    assert.ok(actions.some(a=>a.action==="CHOOSE_OPTION"&&a.authoritativeField==="PARTY_SIZE"),"Guests must come from an observed public option");
    assert.ok(f.snapshots.some(s=>s.responses?.some(r=>r.url===f.source.vacancy.url)),"The current source response must actually have been captured");
    if(kind==="RENAMED"){
      assert.ok(f.markerMaps.length,"All private marker families must actually be mutated");
      assert.ok(f.markerMaps.every(m=>m.integrity.valid&&m.integrity.visibleTextPreserved),"An invalid semantic-reference mutation cannot earn a capability pass");
    }
  });
});

for(const kind of ["RESPONSE_MISSING","RESPONSE_CHANGED"] as const)test(`G6 capability ${kind}: visible date/guests never replace missing or changed vacancy data`,async()=>{
  await control(kind,async(_session,_f,view)=>{
    assert.equal(view.restaurant.presentedCandidateIds?.length??0,0,"Date/control prose without valid response must never create a slot card");
    assert.equal(view.case.phase,"NO_VERIFIED_RESULT","Incomplete source evidence must end with a bounded honest conclusion");
    const checks=Object.values(view.restaurant.availabilityChecks);assert.ok(checks.some(c=>c.status==="UNKNOWN"));
    if(kind==="RESPONSE_CHANGED")assert.ok(checks.some(c=>c.reasonCode==="SOURCE_STRUCTURE_CHANGED"||c.sourceAttempts?.some(a=>a.reasonCode==="SOURCE_STRUCTURE_CHANGED")),"Response schema drift must remain an explicit visible alert in the real root State");
  });
});

for(const kind of ["PRICE_MATCH","PRICE_PARTY","PRICE_DATE","PRICE_MEAL"] as const)test(`G6 capability ${kind}: only applicable original quotation supports HARD budget MET`,async()=>{
  await control(kind,async(_session,f,view)=>{
    const price=view.restaurant.readEvidence.flatMap(e=>e.priceFacts?.listedCoursePricesYen??[]).find(p=>p.amount===5000);
    assert.ok(price,"The test must actually acquire and admit the source quote, not pass by losing all prices");
    assert.ok(price.quote.includes(f.course),"All source restrictions must survive together with the price");
    const conditions=Object.values(view.restaurant.conditionStates??{}).flat().filter(c=>c.strength==="HARD"&&/6000/u.test(c.text));
    if(kind==="PRICE_MATCH"){
      assert.equal(view.case.phase,"PRESENT_RESULTS");
      assert.ok(conditions.some(c=>c.status==="MET"),"Same-party/date/dinner quote must support the normal HARD control");
    }else{
      assert.equal(conditions.some(c=>c.status==="MET"),false,"Other-party/date/meal quotations cannot establish HARD budget MET");
      assert.equal(view.restaurant.presentedCandidateIds?.length??0,0,"An unverified HARD budget cannot produce a qualified card");
    }
  });
});

test("G6 capability G4: same-ID Japanese lookup drives the third source query to the same outlet",async()=>{
  await control("JAPANESE_NAME",async(_session,f,view)=>{
    assert.equal(view.case.phase,"PRESENT_RESULTS");const id=view.restaurant.presentedCandidateIds?.[0];assert.ok(id);
    assert.equal(view.restaurant.candidates.find(c=>c.restaurant.id===id)?.restaurant.address,f.source.outlet.address);
    const searches=f.events.filter(e=>e.kind==="NAVIGATE"&&new URL(e.url).pathname==="/en/tokyo/rstLst/"&&new URL(e.url).searchParams.has("sw")).map(e=>new URL(e.url).searchParams.get("sw"));
    assert.equal(searches.at(-1),"すし本店","Japanese source name must be used rather than a model-created alias");
    assert.equal(searches.length,3);
    const details=f.events.filter(e=>e.kind==="GOOGLE_IO"&&e.method==="GET");assert.equal(details.length,1);
    assert.equal(new URL(details[0]!.url).pathname,"/v1/places/"+f.source.outlet.id,"Japanese lookup must preserve the authoritative Google ID");
    assert.equal(view.restaurant.availabilityChecks[id]?.status,"AVAILABLE");
  });
});

async function api(base:string,cookie:string,path:string,body?:unknown) {
  const response=await fetch(base+path,{method:body===undefined?"GET":"POST",headers:{"content-type":"application/json",...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  return {response,payload:await response.json() as Record<string,unknown>};
}

test("G6 capability G1 Web: authenticated question acquires a page through the production read assembly",async()=>{
  await control("NORMAL",async(session,f,initial)=>{
    // The initial case also has real composition, but the question below goes
    // through the actual HTTP contract, never questionSessionFixture.
    const web=await session.web();try{
      const login=await api(web.baseUrl,"","/api/session",{accessToken:"g6-local-eval-token"});assert.equal(login.response.status,201);
      const cookie=login.response.headers.get("set-cookie")!.split(";",1)[0]!;
      const id=initial.restaurant.presentedCandidateIds?.[0];assert.ok(id);
      await session.finished(async()=>{const r=await api(web.baseUrl,cookie,`/api/cases/${encodeURIComponent(initial.case.caseId)}/questions`,{candidateId:id,question:f.source.question,requestId:"g6-http-question",taskVersion:initial.case.taskVersion});assert.equal(r.response.status,200);});
      const after=(await api(web.baseUrl,cookie,`/api/cases/${encodeURIComponent(initial.case.caseId)}`)).payload.view as RestaurantCaseView;
      const answer=after.restaurant.pageQuestion?.result;assert.ok(answer?.status==="ANSWERED");assert.equal(answer.candidateId,id);
      assert.deepEqual(answer.citations.map(c=>[c.text,c.url,c.readAt]),[[f.source.merchantQuote,f.source.pageUrl,f.source.referenceTime]]);
      assert.equal(session.calls.filter(c=>c.request.purpose==="restaurant_page_question").length,1);
      assert.ok(f.events.some(e=>e.kind==="NAVIGATE"&&e.url===f.source.pageUrl));
    }finally{await web.close();}
  });
});

test("G6 capability B1 fee and feedback: source-acquired handoff survives authenticated departure and user report",async()=>{
  // Distinct NORMAL capture name so the Web question run cannot overwrite it.
  const f=await g6Fixture(),session=await createG6Session(f);let view:RestaurantCaseView|undefined;
  try{
    view=await session.create(f.request);const h=view.restaurant.bookingHandoffs?.[0];assert.ok(h);assert.equal(h.provider,"TABELOG");
    assert.equal(h.platformFee?.amountPerPersonJPY,440);assert.equal(h.platformFee?.sourceUrl,"https://tabelog.com/en/help");assert.ok(h.platformFee?.documentSHA256);
    const web=await session.web();try{
      const login=await api(web.baseUrl,"","/api/session",{accessToken:"g6-local-eval-token"});const cookie=login.response.headers.get("set-cookie")!.split(";",1)[0]!;
      const path=`/api/cases/${encodeURIComponent(view.case.caseId)}`,before=f.events.length;
      const departure=await api(web.baseUrl,cookie,path+"/booking-departures",{candidateId:h.candidateId,offerId:h.offerId,requestId:"g6-departure",taskVersion:view.case.taskVersion});
      assert.equal(departure.response.status,201);assert.equal(departure.payload.url,h.url);
      const prompt=await api(web.baseUrl,cookie,path+"/booking-feedback/claim",{});const receipt=prompt.payload.prompt as {departure:{id:string}};assert.ok(receipt);
      const feedback=await api(web.baseUrl,cookie,path+"/booking-feedback",{departureId:receipt.departure.id,answer:"YES"});assert.equal(feedback.response.status,200);
      assert.equal((feedback.payload.departure as {answer:string}).answer,"YES");assert.equal(f.events.length,before,"Internal departure and self-report must not perform a reservation/source request");
      const after=(await api(web.baseUrl,cookie,path)).payload.view as RestaurantCaseView;
      assert.equal(after.artifacts.some(a=>a.type==="OUTCOME"),false,"A self-report is not a verified booking Outcome");
    }finally{await web.close();}
  }finally{
    if(process.env.PRAXIS_G6_CAPTURE_DIR&&view){await mkdir(process.env.PRAXIS_G6_CAPTURE_DIR,{recursive:true});await writeFile(join(process.env.PRAXIS_G6_CAPTURE_DIR,"B1_FEE_FEEDBACK.json"),JSON.stringify({view:await session.view(view.case.caseId),calls:session.calls,sources:f.events},null,2)+"\n",{flag:"wx"});}
    await session.close();
  }
});
