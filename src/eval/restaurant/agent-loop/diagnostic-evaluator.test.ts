import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { startDiagnosticRun } from "../../shared/diagnostic-run.js";
import { evaluateArtifactAfterFinish, evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";

const source = { path: "/tmp/availability-fixture.result.json", sha256: "a".repeat(64) };
const finding = (result: ReturnType<typeof evaluateRestaurantHybridLiveArtifact>, dimension: string) => result.findings.find((item) => item.dimension === dimension)!;

/** Synthetic availability contract, not current H001 Gold. Attempts use the actual runner shape. */
function completeArtifact() {
  const candidateId = "candidate-a";
  const intentDraft = { target: { goal: "AVAILABILITY", query: "find a table" }, date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "near Shibuya" }, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] };
  return {
    status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "availability-fixture", runId: "run:availability-fixture", finishedAt: "2026-09-08T07:45:37.000Z",
    limits: { maxSteps: 30, maxBrowserModelCallsTotal: 120 },
    materializedCase: { semantic: { target: { goal: "AVAILABILITY" }, date: { value: "2026-09-08" }, party_size: 2, time: { value: "19:00" }, location: { value: "Shibuya", relation: "NEAR" }, criteria: [{ value: "omakase", polarity: "POSITIVE", strength: "HARD" }] } },
    loop: { status: "TERMINAL" }, resourceUsage: { elapsedMs: 100, agentDecisions: 3, browserModelCalls: 2 },
    trajectories: [{ stateHashBefore: "request-v1", stepOutcome: "EXECUTED", agentAction: { type: "CHECK_AVAILABILITY", candidateIds: [candidateId] }, decisionContext: { intentDraft }, observation: { type: "AVAILABILITY", candidateIds: [candidateId], evidenceIds: ["discovery-a", "identity-a", "hard-a", "availability-a"] }, executionMetadata: { providerAttempts: [{ candidateId, provider: "TABLECHECK", outcome: "AVAILABLE" }] } }],
    finalSnapshot: { domainState: {
      phase: "PRESENT_RESULTS", intentDraft,
      candidates: [{ restaurant: { id: candidateId, outletName: "A" } }],
      availabilityChecks: { [candidateId]: { status: "AVAILABLE", evidenceIds: ["discovery-a", "identity-a", "hard-a", "availability-a"] } },
      availability: { [candidateId]: [{ id: "offer-a", restaurantId: candidateId, source: "TABLECHECK", dateTime: "2026-09-08T19:00:00+09:00", partySize: 2, checkedAt: "2026-09-08T07:45:00.000Z", expiresAt: "2026-09-08T07:47:00.000Z" }] },
      presentedResults: { candidateIds: [candidateId], evidenceIds: ["discovery-a", "identity-a", "hard-a", "availability-a"], presentedAt: "2026-09-08T07:45:37.000Z" },
      readEvidence: [
        { evidenceId: "discovery-a", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, observedAt: "2026-09-08T07:41:00.000Z", requestFingerprint: "discovery", claims: { areaMatch: true, areaQuery: "near Shibuya" } },
        { evidenceId: "identity-a", kind: "ENTITY_MATCH", provider: "TABLECHECK", candidateId, sourceEntityId: "outlet-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "identity", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] } },
        { evidenceId: "hard-a", kind: "RESTAURANT_FACT", provider: "TABLECHECK", candidateId, sourceEntityId: "outlet-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "hard", claims: { verifiedHardCriteria: ["omakase"] }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] } },
        { evidenceId: "availability-a", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId, sourceEntityId: "outlet-a", observedAt: "2026-09-08T07:45:00.000Z", expiresAt: "2026-09-08T07:47:00.000Z", requestFingerprint: "availability", claims: { date: "2026-09-08", partySize: 2, visibleSlots: ["19:00"] }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] } },
      ],
    } },
  };
}

