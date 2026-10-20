import {scriptedRetrieval} from "./restaurant-read-test-fixtures.js";
import { createRouterFixtureComposition, response, strictAction, PermittedAlternativeTimeModel, googleFixture, now, clock } from "./restaurant-read-test-fixtures.js";
import type { ModelGateway } from "../core/model/contracts.js";
import type { BrowserRuntime } from "../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../integrations/google/google-places-client.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "../eval/restaurant/agent-loop/live-evaluation-location.js";
import { groundTableCheckAvailability } from "../domains/restaurant/read-grounding.js";
import { projectRestaurantAgentContext } from "../domains/restaurant/agent-context.js";
import { RunBoundedModelGateway } from "../application/run-bounded-model-gateway.js";
import { DeliveryReservedModelGateway } from "../application/delivery-reserved-model-gateway.js";
import assert from "node:assert/strict";
import { test } from "node:test";

import { RestaurantExecutionRouter } from "../application/restaurant-execution-router.js";
import { restaurantSearchIntentFingerprint, type RestaurantSearchRequest, type RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { completeRestaurantSearchIntent } from "../domains/restaurant/intent-state.js";
import { fixtureCandidates, fixtureIntent } from "./restaurant-fixtures.js";

const state: RestaurantTaskState = {
  schemaVersion: "18",
  phase: "UNDERSTANDING",
  intentDraft: { ...fixtureIntent, schemaVersion: "3" },
  candidates: [],
  availability: {},
  availabilityChecks: {},
  readEvidence: [],
  searchRevision: 0,
};

test("Execution Router binds only the matching durable search cursor; the Agent cannot supply or reuse one after an intent change", async () => {
  const requests: RestaurantSearchRequest[] = [];
  const router = new RestaurantExecutionRouter(
    {
      executionRoute: "STRUCTURED_ADAPTER",
      async search(request) {
        requests.push(structuredClone(request));
        return {
          candidates: [], evidence: [],
          continuation: { intentFingerprint: restaurantSearchIntentFingerprint(request.intent), usedPageTokens: ["page-2"], pagesRead: 2, exhausted: false, nextPageToken: "page-3" },
          metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 },
        };
      },
    },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );
  const searchIntent = completeRestaurantSearchIntent(state.intentDraft)!;
  const matching = {
    ...state,
    searchContinuation: { intentFingerprint: restaurantSearchIntentFingerprint(searchIntent), usedPageTokens: ["page-2"], pagesRead: 2, exhausted: false, nextPageToken: "page-3" },
  };
  await router.execute({ type: "SEARCH_RESTAURANTS" }, matching, undefined, "cursor-run");
  await router.execute({ type: "SEARCH_RESTAURANTS" }, {
    ...matching,
    intentDraft: { ...matching.intentDraft!, area: { query: "Shibuya" } },
  }, undefined, "changed-run");
  assert.equal(requests[0]?.continuation?.nextPageToken, "page-3");
  assert.equal(requests[1]?.continuation, undefined);
});

test("Execution Router aborts and bounds a Provider search read that exceeds its deadline", async () => {
  let sawAbort = false;
  const router = new RestaurantExecutionRouter(
    {
      executionRoute: "STRUCTURED_ADAPTER",
      async search(_request, signal) {
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            sawAbort = true;
            reject(signal.reason);
          }, { once: true });
        });
      },
    },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    { browserReadTimeoutMs: 20_000,  structuredReadTimeoutMs: 1 },
  );

  const execution = await router.execute({ type: "SEARCH_RESTAURANTS" }, state);

  assert.equal(sawAbort, true);
  assert.equal(execution.failure?.source, "PROVIDER");
  assert.equal(execution.failure?.code, "SEARCH_FAILED");
  assert.match(execution.failure?.reason ?? "", /timed out after 1ms/);
  assert.deepEqual(execution.event, {
    type: "SEARCH_FAILED",
    reason: "Restaurant search timed out after 1ms",
    code: "SEARCH_FAILED",
  });
});

test("Execution Router returns at its deadline even when a Provider ignores abort", async () => {
  const router = new RestaurantExecutionRouter(
    {
      executionRoute: "STRUCTURED_ADAPTER",
      async search() {
        return new Promise(() => {});
      },
    },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    { browserReadTimeoutMs: 20_000,  structuredReadTimeoutMs: 1 },
  );

  const execution = await router.execute({ type: "SEARCH_RESTAURANTS" }, state);

  assert.equal(execution.failure?.source, "PROVIDER");
  assert.equal(execution.failure?.code, "SEARCH_FAILED");
  assert.match(execution.failure?.reason ?? "", /timed out after 1ms/);
});

test("Execution Router retains source-owned Google request accounting when a sent read fails", async () => {
  const router = new RestaurantExecutionRouter(
    {
      executionRoute: "STRUCTURED_ADAPTER",
      googleRequestUsage: () => ({ limit: 100, total: 4, namedPlaceResolution: 1, discovery: 2, placeDetails: 1, reverseAddressObservation: 0 }),
      async search() { throw Object.assign(new Error("network failed"), { code: "GOOGLE_NETWORK_FAILED" }); },
    },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );

  const execution = await router.execute({ type: "SEARCH_RESTAURANTS" }, state, undefined, "google-run");

  assert.equal(execution.failure?.code, "GOOGLE_NETWORK_FAILED");
  assert.deepEqual(execution.executionMetadata?.googleRequests, {
    limit: 100,
    total: 4,
    namedPlaceResolution: 1,
    discovery: 2,
    placeDetails: 1, reverseAddressObservation: 0,
  });
});

test("Execution Router passes only bound availability arguments and its deadline signal to the adapter", async () => {
  let receivedSignal: AbortSignal | undefined;
  let receivedRequest: unknown;
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { return { candidates: fixtureCandidates, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    {
      executionRoute: "STRUCTURED_ADAPTER",
      async check(request, signal) {
        receivedRequest = request;
        receivedSignal = signal;
        return {
          offers: [],
          availabilityChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "UNAVAILABLE" as const, checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: [] }])),
          evidence: [],
          metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 },
        };
      },
    }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );
  const searchedState: RestaurantTaskState = {
    ...state,
    phase: "SEARCHING",
    candidates: fixtureCandidates,
  };

  const execution = await router.execute(
    { type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] },
    searchedState,
  );

  assert.ok(receivedSignal instanceof AbortSignal);
  assert.equal(execution.route, "STRUCTURED_ADAPTER");
  assert.deepEqual(receivedRequest, {
    candidateIds: [fixtureCandidates[0]!.restaurant.id],
    candidates: [fixtureCandidates[0]!],
    date: fixtureIntent.date,
    timeWindow: fixtureIntent.timeWindow,
    partySize: fixtureIntent.partySize,
    hardCriteria: ["yakiniku"],
  });
});

