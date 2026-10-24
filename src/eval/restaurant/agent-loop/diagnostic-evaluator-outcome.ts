import type { RunRecord, TraceRecord, OrchestrationRecord } from "./diagnostic-evaluator-record.js";
import { auditReadOnlyTrace } from "./diagnostic-evaluator-network.js";
import type { ReviewedReads, BoundaryAssessment } from "./diagnostic-evaluator-network.js";
import type { DiagnosticFinding } from "./diagnostic-evaluator.js";
import type { CandidateConditionStates } from "./diagnostic-evaluator-preferences.js";
import { isRestaurantFailureCode, RESTAURANT_FAILURE_CLASSIFICATION } from "../../../domains/restaurant/failure-codes.js";

export type RunOutcomeType = "QUALIFIED_DELIVERY" | "DELIVERED_UNQUALIFIED" | "HONEST_NO_RESULT" | "CAPABILITY_MISS" | "INTERNAL_FAILURE" | "ENV_FAILURE" | "ORCHESTRATION_INTERRUPTED" | "NOT_A_VALID_SAMPLE" | "NOT_EVALUATED";
export interface RunOutcome {
  type: RunOutcomeType;
  reasons: string[];
  evidenceRefs: string[];
  capabilityDenominator: "INCLUDED" | "EXCLUDED" | "NOT_EVALUATED";
  userGoalComplete: "YES" | "NO" | "NOT_EVALUATED";
}
export interface SeverityAssessment { status: "PRESENT" | "ABSENT" | "NOT_EVALUATED"; reasons: string[]; evidenceRefs: string[]; }
type ObservedSeverity = Record<"S0" | "S1" | "S2" | "S3" | "S4", SeverityAssessment>;
export type RunSeverity = ObservedSeverity & { S0_DECLARATION: SeverityAssessment; S0_BOUNDARY: BoundaryAssessment };
const unknown = (reason: string): SeverityAssessment => ({ status: "NOT_EVALUATED", reasons: [reason], evidenceRefs: [] });

