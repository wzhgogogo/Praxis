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
import {
  canonicalizeLocalityMatrixResponse,
  localityMatrixRunPassesExpected,
  type LocalityMatrixCanonical,
} from "../locality-fact-judgment-matrix-scoring.js";

type MatrixRun = {
  caseId: string;
  repetition: number;
  expected: LocalityFactJudgmentExpected;
  inputStatus: "INVOKED" | "FILTERED_NOT_INVOKED";
  exactRequest?: ModelRequest;
  rawOutput?: string;
  providerResponse?: Omit<ModelResponse, "outputText">;
  failureCode?: string;
  attemptJournal: { dispatchedPath?: string; settledPath?: string };
  canonical: LocalityMatrixCanonical;
};

function requiredGate(key: string): void {
  if (process.env[key] !== "1") throw new Error(`Set ${key}=1 to run this paid locality fact-judgment matrix`);
}
function requiredValue(key: string): void {
  if (!process.env[key]?.trim()) throw new Error(`${key} is required for the locality fact-judgment matrix`);
}
function sourceSha256(): string {
  return createHash("sha256").update(readFileSync(resolve("src/eval/restaurant/agent-loop/locality-fact-judgment-matrix.ts"))).digest("hex");
}
function claimStrings(evidence: Awaited<ReturnType<ModelRestaurantFactJudgment["judge"]>>["evidence"], key: string): string[] {
  return evidence.flatMap((item) => Array.isArray(item.claims[key]) && item.claims[key].every((value) => typeof value === "string")
    ? item.claims[key] as string[]
    : []);
}
function evaluatesExpected(run: MatrixRun): boolean {
  return localityMatrixRunPassesExpected(run);
}

requiredGate("PRAXIS_ALLOW_LIVE_MODEL_EVAL");
requiredGate("PRAXIS_ALLOW_FACT_JUDGMENT_LOCALITY_MATRIX_V3");
requiredValue("DEEPSEEK_API_KEY");
requiredValue("DEEPSEEK_MODEL");
if (process.argv.includes("--run") === false) throw new Error("Pass --run after recording the approved 36-call matrix budget");
if (LOCALITY_FACT_JUDGMENT_MATRIX.length !== 12 || RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS !== 3) {
  throw new Error("The authorized locality matrix is exactly V2-L1–V2-L10 plus N1/N2 with three repetitions; do not add cases or retries");
}
if (RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION !== "6") throw new Error("The locality matrix is only valid for ModelRestaurantFactJudgment Prompt@6");

const runCeiling = LOCALITY_FACT_JUDGMENT_MATRIX.length * RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS;
const invocations: ModelInvocationRecord[] = [];
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "restaurant-locality-fact-judgment-matrix-v3"), {
  mode: "REAL_MODEL_LOCALITY_FACT_JUDGMENT_MATRIX_V3",
  matrix: { version: RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_VERSION, sha256: sourceSha256(), cases: LOCALITY_FACT_JUDGMENT_MATRIX.map((item) => ({ id: item.id, expected: item.expected })), repetitions: RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS },
  prompt: { version: RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION },
  runCeilings: { exactProviderAttempts: runCeiling, retries: 0, googleCalls: 0, browserCalls: 0 },
  safety: { policy: "MODEL_ONLY_DIAGNOSTIC", externalSideEffectCount: 0 },
});

try {
  const provider = DeepSeekModelGateway.fromEnvironment(process.env, { observer: { observe: (record) => { invocations.push(structuredClone(record)); } } });
  const runs: MatrixRun[] = [];
  let providerAttempts = 0;
  for (const matrixCase of LOCALITY_FACT_JUDGMENT_MATRIX) {
    for (let repetition = 1; repetition <= RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS; repetition += 1) {
      const input = localityFactJudgmentInput(matrixCase, repetition);
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
      const providerResponse = response === undefined
        ? undefined
        : (({ outputText: _outputText, ...record }) => record)(response);
      const canonical = canonicalizeLocalityMatrixResponse({
        ...(response ? { response } : {}),
        targetCriterion: matrixCase.criterion,
        sourceEvidenceIds: input.evidence.map((item) => item.evidenceId),
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
    providerConfig: { configuredModel: process.env.DEEPSEEK_MODEL, temperature: 0, thinking: "disabled", responseFormat: "JSON_SCHEMA", outputSchema: { name: "restaurant_fact_judgment", version: "1" } },
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
