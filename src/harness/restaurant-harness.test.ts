import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { fixtureCandidates, fixtureIntent, fixtureOffers } from "./restaurant-fixtures.js";
import { RestaurantHarness } from "./restaurant-harness.js";

function createHarness(
  overrides: Partial<ConstructorParameters<typeof RestaurantHarness>[0]> = {},
) {
  return new RestaurantHarness({ candidates: fixtureCandidates, offers: fixtureOffers, ...overrides });
}

describe("restaurant booking mock harness", () => {
  test("H01 completes a verified booking through the authorized happy path", async () => {
    const harness = createHarness({ commitMode: "SUCCESS", verificationMode: "CONFIRMED" });

    await harness.start(fixtureIntent);
    const snapshot = await harness.authorizeCurrent();

    assert.equal(snapshot.domainState.phase, "BOOKED_VERIFIED");
    assert.equal(snapshot.lifecycleState, "SUCCEEDED");
    assert.equal(snapshot.outcome?.status, "BOOKED_VERIFIED");
    assert.equal(snapshot.domainState.evidence?.strength, "STRONG");
    assert.equal(harness.ledger.records.length, 1);
  });

  test("H02 returns at most three executable candidates", async () => {
    const harness = createHarness();

    const snapshot = await harness.start(fixtureIntent);

    assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION");
    assert.equal(snapshot.domainState.candidates.length, 3);
    assert.equal(harness.ledger.records.length, 0);
  });

  test("H03 does not execute when the user has not selected a candidate", async () => {
    const harness = createHarness();

    const snapshot = await harness.start(fixtureIntent);

    assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION");
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 0);
    assert.equal(harness.ledger.records.length, 0);
  });

  test("H04 does not execute a selected candidate without authorization", async () => {
    const harness = createHarness();

    const snapshot = await harness.start(fixtureIntent);

    assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION");
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 0);
    assert.equal(harness.ledger.records.length, 0);
  });

  test("H05 returns to selection after a definitive commit failure", async () => {
    const harness = createHarness({ commitMode: "FAILURE" });

    await harness.start(fixtureIntent);
    const snapshot = await harness.authorizeCurrent();

    assert.equal(snapshot.domainState.phase, "SELECTION_REQUIRED");
    assert.equal(snapshot.domainState.failure?.code, "COMMIT_FAILED");
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 1);
    assert.equal(harness.ledger.records.length, 1);
  });

  test("H06 weak evidence after submit becomes OUTCOME_UNKNOWN", async () => {
    const harness = createHarness({ commitMode: "SUCCESS", verificationMode: "WEAK" });

    await harness.start(fixtureIntent);
    const snapshot = await harness.authorizeCurrent();

    assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN");
    assert.equal(snapshot.lifecycleState, "NEEDS_ATTENTION");
    assert.equal(snapshot.domainState.evidence?.strength, "WEAK");
    assert.equal(snapshot.outcome?.status, "OUTCOME_UNKNOWN");
    assert.equal(harness.ledger.records.length, 1);
  });

  test("H07 OUTCOME_UNKNOWN blocks selecting and committing another candidate", async () => {
    const harness = createHarness({ commitMode: "UNCERTAIN", verificationMode: "INCONCLUSIVE" });

    await harness.start(fixtureIntent);
    const snapshot = await harness.authorizeCurrent();

    assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN");
    await assert.rejects(
      harness.send({ type: "CANDIDATE_SELECTED", candidateId: "restaurant-2" }),
      /invalid while restaurant task is OUTCOME_UNKNOWN/,
    );
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 1);
    assert.equal(harness.ledger.records.length, 1);
  });

  test("H08 replaying a commit command does not repeat the side effect", async () => {
    const harness = createHarness({ commitMode: "SUCCESS", verificationMode: "CONFIRMED" });

    await harness.start(fixtureIntent);
    await harness.authorizeCurrent();
    const replayed = await harness.replayLastCommit();

    assert.equal(replayed, true);
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 1);
    assert.equal(harness.ledger.records.length, 1);
  });

  test("H09 mismatched booking details cannot produce BOOKED_VERIFIED", async () => {
    const harness = createHarness({
      commitMode: "SUCCESS",
      verificationMode: "MISMATCHED_DETAILS",
    });

    await harness.start(fixtureIntent);
    const snapshot = await harness.authorizeCurrent();

    assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN");
    assert.deepEqual(snapshot.domainState.evidence?.conflictingFields, [
      "restaurantId",
      "dateTime",
      "partySize",
    ]);
    assert.equal(snapshot.outcome?.status, "OUTCOME_UNKNOWN");
    assert.equal(harness.ledger.records.length, 1);
  });

  test("H10 evidence from another attempt cannot produce BOOKED_VERIFIED", async () => {
    const harness = createHarness({
      commitMode: "SUCCESS",
      verificationMode: "WRONG_ATTEMPT",
    });

    await harness.start(fixtureIntent);
    const snapshot = await harness.authorizeCurrent();

    assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN");
    assert.deepEqual(snapshot.domainState.evidence?.conflictingFields, ["attemptId"]);
    assert.equal(snapshot.outcome?.status, "OUTCOME_UNKNOWN");
    assert.equal(harness.ledger.records.length, 1);
  });

  test("H11 run artifact preserves the causal chain, proof and side-effect ledger", async () => {
    const harness = createHarness({ commitMode: "SUCCESS", verificationMode: "CONFIRMED" });

    await harness.start(fixtureIntent);
    await harness.authorizeCurrent();
    const artifact = harness.createRunArtifact({
      scenarioId: "H11-causal-run-artifact",
      oracleAssertions: [
        { name: "final outcome is verified", passed: true },
        { name: "one booking side effect", passed: harness.ledger.records.length === 1 },
      ],
    });

    assert.equal(artifact.schemaVersion, "2");
    assert.equal(artifact.mode, "mock");
    assert.equal(artifact.scenarioId, "H11-causal-run-artifact");
    assert.equal(artifact.finalSnapshot.outcome?.status, "BOOKED_VERIFIED");
    assert.equal(artifact.sideEffects.length, 1);
    assert.equal(artifact.evidence.length, 1);
    assert.equal(artifact.policyDecisions.length, 1);
    assert.equal(artifact.authorizations.length, 1);
    assert.equal(artifact.trajectories.length, 4);
    assert.equal(artifact.oracleAssertions.every((assertion) => assertion.passed), true);

    const eventIds = new Set(artifact.events.map((event) => event.id));
    for (const command of artifact.commands) {
      assert.equal(command.trace.runId, artifact.runId);
      assert.equal(eventIds.has(command.trace.causationId), true);
    }

    const commandIds = new Set(artifact.commands.map((command) => command.id));
    const derivedEvents = artifact.events.filter((event) => event.trace.causationId !== undefined);
    assert.equal(derivedEvents.length > 0, true);
    for (const event of derivedEvents) {
      assert.equal(commandIds.has(event.trace.causationId ?? ""), true);
    }

    const commit = artifact.commands.find((command) => command.command.type === "COMMIT_BOOKING");
    assert.ok(commit);
    assert.equal(artifact.evidence[0]?.attemptId, commit.trace.attemptId);
  });

  test("Agent chooses a second search strategy after an unhelpful first discovery", async () => {
    const harness = createHarness({
      agentActions: [
        { type: "SEARCH_RESTAURANTS", request: { intent: fixtureIntent, retrievalHint: "initial narrow query" } },
        { type: "SEARCH_RESTAURANTS", request: { intent: fixtureIntent, retrievalHint: "broaden Japanese retrieval terms" } },
        { type: "ASK_USER", question: "Would you like me to continue with these fixture options?" },
      ],
    });
    const snapshot = await harness.start(fixtureIntent);
    const actions = (await harness.trajectories.list(snapshot.id)).map((step) => step.agentAction?.type);
    assert.deepEqual(actions, ["SEARCH_RESTAURANTS", "SEARCH_RESTAURANTS", "ASK_USER"]);
    assert.equal(snapshot.domainState.phase, "NEEDS_INPUT");
  });

  test("Agent checks an unavailable candidate then independently checks and selects another", async () => {
    const second = fixtureCandidates[1]!;
    const secondOffer = fixtureOffers[1]!;
    const harness = createHarness({
      unavailableRestaurantIds: new Set([fixtureCandidates[0]!.restaurant.id]),
      agentActions: [
        { type: "SEARCH_RESTAURANTS", request: { intent: fixtureIntent } },
        { type: "CHECK_AVAILABILITY", request: { candidateIds: [fixtureCandidates[0]!.restaurant.id], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize } },
        { type: "CHECK_AVAILABILITY", request: { candidateIds: [second.restaurant.id], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize } },
        { type: "SELECT_CANDIDATE", candidateId: second.restaurant.id, offerId: secondOffer.id },
        { type: "BOOK_RESERVATION", candidateId: second.restaurant.id, offerId: secondOffer.id },
      ],
    });
    const snapshot = await harness.start(fixtureIntent);
    const trajectories = await harness.trajectories.list(snapshot.id);
    assert.deepEqual(
      trajectories.flatMap((step) => step.agentAction?.type === "CHECK_AVAILABILITY" ? [step.agentAction.request.candidateIds] : []),
      [[fixtureCandidates[0]!.restaurant.id], [second.restaurant.id]],
    );
    assert.equal(snapshot.domainState.selectedCandidateId, second.restaurant.id);
    assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION");
  });
});
