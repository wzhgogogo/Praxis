import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { openingHoursForRequest } from "../../../domains/restaurant/read-grounding.js";


export const RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION = "restaurant-hybrid-read-diagnostic-evaluator@19";
export const RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION = "restaurant-hybrid-read-diagnostic-rubric@19";

type JsonRecord = Record<string, unknown>;
export type DiagnosticEvaluationStatus = "SATISFIED" | "NOT_SATISFIED" | "NOT_EVALUATED";

export interface DiagnosticFinding {
  dimension: "AUTHORITATIVE_CONDITIONS" | "REQUIRED_EVIDENCE" | "INVESTIGATION_BEHAVIOR" | "FINAL_CLAIM" | "COMPLETION_OUTCOME" | "RESOURCES";
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

export interface ProviderAttemptDiagnostic {
  provider: string;
  outcome?: string;
  failureCode?: string;
  evidenceRef: string;
}

export interface CandidateDiagnosticSummary {
  candidateId: string;
  outletName: string;
  providers: string[];
  providerAttempts: ProviderAttemptDiagnostic[];
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
    completion: "PRESENTATION_RECORDED" | "NO_VERIFIED_RESULT" | "NEEDS_USER_INPUT" | "CANCELLED" | "BUDGET_OR_DEADLINE_STOP" | "INTERNAL_EXECUTION_FAILURE" | "NOT_EVALUATED";
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
function strings(value: unknown): string[] { return asArray(value).filter((item): item is string => typeof item === "string"); }
function asNumber(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined; }
function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function getPath(value: unknown, path: string[]): unknown {
  let cursor: unknown = value;
  for (const part of path) cursor = asRecord(cursor)?.[part];
  return cursor;
}
function normalized(value: string | undefined): string { return (value ?? "").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " "); }
function ref(path: string): string { return path; }
function parseTime(value: unknown): string | undefined {
  const raw = asString(value);
  return raw && /^\d{2}:\d{2}$/.test(raw) ? raw : undefined;
}
function parseDate(value: unknown): string | undefined {
  const raw = asString(value);
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(`${raw}T12:00:00Z`)) ? raw : undefined;
}
function timeFromDateTime(value: unknown): string | undefined { return asString(value)?.match(/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/)?.[1]; }
function dateFromDateTime(value: unknown): string | undefined { return asString(value)?.slice(0, 10); }
function validDuringPresentation(observedAt: unknown, expiresAt: unknown, presentedAt: unknown): "VALID" | "EXPIRED" | "MISSING" | "INVALID" | "FUTURE_OBSERVATION" {
  const observed = asString(observedAt); const expiry = asString(expiresAt); const presentation = asString(presentedAt);
  if (!observed || !expiry || !presentation) return "MISSING";
  const observedMs = Date.parse(observed); const expiryMs = Date.parse(expiry); const presentationMs = Date.parse(presentation);
  if (Number.isNaN(observedMs) || Number.isNaN(expiryMs) || Number.isNaN(presentationMs) || observedMs >= expiryMs) return "INVALID";
  if (observedMs > presentationMs) return "FUTURE_OBSERVATION";
  return expiryMs > presentationMs ? "VALID" : "EXPIRED";
}
function observedOnOrBeforePresentation(observedAt: unknown, presentedAt: unknown): "VALID" | "MISSING" | "INVALID" | "FUTURE_OBSERVATION" {
  const observed = asString(observedAt); const presentation = asString(presentedAt);
  if (!observed || !presentation) return "MISSING";
  const observedMs = Date.parse(observed); const presentationMs = Date.parse(presentation);
  if (Number.isNaN(observedMs) || Number.isNaN(presentationMs)) return "INVALID";
  return observedMs <= presentationMs ? "VALID" : "FUTURE_OBSERVATION";
}
function criterionSet(value: unknown): string[] {
  return asArray(value).map(asRecord).flatMap((criterion) => {
    if (!criterion) return [];
    const text = normalized(asString(criterion.text) ?? asString(criterion.value));
    const polarity = asString(criterion.polarity);
    const strength = asString(criterion.strength);
    return text && polarity && strength ? [`${text}|${polarity}|${strength}`] : [];
  }).sort();
}

interface RequestShape {
  caseId?: string;
  goal?: "RECOMMENDATION" | "AVAILABILITY";
  date?: string;
  partySize?: number;
  timeWindow?: { earliest: string; latest: string };
  permittedAlternativeTimeWindow?: { earliest: string; latest: string };
  location?: { value: string; relation?: string };
  criteria: string[];
  unsupportedHardCriteria: string[];
  missing: string[];
}
function partySize(value: unknown): number | undefined { return asNumber(value) ?? asNumber(asRecord(value)?.value); }
function alternativeWindow(value: unknown): RequestShape["permittedAlternativeTimeWindow"] {
  const record = asRecord(value); const earliest = parseTime(record?.earliest); const latest = parseTime(record?.latest);
  return earliest && latest && earliest <= latest ? { earliest, latest } : undefined;
}
function normalizedArea(value: string | undefined): string { return normalized(value?.replace(/^near\s+/i, "")); }
function goal(value: unknown): "RECOMMENDATION" | "AVAILABILITY" | undefined {
  const valueGoal = asString(asRecord(value)?.goal);
  return valueGoal === "RECOMMENDATION" || valueGoal === "AVAILABILITY" ? valueGoal : undefined;
}
function requestFromMaterialized(value: JsonRecord): RequestShape {
  const semantic = asRecord(value.semantic) ?? {}; const time = asRecord(semantic.time) ?? {}; const location = asRecord(semantic.location);
  const timeValue = parseTime(time.value); const start = parseTime(time.start); const end = parseTime(time.end);
  const criteria = criterionSet(semantic.criteria);
  const caseId = asString(value.id);
  const expectedGoal = goal(semantic.target);
  const date = parseDate(asRecord(semantic.date)?.value); const party = partySize(semantic.party_size); const locationValue = asString(location?.value); const relation = asString(location?.relation);
  const result: RequestShape = { ...(caseId ? { caseId } : {}), ...(expectedGoal ? { goal: expectedGoal } : {}), ...(date ? { date } : {}), ...(party !== undefined ? { partySize: party } : {}), ...(timeValue ? { timeWindow: { earliest: timeValue, latest: timeValue } } : start && end ? { timeWindow: { earliest: start, latest: end } } : {}), ...(locationValue ? { location: { value: locationValue, ...(relation ? { relation } : {}) } } : {}), criteria, unsupportedHardCriteria: [], missing: [] };
  if (!result.goal) result.missing.push("target.goal");
  const permitted = alternativeWindow(semantic.permittedAlternativeTimeWindow);
  if (permitted) result.permittedAlternativeTimeWindow = permitted;
  if (semantic.permittedAlternativeTimeWindow !== undefined && !result.permittedAlternativeTimeWindow) result.missing.push("permittedAlternativeTimeWindow");
  if (result.goal === "AVAILABILITY" && !result.date) result.missing.push("date");
  if (result.goal === "AVAILABILITY" && !result.timeWindow) result.missing.push("timeWindow");
  if (!result.location) result.missing.push("location");
  if (result.criteria.length !== asArray(semantic.criteria).length) result.missing.push("criteria");
  return result;
}
function requestFromFinalIntent(value: JsonRecord): RequestShape {
  const window = asRecord(value.timeWindow); const earliest = parseTime(window?.earliest); const latest = parseTime(window?.latest); const area = asRecord(value.area);
  const date = parseDate(value.date); const party = partySize(value.partySize); const areaQuery = asString(area?.query);
  const actualGoal = goal(value.target);
  const result: RequestShape = { ...(actualGoal ? { goal: actualGoal } : {}), ...(date ? { date } : {}), ...(party !== undefined ? { partySize: party } : {}), ...(earliest && latest ? { timeWindow: { earliest, latest } } : {}), ...(areaQuery ? { location: { value: areaQuery.replace(/^near\s+/i, ""), relation: "NEAR" } } : {}), criteria: criterionSet(value.criteria), unsupportedHardCriteria: [], missing: [] };
  if (!result.goal) result.missing.push("target.goal");
  const permitted = alternativeWindow(value.permittedAlternativeTimeWindow);
  if (permitted) result.permittedAlternativeTimeWindow = permitted;
  if (value.permittedAlternativeTimeWindow !== undefined && !result.permittedAlternativeTimeWindow) result.missing.push("permittedAlternativeTimeWindow");
  if (result.goal === "AVAILABILITY" && !result.date) result.missing.push("date");
  if (result.goal === "AVAILABILITY" && !result.timeWindow) result.missing.push("timeWindow");
  if (!result.location) result.missing.push("location");
  if (result.criteria.length !== asArray(value.criteria).length) result.missing.push("criteria");
  return result;
}
/** Exact deterministic fields shared by semantic fidelity and read applicability. */
function coreConditionMismatches(expected: RequestShape, actual: RequestShape): string[] {
  const mismatches = [...expected.missing, ...actual.missing];
  if (expected.goal && actual.goal && expected.goal !== actual.goal) mismatches.push("target.goal");
  if (expected.date && (!actual.date || expected.date !== actual.date)) mismatches.push("date");
  if (expected.partySize !== undefined && actual.partySize !== undefined && expected.partySize !== actual.partySize) mismatches.push("partySize");
  if (expected.partySize !== undefined && actual.partySize === undefined) mismatches.push("partySize");
  // A closed party can be inferred for a fact recommendation (for example,
  // speaker plus one named friend). It is not an extra user requirement and
  // must not make an otherwise faithful recommendation fail. Availability
  // still requires its independently materialized party size.
  if (expected.partySize === undefined && actual.partySize !== undefined && expected.goal === "AVAILABILITY") mismatches.push("partySize:not-applicable");
  if (expected.timeWindow && (!actual.timeWindow || expected.timeWindow.earliest !== actual.timeWindow.earliest || expected.timeWindow.latest !== actual.timeWindow.latest)) mismatches.push("timeWindow");
  if (JSON.stringify(expected.permittedAlternativeTimeWindow) !== JSON.stringify(actual.permittedAlternativeTimeWindow)) mismatches.push("permittedAlternativeTimeWindow");
  if (expected.location && !actual.location) mismatches.push("location");
  if (expected.location && actual.location) {
    const relationCompatible = expected.location.relation === "NEAR_USER" ? Boolean(normalized(actual.location.value)) : normalizedArea(expected.location.value) === normalizedArea(actual.location.value);
    if (!relationCompatible) mismatches.push("location");
  }
  return [...new Set(mismatches)];
}
function hardCriteria(value: RequestShape): string[] {
  return value.criteria.filter((criterion) => criterion.endsWith("|HARD"));
}
/**
 * Evidence must be tied to the request that was actually authoritative when a
 * read ran.  This stays exact: a later HARD criterion, polarity, or text cannot
 * make an older observation applicable by a semantic guess.
 */
