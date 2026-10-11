import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseAllDocuments} from 'yaml';
import {runSourceStageNativeDiscoveryProbe} from '../../../../src/eval/restaurant/agent-loop/source-stage-probe.ts';
import {GooglePlacesRestaurantSearch} from '../../../../src/integrations/google/google-places-restaurant-search.ts';
import {GooglePlacesClient} from '../../../../src/integrations/google/google-places-client.ts';
import {tabelogDiscoveryPack,discoveryPackNetworkPolicy} from '../../../../src/integrations/restaurant-search/source-packs.ts';
import {LocalPlaywrightChromium} from '../../../../src/infrastructure/browser/local-playwright-chromium.ts';
import {DeepSeekModelGateway} from '../../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {ModelBrowserReadActionDecision} from '../../../../src/infrastructure/browser/browser-action-decision.ts';
import {createHybridDecisionCapture} from '../../../../src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts';
import {BrowserReadRecording} from '../../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.ts';
import {traceBrowserRuntime} from '../../../../src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.ts';
const dir=resolve('.eval-artifacts/p1-f-prep-20261011/followup/discovery/run');await mkdir(dir,{recursive:true});
const env={...process.env,PRAXIS_LOCAL_CHROMIUM_INTERACTIVE:'0'};delete env.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER;delete env.PRAXIS_GOOGLE_API_PROXY_SERVER;
const variants=parseAllDocuments(await readFile('.eval-artifacts/known-feasible-baseline-20261008/variants.yaml','utf8')).map(d=>d.toJSON());
const historical=JSON.parse(await readFile('.eval-artifacts/p1-f-prep-20261011/radius/historical-radius.json','utf8'));
const manifest={mode:'LIVE_READ_ONLY_DISCOVERY',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),maxModelsPerProbe:6,maxElapsedMsPerProbe:90000,radiusMeters:1000,source:'tabelog',probeBudgetBefore:10,probeBudgetAfter:11,inputDeviation:'variants h001/h002 have no coordinate fields and use named-near prose; use these variants previously bound recorded circle centers, with standalone nearby discovery wording. Original variants unchanged.',modelsContain:'public page observation, public evaluation coordinates and address facts, source skill, omakase/restaurant retrieval only; no original private task messages or personal information'};await writeFile(resolve(dir,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
const rows=[];const policy=discoveryPackNetworkPolicy([tabelogDiscoveryPack]);
for(const caseId of ['kf-h002-20261024']){
 const start=Date.now(),signal=AbortSignal.timeout(90000),budget={totalModelCalls:0,maxModelCalls:6},diagnostics=[],snapshots=[];
 const old=historical.displayedCandidates.find(c=>c.caseId===caseId),variant=variants.find(c=>c.id===caseId);
 const location={latitude:old.center.latitude,longitude:old.center.longitude,radiusMeters:1000,label:'explicit evaluation location',areaMatchBasis:'EVALUATION_LOCATION_RADIUS'};
 const criteria=variant.semantic.criteria.map(c=>({text:c.value,polarity:c.polarity,strength:c.strength}));
 const intent={timezone:'Asia/Tokyo',target:{goal:'RECOMMENDATION',query:'restaurants nearby'},area:{query:'nearby',radiusMeters:1000},criteria};
 const resultPath=resolve(dir,caseId+'.result.json'),recording=new BrowserReadRecording({directory:resolve(dir,'recordings'),runId:caseId,reviewedStaticResources:policy.staticResources,reviewedReads:policy.dynamicReads}),capture=createHybridDecisionCapture(resultPath,recording);
 const base=LocalPlaywrightChromium.fromEnvironment(env);let stop;
 const runtime=traceBrowserRuntime({readNetworkBoundaryCapability:base.readNetworkBoundaryCapability,openSession:async input=>{
  const session=await base.openSession({...input,recordResponse:response=>recording.recordResponse(response)}),snapshot=session.snapshot.bind(session);session.snapshot=async()=>{
   const current=await snapshot();snapshots.push(current);
   if(/\/(?:booking|reserve|payment|checkout|confirm)(?:[/?]|$)/i.test(new URL(current.url).pathname)){stop='STOP_CONDITION:NEXT_STEP';throw Error(stop);}
   if(current.networkRequests?.some(r=>r.outcome==='ADMITTED'&&!['GET','HEAD'].includes(r.method))){stop='STOP_CONDITION:UNEXPECTED_GUARD_ADMISSION';throw Error(stop);}return current;
  };return session;
 }},'TABELOG',(kind,detail)=>recording.record(kind,detail),capture.snapshotSink);
 const provider=DeepSeekModelGateway.fromEnvironment(env);let calls=0;const model={complete:request=>{if(calls>=6)throw Error('MODEL_LIMIT');calls++;const bounded={...request,timeoutMs:Math.min(request.timeoutMs,Math.max(1,90000-(Date.now()-start)))};return capture.complete(bounded,()=>provider.complete(bounded));}};
 const locality=new GooglePlacesRestaurantSearch(GooglePlacesClient.fromEnvironment(env),()=>new Date().toISOString(),10,{maxRequests:40});let row;
 try{
  const result=await runSourceStageNativeDiscoveryProbe({pack:tabelogDiscoveryPack,runtime,locality,intent,locationContext:location,readRunId:caseId,modelDecision:new ModelBrowserReadActionDecision(model),browserBudget:budget,timeoutMs:90000,signal,now:()=>new Date().toISOString(),onDiagnostic:d=>{diagnostics.push(d);recording.record('EXECUTOR_DIAGNOSTIC',d);}});
  row={...result,caseId,input:{intent,location},elapsedMs:Date.now()-start,modelCalls:calls,googleRequests:locality.googleRequestUsage(caseId),center:location,centerProvenance:{path:old.resultPath,sha256:createHash('sha256').update(await readFile(old.resultPath)).digest('hex')},firstTen:{historicalFixedDenominator:10,accepted:result.read.candidates.length,actualParsedResults:result.read.metadata.nativeDiscoveryFunnel?.parsedOutlets,actualDetailsRead:result.read.metadata.nativeDiscoveryFunnel?.inspectedOutlets},region:result.reads.map(r=>r.metadata.nativeDiscoveryFunnel?.directoryRegion),acceptance:'PENDING_INDEPENDENT_REVIEW'};
 }catch(e){row={caseId,status:'FAILED',failureCode:e.code??String(e),elapsedMs:Date.now()-start,modelCalls:calls,googleRequests:locality.googleRequestUsage(caseId),acceptance:'PENDING_INDEPENDENT_REVIEW',center:location,stop};}
 row.decisionCapture=await capture.finish();row.recording=await recording.finish();await writeFile(resultPath,JSON.stringify(row,null,2),{flag:'wx'});await writeFile(resolve(dir,caseId+'.diagnostics.json'),JSON.stringify(diagnostics,null,2),{flag:'wx'});await writeFile(resolve(dir,caseId+'.snapshots.json'),JSON.stringify(snapshots,null,2),{flag:'wx'});rows.push(row);await writeFile(resolve(dir,'summary.json'),JSON.stringify(rows.map(r=>({caseId:r.caseId,status:r.status,failureCode:r.failureCode,elapsedMs:r.elapsedMs,modelCalls:r.modelCalls,googleRequests:r.googleRequests,acceptance:r.acceptance,firstTen:r.firstTen,region:r.region})),null,2));console.log(JSON.stringify({caseId,status:row.status,acceptance:row.acceptance,modelCalls:calls,elapsedMs:row.elapsedMs,googleRequests:row.googleRequests}));if(stop)throw Error(stop);
}
