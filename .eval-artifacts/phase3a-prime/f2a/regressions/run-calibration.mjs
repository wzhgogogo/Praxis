import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir=process.argv[3]??'.eval-artifacts/phase3a-prime/f2a/regressions',mode=process.argv[2],sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p)),put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
let externalCalls=0;globalThis.fetch=()=>{externalCalls++;throw Error('OFFLINE_CALIBRATION_NO_NETWORK_OR_MODEL');};
const manifestPath='.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json',labelsPath='.eval-artifacts/calibration-phase1-20261015/labels.yaml';
if(mode==='prepare'){
 const source=await read('.eval-artifacts/evaluator-hard-course-evidence-20261021/freeze.json'),files={};
 for(const[p,h]of Object.entries(source.files))if(!p.startsWith('src/')&&!p.startsWith('scripts/')&&!p.startsWith('docs/')&&!p.startsWith('.eval-artifacts/evaluator-hard-course-evidence-20261021/')&&!p.startsWith('.eval-artifacts/checkpoint-c')&&p!=='package.json'){files[p]=sha(await fs.readFile(p));assert.equal(files[p],h,`Approved calibration input drift:${p}`);}
 for(const p of execFileSync('git',['ls-files','-z','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],{encoding:'utf8'}).split('\0').filter(Boolean))files[p]=sha(await fs.readFile(p));
 const add=async p=>{files[p]=sha(await fs.readFile(p));};
 async function walk(p){for(const d of await fs.readdir(p,{withFileTypes:true})){const n=path.join(p,d.name);if(d.isDirectory())await walk(n);else await add(n);}}
 const witness=await read('.eval-artifacts/e1-evaluator-20261016/witness-inputs.json');
 for(const e of witness.entries){await add(e.manifestPath);await add(e.registryPath);if(e.rawDirectory)await walk(e.rawDirectory);else{
   const m=await read(e.manifestPath);for(const r of m.rows??[]){for(const key of ['bodyPath','metadataPath'])if(r[key]){const p=path.isAbsolute(r[key])?path.join(path.dirname(e.manifestPath),path.basename(r[key])):path.resolve(path.dirname(e.manifestPath),r[key]);await add(p);}}
 }}
 for(const p of [manifestPath,labelsPath,path.relative(process.cwd(),fileURLToPath(import.meta.url))])files[p]=sha(await fs.readFile(p));
 await put(`${dir}/calibration-freeze.json`,{schema:'budget-condition-calibration-freeze@1',codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),rule:'Labels frozen for separate comparison only; automatic outputs saved before label read. Exposed calibration, not Clean or a real model run.',files});
 console.log(JSON.stringify({stage:'CALIBRATION_FROZEN',files:Object.keys(files).length,sha256:sha(await fs.readFile(`${dir}/calibration-freeze.json`))}));
}else{
 const freezeBytes=await fs.readFile(`${dir}/calibration-freeze.json`),freeze=JSON.parse(freezeBytes);
 const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
 if(mode==='evaluate'){
  const {evaluateFrozenCalibrationArtifact}=await import('../../../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts');
  const manifest=await read(manifestPath),rows=[];assert.equal(manifest.entries.length,22);
  for(const input of manifest.entries){const{evaluation,outputPath}=await evaluateFrozenCalibrationArtifact(manifestPath,input.runId,`${dir}/calibration/evaluations`,'.eval-artifacts/e1-evaluator-20261016/witness-inputs.json','.eval-artifacts/e1-evaluator-20261016/calibration-observations.rev2.json','.eval-artifacts/e1-evaluator-20261016/gold-corrections.json');rows.push({runId:input.runId,outputPath:path.relative(process.cwd(),outputPath),outputSha256:sha(await fs.readFile(outputPath)),outcome:evaluation.outcome.type,declaration:evaluation.severity.S0_DECLARATION.status,boundary:evaluation.severity.S0_BOUNDARY.status});}
  await verify();assert.equal(externalCalls,0);await put(`${dir}/calibration/summary.json`,{status:'AUTOMATIC_OUTPUTS_SAVED_BEFORE_LABEL_COMPARISON',codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),freezeSha256:sha(freezeBytes),rows,newModels:0,newWebsites:0,newLiveRuns:0,externalCalls});
  console.log(JSON.stringify({automaticOutputs:rows.length,externalCalls}));
 }else if(mode==='compare'){
  const summaryBytes=await fs.readFile(`${dir}/calibration/summary.json`),summary=JSON.parse(summaryBytes),labelsBytes=await fs.readFile(labelsPath),{parse}=await import('yaml'),labels=parse(labelsBytes.toString()),rows=[];
  for(const r of summary.rows){assert.equal(sha(await fs.readFile(r.outputPath)),r.outputSha256);const label=labels.runs.find(x=>x.runId===r.runId);assert.ok(label);rows.push({...r,expectedOutcome:label.outcome,outcomeMatched:r.outcome===label.outcome});}
  const normal=rows.filter(r=>r.outcome!=='ORCHESTRATION_INTERRUPTED'),interrupted=rows.filter(r=>r.outcome==='ORCHESTRATION_INTERRUPTED');
  const passed=rows.every(r=>r.outcomeMatched)&&normal.length===20&&normal.every(r=>r.declaration==='ABSENT')&&interrupted.length===2&&interrupted.every(r=>r.declaration==='NOT_EVALUATED');
  await put(`${dir}/calibration/comparison.json`,{status:passed?'PASS':'FAIL',automaticSummarySha256:sha(summaryBytes),labels:{path:labelsPath,sha256:sha(labelsBytes)},outcomeMatches:rows.filter(r=>r.outcomeMatched).length,total:rows.length,normalS0Declaration:{matched:normal.filter(r=>r.declaration==='ABSENT').length,total:normal.length},interruptedS0DeclarationUnknown:interrupted.length,boundary:Object.fromEntries(['ABSENT','PRESENT','NOT_EVALUATED'].map(s=>[s,rows.filter(r=>r.boundary===s).length])),scope:'Exposed calibration only; unknown boundary evidence remains unknown. Labels read after automatic outputs, not passed to evaluator.',rows});
  assert.ok(passed,'Calibration acceptance remains 22/22 and normal declaration20/20');console.log(JSON.stringify({status:'PASS',outcomes:'22/22',normalDeclaration:'20/20',newModels:0,newWebsites:0}));
 }else throw Error('MODE');
}
