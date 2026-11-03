import type { EventEnvelope } from "../core/task-runtime/contracts.js";
import type { RestaurantEvent, RestaurantTaskState } from "../domains/restaurant/contracts.js";
import {boundNames,namedOutletCandidateResolved, sameNamedOutletIdentity,type NamedOutletReference} from "../domains/restaurant/named-outlet-resolution.js";

type SemanticEvent = Extract<RestaurantEvent, { type: "SEMANTIC_PROPOSAL_COMPILED" }>;
export interface UserBookingSelectionRequest {
  sourceEventId: string;
  query: string;
  candidateId?: string;
  /** Reconstructed from immutable Runtime events, never a second durable State. */
  reference?: NamedOutletReference;
}

// Exact observed full names bind a reference; source identity is still separate.
// No token, prefix, similarity, translation or branch-name stripping is used.
const name = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US");

/** Bind a uniquely displayed outlet before the normal semantic reset. */
export function bindUserBookingSelection(event: SemanticEvent, before: RestaurantTaskState): SemanticEvent {
  if (!event.userBookingSelection || !event.patch.target) return event;
  const matches = before.candidates.filter(candidate => name(candidate.restaurant.outletName) === name(event.patch.target!.query)
    ||boundNames(before,candidate.restaurant.id).some(value=>name(value)===name(event.patch.target!.query)));
  if (matches.length > 1) {
    const { userBookingSelection: _unresolved, ...compiled } = event;
    return compiled;
  }
  const candidate = matches[0];
  return candidate && before.presentedResults?.candidateIds.includes(candidate.restaurant.id)
    ? { ...event, userBookingSelection: { candidateId: candidate.restaurant.id } }
    : event;
}

/** Authoritative message events preserve a pending choice across a party-only reply. */
export function userBookingSelectionRequest(events: readonly EventEnvelope<RestaurantEvent>[]): UserBookingSelectionRequest | undefined {
  let request: UserBookingSelectionRequest | undefined;
  const observed=new Map<string,Omit<NamedOutletReference,"userEventId">>();
  for (const { id, event, trace } of events) {
    if(event.type==="SEARCH_COMPLETED")for(const candidate of event.candidates)observed.set(candidate.restaurant.id,{restaurant:structuredClone(candidate.restaurant),discovery:structuredClone(event.evidence.filter(e=>e.candidateId===candidate.restaurant.id&&e.kind==="DISCOVERY"))});
    if("evidence" in event&&Array.isArray(event.evidence))for(const evidence of event.evidence){
      const outlet=evidence.candidateId?observed.get(evidence.candidateId):undefined;
      if(!outlet||evidence.kind!=="ENTITY_MATCH"||evidence.entityMatch?.confidence!=="HIGH"||!evidence.sourceEntityId)continue;
      const key=evidence.provider==="TABELOG"?"tabelog":evidence.provider==="TABLECHECK"?"tablecheck":undefined;
      if(key){
        outlet.restaurant.sourceIds[key]=evidence.sourceEntityId;
        if(request?.reference&&sameNamedOutletIdentity(outlet.restaurant,request.reference.restaurant))request.reference.restaurant.sourceIds[key]=evidence.sourceEntityId;
      }
    }
    if(event.type==="CANDIDATE_SELECTED"&&trace.actor==="USER"&&request&&!request.reference&&trace.causationId===request.sourceEventId){
      const selected=observed.get(event.candidateId);
      if(selected)request={...request,candidateId:request.candidateId??event.candidateId,reference:{...structuredClone(selected),userEventId:request.sourceEventId}};
    }
    if (event.type === "SEMANTIC_INTERPRETATION_FAILED" || event.type === "SEMANTIC_CONFLICT_RECORDED") request = undefined;
    if (event.type !== "SEMANTIC_PROPOSAL_COMPILED" || !("target" in event.patch)) continue;
    const reference=event.userBookingSelection?.candidateId?observed.get(event.userBookingSelection.candidateId):undefined;
    request = trace.actor === "USER" && event.userBookingSelection && event.patch.target?.selectionScope === "SPECIFIC_OUTLET"
      ? { sourceEventId: id, query: event.patch.target.query, ...event.userBookingSelection,...(reference?{reference:{...structuredClone(reference),userEventId:id}}:{}) } : undefined;
  }
  return request;
}

export function userBookingCandidate(state: RestaurantTaskState, request: UserBookingSelectionRequest): string | undefined {
  const target = state.intentDraft?.target;
  if (!target || target.selectionScope !== "SPECIFIC_OUTLET" || name(target.query) !== name(request.query)
    || !["SEARCHING", "SELECTION_REQUIRED"].includes(state.phase)) return;
  const matches = state.candidates.filter(candidate => request.reference?sameNamedOutletIdentity(candidate.restaurant,request.reference.restaurant,state.readEvidence):name(candidate.restaurant.outletName) === name(target.query)
    ||state.readEvidence.some(e=>e.kind==="DISCOVERY"&&e.candidateId===candidate.restaurant.id
      &&typeof e.claims.requestedOutletName==="string"&&name(e.claims.requestedOutletName)===name(target.query)
      &&namedOutletCandidateResolved(state,candidate.restaurant.id)));
  if (matches.length !== 1) return;
  const candidateId = matches[0]!.restaurant.id;
  if(!namedOutletCandidateResolved(state,candidateId))return;
  if (request.candidateId && request.candidateId !== candidateId&&!request.reference) return;
  if (!request.candidateId && !state.readEvidence.some(e => e.candidateId === candidateId
    && e.kind === "ENTITY_MATCH" && e.entityMatch?.confidence === "HIGH")) return;
  return state.selectedCandidateId === candidateId ? undefined : candidateId;
}
