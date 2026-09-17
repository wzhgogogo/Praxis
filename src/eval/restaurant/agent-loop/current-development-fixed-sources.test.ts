import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway } from "../../../core/model/contracts.js";
import { createCurrentDevelopmentFixedSources } from "./current-development-fixed-sources.js";
import { currentDevelopmentSourceScenario } from "./current-development-source-scenarios.js";

const model: ModelGateway = { async complete() { throw new Error("the deterministic source pages must not need a model browser action"); } };
const intent = {
  timezone: "Asia/Tokyo" as const,
  target: { goal: "AVAILABILITY" as const, query: "vegetarian lunch" },
  date: "2026-08-20",
  timeWindow: { earliest: "12:30", latest: "12:30" },
  area: { query: "near Shibuya" },
  criteria: [{ text: "vegetarian restaurant", polarity: "POSITIVE" as const, strength: "HARD" as const }],
};

test("fixed source discovery is candidate-scoped and accepts equivalent retrieval wording", async () => {
  const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("multi-candidate-control"), "2026-08-19T08:00:00.000Z", model);
  const equivalent = await sources.search.search({ intent: { ...intent, target: { ...intent.target, query: "vegetarian places around Shibuya" } }, readRunId: "source-equivalent" }, new AbortController().signal);
  assert.deepEqual(equivalent.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces), ["offline-multi-unavailable", "offline-multi-available"]);
  const wrong = await sources.search.search({ intent: { ...intent, target: { ...intent.target, query: "sushi near Tsukiji" } }, readRunId: "source-wrong" }, new AbortController().signal);
  assert.deepEqual(wrong.candidates, [], "an unrelated legal query must not inherit the scenario's successful outlets");
});

test("fixed source keeps inventory with its own candidate and request scope", async () => {
  const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("multi-candidate-control"), "2026-08-19T08:00:00.000Z", model);
  const discovery = await sources.search.search({ intent, readRunId: "source-inventory" }, new AbortController().signal);
  const read = await sources.availability.check({
    candidateIds: discovery.candidates.map((candidate) => candidate.restaurant.id), candidates: discovery.candidates,
    date: "2026-08-20", partySize: 3, timeWindow: { earliest: "12:30", latest: "12:30" }, hardCriteria: ["vegetarian restaurant"],
  }, new AbortController().signal);
  const first = discovery.candidates.find((candidate) => candidate.restaurant.sourceIds.googlePlaces === "offline-multi-unavailable")!;
  const second = discovery.candidates.find((candidate) => candidate.restaurant.sourceIds.googlePlaces === "offline-multi-available")!;
  assert.equal(read.availabilityChecks[first.restaurant.id]?.status, "UNAVAILABLE");
  assert.equal(read.availabilityChecks[second.restaurant.id]?.status, "AVAILABLE");
  assert.deepEqual(read.offers.map((offer) => offer.restaurantId), [second.restaurant.id], "an available slot cannot be copied to the first candidate");
  const wrongParty = await sources.availability.check({
    candidateIds: [second.restaurant.id], candidates: [second],
    date: "2026-08-20", partySize: 4, timeWindow: { earliest: "12:30", latest: "12:30" }, hardCriteria: ["vegetarian restaurant"],
  }, new AbortController().signal);
  assert.equal(wrongParty.availabilityChecks[second.restaurant.id]?.status, "UNKNOWN");
  assert.ok(sources.calls.coverageGaps.some((message) => message.includes("pax=4")), `missing explicit fixture coverage gap: ${JSON.stringify(sources.calls.coverageGaps)}`);
});
