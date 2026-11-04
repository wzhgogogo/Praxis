import assert from "node:assert/strict";
import test from "node:test";
import {BrowserTaskExecutor} from "./browser-task-executor.js";
import type {BrowserSession} from "./browser-runtime.js";

for(const mode of ["NO_GUARD","RESERVE_AFTER_FILL","OPERATION_CAP"] as const)test(`location suggestion shortcut preserves existing admission: ${mode}`,async()=>{
  const calls:string[]=[],controller=new AbortController();
  const session:BrowserSession={metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:"2026-11-04T08:00:00Z",...(mode==="NO_GUARD"?{}:{readNetworkBoundary:"INSTALLED"})},
    async snapshot(){calls.push("snapshot");return {url:"https://example.test/",title:"Search",html:"",text:""};},
    async observeControls(){calls.push("observe");return [{id:"current-input",stableKey:"input",kind:"INPUT",role:"combobox",label:"Area / Station",type:"search",visible:true,disabled:false}];},
    async fill(){calls.push("fill");controller.abort({code:"DELIVERY_RESERVE_REACHED"});},async click(){calls.push("click");assert.fail("No click is admitted");},
    async navigate(){assert.fail("No navigation");},async select(){assert.fail("No native select");},async waitFor(){},async waitForSettled(){calls.push("wait");return true;},async screenshot(){return new Uint8Array();},async close(){},
  };
  const executor=new BrowserTaskExecutor({async openSession(){return session;}},{maxAutomaticElapsedMs:90_000,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,maxOperationsPerCandidate:mode==="OPERATION_CAP"?1:20});
  const input={source:"DIRECTORY",stage:"DISCOVERY" as const,signal:controller.signal,session,allowedOrigins:["https://example.test"],taskId:"admission-control",goal:{outlet:{name:"restaurants"},location:{name:"Akabane",latitude:35.7799638,longitude:139.723053,radiusMeters:1000},hardCriteria:[]},objective:"Observed location control",matchesSuggestion:()=>true,completion:()=>({complete:false as const,reason:"No source result"})};
  if(mode==="NO_GUARD"){
    assert.equal((await executor.selectLocationSuggestion(input)).status,"NO_MATCH");assert.deepEqual(calls,["snapshot"]);
  }else{
    await assert.rejects(executor.selectLocationSuggestion(input));
    assert.equal(calls.includes("click"),false);assert.equal(calls.includes("wait"),false);
    assert.equal(calls.includes("fill"),mode==="RESERVE_AFTER_FILL");
  }
});
