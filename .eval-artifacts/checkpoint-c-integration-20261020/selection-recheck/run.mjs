import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { DeepSeekModelGateway } from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import { normalizeRestaurantAgentActionStrictWire } from '../../../src/domains/restaurant/agent-action.ts';
import { assessSelectionReplay } from '../../../src/eval/restaurant/agent-loop/selection-replay-assessment.ts';
const dir='.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck',sha=b=>createHash('sha256').update(b).digest('hex');
const plan=JSON.parse(await fs.readFile(`${dir}/plan.json`)),freeze=JSON.parse(await fs.readFile(`${dir}/freeze.json`));
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))if(sha(await fs.readFile(p))!==h)throw Error(`FROZEN_CHANGED:${p}`);};await verify();
execFileSync('git',['diff','--exit-code','HEAD','--','src',dir],{stdio:'pipe'});
const inputs=JSON.parse(await fs.readFile(`${dir}/prepared-inputs.json`)),codeCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(inputs.length!==5||plan.plannedCalls!==5||plan.maxCalls!==20)throw Error('BUDGET_PLAN_CHANGED');
await fs.mkdir(`${dir}/results`);const ledger={codeCommit,maxCalls:20,plannedCalls:5,websiteRequests:0,googleRequests:0,calls:[]},results=[];
const fetchOriginal=globalThis.fetch;globalThis.fetch=(url,init)=>{const u=new URL(String(url));if(u.origin!=='https://api.deepseek.com'||!['/chat/completions','/beta/chat/completions'].includes(u.pathname)||init?.method!=='POST')throw Error('ONLY_APPROVED_DEEPSEEK_REPLAY');return fetchOriginal(url,init);};
const approvedRequests=JSON.parse(await fs.readFile(`${dir}/prepared-requests.json`));
for(const input of inputs){const r=approvedRequests.find(r=>r.seedId===input.id);if(!r||r.requestSha256!==input.requestSha256||sha(JSON.stringify(r.request))!==input.requestSha256)throw Error('AUDITED_PAYLOAD_MISMATCH');}
const gateway=DeepSeekModelGateway.fromEnvironment(process.env);
for(const input of inputs){
 const call={seedId:input.id,startedAt:new Date().toISOString(),status:'STARTED',requestSha256:input.requestSha256};ledger.calls.push(call);await fs.writeFile(`${dir}/ledger.json`,JSON.stringify(ledger,null,2));
 let action=null,wireText=null,errorCode=null,finishReason=null;
 try{const response=await gateway.complete(approvedRequests.find(r=>r.seedId===input.id).request);Object.assign(call,{model:response.model,latencyMs:response.latencyMs,usage:response.usage});wireText=response.outputText;finishReason=response.finishReason;if(finishReason!=='TOOL_CALLS')throw Error('MODEL_OUTPUT_REJECTED');const decoded=normalizeRestaurantAgentActionStrictWire(JSON.parse(wireText));if(!decoded.valid)throw Error(`MODEL_OUTPUT_REJECTED:${decoded.errors.join(';')}`);action=decoded.value;call.status='SUCCEEDED';}catch(e){errorCode=e.code??e.message??'REPLAY_FAILED';call.status='FAILED';}
 Object.assign(call,{finishedAt:new Date().toISOString(),errorCode});await fs.writeFile(`${dir}/ledger.json`,JSON.stringify(ledger,null,2));
 const verdict=action?assessSelectionReplay(action,input.context,input.outlets,input.annotation,input.rules,1000):{verdict:'NO_ACTION',reasons:[errorCode]};
 const selected=(action?.candidateIds??[]).map(id=>{const c=input.context.candidates.find(c=>c.id===id);return{id,name:c?.outletName,path:c?.availabilityPath,distance:c?.distanceObservation?.meters};});
 const result={seedId:input.id,scenario:input.annotation.scenario,codeCommit,action,wireText,finishReason,call,verdict,selected,directCount:selected.filter(c=>c.path==='DIRECT_SOURCE_PAGE').length,totalSelected:selected.length,reconstruction:input.reconstruction};
 await fs.writeFile(`${dir}/results/${input.id}.json`,JSON.stringify(result,null,2),{flag:'wx'});results.push(result);console.log(JSON.stringify({seed:input.id,verdict:verdict.verdict,selected,direct:result.directCount}));
}
await verify();const accepted=id=>results.find(r=>r.seedId===id)?.verdict.verdict==='ACCEPTABLE';
const gate={kagurazaka:accepted('p22-selection-001'),shibuya:['p1-seed-0134','p22-selection-002','p22-selection-003'].filter(accepted).length,control:accepted('p1-seed-0133')};
gate.status=gate.kagurazaka&&gate.shibuya>=2&&gate.control?'PASS':'FAIL';
await fs.writeFile(`${dir}/summary.json`,JSON.stringify({codeCommit,gate,modelCalls:ledger.calls.length,websiteRequests:0,googleRequests:0,results},null,2),{flag:'wx'});console.log(JSON.stringify(gate));
