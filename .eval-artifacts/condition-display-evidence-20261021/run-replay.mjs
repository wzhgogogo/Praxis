import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {restaurantBookingTaskDefinition as currentDefinition} from '../../src/domains/restaurant/task-definition.ts';
import {RestaurantExecutionRouter as CurrentRouter} from '../../src/application/restaurant-execution-router.ts';
import {parseTabelogSourceFieldQuotes} from '../../src/integrations/tabelog/tabelog-page-parser.ts';
const dir='.eval-artifacts/condition-display-evidence-20261021',sha=b=>createHash('sha256').update(b).digest('hex');
globalThis.fetch=()=>{throw Error('OFFLINE_DISPLAY_REPLAY_NO_NETWORK_OR_MODEL');};
const freezeBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(freezeBytes),input=JSON.parse(await fs.readFile(`${dir}/replay-inputs.json`));
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'condition-display-baseline-'));
let sourceCalls=0;
const noRead=async()=>{sourceCalls++;throw Error('PRESENTATION_MUST_NOT_READ_SOURCE');};
const transport={executionRoute:'STRUCTURED_ADAPTER',search:noRead,check:noRead};
const compact=s=>s.normalize('NFKC').replace(/\s+/gu,'');
async function replay(artifact,definition,Router,annotate){
 const ctx=now=>({taskId:artifact.runId,runId:artifact.runId,now,createId:p=>p});
 let state=definition.create({},ctx(artifact.startedAt));let presented;
 for(const envelope of artifact.events){
  if(envelope.event.type==='RESULTS_PRESENTED'){presented=envelope;break;}
  const event=structuredClone(envelope.event);
  if(annotate&&Array.isArray(event.evidence))for(const fact of event.evidence){
   const binding=annotate.find(row=>row.evidenceId===fact.evidenceId&&row.candidateId===fact.candidateId&&row.sourceUrl===fact.sourceUrl);
   if(!binding||fact.kind!=='RESTAURANT_FACT'||fact.provider!=='TABELOG')continue;
   const fields=binding.fields.filter(q=>q.sourceUrl===fact.sourceUrl);
   fact.sourceFieldQuotes=binding.selectedModelQuotes?fields.filter(q=>fact.claims.restaurantTypeFacts?.some(text=>compact(text).includes(compact(q.quote)))):fields.filter(q=>!['NAME','CUSTOMER_REVIEW'].includes(q.field));
  }
  state=definition.transition(state,event,ctx(envelope.occurredAt)).state;
 }
 assert.ok(presented);
 const router=new Router(transport,transport,{structuredReadTimeoutMs:1000,browserReadTimeoutMs:1000});
 const execution=await router.execute({type:'PRESENT_RESULTS',candidateIds:presented.event.candidateIds},state,presented.occurredAt);
 assert.equal(execution.event?.type,'RESULTS_PRESENTED');
 const result=definition.transition(state,execution.event,ctx(presented.occurredAt)).state;
 return{stateSchema:result.schemaVersion,presentation:result.presentedResults};
}
try{
 const archive=execFileSync('git',['archive',input.baselineCommit,'src','package.json'],{maxBuffer:64*1024*1024});
 execFileSync('tar',['-x','-C',temporary],{input:archive});
 await fs.symlink(path.join(process.cwd(),'node_modules'),path.join(temporary,'node_modules'),'dir');
 await fs.symlink(path.join(process.cwd(),'.eval-artifacts'),path.join(temporary,'.eval-artifacts'),'dir');
 const oldDefinition=(await import(pathToFileURL(path.join(temporary,'src/domains/restaurant/task-definition.ts')).href)).restaurantBookingTaskDefinition;
 const OldRouter=(await import(pathToFileURL(path.join(temporary,'src/application/restaurant-execution-router.ts')).href)).RestaurantExecutionRouter;
 const rows=[];await fs.mkdir(`${dir}/replays`);
 for(const row of input.rows){
  const p=path.resolve(dir,row.resultPath),bytes=await fs.readFile(p);assert.equal(sha(bytes),row.resultSha256);const artifact=JSON.parse(bytes);
  const recorderBytes=await fs.readFile(path.resolve(dir,row.recordingPath));assert.equal(sha(recorderBytes),row.recordingSha256);const recorder=JSON.parse(recorderBytes);
  const bindings=[];
  for(const binding of row.bindings){
   const document=recorder.documents.find(d=>d.snapshot===binding.snapshot);assert.equal(document.url,binding.sourceUrl);
   const html=await fs.readFile(path.resolve(dir,binding.path),'utf8');assert.equal(sha(html),binding.sha256);
   const trace=artifact.diagnostics.browserTrace.filter(t=>t.kind==='SNAPSHOT')[binding.snapshot-1];assert.equal(trace.detail.url,binding.sourceUrl);assert.equal(trace.detail.htmlSha256,recorder.entries.filter(t=>t.kind==='SNAPSHOT')[binding.snapshot-1].detail.htmlSha256);
   const fields=parseTabelogSourceFieldQuotes({url:binding.sourceUrl,title:trace.detail.title,text:'',html});bindings.push({...binding,fields});
  }
  const before=await replay(artifact,oldDefinition,OldRouter),after=await replay(artifact,currentDefinition,CurrentRouter,bindings);
  assert.deepEqual(before.presentation.candidateIds,after.presentation.candidateIds,'qualification/candidate selection is unchanged');
  const conditions=[];
  for(const id of after.presentation.candidateIds)for(const condition of after.presentation.conditionStates[id]){
   const prior=before.presentation.conditionStates[id].find(c=>c.text===condition.text&&c.polarity===condition.polarity&&c.strength===condition.strength);
   const original=artifact.finalSnapshot.domainState.presentedResults.conditionStates[id]?.find(c=>c.text===condition.text&&c.polarity===condition.polarity&&c.strength===condition.strength);
   conditions.push({candidateId:id,text:condition.text,polarity:condition.polarity,strength:condition.strength,originalLive:original??null,currentBase:prior??null,fixed:condition});
  }
  const record={mode:'SAVED_SOURCE_FIELDS_THEN_ROUTER_REDUCER',source:{path:row.resultPath,sha256:row.resultSha256},baselineCommit:input.baselineCommit,codeCommit:freeze.codeCommit,originalPresentation:artifact.finalSnapshot.domainState.presentedResults,before,after,conditions,bindings,sourceCalls:0,modelCalls:0,limitation:'Counterfactual source-field metadata reconstructed from saved HTML and original selected quotes; original IDs/labels retained to reconnect original model references. No source or model re-execution, no new availability claim.'};
  const out=`${dir}/replays/${row.runId}.json`;await fs.writeFile(out,JSON.stringify(record,null,2),{flag:'wx'});rows.push({runId:row.runId,path:out,sha256:sha(await fs.readFile(out)),conditions});
 }
 assert.equal(sourceCalls,0);
 const hard=rows.flatMap(r=>r.conditions).filter(c=>['omakase','kaiseki restaurant'].includes(c.text));assert.equal(hard.length,5);
 for(const condition of hard){
  const kaga=condition.candidateId.endsWith('/13048623');assert.equal(condition.fixed.status,kaga?'NOT_CHECKED':'MET');
  if(!kaga)assert.ok(condition.fixed.sources.length&&condition.fixed.sources.every(s=>s.field&&s.quote!==condition.text));
  if(condition.candidateId.endsWith('/13275802')||condition.candidateId.endsWith('/13319616'))assert.ok(condition.fixed.sources.some(s=>s.meal==='LUNCH'));
 }
 await verify();await fs.writeFile(`${dir}/comparison.json`,JSON.stringify({status:'PASS',mode:'OFFLINE_SOURCE_REPLAY_ROUTER_REDUCER',rows,models:0,sourceCalls,websites:0,freezeSha256:sha(freezeBytes),filesVerified:Object.keys(freeze.files).length},null,2),{flag:'wx'});
 console.log(JSON.stringify({status:'PASS',runs:rows.length,hardConditions:hard.map(c=>({id:c.candidateId,text:c.text,before:c.currentBase.status,after:c.fixed.status})),modelCalls:0,sourceCalls}));
}finally{await fs.rm(temporary,{recursive:true,force:true});}