test("diagnostic evaluator independently accepts current-runner-shaped grounded evidence", () => {
  const result = evaluateRestaurantHybridLiveArtifact(completeArtifact(), source);
  assert.equal(result.execution.taskProducedQualifiedResult, "YES");
  assert.equal(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE");
  assert.equal(result.execution.completion, "PRESENTATION_RECORDED");
  assert.deepEqual(result.candidateSummaries[0]?.providers, ["TABLECHECK"]);
  assert.match(result.candidateSummaries[0]?.providerAttempts[0]?.evidenceRef ?? "", /trajectories\[0\]/);
  assert.ok(result.findings.every((item) => item.status === "SATISFIED"));
});

/**
 * Public, source-shaped artifact mutations.  Each starts from a fresh copy of
 * the passing control above: these are not edits to a historical artifact and
 * they do not borrow the production eligibility/read-completion functions.
 */
test("diagnostic evaluator distinguishes paired artifact controls from bounded contract mutations", async (t) => {
  const boundedEmptyArtifact = () => {
    const artifact: any = noResultArtifact();
    const domain = artifact.finalSnapshot.domainState;
    domain.candidates = []; domain.availability = {}; domain.availabilityChecks = {}; domain.readEvidence = [];
    domain.noVerifiedResult = { endedAt: artifact.finishedAt, investigatedCandidateIds: [], unresolvedCandidateIds: [], remainingGaps: [] };
    artifact.trajectories = [
      { agentAction: { type: "SEARCH_RESTAURANTS" }, stepOutcome: "EXECUTED", occurredAt: artifact.finishedAt,
        decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "DISCOVERY", candidateIds: [] }, executionMetadata: { provider: "GOOGLE_PLACES", route: "STRUCTURED_ADAPTER" } },
      { agentAction: { type: "END_READ" }, stepOutcome: "EXECUTED", occurredAt: artifact.finishedAt,
        decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "READ_ENDED", candidateIds: [], unresolvedCandidateIds: [] } },
    ];
    return artifact;
  };

  const controls = [
    { name: "qualified presentation", artifact: completeArtifact(), expected: "YES" },
    { name: "bounded empty discovery", artifact: boundedEmptyArtifact(), expected: "NO" },
  ] as const;
  for (const control of controls) await t.test(`control: ${control.name}`, () => {
    const result = evaluateRestaurantHybridLiveArtifact(structuredClone(control.artifact), source);
    assert.equal(result.execution.taskProducedQualifiedResult, control.expected, JSON.stringify(result));
    assert.equal(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE", JSON.stringify(result));
  });

  const mutations: Array<{
    name: string;
    artifact: () => any;
    assertCaught: (result: ReturnType<typeof evaluateRestaurantHybridLiveArtifact>) => void;
  }> = [
    {
      name: "M01 explicit party-size field is dropped",
      artifact: () => { const artifact: any = completeArtifact(); delete artifact.finalSnapshot.domainState.intentDraft.partySize; return artifact; },
      assertCaught: (result) => assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED"),
    },
    {
      name: "M03 a second presented candidate borrows A's evidence references",
      artifact: () => {
        const artifact: any = completeArtifact(); const domain = artifact.finalSnapshot.domainState;
        domain.candidates.push({ restaurant: { id: "candidate-b", outletName: "B" } });
        domain.availabilityChecks["candidate-b"] = { status: "AVAILABLE", evidenceIds: ["identity-a", "hard-a", "availability-a"] };
        domain.availability["candidate-b"] = [{ ...domain.availability["candidate-a"][0], id: "offer-b", restaurantId: "candidate-b" }];
        domain.presentedResults.candidateIds.push("candidate-b");
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED"),
    },
    {
      name: "M04 candidate-scoped availability evidence loses its candidate ID",
      artifact: () => {
        const artifact: any = completeArtifact();
        const availability = artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a");
        delete availability.candidateId;
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED"),
    },
    {
      name: "M05 an UNKNOWN availability result is relabelled UNAVAILABLE without negative evidence",
      artifact: () => { const artifact: any = unknownAvailabilityNoResultArtifact(); artifact.finalSnapshot.domainState.availabilityChecks["candidate-a"].status = "UNAVAILABLE"; return artifact; },
      assertCaught: (result) => {
        assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
        assert.match(finding(result, "COMPLETION_OUTCOME").observations.join(" "), /Unsupported explicit no-availability conclusion/);
      },
    },
    {
      name: "M05b a no-slot record for a different party cannot support this request",
      artifact: () => {
        const artifact: any = unknownAvailabilityNoResultArtifact(); const domain = artifact.finalSnapshot.domainState;
        domain.availabilityChecks["candidate-a"] = { status: "UNAVAILABLE", evidenceIds: ["negative-a"] };
        domain.readEvidence.push({ evidenceId: "negative-a", kind: "AVAILABILITY", provider: "TABLECHECK", candidateId: "candidate-a", sourceEntityId: "outlet-a", observedAt: artifact.finishedAt, requestFingerprint: "negative", claims: { date: "2026-09-08", partySize: 3, visibleSlots: [], inventoryStatus: "UNAVAILABLE", receptionMode: "UNKNOWN" } });
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED"),
    },
    {
      name: "M06 expired availability evidence is retained for presentation",
      artifact: () => {
        const artifact: any = completeArtifact(); const domain = artifact.finalSnapshot.domainState;
        domain.availability["candidate-a"][0].expiresAt = "2026-09-08T07:45:00.000Z";
        domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").expiresAt = "2026-09-08T07:45:00.000Z";
        return artifact;
      },
      assertCaught: (result) => assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED"),
    },
    {
      name: "M07 completion tag remains after actual execution records are deleted",
      artifact: () => { const artifact: any = completeArtifact(); artifact.trajectories = []; return artifact; },
      assertCaught: (result) => {
        assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
        assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED");
      },
    },
    {
      name: "M08 normal end is recorded despite a still-present qualified result",
      artifact: () => noResultArtifact(),
      assertCaught: (result) => assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED"),
    },
  ];
  for (const mutation of mutations) await t.test(mutation.name, () => {
    const result = evaluateRestaurantHybridLiveArtifact(mutation.artifact(), source);
    mutation.assertCaught(result);
    assert.notEqual(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE", JSON.stringify(result));
  });
});

/** Independent final-claim mutation: do not alter the supporting source evidence. */
function noResultArtifact(): any {
  const artifact: any = completeArtifact();
  artifact.finalSnapshot.domainState.phase = "NO_VERIFIED_RESULT";
  artifact.finalSnapshot.domainState.noVerifiedResult = { endedAt: artifact.finishedAt, investigatedCandidateIds: ["candidate-a"], unresolvedCandidateIds: ["candidate-a"], remainingGaps: ["No fresh slot"] };
  delete artifact.finalSnapshot.domainState.presentedResults;
  return artifact;
}

/** Starts at UNKNOWN with no offer or negative evidence; it is not a positive-slot control in disguise. */
function unknownAvailabilityNoResultArtifact(): any {
  const artifact: any = noResultArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.availability = {};
  domain.availabilityChecks["candidate-a"] = { status: "UNKNOWN", evidenceIds: [] };
  domain.noVerifiedResult.unresolvedCandidateIds = ["candidate-a"];
  return artifact;
}

test("executed observation lineage rejects a different candidate or request date", async (t) => {
  for (const mutation of [
    {
      name: "candidate changed",
      mutate: (artifact: any) => {
        const step = artifact.trajectories[0];
        step.agentAction.candidateIds = ["candidate-b"];
        step.observation.candidateIds = ["candidate-b"];
        step.executionMetadata.providerAttempts[0].candidateId = "candidate-b";
      },
    },
    {
      name: "request date changed",
      mutate: (artifact: any) => {
        const step = artifact.trajectories[0];
        step.decisionContext.intentDraft = { ...step.decisionContext.intentDraft, date: "2026-09-09" };
      },
    },
  ] as const) await t.test(mutation.name, () => {
    const artifact: any = completeArtifact();
    mutation.mutate(artifact);
    const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
    assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED", JSON.stringify(result));
    assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED", JSON.stringify(result));
  });
});

test("search-only source evidence can support a fact recommendation", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  artifact.materializedCase.semantic.target.goal = "RECOMMENDATION";
  domain.intentDraft.target.goal = "RECOMMENDATION";
  domain.readEvidence.find((item: any) => item.evidenceId === "hard-a").claims = {
    verifiedHardCriteria: ["omakase"], openingHoursMatch: true,
    regularOpeningHours: ["Tuesday: 10:00 AM – 10:00 PM"],
  };
  domain.presentedResults.evidenceIds = ["discovery-a", "identity-a", "hard-a"];
  artifact.trajectories = [{
    ...artifact.trajectories[0],
    decisionContext: { intentDraft: domain.intentDraft },
    observation: { type: "DISCOVERY", candidateIds: ["candidate-a"], evidenceIds: ["discovery-a", "identity-a", "hard-a"] },
  }];
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED", JSON.stringify(result));
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED", JSON.stringify(result));
  assert.equal(result.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result));
});

test("a no-result label cannot conceal an independently supported candidate", () => {
  const artifact = noResultArtifact();
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.execution.completion, "NO_VERIFIED_RESULT");
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
  assert.equal(result.execution.systemBehavior, "NOT_SUPPORTED");
  assert.match(finding(result, "COMPLETION_OUTCOME").observations.join(" "), /candidate-a/);
});

test("empty or incomplete investigation records cannot certify no-result completion", async (t) => {
  for (const mode of ["empty", "missing-scope", "proposal-only", "old-request"] as const) {
    await t.test(mode, () => {
      const artifact = noResultArtifact();
      const domain = artifact.finalSnapshot.domainState;
      domain.availability = {}; domain.availabilityChecks = {}; domain.readEvidence = [];
      artifact.trajectories = [];
      if (mode === "empty") { domain.candidates = []; domain.noVerifiedResult = {}; }
      if (mode === "missing-scope") delete domain.noVerifiedResult;
      if (mode === "proposal-only" || mode === "old-request") {
        artifact.trajectories = [{ agentAction: { type: "SEARCH_RESTAURANTS" }, stepOutcome: mode === "proposal-only" ? "REJECTED" : "EXECUTED",
          occurredAt: artifact.finishedAt, decisionContext: { intentDraft: { ...domain.intentDraft, ...(mode === "old-request" ? { date: "2000-01-01" } : {}) } },
          observation: { type: "DISCOVERY", candidateIds: [] }, executionMetadata: { provider: "GOOGLE_PLACES" } }];
      }
      const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
      assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED");
      assert.notEqual(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE");
    });
  }
});

test("a recorded current empty search supports only its bounded empty-result scope", () => {
  const artifact = noResultArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.candidates = []; domain.availability = {}; domain.availabilityChecks = {}; domain.readEvidence = [];
  domain.noVerifiedResult = { endedAt: artifact.finishedAt, investigatedCandidateIds: [], unresolvedCandidateIds: [], remainingGaps: [] };
  artifact.trajectories = [
    { agentAction: { type: "SEARCH_RESTAURANTS" }, stepOutcome: "EXECUTED", occurredAt: artifact.finishedAt,
      decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "DISCOVERY", candidateIds: [] }, executionMetadata: { provider: "GOOGLE_PLACES", route: "STRUCTURED_ADAPTER" } },
    { agentAction: { type: "END_READ" }, stepOutcome: "TERMINAL", occurredAt: artifact.finishedAt,
      decisionContext: { intentDraft: domain.intentDraft }, observation: { type: "READ_ENDED", candidateIds: [], unresolvedCandidateIds: [] } },
  ];
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "SATISFIED");
  assert.equal(result.execution.taskProducedQualifiedResult, "NO");
  assert.ok(result.unassessedDimensions.some(d => /investigation sufficiency/i.test(d)));
  const unfinished = structuredClone(artifact);
  unfinished.loop.status = "STEP_LIMIT";
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(unfinished, source), "COMPLETION_OUTCOME").status, "NOT_SATISFIED", "An old no-result phase must not certify an unfinished execution");
  const orphaned = structuredClone(artifact);
  orphaned.finalSnapshot.domainState.availabilityChecks = { "orphan-candidate": { status: "UNKNOWN", evidenceIds: [] } };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(orphaned, source), "COMPLETION_OUTCOME").status, "NOT_SATISFIED", "An empty scope cannot conceal current candidate checks");
  // Same claimed ending, but the source actually returned a candidate: contradictory scope must fail.
  artifact.trajectories[0].observation.candidateIds = ["omitted-candidate"];
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
});

