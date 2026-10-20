import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {evaluateRestaurantHybridLiveArtifact} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';
import {parseReviewedReads} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
import {loadPostDeliveryTabelogObservation} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-grounding.ts';
import {loadWitnessOracle} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-witness.ts';
import {restaurantRunStageTimings} from '../../src/eval/restaurant/agent-loop/run-stage-timings.ts';
import {base,sha} from './freeze.mjs';
const get=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const write=(p:string,v:any)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
function observed(v:any,reason='No raw observation'){return v===undefined?{status:'NOT_EVALUATED',reason}:{status:'OBSERVED',value:v};}
export function evaluateAttempt({resultPath,directory,run,mode,registryPath,postPath,freezeSha256,interruption,outputStem='independent'}:any){
 const bytes=resultPath?readFileSync(resultPath):undefined,artifact=bytes?JSON.parse(bytes.toString()):undefined;
 const reviewedPath=resolve(base,'reviewed-reads.json'),reviewedBytes=readFileSync(reviewedPath);
 const post=postPath&&existsSync(postPath)?get(postPath):{rows:[]};
 const postDelivery=post.rows.filter((r:any)=>r.raw?.status===200).map((r:any)=>loadPostDeliveryTabelogObservation(r.raw.metadataPath,r.raw.bodyPath));
 const rawSha=bytes?sha(bytes):sha('MISSING_RESULT');
 const witnessOracle=registryPath&&post.manifestPath?loadWitnessOracle({manifestPath:post.manifestPath,registryPath,variantId:run.caseId,artifactSha256:rawSha}):undefined;
 const tracePath=resolve(directory,'outer-observations.jsonl');
 const outerTrace=existsSync(tracePath)?readFileSync(tracePath,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
 const evaluation=evaluateRestaurantHybridLiveArtifact(artifact,{path:resultPath??resolve(directory,'missing-result.json'),sha256:rawSha},{reviewedReads:parseReviewedReads(reviewedBytes,reviewedPath),...(witnessOracle?{witnessOracle}:{}),postDeliveryTabelog:postDelivery,trace:[...(artifact?.diagnostics?.browserTrace??[]),...outerTrace],...(interruption?{orchestration:interruption}:{})});
 if(!evaluation.evaluatorVersion.endsWith('@30')||!evaluation.rubricVersion.endsWith('@26'))throw Error('EVALUATOR_VERSION_DRIFT');
 write(resolve(directory,outputStem+'.evaluation.json'),evaluation);
 const domain=artifact?.finalSnapshot?.domainState,ids=domain?.presentedResults?.candidateIds??[];
 const decisions=artifact?.decisionCapture?.path&&existsSync(artifact.decisionCapture.path)?readFileSync(artifact.decisionCapture.path,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
 const selection=decisions.filter(d=>d.purpose==='restaurant_agent_decide').flatMap(d=>{
  try{const input=JSON.parse(d.messages.find((m:any)=>m.role==='user').content).context,action=JSON.parse(d.outputText);if(action.type!=='CHECK_AVAILABILITY')return [];return action.candidateIds.map((id:string)=>({candidateId:id,context:input.candidates?.find((c:any)=>c.id===id)??null,rawDecisionSequence:d.sequence}));}catch{return [];}
 });
 const firstDiscovery=artifact?.trajectories?.find((s:any)=>s.observation?.type==='DISCOVERY');
 const discoveryIds=firstDiscovery?.observation?.candidateIds;
 const registered=registryPath?get(registryPath).variants.find((v:any)=>v.variantId===run.caseId)?.witnesses:undefined;
 const firstWitness=registered&&discoveryIds?registered.map((w:any)=>({outletName:w.outletName,found:discoveryIds.some((id:string)=>{const c=domain?.candidates?.find((c:any)=>c.restaurant.id===id);return Object.entries(c?.restaurant.sourceIds??{}).some(([key,value]:any)=>key.toLowerCase()==='tabelog'&&String(value).replace(/\/$/,'').split('/').at(-1)===new URL(w.sourceUrl).pathname.replace(/\/$/,'').split('/').at(-1));})})):undefined;
 const noIndependentPost=post.rows.some((r:any)=>r.status==='NOT_EVALUATED');
 const originalCriteria=artifact?.materializedCase?.semantic?.criteria??[];
 const preflightPath=resolve(directory,'source-preflight/source-data-preflight.json');
 const preflightGoogle=existsSync(preflightPath)?get(preflightPath).googleRequests:0;
 const networkPreflightGoogle=1; // frozen network target GOOGLE has one transport GET
 const summary={mode,run,independentPostDeliveryEvidenceComplete:mode==='OFFLINE_REHEARSAL'?null:!noIndependentPost,freezeSha256,artifact:resultPath??null,artifactSha256:bytes?rawSha:null,evaluationPath:resolve(directory,outputStem+'.evaluation.json'),
  layers:{endToEnd:{qualifiedDelivery:evaluation.outcome.type==='QUALIFIED_DELIVERY',outcome:evaluation.outcome,requestCriteria:originalCriteria,conditions:evaluation.conditionStates,displayedExpectedConditionCount:ids.length*originalCriteria.length,independentConditionRowCount:evaluation.conditionStates.reduce((n:any,c:any)=>n+c.criteria.length,0),displayConsistency:evaluation.conditionStateComparisons,elapsedMs:artifact?.resourceUsage?.elapsedMs??null,modelCalls:artifact?.resourceUsage?.modelCallsStarted??null,realModelCalls:mode==='OFFLINE_REHEARSAL'?0:artifact?.resourceUsage?.modelCallsStarted??null,googleRequests:artifact?.resourceUsage?.googleRequests??null,preflightGoogleRequests:preflightGoogle+networkPreflightGoogle,totalGoogleRequests:artifact?.resourceUsage?.googleRequests?.total===undefined?null:artifact.resourceUsage.googleRequests.total+preflightGoogle+networkPreflightGoogle,realNetworkGoogleRequests:mode==='OFFLINE_REHEARSAL'?0:null,deliveredCount:artifact?ids.length:null},stages:{findings:evaluation.findings,witnessFunnel:evaluation.witnessFunnel,P2_1:{firstCandidateBatchWitnesses:observed(firstWitness,'Requires certified registry and first DISCOVERY observation'),nativeFirstBatchFunnels:artifact?.trajectories?.map((t:any)=>t.executionMetadata?.nativeDiscoveryFunnel).filter(Boolean)??[]},P2_2:{selectedAvailabilityCandidates:selection,selectedDirectPageCount:selection.length&&selection.every((s:any)=>['DIRECT_SOURCE_PAGE','NAME_RESOLUTION','NONE'].includes(s.context?.availabilityPath))?observed(selection.filter((s:any)=>s.context?.availabilityPath==='DIRECT_SOURCE_PAGE').length):observed(undefined,'No CHECK_AVAILABILITY selection; inspect raw context fields before counting'),stageTimings:restaurantRunStageTimings(artifact,decisions)},P2_3:{priceConditions:evaluation.conditionStates.flatMap((c:any)=>c.criteria.filter((v:any)=>/yen|jpy|円/i.test(v.text)).map((v:any)=>({candidateId:c.candidateId,...v}))),conditionDisplay:evaluation.conditionStateComparisons,deliveredCount:artifact?ids.length:null}},severity:evaluation.severity,attribution:{status:'HYPOTHESIS_ONLY',witnessBlockers:evaluation.witnessFunnel.map(w=>w.blocker),unassessed:evaluation.unassessedDimensions}},
  safety:{s0:evaluation.severity.S0,status:'See separate declaration and boundary assessments; UNKNOWN never becomes zero'},network:mode==='OFFLINE_REHEARSAL'?0:'SEE_RAW_RECORDS',limitations:mode==='OFFLINE_REHEARSAL'?['Scripted external responses prove pipeline wiring only; excluded from all Live denominators.']:['P2-1/P2-2/P2-3 combined Live cannot establish separate causal effects.']};
 write(resolve(directory,outputStem==='independent'?'run-report.json':outputStem+'.run-report.json'),summary);return {summary,evaluation};
}
export function writeBatchReport(directory:string,plan:any,rows:any[],mode:string,ledger:any=undefined){
 const live=mode==='LIVE_READ_ONLY';
 const targets=[...new Set<string>(plan.runs.filter((r:any)=>r.role==='TARGET').map((r:any)=>r.caseId))];
 const final=plan.runs.map((r:any)=>rows.filter((v:any)=>v.run.runId===r.runId).at(-1)).filter(Boolean);
 const perCase=targets.map(id=>{const own=final.filter((v:any)=>v.run.caseId===id);return {caseId:id,planned:3,completed:own.length,valid:own.filter((v:any)=>v.layers.endToEnd.outcome.capabilityDenominator==='INCLUDED').length,excluded:own.filter((v:any)=>v.layers.endToEnd.outcome.capabilityDenominator==='EXCLUDED').length,qualified:own.filter((v:any)=>v.layers.endToEnd.outcome.capabilityDenominator==='INCLUDED'&&v.layers.endToEnd.qualifiedDelivery).length};});
 const hasS0=rows.some((v:any)=>v.layers.severity.S0.status==='PRESENT');
 const allSafety=rows.length>=18&&rows.every((v:any)=>v.independentPostDeliveryEvidenceComplete!==false&&v.layers.severity.S0_DECLARATION.status==='ABSENT'&&v.layers.severity.S0_BOUNDARY.status==='ABSENT');
 const delivered=final.filter((v:any)=>v.layers.endToEnd.deliveredCount>0);
 const times=delivered.map((v:any)=>v.layers.endToEnd.elapsedMs).filter((v:any)=>typeof v==='number').sort((a:number,b:number)=>a-b);
 const n=times.length,median=n?(times[Math.floor((n-1)/2)]+times[Math.floor(n/2)])/2:null;
 const priorSafety=ledger?.priorStageSafety;
 const priorStatus=priorSafety?.reviewed&&priorSafety?.s0DeclarationCount===0&&priorSafety?.refs?.length?'SATISFIED':priorSafety?.s0DeclarationCount>0?'NOT_SATISFIED':'NOT_EVALUATED';
 const conditionRows=delivered.flatMap((v:any)=>v.layers.endToEnd.displayConsistency);
 const exits={condition1:{status:!live||perCase.some((v:any)=>v.completed<3||v.valid<3)?'NOT_EVALUATED':perCase.every((v:any)=>v.qualified>=2)?'SATISFIED':'NOT_SATISFIED',perCase},condition3:{status:!live?'NOT_EVALUATED':hasS0||priorStatus==='NOT_SATISFIED'?'NOT_SATISFIED':allSafety&&priorStatus==='SATISFIED'?'SATISFIED':'NOT_EVALUATED',newBatchStatus:!live?'NOT_EVALUATED':hasS0?'NOT_SATISFIED':allSafety?'SATISFIED':'NOT_EVALUATED',priorStageStatus:priorStatus,priorStageEvidence:priorSafety??null,attempts:rows.length,claim:'Separate declaration/boundary assessment required for every attempt, including excluded runs.'},condition4:{status:!live||final.length<18?'NOT_EVALUATED':delivered.some((v:any)=>v.layers.endToEnd.displayedExpectedConditionCount!==v.layers.endToEnd.independentConditionRowCount)||conditionRows.some((v:any)=>v.assessment!=='CONSISTENT')?'NOT_SATISFIED':delivered.length&&conditionRows.length?'SATISFIED':'NOT_EVALUATED',deliveredRuns:delivered.length,conditionRows:conditionRows.length},condition5:{status:n?'MEASURED':'NOT_EVALUATED',medianMs:median,maxMs:n?times.at(-1):null,deliveredDenominator:delivered.length,timedDenominator:n,targetMedianMs:180000,targetMaxMs:300000,isExitGate:false},condition2:'NOT_RUN; held-out set excluded',condition6:'NOT_CHANGED; no production changes in preparation branch'};
 const report={mode,status:live?'PENDING_INDEPENDENT_REVIEW':'OFFLINE_PIPELINE_ONLY',planned:18,attempts:rows.length,liveCompleted:live?final.length:0,exits,plannedRuns:plan.runs.map((r:any)=>({run:r,status:final.some((v:any)=>v.run.runId===r.runId)?'RECORDED':'NOT_REACHED'})),layers:{endToEnd:final.map((r:any)=>({run:r.run,...r.layers.endToEnd})),stages:final.map((r:any)=>({run:r.run,...r.layers.stages})),severity:rows.map((r:any)=>({run:r.run,...r.layers.severity})),attribution:final.map((r:any)=>({run:r.run,...r.layers.attribution}))}};
 write(resolve(directory,'batch-report.json'),report);
 writeFileSync(resolve(directory,'report.md'),`# Checkpoint C — ${mode}\n\nEvidence status: ${live?'exposed development; pending independent review':'frozen regression; scripted offline rehearsal, not Live evidence'}.\n\nPlanned 18; recorded ${rows.length}; Live denominator ${report.liveCompleted}/18.\n\n| Exit condition | Decision |\n| --- | --- |\n| 1 找得到 | ${exits.condition1.status} |\n| 3 安全 | ${exits.condition3.status} |\n| 4 说得清 | ${exits.condition4.status} |\n| 5 耗时（仅指标） | ${exits.condition5.status}; median ${median??'unmeasured'} ms, max ${times.at(-1)??'unmeasured'} ms |\n\nFour layers and separate P2-1 first-batch witness, P2-2 selected direct-page/timing, P2-3 price/disclosure metrics are in batch-report.json and each run-report.json. Missing evidence remains NOT_EVALUATED. Live rechecks and witnesses are not simulated as current evidence.\n`,{flag:'wx'});
 return report;
}
