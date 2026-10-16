/** Evaluation-owned projection of recorded data, not a production State parser.
 * Only consumed fields are projected. Absent fields stay absent; no lifecycle,
 * eligibility, time, observation, or limit is synthesized for old artifacts.
 */
export interface RunReadIssue { path: string; reason: "INVALID_TYPE" | "MISSING"; }
type Decoder<T> = (value: unknown, path: string, issues: RunReadIssue[]) => T | undefined;
type Value<D> = D extends Decoder<infer T> ? T : never;
const scalar = <T>(accept: (value: unknown) => value is T): Decoder<T> => (value, path, issues) => {
  if (value === undefined) return undefined;
  if (accept(value)) return value;
  issues.push({ path, reason: "INVALID_TYPE" }); return undefined;
};
const text = scalar((value): value is string => typeof value === "string");
// Runner explicitly writes failureCode:null for success; this is not a missing reason.
const optionalFailure: Decoder<string> = (value, path, issues) => value === null ? undefined : text(value, path, issues);
const number = scalar((value): value is number => typeof value === "number" && Number.isFinite(value));
const boolean = scalar((value): value is boolean => typeof value === "boolean");
const raw: Decoder<unknown> = value => value;
function object<S extends Record<string, Decoder<unknown>>>(shape: S): Decoder<{ [K in keyof S]?: Value<S[K]> }> {
  return (value, path, issues) => {
    if (value === undefined) return undefined;
    if (typeof value !== "object" || value === null || Array.isArray(value)) { issues.push({ path, reason: "INVALID_TYPE" }); return undefined; }
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, decode] of Object.entries(shape)) {
      const decoded = decode(source[key], path ? `${path}.${key}` : key, issues);
      if (decoded !== undefined) result[key] = decoded;
    }
    return result as { [K in keyof S]?: Value<S[K]> };
  };
}
function array<T>(decode: Decoder<T>): Decoder<T[]> {
  return (value, path, issues) => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) { issues.push({ path, reason: "INVALID_TYPE" }); return undefined; }
    return value.flatMap((entry, index) => {
      const result = decode(entry, `${path}[${index}]`, issues);
      return result === undefined ? [] : [result];
    });
  };
}
function dictionary<T>(decode: Decoder<T>): Decoder<Record<string, T>> {
  return (value, path, issues) => {
    if (value === undefined) return undefined;
    if (typeof value !== "object" || value === null || Array.isArray(value)) { issues.push({ path, reason: "INVALID_TYPE" }); return undefined; }
    return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
      const result = decode(entry, `${path}[${key}]`, issues);
      return result === undefined ? [] : [[key, result]];
    }));
  };
}
const texts = array(text);
function numericFields(fields: string[]): Decoder<Record<string, number>> {
  return (value, path, issues) => {
    if (value === undefined) return undefined;
    if (typeof value !== "object" || value === null || Array.isArray(value)) { issues.push({ path, reason: "INVALID_TYPE" }); return undefined; }
    const result: Record<string, number> = {};
    for (const key of fields) {
      const decoded = number((value as Record<string, unknown>)[key], `${path}.${key}`, issues);
      if (decoded !== undefined) result[key] = decoded;
    }
    return result;
  };
}
const window = object({ earliest: text, latest: text });
const target = object({ goal: text });
const criterion = object({ text, value: text, polarity: text, strength: text });
const party: Decoder<number | { value?: number }> = (value, path, issues) => typeof value === "number" ? number(value, path, issues) : object({ value: number })(value, path, issues);
const semantic = object({ target, date: object({ value: text }), time: object({ value: text, start: text, end: text }), party_size: party,
  location: object({ value: text, relation: text }), criteria: array(criterion), permittedAlternativeTimeWindow: window });
const intent = object({ target, date: text, partySize: party, timeWindow: window, area: object({ query: text }),
  criteria: array(criterion), permittedAlternativeTimeWindow: window, timezone: text });
const serviceScope = object({ field: text, group: text, value: text });
const claims = object({ serviceScopeField: text, serviceScopeGroup: text, serviceScopeValue: text, supportingEvidenceIds: texts,
  areaMatch: boolean, areaMatchBasis: text, areaQuery: text, verifiedHardCriteria: texts, violatedNegativeCriteria: texts,
  verifiedNegativeCriteria: texts, restaurantTypeFacts: texts, categoryUnknownNegativeCriteria: texts,
  openingHoursMatch: boolean, regularOpeningHours: texts, date: text, partySize: number, visibleSlots: texts, inventoryStatus: text });
