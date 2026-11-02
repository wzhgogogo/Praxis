import type { RestaurantCaseView } from "./agent-workspace.js";
import { bookingHandoffCandidateIds, presentBookingHandoff, type PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";

/** Optional B1 capability of the production G1 composition; shares the enclosing read. */
export interface RestaurantBookingTermsRead {
  readBookingTerms(view: RestaurantCaseView, deadlineAt: string, signal: AbortSignal): Promise<void>;
}

/** Cache-only B1 projection. Never reads a source or accepts a client/model URL. */
export function withBookingHandoffs(view: RestaurantCaseView, prepared: readonly PreparedBookingHandoff[], now: string): RestaurantCaseView {
  const draft = view.restaurant.intentDraft;
  if (!draft?.date || !draft.timeWindow || !draft.partySize || !draft.area) return {...view, restaurant:{...view.restaurant, bookingHandoffs:[]}};
  const eligible = new Set(bookingHandoffCandidateIds(view.case.phase, view.restaurant.presentedCandidateIds, view.restaurant.readyCandidateIds));
  const handoffs = prepared.flatMap(item => {
    if (!eligible.has(item.source.candidateId)) return [];
    const candidate = view.restaurant.candidates.find(candidate => candidate.restaurant.id === item.source.candidateId);
    const offer = view.restaurant.availability[item.source.candidateId]?.find(offer => offer.id === item.source.offerId);
    const check = view.restaurant.availabilityChecks[item.source.candidateId];
    if (!candidate || !offer || !check) return [];
    const result = presentBookingHandoff(item, {candidate, offer, check, request: {...draft, date:draft.date!, timeWindow:draft.timeWindow!, partySize:draft.partySize!, area:draft.area!}, evidence:view.restaurant.readEvidence, now, ...(view.restaurant.sourceReadContext?{readContext:view.restaurant.sourceReadContext}:{})});
    return result ? [result] : [];
  });
  return {...view, restaurant:{...view.restaurant, bookingHandoffs:handoffs}};
}
