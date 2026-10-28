import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {BrowserTaskExecutor} from '../../../src/infrastructure/browser/browser-task-executor.ts';
import {TabelogBrowserAvailability} from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {parseTabelogSearchOutlets} from '../../../src/integrations/tabelog/tabelog-page-parser.ts';
import {prioritizeTabelogOutlets} from '../../../src/integrations/tabelog/tabelog-entity-resolver.ts';
import {ModelNamedSourceQuery} from '../../../src/integrations/restaurant-search/named-source-query.ts';
const root='.eval-artifacts/phase3b/g4-priority-fragments',load=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex'),cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),error=code=>Object.assign(Error(code),{code});
for(const f of load(root+'/freeze.json').files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');assert(!existsSync(root+'/replay-summary.json'));
globalThis.fetch=async()=>{throw error('NETWORK_FORBIDDEN_IN_REPLAY');};
const corpus=load(root+'/corpus.json').responses,byUrl=new Map();
for(const m of corpus)if(m.httpStatus===200&&m.bodyPath&&!byUrl.has(m.url))byUrl.set(m.url,m);
const browser=await chromium.launch({headless:true}),context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
let blocked=0;await context.route('**/*',r=>{blocked++;return r.abort();});const renderer=await context.newPage(),completed=[];
try{for(const subject of load(root+'/inputs.json').rows){
 const original=load(subject.sourceExecutionPath),primary=new Map(original.requests.map(r=>[r.url,r])),requests=[],diagnostics=[],trace=[],models=[],plans=[];
 let current,identityDone=false,environmentFailure=null;
 const candidate={restaurant:{id:`g4:${subject.id}`,outletName:subject.subject.name,address:subject.subject.address,coordinates:subject.subject.coordinates,sourceIds:{googlePlaces:subject.googlePlaceId,phone:subject.subject.phone},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
 const plan=page=>{const observed=parseTabelogSearchOutlets(page),ordered=prioritizeTabelogOutlets(candidate,observed);return {query:new URL(page.url).searchParams.get('sw'),observed,ordered,selected:ordered.slice(0,5)};};
 const model={async complete(request){assert.equal(models.length,0);const r=original.modelRecords[0];if(!r?.response)throw error('REPLAY_MODEL_RESPONSE_MISSING');assert.equal(request.messages[1].content,r.request.messages[1].content);models.push({request,response:r.response,originLedgerId:r.ledgerId??r.originLedgerId,mode:'FIXED_OLD_PROMPT2_RESPONSE_NOT_NEW_MODEL_QUALITY'});return r.response;}};
 const budget={totalModelCalls:0,maxModelCalls:1},planner=new ModelNamedSourceQuery(model,budget);
 const session={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',sessionId:'offline-g4-source-corpus',startedAt:cet()},
  async navigate(url){
   if(identityDone)throw error('IDENTITY_COMPLETE');if(environmentFailure)throw error(environmentFailure);
   const m=primary.get(url)??byUrl.get(url),kind=new URL(url).pathname.includes('/rstLst/')?'SEARCH':'DETAIL';
   if(!m?.bodyPath||m.failure){environmentFailure=m?.failure?'REPLAY_RECORDED_NETWORK_FAILURE':'REPLAY_SOURCE_MISSING';requests.push({url,kind,query:new URL(url).searchParams.get('sw'),failure:{code:environmentFailure}});throw error(environmentFailure);}
   const bytes=readFileSync(m.bodyPath);assert.equal(sha(bytes),m.sha256);requests.push({...m,replayedAtCET:cet(),realGET:0});
   await renderer.setContent(bytes.toString('utf8'),{waitUntil:'domcontentloaded'});current={url,title:await renderer.title(),text:await renderer.locator('body').innerText(),html:bytes.toString('utf8')};
   if(kind==='SEARCH')plans.push(plan(current));
  },async snapshot(){return current;},async close(){},async captureResponses(){},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async fill(){throw error('IDENTITY_ONLY');},async select(){throw error('IDENTITY_ONLY');},async click(){throw error('IDENTITY_ONLY');}};
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:600000,maxOperationsPerCandidate:24,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,budget,onDiagnostic:d=>trace.push(d)});
 const provider=new TabelogBrowserAvailability(executor,undefined,5,{alternativeSearch:(c,s)=>planner.alternative(c,s),onIdentityDiagnostic:d=>{diagnostics.push(d);if(d.resolution.confidence==='HIGH')identityDone=true;}});
 let result,issue;try{result=await provider.check({candidateIds:[candidate.restaurant.id],candidates:[candidate],date:'1970-01-01',partySize:1,timeWindow:{earliest:'00:00',latest:'00:00'},hardCriteria:[]},new AbortController().signal);}catch(e){issue=e.code??'PREFIX_ERROR';}finally{await executor.close();}
 const high=diagnostics.find(d=>d.resolution.confidence==='HIGH'),selected=high?.comparedOutlets.find(o=>o.sourceEntityId===high.resolution.bestSourceEntityId);
 const allRecordedSearchPlans=original.requests.filter(r=>r.kind==='SEARCH'&&r.bodyPath).map(r=>plan({url:r.url,title:'',text:'',html:readFileSync(r.bodyPath,'utf8')}));
 const row={id:subject.id,key:subject.key,view:subject.view,cohort:subject.cohort,mode:'OFFLINE_PRODUCTION_PREFIX_REPLAY',requests,diagnostics,trace,modelRecords:models,plans,allRecordedSearchPlans,acceptedUrl:selected?.sourceUrl??null,environmentFailure,productionReason:diagnostics.at(-1)?.resolution.reason??result?.availabilityChecks[candidate.restaurant.id]?.reasonCode??issue??null,stop:null,bounds:{searches:requests.filter(r=>r.kind==='SEARCH').length,details:requests.filter(r=>r.kind==='DETAIL').length,model:models.length,realModel:0,GET:0,google:0,live:0,inventoryEvaluated:false}};
 assert(row.bounds.searches<=2&&row.bounds.details<=5&&row.bounds.model<=1);save(`${root}/replay-execution/${subject.key}.json`,row);
 const evaluation=JSON.parse(execFileSync('python3',['-B',root+'/score-one.py',`${root}/replay-execution/${subject.key}.json`],{encoding:'utf8'}));
 completed.push({key:subject.key,id:subject.id,acceptedUrl:row.acceptedUrl,environmentFailure,verdict:evaluation.verdict});console.log(JSON.stringify(completed.at(-1)));
 if(evaluation.verdict==='WRONG_ACCEPTED')throw error('S0_WRONG_OUTLET');
}}finally{await browser.close();save(root+'/replay-summary.json',{sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),finishedAtCET:cet(),completed,GET:0,realModel:0,google:0,live:0,rendererBlockedRequests:blocked,rendererSourceRequests:0});}
