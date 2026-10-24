import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInterruptionScenario } from "./run-interruption-scenario.js";
export async function createReplayFixture(root:string){
 const original=await runInterruptionScenario("complete",root,true);
 const recordingRoot=original.artifact.browserRecording.path;
 const manifest=JSON.parse(await readFile(join(recordingRoot,"recording.json"),"utf8"));
 const files:Record<string,string>={};
 for(const file of ["recording.json","replay.har",...manifest.documents.map((d:any)=>d.file)])files['recording/'+file]=(await readFile(join(recordingRoot,file))).toString("base64");
 files['case.json']=(await readFile(join(original.runRoot,"replay-case.json"))).toString("base64");files['decisions.jsonl']=(await readFile(original.artifact.decisionCapture.path)).toString("base64");
 return {bundle:{files},original};
}
export async function executeReplayFixture(bundle:unknown,mode:"complete"|"missing"|"partial"|"model-wiring",evidenceRoot?:string){
 const repository=fileURLToPath(new URL("../../../../",import.meta.url));
 const command=process.execPath,args=["--import",join(repository,"scripts/test-filesystem-guard.mjs"),"--import","tsx",fileURLToPath(new URL("./replay-child.ts",import.meta.url))];
 // macOS OS policy is inherited by Chromium. IPC uses stdio, no network needed.
 const child=spawn("/usr/bin/sandbox-exec",["-p","(version 1)(allow default)(deny network-outbound)",command,...args],{cwd:repository,stdio:["pipe","pipe","pipe"],env:Object.fromEntries(Object.entries(process.env).filter(([key])=>["PATH","HOME","TMPDIR","LANG","PLAYWRIGHT_BROWSERS_PATH"].includes(key)))});
 const stdout:Buffer[]=[],stderr:Buffer[]=[];child.stdout.on("data",d=>stdout.push(d));child.stderr.on("data",d=>stderr.push(d));
 const timer=setTimeout(()=>child.kill("SIGKILL"),30_000);child.stdin.end(JSON.stringify({bundle,mode}));
 const exit=await new Promise<{code:number|null;signal:NodeJS.Signals|null}>((resolve,reject)=>{child.once("error",reject);child.once("close",(code,signal)=>resolve({code,signal}));}).finally(()=>clearTimeout(timer));
 const text=Buffer.concat(stdout).toString(),errors=Buffer.concat(stderr).toString();
 if(evidenceRoot){await writeFile(join(evidenceRoot,mode+".stdout.log"),text);await writeFile(join(evidenceRoot,mode+".stderr.log"),errors);}
 assert.equal(exit.code,0,`Replay child ${mode}: ${JSON.stringify(exit)} ${errors.slice(-2500)}`);
 const line=text.split("\n").find(row=>row.startsWith("REPLAY_FIXTURE_RESULT="));assert.ok(line,errors);
 const result=JSON.parse(line.slice("REPLAY_FIXTURE_RESULT=".length));assert.equal(result.networkAttempts,0);assert.equal(result.realModelCalls,0);
 return {...result,networkPolicy:"OS_DENY_NETWORK_OUTBOUND",exit};
}
export function replayDelivery(artifact:any){
 const state=artifact.finalSnapshot.domainState,shown=state.presentedResults?.candidateIds??[];
 return {candidates:state.candidates.map((c:any)=>({id:c.restaurant.id,name:c.restaurant.outletName})),shown,offers:shown.flatMap((id:string)=>(state.availability[id]??[]).map((offer:any)=>({id:offer.id,restaurantId:offer.restaurantId,dateTime:offer.dateTime,partySize:offer.partySize,bookingMode:offer.bookingMode})))};
}
