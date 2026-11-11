import assert from "node:assert/strict";
import { test } from "node:test";
import type { RestaurantAvailabilityCheck, RestaurantCandidate, RestaurantEvent, RestaurantTaskState } from "../domains/restaurant/contracts.js";
import type { RecordedEventEnvelope } from "../core/task-runtime/contracts.js";
import { projectWorkspaceRead } from "./workspace-read-projection.js";

const now="2026-10-29T10:00:00.000Z";
const candidate=(id:string):RestaurantCandidate=>({restaurant:{id,outletName:id,address:"Fixture Tokyo",sourceIds:{},provenance:{outletName:"fixture",address:"fixture"}},matchReasons:[],warnings:[],executionConfidence:"HIGH"});
function state(checks:Record<string,RestaurantAvailabilityCheck>):RestaurantTaskState{return {schemaVersion:"25",phase:"NO_VERIFIED_RESULT",candidates:[candidate("a"),candidate("b")],availability:{},availabilityChecks:checks,readEvidence:[],searchRevision:1};}
const check=(outcome:"FAILED"|"UNKNOWN"|"UNAVAILABLE"|"AVAILABLE"):RestaurantAvailabilityCheck=>({status:outcome==="UNAVAILABLE"||outcome==="AVAILABLE"?outcome:"UNKNOWN",checkedAt:now,evidenceIds:[],sourceAttempts:[{source:"TABLECHECK",outcome}]});

test("Workspace source failure copy requires explicit failed attempts, never unknown, unavailable or unread candidates",()=>{
  const rows=[
    {label:"all failed",checks:{a:check("FAILED"),b:check("FAILED")},expected:"ALL_SOURCES_FAILED"},
    {label:"unknown source",checks:{a:check("FAILED"),b:check("UNKNOWN")},expected:"NO_QUALIFIED_RESULTS"},
    {label:"valid no-slot observation",checks:{a:check("UNAVAILABLE"),b:check("UNAVAILABLE")},expected:"NO_QUALIFIED_RESULTS"},
    {label:"unread candidate",checks:{a:check("FAILED")},expected:"NO_QUALIFIED_RESULTS"},
    {label:"successful check without optional attempt detail",checks:{a:check("FAILED"),b:{status:"AVAILABLE" as const,checkedAt:now,evidenceIds:[]}},expected:"NO_QUALIFIED_RESULTS"},
    {label:"unknown check without attempt detail",checks:{a:check("FAILED"),b:{status:"UNKNOWN" as const,checkedAt:now,evidenceIds:[]}},expected:"NO_QUALIFIED_RESULTS"},
  ];
  for(const row of rows)assert.equal(projectWorkspaceRead({state:state(row.checks),events:[],readyCandidateIds:[],active:false,now}).readStatus.kind,row.expected,row.label);
  const partial=projectWorkspaceRead({state:state({a:check("FAILED"),b:check("AVAILABLE")}),events:[],readyCandidateIds:["b"],active:false,now});
  assert.equal(partial.readStatus.kind,"RESULTS");assert.equal(partial.readStatus.partialSourceFailure,true);
});

test("Workspace interpretation copy uses the recorded model status, not failure prose",()=>{
  for(const status of ["MODEL_FAILURE","INVALID_MODEL_OUTPUT","INPUT_INVALID"] as const){
    const event:RecordedEventEnvelope<RestaurantEvent>={id:"semantic",taskId:"task",occurredAt:now,trace:{schemaVersion:"1",runId:"run",correlationId:"semantic",actor:"MODEL"},
      event:{type:"SEMANTIC_INTERPRETATION_FAILED",status,reason:"This text deliberately says MODEL_FAILURE for every control"}};
    const projection=projectWorkspaceRead({state:{...state({}),phase:"FAILED"},events:[event],readyCandidateIds:[],active:false,now});
    assert.equal(projection.readStatus.kind,status==="MODEL_FAILURE"?"MODEL_FAILURE":"OTHER_FAILURE");
  }
});