test("Execution Router preserves a current exact immediate request for source-side slot verification", async () => {
  let calls = 0;
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { return { candidates: [], evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    { executionRoute: "STRUCTURED_ADAPTER", async check(request) { calls += 1; return { offers: [], availabilityChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "UNKNOWN" as const, checkedAt: "2026-08-05T09:00:30.000Z", evidenceIds: [], reasonCode: "SOURCE_PENDING" }])), evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );
  const immediateState: RestaurantTaskState = {
    ...state,
    phase: "SEARCHING",
    candidates: fixtureCandidates,
    intentDraft: {
      ...fixtureIntent,
      schemaVersion: "3",
      temporalResolution: {
        policyVersion: "restaurant-temporal-materialization@6", referenceTime: "2026-08-05T09:00:00.000Z", timezone: "Asia/Tokyo",
        timeWindow: { expression: "right now", resolvedTimeWindow: fixtureIntent.timeWindow, basis: "RELATIVE_OFFSET_MINUTES:0" },
        immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EARLIEST_IN_WINDOW" },
      },
    },
  };
  const execution = await router.execute({ type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] }, immediateState, "2026-08-05T09:00:30.000Z");
  assert.equal(calls, 1);
  assert.equal(execution.event?.type, "AVAILABILITY_CHECKED");
  assert.equal(execution.event?.availabilityChecks[fixtureCandidates[0]!.restaurant.id]?.status, "UNKNOWN");
});

test("Execution Router forwards only a current exact immediate slot to the provider", async () => {
  let received: unknown;
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { return { candidates: [], evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    {
      executionRoute: "STRUCTURED_ADAPTER",
      async check(request) {
        received = request;
        return {
          offers: [],
          availabilityChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "UNAVAILABLE" as const, checkedAt: "2026-08-05T09:00:30.000Z", evidenceIds: [] }])),
          evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 },
        };
      },
    }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );
  const immediateState: RestaurantTaskState = {
    ...state,
    phase: "SEARCHING",
    candidates: fixtureCandidates,
    intentDraft: {
      ...fixtureIntent,
      schemaVersion: "3",
      timeWindow: { earliest: "12:00", latest: "12:00" },
      temporalResolution: {
        policyVersion: "restaurant-temporal-materialization@6", referenceTime: "2026-08-05T09:00:00.000Z", timezone: "Asia/Tokyo",
        timeWindow: { expression: "right now", resolvedTimeWindow: { earliest: "12:00", latest: "12:00" }, basis: "RELATIVE_OFFSET_MINUTES:0" },
        immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EARLIEST_IN_WINDOW" },
      },
    },
  };
  const execution = await router.execute({ type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] }, immediateState, "2026-08-05T09:00:30.000Z");
  assert.equal(execution.event?.type, "AVAILABILITY_CHECKED");
  if (execution.event?.type !== "AVAILABILITY_CHECKED") throw new Error("expected availability result");
  assert.equal(execution.event?.availabilityChecks[fixtureCandidates[0]!.restaurant.id]?.status, "UNAVAILABLE");
  assert.deepEqual(received, {
    candidateIds: [fixtureCandidates[0]!.restaurant.id],
    candidates: [fixtureCandidates[0]!],
    date: fixtureIntent.date,
    timeWindow: { earliest: "12:00", latest: "12:00" },
    immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EARLIEST_IN_WINDOW" },
    partySize: fixtureIntent.partySize,
    hardCriteria: ["yakiniku"],
  });
});

test("Execution Router binds a fact-only read to known candidates and the authoritative recommendation intent", async () => {
  let received: unknown;
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { return { candidates: fixtureCandidates, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000, },
    {
      executionRoute: "STRUCTURED_ADAPTER",
      async inspectFacts(request) {
        received = request;
        return {
          evidence: [],
          factChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "UNKNOWN" as const, checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: [], reasonCode: "FIXTURE_UNKNOWN" }])),
          metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 },
        };
      },
    },
  );
  const searchedState: RestaurantTaskState = { ...state, phase: "SEARCHING", candidates: fixtureCandidates };
  const execution = await router.execute({ type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: [fixtureCandidates[0]!.restaurant.id] }, searchedState);
  assert.equal(execution.event?.type, "CANDIDATE_FACTS_CHECKED");
  assert.deepEqual(received, {
    candidateIds: [fixtureCandidates[0]!.restaurant.id],
    candidates: [fixtureCandidates[0]],
    intent: {
      timezone: fixtureIntent.timezone,
      target: fixtureIntent.target,
      date: fixtureIntent.date,
      timeWindow: fixtureIntent.timeWindow,
      partySize: fixtureIntent.partySize,
      area: fixtureIntent.area,
      criteria: fixtureIntent.criteria,
      budgetPerPerson: fixtureIntent.budgetPerPerson,
    },
  });
});

test("Execution Router keeps a shared browser startup failure candidate-scoped after all requested candidates fail", async () => {
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { return { candidates: fixtureCandidates, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    {
      executionRoute: "GENERIC_BROWSER",
      async check(request) {
        return {
          offers: [],
          availabilityChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "UNKNOWN" as const, checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: [], reasonCode: "BROWSER_RUNTIME_FAILED" }])),
          evidence: [],
          metadata: { provider: "TABELOG", route: "GENERIC_BROWSER", latencyMs: 1, failureCode: "BROWSER_RUNTIME_FAILED" },
        };
      },
    }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );
  const execution = await router.execute(
    { type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] },
    { ...state, phase: "SEARCHING", candidates: fixtureCandidates },
  );
  assert.equal(execution.failure, undefined);
});

test("Execution Router preserves all-provider browser failure evidence without escalating it to task terminal", async () => {
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { return { candidates: fixtureCandidates, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; } },
    {
      executionRoute: "GENERIC_BROWSER",
      async check(request) {
        return {
          offers: [],
          availabilityChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "UNKNOWN" as const, checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: [], reasonCode: "AVAILABILITY_SOURCES_EXHAUSTED" }])),
          evidence: [],
          metadata: {
            provider: "AVAILABILITY_SOURCE_RESOLVER",
            route: "GENERIC_BROWSER",
            latencyMs: 1,
            failureCode: "AVAILABILITY_SOURCES_EXHAUSTED",
            providerAttempts: request.candidateIds.flatMap((candidateId) => [
              { candidateId, provider: "TABLECHECK" as const, outcome: "PROVIDER_FAILURE" as const, failureCode: "BROWSER_RUNTIME_FAILED" },
              { candidateId, provider: "TABELOG" as const, outcome: "PROVIDER_FAILURE" as const, failureCode: "BROWSER_RUNTIME_FAILED" },
            ]),
          },
        };
      },
    }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );
  const execution = await router.execute(
    { type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] },
    { ...state, phase: "SEARCHING", candidates: fixtureCandidates },
  );
  assert.equal(execution.failure, undefined);
});


