import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fetch as nativeFetch,Agent,ProxyAgent} from 'undici';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {DEADLINE_MS,MINIMUM_GAP_MS,USER_AGENT,cet,permittedURL,robotsDecision,timedGet} from './transport.mjs';
const R='.eval-artifacts/phase3b/g4-japanese-directed-20261031',L='.eval-artifacts/phase3b/budget.json';
const load=p=>JSON.parse(readFileSync(p,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const childEnv=Object.fromEntries(['PATH','HOME','TMPDIR','LANG','LC_CTYPE','TZ'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',env:childEnv,maxBuffer:64*1024*1024}).trim();
const fail=code=>Object.assign(Error(code),{code});
const manifestPath=process.argv[process.argv.indexOf('--batch')+1];
assert(process.argv.includes('--execute')&&process.argv.includes('--batch'));
const manifest=load(manifestPath),inputs=load(R+'/inputs.json'),googleURL=inputs.googleRequest.url;
const key=manifest.stage==='GOOGLE'?process.env.GOOGLE_MAPS_API_KEY:undefined;
function safe(bytes){if(key&&bytes.includes(Buffer.from(key)))throw fail('SECRET_ECHO_NOT_PERSISTED');return bytes;}
function save(p,v){writeFileSync(p,safe(Buffer.from(JSON.stringify(v,null,2)+'\n')),{flag:'wx'});}
function replace(p,v){const bytes=safe(Buffer.from(JSON.stringify(v,null,2)+'\n'));writeFileSync(p+'.tmp',bytes);renameSync(p+'.tmp',p);}
const statePath=R+'/state.json';
let state=existsSync(statePath)?load(statePath):{status:'ACTIVE',networkFailureStreak:0,lastFinishedEpoch:0,results:[]};
function stop(code){state.status='STOPPED';state.stop=code;replace(statePath,state);throw fail(code);}
function verify(){
 for(const f of load(R+'/freeze.json').files)assert.equal(hash(readFileSync(f.path)),f.sha256,f.path);
 assert.equal(hash(readFileSync(manifestPath)),hash(Buffer.from(git('show','HEAD:'+manifestPath)+'\n')),'manifest must be committed before requests');
 assert.equal(git('diff','--name-only','da452626','--','src','scripts','web-skills','package.json','package-lock.json'),'','product/config must remain reviewed');
 for(const f of manifest.basis??[]){assert.equal(hash(readFileSync(f.path)),f.sha256);assert.equal(hash(readFileSync(f.path)),hash(execFileSync('git',['show','HEAD:'+f.path],{env:childEnv,maxBuffer:64*1024*1024})));}
}
const totals=entries=>Object.fromEntries(['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'].map(k=>[k,entries.reduce((n,e)=>n+(e[k]??(k==='evaluationPublicGET'?e.publicGET:0)??0),0)]));
function charge(req){
 const b=load(L),before=hash(readFileSync(L)),own=b.entries.filter(e=>e.batch===inputs.batchId);
 if(b.limits.evaluationPublicGET!==260)stop('SHARED_GET_CAP_CHANGED');
 const id=inputs.batchId+'-'+req.id;if(b.entries.some(e=>e.id===id))stop('DUPLICATE_REQUEST_NO_RETRY');
 if(req.kind==='GOOGLE'&&own.filter(e=>e.googleRequests).length>=1)stop('GOOGLE_CAP_EXHAUSTED');
 if(req.kind==='ROBOTS'&&own.some(e=>e.kind==='ROBOTS'))stop('ROBOTS_ALREADY_READ');
 if(!['GOOGLE','ROBOTS'].includes(req.kind)&&own.filter(e=>e.kind==='SEARCH'||e.kind==='DETAIL').length>=14)stop('BATCH_SITE_CAP_EXHAUSTED');
 if(req.kind!=='GOOGLE'&&totals(b.entries).evaluationPublicGET>=260)stop('SHARED_GET_CAP_EXHAUSTED');
 const entry={id,batch:inputs.batchId,conversation:'C',kind:req.kind,subjectId:req.subjectId??null,url:req.url,recordedAtCET:cet(),
  fullLive:0,realModelCalls:0,environmentReruns:0,evaluationPublicGET:req.kind==='GOOGLE'?0:1,restaurantWebsiteRequests:req.kind==='GOOGLE'?0:1,googleRequests:req.kind==='GOOGLE'?1:0,
  batchWebsiteGET:req.kind==='SEARCH'||req.kind==='DETAIL'?1:0,robotsExemptFromFourteen:req.kind==='ROBOTS'};
 b.entries.push(entry);b.cumulative=totals(b.entries);b.asOfCET=cet();assert.equal(hash(readFileSync(L)),before,'ledger changed concurrently');replace(L,b);return entry.id;
}
function robots(req){
 if(req.kind==='ROBOTS')return;
 if(!existsSync(R+'/robots-policy.json'))stop('ROBOTS_POLICY_NOT_FROZEN');
 const policy=load(R+'/robots-policy.json');assert.equal(hash(readFileSync(policy.bodyPath)),policy.sha256);assert.equal(hash(readFileSync(R+'/robots-policy.json')),hash(execFileSync('git',['show','HEAD:'+R+'/robots-policy.json'],{env:childEnv,maxBuffer:64*1024*1024})));
 if(req.kind!=='GOOGLE'&&!robotsDecision(readFileSync(policy.bodyPath,'utf8'),req.url).allowed)stop('ROBOTS_DISALLOWS_URL');
}
async function waitGap(){const gap=Math.max(MINIMUM_GAP_MS,state.minimumGapMs??0);const delay=state.lastFinishedEpoch+gap-Date.now();if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));}
function validate(req){
 if(state.status!=='ACTIVE')throw fail(state.stop??'BATCH_STOPPED');
 if(!/^[a-z0-9-]+$/.test(req.id)||!permittedURL(req.kind,req.url,googleURL))stop('URL_OR_ID_SCOPE_VIOLATION');
 if(state.results.some(r=>r.url===req.url&&r.failure))stop('FAILED_URL_RETRY_REFUSED');
 if(req.knownId){const expected=inputs.knownDetails.find(d=>d.id===req.knownId);if(!expected||req.url!==expected.url||req.subjectId!==expected.subjectId)stop('KNOWN_REQUEST_CHANGED');}
 robots(req);verify();
}
async function request(req,headers={},dispatcher,signal){
 validate(req);await waitGap();if(signal?.aborted)stop('ABORTED_BEFORE_REQUEST');verify();
 const prefix=R+'/requests/'+req.id;if(existsSync(prefix+'.started.json'))stop('REQUEST_ALREADY_STARTED');
 const ledgerId=charge(req);save(prefix+'.started.json',{...req,ledgerId,atCET:cet(),method:'GET',redirect:'manual',cookie:false,retries:0,manifestPath,manifestSha256:hash(readFileSync(manifestPath)),frozenCommit:git('rev-parse','HEAD')});
 const result=await timedGet(req.url,{fetchImplementation:nativeFetch,headers:{...headers,'Accept-Encoding':'identity','User-Agent':USER_AGENT},dispatcher,signal,onHeaders:header=>save(prefix+'.headers.json',header)});
 const meta={...result.meta,id:req.id,kind:req.kind,subjectId:req.subjectId??null,ledgerId};

 let failure=meta.networkFailure?meta.networkFailure.reason:null;
 if(!failure&&meta.status!==200)failure=meta.status>=300&&meta.status<400?'REDIRECT_NOT_FOLLOWED':'HTTP_'+meta.status;
 const text=result.bytes.toString('utf8');
 const rateLimited=meta.status===429||((meta.status??0)>=400&&!!meta.responseHeaders['retry-after'])||/too many requests|RATE_LIMIT_EXCEEDED|RESOURCE_EXHAUSTED/i.test(text.slice(0,12000));
 if(rateLimited)failure='RATE_LIMITED';
 if(!failure&&req.kind!=='GOOGLE'&&req.kind!=='ROBOTS'&&!/text\/html/i.test(meta.responseHeaders['content-type']??''))failure='SOURCE_CONTENT_TYPE_CHANGED';
 if(!failure&&req.kind==='ROBOTS'&&!/text\/plain|text\/txt/i.test(meta.responseHeaders['content-type']??''))failure='ROBOTS_CONTENT_TYPE_UNVERIFIED';
 if(!failure&&req.kind!=='GOOGLE'&&/verify you are human|unusual traffic|access denied|just a moment|ロボットではない/i.test(text.slice(0,20000)))failure='SOURCE_CHALLENGE';
 const suffix=req.kind==='GOOGLE'?'.body.json':req.kind==='ROBOTS'?'.body.txt':'.body.html';
 meta.bodyPath=prefix+(result.complete?suffix:'.partial.bin');meta.sha256=hash(result.bytes);meta.bodyComplete=result.complete;meta.failure=failure;
 writeFileSync(meta.bodyPath,safe(result.bytes),{flag:'wx'});save(prefix+'.result.json',meta);
 state.networkFailureStreak=meta.networkFailure?state.networkFailureStreak+1:0;state.lastFinishedEpoch=Date.now();state.results.push(meta);replace(statePath,state);
 console.log(JSON.stringify({id:req.id,subjectId:req.subjectId??null,status:meta.status,failure,headersAtCET:meta.headersAtCET,bodyCompletedAtCET:meta.bodyCompletedAtCET,elapsedMs:meta.elapsedMs,errorCodes:meta.networkFailure?.underlyingCodes??[],networkFailureStreak:state.networkFailureStreak}));
 if(rateLimited)stop('RATE_LIMITED');if(state.networkFailureStreak>=3)stop('THREE_CONSECUTIVE_NETWORK_FAILURES');
 return {meta,bytes:result.bytes};
}
let dispatcher;
try{
 verify();for(const req of manifest.requests)validate(req);
 mkdirSync(R+'/requests',{recursive:true});
 if(!existsSync(R+'/started.json'))save(R+'/started.json',{startedAtCET:cet(),frozenCommit:git('rev-parse','HEAD'),sourceCommit:inputs.productionCommit,mode:'DIRECTED_PUBLIC_GET_ACQUISITION_NOT_FULL_LIVE',robotsChargedToSharedBudget:true});
 if(manifest.stage==='GOOGLE'){
  console.log(key?.trim()?'已加载':'未加载');if(!key?.trim())stop('CREDENTIAL_NOT_LOADED');
  let proxy;try{const value=process.env.PRAXIS_GOOGLE_API_PROXY_SERVER;dispatcher=value?.trim()?new ProxyAgent(value):new Agent();proxy=value?.trim()?'CONFIGURED_GOOGLE_PROXY':'DIRECT_HOST';}catch{stop('GOOGLE_PROXY_CONFIGURATION_FAILED');}
  save(R+'/credential-authorization.json',{path:'/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env',scope:'THIS_DIRECTED_BATCH_GOOGLE_ONE_REQUEST_ONLY',status:'已加载',handling:'Node --env-file；未独立读取文件；未打印/复制/暂存文件或密钥',transport:proxy});
  const req=manifest.requests[0];assert.equal(manifest.requests.length,1);
  const captured=await request(req,{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'id,displayName'},dispatcher);
  if(captured.meta.failure)stop('GOOGLE_REQUEST_FAILED');
  // Product validation consumes the exact captured response in memory. Its
  // fixture transport issues no second Google request and cannot outlive the
  // independently bounded/fully recorded actual HTTP operation.
  const client=new GooglePlacesClient({apiKey:key,timeoutMs:DEADLINE_MS,fetchImplementation:async(url,init)=>{
   assert.equal(String(url),req.url);assert.equal(init.method,'GET');const h=new Headers(init.headers);assert(!h.has('Cookie'));assert.equal(h.get('X-Goog-FieldMask'),'id,displayName');
   return new Response(captured.bytes,{status:captured.meta.status,headers:{'Content-Type':captured.meta.responseHeaders['content-type']??'application/json'}});
  }});
  let name;try{name=await client.japaneseNamesForRun(new AbortController().signal)(inputs.googleRequest.expectedPlaceId);}catch(error){if(state.status==='STOPPED')throw error;stop(error?.code==='GOOGLE_MALFORMED_RESPONSE'?'GOOGLE_ID_OR_NAME_INVALID':'GOOGLE_INFRASTRUCTURE_FAILURE');}
  if(name.placeId!==inputs.googleRequest.expectedPlaceId||!name.text.trim())stop('GOOGLE_ID_OR_NAME_INVALID');
  save(R+'/google-name.json',{...name,rawBodyPath:R+'/requests/'+req.id+'.body.json',rawBodySha256:hash(readFileSync(R+'/requests/'+req.id+'.body.json')),validatedBy:'GooglePlacesClient.japaneseNamesForRun'});
 }else{
  dispatcher=new Agent();
  for(const req of manifest.requests){const result=await request(req,{},dispatcher);
   if(req.kind==='ROBOTS'){
    if(result.meta.failure)stop('ROBOTS_UNVERIFIED');
    const text=result.bytes.toString('utf8'),checks=inputs.knownDetails.map(d=>({url:d.url,...robotsDecision(text,d.url)}));
    const search=robotsDecision(text,'https://tabelog.com/en/tokyo/rstLst/?sw=prospective-source-name');if(!search.allowed||checks.some(c=>!c.allowed))stop('ROBOTS_DISALLOWS_PLANNED_PATHS');
    state.minimumGapMs=Math.max(search.minimumGapMs,...checks.map(c=>c.minimumGapMs));replace(statePath,state);
    save(R+'/robots-policy.json',{bodyPath:result.meta.bodyPath,sha256:result.meta.sha256,checkedAtCET:cet(),agent:USER_AGENT,search,knownDetails:checks});
   }
  }
 }
 console.log(JSON.stringify({event:'STAGE_COMPLETE',stage:manifest.stage,state:state.status,requestsSoFar:state.results.length}));
}catch(error){
 if(state.status!=='STOPPED'){state.status='STOPPED';state.stop=typeof error?.code==='string'&&/^[A-Z][A-Z0-9_]+$/.test(error.code)?error.code:'CONTROLLED_RUNNER_STOP';replace(statePath,state);}
 save(R+'/stop-'+manifest.stage.toLowerCase()+'.json',{status:'STOPPED',reason:state.stop,atCET:cet(),requests:state.results.length});console.log(JSON.stringify({event:'STOP',reason:state.stop}));process.exitCode=2;
}finally{if(dispatcher)await dispatcher.destroy();}
