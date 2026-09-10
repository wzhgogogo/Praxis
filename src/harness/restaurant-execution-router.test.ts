import assert from "node:assert/strict";
import { test } from "node:test";

import { RestaurantExecutionRouter } from "../application/restaurant-execution-router.js";
import type { RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { fixtureCandidates, fixtureIntent } from "./restaurant-fixtures.js";

const state: RestaurantTaskState = {
  schemaVersion: "10",
  phase: "UNDERSTANDING",
  intentDraft: { ...fixtureIntent, schemaVersion: "3" },
  candidates: [],
  availability: {},
  availabilityChecks: {},
  readEvidence: [],
  searchRevision: 0,
};

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
    { structuredReadTimeoutMs: 1 },
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
    { structuredReadTimeoutMs: 1 },
  );

  const execution = await router.execute({ type: "SEARCH_RESTAURANTS" }, state);

  assert.equal(execution.failure?.source, "PROVIDER");
  assert.equal(execution.failure?.code, "SEARCH_FAILED");
  assert.match(execution.failure?.reason ?? "", /timed out after 1ms/);
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
    },
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

test("Execution Router marks a shared browser startup failure terminal after all requested candidates fail", async () => {
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
    },
  );
  const execution = await router.execute(
    { type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] },
    { ...state, phase: "SEARCHING", candidates: fixtureCandidates },
  );
  assert.equal(execution.failure?.code, "BROWSER_RUNTIME_FAILED");
  assert.equal(execution.failure?.terminal, true);
});

test("Execution Router preserves an all-provider browser failure as terminal after source fallback is exhausted", async () => {
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
    },
  );
  const execution = await router.execute(
    { type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] },
    { ...state, phase: "SEARCHING", candidates: fixtureCandidates },
  );
  assert.equal(execution.failure?.code, "BROWSER_RUNTIME_FAILED");
  assert.equal(execution.failure?.terminal, true);
});
