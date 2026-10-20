import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {benchmarkOutlet,evaluateNameResolution,nameResolutionInput,summarizeNameResolution,type NameResolutionSample,type NameResolutionObservation} from './name-resolution-benchmark.js';
import {assertNameResolutionLiveAdmission,runNameResolutionMethodA} from './name-resolution-method-a.js';
import type {BrowserRuntime,BrowserSnapshot} from '../../../infrastructure/browser/browser-runtime.js';
const source='https://tabelog.com/tokyo/A1303/A130301/12345/';
const sample:NameResolutionSample={id:'test',role:'GOLD',platform:'TABELOG',subject:{name:'Fixture Restaurant',address:'1-1 Tokyo Fixture Street',phone:'03-1111-2222',coordinates:{lat:35.66,lng:139.7}},expected:{outletId:'12345',sourceUrl:source},groups:{areas:['TEST_AREA'],nameShapes:['ENGLISH']},provenance:[]};
const result:NameResolutionObservation={sampleId:'test',method:'A',platform:'TABELOG',accepted:true,returnedUrl:source,rawSelectedPageUrl:source,identityRecorded:true,observedOutletUrls:[source],searchCompleted:true,elapsedMs:100,modelCalls:1};
test('name benchmark uses independent literal IDs, requires raw selected evidence and stops on wrong acceptance',()=>{
 assert.deepEqual(benchmarkOutlet('https://tabelog.com/en/tokyo/A1303/A130301/12345/party/'),{platform:'TABELOG',outletId:'12345'});
 assert.deepEqual(benchmarkOutlet('https://www.tablecheck.com/ja/sushiinase/reserve/landing'),{platform:'TABLECHECK',outletId:'sushiinase'});
 assert.equal(benchmarkOutlet('https://www.tablecheck.com/en/japan/search'),undefined);
 assert.equal(evaluateNameResolution(sample,result).verdict,'CORRECT');
 assert.equal(evaluateNameResolution(sample,{...result,rawSelectedPageUrl:'https://tabelog.com/tokyo/A1303/A130301/99999/'}).stopBatch,true);
 assert.equal(evaluateNameResolution(sample,{...result,returnedUrl:'https://tabelog.com/tokyo/A1303/A130301/99999/',rawSelectedPageUrl:'https://tabelog.com/tokyo/A1303/A130301/99999/'}).severity,'S0');
 const {rawSelectedPageUrl:_raw,...noRaw}=result;assert.equal(evaluateNameResolution(sample,noRaw).verdict,'NOT_EVALUATED');
 const {expected:_expected,...control}=sample;assert.equal(evaluateNameResolution({...control,role:'CONTROL'},result).verdict,'REVIEW_REQUIRED');
 assert.equal(evaluateNameResolution(sample,{...result,accepted:false,failure:'SOURCE_BUSY'}).verdict,'ENV_FAILURE');
 for(const status of [403,429])assert.equal(evaluateNameResolution(sample,{...result,accepted:false,failure:`SOURCE_HTTP_${status}`}).verdict,'ENV_FAILURE');
 assert.equal(evaluateNameResolution(sample,{...result,accepted:false,observedOutletUrls:[]}).verdict,'NOT_FOUND');
 assert.equal(evaluateNameResolution(sample,{...result,accepted:false}).verdict,'UNCERTAIN');
 const aggregate=summarizeNameResolution([sample],[result]);assert.equal(aggregate.methods[0]!.medianMs,100);assert.equal(aggregate.methods[1]!.correctRate,null);
 assert.throws(()=>summarizeNameResolution([sample],[result,result]),/Duplicate/);
});
test('frozen name samples have exact declared counts and no URL/Gold can reach method input',()=>{
 const base=new URL('../../../../.eval-artifacts/name-resolution-benchmark-20261019/',import.meta.url);
 const bytes=readFileSync(new URL('samples.json',base));const frozen=JSON.parse(readFileSync(new URL('sample-freeze.json',base),'utf8'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87');
 assert.equal(frozen.sha256,'89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87');
 const dataset=JSON.parse(bytes.toString());assert.equal(dataset.samples.length,42);
 assert.equal(dataset.samples.filter((s:NameResolutionSample)=>s.role==='GOLD'&&s.platform==='TABELOG').length,30);
 assert.equal(dataset.samples.filter((s:NameResolutionSample)=>s.role==='GOLD'&&s.platform==='TABLECHECK').length,2);
 for(const s of dataset.samples){assert.deepEqual(Object.keys(nameResolutionInput(s)).sort(),['address','coordinates','name','phone']);assert.ok(!JSON.stringify(nameResolutionInput(s)).includes('https://'));}
});
test('name benchmark cannot admit live before sample approval and healthy source evidence',()=>{
 const ready={sampleSha256:'x',approval:{sampleSha256:'x',reviewer:'independent-fixture',approved:true},preflight:{tablecheckStatus:200,tabelogStatus:200,tabelogBusy:false}};
 assert.doesNotThrow(()=>assertNameResolutionLiveAdmission({...ready,preflight:{tabelogStatus:200,tabelogBusy:false}},'TABELOG'));
 assert.doesNotThrow(()=>assertNameResolutionLiveAdmission(ready,'TABELOG'));
 assert.throws(()=>assertNameResolutionLiveAdmission({...ready,preflight:{tabelogStatus:200,tabelogBusy:false}},'TABLECHECK'),/not ready/);
 assert.throws(()=>assertNameResolutionLiveAdmission({...ready,preflight:{tablecheckStatus:200}},'TABELOG'),/not ready/);
 assert.doesNotThrow(()=>assertNameResolutionLiveAdmission({...ready,preflight:{...ready.preflight,tabelogStatus:206}},'TABELOG'));
 assert.throws(()=>assertNameResolutionLiveAdmission({...ready,approval:{...ready.approval,approved:false}},'TABELOG'),/approval/);
 assert.throws(()=>assertNameResolutionLiveAdmission({...ready,preflight:{...ready.preflight,tablecheckStatus:503}},'TABLECHECK'),/not ready/);
 assert.throws(()=>assertNameResolutionLiveAdmission({...ready,preflight:{...ready.preflight,tabelogBusy:true}},'TABELOG'),/not ready/);
});
test('production name prefix succeeds for both sources without using a known URL or operating availability',async()=>{
 for(const platform of ['TABELOG','TABLECHECK'] as const){
  const navigated:string[]=[],actions:string[]=[];let current:BrowserSnapshot;
  const detail=platform==='TABELOG'?source:'https://www.tablecheck.com/en/fixture';
  const runtime:BrowserRuntime={openSession:async()=>({metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:'2026-10-20T00:00:00Z'},
   navigate:async url=>{navigated.push(url);const search=/rstLst|japan\/search/.test(url);const html=search?`<a class="list-rst__rst-name-target" href="${detail}">Fixture Restaurant</a>`:`<title>Fixture Restaurant</title><h1>Fixture Restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:'Fixture Restaurant',address:'1-1 Tokyo Fixture Street',telephone:'03-1111-2222'})}</script><a href="https://www.tablecheck.com/en/shops/fixture/reserve">Reserve</a>`;current={url,title:'Fixture Restaurant',text:html.replace(/<[^>]*>/g,' '),html};},
   snapshot:async()=>current,click:async()=>{actions.push('click');},fill:async()=>{actions.push('fill');},select:async()=>{actions.push('select');return[];},waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{},
  })};
  const artifact=await runNameResolutionMethodA('test',platform,sample.subject,{mode:'OFFLINE_FIXTURE',runtime,signal:new AbortController().signal});
  assert.equal(artifact.observation.accepted,true,JSON.stringify(artifact.observation));assert.equal(artifact.observation.modelCalls,0);
  assert.ok(navigated[0]!.includes('Fixture%20Restaurant')||navigated[0]!.includes('Fixture+Restaurant'));
  assert.equal(navigated.some(u=>u.includes('/reserve')),false);assert.deepEqual(actions,[]);assert.equal(artifact.boundary.availabilityEvaluated,false);
 }
});

test('scripted browser decisions cannot see placeholder dates or fill request controls in a name-only task',async()=>{
 let fills=0,calls=0;const page:BrowserSnapshot={url:'https://www.tablecheck.com/en/japan/search',title:'Search',text:'Public name search',html:'<input name="search_text"><input type="date">'};
 const runtime:BrowserRuntime={openSession:async()=>({metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:'2026-10-20T00:00:00Z',readNetworkBoundary:'INSTALLED'},navigate:async url=>{page.url=url;},snapshot:async()=>page,
  observeControls:async()=>[{id:'date',stableKey:'date',kind:'INPUT',role:'textbox',label:'Date',type:'date',visible:true,disabled:false,structure:{tag:'INPUT',name:'date',classes:[],dialogLabel:'',formClass:'',sliderCount:0}}],
  fill:async()=>{fills++;},click:async()=>{},select:async()=>[],waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{},
 })};
 const artifact=await runNameResolutionMethodA('no-leak','TABLECHECK',sample.subject,{mode:'OFFLINE_FIXTURE',runtime,signal:new AbortController().signal,decision:{decide:async input=>{
  calls++;assert.equal('date' in input.goal,false);assert.equal('partySize' in input.goal,false);assert.ok(!JSON.stringify(input).includes('1970-01-01'));
  assert.ok(input.observation.targets.every(t=>!t.availableActions?.some(a=>a.endsWith(':DATE'))));
  return {type:'FILL_AUTHORITATIVE',targetRef:input.observation.targets[0]!.ref,field:'DATE',reason:'Synthetic prohibited date proposal'};
 }}});
 assert.ok(calls>0&&calls<=3);assert.equal(artifact.observation.modelCalls,calls);assert.equal(fills,0);assert.equal(artifact.observation.accepted,false);
});
