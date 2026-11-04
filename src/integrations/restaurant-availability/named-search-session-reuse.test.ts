import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import { LiveBrowserAvailability } from "./live-browser-availability.js";

// Constructed public search pages, not a replay of current site DOM. Only the
// browser and model transports are replaced; query binding and both adapters
// run normally. Counters count navigation calls, not physical network requests.
class SearchSession implements BrowserSession {
  readonly metadata = {runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM" as const,engine:"CHROMIUM" as const,startedAt:new Date().toISOString(),readNetworkBoundary:"INSTALLED" as const};
  url="about:blank"; query=""; navigations:string[]=[]; submissions:string[]=[]; closed=0;
  async navigate(url:string){this.navigations.push(url);this.url=url;}
  async snapshot():Promise<BrowserSnapshot>{return {url:this.url,title:"Restaurant search",text:this.url.includes("tablecheck")?"No venues found":"No restaurants match",html:"<main>No venues found. No restaurants match</main>"};}
  async observeControls():Promise<BrowserPageControl[]>{return [
    {id:"current-query",stableKey:"query",kind:"INPUT",role:"searchbox",label:"Restaurant search",type:"search",structure:{tag:"INPUT",name:"query",classes:[],dialogLabel:"",formClass:"",sliderCount:0},controlGroupKey:"search-form",value:this.query,visible:true,disabled:false},
    {id:"current-submit",stableKey:"submit",kind:"BUTTON",role:"button",label:"Search",type:"submit",formMethod:"GET",controlGroupKey:"search-form",visible:true,disabled:false},
  ];}
  async fill(_id:string,value:string){this.query=value;}
  async click(){const u=new URL(this.url);u.searchParams.set(u.hostname.includes("tablecheck")?"search_text":"sw",this.query);this.url=u.toString();this.submissions.push(this.query);}
  async select(_id:string,value:string){return [value];}
  async waitFor(){}
  async screenshot(){return new Uint8Array();}
  async close(){this.closed++;}
}
const limits={maxAutomaticElapsedMs:300_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:40};
function request(name:string):RestaurantAvailabilityRequest{
  const c=structuredClone(fixtureCandidates[0]!);c.restaurant.id=name;c.restaurant.outletName=name;c.restaurant.sourceIds={googlePlaces:name};
  return {candidateIds:[name],candidates:[c],date:fixtureIntent.date,timeWindow:fixtureIntent.timeWindow,partySize:fixtureIntent.partySize,hardCriteria:[]};
}
test("one read reuses each source search form across candidate checkpoints, with identical bound no-result conclusions",async()=>{
  const sessions:SearchSession[]=[];
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:async()=>{const s=new SearchSession();sessions.push(s);return s;}};
  const availability=new LiveBrowserAvailability(runtime,{complete:async()=>{throw new Error("No model authorized in this fixture");}},{...limits,alternativeSearch:async()=>undefined});
  availability.beginReadRun();
  const results=[];
  try{for(const name of ["Alpha Sushi","Beta Sushi","Gamma Sushi"]){const r=await availability.check(request(name),new AbortController().signal,"read-one");results.push(r);assert.equal(r.availabilityChecks[name]?.status,"UNKNOWN");assert.deepEqual(r.offers,[]);}}
  finally{await availability.endReadRun();}
  assert.equal(sessions.length,2,"one session per source, instead of one per candidate");
  assert.equal(sessions.flatMap(s=>s.navigations).length,2,"only each source's first search opens its entrance; later queries submit observed forms");
  assert.equal(sessions.flatMap(s=>s.submissions).length,4);
  assert.ok(sessions.every(s=>s.closed===1),"all source sessions close at the read boundary");
  assert.ok(results.every(r=>r.metadata.providerAttempts?.length===2));
});
