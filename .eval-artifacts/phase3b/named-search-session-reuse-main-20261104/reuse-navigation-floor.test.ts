// Merge-interaction component probe: production Executor, constructed transport.
// No external browser/network/model; does not claim current website behavior.
import assert from "node:assert/strict";
import test from "node:test";
import {BrowserTaskExecutor,type BrowserExecutionDiagnostic} from "../../../src/infrastructure/browser/browser-task-executor.js";
import type {BrowserSession} from "../../../src/infrastructure/browser/browser-runtime.js";

test("a reused observed search form inherits B's navigation floor before submission",async t=>{
  t.mock.timers.enable({apis:["Date"],now:0});
  let url="about:blank",value="",navigations=0,submits=0;
  const diagnostics:BrowserExecutionDiagnostic[]=[];
  const session:BrowserSession={
    metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:new Date().toISOString(),readNetworkBoundary:"INSTALLED"},
    async navigate(target){url=target;navigations++;},
    async snapshot(){return {url,html:"<main>Search</main>",text:"Search",title:"Search"};},
    async observeControls(){return [
      {id:"query",stableKey:"query",kind:"INPUT",role:"searchbox",label:"Restaurant search",type:"search",value,visible:true,disabled:false,controlGroupKey:"form",structure:{tag:"INPUT",name:"query",classes:[],dialogLabel:"",formClass:"",sliderCount:0}},
      {id:"submit",stableKey:"submit",kind:"BUTTON",role:"button",label:"Search",type:"submit",formMethod:"GET",visible:true,disabled:false,controlGroupKey:"form"},
    ];},
    async fill(_target,next){value=next;t.mock.timers.setTime(87_500);},
    async click(){submits++;},async select(_target,next){return [next];},async waitFor(){},async screenshot(){return new Uint8Array();},async close(){},
  };
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{reuseSourceSessions:true,maxAutomaticElapsedMs:90_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24,onDiagnostic:d=>diagnostics.push(d)});
  const signal=new AbortController().signal,origin="https://public.example";
  try{
    executor.beginProvider("first","TABELOG");await executor.acquire(signal,"TABELOG","DISCOVERY");
    await executor.search({source:"TABELOG",signal,allowedOrigins:[origin],session,url:origin+"/search?q=first",query:"first"});
    executor.endReadScope();executor.beginProvider("second","TABELOG");
    assert.equal(await executor.acquire(signal,"TABELOG","DISCOVERY"),session);
    t.mock.timers.setTime(86_000);
    await assert.rejects(executor.search({source:"TABELOG",signal,allowedOrigins:[origin],session,url:origin+"/search?q=second",query:"second"}),{code:"BROWSER_BUDGET_EXHAUSTED"});
    assert.equal(value,"second","the observed fill crossed into the floor; submit must recheck");
    assert.equal(navigations,1);assert.equal(submits,0);
    assert.ok(diagnostics.some(d=>d.event==="OPERATION_FAILED"&&d.lifecycle.reason==="NAVIGATION_BUDGET_EXHAUSTED"));
  }finally{await executor.closeAll();}
});
