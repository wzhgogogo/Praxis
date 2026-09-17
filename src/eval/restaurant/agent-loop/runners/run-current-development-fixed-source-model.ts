import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ModelGateway, ModelInvocationRecord } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { evaluateArtifactAfterFinish, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION } from "../diagnostic-evaluator.js";
import { createCurrentDevelopmentFixedSources } from "../current-development-fixed-sources.js";
import { createHybridReadComposition } from "../hybrid-read-composition.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "../live-evaluation-location.js";
import { requiresEvaluationLocation } from "../evaluation-location-selection.js";
import { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "../live-case-materializer.js";
import { currentDevelopmentSourceScenario, type CurrentDevelopmentScenarioId } from "../current-development-source-scenarios.js";

function requiredGate(key: string): void {
  if (process.env[key] !== "1") throw new Error(`Set ${key}=1 to run this paid fixed-source model diagnostic`);
}

function requiredValue(key: string): void {
  if (!process.env[key]?.trim()) throw new Error(`${key} is required for the fixed-source model diagnostic`);
}

function selectedCaseId(): CurrentDevelopmentScenarioId {
  const index = process.argv.indexOf("--case");
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!["h001", "h002", "h003", "h004", "h005"].includes(value ?? "")) {
    throw new Error("--case must be one of h001, h002, h003, h004, h005");
  }
  return value as CurrentDevelopmentScenarioId;
}

function ceiling(): number {
  const index = process.argv.indexOf("--max-model-calls");
  const value = index < 0 ? 30 : Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1 || value > 30) throw new Error("--max-model-calls must be an integer from 1 to 30");
  return value;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

requiredGate("PRAXIS_ALLOW_LIVE_MODEL_EVAL");
requiredValue("DEEPSEEK_API_KEY");

const caseId = selectedCaseId();
const maxModelCalls = ceiling();
const sourcePath = resolve(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
const frozen = (await loadFrozenLiveCases(sourcePath)).find((item) => item.id === caseId);
if (!frozen) throw new Error(`Frozen development case ${caseId} is missing`);
const scenario = currentDevelopmentSourceScenario(caseId);
const startedAt = new Date();
const observedAt = new Date(frozen.reference_time).toISOString();
const taskId = `fixed-source-model:${caseId}:${startedAt.valueOf()}`;
const runId = `run:${taskId}`;
const invocations: ModelInvocationRecord[] = [];
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "restaurant-fixed-source-model"), {
  mode: "FIXED_SOURCE_REAL_MODEL",
  caseId,
  scorerStatus: "FULL_RUBRIC_NOT_INTEGRATED",
  diagnosticEvaluator: { version: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION },
  dataset: { path: RESTAURANT_READ_DEVELOPMENT_CASE_PATH, sha256: sha256(sourcePath), contaminationStatus: "PROMPT_AND_RESULT_EXPOSED", baselineEligible: false },
  sourceEnvironment: { scenario: caseId, provenance: scenario.provenance, network: "OFFLINE_FIXED_TRANSPORT", browser: "OFFLINE_FIXED_PAGES" },
  runCeilings: { maxModelCalls, maxSteps: 12, timeoutMs: 30_000 },
  safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 },
});
let stage = "PROVIDER_SETUP";
let composition: ReturnType<typeof createHybridReadComposition> | undefined;
let semantic: unknown;
try {
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe: (record) => { invocations.push(structuredClone(record)); } } });
  let calls = 0;
  const model: ModelGateway = { async complete(request) {
    if (calls >= maxModelCalls) throw Object.assign(new Error("Fixed-source model-call ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
    calls += 1;
    return provider.complete(request);
  } };
  const sources = createCurrentDevelopmentFixedSources(scenario, observedAt, model);
  composition = createHybridReadComposition({
    taskId, runId, clock: { now: () => new Date(observedAt) }, model,
    search: sources.search, facts: sources.facts, availability: sources.availability,
    loop: { maxSteps: 12, timeoutMs: 30_000 },
  });
  stage = "SEMANTIC";
  const evaluationLocation = requiresEvaluationLocation(frozen) ? HIGASHI_GINZA_EVALUATION_LOCATION : undefined;
  semantic = await composition.interpretAndDispatch({ taskId, message: String(frozen.content ?? ""), referenceTime: frozen.reference_time, timezone: "Asia/Tokyo" }, evaluationLocation);
  if ((semantic as { status?: string }).status !== "PROPOSED") throw Object.assign(new Error("Semantic Interpreter did not produce a proposal"), { code: (semantic as { status?: string }).status ?? "SEMANTIC_FAILED" });
  stage = "AGENT_LOOP";
  const loop = await composition.coordinator.run(taskId);
  const finalSnapshot = composition.runtime.snapshot(taskId);
  const resourceUsage = {
    elapsedMs: Date.now() - startedAt.valueOf(),
    agentDecisions: composition.trajectories.steps.filter((step) => step.modelAttempt?.purpose === "restaurant_agent_decide").length,
    browserModelCalls: invocations.filter((record) => record.purpose === "browser_read_decide").length,
    googleRequests: sources.search.googleRequestUsage(`run:${taskId}:investigation:${finalSnapshot.domainState.investigationRevision}`),
  };
  const { content: _rawContent, ...materializedCase } = frozen;
  const artifact = {
    schemaVersion: "1", mode: "FIXED_SOURCE_REAL_MODEL", scorerStatus: "FULL_RUBRIC_NOT_INTEGRATED",
    diagnosticEvaluator: { version: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION },
    limits: { maxModelCalls, maxSteps: 12, timeoutMs: 30_000 },
    requestMetadata: { sha256: createHash("sha256").update(String(frozen.content ?? "")).digest("hex"), characterCount: String(frozen.content ?? "").length },
    materializedCase, sourceEnvironment: { scenario: caseId, provenance: scenario.provenance }, semantic, modelInvocations: invocations,
    events: composition.runtime.eventLog, trajectories: composition.trajectories.steps, finalSnapshot, loop, resourceUsage,
    safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 }, latencyMs: resourceUsage.elapsedMs,
  };
  const completed = ["PRESENT_RESULTS", "NO_VERIFIED_RESULT"].includes(finalSnapshot.domainState.phase) && loop.status === "TERMINAL";
  await journal.finish({ ...artifact, status: completed ? "SUCCEEDED" : "FAILED", stage: "AGENT_LOOP", failureCode: completed ? null : "FIXED_SOURCE_CASE_NOT_COMPLETED" });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.log(JSON.stringify({ mode: artifact.mode, caseId, sourceEnvironment: artifact.sourceEnvironment, loop, resourceUsage, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath, evaluationFailure: evaluation.evaluationFailure, evaluationFailurePath: evaluation.failurePath }, null, 2));
  if (!completed) process.exitCode = 1;
} catch (error) {
  const failureCode = diagnosticFailureCode(error);
  await journal.finish({ status: failureCode === "CANCELLED" ? "CANCELLED" : "FAILED", stage, failureCode, semanticStatus: (semantic as { status?: string } | undefined)?.status ?? "NOT_RETURNED", modelInvocations: invocations, events: composition?.runtime.eventLog ?? [], trajectories: composition?.trajectories.steps ?? [], latencyMs: Date.now() - startedAt.valueOf() });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.error(JSON.stringify({ failureCode, stage, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath, evaluationFailure: evaluation.evaluationFailure, evaluationFailurePath: evaluation.failurePath }));
  process.exitCode = 1;
}
