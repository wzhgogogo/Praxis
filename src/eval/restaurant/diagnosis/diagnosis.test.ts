import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { evaluateArtifactAfterFinish, evaluateRestaurantHybridLiveArtifact } from "../agent-loop/diagnostic-evaluator.js";
import { evaluatorImportViolation } from "../../shared/evaluator-import-rule.js";
import { buildRunDiagnosis, summarizeDiagnoses } from "./report.js";
import type { DiagnosisContext, TurnAssessments } from "./report.js";
import { writeRecordedDiagnosis, writeDiagnosisAfterEvaluation, generateRecordedDiagnoses } from "./files.js";
import { pointer, record } from "./records.js";
import type { RecordValue } from "./records.js";
import type { ExperienceGold } from "./experience.js";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const at = (ms: number) => new Date(Date.parse("2026-11-02T10:00:00Z") + ms).toISOString();
function recordedRun() {
  return { runId: "controlled-run", caseId: "controlled-case", startedAt: at(0), finishedAt: at(5000),
    status: "SUCCEEDED", stage: "AGENT_LOOP", materializedCase: { semantic: { target: { goal: "RECOMMENDATION" }, criteria: [] } },
    finalSnapshot: { version: 1, domainState: { phase: "NO_VERIFIED_RESULT", intentDraft: { target: { goal: "RECOMMENDATION" }, criteria: [] },
      candidates: [], availability: {}, availabilityChecks: {}, readEvidence: [] } }, trajectories: [], events: [], loop: { status: "TERMINAL" } };
}

