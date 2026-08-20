import assert from "node:assert/strict";
import { test } from "node:test";

import { RestaurantExecutionRouter } from "../application/restaurant-execution-router.js";
import type { RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { fixtureCandidates, fixtureIntent } from "./restaurant-fixtures.js";

const state: RestaurantTaskState = {
  schemaVersion: "8",
  phase: "UNDERSTANDING",
  intentDraft: { ...fixtureIntent, schemaVersion: "3" },
  candidates: [],
  availability: {},
  searchRevision: 0,
};

test("Execution Router aborts and bounds a Provider search read that exceeds its deadline", async () => {
  let sawAbort = false;
  const router = new RestaurantExecutionRouter(
    {
      async search(_request, signal) {
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            sawAbort = true;
            reject(signal.reason);
          }, { once: true });
        });
      },
    },
    { async check() { return []; } },
    { providerReadTimeoutMs: 1 },
  );

  const execution = await router.execute({ type: "SEARCH_RESTAURANTS" }, state);

  assert.equal(sawAbort, true);
  assert.equal(execution.failure?.source, "PROVIDER");
  assert.equal(execution.failure?.code, "SEARCH_FAILED");
  assert.match(execution.failure?.reason ?? "", /timed out after 1ms/);
  assert.deepEqual(execution.event, {
    type: "SEARCH_FAILED",
    reason: "Restaurant search timed out after 1ms",
  });
});

test("Execution Router returns at its deadline even when a Provider ignores abort", async () => {
  const router = new RestaurantExecutionRouter(
    {
      async search() {
        return new Promise(() => {});
      },
    },
    { async check() { return []; } },
    { providerReadTimeoutMs: 1 },
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
    { async search() { return fixtureCandidates; } },
    {
      async check(request, signal) {
        receivedRequest = request;
        receivedSignal = signal;
        return [];
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
    date: fixtureIntent.date,
    timeWindow: fixtureIntent.timeWindow,
    partySize: fixtureIntent.partySize,
  });
});
