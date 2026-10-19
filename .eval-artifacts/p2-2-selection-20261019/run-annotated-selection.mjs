import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { DeepSeekModelGateway } from '../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import { availabilityPathInjectedRequest, capturedReplayAction } from '../../src/eval/restaurant/agent-loop/runners/run-decision-replay.ts';
import { normalizeRestaurantAgentActionStrictWire } from '../../src/domains/restaurant/agent-action.ts';
import { assessSelectionReplay } from '../../src/eval/restaurant/agent-loop/selection-replay-assessment.ts';

const base = '.eval-artifacts/p2-2-selection-20261019';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const planPath = `${base}/model-run-plan.json`, plan = JSON.parse(await fs.readFile(planPath));
const freeze = JSON.parse(await fs.readFile(`${base}/model-run-freeze.json`));
const verify = async () => { for (const [path, hash] of Object.entries(freeze.files)) if (sha(await fs.readFile(path)) !== hash) throw Error(`FROZEN_INPUT_CHANGED:${path}`); };
await verify();
execFileSync('git',['diff','--exit-code','HEAD','--','src',planPath,`${base}/run-annotated-selection.mjs`,`${base}/model-run-freeze.json`],{stdio:'pipe'});
const commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const annotations = JSON.parse(await fs.readFile(`${base}/seed-annotations.reviewer.json`));
const contracts = JSON.parse(await fs.readFile(`${base}/selection-contracts.json`));
const oldAnnotations = JSON.parse(await fs.readFile(`${base}/seed-annotations.rev1.frozen.json`));
const oldContracts = JSON.parse(await fs.readFile(`${base}/selection-contracts.rev1.json`));
if (annotations.revision !== 2 || plan.annotationRevision !== 2) throw Error('APPROVED_REVISION2_REQUIRED');
const original = JSON.parse(await fs.readFile('.eval-artifacts/phase1-replay/seeds.v7.json')).seeds;
const pending = JSON.parse(await fs.readFile(`${base}/selection-seeds.pending.json`)).seeds;
const prepared = [];
for (const id of plan.selectedSeedIds) {
  const annotation = annotations.annotations.find(row => row.seedId === id && row.labelStatus === 'ANNOTATED');
  if (!annotation) throw Error(`INDEPENDENT_ANNOTATION_REQUIRED:${id}`);
  const rules = contracts.rules.filter(row => row.seedId === id);
  if (!annotation.acceptableActions.every(action => rules.some(rule => rule.type === action.type && rule.when === action.when))) throw Error(`FULL_CONDITIONS_NOT_COMPILED:${id}`);
  const seed = original.find(row => row.seedId === id) ?? pending.find(row => row.seedId === id);
  const row = seed.origin
    ? (await fs.readFile(seed.origin.runArtifact,'utf8')).split(/\n/).filter(Boolean).map(line => JSON.parse(line)).find(row => row.sequence === seed.origin.decisionIndex)
    : JSON.parse(await fs.readFile(seed.decision));
  const resultPath = seed.origin?.resultArtifact ?? seed.originalResult;
  const artifact = JSON.parse(gunzipSync(await fs.readFile(resultPath)).toString());
  const observed = new Map();
  for (const event of artifact.events) {
    if (event.event.type === 'SEARCH_COMPLETED' && event.occurredAt <= row.startedAt) {
      for (const candidate of event.event.candidates) observed.set(candidate.restaurant.id,candidate.restaurant);
    }
  }
  const context = JSON.parse(row.messages.find(message => message.role === 'user').content).context;
  const outlets = [...observed.values()].filter(outlet => context.candidates.some(candidate => candidate.id === outlet.id));
  const request = availabilityPathInjectedRequest({...seed,seedId:id,level:'AGENT'},row,outlets);
  const beforeAction = capturedReplayAction({...seed,level:'AGENT'},row);
  const before = assessSelectionReplay(beforeAction,context,outlets,annotation,rules,contracts.radiusMeters);
  if (before.verdict !== annotation.recordedActionVerdict) throw Error(`RECORDED_LABEL_RECONSTRUCTION_MISMATCH:${id}`);
  prepared.push({id,annotation,rules,request,context,outlets,beforeAction,before,requestSha256:sha(JSON.stringify(request))});
}
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({status:'INPUTS_VERIFIED_NO_MODEL',commit,inputs:prepared.map(item => ({seedId:item.id,requestSha256:item.requestSha256,candidates:item.context.candidates.length,before:item.before,timeoutMs:item.request.timeoutMs})),models:0},null,2));
  process.exit(0);
}
await fs.mkdir(plan.outputDirectory); // no overwrite/retry
const ledgerPath = `${base}/model-ledger.json`;
let ledger;
try { ledger = JSON.parse(await fs.readFile(ledgerPath)); } catch(error) { if(error.code!=='ENOENT')throw error; ledger={schema:'p22-model-ledger@1',maxCalls:30,calls:[]}; }
if (ledger.calls.length + prepared.length > plan.maxCallsTotal) throw Error('P22_MODEL_BUDGET_EXHAUSTED');
const originalFetch = globalThis.fetch;
globalThis.fetch = (url,init) => {
  const target = new URL(String(url));
  if (target.protocol !== 'https:' || target.hostname !== 'api.deepseek.com' || init?.method !== 'POST') throw Error('REPLAY_ONLY_DEEPSEEK_GENERATION_ALLOWED');
  return originalFetch(url,init);
};
const gateway = DeepSeekModelGateway.fromEnvironment(process.env), results=[];
for (const item of prepared) {
  await fs.writeFile(`${plan.outputDirectory}/${item.id}.request.json`,JSON.stringify(item.request,null,2),{flag:'wx'});
  const call={call:ledger.calls.length+1,seedId:item.id,startedAt:new Date().toISOString(),codeCommit:commit,requestSha256:item.requestSha256,status:'STARTED'};
  ledger.calls.push(call); await fs.writeFile(ledgerPath,JSON.stringify(ledger,null,2));
  await fs.writeFile(`${plan.outputDirectory}/${item.id}.dispatch.json`,JSON.stringify(call,null,2),{flag:'wx'});
  let afterAction=null,errorCode=null,finishReason=null,wireText=null;
  try {
    const response=await gateway.complete(item.request);finishReason=response.finishReason;wireText=response.outputText;
    call.latencyMs=response.latencyMs;call.usage=response.usage;call.model=response.model;
    if(response.finishReason!=='TOOL_CALLS')throw Object.assign(Error('Invalid finish reason'),{code:'MODEL_OUTPUT_REJECTED'});
    const decoded=normalizeRestaurantAgentActionStrictWire(JSON.parse(response.outputText));
    if(!decoded.valid)throw Object.assign(Error('Invalid model wire'),{code:'MODEL_OUTPUT_REJECTED'});
    afterAction=decoded.value;
    call.status='SUCCEEDED';
  } catch(error) {
    errorCode=typeof error?.code==='string'?error.code:'MODEL_REPLAY_FAILED';call.status='FAILED';
  }
  call.finishedAt=new Date().toISOString();call.errorCode=errorCode;
  const before=item.before;
  const after=afterAction?assessSelectionReplay(afterAction,item.context,item.outlets,item.annotation,item.rules,contracts.radiusMeters):{verdict:'NO_ACTION',reasons:[errorCode]};
  const selectedWitness=(action) => {
    const witnesses=plan.witnessSourceUrls[item.id];
    if(!witnesses?.length)return {status:'NOT_EVALUATED',reason:'No frozen witness URLs for this seed.'};
    const key=url=>{const u=new URL(url);return u.hostname==='tabelog.com'?`tabelog:${u.pathname.match(/\/(\d+)(?:\/|$)/)?.[1]}`:`tablecheck:${u.pathname.replace(/^\/(?:en|ja)\/(?:shops\/)?/,'').split('/')[0]}`;};
    const expected=new Set(witnesses.map(key));
    return {status:'EVALUATED',selected:(action?.candidateIds??[]).some(id=>{
      const source=item.outlets.find(outlet=>outlet.id===id)?.sourceIds??{};
      return [source.tabelogNativeDetailUri,source.tablecheckNativeGuideUri,source.googleWebsiteUri].filter(Boolean).some(url=>{try{return expected.has(key(url));}catch{return false;}});
    }),scope:'Historical witness selection only, not current inventory or delivery.'};
  };
  const oldAnnotation = oldAnnotations.annotations.find(annotation => annotation.seedId === item.id);
  const oldRules = oldContracts.rules.filter(rule => rule.seedId === item.id);
  const oldStrictComparison = oldAnnotation ? {
    status:'EVALUATED_ON_SAME_OUTPUT_NO_ADDITIONAL_CALL',annotationRevision:1,
    before:assessSelectionReplay(item.beforeAction,item.context,item.outlets,oldAnnotation,oldRules,oldContracts.radiusMeters),
    after:afterAction?assessSelectionReplay(afterAction,item.context,item.outlets,oldAnnotation,oldRules,oldContracts.radiusMeters):{verdict:'NO_ACTION',reasons:[errorCode]},
  } : {status:'NOT_APPLICABLE',reason:'No revision1 annotation existed for this newly annotated seed.'};
  const result={seedId:item.id,codeCommit:commit,inputSha256:item.requestSha256,annotationRevision:2,scenario:item.annotation.scenario,oldStrictComparison,beforeAction:item.beforeAction,before,afterAction,after,finishReason,wireText,errorCode,
    witnessSelection:{before:selectedWitness(item.beforeAction),after:selectedWitness(afterAction)},
    scope:'One captured Agent decision only; no action executed, no restaurant requests or inventory acceptance.'};
  await fs.writeFile(`${plan.outputDirectory}/${item.id}.result.json`,JSON.stringify(result,null,2),{flag:'wx'});
  await fs.writeFile(ledgerPath,JSON.stringify(ledger,null,2));results.push(result);
  if (errorCode) break; // no blind retries or extra calls
}
await verify();
const accepted = id => results.find(row=>row.seedId===id)?.after.verdict === 'ACCEPTABLE';
const shibuyaIds=['p1-seed-0134','p22-selection-002','p22-selection-003'];
const gate = {
  kagurazaka:{required:1,passed:Number(accepted('p22-selection-001'))},
  shibuya:{required:2,passed:shibuyaIds.filter(accepted).length,total:3,independence:'Near-duplicates of one scenario, not three independent scenarios.'},
  control:{required:1,passed:Number(accepted('p1-seed-0133'))},
};
gate.verdict=results.length!==prepared.length?'INCOMPLETE':gate.kagurazaka.passed===1&&gate.shibuya.passed>=2&&gate.control.passed===1?'PASS':'FAIL';
const summary={codeCommit:commit,modelCalls:ledger.calls.length,budgetMax:plan.maxCallsTotal,annotationRevision:2,websites:0,google:0,live:0,
  results:results.map(row=>({seedId:row.seedId,scenario:row.scenario,before:row.before,after:row.after,oldStrictComparison:row.oldStrictComparison,witnessSelection:row.witnessSelection,errorCode:row.errorCode})),gate,
  scope:'Captured single Agent decisions only. This selection gate does not prove current website access, inventory, full delivery or checkpoint C.'};
await fs.writeFile(`${plan.outputDirectory}/summary.json`,JSON.stringify(summary,null,2),{flag:'wx'});
console.log(JSON.stringify(summary,null,2));
