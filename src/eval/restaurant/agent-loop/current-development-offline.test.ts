import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import type {
  RestaurantAvailabilityRead,
  RestaurantAvailabilityRequest,
  RestaurantCandidateFactRead,
  RestaurantCandidateFactRequest,
  RestaurantSearchRead,
  RestaurantSearchRequest,
} from "../../../domains/restaurant/contracts.js";
import {
  groundGoogleDiscovery,
  groundRestaurantWebsiteFacts,
  groundTableCheckAvailability,
} from "../../../domains/restaurant/read-grounding.js";
import type {
  RestaurantAvailabilityPort,
  RestaurantCandidateFactPort,
  RestaurantSearchPort,
} from "../../../application/restaurant-execution-router.js";
import { createHybridReadComposition } from "./hybrid-read-composition.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "./live-evaluation-location.js";
import {
  loadFrozenLiveCases,
  RESTAURANT_READ_DEVELOPMENT_CASE_PATH,
} from "./live-case-materializer.js";

type PlannedAction = "SEARCH_RESTAURANTS" | "INVESTIGATE_CANDIDATE_FACTS" | "CHECK_AVAILABILITY" | "PRESENT_RESULTS" | "END_READ";
type Plan = {
  id: "h001" | "h002" | "h003" | "h004" | "h005";
  content: string;
  referenceTime: string;
  goal: "RECOMMENDATION" | "AVAILABILITY";
  area: string;
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize?: number;
  facts: Array<Record<string, unknown>>;
  actions: PlannedAction[];
  source: {
    placeId: string;
    displayName: string;
    addressComponent?: string;
    websiteFacts?: { types: string[]; hours: string[] };
    availability?: { status: "AVAILABLE" | "UNAVAILABLE"; visibleSlots: string[]; verifiedHardCriteria: string[] };
  };
};

// These explicit model/source rows are deliberately separate from the YAML
// semantic oracle. They are keyed by raw user text in this test only; neither
// production code nor the model boundary receives a case identifier.
const PLANS: readonly Plan[] = [
  {
    id: "h001", content: "Looking for an omakase spot near Shibuya for 2 people tonight at 7 PM.", referenceTime: "2026-08-19T16:20:00+08:00",
    goal: "AVAILABILITY", area: "near Shibuya", date: "2026-08-19", timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase near Shibuya" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-19", raw: "tonight" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"],
    source: { placeId: "offline-h001", displayName: "Source Omakase Shibuya", addressComponent: "Shibuya", availability: { status: "AVAILABLE", visibleSlots: ["19:00"], verifiedHardCriteria: ["omakase"] } },
  },
  {
    id: "h002", content: "Recommend a first-date restaurant near Higashi-Ginza for this Saturday at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus.", referenceTime: "2026-08-19T16:22:00+08:00",
    goal: "AVAILABILITY", area: "near Higashi-Ginza", date: "2026-08-22", timeWindow: { earliest: "18:30", latest: "18:30" }, partySize: 2,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "first date restaurant near Higashi-Ginza" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-22", raw: "this Saturday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "18:30", latest: "18:30", raw: "6:30 PM" } },
      // Closed first-date-party inference, not a rewrite of the source message.
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Higashi-Ginza" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "Sichuan/Hunan cuisine", polarity: "NEGATIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "END_READ"],
    source: { placeId: "offline-h002", displayName: "Source Higashi-Ginza", addressComponent: "Higashi-Ginza", availability: { status: "UNAVAILABLE", visibleSlots: [], verifiedHardCriteria: [] } },
  },
  {
    id: "h003", content: "Need a place for a team dinner nearby this Friday after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room.", referenceTime: "2026-08-19T16:38:00+08:00",
    goal: "AVAILABILITY", area: "nearby", date: "2026-08-21", timeWindow: { earliest: "17:30", latest: "22:00" }, partySize: 10,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "team dinner nearby" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", weekday: "FRIDAY", raw: "this Friday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTER_WORK", raw: "after work" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 10 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "team dinner", polarity: "POSITIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "good for drinks", polarity: "POSITIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "after work", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"],
    source: { placeId: "offline-h003", displayName: "Source Team Dinner", availability: { status: "AVAILABLE", visibleSlots: ["19:00"], verifiedHardCriteria: ["team dinner", "good for drinks", "after work"] } },
  },
  {
    id: "h004", content: "Good cafes nearby to meet up with a friend this afternoon.", referenceTime: "2026-08-19T12:00:00+08:00",
    goal: "RECOMMENDATION", area: "nearby", date: "2026-08-19", timeWindow: { earliest: "12:00", latest: "17:00" },
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "cafes nearby" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TODAY", raw: "this afternoon" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", relativeDay: "TODAY", raw: "this afternoon" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "PRESENT_RESULTS"],
    source: { placeId: "offline-h004", displayName: "Source Afternoon Cafe", websiteFacts: { types: ["cafe"], hours: ["Wednesday: 10:00 AM – 6:00 PM"] } },
  },
  {
    id: "h005", content: "Any spots nearby with open tables right now for 4 people? Local food only, no fast food.", referenceTime: "2026-08-19T16:00:00+08:00",
    goal: "AVAILABILITY", area: "nearby", date: "2026-08-19", timeWindow: { earliest: "17:00", latest: "17:00" }, partySize: 4,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "open tables nearby" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", relativeOffsetMinutes: 0, raw: "right now" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 4 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "local food", polarity: "POSITIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "fast food", polarity: "NEGATIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "END_READ"],
    source: { placeId: "offline-h005", displayName: "Source Local Food", availability: { status: "AVAILABLE", visibleSlots: ["17:00"], verifiedHardCriteria: ["local food"] } },
  },
];

