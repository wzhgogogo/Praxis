// Fresh synthetic recording is transferred via stdin; this child owns all disk inputs.
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { runRecordedRead } from "../../../eval/restaurant/agent-loop/runners/run-recorded-read.js";
const parts:Buffer[]=[];for await(const chunk of process.stdin)parts.push(Buffer.from(chunk));
const {bundle,mode}=JSON.parse(Buffer.concat(parts).toString());
const root=await mkdtemp(join(tmpdir(),"praxis-replay-child-"));
for(const [file,base64] of Object.entries(bundle.files)){
 if(file.startsWith("/")||file.split("/").includes(".."))throw new Error("Unsafe fixture file");
 const path=join(root,file);await mkdir(dirname(path),{recursive:true});await writeFile(path,Buffer.from(base64 as string,"base64"));
}
const directory=join(root,"recording");
if(mode==="missing"){
 const path=join(directory,"replay.har"),har=JSON.parse(await readFile(path,"utf8"));
 const index=har.log.entries.findIndex((row:any)=>row.response.content.mimeType==="application/json");if(index<0)throw new Error("No fixture structured response");
 har.log.entries.splice(index,1);await writeFile(path,JSON.stringify(har));
}
if(mode==="partial"){
 const path=join(directory,"recording.json"),manifest=JSON.parse(await readFile(path,"utf8"));
 manifest.pages[2].status="NOT_REPLAYABLE";manifest.pages[2].reason="UNCAPTURED_STATIC_DEPENDENCY";
 manifest.pages[2].diagnostic={status:"SAVED",file:"diagnostic-only.html"};
 await writeFile(join(directory,"diagnostic-only.html"),"<h1>This must never become replay input</h1>");await writeFile(path,JSON.stringify(manifest));
}
let networkAttempts=0,fixtureModelCalls=0;
globalThis.fetch=async()=>{networkAttempts++;throw new Error("REPLAY_NODE_NETWORK_FORBIDDEN");};
const decisions=(await readFile(join(root,"decisions.jsonl"),"utf8")).trim().split("\n").map((line:string)=>JSON.parse(line));let index=0;
const factory=(observe:any)=>({async complete(request:any){fixtureModelCalls++;const record=decisions[index++];if(record.purpose!==request.purpose)throw new Error("Fixture model purpose mismatch");const response={invocationId:`fixture-wire-${index}`,provider:"FIXTURE" as const,model:"fixture-real-mode-wiring",outputText:record.outputText,finishReason:record.finishReason,latencyMs:0};observe({...response,taskId:request.taskId,purpose:request.purpose,promptVersion:request.promptVersion,fallback:request.fallback,responseFormat:request.responseFormat,outputSchema:request.outputSchema,outcome:"SUCCEEDED"});return response;}});
const output=join(root,"output");
const summary=await runRecordedRead({recordingDirectory:directory,decisionsPath:join(root,"decisions.jsonl"),input:JSON.parse(await readFile(join(root,"case.json"),"utf8")),modelMode:mode==="model-wiring"?"REAL":"ORIGINAL"},output,mode==="model-wiring"?factory:undefined);
const artifact=JSON.parse(await readFile(summary.resultPath,"utf8")),evaluation=JSON.parse(await readFile(join(output,"replay.evaluation.json"),"utf8"));
// The formal Runner may set failure exit code after the deliberate input stop.
console.log("REPLAY_FIXTURE_RESULT="+JSON.stringify({summary,artifact,evaluation,networkAttempts,fixtureModelCalls,realModelCalls:0,realGoogleCalls:0,realWebsiteCalls:0}));
process.exit(0);
