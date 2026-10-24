import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { BrowserReadRecording } from "../../eval/restaurant/agent-loop/runners/browser-read-recording.js";
import { loadReplayRecording,createRecordedBrowser } from "../../eval/restaurant/agent-loop/runners/replay-read-recording.js";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";

// Minimal real localhost HTML/CSS, 2026-10-24. No historical run.
test("missing HAR response is stopped without any network fallback",{timeout:20_000},async t=>{
 let hits=0;
 const server=createServer((request,response)=>{hits++;response.setHeader("content-type",request.url==="/public.css"?"text/css":"text/html");response.end(request.url==="/public.css"?"h1 {color: blue}":'<link rel="stylesheet" href="/public.css"><h1>Public fixture</h1>');});
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 const root=await mkdtemp(join(tmpdir(),"praxis-replay-missing-")),controller=new AbortController();
 const policy={documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]};
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:"original"});
  const original=await new LocalPlaywrightChromium().openSession({signal:controller.signal,networkPolicy:policy,recordResponse:r=>recorder.recordResponse(r)});
  await original.prepareNavigation?.(origin+"/public");await original.navigate(origin+"/public");recorder.recordSnapshot(await original.snapshot());await original.close();
  const recording=await recorder.finish();assert.equal(recording.pages[0]!.status,"REPLAYABLE");
  const harPath=join(recording.path,"replay.har"),har=JSON.parse(await readFile(harPath,"utf8"));
  har.log.entries=har.log.entries.filter((row:any)=>row.request.url!==origin+"/public.css");await writeFile(harPath,JSON.stringify(har));
  const loaded=await loadReplayRecording(recording.path,join(root,"filtered.har"));let stopped:unknown;
  hits=0;
  const replay=createRecordedBrowser(loaded,reason=>{stopped=reason;});
  const session=await replay.browser.openSession({signal:controller.signal,networkPolicy:policy});
  try{await session.prepareNavigation?.(origin+"/public");await session.navigate(origin+"/public").catch(()=>{});await session.snapshot().catch(()=>{});}finally{await session.close();}
  assert.equal(hits,0,"unrecorded CSS must not reach even the local source");
  assert.equal((stopped as any)?.reason,"MISSING_RESPONSE");t.diagnostic(JSON.stringify({sourceRequests:hits,stopped}));
 }finally{controller.abort();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(root,{recursive:true,force:true});}
});
