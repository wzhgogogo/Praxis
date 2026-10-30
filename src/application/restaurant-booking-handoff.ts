import type { RestaurantCaseView } from "./agent-workspace.js";
import { presentBookingHandoff, type PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";

/** Cache-only B1 projection. Never reads a source or accepts a client/model URL. */
export function withBookingHandoffs(view: RestaurantCaseView, prepared: readonly PreparedBookingHandoff[], now: string): RestaurantCaseView {
  const draft = view.restaurant.intentDraft;
  if (!draft?.date || !draft.timeWindow || !draft.partySize || !draft.area) return view;
  const handoffs = prepared.flatMap(item => {
    const candidate = view.restaurant.candidates.find(candidate => candidate.restaurant.id === item.source.candidateId);
    const offer = view.restaurant.availability[item.source.candidateId]?.find(offer => offer.id === item.source.offerId);
    const check = view.restaurant.availabilityChecks[item.source.candidateId];
    if (!candidate || !offer || !check) return [];
    const result = presentBookingHandoff(item, {candidate, offer, check, request: {...draft, date:draft.date!, timeWindow:draft.timeWindow!, partySize:draft.partySize!, area:draft.area!}, evidence:view.restaurant.readEvidence, now});
    return result ? [result] : [];
  });
  return {...view, restaurant:{...view.restaurant, bookingHandoffs:handoffs}};
}
