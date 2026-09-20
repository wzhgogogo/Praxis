import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ModelGateway, ModelInvocationRecord, ModelRequest, ModelResponse } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { ModelRestaurantFactJudgment, RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION } from "../../../../integrations/restaurant-facts/model-fact-judgment.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import {
  LOCALITY_FACT_JUDGMENT_MATRIX,
  RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS,
  RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_VERSION,
  localityFactJudgmentInput,
  type LocalityFactJudgmentExpected,
} from "../locality-fact-judgment-matrix.js";
import { CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX, RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS, RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_VERSION, categoryNegativeFactJudgmentInput, type CategoryNegativeExpected } from "../category-negative-fact-judgment-matrix.js";
import { scoreCategoryNegativeMatrixRun } from "../category-negative-fact-judgment-matrix-scoring.js";
import {
  canonicalizeLocalityMatrixResponse,
  localityMatrixRunPassesExpected,
  type LocalityMatrixCanonical,
} from "../locality-fact-judgment-matrix-scoring.js";

type MatrixRun = {
  caseId: string;
  repetition: number;
  expected: LocalityFactJudgmentExpected | CategoryNegativeExpected;
  inputStatus: "INVOKED" | "FILTERED_NOT_INVOKED";
  exactRequest?: ModelRequest;
  rawOutput?: string;
  providerResponse?: Omit<ModelResponse, "outputText">;
  failureCode?: string;
  attemptJournal: { dispatchedPath?: string; settledPath?: string };
  canonical: LocalityMatrixCanonical;
};

function requiredGate(key: string): void {
  if (process.env[key] !== "1") throw new Error(`Set ${key}=1 to run this paid fact-judgment matrix`);
}
function requiredValue(key: string): void {
  if (!process.env[key]?.trim()) throw new Error(`${key} is required for the fact-judgment matrix`);
}
function sourceSha256(): string {
  return createHash("sha256").update(readFileSync(resolve(categoryMode ? "src/eval/restaurant/agent-loop/category-negative-fact-judgment-matrix.ts" : "src/eval/restaurant/agent-loop/locality-fact-judgment-matrix.ts"))).digest("hex");
}
function claimStrings(evidence: Awaited<ReturnType<ModelRestaurantFactJudgment["judge"]>>["evidence"], key: string): string[] {
  return evidence.flatMap((item) => Array.isArray(item.claims[key]) && item.claims[key].every((value) => typeof value === "string")
    ? item.claims[key] as string[]
    : []);
}
function evaluatesExpected(run: MatrixRun): boolean {
  if (categoryMode) return scoreCategoryNegativeMatrixRun({ expected: run.expected as CategoryNegativeExpected, ...(run.rawOutput ? { response: { finishReason: run.providerResponse?.finishReason ?? "STOP", outputText: run.rawOutput } } : {}), criterion: run.canonical.targetCriterion, sourceEvidenceIds: run.canonical.sourceEvidenceIds, verifiedNegativeCriteria: (run as any).verifiedNegativeCriteria ?? [], violatedNegativeCriteria: (run as any).violatedNegativeCriteria ?? [], categoryUnknownNegativeCriteria: (run as any).categoryUnknownNegativeCriteria ?? [], supportingEvidenceIds: run.canonical.supportingEvidenceIds }).passed;
  return localityMatrixRunPassesExpected(run as any);
}

const categoryMode = process.argv.includes("--category-negative");
requiredGate("PRAXIS_ALLOW_LIVE_MODEL_EVAL");
requiredGate(categoryMode ? "PRAXIS_ALLOW_FACT_JUDGMENT_CATEGORY_MATRIX_V1" : "PRAXIS_ALLOW_FACT_JUDGMENT_LOCALITY_MATRIX_V3");
requiredValue("DEEPSEEK_API_KEY");
requiredValue("DEEPSEEK_MODEL");
if (process.argv.includes("--run") === false) throw new Error(`Pass --run after recording the approved ${categoryMode ? 16 : 36}-call matrix budget`);
if (!categoryMode && (LOCALITY_FACT_JUDGMENT_MATRIX.length !== 12 || RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS !== 3)) {
  throw new Error("The authorized locality matrix is exactly V2-L1–V2-L10 plus N1/N2 with three repetitions; do not add cases or retries");
}
if (categoryMode && (CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.length !== 8 || RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS !== 2)) throw new Error("The authorized category matrix is exactly F1–F8 with two repetitions and no retries");
if (RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION !== "8") throw new Error("The locality matrix is only valid for ModelRestaurantFactJudgment Prompt@8");

const activeMatrix = categoryMode ? CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX : LOCALITY_FACT_JUDGMENT_MATRIX;
const repetitions = categoryMode ? RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS : RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS;
const matrixVersion = categoryMode ? RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_VERSION : RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_VERSION;
const runCeiling = activeMatrix.length * repetitions;
const invocations: ModelInvocationRecord[] = [];
const journal = await startDiagnosticRun(resolve(".eval-artifacts", categoryMode ? "restaurant-category-negative-fact-judgment-matrix-v1" : "restaurant-locality-fact-judgment-matrix-v3"), {
  mode: categoryMode ? "REAL_MODEL_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_V1" : "REAL_MODEL_LOCALITY_FACT_JUDGMENT_MATRIX_V3",
  matrix: { version: matrixVersion, sha256: sourceSha256(), cases: activeMatrix.map((item) => ({ id: item.id, expected: item.expected })), repetitions },
  prompt: { version: RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION },
  runCeilings: { exactProviderAttempts: runCeiling, retries: 0, googleCalls: 0, browserCalls: 0 },
  safety: { policy: "MODEL_ONLY_DIAGNOSTIC", externalSideEffectCount: 0 },
});

