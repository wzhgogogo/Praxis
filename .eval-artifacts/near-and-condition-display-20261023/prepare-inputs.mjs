// Exact private, exposed source commit. No source/model/website call.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir='.eval-artifacts/near-and-condition-display-20261023',commit='1a2e7c12e15e8f8475e8bff00faffcbe926906fa',root='.eval-artifacts/phase2c-holdout/exit-live-20261023',sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>execFileSync('git',['show',`${commit}:${p}`],{maxBuffer:64*1024*1024}),put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const indexPath=`${root}/remaining-five-continuation-20261023/complete-result-index.json`,indexBytes=read(indexPath),rows=JSON.parse(indexBytes).completeResults.sort((a,b)=>a.runId.localeCompare(b.runId)),runs=[];
for(const row of rows){
 const bytes=read(row.path);assert.equal(sha(bytes),row.sha256);const a=JSON.parse(bytes),evalPath=`${root}/evaluation-20261023/evaluations/${row.runId}.evaluation.json`,evalBytes=read(evalPath),e=JSON.parse(evalBytes);
 const p=`${dir}/inputs/runs/${row.runId}.json`;put(p,{schema:'saved-restaurant-event-replay@1',source:{commit,path:row.path,sha256:row.sha256},caseId:a.caseId,runId:a.runId,startedAt:a.startedAt,finishedAt:a.finishedAt,events:a.events,originalPresentation:a.finalSnapshot.domainState.presentedResults??null,semantic:a.materializedCase.semantic,requestIntent:a.finalSnapshot.domainState.intentDraft,resourceUsage:a.resourceUsage,originalEvaluation:{source:{commit,path:evalPath,sha256:sha(evalBytes)},outcome:e.outcome,conditionStates:e.conditionStates,conditionStateComparisons:e.conditionStateComparisons}});
 runs.push({runId:row.runId,originalPath:row.path,originalSha256:row.sha256,projectionPath:p,projectionSha256:sha(fs.readFileSync(p)),evaluationPath:evalPath,evaluationSha256:sha(evalBytes)});
}
const geoPath='.eval-artifacts/phase2c-holdout/witness-certification-20261023/reads/01-centers-and-listings/center-06.attempt-1.body.json',geoBytes=read(geoPath),geo=JSON.parse(geoBytes);assert.ok(geo.places[0].types.includes('transit_station'));assert.equal(geo.places[0].displayName.text,'Kitasenju Station');fs.writeFileSync(`${dir}/inputs/h-06-google-response.json`,geoBytes,{flag:'wx'});
put(`${dir}/inputs/manifest.json`,{schema:'near-condition-saved-inputs@1',status:'Frozen regression; exposed private development evidence',sourceCommit:commit,sourceIndex:{path:indexPath,sha256:sha(indexBytes)},mainlineBase:'8487a844ebfbd3b7146aa62ef6c0fd8ae07df7cb',runs,geography:{originalPath:geoPath,originalSha256:sha(geoBytes),path:`${dir}/inputs/h-06-google-response.json`,sha256:sha(geoBytes)},scope:'Only immutable existing input/events and original presentation/evaluation projected. No Gold, source support, prices, state or judgments invented. Full original bytes remain in sourceCommit. No website/model calls.'});
console.log(JSON.stringify({savedRuns:runs.length,sourceCommit:commit,network:0,models:0}));
