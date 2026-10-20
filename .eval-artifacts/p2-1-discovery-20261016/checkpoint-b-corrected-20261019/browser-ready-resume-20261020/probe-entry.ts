// Frozen eval outer entry, mechanically derived from the unchanged original Runner.
import {runOuterNetworkPreflight as runDiscoveryProbePreflight} from "./outer-preflight.mjs";
import {installOuterBrowserObservation} from "./observe-browser.mjs";
import { planDiscoverySources } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/domains/restaurant/discovery-planner.js";
import { runSourceDataPreflight,SourceDataPreflightError } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/source-data-preflight.js";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/application/live-read-investigation-budget.js";
import { DeepSeekModelGateway } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/infrastructure/deepseek/deepseek-model-gateway.js";
import { browserRuntimeFromEnvironment } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/infrastructure/browser/browser-runtime-factory.js";
import { GooglePlacesClient } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/integrations/google/google-places-client.js";
import { restaurantDiscoveryPacks } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/integrations/restaurant-search/source-packs.js";
import { runDiscoveryProbe, type DiscoveryProbeInput, type DiscoveryProbeWitness } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/discovery-probe.js";
import { parseReviewedReads, auditReadOnlyTrace } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/diagnostic-evaluator-network.js";
import type { TraceRecord } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/diagnostic-evaluator-record.js";
import { environmentWithEffectiveLiveNetwork, resolveEffectiveLiveNetworkConfiguration } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/live-preflight.js";
import { BrowserReadRecording } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/runners/browser-read-recording.js";
import { safeRecord, traceBrowserRuntime } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js";
import { createHybridDecisionCapture } from "file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.js";

const {values}=parseArgs({options:{input:{type:"string"},witnesses:{type:"string"},output:{type:"string"},"input-sha256":{type:"string"},"reviewed-reads":{type:"string"},execute:{type:"boolean",default:false},"no-proxy":{type:"boolean",default:false}}});
if(!values.input||!values.output||!values["reviewed-reads"])throw Error("--input --output --reviewed-reads required");
const directory=resolve(values.output),inside=relative(resolve('.eval-artifacts'),directory);
if(!inside||inside.startsWith('..'))throw Error("Output must stay under .eval-artifacts");
const bytes=await readFile(resolve(values.input)),input=JSON.parse(bytes.toString()) as DiscoveryProbeInput;
const sha256=createHash('sha256').update(bytes).digest('hex');
if(values["input-sha256"]&&values["input-sha256"]!==sha256)throw Error("FROZEN_SEMANTIC_SHA_MISMATCH");
if(!input.caseId||!['TARGET','CONTROL'].includes(input.role)||!input.intent?.area?.query||!Array.isArray(input.intent.criteria)
 ||!input.intent.timezone||!Number.isFinite(Date.parse(input.referenceTime))||!Number.isFinite(input.locationContext?.latitude)||!Number.isFinite(input.locationContext?.longitude)||!(input.locationContext.radiusMeters>0))throw Error("INVALID_FROZEN_DISCOVERY_INPUT");
const reviewedBytes=await readFile(resolve(values["reviewed-reads"])),reviewed=parseReviewedReads(reviewedBytes,values["reviewed-reads"]);
const config={...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:15,maxGoogleRequests:40,maxAutomaticBrowserMs:180_000};
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!values.execute){console.log(JSON.stringify({mode:'DISCOVERY_PROBE_PLAN_ONLY',inputSha256:sha256,head,caseId:input.caseId,config,network:0,models:0,formalLiveRuns:0},null,2));process.exit(0);}
for(const gate of ['PRAXIS_ALLOW_LIVE_RESTAURANT_READ','PRAXIS_ALLOW_BROWSER_RUN','PRAXIS_ALLOW_LIVE_MODEL_EVAL'])if(process.env[gate]!=='1')throw Error(`${gate}=1 required`);
if(!values.witnesses||!values["input-sha256"])throw Error("Execute requires frozen input SHA and certified witnesses");
execFileSync('git',['diff','--exit-code','HEAD','--','src','scripts','package.json','package-lock.json'],{stdio:'pipe'});
const witnessBytes=await readFile(resolve(values.witnesses)),registry=JSON.parse(witnessBytes.toString());
const entry=registry.variants?.find((e:{caseId:string})=>e.caseId===input.caseId);
if(!entry||Date.parse(entry.validUntil)<=Date.now()||Date.now()-Date.parse(entry.certifiedAt)>86400000||!entry.witnesses?.length)throw Error("VALID_CERTIFIED_WITNESSES_REQUIRED");
const witnesses=entry.witnesses as DiscoveryProbeWitness[];
await mkdir(directory,{recursive:false});
const network=resolveEffectiveLiveNetworkConfiguration(process.env),env=environmentWithEffectiveLiveNetwork(process.env,network);
const startedAt=new Date().toISOString();
await writeFile(resolve(directory,'started.json'),JSON.stringify({mode:'DISCOVERY_PROBE',head,startedAt,inputPath:values.input,inputSha256:sha256,witnessesSha256:createHash('sha256').update(witnessBytes).digest('hex'),reviewedReadsSha256:reviewed.sha256,config},null,2),{flag:'wx'});
installOuterBrowserObservation(directory);
try {
 await runDiscoveryProbePreflight({environment:env,network,artifactDirectory:directory});
 await runSourceDataPreflight({sourceIds:planDiscoverySources(input.intent,input.locationContext,restaurantDiscoveryPacks.map(p=>p.meta),input.referenceTime).entries.map(e=>e.sourceId),environment:env,artifactDirectory:directory});
} catch(error) {
 await writeFile(resolve(directory,'preflight-failure.json'),JSON.stringify({classification:'ENV_FAILURE',sourceIds:error instanceof SourceDataPreflightError?error.sourceIds:[],failureCode:error instanceof SourceDataPreflightError?error.code:'NETWORK_PREFLIGHT_FAILED',modelCalls:0,formalProbeStarted:false},null,2),{flag:'wx'});
 throw error;
}
const recording=new BrowserReadRecording({directory:resolve(directory,'recording'),runId:input.caseId,
 reviewedStaticResources:restaurantDiscoveryPacks.flatMap(p=>p.staticResources),reviewedReads:restaurantDiscoveryPacks.flatMap(p=>p.reviewedReads)});
