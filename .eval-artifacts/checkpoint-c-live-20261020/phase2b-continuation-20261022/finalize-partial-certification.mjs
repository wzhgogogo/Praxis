// Offline registration of captured sources after a frozen source job stopped. No capability evaluation.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {verifyFreeze,sha} from '../freeze.mjs';
import {certifySavedWitnesses} from '../../phase2b-exit-pipeline-20261022/witnesses.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',get=p=>JSON.parse(fs.readFileSync(p)),put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const [freezePath,inputPath]=process.argv.slice(2);assert.ok(freezePath&&inputPath);const frozen=verifyFreeze(freezePath),input=get(inputPath);
const bound=p=>{assert.equal(frozen.files[path.relative(process.cwd(),path.resolve(p))],sha(fs.readFileSync(p)),'PARTIAL_SOURCE_NOT_FROZEN');return get(p);};
bound(inputPath);const plan=bound(input.witnessPlanPath),stop=bound(input.stoppedPath),failed=bound(input.failedMetadataPath),job=bound(input.jobPath);
assert.equal(stop.reason,'SOURCE_HTTP_FAILURE:400');assert.equal(failed.status,400);assert.equal(failed.attempt,1);assert.equal(sha(fs.readFileSync(input.failedBodyPath)),failed.sha256);assert.equal(frozen.files[input.failedBodyPath],failed.sha256);assert.equal(failed.caseId,'p2b-holdout-05');
const inventory=input.completedRows.map(r=>{assert.equal(sha(fs.readFileSync(r.path)),r.sha256);const row=bound(r.path);bound(row.metadataPath);assert.equal(frozen.files[row.bodyPath],sha(fs.readFileSync(row.bodyPath)));return row;});
const registry=certifySavedWitnesses(plan,inventory);assert.notEqual(registry.status,'ALL_SIX_WITNESSES_CERTIFIED');
const completed=new Set(inventory.map(r=>r.id)),failedRequest=job.requests.find(r=>r.caseId===failed.caseId&&new URL(failed.url).searchParams.get('rst_id')===r.rst_id);assert.ok(failedRequest);
for(const v of registry.variants){
 for(const w of v.candidates){if(w.classification!=='PENDING_INVENTORY')continue;const fail=v.caseId===failed.caseId&&w.rst_id===failedRequest.rst_id;w.classification=fail?'NOT_CERTIFIED_SOURCE_HTTP_FAILURE':'NOT_REACHED_INVENTORY';w.inventoryObservation=fail?{status:400,attempt:1,metadataPath:input.failedMetadataPath,bodyPath:input.failedBodyPath,responseSha256:failed.sha256}:null;}
 if(v.caseId===failed.caseId)v.classification='STOPPED_SOURCE_HTTP_FAILURE';
 else if(v.witnesses.length===0&&v.candidates.every(c=>c.classification==='NOT_CERTIFIED_NO_MATCHING_INVENTORY')){v.classification='NOT_CERTIFIED_NO_MATCHING_INVENTORY';v.fallbackStatus='PENDING_APPROVED_FALLBACK_LOOKUP_NOT_STARTED_BECAUSE_SOURCE_CAPTURE_STOPPED';}
 else if(v.witnesses.length===0&&v.candidates.every(c=>c.classification==='NOT_REACHED_INVENTORY'))v.classification='NOT_REACHED_INVENTORY';
 v.capabilityDenominator='NOT_EVALUATED_STEP3_NOT_PASSED';
}
const certified=registry.variants.flatMap(v=>v.witnesses),earliest=Math.min(...certified.map(w=>Date.parse(w.certifiedAt)));
registry.status='STOPPED_CERTIFICATION_HTTP400_NOT_AUTHORIZED_FOR_LIVE';registry.stop={...input.failure,metadataPath:input.failedMetadataPath,bodyPath:input.failedBodyPath,responseSha256:failed.sha256};registry.partialWitnessWindow={earliestWitnessObservedAt:new Date(earliest).toISOString(),validUntil:new Date(earliest+86400000).toISOString(),scope:'Only successfully certified witnesses. Global all-six witness gate did not pass; no final Live freeze or authorization.'};registry.sourceFreezeSha256=frozen.manifestSha256;registry.models=0;registry.network=0;
put(`${dir}/registry.partial.json`,registry);
const counts=registry.variants.map(v=>({caseId:v.caseId,certifiedWitnesses:v.witnesses.length,classification:v.classification,candidateInventoryStatuses:v.candidates.map(w=>({rst_id:w.rst_id,status:w.classification,matchingSlots:w.matchingSlots??[]}))}));
put(`${dir}/step3-verification.json`,{schema:'phase2b-step3-verification@1',status:'STOPPED_SOURCE_HTTP_FAILURE',allSixWitnessesCertified:false,failedStep:3,freezePath,freezeSha256:frozen.manifestSha256,registryPath:`${dir}/registry.partial.json`,registrySha256:sha(fs.readFileSync(`${dir}/registry.partial.json`)),counts,failure:registry.stop,completedInventoryRequests:inventory.length,failedInventoryRequests:1,notReachedInventoryRequests:job.requests.length-inventory.length-1,partialWitnessWindow:registry.partialWitnessWindow,phase2bExitLive:{planned:18,started:0,status:'NOT_REACHED'},wordingExtraction:'NOT_REACHED_NO_EXIT_ARTIFACTS',models:0,websiteRequestsDuringOfflineRegistration:0});
const planRuns=get(`${dir}/holdout-inputs/plan.json`).runs;put(`${dir}/phase2b-not-reached.json`,{status:'NOT_REACHED',reason:'Step 3 source capture stopped; witness gate did not pass',runs:planRuns.map(run=>({run,status:'NOT_REACHED'})),modelCalls:0,capabilityEvaluation:'NOT_RUN',wordingExtraction:'NOT_REACHED'});
verifyFreeze(freezePath);console.log(JSON.stringify({status:registry.status,counts:counts.map(v=>v.certifiedWitnesses),partialWitnessWindow:registry.partialWitnessWindow,models:0,websiteRequests:0}));
