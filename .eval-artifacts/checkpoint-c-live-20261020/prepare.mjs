// Offline preparation only. Mechanical Runner relocation plus transport hooks.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {parseAllDocuments,stringify} from 'yaml';
const base='.eval-artifacts/checkpoint-c-live-20261020';
const sha=b=>createHash('sha256').update(b).digest('hex');
const source='.eval-artifacts/p2-live-set-20261019/variants.yaml';
const bytes=readFileSync(source);
if(sha(bytes)!=='910ba0fdf755392ab1d2a1b0c2da5f9fa8d66a32217c109e8eb5f3b3ee24e8b6')throw Error('APPROVED_VARIANTS_SHA_MISMATCH');
const cases=parseAllDocuments(bytes.toString()).map(d=>d.toJS());
const runnerOnly=process.argv.includes('--runner-only');
if(!runnerOnly){
// Independent literal roster/order oracle, not derived from the production loader.
const ids=['p2l-kf-h001-20261103','p2l-kf-h002-20261107','p2l-kf-h005-20261105','p2l-kf-h003-20261106','p2l-kagurazaka-kaiseki-20261105','p2l-kichijoji-tempura-20261103'];
if(cases.length!==6||ids.some(id=>!cases.some(c=>c.id===id)))throw Error('ROSTER_MISMATCH');
const sequence=[...ids,...ids.slice(2),...ids.slice(0,2),...ids.slice(4),...ids.slice(0,4)];
const runs=sequence.map((id,i)=>({runId:`c-${String(i+1).padStart(2,'0')}`,caseId:id,repeat:sequence.slice(0,i+1).filter(v=>v===id).length,role:cases.find(c=>c.id===id).role}));
writeFileSync(`${base}/plan.json`,JSON.stringify({status:'current executable; exposed development, not Clean Baseline',source,sourceSha256:sha(bytes),runnerInput:base+'/runner-input.yaml',baseCommit:'a3f6b84',evaluator:'restaurant-hybrid-read-diagnostic-evaluator@31',rubric:'restaurant-hybrid-read-diagnostic-rubric@27',ceilings:{timeoutMs:500000,maxModelCalls:50,maxGoogleRequests:40},minGapMs:300000,cooldownMs:900000,maxRerunsPerCase:1,maxTotalReruns:10,runs},null,2)+'\n');
const priorPlan=JSON.parse(readFileSync('.eval-artifacts/p2-1-discovery-20261016/witness-certification-plan.json'));
const old=JSON.parse(readFileSync('.eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json'));
const registrations=cases.map(c=>{
 const prior=old.variants.find(v=>v.variantId===c.derived_from.id);
 const template=priorPlan.variants.find(v=>v.priorRegistry.variantId===c.derived_from.id);
 const center=template?.center??priorPlan.variants.find(v=>v.caseId.includes('h005')).center;
 return {caseId:c.id,variantId:c.id,role:c.role,requestText:c.content.trim(),date:c.semantic.date.value,earliest:c.semantic.time.value??c.semantic.time.start,latest:c.semantic.time.value??c.semantic.time.end,partySize:c.semantic.party_size,center,criteria:c.semantic.criteria,priorRegistry:{path:'.eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json',sha256:sha(readFileSync('.eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json')),variantId:prior.variantId},witnesses:prior.witnesses.map(w=>({outletName:w.outletName,sourceUrl:w.sourceUrl,bookingSource:w.bookingSource,hardEvidence:w.hardEvidence})),status:'PENDING_CURRENT_CERTIFICATION; prior registration is not current inventory or negative-HARD certification'};
});
writeFileSync(`${base}/witness-plan.json`,JSON.stringify({status:'draft / not integrated; certification requires user authorization and independent semantic review',variants:registrations},null,2)+'\n');
}
const runner='src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts';
let text=readFileSync(runner,'utf8');
const replacements=[];
function change(from,to){if(!text.includes(from))throw Error(`RUNNER_DRIFT: ${from}`);text=text.replace(from,to);replacements.push({from,to});}
// Relocate every relative production import without copying any production implementation.
text=text.replace(/from "(\.[^"]+)"/g,(_,p)=>`from "${relative(resolve(base),resolve(dirname(runner),p)).replaceAll('\\','/')}"`);
change('import { preflightSourceIds, runSourceDataPreflight }','import { preflightSourceIds, runSourceDataPreflight as originalSourcePreflight }');
change('environmentWithEffectiveLiveNetwork, resolveEffectiveLiveNetworkConfiguration, runLivePreflight','environmentWithEffectiveLiveNetwork, resolveEffectiveLiveNetworkConfiguration, runLivePreflight as originalNetworkPreflight');
change('customLiveCaseCohort(frozen)', 'checkpointCaseCohort(frozen)');
change('async function runHybridLiveRead(): Promise<void> {','export async function runHybridLiveRead(): Promise<void> {');
change('import { evaluateArtifactAfterFinish, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION', 'import { evaluateArtifactAfterFinish as originalEvaluateArtifactAfterFinish, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION');
change('targets: ["DEEPSEEK", "GOOGLE", "TABELOG", "TABLECHECK"]','targets: ["DEEPSEEK", "GOOGLE", "TABELOG"]');
change("const sourceDataPreflightDirectory=resolve('.eval-artifacts/source-data-preflight',`${Date.now()}-${selectedId}`);","const sourceDataPreflightDirectory=resolve(process.env.CHECKPOINT_C_ATTEMPT!, 'source-preflight');");
change('directory: resolve(".eval-artifacts", "recordings")','directory: resolve(process.env.CHECKPOINT_C_ATTEMPT!, "recordings")');
change('startDiagnosticRun(resolve(".eval-artifacts", "restaurant-hybrid-live-read")','startDiagnosticRun(resolve(process.env.CHECKPOINT_C_ATTEMPT!, "runner")');
change('DeepSeekModelGateway.fromEnvironment(effectiveEnvironment, {','modelTransport(effectiveEnvironment, {');
change('const googleClient = new GooglePlacesClient({','const googleClient = googleTransport({');
change('const rawBrowser = browserRuntimeFromEnvironment(effectiveEnvironment);','const rawBrowser = browserTransport(effectiveEnvironment);');
change('browserTrace.push({ sequence, at: new Date().toISOString(), kind, detail: safeRecord(detail) });','browserTrace.push({ sequence, at: new Date().toISOString(), kind, detail: safeRecord(detail) });\n  observeTrace({ sequence, at: new Date().toISOString(), kind, detail: safeRecord(detail) });');
text=`// Generated by prepare.mjs from ${runner}; see runner-relocation.json. Never edit by hand.\nimport {evaluateArtifactAfterFinish} from './deferred-evaluation.ts';\nimport {networkPreflight as runLivePreflight, sourcePreflight as runSourceDataPreflight, modelTransport, googleTransport, browserTransport, observeTrace, checkpointCaseCohort} from './transports.ts';\n${text}`;
writeFileSync(`${base}/runner-entry.ts`,text);
writeFileSync(`${base}/runner-relocation.json`,JSON.stringify({source:runner,sourceSha256:sha(readFileSync(runner)),generatedSha256:sha(text),changes:replacements,importChange:'relative relocation only; complete production Runner retained'},null,2)+'\n');
console.log(JSON.stringify({runnerOnly,sourceSha256:sha(bytes),network:0,models:0}));
if(!runnerOnly){
const reviewedSource='.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/reviewed-reads.json';
const reviewedBytes=readFileSync(reviewedSource);
if(sha(reviewedBytes)!=='86c2203cba578ec604d5b87745325ad0b4e4d2b65ea08e7d53e8cb746d275f62')throw Error('REVIEWED_READ_RULES_CHANGED');
writeFileSync(`${base}/reviewed-reads.json`,reviewedBytes);
for(const c of cases){if(Object.keys(c).some(k=>!['id','role','derived_from','dataset','parent','reference_time','content','semantic','acceptance'].includes(k)))throw Error('UNKNOWN_APPROVED_METADATA');}
const projected=cases.map(({role,derived_from,...content})=>content);
writeFileSync(`${base}/runner-input.yaml`,projected.map(c=>'---\n'+stringify(c)).join(''));
}

