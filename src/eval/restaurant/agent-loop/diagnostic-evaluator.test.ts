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
    materializedCase: { semantic: { date: { value: "2026-09-08" }, party_size: 2, time: { value: "19:00" }, location: { value: "Shibuya", relation: "NEAR" }, criteria: [{ value: "omakase", polarity: "POSITIVE", strength: "HARD" }] } },
    loop: { status: "TERMINAL" }, resourceUsage: { elapsedMs: 100, agentDecisions: 3, browserModelCalls: 2 },
    trajectories: [{ stateHashBefore: "request-v1", agentAction: { type: "CHECK_AVAILABILITY", candidateIds: [candidateId] }, executionMetadata: { providerAttempts: [{ candidateId, provider: "TABLECHECK", outcome: "AVAILABLE" }] } }],
    finalSnapshot: { domainState: {
      phase: "PRESENT_RESULTS", intentDraft: { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "near Shibuya" }, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] },
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

test("complete time windows and no-party cases are evaluated without H001 assumptions", () => {
  const artifact: any = completeArtifact();
  artifact.materializedCase.semantic.time = { start: "18:00", end: "20:00" };
  artifact.materializedCase.semantic.party_size = undefined;
  artifact.finalSnapshot.domainState.intentDraft.timeWindow = { earliest: "18:00", latest: "20:00" };
  delete artifact.finalSnapshot.domainState.intentDraft.partySize;
  artifact.finalSnapshot.domainState.availability["candidate-a"][0].dateTime = "2026-09-08T19:30:00+09:00";
  artifact.finalSnapshot.domainState.availability["candidate-a"][0].partySize = undefined;
  artifact.finalSnapshot.domainState.readEvidence.find((item: any) => item.evidenceId === "availability-a").claims = { date: "2026-09-08", visibleSlots: ["19:30"] };
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED");
  assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED");
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
