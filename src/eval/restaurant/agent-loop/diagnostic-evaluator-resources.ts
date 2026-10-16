import type { RunRecord } from "./diagnostic-evaluator-record.js";

export interface EffectiveResourceScope {
  source: string; stage: string; candidateId: string;
  limits: Record<string, number>; observedMaximums: Record<string, number>; refs: string[];
}
export interface EffectiveResourceAssessment {
  status: "SATISFIED" | "NOT_SATISFIED" | "NOT_EVALUATED";
  scope: "RECORDED_EXECUTOR_LIMITS";
  scopes: EffectiveResourceScope[];
  declarationDifferences: string[];
  violations: string[];
  unassessed: string[];
}

/** Diagnose actual recorded executor counters/limits, not a reconstructed default. */
export function assessEffectiveResources(root: RunRecord): EffectiveResourceAssessment {
  const input = [
    ...(root.diagnostics?.browserExecution ?? []).map((entry,index) => ({ entry, ref: `diagnostics.browserExecution[${index}]` })),
    ...[...(root.diagnostics?.browserTrace ?? []), ...(root.sourceTrace?.browserTrace ?? [])]
      .flatMap(trace => trace.kind === "EXECUTOR_DIAGNOSTIC" && trace.detail ? [{ entry: trace.detail, ref: `browserTrace[sequence=${trace.sequence}]` }] : []),
  ];
  const assessment: EffectiveResourceAssessment = { status: "NOT_EVALUATED", scope: "RECORDED_EXECUTOR_LIMITS", scopes: [], declarationDifferences: [], violations: [], unassessed: [] };
  const comparisons = [
    ["maxModelCallsPerCandidate", "candidateModelCalls", "maxBrowserModelCallsPerCandidate"],
    ["maxModelCallsTotal", "runModelCalls", "maxBrowserModelCallsTotal"],
    ["maxOperationsPerCandidate", "candidateRuntimeOperations", "maxBrowserOperationsPerCandidate"],
  ] as const;
  const scopeMap = new Map<string, EffectiveResourceScope>();
  for (const { entry, ref } of input) {
    if (!entry.effectiveLimits) continue;
    const limits = entry.effectiveLimits;
    const key = JSON.stringify([entry.source, entry.stage, entry.candidateId, limits]);
    let scope = scopeMap.get(key);
    if (!scope) {
      scope = { source: entry.source ?? "UNRECORDED_SOURCE", stage: entry.stage ?? "UNRECORDED_STAGE", candidateId: entry.candidateId ?? "UNRECORDED_CANDIDATE", limits, observedMaximums: {}, refs: [] };
      scopeMap.set(key, scope);
    }
    scope.refs.push(ref);
    for (const [limitKey, counterKey, declaredKey] of comparisons) {
      const limit = limits[limitKey], used = entry.lifecycle?.[counterKey];
      if (limit === undefined) assessment.unassessed.push(`${ref}.effectiveLimits.${limitKey} missing`);
      else if (limit <= 0 || !Number.isInteger(limit)) assessment.violations.push(`${ref}.effectiveLimits.${limitKey} invalid=${limit}`);
      if (used !== undefined) {
        scope.observedMaximums[counterKey] = Math.max(scope.observedMaximums[counterKey] ?? used, used);
        if (used < 0 || !Number.isInteger(used)) assessment.violations.push(`${ref}.lifecycle.${counterKey} invalid=${used}`);
        if (limit !== undefined && used > limit) assessment.violations.push(`${ref}: actual ${counterKey}=${used}>effective.${limitKey}=${limit}`);
      }
      const declared = root.runCeilings?.[declaredKey] ?? (declaredKey === "maxBrowserModelCallsTotal" ? root.limits?.maxBrowserModelCallsTotal : undefined);
      if (declared !== undefined && limit !== undefined && declared !== limit)
        assessment.declarationDifferences.push(`${scope.source}/${scope.stage}/${scope.candidateId}: runCeilings.${declaredKey}=${declared} != effective.${limitKey}=${limit}`);
    }
    const actualTime = limits.maxAutomaticElapsedMs;
    if (actualTime !== undefined && entry.elapsedMs !== undefined) {
      scope.observedMaximums.elapsedMs = Math.max(scope.observedMaximums.elapsedMs ?? entry.elapsedMs, entry.elapsedMs);
      if (actualTime <= 0 || entry.elapsedMs > actualTime) assessment.violations.push(`${ref}: actual elapsedMs=${entry.elapsedMs}>effective.maxAutomaticElapsedMs=${actualTime}`);
      const declared = root.runCeilings?.maxAutomaticBrowserMs;
      if (declared !== undefined && declared !== actualTime) assessment.declarationDifferences.push(`${scope.source}/${scope.stage}: runCeilings.maxAutomaticBrowserMs=${declared} != effective.maxAutomaticElapsedMs=${actualTime}`);
    }
  }
  assessment.scopes = [...scopeMap.values()];
  const globalModelLimits = [...new Set(assessment.scopes.flatMap(scope => scope.limits.maxModelCallsTotal ?? []))];
  const recordedModelCalls = root.resourceUsage?.browserModelCalls;
  if (globalModelLimits.length === 1 && recordedModelCalls !== undefined && recordedModelCalls > globalModelLimits[0]!)
    assessment.violations.push(`resourceUsage.browserModelCalls=${recordedModelCalls}>effective.maxModelCallsTotal=${globalModelLimits[0]}`);
  if (globalModelLimits.length > 1) assessment.unassessed.push(`Different executor global model limits ${globalModelLimits.join(",")}; no single aggregate limit is guessed.`);
  if (!assessment.scopes.length) assessment.unassessed.push("diagnostics.browserExecution[*].effectiveLimits / browserTrace.EXECUTOR_DIAGNOSTIC.effectiveLimits missing; no actual limit compliance inferred from runCeilings.");
  for (const scope of assessment.scopes) {
    for (const [,counter] of comparisons) if (scope.observedMaximums[counter] === undefined) assessment.unassessed.push(`${scope.source}/${scope.stage}/${scope.candidateId}: actual ${counter} counter missing`);
  }
  const missingRequired = !assessment.scopes.length || assessment.unassessed.length > 0;
  if (assessment.scopes.some(scope => scope.limits.maxAutomaticElapsedMs === undefined)) assessment.unassessed.push("Actual executor elapsed-time limit not retained in one or more old scopes; model/operation comparison does not prove total-deadline enforcement.");
  assessment.status = assessment.violations.length ? "NOT_SATISFIED" : missingRequired ? "NOT_EVALUATED" : "SATISFIED";
  assessment.violations = [...new Set(assessment.violations)]; assessment.declarationDifferences = [...new Set(assessment.declarationDifferences)]; assessment.unassessed = [...new Set(assessment.unassessed)];
  return assessment;
}
