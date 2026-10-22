// Frozen, one-batch outer: reviewed Tabelog Gold verification and unchanged method A.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { LocalPlaywrightChromium } from '../../../src/infrastructure/browser/local-playwright-chromium.ts';
import { discoveryPackNetworkPolicy,tabelogDiscoveryPack } from '../../../src/integrations/restaurant-search/source-packs.ts';
import { runNameResolutionMethodA } from '../../../src/eval/restaurant/agent-loop/name-resolution-method-a.ts';
import { benchmarkOutlet,nameResolutionInput,evaluateNameResolution,summarizeNameResolution } from '../../../src/eval/restaurant/agent-loop/name-resolution-benchmark.ts';
import { ModelBrowserReadActionDecision } from '../../../src/infrastructure/browser/browser-action-decision.ts';
import { DeepSeekModelGateway } from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
const dir='.eval-artifacts/name-resolution-benchmark-20261019/live-20261020',samplePath='.eval-artifacts/name-resolution-benchmark-20261019/samples.json';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const write=async(p,x)=>fs.writeFile(p,JSON.stringify(x,null,2)+'\n');
const plan=await read(`${dir}/plan.json`),freeze=await read(`${dir}/freeze.json`);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))if(sha(await fs.readFile(p))!==h)throw Error(`FROZEN_CHANGED:${p}`);};await verify();
const sampleBytes=await fs.readFile(samplePath);if(sha(sampleBytes)!==plan.sampleSha256)throw Error('SAMPLE_SHA_CHANGED');
const samples=JSON.parse(sampleBytes).samples,selected=samples.filter(s=>s.platform==='TABELOG');
if(selected.length!==35||selected.filter(s=>s.role==='GOLD').length!==30)throw Error('EXACT_SOURCE_COUNTS_REQUIRED');
if((await read(plan.selectionSummary)).gate.status!=='PASS')throw Error('SELECTION_RECHECK_NOT_PASSED');
const phase=process.argv[2];if(!['verify','method-a','--dry-run','--offline-controls'].includes(phase))throw Error('Choose verify or method-a');
if(phase==='--dry-run'){console.log(JSON.stringify({status:'OFFLINE_PLAN',gold:30,controls:5,skippedTablecheck:7,modelMax:150,perSubjectMax:3,intervalMs:30000,cooldownMs:600000}));process.exit(0);}