function observationRequestMismatches(authoritative: RequestShape, observed: RequestShape): string[] {
  const mismatches = coreConditionMismatches(authoritative, observed);
  if (hardCriteria(authoritative).join("\n") !== hardCriteria(observed).join("\n")) mismatches.push("criteria");
  return [...new Set(mismatches)];
}
type CriteriaComparison = { conflicts: string[]; unresolved: string[] };
function criterionParts(value: string): { text: string; polarity: string; strength: string } {
  const [text = "", polarity = "", strength = ""] = value.split("|");
  return { text, polarity, strength };
}
function criterionIdentity(criterion: { text: string; polarity: string }): string {
  // Text alone is not an identity: the same wording can occur as both an
  // inclusion and an exclusion.  The NUL separator cannot occur in a parsed
  // criterion text and keeps the key unambiguous without a fuzzy rewrite.
  return `${criterion.text}\u0000${criterion.polarity}`;
}
function groupCriteriaByIdentity(criteria: Array<{ text: string; polarity: string; strength: string }>) {
  const grouped = new Map<string, Array<{ text: string; polarity: string; strength: string }>>();
  for (const criterion of criteria) {
    const identity = criterionIdentity(criterion);
    const existing = grouped.get(identity);
    if (existing) existing.push(criterion);
    else grouped.set(identity, [criterion]);
  }
  return grouped;
}
function unmatchedStrengths(
  expected: Array<{ strength: string }>,
  actual: Array<{ strength: string }>,
): { expected: string[]; actual: string[] } {
  const remainingActual = actual.map((criterion) => criterion.strength);
  const remainingExpected: string[] = [];
  for (const criterion of expected) {
    const index = remainingActual.indexOf(criterion.strength);
    if (index === -1) remainingExpected.push(criterion.strength);
    else remainingActual.splice(index, 1);
  }
  return { expected: remainingExpected, actual: remainingActual };
}
/**
 * Do not use fuzzy wording equivalence in a deterministic evaluator. Exact
 * text lets us reject polarity/HARD-strength conflicts; different text is kept
 * visible for independent semantic review instead of becoming an auto-pass.
 */
