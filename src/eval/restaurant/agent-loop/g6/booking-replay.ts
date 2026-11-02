import { mkdir,readFile,writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join,resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import type { ModelGateway,ModelRequest,ModelResponse } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { strictAction } from "../../../../harness/restaurant-read-test-fixtures.js";
import { runG6DevelopmentPreflight } from "../g6-development-preflight.js";
import { chargeG6 } from "./budget.js";
const hash=(b:string|Buffer)=>createHash("sha256").update(b).digest("hex");
export interface G6BookingReplayInput {schemaVersion:"g6-booking-code-selection-replay@1";sourceSHA256:Record<string,string>;requiredMergedMain:string;maximumPhysicalCalls:20;cases:Array<{id:string;path:"P1"|"P2";variant:number;initialRequest:string;bookingRequest:string;partyReply?:string;expected:{selection:"CODE_BEFORE_AGENT_SELECTION";termsRead:true;policyTextAbsent:true;modelSelectRequired:false}}>;}
export async function runBookingReplay(inputPath:string,inputSHA:string,out:string,environment:NodeJS.ProcessEnv,fixture=false){
  const bytes=await readFile(inputPath);if(hash(bytes)!==inputSHA)throw Error("Booking replay input SHA mismatch");const input=JSON.parse(bytes.toString()) as G6BookingReplayInput;
  if(input.schemaVersion!=="g6-booking-code-selection-replay@1"||input.maximumPhysicalCalls!==20||input.cases.length!==4)throw Error("Unexpected booking replay configuration");
  // A main synchronization is mandatory, even for fixture preflight. The exact
  // approved merge SHA is a command input, not a guessed C branch/ref.
  const base=environment.PRAXIS_G6_SELECTION_MAIN;
  if(!base||execFileSync("git",["merge-base","--is-ancestor",base,"HEAD"],{stdio:"pipe"}).length)throw Error("Set PRAXIS_G6_SELECTION_MAIN to the approved C main merge after syncing");
  for(const [path,sha] of Object.entries(input.sourceSHA256))if(hash(await readFile(path))!==sha)throw Error("Original exposed development input changed: "+path);
  await mkdir(out,{recursive:false});let physical=0;
  const gateway:ModelGateway=fixture?{async complete(request){const context=JSON.parse(request.messages.find(m=>m.role==="user")!.content).context;const ids=context.candidates.map((c:{id:string})=>c.id);const action=context.missingBlockingFields.length?{...strictAction("ASK_USER"),question:"How many people?",relatedFields:context.missingBlockingFields}:context.checkableCandidateIds?.length?strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds.slice(0,1)):strictAction("PRESENT_RESULTS",ids.slice(0,1));return {invocationId:"booking-replay-local",provider:"FIXTURE",model:"booking-replay-local",latencyMs:0,finishReason:"TOOL_CALLS",outputText:JSON.stringify(action)};}}
    :DeepSeekModelGateway.fromEnvironment(environment,{fetchImplementation:async(url,init)=>{
      if(physical>=input.maximumPhysicalCalls)throw Error("Booking replay allowance reached before transmission");await chargeG6(resolve(".eval-artifacts/phase3b/budget.json"),`g6-booking-replay-${Date.now()}-${++physical}`,"realModelCalls","Approved affected booking turns only; no retry outside product policy");return fetch(url,init);
    }});
  const results:unknown[]=[];
  for(const c of input.cases){const directory=join(out,c.id);let error:string|undefined;
    try{await runG6DevelopmentPreflight(directory,c.path,c.variant,"TABELOG",undefined,gateway);}catch(e){error=e instanceof Error?e.name:"REPLAY_FAILED";}
    const record=JSON.parse(await readFile(join(directory,"preflight.json"),"utf8"));const calls=record.requests as Array<{turn:string;request:ModelRequest;response:ModelResponse}>;
    const first=record.initial.restaurant.presentedCandidateIds[0];
    const booking=calls.filter(r=>r.turn!=="INITIAL"&&r.request.purpose==="restaurant_agent_decide");
    const contexts=booking.map(r=>JSON.parse(r.request.messages.find(m=>m.role==="user")!.content).context);
    const selectionBeforeAgent=record.after?.restaurant.selectedCandidateId===first&&record.initial.restaurant.selectedCandidateId!==first&&!booking.some(r=>JSON.parse(r.response.outputText).type==="SELECT_CANDIDATE");
    // If the model itself also selects, the first incoming context must already
    // contain the code-owned selection to avoid a self-fulfilling fixture pass.
    const incomingSelected=contexts.find(context=>!context.missingBlockingFields?.length)?.selectedCandidateId===first;
    const policyCalls=calls.filter(r=>r.turn!=="INITIAL"&&r.request.purpose==="restaurant_page_question");
    const selected=record.after?.restaurant.selectedCandidateId===first;
    const policyAbsent=policyCalls.every(r=>JSON.parse(r.response.outputText).status==="NOT_STATED")&&(record.after?.restaurant.bookingHandoffs??[]).every((h:{terms?:unknown[]})=>!h.terms?.length);
    const result={id:c.id,error:error??null,mode:fixture?"FIXTURE":"REAL_MODEL_FIXED_SOURCE",physicalCallsSoFar:physical,actions:booking.map(r=>({turn:r.turn,type:JSON.parse(r.response.outputText).type})),codeSelectionRecorded:selected&&Boolean(selectionBeforeAgent||incomingSelected),termsRead:policyCalls.length>0,termsModelCalls:policyCalls.length,policyOmittedAsNotStated:policyAbsent,card:record.after?.restaurant.bookingHandoffs??[],status:selected&&(selectionBeforeAgent||incomingSelected)&&policyCalls.length>0&&policyAbsent?"PASS":"FAIL",note:"Source contains private-room prose only. Terms should be omitted as NOT_STATED; no fabricated policy added."};
    results.push(result);await writeFile(join(directory,"booking-review.json"),JSON.stringify(result,null,2)+"\n",{flag:"wx"});
    if(result.status==="FAIL")break;
  }
  const summary={schemaVersion:input.schemaVersion,inputSHA256:inputSHA,approvedMain:base,physicalCalls:physical,live:0,publicGET:0,results};await writeFile(join(out,"report.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const [input,sha,out,mode]=process.argv.slice(2);if(!input||!sha||!out)throw Error("Usage: booking-replay.ts <frozen-input> <SHA256> <new-output> [--fixture]");runBookingReplay(resolve(input),sha,resolve(out),process.env,mode==="--fixture").then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error("Booking replay stopped; preserve saved evidence; credentials are never logged");process.exitCode=1;});}