test("actual post-finish evaluation automatically saves diagnosis without changing its verdict or original artifact", async () => {
  const directory = await mkdtemp(join(tmpdir(), "run-diagnosis-hook-"));
  try {
    const path = join(directory, "result.json"), raw = JSON.stringify(recordedRun());
    await writeFile(path, raw);
    const outcome = await evaluateArtifactAfterFinish(path);
    assert.ok(outcome.evaluation && outcome.outputPath, "normal control: the actual evaluator saved its result");
    assert.equal(await readFile(path, "utf8"), raw);
    const diagnoses = (await readdir(directory)).filter(name => name.endsWith(".diagnosis.json"));
    assert.equal(diagnoses.length, 1, "post-finish evaluation must write one diagnosis JSON sidecar");
    const report = JSON.parse(await readFile(join(directory, diagnoses[0]!), "utf8"));
    assert.deepEqual(report.summary.outcome, outcome.evaluation.outcome);
    assert.deepEqual(report.summary.severity, outcome.evaluation.severity);
    assert.deepEqual(JSON.parse(await readFile(outcome.outputPath, "utf8")), outcome.evaluation);
    assert.equal(report.inputs.artifact.sha256, hash(raw));
    assert.ok((await readdir(directory)).some(name => name.endsWith(".diagnosis.md")));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

function controlled(artifact:unknown,context:DiagnosisContext={}) {
  const raw=JSON.stringify(artifact),source={path:"controlled-result.json",sha256:hash(raw)};
  const evaluation=evaluateRestaurantHybridLiveArtifact(artifact,source);
  return {evaluation,report:buildRunDiagnosis({artifact,evaluation,source,evaluationSource:{path:"controlled-evaluation.json",sha256:hash(JSON.stringify(evaluation))},context})};
}
async function saved(id:string){
  const inventory=JSON.parse(await readFile(new URL("../../../../.eval-artifacts/phase3b/run-diagnosis-report-20261102/calibration-inputs.draft.json",import.meta.url),"utf8"));
  const row=inventory.primary.find((row:{runId:string})=>row.runId===id);
  const root=new URL("../../../../",import.meta.url);
  const bytes=await readFile(new URL(row.artifact.path,root)),artifact=JSON.parse(gunzipSync(bytes).toString());
  const eb=await readFile(new URL(row.evaluation.path,root)),evaluation=JSON.parse(eb.toString());
  return {artifact,evaluation,source:{path:row.artifact.path,sha256:row.artifact.payloadSha256},evaluationSource:{path:row.evaluation.path,sha256:hash(eb.toString())}};
}

test("three reporting columns preserve confirmed scope, feasible witness coverage and permanent hypotheses",async()=>{
  const normal=await saved("p1fA-kf-h001-a1"),report=buildRunDiagnosis(normal);
  assert.equal(report.firstPoint.status,"NO_CONFIRMED_DEVIATION");
  assert.ok(report.hypothesizedBottlenecks.some(x=>x.stage==="FACTS_HARD"));
  assert.ok(report.hypothesizedBottlenecks.every(x=>x.certainty==="HYPOTHESIS"));
  assert.deepEqual(report.witnessFunnel,normal.evaluation.witnessFunnel);
  assert.deepEqual(report.summary.outcome,normal.evaluation.outcome);
  const drift=await saved("p1fA-kf-h004-a1"),d=buildRunDiagnosis(drift);
  assert.equal(d.firstConfirmedDeviation?.stage,"UNDERSTANDING");assert.equal(d.firstPoint.stage,"UNDERSTANDING");
  assert.equal(record(d.summary.outcome).type,"QUALIFIED_DELIVERY","R1 result stays qualified despite confirmed process drift");
  const missed=await saved("p1fA-kagurazaka-a1"),m=buildRunDiagnosis(missed);
  assert.equal(m.firstPoint.column,"WITNESS_COVERAGE");assert.equal(m.firstPoint.stage,"DISCOVERY");
  assert.ok(m.witnessCoverageObservations.every(x=>x.certainty==="CONFIRMED"));
  // A reporting fixture mutation, not a new grader: removing feasibility must
  // demote the same old blocker to the hypothesis column only.
  const unknown=structuredClone(missed);for(const row of unknown.evaluation.witnessFunnel)row.feasible="NOT_EVALUATED";
  unknown.evaluationSource={path:"test-only-mutated-evaluation.json",sha256:hash(JSON.stringify(unknown.evaluation))};
  const h=buildRunDiagnosis(unknown);assert.equal(h.witnessCoverageObservations.length,0);assert.equal(h.firstPoint.certainty,"HYPOTHESIS");
  const observed=structuredClone(normal);
  // Test-only saved-output mutation: a blocker alone cannot create an absent
  // stage when every corresponding recorded coverage field says observed.
  for(const row of observed.evaluation.witnessFunnel){row.facts.status="OBSERVED";row.blocker.stage="IDENTITY";}
  observed.evaluationSource={path:"test-only-observed-evaluation.json",sha256:hash(JSON.stringify(observed.evaluation))};
  const blockerOnly=buildRunDiagnosis(observed);
  assert.equal(blockerOnly.witnessCoverageObservations.length,0,"blocker hypotheses must not become confirmed coverage gaps");
  assert.ok(blockerOnly.hypothesizedBottlenecks.every(x=>x.certainty==="HYPOTHESIS"));
  const noOracle=buildRunDiagnosis({artifact:{},source:{path:"empty.json",sha256:hash("{}")}});
  assert.equal(noOracle.firstPoint.status,"NOT_EVALUATED");assert.equal(noOracle.firstConfirmedDeviation,null);
});

test("main multi-turn artifacts reach the five follow-up nodes without inventing independent verdicts",async()=>{
  const frame=JSON.parse(gunzipSync(await readFile(new URL("../../../../.eval-artifacts/phase3b/b1-card-terms-20261101/final-compositions/TABELOG-proactive.json.gz",import.meta.url))).toString());
  const a=buildRunDiagnosis({artifact:frame,source:{path:"proactive.json",sha256:hash(JSON.stringify(frame))}});
  for(const id of ["SELECTION","B1_HANDOFF","CARD_TERMS","QUESTION_PAGE"]){
    const n=a.stages.find(n=>n.id===id)!;assert.equal(n.reach,"REACHED",id);assert.equal(n.assessment,"NOT_EVALUATED");
    assert.ok(n.refs.length);for(const ref of n.refs)assert.notEqual(pointer(frame,ref.pointer),undefined);
  }
  const raw=await readFile(new URL("../../../../.eval-artifacts/phase3b/b1-card-terms-20261101/admitted-artifact/preflight.json",import.meta.url),"utf8"),artifact=JSON.parse(raw);
  const independent=await readFile(new URL("../../../../.eval-artifacts/phase3b/b1-card-terms-20261101/independent-evaluation.json",import.meta.url),"utf8");
  const b=buildRunDiagnosis({artifact,source:{path:"admitted.json",sha256:hash(raw)},context:{independentNotes:[{source:{path:"C-independent.json",sha256:hash(independent)},scope:"Original admitted answer quotation and binding checks only",content:JSON.parse(independent)}]}});
  assert.equal(b.stages.find(n=>n.id==="QUESTION_ANSWER")?.reach,"REACHED");
  assert.equal(b.stages.find(n=>n.id==="QUESTION_ANSWER")?.assessment,"NOT_EVALUATED");assert.equal(b.independentNotes.length,1);
  assert.ok(b.experience.timing.turnResponses.every(x=>x.metric.status==="NOT_EVALUATED"),"frozen fixture business timestamps are not real zero waits");
});

test("four existing supported presentations reproduce the independent 99/122/292/208 second observation references",async()=>{
  for(const [id,observation,presentation]of [["p1fA-kf-h001-a1",99,128],["p1fA-kf-h002-a1",122,149],["p1fA-kf-h004-a1",292,304],["p1fA-nakameguro-a1",208,247]]as const){
    const report=buildRunDiagnosis(await saved(id));
    assert.notEqual(report.experience.timing.firstSupportedObservationComplete.value,null);
    assert.ok(Math.abs(report.experience.timing.firstSupportedObservationComplete.value!/1000-observation)<=2,id);
    assert.ok(Math.abs(report.experience.timing.firstServerPresentation.value!/1000-presentation)<=2,id);
    assert.ok(report.experience.timing.absoluteTimesCET.serverPresentation?.endsWith("+01:00"));
  }
});

test("A output interface reads explicitly labelled test inputs and rejects wrong artifact or unlabelled test grading",()=>{
  const artifact=recordedRun(),source={path:"interface-fixture.json",sha256:hash(JSON.stringify(artifact))};
  const sample:TurnAssessments={schema:"run-stage-assessments@1",artifactSha256:source.sha256,origin:"TEST_INTERFACE_SAMPLE",producer:{path:"test-only-A-output.json",sha256:hash("test-only")},stages:[
    {stage:"B1_HANDOFF",status:"DEVIATED",certainty:"CONFIRMED",scope:"test turn",reason:"Interface fixture only; not a grader",refs:[{...source,pointer:"/finalSnapshot"}]},
    {stage:"CARD_TERMS",status:"BLOCKED_BY_UPSTREAM",certainty:"CONFIRMED",scope:"test turn",reason:"Explicit supplied causal relation",refs:[{...source,pointer:"/finalSnapshot"}],blockedBy:"A-output:stage:0"},
  ]};
  assert.throws(()=>buildRunDiagnosis({artifact,source,context:{turnAssessments:sample}}),/TEST_STAGE_INPUT_IS_NOT_A_GRADER/);
  const result=buildRunDiagnosis({artifact,source,context:{turnAssessments:sample,allowTestInterfaceSample:true}});
  assert.equal(result.testInterfaceInput,true);assert.equal(result.firstPoint.stage,"B1_HANDOFF");assert.equal(result.downstreamBlocked.length,1);assert.equal(result.confirmedDeviations.length,1);
  assert.throws(()=>buildRunDiagnosis({artifact,source,context:{turnAssessments:{...sample,artifactSha256:hash("other")},allowTestInterfaceSample:true}}),/SCOPE_MISMATCH/);
});

function clarificationControl(given:boolean,ask:boolean,insert:boolean){
  const artifact={...recordedRun(),beforeIntent:given?{date:"2026-11-11"}:{}};
  const intent=artifact.finalSnapshot.domainState.intentDraft as RecordValue;
  if(insert)intent.date="2026-11-11";
  const raw=artifact as unknown as RecordValue;
  raw.trajectories=ask?[{stepOutcome:"EXECUTED",agentAction:{type:"ASK_USER",question:"What date?",relatedFields:["DATE"]}}]:[];
  const gold:ExperienceGold={artifactSha256:hash(JSON.stringify(artifact)),clarification:{completeHistory:true,providedFields:given?{date:{value:"2026-11-11",ref:"frozen-user-message:date"}}:{},requiredMissingFields:given?[]:["date"],beforePointer:"/beforeIntent",afterPointer:"/finalSnapshot/domainState/intentDraft"},ordering:null};
  return controlled(artifact,{experienceGold:gold,goldSource:{path:"frozen-experience-gold.json",sha256:hash(JSON.stringify(gold))}});
}
test("date already supplied versus genuinely missing has paired extra and missing-question observations",()=>{
  const excess=clarificationControl(true,true,true),normal=clarificationControl(true,false,true);
  assert.equal(excess.report.experience.clarifications.excess.value,1);assert.equal(normal.report.experience.clarifications.excess.value,0);
  const missing=clarificationControl(false,false,true),asked=clarificationControl(false,true,false);
  assert.equal(missing.report.experience.clarifications.missing.value,1);assert.equal(asked.report.experience.clarifications.missing.value,0);
  assert.deepEqual(missing.report.summary.outcome,missing.evaluation.outcome);assert.deepEqual(missing.report.summary.severity,missing.evaluation.severity);
  assert.equal(missing.report.experience.gateEffect,"NONE");assert.equal(controlled(recordedRun()).report.experience.clarifications.missing.value,null);
});

function orderingControl(selected:string[],withDistance=true,userRequest="Find the nearest restaurant."){
  const artifact={...recordedRun(),rankingSources:[{candidateId:"a",sourceUrl:"https://fixture.test/a",observedAt:at(0),distanceMeters:100},{candidateId:"b",sourceUrl:"https://fixture.test/b",observedAt:at(0),distanceMeters:500}]};
  (artifact.finalSnapshot.domainState as RecordValue).presentedResults={candidateIds:selected,evidenceIds:[],presentedAt:at(4000)};
  if(!withDistance)delete (artifact.rankingSources[0] as RecordValue).distanceMeters;
  const gold:ExperienceGold={artifactSha256:hash(JSON.stringify(artifact)),ordering:{metric:"DISTANCE_METERS",candidateIds:["a","b"],observations:[0,1].map(i=>({candidateId:i?"b":"a",valuePointer:`/rankingSources/${i}/distanceMeters`,sourcePointer:`/rankingSources/${i}`}))}};
  return controlled(artifact,{experienceGold:gold,userRequest});
}
test("explicit nearest checks sourced values, missing distance stays unassessed, and near does not mean nearest",()=>{
  assert.equal(orderingControl(["b"]).report.experience.explicitOrdering.status,"DEVIATED");
  assert.equal(orderingControl(["a"]).report.experience.explicitOrdering.status,"PASSED");
  assert.equal(orderingControl(["b","a"]).report.experience.explicitOrdering.status,"DEVIATED");
  assert.equal(orderingControl(["a"],false).report.experience.explicitOrdering.status,"NOT_EVALUATED");
  const normal=controlled(recordedRun(),{userRequest:"Find a restaurant near my office."});
  assert.equal(normal.report.experience.explicitOrdering.status,"NOT_APPLICABLE");
  assert.deepEqual(normal.report.summary.outcome,normal.evaluation.outcome);
});

test("recorded source/model time and reload ratios require real timestamps and complete URL scope",()=>{
  const artifact={...recordedRun(),sourceTrace:{navigations:["https://fixture.test/a","https://fixture.test/a"]},diagnostics:{browserTrace:[
    {at:at(1000),sequence:1,kind:"SESSION_CALL",detail:{method:"navigate",args:["https://fixture.test/a"]}},
    {at:at(2000),sequence:2,kind:"SESSION_RETURN",detail:{method:"navigate"}},
    {at:at(3000),sequence:3,kind:"SESSION_CALL",detail:{method:"navigate",args:["https://fixture.test/a"]}},
    {at:at(4500),sequence:4,kind:"SESSION_RETURN",detail:{method:"navigate"}},
  ]},modelInvocations:[{purpose:"restaurant_agent_decide",startedAt:at(0),latencyMs:500}]};
  const report=controlled(artifact).report;
  assert.equal(report.experience.timing.repeatedLoads.durationRatio.value,0.3);
  assert.equal(report.experience.timing.externalVsSystem.navigationOperation.value,2500);
  assert.equal(report.experience.timing.externalVsSystem.modelWallMs.value,500);
  const partial=structuredClone(artifact) as unknown as RecordValue;delete partial.sourceTrace;
  assert.equal(controlled(partial).report.experience.timing.repeatedLoads.durationRatio.status,"NOT_EVALUATED");
  const view={...recordedRun(),view:{conversation:{clockDomain:"WALL_TIME",messages:[{id:"u",role:"USER",createdAt:at(10)},{id:"s",role:"ASSISTANT",inReplyTo:"u",createdAt:at(310)}]}}};
  assert.equal(controlled(view).report.experience.timing.turnResponses[0]!.metric.value,300);
});

test("immutable report writes and report failures preserve actual evaluation and original bytes",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"diagnosis-immutable-"));
  try{
    const path=join(directory,"result.json"),raw=JSON.stringify(recordedRun());await writeFile(path,raw);
    const outcome=await evaluateArtifactAfterFinish(path);assert.ok(outcome.outputPath&&outcome.evaluation);
    const before=await readFile(outcome.outputPath,"utf8"),json=await readFile(outcome.outputPath+".diagnosis.json","utf8");
    await assert.rejects(writeRecordedDiagnosis({artifact:path,evaluation:outcome.outputPath,prefix:outcome.outputPath}),{code:"EEXIST"});
    await writeDiagnosisAfterEvaluation(path,outcome.outputPath);
    assert.equal(JSON.parse(await readFile(outcome.outputPath+".diagnosis.failed.json","utf8")).failureCode,"EEXIST");
    assert.equal(await readFile(path,"utf8"),raw);assert.equal(await readFile(outcome.outputPath,"utf8"),before);assert.equal(await readFile(outcome.outputPath+".diagnosis.json","utf8"),json);
    const mutated={...recordedRun(),runId:"another"};await writeFile(path,JSON.stringify(mutated));
    await assert.rejects(writeRecordedDiagnosis({artifact:path,evaluation:outcome.outputPath,prefix:join(directory,"wrong")}),/EVALUATION_ARTIFACT_SHA_MISMATCH/);
    const manifest=join(directory,"bad-manifest.json");await writeFile(manifest,JSON.stringify({schema:"run-diagnosis-inputs@1",inputs:[],labels:"forbidden"}));
    await assert.rejects(generateRecordedDiagnoses(manifest,join(directory,"out")),/INVALID_DIAGNOSIS_BATCH_KEYS/);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test("a saved evaluator exception produces an explicitly unassessed report rather than an invented outcome",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"diagnosis-evaluation-error-"));
  try{
    const path=join(directory,"result.json"),raw=JSON.stringify(recordedRun());await writeFile(path,raw);
    const result=await evaluateArtifactAfterFinish(path,async()=>{throw Object.assign(new Error("controlled evaluator exception"),{code:"CONTROLLED_EVAL_ERROR"});});
    assert.equal(result.evaluationFailure,"CONTROLLED_EVAL_ERROR");assert.ok(result.failurePath);
    const report=JSON.parse(await readFile(result.failurePath+".diagnosis.json","utf8"));
    assert.equal(report.summary.outcome,null);assert.equal(report.summary.severity,null);assert.equal(report.summary.evaluationFailure.failureCode,"CONTROLLED_EVAL_ERROR");
    assert.equal(report.firstPoint.status,"NOT_EVALUATED");assert.equal(await readFile(path,"utf8"),raw);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test("cross-run summaries retain separate denominators, one first point and missing experience measurements",async()=>{
  const base=buildRunDiagnosis(await saved("p1fA-kf-h001-a1"));
  const second={...structuredClone(base),runId:"second-attempt",attemptId:"second-attempt"};
  const interrupted=controlled({...recordedRun(),runId:"interrupted",interruption:{reason:"SIGNAL",signal:"SIGTERM",at:at(5000),timeoutMs:5000}}).report;
  assert.equal(record(interrupted.summary.outcome).type,"ORCHESTRATION_INTERRUPTED");
  const summary=summarizeDiagnoses([base,second,interrupted],[base.attemptId!,"second-attempt","interrupted","not-started"]);
  assert.equal(summary.denominators.planned,4);assert.equal(summary.denominators.started,3);assert.equal(summary.denominators.completed,2);
  assert.equal(summary.denominators.interrupted,1);assert.equal(summary.denominators.capabilityIncluded,2);
  assert.equal(summary.sameCaseAttempts.find(x=>x.caseId===base.caseId)?.attempts.length,2);
  assert.equal(summary.firstPointBySeverity.reduce((n,c)=>n+c.count,0),3);
  assert.equal(summary.experience.missingQuestions.observedTotal,null);assert.equal(summary.experience.missingQuestions.unassessedRuns,3);
  assert.throws(()=>summarizeDiagnoses([base,base]),/DUPLICATE_RUN/);
});

test("diagnosis inherits the existing production-judgment ban and genuine type-only exemption",()=>{
  for(const imported of ["domains/restaurant/read-grounding.ts","domains/restaurant/action-validator.ts","integrations/tablecheck/tablecheck-page-parser.ts","infrastructure/browser/playwright-read-network-guard.ts"]){
    assert.match(evaluatorImportViolation("eval/restaurant/diagnosis/report.ts",imported,'import { judgment } from "x"')!,/must independently judge/);
    assert.equal(evaluatorImportViolation("eval/restaurant/diagnosis/report.ts",imported,'import type { Result } from "x"'),undefined);
  }
});
