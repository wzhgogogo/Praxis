import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runInterruptionScenario } from "./fixtures/run-interruption-scenario.js";
import { evaluateRestaurantHybridLiveArtifact } from "../../eval/restaurant/agent-loop/diagnostic-evaluator.js";

for (const mode of ["complete", "signal", "deadline", "external"] as const) test(`formal Runner real subprocess ${mode} persists execution and supports independent S0`, { timeout: 65_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-runner-interruption-"));
  try {
    const result = await runInterruptionScenario(mode, root);
    const evaluation = evaluateRestaurantHybridLiveArtifact(result.artifact, { path: result.resultPath, sha256: "1".repeat(64) });
    assert.ok(!evaluation.recordReadIssues.some(row => row.path === "finalSnapshot"));
    assert.equal(evaluation.severity.S0_DECLARATION.status, "ABSENT");
    assert.equal(evaluation.severity.S0_BOUNDARY.status, "ABSENT");
    if (mode !== "complete") {
      assert.equal(evaluation.outcome.type, "ORCHESTRATION_INTERRUPTED");
      assert.equal(evaluation.outcome.capabilityDenominator, "EXCLUDED");
      assert.ok(evaluation.reachedStages?.includes("AVAILABILITY"));
    } else {
      const interrupted = structuredClone(result.artifact);
      interrupted.interruption = { reason: "SIGNAL", signal: "SIGTERM", at: result.artifact.finishedAt, timeoutMs: 500_000 };
      const candidate = interrupted.finalSnapshot.domainState.presentedResults.candidateIds[0];
      interrupted.finalSnapshot.domainState.availability[candidate][0].partySize = 9;
      const contradicted = evaluateRestaurantHybridLiveArtifact(interrupted, { path: "controlled-post-display-stop.json", sha256: "2".repeat(64) });
      assert.equal(contradicted.outcome.type, "ORCHESTRATION_INTERRUPTED");
      assert.equal(contradicted.severity.S0_DECLARATION.status, "PRESENT", "interruption must not mask a displayed false claim");
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
