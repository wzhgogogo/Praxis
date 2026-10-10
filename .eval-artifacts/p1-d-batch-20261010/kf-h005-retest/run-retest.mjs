import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readdir, writeFile, readFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
const worktree=process.argv[2], attempt=process.argv[3]??'1';
if(!worktree)throw Error('worktree required');
const directory=resolve('.eval-artifacts/p1-d-batch-20261010/kf-h005-retest');await mkdir(directory,{recursive:true});
const startedAt=new Date().toISOString();
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8'}).trim();
const dirty=execFileSync('git',['status','--porcelain'],{cwd:worktree,encoding:'utf8'}).trim();
if(dirty)throw Error('FROZEN_WORKTREE_NOT_CLEAN');
if(!head.startsWith('920bad9'))throw Error('WRONG_FROZEN_HEAD');
// The user specified a latest start of Tokyo 05:30 and witness expiry 06:53.
if(Date.now()>Date.parse('2026-10-11T05:30:00+09:00'))throw Error('RETEST_START_DEADLINE_PASSED');
const artifactDir=resolve(worktree,'.eval-artifacts/restaurant-hybrid-live-read');
let before=[];try{before=await readdir(artifactDir);}catch{}
const args=['run','eval:restaurant:agent-loop:hybrid-live-read','--','--case-source','.eval-artifacts/known-feasible-baseline-20261008/variants.yaml','--case','kf-h005-20261021','--record-browser','--record-decisions','--no-proxy','--timeout-ms','500000','--max-model-calls','50','--max-google-requests','40'];
await writeFile(resolve(directory,`attempt-${attempt}.start.json`),JSON.stringify({startedAt,head,worktree,workingTree:'CLEAN',command:['npm',...args]},null,2),{flag:'wx'});
const stream=createWriteStream(resolve(directory,`attempt-${attempt}.log`),{flags:'wx'});
const child=spawn('npm',args,{cwd:worktree,env:{...process.env,PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION:'0',PRAXIS_LOCAL_CHROMIUM_INTERACTIVE:'0'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});stream.end();
const endedAt=new Date().toISOString();
let results=[];try{results=(await readdir(artifactDir)).filter(f=>f.endsWith('.result.json')&&!before.includes(f)).map(f=>resolve(artifactDir,f));}catch{}
const witness=[];
// Capture immediately after the formal read, before any evaluation or implementation work.
if(results.length){const rawDir=resolve(directory,'witness-raw');await mkdir(rawDir,{recursive:true});for(const rst_id of ['13305528','13280412','13255508']){
 const url=new URL('https://tabelog.com/en/booking/calendar/find_vacancy/');for(const [key,value] of Object.entries({rst_id,svd:'20261021',svps:'4',svt:'1800'}))url.searchParams.set(key,value);
 const requestedAt=new Date().toISOString();const item={rst_id,url:url.toString(),method:'GET',requestedAt};
 try{const response=await fetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});item.status=response.status;item.contentType=response.headers.get('content-type');item.finishedAt=new Date().toISOString();item.bodyPath=resolve(rawDir,`attempt-${attempt}-${rst_id}.body.txt`);await writeFile(item.bodyPath,Buffer.from(await response.arrayBuffer()),{flag:'wx'});}
 catch(error){item.error=error.name;item.finishedAt=new Date().toISOString();}
 await writeFile(resolve(rawDir,`attempt-${attempt}-${rst_id}.metadata.json`),JSON.stringify(item,null,2),{flag:'wx'});witness.push(item);
 }}
await writeFile(resolve(directory,`attempt-${attempt}.finish.json`),JSON.stringify({head,worktree,startedAt,endedAt,exitCode,results,witness,interpretation:'NONE; independent reviewer judges raw witness responses'},null,2),{flag:'wx'});
console.log(JSON.stringify({head,exitCode,results,witness:witness.map(({bodyPath,status,requestedAt,rst_id,error})=>({bodyPath,status,requestedAt,rst_id,error}))}));
