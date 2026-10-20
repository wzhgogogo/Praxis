import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { DeepSeekModelGateway } from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import { availabilityPathInjectedRequest, capturedReplayAction } from '../../../src/eval/restaurant/agent-loop/runners/run-decision-replay.ts';
import { normalizeRestaurantAgentActionStrictWire } from '../../../src/domains/restaurant/agent-action.ts';
import { assessSelectionReplay } from '../../../src/eval/restaurant/agent-loop/selection-replay-assessment.ts';
const base='.eval-artifacts/p2-2-selection-20261019', dir=`${base}/followup`, hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=async path=>JSON.parse(await fs.readFile(path,'utf8'));
const plan=await read(`${dir}/model-plan.json`), freeze=await read(`${dir}/model-freeze.json`);
const verify=async()=>{for(const [path,sha] of Object.entries(freeze.files))if(hash(await fs.readFile(path))!==sha)throw Error(`FROZEN_INPUT_CHANGED:${path}`);};
await verify();execFileSync('git',['diff','--exit-code','HEAD','--','src',`${dir}/run-structural-selection.mjs`,`${dir}/model-plan.json`,`${dir}/model-freeze.json`],{stdio:'pipe'});
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const annotations=await read(`${base}/seed-annotations.reviewer.json`),contracts=await read(`${base}/selection-contracts.json`);
if(annotations.revision!==2||hash(await fs.readFile(`${base}/seed-annotations.reviewer.json`))!==plan.annotationSha256)throw Error('APPROVED_GOLD_CHANGED');
const oldAnnotations=await read(`${base}/seed-annotations.rev1.frozen.json`),oldContracts=await read(`${base}/selection-contracts.rev1.json`);
const seeds=[...(await read('.eval-artifacts/phase1-replay/seeds.v7.json')).seeds,...(await read(`${base}/selection-seeds.pending.json`)).seeds];
const prior=await read(`${base}/model-ledger.json`);
if(prior.calls.length!==plan.priorCalls||prior.calls.length+plan.seedIds.length>30)throw Error('MODEL_BUDGET_MISMATCH');
const inputs=[];
for(const id of plan.seedIds){
 const annotation=annotations.annotations.find(a=>a.seedId===id&&a.labelStatus==='ANNOTATED'),rules=contracts.rules.filter(r=>r.seedId===id);
 if(!annotation||!annotation.acceptableActions.every(a=>rules.some(r=>r.type===a.type&&r.when===a.when)))throw Error(`COMPLETE_INDEPENDENT_CONDITIONS_REQUIRED:${id}`);
 const seed=seeds.find(s=>s.seedId===id);
 const row=seed.origin?(await fs.readFile(seed.origin.runArtifact,'utf8')).split(/\n/).filter(Boolean).map(line=>JSON.parse(line)).find(r=>r.sequence===seed.origin.decisionIndex):await read(seed.decision);
 const artifact=JSON.parse(gunzipSync(await fs.readFile(seed.origin?.resultArtifact??seed.originalResult)).toString());
 const beforeContext=JSON.parse(row.messages.find(m=>m.role==='user').content).context;
 const observed=new Map();
 for(const e of artifact.events)if(e.event.type==='SEARCH_COMPLETED'&&e.occurredAt<=beforeContext.now)for(const c of e.event.candidates)observed.set(c.restaurant.id,c.restaurant);
 const outlets=[...observed.values()].filter(c=>beforeContext.candidates.some(v=>v.id===c.id));
 const evidence=artifact.finalSnapshot.domainState.readEvidence;
 const request=availabilityPathInjectedRequest({...seed,seedId:id,level:'AGENT'},row,outlets,evidence);
 const context=JSON.parse(request.messages.find(m=>m.role==='user').content).context;
 const beforeAction=capturedReplayAction({...seed,level:'AGENT'},row);
 const before=assessSelectionReplay(beforeAction,beforeContext,outlets,annotation,rules,contracts.radiusMeters);
 if(before.verdict!==annotation.recordedActionVerdict)throw Error(`RECORDED_BASELINE_CHANGED:${id}`);
 inputs.push({id,annotation,rules,request,context,beforeContext,outlets,beforeAction,before,requestSha256:hash(JSON.stringify(request))});
}
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({commit,status:'FROZEN_NO_CALLS',priorCalls:prior.calls.length,inputs:inputs.map(i=>({seedId:i.id,candidates:i.context.candidates.length,checkable:i.context.checkableCandidateIds,scopeCount:i.context.checkableCandidateIds.length,before:i.before,requestSha256:i.requestSha256}))},null,2));process.exit(0);}
await fs.mkdir(plan.outputDirectory); // no overwrite, rerun or resume in this pass
const ledger={schema:'p22-structural-selection-ledger@1',codeCommit:commit,priorCalls:prior.calls.length,priorLedgerSha256:hash(await fs.readFile(`${base}/model-ledger.json`)),maxCalls:30,calls:[]};
const ledgerPath=`${dir}/model-ledger.json`, persist=()=>fs.writeFile(ledgerPath,JSON.stringify(ledger,null,2));
const fetchOriginal=globalThis.fetch;
globalThis.fetch=(url,init)=>{const u=new URL(String(url));if(u.protocol!=='https:'||u.hostname!=='api.deepseek.com'||init?.method!=='POST')throw Error('ONLY_AUTHORIZED_DEEPSEEK_GENERATION');return fetchOriginal(url,init);};
const gateway=DeepSeekModelGateway.fromEnvironment(process.env),results=[];
for(const input of inputs){
 if(ledger.calls.some(c=>c.seedId===input.id)||ledger.priorCalls+ledger.calls.length>=30)throw Error('NO_DUPLICATE_OR_EXCESS_CALL');
 const call={call:ledger.priorCalls+ledger.calls.length+1,seedId:input.id,codeCommit:commit,requestSha256:input.requestSha256,startedAt:new Date().toISOString(),status:'STARTED'};
 ledger.calls.push(call);await persist();await fs.writeFile(`${plan.outputDirectory}/${input.id}.request.json`,JSON.stringify(input.request,null,2),{flag:'wx'});
 let action=null,wireText=null,finishReason=null,errorCode=null;
 try{
  const response=await gateway.complete(input.request);Object.assign(call,{latencyMs:response.latencyMs,usage:response.usage,model:response.model});wireText=response.outputText;finishReason=response.finishReason;
  if(finishReason!=='TOOL_CALLS')throw Object.assign(Error('finish reason'),{code:'MODEL_OUTPUT_REJECTED'});
  const decoded=normalizeRestaurantAgentActionStrictWire(JSON.parse(wireText));
  if(!decoded.valid)throw Object.assign(Error('invalid wire'),{code:'MODEL_OUTPUT_REJECTED',validationErrors:decoded.errors});
  action=decoded.value;call.status='SUCCEEDED';
 }catch(error){errorCode=typeof error.code==='string'?error.code:'MODEL_REPLAY_FAILED';call.status='FAILED';if(error.validationErrors)call.validationErrors=error.validationErrors;}
 call.finishedAt=new Date().toISOString();call.errorCode=errorCode;await persist();
 const after=action?assessSelectionReplay(action,input.context,input.outlets,input.annotation,input.rules,contracts.radiusMeters):{verdict:'NO_ACTION',reasons:[errorCode]};
 const old=oldAnnotations.annotations.find(a=>a.seedId===input.id);
 const oldStrict=old?{status:'EVALUATED_SAME_OUTPUT_NO_EXTRA_CALL',before:assessSelectionReplay(input.beforeAction,input.beforeContext,input.outlets,old,oldContracts.rules.filter(r=>r.seedId===input.id),oldContracts.radiusMeters),after:action?assessSelectionReplay(action,input.context,input.outlets,old,oldContracts.rules.filter(r=>r.seedId===input.id),oldContracts.radiusMeters):{verdict:'NO_ACTION'}}:{status:'NOT_APPLICABLE'};
 const key=url=>{const u=new URL(url);return u.hostname==='tabelog.com'?`tabelog:${u.pathname.match(/\/(\d+)(?:\/|$)/)?.[1]}`:`tablecheck:${u.pathname.replace(/^\/(?:en|ja)\/(?:shops\/)?/,'').split('/')[0]}`;};
 const witnesses=new Set((plan.witnessSourceUrls[input.id]??[]).map(key));
 const witness=which=>!which?{status:'NOT_EVALUATED',reason:'No legal action'}:{status:'EVALUATED',selected:(which.candidateIds??[]).some(id=>{const s=input.outlets.find(o=>o.id===id)?.sourceIds??{};return [s.tabelogNativeDetailUri,s.tablecheckNativeGuideUri,s.googleWebsiteUri].filter(Boolean).some(url=>{try{return witnesses.has(key(url));}catch{return false;}});}),scope:'Historical URL membership only; no current/request slot claim.'};
 const result={seedId:input.id,scenario:input.annotation.scenario,codeCommit:commit,annotationRevision:2,requestSha256:input.requestSha256,call,beforeAction:input.beforeAction,before:input.before,afterAction:action,after,oldStrict,wireText,finishReason,errorCode,
 selected:(action?.candidateIds??[]).map(id=>{const c=input.context.candidates.find(c=>c.id===id);return {id,name:c?.outletName,path:c?.availabilityPath,distance:c?.distanceObservation?.meters};}),witnessSelection:{before:witness(input.beforeAction),after:witness(action)},executedActions:0};
 await fs.writeFile(`${plan.outputDirectory}/${input.id}.result.json`,JSON.stringify(result,null,2),{flag:'wx'});results.push(result);
 // User explicitly required all five once regardless of verdict; never retry or execute an action.
}
await verify();
const accepted=id=>results.find(r=>r.seedId===id)?.after.verdict==='ACCEPTABLE';
const gate={kagurazaka:{required:1,passed:Number(accepted('p22-selection-001'))},shibuya:{required:2,passed:['p1-seed-0134','p22-selection-002','p22-selection-003'].filter(accepted).length,total:3,scope:'one near-duplicate scenario'},control:{required:1,passed:Number(accepted('p1-seed-0133'))}};
gate.verdict=gate.kagurazaka.passed===1&&gate.shibuya.passed>=2&&gate.control.passed===1?'PASS':'FAIL';
const summary={codeCommit:commit,annotationRevision:2,gate,newCalls:ledger.calls.length,cumulativeCalls:ledger.priorCalls+ledger.calls.length,maxCalls:30,websiteRequests:0,googleRequests:0,executedActions:0,live:0,results:results.map(r=>({seedId:r.seedId,selected:r.selected,reason:r.afterAction?.decisionSummary??r.call.validationErrors??r.errorCode,verdict:r.after,oldStrict:r.oldStrict,witnessSelection:r.witnessSelection})),scope:'single captured Agent decisions; no end-to-end, inventory or delivery acceptance'};
await fs.writeFile(`${plan.outputDirectory}/summary.json`,JSON.stringify(summary,null,2),{flag:'wx'});console.log(JSON.stringify(summary,null,2));
