import type { DecisionState } from "./restaurant-decision-eval-contract.js";
import { canonicalizeDecisionStateForComparison } from "./restaurant-decision-eval-canonicalization.js";
import type {
  DecisionEvalRunnerReport,
  DecisionEvalTurnDiagnostic,
} from "./restaurant-decision-eval-runner.js";

export interface RestaurantDecisionEvalDiagnosticLogMetadata {
  generatedAt: string;
  classification: {
    scope: string;
    cohort: string;
    contaminationStatus: string;
    baselineEligible: boolean;
  };
}

interface StateDifference {
  path: string;
  expected: unknown;
  actual: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => sameValue(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && sameValue(left[key], right[key]));
}

function stateDifferences(
  expected: unknown,
  actual: unknown,
  path = "state",
): StateDifference[] {
  if (sameValue(expected, actual)) return [];
  if (Array.isArray(expected) || Array.isArray(actual)) {
    return [{ path, expected, actual }];
  }
  if (!isRecord(expected) || !isRecord(actual)) {
    return [{ path, expected, actual }];
  }
  const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  return keys.flatMap((key) => stateDifferences(expected[key], actual[key], `${path}.${key}`));
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function stateDiffBlock(expected: DecisionState, actual: DecisionState): string {
  const differences = stateDifferences(expected, actual);
  if (differences.length === 0) return "No difference.";
  if (
    stateDifferences(
      canonicalizeDecisionStateForComparison(expected),
      canonicalizeDecisionStateForComparison(actual),
    ).length === 0
  ) {
    return [
      "Canonical equivalent under approved Eval comparison rules; raw representation difference:",
      ...differences.map(
        (difference) => `- \`${difference.path}\`: expected ${json(difference.expected)}, actual ${json(difference.actual)}`,
      ),
    ].join("\n");
  }
  return differences
    .map((difference) => `- \`${difference.path}\`: expected ${json(difference.expected)}, actual ${json(difference.actual)}`)
    .join("\n");
}

function stageBlock(diagnostic: DecisionEvalTurnDiagnostic): string {
  if (diagnostic.score === undefined) {
    const errors = diagnostic.result.errors ??
      (diagnostic.result.errorCode === undefined ? [] : [diagnostic.result.errorCode]);
    return `- No semantic score: ${diagnostic.result.status}${errors.length === 0 ? "" : ` (${errors.join(", ")})`}`;
  }
  const firstFailure = diagnostic.score.firstFailureStage === undefined
    ? "none"
    : `${diagnostic.score.firstFailureStage} (${diagnostic.score.firstFailureCodes.join(", ")})`;
  return [
    `- First failure: ${firstFailure}`,
    ...diagnostic.score.stages.map(
      (stage) => `- ${stage.stage}: ${stage.status}${stage.errorCodes.length === 0 ? "" : ` (${stage.errorCodes.join(", ")})`}`,
    ),
  ].join("\n");
}

function turnBlock(diagnostic: DecisionEvalTurnDiagnostic): string {
  const header = `## ${diagnostic.episodeId} / ${diagnostic.turnId}`;
  const common = [
    header,
    `- Static Fixture user message: ${json(diagnostic.userMessage)}`,
    `- Candidate context: ${diagnostic.candidateContext.source} (${diagnostic.candidateContext.candidateIds.join(", ") || "none"})`,
    ...(diagnostic.relativeTimeResolution === undefined
      ? []
      : [`- Trusted relative-time resolution: ${json(diagnostic.relativeTimeResolution)}`]),
    "",
    "### Expected",
    "```json",
    json({
      statePatch: diagnostic.expected.statePatch,
      stateAfter: diagnostic.expected.stateAfter,
      readiness: diagnostic.expected.readiness,
      acceptableNextActions: diagnostic.expected.acceptableNextActions,
    }),
    "```",
  ];
  if (diagnostic.actual === undefined) {
    return [...common, "", "### Model result", stageBlock(diagnostic), ""].join("\n");
  }
  return [
    ...common,
    "",
    "### Model structured proposal",
    "```json",
    json({
      modelStatePatch: diagnostic.actual.modelStatePatch,
      effectiveStatePatch: diagnostic.actual.statePatch,
      readiness: diagnostic.actual.readiness,
      nextAction: diagnostic.actual.nextAction,
      recommendation: diagnostic.actual.recommendation,
      rankedCandidateIds: diagnostic.actual.rankedCandidateIds,
    }),
    "```",
    "",
    "### S1 Patch-effect difference (both patches applied to the same Gold predecessor)",
    stateDiffBlock(diagnostic.expected.stateAfter, diagnostic.actual.stateEffectOnGoldState),
    "",
    "### Accumulated-state difference (Gold trajectory vs model trajectory)",
    stateDiffBlock(diagnostic.expected.stateAfter, diagnostic.actual.accumulatedState),
    "",
    "### Stage results",
    stageBlock(diagnostic),
    "",
  ].join("\n");
}

/**
 * Renders local-only, static-Golden diagnostics. It intentionally contains
 * structured proposals and state comparisons, but never prompt text, model
 * natural-language completion text, API keys, or ordinary Gateway telemetry.
 */
export function renderRestaurantDecisionEvalDiagnosticLog(
  report: DecisionEvalRunnerReport,
  diagnostics: readonly DecisionEvalTurnDiagnostic[],
  metadata: RestaurantDecisionEvalDiagnosticLogMetadata,
): string {
  const summary = report.status === "COMPLETED"
    ? [
        `- Dataset: ${report.datasetId} v${report.datasetVersion}`,
        `- Mode: ${report.mode}`,
        `- Turns with diagnostic evidence: ${diagnostics.length}`,
        `- Model calls: ${report.summary.modelCalls}; schema retries: ${report.summary.schemaRetryCalls}`,
        `- First failures: ${json(report.summary.firstFailureStages)}`,
      ]
    : [
        `- Mode: ${report.mode}`,
        `- Runner status: ${report.status}`,
        "- No model call was made because Preflight blocked the run.",
      ];
  return [
    "# Restaurant Progressive Decision Eval diagnostic",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Classification: ${metadata.classification.cohort} / ${metadata.classification.contaminationStatus} / baselineEligible:${metadata.classification.baselineEligible}`,
    `- Scope: ${metadata.classification.scope}`,
    "- Privacy boundary: static exposed Golden Regression fixture only. This file excludes raw system prompts, raw model completions, API keys, and production-user data.",
    ...summary,
    "",
    "The two state comparisons distinguish an incorrect Patch in this turn (S1) from divergence accumulated from earlier turns (S2).",
    "",
    ...diagnostics.map(turnBlock),
  ].join("\n");
}