test("UNKNOWN without independently checkable remaining gaps is not a certified no-result", () => {
  const artifact = noResultArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.availability = {};
  domain.availabilityChecks["candidate-a"] = { status: "UNKNOWN", evidenceIds: [], reasonCode: "AVAILABILITY_SOURCES_EXHAUSTED" };
  artifact.trajectories[0].executionMetadata.providerAttempts[0].outcome = "PROVIDER_FAILURE";
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED");
  const internal: any = structuredClone(artifact);
  internal.status = "EXECUTION_FAILURE";
  internal.loop.status = "EXECUTION_FAILURE";
  internal.finalSnapshot.domainState.failure = { code: "AGENT_EXECUTION_FAILED", message: "Router invariant failed." };
  const internalEvaluation = evaluateRestaurantHybridLiveArtifact(internal, source);
  assert.equal(internalEvaluation.execution.completion, "INTERNAL_EXECUTION_FAILURE");
  assert.equal(finding(internalEvaluation, "COMPLETION_OUTCOME").status, "NOT_SATISFIED");
});

test("diagnostic evaluator rejects wrong request values, LOW identity, and evidence expired at presentation", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.availability["candidate-a"][0].dateTime = "2000-01-01T03:00:00+09:00";
  domain.availability["candidate-a"][0].partySize = 99;
  domain.availability["candidate-a"][0].expiresAt = "2026-09-08T07:45:00.000Z";
  domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims = { date: "2000-01-01", partySize: 99, visibleSlots: ["03:00"] };
  domain.readEvidence.find((item: any) => item.evidenceId === "availability-a").expiresAt = "2026-09-08T07:45:00.000Z";
  domain.readEvidence.find((item: any) => item.evidenceId === "identity-a").entityMatch.confidence = "LOW";
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED");
  assert.equal(result.execution.taskProducedQualifiedResult, "NO");
});