function modelResponse(outputText: string, invocationId: string): ModelResponse {
  return { invocationId, provider: "FIXTURE", model: "fixed-independent-boundary", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

function action(type: PlannedAction, candidateIds: string[] = []): Record<string, unknown> {
  return { type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "explicit offline action plan" };
}

class FixedCurrentCaseModel implements ModelGateway {
  readonly requests: ModelRequest[] = [];
  private readonly remainingActions: PlannedAction[];

  constructor(private readonly plan: Plan) { this.remainingActions = [...plan.actions]; }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    if (request.purpose === "restaurant_semantic_interpret") {
      assert.ok(request.messages.some((message) => message.content.includes(this.plan.content)), "semantic model must receive the exact frozen user message");
      return modelResponse(JSON.stringify({ schemaVersion: "3", facts: this.plan.facts }), `semantic:${this.plan.id}`);
    }
    if (request.purpose !== "restaurant_agent_decide") throw new Error(`Unprepared model purpose: ${request.purpose}`);
    const next = this.remainingActions.shift();
    if (!next) throw new Error(`Unprepared agent decision after the fixed ${this.plan.id} sequence`);
    const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context: { candidates?: Array<{ id: string }> } };
    const candidateIds = payload.context.candidates?.map((candidate) => candidate.id) ?? [];
    if (["CHECK_AVAILABILITY", "INVESTIGATE_CANDIDATE_FACTS", "PRESENT_RESULTS"].includes(next)) {
      if (candidateIds.length !== 1) throw new Error(`${next} requires exactly one independently grounded candidate, got ${candidateIds.length}`);
      return modelResponse(JSON.stringify(action(next, candidateIds)), `agent:${this.plan.id}:${next}`);
    }
    return modelResponse(JSON.stringify(action(next)), `agent:${this.plan.id}:${next}`);
  }

  assertConsumed(): void { assert.deepEqual(this.remainingActions, [], `all fixed ${this.plan.id} actions must execute`); }
}