const evidence = object({ evidenceId: text, kind: text, provider: text, candidateId: text, sourceEntityId: text,
  observedAt: text, displayExpiresAt: text, expiresAt: text, claims, entityMatch: object({ confidence: text }) });
const check = object({ status: text, reasonCode: text, evidenceIds: texts });
const offer = object({ id: text, restaurantId: text, source: text, dateTime: text, partySize: number, checkedAt: text,
  displayExpiresAt: text, expiresAt: text, alternativeToRequestedTime: boolean, serviceScope });
const termination = object({ initiator: text, type: text, reasonCode: text, isSystemReason: boolean });
const restaurant = object({ id: text, outletName: text, address: text, sourceIds: dictionary(text) });
const candidate = object({ restaurant });
const action = object({ type: text, candidateIds: texts, retrievalHint: text });
const observation = object({ type: text, candidateIds: texts, evidenceIds: texts, unresolvedCandidateIds: texts,
  remainingGaps: texts, termination, factSourceAttempts: array(object({ candidateId: text, source: text })) });
const trajectory = object({ stepNumber: number, occurredAt: text, stateVersionAfter: number, stateHashBefore: text,
  stepOutcome: text, agentAction: action, action, decisionContext: object({ intent, intentDraft: intent }),
  actionValidation: object({ status: text }), observation,
  executionMetadata: object({ provider: text, failureCode: text, recheckReason: text,
    nativeDiscoveryFunnel: object({ pagesRead: number, listingObservations: array(object({ sourceUrl: text, resultCount: number, parsedOutlets: number })) }),
    providerAttempts: array(object({ candidateId: text, provider: text, outcome: text, failureCode: text })) }) });
const control = object({ structure: object({ name: text, radioGroupKey: text }), name: text, label: text, kind: text,
  checked: boolean, selected: boolean, calendarDate: text, visible: boolean, disabled: boolean, value: text, options: array(object({ selected: boolean, value: text, label: text })) });
const tabelogSelection = object({ time: text, link: object({ rcd: text, member: text, visit_date: text, visit_time: text }) });
const tabelogBody = object({ base_date: object({ year: number, month: number, day: number }), members: number, selection: array(tabelogSelection) });
const networkRequest = object({ outcome: text, origin: text, pathname: text, method: text, resourceType: text, queryKeys: texts });
const effectiveLimits = numericFields(["maxModelCallsPerCandidate", "maxModelCallsTotal", "maxOperationsPerCandidate", "maxAutomaticElapsedMs"]);
const lifecycle = numericFields(["candidateModelCalls", "runModelCalls", "candidateRuntimeOperations", "candidateElapsedMs"]);
const executorFields = { source: text, stage: text, event: text, candidateId: text, elapsedMs: number, effectiveLimits, lifecycle };
const browserExecution = object(executorFields);
const traceDetail = object({ snapshotSequence: number, controls: array(control), stage: text, candidateId: text,
  source: text, event: text, elapsedMs: number, effectiveLimits, lifecycle,
  readNetworkBoundary: text, networkRequests: array(networkRequest),
  url: text, method: text, args: array(raw), responses: array(object({ url: text, status: number, observedAt: text, body: tabelogBody })),
  observedStateTags: array(object({ tag: text, class: text, "data-time": text, disabled: text, "aria-disabled": text })),
  queryRegions: array(object({ truncated: boolean, ancestorMarkupHidden: boolean, markup: text })) });
const traceHeader = object({ sequence: number, at: text, kind: text });
type ParsedTrace = Value<typeof traceHeader> & { detail?: Value<typeof traceDetail>; networkRequests?: Value<typeof networkRequest>[] };
const trace: Decoder<ParsedTrace> = (value, path, issues) => {
  const header = traceHeader(value, path, issues);
  if (!header) return undefined;
  const detail = (value as Record<string, unknown>).detail;
  if (header.kind === "NETWORK") {
    const requests = array(networkRequest)(detail, `${path}.detail`, issues);
    return { ...header, ...(requests ? { networkRequests: requests } : {}) };
  }
  const parsed = traceDetail(detail, `${path}.detail`, issues);
  return { ...header, ...(parsed ? { detail: parsed } : {}) };
};
const domain = object({ intentDraft: intent, phase: text, availabilityChecks: dictionary(check), factChecks: dictionary(check),
  availability: dictionary(array(offer)), readEvidence: array(evidence), candidates: array(candidate),
  presentedResults: object({ candidateIds: texts, evidenceIds: texts, presentedAt: text }),
  noVerifiedResult: object({ endedAt: text, investigatedCandidateIds: texts, unresolvedCandidateIds: texts, remainingGaps: texts, termination }),
  failure: object({ code: text }), searchContinuation: object({ lastFailureCode: text }) });
