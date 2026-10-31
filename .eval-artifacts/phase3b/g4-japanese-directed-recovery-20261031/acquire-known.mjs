// Frozen recovery acquisition: only the eight previously reviewed detail URLs.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fetch as nativeFetch,Agent} from 'undici';
import {MINIMUM_GAP_MS,USER_AGENT,cet,permittedURL,robotsDecision,timedGet} from '../g4-japanese-directed-20261031/transport.mjs';
const R='.eval-artifacts/phase3b/g4-japanese-directed-20261031',S='.eval-artifacts/phase3b/g4-japanese-directed-recovery-20261031',L='.eval-artifacts/phase3b/budget.json';
const load=p=>JSON.parse(readFileSync(p,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const childEnv=Object.fromEntries(['PATH','HOME','TMPDIR','LANG','LC_CTYPE','TZ'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const git=(...args)=>execFileSync('git',args,{env:childEnv,maxBuffer:64*1024*1024});
const fail=code=>Object.assign(Error(code),{code});
assert(process.argv.includes('--execute')&&process.argv.includes('--batch'));
const manifestPath=process.argv[process.argv.indexOf('--batch')+1],manifest=load(manifestPath),inputs=load(S+'/inputs.json'),original=load(R+'/inputs.json');
let state=load(S+'/state.json');
function save(p,v){writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});}
function replace(p,v){writeFileSync(p+'.tmp',JSON.stringify(v,null,2)+'\n');renameSync(p+'.tmp',p);}
function stop(code){state.status='STOPPED';state.stop=code;replace(S+'/state.json',state);throw fail(code);}
function verify(){
 for(const f of load(S+'/freeze.json').files)assert.equal(hash(readFileSync(f.path)),f.sha256,f.path);
 assert.equal(hash(readFileSync(manifestPath)),hash(git('show','HEAD:'+manifestPath)),'manifest must be committed');
 assert.equal(git('diff','--name-only',original.productionCommit,'--','src','scripts','web-skills','package.json','package-lock.json').toString().trim(),'');
 for(const f of manifest.basis??[]){assert.equal(hash(readFileSync(f.path)),f.sha256);assert.equal(hash(readFileSync(f.path)),hash(git('show','HEAD:'+f.path)));}
 const preflight=load(S+'/evaluation/nr-007.json'),execution=load(S+'/execution/nr-007.json');
 assert.equal(preflight.verdict,'CORRECT_ACCEPTED');assert(execution.diagnostic);assert.equal(execution.modelCalls,0);assert.equal(execution.modelAttempts,0);assert.equal(execution.sourceNetworkCalls,0);assert.equal(execution.unexpectedFetchAttempts,0);assert.equal(execution.browserClosed,true);
 for(const p of [S+'/execution/nr-007.json',S+'/evaluation/nr-007.json'])assert.equal(hash(readFileSync(p)),hash(git('show','HEAD:'+p)),'Beef preflight must be committed before recovery GET');
}
const totals=entries=>Object.fromEntries(['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'].map(k=>[k,entries.reduce((n,e)=>n+(e[k]??(k==='evaluationPublicGET'?e.publicGET:0)??0),0)]));
function charge(req){
 const b=load(L),before=hash(readFileSync(L)),own=b.entries.filter(e=>e.batch===inputs.batchId);
 if(b.limits.evaluationPublicGET!==260)stop('SHARED_GET_CAP_CHANGED');
 const id=inputs.batchId+'-'+req.id;if(b.entries.some(e=>e.id===id))stop('DUPLICATE_REQUEST_NO_RETRY');
 if(own.length>=8||b.entries.filter(e=>e.batch===original.batchId).reduce((n,e)=>n+(e.batchWebsiteGET??0),0)+own.length>=14)stop('DIRECTED_SITE_CAP_EXHAUSTED');
 if(totals(b.entries).evaluationPublicGET>=260)stop('SHARED_GET_CAP_EXHAUSTED');
 const entry={id,batch:inputs.batchId,parentBatchId:original.batchId,conversation:'C',kind:'DETAIL',knownId:req.knownId,subjectId:req.subjectId,url:req.url,recordedAtCET:cet(),
  fullLive:0,realModelCalls:0,environmentReruns:0,evaluationPublicGET:1,restaurantWebsiteRequests:1,googleRequests:0,batchWebsiteGET:1};
 b.entries.push(entry);b.cumulative=totals(b.entries);b.asOfCET=cet();assert.equal(hash(readFileSync(L)),before,'ledger changed concurrently');replace(L,b);return entry.id;
}
function validate(req){
 if(state.status!=='ACTIVE')throw fail(state.stop??'RECOVERY_STOPPED');
 const expected=original.knownDetails.find(d=>d.id===req.knownId);
 if(!expected||req.kind!=='DETAIL'||req.url!==expected.url||req.subjectId!==expected.subjectId||req.id!==req.knownId.toLowerCase()||!/^known-detail-0[1-8]$/.test(req.id)||!permittedURL('DETAIL',req.url))stop('KNOWN_REQUEST_SCOPE_CHANGED');
 if(state.results.some(r=>r.url===req.url)||existsSync(S+'/requests/'+req.id+'.started.json'))stop('REQUEST_ALREADY_STARTED_NO_RETRY');
 const policy=load(R+'/robots-policy.json');assert.equal(hash(readFileSync(policy.bodyPath)),policy.sha256);
 if(!robotsDecision(readFileSync(policy.bodyPath,'utf8'),req.url).allowed)stop('FROZEN_ROBOTS_DISALLOWS_URL');
}
let dispatcher;
try{
 verify();for(const req of manifest.requests)validate(req);mkdirSync(S+'/requests',{recursive:true});
 dispatcher=new Agent();
 for(const req of manifest.requests){
  const delay=state.lastFinishedEpoch+Math.max(MINIMUM_GAP_MS,state.minimumGapMs??0)-Date.now();if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
  verify();validate(req);
  const prefix=S+'/requests/'+req.id,ledgerId=charge(req);
  save(prefix+'.started.json',{...req,ledgerId,atCET:cet(),method:'GET',redirect:'manual',cookie:false,retries:0,manifestPath,manifestSha256:hash(readFileSync(manifestPath)),frozenCommit:git('rev-parse','HEAD').toString().trim()});
  const result=await timedGet(req.url,{fetchImplementation:nativeFetch,headers:{'Accept-Encoding':'identity','User-Agent':USER_AGENT},dispatcher,onHeaders:header=>save(prefix+'.headers.json',header)});
  const meta={...result.meta,id:req.id,knownId:req.knownId,kind:'DETAIL',subjectId:req.subjectId,ledgerId};
  let failure=meta.networkFailure?.reason??null;
  if(!failure&&meta.status!==200)failure=meta.status>=300&&meta.status<400?'REDIRECT_NOT_FOLLOWED':'HTTP_'+meta.status;
  const text=result.bytes.toString('utf8');
  const rateLimited=meta.status===429||((meta.status??0)>=400&&!!meta.responseHeaders['retry-after'])||/too many requests|RATE_LIMIT_EXCEEDED|RESOURCE_EXHAUSTED/i.test(text.slice(0,12000));
  if(rateLimited)failure='RATE_LIMITED';
  if(!failure&&!/text\/html/i.test(meta.responseHeaders['content-type']??''))failure='SOURCE_CONTENT_TYPE_CHANGED';
  if(!failure&&/verify you are human|unusual traffic|access denied|just a moment|ロボットではない/i.test(text.slice(0,20000)))failure='SOURCE_CHALLENGE';
  meta.bodyPath=prefix+(result.complete?'.body.html':'.partial.bin');meta.sha256=hash(result.bytes);meta.bodyComplete=result.complete;meta.failure=failure;
  writeFileSync(meta.bodyPath,result.bytes,{flag:'wx'});save(prefix+'.result.json',meta);
  state.networkFailureStreak=meta.networkFailure?state.networkFailureStreak+1:0;state.lastFinishedEpoch=Date.now();state.results.push(meta);replace(S+'/state.json',state);
  console.log(JSON.stringify({id:req.id,subjectId:req.subjectId,status:meta.status,failure,headersAtCET:meta.headersAtCET,bodyCompletedAtCET:meta.bodyCompletedAtCET,elapsedMs:meta.elapsedMs,errorCodes:meta.networkFailure?.underlyingCodes??[],networkFailureStreak:state.networkFailureStreak}));
  if(rateLimited)stop('RATE_LIMITED');if(state.networkFailureStreak>=3)stop('THREE_CONSECUTIVE_NETWORK_FAILURES');
  if(['SOURCE_CONTENT_TYPE_CHANGED','SOURCE_CHALLENGE'].includes(failure))stop(failure);
 }
 console.log(JSON.stringify({event:'STAGE_COMPLETE',stage:manifest.stage,status:state.status,recoveryGET:state.results.length}));
}catch(error){
 if(state.status!=='STOPPED'){state.status='STOPPED';state.stop=typeof error?.code==='string'&&/^[A-Z][A-Z0-9_]+$/.test(error.code)?error.code:'CONTROLLED_RECOVERY_STOP';replace(S+'/state.json',state);}
 const p=S+'/stop-'+manifest.stage.toLowerCase()+'.json';if(!existsSync(p))save(p,{status:'STOPPED',reason:state.stop,atCET:cet(),requests:state.results.length});
 console.log(JSON.stringify({event:'STOP',reason:state.stop}));process.exitCode=2;
}finally{if(dispatcher)await dispatcher.destroy();}
