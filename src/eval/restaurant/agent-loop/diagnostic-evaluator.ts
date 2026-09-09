import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

export const RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION = "restaurant-hybrid-read-diagnostic-evaluator@1";
export const RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION = "restaurant-hybrid-read-diagnostic-rubric@1";

type JsonRecord = Record<string, unknown>;

export type DiagnosticEvaluationStatus = "SATISFIED" | "NOT_SATISFIED" | "NOT_EVALUATED";

export interface DiagnosticFinding {
  dimension: "AUTHORITATIVE_CONDITIONS" | "REQUIRED_EVIDENCE" | "INVESTIGATION_BEHAVIOR" | "FINAL_CLAIM" | "RESOURCES";
  status: DiagnosticEvaluationStatus;
  stage: string;
  requirement: string;
  observations: string[];
  directCause: string;
  rootCauseHypothesis: string;
  certainty: "CONFIRMED" | "LIKELY" | "UNKNOWN";
  evidenceRefs: string[];
  downstreamImpact: string;
}

export interface CandidateDiagnosticSummary {
  candidateId: string;
  outletName: string;
  providers: string[];
  result: string;
  reasonCode?: string;
  evidenceRefs: string[];
}

export interface RestaurantHybridDiagnosticEvaluation {
  schemaVersion: "1";
  evaluatorVersion: typeof RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION;
  rubricVersion: typeof RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION;
  rubricStatus: "DRAFT_DIAGNOSTIC_ONLY";
  sourceArtifact: { path: string; sha256: string; runId?: string; caseId?: string };
  execution: {
    status: string | null;
    stage: string | null;
    taskProducedQualifiedResult: "YES" | "NO" | "UNKNOWN";
    systemBehavior: "SUPPORTED_BY_EVIDENCE" | "NOT_SUPPORTED" | "NOT_EVALUATED";
    externalConditions: "OBSERVED" | "NOT_EVALUATED";
    evidenceSufficiency: "SUFFICIENT_FOR_PRESENTED_RESULT" | "INSUFFICIENT" | "NOT_EVALUATED";
  };
  candidateSummaries: CandidateDiagnosticSummary[];
  findings: DiagnosticFinding[];
  unassessedDimensions: string[];
}

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : undefined;
}

function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function asString(value: unknown): string | undefined { return typeof value === "string" ? value : undefined; }
function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }

