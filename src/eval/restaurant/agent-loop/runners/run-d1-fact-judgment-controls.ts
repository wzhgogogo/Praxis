import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../../core/model/contracts.js";
import { validateRestaurantAction } from "../../../../domains/restaurant/action-validator.js";
import type { RestaurantTaskState } from "../../../../domains/restaurant/contracts.js";
import { applyRestaurantIntentPatch } from "../../../../domains/restaurant/intent-state.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { ModelRestaurantFactJudgment, RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION } from "../../../../integrations/restaurant-facts/model-fact-judgment.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { D1_FACT_JUDGMENT_CONTROLS } from "../d1-fact-judgment-controls.js";

const controlsPath = resolve("src/eval/restaurant/agent-loop/d1-fact-judgment-controls.ts");
const controlsSha256 = createHash("sha256").update(readFileSync(controlsPath)).digest("hex");
const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();
const plan = { mode: "EXPOSED_FIXED_SOURCE_MODEL_DIAGNOSTIC", promptVersion: RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION,
  cohort: "exposed-development", contaminationStatus: "EXPOSED", baselineEligible: false,
  gitSnapshot: { head: git("rev-parse", "HEAD"), workingTreeStatus: git("status", "--short"),
    trackedDiffSha256: createHash("sha256").update(git("diff", "--binary", "HEAD")).digest("hex") },
  controlsSha256, maxProviderAttempts: 6, maxPerCallMs: 8_000, maxExecutionMs: 60_000,
  retries: 0, googleCalls: 0, browserCalls: 0, externalWrites: 0,
  controls: D1_FACT_JUDGMENT_CONTROLS.map(({ id, rationale, expected, eligible }) => ({ id, rationale, expected, eligible })) };

