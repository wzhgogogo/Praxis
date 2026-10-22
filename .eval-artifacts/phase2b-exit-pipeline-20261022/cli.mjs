// All commands are explicit. Importing this module never opens input or a provider.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {loadCommittedCases,materializeCases,runnerYaml,executionPlan,sha} from './inputs.mjs';
import {witnessSearchPlan,sourceReader,discoverWitnesses,captureWitnessJobs,certifySavedWitnesses} from './witnesses.mjs';
import {writeJson,readJson,base,authorizeLive,extractPending,requireWordingReview,evaluateReviewed} from './execution.mjs';
import {verifyFreeze} from '../checkpoint-c-live-20261020/freeze.mjs';
import {consumeAuthorization} from '../checkpoint-c-live-20261020/policy.mjs';
export function prepare({source,commitmentPath,exitStart,directory,fallbacks=[]}){
 const bytes=readFileSync(source),commitment=readJson(commitmentPath),cases=loadCommittedCases(bytes,commitment);
 for(const f of fallbacks){assert.equal(sha(readFileSync(f.reviewPath)),f.reviewSha256,'FALLBACK_REVIEW_SHA');const r=readJson(f.reviewPath);assert.equal(r.caseId,f.caseId);assert.ok(['NOT_CERTIFIED_IN_BOUNDED_SOURCE_CAPTURE','PRIMARY_BUSINESS_WITNESS_NOT_CERTIFIED'].includes(r.status),'BUSINESS_FAILURE_REVIEW_REQUIRED');assert.equal(r.fallback.place,f.place);}
 const materialized=materializeCases(cases,exitStart,fallbacks);mkdirSync(directory,{recursive:false});
 const runnerInput=resolve(directory,'runner-input.yaml');writeFileSync(runnerInput,runnerYaml(materialized.cases),{flag:'wx'});
 writeJson(resolve(directory,'input-transformation.json'),{status:'PREPARED_NOT_AUTHORIZED_TO_RUN',source,sourceSha256:sha(bytes),commitmentPath,commitmentSha256:sha(readFileSync(commitmentPath)),runnerInput,runnerInputSha256:sha(readFileSync(runnerInput)),...materialized,models:0,websites:0});
 writeJson(resolve(directory,'plan.json'),{...executionPlan(materialized.cases),runnerInput:relative(process.cwd(),runnerInput)});
 writeJson(resolve(directory,'witness-search-plan.json'),witnessSearchPlan(materialized.cases));return materialized;
}
async function certificationTransport({approvalPath,freezePath,inputPath,directory}){
 const frozen=verifyFreeze(freezePath),a=readJson(approvalPath);assert.equal(a.action,'CERTIFY_PHASE2B_WITNESSES');assert.equal(a.approvedBy,'USER');assert.equal(a.freezeSha256,frozen.manifestSha256);assert.equal(a.inputSha256,sha(readFileSync(inputPath)));assert.equal(frozen.files[relative(process.cwd(),resolve(inputPath))],a.inputSha256);assert.ok(Date.parse(a.validUntil)>Date.now());assert.ok(Number.isSafeInteger(a.maxSourceRequests)&&a.maxSourceRequests>0);
 const clockPath=resolve(base,'source-clock.json'),clock=existsSync(clockPath)?readJson(clockPath):{};
 await consumeAuthorization(base,sha(readFileSync(approvalPath)),{action:a.action,inputPath,directory,sourceClockBefore:clock});mkdirSync(directory,{recursive:false});let count=0;
 return sourceReader({initialFinishedByOrigin:clock,transport:async(url,options)=>{verifyFreeze(freezePath);assert.ok(Date.parse(a.validUntil)>Date.now(),'CERTIFICATION_AUTHORIZATION_EXPIRED');assert.ok(++count<=a.maxSourceRequests,'CERTIFICATION_REQUEST_BUDGET');return fetch(url,options);},record:(item,bytes)=>{
  const stem=resolve(directory,`${item.requestNumber}-attempt-${item.attempt}`),metadataPath=stem+'.metadata.json';item.metadataPath=metadataPath;
  // Merchant page: retain only raw business JSON-LD/merchant fragments below, not unrelated customer HTML.
  if(bytes&&new URL(item.url).pathname.endsWith('find_vacancy/')){item.bodyPath=stem+'.body.json';writeFileSync(item.bodyPath,bytes,{flag:'wx'});}
  writeJson(metadataPath,item);clock[new URL(item.url).origin]=Date.parse(item.finishedAt);writeFileSync(clockPath,JSON.stringify(clock,null,2)+'\n');
 }});
}
async function main(){
 const {values,positionals}=parseArgs({allowPositionals:true,options:Object.fromEntries(['source','commitment','exit-start','output','fallbacks','input','inventory','plan','registry','ledger','freeze','approval','runner-input','manifest','budgets','pending','review','evaluation-options'].map(k=>[k,{type:'string'}]))});
 const need=k=>{assert.ok(values[k],`--${k} required`);return values[k];},command=positionals[0];
 if(command==='prepare')prepare({source:need('source'),commitmentPath:need('commitment'),exitStart:need('exit-start'),directory:need('output'),fallbacks:values.fallbacks?readJson(values.fallbacks):[]});
 else if(command==='discover'||command==='capture'){
  const inputPath=need('input'),directory=need('output'),read=await certificationTransport({inputPath,directory,approvalPath:need('approval'),freezePath:need('freeze')});
  if(command==='discover'){assert.ok(process.env.GOOGLE_MAPS_API_KEY,'GOOGLE_MAPS_API_KEY_REQUIRED');writeJson(resolve(directory,'discovery.json'),await discoverWitnesses(readJson(inputPath),read,process.env.GOOGLE_MAPS_API_KEY));}
  else {const rows=await captureWitnessJobs(readJson(inputPath).jobs,read);for(let i=0;i<rows.length;i++){const r=rows[i];writeJson(resolve(directory,`${i}.source.json`),{...r,observedAt:r.metadata.requestedAt,responseSha256:r.metadata.sha256,metadataPath:r.metadata.metadataPath,...(r.metadata.bodyPath?{bodyPath:r.metadata.bodyPath}:{})});}}
 }
 else if(command==='certify'){const registry=certifySavedWitnesses(readJson(need('input')),readJson(need('inventory')));writeJson(need('output'),registry);assert.equal(registry.status,'ALL_SIX_WITNESSES_CERTIFIED','WITNESS_GATE_STOPPED');}
 else if(command==='run'){
  const manifest=await authorizeLive({freezePath:need('freeze'),approvalPath:need('approval'),planPath:need('plan'),ledgerPath:need('ledger'),registryPath:need('registry'),runnerInput:need('runner-input'),directory:need('output')});
  const pack=extractPending(manifest,values.budgets?readJson(values.budgets):[]);writeJson(resolve(need('output'),'pending-wordings.json'),pack.pending);writeJson(resolve(need('output'),'structured-budget-bindings.json'),pack.structuredBindings);
 }
 else if(command==='extract'){const pack=extractPending(readJson(need('manifest')),values.budgets?readJson(values.budgets):[]);writeJson(need('output'),pack.pending);writeJson(need('output')+'.structured-budget-bindings.json',pack.structuredBindings);}
 else if(command==='review-gate'){const accepted=requireWordingReview(readJson(need('pending')),readJson(need('review')));writeJson(need('output'),{status:'REVIEW_COMPLETE_NOT_CAPABILITY_PASS',accepted});}
 else if(command==='evaluate'){
  const frozen=verifyFreeze(need('freeze'));for(const name of ['pending','review','manifest','evaluation-options'])if(values[name])assert.equal(frozen.files[relative(process.cwd(),resolve(values[name]))],sha(readFileSync(values[name])),'EVALUATION_INPUT_NOT_FROZEN');
  const pending=readJson(need('pending')),review=readJson(need('review')),manifest=readJson(need('manifest'));
  // Separate frozen evaluator inputs supply independent source/witness evidence; no truth from the production eligibility label.
  const context=values['evaluation-options']?readJson(values['evaluation-options']):{runs:[]};
  const {evaluateRestaurantHybridLiveArtifact}=await import('../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts');
  const {parseCriterionCorrespondences}=await import('../../src/eval/restaurant/agent-loop/criterion-correspondence.ts');
  await evaluateReviewed({pending,review,manifest,directory:need('output'),evaluate:async(r,pairs)=>{
   const criterionCorrespondences=parseCriterionCorrespondences(JSON.stringify({schema:'artifact-criterion-correspondence@1',status:'independently reviewed',rule:'Exact original SHA and both wording hashes',entries:r.artifactPath?[{runId:r.run.runId,artifactSha256:r.artifactSha256,pairs:pairs.map(p=>({goldIndex:p.goldIndex,actualIndex:p.actualIndex,semanticId:`reviewed:${p.goldIndex}`,goldTextSha256:p.goldTextSha256,actualTextSha256:p.actualTextSha256,refs:p.refs}))}]:[]}),'independent-review');
   const matching=context.runs.filter(x=>x.artifactSha256===r.artifactSha256);assert.ok(matching.length<=1,'AMBIGUOUS_EVALUATION_OPTIONS');
   return evaluateRestaurantHybridLiveArtifact(r.artifactPath?readJson(r.artifactPath):undefined,{path:r.artifactPath??'missing-result',sha256:r.artifactSha256??sha('MISSING_RESULT')},{...matching[0]?.options,criterionCorrespondences});
  }});
 }
 else throw Error('COMMAND_REQUIRED: prepare | discover | capture | certify | run | extract | review-gate | evaluate');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main();
