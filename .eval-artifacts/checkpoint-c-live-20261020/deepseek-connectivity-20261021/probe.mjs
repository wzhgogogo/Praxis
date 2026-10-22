// Network-only diagnostic; no generation endpoint, retries, or production changes.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {channel} from 'node:diagnostics_channel';
import {performance} from 'node:perf_hooks';
import {setTimeout as wait} from 'node:timers/promises';
import {lookup} from 'node:dns/promises';
const file=fileURLToPath(import.meta.url), sha=b=>createHash('sha256').update(b).digest('hex');
const output=fileURLToPath(new URL('./result.json',import.meta.url));
const stamp=()=>new Date().toISOString();
const plan={mode:'NETWORK_ONLY_DIAGNOSTIC',method:'GET',url:'https://api.deepseek.com/models',samples:3,timeoutMs:30000,minGapMs:30000,generationModelCalls:0,fullLiveRuns:0,productionTimeoutUnchanged:true,stop:'After3 samples, or first HTTP access/rate/server failure; no retries',scriptSha256:sha(readFileSync(file))};
if(!process.env.DEEPSEEK_API_KEY)throw Error('DEEPSEEK_API_KEY_NOT_CONFIGURED');
const result={plan,startedAt:stamp(),runtime:process.version,rows:[]};
let active;
for(const name of ['undici:client:beforeConnect','undici:client:connected','undici:client:connectError'])channel(name).subscribe(message=>{
 if(!active)return;
 const event={event:name,elapsedMs:Math.round(performance.now()-active.start)};
 if(message.socket){event.remoteAddress=message.socket.remoteAddress;event.remoteFamily=message.socket.remoteFamily;event.alpnProtocol=message.socket.alpnProtocol;}
 if(message.error)event.errorCode=message.error.code??message.error.name;
 active.row.connectionEvents.push(event);
});
const ds=performance.now();
try{result.dns={addresses:await lookup('api.deepseek.com',{all:true}),elapsedMs:Math.round(performance.now()-ds)};}catch(e){result.dns={errorCode:e.code??e.name,elapsedMs:Math.round(performance.now()-ds)};}
for(let i=0;i<plan.samples;i++){
 if(i)await wait(plan.minGapMs);
 const row={sample:i+1,startedAt:stamp(),connectionEvents:[]},start=performance.now();active={row,start};
 try{
  const response=await fetch(plan.url,{method:'GET',headers:{Authorization:'Bearer '+process.env.DEEPSEEK_API_KEY,Accept:'application/json'},signal:AbortSignal.timeout(plan.timeoutMs)});
  row.headersMs=Math.round(performance.now()-start);row.status=response.status;row.httpDate=response.headers.get('date');
  const body=await response.arrayBuffer();row.bodyBytes=body.byteLength;row.bodySha256=sha(Buffer.from(body));
  row.elapsedMs=Math.round(performance.now()-start);row.outcome=response.ok?'REACHABLE':'HTTP_FAILURE';
 }catch(e){row.elapsedMs=Math.round(performance.now()-start);row.outcome='TRANSPORT_FAILURE';row.error={name:e.name,code:e.code??null,causeCode:e.cause?.code??null};}
 row.exceedsProduction10s=row.elapsedMs>10000;row.finishedAt=stamp();active=undefined;result.rows.push(row);
 writeFileSync(output,JSON.stringify({...result,status:'IN_PROGRESS'},null,2)+'\n');console.log(JSON.stringify(row));
 if(row.status&&row.status!==200){result.stop='HTTP_FAILURE_NO_RETRY';break;}
}
result.finishedAt=stamp();result.status='COMPLETED';result.generationModelCalls=0;result.fullLiveRuns=0;
writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,samples:result.rows.length,generationModelCalls:0,output}));