try {
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe: (record) => { invocations.push(structuredClone(record)); } } });
  const runs: MatrixRun[] = [];
  let providerAttempts = 0;
  for (const matrixCase of activeMatrix) {
    for (let repetition = 1; repetition <= repetitions; repetition += 1) {
      const input = categoryMode ? categoryNegativeFactJudgmentInput(matrixCase as any, repetition) : localityFactJudgmentInput(matrixCase as any, repetition);
      let exactRequest: ModelRequest | undefined;
      let response: ModelResponse | undefined;
      let failureCode: string | undefined;
      let dispatchedPath: string | undefined;
      let settledPath: string | undefined;
      const gateway: ModelGateway = {
        async complete(request) {
          if (providerAttempts >= runCeiling) throw Object.assign(new Error("Locality matrix provider-attempt ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
          providerAttempts += 1;
          exactRequest = structuredClone(request);
          dispatchedPath = await journal.recordAttempt(providerAttempts, "DISPATCHED", {
            caseId: matrixCase.id, repetition, exactRequest,
          });
          try {
            response = await provider.complete(request);
            const { outputText: rawOutput, ...providerResponse } = response;
            settledPath = await journal.recordAttempt(providerAttempts, "SETTLED", {
              caseId: matrixCase.id, repetition, status: "SUCCEEDED", rawOutput, providerResponse,
            });
            return response;
          } catch (error) {
            failureCode = diagnosticFailureCode(error);
            settledPath = await journal.recordAttempt(providerAttempts, "SETTLED", {
              caseId: matrixCase.id, repetition, status: "FAILED", failureCode,
            });
            throw error;
          }
        },
      };
      const judged = await new ModelRestaurantFactJudgment(gateway, () => "2026-09-20T00:00:00.000Z").judge(input);
      const verified = claimStrings(judged.evidence, "verifiedHardCriteria");
      const verifiedNegativeCriteria = claimStrings(judged.evidence, "verifiedNegativeCriteria"); const violatedNegativeCriteria = claimStrings(judged.evidence, "violatedNegativeCriteria"); const categoryUnknownNegativeCriteria = claimStrings(judged.evidence, "categoryUnknownNegativeCriteria");
      const providerResponse = response === undefined
        ? undefined
        : (({ outputText: _outputText, ...record }) => record)(response);
      const canonical = canonicalizeLocalityMatrixResponse({
        ...(response ? { response } : {}),
        targetCriterion: matrixCase.criterion,
        sourceEvidenceIds: input.evidence.filter((item) => item.kind === "RESTAURANT_FACT").map((item) => item.evidenceId),
        acceptedVerifiedHardCriteria: verified,
        supportingEvidenceIds: claimStrings(judged.evidence, "supportingEvidenceIds"),
      });
      runs.push({
        caseId: matrixCase.id, repetition, expected: matrixCase.expected,
        inputStatus: exactRequest ? "INVOKED" : "FILTERED_NOT_INVOKED",
        ...(exactRequest ? { exactRequest } : {}),
        ...(response && providerResponse ? { rawOutput: response.outputText, providerResponse } : {}),
        ...(failureCode ? { failureCode } : {}),
        attemptJournal: { ...(dispatchedPath ? { dispatchedPath } : {}), ...(settledPath ? { settledPath } : {}) },
        canonical,
        ...(categoryMode ? { verifiedNegativeCriteria, violatedNegativeCriteria, categoryUnknownNegativeCriteria } : {}),
      });
    }
  }
  const failures = runs.filter((run) => !evaluatesExpected(run)).map((run) => `${run.caseId}/${run.repetition}`);
  const passed = providerAttempts === runCeiling && runs.length === runCeiling && invocations.length === runCeiling && failures.length === 0;
  const result = {
    status: "SUCCEEDED" as const,
    matrixPassed: passed,
    failureSummary: {
      ...(providerAttempts === runCeiling ? {} : { providerAttempts: `${providerAttempts}/${runCeiling}` }),
      ...(invocations.length === runCeiling ? {} : { providerInvocationRecords: `${invocations.length}/${runCeiling}` }),
      ...(failures.length ? { caseRuns: failures } : {}),
    },
    providerConfig: { configuredModel: process.env.DEEPSEEK_MODEL, temperature: 0, thinking: "disabled", responseFormat: "JSON_SCHEMA", outputSchema: { name: "restaurant_fact_judgment", version: "2" } },
    providerAttempts, modelInvocations: invocations, runs,
  };
  await journal.finish(result);
  console.log(JSON.stringify({ matrixPassed: passed, providerAttempts, artifactPath: journal.resultPath, failedCaseRuns: failures }, null, 2));
  process.exitCode = passed ? 0 : 1;
} catch (error) {
  const failureCode = diagnosticFailureCode(error);
  await journal.finish({ status: "FAILED", stage: "MATRIX_SETUP", failureCode, modelInvocations: invocations });
  console.error(JSON.stringify({ failureCode, artifactPath: journal.resultPath }));
  process.exitCode = 1;
}
