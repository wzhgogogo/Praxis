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

  test("H03 does not execute before the Agent-proposed booking is authorized", async () => {
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

  test("H05 resumes the Agent after a definitive commit failure and requires a new authorization", async () => {
    const first = fixtureCandidates[0]!;
    const second = fixtureCandidates[1]!;
    const firstOffer = fixtureOffers[0]!;
    const secondOffer = fixtureOffers[1]!;
    const harness = createHarness({
      commitMode: "FAILURE",
      agentActions: [
        { type: "SEARCH_RESTAURANTS" },
        { type: "CHECK_AVAILABILITY", candidateIds: fixtureCandidates.slice(0, 3).map((candidate) => candidate.restaurant.id) },
        { type: "SELECT_CANDIDATE", candidateId: first.restaurant.id, offerId: firstOffer.id },
        { type: "BOOK_RESERVATION", candidateId: first.restaurant.id, offerId: firstOffer.id },
        { type: "SELECT_CANDIDATE", candidateId: second.restaurant.id, offerId: secondOffer.id },
        { type: "BOOK_RESERVATION", candidateId: second.restaurant.id, offerId: secondOffer.id },
        { type: "ASK_USER", question: "The second fixture booking also failed. What would you like to try next?" },
      ],
    });

    await harness.start(fixtureIntent);
    const firstProposalId = harness.snapshot().domainState.proposal?.id;
    assert.ok(firstProposalId);
    const resumed = await harness.authorizeCurrent();
    const secondProposalId = resumed.domainState.proposal?.id;

    assert.equal(resumed.domainState.phase, "AWAITING_AUTHORIZATION");
    assert.equal(resumed.domainState.selectedCandidateId, second.restaurant.id);
    assert.ok(secondProposalId);
    assert.notEqual(secondProposalId, firstProposalId);
    assert.equal(resumed.domainState.authorization, undefined);
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 1);
    assert.equal(harness.ledger.records.length, 1);

    const firstAuthorization = harness.runtime.eventLog.find((entry) => entry.event.type === "AUTHORIZE")?.event;
    assert.ok(firstAuthorization && firstAuthorization.type === "AUTHORIZE");
    await assert.rejects(
      harness.send({ type: "AUTHORIZE", authorization: firstAuthorization.authorization }),
      /Authorization must bind the current booking proposal/,
    );

    const afterSecondAuthorization = await harness.authorizeCurrent();
    const authorizations = harness.runtime.eventLog
      .flatMap((entry) => entry.event.type === "AUTHORIZE" ? [entry.event.authorization] : []);
    assert.equal(authorizations.length, 2);
    assert.notEqual(authorizations[0]?.proposalId, authorizations[1]?.proposalId);
    assert.equal(afterSecondAuthorization.domainState.phase, "NEEDS_INPUT");
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 2);
  });

  test("Agent resumes after BOOKING_ABSENT with a new candidate proposal awaiting authorization", async () => {
    const first = fixtureCandidates[0]!;
    const second = fixtureCandidates[1]!;
    const firstOffer = fixtureOffers[0]!;
    const secondOffer = fixtureOffers[1]!;
    const harness = createHarness({
      commitMode: "SUCCESS",
      verificationMode: "ABSENT",
      agentActions: [
        { type: "SEARCH_RESTAURANTS" },
        { type: "CHECK_AVAILABILITY", candidateIds: fixtureCandidates.slice(0, 3).map((candidate) => candidate.restaurant.id) },
        { type: "SELECT_CANDIDATE", candidateId: first.restaurant.id, offerId: firstOffer.id },
        { type: "BOOK_RESERVATION", candidateId: first.restaurant.id, offerId: firstOffer.id },
        { type: "SELECT_CANDIDATE", candidateId: second.restaurant.id, offerId: secondOffer.id },
        { type: "BOOK_RESERVATION", candidateId: second.restaurant.id, offerId: secondOffer.id },
      ],
    });

    await harness.start(fixtureIntent);
    const firstProposalId = harness.snapshot().domainState.proposal?.id;
    const snapshot = await harness.authorizeCurrent();

    assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION");
    assert.equal(snapshot.domainState.failure?.code, "BOOKING_ABSENT");
    assert.equal(snapshot.domainState.selectedCandidateId, second.restaurant.id);
    assert.ok(snapshot.domainState.proposal?.id);
    assert.notEqual(snapshot.domainState.proposal?.id, firstProposalId);
    assert.equal(snapshot.domainState.authorization, undefined);
    assert.equal(harness.countCommands("COMMIT_BOOKING"), 1);
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

    assert.equal(artifact.schemaVersion, "6");
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
    for (const trajectory of artifact.trajectories) {
      assert.equal(Array.isArray(trajectory.causalRefs.eventIds), true);
      assert.equal(Array.isArray(trajectory.causalRefs.commandIds), true);
      assert.equal(Array.isArray(trajectory.causalRefs.attemptIds), true);
      assert.equal(Array.isArray(trajectory.causalRefs.evidenceIds), true);
      assert.equal(trajectory.causalRefs.eventIds.every((eventId) => eventIds.has(eventId)), true);
      assert.equal(trajectory.contextSchemaVersion, "2");
      assert.equal(trajectory.decisionContext?.schemaVersion, "2");
      assert.equal("authorization" in (trajectory.decisionContext ?? {}), false);
      assert.equal("proposal" in (trajectory.decisionContext ?? {}), false);
      assert.equal("lastExecutionResult" in (trajectory.decisionContext ?? {}), false);
      assert.equal("evidence" in (trajectory.decisionContext ?? {}), false);
      assert.equal("reservation" in (trajectory.decisionContext ?? {}), false);
    }
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
    assert.ok(commit && commit.command.type === "COMMIT_BOOKING");
    const bookingStep = artifact.trajectories.find((step) => step.agentAction?.type === "BOOK_RESERVATION");
    assert.ok(bookingStep?.proposalId);
    assert.equal(bookingStep.proposalId, artifact.authorizations[0]?.proposalId);
    assert.equal(bookingStep.proposalId, artifact.policyDecisions[0]?.proposalId);
    assert.equal(bookingStep.proposalId, commit.command.proposal.id);
    assert.equal(artifact.evidence[0]?.attemptId, commit.trace.attemptId);
  });

  test("Agent chooses a second search strategy after an unhelpful first discovery", async () => {
    const harness = createHarness({
      agentActions: [
        { type: "SEARCH_RESTAURANTS", retrievalHint: "initial narrow query" },
        { type: "SEARCH_RESTAURANTS", retrievalHint: "broaden Japanese retrieval terms" },
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
        { type: "SEARCH_RESTAURANTS" },
        { type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] },
        { type: "CHECK_AVAILABILITY", candidateIds: [second.restaurant.id] },
        { type: "SELECT_CANDIDATE", candidateId: second.restaurant.id, offerId: secondOffer.id },
        { type: "BOOK_RESERVATION", candidateId: second.restaurant.id, offerId: secondOffer.id },
      ],
    });
    const snapshot = await harness.start(fixtureIntent);
    const trajectories = await harness.trajectories.list(snapshot.id);
    assert.deepEqual(
      trajectories.flatMap((step) => step.agentAction?.type === "CHECK_AVAILABILITY" ? [step.agentAction.candidateIds] : []),
      [[fixtureCandidates[0]!.restaurant.id], [second.restaurant.id]],
    );
    assert.equal(snapshot.domainState.selectedCandidateId, second.restaurant.id);
    assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION");
  });

  test("Harness binds search and availability requests from authoritative task state", async () => {
    const harness = createHarness();
    await harness.start(fixtureIntent);

    const search = harness.runtime.eventLog.find((item) => item.event.type === "SEARCH_COMPLETED");
    const availability = harness.runtime.eventLog.find((item) => item.event.type === "AVAILABILITY_CHECKED");
    assert.ok(search && search.event.type === "SEARCH_COMPLETED");
    assert.ok(availability && availability.event.type === "AVAILABILITY_CHECKED");
    assert.deepEqual(search.event.request.intent, fixtureIntent);
    assert.deepEqual(availability.event.request, {
      candidateIds: fixtureCandidates.slice(0, 3).map((candidate) => candidate.restaurant.id),
      candidates: fixtureCandidates.slice(0, 3),
      date: fixtureIntent.date,
      timeWindow: fixtureIntent.timeWindow,
      partySize: fixtureIntent.partySize,
    });
  });

  test("Provider failure is durable execution evidence, not a model failure", async () => {
    const harness = createHarness({
      searchFailure: "fixture search provider unavailable",
      agentActions: [
        { type: "SEARCH_RESTAURANTS" },
        { type: "ASK_USER", question: "The search provider is unavailable. Would you like to retry later?" },
      ],
    });
    const snapshot = await harness.start(fixtureIntent);

    assert.equal(harness.lastAgentLoopResult?.status, "WAITING_USER");
    assert.equal(snapshot.domainState.failure?.code, "SEARCH_FAILED");
    assert.equal(harness.runtime.eventLog.some((item) => item.event.type === "AGENT_DECISION_FAILED"), false);
    assert.equal(harness.trajectories.steps[0]?.stepOutcome, "EXECUTION_FAILURE");
    assert.equal(harness.trajectories.steps[0]?.observation?.type, "DISCOVERY_FAILED");
  });

  test("GENERIC_BROWSER availability observations retain the external adapter trace actor", async () => {
    const harness = createHarness({
      availabilityRoute: "GENERIC_BROWSER",
      agentActions: [
        { type: "SEARCH_RESTAURANTS" },
        { type: "CHECK_AVAILABILITY", candidateIds: [fixtureCandidates[0]!.restaurant.id] },
        { type: "ASK_USER", question: "What would you like to do next?" },
      ],
    });
    await harness.start(fixtureIntent);
    const availability = harness.runtime.eventLog.find((entry) => entry.event.type === "AVAILABILITY_CHECKED");
    assert.equal(availability?.trace.actor, "ADAPTER");
    const step = harness.trajectories.steps.find((entry) => entry.agentAction?.type === "CHECK_AVAILABILITY");
    assert.equal(step?.executionRoute, "GENERIC_BROWSER");
  });

  test("Timeout, step limit, and rejection limit terminate with durable state and trajectory", async () => {
    const timeoutHarness = createHarness({ agentLoopOptions: { timeoutMs: 0 } });
    const timeoutSnapshot = await timeoutHarness.start(fixtureIntent);
    assert.equal(timeoutHarness.lastAgentLoopResult?.status, "TIMEOUT");
    assert.equal(timeoutSnapshot.domainState.failure?.code, "AGENT_LOOP_TIMEOUT");
    assert.equal(timeoutHarness.trajectories.steps.at(-1)?.stepOutcome, "TIMEOUT");

    const stepHarness = createHarness({
      agentLoopOptions: { maxSteps: 1 },
      agentActions: [{ type: "SEARCH_RESTAURANTS" }],
    });
    const stepSnapshot = await stepHarness.start(fixtureIntent);
    assert.equal(stepHarness.lastAgentLoopResult?.status, "STEP_LIMIT");
    assert.equal(stepSnapshot.domainState.failure?.code, "AGENT_LOOP_STEP_LIMIT");
    assert.equal(stepHarness.trajectories.steps.at(-1)?.stepOutcome, "STEP_LIMIT");

    const rejectionHarness = createHarness({
      agentLoopOptions: { maxRejectedActions: 1 },
      agentActions: [{ type: "BOOK_RESERVATION", candidateId: fixtureCandidates[0]!.restaurant.id, offerId: fixtureOffers[0]!.id }],
    });
    const rejectionSnapshot = await rejectionHarness.start(fixtureIntent);
    assert.equal(rejectionHarness.lastAgentLoopResult?.status, "REJECTION_LIMIT");
    assert.equal(rejectionSnapshot.domainState.failure?.code, "AGENT_LOOP_REJECTION_LIMIT");
    assert.equal(rejectionHarness.trajectories.steps.at(-1)?.stepOutcome, "REJECTION_LIMIT");
    assert.equal(rejectionHarness.trajectories.steps.at(-1)?.causalRefs.eventIds.length, 1);
  });
});
