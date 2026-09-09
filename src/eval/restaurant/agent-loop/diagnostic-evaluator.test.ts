import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";

const source = { path: "/tmp/h001.result.json", sha256: "a".repeat(64) };

function completeArtifact() {
  return {
    status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "h001", runId: "run:h001",
    materializedCase: { semantic: { date: "2026-09-08", party_size: 2, time: { value: "19:00" }, location: { value: "Shibuya" }, criteria: [{ value: "omakase", polarity: "POSITIVE", strength: "HARD" }] } },
    loop: { status: "TERMINAL" }, resourceUsage: { elapsedMs: 100, agentDecisions: 3, browserModelCalls: 2 },
    trajectories: [{ agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] } }],
    diagnostics: { providerAttempts: [{ candidateId: "candidate-a", provider: "TABLECHECK" }] },
    finalSnapshot: { domainState: {
      phase: "PRESENT_RESULTS", intentDraft: { date: "2026-09-08", partySize: 2, timeWindow: { earliest: "19:00" }, area: { query: "near Shibuya" }, criteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] },
      candidates: [{ restaurant: { id: "candidate-a", outletName: "A" } }],
      availabilityChecks: { "candidate-a": { status: "AVAILABLE" } },
      availability: { "candidate-a": [{ id: "offer-a" }] },
      presentedResults: { candidateIds: ["candidate-a"] },
      readEvidence: [
        { candidateId: "candidate-a", kind: "ENTITY_IDENTITY", evidenceId: "identity-a" },
        { candidateId: "candidate-a", kind: "HARD_CRITERIA", evidenceId: "hard-a" },
        { candidateId: "candidate-a", kind: "AVAILABILITY", evidenceId: "availability-a" },
      ],
    } },
  };
}

test("diagnostic evaluator independently accepts a grounded terminal result and retains candidate evidence", () => {
  const result = evaluateRestaurantHybridLiveArtifact(completeArtifact(), source);
  assert.equal(result.execution.taskProducedQualifiedResult, "YES");
  assert.equal(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE");
  assert.equal(result.candidateSummaries[0]?.providers[0], "TABLECHECK");
  assert.ok(result.findings.every((finding) => finding.status === "SATISFIED"));
});

test("diagnostic evaluator diagnoses a false presentation and duplicate investigation without changing execution", () => {
  const artifact: any = completeArtifact();
  artifact.finalSnapshot.domainState.readEvidence = [];
  artifact.trajectories.push({ agentAction: { type: "CHECK_AVAILABILITY", candidateIds: ["candidate-a"] } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.execution.taskProducedQualifiedResult, "NO");
  assert.equal(result.execution.evidenceSufficiency, "INSUFFICIENT");
  assert.equal(result.findings.find((finding) => finding.dimension === "INVESTIGATION_BEHAVIOR")?.status, "NOT_SATISFIED");
  assert.equal(result.findings.find((finding) => finding.dimension === "FINAL_CLAIM")?.status, "NOT_SATISFIED");
});

test("diagnostic evaluator marks missing legacy run accounting as not evaluated rather than zero", () => {
  const artifact: any = completeArtifact();
  delete artifact.resourceUsage;
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.findings.find((finding) => finding.dimension === "RESOURCES")?.status, "NOT_EVALUATED");
});

test("diagnostic evaluator distinguishes a complete no-slot result from a provider failure", () => {
  const artifact: any = completeArtifact();
  artifact.finalSnapshot.domainState.phase = "NEEDS_INPUT";
  artifact.finalSnapshot.domainState.presentedResults = undefined;
  artifact.finalSnapshot.domainState.availability = { "candidate-a": [] };
  artifact.finalSnapshot.domainState.readEvidence = [];
  artifact.finalSnapshot.domainState.availabilityChecks = {
    "candidate-a": { status: "UNAVAILABLE" },
    "candidate-b": { status: "UNKNOWN", reasonCode: "AVAILABILITY_SOURCES_EXHAUSTED" },
  };
  artifact.finalSnapshot.domainState.candidates.push({ restaurant: { id: "candidate-b", outletName: "B" } });
  const result = evaluateRestaurantHybridLiveArtifact(artifact, source);
  assert.equal(result.candidateSummaries.find((item) => item.candidateId === "candidate-a")?.result, "EXPLICIT_NO_MATCHING_SLOT");
  assert.equal(result.candidateSummaries.find((item) => item.candidateId === "candidate-b")?.result, "PROVIDER_ATTEMPTS_EXHAUSTED");
});