if(phase==='--offline-controls'){
 const url='https://tabelog.com/en/tokyo/A1111/A111111/12345/';
 const sample={id:'literal',expected:{outletId:'12345'},subject:{name:'Public Fixture',phone:'+81-3-1111-2222',address:'1-2-3 Fixture Street'}};
 const page={url,title:'Public Fixture',text:'Public Fixture',html:'<script type="application/ld+json">'+JSON.stringify({'@type':'Restaurant',name:'Public Fixture',telephone:'03-1111-2222',address:'1-2-3 Fixture Street'})+'</script>'};
 const record={documents:[{status:200}]};
 assert.equal(certify(sample,page,record).status,'VERIFIED');
 assert.equal(certify({...sample,subject:{...sample.subject,phone:'03-9999-9999',address:'99 Wrong Street'}},page,record).status,'DROPPED');
 assert.equal(certify({...sample,expected:{outletId:'99999'}},page,record).status,'DROPPED');
 assert.equal(certify(sample,undefined,record).status,'DROPPED');
 assert.equal(certify(sample,page,{...record,sourceBlock:{kind:'SOURCE_BUSY'}}).status,'DROPPED');
 assert.equal(certify(sample,page,{documents:[{status:403}]}).status,'DROPPED');
 assert.equal(plan.sourceIntervalMs,30000);assert.equal(plan.sourceCooldownMs,600000);assert.equal(plan.sameDaySourceBlockLimit,3);assert.equal(plan.maxPerSubject,3);assert.equal(plan.maxModelCalls,150);
 await write(`${dir}/offline-controls.json`,{status:'PASS',assertions:11,network:0,models:0,checks:['phone/address positive','identity mismatch','wrong outlet ID','no page','busy','403','30s cadence','10m cooldown','3/day','3 models/subject','150 total']});
 console.log('PASS11 offline controls;0 network/models');process.exit(0);
}
execFileSync('git',['diff','--exit-code','HEAD','--','src',`${dir}/run-benchmark.mjs`,`${dir}/plan.json`,`${dir}/freeze.json`],{stdio:'pipe'});
const ledgerPath=`${dir}/ledger.json`;let ledger;
try{ledger=await read(ledgerPath);}catch(e){if(e.code!=='ENOENT')throw e;ledger={schema:'name-benchmark-live-ledger@1',sampleSha256:plan.sampleSha256,codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),attempts:[],modelCalls:[],sourceBlocks:[],stop:null,lastFinishedAt:null,nextAllowedAt:null};await write(ledgerPath,ledger);}
if(ledger.stop)throw Error(`BATCH_STOPPED:${ledger.stop.reason}`);
await fs.mkdir(`${dir}/${phase}`); // atomic one-shot phase: no overwrites/resume/reruns
const save=()=>write(ledgerPath,ledger),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const day=iso=>new Intl.DateTimeFormat('en-CA',{timeZone:plan.dayTimeZone}).format(new Date(iso));
const forbidden=u=>/\/(?:reserve|reservation|booking|checkout|payment|cancel)(?:\/|[?#]|$)/i.test(new URL(u).pathname)||/^(?:yoyaku\.)/i.test(new URL(u).hostname);
const busy=p=>/現在アクセスが集中しています|現在アクセスが集中し、ページが表示されにくい状態/.test(p.title+' '+p.text);
async function pause(){const at=Math.max(ledger.lastFinishedAt?Date.parse(ledger.lastFinishedAt)+30000:0,ledger.nextAllowedAt?Date.parse(ledger.nextAllowedAt):0);if(Date.now()<at){console.log(JSON.stringify({event:'PAUSE',until:new Date(at).toISOString(),reason:ledger.nextAllowedAt?'SOURCE_COOLDOWN':'MINIMUM_SOURCE_INTERVAL'}));while(Date.now()<at)await sleep(Math.min(30000,at-Date.now()));}}
function observedRuntime(record,controller){
 const block=(kind,detail)=>{if(!record.sourceBlock){record.sourceBlock={kind,...detail,at:new Date().toISOString()};controller.abort();}};
 const stop=(reason,detail)=>{if(!record.boundaryStop){record.boundaryStop={reason,...detail,at:new Date().toISOString()};controller.abort();}};
 const proxy=(target,overrides)=>new Proxy(target,{get(t,k){if(k in overrides)return overrides[k];const v=Reflect.get(t,k);return typeof v==='function'?v.bind(t):v;}});
 const browserType={launch:async options=>{
  const browser=await chromium.launch(options);return proxy(browser,{newContext:async options=>{
   const context=await browser.newContext(options);return proxy(context,{newPage:async()=>{
    const page=await context.newPage();
    await page.route('**/*',async route=>{const r=route.request();if(!['GET','HEAD','OPTIONS'].includes(r.method())){record.blockedRequests.push({url:r.url().split('?')[0],method:r.method(),reason:'READ_ONLY_OUTER'});await route.abort();stop('NON_READ_REQUEST_ATTEMPT',{method:r.method()});return;}if(r.isNavigationRequest()&&(new URL(r.url()).origin!=='https://tabelog.com'||forbidden(r.url()))){await route.abort();stop('FORM_OR_FOREIGN_DOCUMENT_ATTEMPT',{url:r.url().split('?')[0]});return;}await route.fallback();});
    page.on('response',response=>{const r=response.request(),u=new URL(r.url());const item={at:new Date().toISOString(),origin:u.origin,pathname:u.pathname,queryKeys:[...u.searchParams.keys()],method:r.method(),resourceType:r.resourceType(),status:response.status()};record.network.push(item);if(r.isNavigationRequest()&&r.frame()===page.mainFrame()){record.documents.push({...item,url:r.url()});if([403,429,503].includes(item.status))block('HTTP_STATUS',{status:item.status,url:r.url()});}});
    return page;
   }});
  }});
 }};
 const runtime=new LocalPlaywrightChromium({browserType,headless:true});
 return {readNetworkBoundaryCapability:runtime.readNetworkBoundaryCapability,openSession:async input=>{
  const session=await runtime.openSession(input);return proxy(session,{snapshot:async()=>{const p=await session.snapshot();record.snapshots.push(p);if(busy(p))block('SOURCE_BUSY',{url:p.url});return p;},navigate:async(url,options)=>{if(controller.signal.aborted)throw Error('OUTER_SOURCE_STOP');await session.navigate(url,options);}});
 }};
}
const policy=discoveryPackNetworkPolicy([tabelogDiscoveryPack]);
function publicIdentity(page){
 const objects=[];const visit=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(visit);return;}if((Array.isArray(x['@type'])?x['@type']:[x['@type']]).some(t=>['Restaurant','LocalBusiness','FoodEstablishment'].includes(t)))objects.push(x);if(x['@graph'])visit(x['@graph']);};
 for(const m of page.html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(m[1]));}catch{}}
 const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp);/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/\s+/g,' ').trim();
 const phones=[],addresses=[],quotes=[];
 for(const x of objects){if(x.url&&benchmarkOutlet(x.url)?.outletId!==benchmarkOutlet(page.url)?.outletId)continue;if(x.telephone){phones.push(String(x.telephone));quotes.push({field:'phone',value:String(x.telephone),basis:'MAIN_BUSINESS_JSON_LD'});}if(x.address){const value=typeof x.address==='string'?x.address:['postalCode','addressRegion','addressLocality','streetAddress'].map(k=>x.address[k]??'').join(' ');addresses.push(value);quotes.push({field:'address',value,basis:'MAIN_BUSINESS_JSON_LD'});}}
 for(const m of page.html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){const row=m[1],header=clean(row.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i)?.[1]);const cell=row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i)?.[1];if(!cell)continue;if(/^(?:電話番号|お問い合わせ|予約・お問い合わせ|Telephone|Phone|Reservation(?:s)?\s*(?:and|&)?\s*(?:inquiries|enquiries)|Contact)/i.test(header)){const matches=clean(cell).match(/(?:\+81[ -]?)?0?\d{1,4}[-－ー ]\d{2,4}[-－ー ]\d{3,4}/g)??[];phones.push(...matches);quotes.push(...matches.map(value=>({field:'phone',value,basis:'PRIMARY_CONTACT_TABLE'})));}if(/^(?:住所|Address)$/i.test(header)){const value=clean(cell);addresses.push(value);quotes.push({field:'address',value,basis:'PRIMARY_ADDRESS_TABLE'});}}
 return {phones:[...new Set(phones)],addresses:[...new Set(addresses)],quotes};
}
function certify(sample,page,record){
 const identity=page?publicIdentity(page):{phones:[],addresses:[],quotes:[]};
 const phone=v=>{const raw=v.normalize('NFKC').trim(),digits=raw.replace(/\D/g,'');return /^\+81/.test(raw)?'0'+digits.slice(2).replace(/^0+/,''):/^0081/.test(raw)?'0'+digits.slice(4).replace(/^0+/,''):digits;};
 const address=v=>v.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[\p{P}\p{Z}\s〒]/gu,'');
 const phoneMatch=identity.phones.find(p=>phone(p).length>=8&&phone(p)===phone(sample.subject.phone));
 const addressMatch=identity.addresses.find(a=>address(a)&&address(a)===address(sample.subject.address));
 const idMatch=page&&benchmarkOutlet(page.url)?.outletId===sample.expected.outletId;
 const status=record.documents.at(-1)?.status;
 const ok=!!page&&idMatch&&status>=200&&status<300&&!record.sourceBlock&&!record.boundaryStop&&(!!phoneMatch||!!addressMatch);
 return {sampleId:sample.id,status:ok?'VERIFIED':'DROPPED',google:sample.subject,expected:sample.expected,observed:identity,rawPageUrl:page?.url,httpStatus:status,idMatch:!!idMatch,phoneMatch:phoneMatch??null,addressMatch:addressMatch??null,reason:ok?'Independent exact public phone or full address matches Google':record.sourceBlock?'Source unavailable/busy':record.boundaryStop?'Read boundary stop':!page?'No readable page':!idMatch?'Gold URL no longer identifies expected outlet':'No independently confirmed matching phone or full address; excluded from scoring'};
}
async function finish(attempt,record){
 attempt.finishedAt=new Date().toISOString();ledger.lastFinishedAt=attempt.finishedAt;
 if(record.sourceBlock){const event={sampleId:attempt.sampleId,phase,day:day(record.sourceBlock.at),...record.sourceBlock};ledger.sourceBlocks.push(event);const n=ledger.sourceBlocks.filter(e=>e.day===event.day).length;ledger.nextAllowedAt=new Date(Date.parse(event.at)+600000).toISOString();if(n>=3)ledger.stop={reason:'THREE_SOURCE_BLOCKS_SAME_DAY',at:event.at,count:n};}
 if(record.boundaryStop)ledger.stop={reason:record.boundaryStop.reason,at:record.boundaryStop.at};
 await save();
}
let gateway;
if(phase==='method-a'){
 const approval=await read(`${dir}/model-approval.json`);if(approval.status!=='USER_APPROVED'||approval.destination!=='https://api.deepseek.com')throw Error('EXPLICIT_MODEL_PAYLOAD_APPROVAL_REQUIRED');
 const fetchOriginal=globalThis.fetch;globalThis.fetch=(url,init)=>{const u=new URL(String(url));if(u.origin!=='https://api.deepseek.com'||!['/chat/completions','/beta/chat/completions'].includes(u.pathname)||init?.method!=='POST')throw Error('ONLY_AUTHORIZED_DEEPSEEK');return fetchOriginal(url,init);};
 gateway=DeepSeekModelGateway.fromEnvironment(process.env);
}
const certification=phase==='method-a'?await read(`${dir}/verify/summary.json`):undefined;
if(certification&&certification.status!=='COMPLETED')throw Error('GOLD_VERIFICATION_INCOMPLETE');
const runnable=phase==='verify'?selected.filter(s=>s.role==='GOLD'):selected.filter(s=>s.role==='CONTROL'||certification.rows.some(r=>r.sampleId===s.id&&r.status==='VERIFIED'));
const rows=[];
for(const sample of runnable){
 if(ledger.stop)break;await pause();await verify();
 const path=`${dir}/${phase}/${sample.id}`;await fs.mkdir(path);
 const attempt={sampleId:sample.id,phase,startedAt:new Date().toISOString(),status:'STARTED'};ledger.attempts.push(attempt);await save();
 const record={network:[],documents:[],blockedRequests:[],snapshots:[]},controller=new AbortController(),timer=setTimeout(()=>controller.abort(),300000),runtime=observedRuntime(record,controller);let row;
 try{
  if(phase==='verify'){
   let session,page,error=null;try{session=await runtime.openSession({signal:controller.signal,networkPolicy:policy});const u=new URL(sample.expected.sourceUrl);if(!u.pathname.startsWith('/en/'))u.pathname='/en'+u.pathname;u.search='';u.hash='';u.pathname=u.pathname.replace(/(\/\d+\/).*/,'$1');await session.prepareNavigation(u.href,{timeoutMs:20000});await session.navigate(u.href,{timeoutMs:20000,waitUntil:'domcontentloaded'});page=await session.snapshot();}catch(e){error=e.message;}finally{await session?.close();}row={...certify(sample,page,record),error};
  }else{
   const port=new ModelBrowserReadActionDecision({complete:async request=>{
    if(controller.signal.aborted||ledger.stop)throw Error('SOURCE_STOPPED');if(ledger.modelCalls.length>=150)throw Error('METHOD_A_MODEL_BUDGET');
    const localCalls=ledger.modelCalls.filter(c=>c.sampleId===sample.id).length;if(localCalls>=3)throw Error('PER_SUBJECT_MODEL_BUDGET');
    const call={sampleId:sample.id,index:ledger.modelCalls.length+1,startedAt:new Date().toISOString(),requestSha256:sha(JSON.stringify(request)),status:'STARTED'};ledger.modelCalls.push(call);await save();await write(`${path}/model-${localCalls+1}.request.json`,request);
    try{const response=await gateway.complete(request);Object.assign(call,{finishedAt:new Date().toISOString(),status:'SUCCEEDED',model:response.model,usage:response.usage,latencyMs:response.latencyMs});await write(`${path}/model-${localCalls+1}.response.json`,response);return response;}catch(e){Object.assign(call,{finishedAt:new Date().toISOString(),status:'FAILED',errorCode:e.code??'MODEL_FAILURE'});ledger.stop={reason:'MODEL_PROVIDER_FAILURE',at:call.finishedAt};throw e;}finally{await save();}
   }});
   const healthy=ledger.attempts.filter(a=>a.phase==='verify'&&a.sourceHealthy).at(-1);if(!healthy)throw Error('NO_TABELOG_HEALTH_EVIDENCE');
   const artifact=await runNameResolutionMethodA(sample.id,'TABELOG',nameResolutionInput(sample),{mode:'LIVE',admission:{sampleSha256:plan.sampleSha256,approval:{sampleSha256:plan.sampleSha256,reviewer:'independent reviewer, P2-2 second review; human execution authorization',approved:true},preflight:{tabelogStatus:healthy.httpStatus,tabelogBusy:false}},runtime,decision:port,signal:controller.signal,networkPolicy:policy});
   if(record.sourceBlock){artifact.observation.accepted=false;artifact.observation.failure=record.sourceBlock.status?'SOURCE_HTTP_'+record.sourceBlock.status:'SOURCE_BUSY';artifact.observation.searchCompleted=false;}
   if(artifact.boundary.formStop)ledger.stop={reason:'BENCHMARK_FORM_BOUNDARY_ATTEMPT',sampleId:sample.id,at:new Date().toISOString()};
   const evaluation=evaluateNameResolution(sample,artifact.observation);row={sampleId:sample.id,role:sample.role,observation:artifact.observation,evaluation,boundary:artifact.boundary};await fs.writeFile(`${path}/artifact.json.gz`,gzipSync(JSON.stringify(artifact)));
   if(evaluation.stopBatch)ledger.stop={reason:'WRONG_ACCEPTED',sampleId:sample.id,at:new Date().toISOString()};
  }
 }catch(e){row={sampleId:sample.id,status:'INTERRUPTED',error:e.message};if(!record.sourceBlock)ledger.stop={reason:'ORCHESTRATION_OR_RUNTIME_FAILURE',sampleId:sample.id,at:new Date().toISOString()};}
 finally{clearTimeout(timer);attempt.status=row.status??row.evaluation?.verdict??'NOT_EVALUATED';attempt.httpStatus=record.documents.at(-1)?.status;attempt.sourceHealthy=attempt.httpStatus>=200&&attempt.httpStatus<300&&!record.sourceBlock&&!record.boundaryStop;await fs.writeFile(`${path}/observations.json.gz`,gzipSync(JSON.stringify(record)));await write(`${path}/result.json`,row);await finish(attempt,record);}
 rows.push(row);console.log(JSON.stringify({event:'RESULT',...row,google:undefined,observed:undefined}));
}
await verify();const summary={status:ledger.stop?'STOPPED':'COMPLETED',phase,planned:runnable.length,finished:rows.length,rows,stop:ledger.stop,modelCalls:ledger.modelCalls.length,sourceBlocks:ledger.sourceBlocks,websiteScope:'Tabelog public read-only only; no TableCheck/Google/full Live',...(phase==='method-a'?{evaluation:summarizeNameResolution(runnable,rows.filter(r=>r.observation).map(r=>r.observation))}:{})};
await write(`${dir}/${phase}/summary.json`,summary);console.log(JSON.stringify({event:'FINISHED',phase,status:summary.status,finished:rows.length,modelCalls:ledger.modelCalls.length,stop:ledger.stop}));
