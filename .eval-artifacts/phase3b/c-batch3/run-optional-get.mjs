import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
const root='.eval-artifacts/phase3b/c-batch3',ledgerPath='.eval-artifacts/phase3b/budget.json';
const load=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
const save=(p,d)=>writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
const verify=()=>{for(const f of load(`${root}/optional-freeze.json`).files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);};
assert(process.argv.includes('--execute'));
assert(!existsSync(`${root}/optional/started.json`),'Prior attempt exists: never retry this runner');
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');verify();
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),input=load(`${root}/optional-queries.json`);
assert.equal(input.maximumRequests,12);assert.equal(input.intervalMs,30000);assert(input.queries.length<=12);
mkdirSync(`${root}/optional`,{recursive:true});save(`${root}/optional/started.json`,{sourceCommit,startedAtCET:cet(),mode:'EVALUATION_PUBLIC_GET_NO_LIVE',credentials:'未加载',fileHandling:'未独立读取文件',freezeSha256:sha(readFileSync(`${root}/optional-freeze.json`))});
const keys=['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'];
const total=(entries,key)=>entries.reduce((n,e)=>n+(e[key]??(key==='evaluationPublicGET'?e.publicGET:0)??0),0);
const rows=[];let lastFinished=0,stop;
for(const query of input.queries){
  if(lastFinished){const ms=lastFinished+input.intervalMs-Date.now();if(ms>0)await new Promise(r=>setTimeout(r,ms));}
  verify();
  const ledger=load(ledgerPath),prefix='phase3b-c-batch3-call-get-';
  const number=ledger.entries.filter(e=>e.id.startsWith(prefix)).length+1;
  if(number>12||total(ledger.entries,'evaluationPublicGET')>=40){stop={code:'BUDGET_EXHAUSTED'};break;}
  const url=new URL('https://tabelog.com/en/tokyo/rstLst/');url.searchParams.set('sw',query.query);
  const id=prefix+String(number).padStart(3,'0');assert(!ledger.entries.some(e=>e.id===id));
  const entry={id,conversation:'C',batch:3,kind:'GET',purpose:'OPTIONAL_HISTORICAL_ALTERNATIVE',subjectId:query.subjectId,variant:query.variant,sourceCommit,startedAtCET:cet(),...Object.fromEntries(keys.map(k=>[k,k==='evaluationPublicGET'||k==='restaurantWebsiteRequests'?1:0]))};
  ledger.entries.push(entry);ledger.cumulative=Object.fromEntries(keys.map(k=>[k,total(ledger.entries,k)]));ledger.asOfCET=cet();
  const temp=ledgerPath+'.c-batch3-tmp';writeFileSync(temp,JSON.stringify(ledger,null,2)+'\n');renameSync(temp,ledgerPath);
  const path=`${root}/optional/${String(number).padStart(3,'0')}-${query.subjectId}`,began=Date.now();
  save(path+'.started.json',{url:url.toString(),method:'GET',cookie:false,redirect:'manual',retries:0,atCET:cet(),ledgerId:id});
  let row={...query,ledgerId:id};
  try{
    const response=await fetch(url,{method:'GET',redirect:'manual',credentials:'omit',headers:{'Accept-Encoding':'identity'},signal:AbortSignal.timeout(input.timeoutMs)});
    const bytes=Buffer.from(await response.arrayBuffer());writeFileSync(path+'.body.html',bytes,{flag:'wx'});
    Object.assign(row,{status:'FETCHED',httpStatus:response.status,contentType:response.headers.get('content-type'),contentEncoding:response.headers.get('content-encoding'),location:response.headers.get('location'),bodyPath:path+'.body.html',sha256:sha(bytes),responseBody:'Unmodified bytes returned by fetch (runtime may decode content/transfer encoding)'});
    const visible=bytes.toString('utf8').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
    if(response.status!==200)throw Object.assign(Error(),{code:'SOURCE_HTTP_OR_REDIRECT_STOP'});
    if(/現在アクセスが集中|verify you are human|unusual traffic|access denied|just a moment|ロボットではない/i.test(visible))throw Object.assign(Error(),{code:'SOURCE_BUSY_OR_CHALLENGE'});
    if(!/text\/html/i.test(row.contentType??'')||!bytes.toString('utf8').includes('ItemList'))throw Object.assign(Error(),{code:'SOURCE_STRUCTURE_CHANGED'});
  }catch(error){stop={code:error.code??(error.name==='TimeoutError'?'SOURCE_TIMEOUT':'SOURCE_NETWORK_FAILED'),type:error.name??'UNKNOWN'};row.failure=stop;row.status??='NOT_FETCHED';}
  finally{lastFinished=Date.now();row.elapsedMs=lastFinished-began;row.finishedAtCET=cet();save(path+'.result.json',row);rows.push(row);console.log(JSON.stringify({id:query.subjectId,number,httpStatus:row.httpStatus,elapsedMs:row.elapsedMs,failure:row.failure}));}
  if(stop)break;
}
save(`${root}/optional/execution.json`,{sourceCommit,status:stop?'STOPPED':'COMPLETED',planned:input.queries.length,sourceRequests:rows.length,results:rows,stop,finishedAtCET:cet()});
console.log(JSON.stringify({status:stop?'STOPPED':'COMPLETED',requests:rows.length,stop}));