test("Router partial-port contract: an explicitly permitted alternate time is queried as a bounded range and presented as an alternate, without changing the original request (packs=Google; maxAgentSteps=6, maxRejectedActions=3, maxAutomaticBrowserMs=5000, maxStructuredReadMs=8000)", async () => {
  // Start/end: user semantic proposal → actual Hybrid Router request binding →
  // source grounding → Reducer/assessment presentation. Only model and source
  // transport are fixed; no State, Offer, or evidence is injected directly.
  const model = new PermittedAlternativeTimeModel(1, false, true);
  const google = googleFixture([], { maxRequests: 100 }, ["alternative"]);
  const requested: Array<{ timeWindow: { earliest: string; latest: string }; requestedTimeWindow?: { earliest: string; latest: string }; partySize: number; date: string }> = [];
  const availability = {
    executionRoute: "GENERIC_BROWSER" as const,
    async check(request: import("../domains/restaurant/contracts.js").RestaurantAvailabilityRequest) {
      requested.push({ date: request.date, partySize: request.partySize, timeWindow: structuredClone(request.timeWindow), ...(request.requestedTimeWindow ? { requestedTimeWindow: structuredClone(request.requestedTimeWindow) } : {}) });
      const candidate = request.candidates[0]!;
      const grounded = groundTableCheckAvailability(candidate, request, {
        candidateId: candidate.restaurant.id,
        sourceEntityId: "tablecheck:alternative", sourceUrl: "https://www.tablecheck.com/en/fixture-alternative",
        observedAt: now.toISOString(), requestedDate: request.date, requestedPartySize: request.partySize,
        entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] }, pageState: "AVAILABLE", visibleSlots: ["18:30"],
      }, now.toISOString());
      return {
        offers: grounded.offers, evidence: grounded.evidence,
        availabilityChecks: { [candidate.restaurant.id]: grounded.check },
        metadata: { provider: "TABLECHECK" as const, route: "GENERIC_BROWSER" as const, latencyMs: 0 },
      };
    },
  };
  const facts = {
    executionRoute: "STRUCTURED_ADAPTER" as const,
    async inspectFacts(request: import("../domains/restaurant/contracts.js").RestaurantCandidateFactRequest) {
      return {
        evidence: [], factChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "COMPLETED" as const, checkedAt: now.toISOString(), evidenceIds: [] }])),
        metadata: { provider: "GOOGLE_PLACES" as const, route: "STRUCTURED_ADAPTER" as const, latencyMs: 0 },
      };
    },
  };
  const taskId = "integration:permitted-alternative-time";
  const composition = createRouterFixtureComposition({
    taskId,
    runId: taskId,
    clock,
    model,
    google: google,
    unitAvailability: availability,
    config: { maxAgentSteps: 6, maxRejectedActions: 3, maxAutomaticBrowserMs: 5_000, maxStructuredReadMs: 8_000 },
    unitFacts: facts
  });
  await composition.interpretAndDispatch({ taskId, message: "Tomorrow at 7 PM for two; if unavailable, 30 minutes either side is fine.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL");
  const state = composition.runtime.snapshot(taskId).domainState;
  assert.deepEqual(state.intentDraft?.timeWindow, { earliest: "19:00", latest: "19:00" });
  assert.deepEqual(state.intentDraft?.permittedAlternativeTimeWindow, { earliest: "18:30", latest: "19:30" });
  assert.deepEqual(requested, [{ date: "2026-09-17", partySize: 2, timeWindow: { earliest: "18:30", latest: "19:30" }, requestedTimeWindow: { earliest: "19:00", latest: "19:00" } }]);
  const offer = state.availability[state.presentedResults!.candidateIds[0]!]![0]!;
  assert.equal(offer.dateTime.slice(11, 16), "18:30");
  assert.equal(offer.alternativeToRequestedTime, true);
  assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify(state.availabilityChecks));
});

test("Router partial-port contract: fresh request-bound inventory can receive missing facts before another inventory read and reach three results (packs=Google; maxAgentSteps=12, maxRejectedActions=3, maxAutomaticBrowserMs=10000, maxStructuredReadMs=8000)", async () => {
  // Start/end: semantic input -> Google discovery -> one grounded slot -> Google Details facts
  // -> remaining grounded slots/facts -> Runtime PRESENT_RESULTS. The scripted model proves a legal
  // path, not that Prompt@18 will choose it. Only model/source transports are fixed.
  const actions: string[] = [];
  const model: ModelGateway = { async complete(request) {
    if(request.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(request)!;
    if (request.purpose === "restaurant_semantic_interpret") return response(JSON.stringify({ schemaVersion: "3", facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "cafes", selectionScope: "OPEN_ENDED" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-17", raw: "tomorrow" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "13:00", latest: "13:00", raw: "1 pm" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
    ] }), "semantic-fresh-stock-facts");
    assert.equal(request.purpose, "restaurant_agent_decide");
    const { context } = JSON.parse(request.messages.find(item => item.role === "user")!.content) as { context: {
      candidates: Array<{ id: string }>; factInvestigableCandidateIds?: string[]; checkableCandidateIds?: string[];
      availability: Record<string, Array<{ dateTime: string; partySize: number; displayExpiresAt?: string }>>;
      presentation: Array<{ candidateId: string; eligible: boolean }>;
    } };
    let type: string; let ids: string[] = [];
    if (!context.candidates.length) type = "SEARCH_RESTAURANTS";
    else {
      const readyForFacts = context.factInvestigableCandidateIds?.find(id => context.availability[id]?.some(offer =>
        offer.dateTime.startsWith("2026-09-17T13:00") && offer.partySize === 2 && Date.parse(offer.displayExpiresAt ?? "") > now.valueOf()));
      if (readyForFacts) { type = "INVESTIGATE_CANDIDATE_FACTS"; ids = [readyForFacts]; }
      else if (context.checkableCandidateIds?.length) { type = "CHECK_AVAILABILITY"; ids = actions.length === 1 ? context.checkableCandidateIds.slice(0, 1) : context.checkableCandidateIds.slice(0, 3); }
      else if (context.factInvestigableCandidateIds?.length) { type = "INVESTIGATE_CANDIDATE_FACTS"; ids = context.factInvestigableCandidateIds.slice(0, 3); }
      else { type = "PRESENT_RESULTS"; ids = context.presentation.filter(item => item.eligible).map(item => item.candidateId); }
    }
    actions.push(`${type}:${ids.length}`);
    return response(JSON.stringify(strictAction(type, ids)), `fresh-stock-action-${actions.length}`);
  } };
  const google = googleFixture([], { maxRequests: 100 }, ["one", "two", "three"]);
  const availability = { executionRoute: "STRUCTURED_ADAPTER" as const,
    async check(request: import("../domains/restaurant/contracts.js").RestaurantAvailabilityRequest) {
      const grounded = request.candidates.map(candidate => groundTableCheckAvailability(candidate, request, {
        candidateId: candidate.restaurant.id, sourceEntityId: `tablecheck:${candidate.restaurant.id}`,
        sourceUrl: `https://www.tablecheck.com/en/${candidate.restaurant.id}`, observedAt: now.toISOString(),
        requestedDate: request.date, requestedPartySize: request.partySize,
        entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] }, pageState: "AVAILABLE", visibleSlots: ["13:00"],
      }, now.toISOString()));
      return { offers: grounded.flatMap(item => item.offers), evidence: grounded.flatMap(item => item.evidence),
        availabilityChecks: Object.fromEntries(grounded.map((item, index) => [request.candidates[index]!.restaurant.id, item.check])),
        metadata: { provider: "TABLECHECK" as const, route: "STRUCTURED_ADAPTER" as const, latencyMs: 0 } };
    },
  };
  const taskId = "integration:fresh-stock-facts";
  const composition = createRouterFixtureComposition({
    taskId,
    runId: taskId,
    clock,
    model,
    google: google,
    unitAvailability: availability,
    config: { maxAgentSteps: 12, maxRejectedActions: 3, maxAutomaticBrowserMs: 10_000, maxStructuredReadMs: 8_000 },
    unitFactsOnly: true
  });
  await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow at 1 pm for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL", JSON.stringify(actions));
  const state = composition.runtime.snapshot(taskId).domainState;
  assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ actions, presentation: projectRestaurantAgentContext(state, now.toISOString()).presentation }));
  assert.deepEqual(state.selectionSession?.resultBatchTarget, { candidateCount: 3, met: true });
  assert.equal(state.presentedResults?.candidateIds.length, 3);
  assert.deepEqual(actions.slice(0, 3), ["SEARCH_RESTAURANTS:0", "CHECK_AVAILABILITY:1", "INVESTIGATE_CANDIDATE_FACTS:1"]);
  assert.equal(actions.at(-1), "PRESENT_RESULTS:3");
});

