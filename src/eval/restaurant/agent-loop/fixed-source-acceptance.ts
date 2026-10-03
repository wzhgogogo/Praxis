import type { DiagnosticFinding, RestaurantHybridDiagnosticEvaluation } from "./diagnostic-evaluator.js";
import type { FixedSourceExpectation } from "./fixed-source-case-registry.js";
import type { FixedSourceCoverageGap } from "./current-development-fixed-sources.js";

export type FixedSourceExecutionResult = {
  status: "SUCCEEDED" | "FAILED" | "CANCELLED";
  loopStatus?: string;
  phase?: string;
  failureCode?: string | null;
};

export type FixedSourceAcceptanceResult = {
  acceptance: "PASS" | "FAIL" | "BLOCKED";
  userGoalCompletion: "COMPLETE" | "NOT_COMPLETE" | "UNKNOWN";
  reasons: string[];
  /** Runtime's default open-ended target is reported even when it is unmet. */
  defaultBatchTarget?: { target: number; actual: number; met: boolean };
  exitCode: 0 | 1;
};

export type FixedSourceSourceUsage = Readonly<Record<string, Readonly<{
  attempted: boolean;
  observed: boolean;
}>>>;

type BrowserTrace = Readonly<{ kind: string; detail: unknown }>;
type FixedNativeSource = "TABELOG" | "TABLECHECK";

function sourceForUrl(value: unknown): FixedNativeSource | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    if (hostname === "tabelog.com" || hostname.endsWith(".tabelog.com")) return "TABELOG";
    if (hostname === "tablecheck.com" || hostname.endsWith(".tablecheck.com")) return "TABLECHECK";
  } catch { /* Trace records may contain failed or malformed targets. */ }
  return undefined;
}

/**
 * Navigation attempts and successful observations are intentionally separate:
 * a failed forbidden navigation still violates the scenario, while a required
 * source needs a snapshot from the actual source before it can satisfy it.
 */
export function fixedNativeSourceUsage(
  navigations: readonly string[],
  trace: readonly BrowserTrace[],
): Readonly<Record<FixedNativeSource, { attempted: boolean; observed: boolean }>> {
  const attempted = new Set<FixedNativeSource>();
  const observed = new Set<FixedNativeSource>();
  for (const url of navigations) {
    const source = sourceForUrl(url);
    if (source) attempted.add(source);
  }
  for (const entry of trace) {
    if (!entry.detail || typeof entry.detail !== "object") continue;
    const detail = entry.detail as { method?: unknown; args?: unknown; url?: unknown };
    if (entry.kind === "SESSION_CALL" && typeof detail.method === "string" && Array.isArray(detail.args)) {
      const method = detail.method.toLowerCase();
      const target = method === "navigate" ? detail.args[0] : method === "openlink" ? detail.args[1] : undefined;
      const source = sourceForUrl(target);
      if (source) attempted.add(source);
    }
    if (entry.kind === "SNAPSHOT") {
      const source = sourceForUrl(detail.url);
      if (source) observed.add(source);
    }
  }
  return {
    TABELOG: { attempted: attempted.has("TABELOG"), observed: observed.has("TABELOG") },
    TABLECHECK: { attempted: attempted.has("TABLECHECK"), observed: observed.has("TABLECHECK") },
  };
}

function findingStatus(evaluation: RestaurantHybridDiagnosticEvaluation, dimension: DiagnosticFinding["dimension"]): string | undefined {
  return evaluation.findings.find((finding) => finding.dimension === dimension)?.status;
}

/**
 * Converts independent evaluator evidence plus a case's predeclared contract
 * into the only successful CLI outcome.  It intentionally has no access to
 * production `eligible`, `canEndRead`, or terminal labels as an oracle.
 */
