import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { BrowserReadRecording } from "./runners/browser-read-recording.js";
import { GooglePlacesHarCapture, createEvalGooglePlacesClient } from "./runners/google-places-recording.js";
import { loadReplayRecording, recordedResponse } from "./runners/replay-read-recording.js";

// Synthetic credentials/data, 2026-10-25; never a real API key or service call.
test("Google raw bytes survive capture without key headers/query, even with no replayable DOM",async()=>{
 const root=await mkdtemp(join(tmpdir(),"praxis-google-har-"));
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:"google-only"}),key="synthetic-google-credential-for-unit",queryKey="synthetic-query-credential";
  recorder.recordSnapshot({url:"https://public.example/private?token=synthetic-private",title:"Private",text:"",html:"<h1>Omitted</h1>"});
  const raw=' {\n "places": [], "publicText": "café 東京"\n } ',body='{"textQuery":"café 東京", "pageSize":1}';let calls=0;
  const url=`https://places.googleapis.com/v1/places:searchText?key=${key}&API_KEY=${queryKey}&languageCode=en`;
  const transport=recorder.captureGoogleFetch(async(input,init)=>{
   calls++;assert.equal(String(input),url);assert.equal(new Headers(init?.headers).get("X-Goog-Api-Key"),key);assert.equal(init?.body,body);
   return new Response(raw,{headers:{"content-type":"application/json"}});
  });
  const response=await transport(url,{method:"POST",headers:{"X-Goog-Api-Key":key,"Authorization":"Bearer synthetic-bearer-value"},body});
  assert.equal(await response.text(),raw);assert.equal(calls,1);
  const result=await recorder.finish();assert.equal(result.replay.status,"NOT_REPLAYABLE");
  const text=await readFile(join(result.path,"replay.har"),"utf8"),har=JSON.parse(text),entry=har.log.entries[0];
  assert.equal(entry.request.url,"https://places.googleapis.com/v1/places:searchText?languageCode=en");assert.deepEqual(entry.request.headers,[]);
  assert.equal(entry.request.postData.text,body);assert.equal(entry.response.content.text,raw);
  for(const secret of [key,queryKey,"synthetic-bearer-value","X-Goog-Api-Key"])assert.ok(!text.includes(secret));
  const loaded=await loadReplayRecording(result.path,join(root,"filtered.har"));assert.ok(recordedResponse(loaded,entry.request.url,"POST",body));assert.equal(loaded.allowed.size,0);
 }finally{await rm(root,{recursive:true,force:true});}
});

test("Runner Google factory keeps fixture transport and validates proxy configuration",async()=>{
 const errors:any[]=[],capture=new GooglePlacesHarCapture(reason=>errors.push(reason));let calls=0;
 const client=createEvalGooglePlacesClient({apiKey:"synthetic-client-credential",timeoutMs:1000,fetchImplementation:async()=>{calls++;return new Response('{"places":[],"results":[]}',{headers:{"content-type":"application/json"}});}},source=>capture.wrap(source));
 assert.deepEqual(await client.textSearch({textQuery:"fixture",pageSize:1},new AbortController().signal),[]);
 assert.deepEqual(await client.reverseAddress({latitude:35,longitude:139},new AbortController().signal),{addressComponents:[]});
 assert.equal(calls,2);assert.equal(capture.entries.length,2);assert.deepEqual(errors,[]);
 const reverse=capture.entries[1] as any;assert.equal(reverse.request.method,"GET");assert.equal(reverse.request.url,"https://geocode.googleapis.com/v4/geocode/location?location.latitude=35&location.longitude=139");assert.equal(reverse.request.postData,undefined);
 assert.throws(()=>createEvalGooglePlacesClient({apiKey:"synthetic",proxyServer:"ftp://localhost"},source=>capture.wrap(source)),(e:any)=>e.code==="GOOGLE_CONFIGURATION_ERROR");
});

test("key scans reject decoded JSON response, pre-write payload and post-write corruption",async()=>{
 const root=await mkdtemp(join(tmpdir(),"praxis-google-key-scans-"));
 try{
  const key="AI"+"za"+"B".repeat(35),errors:any[]=[],capture=new GooglePlacesHarCapture(reason=>errors.push(reason));
  const raw='{"metadata":{"value":"\\u0041Iza'+"B".repeat(35)+'"}}';
  const transport=capture.wrap(async()=>new Response(raw,{headers:{"content-type":"application/json"}}));
  assert.equal(await (await transport("https://places.googleapis.com/v1/places:searchText",{method:"POST",body:'{"textQuery":"fixture"}'})).text(),raw);
  assert.equal(capture.entries.length,0);assert.equal(errors[0].reason,"KEY_PATTERN_RESPONSE");
  const before=join(root,"before.har");assert.equal(await capture.writeHar(before,{log:{entries:[{text:key}]}}),false);
  await assert.rejects(access(before));assert.ok(errors.some(e=>e.stage==="BEFORE_WRITE"));
  const after=join(root,"after.har"),verify=capture.verifyWrittenHar.bind(capture);
  capture.verifyWrittenHar=async path=>{const bytes=JSON.parse(await readFile(path,"utf8"));bytes.injected=key;await writeFile(path,JSON.stringify(bytes));return verify(path);};
  assert.equal(await capture.writeHar(after,{log:{entries:[]}}),false);await assert.rejects(access(after));assert.ok(errors.some(e=>e.stage==="AFTER_WRITE"));
  assert.ok(!JSON.stringify(errors).includes(key),'diagnostics must never echo rejected credentials');
 }finally{await rm(root,{recursive:true,force:true});}
});

test("late Google responses cannot append after recorder finalization",async()=>{
 let settle!:(r:Response)=>void;const errors:any[]=[],capture=new GooglePlacesHarCapture(reason=>errors.push(reason));
 const transport=capture.wrap(()=>new Promise<Response>(resolve=>{settle=resolve;}));
 const pending=transport("https://places.googleapis.com/v1/places:searchNearby",{method:"POST",body:'{"includedTypes":["restaurant"]}'});
 capture.close();settle(new Response('{"places":[]}'));await pending;
 assert.equal(capture.entries.length,0);assert.deepEqual(errors,[]);
});
