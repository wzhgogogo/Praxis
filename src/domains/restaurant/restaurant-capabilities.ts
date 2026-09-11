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
    inputSchema: "optional retrievalHint; the router binds authoritative intent",
    resultMeaning: "Returns RestaurantCandidate records only, without availability claims.",
    importantConstraints: ["Cannot modify, repeat, or loosen authoritative user constraints."],
  },
  {
    name: "INVESTIGATE_CANDIDATE_FACTS",
    purpose: "Read source-supported restaurant type or opening-hours facts for known candidates without checking slots.",
    inputSchema: "candidateIds; the router binds candidates and authoritative request conditions",
    resultMeaning: "Returns candidate-associated source facts or an explicit unknown result; it never asserts availability.",
    importantConstraints: ["Only known candidates are valid; at most three candidates per bounded read; do not repeat a completed fact read for the same request."],
  },
  {
    name: "CHECK_AVAILABILITY",
    purpose: "Read availability for known candidates at the authoritative date, time window, and party size.",
    inputSchema: "candidateIds; the router binds authoritative date, time window, and party size",
    resultMeaning: "Returns fresh AvailabilityOffer records associated with candidate IDs.",
    importantConstraints: ["Only known candidates are valid; schedule values are never Agent-supplied; at most three unchecked candidates per read batch."],
  },
  {
    name: "PRESENT_RESULTS",
    purpose: "Complete a read-only restaurant task by presenting candidates whose required facts and availability are grounded.",
    inputSchema: "candidateIds; validator derives the required evidence from authoritative State",
    resultMeaning: "Writes a search-only terminal result; it does not select, authorize, or submit a booking.",
    importantConstraints: ["Every task-critical fact, including each HARD criterion and availability, must have current trusted evidence."],
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
];
