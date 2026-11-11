import assert from "node:assert/strict";
import test from "node:test";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {chromium,type Page} from "playwright-core";
import {LocalPlaywrightChromium} from "../../infrastructure/browser/local-playwright-chromium.js";
import {discoveryPackNetworkPolicy} from "../../integrations/restaurant-search/source-packs.js";
import {replayHar} from "./browser-read-test-fixtures.js";

const recordingRoot=".eval-artifacts/phase3b/d4-d8-live-20261106/site-repair-D4-runtime/runs/D4/D4/recordings/g6-D4-1793953891401-0";

test("D4 recorded body-gap failure recovers through the production snapshot reader without an empty success",async()=>{
 const recording=JSON.parse(await readFile(join(recordingRoot,"recording.json"),"utf8"));
 assert.ok(recording.entries.some((e:any)=>e.kind==="SNAPSHOT_ERROR"&&e.detail?.cause?.message?.includes("reading 'nodeType'")));
 assert.ok(recording.entries.some((e:any)=>e.kind==="GUARD_TRANSPORT_END"&&e.detail?.url==="https://tabelog.com/en/rstLst/"&&e.detail?.status===200));
 const html=await readFile(join(recordingRoot,"snapshot-0001.html"),"utf8"),directory=await mkdtemp(join(tmpdir(),"snapshot-body-gap-")),har=join(directory,"source.har");
 await writeFile(har,replayHar("https://tabelog.com/en/",html));
 let page!:Page,arm=false,gap=false,restored=0;
 const restore=()=>page.evaluate(()=>{document.documentElement.appendChild((window as any).__savedSnapshotBody);});
 const runtime=new LocalPlaywrightChromium({proxyServer:"http://127.0.0.1:9",browserType:{async launch(options){
  const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{
   const context=await newContext({...options,javaScriptEnabled:false}),newPage=context.newPage.bind(context);
   context.newPage=async()=>{
    page=await newPage();const content=page.content.bind(page),evaluate=page.evaluate.bind(page),locator=page.locator.bind(page);
    // Keep real Chromium evaluation and source HTML. Pause the body exactly
    // between snapshot stages; release on the next read using ordered browser
    // commands, without sleeps, fabricated read results or network fallback.
    const releaseAfterRead=(read:()=>Promise<any>)=>{gap=false;const pending=read();const release=evaluate(()=>document.documentElement.appendChild((window as any).__savedSnapshotBody)).then(()=>{restored++;});return pending.finally(()=>release);};
    page.content=async()=>{const value=await content();if(arm){arm=false;await evaluate(()=>{(window as any).__savedSnapshotBody=document.body;document.body.remove();});gap=true;}return value;};
    page.evaluate=((...args:any[])=>gap?releaseAfterRead(()=> (evaluate as any)(...args)):(evaluate as any)(...args)) as typeof page.evaluate;
    page.locator=((...args:any[])=>{const target=(locator as any)(...args),read=target.evaluate.bind(target);target.evaluate=(...values:any[])=>gap?releaseAfterRead(()=>read(...values)):read(...values);return target;}) as typeof page.locator;
    return page;
   };return context;
  };return browser;
 }}});
 const session=await runtime.openSession({signal:new AbortController().signal,networkPolicy:discoveryPackNetworkPolicy(),replayHarPath:har});
 try{
  await session.prepareNavigation!("https://tabelog.com/en/");await session.navigate("https://tabelog.com/en/");
  const baseline=await session.snapshot();assert.ok(baseline.visibleHtml?.length);
  arm=true;const recovered=await session.snapshot();assert.equal(restored,1);assert.equal(recovered.visibleHtml,baseline.visibleHtml);assert.equal(recovered.text,baseline.text);assert.equal(recovered.url,baseline.url);
  await page.evaluate(()=>{(window as any).__savedSnapshotBody=document.body;document.body.remove();});
  await assert.rejects(session.snapshot(),error=>error instanceof Error&&/Timeout/.test(String(error.cause)),"A persistently absent document must fail, not produce a successful empty snapshot");
  await restore();assert.equal((await session.snapshot()).visibleHtml,baseline.visibleHtml,"A failed observation must not close an otherwise usable session");
 }finally{await session.close();await rm(directory,{recursive:true,force:true});}
});