function classifyObservedRun(input: { root: RunRecord; findings: DiagnosticFinding[]; presentationConditionsStatus: DiagnosticFinding["status"]; expectedGoal?: string; trace: TraceRecord[];
  conditionStates: CandidateConditionStates[];
  orchestration?: OrchestrationRecord; resultMissing: boolean; knownFeasibleWitness?: { refs: string[] }; honestNoResultScope?: { refs: string[] }; invalidSample?: { reason: string; refs: string[] } }): { outcome: RunOutcome; severity: ObservedSeverity } {
  const root = input.root, domain = root.finalSnapshot?.domainState;
  const presented = domain?.presentedResults?.candidateIds ?? [];
  const stage = (dimension: DiagnosticFinding["dimension"]) => input.findings.find(finding => finding.dimension === dimension);
  const noPresentation = !input.resultMissing && domain && domain.phase !== "PRESENT_RESULTS" && !presented.length && root.trajectories !== undefined
    && !root.trajectories.some(step => step.observation?.type === "RESULTS_PRESENTED" || step.agentAction?.type === "PRESENT_RESULTS");
  const severity: ObservedSeverity = { S0: input.resultMissing ? unknown("result.json missing; displayed claims cannot be evaluated.")
    : noPresentation ? { status: "ABSENT", reasons: ["Saved final state and executed trajectories record no positive restaurant delivery claim."], evidenceRefs: ["finalSnapshot.domainState", "trajectories"] }
    : stage("FINAL_CLAIM")?.status === "SATISFIED" ? { status: "ABSENT", reasons: ["Actual displayed claim has independent candidate/request/source support; unclaimed preferences are assessed separately."], evidenceRefs: stage("FINAL_CLAIM")!.evidenceRefs }
    : unknown("Displayed claim lacks complete independent request/source/execution support."),
    S1: unknown("No independently established unmet user-need conclusion."), S2: unknown("No valid independent feasible witness supplied."),
    S3: unknown("Experience/latency thresholds belong to E2; not scored here."), S4: unknown("User-invisible retry effects are not independently established.") };
  const finish = input.orchestration?.finish;
  const make = (type: RunOutcomeType, reason: string, evidenceRefs: string[], excluded = false): RunOutcome => ({ type, reasons: [reason], evidenceRefs,
    capabilityDenominator: excluded ? "EXCLUDED" : type === "NOT_EVALUATED" ? "NOT_EVALUATED" : "INCLUDED",
    userGoalComplete: type === "QUALIFIED_DELIVERY" ? "YES" : type === "NOT_EVALUATED" ? "NOT_EVALUATED" : "NO" });
  if (input.invalidSample) return { outcome: make("NOT_A_VALID_SAMPLE", input.invalidSample.reason, input.invalidSample.refs, true), severity };
  if (finish?.formalRunStarted === false && finish.preflight?.status === "FAILED")
    return { outcome: make("ENV_FAILURE", "Independent outer preflight failed before formal execution.", input.orchestration?.refs ?? [], true), severity };
  if (input.resultMissing) return { outcome: make("NOT_EVALUATED", "result.json missing without sufficient outer interruption records.", input.orchestration?.refs ?? []), severity };
  if (presented.length) {
    const conditions = stage("AUTHORITATIVE_CONDITIONS"), evidence = stage("REQUIRED_EVIDENCE");
    const unmetConditions = input.conditionStates.flatMap(row => row.criteria.filter(criterion => criterion.status === "NOT_MET" && ["HARD", "SOFT"].includes(criterion.strength))
      .map(criterion => ({ candidateId: row.candidateId, ...criterion })));
    if (unmetConditions.length) severity.S1 = { status: "PRESENT", reasons: unmetConditions.map(item => `${item.candidateId}: ${item.text} is independently NOT_MET (${item.strength}).`), evidenceRefs: unmetConditions.flatMap(item => item.evidenceRefs) };
    const goalConflict = Boolean(input.expectedGoal && domain?.intentDraft?.target?.goal && input.expectedGoal !== domain.intentDraft.target.goal);
    if (goalConflict && stage("FINAL_CLAIM")?.status === "SATISFIED") severity.S3 = { status: "PRESENT", reasons: ["R1: supported recommendation delivered through unnecessary availability investigation; goal-process drift remains a recorded defect, not an unmet result."], evidenceRefs: ["materializedCase.semantic.target", "finalSnapshot.domainState.intentDraft.target", "trajectories"] };
    const explicitFalseClaim = evidence?.observations.filter(observation => /raw (?:Tabelog|TableCheck).*(?:conflict|contradict|different|reports EMPTY)/.test(observation)) ?? [];
    // Gold versus the actual displayed offer is independent of copied source
    // claims. Production HARD-judgment labels alone do not establish S0.
    if (input.expectedGoal === "AVAILABILITY") {
      const gold = root.materializedCase?.semantic;
      const party = typeof gold?.party_size === "number" ? gold.party_size : gold?.party_size?.value;
      const start = gold?.time?.value ?? gold?.time?.start, end = gold?.time?.value ?? gold?.time?.end;
      for (const id of presented) for (const offer of domain?.availability?.[id] ?? []) {
        const date = offer.dateTime?.slice(0,10), time = offer.dateTime?.slice(11,16);
        if (gold?.date?.value && date && gold.date.value !== date) explicitFalseClaim.push(`Displayed offer date ${date} conflicts with frozen Gold ${gold.date.value}`);
        if (party !== undefined && offer.partySize !== undefined && party !== offer.partySize) explicitFalseClaim.push(`Displayed offer party ${offer.partySize} conflicts with frozen Gold ${party}`);
        const window = gold?.permittedAlternativeTimeWindow;
        if (start && end && time && (time < (window?.earliest ?? start) || time > (window?.latest ?? end))) explicitFalseClaim.push(`Displayed offer time ${time} conflicts with frozen Gold window`);
      }
    }
    if (explicitFalseClaim.length) severity.S0 = { status: "PRESENT", reasons: [...severity.S0.status === "PRESENT" ? severity.S0.reasons : [], ...explicitFalseClaim], evidenceRefs: evidence?.evidenceRefs ?? [] };
    if (unmetConditions.some(item => item.strength === "HARD")) severity.S0 = { status: "PRESENT", reasons: unmetConditions.filter(item => item.strength === "HARD").flatMap(item => item.basis), evidenceRefs: unmetConditions.filter(item => item.strength === "HARD").flatMap(item => item.evidenceRefs) };
    if (unmetConditions.length) return { outcome: make("DELIVERED_UNQUALIFIED", "At least one displayed outlet independently fails an expressed user condition (R2); NOT_CHECKED alone is not a conflict.", unmetConditions.flatMap(item => item.evidenceRefs)), severity };
    if (input.presentationConditionsStatus === "NOT_SATISFIED" || evidence?.status === "NOT_SATISFIED")
      return { outcome: make("DELIVERED_UNQUALIFIED", "Recorded presentation contradicts frozen request or independently checked source support.", [...conditions?.evidenceRefs ?? [], ...evidence?.evidenceRefs ?? []]), severity };
    if (stage("FINAL_CLAIM")?.status === "SATISFIED" && input.expectedGoal && severity.S0.status !== "PRESENT")
      return { outcome: make("QUALIFIED_DELIVERY", "Actual terminal presentation is supported by frozen request and candidate-bound original observations.", stage("FINAL_CLAIM")!.evidenceRefs), severity };
    return { outcome: make("NOT_EVALUATED", "Presentation exists but request equivalence or original support is not independently evaluated.", stage("FINAL_CLAIM")?.evidenceRefs ?? []), severity };
  }
  const end = root.materializedCase?.semantic?.time?.value ?? root.materializedCase?.semantic?.time?.end;
  const date = root.materializedCase?.semantic?.date?.value;
  // cases/README.md binds these materialized windows to Asia/Tokyo. Require
  // its explicit resolvedTokyoDate record, not the reference instant's display
  // offset (+08:00 in some inputs), system intent, or evaluator wall clock.
  const offset = root.materializedCase?.materialization?.resolvedTokyoDate === date ? "+09:00" : undefined;
  const windowEnd = date && end && offset ? Date.parse(`${date}T${end}:00${offset}`) : NaN;
  const formalStart = Date.parse(root.startedAt ?? "");
  const failedPrior = input.orchestration?.priorAttempts?.find(attempt => attempt.formalRunStarted === false && attempt.preflight?.status === "FAILED"
    && attempt.preflight.attempts?.some(item => item.outcome === "FAILED" && ((item.status ?? 0) >= 400 || item.failureCode))
    && Date.parse(attempt.startedAt ?? "") <= windowEnd && Date.parse(attempt.endedAt ?? "") <= formalStart);
  if (Number.isFinite(windowEnd) && formalStart > windowEnd && failedPrior)
    return { outcome: make("ENV_FAILURE", `R5: raw prior preflight failed before request window expiry ${date} ${end}${offset}; formal execution began after the window.`, input.orchestration?.refs ?? [], true), severity };
  const failedAttempts = (root.modelInvocations ?? []).filter(attempt => attempt.outcome === "FAILED");
  if (failedAttempts.some(attempt => attempt.providerStatus === 402 || attempt.providerStatus === 401 || attempt.providerStatus === 429 || (attempt.providerStatus ?? 0) >= 500))
    return { outcome: make("ENV_FAILURE", "Actual provider attempt records an explicit service/account HTTP failure, not a normal empty restaurant result.", ["modelInvocations"]), severity };
  if (input.knownFeasibleWitness) severity.S2 = { status: "PRESENT", reasons: ["No delivery despite independent request-matching feasible witness; cause is classified separately."], evidenceRefs: input.knownFeasibleWitness.refs };
  const failureCode = domain?.failure?.code;
  const terminalKind = failureCode === "AGENT_LOOP_REJECTION_LIMIT" ? "REJECTION_LIMIT" : failureCode === "AGENT_LOOP_NO_PROGRESS" ? "NO_PROGRESS" : undefined;
  const matchingEnd = terminalKind && root.trajectories?.at(-1)?.stepOutcome === terminalKind && root.loop?.status === terminalKind
    && root.events?.some(entry => entry.event?.type === "AGENT_LOOP_TERMINATED" && entry.event.termination === terminalKind && entry.trace?.actor === "SYSTEM");
  const actualCause = terminalKind === "REJECTION_LIMIT" ? (root.trajectories ?? []).filter(step => step.stepOutcome === "REJECTED" && step.actionValidation?.status === "REJECTED" && step.agentAction).length > 1
    : terminalKind === "NO_PROGRESS" && root.trajectories?.some(step => step.stepOutcome === "EXECUTION_FAILURE" && step.executionMetadata?.failureCode && step.observation?.type?.endsWith("_FAILED"));
  if (root.status === "FAILED" && domain?.phase === "FAILED" && matchingEnd && actualCause)
    return { outcome: make("INTERNAL_FAILURE", `Recorded ${failureCode} is corroborated by actual failed/rejected actions, matching terminal trajectory and system event; witness feasibility does not replace the failure cause.`, ["finalSnapshot.domainState.failure", "trajectories", "events.AGENT_LOOP_TERMINATED"]), severity };
  if (failedAttempts.length && root.status === "FAILED" && input.findings.some(finding => finding.dimension === "COMPLETION_OUTCOME" && finding.status === "NOT_SATISFIED"))
    return { outcome: make("INTERNAL_FAILURE", "Recorded failed execution attempt corroborates the independently unsatisfied completion stage.", ["modelInvocations", "execution", "trajectories"]), severity };
  const systemDefect = (code: string) => code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" // R6's known shared-scope wiring failure; production classification is not changed.
    || isRestaurantFailureCode(code) && RESTAURANT_FAILURE_CLASSIFICATION[code] === "SYSTEM";
  const stateCodes = [domain?.failure?.code, domain?.searchContinuation?.lastFailureCode,
    ...(domain?.noVerifiedResult?.remainingGaps ?? []).flatMap(gap => gap.match(/\b[A-Z][A-Z0-9_]+\b/g) ?? [])].filter((code): code is string => Boolean(code) && systemDefect(code!));
  const corroborated = stateCodes.filter(code => root.trajectories?.some(step => step.actionValidation?.status !== "REJECTED" && ["EXECUTED", "EXECUTION_FAILURE"].includes(step.stepOutcome ?? "")
    && step.observation && (step.executionMetadata?.failureCode === code || step.executionMetadata?.providerAttempts?.some(attempt => attempt.failureCode === code))));
  if (corroborated.length && (domain?.noVerifiedResult || domain?.failure))
    return { outcome: make("INTERNAL_FAILURE", `R6: terminal state records system defect ${[...new Set(corroborated)].join(", ")}, corroborated by executed failed source attempts; no-result wording cannot erase it.`, ["finalSnapshot.domainState.noVerifiedResult", "finalSnapshot.domainState.failure", "trajectories.executionMetadata"]), severity };
  if (input.knownFeasibleWitness) {
    return { outcome: make("CAPABILITY_MISS", severity.S2.reasons[0]!, input.knownFeasibleWitness.refs), severity };
  }
  if (domain?.phase === "NO_VERIFIED_RESULT" && (stage("COMPLETION_OUTCOME")?.status === "SATISFIED" || input.honestNoResultScope))
    return { outcome: make("HONEST_NO_RESULT", "Actual bounded no-result scope, executed observations and disclosed unknowns agree; this does not prove investigation sufficiency, global search exhaustion or budget compliance.", input.honestNoResultScope?.refs ?? stage("COMPLETION_OUTCOME")!.evidenceRefs), severity };
  return { outcome: make("NOT_EVALUATED", "No qualified delivery or independently sufficient no-result/cause oracle; no witness means no CAPABILITY_MISS.", ["trajectories", "finalSnapshot"]), severity };
}

