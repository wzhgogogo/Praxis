import assert from "node:assert/strict";
import { test } from "node:test";
import type { RestaurantAvailabilityCheck, RestaurantCandidate, RestaurantEvent, RestaurantTaskState } from "../../../src/domains/restaurant/contracts.js";
import type { RecordedEventEnvelope } from "../../../src/core/task-runtime/contracts.js";
import { projectWorkspaceRead } from "../../../src/application/workspace-read-projection.ts";

const now="2026-10-29T10:00:00.000Z";
const candidate=(id:string):RestaurantCandidate=>({restaurant:{id,outletName:id,address:"Fixture Tokyo",sourceIds:{},provenance:{outletName:"fixture",address:"fixture"}},matchReasons:[],warnings:[],executionConfidence:"HIGH"});
function state(checks:Record<string,RestaurantAvailabilityCheck>):RestaurantTaskState{return {schemaVersion:"25",phase:"NO_VERIFIED_RESULT",candidates:[candidate("a"),candidate("b")],availability:{},availabilityChecks:checks,readEvidence:[],searchRevision:1};}
const check=(outcome:"FAILED"|"UNKNOWN"|"UNAVAILABLE"|"AVAILABLE"):RestaurantAvailabilityCheck=>({status:outcome==="UNAVAILABLE"||outcome==="AVAILABLE"?outcome:"UNKNOWN",checkedAt:now,evidenceIds:[],sourceAttempts:[{source:"TABLECHECK",outcome}]});

const initialPatch: import("../../../src/domains/restaurant/contracts.js").RestaurantIntentPatch = {
  schemaVersion:"3",date:"2026-11-02",timeWindow:{earliest:"19:00",latest:"19:30"},partySize:2,partySizeSource:"EXPLICIT",area:{query:"Tokyo"},
};
const initialDraft: import("../../../src/domains/restaurant/contracts.js").RestaurantIntentDraft = {
  schemaVersion:"3",timezone:"Asia/Tokyo",date:"2026-11-02",timeWindow:{earliest:"19:00",latest:"19:30"},partySize:2,partySizeSource:"EXPLICIT",area:{query:"Tokyo"},criteria:[],
};
function history(events: RestaurantEvent[]):RecordedEventEnvelope<RestaurantEvent>[] {
  return events.map((event,index)=>({id:'event:'+index,taskId:'task',occurredAt:now,trace:{schemaVersion:'1',runId:'run:'+index,correlationId:'event:'+index,actor:'SYSTEM'},event}));
}
const presented=(candidateIds:string[]):RestaurantEvent=>({type:'RESULTS_PRESENTED',candidateIds,evidenceIds:[]});
const compiled=(patch:typeof initialPatch):RestaurantEvent=>({type:'SEMANTIC_PROPOSAL_COMPILED',patch});
const emptySearch:RestaurantEvent={type:'SEARCH_COMPLETED',request:{intent:initialDraft},candidates:[],evidence:[],metadata:{provider:'FIXTURE',route:'STRUCTURED_ADAPTER',latencyMs:0}};
const emptyEnd:RestaurantEvent={type:'READ_ENDED_NO_VERIFIED_RESULT',investigatedCandidateIds:[],unresolvedCandidateIds:[],remainingGaps:[]};

import { writeFileSync } from 'node:fs';
import { restaurantCurrentFactEvidence } from '../../../src/domains/restaurant/read-assessment.ts';
const venueA='https://tabelog.com/en/tokyo/A1301/A130101/11111111/',venueB='https://tabelog.com/en/tokyo/A1302/A130202/22222222/';
const ev=(key:string,kind:'ENTITY_MATCH'|'RESTAURANT_FACT'|'AVAILABILITY',url:string,sourceEntityId:string,confidence?:'HIGH'|'LOW')=>({evidenceId:key,candidateId:'a',kind,provider:'TABELOG' as const,sourceEntityId,sourceUrl:url,observedAt:now,requestFingerprint:'offline',claims:{},...(confidence?{entityMatch:{confidence,matchedBy:['fixture']}}:{})});
const high=ev('identity-A','ENTITY_MATCH',venueA,'11111111','HIGH');
const low=ev('identity-B','ENTITY_MATCH',venueB,'22222222','LOW');
const fact=ev('facts-B','RESTAURANT_FACT',venueB,'22222222');
const availability=ev('inventory-B','AVAILABILITY',venueB,'22222222','LOW');
function project(evidence:typeof fact[]){
 const current={...state({}),phase:'PRESENT_RESULTS' as const,intentDraft:{...initialDraft,partySize:3},candidates:['a','c'].map(candidate),readEvidence:evidence};
 return {sourceUrl:projectWorkspaceRead({state:current,events:history([compiled(initialPatch),presented(['a']),compiled({schemaVersion:'3',partySize:3}),presented(['c'])]),readyCandidateIds:['c'],openableCandidateIds:['c'],active:false,now}).revisionDiff?.removed[0]?.sourceUrl,domainCurrentFactIds:restaurantCurrentFactEvidence(current,'a').map(e=>e.evidenceId)};
}
const rows={highOnly:project([high]),lowMatchOnly:project([low]),sameOriginOtherOutlet:project([high,low,fact]),sameOriginCorrectOutlet:project([high,{...fact,sourceEntityId:'11111111',sourceUrl:venueA+'menu/'}]),explicitlyLowAvailability:project([high,low,availability])};
Object.assign(rows,{
 bothMissingSourceEntityId:project([{...high,sourceEntityId:undefined},{...fact,sourceEntityId:undefined}]),
 mediumAvailability:project([{...availability,entityMatch:{confidence:'MEDIUM',matchedBy:['fixture']}}]),
 explicitHighAvailability:project([{...availability,entityMatch:{confidence:'HIGH',matchedBy:['fixture']}}]),
 differentProvider:project([high,{...fact,provider:'RESTAURANT_WEBSITE',sourceEntityId:high.sourceEntityId}]),
 googleFallback:(()=>{const s={...state({}),phase:'PRESENT_RESULTS',intentDraft:{...initialDraft,partySize:3},candidates:['a','c'].map(candidate),readEvidence:[]};s.candidates[0].restaurant.sourceIds.googleMapsUri='https://maps.google.com/?cid=123';return projectWorkspaceRead({state:s,events:history([compiled(initialPatch),presented(['a']),compiled({schemaVersion:'3',partySize:3}),presented(['c'])]),readyCandidateIds:['c'],openableCandidateIds:['c'],active:false,now}).revisionDiff?.removed[0]?.sourceUrl;})()
});
writeFileSync(process.env.PRAXIS_ROUND24_OBSERVATIONS+'/links.json',JSON.stringify(rows,null,2)+'\n');
