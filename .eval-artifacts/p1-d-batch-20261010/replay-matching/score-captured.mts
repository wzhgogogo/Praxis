import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { acceptableReplayAction, capturedReplayAction, validateReplayMatchFields } from '../../../src/eval/restaurant/agent-loop/runners/run-decision-replay.ts';
const versions=[4,5,6];const root=resolve('.');const output=resolve('.eval-artifacts/p1-d-batch-20261010/replay-matching');
const sourceRoot='/Users/wangzhour/.codex/worktrees/p1-a-baseline/Praxis-Zhixing';
const results={};
for(const version of versions){const seeds=JSON.parse(await readFile(resolve(root,`.eval-artifacts/phase1-replay/seeds.v${version}.json`),'utf8')).seeds;const rows=[];
 for(const seed of seeds){for(const expected of seed.acceptableActions)validateReplayMatchFields(expected);try{
  const captured=(await readFile(resolve(sourceRoot,seed.origin.runArtifact),'utf8')).trim().split('\n').map(line=>JSON.parse(line));const row=captured.find(row=>row.sequence===seed.origin.decisionIndex);if(!row)throw Error('CAPTURED_DECISION_MISSING');const action=capturedReplayAction(seed,row);
  rows.push({seedId:seed.seedId,level:seed.level,subCause:seed.subCause,labelStatus:seed.labelStatus,action,passed:seed.labelStatus==='FROZEN'?seed.acceptableActions.some(expected=>acceptableReplayAction(action,expected)):null});
 }catch(error){rows.push({seedId:seed.seedId,level:seed.level,labelStatus:seed.labelStatus,error:error.message,passed:false});}}
 results[version]=rows;await writeFile(resolve(output,`captured-v${version}.scores.json`),JSON.stringify({realModelCalls:0,total:rows.length,rows},null,2),{flag:'wx'});
}
const differences=results[6].slice(0,128).flatMap(row=>[4,5].flatMap(version=>{const old=results[version].find(old=>old.seedId===row.seedId);return old&&old.passed!==row.passed?[{seedId:row.seedId,version,old:old.passed,new:row.passed}]:[];}));
const rescored=[];const seeds=JSON.parse(await readFile(resolve(root,'.eval-artifacts/phase1-replay/seeds.v6.json'),'utf8')).seeds.slice(-4);
for(const seed of seeds){for(const mode of ['original','categories','original-round2','categories-round2']){
 const path=resolve(root,`.eval-artifacts/p1-c3b-20261010/C8/${mode}/${seed.seedId}.json`);try{const saved=JSON.parse(await readFile(path,'utf8'));if(!saved.action)throw Error('SAVED_ACTION_MISSING');rescored.push({seedId:seed.seedId,mode,path,action:saved.action,passed:seed.acceptableActions.some(expected=>acceptableReplayAction(saved.action,expected))});}catch(error){if(error.code==='ENOENT')continue;rescored.push({seedId:seed.seedId,mode,path,error:error.message});}
 }}
const summary={realModelCalls:0,captured:results[6].map(row=>({seedId:row.seedId,level:row.level,passed:row.passed,error:row.error})),total:132,first128Differences: differences,errors:results[6].filter(row=>row.error),liveOriginalLastFour:results[6].slice(-4),savedC8Outputs:rescored};
await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2),{flag:'wx'});console.log(JSON.stringify({realModelCalls:0,first128Differences:differences,errors:summary.errors.map(row=>({seedId:row.seedId,error:row.error})),lastFour:summary.liveOriginalLastFour.map(row=>({seedId:row.seedId,passed:row.passed})),rescored:rescored.map(row=>({seedId:row.seedId,mode:row.mode,passed:row.passed,error:row.error}))}));
