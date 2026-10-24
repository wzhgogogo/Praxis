// Frozen evaluation orchestration. Default is offline preflight; never run Live
// in this batch. A later human-approved receipt and merged F2 commits are required.
import fs from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../../..');
const sha=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const freeze=read(resolve(here,'freeze.json')),plan=read(resolve(here,'live-plan.json'));
for(const [file,digest] of Object.entries(freeze.files))assert.equal(sha(resolve(root,file)),digest,'FROZEN_CHANGED:'+file);
for(const item of plan.cases){
 const template=fs.readFileSync(resolve(here,item.id+'.template.txt'),'utf8'),content=fs.readFileSync(resolve(here,item.id+'.content.txt'),'utf8');
 assert.equal(content,template.replace('{DATE}',item.dateExpression),'DATE_ONLY:'+item.id);
 const delta=(Date.parse(item.date+'T00:00:00Z')-Date.parse(plan.plannedRunDateVienna+'T00:00:00Z'))/86400000;
 assert.ok(delta>=7&&delta<=14);assert.equal(new Date(item.date+'T00:00:00Z').getUTCDay(),item.weekday);
}
const commands=plan.cases.flatMap(item=>[1,2,3].map(attempt=>({caseId:item.id,attempt,nodeArgs:['--import','tsx','src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts','--case-source',plan.runnerInput,'--case',item.id,'--timeout-ms','500000','--max-model-calls','50','--record-decisions','--record-browser','--no-proxy']})));
if(!process.argv.includes('--run')){
 console.log(JSON.stringify({status:'OFFLINE_PREPARATION_PASS',realCalls:0,liveRuns:0,commands,requirements:plan.requirements},null,2));
}else{
 const index=process.argv.indexOf('--approval');assert.ok(index>=0,'Future explicit user approval receipt is required');
 const approval=read(resolve(process.argv[index+1]));assert.equal(approval.explicitUserApproval,true);assert.ok(approval.userMessageEvidence);
 assert.equal(git('status','--porcelain'),'','WORKTREE_DIRTY');assert.equal(git('rev-parse','HEAD'),approval.liveCodeCommit);
 for(const name of ['f2_1','f2_4a']){assert.match(approval[name],/^[a-f0-9]{40}$/);git('merge-base','--is-ancestor',approval[name],'main');git('merge-base','--is-ancestor',approval[name],'HEAD');}
 assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),plan.plannedRunDateVienna,'Dates must be refrozen for the actual run day');
 const cert=read(resolve(approval.preLiveCertificate));assert.equal(cert.status,'WITNESS_EXISTS');assert.ok(Date.now()-Date.parse(cert.certifiedAtVienna)<86400000,'Repeat GET certification within24h before Live');
 assert.equal(cert.date,plan.cases[0].date);assert.equal(approval.independentReviewRequired,true);
 // One explicitly selected slot per invocation; inspect S0 and four-layer
 // results before starting the next. No automatic retry or extra health loop.
 const slot=Number(process.argv[process.argv.indexOf('--slot')+1]);assert.ok(Number.isSafeInteger(slot)&&slot>=1&&slot<=6);
 const command=commands[slot-1],directory=resolve(here,'live-slot-'+slot);fs.mkdirSync(directory);
 const before=fs.readdirSync(resolve(root,'.eval-artifacts/restaurant-hybrid-live-read'));
 fs.writeFileSync(resolve(directory,'started.json'),JSON.stringify({command,approval,startedAtVienna:new Date().toLocaleString('sv-SE',{timeZone:'Europe/Vienna'}),freezeSha256:sha(resolve(here,'freeze.json'))},null,2));
 const result=spawnSync(process.execPath,command.nodeArgs,{cwd:root,env:{...process.env,PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_LOCAL_CHROMIUM_INTERACTIVE:'0',PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION:'0'},encoding:'utf8',timeout:700000,maxBuffer:16*1024*1024});
 fs.writeFileSync(resolve(directory,'stdout.txt'),result.stdout??'');fs.writeFileSync(resolve(directory,'stderr.txt'),result.stderr??'');
 fs.writeFileSync(resolve(directory,'finished.json'),JSON.stringify({status:result.status,signal:result.signal,before,manualIndependentReview:'REQUIRED_BEFORE_NEXT_SLOT',scope:'Outer timeout is orchestration cleanup; never score an interrupted child as product timeout'},null,2));
 // Runner owns per-provider call records. Reconcile them into the shared ledger
 // in the independent review before authorizing another slot, including failures.
 assert.equal(result.status,0,'Stop batch and audit failure/usage; never retry automatically');
}
