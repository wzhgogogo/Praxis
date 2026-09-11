import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { startDiagnosticRun } from "../../shared/diagnostic-run.js";
import { evaluateArtifactAfterFinish, evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";

const source = { path: "/tmp/h001.result.json", sha256: "a".repeat(64) };
const finding = (result: ReturnType<typeof evaluateRestaurantHybridLiveArtifact>, dimension: string) => result.findings.find((item) => item.dimension === dimension)!;

/** This mirrors the current runner shape: attempts are on trajectory executionMetadata. */
function completeArtifact() {
  const candidateId = "candidate-a";
  return {
    status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "h001", runId: "run:h001", finishedAt: "2026-09-08T07:45:37.000Z",
    limits: { maxSteps: 30, maxBrowserModelCallsTotal: 120 },
    materializedCase: { semantic: { target: { goal: "AVAILABILITY" }, date: { value: "2026-09-08" }, party_size: 2, time: { value: "19:00" }, location: { value: "Shibuya", relation: "NEAR" }, criteria: [{ value: "omakase", polarity: "POSITIVE", strength: "HARD" }] } },
    loop: { status: "TERMINAL" }, resourceUsage: { elapsedMs: 100, agentDecisions: 3, browserModelCalls: 2 },
    trajectories: [{ stateHashBefore: "request-v1", agentAction: { type: "CHECK_AVAILABILITY", candidateIds: [candidateId] }, executionMetadata: { providerAttempts: [{ candidateId, provider: "TABLECHECK", outcome: "AVAILABLE" }] } }],
    finalSnapshot: { domainState: {
      phase: "PRESENT_RESULTS", intentDraft: { target: { goal: "AVAILABILITY", query: "find a table" }, date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "near Shibuya" }, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] },
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
  assert.deepEqual(result.candidateSummaries[0]?.providers, ["TABLECHECK"]);
  assert.match(result.candidateSummaries[0]?.providerAttempts[0]?.evidenceRef ?? "", /trajectories\[0\]/);
  assert.ok(result.findings.every((item) => item.status === "SATISFIED"));
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
  artifact.trajectories.push({ stateHashBefore: "request-v2", agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
});

test("the same authoritative request with two executed reads is a duplicate", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "different-state", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED");
});

test("a recorded user refresh is a legal recheck of the same authoritative request", () => {
  const artifact: any = completeArtifact();
  const intent = { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  artifact.trajectories[0].decisionContext = { intent };
  artifact.trajectories.push({ stateHashBefore: "same-request-after-refresh", decisionContext: { intent }, agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] }, executionMetadata: { recheckReason: "USER_REQUESTED_REFRESH", providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK", outcome: "AVAILABLE" }] } });
  assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED");
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
  const accepted = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(accepted, "REQUIRED_EVIDENCE").status, "SATISFIED", JSON.stringify(finding(accepted, "REQUIRED_EVIDENCE").observations));
  assert.equal(finding(accepted, "FINAL_CLAIM").status, "SATISFIED");
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