export function assessFixedSourceAcceptance(input: {
  expectation: FixedSourceExpectation;
  execution: FixedSourceExecutionResult;
  evaluation?: RestaurantHybridDiagnosticEvaluation;
  evaluationFailure?: string;
  coverageGaps?: readonly FixedSourceCoverageGap[];
  /** Runner-recorded source facts, kept separate from evaluator findings. */
  sourceRequirements?: { requiredSources: readonly string[]; forbiddenSources?: readonly string[] };
  sourceUsage?: FixedSourceSourceUsage;
  presentedResult?: {
    candidateIds: readonly string[];
    resultBatchTarget?: { candidateCount: number; met: boolean };
    /** Authoritative semantic result, passed through from the final State. */
    requestedResultCount?: number;
  };
}): FixedSourceAcceptanceResult {
  const reasons: string[] = [];
  const gaps = input.coverageGaps ?? [];
  if (input.expectation.coverage.necessary && gaps.length) {
    return { acceptance: "BLOCKED", userGoalCompletion: "UNKNOWN", reasons: gaps.map((gap) => `Necessary fixture coverage gap: ${gap.source}/${gap.stage}: ${gap.reason}`), exitCode: 1 };
  }
  if (input.evaluationFailure || !input.evaluation) {
    return { acceptance: "BLOCKED", userGoalCompletion: "UNKNOWN", reasons: [`Evaluator unavailable: ${input.evaluationFailure ?? "EVALUATION_MISSING"}`], exitCode: 1 };
  }
  const evaluation = input.evaluation;
  if (gaps.length && !input.expectation.coverage.necessary && evaluation.execution.taskProducedQualifiedResult !== "YES") {
    return { acceptance: "BLOCKED", userGoalCompletion: "UNKNOWN", reasons: ["Optional fixture gaps have no independently sufficient qualified result.", ...gaps.map((gap) => `Optional fixture coverage gap: ${gap.source}/${gap.stage}: ${gap.reason}`)], exitCode: 1 };
  }
  for (const source of input.sourceRequirements?.requiredSources ?? []) {
    const usage = input.sourceUsage?.[source];
    if (!usage?.attempted) reasons.push(`Required source ${source} was not attempted.`);
    else if (!usage.observed) reasons.push(`Required source ${source} was attempted but not successfully observed.`);
  }
  for (const source of input.sourceRequirements?.forbiddenSources ?? []) {
    if (input.sourceUsage?.[source]?.attempted) reasons.push(`Forbidden source ${source} was attempted.`);
  }
  for (const dimension of input.expectation.requiredDimensions) {
    const status = findingStatus(evaluation, dimension);
    if (status !== "SATISFIED") reasons.push(`Required evaluator dimension ${dimension} is ${status ?? "MISSING"}.`);
  }
  const expected = input.expectation.execution;
  if (input.execution.status !== expected.status || (expected.loopStatus !== undefined && input.execution.loopStatus !== expected.loopStatus) || (expected.phase !== undefined && input.execution.phase !== expected.phase)) {
    reasons.push(`Expected execution ${expected.status}/${expected.loopStatus ?? "ANY"}/${expected.phase ?? "ANY"}, got ${input.execution.status}/${input.execution.loopStatus ?? "MISSING"}/${input.execution.phase ?? "MISSING"}.`);
  }
  if (expected.failureCodes?.length && !expected.failureCodes.includes(input.execution.failureCode ?? "")) {
    reasons.push(`Expected stop reason ${expected.failureCodes.join(" or ")}, got ${input.execution.failureCode ?? "MISSING"}.`);
  }
  const qualified = evaluation.execution.taskProducedQualifiedResult;
  if (input.expectation.kind === "QUALIFIED_RESULT" && qualified !== "YES") reasons.push(`Expected QUALIFIED_RESULT, got ${qualified}.`);
  if (input.expectation.kind === "VERIFIED_NO_RESULT" && (qualified !== "NO" || evaluation.execution.completion !== "NO_VERIFIED_RESULT")) reasons.push(`Expected independently supported no-result, got ${qualified}/${evaluation.execution.completion}.`);
  if (input.expectation.kind === "NEEDS_USER_INPUT" && evaluation.execution.completion !== "NEEDS_USER_INPUT") reasons.push(`Expected NEEDS_USER_INPUT evaluator completion, got ${evaluation.execution.completion}.`);
  if (input.expectation.kind === "USER_CANCELLED" && evaluation.execution.completion !== "CANCELLED") reasons.push(`Expected CANCELLED evaluator completion, got ${evaluation.execution.completion}.`);
  if (input.expectation.kind === "BUDGET_OR_DEADLINE_STOP" && evaluation.execution.completion !== "BUDGET_OR_DEADLINE_STOP") reasons.push(`Expected BUDGET_OR_DEADLINE_STOP evaluator completion, got ${evaluation.execution.completion}.`);
  const presented = input.presentedResult;
  const distinctCandidateCount = presented ? new Set(presented.candidateIds).size : 0;
  if (input.expectation.kind === "QUALIFIED_RESULT" && (!presented || distinctCandidateCount === 0 || presented.candidateIds.length !== distinctCandidateCount)) {
    reasons.push(`Expected one or more distinct presented candidates, got ${presented ? `${distinctCandidateCount} distinct of ${presented.candidateIds.length}` : "no presentation record"}.`);
  }
  if (input.expectation.expectedPresentation === "NONE" && (presented?.candidateIds.length ?? 0) !== 0) {
    reasons.push(`Expected no presented candidates, got ${presented?.candidateIds.length ?? 0}.`);
  }
  const registeredUserBatch = input.expectation.requiredResultBatch;
  const stateRequestedCount = presented?.requestedResultCount;
  // State is authoritative about what the user asked. Registration is the
  // frozen assertion that the case text contains that request; either source
  // missing or disagreeing is a contract error, never a default batch.
  if (stateRequestedCount !== undefined && !registeredUserBatch) {
    reasons.push(`Authoritative State requested ${stateRequestedCount} results, but the fixed-source registration has no USER_EXPLICIT result-count expectation.`);
  }
  if (registeredUserBatch && stateRequestedCount === undefined) {
    reasons.push(`Registered USER_EXPLICIT result count ${registeredUserBatch.candidateCount} is missing from authoritative State.`);
  }
  if (registeredUserBatch && stateRequestedCount !== undefined && stateRequestedCount !== registeredUserBatch.candidateCount) {
    reasons.push(`Registered USER_EXPLICIT result count ${registeredUserBatch.candidateCount} disagrees with authoritative State count ${stateRequestedCount}.`);
  }
  const requiredCount = registeredUserBatch?.candidateCount;
  if (requiredCount !== undefined) {
    if (!presented || presented.candidateIds.length !== requiredCount || distinctCandidateCount !== requiredCount) {
      reasons.push(`Expected exactly ${requiredCount} distinct presented candidates, got ${presented ? `${distinctCandidateCount} distinct of ${presented.candidateIds.length}` : "no presentation record"}.`);
    }
    if (presented?.resultBatchTarget?.candidateCount !== requiredCount || presented.resultBatchTarget.met !== true) {
      reasons.push(`Expected met result batch target of ${requiredCount}, got ${presented?.resultBatchTarget ? `${presented.resultBatchTarget.candidateCount}/${presented.resultBatchTarget.met}` : "MISSING"}.`);
    }
  }
  const acceptance = reasons.length ? "FAIL" : "PASS";
  // Completion is derived from the independently evaluated produced result,
  // never merely copied from a case registration boolean.
  const userGoalCompletion = acceptance !== "PASS" ? "UNKNOWN" : qualified === "YES" ? "COMPLETE" : "NOT_COMPLETE";
  const defaultBatchTarget = stateRequestedCount === undefined && !registeredUserBatch && presented?.resultBatchTarget
    ? { target: presented.resultBatchTarget.candidateCount, actual: distinctCandidateCount, met: presented.resultBatchTarget.met }
    : undefined;
  return { acceptance, userGoalCompletion, reasons, ...(defaultBatchTarget ? { defaultBatchTarget } : {}), exitCode: acceptance === "PASS" ? 0 : 1 };
}