test("Router partial-port contract: default delivery keeps a produced source-backed result when the next availability batch would consume the reserve (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=300000, maxStructuredReadMs=8000)", async () => {
  for (const mode of ["slow-read", "slow-decision"] as const) {
  const started = now.valueOf();
  let currentTime = started;
  const movingClock = { now: () => new Date(currentTime) };
  const source = googleFixture([], { maxRequests: 100 }, ["one", "two", "three"]);
  const actions: string[] = [];
  const model: ModelGateway = { async complete(input) {
    if(input.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(input)!;
    if (input.purpose === "restaurant_semantic_interpret") return response(JSON.stringify({ schemaVersion: "3", facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "find a table", selectionScope: "OPEN_ENDED" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-17", raw: "tomorrow" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 pm" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
    ] }), "semantic-delivery-reserve");
    assert.equal(input.purpose, "restaurant_agent_decide");
    const { context } = JSON.parse(input.messages.find((item) => item.role === "user")!.content) as {
      context: { candidates?: Array<{ id: string }>; presentation?: Array<{ candidateId: string; eligible: boolean }>; checkableCandidateIds?: string[] };
    };
    const eligible = context.presentation?.filter((item) => item.eligible).map((item) => item.candidateId) ?? [];
    const type = !context.candidates?.length ? "SEARCH_RESTAURANTS" : eligible.length && !context.checkableCandidateIds?.length
      ? "PRESENT_RESULTS" : "CHECK_AVAILABILITY";
    const ids = type === "PRESENT_RESULTS" ? eligible : type === "CHECK_AVAILABILITY"
      ? context.checkableCandidateIds!.slice(0, eligible.length ? 2 : 1) : [];
    if (mode === "slow-decision" && eligible.length && type === "CHECK_AVAILABILITY") currentTime = started + 256_000;
    actions.push(`${type}:${ids.length}`);
    return response(JSON.stringify(strictAction(type, ids)), `decision-${actions.length}`);
  } };
  let calls = 0;
  const availability = { executionRoute: "GENERIC_BROWSER" as const,
    async check(request: import("../domains/restaurant/contracts.js").RestaurantAvailabilityRequest, actionSignal: AbortSignal) {
      calls += 1;
      if (calls === 2) {
        await new Promise<void>((resolve) => {
          const fallback = setTimeout(resolve, 1_500);
          actionSignal.addEventListener("abort", () => { clearTimeout(fallback); resolve(); }, { once: true });
        });
        if (actionSignal.aborted) {
          currentTime = started + 255_000;
          throw actionSignal.reason;
        }
        currentTime = started + 300_000;
        return { offers: [], evidence: [], availabilityChecks: Object.fromEntries(request.candidateIds.map((id) => [id, { status: "UNKNOWN" as const, checkedAt: movingClock.now().toISOString(), evidenceIds: [], reasonCode: "BROWSER_TIMEOUT" as const }])),
          metadata: { provider: "TABLECHECK" as const, route: "GENERIC_BROWSER" as const, latencyMs: 46_000 } };
      }
      currentTime = started + 254_000;
      const candidate = request.candidates[0]!;
      const grounded = groundTableCheckAvailability(candidate, request, {
        candidateId: candidate.restaurant.id, sourceEntityId: "tablecheck:one", sourceUrl: "https://www.tablecheck.com/en/one",
        observedAt: movingClock.now().toISOString(), requestedDate: request.date, requestedPartySize: request.partySize,
        entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] }, pageState: "AVAILABLE", visibleSlots: ["19:00"],
      }, movingClock.now().toISOString());
      return { offers: grounded.offers, evidence: grounded.evidence, availabilityChecks: { [candidate.restaurant.id]: grounded.check },
        metadata: { provider: "TABLECHECK" as const, route: "GENERIC_BROWSER" as const, latencyMs: 254_000 } };
    },
  };
  const taskId = `integration:default-delivery-${mode}`;
  const composition = createRouterFixtureComposition({
    taskId,
    runId: taskId,
    clock: movingClock,
    model,
    google: source,
    unitAvailability: availability,
    config: { maxAgentSteps: 8, maxRejectedActions: 3, maxAutomaticBrowserMs: 300_000, maxStructuredReadMs: 8_000 }
  });
  await composition.interpretAndDispatch({ taskId, message: "Find a table nearby tomorrow at 7 pm for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
  const result = await composition.coordinator.run(taskId, undefined, new Date(started + 300_000));
  const final = composition.runtime.snapshot(taskId).domainState;
  assert.equal(result.status, "TERMINAL", JSON.stringify({ actions, calls, phase: final.phase }));
  assert.equal(final.phase, "PRESENT_RESULTS");
  assert.deepEqual(final.selectionSession?.resultBatchTarget, { candidateCount: 3, met: false });
  assert.equal(calls, mode === "slow-read" ? 2 : 1, "the read must not consume the delivery reserve");
  assert.equal(currentTime, started + (mode === "slow-read" ? 255_000 : 256_000));
  assert.equal(composition.trajectories.steps.some((item) => item.observation?.detail.startsWith("DELIVERY_RESERVE_REACHED")), mode === "slow-read");
  }
});

