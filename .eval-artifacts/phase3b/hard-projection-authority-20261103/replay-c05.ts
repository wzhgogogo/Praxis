import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {restaurantBookingTaskDefinition} from "../../../src/domains/restaurant/task-definition.js";
import {assessRestaurantRead,restaurantCurrentFactEvidence,restaurantPresentationEvidenceIds} from "../../../src/domains/restaurant/read-assessment.js";
import {RestaurantExecutionRouter} from "../../../src/application/restaurant-execution-router.js";
const manifest=JSON.parse(readFileSync(new URL("./source.json",import.meta.url),"utf8"));
for(const [p,sha] of Object.entries(manifest.files))assert.equal(createHash("sha256").update(readFileSync(p)).digest("hex"),sha,p);
assert.equal(execFileSync("git",["diff","--name-only",manifest.baseMain,"--","src","scripts","web-skills"],{encoding:"utf8"}).trim(),"");
const artifact=JSON.parse(gunzipSync(readFileSync(manifest.fixture)).toString());
const id="tabelog:en/tokyo/A1309/A130905/13048623",at=artifact.finalSnapshot.domainState.presentedResults.presentedAt;
let state=restaurantBookingTaskDefinition.create({}, {taskId:"c05-main-probe",runId:"c05-main-probe",now:artifact.startedAt,createId:p=>p});
let events=0;
for(const envelope of artifact.events){if(envelope.event.type==="RESULTS_PRESENTED")break;
 state=restaurantBookingTaskDefinition.transition(state,envelope.event,{taskId:"c05-main-probe",runId:"c05-main-probe",now:envelope.occurredAt,createId:p=>p}).state;events++;}
const facts=restaurantCurrentFactEvidence(state,id),criterion=state.intentDraft!.criteria.find(c=>c.strength==="HARD"&&c.polarity==="POSITIVE")!;
const normalize=(s:string)=>s.trim().toLocaleLowerCase("en-US").replace(/\s+/g," ");
const accepted=facts.filter(f=>Array.isArray(f.claims.verifiedHardCriteria)&&f.claims.verifiedHardCriteria.some(v=>normalize(v)===normalize(criterion.text)));
assert.equal(accepted.length,1);assert.equal(accepted[0]!.provider,"MODEL_JUDGMENT");
const model=accepted[0]!,supportIds=model.claims.supportingEvidenceIds as string[],sources=facts.filter(f=>supportIds.includes(f.evidenceId));
assert.equal(sources.length,1);assert.equal(facts.some(f=>f.provider==="GOOGLE_PLACES"),false);
const readiness=assessRestaurantRead(state,at).presentation.find(c=>c.candidateId===id)!;
const citations=restaurantPresentationEvidenceIds(state,id,at)!;assert.equal(readiness.eligible,true);assert.ok(citations.includes(model.evidenceId));
const without=structuredClone(state);without.readEvidence=without.readEvidence.filter(f=>f.evidenceId!==model.evidenceId);
assert.equal(restaurantPresentationEvidenceIds(without,id,at),undefined);
assert.deepEqual(without.availabilityChecks,state.availabilityChecks);assert.deepEqual(without.availability,state.availability);
let sourceCalls=0;
const router=new RestaurantExecutionRouter({executionRoute:"STRUCTURED_ADAPTER",async search(){sourceCalls++;throw Error("NO_SOURCE_READS");}},
 {executionRoute:"STRUCTURED_ADAPTER",async check(){sourceCalls++;throw Error("NO_SOURCE_READS");}},{structuredReadTimeoutMs:1000,browserReadTimeoutMs:1000});
const execution=await router.execute({type:"PRESENT_RESULTS",candidateIds:[...artifact.finalSnapshot.domainState.presentedResults.candidateIds]},state,at);
assert.equal(execution.event?.type,"RESULTS_PRESENTED");assert.equal(sourceCalls,0);
const shown=restaurantBookingTaskDefinition.transition(state,execution.event!,{taskId:"c05-main-probe",runId:"c05-main-probe",now:at,createId:p=>p}).state;
assert.equal(shown.presentedResults!.conditionStates[id]![0]!.status,"NOT_CHECKED");
const output={mode:"SAVED_C05_MAIN_DOMAIN_EVIDENCE_DIAGNOSIS",baseMain:manifest.baseMain,definitionVersion:restaurantBookingTaskDefinition.version,stateSchema:state.schemaVersion,
 replayedEvents:events,candidateId:id,criterion,originalPresentedAt:at,mainReadiness:readiness,acceptedEvidence:accepted,supportingEvidence:sources,
 otherCurrentFacts:facts.filter(f=>f.evidenceId!==model.evidenceId&&!supportIds.includes(f.evidenceId)),hasGoogleHardSupport:false,
 qualificationAfterRemovingSoleJudgment:false,slotUnchangedInControl:true,routerEvent:execution.event?.type,persistedCondition:shown.presentedResults!.conditionStates[id]![0],
 sourceCalls,allNewRealCalls:0,originalAssertionChanged:false,qualificationCodeChanged:false};
writeFileSync(process.argv[2]!,JSON.stringify(output,null,2)+"\n");console.log(JSON.stringify({eligible:readiness.eligible,acceptedJudgments:accepted.length,supportDocuments:sources.length,googleSupport:false,
 selectedStatements:sources[0]!.claims.restaurantTypeFacts,persistedCondition:output.persistedCondition.status,sourceCalls,allNewRealCalls:0}));
