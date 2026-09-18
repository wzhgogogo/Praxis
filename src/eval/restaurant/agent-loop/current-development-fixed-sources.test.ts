import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway } from "../../../core/model/contracts.js";
import { createCurrentDevelopmentFixedSources } from "./current-development-fixed-sources.js";
import { currentDevelopmentSourceScenario, type CurrentDevelopmentSourceScenario } from "./current-development-source-scenarios.js";

const model: ModelGateway = { async complete() { throw new Error("the deterministic source pages must not need a model browser action"); } };
const intent = {
  timezone: "Asia/Tokyo" as const,
  target: { goal: "AVAILABILITY" as const, query: "vegetarian lunch" },
  date: "2026-08-20",
  timeWindow: { earliest: "12:30", latest: "12:30" },
  area: { query: "near Shibuya" },
  criteria: [{ text: "vegetarian restaurant", polarity: "POSITIVE" as const, strength: "HARD" as const }],
};

test("H005 fixed controls preserve the original regional-cuisine evidence without adding local-food wording", () => {
  const scenario = currentDevelopmentSourceScenario("h005");
  assert.equal(scenario.observations.length, 3);
  for (const observation of scenario.observations) {
    assert.ok(observation.websiteFacts?.types.some((fact) => /Tokyo regional cuisine/i.test(fact)), observation.google.displayName);
    assert.ok(observation.websiteFacts?.types.every((fact) => !/local food/i.test(fact)), observation.google.displayName);
  }
});

test("fixed source discovery is candidate-scoped and accepts equivalent retrieval wording", async () => {
  const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("multi-candidate-control"), { now: () => "2026-08-19T08:00:00.000Z" }, model);
  const equivalent = await sources.search.search({ intent: { ...intent, target: { ...intent.target, query: "vegetarian places around Shibuya" } }, readRunId: "source-equivalent" }, new AbortController().signal);
  assert.deepEqual(equivalent.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces), ["offline-multi-unavailable", "offline-multi-available"]);
  const wrong = await sources.search.search({ intent: { ...intent, target: { ...intent.target, query: "sushi near Tsukiji" } }, readRunId: "source-wrong" }, new AbortController().signal);
  assert.deepEqual(wrong.candidates, [], "an unrelated legal query must not inherit the scenario's successful outlets");
});

test("fixed source keeps inventory with its own candidate and request scope", async () => {
  const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("multi-candidate-control"), { now: () => "2026-08-19T08:00:00.000Z" }, model);
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
  assert.ok(sources.calls.coverageGaps.some((record) => record.source === "TABLECHECK" && record.request.includes("pax=4")), `missing explicit fixture coverage gap: ${JSON.stringify(sources.calls.coverageGaps)}`);
});

async function discoveredCandidate(scenario: CurrentDevelopmentSourceScenario, runId: string) {
  const sources = createCurrentDevelopmentFixedSources(scenario, { now: () => "2026-08-19T08:00:00.000Z" }, model);
  const discovery = await sources.search.search({ intent, readRunId: runId }, new AbortController().signal);
  assert.equal(discovery.candidates.length, 1);
  return { sources, candidate: discovery.candidates[0]! };
}

