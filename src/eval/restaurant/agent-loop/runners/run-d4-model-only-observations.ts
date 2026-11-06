// Real model, frozen D4 observations only. No browser, Google, source fetch or
// task execution. The only changed model input is the current system prompt.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {DeepSeekModelGateway} from '../../../../infrastructure/deepseek/deepseek-model-gateway.js';
import {buildBrowserReadDecisionSystemPrompt,BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA} from '../../../../infrastructure/browser/browser-action-decision.js';
import type {ModelRequest} from '../../../../core/model/contracts.js';
import {chargeG6} from '../g6/budget.js';
const [rootArg,sha]=process.argv.slice(2);assert.ok(rootArg&&sha);
assert.equal(process.env.PRAXIS_D4_MODEL_ONLY,'1');assert.equal(process.env.DEEPSEEK_MODEL,'deepseek-v4-flash');assert.ok(process.env.DEEPSEEK_API_KEY);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha);assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
const root=resolve(rootArg),spec=JSON.parse(await readFile(join(root,'model-only-spec.json'),'utf8'));
const bytes=await readFile(spec.decisionsFile),hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');assert.equal(hash(bytes),spec.decisionsSHA256);
const decisions=bytes.toString().trim().split('\n').map(line=>JSON.parse(line)),results:any[]=[];
const model=new DeepSeekModelGateway({apiKey:process.env.DEEPSEEK_API_KEY,model:'deepseek-v4-flash',fetchImplementation:async(url,init)=>{
 assert.equal(String(url),'https://api.deepseek.com/chat/completions','Only the model endpoint may be called');
 assert.ok(results.length<40);await chargeG6(join(root,'model-only-budget.json'),`C-model-only:${results.length+1}`,'realModelCalls','2026-11-06 authorized model-only observation control, no websites/Google/GET');
 return fetch(url,init);
}});
await mkdir(join(root,'model-only-results'),{recursive:false});
experiment: for(const sample of spec.samples)for(let repeat=1;repeat<=spec.repeats;repeat++){
 const original=decisions.find(d=>d.sequence===sample.sequence);assert.equal(original.purpose,'browser_read_decide');
 const request:ModelRequest={taskId:'C-model-only',purpose:original.purpose,promptVersion:original.promptVersion,messages:original.messages.map((m:any)=>m.role==='system'?{...m,content:buildBrowserReadDecisionSystemPrompt()}:m),responseFormat:original.responseFormat,outputSchema:{...original.outputSchema,jsonSchema:BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA},timeoutMs:original.timeoutMs,fallback:'FAIL_CLOSED',maxOutputTokens:original.maxOutputTokens,temperature:original.temperature,thinking:original.thinking};
 let response:unknown,error:unknown;try{response=await model.complete(request);}catch(e){error={name:e instanceof Error?e.name:'Error',code:(e as {code?:string}).code};}
 const record:Record<string,unknown>={sourceSHA:sha,sourceSequence:sample.sequence,repeat,originalObservationUnchanged:true,request,response,error};
 assert.equal(JSON.stringify(record).includes(process.env.DEEPSEEK_API_KEY!),false);
 await writeFile(join(root,'model-only-results',`${sample.sequence}-${repeat}.json`),JSON.stringify(record,null,2)+'\n',{flag:'wx'});results.push({sourceSequence:sample.sequence,repeat,error});
 console.log(JSON.stringify({completed:results.length,total:spec.samples.length*spec.repeats,sourceSequence:sample.sequence,error}));
 if(error)break experiment;
}
await writeFile(join(root,'model-only-results/receipt.json'),JSON.stringify({sourceSHA:sha,calls:results.length,websiteGET:0,googleRequests:0,live:0,results},null,2)+'\n',{flag:'wx'});
