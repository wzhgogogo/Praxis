import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {RestaurantSemanticInterpreter as Current} from '../../../src/domains/restaurant/semantic-interpreter.ts';
import {compileRestaurantSemanticProposal} from '../../../src/domains/restaurant/semantic-compiler.ts';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {ModelGatewayError} from '../../../src/core/model/errors.ts';

const dir='.eval-artifacts/phase2c-location-semantic-20261023',out=`${dir}/semantic`,mode=process.argv[2],baseline='1a715325f121db137c8e509ce8a2440e55cad968';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p)),put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const cases=(await read(`${out}/replay-inputs.json`)).cases;assert.equal(cases.length,18);
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'phase2c-old-semantic-'));
const sourceDir=path.resolve('src/domains/restaurant');
try{
 for(const file of ['semantic-proposal.ts','semantic-interpreter.ts']){
  const original=execFileSync('git',['show',`${baseline}:src/domains/restaurant/${file}`],{encoding:'utf8'});
  const text=original.replace(/(from\s+["'])(\.[^"']+)(["'])/g,(_s,a,spec,z)=>{
   const target=spec==='./semantic-proposal.js'?path.join(temporary,'semantic-proposal.ts'):path.resolve(sourceDir,spec.replace(/\.js$/,'.ts'));
   return a+pathToFileURL(target).href+z;
  });await fs.writeFile(path.join(temporary,file),text);
 }
 const {RestaurantSemanticInterpreter:Before}=await import(pathToFileURL(path.join(temporary,'semantic-interpreter.ts')).href);
 const inputFor=p=>({taskId:p.id,message:p.message,referenceTime:p.referenceTime,timezone:'Asia/Tokyo'});
 const prepareInput=(c,version,repetition)=>({id:`${c.id}:r${repetition}:${version}`,caseId:c.id,version,repetition,message:c.message,referenceTime:c.referenceTime,source:c.source});
 if(mode==='prepare'){
  globalThis.fetch=()=>{throw Error('PREPARE_NO_NETWORK');};
  const prepared=[];
  for(const c of cases)for(let repetition=1;repetition<=3;repetition++)for(const version of ['before','after']){
   const row=prepareInput(c,version,repetition),requests=[];
   await new (version==='before'?Before:Current)({complete:async request=>{
    requests.push(request);
    if(requests.length===1)return {invocationId:'offline-capture',provider:'FIXTURE',model:'offline',outputText:'invalid capture-only JSON',finishReason:'TOOL_CALLS',latencyMs:0};
    throw new ModelGatewayError('Offline payload capture finished','NETWORK',false);
   }}).interpret(inputFor(row));
   assert.equal(requests.length,2,'Capture both existing schema-attempt envelopes without sending a model call');
   row.attempts=requests.map(request=>({request,sha256:sha(JSON.stringify(request))}));
   const oldSystem=c.originalRequestMessages.find(m=>m.role==='system').content;
   row.originalCapturedSystemMatches=version==='before'?requests[0].messages[0].content===oldSystem:undefined;
   prepared.push(row);
  }
  assert.equal(prepared.length,108);
  await put(`${out}/prepared-requests.json`,{schema:'phase2c-semantic-prepared@1',baseline,plannedTrials:108,maximumRealCalls:150,sourceInputSha256:sha(await fs.readFile(`${out}/replay-inputs.json`)),rows:prepared});
  await put(`${out}/payload-audit.json`,{destination:'https://api.deepseek.com',paths:['/beta/chat/completions'],provider:'Existing repository DeepSeek configuration only',fields:['existing model id','system semantic contract/reference time','original exposed synthetic user request','strict semantic schema','temperature0','thinking disabled','maximum output tokens5000'],notSent:['Gold','review labels','original model answers','Google observations','restaurant pages','API keys except existing authorization header','task id/internal source provenance'],sourceCohorts:{development:6,exposedHoldout1:6,exposedHoldout2:6},plannedTrials:108,preparedEnvelopes:216,maximumRealModelCalls:150,retryRule:'Only the existing interpreter second schema attempt, if required; all such envelopes frozen. No provider/environment retries or extra semantic trials.',restaurantWebsiteRequests:0,GoogleRequests:0,fullLive:0,sourceInputSha256:sha(await fs.readFile(`${out}/replay-inputs.json`)),preparedSha256:sha(await fs.readFile(`${out}/prepared-requests.json`))});
  console.log(JSON.stringify({prepared:prepared.length,envelopes:216,realModelCalls:0,capturedBeforeSystemMatches:prepared.filter(r=>r.version==='before'&&r.originalCapturedSystemMatches).length}));
 }else if(mode==='execute'){
  const freeze=await read(`${out}/execution-freeze.json`);for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`Frozen semantic input changed:${p}`);
  const plan=await read(`${out}/prepared-requests.json`);assert.equal(plan.rows.length,108);
  const executionCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  await put(`${out}/started.json`,{executionCommit,startedAt:new Date().toISOString(),freezeSha256:sha(await fs.readFile(`${out}/execution-freeze.json`)),plannedTrials:108,maximumRealCalls:150});
  let calls=0,current,attemptIndex=0,blocker;const rows=[];
  const configured=await read(`${out}/model-config.json`);
  const realFetch=globalThis.fetch;
  const gateway=DeepSeekModelGateway.fromEnvironment(process.env,{fetchImplementation:async(url,init)=>{
   assert.equal(String(url),'https://api.deepseek.com/beta/chat/completions');assert.equal(init.method,'POST');
   const body=JSON.parse(String(init.body));assert.equal(body.model,configured.model);assert.deepEqual(body.messages,current.attempts[attemptIndex-1].request.messages);
   assert.equal(body.thinking.type,'disabled');return realFetch(url,init);
  }});
  const actualGateway={complete:async request=>{
   assert.ok(calls<150,'PHASE2C_MODEL_CALL_CEILING');
   const expected=current.attempts[attemptIndex++];assert.ok(expected,'No unprepared schema attempt');assert.equal(sha(JSON.stringify(request)),expected.sha256);
   calls++;await fs.appendFile(`${out}/calls.jsonl`,JSON.stringify({call:calls,id:current.id,attempt:attemptIndex,requestSha256:expected.sha256,startedAt:new Date().toISOString()})+'\n');
   try{const response=await gateway.complete(request);await put(`${out}/responses/${String(calls).padStart(3,'0')}.json`,{call:calls,id:current.id,attempt:attemptIndex,requestSha256:expected.sha256,response});return response;}
   catch(e){await put(`${out}/responses/${String(calls).padStart(3,'0')}.json`,{call:calls,id:current.id,attempt:attemptIndex,requestSha256:expected.sha256,errorCode:e.code??'UNCLASSIFIED',diagnostic:e.diagnostic});throw e;}
  }};
  await fs.mkdir(`${out}/responses`);
  for(const row of plan.rows){
   current=row;attemptIndex=0;const start=Date.now(),beforeCalls=calls;
   const result=await new (row.version==='before'?Before:Current)(actualGateway).interpret(inputFor(row));
   const compiled=result.status==='PROPOSED'?compileRestaurantSemanticProposal(result.proposal,{referenceTime:row.referenceTime,timezone:'Asia/Tokyo'}):undefined;
   rows.push({id:row.id,caseId:row.caseId,version:row.version,repetition:row.repetition,source:row.source,message:row.message,referenceTime:row.referenceTime,elapsedMs:Date.now()-start,modelCalls:calls-beforeCalls,result,compiled});
   await fs.writeFile(`${out}/results.json`,JSON.stringify({executionCommit,mode:'REAL_MODEL_FIXED_EXPOSED_TEXT_NO_WEBSITES',planned:108,completed:rows.length,modelCalls:calls,GoogleRequests:0,restaurantWebsiteRequests:0,fullLive:0,rows},null,2)+'\n');
   if(result.status==='MODEL_FAILURE'){blocker=result.errorCode;break;}
   if(calls>=150&&rows.length<108){blocker='MODEL_CALL_CEILING';break;}
   if(rows.length%6===0)console.log(JSON.stringify({completed:rows.length,modelCalls:calls}));
  }
  const afterRows=rows.filter(r=>r.version==='after'),nonProposed=rows.filter(r=>r.result.status!=='PROPOSED');
  await put(`${out}/finished.json`,{executionCommit,finishedAt:new Date().toISOString(),completed:rows.length,planned:108,modelCalls:calls,GoogleRequests:0,restaurantWebsiteRequests:0,fullLive:0,blocker,nonProposed:nonProposed.map(r=>r.id),afterTrials:afterRows.length,status:!blocker&&rows.length===108?'EXECUTED_PENDING_SEMANTIC_REVIEW':'BLOCKED'});
  console.log(JSON.stringify({completed:rows.length,modelCalls:calls,blocker,nonProposed:nonProposed.length}));
  if(blocker)process.exitCode=1;
 }else throw Error('Expected prepare or execute');
}finally{await fs.rm(temporary,{recursive:true,force:true});}
