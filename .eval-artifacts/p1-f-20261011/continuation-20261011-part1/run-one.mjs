import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createWriteStream,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root='/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing';
const wt='/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing';
const head='73bfca588ad5007a4a9326c8c13a958718898f1c';
const caseId=process.argv[2], attempt=Number(process.argv[3]??'1');
const witness=JSON.parse(await readFile(resolve(root,'.eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json'),'utf8'));
const entry=witness.variants.find(v=>v.variantId===caseId);if(!entry)throw Error('CASE_NOT_AUTHORIZED');
if(Date.now()>Date.parse(witness.validUntil))throw Error('WITNESS_EXPIRED');
if(execFileSync('git',['rev-parse','HEAD'],{cwd:wt,encoding:'utf8'}).trim()!==head)throw Error('WRONG_FROZEN_HEAD');
if(execFileSync('git',['status','--porcelain'],{cwd:wt,encoding:'utf8'}).trim())throw Error('FROZEN_WORKTREE_NOT_CLEAN');
const dir=resolve(root,'.eval-artifacts/p1-f-20261011/continuation-20261011-part1',caseId);await mkdir(dir,{recursive:true});
const tracePath=resolve(dir,`attempt-${attempt}.trace.jsonl`);await writeFile(tracePath,'',{flag:'wx'});
const artifactDir=resolve(wt,'.eval-artifacts/restaurant-hybrid-live-read');let before=[];try{before=await readdir(artifactDir)}catch{}
const args=[`--env-file-if-exists=${root}/.env`,'--import','tsx','--import',resolve(root,'.eval-artifacts/p1-f-20261011/continuation-20261011-part1/observe.mjs'),'src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts','--case-source','.eval-artifacts/p1-f-20261011/variants.yaml','--case',caseId,'--record-browser','--record-decisions','--no-proxy','--timeout-ms','500000','--max-model-calls','50','--max-google-requests','40'];
const startedAt=new Date().toISOString();
await writeFile(resolve(dir,`attempt-${attempt}.start.json`),JSON.stringify({caseId,attempt,head,worktree:wt,workingTree:'CLEAN',startedAt,command:['node',...args],observer:'Append-only mirror of existing sanitized Recorder entries; zero new browser/model/network requests',stopRules:'User continuation instruction: unexpected Guard admission, form submission, booking/confirm/payment click, personal-information input stop. G1 entry GET and reviewed calendar POST normal. Production Guard enforces control permissions; outer mirror checks admitted non-read requests.'},null,2),{flag:'wx'});
const env={...process.env,PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION:'0',PRAXIS_LOCAL_CHROMIUM_INTERACTIVE:'0',P1F_TRACE_PATH:tracePath};
delete env.PRAXIS_EVAL_USER_LAT;delete env.PRAXIS_EVAL_USER_LNG;
const output=createWriteStream(resolve(dir,`attempt-${attempt}.log`),{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:wt,env,stdio:['ignore','pipe','pipe']});child.stdout.pipe(output,{end:false});child.stderr.pipe(output,{end:false});
let stop=null,checked=0;
const reviewedPosts=JSON.parse(readFileSync(resolve(root,'.eval-artifacts/p1-f-20261011/continuation-20261011-part1/reviewed-reads.json'),'utf8'));
const reviewedReadPost=r=>r.method==='POST'&&reviewedPosts.some(rule=>rule.methods?.includes('POST')&&new URL(r.origin).origin===rule.origin&&r.pathname===rule.pathname&&rule.resourceTypes.includes(r.resourceType)&&!(r.queryKeys??[]).length);
const sensitive=p=>/\/(?:reserve|reservation|reservations|booking|payment|checkout|confirmation|personal-information|contact-details)(?:\/|$)/i.test(p);
const reviewedDocument=r=>r.method==='GET'&&r.resourceType==='document'&&reviewedPosts.some(rule=>rule.resourceTypes.includes('document')&&new URL(r.origin).origin===rule.origin&&rule.pathnamePattern&&new RegExp(rule.pathnamePattern).test(r.pathname)&&r.queryKeys.length===rule.queryKeyRules.required.length&&rule.queryKeyRules.required.every(k=>r.queryKeys.includes(k)));
const approvedDocuments=new Set();
function check(){
 const lines=readFileSync(tracePath,'utf8').split('\n').filter(Boolean);
 for(;checked<lines.length;checked++){
  let row;try{row=JSON.parse(lines[checked]);}catch{break}
  const d=row.detail;
  const requests=row.kind==='NETWORK'&&Array.isArray(d)?d:d?.networkRequests??[];
  let reason;
  for(const r of requests)if(r.outcome==='ADMITTED'&&reviewedDocument(r))approvedDocuments.add(new URL(r.origin).origin+r.pathname);
  const write=requests.find(r=>r.outcome==='ADMITTED'&&!['GET','HEAD'].includes(r.method)&&!reviewedReadPost(r));
  if(write)reason={code:'ADMITTED_NON_READ_METHOD',request:write};
  if(reason&&!stop){stop={...reason,at:new Date().toISOString(),traceSequence:row.sequence};child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),3000).unref();break;}
 }
}
const poll=setInterval(check,200);
const exitCode=await new Promise((r,j)=>{child.on('error',j);child.on('close',(code,signal)=>r({code,signal}))});clearInterval(poll);check();output.end();
const endedAt=new Date().toISOString();
const newFiles=(await readdir(artifactDir).catch(()=>[])).filter(f=>!before.includes(f));
const results=newFiles.filter(f=>f.endsWith('.result.json')).map(f=>resolve(artifactDir,f));
let deliveryCount=null,usage=null;
if(results.length){const a=JSON.parse(await readFile(results[0],'utf8'));deliveryCount=a.finalSnapshot?.domainState?.presentedResults?.candidateIds?.length??0;usage=a.resourceUsage??null;}
const raws=[];
if(results.length&&deliveryCount===0&&!caseId.includes('h004')){
 const rawDir=resolve(dir,'witness-raw');await mkdir(rawDir,{recursive:true});
 const date=entry.request.match(/\d{4}-\d{2}-\d{2}/)?.[0]?.replaceAll('-','');
 const party=entry.request.match(/x(\d+)/)?.[1];const time=entry.request.match(/\d{2}:\d{2}/)?.[0]?.replace(':','');
 if(!date||!party||!time)throw Error('WITNESS_PARAMETERS_MISSING');
 for(const w of entry.witnesses){
  const rst_id=new URL(w.sourceUrl).pathname.split('/').filter(Boolean).at(-1);
  const url=new URL('https://tabelog.com/en/booking/calendar/find_vacancy/');for(const [k,v]of Object.entries({rst_id,svd:date,svps:party,svt:time}))url.searchParams.set(k,v);
  const item={rst_id,method:'GET',url:url.toString(),parameters:{rst_id,svd:date,svps:party,svt:time},parameterBasis:'Approved witness request; start of stated window for h003',requestedAt:new Date().toISOString()};
  try{const response=await fetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});const body=Buffer.from(await response.arrayBuffer());item.status=response.status;item.contentType=response.headers.get('content-type');item.bodyPath=resolve(rawDir,`attempt-${attempt}-${rst_id}.body.txt`);item.sha256=createHash('sha256').update(body).digest('hex');await writeFile(item.bodyPath,body,{flag:'wx'});}catch(e){item.error=e.name;}
  item.finishedAt=new Date().toISOString();await writeFile(resolve(rawDir,`attempt-${attempt}-${rst_id}.metadata.json`),JSON.stringify(item,null,2),{flag:'wx'});raws.push(item);
 }
}
const finish={caseId,attempt,head,worktree:wt,startedAt,endedAt,wallMs:Date.parse(endedAt)-Date.parse(startedAt),exitCode,stop,results,newFiles,deliveryCount,resourceUsage:usage,witness:raws,interpretation:'NONE; independent review pending'};
await writeFile(resolve(dir,`attempt-${attempt}.finish.json`),JSON.stringify(finish,null,2),{flag:'wx'});
console.log(JSON.stringify({caseId,attempt,exitCode,stop,results,deliveryCount,witness:raws.map(({rst_id,status,error})=>({rst_id,status,error}))}));
