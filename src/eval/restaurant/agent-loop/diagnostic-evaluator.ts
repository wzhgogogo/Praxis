import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

import { assessH002NegativeTypeCriterion } from "./case-fact-policy.js";

export const RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION = "restaurant-hybrid-read-diagnostic-evaluator@4";
export const RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION = "restaurant-hybrid-read-diagnostic-rubric@4";

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
  date?: string;
  partySize?: number;
  timeWindow?: { earliest: string; latest: string };
  location?: { value: string; relation?: string };
  criteria: string[];
  unsupportedHardCriteria: string[];
  missing: string[];
}
function partySize(value: unknown): number | undefined { return asNumber(value) ?? asNumber(asRecord(value)?.value); }
function requestFromMaterialized(value: JsonRecord): RequestShape {
  const semantic = asRecord(value.semantic) ?? {}; const time = asRecord(semantic.time) ?? {}; const location = asRecord(semantic.location);
  const timeValue = parseTime(time.value); const start = parseTime(time.start); const end = parseTime(time.end);
  const criteria = criterionSet(semantic.criteria);
  const caseId = asString(value.id);
  const unsupportedHardCriteria = asArray(semantic.criteria).map(asRecord).flatMap((criterion) => {
    const text = asString(criterion?.value);
    const supportedH002Negative = caseId === "h002" && (text === "hot pot" || text === "spicy food");
    return criterion?.strength === "HARD" && criterion.polarity !== "POSITIVE" && text && !supportedH002Negative ? [text] : [];
  });
  const date = parseDate(asRecord(semantic.date)?.value); const party = partySize(semantic.party_size); const locationValue = asString(location?.value); const relation = asString(location?.relation);
  const result: RequestShape = { ...(caseId ? { caseId } : {}), ...(date ? { date } : {}), ...(party !== undefined ? { partySize: party } : {}), ...(timeValue ? { timeWindow: { earliest: timeValue, latest: timeValue } } : start && end ? { timeWindow: { earliest: start, latest: end } } : {}), ...(locationValue ? { location: { value: locationValue, ...(relation ? { relation } : {}) } } : {}), criteria, unsupportedHardCriteria, missing: [] };
  if (!result.date) result.missing.push("date");
  if (!result.timeWindow) result.missing.push("timeWindow");
  if (!result.location) result.missing.push("location");
  if (result.criteria.length !== asArray(semantic.criteria).length) result.missing.push("criteria");
  return result;
}
function requestFromFinalIntent(value: JsonRecord): RequestShape {
  const window = asRecord(value.timeWindow); const earliest = parseTime(window?.earliest); const latest = parseTime(window?.latest); const area = asRecord(value.area);
  const date = parseDate(value.date); const party = partySize(value.partySize); const areaQuery = asString(area?.query);
  const result: RequestShape = { ...(date ? { date } : {}), ...(party !== undefined ? { partySize: party } : {}), ...(earliest && latest ? { timeWindow: { earliest, latest } } : {}), ...(areaQuery ? { location: { value: areaQuery.replace(/^near\s+/i, ""), relation: "NEAR" } } : {}), criteria: criterionSet(value.criteria), unsupportedHardCriteria: [], missing: [] };
  if (!result.date) result.missing.push("date");
  if (!result.timeWindow) result.missing.push("timeWindow");
  if (!result.location) result.missing.push("location");
  if (result.criteria.length !== asArray(value.criteria).length) result.missing.push("criteria");
  return result;
}
function conditionMismatches(expected: RequestShape, actual: RequestShape): string[] {
  const mismatches = [...expected.missing, ...actual.missing];
  if (expected.date && actual.date && expected.date !== actual.date) mismatches.push("date");
  if (expected.partySize !== undefined && actual.partySize !== undefined && expected.partySize !== actual.partySize) mismatches.push("partySize");
  if (expected.partySize !== undefined && actual.partySize === undefined) mismatches.push("partySize");
  if (expected.partySize === undefined && actual.partySize !== undefined) mismatches.push("partySize:not-applicable");
  if (expected.timeWindow && actual.timeWindow && (expected.timeWindow.earliest !== actual.timeWindow.earliest || expected.timeWindow.latest !== actual.timeWindow.latest)) mismatches.push("timeWindow");
  if (expected.location && actual.location) {
    const relationCompatible = expected.location.relation === "NEAR_USER" ? Boolean(normalized(actual.location.value)) : normalized(expected.location.value) === normalized(actual.location.value);
    if (!relationCompatible) mismatches.push("location");
  }
  if (expected.criteria.join("\n") !== actual.criteria.join("\n")) mismatches.push("criteria");
  return [...new Set(mismatches)];
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
function executedAvailabilityVisits(trajectories: unknown[]): { candidateId: string; requestVersion: string; ref: string }[] | undefined {
  if (!Array.isArray(trajectories)) return undefined;
  const visits: { candidateId: string; requestVersion: string; ref: string }[] = [];
  trajectories.forEach((step, index) => {
    const action = asRecord(asRecord(step)?.agentAction) ?? asRecord(asRecord(step)?.action); if (action?.type !== "CHECK_AVAILABILITY") return;
    const metadata = asRecord(asRecord(step)?.executionMetadata); if (!metadata) return;
    const context = asRecord(asRecord(step)?.decisionContext)?.intent ?? asRecord(asRecord(step)?.decisionContext)?.intentDraft;
    // State hashes advance after unrelated candidate/presentation changes; only an
    // authoritative request change makes the same candidate a distinct read.
    const version = context ? JSON.stringify(context) : asString(asRecord(step)?.stateHashBefore) ?? "REQUEST_VERSION_UNRECORDED";
    strings(action.candidateIds).forEach((candidateId) => visits.push({ candidateId, requestVersion: version, ref: ref(`trajectories[${index}]`) }));
  });
  return visits;
}
function assessPresentedCandidate(candidateId: string, domain: JsonRecord, request: RequestShape, presentedEvidenceIds: Set<string>, presentedAt: unknown): { status: DiagnosticEvaluationStatus; observations: string[]; refs: string[] } {
  const checks = asRecord(domain.availabilityChecks) ?? {}; const availability = asRecord(domain.availability) ?? {};
  const allEvidence = asArray(domain.readEvidence).map(asRecord).filter((item): item is JsonRecord => Boolean(item)); const check = asRecord(checks[candidateId]);
  const offers = asArray(availability[candidateId]).map(asRecord).filter((item): item is JsonRecord => Boolean(item));
  const listedEvidence = allEvidence.filter((item) => item.candidateId === candidateId && presentedEvidenceIds.has(asString(item.evidenceId) ?? ""));
  const requiredRefs = strings(check?.evidenceIds); const observations: string[] = []; const refs: string[] = []; const missing: string[] = []; const conflicts: string[] = [];
  const factOnly = request.partySize === undefined;
  if (!factOnly) {
    if (!check) missing.push("availability check"); else if (check.status !== "AVAILABLE") conflicts.push(`availability check status=${String(check.status)}`);
    if (offers.length === 0) missing.push("offer"); if (requiredRefs.length === 0) missing.push("check evidenceIds");
    for (const evidenceId of requiredRefs) if (!presentedEvidenceIds.has(evidenceId)) conflicts.push(`check evidence ${evidenceId} was not cited by presentation`);
  }
  if (presentedEvidenceIds.size === 0) missing.push("presented evidenceIds");
  if (listedEvidence.length === 0) missing.push("candidate-scoped cited evidence");
  const byKind = (kind: string) => listedEvidence.filter((item) => item.kind === kind); const entity = byKind("ENTITY_MATCH"); const facts = byKind("RESTAURANT_FACT"); const availabilityEvidence = byKind("AVAILABILITY"); const discovery = byKind("DISCOVERY");
  if (entity.length === 0) missing.push("HIGH entity evidence"); if (entity.some((item) => asRecord(item.entityMatch)?.confidence !== "HIGH")) conflicts.push("entity confidence is not HIGH");
  const identities = entity.filter((item) => asRecord(item.entityMatch)?.confidence === "HIGH");
  if (identities.some((item) => !asString(item.provider) || !asString(item.sourceEntityId))) missing.push("entity source association");
  for (const item of [...facts, ...availabilityEvidence]) {
    const associated = identities.some((identity) => item.provider === identity.provider && item.sourceEntityId === identity.sourceEntityId);
    if (!associated) conflicts.push(`grounding evidence ${asString(item.evidenceId) ?? "unknown"} is not associated with an identity source`);
  }
  if (discovery.length === 0) missing.push("area discovery evidence"); else if (!discovery.some((item) => {
    const claims = asRecord(item.claims) ?? {};
    if (claims.areaMatch !== true) return false;
    if (request.location?.relation === "NEAR_USER") return claims.areaMatchBasis === "TASK_LOCATION_RADIUS" || claims.areaMatchBasis === "EVALUATION_LOCATION_RADIUS";
    return normalized(asString(claims.areaQuery)) === normalized(`near ${request.location?.value ?? ""}`);
  })) conflicts.push("cited discovery evidence does not establish the requested area");
  const positiveHard = request.criteria.filter((criterion) => criterion.endsWith("|POSITIVE|HARD")).map((criterion) => criterion.split("|")[0]!);
  for (const hardCriterion of positiveHard) if (!facts.some((item) => strings(asRecord(item.claims)?.verifiedHardCriteria).some((value) => normalized(value) === hardCriterion))) missing.push(`HARD criterion ${hardCriterion}`);
  if (request.caseId === "h002") {
    const typeFacts = facts.flatMap((item) => strings(asRecord(item.claims)?.restaurantTypeFacts));
    for (const criterion of request.criteria.filter((item) => item.endsWith("|NEGATIVE|HARD")).map((item) => item.split("|")[0]!)) {
      if (criterion !== "hot pot" && criterion !== "spicy food") continue;
      const assessment = assessH002NegativeTypeCriterion(criterion, typeFacts);
      if (assessment === "VIOLATES") conflicts.push(`H002 negative type criterion ${criterion} is contradicted by source restaurant type facts`);
      if (assessment === "UNKNOWN") missing.push(`H002 negative type criterion ${criterion} has no applicable source restaurant type fact`);
    }
  }
  if (factOnly) {
    const applicableHours = facts.filter((item) => asRecord(item.claims)?.openingHoursMatch === true);
    if (applicableHours.length === 0) missing.push("applicable opening-hours fact");
    for (const item of applicableHours) {
      const observation = observedOnOrBeforePresentation(item.observedAt, presentedAt);
      if (observation === "MISSING") missing.push("opening-hours observation time");
      if (observation === "INVALID") conflicts.push("opening-hours observation time is invalid");
      if (observation === "FUTURE_OBSERVATION") conflicts.push("opening-hours fact was observed after presentation");
    }
  } else {
    if (availabilityEvidence.length === 0) missing.push("availability evidence");
    for (const item of availabilityEvidence) {
      const claims = asRecord(item.claims) ?? {}; if (claims.date !== request.date) conflicts.push("availability evidence date conflicts with request"); if (claims.partySize !== request.partySize) conflicts.push("availability evidence party size conflicts with request");
      const visibleSlots = asArray(claims.visibleSlots).map(parseTime).filter((slot): slot is string => Boolean(slot)); if (request.timeWindow && !visibleSlots.some((slot) => slot >= request.timeWindow!.earliest && slot <= request.timeWindow!.latest)) conflicts.push("availability evidence has no slot in requested time window");
      const freshness = validDuringPresentation(item.observedAt, item.displayExpiresAt ?? item.expiresAt, presentedAt); if (freshness === "MISSING") missing.push("availability evidence observation/display freshness"); if (freshness === "INVALID") conflicts.push("availability evidence display-freshness ordering is invalid"); if (freshness === "FUTURE_OBSERVATION") conflicts.push("availability evidence was observed after presentation"); if (freshness === "EXPIRED") conflicts.push("availability evidence was expired when presented");
    }
    for (const offer of offers) {
      if (offer.restaurantId !== candidateId) conflicts.push("offer restaurant does not match presented candidate"); if (dateFromDateTime(offer.dateTime) !== request.date) conflicts.push("offer date conflicts with request"); if (offer.partySize !== request.partySize) conflicts.push("offer party size conflicts with request");
      const time = timeFromDateTime(offer.dateTime); if (!time || (request.timeWindow && (time < request.timeWindow.earliest || time > request.timeWindow.latest))) conflicts.push("offer time conflicts with requested time window");
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

/** Deterministically diagnoses an already-written artifact; it never calls a model or a provider. */
export function evaluateRestaurantHybridLiveArtifact(artifact: unknown, sourceArtifact: { path: string; sha256: string }): RestaurantHybridDiagnosticEvaluation {
  const root = asRecord(artifact) ?? {}; const domain = asRecord(getPath(root, ["finalSnapshot", "domainState"])) ?? {}; const materialized = asRecord(root.materializedCase) ?? {};
  // `intentDraft` is the Restaurant runtime's final authoritative intent field; do not
  // substitute a trajectory snapshot when the final state failed to record it.
  const finalAuthoritativeIntent = asRecord(domain.intentDraft);
  const expected = requestFromMaterialized(materialized); const actual = finalAuthoritativeIntent ? requestFromFinalIntent(finalAuthoritativeIntent) : undefined;
  const conditionMismatchesList = actual ? conditionMismatches(expected, actual).filter((item) => !expected.missing.includes(item) && !actual.missing.includes(item)) : [];
  const candidates = asArray(domain.candidates).map(asRecord).filter((item): item is JsonRecord => Boolean(item)); const checks = asRecord(domain.availabilityChecks) ?? {}; const availability = asRecord(domain.availability) ?? {}; const evidence = asArray(domain.readEvidence).map(asRecord).filter((item): item is JsonRecord => Boolean(item));
  const trajectoriesValue = root.trajectories; const trajectories = asArray(trajectoriesValue); const presented = asRecord(domain.presentedResults); const presentedIds = strings(presented?.candidateIds); const citedIds = new Set(strings(presented?.evidenceIds)); const finalPhase = asString(domain.phase); const loopStatus = asString(getPath(root, ["loop", "status"])); const presentedAt = presented?.presentedAt ?? root.finishedAt;
  const candidateSummaries: CandidateDiagnosticSummary[] = candidates.map((candidate) => { const restaurant = asRecord(candidate.restaurant) ?? {}; const candidateId = asString(restaurant.id) ?? "UNKNOWN_CANDIDATE"; const check = asRecord(checks[candidateId]); const attempts = providerAttemptsFromTrajectories(trajectories, candidateId); const candidateEvidence = evidence.filter((item) => item.candidateId === candidateId); const reasonCode = asString(check?.reasonCode); return { candidateId, outletName: asString(restaurant.outletName) ?? "Unknown outlet", providers: [...new Set(attempts.map((attempt) => attempt.provider))], providerAttempts: attempts, result: candidateResult(check, asArray(availability[candidateId]).length), ...(reasonCode ? { reasonCode } : {}), evidenceRefs: candidateEvidence.flatMap((item) => asString(item.evidenceId) ? [ref(`finalSnapshot.domainState.readEvidence[evidenceId=${asString(item.evidenceId)}]`)] : []) }; });
  const candidateAssessments = presentedIds.map((candidateId) => assessPresentedCandidate(candidateId, domain, expected, citedIds, presentedAt));
  const evidenceStatus: DiagnosticEvaluationStatus = candidateAssessments.length === 0 ? "NOT_EVALUATED" : candidateAssessments.some((item) => item.status === "NOT_SATISFIED") ? "NOT_SATISFIED" : candidateAssessments.some((item) => item.status === "NOT_EVALUATED") || expected.unsupportedHardCriteria.length ? "NOT_EVALUATED" : "SATISFIED";
  const visits = Array.isArray(trajectoriesValue) ? executedAvailabilityVisits(trajectories) : undefined; const duplicateVisits = visits ? visits.filter((visit, index) => visits.findIndex((other) => other.candidateId === visit.candidateId && other.requestVersion === visit.requestVersion) !== index) : [];
  const resourceUsage = asRecord(root.resourceUsage); const limits = asRecord(root.limits); const requiredResourceFields = ["elapsedMs", "agentDecisions", "browserModelCalls"]; const missingResourceFields = resourceUsage ? requiredResourceFields.filter((field) => asNumber(resourceUsage[field]) === undefined) : requiredResourceFields; const invalidResourceFields = resourceUsage ? requiredResourceFields.filter((field) => (asNumber(resourceUsage[field]) ?? 0) < 0) : []; const boundedResources: Array<[string, string]> = [["agentDecisions", "maxSteps"], ["browserModelCalls", "maxBrowserModelCallsTotal"]]; const overLimit = resourceUsage && limits ? boundedResources.flatMap(([used, limit]) => { const usedValue = asNumber(resourceUsage[used]); const limitValue = asNumber(limits[limit]); return usedValue !== undefined && limitValue !== undefined && usedValue > limitValue ? [`${used}>${limit}`] : []; }) : [];
  const missingConditionRecords = [...expected.missing, ...(actual?.missing ?? []), ...(finalAuthoritativeIntent ? [] : ["final authoritative intentDraft"])]; const resourcesStatus: DiagnosticEvaluationStatus = !resourceUsage || missingResourceFields.length ? "NOT_EVALUATED" : invalidResourceFields.length || overLimit.length ? "NOT_SATISFIED" : "SATISFIED"; const conditionsStatus: DiagnosticEvaluationStatus = missingConditionRecords.length ? "NOT_EVALUATED" : conditionMismatchesList.length ? "NOT_SATISFIED" : "SATISFIED"; const investigationStatus: DiagnosticEvaluationStatus = !visits ? "NOT_EVALUATED" : duplicateVisits.length ? "NOT_SATISFIED" : "SATISFIED"; const claimStatus: DiagnosticEvaluationStatus = finalPhase !== "PRESENT_RESULTS" ? "NOT_EVALUATED" : loopStatus !== "TERMINAL" ? "NOT_SATISFIED" : conditionsStatus === "NOT_SATISFIED" || evidenceStatus === "NOT_SATISFIED" ? "NOT_SATISFIED" : conditionsStatus === "NOT_EVALUATED" || evidenceStatus === "NOT_EVALUATED" ? "NOT_EVALUATED" : "SATISFIED";
  const findings: DiagnosticFinding[] = [
    { dimension: "AUTHORITATIVE_CONDITIONS", status: conditionsStatus, stage: "SEMANTIC_TO_FINAL_STATE", requirement: "The final authoritative intentDraft must preserve the materialized date, applicable party size, complete time window, location semantics, and criteria set.", observations: missingConditionRecords.length ? [`Missing or invalid comparison records: ${missingConditionRecords.join(", ")}.`] : conditionMismatchesList.length ? [`Conflicting fields: ${conditionMismatchesList.join(", ")}.`] : ["All independently readable applicable request fields match."], directCause: missingConditionRecords.length ? "The artifact lacks a required authority record; no condition conflict can be inferred." : conditionMismatchesList.length ? "The recorded authoritative request conflicts with the materialized request." : "No conflict observed.", rootCauseHypothesis: missingConditionRecords.length ? "Final-state serialization or historical artifact schema needs review." : conditionMismatchesList.length ? "Requires semantic/compiler/runtime trace review." : "Not applicable.", certainty: missingConditionRecords.length ? "UNKNOWN" : "CONFIRMED", evidenceRefs: [ref("materializedCase.semantic"), ref("finalSnapshot.domainState.intentDraft")], downstreamImpact: missingConditionRecords.length || conditionMismatchesList.length ? "Availability evidence cannot be attributed to the requested conditions." : "Grounding can be evaluated against one request." },
    { dimension: "REQUIRED_EVIDENCE", status: evidenceStatus, stage: "GROUNDING", requirement: "Each presented candidate must independently cite same-candidate HIGH identity, area, applicable HARD, and fresh requested availability evidence linked to its offer.", observations: [...candidateAssessments.flatMap((item) => item.observations), ...(expected.unsupportedHardCriteria.length ? [`NOT_EVALUATED unsupported HARD evidence contract: ${expected.unsupportedHardCriteria.join(", ")}`] : [])], directCause: evidenceStatus === "SATISFIED" ? "Every presented candidate has independently linked evidence." : evidenceStatus === "NOT_SATISFIED" ? "A cited candidate record conflicts with identity, request, source, freshness, or offer invariants." : "Artifact records or accepted evidence contract are insufficient for an independent conclusion.", rootCauseHypothesis: evidenceStatus === "NOT_SATISFIED" ? "Grounding, serialization, or presentation selection requires review." : "Execution artifact or accepted evidence contract lacks required detail.", certainty: evidenceStatus === "NOT_EVALUATED" ? "UNKNOWN" : "CONFIRMED", evidenceRefs: candidateAssessments.flatMap((item) => item.refs), downstreamImpact: evidenceStatus === "SATISFIED" ? "The presentation is independently supported." : "Do not claim an evidence-grounded result from this artifact." },
    { dimension: "INVESTIGATION_BEHAVIOR", status: investigationStatus, stage: "AGENT_LOOP", requirement: "Only actually executed availability reads may be checked for duplicate investigation; a changed request version is a distinct read.", observations: !visits ? ["Trajectory record is missing; duplicate investigation cannot be evaluated."] : [`executedAvailabilityVisits=${visits.length}`, `duplicates=${duplicateVisits.map((item) => item.candidateId).join(",") || "none"}`], directCause: !visits ? "No trajectory record." : duplicateVisits.length ? "The same candidate was executed more than once for the same request version." : "No duplicate executed read is recorded.", rootCauseHypothesis: !visits ? "Historical artifact omits trajectory accounting." : duplicateVisits.length ? "Agent/context/validator no-progress handling needs review." : "Not applicable.", certainty: !visits ? "UNKNOWN" : "CONFIRMED", evidenceRefs: !visits ? [ref("artifact.trajectories")] : visits.map((item) => item.ref), downstreamImpact: investigationStatus === "SATISFIED" ? "Read coverage remains attributable." : "Coverage and budget claims cannot be inferred from this artifact." },
    { dimension: "FINAL_CLAIM", status: claimStatus, stage: "PRESENT_RESULTS", requirement: "A terminal presentation must agree with the independently checked, candidate-specific request and evidence records.", observations: [`phase=${finalPhase ?? "missing"}`, `loop=${loopStatus ?? "missing"}`, `presentedCandidates=${presentedIds.length}`], directCause: claimStatus === "SATISFIED" ? "Terminal presentation and independently evaluated evidence agree." : finalPhase !== "PRESENT_RESULTS" ? "No terminal presentation was executed." : "Terminal presentation has conflicting or insufficient independent support.", rootCauseHypothesis: claimStatus === "SATISFIED" ? "Not applicable." : "Verifier, serialization, or upstream execution record requires review.", certainty: claimStatus === "NOT_EVALUATED" ? "UNKNOWN" : "CONFIRMED", evidenceRefs: [ref("loop"), ref("finalSnapshot.domainState.presentedResults"), ref("finalSnapshot.domainState.availability"), ref("finalSnapshot.domainState.readEvidence")], downstreamImpact: claimStatus === "SATISFIED" ? "Execution produced a qualified read-only result." : "No qualified completion can be claimed." },
    { dimension: "RESOURCES", status: resourcesStatus, stage: "RUN_ACCOUNTING", requirement: "Artifact must provide valid applicable resource values; an object alone does not prove complete accounting or budget compliance.", observations: !resourceUsage ? ["resourceUsage is missing."] : [...missingResourceFields.map((field) => `missing=${field}`), ...invalidResourceFields.map((field) => `invalid=${field}`), ...overLimit.map((item) => `overLimit=${item}`)], directCause: resourcesStatus === "SATISFIED" ? "Required resource fields are present and within readable applicable limits." : resourcesStatus === "NOT_SATISFIED" ? "Resource record is invalid or over a declared limit." : "Required resource accounting is missing.", rootCauseHypothesis: resourcesStatus === "NOT_EVALUATED" ? "Historical artifact or interrupted execution lacks complete accounting." : "Runner limit/accounting requires review.", certainty: resourcesStatus === "NOT_EVALUATED" ? "UNKNOWN" : "CONFIRMED", evidenceRefs: [ref("resourceUsage"), ref("limits"), ref("modelInvocations")], downstreamImpact: resourcesStatus === "SATISFIED" ? "Recorded budget use can be reviewed." : "Do not infer limit compliance or a stopping cause." },
  ];
  const anyNotSatisfied = findings.some((finding) => finding.status === "NOT_SATISFIED"); const anyNotEvaluated = findings.some((finding) => finding.status === "NOT_EVALUATED"); const qualified = claimStatus === "SATISFIED";
  return { schemaVersion: "1", evaluatorVersion: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION, rubricStatus: "DRAFT_DIAGNOSTIC_ONLY", sourceArtifact: { path: sourceArtifact.path, sha256: sourceArtifact.sha256, ...(asString(root.runId) ? { runId: asString(root.runId)! } : {}), ...(asString(root.caseId) ? { caseId: asString(root.caseId)! } : {}) }, execution: { status: asString(root.status) ?? null, stage: asString(root.stage) ?? null, taskProducedQualifiedResult: qualified ? "YES" : anyNotSatisfied ? "NO" : "UNKNOWN", systemBehavior: anyNotSatisfied ? "NOT_SUPPORTED" : anyNotEvaluated ? "NOT_EVALUATED" : "SUPPORTED_BY_EVIDENCE", externalConditions: candidates.length > 0 ? "OBSERVED" : "NOT_EVALUATED", evidenceSufficiency: evidenceStatus === "SATISFIED" ? "SUFFICIENT_FOR_PRESENTED_RESULT" : evidenceStatus === "NOT_SATISFIED" ? "INSUFFICIENT" : "NOT_EVALUATED" }, candidateSummaries, findings, unassessedDimensions: ["No subjective ranking, provider reliability, long-term inventory freshness, or model-quality score is produced.", "Cost is not inferred without explicit configured price inputs.", ...expected.unsupportedHardCriteria.map((criterion) => `Negative/non-positive HARD criterion '${criterion}' has no accepted source-evidence contract in this evaluator.`)] };
}
function evaluationOutputPath(artifactPath: string, suffix: string): string { return resolve(dirname(artifactPath), `${basename(artifactPath, ".json")}.evaluation.${suffix}-${Date.now()}.json`); }
export async function evaluateArtifactFile(inputPath: string): Promise<{ evaluation: RestaurantHybridDiagnosticEvaluation; outputPath: string }> {
  const artifactPath = resolve(inputPath); const source = await readFile(artifactPath, "utf8"); const evaluation = evaluateRestaurantHybridLiveArtifact(JSON.parse(source), { path: artifactPath, sha256: sha256(source) }); const outputPath = evaluationOutputPath(artifactPath, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION.split("@")[1]!.replace(/[^a-z0-9]+/gi, "-")); await mkdir(dirname(outputPath), { recursive: true }); await writeFile(outputPath, JSON.stringify(evaluation, null, 2), { flag: "wx" }); return { evaluation, outputPath };
}
/** A failed evaluation is an immutable sidecar and never changes an already saved execution artifact. */
export async function evaluateArtifactAfterFinish(inputPath: string, evaluate: typeof evaluateArtifactFile = evaluateArtifactFile): Promise<{ outputPath?: string; evaluationFailure?: string; failurePath?: string }> {
  try { return { outputPath: (await evaluate(inputPath)).outputPath }; } catch (error) {
    const artifactPath = resolve(inputPath); const code = error instanceof Error && "code" in error && typeof error.code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code) ? error.code : "EVALUATION_FAILED"; const failurePath = evaluationOutputPath(artifactPath, "failed");
    try {
      await mkdir(dirname(failurePath), { recursive: true });
      await writeFile(failurePath, JSON.stringify({ schemaVersion: "1", evaluatorVersion: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, sourceArtifact: { path: artifactPath }, status: "EVALUATION_FAILED", failureCode: code }, null, 2), { flag: "wx" });
      return { evaluationFailure: code, failurePath };
    } catch { return { evaluationFailure: code }; }
  }
}
