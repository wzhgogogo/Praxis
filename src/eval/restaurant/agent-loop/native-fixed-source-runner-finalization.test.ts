import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { finalizeNativeFixedSourceRun } from "./runners/native-fixed-source-runner-finalization.js";

test("native fixed-source finalization persists execution before independent evaluation and acceptance", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-native-finalization-"));
  const resultPath = join(directory, "run.result.json");
  const progress = { executionArtifactSaved: false };
  let finishCount = 0;
  try {
    const finalized = await finalizeNativeFixedSourceRun({
      journal: {
        resultPath,
        async finish(result) {
          finishCount += 1;
          await writeFile(resultPath, JSON.stringify({ persisted: true, ...result }), { flag: "wx" });
        },
      },
      result: { status: "SUCCEEDED", stage: "AGENT_LOOP" },
      progress,
      async evaluate(path) {
        assert.equal(path, resultPath);
        assert.deepEqual(JSON.parse(await readFile(path, "utf8")), { persisted: true, status: "SUCCEEDED", stage: "AGENT_LOOP" });
        return { evaluationFailure: "EVALUATION_FAILED" };
      },
      buildAcceptanceSidecar(evaluation) {
        assert.equal(evaluation.evaluationFailure, "EVALUATION_FAILED");
        return { sourceArtifact: { path: resultPath }, acceptance: { acceptance: "BLOCKED", exitCode: 1 } };
      },
    });
    assert.equal(finishCount, 1);
    assert.equal(progress.executionArtifactSaved, true);
    assert.equal(finalized.evaluation.evaluationFailure, "EVALUATION_FAILED");
    assert.deepEqual(JSON.parse(await readFile(resultPath, "utf8")), { persisted: true, status: "SUCCEEDED", stage: "AGENT_LOOP" });
    assert.deepEqual(JSON.parse(await readFile(finalized.acceptancePath, "utf8")), {
      sourceArtifact: { path: resultPath }, acceptance: { acceptance: "BLOCKED", exitCode: 1 },
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a post-persistence acceptance-sidecar error leaves the execution record single-write", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-native-finalization-error-"));
  const resultPath = join(directory, "run.result.json");
  const progress = { executionArtifactSaved: false };
  let finishCount = 0;
  try {
    await assert.rejects(finalizeNativeFixedSourceRun({
      journal: {
        resultPath,
        async finish(result) {
          finishCount += 1;
          await writeFile(resultPath, JSON.stringify(result), { flag: "wx" });
        },
      },
      result: { status: "SUCCEEDED" },
      progress,
      async evaluate() { return {}; },
      buildAcceptanceSidecar() { throw new Error("sidecar unavailable"); },
    }), /sidecar unavailable/);
    assert.equal(finishCount, 1);
    assert.equal(progress.executionArtifactSaved, true);
    assert.deepEqual(JSON.parse(await readFile(resultPath, "utf8")), { status: "SUCCEEDED" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
