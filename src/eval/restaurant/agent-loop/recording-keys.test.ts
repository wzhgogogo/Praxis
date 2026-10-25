import assert from 'node:assert/strict';
import {access,mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {BrowserReadRecording} from './runners/browser-read-recording.js';

const publicKey='AI'+'za'+'P'.repeat(35),signature='synthetic-public-signature',client='synthetic-public-client';
async function google(recorder:BrowserReadRecording,key='synthetic-owned-google-key'){
 await recorder.captureGoogleFetch(async()=>new Response('{"places":[]}',{headers:{'content-type':'application/json'}}))(
  'https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'X-Goog-Api-Key':key},body:'{"textQuery":"fixture"}'});
}
async function persisted(directory:string):Promise<string>{
 const pieces:string[]=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=join(directory,entry.name);pieces.push(entry.isDirectory()?await persisted(file):(await readFile(file)).toString());
 }
 return pieces.join('\n');
}

test('slot1 public map URL is redacted while residual key patterns omit only their page or response',async()=>{
 const root=await mkdtemp(join(tmpdir(),'recording-public-keys-'));
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:'map'});await google(recorder);
  const saved=await readFile(new URL('./fixtures/slot1-public-map.html',import.meta.url),'utf8');
  const html=saved.replaceAll('__PUBLIC_MAP_KEY__',publicKey).replaceAll('__PUBLIC_SIGNATURE__',signature)
   +`<img src="https://maps.googleapis.com/maps/api/staticmap?key=${publicKey}" data-hires-src="//maps.googleapis.com/maps/api/staticmap?key=${publicKey}&amp;signature=${signature}&amp;client=${client}" srcset="https://maps.googleapis.com/maps/api/staticmap?key=${publicKey} 1x, https://maps.googleapis.com/maps/api/staticmap?client=${client} 2x"><a href='https://maps.googleapis.com/map?key=${publicKey}'>Map</a><img data-src=https://maps.googleapis.com/map?key=${publicKey}><source data-srcset="https://maps.googleapis.com/map?signature=${signature} 1x,https://maps.googleapis.com/map?client=${client} 2x">`;
  recorder.recordSnapshot({url:'https://public.example/map',html,text:'Saved public map',title:'Map'});
  const badUrl='https://public.example/bad';
  recorder.recordSnapshot({url:badUrl,html:`<p>${publicKey}</p>`,text:'Residual credential pattern',title:'Bad'});
  await recorder.recordResponse({url:'https://public.example/data',method:'GET',resourceType:'fetch',status:200,contentType:'application/json',body:Buffer.from(JSON.stringify({publicNote:publicKey}))});
  recorder.recordSnapshot({url:'https://public.example/dependent',html:'<h1>Dependent page</h1>',text:'Dependent',title:'Dependent',
   networkRequests:[{outcome:'ADMITTED',origin:'https://public.example',pathname:'/data',method:'GET',resourceType:'fetch',queryKeys:[]}]});
  const result=await recorder.finish();
  assert.equal(result.replay.status,'PARTIALLY_REPLAYABLE','the safe map page and Google response must survive; old writer rejected the whole HAR');
  assert.equal(result.pages[0]!.status,'REPLAYABLE');assert.equal(result.pages[1]!.reason,'UNSAFE_DOCUMENT');
  assert.equal(result.pages[1]!.diagnostic.status,'OMITTED');
  assert.equal(result.pages[2]!.reason,'UNCAPTURED_DYNAMIC_RESPONSE');assert.equal(result.pages[2]!.diagnostic.status,'SAVED');
  const har=JSON.parse(await readFile(join(result.path,'replay.har'),'utf8'));
  assert.ok(har.log.entries.some((entry:any)=>entry.request.url==='https://public.example/map'));
  assert.ok(har.log.entries.some((entry:any)=>entry.request.url.includes('places.googleapis.com')));
  assert.ok(!har.log.entries.some((entry:any)=>entry.request.url===badUrl||entry.request.url==='https://public.example/data'));
  const diagnostic=await readFile(join(result.path,'diagnostic/snapshot-0001.html'),'utf8');
  assert.match(diagnostic,/data-lazy-src=/);assert.match(diagnostic,/key=REDACTED/);assert.match(diagnostic,/signature=REDACTED/);assert.match(diagnostic,/client=REDACTED/);
  assert.match(diagnostic,/data-src=https:\/\/maps.googleapis.com\/map\?key=REDACTED/);assert.match(diagnostic,/data-srcset=/);
  const all=await persisted(result.path);
  for(const secret of [publicKey,signature,client,'synthetic-owned-google-key'])assert.ok(!all.includes(secret),'no credential literal may survive in any recording file');
  assert.doesNotMatch(all,/\bAIza[0-9A-Za-z_-]{30,}/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('an owned credential in a document rejects the whole recording before any content file is published',async()=>{
 const root=await mkdtemp(join(tmpdir(),'recording-owned-keys-'));
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:'owned'}),owned='synthetic-owned-credential-no-pattern';await google(recorder,owned);
  recorder.recordSnapshot({url:'https://public.example/safe',html:'<h1>Safe page</h1>',text:'Safe',title:'Safe'});
  recorder.recordSnapshot({url:'https://public.example/leak',html:`<img data-lazy-src="https://maps.googleapis.com/maps/api/staticmap?key=${owned}">`,text:'Map',title:'Map'});
  const result=await recorder.finish();assert.equal(result.replay.status,'NOT_REPLAYABLE');
  assert.ok(result.pages.every(page=>page.status==='NOT_REPLAYABLE'&&page.diagnostic.status==='OMITTED'));
  await assert.rejects(access(join(result.path,'replay.har')));
  assert.deepEqual(await readdir(result.path),['recording.json']);
  assert.ok(!(await persisted(result.path)).includes(owned));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('pre-registered model credentials and owned Google response/trace leaks all reject the complete recording',async()=>{
 const root=await mkdtemp(join(tmpdir(),'recording-own-boundaries-'));
 try{
  for(const location of ['ENCODED_URL','GOOGLE_RESPONSE','TRACE','FOREIGN_RESPONSE_OWN_BODY']){
   const owned='synthetic-own-model-value',recorder=new BrowserReadRecording({directory:root,runId:location,ownCredentials:[owned]});
   recorder.recordSnapshot({url:'https://public.example/safe',html:'<h1>Safe</h1>',text:'Safe',title:'Safe'});
   if(location==='ENCODED_URL')recorder.recordSnapshot({url:'https://public.example/map',html:`<p>100% public</p><img data-src="https://maps.googleapis.com/map?key=%73ynthetic-own-model-value">`,text:'Map',title:'Map'});
   if(location==='GOOGLE_RESPONSE')await recorder.captureGoogleFetch(async()=>new Response(JSON.stringify({metadata:{value:owned}}),{headers:{'content-type':'application/json'}}))('https://places.googleapis.com/v1/places:searchText',{method:'POST',body:'{"textQuery":"fixture"}'});
   if(location==='TRACE')recorder.record('MODEL_WIRE',{text:owned});
   if(location==='FOREIGN_RESPONSE_OWN_BODY')await recorder.captureGoogleFetch(async()=>new Response(JSON.stringify({metadata:{value:publicKey}}),{headers:{'content-type':'application/json'}}))('https://places.googleapis.com/v1/places:searchText',{method:'POST',body:JSON.stringify({textQuery:owned})});
   const result=await recorder.finish();assert.equal(result.replay.status,'NOT_REPLAYABLE',location);
   assert.deepEqual(await readdir(result.path),['recording.json'],location);assert.ok(!(await persisted(result.path)).includes(owned),location);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