test("candidate evidence cannot be borrowed from another presented candidate", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.candidates.push({ restaurant: { id: "candidate-b", outletName: "B" } });
  domain.availabilityChecks["candidate-b"] = { status: "AVAILABLE", evidenceIds: ["identity-a", "hard-a", "availability-a"] };
  domain.availability["candidate-b"] = [{ ...domain.availability["candidate-a"][0], id: "offer-b", restaurantId: "candidate-b" }];
  domain.presentedResults.candidateIds.push("candidate-b");
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
  assert.equal(result.execution.systemBehavior, "NOT_EVALUATED");
});

test("missing trajectory and empty resource object remain not evaluated", () => {
  const artifact: any = completeArtifact();
  delete artifact.trajectories;
  artifact.resourceUsage = {};
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_EVALUATED");
  assert.equal(finding(result, "RESOURCES").status, "NOT_EVALUATED");
  assert.equal(result.execution.systemBehavior, "NOT_EVALUATED");
});

test("a changed request version can legitimately recheck a candidate", () => {
  const artifact: any = completeArtifact();
  artifact.trajectories.push({ stateHashBefore: "request-v2", stepOutcome: "EXECUTED", agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("the same authoritative request with two executed reads is a duplicate", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "different-state", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
});

test("a recorded user refresh is a legal recheck of the same authoritative request", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "same-request-after-refresh", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { recheckReason: "USER_REQUESTED_REFRESH", providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("an arbitrary recheck label does not exempt a duplicate availability read", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "same-request", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { recheckReason: "because-model-said-so", providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
});

test("fact investigation is subject to the same duplicate check as availability", () => {
  const artifact: any = completeArtifact();
  const intent = { target: { goal: "RECOMMENDATION" }, area: { query: "near Shibuya" } };
  artifact.trajectories = [
    { stateHashBefore: "request-v1", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["candidate-a"] }, executionMetadata: {} },
    { stateHashBefore: "request-v2", stepOutcome: "EXECUTED", decisionContext: { intent }, agentAction: { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["candidate-a"] }, executionMetadata: {} },
  ];
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
  artifact.trajectories[1].executionMetadata.recheckReason = "USER_REQUESTED_REFRESH";
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("a derived restaurant fact needs its cited candidate-bound source evidence", () => {
  const artifact: any = completeArtifact();
  const domain = artifact.finalSnapshot.domainState;
  domain.materializedCase = undefined;
  domain.readEvidence.push({ evidenceId: "judgment-a", kind: "RESTAURANT_FACT", provider: "MODEL_JUDGMENT", candidateId: "candidate-a", observedAt: "2026-09-08T07:45:00.000Z", requestFingerprint: "judgment", claims: { verifiedHardCriteria: ["omakase"], supportingEvidenceIds: ["hard-a"] } });
  domain.presentedResults.evidenceIds.push("judgment-a");
  artifact.trajectories[0].observation.evidenceIds.push("judgment-a");
  const accepted = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(accepted, "REQUIRED_EVIDENCE").status, "SATISFIED");
  domain.readEvidence.find((item: any) => item.evidenceId === "judgment-a").claims.supportingEvidenceIds = ["not-a-source"];
  const rejected = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(rejected, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
});

test("complete availability time windows are evaluated without H001 exact-time assumptions", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.time = { start: "18:00", end: "20:00" };
  artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "18:00", latest: "20:00" };
  artifact.finalSnapshot.domainState.availability["candidate-a"][0].dateTime = "2026-09-08T19:30:00+09:00";
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims = { date: "2026-09-08", partySize: 2, visibleSlots: ["19:30"] };
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED");
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED");
});

test("H004 fact-only presentation requires applicable opening hours, not an availability offer", () => {
  const artifact: any = completeArtifact();
  artifact.caseId = "h004";
  artifact.materializedCase.id = "h004";
  artifact.materializedCase.semantic = {
    target: { goal: "RECOMMENDATION" },
    date: { value: "2026-09-08" },
    time: { start: "12:00", end: "17:00" },
    location: { value: "nearby", relation: "NEAR_USER" },
    criteria: [{ value: "cafe", polarity: "POSITIVE", strength: "HARD" }, { value: "good for meeting a friend", polarity: "POSITIVE", strength: "SOFT" }],
  };
  const domain = artifact.finalSnapshot.domainState;
  domain.intentDraft = { target: { goal: "RECOMMENDATION", query: "recommend a cafe" }, date: "2026-09-08", timeWindow: { earliest: "12:00", latest: "17:00" }, area: { query: "near Higashi-Ginza" }, criteria: [{ text: "cafe", polarity: "POSITIVE", strength: "HARD" }, { text: "good for meeting a friend", polarity: "POSITIVE", strength: "SOFT" }] };
  domain.availabilityChecks = {};
  domain.availability = {};
  domain.presentedResults = { candidateIds: ["candidate-a"], evidenceIds: ["discovery-a", "identity-a", "hard-a"], presentedAt: "2026-09-08T07:45:37.000Z" };
  domain.readEvidence = domain.readEvidence.filter((item: any) => item.evidenceId !== "availability-a");
  domain.readEvidence.find((item: any) => item.evidenceId === "discovery-a").claims = { areaMatch: true, areaQuery: "nearby", areaMatchBasis: "EVALUATION_LOCATION_RADIUS", evaluationLocationLabel: "Higashi-Ginza public evaluation point" };
  const identity = domain.readEvidence.find((item: any) => item.evidenceId === "identity-a");
  identity.provider = "GOOGLE_PLACES";
  identity.sourceEntityId = "google-place-a";
  const facts = domain.readEvidence.find((item: any) => item.evidenceId === "hard-a");
  facts.provider = "GOOGLE_PLACES";
  facts.sourceEntityId = "google-place-a";
  facts.claims = { verifiedHardCriteria: ["cafe"], regularOpeningHours: ["Tuesday: 10:00 AM - 6:00 PM"], openingHoursMatch: true, openingHoursMatchedWindow: "12:00-17:00" };
  artifact.trajectories[0].decisionContext = { intentDraft: domain.intentDraft };
  const accepted = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(accepted, "REQUIRED_EVIDENCE").status, "SATISFIED", JSON.stringify(finding(accepted, "REQUIRED_EVIDENCE").observations));
  assert.equal(finding(accepted, "FINAL_CLAIM").status, "SATISFIED");
  domain.intentDraft.criteria[1].text = "suitable for meeting up with a friend";
  const softRewrite = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(softRewrite, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.match(finding(softRewrite, "AUTHORITATIVE_CONDITIONS").directCause, /semantic equivalence requires review/);
  assert.ok(softRewrite.unassessedDimensions.some((item) => item.includes("SOFT criterion")));
  domain.intentDraft.criteria[1].text = "good for meeting a friend";
  delete facts.claims.openingHoursMatch;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
});

test("generic negative HARD criteria require a cited source judgment and preserve a conflict", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.criteria = [{ value: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }];
  artifact.finalSnapshot.domainState.intentDraft.criteria = [{ text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" }];
  const facts = artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a");
  facts.claims = { verifiedNegativeCriteria: ["hot pot restaurant"] };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "SATISFIED");
  facts.claims = { violatedNegativeCriteria: ["hot pot restaurant"] };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  facts.claims = { restaurantTypeFacts: ["restaurant"] };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
});

test("fact-only evaluation rejects a derived opening claim contradicted by raw hours", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.target = { goal: "RECOMMENDATION" };
  artifact.materializedCase.semantic.time = { start: "19:00", end: "19:00" };
  artifact.finalSnapshot.domainState.intentDraft.target = { goal: "RECOMMENDATION", query: "cafe" };
  artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "19:00", latest: "19:00" };
  artifact.finalSnapshot.domainState.availabilityChecks = {}; artifact.finalSnapshot.domainState.availability = {};
  artifact.finalSnapshot.domainState.presentedResults.evidenceIds = ["discovery-a", "identity-a", "hard-a"];
  artifact.finalSnapshot.domainState.readEvidence = artifact.finalSnapshot.domainState.readEvidence.filter((item: any) => item.evidenceId !== "availability-a");
  const facts = artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "hard-a");
  facts.claims = { verifiedHardCriteria: ["yakiniku"], regularOpeningHours: ["Monday: Closed"], openingHoursMatch: true };
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
});

test("an offer inside a time window must be one of the cited availability slots", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.time = { start: "18:00", end: "20:00" };
  artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "18:00", latest: "20:00" };
  artifact.finalSnapshot.domainState.availability["candidate-a"][0].dateTime = "2026-09-08T19:00:00+09:00";
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims.visibleSlots = ["18:00"];
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  assert.match(finding(result, "REQUIRED_EVIDENCE").observations.join("\n"), /offer time is not present/);
});

