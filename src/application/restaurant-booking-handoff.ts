import type { RestaurantCaseView } from "./agent-workspace.js";
import { bookingHandoffCandidateIds, presentBookingHandoff, type PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";
import {completeRestaurantIntent} from "../domains/restaurant/intent-state.js";
import {namedOutletCandidateResolved} from "../domains/restaurant/named-outlet-resolution.js";

/** Optional B1 capability of the production G1 composition; shares the enclosing read. */
export interface RestaurantBookingTermsDiagnostic {
  at:string;rootTaskId:string;readRunId?:string;candidateId?:string;
  reason:"NOT_SELECTED"|"NO_CONTEXT"|"PHASE"|"NOT_ELIGIBLE"|"NAME_UNRESOLVED"|"NOT_SPECIFIC"
    |"NO_HANDOFF"|"ALREADY_ATTEMPTED"|"RESERVE"|"BUDGET"|"CANCELLED"|"RUN_MISMATCH"
    |"NO_SOURCE_BINDING"|"NO_PAGES"|"PAGE_FILTERED"|"QUESTION_UNVERIFIED"|"NOT_STATED"|"ANSWERED"|"COMPLETED"|"CAPTURE_FAILED";
  topic?:"cancellation"|"card";answerReason?:string;pageCount?:number;boundPageCount?:number;
}
export interface RestaurantBookingTermsRead {
  readBookingTerms(view: RestaurantCaseView, deadlineAt: string, signal: AbortSignal): Promise<void>;
  readBookingTermsDiagnostics?(rootTaskId:string):RestaurantBookingTermsDiagnostic[];
}

/** Cache-only B1 projection. Never reads a source or accepts a client/model URL. */
export function withBookingHandoffs(view: RestaurantCaseView, prepared: readonly PreparedBookingHandoff[], now: string): RestaurantCaseView {
  const request = completeRestaurantIntent(view.restaurant.intentDraft);
  if (!request) return {...view, restaurant:{...view.restaurant, bookingHandoffs:[]}};
  const eligible = new Set(bookingHandoffCandidateIds(view.case.phase, view.restaurant.presentedCandidateIds, view.restaurant.readyCandidateIds)
    .filter(id=>namedOutletCandidateResolved(view.restaurant,id)));
  const handoffs = prepared.flatMap(item => {
    if (!eligible.has(item.source.candidateId)) return [];
    const candidate = view.restaurant.candidates.find(candidate => candidate.restaurant.id === item.source.candidateId);
    const offer = view.restaurant.availability[item.source.candidateId]?.find(offer => offer.id === item.source.offerId);
    const check = view.restaurant.availabilityChecks[item.source.candidateId];
    if (!candidate || !offer || !check) return [];
    const result = presentBookingHandoff(item, {candidate, offer, check, request, evidence:view.restaurant.readEvidence, now, ...(view.restaurant.sourceReadContext?{readContext:view.restaurant.sourceReadContext}:{})});
    return result ? [result] : [];
  });
  return {...view, restaurant:{...view.restaurant, bookingHandoffs:handoffs}};
}
