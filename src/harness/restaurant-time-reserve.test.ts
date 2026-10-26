import assert from "node:assert/strict";
import test from "node:test";
import type { ModelGateway, ModelResponse } from "../core/model/contracts.js";
import type { RestaurantAgentContext } from "../domains/restaurant/agent-context.js";
import { groundTableCheckAvailability } from "../domains/restaurant/read-grounding.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "../eval/restaurant/agent-loop/live-evaluation-location.js";
import { createRouterFixtureComposition, fixtureGoalBasis, googleFixture, now, response, scriptedRetrieval, strictAction } from "./restaurant-read-test-fixtures.js";

// Local construction, not website replay: the real Interpreter, Compiler,
// Coordinator, Router, grounder and Reducer consume scripted external reads.
// The independent fixture oracle is exactly one outlet, 2026-09-17 19:00/2.
test("F6 whole-read reserve: 100-second admission, completed children and bounded closing", async t => {
  const modes = ["normal-100", "zero-empty", "slow-empty-model", "unsupported-hard", "thinking-crosses", "partial", "wrong-identity", "wrong-date", "wrong-party", "wrong-time", "expired", "zero-calls", "last-model-fails", "slow-model", "slow-close", "unsettled-close"] as const;
  for (const mode of modes) await t.test(mode, { timeout: 5_000 }, async tt => {
    tt.mock.timers.enable({ apis: ["setTimeout", "Date"], now: now.valueOf() });
    const start = now.valueOf(), deadline = start + 500_000, taskId = `fixture:f6:${mode}`;
    let instant = start, reads = 0, agentCalls = 0, modelBalance = 50;
    let notifyBlocked!: () => void, releaseRead!: () => void, releaseModel!: (result: ModelResponse) => void;
    const blocked = new Promise<void>(resolve => { notifyBlocked = resolve; });
    const readClock = { now: () => new Date(instant) };
    const source = googleFixture([], { maxRequests: 40 }, ["one", "two", "three"]);
    const originalSearch = source.client.textSearchPage.bind(source.client);
    source.client.textSearchPage = async (...args) => {
      const value = await originalSearch(...args);
      instant = deadline - (["zero-empty", "slow-empty-model", "unsupported-hard"].includes(mode) ? 20_000 : 100_000);
      if (mode === "zero-empty") modelBalance = 0;
      return value;
    };
    const originalNearby = source.client.nearbySearch.bind(source.client);
    source.client.nearbySearch = async (...args) => {
      const value = await originalNearby(...args);
      instant = deadline - (["zero-empty", "slow-empty-model", "unsupported-hard"].includes(mode) ? 20_000 : 100_000);
      if (mode === "zero-empty") modelBalance = 0;
      return value;
    };
    const partial = ["partial", "wrong-identity", "wrong-date", "wrong-party", "wrong-time", "expired", "slow-close", "unsettled-close"].includes(mode);
    const contexts: RestaurantAgentContext[] = [];
    const model: ModelGateway = { async complete(input) {
      if (input.purpose === "restaurant_discovery_retrieval") return scriptedRetrieval(input)!;
      if (input.purpose === "restaurant_semantic_interpret") return response(JSON.stringify({ schemaVersion: "4", facts: [
        { field: "TARGET", operation: "ASSERT", value: { goalBasis: fixtureGoalBasis(input), kind: "TARGET", goal: "AVAILABILITY", query: "find a table", selectionScope: "OPEN_ENDED" } },
        { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-17", raw: "tomorrow" } },
        { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 pm" } },
        { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
        { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
        ...(mode === "unsupported-hard" ? [{ field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "fugu", strength: "HARD", polarity: "POSITIVE" } }] : []),
      ] }), "semantic-f6");
      assert.equal(input.purpose, "restaurant_agent_decide");
      agentCalls++;
      const context = JSON.parse(input.messages.find(x => x.role === "user")!.content).context as RestaurantAgentContext;
      contexts.push(context);
      if (reads && mode === "slow-model" || context.candidates.length && mode === "slow-empty-model") {
        assert.ok(input.timeoutMs <= 30_000);
        notifyBlocked();
        return new Promise<ModelResponse>(resolve => { releaseModel = resolve; });
      }
      if (reads && mode === "last-model-fails") throw new Error("local closing transport failure");
      if (!context.candidates.length) return response(JSON.stringify(strictAction("SEARCH_RESTAURANTS")), "agent-search");
      if (context.legalActions.checkAvailability.length) {
        if (mode === "thinking-crosses") instant = deadline - 49_000;
        return response(JSON.stringify(strictAction("CHECK_AVAILABILITY", context.legalActions.checkAvailability.slice(0, partial ? 2 : 1))), "agent-check");
      }
      return response(JSON.stringify(strictAction(context.legalActions.presentResults.length ? "PRESENT_RESULTS" : "END_READ", context.legalActions.presentResults)), "agent-conclude");
    } };
    const availability = { executionRoute: "GENERIC_BROWSER" as const, async check(request: import("../domains/restaurant/contracts.js").RestaurantAvailabilityRequest, signal: AbortSignal) {
      reads++;
      if (reads === 2) {
        notifyBlocked();
        await new Promise<void>(resolve => {
          releaseRead = resolve;
          signal.addEventListener("abort", () => {
            instant = deadline - 20_000;
            if (mode === "unsettled-close") return;
            if (mode === "slow-close") setTimeout(() => { instant += 1_000; resolve(); }, 1_000);
            else resolve();
          }, { once: true });
        });
        // Intentionally return late available data: checkpoints must reject it.
      } else {
        assert.equal(deadline - instant, 100_000, "the first read starts between the median threshold and the withdrawn 190-second threshold");
        instant = partial ? deadline - 30_000 : deadline - 50_000;
        if (partial) tt.mock.timers.tick(70_000);
        if (mode === "zero-calls") modelBalance = 0;
      }
      const candidate = request.candidates[0]!;
      const grounded = groundTableCheckAvailability(candidate, request, {
        candidateId: candidate.restaurant.id,
        sourceEntityId: `tc:${candidate.restaurant.id}`,
        sourceUrl: "https://www.tablecheck.com/en/fixture",
        observedAt: new Date(instant - (mode === "expired" ? 20 * 60_000 : 0)).toISOString(),
        requestedDate: mode === "wrong-date" ? "2026-09-18" : "2026-09-17",
        requestedPartySize: mode === "wrong-party" ? 4 : 2,
        entityMatch: mode === "wrong-identity" ? { confidence: "LOW", matchedBy: [] } : { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] },
        pageState: "AVAILABLE", visibleSlots: [mode === "wrong-time" ? "21:00" : "19:00"],
      }, readClock.now().toISOString());
      return { offers: grounded.offers, evidence: grounded.evidence, availabilityChecks: { [candidate.restaurant.id]: grounded.check }, metadata: { provider: "TABLECHECK" as const, route: "GENERIC_BROWSER" as const, latencyMs: 0 } };
    } };
    const composition = createRouterFixtureComposition({ taskId, runId: taskId, clock: readClock, model, google: source, unitAvailability: availability,
      config: { maxAgentSteps: 10, maxRejectedActions: 3, maxAutomaticBrowserMs: 500_000, maxStructuredReadMs: 8_000 }, remainingModelCalls: () => modelBalance });
    await composition.interpretAndDispatch({ taskId, message: "Find a table nearby tomorrow at 7 pm for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION);
    const pending = composition.coordinator.run(taskId, undefined, new Date(deadline));
    if (partial) {
      await blocked;
      instant = deadline - 20_000;
      tt.mock.timers.tick(10_000);
      if (mode === "slow-close" || mode === "unsettled-close") {
        // The abort handler registers its close timer synchronously.
        tt.mock.timers.tick(mode === "slow-close" ? 1_000 : 2_000);
        if (mode === "unsettled-close") instant += 2_000;
      }
    } else if (mode === "slow-model" || mode === "slow-empty-model") {
      await blocked;
      instant = deadline - 2_000;
      tt.mock.timers.tick(mode === "slow-empty-model" ? 18_000 : 48_000);
    }
    const result = await pending;
    const final = composition.runtime.snapshot(taskId).domainState;
    assert.ok(instant < deadline, "closing stays inside the original 500 seconds");
    if (mode !== "unsettled-close") assert.equal(final.failure, undefined);
    const shouldPresent = ["normal-100", "partial", "zero-calls", "last-model-fails", "slow-model", "slow-close"].includes(mode);
    assert.equal(final.phase, mode === "unsettled-close" ? "FAILED" : shouldPresent ? "PRESENT_RESULTS" : "NO_VERIFIED_RESULT", JSON.stringify({ mode, result, reads, failure: final.failure, contexts: contexts.map(c => c.legalActions) }));
    assert.equal(reads, ["thinking-crosses", "zero-empty", "slow-empty-model", "unsupported-hard"].includes(mode) ? 0 : partial ? 2 : 1);
    assert.ok(contexts.some(c => c.readBudget?.remainingMs === (["slow-empty-model", "unsupported-hard"].includes(mode) ? 20_000 : mode === "zero-empty" ? 500_000 : 100_000)));
    if (reads) assert.ok(contexts.slice(2).every(c => !c.legalActions.search && !c.legalActions.checkAvailability.length && !c.legalActions.investigateCandidateFacts.length));
    if (shouldPresent) {
      const shown = final.presentedResults!.candidateIds;
      assert.equal(shown.length, 1);
      const offers = final.availability[shown[0]!]!;
      assert.ok(offers.length);
      assert.ok(offers.every(o => o.dateTime === "2026-09-17T19:00:00+09:00" && o.partySize === 2), "compare the independent raw fixture slot/party oracle");
      assert.deepEqual(final.selectionSession?.resultBatchTarget, { candidateCount: 3, met: false });
    } else assert.equal(final.presentedResults, undefined);
    if (partial && mode !== "unsettled-close") {
      const checked = Object.values(final.availabilityChecks);
      assert.equal(checked.filter(c => c.reasonCode === "RESERVE_REACHED").length, 1);
      assert.equal(Object.keys(final.availability).filter(id => final.availability[id]?.length).length, shouldPresent ? 1 : 0);
      assert.ok(composition.runtime.eventLog.some(x => x.event.type === "AVAILABILITY_CHECKED"));
    }
    if (mode === "zero-empty") {
      assert.equal(agentCalls, 1);
      assert.equal(final.noVerifiedResult?.investigatedCandidateIds.length, 0);
      assert.ok(final.noVerifiedResult!.remainingGaps.length > 0);
    }
    if (mode === "zero-calls") assert.equal(agentCalls, 2, "no extra closing model call when the trusted balance is zero");
    if (mode === "unsettled-close") {
      assert.equal(final.failure?.code, "READ_CANCELLATION_UNSETTLED");
      assert.equal(final.noVerifiedResult, undefined, "do not claim normal completion or preservation when source settlement failed");
    }
    if (mode === "slow-model" || mode === "slow-empty-model" || mode === "unsettled-close") {
      const version = composition.runtime.snapshot(taskId).version, calls = agentCalls;
      if (mode === "slow-model" || mode === "slow-empty-model") releaseModel(response(JSON.stringify({ ...strictAction("CHECK_AVAILABILITY", ["forged"]), retrievalHint: "late non-placeholder" }), "late-model"));
      else releaseRead();
      await new Promise<void>(resolve => setImmediate(resolve));
      assert.equal(composition.runtime.snapshot(taskId).version, version);
      assert.equal(agentCalls, calls, "late work cannot initiate another model correction or mutate the completed task");
    }
  });
});
