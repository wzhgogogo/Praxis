import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const base='.eval-artifacts/checkpoint-c-live-20261020';
const dir=`${base}/c18-offline-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p));
const reviewPath=`${base}/checkpoint-c-continuation-20261021/independent-review.md`;
const reviewSha=sha(await fs.readFile(reviewPath));
const plan=await read(`${base}/plan.json`);
const registryPath='src/eval/restaurant/agent-loop/cases/criterion-correspondences.json';
const registryBytes=await fs.readFile(registryPath),registry=JSON.parse(registryBytes);
assert.equal(registry.schema,'artifact-criterion-correspondence@1');
const before=structuredClone(registry.entries),runs=[];
const norm=s=>s.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[\p{P}\p{Z}\s]+/gu,' ').trim();
// Literal independent reviewer decisions; never an executable synonym lookup.
const decisions={
 'c-02':[[0,1,'good for a first date','first-date restaurant','POSITIVE','UNSPECIFIED'],[2,3,'Sichuan/Hunan cuisine','Sichuan/Hunan-style cuisine where spicy food is the main focus','NEGATIVE','HARD']],
 'c-05':[[0,0,'kaiseki','kaiseki restaurant','POSITIVE','HARD']],
 'c-06':[[0,0,'tempura','tempura restaurant','POSITIVE','HARD']],
 'c-09':[[0,0,'kaiseki','kaiseki restaurant','POSITIVE','HARD']],
 'c-10':[[0,0,'tempura','tempura restaurant','POSITIVE','HARD']],
 'c-12':[[0,1,'good for a first date','first-date restaurant','POSITIVE','UNSPECIFIED'],[2,3,'Sichuan/Hunan cuisine','Sichuan/Hunan-style cuisine where spicy food is the main focus','NEGATIVE','HARD']],
 'c-13':[[0,0,'kaiseki','kaiseki restaurant','POSITIVE','HARD']],
 'c-14':[[0,0,'tempura','tempura restaurant','POSITIVE','HARD']],
 'c-16':[[0,1,'good for a first date','first-date restaurant','POSITIVE','UNSPECIFIED'],[2,3,'Sichuan/Hunan cuisine','Sichuan/Hunan-style cuisine where spicy food is the main focus','NEGATIVE','HARD']],
};
for(const run of plan.runs){
 const roots=[];
 for(const segment of ['checkpoint-c-rerun-20261021','checkpoint-c-continuation-20261021']){
  const root=`${base}/${segment}/live-results`;
  for(const d of await fs.readdir(root))if(d.startsWith(`${run.runId}-attempt-`))roots.push(`${root}/${d}`);
 }
 roots.sort((a,b)=>Number(a.match(/attempt-(\d+)$/)[1])-Number(b.match(/attempt-(\d+)$/)[1]));
 const attempt=roots.at(-1);assert.ok(attempt);
 const names=(await fs.readdir(`${attempt}/runner`)).filter(n=>n.endsWith('.result.json'));assert.equal(names.length,1);
 const p=`${attempt}/runner/${names[0]}`,bytes=await fs.readFile(p),a=JSON.parse(bytes),artifactSha256=sha(bytes);
 assert.equal(a.caseId,run.caseId);
 runs.push({...run,attempt,artifactPath:p,artifactSha256,originalEvaluationPath:`${attempt}/independent.evaluation.json`,originalEvaluationSha256:sha(await fs.readFile(`${attempt}/independent.evaluation.json`))});
 const selected=decisions[run.runId];if(!selected)continue;
 assert.ok(!registry.entries.some(e=>e.artifactSha256===artifactSha256));
 const gold=a.materializedCase.semantic.criteria,actual=a.finalSnapshot.domainState.intentDraft.criteria;
 const pairs=selected.map(([goldIndex,actualIndex,goldText,actualText,polarity,strength])=>{
  assert.equal(norm(gold[goldIndex].value),norm(goldText));assert.equal(norm(actual[actualIndex].text),norm(actualText));
  for(const c of [gold[goldIndex],actual[actualIndex]]){assert.equal(c.polarity,polarity);assert.equal(c.strength,strength);}
  return {goldIndex,actualIndex,semanticId:`semantic:criterion:${goldIndex}`,goldTextSha256:sha(gold[goldIndex].value),actualTextSha256:sha(actual[actualIndex].text),refs:[`${reviewPath}#sha256=${reviewSha}@5b470eaa`,`review-pair:${goldIndex}->${actualIndex}; same polarity=${polarity}; strength=${strength}`]};
 });
 registry.entries.push({runId:run.runId,artifactSha256,pairs});
}
assert.equal(runs.length,18);assert.equal(registry.entries.length-before.length,9);
assert.equal(registry.entries.slice(before.length).reduce((n,e)=>n+e.pairs.length,0),12);
assert.deepEqual(registry.entries.slice(0,before.length),before);
for(const e of registry.entries.slice(before.length))if(['c-02','c-12','c-16'].includes(e.runId)){
 assert.deepEqual(e.pairs.map(p=>[p.goldIndex,p.actualIndex]),[[0,1],[2,3]]);
 assert.ok(!e.pairs.some(p=>p.goldIndex===0&&p.actualIndex===3||p.goldIndex===2&&p.actualIndex===1));
}
await fs.writeFile(`${dir}/correspondence-before.json`,registryBytes,{flag:'wx'});
await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n');
await fs.writeFile(`${dir}/c18-inputs.json`,JSON.stringify({status:'frozen regression; exposed C18 saved inputs',review:{path:reviewPath,sha256:reviewSha,commit:'5b470eaa'},runs},null,2)+'\n',{flag:'wx'});
await fs.writeFile(`${dir}/correspondence-audit.json`,JSON.stringify({status:'PASS',schema:registry.schema,reviewPath,reviewSha256:reviewSha,previousRegistrySha256:sha(registryBytes),registryPath,registrySha256:sha(await fs.readFile(registryPath)),historicalEntriesUnchanged:before.length,artifactsAdded:9,pairsAdded:12,crossPairsRegistered:0,scope:'Only exact approved artifact SHAs; criterion text hashes/polarity/strength independently checked against reviewer literals.',entries:registry.entries.slice(before.length),models:0,websites:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',runs:18,addedArtifacts:9,addedPairs:12,unchangedHistoricalEntries:before.length,reviewSha256:reviewSha}));