function compareCriteria(expected: RequestShape, actual: RequestShape): CriteriaComparison {
  const conflicts: string[] = [];
  const unresolved: string[] = [];
  const expectedParts = expected.criteria.map(criterionParts);
  const actualParts = actual.criteria.map(criterionParts);
  const expectedByIdentity = groupCriteriaByIdentity(expectedParts);
  const actualByIdentity = groupCriteriaByIdentity(actualParts);
  const expectedOnly = expectedParts.filter((criterion) => !actualByIdentity.has(criterionIdentity(criterion)));
  const actualOnly = actualParts.filter((criterion) => !expectedByIdentity.has(criterionIdentity(criterion)));
  const expectedTexts = new Set(expectedParts.map((criterion) => criterion.text));
  const actualTexts = new Set(actualParts.map((criterion) => criterion.text));
  // Same text plus a changed polarity is a deterministic contradiction. Do
  // this before deciding whether unrelated wording is merely unassessed.
  for (const text of expectedTexts) {
    if (!actualTexts.has(text)) continue;
    const expectedPolarities = new Set(expectedParts.filter((criterion) => criterion.text === text).map((criterion) => criterion.polarity));
    const actualPolarities = new Set(actualParts.filter((criterion) => criterion.text === text).map((criterion) => criterion.polarity));
    if ([...expectedPolarities].some((polarity) => !actualPolarities.has(polarity)) || [...actualPolarities].some((polarity) => !expectedPolarities.has(polarity))) {
      conflicts.push(`criteria polarity=${text}`);
    }
  }
  if (expectedOnly.length && actualOnly.length) {
    const differentText = expectedOnly.some((criterion) => !actualTexts.has(criterion.text)) && actualOnly.some((criterion) => !expectedTexts.has(criterion.text));
    if (differentText) unresolved.push(`criteria.text expected=[${expectedOnly.map((criterion) => criterion.text).join(", ")}] actual=[${actualOnly.map((criterion) => criterion.text).join(", ")}]`);
  } else {
    conflicts.push(...expectedOnly.map((criterion) => `criteria missing=${criterion.text}`));
    conflicts.push(...actualOnly.map((criterion) => `criteria extra=${criterion.text}`));
  }
  for (const [identity, expectedGroup] of expectedByIdentity) {
    const actualGroup = actualByIdentity.get(identity);
    if (!actualGroup) continue;
    if (expectedGroup.length !== actualGroup.length) {
      conflicts.push(`criteria multiplicity=${expectedGroup[0]!.text}|${expectedGroup[0]!.polarity}`);
      continue;
    }
    const differences = unmatchedStrengths(expectedGroup, actualGroup);
    if (differences.expected.length || differences.actual.length) {
      const text = expectedGroup[0]!.text;
      if ([...differences.expected, ...differences.actual].includes("HARD")) {
        conflicts.push(`criteria HARD strength=${text}`);
      } else {
        unresolved.push(`criteria nonblocking strength=${text}`);
      }
    }
  }
  return { conflicts: [...new Set(conflicts)], unresolved: [...new Set(unresolved)] };
}
function requestForGrounding(expected: RequestShape, actual: RequestShape | undefined): RequestShape {
  if (!actual) return expected;
  // Runtime resolves NEAR_USER to a concrete area query and does not persist the
  // relative relation itself. Preserve that materialized evaluation-location
  // contract while anchoring all criteria and executable parameters to state.
  if (expected.location?.relation === "NEAR_USER" && actual.location) {
    return { ...actual, location: { ...actual.location, relation: "NEAR_USER" } };
  }
  return actual;
}
function candidateResult(check: JsonRecord | undefined, offerCount: number): string {
  if (offerCount > 0) return "OFFER_GROUNDED";
  const status = asString(check?.status); const reason = asString(check?.reasonCode);
  if (status === "UNAVAILABLE" && !reason) return "EXPLICIT_NO_MATCHING_SLOT";
  if (reason === "AVAILABILITY_SOURCES_EXHAUSTED") return "PROVIDER_ATTEMPTS_EXHAUSTED";
  if (reason?.includes("BUDGET") || reason === "BROWSER_TIMEOUT") return "BUDGET_OR_TIMEOUT";
  if (reason === "REQUEST_MISMATCH" || reason === "REQUEST_SELECTION_UNCONFIRMED") return "REQUEST_NOT_CONFIRMED";
  if (status === "UNKNOWN") return "EVIDENCE_INCOMPLETE";
  return status ?? "NOT_CHECKED";
}
function completionKind(input: { phase: string | undefined; loopStatus: string | undefined; failure: JsonRecord | undefined; executionStatus: string | undefined; executionFailureCode: string | undefined }): RestaurantHybridDiagnosticEvaluation["execution"]["completion"] {
  // The runner records an interruption outside the domain snapshot when the
  // coordinator never returns. Read that immutable execution record first;
  // do not relabel it as a no-result merely because no offer was produced.
  const failureCode = input.executionFailureCode ?? asString(input.failure?.code) ?? "";
  if (failureCode === "CANCELLED" && input.executionStatus === "CANCELLED") return "CANCELLED";
  if (/^(MODEL_CALL_BUDGET_EXHAUSTED|RUN_BUDGET_EXHAUSTED|RUN_DEADLINE_EXCEEDED|DEADLINE_EXCEEDED)$/.test(failureCode) && input.executionStatus === "FAILED") {
    return "BUDGET_OR_DEADLINE_STOP";
  }
  if (input.executionStatus === "EXECUTION_FAILURE" || /^(SEMANTIC_INTERPRETATION_FAILED|AGENT_DECISION_FAILED|AGENT_EXECUTION_FAILED|AGENT_LOOP_EXECUTION_FAILURE)$/.test(failureCode)) {
    return "INTERNAL_EXECUTION_FAILURE";
  }
  if (input.phase === "PRESENT_RESULTS") return "PRESENTATION_RECORDED";
  if (input.phase === "NO_VERIFIED_RESULT") return "NO_VERIFIED_RESULT";
  if (input.phase === "NEEDS_INPUT") return "NEEDS_USER_INPUT";
  return "NOT_EVALUATED";
}
function providerAttemptsFromTrajectories(trajectories: unknown[], candidateId: string): ProviderAttemptDiagnostic[] {
  return trajectories.flatMap((step, stepIndex) => {
    const metadata = asRecord(asRecord(step)?.executionMetadata);
    return asArray(metadata?.providerAttempts).flatMap((item, attemptIndex) => {
      const attempt = asRecord(item); if (attempt?.candidateId !== candidateId) return [];
      const provider = asString(attempt.provider) ?? "UNKNOWN_PROVIDER";
      const outcome = asString(attempt.outcome); const failureCode = asString(attempt.failureCode);
      return [{ provider, ...(outcome ? { outcome } : {}), ...(failureCode ? { failureCode } : {}), evidenceRef: ref(`trajectories[${stepIndex}].executionMetadata.providerAttempts[${attemptIndex}]`) }];
    });
  });
}
function executedInvestigationVisits(trajectories: unknown[]): { candidateId: string; requestVersion: string; actionType: "CHECK_AVAILABILITY" | "INVESTIGATE_CANDIDATE_FACTS"; recheckReason?: string; ref: string }[] | undefined {
  if (!Array.isArray(trajectories)) return undefined;
  const visits: { candidateId: string; requestVersion: string; actionType: "CHECK_AVAILABILITY" | "INVESTIGATE_CANDIDATE_FACTS"; recheckReason?: string; ref: string }[] = [];
  trajectories.forEach((step, index) => {
    const record = asRecord(step);
    // A proposal, rejected action, or a completion label is not an external
    // observation.  Retain only Router records that actually executed a
    // bounded read; otherwise call counts and model narration could certify
    // investigation that never happened.
    if (record?.stepOutcome !== "EXECUTED") return;
    const action = asRecord(record.agentAction) ?? asRecord(record.action);
    const actionType = asString(action?.type);
    if (actionType !== "CHECK_AVAILABILITY" && actionType !== "INVESTIGATE_CANDIDATE_FACTS") return;
    const metadata = asRecord(asRecord(step)?.executionMetadata); if (!metadata) return;
    const context = asRecord(asRecord(step)?.decisionContext)?.intent ?? asRecord(asRecord(step)?.decisionContext)?.intentDraft;
    // State hashes advance after unrelated candidate/presentation changes; only an
    // authoritative request change makes the same candidate a distinct read.
    const version = context ? JSON.stringify(context) : asString(asRecord(step)?.stateHashBefore) ?? "REQUEST_VERSION_UNRECORDED";
    const recordedReason = asString(metadata.recheckReason);
    const recheckReason = recordedReason === "USER_REQUESTED_REFRESH" || recordedReason === "DISPLAY_EVIDENCE_EXPIRED"
      ? recordedReason
      : undefined;
    strings(action?.candidateIds).forEach((candidateId) => visits.push({ candidateId, requestVersion: version, actionType, ...(recheckReason ? { recheckReason } : {}), ref: ref(`trajectories[${index}]`) }));
  });
  return visits;
}
interface ExecutedObservation {
  candidateIds: string[];
  evidenceIds: string[];
  applicableRequest: boolean;
  actionType: string | undefined;
  factSources: Array<{ candidateId: string; source: string }>;
  refresh: boolean;
  ref: string;
}

/**
 * A presentation may be supported by search, fact, or availability reads.  Do
 * not prescribe an action order here: instead require its cited evidence to be
 * emitted by an actually executed observation for the same candidate and the
 * final applicable request.
 */
