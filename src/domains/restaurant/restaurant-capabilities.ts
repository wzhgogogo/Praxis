import type { RestaurantAgentAction } from "./agent-action.js";

export interface RestaurantAgentCapability {
  name: RestaurantAgentAction["type"];
  purpose: string;
  inputSchema: string;
  resultMeaning: string;
  importantConstraints: string[];
}

/** Static, Domain-owned catalog. Provider names and adapter details never enter Agent context. */
export const RESTAURANT_AGENT_CAPABILITIES: readonly RestaurantAgentCapability[] = [
  {
    name: "ASK_USER",
    purpose: "Request a user clarification that is necessary or useful to proceed safely.",
    inputSchema: "question, optional relatedFields",
    resultMeaning: "The task waits for a new user message; no state constraint is changed.",
    importantConstraints: ["Do not claim a booking or availability result."],
  },
  {
    name: "SEARCH_RESTAURANTS",
    purpose: "Discover matching restaurant outlets.",
    inputSchema: "authoritative intent plus an optional retrievalHint",
    resultMeaning: "Returns RestaurantCandidate records only, without availability claims.",
    importantConstraints: ["The intent must exactly preserve authoritative user constraints."],
  },
  {
    name: "CHECK_AVAILABILITY",
    purpose: "Read availability for known candidates at the authoritative date, time window, and party size.",
    inputSchema: "candidateIds, date, timeWindow, partySize",
    resultMeaning: "Returns fresh AvailabilityOffer records associated with candidate IDs.",
    importantConstraints: ["Only known candidates and exact authoritative scheduling values are valid."],
  },
  {
    name: "SELECT_CANDIDATE",
    purpose: "Choose a discovered candidate and optionally its known offer for a possible booking proposal.",
    inputSchema: "candidateId, optional offerId",
    resultMeaning: "Records the selection; it does not authorize or submit a booking.",
    importantConstraints: ["A selected offer must belong to the selected candidate."],
  },
  {
    name: "BOOK_RESERVATION",
    purpose: "Request a booking proposal for one selected fresh offer.",
    inputSchema: "candidateId, offerId",
    resultMeaning: "Creates a deterministic ActionProposal and waits for valid user authorization.",
    importantConstraints: ["Cannot authorize, commit, or claim success."],
  },
  {
    name: "COMPLETE",
    purpose: "Finish only after the authoritative verifier confirms the booking outcome.",
    inputSchema: "none",
    resultMeaning: "Ends the bounded Agent loop without changing outcome state.",
    importantConstraints: ["Only BOOKED_VERIFIED is completable in v18."],
  },
];
