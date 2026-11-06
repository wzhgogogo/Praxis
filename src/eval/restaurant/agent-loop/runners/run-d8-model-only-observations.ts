// Frozen D8 public observations only. No browser, website or Google port.
import assert from "node:assert/strict";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {join,resolve} from "node:path";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {DeepSeekModelGateway} from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import {buildBrowserReadDecisionSystemPrompt,BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA} from "../../../../infrastructure/browser/browser-action-decision.js";
import {chargeG6} from "../g6/budget.js";
import {ModelGatewayError} from "../../../../core/model/errors.js";
import type {ModelRequest} from "../../../../core/model/contracts.js";

const [rootArg,expectedSHA]=process.argv.slice(2);assert.ok(rootArg&&expectedSHA);
assert.equal(process.env.PRAXIS_D8_MODEL_ONLY,"1");assert.ok(process.env.DEEPSEEK_API_KEY);
assert.equal(execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),expectedSHA);
assert.equal(execFileSync("git",["status","--porcelain"],{encoding:"utf8"}).trim(),"");
const root=resolve(rootArg),specRaw=await readFile(join(root,"spec.json")),spec=JSON.parse(specRaw.toString());
const sha=(v:Uint8Array|string)=>createHash("sha256").update(v).digest("hex");
const originalRaw=await readFile(spec.decisionsFile);assert.equal(sha(originalRaw),spec.decisionsSHA256);
const rows=originalRaw.toString().trim().split("\n").map(line=>JSON.parse(line));
assert.equal(process.env.DEEPSEEK_MODEL,spec.model);
assert.ok((await readFile("src/infrastructure/browser/browser-task-executor.ts","utf8")).includes("objective: "+JSON.stringify(spec.objective)),"Current runtime objective must equal the frozen validation objective");
const resultDirectory=join(root,"results");await mkdir(resultDirectory,{recursive:false});
const results:any[]=[];let transmissions=0;
const model=new DeepSeekModelGateway({apiKey:process.env.DEEPSEEK_API_KEY,model:spec.model,fetchImplementation:async(url,init)=>{
 assert.ok(["https://api.deepseek.com/chat/completions","https://api.deepseek.com/beta/chat/completions"].includes(String(url)),"Only the existing model endpoint is available");
 const ledger=JSON.parse(await readFile(join(root,"budget.json"),"utf8"));
 assert.ok(ledger.entries.filter((e:any)=>e.id.startsWith("C-D8-model-only:")).length<30,"User ceiling30 across all phases and failures");
 const id=`C-D8-model-only:${sha(specRaw).slice(0,12)}:${++transmissions}`;
 await chargeG6(join(root,"budget.json"),id,"realModelCalls","D8 recorded-observation model-only validation; no website/Google/Live");
 return fetch(url,init);
}});
outer:for(const sample of spec.samples)for(let repeat=1;repeat<=spec.repeats;repeat++){
 const row=rows.find(r=>r.sequence===sample.sequence);assert.equal(row.purpose,"browser_read_decide");
 const context=JSON.parse(row.messages.find((m:any)=>m.role==="user").content),observationSHA=sha(JSON.stringify(context.observation));
 context.objective=spec.objective;
 if(sample.progress)context.progress=sample.progress;
 if(sample.retrieval){context.goal={...context.goal,outlet:{...context.goal.outlet,name:sample.retrieval},retrievalExpression:sample.retrieval,retrievalSource:"SPECIFIC_OUTLET"};}
 assert.equal(sha(JSON.stringify(context.observation)),observationSHA,"Recorded observation is immutable");
 const request:ModelRequest={taskId:"D8-recorded-observation",purpose:row.purpose,promptVersion:row.promptVersion,
  messages:row.messages.map((m:any)=>m.role==="system"?{...m,content:buildBrowserReadDecisionSystemPrompt()}:m.role==="user"?{...m,content:JSON.stringify(context)}:m),
  outputSchema:{...row.outputSchema,jsonSchema:BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA},responseFormat:row.responseFormat,
  timeoutMs:row.timeoutMs,maxOutputTokens:row.maxOutputTokens,temperature:row.temperature,thinking:row.thinking,fallback:"FAIL_CLOSED"};
 const startedAt=Date.now();
 let response:any,error:any,action:any,pass=false;
 try{response=await model.complete(request);action=JSON.parse(response.outputText);const target=context.observation.targets.find((t:any)=>t.ref===action.targetRef);
  const permitted=!action.targetRef||target?.availableActions?.includes(action.action+(action.action==="FILL_AUTHORITATIVE"?":"+action.authoritativeField:""));
  pass=sample.expected.includes(action.action)&&Boolean(permitted);
 }catch(e){error={name:e instanceof Error?e.name:"Error",code:(e as {code?:string}).code,...(e instanceof ModelGatewayError?{providerStatus:e.providerStatus,providerError:e.providerError}:{})};}
 const result:Record<string,unknown>={elapsedMs:Date.now()-startedAt,sourceSHA:expectedSHA,sequence:sample.sequence,repeat,observationSHA,observationUnchanged:true,expected:sample.expected,pass,request,response,error,action};
 const bytes:string=JSON.stringify(result,null,2)+"\n";assert.equal(bytes.includes(process.env.DEEPSEEK_API_KEY!),false);
 await writeFile(join(resultDirectory,`${sample.sequence}-${repeat}.json`),bytes,{flag:"wx"});
 results.push({sequence:sample.sequence,repeat,pass,action:action?.action,error});console.log(JSON.stringify(results.at(-1)));
 if(error)break outer;
}
await writeFile(join(resultDirectory,"receipt.json"),JSON.stringify({sourceSHA:expectedSHA,modelRequested:spec.model,transmissions,websiteGET:0,google:0,live:0,results},null,2)+"\n",{flag:"wx"});