test("Router partial-port contract: model-call delivery reserve presents a source-backed short batch without relaxing qualification (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000)", async (t) => {
  // Start at the real Interpreter; replace only model transport and source reads.
  // The same counted transport is used for semantic and Agent calls. No State or
  // presentation eligibility is injected. The independent source slot is 19:00/2.
  for (const mode of ["ready", "crossing", "wrong-party", "expired", "explicit-count"] as const) {
    await t.test(mode, async () => {
      const taskId = `integration:call-delivery-${mode}`;
      const maxCalls = mode === "crossing" ? 8 : 7;
      const source = googleFixture([], { maxRequests: 100 }, ["one", "two", "three"]);
      const contexts: Array<{ remaining: number; checks: number }> = [];
      const provider: ModelGateway = { async complete(input) {
    if(input.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(input)!;
        if (input.purpose === "restaurant_semantic_interpret") return response(JSON.stringify({ schemaVersion: "3", facts: [
          { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "find a table", selectionScope: "OPEN_ENDED", ...(mode === "explicit-count" ? { requestedResultCount: 3 } : {}) } },
          { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-17", raw: "tomorrow" } },
          { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 pm" } },
          { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
          { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
        ] }), "semantic-call-reserve");
        const { context } = JSON.parse(input.messages.find(item => item.role === "user")!.content);
        const eligible = context.presentation?.filter((item: { eligible: boolean }) => item.eligible).map((item: { candidateId: string }) => item.candidateId) ?? [];
        contexts.push({ remaining: budget.remainingCalls(taskId)!, checks: context.checkableCandidateIds?.length ?? 0 });
        const type = context.readCompletion?.reason?.startsWith("MODEL_CALL_RESERVE") ? "END_READ" : !context.candidates?.length ? "SEARCH_RESTAURANTS"
          : context.checkableCandidateIds?.length ? "CHECK_AVAILABILITY" : "PRESENT_RESULTS";
        return response(JSON.stringify(strictAction(type, type === "CHECK_AVAILABILITY" ? context.checkableCandidateIds.slice(0, 1) : eligible)), `call-reserve-${contexts.length}`);
      } };
      const budget = new RunBoundedModelGateway(provider, maxCalls, 500_000);
      let reads = 0;
      const availability = { executionRoute: "GENERIC_BROWSER" as const,
        async check(request: import("../domains/restaurant/contracts.js").RestaurantAvailabilityRequest) {
          reads += 1;
          const observedAt = mode === "expired" ? new Date(now.valueOf() - 20 * 60_000).toISOString() : now.toISOString();
          const candidate = request.candidates[0]!;
          const grounded = groundTableCheckAvailability(candidate, request, {
            candidateId: candidate.restaurant.id, sourceEntityId: `tablecheck:${candidate.restaurant.id}`,
            sourceUrl: "https://www.tablecheck.com/en/one", observedAt,
            requestedDate: "2026-09-17", requestedPartySize: mode === "wrong-party" ? 4 : 2,
            entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] }, pageState: reads === 1 ? "AVAILABLE" : "EXTRACTION_FAILED", visibleSlots: reads === 1 ? ["19:00"] : [],
          }, now.toISOString());
          return { offers: grounded.offers, evidence: grounded.evidence, availabilityChecks: { [candidate.restaurant.id]: grounded.check },
            metadata: { provider: "TABLECHECK" as const, route: "GENERIC_BROWSER" as const, latencyMs: 0 } };
        },
      };
      const composition = createRouterFixtureComposition({
    taskId,
    runId: taskId,
    clock,
    model: budget,
    google: source,
    unitAvailability: availability,
    config: { maxAgentSteps: 10, maxRejectedActions: 3, maxAutomaticBrowserMs: 500_000, maxStructuredReadMs: 8_000 },
    remainingModelCalls: id => budget.remainingCalls(id)
  });
      await budget.run(taskId, async () => {
        await composition.interpretAndDispatch({ taskId, message: "Find a table nearby tomorrow at 7 pm for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
        await composition.coordinator.run(taskId);
      });
      const state = composition.runtime.snapshot(taskId).domainState;
      const windows = composition.runtime.eventLog.filter(item => item.event.type === "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED");
      if (mode === "crossing") {
        assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ contexts, state }));
        assert.equal(windows.length, 1);
        assert.equal(reads, 1, "budget reserve blocks another source read while an eligible result exists");
        assert.deepEqual(state.selectionSession?.resultBatchTarget, { candidateCount: 3, met: false });
        assert.equal(state.presentedResults?.candidateIds.length, 1);
        const offers = state.availability[state.presentedResults!.candidateIds[0]!]!;
        assert.equal(offers[0]?.dateTime, "2026-09-17T19:00:00+09:00");
        assert.equal(offers[0]?.partySize, 2);
        assert.equal(windows[0]!.event.type === "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED" && windows[0]!.event.deadlineAt, new Date(now.valueOf() + 45_000).toISOString());
        assert.ok((budget.usage(taskId)?.calls ?? Infinity) <= maxCalls);
        if (mode === "crossing") {
          assert.ok(contexts.some(item => item.remaining === 4 && item.checks > 0), "five calls before a decision does not open the window early");
          assert.ok(composition.trajectories.steps.some(item => item.actionValidation?.status === "REJECTED" && item.actionValidation.code === "PRESENTATION_READY"), "crossing the threshold during a decision blocks its now-stale read proposal");
        }
      } else {
        assert.notEqual(state.phase, "PRESENT_RESULTS");
        if (mode === "ready") {
          assert.equal(state.phase, "NO_VERIFIED_RESULT");
          assert.equal(reads, 0, "a reserve reached before qualification honestly ends with unread gaps");
          assert.deepEqual(state.noVerifiedResult?.investigatedCandidateIds, []);
        }
        assert.equal(windows.length, 0, "unqualified/stale inventory and explicit counts never get a default short-batch exception");
      }
    });
  }
});

test("Router partial-port contract: C0b reserves the last four calls inside a provider read and then presents (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000)", async (t) => {
  // Start at the real Interpreter; replace only model transport and source reads.
  // The same counted transport is used for semantic and Agent calls. No State or
  // presentation eligibility is injected. The independent source slot is 19:00/2.
  for (const mode of ["ready", "no-qualified", "expired"] as const) {
    await t.test(mode, async () => {
      const taskId = `integration:call-delivery-${mode}`;
      const maxCalls = 9;
      let currentNow = now;
      const readClock = { now: () => currentNow };
      const source = googleFixture([], { maxRequests: 100 }, ["one", "two", "three"]);
      const contexts: Array<{ remaining: number; checks: number }> = [];
      const provider: ModelGateway = { async complete(input) {
    if(input.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(input)!;
        if (input.purpose === "restaurant_semantic_interpret") return response(JSON.stringify({ schemaVersion: "3", facts: [
          { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "find a table", selectionScope: "OPEN_ENDED",  } },
          { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-17", raw: "tomorrow" } },
          { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 pm" } },
          { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
          { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
        ] }), "semantic-call-reserve");
        if (input.purpose === "browser_read_action") return response("{}", "browser-reserve");
        const { context } = JSON.parse(input.messages.find(item => item.role === "user")!.content);
        const eligible = context.presentation?.filter((item: { eligible: boolean }) => item.eligible).map((item: { candidateId: string }) => item.candidateId) ?? [];
        contexts.push({ remaining: budget.remainingCalls(taskId)!, checks: context.checkableCandidateIds?.length ?? 0 });
        if (mode === "expired" && reads === 1 && currentNow.valueOf() === now.valueOf()) currentNow = new Date(now.valueOf() + 2 * 60_000);
        const type = context.readCompletion?.reason?.startsWith("MODEL_CALL_RESERVE") ? "END_READ" : !context.candidates?.length ? "SEARCH_RESTAURANTS"
          : context.checkableCandidateIds?.length ? "CHECK_AVAILABILITY" : "PRESENT_RESULTS";
        return response(JSON.stringify(strictAction(type, type === "CHECK_AVAILABILITY" ? context.checkableCandidateIds.slice(0, 1) : eligible)), `call-reserve-${contexts.length}`);
      } };
      const budget = new RunBoundedModelGateway(provider, maxCalls, 500_000);
      const reserved = new DeliveryReservedModelGateway(budget);
      let reads = 0;
      const availability = { executionRoute: "GENERIC_BROWSER" as const,
        async check(request: import("../domains/restaurant/contracts.js").RestaurantAvailabilityRequest) {
          reads += 1;
          if (reads > 1) {
            for (let i = 0; i < 10; i++) {
              await reserved.complete({ taskId, purpose: "browser_read_action", promptVersion: "fixture", fallback: "FAIL_CLOSED",
                messages: [{ role: "user", content: "public source fixture" }], responseFormat: "JSON_OBJECT",
                outputSchema: { name: "fixture", version: "1", jsonSchema: {} }, timeoutMs: 1000 });
              // Expired source evidence is independent of the real run deadline.
            }
          }
          const observedAt = mode === "expired" ? new Date(now.valueOf() - 9 * 60_000).toISOString() : now.toISOString();
          const candidate = request.candidates[0]!;
          const grounded = groundTableCheckAvailability(candidate, request, {
            candidateId: candidate.restaurant.id, sourceEntityId: `tablecheck:${candidate.restaurant.id}`,
            sourceUrl: "https://www.tablecheck.com/en/one", observedAt,
            requestedDate: "2026-09-17", requestedPartySize: 2,
            entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] }, pageState: reads === 1 && mode !== "no-qualified" ? "AVAILABLE" : "EXTRACTION_FAILED", visibleSlots: reads === 1 && mode !== "no-qualified" ? ["19:00"] : [],
          }, now.toISOString());
          return { offers: grounded.offers, evidence: grounded.evidence, availabilityChecks: { [candidate.restaurant.id]: grounded.check },
            metadata: { provider: "TABLECHECK" as const, route: "GENERIC_BROWSER" as const, latencyMs: 0 } };
        },
      };
      const composition = createRouterFixtureComposition({
    taskId,
    runId: taskId,
    clock: readClock,
    model: reserved,
    google: source,
    unitAvailability: availability,
    config: { maxAgentSteps: 10, maxRejectedActions: 3, maxAutomaticBrowserMs: 500_000, maxStructuredReadMs: 8_000 },
    remainingModelCalls: id => budget.remainingCalls(id)
  });
      await budget.run(taskId, async () => {
        await composition.interpretAndDispatch({ taskId, message: "Find a table nearby tomorrow at 7 pm for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
        await composition.coordinator.run(taskId);
      });
      const state = composition.runtime.snapshot(taskId).domainState;
      const windows = composition.runtime.eventLog.filter(item => item.event.type === "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED");
      if (mode === "ready") {
        assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ contexts, state }));
        assert.equal(windows.length, 1);
        assert.equal(reads, 2);
        const stopped = composition.trajectories.steps.find(item => item.executionMetadata?.failureCode === "BUDGET_RESERVED_FOR_DELIVERY");
        assert.equal(stopped?.observation?.type, "AVAILABILITY_UNKNOWN");
        assert.equal(budget.usage(taskId)?.calls, 6, "one browser call followed by delivery preserves the four-call reserve");
        assert.deepEqual(state.selectionSession?.resultBatchTarget, { candidateCount: 3, met: false });
        assert.equal(state.presentedResults?.candidateIds.length, 1);
        const offers = state.availability[state.presentedResults!.candidateIds[0]!]!;
        assert.equal(offers[0]?.dateTime, "2026-09-17T19:00:00+09:00");
        assert.equal(offers[0]?.partySize, 2);
        assert.equal(windows[0]!.event.type === "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED" && windows[0]!.event.deadlineAt, new Date(now.valueOf() + 45_000).toISOString());
        assert.ok((budget.usage(taskId)?.calls ?? Infinity) <= maxCalls);

      } else {
        assert.equal(state.phase, "NO_VERIFIED_RESULT", JSON.stringify({ contexts, state }));
        assert.ok((budget.usage(taskId)?.calls ?? Infinity) < maxCalls, "honest completion precedes exhaustion");
        assert.ok(state.noVerifiedResult?.remainingGaps.some(gap => gap.includes("MODEL_CALL_RESERVE")));
        assert.ok(state.noVerifiedResult?.remainingGaps.some(gap => /EXTRACTION_FAILED|STALE|EXPIRED|expired/.test(gap)));
        assert.equal(state.failure?.code, undefined);
        assert.equal(windows.length, 0, "no qualified candidate means no presentation window");
      }
    });
  }
});

test("Router partial-port contract: C6a observed public hours end the immediate window only when every checked page has no opening period (packs=Google; maxAgentSteps=4, maxRejectedActions=3, maxAutomaticBrowserMs=5000, maxStructuredReadMs=8000)", async t => {
  for(const mode of ["closed","outside","open","partial","unknown","malformed","ambiguous-closed","wrong-day","overnight","api-only","explicit-time","one-closed","three-two-closed-one-open"] as const) await t.test(mode, async()=>{
    const taskId=`hours:${mode}`;let inventoryReads=0;
    const provider:ModelGateway={async complete(input){
    if(input.purpose==='restaurant_discovery_retrieval')return Promise.resolve(scriptedRetrieval(input)!);
      if(input.purpose==='restaurant_semantic_interpret')return response(JSON.stringify({schemaVersion:'3',facts:[
        {field:'TARGET',operation:'ASSERT',value:{kind:'TARGET',goal:'AVAILABILITY',query:'restaurants',selectionScope:'OPEN_ENDED'}},
        {field:'TIME_WINDOW',operation:'ASSERT',value:mode==='explicit-time'?{kind:'TIME_WINDOW',earliest:'12:00',latest:'12:30',raw:'noon'}:{kind:'TIME_WINDOW',relativeOffsetMinutes:0,raw:'right now'}},
        {field:'DATE',operation:'ASSERT',value:{kind:'DATE',relativeDay:'TODAY',raw:'today'}},
        {field:'PARTY_SIZE',operation:'ASSERT',value:{kind:'PARTY_SIZE',value:2}},
        {field:'AREA',operation:'ASSERT',value:{kind:'AREA',query:'nearby'}}, {field:'CRITERION',operation:'ASSERT',value:{kind:'CRITERION',text:'cafe',polarity:'POSITIVE',strength:'HARD'}}]}),'hours-semantic');
      if(input.purpose==='browser_read_decide')return response(JSON.stringify({action:'REQUEST_HUMAN_HELP',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'No further public control'}),'hours-browser');
      const {context}=JSON.parse(input.messages.find(x=>x.role==='user')!.content);
      const type=context.searchAvailability.reason==='IMMEDIATE_SOURCES_CLOSED'?'END_READ':!context.candidates.length?'SEARCH_RESTAURANTS':context.factInvestigableCandidateIds?.length?'INVESTIGATE_CANDIDATE_FACTS':'CHECK_AVAILABILITY';
      return response(JSON.stringify(strictAction(type,type==='INVESTIGATE_CANDIDATE_FACTS'?context.factInvestigableCandidateIds:type==='CHECK_AVAILABILITY'?context.checkableCandidateIds:[])),'hours-agent');
    }};
    const places=(mode==='one-closed'?['a']:['a','b','c']).map((id,index)=>({id,displayName:{text:`Cafe ${id}`},formattedAddress:`${index+1} Ginza, Tokyo`,location:{latitude:35.6697,longitude:139.767},types:mode==='api-only'?['cafe']:['restaurant'],...(mode==='api-only'?{regularOpeningHours:{weekdayDescriptions:['Wednesday: Closed']}}:{}),websiteUri:`https://${id}.example/about`}));
    const client=new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async(url,init)=>new Response(JSON.stringify(init?.method==='POST'?{places}:places.find(p=>String(url).endsWith('/'+p.id))),{status:200})});
    const google=client;
    const browser:BrowserRuntime={openSession:async()=>{let current='';return {metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now.toISOString()},async navigate(value){current=value;},async snapshot(){const p=places.find(p=>p.websiteUri===current)!;const hours=mode==='wrong-day'?'Tuesday: Closed':mode==='overnight'?'Tuesday: 18:00 - 13:00\nWednesday: Closed':mode==='closed'||mode==='explicit-time'?'Wednesday: Closed':mode==='outside'?'Wednesday: 18:00 - 23:00':p.id==='b'&&mode==='unknown'?undefined:p.id==='b'&&mode==='malformed'?'Wednesday: See website':p.id==='b'&&mode==='ambiguous-closed'?'Wednesday: Not closed':p.id==='b'&&mode==='partial'?'Wednesday: 12:15 - 18:00':(p.id==='b'&&mode==='open'||p.id==='c'&&mode==='three-two-closed-one-open')?'Wednesday: 10:00 - 18:00':'Wednesday: Closed';const data={'@type':'CafeOrCoffeeShop',name:p.displayName.text,address:p.formattedAddress,...(hours?{openingHours:hours.split('\n')}:{})};return {url:current,title:p.displayName.text,text:`${p.displayName.text}\n${p.formattedAddress}\n${hours??'Hours unknown'}`,html:`<script type="application/ld+json">${JSON.stringify(data)}</script><h1>${p.displayName.text}</h1><p>${p.formattedAddress}</p>`};},async click(){},async fill(){},async select(){return[];},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};}};
    const availability={executionRoute:'GENERIC_BROWSER' as const,async check(){inventoryReads++;throw new Error('fixture stops after observing whether inventory work remains legal');}};
    const composition=createRouterFixtureComposition({
    taskId,
    runId:taskId,
    clock,
    model:provider,
    google: google,
    unitAvailability: availability,
    browser,
    config: { maxAgentSteps: 4, maxRejectedActions: 3, maxAutomaticBrowserMs: 5000, maxStructuredReadMs: 8_000 }
  });
    await composition.interpretAndDispatch({taskId,message:'Find restaurants nearby right now for two',referenceTime:now.toISOString(),timezone:'Asia/Tokyo'},HIGASHI_GINZA_EVALUATION_LOCATION);
    await composition.coordinator.run(taskId);
    const state=composition.runtime.snapshot(taskId).domainState;
    if(mode==='closed'||mode==='outside'){
      assert.equal(state.phase,'NO_VERIFIED_RESULT',JSON.stringify(state));assert.equal(inventoryReads,0);
      assert.match(state.noVerifiedResult?.remainingGaps.join(' ')??'',/nearest bookable time/);
      assert.ok(Object.values(state.availabilityChecks).every(check=>check.status!=='UNAVAILABLE'));
    }else assert.ok(inventoryReads>0,'one closed outlet, an open/unknown source or non-immediate hours cannot suppress further reads');
  });
});