const run = object({ runId: text, caseId: text, status: text, stage: text, failureCode: optionalFailure, startedAt: text, finishedAt: text,
  materializedCase: object({ id: text, semantic }), finalSnapshot: object({ version: number, domainState: domain }),
  trajectories: array(trajectory), events: array(object({ occurredAt: text, event: object({ type: text, termination: text, reasonCode: text }), trace: object({ actor: text }) })),
  diagnostics: object({ browserTrace: array(trace), networkRequests: array(networkRequest), browserExecution: array(browserExecution) }), sourceTrace: object({ browserTrace: array(trace), navigations: texts }),
  execution: object({ failureCode: text }), loop: object({ status: text }),
  resourceUsage: numericFields(["elapsedMs", "agentDecisions", "browserModelCalls", "modelCallsStarted"]),
  runCeilings: numericFields(["maxAutomaticBrowserMs", "maxAgentSteps", "maxBrowserModelCallsTotal", "maxModelCalls", "maxBrowserModelCallsPerCandidate", "maxBrowserOperationsPerCandidate"]),
  limits: numericFields(["maxSteps", "maxBrowserModelCallsTotal"]), modelInvocations: array(object({ outcome: text, errorCode: text, providerStatus: number })) });
const exit = object({ signal: text });
const outer = object({ finish: object({ exit, exitCode: exit, formalRunStarted: boolean, preflight: object({ status: text }) }),
  interruption: object({ status: text }), refs: texts });

export type RunRecord = Value<typeof run>;
export type DomainRecord = Value<typeof domain>;
export type IntentRecord = Value<typeof intent>;
export type MaterializedRecord = NonNullable<RunRecord["materializedCase"]>;
export type CriterionRecord = Value<typeof criterion>;
export type EvidenceRecord = Value<typeof evidence>;
export type CheckRecord = Value<typeof check>;
export type TrajectoryRecord = Value<typeof trajectory>;
export type TraceRecord = Value<typeof trace>;
export type TraceDetailRecord = Value<typeof traceDetail>;
export type ControlRecord = Value<typeof control>;
export type ServiceScopeRecord = Value<typeof serviceScope>;
export type NetworkRequestRecord = Value<typeof networkRequest>;
export type OrchestrationRecord = Value<typeof outer>;

export function readDiagnosticTrace(value: unknown): { entries: TraceRecord[]; issues: RunReadIssue[] } {
  const issues: RunReadIssue[] = [];
  return { entries: array(trace)(value, "external.trace", issues) ?? [], issues };
}
export function readOrchestrationRecord(value: unknown): OrchestrationRecord | undefined {
  return outer(value, "external.orchestration", []);
}

export function readDiagnosticRun(value: unknown): { record: RunRecord; issues: RunReadIssue[] } {
  const issues: RunReadIssue[] = [];
  const record = run(value, "", issues) ?? {};
  // Required authority and execution arrays: distinguish absent from observed empty.
  const required: Array<[unknown, string]> = [
    [record.materializedCase?.semantic, "materializedCase.semantic"],
    [record.materializedCase?.semantic?.criteria, "materializedCase.semantic.criteria"],
    [record.finalSnapshot?.domainState?.intentDraft, "finalSnapshot.domainState.intentDraft"],
    [record.finalSnapshot?.domainState?.intentDraft?.criteria, "finalSnapshot.domainState.intentDraft.criteria"],
    [record.finalSnapshot?.domainState?.candidates, "finalSnapshot.domainState.candidates"],
    [record.finalSnapshot?.domainState?.readEvidence, "finalSnapshot.domainState.readEvidence"],
    [record.trajectories, "trajectories"],
  ];
  for (const [field, path] of required) if (field === undefined && !issues.some(issue => issue.path === path)) issues.push({ path, reason: "MISSING" });
  return { record, issues };
}