test("fixed-source coverage gaps preserve provider, request and candidate context", async () => {
  const scenario = currentDevelopmentSourceScenario("multi-candidate-control");
  const sources = createCurrentDevelopmentFixedSources(scenario, { now: () => "2026-08-19T08:00:00.000Z" }, model);
  const discovery = await sources.search.search({ intent, readRunId: "coverage-google" }, new AbortController().signal);
  const missing = structuredClone(discovery.candidates[0]!);
  missing.restaurant.sourceIds.googlePlaces = "not-configured";
  await assert.rejects(
    () => sources.search.inspectFacts({ intent, candidateIds: [missing.restaurant.id], candidates: [missing], readRunId: "coverage-google-details" }, new AbortController().signal),
    // GooglePlacesClient deliberately wraps a fixture transport failure, so
    // the side-channel record (not its public provider error code) is the
    // runner-visible proof that this was an environment gap.
    (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "GOOGLE_NETWORK_FAILED",
  );
  assert.deepEqual(sources.calls.coverageGaps[0], {
    source: "GOOGLE_DETAILS", stage: "DETAILS", request: "placeId=not-configured", candidateId: "not-configured",
    reason: "Google details are not configured for this legal candidate",
  });
  const session = await sources.browser.openSession({ signal: new AbortController().signal });
  await assert.rejects(
    () => session.navigate("https://www.tablecheck.com/en/not-configured"),
    (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "FIXTURE_COVERAGE_GAP",
  );
  assert.equal(sources.calls.coverageGaps.at(-1)?.source, "TABLECHECK");
});

test("configured provider 404 is observed behavior, not a fixture gap", async () => {
  const scenario = structuredClone(currentDevelopmentSourceScenario("new-vegetarian-lunch"));
  scenario.observations[0]!.google.detailStatus = "NOT_FOUND";
  const { sources, candidate } = await discoveredCandidate(scenario, "configured-404");
  await assert.rejects(
    () => sources.search.inspectFacts({ intent, candidateIds: [candidate.restaurant.id], candidates: [candidate], readRunId: "configured-404-detail" }, new AbortController().signal),
    (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "GOOGLE_SERVICE_REJECTED",
  );
  assert.deepEqual(sources.calls.coverageGaps, []);
});

test("waitFor requires the requested configured target rather than arbitrary page markup", async () => {
  const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("new-vegetarian-lunch"), { now: () => "2026-08-19T08:00:00.000Z" }, model);
  const session = await sources.browser.openSession({ signal: new AbortController().signal });
  await session.navigate("https://offline.example/vegetarian");
  await session.waitFor("#restaurant-facts");
  await assert.rejects(
    () => session.waitFor("#does-not-exist"),
    (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "FIXTURE_COVERAGE_GAP",
  );
  assert.equal(sources.calls.coverageGaps.at(-1)?.stage, "WAIT_FOR");
});

test("independent source identities accept a normalized same outlet and reject a same-phone different branch", async () => {
  const sameOutlet = structuredClone(currentDevelopmentSourceScenario("new-vegetarian-lunch"));
  sameOutlet.observations[0]!.tableCheck!.address = "1 18 Jinnan Shibuya City Tokyo";
  sameOutlet.observations[0]!.tableCheck!.phone = "+81 3 6000 1006 ext. 1";
  const same = await discoveredCandidate(sameOutlet, "independent-same-outlet");
  const sameRead = await same.sources.availability.check({
    candidateIds: [same.candidate.restaurant.id], candidates: [same.candidate],
    date: "2026-08-20", partySize: 3, timeWindow: { earliest: "12:30", latest: "12:30" }, hardCriteria: ["vegetarian restaurant"],
  }, new AbortController().signal);
  assert.equal(sameRead.availabilityChecks[same.candidate.restaurant.id]?.status, "AVAILABLE");

  const differentBranch = structuredClone(currentDevelopmentSourceScenario("new-vegetarian-lunch"));
  differentBranch.observations[0]!.tableCheck!.address = "9F, 99 Other Building, Shibuya City, Tokyo";
  differentBranch.observations[0]!.tableCheck!.phone = differentBranch.observations[0]!.google.phone;
  const different = await discoveredCandidate(differentBranch, "independent-different-branch");
  const differentRead = await different.sources.availability.check({
    candidateIds: [different.candidate.restaurant.id], candidates: [different.candidate],
    date: "2026-08-20", partySize: 3, timeWindow: { earliest: "12:30", latest: "12:30" }, hardCriteria: ["vegetarian restaurant"],
  }, new AbortController().signal);
  assert.equal(differentRead.availabilityChecks[different.candidate.restaurant.id]?.status, "UNKNOWN");
  assert.deepEqual(differentRead.offers, [], "a same phone must not transfer inventory from another floor or branch");
});

test("source observation time advances with the controlled business clock while sample capture stays historical", async () => {
  let current = "2026-08-19T08:00:00.000Z";
  const sources = createCurrentDevelopmentFixedSources(currentDevelopmentSourceScenario("new-vegetarian-lunch"), { now: () => current }, model);
  const discovery = await sources.search.search({ intent, readRunId: "clock-search" }, new AbortController().signal);
  current = "2026-08-19T08:05:00.000Z";
  await sources.search.inspectFacts({ intent, candidateIds: discovery.candidates.map((candidate) => candidate.restaurant.id), candidates: discovery.candidates, readRunId: "clock-facts" }, new AbortController().signal);
  current = "2026-08-19T08:10:00.000Z";
  const availability = await sources.availability.check({
    candidateIds: discovery.candidates.map((candidate) => candidate.restaurant.id), candidates: discovery.candidates,
    date: "2026-08-20", partySize: 3, timeWindow: { earliest: "12:30", latest: "12:30" }, hardCriteria: ["vegetarian restaurant"],
  }, new AbortController().signal);
  assert.equal(availability.availabilityChecks[discovery.candidates[0]!.restaurant.id]?.checkedAt, "2026-08-19T08:10:00.000Z");
  assert.equal(availability.availabilityChecks[discovery.candidates[0]!.restaurant.id]?.displayExpiresAt, "2026-08-19T08:20:00.000Z", "the display window is derived from the actual availability observation, not the historical fixture capture time");
  assert.deepEqual(
    sources.calls.observations.filter((event) => ["SEARCH", "DETAILS", "AVAILABILITY"].includes(event.stage)).map((event) => [event.stage, event.observedAt]),
    [["SEARCH", "2026-08-19T08:00:00.000Z"], ["DETAILS", "2026-08-19T08:05:00.000Z"], ["AVAILABILITY", "2026-08-19T08:10:00.000Z"]],
  );
  assert.equal(sources.calls.observations.find((event) => event.stage === "AVAILABILITY")?.sampleCapturedAt, "2026-08-01T00:00:00.000Z");
});

test("a lead found while investigating A may help B only after B's own identity check", async () => {
  const scenario = structuredClone(currentDevelopmentSourceScenario("multi-candidate-control"));
  const [a, b] = scenario.observations;
  assert.ok(a && b?.tableCheck);
  b.tableCheck.discoveryListed = false;
  // A real Google website field can point to the public TableCheck outlet;
  // Google Maps remains its own normal Maps deep link.
  a.google.websiteUri = "https://www.tablecheck.com" + b.tableCheck.reservationEntryPath;
  const sources = createCurrentDevelopmentFixedSources(scenario, { now: () => "2026-08-19T08:00:00.000Z" }, model);
  const discovery = await sources.search.search({ intent, readRunId: "entry-ledger" }, new AbortController().signal);
  const result = await sources.availability.check({
    candidateIds: discovery.candidates.map((candidate) => candidate.restaurant.id), candidates: discovery.candidates,
    date: "2026-08-20", partySize: 3, timeWindow: { earliest: "12:30", latest: "12:30" }, hardCriteria: ["vegetarian restaurant"],
  }, new AbortController().signal);
  const first = discovery.candidates[0]!;
  const second = discovery.candidates[1]!;
  assert.notEqual(result.availabilityChecks[first.restaurant.id]?.status, "AVAILABLE", "A must not inherit B's observed availability through the misleading entrance");
  assert.equal(result.availabilityChecks[second.restaurant.id]?.status, "AVAILABLE", "B remains eligible even though its own discovery page omitted it: " + JSON.stringify({ checks: result.availabilityChecks, calls: sources.calls }));
  const bEntry = "https://www.tablecheck.com" + b.tableCheck.reservationEntryPath;
  assert.ok(sources.calls.browserNavigations.filter((url) => url === bEntry).length >= 2, "A's observed B entrance must be reused for B");
  const bIdentity = result.evidence.find((evidence) => evidence.candidateId === second.restaurant.id && evidence.kind === "ENTITY_MATCH");
  assert.equal(bIdentity?.entityMatch?.confidence, "HIGH", "the reused entrance must still establish B identity before B inventory is accepted");
});