test("evidence observed after presentation is a conflict while a missing observation is not evaluated", () => {
  const future: any = completeArtifact();
  future.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").observedAt = "2099-01-01T00:00:00.000Z";
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(future, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED");
  const missing: any = completeArtifact();
  delete missing.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").observedAt;
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(missing, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED");
});

test("a missing final authoritative intentDraft is not evidence of a condition conflict", () => {
  const artifact: any = completeArtifact();
  delete artifact.finalSnapshot.domainState.intentDraft;
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED");
  assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_EVALUATED");
  assert.match(finding(result, "AUTHORITATIVE_CONDITIONS").directCause, /lacks a required authority record/);
});

test("evaluation failure creates a separate immutable failure sidecar", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-eval-"));
  const artifactPath = join(directory, "run.result.json");
  const outcome = await evaluateArtifactAfterFinish(artifactPath, async () => { throw Object.assign(new Error("nope"), { code: "EVAL_BAD" }); });
  assert.equal(outcome.evaluationFailure, "EVAL_BAD");
  assert.ok(outcome.failurePath);
  assert.equal(JSON.parse(await readFile(outcome.failurePath!, "utf8")).status, "EVALUATION_FAILED");
});

test("a saved exception artifact remains intact when post-finish evaluation fails", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-eval-finish-"));
  const journal = await startDiagnosticRun(directory, { mode: "HYBRID_LIVE_READ" });
  await journal.finish({ status: "FAILED", stage: "AGENT_LOOP", failureCode: "MODEL_FAILURE" });
  const before = await readFile(journal.resultPath, "utf8");
  const outcome = await evaluateArtifactAfterFinish(journal.resultPath, async () => { throw new Error("evaluator unavailable"); });
  assert.equal(outcome.evaluationFailure, "EVALUATION_FAILED");
  assert.equal(await readFile(journal.resultPath, "utf8"), before);
});
