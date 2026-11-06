// Independent certification only. Does not construct a product assembly, load
// credentials, or mutate proposed truth into an accepted certificate.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [rootArgument,expectedSHA]=process.argv.slice(2);assert.ok(rootArgument&&expectedSHA);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedSHA);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
const root=resolve(rootArgument),prep=join(root,'preparation'),out=join(root,'certification');
const config=JSON.parse(await readFile(join(prep,'certification-request-proposal.json'),'utf8'));
assert.equal(config.requests.length,5);
const {chargeG6}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/g6/budget.ts')).href);
const {publicGETError}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/g6/development-evidence.ts')).href);
const ledger=join(root,'budget-C-live.json');let count=0,last=-Infinity;
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
await mkdir(out,{recursive:false});
for(const request of config.requests){
 const url=new URL(request.url);
 assert.equal(url.protocol,'https:');assert.ok(!url.username&&!url.password&&!url.hash);
 assert.ok(['https://tabelog.com','https://www.tablecheck.com'].includes(url.origin));
 assert.ok(!/form_course|yoyaku|confirm|payment|checkout|account|login/iu.test(url.pathname));
 const elapsed=Date.now()-last;if(elapsed<5000)await new Promise(resolve=>setTimeout(resolve,5000-elapsed));
 assert.ok(count<5);const name=String(++count).padStart(2,'0')+'-'+request.id;
 await chargeG6(ledger,'C-20261106-CERT:'+name,'evaluationPublicGET','User approved five independent certification GETs, total447; no Cookie/redirect/retry');
 last=Date.now();const startedAtUTC=new Date().toISOString();
 await writeFile(join(out,name+'.started.json'),JSON.stringify({sourceSHA:expectedSHA,id:request.id,url:url.href,startedAtUTC,method:'GET',cookies:false,redirect:'manual',timeoutMs:20000,retry:false},null,2)+'\n',{flag:'wx'});
 try{
  const response=await fetch(url,{method:'GET',credentials:'omit',redirect:'manual',headers:{accept:'text/html,application/json'},signal:AbortSignal.timeout(20000)});
  const headersAtUTC=new Date().toISOString();
  const raw=new Uint8Array(await response.arrayBuffer());assert.ok(raw.byteLength<=8000000);
  const bodyPath=join(out,name+'.body');await writeFile(bodyPath,raw,{flag:'wx',mode:0o600});
  await writeFile(join(out,name+'.meta.json'),JSON.stringify({url:url.href,status:response.status,startedAtUTC,headersAtUTC,finishedAtUTC:new Date().toISOString(),contentType:response.headers.get('content-type'),lastModified:response.headers.get('last-modified'),location:response.headers.get('location'),sha256:sha(raw),bytes:raw.byteLength,bodyPath},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({id:request.id,status:response.status,bytes:raw.byteLength}));
  assert.equal(response.status,200,'Certification status non200; no retry');
 }catch(error){await writeFile(join(out,name+'.failure.json'),JSON.stringify({startedAtUTC,failedAtUTC:new Date().toISOString(),error:publicGETError(error),attempts:count,noRetry:true,LiveStarted:false},null,2)+'\n',{flag:'wx'});throw error;}
}
await writeFile(join(out,'capture.json'),JSON.stringify({status:'RAW_REVIEW_REQUIRED',publicGETAttempts:count,sourceSHA:expectedSHA,model:0,Google:0,Live:0},null,2)+'\n',{flag:'wx'});
