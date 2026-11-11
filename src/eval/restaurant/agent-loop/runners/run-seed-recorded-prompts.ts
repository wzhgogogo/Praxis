/** User2026-11-11: <=10 model-only calls on already recorded observations.
 * This entry has no browser/Google/witness client and never reads private files. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';import {resolve,join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {DeepSeekModelGateway} from '../../../../infrastructure/deepseek/deepseek-model-gateway.js';
import {RestaurantAgentDecision} from '../../../../domains/restaurant/agent-decision.js';
import {RESTAURANT_AGENT_CAPABILITIES} from '../../../../domains/restaurant/restaurant-capabilities.js';
import {ModelBrowserReadActionDecision} from '../../../../infrastructure/browser/browser-action-decision.js';
import {chargeG6} from '../g6/budget.js';
const flag=(n:string)=>{const i=process.argv.indexOf(n);if(i<0||!process.argv[i+1])throw Error('MISSING_ARGUMENT');return process.argv[i+1]!;};
const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();if(sourceSHA!==flag('--source-sha')||execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
if(process.env.PRAXIS_RUN_RECORDED_SEED_PROMPTS!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file')))throw Error('MODEL_ONLY_AUTHORIZATION_REQUIRED');
const sourceText=await readFile(new URL('../../../../integrations/restaurant-search/native-restaurant-search.ts',import.meta.url),'utf8');
const declarationPrefix='export const NATIVE_DISCOVERY_OBJECTIVE = ';
const declaration=sourceText.split('\n').find(line=>line.startsWith(declarationPrefix));if(!declaration?.endsWith(';'))throw Error('FROZEN_OBJECTIVE_LITERAL_MISSING');
const NATIVE_DISCOVERY_OBJECTIVE=JSON.parse(declaration.slice(declarationPrefix.length,-1)) as string;
const root=resolve(flag('--output'));await mkdir(root,{recursive:false});const hash=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex');
const gateway=DeepSeekModelGateway.fromEnvironment(process.env);let calls=0;const requests:unknown[]=[],responses:unknown[]=[];
const model={async complete(request:Parameters<typeof gateway.complete>[0]){if(calls>=2)throw Error('FROZEN_TWO_CALL_LIMIT');calls++;await chargeG6(flag('--budget'),'seed-recorded-prompts:'+sourceSHA+':'+calls,'realModelCalls','User2026-11-11 <=10 model-only validation; two frozen recorded states, 0Live/0GET');requests.push({...request,messages:{sha256:hash(JSON.stringify(request.messages))}});await writeFile(join(root,'requests.json'),JSON.stringify(requests,null,2)+'\n');const response=await gateway.complete(request);responses.push(response);await writeFile(join(root,'responses.json'),JSON.stringify(responses,null,2)+'\n');return response;}};
const r1=JSON.parse(await readFile(new URL('../fixtures/seed-root-causes/07-r1.json',import.meta.url),'utf8'));
const browser=JSON.parse(await readFile(new URL('../../../../harness/browser/fixtures/d02v-paging-recorded/manifest.json',import.meta.url),'utf8'));
const row=browser.decisions.find((r:any)=>r.sequence===8),input=JSON.parse(row.messages.find((m:any)=>m.role==='user').content);
await writeFile(join(root,'plan.json'),JSON.stringify({sourceSHA,maximumCalls:2,Live:0,GET:0,recorded07ContextSHA256:hash(JSON.stringify(r1.trajectory.decisionContext)),recordedD02InputSHA256:hash(JSON.stringify(input)),original07Action:r1.trajectory.agentAction,originalD02Output:JSON.parse(row.outputText)},null,2)+'\n');
const results:unknown[]=[];
try{const answer=await new RestaurantAgentDecision(model).decide({taskId:'recorded07-prompt',context:r1.trajectory.decisionContext,recentExecutionHistory:r1.recentExecutionHistory,capabilities:RESTAURANT_AGENT_CAPABILITIES});const available=Object.keys(r1.trajectory.decisionContext.availabilityChecks).filter(id=>r1.trajectory.decisionContext.availabilityChecks[id].status==='AVAILABLE');results.push({case:'07-r1-original-decision32',answer,availableCandidateIds:available,passed:answer.status==='PROPOSED'&&answer.action.type==='INVESTIGATE_CANDIDATE_FACTS'&&answer.action.candidateIds.some(id=>available.includes(id))});}catch(error){results.push({case:'07-r1-original-decision32',status:'FAILED',code:error&&typeof error==='object'&&'code'in error?error.code:'MODEL_FAILURE'});}
if(!process.argv.includes('--agent-only'))try{const answer=await new ModelBrowserReadActionDecision(model).decide({...input,taskId:'recordedD02-prompt',objective:NATIVE_DISCOVERY_OBJECTIVE});results.push({case:'D02V-original-decision8',answer,passed:(answer.type==='FILL_AUTHORITATIVE'||answer.type==='CHOOSE_OPTION')&&answer.field==='RETRIEVAL'});}catch(error){results.push({case:'D02V-original-decision8',status:'FAILED',code:error&&typeof error==='object'&&'code'in error?error.code:'MODEL_FAILURE'});}
await writeFile(join(root,'results.json'),JSON.stringify({sourceSHA,calls,Live:0,GET:0,results},null,2)+'\n');console.log(JSON.stringify({sourceSHA,calls,Live:0,GET:0,results}));
