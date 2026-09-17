import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import { evaluateArtifactFile, type RestaurantHybridDiagnosticEvaluation } from "./diagnostic-evaluator.js";
import { assessFixedSourceAcceptance } from "./fixed-source-acceptance.js";
import { executeFixedSourceCase, type FixedSourceCaseExecution } from "./fixed-source-case-execution.js";
import { loadRegisteredFixedSourceCase, type FixedSourceExpectation } from "./fixed-source-case-registry.js";

function response(outputText: string, invocationId: string): ModelResponse {
  return { invocationId, provider: "FIXTURE", model: "deadline-control", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

function h001SemanticResponse(): ModelResponse {
  return response(JSON.stringify({ schemaVersion: "3", facts: [
    { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase near Shibuya" } },
    { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-19", raw: "tonight" } },
    { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
    { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
    { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
    { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", polarity: "POSITIVE", strength: "HARD" } },
  ] }), "semantic");
}

/**
 * Serializes an execution result before evaluating it. The test never supplies
 * evaluator findings: both the execution record and evaluation sidecar are
 * created by the same offline runner/evaluator path used by diagnostics.
 */
async function evaluateActualStopArtifact(result: FixedSourceCaseExecution, limits: { maxModelCalls?: number; timeoutMs: number }): Promise<RestaurantHybridDiagnosticEvaluation> {
  const directory = await mkdtemp(join(tmpdir(), "praxis-fixed-stop-"));
  const artifactPath = join(directory, "controlled-stop.result.json");
  const artifact = {
    schemaVersion: "1",
    mode: "FIXED_SOURCE_CONTROLLED_STOP",
    status: result.execution.status,
    stage: result.execution.status === "SUCCEEDED" ? "AGENT_LOOP" : "EXECUTION",
    failureCode: result.execution.failureCode ?? null,
    execution: result.execution,
    materializedCase: result.materializedCase,
    semantic: result.semantic,
    events: result.events,
    trajectories: result.trajectories,
    finalSnapshot: result.finalSnapshot,
    loop: result.loop,
    sourceCalls: result.sourceCalls,
    resourceUsage: {
      elapsedMs: result.elapsedMs,
      agentDecisions: result.trajectories.filter((step) => step.modelAttempt?.purpose === "restaurant_agent_decide").length,
      browserModelCalls: 0,
    },
    limits: { maxSteps: 6, ...limits },
  };
  try {
    await writeFile(artifactPath, JSON.stringify(artifact));
    const evaluated = await evaluateArtifactFile(artifactPath);
    // Ensure the test exercises the persisted evaluator sidecar, rather than a
    // hand-constructed evaluation object.
    assert.ok((await readFile(evaluated.outputPath, "utf8")).includes('"completion"'));
    return evaluated.evaluation;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

const cancelledExpectation: FixedSourceExpectation = {
  kind: "USER_CANCELLED",
  execution: { status: "CANCELLED", phase: "UNDERSTANDING", failureCodes: ["CANCELLED"] },
  coverage: { necessary: true },
  requiredDimensions: ["AUTHORITATIVE_CONDITIONS", "COMPLETION_OUTCOME"],
};

const budgetStopExpectation: FixedSourceExpectation = {
  kind: "BUDGET_OR_DEADLINE_STOP",
  execution: { status: "FAILED", loopStatus: "MODEL_FAILURE", phase: "FAILED", failureCodes: ["MODEL_CALL_BUDGET_EXHAUSTED"] },
  coverage: { necessary: true },
  requiredDimensions: ["AUTHORITATIVE_CONDITIONS", "COMPLETION_OUTCOME"],
};

test("a frozen business clock cannot freeze the real outer deadline or admit a late model result", async () => {
  const { registration, materializedCase } = await loadRegisteredFixedSourceCase("h001");
  let resolveLate: ((value: ModelResponse) => void) | undefined;
  let calls = 0;
  const model: ModelGateway = { complete(_request: ModelRequest) {
    calls += 1;
    return new Promise<ModelResponse>((resolve) => { resolveLate = resolve; });
  } };
  const started = Date.now();
  const result = await executeFixedSourceCase({ registration, materializedCase, model, taskId: "deadline:frozen-business-clock", deadlineMs: 20, clock: { now: () => new Date(materializedCase.reference_time) } });
  assert.equal(result.execution.status, "CANCELLED");
  assert.equal(result.execution.failureCode, "CANCELLED");
  assert.ok(result.elapsedMs < 500, `deadline did not bound execution: ${result.elapsedMs}ms`);
  assert.equal(calls, 1, "the deadline must stop later model/agent work from starting");
  const terminal = structuredClone(result.execution);
  resolveLate?.(response('{"schemaVersion":"3","facts":[]}', "late-semantic"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(result.execution, terminal, "a late child result cannot overwrite the already-finalized execution record");
  assert.ok(Date.now() - started < 500);
});

test("a result that completes before the deadline retains its normal terminal outcome", async () => {
  const { registration, materializedCase } = await loadRegisteredFixedSourceCase("h001");
  const actions = ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"];
  const model: ModelGateway = { async complete(request) {
    if (request.purpose === "restaurant_semantic_interpret") {
      return response(JSON.stringify({ schemaVersion: "3", facts: [
        { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase near Shibuya" } },
        { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-19", raw: "tonight" } },
        { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
        { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
        { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
        { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", polarity: "POSITIVE", strength: "HARD" } },
      ] }), "semantic");
    }
    const type = actions.shift();
    const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context?: { candidates?: Array<{ id: string }> } };
    const candidateIds = payload.context?.candidates?.map((candidate) => candidate.id) ?? [];
    return response(JSON.stringify({ type, question: "", relatedFields: [], retrievalHint: "", candidateIds: type === "CHECK_AVAILABILITY" || type === "PRESENT_RESULTS" ? candidateIds : [], candidateId: "", offerId: "", decisionSummary: "deadline normal control" }), `agent:${type}`);
  } };
  const result = await executeFixedSourceCase({ registration, materializedCase, model, taskId: "deadline:normal", deadlineMs: 1_000 });
  assert.deepEqual(result.execution, { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" });
});

test("actual controlled cancellation and model budget artifacts pass only their own stop acceptance", async () => {
  const { registration, materializedCase } = await loadRegisteredFixedSourceCase("h001");

  let agentDecisionStarted: (() => void) | undefined;
  const agentDecision = new Promise<void>((resolve) => { agentDecisionStarted = resolve; });
  const cancellation = new AbortController();
  const cancelledRun = executeFixedSourceCase({
    registration,
    materializedCase,
    taskId: "controlled-stop:user-cancelled",
    signal: cancellation.signal,
    deadlineMs: 1_000,
    model: {
      complete(request: ModelRequest) {
        if (request.purpose === "restaurant_semantic_interpret") return Promise.resolve(h001SemanticResponse());
        agentDecisionStarted?.();
        return new Promise<ModelResponse>(() => undefined);
      },
    },
  });
  await agentDecision;
  cancellation.abort();
  const cancelled = await cancelledRun;
  assert.deepEqual(cancelled.execution, { status: "CANCELLED", phase: "UNDERSTANDING", failureCode: "CANCELLED" });
  assert.equal(cancelled.sourceCalls.search, 0, "cancellation must prevent new source reads after the controlled stop");
  const cancelledEvaluation = await evaluateActualStopArtifact(cancelled, { timeoutMs: 1_000 });
  assert.equal(cancelledEvaluation.execution.completion, "CANCELLED");
  assert.equal(cancelledEvaluation.execution.taskProducedQualifiedResult, "NO");
  const cancelledAcceptance = assessFixedSourceAcceptance({ expectation: cancelledExpectation, execution: cancelled.execution, evaluation: cancelledEvaluation, coverageGaps: cancelled.sourceCalls.coverageGaps });
  assert.deepEqual(cancelledAcceptance, { acceptance: "PASS", userGoalCompletion: "NOT_COMPLETE", reasons: [], exitCode: 0 });

  const budget = await executeFixedSourceCase({
    registration,
    materializedCase,
    taskId: "controlled-stop:model-budget",
    maxModelCalls: 1,
    deadlineMs: 1_000,
    model: { complete(request: ModelRequest) {
      if (request.purpose === "restaurant_semantic_interpret") return Promise.resolve(h001SemanticResponse());
      throw new Error("The controlled transport budget should reject before a second model call.");
    } },
  });
  assert.deepEqual(budget.execution, { status: "FAILED", loopStatus: "MODEL_FAILURE", phase: "FAILED", failureCode: "MODEL_CALL_BUDGET_EXHAUSTED" });
  assert.equal(budget.modelCalls, 1, "the model-call ceiling must stop the second invocation");
  assert.equal(budget.sourceCalls.search, 0, "budget exhaustion before an action must not start a source read");
  const budgetEvaluation = await evaluateActualStopArtifact(budget, { maxModelCalls: 1, timeoutMs: 1_000 });
  assert.equal(budgetEvaluation.execution.completion, "BUDGET_OR_DEADLINE_STOP");
  assert.equal(budgetEvaluation.execution.taskProducedQualifiedResult, "NO");
  const budgetAcceptance = assessFixedSourceAcceptance({ expectation: budgetStopExpectation, execution: budget.execution, evaluation: budgetEvaluation, coverageGaps: budget.sourceCalls.coverageGaps });
  assert.deepEqual(budgetAcceptance, { acceptance: "PASS", userGoalCompletion: "NOT_COMPLETE", reasons: [], exitCode: 0 });

  // These are the same evaluator-produced artifacts; swapping the declared
  // behavior proves that an internal/budget failure cannot masquerade as a
  // correct user cancellation (and vice versa).
  const wrongReason = assessFixedSourceAcceptance({ expectation: cancelledExpectation, execution: budget.execution, evaluation: budgetEvaluation, coverageGaps: budget.sourceCalls.coverageGaps });
  assert.equal(wrongReason.acceptance, "FAIL");
  assert.match(wrongReason.reasons.join("\n"), /Expected execution|Expected stop reason|Expected CANCELLED evaluator completion/);
});
