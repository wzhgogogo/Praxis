import type { RunRecord } from "./diagnostic-evaluator-record.js";
import { createHash } from "node:crypto";

/** Diagnostic limits only. They do not alter production budgets/valid actions. */
export const INVESTIGATION_PROGRESS_LIMITS = Object.freeze({ rejectedActions: 3, consecutiveNoNewObservation: 4, sameFailure: 3, exactUrlReloads: 5 });
interface StepRun { key: string; steps: number[]; }
export interface InvestigationMetrics {
  status: "OBSERVED" | "NOT_EVALUATED";
  rejectedActions: number;
  maxConsecutiveNoNewObservation: number;
  noNewObservationRuns: StepRun[];
  sameFailureRuns: StepRun[];
  sameTermRuns: StepRun[];
  urls: { status: "OBSERVED" | "NOT_EVALUATED"; scope: "FULL_RECORDED_NAVIGATIONS" | "REDACTED_PATHS_ONLY"; loads: Array<{ url: string; count: number; reloads: number }> };
  violations: string[];
  unassessed: string[];
}
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
export function measureInvestigationProgress(root: RunRecord): InvestigationMetrics {
  const limits = INVESTIGATION_PROGRESS_LIMITS;
  const metrics: InvestigationMetrics = { status: root.trajectories ? "OBSERVED" : "NOT_EVALUATED", rejectedActions: 0, maxConsecutiveNoNewObservation: 0,
    noNewObservationRuns: [], sameFailureRuns: [], sameTermRuns: [], urls: { status: "NOT_EVALUATED", scope: "REDACTED_PATHS_ONLY", loads: [] }, violations: [], unassessed: [] };
  const seen = new Set<string>(), failures = new Map<string, number[]>();
  let noNew: StepRun | undefined, termRun: StepRun | undefined;
  for (const [index, step] of (root.trajectories ?? []).entries()) {
    const number = step.stepNumber ?? index + 1;
    const action = step.agentAction ?? step.action, observation = step.observation, metadata = step.executionMetadata;
    const request = createHash("sha256").update(JSON.stringify(step.decisionContext?.intentDraft ?? step.decisionContext?.intent ?? "UNRECORDED_REQUEST")).digest("hex").slice(0, 16);
    const provider = metadata?.provider ?? "UNRECORDED_SOURCE";
    const rejected = step.stepOutcome === "REJECTED" || step.actionValidation?.status === "REJECTED";
    if (rejected) metrics.rejectedActions++;
    const executed = step.stepOutcome === "EXECUTED" || step.stepOutcome === "TERMINAL";
    let progress = false;
    const observe = (key: string) => { const scoped = `${request}:${key}`; if (!seen.has(scoped)) { seen.add(scoped); progress = true; } };
    if (executed) {
      (observation?.evidenceIds ?? []).forEach(id => observe(`evidence:${id}`));
      if (observation?.type === "DISCOVERY") (observation.candidateIds ?? []).forEach(id => observe(`candidate:${id}`));
      if (["CHECK_AVAILABILITY", "INVESTIGATE_CANDIDATE_FACTS"].includes(action?.type ?? ""))
        (observation?.candidateIds ?? []).forEach(id => observe(`observed-scope:${action!.type}:${provider}:${id}`));
      for (const listing of metadata?.nativeDiscoveryFunnel?.listingObservations ?? [])
        if (listing.sourceUrl) observe(`listing:${listing.sourceUrl}:${listing.resultCount}:${listing.parsedOutlets}`);
      // An actually executed first empty source scope is information, not proof
      // of global sufficiency. Repeating the same cached empty scope is not new.
      if (observation?.type === "DISCOVERY" && !metadata?.failureCode && !(observation.candidateIds?.length)
        && (metadata?.nativeDiscoveryFunnel === undefined || (metadata.nativeDiscoveryFunnel.pagesRead ?? 0) > 0))
        observe(`empty:${provider}:${normalize(action?.retrievalHint ?? "")}`);
    }
    if (progress) noNew = undefined;
    else {
      if (!noNew || noNew.key !== request) { noNew = { key: request, steps: [] }; metrics.noNewObservationRuns.push(noNew); }
      noNew.steps.push(number); metrics.maxConsecutiveNoNewObservation = Math.max(metrics.maxConsecutiveNoNewObservation, noNew.steps.length);
    }
    const emptySearch = action?.type === "SEARCH_RESTAURANTS" && !(observation?.candidateIds?.length);
    const failure = rejected ? "REJECTED" : metadata?.failureCode ?? (step.stepOutcome === "EXECUTION_FAILURE" ? "EXECUTION_FAILURE" : emptySearch ? "EMPTY_SEARCH" : undefined);
    if (failure) {
      const key = `${request}:${action?.type ?? "NO_ACTION"}:${provider}:${failure}`;
      const run = failures.get(key) ?? []; run.push(number); failures.set(key, run);
    }
    if (action?.type === "SEARCH_RESTAURANTS" && action.retrievalHint) {
      const key = `${request}:${normalize(action.retrievalHint)}`;
      if (!termRun || termRun.key !== key) { termRun = { key, steps: [] }; metrics.sameTermRuns.push(termRun); }
      termRun.steps.push(number);
    } else termRun = undefined;
  }
  metrics.sameFailureRuns = [...failures].map(([key, steps]) => ({ key, steps })).filter(run => run.steps.length > 1);
  metrics.sameTermRuns = metrics.sameTermRuns.filter(run => run.steps.length > 1);
  metrics.noNewObservationRuns = metrics.noNewObservationRuns.filter(run => run.steps.length > 1);
  const fullUrls = root.sourceTrace?.navigations;
  const traceUrls = [...(root.diagnostics?.browserTrace ?? []), ...(root.sourceTrace?.browserTrace ?? [])]
    .filter(entry => entry.kind === "SESSION_CALL" && ["navigate", "openLink"].includes(entry.detail?.method ?? ""))
    .flatMap(entry => { const arg = entry.detail?.args?.[entry.detail.method === "openLink" ? 1 : 0]; return typeof arg === "string" ? [arg] : []; });
  const urls = fullUrls ?? traceUrls;
  const counts = new Map<string, number>();
  for (const value of urls) { try { const url = new URL(value); url.hash = ""; counts.set(url.href, (counts.get(url.href) ?? 0) + 1); }
    catch { metrics.unassessed.push("A recorded navigation URL is invalid."); } }
  metrics.urls = { status: fullUrls ? "OBSERVED" : "NOT_EVALUATED", scope: fullUrls ? "FULL_RECORDED_NAVIGATIONS" : "REDACTED_PATHS_ONLY",
    loads: [...counts].map(([url,count]) => ({ url, count, reloads: count - 1 })) };
  if (!fullUrls) metrics.unassessed.push("Full navigation query values were not retained; sanitized-path reloads are descriptive only, not exact-URL failures.");
  if (metrics.rejectedActions > limits.rejectedActions) metrics.violations.push(`rejectedActions=${metrics.rejectedActions}>${limits.rejectedActions}`);
  if (metrics.maxConsecutiveNoNewObservation > limits.consecutiveNoNewObservation) metrics.violations.push(`consecutiveNoNewObservation=${metrics.maxConsecutiveNoNewObservation}>${limits.consecutiveNoNewObservation}`);
  metrics.sameFailureRuns.filter(run => run.steps.length > limits.sameFailure).forEach(run => metrics.violations.push(`sameFailure=${run.steps.length}>${limits.sameFailure}; steps=${run.steps.join(",")}; ${run.key}`));
  if (fullUrls) metrics.urls.loads.filter(run => run.reloads > limits.exactUrlReloads).forEach(run => metrics.violations.push(`exactUrlReloads=${run.reloads}>${limits.exactUrlReloads}; ${run.url}`));
  return metrics;
}