function executedObservations(trajectories: unknown[], request: RequestShape): ExecutedObservation[] | undefined {
  if (!Array.isArray(trajectories)) return undefined;
  return trajectories.flatMap((step, index) => {
    const record = asRecord(step);
    const observation = asRecord(record?.observation);
    const failedFactRead = record?.stepOutcome === "EXECUTION_FAILURE"
      && asRecord(record.agentAction)?.type === "INVESTIGATE_CANDIDATE_FACTS"
      && observation?.type === "CANDIDATE_FACTS_UNKNOWN"
      && asRecord(record.actionValidation)?.status === "ALLOWED"
      && asString(asRecord(record.executionMetadata)?.failureCode) !== undefined;
    // A routed action that completes the read changes the coordinator result
    // to TERMINAL after the Router event is durably accepted.  It remains an
    // executed observation, not an unexecuted proposal.
    if (record?.stepOutcome !== "EXECUTED" && record?.stepOutcome !== "TERMINAL" && !failedFactRead) return [];
    const context = asRecord(record.decisionContext);
    const intent = asRecord(context?.intentDraft) ?? asRecord(context?.intent);
    if (!observation || !intent) return [];
    const observedRequest = requestFromFinalIntent(intent);
    // SOFT wording is reviewed separately under AUTHORITATIVE_CONDITIONS.
    // It cannot invalidate source facts for otherwise matching request bounds.
    const applicableRequest = !observedRequest.missing.length
      && !observationRequestMismatches(request, observedRequest).length;
    return [{
      candidateIds: strings(observation.candidateIds),
      evidenceIds: failedFactRead ? [] : strings(observation.evidenceIds),
      applicableRequest,
      actionType: asString(asRecord(record.agentAction)?.type),
      factSources: asArray(observation.factSourceAttempts).flatMap(value => {
        const attempt = asRecord(value);
        const candidateId = asString(attempt?.candidateId); const source = asString(attempt?.source);
        return candidateId && source ? [{ candidateId, source }] : [];
      }),
      refresh: asRecord(record.executionMetadata)?.recheckReason === "USER_REQUESTED_REFRESH",
      ref: ref(`trajectories[${index}].observation`),
    }];
  });
}
function assessPresentedCandidate(candidateId: string, domain: JsonRecord, request: RequestShape, presentedEvidenceIds: Set<string>, presentedAt: unknown, observationsByCandidate: Set<string> | undefined, executedReads?: ExecutedObservation[]): { status: DiagnosticEvaluationStatus; observations: string[]; refs: string[] } {
  const checks = asRecord(domain.availabilityChecks) ?? {}; const availability = asRecord(domain.availability) ?? {};
  const allEvidence = asArray(domain.readEvidence).map(asRecord).filter((item): item is JsonRecord => Boolean(item)); const check = asRecord(checks[candidateId]);
  const offers = asArray(availability[candidateId]).map(asRecord).filter((item): item is JsonRecord => Boolean(item));
  const listedEvidence = allEvidence.filter((item) => item.candidateId === candidateId && presentedEvidenceIds.has(asString(item.evidenceId) ?? ""));
  const requiredRefs = strings(check?.evidenceIds); const observations: string[] = []; const refs: string[] = []; const missing: string[] = []; const conflicts: string[] = [];
  const factOnly = request.goal === "RECOMMENDATION";
  if (!factOnly) {
    if (!check) missing.push("availability check"); else if (check.status !== "AVAILABLE") conflicts.push(`availability check status=${String(check.status)}`);
    if (offers.length === 0) missing.push("offer"); if (requiredRefs.length === 0) missing.push("check evidenceIds");
    for (const evidenceId of requiredRefs) if (!presentedEvidenceIds.has(evidenceId)) conflicts.push(`check evidence ${evidenceId} was not cited by presentation`);
  }
  if (presentedEvidenceIds.size === 0) missing.push("presented evidenceIds");
  if (listedEvidence.length === 0) missing.push("candidate-scoped cited evidence");
  if (!observationsByCandidate) {
    missing.push("executed observation lineage");
  } else {
    for (const evidenceId of listedEvidence.map((item) => asString(item.evidenceId)).filter((id): id is string => Boolean(id))) {
      if (!observationsByCandidate.has(evidenceId)) conflicts.push(`cited evidence ${evidenceId} lacks an executed same-candidate applicable-request observation`);
    }
  }
  const byKind = (kind: string) => listedEvidence.filter((item) => item.kind === kind); const entity = byKind("ENTITY_MATCH"); const facts = byKind("RESTAURANT_FACT"); const availabilityEvidence = byKind("AVAILABILITY"); const discovery = byKind("DISCOVERY");
  // Reconstruct source replacement from actual ordered reads, independently
  // of the production State's eligibility or superseded-reference projection.
  const candidateReads = executedReads?.filter(read => read.applicableRequest && read.candidateIds.includes(candidateId)) ?? [];
  for (const fact of facts.filter(item => item.provider !== "MODEL_JUDGMENT")) {
    const id = asString(fact.evidenceId) ?? "";
    const origin = candidateReads.findIndex(read => read.evidenceIds.includes(id));
    if (origin < 0) continue; // Missing lineage is diagnosed above.
    const laterReads = candidateReads.slice(origin + 1).filter(read => read.actionType === "INVESTIGATE_CANDIDATE_FACTS" && !read.evidenceIds.includes(id));
    if (laterReads.some(read => (read.refresh && candidateReads[origin]?.actionType === "INVESTIGATE_CANDIDATE_FACTS")
      || read.factSources.some(source => source.candidateId === candidateId && source.source === fact.provider))) {
      conflicts.push(`cited fact ${id} was superseded by a later same-source fact read`);
    } else if (laterReads.some(read => read.refresh && !read.factSources.length)) {
      // Old artifacts may lack failed-source scope. They cannot certify that
      // a previous fact remained current after an explicit refresh.
      missing.push(`refresh source scope for cited fact ${id}`);
    }
  }
  if (entity.length === 0) missing.push("HIGH entity evidence"); if (entity.some((item) => asRecord(item.entityMatch)?.confidence !== "HIGH")) conflicts.push("entity confidence is not HIGH");
  const identities = entity.filter((item) => asRecord(item.entityMatch)?.confidence === "HIGH");
  if (identities.some((item) => !asString(item.provider) || !asString(item.sourceEntityId))) missing.push("entity source association");
  for (const item of [...facts.filter((fact) => fact.provider !== "MODEL_JUDGMENT"), ...availabilityEvidence]) {
    const associated = identities.some((identity) => item.provider === identity.provider && item.sourceEntityId === identity.sourceEntityId);
    if (!associated) conflicts.push(`grounding evidence ${asString(item.evidenceId) ?? "unknown"} is not associated with an identity source`);
  }
  for (const item of facts.filter((fact) => fact.provider === "MODEL_JUDGMENT")) {
    const citations = strings(asRecord(item.claims)?.supportingEvidenceIds);
    const citedSources = citations.map((id) => listedEvidence.find((evidence) => evidence.evidenceId === id));
    if (!citations.length || citedSources.some((source) => !source || source.candidateId !== candidateId || source.kind !== "RESTAURANT_FACT" || source.provider === "MODEL_JUDGMENT")) {
      conflicts.push(`derived fact ${asString(item.evidenceId) ?? "unknown"} lacks a candidate-bound raw support chain`);
      continue;
    }
    for (const source of citedSources) {
      const associated = identities.some((identity) => source!.provider === identity.provider && source!.sourceEntityId === identity.sourceEntityId);
      if (!associated) conflicts.push(`derived fact ${asString(item.evidenceId) ?? "unknown"} cites an ungrounded source`);
    }
  }
  if (discovery.length === 0) missing.push("area discovery evidence"); else if (!discovery.some((item) => {
    const claims = asRecord(item.claims) ?? {};
    if (claims.areaMatch !== true) return false;
    if (request.location?.relation === "NEAR_USER") return claims.areaMatchBasis === "TASK_LOCATION_RADIUS" || claims.areaMatchBasis === "EVALUATION_LOCATION_RADIUS";
    return normalizedArea(asString(claims.areaQuery)) === normalizedArea(request.location?.value);
  })) conflicts.push("cited discovery evidence does not establish the requested area");
  const positiveHard = request.criteria.filter((criterion) => criterion.endsWith("|POSITIVE|HARD")).map((criterion) => criterion.split("|")[0]!);
  for (const hardCriterion of positiveHard) if (!facts.some((item) => strings(asRecord(item.claims)?.verifiedHardCriteria).some((value) => normalized(value) === hardCriterion))) missing.push(`HARD criterion ${hardCriterion}`);
  const negativeHard = request.criteria.filter((criterion) => criterion.endsWith("|NEGATIVE|HARD")).map((criterion) => criterion.split("|")[0]!);
  for (const hardCriterion of negativeHard) {
    if (facts.some((item) => strings(asRecord(item.claims)?.violatedNegativeCriteria).some((value) => normalized(value) === hardCriterion))) {
      conflicts.push(`negative HARD criterion ${hardCriterion} is violated by cited source fact`);
    } else if (!facts.some((item) => strings(asRecord(item.claims)?.verifiedNegativeCriteria).some((value) => normalized(value) === hardCriterion))) {
      const categoryUnknown = facts.some((item) => item.provider === "MODEL_JUDGMENT"
        && strings(asRecord(item.claims)?.supportingEvidenceIds).length > 0
        && strings(asRecord(item.claims)?.supportingEvidenceIds).every((id) => facts.some((source) => source.provider !== "MODEL_JUDGMENT" && source.evidenceId === id && strings(asRecord(source.claims)?.restaurantTypeFacts).some((value) => value.trim().length > 0)))
        && strings(asRecord(item.claims)?.categoryUnknownNegativeCriteria).some((value) => normalized(value) === hardCriterion));
      if (!categoryUnknown) missing.push(`negative HARD criterion ${hardCriterion}`);
    }
  }
  if (factOnly) {
    const applicableHours = request.date && request.timeWindow ? facts.filter((item) => {
      const claims = asRecord(item.claims) ?? {};
      if (claims.openingHoursMatch !== true) return false;
      const sourceHours = strings(claims.regularOpeningHours);
      if (!sourceHours.length) { missing.push("raw opening-hours source fact"); return false; }
      const independentlyApplicable = openingHoursForRequest(sourceHours, request.date, request.timeWindow);
      if (independentlyApplicable?.matches !== true) { conflicts.push("opening-hours conclusion conflicts with cited source hours"); return false; }
      return true;
    }) : [];
    if (request.date && request.timeWindow && applicableHours.length === 0 && !conflicts.length) missing.push("applicable opening-hours fact");
    for (const item of applicableHours) {
      const observation = observedOnOrBeforePresentation(item.observedAt, presentedAt);
      if (observation === "MISSING") missing.push("opening-hours observation time");
      if (observation === "INVALID") conflicts.push("opening-hours observation time is invalid");
      if (observation === "FUTURE_OBSERVATION") conflicts.push("opening-hours fact was observed after presentation");
    }
  } else {
    const allowedWindow = request.permittedAlternativeTimeWindow ?? request.timeWindow;
    if (availabilityEvidence.length === 0) missing.push("availability evidence");
    for (const item of availabilityEvidence) {
      const claims = asRecord(item.claims) ?? {}; if (claims.date !== request.date) conflicts.push("availability evidence date conflicts with request"); if (claims.partySize !== request.partySize) conflicts.push("availability evidence party size conflicts with request");
      const visibleSlots = asArray(claims.visibleSlots).map(parseTime).filter((slot): slot is string => Boolean(slot)); if (allowedWindow && !visibleSlots.some((slot) => slot >= allowedWindow.earliest && slot <= allowedWindow.latest)) conflicts.push("availability evidence has no slot in requested time window");
      const freshness = validDuringPresentation(item.observedAt, item.displayExpiresAt ?? item.expiresAt, presentedAt); if (freshness === "MISSING") missing.push("availability evidence observation/display freshness"); if (freshness === "INVALID") conflicts.push("availability evidence display-freshness ordering is invalid"); if (freshness === "FUTURE_OBSERVATION") conflicts.push("availability evidence was observed after presentation"); if (freshness === "EXPIRED") conflicts.push("availability evidence was expired when presented");
    }
    for (const offer of offers) {
      if (offer.restaurantId !== candidateId) conflicts.push("offer restaurant does not match presented candidate"); if (dateFromDateTime(offer.dateTime) !== request.date) conflicts.push("offer date conflicts with request"); if (offer.partySize !== request.partySize) conflicts.push("offer party size conflicts with request");
      const time = timeFromDateTime(offer.dateTime); if (!time || (allowedWindow && (time < allowedWindow.earliest || time > allowedWindow.latest))) conflicts.push("offer time conflicts with requested time window");
      const isAlternative = time && request.timeWindow && (time < request.timeWindow.earliest || time > request.timeWindow.latest);
      if (isAlternative && offer.alternativeToRequestedTime !== true) conflicts.push("alternative offer is not labelled as an alternative");
      if (!isAlternative && offer.alternativeToRequestedTime === true) conflicts.push("requested-time offer is incorrectly labelled as an alternative");
      const matchingAvailabilityEvidence = availabilityEvidence.filter((item) => item.provider === offer.source && identities.some((identity) => identity.provider === item.provider && identity.sourceEntityId === item.sourceEntityId));
      if (availabilityEvidence.length > 0 && matchingAvailabilityEvidence.length === 0) conflicts.push("offer source is not represented by cited availability evidence");
      if (time && matchingAvailabilityEvidence.length > 0 && !matchingAvailabilityEvidence.some((item) => strings(asRecord(item.claims)?.visibleSlots).includes(time))) conflicts.push("offer time is not present in its cited availability evidence");
      const freshness = validDuringPresentation(offer.checkedAt, offer.displayExpiresAt ?? offer.expiresAt, presentedAt); if (freshness === "MISSING") missing.push("offer observation/display freshness"); if (freshness === "INVALID") conflicts.push("offer display-freshness ordering is invalid"); if (freshness === "FUTURE_OBSERVATION") conflicts.push("offer was checked after presentation"); if (freshness === "EXPIRED") conflicts.push("offer was expired when presented");
    }
  }
  observations.push(`candidate=${candidateId}`, `citedEvidence=${listedEvidence.length}`, `offers=${offers.length}`, ...missing.map((item) => `missing=${item}`), ...conflicts.map((item) => `conflict=${item}`));
  listedEvidence.forEach((item) => refs.push(ref(`finalSnapshot.domainState.readEvidence[evidenceId=${asString(item.evidenceId) ?? "missing"}]`))); offers.forEach((item) => refs.push(ref(`finalSnapshot.domainState.availability[${candidateId}][id=${asString(item.id) ?? "missing"}]`)));
  if (conflicts.length) return { status: "NOT_SATISFIED", observations, refs }; if (missing.length) return { status: "NOT_EVALUATED", observations, refs }; return { status: "SATISFIED", observations, refs };
}

