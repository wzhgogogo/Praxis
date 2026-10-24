import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {gunzipSync} from 'node:zlib';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const dir='.eval-artifacts/phase3a-prime/f2a',out=`${dir}/validation`;
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const freeze=await read(`${dir}/validation-freeze.json`);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};
await verify();await fs.mkdir(out,{recursive:false});
let externalCalls=0;globalThis.fetch=()=>{externalCalls++;throw Error('OFFLINE_VALIDATION_NO_EXTERNAL_REQUEST');};
const manifest=await read(`${dir}/inputs/manifest.json`);
const source={path:manifest.h12.originalPath,sha256:manifest.h12.originalSha256};
const artifact=JSON.parse(gunzipSync(await fs.readFile(`${dir}/inputs/${manifest.h12.path}`)));
const {loadPostDeliveryTabelogObservation}=await import('../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-grounding.ts');
const {loadCriterionCorrespondences}=await import('../../../src/eval/restaurant/agent-loop/criterion-correspondence.ts');
const {parseReviewedReads}=await import('../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts');
const {evaluateRestaurantHybridLiveArtifact:evaluate34}=await import('../../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts');
const options={criterionCorrespondences:loadCriterionCorrespondences(),postDeliveryTabelog:['13164267','13196646','13318138'].map(id=>loadPostDeliveryTabelogObservation(`${dir}/inputs/h12-context/${id}.metadata.json`,`${dir}/inputs/h12-context/${id}.body.txt`)),
  reviewedReads:parseReviewedReads(await fs.readFile('.eval-artifacts/tablecheck-guard-preflight-20261023/reviewed-reads.json'),'.eval-artifacts/tablecheck-guard-preflight-20261023/reviewed-reads.json')};