function getPath(value: unknown, path: string[]): unknown {
  let cursor: unknown = value;
  for (const part of path) cursor = asRecord(cursor)?.[part];
  return cursor;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function actionCandidates(trajectories: unknown[]): string[] {
  return trajectories.flatMap((step): string[] => {
    const action = asRecord(asRecord(step)?.agentAction) ?? asRecord(asRecord(step)?.action);
    if (action?.type !== "CHECK_AVAILABILITY") return [];
    return asArray(action.candidateIds).flatMap((value): string[] => {
      const candidateId = asString(value);
      return candidateId ? [candidateId] : [];
    });
  });
}

function providerAttempts(diagnostics: JsonRecord, candidateId: string): string[] {
  const attempts = asArray(diagnostics.providerAttempts);
  return [...new Set(attempts.flatMap((item): string[] => {
    const attempt = asRecord(item);
    return attempt?.candidateId === candidateId ? [asString(attempt.provider) ?? "UNKNOWN_PROVIDER"] : [];
  }))];
}

function evaluationFinding(input: DiagnosticFinding): DiagnosticFinding { return input; }

function criteriaEquivalent(expected: unknown, actual: unknown): boolean {
  const expectedCriteria = asArray(expected).map(asRecord).filter((item): item is JsonRecord => Boolean(item)).map((item) => ({
    text: asString(item.value) ?? asString(item.text), polarity: asString(item.polarity), strength: asString(item.strength),
  }));
  const actualCriteria = asArray(actual).map(asRecord).filter((item): item is JsonRecord => Boolean(item)).map((item) => ({
    text: asString(item.value) ?? asString(item.text), polarity: asString(item.polarity), strength: asString(item.strength),
  }));
  return valuesEqual(expectedCriteria, actualCriteria);
}

function timeEquivalent(expected: unknown, actual: unknown): boolean {
  return valuesEqual(asString(asRecord(expected)?.value), actual);
}

function dateEquivalent(expected: unknown, actual: unknown): boolean {
  return valuesEqual(asString(asRecord(expected)?.value) ?? expected, actual);
}

function candidateResult(check: JsonRecord | undefined, offerCount: number): string {
  if (offerCount > 0) return "OFFER_GROUNDED";
  const status = asString(check?.status);
  const reason = asString(check?.reasonCode);
  if (status === "UNAVAILABLE" && !reason) return "EXPLICIT_NO_MATCHING_SLOT";
  if (reason === "AVAILABILITY_SOURCES_EXHAUSTED") return "PROVIDER_ATTEMPTS_EXHAUSTED";
  if (reason?.includes("BUDGET") || reason === "BROWSER_TIMEOUT") return "BUDGET_OR_TIMEOUT";
  if (reason === "REQUEST_MISMATCH" || reason === "REQUEST_SELECTION_UNCONFIRMED") return "REQUEST_NOT_CONFIRMED";
  if (status === "UNKNOWN") return "EVIDENCE_INCOMPLETE";
  return status ?? "NOT_CHECKED";
}

/**
 * Deterministically diagnoses an already-written Hybrid Live artifact. It deliberately
 * does not score model quality, call a judge, or turn missing evidence into a pass.
 */
export function evaluateRestaurantHybridLiveArtifact(artifact: unknown, sourceArtifact: { path: string; sha256: string }): RestaurantHybridDiagnosticEvaluation {
  const root = asRecord(artifact) ?? {};
  const domain = asRecord(getPath(root, ["finalSnapshot", "domainState"])) ?? {};
  const materializedIntent = asRecord(getPath(root, ["materializedCase", "semantic"])) ?? {};
  const finalIntent = asRecord(domain.intentDraft) ?? {};
  const candidates = asArray(domain.candidates).map(asRecord).filter((value): value is JsonRecord => Boolean(value));
  const checks = asRecord(domain.availabilityChecks) ?? {};
  const availability = asRecord(domain.availability) ?? {};
  const evidence = asArray(domain.readEvidence).map(asRecord).filter((value): value is JsonRecord => Boolean(value));
  const diagnostics = asRecord(root.diagnostics) ?? {};
  const trajectories = asArray(root.trajectories);
  const presented = asRecord(domain.presentedResults);
  const finalPhase = asString(domain.phase);
  const loopStatus = asString(getPath(root, ["loop", "status"]));

  const conditionPairs: Array<[string, unknown, unknown, (expected: unknown, actual: unknown) => boolean]> = [
    ["date", materializedIntent.date, finalIntent.date, dateEquivalent],
    ["partySize", materializedIntent.party_size, finalIntent.partySize, valuesEqual],
    ["timeWindow", materializedIntent.time, getPath(finalIntent, ["timeWindow", "earliest"]), timeEquivalent],
    ["area", getPath(materializedIntent, ["location", "value"]), asString(getPath(finalIntent, ["area", "query"]))?.replace(/^near\s+/i, ""), valuesEqual],
    ["criteria", materializedIntent.criteria, finalIntent.criteria, criteriaEquivalent],
  ];
  const missingConditionFields = conditionPairs.filter(([, expected, actual, equal]) => expected === undefined || actual === undefined || !equal(expected, actual)).map(([field]) => field);
  const conditionsStatus: DiagnosticEvaluationStatus = missingConditionFields.length === 0 ? "SATISFIED" : "NOT_SATISFIED";

  const presentedIds = asArray(presented?.candidateIds).flatMap(asString);
  const offers = presentedIds.flatMap((candidateId) => asArray(availability[candidateId ?? ""]).map(asRecord).filter((item): item is JsonRecord => Boolean(item)));
  const evidenceForPresented = presentedIds.flatMap((candidateId) => evidence.filter((item) => item.candidateId === candidateId));
  const identityEvidence = evidenceForPresented.some((item) => item.kind === "ENTITY_IDENTITY" || item.kind === "ENTITY_MATCH");
  const availabilityEvidence = evidenceForPresented.some((item) => item.kind === "AVAILABILITY");
  const hardEvidence = evidenceForPresented.some((item) => item.kind === "HARD_CRITERIA" || item.kind === "RESTAURANT_FACT");
  const hasQualifiedResult = finalPhase === "PRESENT_RESULTS" && loopStatus === "TERMINAL" && offers.length > 0 && availabilityEvidence;

  const queriedCandidates = actionCandidates(trajectories);
  const duplicateIds = [...new Set(queriedCandidates.filter((candidateId, index) => queriedCandidates.indexOf(candidateId) !== index))];
  const checkCount = Object.keys(checks).length;
  const resourceUsage = asRecord(root.resourceUsage);
  const candidateSummaries: CandidateDiagnosticSummary[] = candidates.map((candidate) => {
    const restaurant = asRecord(candidate.restaurant) ?? {};
    const candidateId = asString(restaurant.id) ?? "UNKNOWN_CANDIDATE";
    const check = asRecord(checks[candidateId]);
    const candidateEvidence = evidence.filter((item) => item.candidateId === candidateId);
    const candidateOffers = asArray(availability[candidateId]);
    const reasonCode = asString(check?.reasonCode);
    return {
      candidateId,
      outletName: asString(restaurant.outletName) ?? "Unknown outlet",
      providers: providerAttempts(diagnostics, candidateId),
      result: candidateResult(check, candidateOffers.length),
      ...(reasonCode ? { reasonCode } : {}),
      evidenceRefs: candidateEvidence.flatMap((item) => asString(item.evidenceId) ? [asString(item.evidenceId)!] : []),
    };
  });

  const findings: DiagnosticFinding[] = [
    evaluationFinding({
      dimension: "AUTHORITATIVE_CONDITIONS", status: conditionsStatus, stage: "SEMANTIC_TO_FINAL_STATE",
      requirement: "Materialized date, party size, time, area, and HARD criteria must be preserved through the final authoritative intent.",
      observations: missingConditionFields.length === 0 ? ["All independently readable authoritative fields match."] : [`Mismatch or missing fields: ${missingConditionFields.join(", ")}.`],
      directCause: missingConditionFields.length === 0 ? "None observed." : "Final state does not preserve all materialized conditions.",
      rootCauseHypothesis: missingConditionFields.length === 0 ? "Not applicable." : "Requires semantic/compiler/runtime trace review.",
      certainty: missingConditionFields.length === 0 ? "CONFIRMED" : "CONFIRMED",
      evidenceRefs: ["materializedCase.semantic", "finalSnapshot.domainState.intentDraft"],
      downstreamImpact: missingConditionFields.length === 0 ? "Tool and result checks can be evaluated against one request." : "Any final availability claim is unsafe to accept.",
    }),
    evaluationFinding({
      dimension: "REQUIRED_EVIDENCE", status: hasQualifiedResult && identityEvidence && hardEvidence ? "SATISFIED" : hasQualifiedResult ? "NOT_SATISFIED" : "NOT_EVALUATED", stage: "GROUNDING",
      requirement: "A presented restaurant needs same-outlet identity, HARD-condition, and fresh availability evidence.",
      observations: [`presented=${presentedIds.length}`, `offers=${offers.length}`, `identity=${identityEvidence}`, `hard=${hardEvidence}`, `availability=${availabilityEvidence}`],
      directCause: hasQualifiedResult && identityEvidence && hardEvidence ? "Required evidence categories are present for the presented candidate." : hasQualifiedResult ? "One or more required evidence categories are absent." : "No eligible presented result is available for this check.",
      rootCauseHypothesis: hasQualifiedResult ? "Artifact evidence linking is incomplete or grounding accepted an insufficient result." : "Execution did not provide a result to evaluate.",
      certainty: hasQualifiedResult && identityEvidence && hardEvidence ? "CONFIRMED" : hasQualifiedResult ? "CONFIRMED" : "UNKNOWN",
      evidenceRefs: ["finalSnapshot.domainState.readEvidence", "finalSnapshot.domainState.availability", "finalSnapshot.domainState.presentedResults"],
      downstreamImpact: hasQualifiedResult && identityEvidence && hardEvidence ? "The presented read-only result is evidence-grounded." : "Do not treat the presentation as a qualified result.",
    }),
    evaluationFinding({
      dimension: "INVESTIGATION_BEHAVIOR", status: duplicateIds.length === 0 && checkCount <= candidates.length ? "SATISFIED" : "NOT_SATISFIED", stage: "AGENT_LOOP",
      requirement: "The Agent must not duplicate availability reads and may continue through the discovered candidate pool.",
      observations: [`discovered=${candidates.length}`, `checked=${checkCount}`, `actionCandidates=${queriedCandidates.length}`, `duplicates=${duplicateIds.join(",") || "none"}`],
      directCause: duplicateIds.length === 0 && checkCount <= candidates.length ? "No duplicate CHECK_AVAILABILITY action is recorded." : "Duplicate candidate investigation or inconsistent check accounting is recorded.",
      rootCauseHypothesis: duplicateIds.length === 0 && checkCount <= candidates.length ? "Not applicable." : "Agent context, validator, or state invalidation needs review.",
      certainty: "CONFIRMED",
      evidenceRefs: ["trajectories", "finalSnapshot.domainState.availabilityChecks", "finalSnapshot.domainState.candidates"],
      downstreamImpact: duplicateIds.length === 0 && checkCount <= candidates.length ? "Candidate-level failures remain attributable." : "Budget and coverage claims are unreliable.",
    }),
    evaluationFinding({
      dimension: "FINAL_CLAIM", status: hasQualifiedResult ? "SATISFIED" : finalPhase === "PRESENT_RESULTS" ? "NOT_SATISFIED" : "NOT_EVALUATED", stage: "PRESENT_RESULTS",
      requirement: "Final presentation must agree with executed offers and evidence; absence of a final presentation is not scored as a quality pass.",
      observations: [`phase=${finalPhase ?? "missing"}`, `loop=${loopStatus ?? "missing"}`, `offers=${offers.length}`, `availabilityEvidence=${availabilityEvidence}`],
      directCause: hasQualifiedResult ? "Terminal state and independently readable offer/evidence agree." : finalPhase === "PRESENT_RESULTS" ? "Terminal presentation lacks an independently readable grounded offer." : "No final presentation was executed.",
      rootCauseHypothesis: hasQualifiedResult ? "Not applicable." : finalPhase === "PRESENT_RESULTS" ? "Verifier/serialization mismatch requires review." : "Execution stopped before a presentation could be assessed.",
      certainty: hasQualifiedResult || finalPhase === "PRESENT_RESULTS" ? "CONFIRMED" : "UNKNOWN",
      evidenceRefs: ["loop", "finalSnapshot.domainState.phase", "finalSnapshot.domainState.availability", "finalSnapshot.domainState.readEvidence"],
      downstreamImpact: hasQualifiedResult ? "Execution produced a qualified read-only result." : "No qualified completion can be claimed from this artifact.",
    }),
    evaluationFinding({
      dimension: "RESOURCES", status: resourceUsage ? "SATISFIED" : "NOT_EVALUATED", stage: "RUN_ACCOUNTING",
      requirement: "Artifact must state elapsed time and available request/model/browser resource accounting without treating unknown cost as zero.",
      observations: resourceUsage ? [`elapsedMs=${String(resourceUsage.elapsedMs ?? "missing")}`, `agentDecisions=${String(resourceUsage.agentDecisions ?? "missing")}`, `browserModelCalls=${String(resourceUsage.browserModelCalls ?? "missing")}`] : ["Legacy artifact has no resourceUsage record."],
      directCause: resourceUsage ? "Resource accounting is present." : "Artifact predates resource accounting fields.",
      rootCauseHypothesis: resourceUsage ? "Not applicable." : "Historical artifact schema lacks this diagnostic data.",
      certainty: resourceUsage ? "CONFIRMED" : "CONFIRMED",
      evidenceRefs: resourceUsage ? ["resourceUsage", "limits", "modelInvocations"] : ["artifact schema"],
      downstreamImpact: resourceUsage ? "Time/resource limits can be reviewed; unavailable cost remains unknown." : "Do not infer resource compliance from this artifact.",
    }),
  ];

  return {
    schemaVersion: "1",
    evaluatorVersion: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION,
    rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION,
    rubricStatus: "DRAFT_DIAGNOSTIC_ONLY",
    sourceArtifact: { path: sourceArtifact.path, sha256: sourceArtifact.sha256, ...(asString(root.runId) ? { runId: asString(root.runId)! } : {}), ...(asString(root.caseId) ? { caseId: asString(root.caseId)! } : {}) },
    execution: {
      status: asString(root.status) ?? null,
      stage: asString(root.stage) ?? null,
      taskProducedQualifiedResult: hasQualifiedResult ? "YES" : finalPhase ? "NO" : "UNKNOWN",
      systemBehavior: findings.every((finding) => finding.status !== "NOT_SATISFIED") ? "SUPPORTED_BY_EVIDENCE" : "NOT_SUPPORTED",
      externalConditions: candidates.length > 0 ? "OBSERVED" : "NOT_EVALUATED",
      evidenceSufficiency: hasQualifiedResult && identityEvidence && hardEvidence ? "SUFFICIENT_FOR_PRESENTED_RESULT" : finalPhase ? "INSUFFICIENT" : "NOT_EVALUATED",
    },
    candidateSummaries,
    findings,
    unassessedDimensions: [
      "No subjective ranking, provider reliability, long-term inventory freshness, or model-quality score is produced.",
      "Cost is not inferred when the artifact lacks explicit configured price inputs.",
    ],
  };
}

export async function evaluateArtifactFile(inputPath: string): Promise<{ evaluation: RestaurantHybridDiagnosticEvaluation; outputPath: string }> {
  const artifactPath = resolve(inputPath);
  const source = await readFile(artifactPath, "utf8");
  const evaluation = evaluateRestaurantHybridLiveArtifact(JSON.parse(source), { path: artifactPath, sha256: sha256(source) });
  const suffix = `.${RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION.split("@")[1]!.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}.json`;
  const outputPath = resolve(dirname(artifactPath), `${basename(artifactPath, ".json")}.evaluation${suffix}`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(evaluation, null, 2), { flag: "wx" });
  return { evaluation, outputPath };
}
