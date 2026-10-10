import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LocalPlaywrightChromium } from '../../../src/infrastructure/browser/local-playwright-chromium.ts';
import { BrowserTaskExecutor } from '../../../src/infrastructure/browser/browser-task-executor.ts';
import { restaurantPublicReadNetworkPolicy as policy } from '../../../src/integrations/restaurant-availability/public-browser-read-network-policy.ts';
import { tableCheckDiscoveryPack, tabelogDiscoveryPack } from '../../../src/integrations/restaurant-search/source-packs.ts';
import { sourceListingCompletion } from '../../../src/integrations/restaurant-search/native-restaurant-search.ts';
import { inspectProbePage } from '../../../src/eval/restaurant/agent-loop/browser-read-probe.ts';
import { BrowserReadRecording } from '../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.ts';
const directory=resolve('.eval-artifacts/p1-d-batch-20261010/C3b-completion');
const round=process.env.PROBE_ROUND??'round1';const output=resolve(directory,round);await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile(resolve(directory,process.env.PROBE_MANIFEST??'probe-urls.json'),'utf8'));
import { tabelogNameSearchCompletion, tabelogAvailabilityCompletion } from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import { tableCheckNameSearchCompletion } from '../../../src/integrations/tablecheck/tablecheck-browser-availability.ts';
import { parseTabelogSearchOutlets } from '../../../src/integrations/tabelog/tabelog-page-parser.ts';
import { parseTableCheckDiscoveryOutletUrls } from '../../../src/integrations/tablecheck/tablecheck-page-parser.ts';
const results=[];
for (const [index,item] of manifest.entries()) {
 const recorder=new BrowserReadRecording({directory:resolve(output,'recordings'),runId:`probe-${index+1}`,reviewedStaticResources:policy.staticResources,reviewedReads:policy.dynamicReads});
 const css=[];const diagnostics=[];let modelCalls=0;let finalCompletion;let finalSnapshot;
 const base=new LocalPlaywrightChromium();
 const runtime={readNetworkBoundaryCapability:base.readNetworkBoundaryCapability,openSession:(input)=>base.openSession({...input,recordResponse:async response=>{
   await recorder.recordResponse(response);
   if(response.method==='GET'&&response.status===200&&response.contentType.split(';')[0]==='text/css')css.push({...response,body:Buffer.from(response.body).toString('base64')});
 }})};
 const executor=new BrowserTaskExecutor(runtime,{maxElapsedMsPerCandidate:60000,maxElapsedMsPerProvider:60000,onDiagnostic:d=>diagnostics.push(d)});
 const signal=new AbortController().signal;
 let row={...item,modelCalls:0};
 try {
  const source=item.kind.startsWith('tabelog')?'TABELOG':'TABLECHECK';
  const session=await executor.acquire(signal,source,'DISCOVERY',policy);
  await executor.navigate({session,signal,source,stage:'DISCOVERY',url:item.url,allowedOrigins:policy.documentOrigins,timeoutMs:35000});
  const pack=source==='TABELOG'?tabelogDiscoveryPack:tableCheckDiscoveryPack;
  const expression=new URL(item.url).searchParams.get('search_text')??'';
  const listing=item.kind.endsWith('search')||item.kind.endsWith('list');
  const read=await executor.runSkill({taskId:`probe-${index}`,session,signal,source,stage:'DISCOVERY',allowedOrigins:policy.documentOrigins,goal:{outlet:{name:'Public page observation'},hardCriteria:[],...(expression?{retrievalExpression:expression}:{})},objective:'Read the current public page without any action',completion:(snapshot,controls)=>{
   finalSnapshot=snapshot;
   if (/name-search/.test(item.kind)) return finalCompletion=source==='TABELOG'?tabelogNameSearchCompletion(snapshot):tableCheckNameSearchCompletion(snapshot,item.outletName);
   if (/witness-availability/.test(item.kind)) return finalCompletion=tabelogAvailabilityCompletion(snapshot,item);
   if(listing)return finalCompletion=sourceListingCompletion(pack,snapshot,controls,expression);
   const observation=inspectProbePage({url:item.url},snapshot);
   const identified=Object.values(observation.identityFieldsDetected??{}).some(Boolean);
   return finalCompletion={complete:observation.pageState==='CONTENT_OBSERVED'&&identified,resultBusy:false,reason:'Observe source-authored outlet identity',resultKey:JSON.stringify([snapshot.url,observation.identityFieldsDetected,observation.slotsDetected])};
  }});
  recorder.recordSnapshot(read.snapshot);
  if (/\/booking\/form_course|\/confirm(?:ation)?(?:[/?]|$)|\/payment(?:[/?]|$)/i.test(read.snapshot.url)) throw Error('STOP_CONDITION: booking/payment next step');
  await writeFile(resolve(output,`probe-${index+1}.snapshot.json`),JSON.stringify(read.snapshot,null,2),{flag:'wx'});
  const waits=diagnostics.filter(d=>d.event==='ASYNC_WAIT');
  row={...row,status:read.status,settlement:read.snapshot.settlement,waitMs:waits.reduce((n,d)=>n+(d.waitMs??0),0)+(diagnostics.some(d=>d.detail==='BOUND_RESULT_STABLE')?500:0),timeoutReasons:waits.filter(d=>d.detail==='PAGE_STILL_LOADING_WITHIN_BOUND').map(d=>d.settlement),resultKey:finalCompletion?.resultKey??null,resultBusy:finalCompletion?.resultBusy??null,completion:finalCompletion?.complete??false,resultVisible:/name-search/.test(item.kind)?(source==='TABELOG'?parseTabelogSearchOutlets(read.snapshot).some(x=>read.snapshot.text.includes(x.outletName)):parseTableCheckDiscoveryOutletUrls(read.snapshot,item.outletName).some(url=>read.controls?.some(control=>control.visible&&control.href?.startsWith(url)))):listing?pack.parseListing(read.snapshot).outlets.some(x=>read.snapshot.text.includes(x.outletName)):null,parsedResults:/name-search/.test(item.kind)?(source==='TABELOG'?parseTabelogSearchOutlets(read.snapshot).length:parseTableCheckDiscoveryOutletUrls(read.snapshot,item.outletName).length):listing?pack.parseListing(read.snapshot).outlets.length:null,finalUrl:read.snapshot.url,cssReceived:css.length,modelCalls};
 }catch(error){row={...row,status:'FAILED',error:String(error),modelCalls,timeoutReasons:diagnostics.filter(d=>d.event==='ASYNC_WAIT').map(d=>d.settlement)};}
 finally{await executor.close();}
 row.recording=await recorder.finish();
 await writeFile(resolve(output,`probe-${index+1}.css-responses.json`),JSON.stringify(css,null,2),{flag:'wx'});
 results.push(row);await writeFile(resolve(output,'probe-results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({...row,timeoutReasons:row.timeoutReasons?.length,resultKey:undefined,recording:undefined}));
 if (row.error?.includes('STOP_CONDITION')) throw Error(row.error);
}
const sorted=results.map(r=>r.waitMs).filter(Number.isFinite).sort((a,b)=>a-b);
console.log(JSON.stringify({medianWaitMs:(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.ceil((sorted.length-1)/2)])/2,completed:results.filter(r=>r.status==='COMPLETED').length,modelCalls:results.reduce((n,r)=>n+r.modelCalls,0)}));
