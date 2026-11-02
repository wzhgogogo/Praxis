import type { EventEnvelope } from "../core/task-runtime/contracts.js";
import type { RestaurantEvent, RestaurantTaskState } from "../domains/restaurant/contracts.js";

type SemanticEvent = Extract<RestaurantEvent, { type: "SEMANTIC_PROPOSAL_COMPILED" }>;
export interface UserBookingSelectionRequest {
  sourceEventId: string;
  query: string;
  candidateId?: string;
}

// Full-name equality is a reference lookup, never a source identity decision.
// No token, prefix, similarity, translation or branch-name stripping is used.
const name = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US");

/** Bind a uniquely displayed outlet before the normal semantic reset. */
export function bindUserBookingSelection(event: SemanticEvent, before: RestaurantTaskState): SemanticEvent {
  if (!event.userBookingSelection || !event.patch.target) return event;
  const matches = before.candidates.filter(candidate => name(candidate.restaurant.outletName) === name(event.patch.target!.query));
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
  for (const { id, event, trace } of events) {
    if (event.type === "SEMANTIC_INTERPRETATION_FAILED" || event.type === "SEMANTIC_CONFLICT_RECORDED") request = undefined;
    if (event.type !== "SEMANTIC_PROPOSAL_COMPILED" || !("target" in event.patch)) continue;
    request = trace.actor === "USER" && event.userBookingSelection && event.patch.target?.selectionScope === "SPECIFIC_OUTLET"
      ? { sourceEventId: id, query: event.patch.target.query, ...event.userBookingSelection } : undefined;
  }
  return request;
}

export function userBookingCandidate(state: RestaurantTaskState, request: UserBookingSelectionRequest): string | undefined {
  const target = state.intentDraft?.target;
  if (!target || target.selectionScope !== "SPECIFIC_OUTLET" || name(target.query) !== name(request.query)
    || !["SEARCHING", "SELECTION_REQUIRED"].includes(state.phase)) return;
  const matches = state.candidates.filter(candidate => name(candidate.restaurant.outletName) === name(target.query));
  if (matches.length !== 1) return;
  const candidateId = matches[0]!.restaurant.id;
  if (request.candidateId && request.candidateId !== candidateId) return;
  if (!request.candidateId && !state.readEvidence.some(e => e.candidateId === candidateId
    && e.kind === "ENTITY_MATCH" && e.entityMatch?.confidence === "HIGH")) return;
  return state.selectedCandidateId === candidateId ? undefined : candidateId;
}
