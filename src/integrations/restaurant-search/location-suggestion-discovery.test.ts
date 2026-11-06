import assert from "node:assert/strict";
import test from "node:test";
import {locationSuggestionAssembly} from "./fixtures/location-suggestions/assembly.js";

// Actual ordinary assembly search port, Chromium, public DOM registry and Guard;
// only model transport/Google and HAR source I/O are fixed. Not a new website run.
for(const mode of ["LINK","SCRIPT","NONE","AMBIGUOUS","OUTSIDE","MERCHANT_ONLY"] as const){
 test(`Tabelog observed location suggestions through ordinary assembly: ${mode}`,{timeout:60_000},async()=>{
  const f=await locationSuggestionAssembly(mode);
  try{
    assert.equal(f.saved.regions.some((r:{label:string})=>/akabane|赤羽/i.test(r.label)),false,"Original D4 first menu lacks Akabane");
    const read=await f.search();
    if(process.env.PRAXIS_LOCATION_SUGGESTION_CAPTURE==="1")console.log("LOCATION_SUGGESTION_RESULT "+JSON.stringify({mode,candidates:read.candidates.map(c=>({id:c.restaurant.id,name:c.restaurant.outletName,coordinates:c.restaurant.coordinates,sourceIds:c.restaurant.sourceIds})),actions:f.actions,diagnostics:f.diagnostics,metadata:read.metadata,realCalls:0}));
    assert.ok(f.actions.some(a=>a.operation==="fill"&&a.args[1]==="Akabane"),"Use only authoritative place text in an observed field");
    assert.notEqual(read.metadata.failureCode,"BROWSER_RUNTIME_FAILED","A missing HAR entry is not a valid fallback result");
    const navigated=f.actions.flatMap(a=>a.operation==="navigate"?[a.args[0]]:a.operation==="openLink"?[a.args[1]]:[]);
    assert.ok(navigated.includes(f.home),"Search home must be an observed entrance");
    assert.ok(!navigated.some(url=>typeof url==="string"&&/1399999[89]|aichi|R88888/.test(url)),"Merchant suggestions and the foreign namesake never selected");
    if(mode==="LINK"||mode==="SCRIPT"){
      assert.equal(read.candidates.length,5,"Exact Tokyo station choice must reach in-radius source results");
      assert.ok(read.candidates.every(c=>c.restaurant.sourceIds.tabelog?.includes("A1323/A132305")));
      assert.ok(f.models.some(m=>m.purpose==="browser_read_decide"),"Every location choice now comes from the observation model");
    }else if(mode==="OUTSIDE")assert.equal(read.candidates.length,0,"Selecting a named place never replaces coordinate/radius verification");
    else{
      assert.equal(read.candidates.length,0);
      assert.ok(f.models.some(m=>m.purpose==="browser_read_decide"),"Missing/ambiguous place returns to the existing region path");
      assert.ok(navigated.includes("https://tabelog.com/en/tokyo/A1322/"),"The old observed menu route is actually executed, not merely proposed by an invalid fixture");
      assert.ok(!navigated.includes(f.result));
    }
  }finally{await f.close();}
 });
}

for(const mode of ["HOME_CARDS","INERT_SUBMIT"] as const)test(`native discovery must query before completing homepage recommendations: ${mode}`,{timeout:60_000},async()=>{
 const f=await locationSuggestionAssembly(mode);
 try{const read=await f.search();assert.equal(read.candidates.length,0,"Typed suggestion/footer name and homepage cards are not submitted search results");assert.ok(f.actions.some(action=>action.operation==='fill'));}
 finally{await f.close();}
});