/**
 * Evaluate a no-result claim from source records, never from the production
 * eligibility function or the model's remainingGaps prose. A bounded empty
 * discovery is verifiable. General investigation sufficiency is not yet
 * independently encoded by the artifact, so insufficient records stay unknown.
 */
function assessNoResult(root: JsonRecord, domain: JsonRecord, request: RequestShape): {
  status: DiagnosticEvaluationStatus; observations: string[]; refs: string[];
} {
  const record = asRecord(domain.noVerifiedResult);
  const endedAt = record?.endedAt ?? root.finishedAt;
  const evidence = asArray(domain.readEvidence).map(asRecord).filter((e): e is JsonRecord => Boolean(e));
  const candidates = asArray(domain.candidates).map(asRecord).filter((c): c is JsonRecord => Boolean(c));
  const ids = candidates.flatMap(c => asString(asRecord(c.restaurant)?.id) ? [asString(asRecord(c.restaurant)?.id)!] : []);
  const factChecks = asRecord(domain.factChecks) ?? {};
  const availabilityChecks = asRecord(domain.availabilityChecks) ?? {};
  const observations = executedObservations(asArray(root.trajectories), request);
  const loopStatus = asString(asRecord(root.loop)?.status);
  if (loopStatus && loopStatus !== "TERMINAL") return { status: "NOT_SATISFIED", observations: [`No-result phase conflicts with loop status ${loopStatus}.`], refs: [ref("loop.status")] };
  if ([...Object.keys(factChecks), ...Object.keys(availabilityChecks), ...Object.keys(asRecord(domain.availability) ?? {})].some(id => !ids.includes(id))) {
    return { status: "NOT_SATISFIED", observations: ["Current candidate checks/offers fall outside the declared candidate pool."], refs: [ref("finalSnapshot.domainState.candidates"), ref("finalSnapshot.domainState.availabilityChecks")] };
  }
  const unsupportedUnavailable = ids.filter((id) => {
    const check = asRecord(availabilityChecks[id]);
    if (check?.status !== "UNAVAILABLE") return false;
    const evidenceIds = new Set(strings(check.evidenceIds));
    return !evidenceIds.size || !evidence.some((item) => {
      if (item.candidateId !== id || item.kind !== "AVAILABILITY" || !evidenceIds.has(asString(item.evidenceId) ?? "")) return false;
      const claims = asRecord(item.claims) ?? {};
      // A visible empty booking result is source evidence only for this exact
      // request.  It cannot be borrowed from another date/party, nor can an
      // arbitrary AVAILABILITY record be relabelled as a no-slot result.
      return claims.inventoryStatus === "UNAVAILABLE" && claims.date === request.date && claims.partySize === request.partySize;
    });
  });
  if (unsupportedUnavailable.length) {
    return { status: "NOT_SATISFIED", observations: [`Unsupported explicit no-availability conclusion for ${unsupportedUnavailable.join(", ")}: a candidate-bound, current-request inventory-negative source record is required.`], refs: [ref("finalSnapshot.domainState.availabilityChecks"), ref("finalSnapshot.domainState.readEvidence")] };
  }
  const qualified = ids.filter(id => {
    const factCheck = asRecord(factChecks[id]);
    const availabilityCheck = asRecord(availabilityChecks[id]);
    // Select references from current checks, not from production provider labels
    // or the complete historical fact list. Historical identity/discovery records
    // can associate these references but cannot resurrect an old restaurant fact.
    const currentRefs = new Set([...strings(factCheck?.evidenceIds), ...strings(availabilityCheck?.evidenceIds)]);
    if (!currentRefs.size) return false;
    for (const e of evidence) if (e.candidateId === id && (e.kind === "DISCOVERY" || e.kind === "ENTITY_MATCH")) {
      const evidenceId = asString(e.evidenceId); if (evidenceId) currentRefs.add(evidenceId);
    }
    const observedEvidenceIds = observations === undefined ? undefined : new Set(observations
      .filter((item) => item.applicableRequest && item.candidateIds.includes(id))
      .flatMap((item) => item.evidenceIds));
    return assessPresentedCandidate(id, domain, request, currentRefs, endedAt, observedEvidenceIds, observations).status === "SATISFIED";
  });
  if (qualified.length) return { status: "NOT_SATISFIED", observations: [`No-result contradicts independently supported candidates: ${qualified.join(", ")}`], refs: qualified.map(id => ref(`finalSnapshot.domainState.availability[${id}]`)) };
  const unknown = (reason: string) => ({ status: "NOT_EVALUATED" as const, observations: [reason], refs: [ref("finalSnapshot.domainState.noVerifiedResult"), ref("trajectories")] });
  const validIds = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === "string" && v.trim()) && new Set(value).size === value.length;
  if (!record || typeof record.endedAt !== "string" || !Number.isFinite(Date.parse(record.endedAt)) ||
      !validIds(record.investigatedCandidateIds) || !validIds(record.unresolvedCandidateIds) || !Array.isArray(record.remainingGaps) ||
      !record.remainingGaps.every(gap => typeof gap === "string") || !Array.isArray(root.trajectories)) return unknown("No-result scope, end time or actual trajectory records are missing/incomplete.");
  if (!loopStatus) return unknown("The execution loop status is missing.");
  const scopeIds = record.investigatedCandidateIds;
  const unresolvedIds = record.unresolvedCandidateIds;
  const steps = root.trajectories.map(asRecord).filter((step): step is JsonRecord => Boolean(step));
  const currentSteps = steps.filter(step => {
    if ((step.stepOutcome !== "EXECUTED" && step.stepOutcome !== "TERMINAL") || observedOnOrBeforePresentation(step.occurredAt, record.endedAt) !== "VALID") return false;
    const context = asRecord(step.decisionContext);
    const intent = asRecord(context?.intentDraft) ?? asRecord(context?.intent);
    if (!intent) return false;
    const observedRequest = requestFromFinalIntent(intent);
    return !observedRequest.missing.length && !observationRequestMismatches(request, observedRequest).length;
  });
  const discoveries = currentSteps.filter(step => asRecord(step.agentAction)?.type === "SEARCH_RESTAURANTS" &&
    asRecord(step.observation)?.type === "DISCOVERY" && validIds(asRecord(step.observation)?.candidateIds) &&
    asString(asRecord(step.executionMetadata)?.provider) && !asRecord(step.executionMetadata)?.failureCode);
  if (!discoveries.length) return unknown("No executed source discovery with an applicable request and observed candidate scope is recorded.");
  const discoveredIds = new Set(discoveries.flatMap(step => strings(asRecord(step.observation)?.candidateIds)));
  if (scopeIds.some(id => !ids.includes(id) || !discoveredIds.has(id)) || unresolvedIds.some(id => !scopeIds.includes(id)) ||
      ids.some(id => !scopeIds.includes(id)) || [...discoveredIds].some(id => !ids.includes(id))) {
    return { status: "NOT_SATISFIED", observations: ["Declared no-result scope contradicts executed discovery or candidate records."], refs: [ref("trajectories"), ref("finalSnapshot.domainState.noVerifiedResult")] };
  }
  const end = currentSteps.find(step => asRecord(step.agentAction)?.type === "END_READ" && asRecord(step.observation)?.type === "READ_ENDED");
  if (!end) return unknown("No executed current-request END_READ observation is recorded.");
  const endObservation = asRecord(end.observation)!;
  const sameIds = (left: unknown, right: string[]) => validIds(left) && [...left].sort().join("\n") === [...right].sort().join("\n");
  if (!sameIds(endObservation.candidateIds, scopeIds) || !sameIds(endObservation.unresolvedCandidateIds, unresolvedIds)) {
    return { status: "NOT_SATISFIED", observations: ["Final no-result scope differs from its executed ending observation."], refs: [ref("trajectories"), ref("finalSnapshot.domainState.noVerifiedResult")] };
  }
  if (!ids.length && !discoveredIds.size && !scopeIds.length && !unresolvedIds.length) {
    return { status: "SATISFIED", observations: ["Current executed source searches returned no candidates; the bounded empty scope agrees with the recorded ending. This does not prove search exhaustiveness."], refs: [ref("trajectories"), ref("finalSnapshot.domainState.noVerifiedResult")] };
  }
  return unknown("Candidate scope is recorded, but remainingGaps prose cannot independently prove that no candidate qualifies or that investigation was sufficient.");
}

