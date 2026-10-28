import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
const root='.eval-artifacts/phase3b/g4-priority-backfill',ledgerPath='.eval-artifacts/phase3b/budget.json';
const load=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const counts=entries=>Object.fromEntries(['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'].map(k=>[k,entries.reduce((n,e)=>n+(e[k]??(k==='evaluationPublicGET'?e.publicGET:0)??0),0)]));
const verify=()=>{for(const f of load(root+'/fetch-freeze.json').files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);};
const queue=load(root+'/queue.json');
function preflight(){
 assert.equal(queue.rows.length,24);assert.equal(new Set(queue.rows.map(r=>r.url)).size,24);assert(queue.rows.length<=25);
 assert.deepEqual(queue.rows.map(r=>r.group),[...Array(16).fill('PRIOR_CORRECT_REQUIRED'),...Array(3).fill('CERTIFIED_DETAIL'),...Array(5).fill('ADDITIONAL_FIVE_APPROVED')]);
 for(const r of queue.rows){const u=new URL(r.url);assert.equal(u.origin,'https://tabelog.com');assert.match(u.pathname,/^\/en\/tokyo\/A\d+\/A\d+\/\d+\/$/);assert(!u.search&&!u.hash);}
 const l=load(ledgerPath);assert.deepEqual(l.cumulative,counts(l.entries));assert.equal(l.limits.evaluationPublicGET,257);verify();
}
function charge(row){
 const l=load(ledgerPath),prior=l.entries.filter(e=>e.id.startsWith('phase3b-c-g4-backfill-get-'));
 assert(prior.length<25&&counts(l.entries).evaluationPublicGET<257,'GET budget exhausted');assert(!prior.some(e=>e.url===row.url),'No retry or duplicate URL');
 const id=`phase3b-c-g4-backfill-get-${String(prior.length+1).padStart(3,'0')}`;
 l.entries.push({id,conversation:'C',batch:'G4_PRIORITY_BACKFILL',kind:'GET',url:row.url,caseKey:row.caseKey,group:row.group,startedAtCET:cet(),fullLive:0,realModelCalls:0,evaluationPublicGET:1,restaurantWebsiteRequests:1,googleRequests:0,environmentReruns:0});l.cumulative=counts(l.entries);l.asOfCET=cet();writeFileSync(ledgerPath+'.backfill-tmp',JSON.stringify(l,null,2)+'\n');renameSync(ledgerPath+'.backfill-tmp',ledgerPath);return id;
}
preflight();
if(process.argv.includes('--preflight')){console.log('PASS24 unique authorized detail URLs, priority order, budget counters and frozen configuration;0 calls');process.exit(0);}
assert(process.argv.includes('--execute'));assert(!existsSync(root+'/fetch-started.json'));assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
save(root+'/fetch-started.json',{sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAtCET:cet(),planned:24,GETLimit:25,freezeSha256:sha(readFileSync(root+'/fetch-freeze.json')),credentialHandling:'NO_ENV_FILE_NO_MODEL_MODULES'});
let lastFinished=0,networkStreak=0,stop=null;const completed=[];
for(const row of queue.rows){
 const wait=lastFinished+30000-Date.now();if(wait>0)await new Promise(r=>setTimeout(r,wait));verify();
 const id=charge(row),prefix=root+'/responses/'+id,start=Date.now();let meta={ledgerId:id,url:row.url,kind:'DETAIL',caseKey:row.caseKey,group:row.group,backfill:true,method:'GET',cookie:false,redirect:'manual',retries:0,startedAtCET:cet()};save(prefix+'.started.json',meta);
 try{
  const response=await fetch(row.url,{redirect:'manual',credentials:'omit',headers:{'Accept-Encoding':'identity'},signal:AbortSignal.timeout(20000)});
  const bytes=Buffer.from(await response.arrayBuffer());writeFileSync(prefix+'.html',bytes,{flag:'wx'});networkStreak=0;
  Object.assign(meta,{httpStatus:response.status,contentType:response.headers.get('content-type'),contentEncoding:response.headers.get('content-encoding'),lastModified:response.headers.get('last-modified'),location:response.headers.get('location'),bodyPath:prefix+'.html',sha256:sha(bytes),bytes:bytes.length});
  if(response.status!==200)meta.failure={code:'SOURCE_HTTP_OR_REDIRECT'};else if(!/text\/html/i.test(meta.contentType??''))meta.failure={code:'SOURCE_STRUCTURE_CHANGED'};
 }catch(e){const code=typeof e.code==='string'?e.code:e.name==='TimeoutError'?'SOURCE_TIMEOUT':'SOURCE_NETWORK_FAILED';meta.failure={code,type:e.name??'UNKNOWN'};networkStreak++;if(networkStreak>=3)stop='THREE_CONSECUTIVE_NETWORK_FAILURES';}
 finally{lastFinished=Date.now();meta.finishedAtCET=cet();meta.elapsedMs=lastFinished-start;meta.networkStreak=networkStreak;save(prefix+'.json',meta);completed.push(meta);console.log(JSON.stringify({id,caseKey:row.caseKey,group:row.group,status:meta.httpStatus,failure:meta.failure,networkStreak}));}
 if(stop)break;
}
save(root+'/fetch-summary.json',{sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),finishedAtCET:cet(),planned:24,attempted:completed.length,succeeded:completed.filter(r=>!r.failure).length,failed:completed.filter(r=>r.failure).length,stop,ledgerIds:completed.map(r=>r.ledgerId),realModel:0,google:0,live:0,credentialHandling:'NO_ENV_FILE_NO_MODEL_MODULES'});
