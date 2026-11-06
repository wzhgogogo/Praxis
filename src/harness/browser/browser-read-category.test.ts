import assert from "node:assert/strict";
import {test} from "node:test";
import {guardedPages} from "./browser-read-test-fixtures.js";
import {createLiveReadAssembly} from "../../integrations/restaurant-search/live-read-assembly.js";
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET} from "../../application/live-read-investigation-budget.js";
import {GooglePlacesClient} from "../../integrations/google/google-places-client.js";
import {tabelogDiscoveryPack,discoveryPackNetworkPolicy} from "../../integrations/restaurant-search/source-packs.js";
import {restaurantSearchIntentFingerprint} from "../../domains/restaurant/contracts.js";
import type {BrowserRuntime} from "../../infrastructure/browser/browser-runtime.js";

// LOCAL_CONSTRUCTION. Replaces retired category/general URL-selection context;
// ordinary observed actions retain coordinate, HARD-input and cancellation contracts.
for(const mode of ["visible","hidden","foreign","cancel-partial"] as const){
 test(`observed source category links retain radius and partial-result safety: ${mode}`,async()=>{
  const root="https://tabelog.com/en/",region="https://tabelog.com/en/tokyo/A1000/",category=region+"A100001/rstLst/cuisine/";
  const outlet=(n:number)=>`https://tabelog.com/tokyo/A1000/A100001/${12345600+n}/`;
  const links=Array.from({length:5},(_,i)=>`<article><a href="${outlet(i+1)}">Fixture venue ${i+1}</a></article>`).join("");
  const pages:Record<string,string>={
   [root]:`<a href="${region}">Fixture District</a>`,
   [region]:mode==="hidden"?`<button onclick="this.hidden=true;document.querySelector('nav').hidden=false">Show categories</button><nav hidden><a href="${category}">Observed cuisine</a></nav>`:`<a href="${category}">Observed cuisine</a>`,
   [category]:`<h1>Fixture District kaiseki restaurants</h1>${links}`,
  };
  for(let n=1;n<=5;n++)pages[outlet(n)]=`<h1>Fixture venue ${n}</h1><script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name:`Fixture venue ${n}`,address:"Fixture District, Tokyo",geo:mode==="foreign"?{latitude:35.1,longitude:139.1}:{latitude:35,longitude:139}})}</script>`;
  const f=await guardedPages(pages,discoveryPackNetworkPolicy([tabelogDiscoveryPack]));const abort=new AbortController(),navigations:string[]=[];let decisions=0;
  const browser:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",async openSession(input){const session=await f.runtime.openSession(input);return new Proxy(session,{get(target,key){
   if(key==="navigate")return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);if(mode==="cancel-partial"&&args[0]===outlet(2)){abort.abort(Object.assign(Error("Constructed reserve boundary"),{code:"DELIVERY_RESERVE_REACHED"}));throw abort.signal.reason;}return target.navigate(...args);};
   if(key==="openLink")return async(...args:Parameters<NonNullable<typeof session.openLink>>)=>{navigations.push(args[1]!);return target.openLink!(...args);};
   const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
  }});}};
  const model:import("../../core/model/contracts.js").ModelGateway={async complete(request){const body=JSON.parse(request.messages.find(m=>m.role==="user")!.content);let result:unknown;
   if(request.purpose==="restaurant_discovery_retrieval")result={choice:"KEYWORD",keyword:"kaiseki",criterionRef:"criterion:0",generalRef:"",categoryUrl:"",reason:"Literal positive criterion; source navigation remains observational"};
   else{decisions++;const targets=body.observation.targets;const target=targets.find((t:{label:string})=>["Fixture District","Show categories","Observed cuisine"].includes(t.label));result=target?{action:target.kind==="LINK"?"OPEN_LINK":"CLICK",targetRef:target.ref,authoritativeField:"NONE",requestedState:"NONE",reason:"Use the currently visible source control"}:{action:"COMPLETE",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"Verify the observed current list independently"};}
   return{invocationId:"category-fixture",provider:"FIXTURE",model:"observed-source",outputText:JSON.stringify(result),finishReason:"TOOL_CALLS",latencyMs:0};
  }};
  const intent:import("../../domains/restaurant/contracts.js").RestaurantSearchIntent={timezone:"Asia/Tokyo",area:{query:"Fixture District"},criteria:[{text:"kaiseki restaurant",polarity:"POSITIVE",strength:"HARD"}]};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:15,maxAutomaticBrowserMs:30000,packs:[tabelogDiscoveryPack]},{browser,model,google:new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async()=>{throw Error("No external Google");}}),clock:{now:()=>new Date("2026-10-17T00:00:00Z")}});
  try{
   const read=await assembly.search.search({readRunId:"observed-category:"+mode,intent,continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35,longitude:139,radiusMeters:1000,label:"Fixture District",areaMatchBasis:"NAMED_PLACE_RADIUS"}}},AbortSignal.any([AbortSignal.timeout(30000),abort.signal]));
   assert.equal(read.candidates.length,mode==="foreign"?0:mode==="cancel-partial"?1:5,JSON.stringify(read.metadata));
   assert.equal(navigations.some(url=>url.includes("/reserve")||url.includes("/booking")),false);
   assert.ok(decisions>0,"the ordinary observation model chooses source navigation");
   if(mode==="foreign")assert.equal(read.metadata.nativeDiscoveryFunnel?.rejected.filter(r=>r.reasonCode==="OUTSIDE_EXACT_RADIUS").length,5);
   if(mode==="cancel-partial"){
    assert.equal(read.continuation?.exhausted,false);assert.equal(read.metadata.nativeDiscoveryFunnel?.sourceExhausted,"UNKNOWN");
    assert.equal(read.continuation?.sourceProgress?.detailAttempts,2);assert.deepEqual(read.metadata.reserveReached?.completedCandidateIds,read.candidates.map(c=>c.restaurant.id));
   }
   assert.deepEqual(intent.criteria,[{text:"kaiseki restaurant",polarity:"POSITIVE",strength:"HARD"}]);
  }finally{await f.close();}
 });
}