const isolate=await fs.mkdtemp(path.join(tmpdir(),'praxis-f2a-isolated-controls-'));
const normalized=e=>({...e,evaluatorVersion:'NORMALIZED',rubricVersion:'NORMALIZED'});
const diff=(a,b,p='',rows=[])=>{if(JSON.stringify(a)===JSON.stringify(b))return rows;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b)){rows.push({path:p,before:a,after:b});return rows;}for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[k],b[k],p?`${p}.${k}`:k,rows);return rows;};
try{
  await fs.cp('src',path.join(isolate,'src'),{recursive:true,filter:p=>!p.includes('/fixtures/')&&!p.endsWith('.test.ts')});
  // The subprocess controls below need just their three minimal fixture modules.
  await fs.mkdir(path.join(isolate,'src/harness/browser/fixtures'),{recursive:true});
  for(const name of ['run-interruption.ts','run-interruption-scenario.ts'])await fs.copyFile(`src/harness/browser/fixtures/${name}`,path.join(isolate,'src/harness/browser/fixtures',name));
  await fs.copyFile('package.json',path.join(isolate,'package.json'));
  await fs.symlink(path.resolve('node_modules'),path.join(isolate,'node_modules'),'dir');
  const evalDir='src/eval/restaurant/agent-loop';
  for(const name of ['diagnostic-evaluator.ts','diagnostic-evaluator-outcome.ts','diagnostic-evaluator-record.ts'])await fs.writeFile(path.join(isolate,evalDir,name),execFileSync('git',['show',`f42715c2:${evalDir}/${name}`]));
  const {evaluateRestaurantHybridLiveArtifact:evaluate33}=await import(pathToFileURL(path.join(isolate,evalDir,'diagnostic-evaluator.ts')).href);
  const before=evaluate33(artifact,source,options),after=evaluate34(artifact,source,options);
  await put(`${out}/h-12.33.json`,before);await put(`${out}/h-12.34.json`,after);
  const changes=diff(before,after);
  for(const dimension of ['REQUIRED_EVIDENCE','INVESTIGATION_BEHAVIOR','RESOURCES'])assert.deepEqual(before.findings.find(f=>f.dimension===dimension),after.findings.find(f=>f.dimension===dimension),dimension);
  for(const field of ['conditionStates','conditionEvidenceFindings','conditionStateComparisons','pendingCriterionWordings','witnessFunnel','effectiveResources','investigationMetrics','recordReadIssues'])assert.deepEqual(before[field],after[field],field);
  assert.equal(before.findings[0].status,'NOT_SATISFIED');assert.equal(after.findings[0].status,'SATISFIED');
  // A single-rule intervention, independent of the new interruption handling,
  // must account for the entire output delta, including derived conclusions.
  const baselinePath=path.join(isolate,evalDir,'diagnostic-evaluator.ts');
  let text=await fs.readFile(baselinePath,'utf8');
  const from='const actualOnly = actualParts.filter((criterion) => !expectedByIdentity.has(criterionIdentity(criterion)));';
  assert.ok(text.includes(from));
  text=text.replace(from,from.replace(/;$/,'')+'.filter(criterion => criterion.strength !== "UNSPECIFIED" || expectedParts.some(gold => gold.text === criterion.text) || criterion.text.startsWith("unmatched-identity:"));');
  const controlPath=path.join(isolate,evalDir,`diagnostic-evaluator-single-rule-${randomUUID()}.ts`);await fs.writeFile(controlPath,text);
  const {evaluateRestaurantHybridLiveArtifact:oneRule}=await import(pathToFileURL(controlPath).href);
  assert.deepEqual(normalized(oneRule(artifact,source,options)),normalized(after),'All changes must be caused by the single UNSPECIFIED rule');
  await put(`${out}/h-12.comparison.json`,{status:'PASS',inputSha256:source.sha256,baselineCommit:'f42715c2',singleRuleExplainsEntireDelta:true,independentDimensionsUnchanged:['REQUIRED_EVIDENCE','INVESTIGATION_BEHAVIOR','RESOURCES'],changes});
  // Disable only the owned stop control in an isolated copy. A real SIGTERM
  // during actual AVAILABILITY must fail the very same persistence assertion.
  const livePath=path.join(isolate,evalDir,'runners/run-hybrid-live-read.ts');
  let live=await fs.readFile(livePath,'utf8');
  const stop='const deadlineControl = createRunStopControl(liveReadLimits.maxAutomaticBrowserMs, dependencies.signal);';assert.ok(live.includes(stop));
  live='import { createRunDeadlineSignal as originalDeadline } from "../live-run-deadline.js";\n'+live.replace(stop,'const deadlineControl = { ...originalDeadline(liveReadLimits.maxAutomaticBrowserMs, dependencies.signal), interruption: () => undefined };');
  await fs.writeFile(livePath,live);
  const {runInterruptionScenario:broken}=await import(pathToFileURL(path.join(isolate,'src/harness/browser/fixtures/run-interruption-scenario.ts')).href);
  let detected=false;
  try{await broken('signal',path.resolve(`${out}/interruption-red`));}catch(error){detected=true;await put(`${out}/interruption-red/assertion.json`,{detected:true,message:String(error.message)});}
  assert.ok(detected,'disabled signal persistence must be detected');
  const redProcess=await read(`${out}/interruption-red/process.json`);assert.ok(redProcess.messages.some(m=>m.stage==='AVAILABILITY_READING'));
}finally{await fs.rm(isolate,{recursive:true,force:true});}
const {runInterruptionScenario}=await import('../../../src/harness/browser/fixtures/run-interruption-scenario.ts');
const runs=[];
for(const mode of ['complete','signal','deadline','external']){
 const started=performance.now(),r=await runInterruptionScenario(mode,path.resolve(`${out}/interruption-${mode}`));
 const evaluation=evaluate34(r.artifact,{path:path.relative(process.cwd(),r.resultPath),sha256:sha(await fs.readFile(r.resultPath))});
 await put(`${out}/interruption-${mode}/independent-evaluation.json`,evaluation);
 assert.equal(evaluation.severity.S0_DECLARATION.status,'ABSENT');if(mode!=='complete')assert.equal(evaluation.outcome.type,'ORCHESTRATION_INTERRUPTED');
 runs.push({mode,elapsedSeconds:(performance.now()-started)/1000,outcome:evaluation.outcome.type,declaration:evaluation.severity.S0_DECLARATION.status,boundary:evaluation.severity.S0_BOUNDARY.status,reachedStages:evaluation.reachedStages??[],exit:r.exit});
}
const {BrowserReadRecording}=await import('../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.ts');
const {discoveryPackNetworkPolicy}=await import('../../../src/integrations/restaurant-search/source-packs.ts');
const policy=discoveryPackNetworkPolicy(),recordings=[];
for(const entry of manifest.recordings){
 const files=JSON.parse(gunzipSync(await fs.readFile(`${dir}/inputs/${entry.path}`)));
 for(const [file,hash]of Object.entries(entry.files))assert.equal(sha(Buffer.from(files[file])),hash);
 const saved=JSON.parse(files['recording.json']);
 const recorder=new BrowserReadRecording({directory:path.resolve(`${out}/recordings`),runId:entry.id,reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources});
 for(const css of saved.stylesheets??[])await recorder.recordResponse({url:css.url,method:'GET',resourceType:'stylesheet',status:200,contentType:'text/css',body:Buffer.from(files[css.file])});
 if(files['replay.har'])for(const row of JSON.parse(files['replay.har']).log.entries){if(row.response.content?.text)await recorder.recordResponse({url:row.request.url,method:row.request.method,resourceType:row.response.content.mimeType.includes('javascript')?'script':row.response.content.mimeType.includes('json')?'fetch':'document',status:row.response.status,contentType:row.response.content.mimeType,body:Buffer.from(row.response.content.text),...(row.response.redirectURL?{redirectLocation:row.response.redirectURL}:{})});}
 const snapshots=saved.entries.filter(e=>e.kind==='SNAPSHOT'),mapping=[],missing=[];
 for(const [index,event]of snapshots.entries()){
  const number=index+1,doc=saved.documents.find(d=>d.snapshot===number);
  if(!doc||!files[doc.file]){missing.push({snapshot:number,status:'NOT_REPLAYABLE',reason:'ORIGINAL_DOCUMENT_NOT_RETAINED',originalHtmlLength:event.detail.htmlLength??null});continue;}
  recorder.recordSnapshot({url:doc.url,title:event.detail.title??'',text:'',html:files[doc.file],networkRequests:event.detail.networkRequests??[]});mapping.push(number);
 }
 const result=await recorder.finish();
 const pages=[...result.pages.map((p,i)=>({...p,snapshot:mapping[i]})),...missing].sort((a,b)=>a.snapshot-b.snapshot);
 const replayable=pages.filter(p=>p.status==='REPLAYABLE').length;
 const reasons={};for(const page of pages)if(page.status!=='REPLAYABLE')reasons[page.reason]=(reasons[page.reason]??0)+1;
 const row={id:entry.id,totalPages:snapshots.length,originalRetainedDocuments:saved.documents.length,replayablePages:replayable,fraction:snapshots.length?replayable/snapshots.length:0,reasons,originalReplay:saved.replay,newReplay:result.replay.status,pages};
 await put(`${out}/recordings/${entry.id}.qualification.json`,row);recordings.push(row);
}
await verify();assert.equal(externalCalls,0);
await put(`${out}/summary.json`,{status:'PASS',codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),freezeSha256:sha(await fs.readFile(`${dir}/validation-freeze.json`)),timezone:'Europe/Vienna',finishedAt:new Date().toLocaleString('sv-SE',{timeZone:'Europe/Vienna'}),runs,recordings:recordings.map(({pages,...r})=>r),realModels:0,websites:0,googleRequests:0,liveRuns:0,externalCalls});
console.log(JSON.stringify({status:'PASS',runs:runs.length,recordings:recordings.map(({id,totalPages,replayablePages,reasons})=>({id,totalPages,replayablePages,reasons})),externalCalls}));