const capture=createHybridDecisionCapture(resolve(directory,'probe.result.json'),recording);
const trace:Array<{sequence:number;at:string;kind:string;detail:unknown}>=[];
const safety=new AbortController();let stop:unknown=null;
const auditModule=new URL("file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/post-body-audit.mjs").href;
const {installReviewedPostObserver,postBodyStop}=await import(auditModule);
function record(kind:string,detail:unknown){
 const row={sequence:trace.length+1,at:new Date().toISOString(),kind,detail:safeRecord(detail)};trace.push(row);
 const failure=postBodyStop({kind,detail},reviewedBytes);
 if(failure&&!stop){stop=failure;safety.abort();}
 return row.sequence;
}
const {PlaywrightReadNetworkGuard}=await import('file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/infrastructure/browser/playwright-read-network-guard.js');
const restore=installReviewedPostObserver(PlaywrightReadNetworkGuard,reviewedBytes,(row:{kind:string;detail:unknown})=>record(row.kind,row.detail));
const provider=DeepSeekModelGateway.fromEnvironment(env);
try{
 const model={complete:(request:Parameters<typeof provider.complete>[0])=>capture.complete(request,()=>provider.complete(request))};
 const browser=traceBrowserRuntime(browserRuntimeFromEnvironment(env),'TABLECHECK',record,capture.snapshotSink);
 const summary=await runDiscoveryProbe(input,witnesses,config,{model,browser,google:new GooglePlacesClient({apiKey:env.GOOGLE_MAPS_API_KEY??'',proxyServer:env.PRAXIS_GOOGLE_API_PROXY_SERVER,timeoutMs:30_000}),clock:{now:()=>new Date(input.referenceTime)},onBrowserDiagnostic:d=>record('EXECUTOR_DIAGNOSTIC',d)},record,safety.signal);
 const decisionCapture=await capture.finish();const recorded=await recording.finish();
 const boundary=auditReadOnlyTrace(trace as TraceRecord[],[],false,reviewed);
 if(boundary.status==='PRESENT'&&!stop)stop={code:'S0_BOUNDARY_VIOLATION',boundary};
 if(decisionCapture.callsStarted!==summary.resources.modelCalls||decisionCapture.rowsWritten!==summary.resources.modelCalls)throw Error("DECISION_CAPTURE_COUNT_MISMATCH");
 await writeFile(resolve(directory,'probe-summary.json'),JSON.stringify({...summary,head,startedAt,finishedAt:new Date().toISOString(),inputSha256:sha256,decisionCapture,recording:recorded,boundary,stop},null,2),{flag:'wx'});
 await writeFile(resolve(directory,'trace.jsonl'),trace.map(row=>JSON.stringify(row)).join('\n')+'\n',{flag:'wx'});
 console.log(JSON.stringify({caseId:input.caseId,summary:resolve(directory,'probe-summary.json'),resources:summary.resources,witnessInListing:summary.witnessInListing,witnessInFirstBatch:summary.witnessInFirstBatch,inRadiusParsed:summary.inRadiusParsed,stop}));
 if(stop)process.exitCode=2;
}finally{restore();await capture.finish();}