test("Router partial-port contract: reserve checkpoints retain completed outlets and mark only unfinished ones UNKNOWN (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=mode===\"availability-time\"?300000:500000, maxStructuredReadMs=8000)", async t => {
  for (const mode of ["availability-call","availability-time","empty-call","facts-call"] as const) await t.test(mode,async()=>{
    const taskId=`fixture:checkpoint:${mode}`, started=now.valueOf(); let instant=started, inspected=0;
    const readClock={now:()=>new Date(instant)};
    const search=googleFixture([],{maxRequests:100},["one","two","three",...(mode==="availability-time"?["four"]:[])]);
    const delegate:ModelGateway={async complete(input){
    if(input.purpose==='restaurant_discovery_retrieval')return Promise.resolve(scriptedRetrieval(input)!);
      if(input.purpose==="restaurant_semantic_interpret")return response(JSON.stringify({schemaVersion:"3",facts:[
        {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:mode==="facts-call"?"RECOMMENDATION":"AVAILABILITY",query:"nearby restaurants",selectionScope:"OPEN_ENDED"}},
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:"2026-09-17",raw:"tomorrow"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:"19:00",latest:"19:00",raw:"7pm"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:2}},
        {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"nearby"}},
        ...(mode==="facts-call"?[{field:"CRITERION",operation:"ASSERT",value:{kind:"CRITERION",text:"cafe",strength:"HARD",polarity:"POSITIVE"}}]:[])
      ]}),"semantic");
      if(input.purpose==="checkpoint-read")return response("{}","read");
      const {context:c}=JSON.parse(input.messages.find(x=>x.role==="user")!.content);
      const eligible=(c.presentation??[]).filter((x:{eligible:boolean})=>x.eligible).map((x:{candidateId:string})=>x.candidateId);
      const ids=(mode==="facts-call"?c.factInvestigableCandidateIds:c.checkableCandidateIds)??[];
      const type=c.readCompletion?.reason?.startsWith("MODEL_CALL_RESERVE")?"END_READ":!c.candidates?.length?"SEARCH_RESTAURANTS":ids.length?(mode==="facts-call"?"INVESTIGATE_CANDIDATE_FACTS":"CHECK_AVAILABILITY"):eligible.length?"PRESENT_RESULTS":"END_READ";
      return response(JSON.stringify(strictAction(type,type==="PRESENT_RESULTS"?eligible:ids.slice(0,mode==="availability-time"&&inspected===0?1:3))),"agent");
    }};
    const budget=new RunBoundedModelGateway(delegate,mode==="empty-call"?8:mode==="availability-time"?50:12,500_000);
    const reserved=new DeliveryReservedModelGateway(budget);
    const sourceCalls=async(signal:AbortSignal)=>{
      inspected++;
      if(mode==="availability-time"){
        if(inspected===1)instant=started+254_000;
        if(inspected===3)await new Promise<never>((_,reject)=>{
          const abort=()=>{instant=started+255_000;reject(signal.reason)};
          if(signal.aborted)abort();else signal.addEventListener("abort",abort,{once:true});
        });
      }else if(inspected===(mode==="empty-call"?1:2))for(let n=0;n<15;n++)await reserved.complete({taskId,purpose:"checkpoint-read",promptVersion:"fixture",messages:[],responseFormat:"JSON_OBJECT",outputSchema:{name:"fixture",version:"1"},timeoutMs:1000,fallback:"FAIL_CLOSED"});
    };
    const availability={executionRoute:"GENERIC_BROWSER" as const,async check(request:import("../domains/restaurant/contracts.js").RestaurantAvailabilityRequest,signal:AbortSignal){
      const outputs:Array<ReturnType<typeof groundTableCheckAvailability>>=[];
      for(const candidate of request.candidates){
        await sourceCalls(signal);
        outputs.push(groundTableCheckAvailability(candidate,request,{candidateId:candidate.restaurant.id,sourceEntityId:`tc:${candidate.restaurant.id}`,sourceUrl:"https://www.tablecheck.com/en/fixture",observedAt:readClock.now().toISOString(),requestedDate:request.date,requestedPartySize:request.partySize,entityMatch:{confidence:"HIGH",matchedBy:["EXACT_PHONE"]},pageState:"AVAILABLE",visibleSlots:["19:00"]},readClock.now().toISOString()));
      }
      return {offers:outputs.flatMap(x=>x.offers),evidence:outputs.flatMap(x=>x.evidence),availabilityChecks:Object.fromEntries(request.candidateIds.map((id,i)=>[id,outputs[i]!.check])),metadata:{provider:"TABLECHECK" as const,route:"GENERIC_BROWSER" as const,latencyMs:0}};
    }};
    const {groundRestaurantWebsiteFacts}=await import("../domains/restaurant/read-grounding.js");
    const facts={executionRoute:"GENERIC_BROWSER" as const,async inspectFacts(request:import("../domains/restaurant/contracts.js").RestaurantCandidateFactRequest,signal:AbortSignal){
      const outputs:Array<ReturnType<typeof groundRestaurantWebsiteFacts>>=[];
      for(const candidate of request.candidates){await sourceCalls(signal);outputs.push(groundRestaurantWebsiteFacts(candidate,request.intent,{candidateId:candidate.restaurant.id,sourceUrl:"https://fixture.example/"+candidate.restaurant.id,observedAt:readClock.now().toISOString(),entityMatch:{confidence:"HIGH",matchedBy:["EXACT_PHONE"]},restaurantTypeFacts:["cafe"],regularOpeningHours:["Thursday: 00:00–23:59"]}));}
      return {evidence:outputs.flatMap(x=>x.evidence),factChecks:Object.fromEntries(request.candidateIds.map((id,i)=>[id,{status:outputs[i]!.status,checkedAt:readClock.now().toISOString(),evidenceIds:outputs[i]!.evidence.map(x=>x.evidenceId)}])),metadata:{provider:"RESTAURANT_WEBSITE" as const,route:"GENERIC_BROWSER" as const,latencyMs:0}};
    }};
    const composition=createRouterFixtureComposition({
    taskId,
    runId:taskId,
    clock:readClock,
    model:reserved,
    google: search,
    unitAvailability: availability,
    config: { maxAgentSteps: 10, maxRejectedActions: 3, maxAutomaticBrowserMs: mode==="availability-time"?300_000:500_000, maxStructuredReadMs: 8_000 },
    remainingModelCalls:id=>budget.remainingCalls(id),
    ...(mode==="facts-call"?{unitFacts: facts}:{})
  });
    await budget.run(taskId,async()=>{await composition.interpretAndDispatch({taskId,message:"Find nearby restaurants tomorrow at 7pm for two.",referenceTime:now.toISOString(),timezone:"Asia/Tokyo"},HIGASHI_GINZA_EVALUATION_LOCATION);await composition.coordinator.run(taskId,undefined,new Date(started+(mode==="availability-time"?300_000:500_000)));});
    const state=composition.runtime.snapshot(taskId).domainState;
    assert.equal(state.failure,undefined);
    assert.equal(state.phase,mode==="empty-call"?"NO_VERIFIED_RESULT":"PRESENT_RESULTS",JSON.stringify({mode,inspected,state}));
    const checks=mode==="facts-call"?state.factChecks!:state.availabilityChecks;
    assert.equal(Object.values(checks).filter(x=>x.status==="UNKNOWN"&&x.reasonCode==="RESERVE_REACHED").length,mode==="empty-call"?3:2);
    const accepted=state.presentedResults?.candidateIds??[];
    assert.equal(accepted.length,mode==="empty-call"?0:mode==="availability-time"?2:1);
    assert.ok(composition.runtime.eventLog.some(x=>x.event.type===(mode==="empty-call"?"READ_END_WINDOW_OPENED":"DEFAULT_BATCH_DELIVERY_WINDOW_OPENED")));
    assert.ok((budget.usage(taskId)?.calls??Infinity)<(mode==="availability-time"?50:mode==="empty-call"?8:12));
  });
});
