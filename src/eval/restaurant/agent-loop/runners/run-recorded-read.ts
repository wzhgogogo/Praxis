import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { restaurantDiscoveryPacks } from "../../../../integrations/restaurant-search/source-packs.js";
import type { ModelGateway, ModelInvocationRecord, ModelRequest } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { evaluateRestaurantHybridLiveArtifact } from "../diagnostic-evaluator.js";
import { runHybridReadDiagnostic, type HybridReadDiagnosticInput } from "./run-hybrid-live-read.js";
import { loadReplayRecording, recordedResponse, createRecordedBrowser, type ReplayStop } from "./replay-read-recording.js";
import { capturedContractMatches, rebindRecordedBrowserDecision, type RecordedReferenceBinding } from "./recorded-browser-decision.js";

export interface RecordedReadInput {
  recordingDirectory: string; decisionsPath: string;
  input: Omit<HybridReadDiagnosticInput,"startedAt"|"packs"> & { startedAt: string; packIds: string[] };
  modelMode: "ORIGINAL" | "REAL";
}
/** Replay wall clock advances normally, shifted to the original epoch; budgets retain real elapsed time. */
function replayClock(epoch: number) {
  const OriginalDate=Date,started=performance.now();
  const now=()=>epoch+Math.floor(performance.now()-started);
  globalThis.Date=new Proxy(OriginalDate,{construct(target,args,newTarget){return Reflect.construct(target,args.length?args:[now()],newTarget);},get(target,property){if(property==="now")return now;return Reflect.get(target,property);}});
  return ()=>{globalThis.Date=OriginalDate;};
}
export async function runRecordedRead(config: RecordedReadInput, output: string, realModelFactory?: (observe:(record:ModelInvocationRecord)=>void)=>ModelGateway) {
  if(config.modelMode!=="ORIGINAL"&&config.modelMode!=="REAL")throw new Error("Explicit replay model mode required");
  if(config.modelMode==="REAL"&&!realModelFactory)throw new Error("Real-model replay needs an explicitly authorized model factory");
  await mkdir(output,{recursive:true});
  const recording=await loadReplayRecording(config.recordingDirectory,resolve(output,"replay-input.har"));
  const decisionBytes=await readFile(config.decisionsPath),decisions=decisionBytes.toString().trim().split("\n").filter(Boolean).map(line=>JSON.parse(line));
  const restoreClock=replayClock(Date.parse(config.input.startedAt));
  const controller=new AbortController();let stopped:ReplayStop|undefined,decisionIndex=0,modelTransportCalls=0;
  const referenceBindings: RecordedReferenceBinding[] = [];
  let decisionMismatch: { recordedSequence: number; recorded: unknown; requested: unknown } | undefined;
  let replayedDecisionCount = 0;
  const stop=(reason:ReplayStop)=>{if(stopped)return;stopped=reason;controller.abort();};
  const replay=createRecordedBrowser(recording,stop);
  const packs=config.input.packIds.map(id=>{const pack=restaurantDiscoveryPacks.find(p=>p.meta.id===id);if(!pack)throw new Error("Unknown original source pack");return pack;});
  const {packIds:_packIds,startedAt,...input}=config.input;
  const provenance={executionSource:"REPLAY",modelMode:config.modelMode,recordingSha256:recording.sha256,harSha256:recording.harSha256,decisionSha256:createHash("sha256").update(decisionBytes).digest("hex"),liveCapabilityDenominator:"EXCLUDED"};
  try {
    const result=await runHybridReadDiagnostic({...input,startedAt:new Date(startedAt),packs,recordBrowser:false,recordDecisions:false,directory:resolve(output,"execution"),runtimeContext:{...input.runtimeContext,...provenance}}, {
      signal:controller.signal,browser:replay.browser,
      google:{apiKey:"replay-no-network",fetchImplementation:async(url,init)=>{
        const entry=recordedResponse(recording,String(url),init?.method??"GET",init?.body);
        if(!entry){const parsed=new URL(String(url));stop({snapshot:null,origin:parsed.origin,pathname:parsed.pathname,reason:"MISSING_STRUCTURED_RESPONSE"});throw new Error("REPLAY_INCOMPLETE");}
        const content=entry.response.content;return new Response(content.encoding==="base64"?Buffer.from(content.text,"base64"):content.text,{status:entry.response.status,headers:{"content-type":content.mimeType}});
      }},
      createModel:observe=>{
        if(config.modelMode==="REAL"){const model=realModelFactory!(observe);return {async complete(request){modelTransportCalls++;return model.complete(request);}};}
        return {async complete(request:ModelRequest){
          const record=decisions[decisionIndex++];
          if(!record||!capturedContractMatches(record,request)||record.outcome!=="SUCCEEDED"||typeof record.outputText!=="string"){
            decisionMismatch={recordedSequence:decisionIndex,recorded:record?{purpose:record.purpose,promptVersion:record.promptVersion,outputSchema:record.outputSchema}:null,requested:{purpose:request.purpose,promptVersion:request.promptVersion,outputSchema:{name:request.outputSchema.name,version:request.outputSchema.version}}};
            stop({snapshot:recording.pages[replay.consumedPages()]?.snapshot??null,origin:"",pathname:"",reason:"DECISION_SEQUENCE_DIVERGED"});throw new Error("REPLAY_INCOMPLETE");
          }
          let rebound: ReturnType<typeof rebindRecordedBrowserDecision>;
          try { rebound=rebindRecordedBrowserDecision(record,request); }
          catch(error){stop({snapshot:recording.pages[replay.consumedPages()]?.snapshot??null,origin:"",pathname:"",reason:error&&typeof error==="object"&&"code"in error?String(error.code):"REPLAY_REFERENCE_BINDING_FAILED"});throw new Error("REPLAY_INCOMPLETE");}
          if(rebound.binding)referenceBindings.push(rebound.binding);
          replayedDecisionCount++;
          const response={invocationId:`replayed-${decisionIndex}`,provider:"FIXTURE" as const,model:"recorded-decisions",outputText:rebound.outputText,finishReason:record.finishReason??"STOP",latencyMs:0};
          observe({invocationId:response.invocationId,taskId:request.taskId,purpose:request.purpose,promptVersion:request.promptVersion,fallback:request.fallback,provider:response.provider,model:response.model,responseFormat:request.responseFormat,outputSchema:request.outputSchema,outcome:"SUCCEEDED",latencyMs:0});return response;
        }};
      },
      evaluateArtifact:async(path,options)=>{
        if(!stopped&&config.modelMode==="ORIGINAL"&&(decisionIndex!==decisions.length||replay.consumedPages()!==recording.pages.length))stop({snapshot:recording.pages[replay.consumedPages()]?.snapshot??null,origin:"",pathname:"",reason:"UNCONSUMED_RECORDED_INPUT"});
        const bytes=await readFile(path),evaluation=evaluateRestaurantHybridLiveArtifact(JSON.parse(bytes.toString()),{path,sha256:createHash("sha256").update(bytes).digest("hex")},options);
        evaluation.outcome.capabilityDenominator="EXCLUDED";
        evaluation.outcome.reasons.push("Replay is evaluated separately and excluded from the Live capability denominator.");
        if(stopped){
          evaluation.outcome={type:"NOT_EVALUATED",capabilityDenominator:"EXCLUDED",userGoalComplete:"NOT_EVALUATED",reasons:["REPLAY_INCOMPLETE: remaining execution is unavailable, neither pass nor fail."],evidenceRefs:["replay-stop"]};
          evaluation.execution.completion="NOT_EVALUATED";evaluation.execution.taskProducedQualifiedResult="UNKNOWN";
          evaluation.findings=evaluation.findings.map(f=>({...f,status:"NOT_EVALUATED" as const,observations:["Partial Replay: no stage pass/fail is claimed by this evaluation."]}));
        }
        const outputPath=resolve(output,"replay.evaluation.json");
        await writeFile(outputPath,JSON.stringify({...evaluation,...provenance,replayStatus:stopped?"REPLAY_INCOMPLETE":"COMPLETED",stop:stopped??null},null,2),{flag:"wx"});return {evaluation,outputPath};
      },
    });
    const summary={...provenance,status:stopped?"REPLAY_INCOMPLETE":"COMPLETED",stop:stopped??null,consumedPages:replay.consumedPages(),recordedPages:recording.pages.length,consumedDecisions:decisionIndex,recordedDecisions:decisions.length,replayedDecisionCount,decisionMismatch:decisionMismatch??null,referenceBindingProtocol:"observed-target-rebinding@1",referenceBindings,modelTransportCalls,missingRequests:replay.missingRequests(),resultPath:result.resultPath};
    await writeFile(resolve(output,"replay.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});return summary;
  }finally{controller.abort();restoreClock();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [manifest,output]=process.argv.slice(2);if(!manifest||!output)throw new Error("Usage: run-recorded-read.ts frozen-manifest.json output-directory");
  const config:RecordedReadInput=JSON.parse(await readFile(manifest,"utf8"));
  if(config.modelMode==="REAL"&&process.env.PRAXIS_ALLOW_LIVE_MODEL_EVAL!=="1")throw new Error("Real-model Replay requires explicit authorization and PRAXIS_ALLOW_LIVE_MODEL_EVAL=1");
  await runRecordedRead(config,resolve(output),config.modelMode==="REAL"?observe=>DeepSeekModelGateway.fromEnvironment(process.env,{observer:{observe}}):undefined);
}
