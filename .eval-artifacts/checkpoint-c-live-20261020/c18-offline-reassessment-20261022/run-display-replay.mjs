import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {restaurantBookingTaskDefinition as definition} from '../../../src/domains/restaurant/task-definition.ts';
import {RestaurantExecutionRouter} from '../../../src/application/restaurant-execution-router.ts';
import {parseTabelogSourceFieldQuotes,parseTabelogPriceFacts} from '../../../src/integrations/tabelog/tabelog-page-parser.ts';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c18-offline-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
let externalCalls=0,sourceCalls=0;globalThis.fetch=()=>{externalCalls++;throw Error('OFFLINE_DISPLAY_REPLAY_NO_NETWORK_OR_MODEL');};
const freezeBytes=await fs.readFile(`${dir}/display-replay-freeze.json`),freeze=JSON.parse(freezeBytes);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
const inputs=await read(`${dir}/c18-inputs.json`),audit=await read(`${dir}/hard-evidence-audit.json`),hard=await read(`${dir}/hard-evidence.json`),registry=await read('src/eval/restaurant/agent-loop/cases/criterion-correspondences.json');
await fs.mkdir(`${dir}/display-replays`);
const compact=s=>s.normalize('NFKC').replace(/\s+/gu,'');
const noRead=async()=>{sourceCalls++;throw Error('PRESENTATION_MUST_NOT_READ_SOURCE');};
const router=new RestaurantExecutionRouter({executionRoute:'STRUCTURED_ADAPTER',search:noRead},{executionRoute:'STRUCTURED_ADAPTER',check:noRead},{structuredReadTimeoutMs:1000,browserReadTimeoutMs:1000});
const rows=[],derivedCorrespondences=[],derivedHard=[];
for(const row of inputs.runs){
 const bytes=await fs.readFile(row.artifactPath);assert.equal(sha(bytes),row.artifactSha256);const original=JSON.parse(bytes);
 const actual=original.finalSnapshot.domainState.presentedResults;
 if(!actual){rows.push({...row,replayStatus:'NOT_APPLICABLE_NO_ORIGINAL_PRESENTATION',reason:'No delivered candidate set exists; no fabricated presentation or changed investigation.'});continue;}
 const bindings=[],rawRun=audit.runs.find(r=>r.artifactSha256===row.artifactSha256);
 for(const binding of rawRun.snapshots){
  const recordingBytes=await fs.readFile(path.resolve(dir,binding.recordingPath));assert.equal(sha(recordingBytes),binding.recordingSha256);const recording=JSON.parse(recordingBytes);
  const document=recording.documents.find(d=>d.snapshot===binding.snapshot);assert.equal(document.url,binding.sourceUrl);
  const html=await fs.readFile(path.resolve(dir,binding.path),'utf8');assert.equal(sha(html),binding.sha256);
  const trace=original.diagnostics.browserTrace.filter(t=>t.kind==='SNAPSHOT')[binding.snapshot-1];
  assert.equal(trace.detail.url,binding.sourceUrl);assert.equal(trace.detail.htmlSha256,binding.runtimeHtmlSha256);assert.equal(trace.detail.htmlSha256,recording.entries.filter(t=>t.kind==='SNAPSHOT')[binding.snapshot-1].detail.htmlSha256);
  assert.ok(Date.parse(trace.at)<=Date.parse(binding.observedAt));
  const page={url:binding.sourceUrl,title:trace.detail.title,text:'',html};
  // Full original innerText was not saved. Empty text deliberately omits new
  // course-price extraction; same-page header budget ranges remain available.
  // No superseded price fact is copied or made current.
  const parsedPrices=binding.selectedModelQuotes?parseTabelogPriceFacts(page):undefined;
  bindings.push({...binding,fields:parseTabelogSourceFieldQuotes(page),...(parsedPrices?{freshDocumentPrices:parsedPrices}:{})});
 }
 const artifact=structuredClone(original),ctx=at=>({taskId:original.runId,runId:original.runId,now:at,createId:p=>p});
 let state=definition.create({},ctx(original.startedAt));let presentations=0;const changes=[];
 for(const envelope of artifact.events){
  const event=envelope.event;
  if(Array.isArray(event.evidence))for(const fact of event.evidence){
   const binding=bindings.find(b=>b.evidenceId===fact.evidenceId&&b.candidateId===fact.candidateId&&b.sourceUrl===fact.sourceUrl&&b.observedAt===fact.observedAt);
   if(!binding||fact.kind!=='RESTAURANT_FACT'||fact.provider!=='TABELOG')continue;
   const fields=binding.fields.filter(q=>q.sourceUrl===fact.sourceUrl);
   const sourceFieldQuotes=binding.selectedModelQuotes?fields.filter(q=>fact.claims.restaurantTypeFacts?.some(t=>compact(t).includes(compact(q.quote)))):fields.filter(q=>!['NAME','CUSTOMER_REVIEW'].includes(q.field));
   const previous={sourceFieldQuotes:fact.sourceFieldQuotes??null,priceFacts:fact.priceFacts??null};
   if(sourceFieldQuotes.length)fact.sourceFieldQuotes=sourceFieldQuotes;
   if(binding.selectedModelQuotes&&binding.freshDocumentPrices)fact.priceFacts=binding.freshDocumentPrices;
   changes.push({evidenceId:fact.evidenceId,candidateId:fact.candidateId,sourceUrl:fact.sourceUrl,observedAt:fact.observedAt,snapshot:binding.snapshot,htmlSha256:binding.sha256,previous,after:{sourceFieldQuotes:fact.sourceFieldQuotes??null,priceFacts:fact.priceFacts??null},selectedModelQuotes:binding.selectedModelQuotes});
  }
  if(event.type==='RESULTS_PRESENTED'){
   assert.equal(presentations++,0,'exactly one original presentation is expected');
   const execution=await router.execute({type:'PRESENT_RESULTS',candidateIds:event.candidateIds},state,envelope.occurredAt);
   assert.equal(execution.event?.type,'RESULTS_PRESENTED');envelope.event=execution.event;
  }
  state=definition.transition(state,envelope.event,ctx(envelope.occurredAt)).state;
 }
 assert.equal(presentations,1);assert.deepEqual(state.presentedResults.candidateIds,actual.candidateIds,'No changed qualification/selection');
 // Outside private source metadata and the real presentation event, all
 // historical actions, model choices, sources, trace and resource counts stay.
 artifact.finalSnapshot.domainState=state;artifact.finalSnapshot.definitionVersion=definition.version;
 for(const name of ['materializedCase','semantic','modelInvocations','diagnostics','resourceUsage','requestMetadata','runtimeContext','startedAt','finishedAt'])assert.deepEqual(artifact[name],original[name],`Changed historical ${name}`);
 assert.deepEqual(state.intent,original.finalSnapshot.domainState.intent);
 const out=`${dir}/display-replays/${row.runId}.result.json`;await put(out,artifact);const derivedSha256=sha(await fs.readFile(out));
 const conditions=[];for(const id of actual.candidateIds)for(const condition of state.presentedResults.conditionStates[id]){const prior=actual.conditionStates[id]?.find(c=>c.criterionRef===condition.criterionRef);conditions.push({candidateId:id,criterionRef:condition.criterionRef,actualLive:prior??null,replayed:condition});}
 const correspondence=registry.entries.find(e=>e.artifactSha256===row.artifactSha256);
 if(correspondence)derivedCorrespondences.push({...correspondence,artifactSha256:derivedSha256,pairs:correspondence.pairs.map(p=>({...p,refs:[...p.refs,`${dir}/display-replay-lineage.json#${row.runId}; deterministic carry-forward; original=${row.artifactSha256}; derived=${derivedSha256}; Gold/intent byte-identical; no new semantic adjudication`]}))});
 const originalHard=hard.runs.find(r=>r.artifactSha256===row.artifactSha256);
 derivedHard.push({...originalHard,artifactSha256:derivedSha256,witnesses:originalHard.witnesses.map(w=>({...w,artifactSha256:derivedSha256}))});
 rows.push({...row,replayStatus:'ROUTER_REDUCER_COMPLETED',derivedArtifactPath:out,derivedArtifactSha256:derivedSha256,stateSchema:state.schemaVersion,definitionVersion:definition.version,originalPresentation:actual,replayedPresentation:state.presentedResults,conditions,metadataChanges:changes,unchanged:{goldAndSemantic:true,modelChoices:true,sourceTrace:true,candidateSet:true,timestampsAndResources:true},limitation:'Counterfactual parser metadata from recorded HTML and original selected quotes, then actual Router->Reducer. Full innerText unavailable: new document course-price extraction omitted. No new source/model execution, availability claim, semantic adjudication or real-Live signoff.'});
 console.log(JSON.stringify({run:row.runId,status:'REPLAYED',sha256:derivedSha256,conditions:conditions.length}));
}
assert.equal(externalCalls,0);assert.equal(sourceCalls,0);assert.equal(rows.filter(r=>r.replayStatus==='ROUTER_REDUCER_COMPLETED').length,13);
await put(`${dir}/display-replay-lineage.json`,{status:'FROZEN_REGRESSION_DERIVED_NOT_CLEAN_OR_LIVE',mode:'OFFLINE_SAVED_SOURCE_METADATA_ROUTER_REDUCER',inputFreezeSha256:sha(freezeBytes),codeCommit:freeze.codeCommit,newModels:0,newWebsites:0,newLiveRuns:0,sourceCalls,externalCalls,rows});
await put(`${dir}/display-derived-correspondences.json`,{schema:registry.schema,status:'Derived-only counterfactual replay; original reviewed Gold/intent unchanged, not a new global approval',rule:'Only exact derived SHA with verified original lineage. Original review and pair indices retained. Cross pairings remain invalid. Do not use for any other artifact.',entries:derivedCorrespondences});
await put(`${dir}/display-derived-hard-evidence.json`,{schema:hard.schema,runs:derivedHard});
await verify();await put(`${dir}/display-replay-finished.json`,{status:'COMPLETED',at:new Date().toISOString(),replayed:13,notApplicable:5,newModels:0,newWebsites:0,newLiveRuns:0,sourceCalls,externalCalls,frozenFilesVerified:Object.keys(freeze.files).length,freezeSha256:sha(freezeBytes)});
