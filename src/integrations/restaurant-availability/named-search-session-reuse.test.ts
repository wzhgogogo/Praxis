import {fixtureGetRuntime,fixtureGetSession} from "../../harness/fixtures/observed-get-session.js";
import {scriptedBrowserObservation} from "../../harness/fixtures/restaurant-observation-model.js";
import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import { LiveBrowserAvailability } from "./live-browser-availability.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { createLiveReadAssembly } from "../restaurant-search/live-read-assembly.js";
import { tabelogDiscoveryPack } from "../restaurant-search/source-packs.js";
import { GooglePlacesClient } from "../google/google-places-client.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } from "../../application/live-read-investigation-budget.js";

// Constructed public search pages, not a replay of current site DOM. Only the
// browser and model transports are replaced; query binding and both adapters
// run normally. Counters count navigation calls, not physical network requests.
class SearchSession implements BrowserSession {
  readonly metadata = {runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM" as const,engine:"CHROMIUM" as const,startedAt:new Date().toISOString(),readNetworkBoundary:"INSTALLED" as const};
  url="about:blank"; query=""; navigations:string[]=[]; submissions:string[]=[]; closed=0;
  async navigate(url:string){this.navigations.push(url);this.url=url;}
  async snapshot():Promise<BrowserSnapshot>{return {url:this.url,title:"Restaurant search",text:this.url.includes("tablecheck")?"No venues found":"No restaurants match",html:"<main>No venues found. No restaurants match</main>"};}
  async observeControls():Promise<BrowserPageControl[]>{return [
    {id:"current-query",stableKey:"query",kind:"INPUT",role:"searchbox",label:"Restaurant search",type:"search",structure:{tag:"INPUT",name:this.url.includes("tablecheck")?"search_text":"sw",classes:[],dialogLabel:"",formClass:"",sliderCount:0},formObservation:{owner:"search-form",visibleLines:["Restaurant search"]},controlGroupKey:"search-form",value:this.query,visible:true,disabled:false},
    {id:"current-submit",stableKey:"submit",kind:"BUTTON",role:"button",label:"Search",type:"submit",formMethod:"GET",formObservation:{owner:"search-form",visibleLines:["Restaurant search"]},controlGroupKey:"search-form",visible:true,disabled:false},
  ];}
  async fill(_id:string,value:string){this.query=value;}
  async click(){const u=new URL(this.url);u.searchParams.set(u.hostname.includes("tablecheck")?"search_text":"sw",this.query);this.url=u.toString();this.submissions.push(this.query);}
  async select(_id:string,value:string){return [value];}
  async waitFor(){}
  async screenshot(){return new Uint8Array();}
  isClosed(){return this.closed>0;}
  async close(){this.closed++;}
}
const limits={maxAutomaticElapsedMs:300_000,maxModelCallsPerCandidate:20,maxModelCallsTotal:120,maxOperationsPerCandidate:80};
function request(name:string):RestaurantAvailabilityRequest{
  const c=structuredClone(fixtureCandidates[0]!);c.restaurant.id=name;c.restaurant.outletName=name;c.restaurant.sourceIds={googlePlaces:name};
  return {selectionScope:"SPECIFIC_OUTLET",candidateIds:[name],candidates:[c],date:fixtureIntent.date,timeWindow:fixtureIntent.timeWindow,partySize:fixtureIntent.partySize,hardCriteria:[]};
}
test("one read reuses each source search form across candidate checkpoints, with identical bound no-result conclusions",async()=>{
  const sessions:SearchSession[]=[];
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:async()=>{const s=new SearchSession();sessions.push(s);return fixtureGetSession(s);}};
  const availability=new LiveBrowserAvailability(fixtureGetRuntime(runtime),{complete:async(request)=>scriptedBrowserObservation(request)!},{...limits,alternativeSearch:async()=>undefined});
  availability.beginReadRun();
  const results=[];
  try{for(const name of ["Alpha Sushi","Beta Sushi","Gamma Sushi"]){const r=await availability.check(request(name),new AbortController().signal,"read-one");results.push(r);assert.equal(r.availabilityChecks[name]?.status,"UNKNOWN");assert.deepEqual(r.offers,[]);}}
  finally{await availability.endReadRun();}
  assert.equal(sessions.length,2,"one session per source, instead of one per candidate");
  assert.equal(sessions.flatMap(s=>s.navigations).length,2,"only each source's first search opens its entrance; later queries submit observed forms");
  assert.equal(sessions.flatMap(s=>s.submissions).length,6);
  assert.ok(sessions.every(s=>s.closed===1),"all source sessions close at the read boundary");
  assert.ok(results.every(r=>r.metadata.providerAttempts?.length===2));
});