export function classifyRunOutcome(input: Parameters<typeof classifyObservedRun>[0] & { reviewedReads?: ReviewedReads }): { outcome: RunOutcome; severity: RunSeverity } {
  const result = classifyObservedRun(input);
  const finish = input.orchestration?.finish;
  const outerSignal = finish?.exitCode?.signal ?? finish?.exit?.signal;
  const own = input.root.interruption;
  const ownedStop = own && Number.isFinite(Date.parse(own.at ?? "")) && (own.timeoutMs ?? 0) > 0
    && (own.reason === "SIGNAL" && ["SIGTERM", "SIGINT"].includes(own.signal ?? "")
      || own.reason === "TIMEOUT" && input.root.failureCode === "RUN_DEADLINE_EXCEEDED"
      || own.reason === "EXTERNAL_STOP" && input.root.failureCode === "RUN_EXTERNAL_STOP");
  const outerStop = ["SIGKILL", "SIGTERM"].includes(outerSignal ?? "") && input.orchestration?.interruption?.status?.startsWith("INTERRUPTED");
  // Classify interruption only after independently auditing displayed claims.
  if ((ownedStop || outerStop) && result.outcome.type !== "NOT_A_VALID_SAMPLE") {
    result.outcome = { type: "ORCHESTRATION_INTERRUPTED", capabilityDenominator: "EXCLUDED",
      userGoalComplete: input.resultMissing ? "NOT_EVALUATED" : result.outcome.type === "QUALIFIED_DELIVERY" ? "YES"
        : result.severity.S0.status === "PRESENT" || !input.root.finalSnapshot?.domainState?.presentedResults?.candidateIds?.length ? "NO" : "NOT_EVALUATED",
      reasons: [`Recorded ${ownedStop ? `${own!.reason}${own!.signal ? ` (${own!.signal})` : ""}` : `outer ${outerSignal}`} interruption; not a source-confirmed no-result.`, ...(input.resultMissing ? ["result.json missing; user-goal completion is NOT_EVALUATED."] : [])],
      evidenceRefs: ownedStop ? ["interruption", "finalSnapshot", "diagnostics.browserTrace"] : input.orchestration?.refs ?? [] };
  }
  const declaration = result.severity.S0;
  const boundary = auditReadOnlyTrace(input.trace, input.root.diagnostics?.networkRequests ?? [], input.resultMissing, input.reviewedReads);
  const assessments = [declaration, boundary];
  const aggregate: SeverityAssessment = { status: assessments.some(value => value.status === "PRESENT") ? "PRESENT" : assessments.some(value => value.status === "NOT_EVALUATED") ? "NOT_EVALUATED" : "ABSENT",
    reasons: assessments.flatMap(value => value.reasons), evidenceRefs: assessments.flatMap(value => value.evidenceRefs) };
  return { outcome: result.outcome, severity: { ...result.severity, S0: aggregate, S0_DECLARATION: declaration, S0_BOUNDARY: boundary } };
}
