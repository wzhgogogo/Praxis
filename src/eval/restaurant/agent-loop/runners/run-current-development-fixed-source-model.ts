import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ModelGateway, ModelInvocationRecord } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { evaluateArtifactAfterFinish, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION } from "../diagnostic-evaluator.js";
import { assessFixedSourceAcceptance } from "../fixed-source-acceptance.js";
import { executeFixedSourceCase } from "../fixed-source-case-execution.js";
import { fixedSourceCaseRegistration, loadRegisteredFixedSourceCase } from "../fixed-source-case-registry.js";
import { currentDevelopmentSourceScenario } from "../current-development-source-scenarios.js";
import { RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "../live-case-materializer.js";

function requiredGate(key: string): void {
  if (process.env[key] !== "1") throw new Error(`Set ${key}=1 to run this paid fixed-source model diagnostic`);
}
function requiredValue(key: string): void {
  if (!process.env[key]?.trim()) throw new Error(`${key} is required for the fixed-source model diagnostic`);
}
function selectedCaseId(): string {
  const index = process.argv.indexOf("--case");
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error("--case is required; use a registered fixed-source case ID");
  fixedSourceCaseRegistration(value);
  return value;
}
function ceiling(): number {
  const index = process.argv.indexOf("--max-model-calls");
  const value = index < 0 ? 30 : Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1 || value > 30) throw new Error("--max-model-calls must be an integer from 1 to 30");
  return value;
}
function sha256(path: string): string { return createHash("sha256").update(readFileSync(path)).digest("hex"); }

requiredGate("PRAXIS_ALLOW_LIVE_MODEL_EVAL");
requiredValue("DEEPSEEK_API_KEY");
const caseId = selectedCaseId();
const maxModelCalls = ceiling();
const sourcePath = resolve(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
const { registration, materializedCase } = await loadRegisteredFixedSourceCase(caseId);
const scenario = currentDevelopmentSourceScenario(registration.sourceScenarioId);
const startedAt = new Date();
const taskId = `fixed-source-model:${caseId}:${startedAt.valueOf()}`;
const invocations: ModelInvocationRecord[] = [];
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "restaurant-fixed-source-model"), {
  mode: "FIXED_SOURCE_REAL_MODEL", caseId,
  scorerStatus: "FULL_RUBRIC_NOT_INTEGRATED",
  diagnosticEvaluator: { version: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION },
  dataset: { path: RESTAURANT_READ_DEVELOPMENT_CASE_PATH, sha256: sha256(sourcePath), contaminationStatus: "PROMPT_AND_RESULT_EXPOSED", baselineEligible: false },
  sourceEnvironment: { scenario: registration.sourceScenarioId, provenance: scenario.provenance, network: "OFFLINE_FIXED_TRANSPORT", browser: "OFFLINE_FIXED_PAGES" },
  clocks: { business: "CASE_REFERENCE_ADVANCING_WALL_CLOCK", execution: "REAL_WALL_CLOCK" },
  runCeilings: { maxModelCalls, maxSteps: 12, timeoutMs: 30_000 },
  safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 },
});
try {
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe: (record) => { invocations.push(structuredClone(record)); } } });
  let calls = 0;
  const model: ModelGateway = { async complete(request) {
    if (calls >= maxModelCalls) throw Object.assign(new Error("Fixed-source model-call ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
    calls += 1;
    return provider.complete(request);
  } };
  const result = await executeFixedSourceCase({ registration, materializedCase, model, taskId, maxSteps: 12, deadlineMs: 30_000 });
  const { content: _rawContent, ...caseWithoutRawContent } = materializedCase;
  const resourceUsage = {
    elapsedMs: result.elapsedMs,
    agentDecisions: result.trajectories.filter((step) => step.modelAttempt?.purpose === "restaurant_agent_decide").length,
    browserModelCalls: invocations.filter((record) => record.purpose === "browser_read_decide").length,
    googleRequests: { total: result.sourceCalls.search + result.sourceCalls.namedPlace + result.sourceCalls.facts, discovery: result.sourceCalls.search, namedPlaceResolution: result.sourceCalls.namedPlace, placeDetails: result.sourceCalls.facts },
  };
  const artifact = {
    schemaVersion: "1", mode: "FIXED_SOURCE_REAL_MODEL", scorerStatus: "FULL_RUBRIC_NOT_INTEGRATED",
    diagnosticEvaluator: { version: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION },
    limits: { maxModelCalls, maxSteps: 12, timeoutMs: 30_000 },
    requestMetadata: { sha256: createHash("sha256").update(String(materializedCase.content ?? "")).digest("hex"), characterCount: String(materializedCase.content ?? "").length },
    materializedCase: caseWithoutRawContent, sourceEnvironment: { scenario: registration.sourceScenarioId, provenance: scenario.provenance },
    clocks: { business: { mode: "CASE_REFERENCE_ADVANCING_WALL_CLOCK", referenceTime: materializedCase.reference_time }, execution: { mode: "REAL_WALL_CLOCK", startedAt: startedAt.toISOString() } },
    semantic: result.semantic, modelInvocations: invocations, events: result.events, trajectories: result.trajectories, finalSnapshot: result.finalSnapshot, loop: result.loop,
    resourceUsage, sourceCalls: result.sourceCalls, safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: 0 }, latencyMs: result.elapsedMs,
  };
  await journal.finish({ ...artifact, status: result.execution.status, stage: result.execution.status === "SUCCEEDED" ? "AGENT_LOOP" : "EXECUTION", failureCode: result.execution.failureCode ?? null, execution: result.execution });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  const acceptance = assessFixedSourceAcceptance({ expectation: registration.expectation, execution: result.execution, ...(evaluation.evaluation ? { evaluation: evaluation.evaluation } : {}), ...(evaluation.evaluationFailure ? { evaluationFailure: evaluation.evaluationFailure } : {}) });
  console.log(JSON.stringify({ mode: artifact.mode, caseId, sourceEnvironment: artifact.sourceEnvironment, execution: result.execution, acceptance, resourceUsage, artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath, evaluationFailure: evaluation.evaluationFailure, evaluationFailurePath: evaluation.failurePath }, null, 2));
  process.exitCode = acceptance.exitCode;
} catch (error) {
  const failureCode = diagnosticFailureCode(error);
  await journal.finish({ status: failureCode === "CANCELLED" ? "CANCELLED" : "FAILED", stage: "PROVIDER_SETUP", failureCode, modelInvocations: invocations, events: [], trajectories: [], latencyMs: Date.now() - startedAt.valueOf() });
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  console.error(JSON.stringify({ failureCode, stage: "PROVIDER_SETUP", artifactPath: journal.resultPath, evaluationPath: evaluation.outputPath, evaluationFailure: evaluation.evaluationFailure, evaluationFailurePath: evaluation.failurePath }));
  process.exitCode = 1;
}
