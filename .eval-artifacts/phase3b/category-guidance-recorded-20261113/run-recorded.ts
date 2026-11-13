/** Model-only component diagnostic. Frozen public observations; no browser/source client. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.js';
import {ModelBrowserReadActionDecision} from '../../../src/infrastructure/browser/browser-action-decision.js';
import {loadBrowserReadSkills} from '../../../src/infrastructure/browser/browser-read-skills.js';
import {chargeG6} from '../../../src/eval/restaurant/agent-loop/g6/budget.js';
const root=fileURLToPath(new URL('.',import.meta.url));
const flag=(n:string)=>{const i=process.argv.indexOf(n);if(i<0||!process.argv[i+1])throw Error('MISSING_ARGUMENT');return process.argv[i+1]!;};
const hash=(s:string|Uint8Array)=>createHash('sha256').update(s).digest('hex');
const git=(...a:string[])=>execFileSync('git',a,{encoding:'utf8'}).trim();
const sourceSHA=git('rev-parse','HEAD');if(sourceSHA!==flag('--source-sha')||git('status','--porcelain'))throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
const manifest=JSON.parse(await readFile(join(root,'cases.json'),'utf8'));
const selected=process.argv.includes('--cases')?flag('--cases').split(','):manifest.map((c:any)=>c.id);
if(new Set(selected).size!==selected.length||selected.some((id:string)=>!manifest.some((c:any)=>c.id===id)))throw Error('INVALID_CASE_SELECTION');
const skill=loadBrowserReadSkills('TABELOG','web-skills/tabelog/SKILL.md');
const native=await readFile(new URL('../../../src/integrations/restaurant-search/native-restaurant-search.ts',import.meta.url),'utf8');
const objective=JSON.parse(native.split('\n').find(l=>l.trim().startsWith('objective:"Find the current public restaurant list'))!.trim().slice('objective:'.length,-1));
const prepared=[];
for(const c of manifest){const bytes=await readFile(join(root,c.file));if(hash(bytes)!==c.sha256)throw Error('INPUT_HASH_MISMATCH');const input=JSON.parse(bytes.toString());if(input.stage==='DISCOVERY'&&input.source==='DIRECTORY'&&input.objective!==objective)throw Error('FROZEN_OBJECTIVE_MISMATCH');prepared.push({c,input:{...input,taskId:'recorded-guidance:'+c.id,skills:skill}});}
if(process.argv.includes('--preflight')){console.log(JSON.stringify({sourceSHA,frames:prepared.length,skillSHA256:hash(skill.source),objectiveUnchanged:true,websiteGET:0,Live:0,model:0}));process.exit(0);}
if(process.env.PRAXIS_RUN_RECORDED_GUIDANCE!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file')))throw Error('MODEL_ONLY_AUTHORIZATION_REQUIRED');
const run=join(root,flag('--run'));await mkdir(run,{recursive:false});
await writeFile(join(run,'started.json'),JSON.stringify({sourceSHA,manifestSHA256:hash(await readFile(join(root,'cases.json'))),skillSHA256:hash(skill.source),selected,startedAt:new Date().toISOString(),maximumTotalCalls:16,websiteGET:0,Live:0},null,2)+'\n',{flag:'wx'});
const transports:unknown[]=[];
const gateway=DeepSeekModelGateway.fromEnvironment(process.env,{fetchImplementation:async(url,init)=>{const u=new URL(String(url));if(u.hostname!=='api.deepseek.com'||init?.method!=='POST'||!['/chat/completions','/beta/chat/completions'].includes(u.pathname))throw Error('MODEL_ONLY_TRANSPORT');transports.push({method:'POST',origin:u.origin,path:u.pathname});await writeFile(join(run,'transport.json'),JSON.stringify(transports,null,2)+'\n');return fetch(url,init);}});
const results:unknown[]=[];
for(const {c,input} of prepared.filter(({c}:any)=>selected.includes(c.id))){
 let response:any;const start=Date.now();
 const model={async complete(request:any){await chargeG6(join(root,'active-budget.json'),'guidance:'+sourceSHA+':'+flag('--run')+':'+c.id,'realModelCalls','User2026-11-13: recorded-context DeepSeek diagnostic; no website GET/Live');await writeFile(join(run,c.id+'.request.json'),JSON.stringify({...request,messages:{sha256:hash(JSON.stringify(request.messages))}},null,2)+'\n',{flag:'wx'});response=await gateway.complete(request);await writeFile(join(run,c.id+'.response.json'),JSON.stringify(response,null,2)+'\n',{flag:'wx'});return response;}};
 try{const decision=new ModelBrowserReadActionDecision(model);const answer=await decision.decide(input);const target=input.observation.targets.find((t:any)=>t.ref===('targetRef'in answer?answer.targetRef:undefined));const passed=c.acceptableActions.some((a:any)=>Object.entries(a).every(([k,v])=>(answer as any)[k]===v));results.push({id:c.id,answer,passed,selectedTarget:target??null,latencyMs:Date.now()-start,usage:response?.usage??null,wire:decision.takeLastWireRecord()});}
 catch(e){results.push({id:c.id,passed:false,status:'FAILED',code:e&&typeof e==='object'&&'code'in e?e.code:'DIAGNOSTIC_ERROR',latencyMs:Date.now()-start});}
 await writeFile(join(run,'results.json'),JSON.stringify({sourceSHA,Live:0,websiteGET:0,results},null,2)+'\n');
}
const keys=Object.entries(process.env).filter(([k,v])=>/KEY|SECRET|TOKEN|PASSWORD/.test(k)&&v&&v.length>=8).map(([,v])=>v!);
const {readdir}=await import('node:fs/promises');let credentialHits=0;for(const f of await readdir(run)){const text=await readFile(join(run,f),'utf8');for(const k of keys)if(text.includes(k))credentialHits++;}
await writeFile(join(run,'credential-scan.json'),JSON.stringify({exactCredentialHits:credentialHits,requestHeadersSaved:false},null,2)+'\n');if(credentialHits)throw Error('CREDENTIAL_SCAN_FAILED');
console.log(JSON.stringify({sourceSHA,results:results.map((r:any)=>({id:r.id,passed:r.passed,action:r.answer?.type,targetRef:r.answer?.targetRef,valueGroupRef:r.answer?.valueGroupRef,code:r.code})),calls:transports.length,Live:0,websiteGET:0}));
