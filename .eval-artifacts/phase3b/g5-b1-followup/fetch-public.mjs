import https from 'node:https';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync,inflateSync,brotliDecompressSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const root='.eval-artifacts/phase3b/g5-b1-followup',kind=process.argv[2];
if(!['robots','help'].includes(kind))throw Error('Choose robots or help');
const urls={robots:'https://tabelog.com/robots.txt',help:'https://tabelog.com/en/help'};
const sha=b=>createHash('sha256').update(b).digest('hex');
const cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
if(kind==='help'){
 const decision=JSON.parse(readFileSync(root+'/robots-decision.json','utf8'));
 if(decision.allowed!==true||decision.url!==urls.help)throw Error('No affirmative frozen robots decision');
 const prior=JSON.parse(readFileSync(root+'/robots.meta.json','utf8'));
 if(prior.status!==200||Date.now()-Date.parse(prior.completedAtCET)<30000)throw Error('Robots failure or pacing');
}
const id='phase3b-C-g5-b1-fee-'+kind+'-20261029';
const start={id,url:urls[kind],requestedAtCET:cet(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'PUBLIC_GET_NO_COOKIE_NO_PROXY_NO_REDIRECT_NO_RETRY'};
writeFileSync(root+'/'+kind+'.started.json',JSON.stringify(start,null,2)+'\n',{flag:'wx'});
const ledgerPath='.eval-artifacts/phase3b/budget.json';const ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
if(ledger.entries.some(x=>x.id===id)||ledger.cumulative.evaluationPublicGET>=257)throw Error('Duplicate or exhausted ledger');
ledger.entries.push({id,conversation:'C',recordedAtCET:start.requestedAtCET,mode:start.mode,evaluationPublicGET:1,restaurantWebsiteRequests:1,fullLive:0,realModelCalls:0,googleRequests:0,environmentReruns:0,url:start.url,evidence:root+'/'+kind+'.meta.json'});
ledger.cumulative.evaluationPublicGET++;ledger.cumulative.restaurantWebsiteRequests++;ledger.asOfCET=start.requestedAtCET;
writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
let result;
try{
 result=await new Promise((resolve,reject)=>{
 const request=https.get(start.url,{headers:{'User-Agent':'Praxis-B1-evidence/1.0','Accept':'text/plain,text/html;q=0.9'},timeout:20000},response=>{
  const chunks=[];response.on('data',b=>chunks.push(b));response.on('error',reject);
  response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,rawHeaders:response.rawHeaders,body:Buffer.concat(chunks)}));
 });request.on('timeout',()=>request.destroy(new Error('TIMEOUT_20S')));request.on('error',reject);
 });
 writeFileSync(root+'/'+kind+'.raw',result.body,{flag:'wx'});
 let decoded=result.body;const encoding=result.headers['content-encoding'];
 if(encoding==='gzip')decoded=gunzipSync(decoded);else if(encoding==='deflate')decoded=inflateSync(decoded);else if(encoding==='br')decoded=brotliDecompressSync(decoded);else if(encoding&&encoding!=='identity')throw Error('UNSUPPORTED_CONTENT_ENCODING');
 writeFileSync(root+'/'+kind+'.decoded.txt',decoded,{flag:'wx'});
 const meta={...start,completedAtCET:cet(),status:result.status,headers:result.headers,rawHeaders:result.rawHeaders,rawSHA256:sha(result.body),rawBytes:result.body.length,decodedSHA256:sha(decoded),decodedBytes:decoded.length,redirectFollowed:false,cookieSent:false};
 writeFileSync(root+'/'+kind+'.meta.json',JSON.stringify(meta,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({kind,status:result.status,bytes:decoded.length,sha256:sha(decoded),location:result.headers.location??null}));
}catch(error){writeFileSync(root+'/'+kind+'.meta.json',JSON.stringify({...start,completedAtCET:cet(),status:null,error:String(error)},null,2)+'\n',{flag:'wx'});throw error;}