/** Deterministically diagnoses an already-written artifact; it never calls a model or a provider. */
export function evaluateRestaurantHybridLiveArtifact(artifact: unknown, sourceArtifact: { path: string; sha256: string }): RestaurantHybridDiagnosticEvaluation {
  const root = asRecord(artifact) ?? {}; const domain = asRecord(getPath(root, ["finalSnapshot", "domainState"])) ?? {}; const materialized = asRecord(root.materializedCase) ?? {};
  // `intentDraft` is the Restaurant runtime's final authoritative intent field; do not
  // substitute a trajectory snapshot when the final state failed to record it.
  const finalAuthoritativeIntent = asRecord(domain.intentDraft);
  const expected = requestFromMaterialized(materialized); const actual = finalAuthoritativeIntent ? requestFromFinalIntent(finalAuthoritativeIntent) : undefined;
  const conditionMismatchesList = actual ? coreConditionMismatches(expected, actual).filter((item) => !expected.missing.includes(item) && !actual.missing.includes(item)) : [];
  const criteriaComparison = actual ? compareCriteria(expected, actual) : { conflicts: [], unresolved: [] };
  // Gold judges semantic fidelity. The executed read and its evidence instead
  // belong to the final authoritative intent actually bound by the Runtime.
  // This prevents historical label abbreviations from fabricating a source
  // lineage failure, while a semantic conflict still blocks final acceptance.
  const groundingRequest = requestForGrounding(expected, actual);
  const candidates = asArray(domain.candidates).map(asRecord).filter((item): item is JsonRecord => Boolean(item)); const checks = asRecord(domain.availabilityChecks) ?? {}; const availability = asRecord(domain.availability) ?? {}; const evidence = asArray(domain.readEvidence).map(asRecord).filter((item): item is JsonRecord => Boolean(item));
  const trajectoriesValue = root.trajectories; const trajectories = asArray(trajectoriesValue); const presented = asRecord(domain.presentedResults); const presentedIds = strings(presented?.candidateIds); const citedIds = new Set(strings(presented?.evidenceIds)); const finalPhase = asString(domain.phase); const loopStatus = asString(getPath(root, ["loop", "status"])); const presentedAt = presented?.presentedAt ?? root.finishedAt;
  const candidateSummaries: CandidateDiagnosticSummary[] = candidates.map((candidate) => { const restaurant = asRecord(candidate.restaurant) ?? {}; const candidateId = asString(restaurant.id) ?? "UNKNOWN_CANDIDATE"; const check = asRecord(checks[candidateId]); const attempts = providerAttemptsFromTrajectories(trajectories, candidateId); const candidateEvidence = evidence.filter((item) => item.candidateId === candidateId); const reasonCode = asString(check?.reasonCode); return { candidateId, outletName: asString(restaurant.outletName) ?? "Unknown outlet", providers: [...new Set(attempts.map((attempt) => attempt.provider))], providerAttempts: attempts, result: candidateResult(check, asArray(availability[candidateId]).length), ...(reasonCode ? { reasonCode } : {}), evidenceRefs: candidateEvidence.flatMap((item) => asString(item.evidenceId) ? [ref(`finalSnapshot.domainState.readEvidence[evidenceId=${asString(item.evidenceId)}]`)] : []) }; });
  const executionRecord = asRecord(root.execution);
  const executionFailureCode = asString(executionRecord?.failureCode) ?? asString(root.failureCode);
  const observations = Array.isArray(trajectoriesValue) ? executedObservations(trajectories, groundingRequest) : undefined;
  const candidateAssessments = presentedIds.map((candidateId) => {
    const observedEvidenceIds = observations === undefined ? undefined : new Set(observations
      .filter((item) => item.applicableRequest && item.candidateIds.includes(candidateId))
      .flatMap((item) => item.evidenceIds));
    return assessPresentedCandidate(candidateId, domain, groundingRequest, citedIds, presentedAt, observedEvidenceIds, observations);
  });
  const evidenceStatus: DiagnosticEvaluationStatus = candidateAssessments.length === 0 ? "NOT_EVALUATED" : candidateAssessments.some((item) => item.status === "NOT_SATISFIED") ? "NOT_SATISFIED" : candidateAssessments.some((item) => item.status === "NOT_EVALUATED") || expected.unsupportedHardCriteria.length ? "NOT_EVALUATED" : "SATISFIED";
  const visits = Array.isArray(trajectoriesValue) ? executedInvestigationVisits(trajectories) : undefined;
  const duplicateVisits = visits ? visits.filter((visit, index) => !visit.recheckReason && visits.slice(0, index).some((other) => other.candidateId === visit.candidateId && other.actionType === visit.actionType && other.requestVersion === visit.requestVersion && !other.recheckReason)) : [];
  const presentedWithoutExecutedObservation = presentedIds.length > 0 && observations !== undefined
    && !observations.some((item) => item.applicableRequest && item.candidateIds.length > 0 && item.evidenceIds.length > 0);
  const resourceUsage = asRecord(root.resourceUsage); const limits = asRecord(root.limits); const requiredResourceFields = ["elapsedMs", "agentDecisions", "browserModelCalls"]; const missingResourceFields = resourceUsage ? requiredResourceFields.filter((field) => asNumber(resourceUsage[field]) === undefined) : requiredResourceFields; const invalidResourceFields = resourceUsage ? requiredResourceFields.filter((field) => (asNumber(resourceUsage[field]) ?? 0) < 0) : []; const boundedResources: Array<[string, string]> = [["agentDecisions", "maxSteps"], ["browserModelCalls", "maxBrowserModelCallsTotal"]]; const overLimit = resourceUsage && limits ? boundedResources.flatMap(([used, limit]) => { const usedValue = asNumber(resourceUsage[used]); const limitValue = asNumber(limits[limit]); return usedValue !== undefined && limitValue !== undefined && usedValue > limitValue ? [`${used}>${limit}`] : []; }) : [];
  const missingConditionRecords = [...expected.missing, ...(actual?.missing ?? []), ...(finalAuthoritativeIntent ? [] : ["final authoritative intentDraft"])];
  const resourcesStatus: DiagnosticEvaluationStatus = !resourceUsage || missingResourceFields.length ? "NOT_EVALUATED" : invalidResourceFields.length || overLimit.length ? "NOT_SATISFIED" : "SATISFIED";
  const conditionsStatus: DiagnosticEvaluationStatus = missingConditionRecords.length ? "NOT_EVALUATED" : conditionMismatchesList.length || criteriaComparison.conflicts.length ? "NOT_SATISFIED" : criteriaComparison.unresolved.length ? "NOT_EVALUATED" : "SATISFIED";
  const investigationStatus: DiagnosticEvaluationStatus = !observations ? "NOT_EVALUATED" : duplicateVisits.length ? "NOT_SATISFIED" : "SATISFIED";
  const claimStatus: DiagnosticEvaluationStatus = finalPhase !== "PRESENT_RESULTS" ? "NOT_EVALUATED" : loopStatus !== "TERMINAL" ? "NOT_SATISFIED" : conditionsStatus === "NOT_SATISFIED" || evidenceStatus === "NOT_SATISFIED" || investigationStatus === "NOT_SATISFIED" ? "NOT_SATISFIED" : conditionsStatus === "NOT_EVALUATED" || evidenceStatus === "NOT_EVALUATED" || investigationStatus === "NOT_EVALUATED" ? "NOT_EVALUATED" : "SATISFIED";
  const completion = completionKind({ phase: finalPhase, loopStatus, failure: asRecord(domain.failure), executionStatus: asString(root.status), executionFailureCode });
  const noResultRecord = asRecord(domain.noVerifiedResult);
  const noResultAssessment = completion === "NO_VERIFIED_RESULT" ? assessNoResult(root, domain, groundingRequest) : undefined;
  const noResultStatus: DiagnosticEvaluationStatus = !noResultAssessment ? "NOT_EVALUATED" : [conditionsStatus, investigationStatus, resourcesStatus, noResultAssessment.status].includes("NOT_SATISFIED") ? "NOT_SATISFIED" : [conditionsStatus, investigationStatus, resourcesStatus, noResultAssessment.status].includes("NOT_EVALUATED") ? "NOT_EVALUATED" : "SATISFIED";
  const completionStatus: DiagnosticEvaluationStatus = completion === "INTERNAL_EXECUTION_FAILURE" ? "NOT_SATISFIED" : completion === "NOT_EVALUATED" ? "NOT_EVALUATED" : completion === "PRESENTATION_RECORDED" ? claimStatus : completion === "NO_VERIFIED_RESULT" ? noResultStatus : "SATISFIED";
  const findings: DiagnosticFinding[] = [
    { dimension: "AUTHORITATIVE_CONDITIONS", status: conditionsStatus, stage: "SEMANTIC_TO_FINAL_STATE", requirement: "The final authoritative intentDraft must preserve the materialized date, applicable party size, complete time window, location semantics, and criteria set.", observations: missingConditionRecords.length ? [`Missing or invalid comparison records: ${missingConditionRecords.join(", ")}.`] : conditionMismatchesList.length || criteriaComparison.conflicts.length ? [`Conflicting fields: ${[...conditionMismatchesList, ...criteriaComparison.conflicts].join(", ")}.`] : criteriaComparison.unresolved.length ? [`Unresolved criterion wording: ${criteriaComparison.unresolved.join(", ")}.`] : ["All independently readable applicable request fields match."], directCause: missingConditionRecords.length ? "The artifact lacks a required authority record; no condition conflict can be inferred." : conditionMismatchesList.length || criteriaComparison.conflicts.length ? "The recorded authoritative request conflicts with the materialized request." : criteriaComparison.unresolved.length ? "Criterion text differs without a deterministic equivalence rule; independent semantic review is required." : "No conflict observed.", rootCauseHypothesis: missingConditionRecords.length ? "Final-state serialization or historical artifact schema needs review." : conditionMismatchesList.length || criteriaComparison.conflicts.length ? "Requires semantic/compiler/runtime trace review." : criteriaComparison.unresolved.length ? "The model may have paraphrased, omitted, or added a criterion; the evaluator does not guess which." : "Not applicable.", certainty: missingConditionRecords.length || criteriaComparison.unresolved.length ? "UNKNOWN" : "CONFIRMED", evidenceRefs: [ref("materializedCase.semantic"), ref("finalSnapshot.domainState.intentDraft")], downstreamImpact: missingConditionRecords.length || conditionMismatchesList.length || criteriaComparison.conflicts.length ? "Final acceptance is blocked by a semantic conflict, while grounding remains independently evaluated against the actual request." : criteriaComparison.unresolved.length ? "Do not claim automatic semantic fidelity for the text difference; grounding remains independently evaluated against the actual request." : "Grounding can be evaluated against one request." },
    { dimension: "REQUIRED_EVIDENCE", status: evidenceStatus, stage: "GROUNDING", requirement: "Each presented candidate must independently cite same-candidate HIGH identity, area, applicable HARD facts, and only when the user requested availability, fresh request-bound slot evidence.", observations: [...candidateAssessments.flatMap((item) => item.observations), ...(expected.unsupportedHardCriteria.length ? [`NOT_EVALUATED unsupported HARD evidence contract: ${expected.unsupportedHardCriteria.join(", ")}`] : [])], directCause: evidenceStatus === "SATISFIED" ? "Every presented candidate has independently linked evidence." : evidenceStatus === "NOT_SATISFIED" ? "A cited candidate record conflicts with identity, request, source, freshness, or offer invariants." : "Artifact records or accepted evidence contract are insufficient for an independent conclusion.", rootCauseHypothesis: evidenceStatus === "NOT_SATISFIED" ? "Grounding, serialization, or presentation selection requires review." : "Execution artifact or accepted evidence contract lacks required detail.", certainty: evidenceStatus === "NOT_EVALUATED" ? "UNKNOWN" : "CONFIRMED", evidenceRefs: candidateAssessments.flatMap((item) => item.refs), downstreamImpact: evidenceStatus === "SATISFIED" ? "The presentation is independently supported." : "Do not claim an evidence-grounded result from this artifact." },
    { dimension: "INVESTIGATION_BEHAVIOR", status: investigationStatus, stage: "AGENT_LOOP", requirement: "Cited presentation evidence must originate in actually executed same-candidate observations for the applicable request; duplicate fact/availability reads remain checked without requiring either action type.", observations: !observations ? ["Trajectory record is missing; executed observation lineage cannot be evaluated."] : presentedWithoutExecutedObservation ? ["A result was presented but no trajectory observation records applicable candidate-bound evidence."] : [`executedObservations=${observations.length}`, `applicableObservations=${observations.filter((item) => item.applicableRequest).length}`, `executedInvestigationVisits=${visits?.length ?? 0}`, `authorizedRechecks=${visits?.filter((item) => item.recheckReason).map((item) => item.candidateId + ":" + item.recheckReason).join(",") || "none"}`, `duplicates=${duplicateVisits.map((item) => item.actionType + ":" + item.candidateId).join(",") || "none"}`], directCause: !observations ? "No trajectory record." : presentedWithoutExecutedObservation ? "The artifact records no applicable executed observation supporting its presentation." : duplicateVisits.length ? "The same candidate was executed more than once for the same request version without an authorized recheck reason." : "Executed observations are attributable without a duplicate fact/availability read.", rootCauseHypothesis: !observations || presentedWithoutExecutedObservation ? "Historical artifact or execution serialization omits actual observation lineage." : duplicateVisits.length ? "Agent/context/validator no-progress handling needs review." : "Not applicable.", certainty: !observations || presentedWithoutExecutedObservation ? "UNKNOWN" : "CONFIRMED", evidenceRefs: !observations ? [ref("artifact.trajectories")] : observations.map((item) => item.ref), downstreamImpact: investigationStatus === "SATISFIED" ? "Observation lineage and duplicate-read accounting remain attributable." : "Coverage and evidence-lineage claims cannot be inferred from this artifact." },
    { dimension: "FINAL_CLAIM", status: claimStatus, stage: "PRESENT_RESULTS", requirement: "A terminal presentation must agree with the independently checked, candidate-specific request and evidence records.", observations: [`phase=${finalPhase ?? "missing"}`, `loop=${loopStatus ?? "missing"}`, `presentedCandidates=${presentedIds.length}`], directCause: claimStatus === "SATISFIED" ? "Terminal presentation and independently evaluated evidence agree." : finalPhase !== "PRESENT_RESULTS" ? "No terminal presentation was executed." : "Terminal presentation has conflicting or insufficient independent support.", rootCauseHypothesis: claimStatus === "SATISFIED" ? "Not applicable." : "Verifier, serialization, or upstream execution record requires review.", certainty: claimStatus === "NOT_EVALUATED" ? "UNKNOWN" : "CONFIRMED", evidenceRefs: [ref("loop"), ref("finalSnapshot.domainState.presentedResults"), ref("finalSnapshot.domainState.availability"), ref("finalSnapshot.domainState.readEvidence")], downstreamImpact: claimStatus === "SATISFIED" ? "Execution produced a qualified read-only result." : "No qualified completion can be claimed." },
    { dimension: "COMPLETION_OUTCOME", status: completionStatus, stage: "TERMINATION", requirement: "A scoped no-result outcome, user-input pause, controlled cancellation, budget/deadline stop, and internal execution failure must remain distinguishable from one another and from independently verified presentation.", observations: [`completion=${completion}`, `phase=${finalPhase ?? "missing"}`, `loop=${loopStatus ?? "missing"}`, `noVerifiedResult=${noResultRecord ? "recorded" : "missing"}`, `failureCode=${executionFailureCode ?? "missing"}`, ...(noResultAssessment?.observations ?? [])], directCause: completion === "NO_VERIFIED_RESULT" ? noResultAssessment!.observations.join(" ") : completion === "NEEDS_USER_INPUT" ? "A required user field remains absent." : completion === "CANCELLED" ? "The immutable execution record reports controlled cancellation." : completion === "BUDGET_OR_DEADLINE_STOP" ? "The immutable execution record reports that the configured budget or deadline stopped further work." : completion === "INTERNAL_EXECUTION_FAILURE" ? "The execution record reports an internal failure; it is not a normal no-result outcome." : completion === "PRESENTATION_RECORDED" ? "A presentation was recorded and is checked independently above." : "Artifact lacks enough terminal information to classify the outcome.", rootCauseHypothesis: completion === "INTERNAL_EXECUTION_FAILURE" ? "Execution, Router, or model transport requires review." : completion === "NOT_EVALUATED" ? "Historical artifact or terminal serialization requires review." : "Not applicable.", certainty: completionStatus === "NOT_EVALUATED" ? "UNKNOWN" : "CONFIRMED", evidenceRefs: [ref("status"), ref("execution.failureCode"), ref("loop.status"), ref("finalSnapshot.domainState.phase"), ref("finalSnapshot.domainState.noVerifiedResult"), ref("finalSnapshot.domainState.failure"), ...(noResultAssessment?.refs ?? [])], downstreamImpact: completion === "NO_VERIFIED_RESULT" ? "Do not represent the scoped stop as a source-confirmed global negative result." : completion === "INTERNAL_EXECUTION_FAILURE" ? "Do not ask the user to cure an internal failure or report it as normal search exhaustion." : completion === "NEEDS_USER_INPUT" ? "Request only the recorded missing user information." : completion === "CANCELLED" || completion === "BUDGET_OR_DEADLINE_STOP" ? "Do not represent this controlled stop as a qualified result, a source-confirmed no-result, or a user-information failure." : completion === "PRESENTATION_RECORDED" ? "Presentation support remains independently auditable." : "No reliable outcome classification can be claimed." },
    { dimension: "RESOURCES", status: resourcesStatus, stage: "RUN_ACCOUNTING", requirement: "Artifact must provide valid applicable resource values; an object alone does not prove complete accounting or budget compliance.", observations: !resourceUsage ? ["resourceUsage is missing."] : [...missingResourceFields.map((field) => `missing=${field}`), ...invalidResourceFields.map((field) => `invalid=${field}`), ...overLimit.map((item) => `overLimit=${item}`)], directCause: resourcesStatus === "SATISFIED" ? "Required resource fields are present and within readable applicable limits." : resourcesStatus === "NOT_SATISFIED" ? "Resource record is invalid or over a declared limit." : "Required resource accounting is missing.", rootCauseHypothesis: resourcesStatus === "NOT_EVALUATED" ? "Historical artifact or interrupted execution lacks complete accounting." : "Runner limit/accounting requires review.", certainty: resourcesStatus === "NOT_EVALUATED" ? "UNKNOWN" : "CONFIRMED", evidenceRefs: [ref("resourceUsage"), ref("limits"), ref("modelInvocations")], downstreamImpact: resourcesStatus === "SATISFIED" ? "Recorded budget use can be reviewed." : "Do not infer limit compliance or a stopping cause." },
  ];
  const anyNotSatisfied = findings.some((finding) => finding.status === "NOT_SATISFIED"); const anyNotEvaluated = findings.some((finding) => finding.status === "NOT_EVALUATED"); const qualified = claimStatus === "SATISFIED";
  // A correctly recorded no-result has no presentation claim to score. Its
  // behavior can still be independently supported by conditions, execution
  // coverage, resource accounting, and an explicit bounded stop.
  const noResultSupported = noResultStatus === "SATISFIED";
  return { schemaVersion: "1", evaluatorVersion: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION, rubricStatus: "DRAFT_DIAGNOSTIC_ONLY", sourceArtifact: { path: sourceArtifact.path, sha256: sourceArtifact.sha256, ...(asString(root.runId) ? { runId: asString(root.runId)! } : {}), ...(asString(root.caseId) ? { caseId: asString(root.caseId)! } : {}) }, execution: { status: asString(root.status) ?? null, stage: asString(root.stage) ?? null, taskProducedQualifiedResult: qualified ? "YES" : completion === "NO_VERIFIED_RESULT" || completion === "CANCELLED" || completion === "BUDGET_OR_DEADLINE_STOP" || completion === "INTERNAL_EXECUTION_FAILURE" ? "NO" : anyNotSatisfied ? "NO" : "UNKNOWN", systemBehavior: anyNotSatisfied ? "NOT_SUPPORTED" : noResultSupported ? "SUPPORTED_BY_EVIDENCE" : anyNotEvaluated ? "NOT_EVALUATED" : "SUPPORTED_BY_EVIDENCE", externalConditions: candidates.length > 0 ? "OBSERVED" : "NOT_EVALUATED", evidenceSufficiency: evidenceStatus === "SATISFIED" ? "SUFFICIENT_FOR_PRESENTED_RESULT" : evidenceStatus === "NOT_SATISFIED" ? "INSUFFICIENT" : "NOT_EVALUATED", completion }, candidateSummaries, findings, unassessedDimensions: ["No subjective ranking, provider reliability, long-term inventory freshness, or model-quality score is produced.", "Cost is not inferred without explicit configured price inputs.", "Investigation sufficiency and search exhaustiveness are not inferred from terminal labels, call counts or remainingGaps prose.", ...(criteriaComparison.unresolved.length ? ["Criterion text differs without deterministic equivalence; no LLM judge was used and independent semantic review is required."] : []), ...expected.unsupportedHardCriteria.map((criterion) => `Negative/non-positive HARD criterion '${criterion}' has no accepted source-evidence contract in this evaluator.`)] };
}
function evaluationOutputPath(artifactPath: string, suffix: string): string { return resolve(dirname(artifactPath), `${basename(artifactPath, ".json")}.evaluation.${suffix}-${Date.now()}.json`); }
export async function evaluateArtifactFile(inputPath: string): Promise<{ evaluation: RestaurantHybridDiagnosticEvaluation; outputPath: string }> {
  const artifactPath = resolve(inputPath); const source = await readFile(artifactPath, "utf8"); const evaluation = evaluateRestaurantHybridLiveArtifact(JSON.parse(source), { path: artifactPath, sha256: sha256(source) }); const outputPath = evaluationOutputPath(artifactPath, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION.split("@")[1]!.replace(/[^a-z0-9]+/gi, "-")); await mkdir(dirname(outputPath), { recursive: true }); await writeFile(outputPath, JSON.stringify(evaluation, null, 2), { flag: "wx" }); return { evaluation, outputPath };
}
/** A failed evaluation is an immutable sidecar and never changes an already saved execution artifact. */
export async function evaluateArtifactAfterFinish(inputPath: string, evaluate: typeof evaluateArtifactFile = evaluateArtifactFile): Promise<{ outputPath?: string; evaluation?: RestaurantHybridDiagnosticEvaluation; evaluationFailure?: string; failurePath?: string }> {
  try {
    const outcome = await evaluate(inputPath);
    return { outputPath: outcome.outputPath, evaluation: outcome.evaluation };
  } catch (error) {
    const artifactPath = resolve(inputPath); const code = error instanceof Error && "code" in error && typeof error.code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code) ? error.code : "EVALUATION_FAILED"; const failurePath = evaluationOutputPath(artifactPath, "failed");
    try {
      await mkdir(dirname(failurePath), { recursive: true });
      await writeFile(failurePath, JSON.stringify({ schemaVersion: "1", evaluatorVersion: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, sourceArtifact: { path: artifactPath }, status: "EVALUATION_FAILED", failureCode: code }, null, 2), { flag: "wx" });
      return { evaluationFailure: code, failurePath };
    } catch { return { evaluationFailure: code }; }
  }
}