function sourcesFor(plan: Plan, observedAt: string): {
  search: RestaurantSearchPort;
  facts: RestaurantCandidateFactPort;
  availability: RestaurantAvailabilityPort;
  calls: { search: number; facts: number; availability: number };
} {
  const calls = { search: 0, facts: 0, availability: 0 };
  const search: RestaurantSearchPort = {
    executionRoute: "STRUCTURED_ADAPTER",
    async search(request: RestaurantSearchRequest): Promise<RestaurantSearchRead> {
      calls.search += 1;
      assert.equal(request.intent.target?.goal, plan.goal);
      assert.equal(request.intent.area.query, plan.area);
      const coordinates = request.intent.area.coordinates;
      const radiusMeters = request.intent.area.radiusMeters;
      if (coordinates && radiusMeters === undefined) throw new Error("Nearby source request is missing its bound radius");
      const evaluationLocation = coordinates && radiusMeters !== undefined
        ? { latitude: coordinates.latitude, longitude: coordinates.longitude, radiusMeters, label: "fixed evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" as const }
        : undefined;
      const grounded = groundGoogleDiscovery({
        placeId: plan.source.placeId, displayName: plan.source.displayName, formattedAddress: `${plan.source.displayName}, Tokyo`,
        ...(plan.source.addressComponent ? { addressComponents: [{ longText: plan.source.addressComponent, types: ["sublocality_level_1"] }] } : {}),
        location: { latitude: HIGASHI_GINZA_EVALUATION_LOCATION.latitude, longitude: HIGASHI_GINZA_EVALUATION_LOCATION.longitude },
        types: plan.id === "h004" ? ["cafe", "restaurant"] : ["restaurant"], primaryType: plan.id === "h004" ? "cafe" : "restaurant",
      }, {
        requestFingerprint: `offline-discovery:${plan.source.placeId}`, observedAt, areaQuery: request.intent.area.query,
        ...(evaluationLocation ? { evaluationLocation } : {}),
        requiredTypeCriteria: request.intent.criteria.filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD").map((criterion) => criterion.text),
        negativeCriteria: request.intent.criteria.filter((criterion) => criterion.polarity === "NEGATIVE" && criterion.strength === "HARD").map((criterion) => criterion.text),
        ...(request.intent.date ? { requestedDate: request.intent.date } : {}),
        ...(request.intent.timeWindow ? { requestedTimeWindow: request.intent.timeWindow } : {}),
      });
      if (!grounded.accepted) throw new Error(`Fixed discovery source was rejected: ${grounded.reasonCode}`);
      return { candidates: [grounded.candidate], evidence: [grounded.evidence, ...grounded.additionalEvidence], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } };
    },
  };
  const facts: RestaurantCandidateFactPort = {
    executionRoute: "STRUCTURED_ADAPTER",
    async inspectFacts(request: RestaurantCandidateFactRequest): Promise<RestaurantCandidateFactRead> {
      calls.facts += 1;
      if (!plan.source.websiteFacts) throw new Error(`Unprepared fact source call for ${plan.id}`);
      assert.deepEqual(request.candidateIds, [request.candidates[0]!.restaurant.id]);
      const result = groundRestaurantWebsiteFacts(request.candidates[0]!, request.intent, {
        candidateId: request.candidates[0]!.restaurant.id, sourceUrl: `https://offline.example/${plan.source.placeId}`,
        observedAt, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_OFFLINE_SOURCE"] },
        restaurantTypeFacts: plan.source.websiteFacts.types, regularOpeningHours: plan.source.websiteFacts.hours,
      });
      return {
        evidence: result.evidence,
        factChecks: { [request.candidates[0]!.restaurant.id]: { status: result.status, checkedAt: observedAt, evidenceIds: result.evidence.map((evidence) => evidence.evidenceId), sourceProvider: "RESTAURANT_WEBSITE", ...(result.reasonCode ? { reasonCode: result.reasonCode } : {}) } },
        metadata: { provider: "RESTAURANT_WEBSITE", route: "STRUCTURED_ADAPTER", latencyMs: 0 },
      };
    },
  };
  const availability: RestaurantAvailabilityPort = {
    executionRoute: "STRUCTURED_ADAPTER",
    async check(request: RestaurantAvailabilityRequest): Promise<RestaurantAvailabilityRead> {
      calls.availability += 1;
      if (!plan.source.availability) throw new Error(`Unprepared availability source call for ${plan.id}`);
      if (plan.partySize === undefined) throw new Error(`Unprepared availability source party size for ${plan.id}`);
      assert.equal(request.date, plan.date); assert.deepEqual(request.timeWindow, plan.timeWindow); assert.equal(request.partySize, plan.partySize);
      const result = groundTableCheckAvailability(request.candidates[0]!, request, {
        candidateId: request.candidates[0]!.restaurant.id, sourceEntityId: `tablecheck:${plan.source.placeId}`,
        observedAt, requestedDate: plan.date, requestedPartySize: plan.partySize,
        entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_OFFLINE_SOURCE"] },
        pageState: plan.source.availability.status === "AVAILABLE" ? "AVAILABLE" : "NO_MATCHING_SLOT",
        visibleSlots: plan.source.availability.visibleSlots, verifiedHardCriteria: plan.source.availability.verifiedHardCriteria,
      }, observedAt);
      return {
        offers: result.offers, availabilityChecks: { [request.candidates[0]!.restaurant.id]: result.check }, evidence: result.evidence,
        ...(result.candidateFactUpdate ? { candidateFactUpdates: [result.candidateFactUpdate] } : {}),
        metadata: { provider: "TABLECHECK", route: "STRUCTURED_ADAPTER", latencyMs: 0, providerAttempts: [{ candidateId: request.candidates[0]!.restaurant.id, provider: "TABLECHECK", outcome: result.check.status === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE" }] },
      };
    },
  };
  return { search, facts, availability, calls };
}

test("current H001-H005 raw requests complete through the real offline Hybrid composition without prepared fallbacks", async (t) => {
  const frozen = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  assert.deepEqual(frozen.map((item) => item.id), PLANS.map((plan) => plan.id));
  for (const plan of PLANS) await t.test(plan.id, async () => {
    const sourceCase = frozen.find((item) => item.id === plan.id)!;
    assert.equal(String(sourceCase.content).trimEnd(), plan.content, "the frozen user message is immutable test input");
    const observedAt = "2026-08-19T09:00:00.000Z";
    const model = new FixedCurrentCaseModel(plan);
    const sources = sourcesFor(plan, observedAt);
    const taskId = `offline-current:${plan.id}`;
    const composition = createHybridReadComposition({
      taskId, runId: `run:${taskId}`, clock: { now: () => new Date(observedAt) }, model,
      search: sources.search, facts: sources.facts, availability: sources.availability,
      loop: { maxSteps: 6, timeoutMs: 5_000 },
    });
    const semantic = await composition.interpretAndDispatch({ taskId, message: String(sourceCase.content), referenceTime: plan.referenceTime, timezone: "Asia/Tokyo" }, plan.area === "nearby" ? HIGASHI_GINZA_EVALUATION_LOCATION : undefined);
    assert.equal(semantic.status, "PROPOSED");
    const loop = await composition.coordinator.run(taskId);
    const state = composition.runtime.snapshot(taskId).domainState;
    model.assertConsumed();
    assert.equal(sources.calls.search, 1);
    assert.equal(state.intentDraft?.target?.goal, plan.goal);
    assert.equal(state.intentDraft?.date, plan.date);
    assert.deepEqual(state.intentDraft?.timeWindow, plan.timeWindow);
    assert.equal(state.intentDraft?.partySize, plan.partySize);
    if (plan.id === "h003") assert.equal(state.intentDraft?.temporalResolution?.timeWindow?.basis, "DAYPART:AFTER_WORK_BROAD_WINDOW");
    if (plan.id === "h004") {
      assert.equal(sources.calls.facts, 1); assert.equal(sources.calls.availability, 0);
      assert.equal(loop.status, "TERMINAL"); assert.equal(state.phase, "PRESENT_RESULTS");
    } else {
      assert.equal(sources.calls.facts, 0); assert.equal(sources.calls.availability, 1);
    }
    if (plan.id === "h001" || plan.id === "h003") {
      assert.equal(state.phase, "PRESENT_RESULTS");
      const candidateId = state.presentedResults?.candidateIds[0]!;
      assert.equal(state.availabilityChecks[candidateId]?.status, "AVAILABLE");
      assert.equal(state.availabilityChecks[candidateId]?.receptionMode, "RESERVATION_SUPPORTED");
      assert.equal(state.availability[candidateId]?.length, 1);
    }
    if (plan.id === "h002") {
      assert.equal(state.phase, "NO_VERIFIED_RESULT");
      const check = Object.values(state.availabilityChecks)[0]!;
      assert.equal(check.status, "UNAVAILABLE");
      assert.ok(state.readEvidence.some((evidence) => evidence.kind === "AVAILABILITY" && evidence.claims.inventoryStatus === "UNAVAILABLE"));
    }
    if (plan.id === "h005") {
      assert.equal(state.phase, "NO_VERIFIED_RESULT", "an observed slot cannot bypass the separately unverified negative HARD condition");
      assert.equal(Object.values(state.availabilityChecks)[0]?.status, "AVAILABLE");
    }
  });
});