if (!process.argv.includes("--run")) {
  console.log(JSON.stringify(plan, null, 2));
} else {
  if (process.env.PRAXIS_ALLOW_LIVE_MODEL_EVAL !== "1" || process.env.PRAXIS_ALLOW_D1_FACT_JUDGMENT_6 !== "1") throw new Error("D1 six-control model diagnostic has not been authorized");
  if (!process.env.DEEPSEEK_API_KEY || !process.env.DEEPSEEK_MODEL) throw new Error("D1 model credentials/configuration missing");
  if (D1_FACT_JUDGMENT_CONTROLS.length !== 6) throw new Error("D1 must run exactly six frozen controls");
  const journal = await startDiagnosticRun(resolve(".eval-artifacts/restaurant-fact-targeted"), plan);
  const startedAtMs = Date.now();
  let attempts = 0;
  let completed = 0;
  let executionFailed = false;
  const runs: Record<string, unknown>[] = [];
  try {
    const provider = DeepSeekModelGateway.fromEnvironment(process.env);
    for (const control of D1_FACT_JUDGMENT_CONTROLS) {
      let request: ModelRequest | undefined;
      let response: ModelResponse | undefined;
      let providerFailureCode: string | undefined;
      const gateway: ModelGateway = { async complete(input) {
        const remainingMs = 60_000 - (Date.now() - startedAtMs);
        if (remainingMs <= 0) throw Object.assign(new Error("D1 total time ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
        if (attempts >= 6) throw Object.assign(new Error("D1 provider ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
        request = { ...structuredClone(input), timeoutMs: Math.min(input.timeoutMs, remainingMs) };
        attempts += 1;
        await journal.recordAttempt(attempts, "DISPATCHED", { controlId: control.id, exactRequest: request });
        try {
          response = await provider.complete(request);
          completed += 1;
          await journal.recordAttempt(attempts, "SETTLED", { controlId: control.id, rawOutput: response.outputText, providerResponse: { ...response, outputText: undefined } });
          return response;
        } catch (error) {
          providerFailureCode = diagnosticFailureCode(error);
          await journal.recordAttempt(attempts, "SETTLED", { controlId: control.id, status: "FAILED", failureCode: providerFailureCode });
          throw error;
        }
      } };
      const judged = await new ModelRestaurantFactJudgment(gateway, () => "2026-09-24T09:00:00.000Z").judge(control);
      if (!response) {
        executionFailed = true;
        runs.push({ id: control.id, inputStatus: request ? "INVOKED" : "NOT_INVOKED", failureCode: providerFailureCode ?? "DIAGNOSTIC_FAILED", passed: false });
        break;
      }
      const sourceIds = new Set(control.evidence.filter(item => item.kind === "RESTAURANT_FACT").map(item => item.evidenceId));
      let raw: { criterion?: unknown; outcome?: unknown; scope?: unknown; evidenceIds?: unknown } | undefined;
      try {
        const parsed = JSON.parse(response?.outputText ?? "") as { judgments?: unknown };
        raw = Array.isArray(parsed.judgments) ? parsed.judgments.find(item => item?.criterion === control.intent.criteria[0]?.text) : undefined;
      } catch { /* malformed raw response is a failed control */ }
      const citationValid = Array.isArray(raw?.evidenceIds) && raw.evidenceIds.length > 0 && raw.evidenceIds.every(id => typeof id === "string" && sourceIds.has(id));
      const claim = control.expected === "CONFLICT" ? "violatedNegativeCriteria" : control.expected === "SUPPORTED" ? "verifiedNegativeCriteria" : "categoryUnknownNegativeCriteria";
      const claims = judged.evidence[0]?.claims ?? {};
      const accepted = Array.isArray(claims[claim]) && claims[claim].includes(control.intent.criteria[0]!.text);
      const noOtherConclusion = ["violatedNegativeCriteria", "verifiedNegativeCriteria", "categoryUnknownNegativeCriteria"].filter(key => key !== claim).every(key => claims[key] === undefined);
      const candidateId = control.candidate.restaurant.id;
      const state: RestaurantTaskState = { schemaVersion: "11", phase: "SEARCHING", candidates: [control.candidate], availability: {}, availabilityChecks: {}, searchRevision: 0,
        intentDraft: applyRestaurantIntentPatch(undefined, { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "restaurant" }, area: { query: control.intent.area.query }, addCriteria: control.intent.criteria }),
        readEvidence: [
          { evidenceId: `${control.id}:area`, kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId, observedAt: "2026-09-24T09:00:00.000Z", requestFingerprint: control.id, claims: { areaQuery: control.intent.area.query, areaMatch: true } },
          ...control.evidence, ...judged.evidence,
        ] };
      const eligibility = validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, "2026-09-24T09:00:00.000Z").status === "ALLOWED";
      const passed = response?.finishReason === "TOOL_CALLS" && raw?.outcome === control.expected && raw.scope === "RESTAURANT_CATEGORY_TYPE" && citationValid && accepted && noOtherConclusion && eligibility === control.eligible;
      runs.push({ id: control.id, expected: { outcome: control.expected, eligible: control.eligible }, inputStatus: request ? "INVOKED" : "NOT_INVOKED",
        exactRequest: request, rawOutput: response?.outputText, providerResponse: response ? { ...response, outputText: undefined } : undefined,
        rawJudgment: raw, citationValid, convertedClaims: claims, eligibility, passed });
      if (!passed) break;
    }
    const passed = !executionFailed && attempts === 6 && completed === 6 && runs.length === 6 && runs.every(run => run.passed === true);
    const notReached = D1_FACT_JUDGMENT_CONTROLS.slice(runs.length).map(control => control.id);
    const evaluation = { status: executionFailed ? "NOT_EVALUATED" : passed ? "SATISFIED" : "NOT_SATISFIED",
      expectedByControl: plan.controls, failedControlIds: runs.filter(run => run.passed !== true).map(run => run.id), notReached };
    await journal.finish({ status: executionFailed ? "FAILED" : "SUCCEEDED", stage: executionFailed ? "PROVIDER_OR_BUDGET" : "MODEL_JUDGMENT",
      planned: 6, invoked: attempts, completed, notReached, evaluation, runs });
    console.log(JSON.stringify({ executionStatus: executionFailed ? "FAILED" : "SUCCEEDED", evaluationStatus: evaluation.status, planned: 6, invoked: attempts, completed, notReached, artifactPath: journal.resultPath }));
    process.exitCode = passed ? 0 : 1;
  } catch (error) {
    const notReached = D1_FACT_JUDGMENT_CONTROLS.slice(runs.length).map(control => control.id);
    await journal.finish({ status: "FAILED", stage: "DIAGNOSTIC_SETUP_OR_EXECUTION", failureCode: diagnosticFailureCode(error), planned: 6, invoked: attempts, completed, notReached, evaluation: { status: "NOT_EVALUATED" }, runs });
    console.error(JSON.stringify({ failureCode: diagnosticFailureCode(error), planned: 6, invoked: attempts, completed, notReached, artifactPath: journal.resultPath }));
    process.exitCode = 1;
  }
}