test("missing observed search controls never construct a query URL and retain honest no-result conclusions",async()=>{
  const sessions:SearchSession[]=[];
  const availability=new LiveBrowserAvailability({readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:async()=>{const s=new SearchSession();s.observeControls=async()=>[];sessions.push(s);return fixtureGetSession(s);}},
    {complete:async(request)=>scriptedBrowserObservation(request)!},{...limits,alternativeSearch:async()=>undefined});
  availability.beginReadRun();
  try{for(const name of ["Alpha Sushi","Beta Sushi","Gamma Sushi"]){const r=await availability.check(request(name),new AbortController().signal);assert.equal(r.availabilityChecks[name]?.status,"UNKNOWN");}}
  finally{await availability.endReadRun();}
  assert.equal(sessions.length,2);assert.equal(sessions.flatMap(s=>s.navigations).length,2);
  assert.equal(sessions.flatMap(s=>s.submissions).length,0);
});

test("a failed reused session retires without retry; the next candidate gets a fresh source session",async()=>{
  const sessions:SearchSession[]=[];
  const availability=new LiveBrowserAvailability({readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:async()=>{
    const s=new SearchSession();
    if(sessions.length===0){
      let contextLost=false;
      s.isClosed=()=>contextLost||s.closed>0;
      const click=s.click.bind(s);s.click=async()=>{if(s.query==="Beta Sushi"){contextLost=true;throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED","fixture context closed");}await click();};
    }
    sessions.push(s);return s;
  }},{complete:async(request)=>scriptedBrowserObservation(request)!},{...limits,alternativeSearch:async()=>undefined});
  availability.beginReadRun();
  try{
    await availability.check(request("Alpha Sushi"),new AbortController().signal);
    const second=await availability.check(request("Beta Sushi"),new AbortController().signal);
    assert.equal(second.availabilityChecks["Beta Sushi"]?.status,"UNKNOWN");assert.deepEqual(second.offers,[]);
    assert.equal(sessions.length,2,"a failure does not immediately retry this source");assert.equal(sessions[0]!.closed,1);
    const third=await availability.check(request("Gamma Sushi"),new AbortController().signal);
    assert.equal(third.availabilityChecks["Gamma Sushi"]?.status,"UNKNOWN");assert.equal(sessions.length,3);
  }finally{await availability.endReadRun();}
  assert.ok(sessions.every(s=>s.closed===1));
});

test("a completed run never lends its source contexts to a later run; cancellation still closes every context",async()=>{
  const sessions:SearchSession[]=[];
  const availability=new LiveBrowserAvailability({readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:async()=>{const s=new SearchSession();sessions.push(s);return fixtureGetSession(s);}},
    {complete:async(request)=>scriptedBrowserObservation(request)!},{...limits,alternativeSearch:async()=>undefined});
  availability.beginReadRun();await availability.check(request("Alpha Sushi"),new AbortController().signal);await availability.endReadRun();
  assert.equal(sessions.length,2);assert.ok(sessions.every(s=>s.closed===1));
  availability.beginReadRun();const controller=new AbortController();
  await availability.check(request("Beta Sushi"),controller.signal);controller.abort();
  await assert.rejects(()=>availability.check(request("Gamma Sushi"),controller.signal));
  await availability.endReadRun();assert.equal(sessions.length,4);assert.ok(sessions.every(s=>s.closed===1));
});

test("ordinary assembly retains correct source identities while a reused search refuses a wrong shop and two HIGH identities",async()=>{
  const rows=[
    {name:"Alpha Sushi",id:"13100001",phone:"03-1111-1111"},
    {name:"Beta Sushi",id:"13100002",phone:"03-2222-2222"},
    {name:"Ambiguous Sushi",id:"13100003",phone:"03-3333-3333"},
    {name:"Ambiguous Sushi",id:"13100004",phone:"03-3333-3333"},
  ];
  const root="https://tabelog.com/en/tokyo/rstLst/";
  const detail=(id:string)=>`https://tabelog.com/en/tokyo/A1304/A130401/${id}/`;
  class IdentitySession extends SearchSession {
    override async click(){this.url=root+"?sw="+encodeURIComponent(this.query);this.submissions.push(this.query);}
    override async snapshot():Promise<BrowserSnapshot>{
      const u=new URL(this.url),row=rows.find(r=>detail(r.id)===this.url);
      const query=u.searchParams.get("sw");
      const selected=rows.filter(r=>r.name===query||query==="Wrong Sushi"&&r.id==="13100001");
      const html=row?`<h1>${row.name}</h1><p>${fixtureCandidates[0]!.restaurant.address}</p><a href="tel:${row.phone}">${row.phone}</a>`
        :selected.map(r=>`<article><a href="${detail(r.id)}">${r.name}</a></article>`).join("");
      return {url:this.url,title:row?.name??"Restaurant search",html,text:html.replace(/<[^>]*>/g," ")};
    }
  }
  const sessions:IdentitySession[]=[];let sourceModelCalls=0;
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:[tabelogDiscoveryPack]}, {
    model:{complete:async(request)=>{const observed=scriptedBrowserObservation(request);if(observed)return observed;sourceModelCalls++;return {invocationId:"declined-fragment",provider:"FIXTURE",model:"fixture",outputText:'{"field":"name","fragment":""}',finishReason:"STOP",latencyMs:0};}},
    browser:{readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:async()=>{const s=new IdentitySession();sessions.push(s);return fixtureGetSession(s);}},
    google:new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async()=>{throw new Error("Google not authorized");}}),
    clock:{now:()=>new Date()},
  });
  assembly.availability.beginReadRun();
  const conclusions=[];
  try{
    for(const [name,phone,expected] of [["Alpha Sushi","03-1111-1111","COMPLETED"],["Beta Sushi","03-2222-2222","COMPLETED"],["Wrong Sushi","03-9999-9999","UNKNOWN"],["Ambiguous Sushi","03-3333-3333","UNKNOWN"]] as const){
      const r=request(name);r.candidates[0]!.restaurant.sourceIds.phone=phone;
      const read=await assembly.facts.inspectFacts({candidateIds:r.candidateIds,candidates:r.candidates,intent:fixtureIntent,readRunId:"identity-reuse"},new AbortController().signal,true);
      assert.equal(read.factChecks[name]?.status,expected);conclusions.push({name,status:read.factChecks[name]?.status});
      if(expected==="COMPLETED")assert.ok(read.evidence.some(e=>e.kind==="ENTITY_MATCH"&&e.candidateId===name&&e.entityMatch?.confidence==="HIGH"));
      else assert.equal(read.evidence.some(e=>e.kind==="ENTITY_MATCH"),false);
      assert.equal(read.evidence.some(e=>e.kind==="AVAILABILITY"),false,"identity investigation never claims inventory");
    }
  }finally{await assembly.availability.endReadRun();}
  assert.equal(sessions.length,1);assert.equal(sessions[0]!.closed,1);
  assert.equal(sessions[0]!.navigations.filter(u=>u==="https://tabelog.com/en/").length,1);
  assert.ok(sessions[0]!.submissions.includes("Beta Sushi"));
  assert.equal(sourceModelCalls,2,"only the unchanged fragment fallback for the two unresolved identities");
  if(process.env.PRAXIS_SESSION_REUSE_CAPTURE==="1")console.log("SESSION_REUSE_RESULT "+JSON.stringify({conclusions,sessionOpens:sessions.length,entranceNavigations:1,submissions:sessions[0]!.submissions,sourceModelCalls,externalCalls:0}));
});
