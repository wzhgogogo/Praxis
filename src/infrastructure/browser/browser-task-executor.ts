import {BrowserVisibleProgress, visibleProgressKey, visibleActionKey, filledAuthoritativeField} from "./browser-visible-progress.js";
import {createHash} from "node:crypto";
import {isBrowserReadPathProhibited} from "./browser-read-policy.js";
import {normalizedTextKey} from "../../core/text-key.js";
import { setTimeout as wait } from "node:timers/promises";
import type { BrowserControlHint, BrowserPageControl, BrowserReadBoundary, BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError, type BrowserDeadlineScope, type BrowserRuntimeFailureCode } from "./browser-runtime-errors.js";
import {
  type BrowserReadAction,
  type BrowserReadActionDecisionPort,
  type BrowserReadGoal,
  type BrowserReadActionTarget,
  type BrowserReadHistoryStep,
  type BrowserReadDecisionInput,
  browserReadActionTargetReplayFingerprint,
  browserReadGroupReplayFingerprint,
  type BrowserActionWireRejection,
  BrowserReadDecisionError,
} from "./browser-action-decision.js";
import { loadBrowserReadSkills } from "./browser-read-skills.js";

export interface BrowserExecutionDiagnostic {
  candidateId?: string;
  source: string;
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY" | "FACTS";
  event: "CANDIDATE_STARTED" | "CANDIDATE_FINISHED" | "PROVIDER_STARTED" | "PROVIDER_FINISHED"
    | "SESSION_OPENING" | "SESSION_OPENED" | "SESSION_OPEN_FAILED"
    | "OPERATION_STARTED" | "OPERATION_FINISHED" | "OPERATION_FAILED"
    | "MODEL_DECISION_STARTED" | "MODEL_DECISION_FINISHED" | "MODEL_DECISION_FAILED"
    | "BUDGET_EXHAUSTED"
    | "OBSERVED" | "SKILL_STARTED" | "METHOD_INCOMPLETE" | "SOURCE_STRUCTURE_CHANGED" | "MODEL_WIRE" | "MODEL_ACTION" | "MODEL_STOP" | "ASYNC_WAIT" | "POST_ACTION_VERIFIED" | "REJECTED" | "CLOSED";
  elapsedMs: number;
  effectiveLimits?: BrowserReadLimits;
  /** Executor lifecycle accounting. `FINISHED` means the scope returned to its adapter, not an availability assertion. */
  lifecycle: {
    outcome: "STARTED" | "FINISHED" | "FAILED" | "ABANDONED";
    candidateElapsedMs: number;
    providerElapsedMs: number;
    candidateModelCalls: number;
    providerModelCalls: number;
    candidateRuntimeOperations: number;
    providerRuntimeOperations: number;
    runModelCalls: number;
    scope?: BrowserDeadlineScope;
    reason?: BrowserExecutionReason;
    failureCode?: BrowserRuntimeFailureCode;
  };
  url?: string;
  detail?: string;
  /** Failure evidence from the installed source Guard, not matching/availability evidence. */
  networkFailures?: import("./browser-runtime.js").BrowserReadNetworkObservation[];
  /** Wall time of this bounded readiness wait; not cumulative executor time. */
  waitMs?: number;
  settlement?: import("./browser-runtime.js").BrowserSettlementDiagnostics;
  observation?: {
    title: string;
    visibleTextExcerpt: string;
    targets: Array<Pick<BrowserReadActionTarget, "ref" | "kind" | "label" | "href">>;
  };
}

export type BrowserExecutionReason = "ADAPTER_RETURNED" | "SOURCE_SCOPE_REPLACED" | "EXECUTOR_CLOSED" | "PARENT_ABORTED"
  | "DEADLINE_EXCEEDED" | "NAVIGATION_BUDGET_EXHAUSTED" | "MODEL_BUDGET_EXHAUSTED" | "OPERATION_BUDGET_EXHAUSTED"
  | "RUNTIME_UNAVAILABLE" | "RUNTIME_FAILURE" | "OPERATION_FAILED";

export interface BrowserReadLimits {
  maxModelCallsPerCandidate: number;
  maxModelCallsTotal: number;
  maxOperationsPerCandidate: number;
  maxAutomaticElapsedMs: number;
  /** Per model-selected advance action; also bounded by the shared operation budget. */
  maxAdvanceStepsPerAction?: number;
  maxElapsedMsPerCandidate?: number;
  maxElapsedMsPerProvider?: number;
}

export interface BrowserTaskExecutorOptions extends BrowserReadLimits {
  /** One read-run owner may retain an anonymous session per source. */
  reuseSourceSessions?: boolean;
  modelDecision?: BrowserReadActionDecisionPort;
  /** Bounds all browser work for an outlet across source fallback. */
  maxElapsedMsPerCandidate?: number;
  /** Bounds one provider path without resetting the candidate-wide budget. */
  maxElapsedMsPerProvider?: number;
  onDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void;
  /** Shared only by one Live availability composition, never process-global. */
  budget?: BrowserExecutionBudget;
}

/** Cumulative browser-model budget for one outer availability run. */
export interface BrowserExecutionBudget {
  totalModelCalls: number;
  /** Shared run ceiling used by availability and website fact reads. */
  maxModelCalls?: number;
}

export type BrowserCompletionAssessment =
  | { complete: true; reason: string; resultKey: string; resultBusy: boolean; resultUrls?: readonly string[]; confirmedFields?: readonly ("DATE" | "PARTY_SIZE")[] }
  | { complete: false; reason: string; resultKey?: string; resultBusy?: boolean; resultUrls?: readonly string[]; confirmedFields?: readonly ("DATE" | "PARTY_SIZE")[] };

export interface BrowserSkillReadInput {
  taskId: string;
  source: string;
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY" | "FACTS";
  session: BrowserSession;
  signal: AbortSignal;
  allowedOrigins: readonly string[];
  /** Complete Router-bound target; model guidance cannot alter it. */
  goal: BrowserReadGoal;
  objective: string | ((targets: readonly BrowserReadActionTarget[]) => string);
  /** Pack-owned source guidance; the browser core never chooses a site skill. */
  sourceSkillPath?: string;
  /** Current method result; it is context for continuation, never a provider failure by itself. */
  methodReason?: string;
  /** Search completion is a model choice followed by the ordinary result check. */
  requireModelConfirmation?: boolean;
  controlHints?(snapshot: Readonly<BrowserSnapshot>): readonly BrowserControlHint[];
  onObservation?(value: Pick<BrowserReadDecisionInput["observation"], "revision" | "url" | "targets">): void;
  /** Internal evidence of an actually dispatched, guarded public query. */
  onQuerySubmitted?(owner: string): void;
  /** Code-owned cut immediately before a validated observed button click. */
  onBeforeClick?(snapshot: BrowserSnapshot, target: BrowserReadActionTarget): void | (() => void);
  /** Fired only after the chosen option is read back on the same observed owner. */
  onOptionConfirmed?(field: Extract<BrowserReadAction, {type:"CHOOSE_OPTION"}>["field"], label: string): void;
  /** Current same-session observation already captured by the source caller; no intervening action. */
  initialObservation?: { snapshot: BrowserSnapshot; controls: BrowserPageControl[] };
  /** Explicitly false only when completion validates the captured source without live controls. */
  completionUsesControls?: boolean;
  completion(snapshot: BrowserSnapshot, controls: BrowserPageControl[]): BrowserCompletionAssessment;
}

export interface BrowserGenericReadResult {
  scopeQuote?: {ref:string;text:string;url:string};
  reasonCode?: string;
  /** Source handoff only; adapter must still inspect identity on this page. */
  sourceHandoff?: {url:string;pageId:string};
  status: "COMPLETED" | "MODEL_HANDOFF" | "REQUESTED_HUMAN_HELP" | "NO_SAFE_ACTION" | "BUDGET_EXCEEDED" | "MODEL_FAILURE";
  snapshot: BrowserSnapshot;
  /** Terminal live controls, or empty after an explicitly snapshot-only completion. */
  controls: BrowserPageControl[];
}

interface ObservedTarget extends BrowserReadActionTarget { controlId: string; stableKey: string; controlGroupKey?: string; nativeTag?: string; readOnly?: boolean; inputName?: string; optionNative?: boolean; optionOwnerId?: string; ownerStableKey?: string; radioGroupKey?: string; retrievalValue?: string; }

interface Observation {
  revision: number;
  snapshot: BrowserSnapshot;
  controls: BrowserPageControl[];
  targets: Map<string, ObservedTarget>;
}

function matchesAuthoritativeControl(
  target: Pick<ObservedTarget, "label" | "value" | "selected" | "role">,
  field: "DATE" | "PARTY_SIZE" | "TIME",
  goal: BrowserReadGoal,
): boolean {
  const normalized = target.label.replace(/\s+/g, " ").trim().toLowerCase();
  if (field === "TIME") {
    const clock = observedClock(target.label) ?? observedClock(target.value ?? "");
    return target.role === "option" && clock !== undefined && goal.timeWindow !== undefined
      && clock >= goal.timeWindow.earliest && clock <= goal.timeWindow.latest;
  }
  if (field === "PARTY_SIZE") {
    if (goal.partySize === undefined) return false;
    const quantities = normalized.match(/\d+\+?/g) ?? [];
    if (quantities.length && (quantities.length !== 1 || quantities[0] !== String(goal.partySize))) return false;
    return String(target.value ?? "") === String(goal.partySize)
      || (new RegExp(`(?:^|\\D)${goal.partySize}(?:\\D|$)`).test(normalized)
      && /(?:guest|guests|people|persons|名|人)/i.test(normalized));
  }
  if (!goal.date) return false;
  const [year, month, day] = goal.date.split("-").map(Number);
  if (!year || !month || !day) return false;
  if (normalizeObservedIsoDate(target.value) === goal.date || normalized.includes(goal.date)) return true;
  const englishMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day))).toLowerCase();
  return new RegExp(`\\b${englishMonth}\\.?\\s+${day}(?:st|nd|rd|th)?\\b`, "i").test(normalized)
    || new RegExp(`${month}月\\s*${day}日`).test(normalized);
}

function observedClock(value: string): string | undefined {
  const clock = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)?$/i);
  if (!clock) return undefined;
  let hour = Number(clock[1]);
  if (clock[3]) {
    if (hour < 1 || hour > 12) return undefined;
    hour = hour % 12 + (clock[3].toUpperCase() === "PM" ? 12 : 0);
  }
  return `${String(hour).padStart(2, "0")}:${clock[2]}`;
}

/** Public calendar widgets commonly expose `YYYY-M-D`; normalize only a complete numeric ISO date. */
function normalizeObservedIsoDate(value: string | undefined): string | undefined {
  const match = value?.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return undefined;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return `${match[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function safeText(value: string, limit = 4_000): string {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function safeErrorDetail(error: unknown, limit = 360): string {
  const cause = error instanceof BrowserRuntimeError && error.cause instanceof Error ? `: ${error.cause.message}` : "";
  const message = error instanceof Error ? `${error.message}${cause}` : "Browser action rejected";
  return safeText(message.replace(/(?:authorization|bearer|api[_-]?key|token)\s*[:=]\s*\S+/ig, "$1=<redacted>"), limit);
}

/** Invalid action wires are model input, so trace only the fixed diagnostic projection. */
function safeWireRejectionDetail(rejection: BrowserActionWireRejection | undefined): string {
  if (!rejection) return "MODEL_WIRE_REJECTED";
  return `MODEL_WIRE_REJECTED:${JSON.stringify({
    action: rejection.action,
    targetRef: rejection.targetRef,
    authoritativeField: rejection.authoritativeField,
    requestedState: rejection.requestedState,
    fieldPath: rejection.fieldPath,
    valueType: rejection.valueType,
    reason: rejection.reason,
  })}`;
}

/** Playwright includes this stable actionability class when a visible layer owns the click point. */
function pointerObstruction(error: unknown): boolean {
  const cause = error instanceof BrowserRuntimeError && error.cause instanceof Error ? error.cause.message : "";
  const message = error instanceof Error ? `${error.message} ${cause}` : "";
  return /(?:intercepts pointer events|would receive the pointer event|another element would receive)/i.test(message);
}

const nonSubmittingOptionTags = new Set([
  "DIV",
  "LI",
  "SPAN",
]);

function isSuggestionButton(target: Pick<BrowserReadActionTarget, "kind" | "role">): boolean {
  return target.kind === "BUTTON" && target.role === "option";
}

function toObservedTargets(controls: BrowserPageControl[], revision: number, exposeSuggestions = false): Map<string, ObservedTarget> {
  const targets = new Map<string, ObservedTarget>();
  const controlRefs = new Map<string, string>();
  const groupRefs = new Map<string, string>();
  const suggestions = new Set(controls.filter(control => exposeSuggestions && isSuggestionButton(control)
    && !control.optionOwnerId && control.visible && !control.disabled && !control.blockedByActiveLayer
    && nonSubmittingOptionTags.has(control.structure?.tag ?? "")));
  const suggestionCounts = new Map<string, Map<string, number>>();
  for (const control of suggestions) {
    const groupKey = control.controlGroupKey ?? "";
    const counts = suggestionCounts.get(groupKey) ?? new Map<string, number>();
    const label = normalizedTextKey(control.label);
    counts.set(label, (counts.get(label) ?? 0) + 1);
    suggestionCounts.set(groupKey, counts);
  }
  for (const control of controls) {
    if (!control.visible || control.blockedByActiveLayer || (control.kind === "LINK" && !control.href)) continue;
    const suggestion = suggestions.has(control)
      && suggestionCounts.get(control.controlGroupKey ?? "")?.get(normalizedTextKey(control.label)) === 1;
    if (control.observationOnly && !control.calendarDate && !suggestion) continue;
    const groupKey = control.controlGroupLabel !== "Unlabelled group" ? control.controlGroupKey : undefined;
    if (groupKey && !groupRefs.has(groupKey)) groupRefs.set(groupKey, `observation:${revision}:group:${groupRefs.size + 1}`);
    const group = groupKey ? { controlGroupKey: groupKey, controlGroupRef: groupRefs.get(groupKey)! } : {};
    const ref = `observation:${revision}:target:${targets.size + 1}`;
    const valueText = control.valueText ?? control.selectionReadback?.displayText;
    controlRefs.set(control.id, ref);
    targets.set(ref, {
      ref, controlId: control.id, stableKey: control.stableKey, ...(control.formObservation ? { formObservation: control.formObservation } : {}), ...(control.structure ? { nativeTag: control.structure.tag, ...(control.structure.name ? { inputName: control.structure.name } : {}) } : {}),
      kind: control.role === "option" && !suggestion ? "OPTION" : control.kind, role: control.role, label: control.label,
      controlGroupLabel: control.controlGroupLabel ?? "Unlabelled group",
      ...group,
      ...(control.labelSource ? { labelSource: control.labelSource } : {}),
      ...(control.kind === "RADIO" && control.structure?.radioGroupKey ? { radioGroupKey: control.structure.radioGroupKey } : {}),
      ...(control.value ? { value: control.value } : {}), ...(control.href ? { href: control.href } : {}), ...(control.formMethod ? { formMethod: control.formMethod } : {}), ...(control.type ? { type: control.type } : {}), ...(control.selected ? { selected: true } : {}),
      ...(control.calendarDate ? { calendarDate: control.calendarDate } : {}),
      ...(control.readOnly ? { readOnly: true } : {}), ...(control.disabled ? { disabled: true } : {}), ...(control.optionOwnerId ? { optionOwnerId: control.optionOwnerId } : {}),
      ...(control.outsideViewport ? { outsideViewport: true } : {}), ...(control.checked !== undefined ? { checked: control.checked } : {}), ...(control.min ? { min: control.min } : {}), ...(control.max ? { max: control.max } : {}), ...(valueText ? {valueText} : {}), ...(control.scrollable !== undefined ? { scrollable: control.scrollable } : {}), ...(control.scrollTop !== undefined ? { scrollTop: control.scrollTop } : {}), ...(control.blockedByActiveLayer ? { blockedByActiveLayer: true } : {}), ...(control.options ? { options: control.options } : {}),
    });
    if (control.kind === "SELECT" && !control.disabled) {
      for (const option of control.options ?? []) {
        const optionRef = `observation:${revision}:target:${targets.size + 1}`;
        targets.set(optionRef, {
          ref: optionRef, kind: "OPTION", role: "option", label: option.label, value: option.value,
          controlGroupLabel: control.controlGroupLabel ?? "Unlabelled group",
          ...group,
          selected: option.selected, disabled: option.disabled, ownerRef: ref,
          controlId: control.id, optionOwnerId: control.id, optionNative: true,
          ownerStableKey: control.stableKey,
          stableKey: `${control.stableKey}|option|${option.value}`,
        });
      }
    }
  }
  for (const target of targets.values()) {
    if (target.kind !== "OPTION" || target.optionNative) continue;
    if (target.optionOwnerId) {
      const ownerRef = controlRefs.get(target.optionOwnerId);
      if (ownerRef) {
        target.ownerRef = ownerRef;
        const ownerStableKey = targets.get(ownerRef)?.stableKey;
        if (ownerStableKey) target.ownerStableKey = ownerStableKey;
      }
    }
  }
  for (const [ref, target] of targets) {
    if (target.kind === "OPTION" && (target.disabled || !target.ownerRef)) targets.delete(ref);
  }
  return targets;
}

/**
 * A bounded, reusable browser session for one Restaurant availability read.
 * It deliberately has no Restaurant evidence or State knowledge.
 */
export class BrowserTaskExecutor {
  private sessionSource: BrowserExecutionDiagnostic["source"] | undefined;
  private readonly parkedSessions = new Map<BrowserExecutionDiagnostic["source"], {session:BrowserSession;signal:AbortSignal|undefined;cleanup:(()=>void)|undefined;unsettled:boolean}>();
  private readonly startedSessions = new WeakSet<BrowserSession>();
  private session: BrowserSession | undefined;
  private sessionSignal: AbortSignal | undefined;
  private sessionAbortCleanup: (() => void) | undefined;
  private operationCount = 0;
  private modelCalls = 0;
  private readonly budget: BrowserExecutionBudget;
  private candidateId: string | undefined;
  private candidateStartedAt = Date.now();
  private providerStartedAt = Date.now();
  private providerModelCallsAtStart = 0;
  private providerOperationCountAtStart = 0;
  private activeLifecycle: Pick<BrowserExecutionDiagnostic, "source" | "stage"> | undefined;
  private candidateLifecycleOpen = false;
  private providerLifecycleOpen = false;
  private observationRevision = 0;
  private pageUnsettled = false;
  private readonly startedAt = Date.now();

  constructor(private readonly runtime: BrowserRuntime, private readonly options: BrowserTaskExecutorOptions) {
    for (const key of ["maxModelCallsPerCandidate", "maxModelCallsTotal", "maxOperationsPerCandidate", "maxAutomaticElapsedMs"] as const) {
      if (!Number.isSafeInteger(options[key]) || options[key] <= 0) throw new TypeError(`Explicit positive browser limit required: ${key}`);
    }
    this.budget = options.budget ?? { totalModelCalls: 0 };
  }

  /** A source fallback for the same outlet shares its budget; a new outlet starts a new bounded unit. */
  beginCandidate(candidateId: string): void {
    if (this.candidateId === candidateId) return;
    this.finishProvider("ABANDONED", "SOURCE_SCOPE_REPLACED");
    this.finishCandidate("FINISHED", "ADAPTER_RETURNED");
    this.candidateId = candidateId;
    this.operationCount = 0;
    this.modelCalls = 0;
    this.candidateStartedAt = Date.now();
    this.providerStartedAt = this.candidateStartedAt;
  }

  /** A source fallback receives a fresh provider window, never a fresh candidate budget. */
  beginProvider(
    candidateId: string,
    source: BrowserExecutionDiagnostic["source"],
    stage: BrowserExecutionDiagnostic["stage"] = "DISCOVERY",
  ): void {
    if (this.candidateId !== candidateId) this.beginCandidate(candidateId);
    this.finishProvider("ABANDONED", "SOURCE_SCOPE_REPLACED");
    this.providerStartedAt = Date.now();
    this.providerModelCallsAtStart = this.modelCalls;
    this.providerOperationCountAtStart = this.operationCount;
    this.activeLifecycle = { source, stage };
    this.ensureLifecycle(source, stage);
  }

  /** Adapters finish their own source attempt; this never asserts an availability result. */
  endProvider(outcome: "FINISHED" | "FAILED" | "ABANDONED" = "FINISHED", reason: BrowserExecutionReason = "ADAPTER_RETURNED"): void {
    this.finishProvider(outcome, reason);
  }

  /** Preserve the original per-read candidate window while retaining only the
   * source contexts. A new call is a new checkpoint, not a fresh run budget. */
  endReadScope():void {
    this.finishProvider("FINISHED","ADAPTER_RETURNED");
    this.finishCandidate("FINISHED","ADAPTER_RETURNED");
    this.candidateId=undefined;
  }

  /** A source validator reports required field/types only, never response values. */
  reportSourceStructureChanged(input: Pick<BrowserSkillReadInput, "source" | "stage"> & {
    url: string; observedAt: string; issue: { field: string; expected: string; actual: string };
  }): void {
    const page = URL.parse(input.url), observedAt = Date.parse(input.observedAt);
    this.record({ source: input.source, stage: input.stage, event: "SOURCE_STRUCTURE_CHANGED",
      ...(page ? { url: page.origin + page.pathname } : {}),
      detail: JSON.stringify({ ...(Number.isFinite(observedAt) ? { observedAt: new Date(observedAt).toISOString() } : {}), ...input.issue }) });
  }

  private networkPolicy: BrowserReadNetworkPolicy | undefined;

  async acquire(signal: AbortSignal, source: BrowserExecutionDiagnostic["source"], stage: BrowserExecutionDiagnostic["stage"], networkPolicy?: BrowserReadNetworkPolicy, preserveProviderWindow = false): Promise<BrowserSession> {
    if (this.options.reuseSourceSessions && this.sessionSource !== source) {
      if (this.session && this.sessionSource) this.parkedSessions.set(this.sessionSource, {
        session:this.session,signal:this.sessionSignal,cleanup:this.sessionAbortCleanup,unsettled:this.pageUnsettled,
      });
      const parked=this.parkedSessions.get(source);
      this.parkedSessions.delete(source);
      this.session=parked?.session;this.sessionSignal=parked?.signal;this.sessionAbortCleanup=parked?.cleanup;
      this.pageUnsettled=parked?.unsettled??false;
      this.sessionSource=source;
    }
    this.ensureLifecycle(source, stage, preserveProviderWindow);
    try {
      this.assertActive(signal);
    } catch (error) {
      this.recordLifecycleFailure(source, stage, "SESSION_OPEN_FAILED", error);
      this.finishProvider(error instanceof BrowserRuntimeError && error.code === "BROWSER_ABORTED" ? "ABANDONED" : "FAILED", this.reasonForFailure(error));
      throw error;
    }
    if (networkPolicy) this.networkPolicy = networkPolicy;
    if (this.session) return this.session;
    // Session acquisition is provider work too. Race it against the candidate
    // deadline without passing a disposable candidate timer into the runtime:
    // several runtimes retain their input signal for the session lifetime, and
    // that would otherwise close a shared session during a later candidate.
    const timeoutMs = Math.max(1, this.remaining(Number.MAX_SAFE_INTEGER));
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    let rejectAbort: ((reason: BrowserRuntimeError) => void) | undefined;
    this.record({ source, stage, event: "SESSION_OPENING", detail: "OPEN_SESSION" });
    const opening = Promise.resolve().then(() => this.runtime.openSession({ signal, ...(networkPolicy ? { networkPolicy } : {}) }));
    const deadline = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        reject(new BrowserRuntimeError("BROWSER_TIMEOUT", `Browser session creation exceeded the ${this.deadlineScope()} deadline`));
      }, timeoutMs);
    });
    const parentAbort = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
    const onAbort = () => rejectAbort?.(new BrowserRuntimeError("BROWSER_ABORTED", "Browser session creation was aborted"));
    signal.addEventListener("abort", onAbort, { once: true });
    let session: BrowserSession;
    try {
      session = await Promise.race([opening, deadline, parentAbort]);
      this.assertActive(signal);
    } catch (error) {
      if (timedOut || signal.aborted) {
        void opening.then((lateSession) => lateSession.close()).catch(() => undefined);
      }
      const failure = signal.aborted
        ? new BrowserRuntimeError("BROWSER_ABORTED", "Browser session creation was aborted", error)
        : error;
      this.recordLifecycleFailure(source, stage, "SESSION_OPEN_FAILED", failure, timedOut ? "DEADLINE_EXCEEDED" : undefined);
      if (signal.aborted) this.finishProvider("ABANDONED", "PARENT_ABORTED");
      else this.finishProvider("FAILED", this.reasonForFailure(failure, timedOut ? "DEADLINE_EXCEEDED" : undefined));
      throw failure;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      signal.removeEventListener("abort", onAbort);
    }
    this.sessionSignal = signal;
    if (signal.aborted) {
      await session.close();
      throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser session creation was aborted");
    }
    if (networkPolicy && session.metadata.readNetworkBoundary !== "INSTALLED") {
      await session.close();
      const failure = new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Browser runtime did not install the required read network boundary");
      this.recordLifecycleFailure(source, stage, "SESSION_OPEN_FAILED", failure);
      this.finishProvider("FAILED", this.reasonForFailure(failure));
      throw failure;
    }
    this.session = session;
    const onSessionAbort = () => {
      if (this.session === session) void this.close("PARENT_ABORTED");
      else if (this.parkedSessions.get(source)?.session === session) {
        this.parkedSessions.get(source)?.cleanup?.();
        this.parkedSessions.delete(source);
        void session.close().catch(()=>undefined);
      }
    };
    signal.addEventListener("abort", onSessionAbort, { once: true });
    this.sessionAbortCleanup = () => signal.removeEventListener("abort", onSessionAbort);
    this.record({ source, stage, event: "SESSION_OPENED", detail: session.metadata.runtimeProvider });
    return session;
  }

  /** The source-pack seed is the only navigation made without a current model
   * action. A named query may reopen that reviewed entrance when the current page lacks search controls. */
  async start(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal" | "allowedOrigins"> & { session: BrowserSession; url: string; timeoutMs?: number; reopen?: boolean }): Promise<void> {
    if (this.startedSessions.has(input.session) && !input.reopen) return;
    const url = this.allowedUrl(input.url, input.allowedOrigins);
    if (!url || !this.networkPolicy?.startupDocuments?.includes(url)) throw this.rejected(input.source, input.stage, "The source start is not configured");
    this.startedSessions.add(input.session);
    await this.operation(input, "NAVIGATE", async () => {
      await input.session.prepareNavigation?.(url, this.navigationOptions(input.timeoutMs));
      await input.session.navigate(url, { ...this.navigationOptions(input.timeoutMs), waitUntil: "domcontentloaded" });
    });
    await this.settleAfterDirectAction(input);
  }

  /** Open only a source-provided exact URL (or the configured first seed).
   * The caller binds its provenance; the Guard still admits every request,
   * actual redirect and response. No URL pattern selects a destination. */
  async navigate(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal" | "allowedOrigins"> & { session: BrowserSession; url: string; observed?: boolean; timeoutMs?: number }): Promise<void> {
    const url = this.allowedUrl(input.url, input.allowedOrigins);
    if (!url || isBrowserReadPathProhibited(this.networkPolicy, url)) throw this.rejected(input.source, input.stage, "Source document is outside the read scope");
    if (!input.observed && !(this.networkPolicy?.startupDocuments?.includes(url) && !this.startedSessions.has(input.session))) {
      throw this.rejected(input.source, input.stage, "Navigation requires an exact source-observed URL or the configured first seed");
    }
    await this.operation(input, "NAVIGATE", async () => {
      const options = this.navigationOptions(input.timeoutMs);
      if (input.observed && input.session.prepareObservedNavigation) await input.session.prepareObservedNavigation(url, options);
      else await input.session.prepareNavigation?.(url, options);
      await input.session.navigate(url, { ...this.navigationOptions(input.timeoutMs), waitUntil: "domcontentloaded" });
    });
    this.startedSessions.add(input.session);
    await this.settleAfterDirectAction(input);
  }

  /** Query wording comes from G4; all UI steps, including reuse of an already
   * loaded page, are chosen by the ordinary observation loop. */
  async search(input: Pick<BrowserSkillReadInput, "source" | "signal" | "allowedOrigins" | "sourceSkillPath"> & { session: BrowserSession; url: string; query: string; querySource?: "SPECIFIC_OUTLET" | "G4_SOURCE_TERM"; completion: BrowserSkillReadInput["completion"] }): Promise<BrowserGenericReadResult> {
    const scoped = { ...input, stage: "DISCOVERY" as const };
    const seeds = (this.networkPolicy?.startupDocuments ?? []).filter(seed => input.allowedOrigins.includes(new URL(seed).origin));
    if (seeds.length !== 1) throw this.rejected(input.source, "DISCOVERY", "Source start is missing or ambiguous");
    if (!this.startedSessions.has(input.session)) await this.start({ ...scoped, url: seeds[0]! });
    else {
      const current = await this.snapshot(scoped), controls = await this.observeControls(scoped);
      // Public semantic search controls or a text field in an observed GET
      // form may be reused. A previous detail/no-control result is not an entry.
      const queryControls = controls.filter(c => c.visible && !c.disabled && c.kind === "INPUT" && (!c.type || ["text","search"].includes(c.type)));
      const hasSearch = queryControls.some(c => c.role === "searchbox" || c.type === "search"
        || c.formObservation && controls.some(submit => submit.visible && !submit.disabled && submit.formMethod === "GET" && submit.formObservation?.owner === c.formObservation!.owner)
        || current.url === seeds[0]);
      if (!hasSearch) await this.start({ ...scoped, url: seeds[0]!, reopen: true });
    }
    const queryFields = new Set<string>();
    let queryConflict = false;
    let queryBound = false;
    let currentIsResult = false;
    let initialRequestCount: number | undefined;
    const queryKey = normalizedTextKey(input.query);
    let selected: {boundary: BrowserReadBoundary; url: string} | undefined;
    let handoff:BrowserGenericReadResult["sourceHandoff"];

    const result = await this.runSkill({ ...scoped, taskId: "observed-source-query", requireModelConfirmation: true,
      goal: { outlet: { name: input.query }, retrievalExpression: input.query, retrievalSource: input.querySource ?? "G4_SOURCE_TERM", hardCriteria: [] },
      objective: targets => {
        const selection = input.sourceSkillPath || selected || targets.some(isSuggestionButton)
          ? "If one offered suggestion uniquely identifies the requested outlet, click it once and stop at the settled destination page. Area and cuisine subtitles may describe the same outlet. Do not choose a different branch or guess between ambiguous duplicates."
          : "If the source instead presents one visible enabled suggestion BUTTON whose full label exactly equals the query, select it once and stop at the settled destination page.";
        return `Submit the authoritative query through observed public search controls and stop at its result LIST. ${selection} Do not open ordinary individual restaurant cards or unrelated recommendations. Code inspects identities after either source handoff with its shared detail limit. If this term has no matching option and no matching route, REQUEST_HUMAN_HELP ends this method; the caller owns any next approved retrieval term, not the browser model.`;
      },
      onBeforeClick: ({pageId, url}, target) => {
        selected = undefined;
        if (!isSuggestionButton(target)) return;
        const boundary = input.session.readBoundary?.();
        if (boundary && boundary.pageId === pageId) return () => { selected = {boundary, url}; };
      },
      completion: (page, controls) => {
        handoff=undefined;
        const requests = page.networkRequests ?? [];
        initialRequestCount ??= requests.length;
        const assessment = input.completion(page, controls);
        queryConflict = false;
        queryBound = false;
        const current = new URL(page.url);
        const hash = (value: string) => createHash("sha256").update(value).digest("hex");
        const fields = [...current.searchParams].map(([key, value]) => ({ key, valueSha256: hash(value) }));
        const multiset = (values: readonly {key: string; valueSha256: string}[]) => JSON.stringify(values.map(value => [value.key, value.valueSha256]).sort());
        for (const request of requests.slice(initialRequestCount)) {
          const receipt = request.formSubmission;
          if (request.outcome !== "ADMITTED" || request.method !== "GET" || request.resourceType !== "document" || !receipt
            || receipt.documentOrigin !== current.origin || receipt.actionOrigin !== current.origin
            || receipt.actionPathname !== current.pathname || request.origin !== current.origin || request.pathname !== current.pathname
            || multiset(receipt.fields) !== multiset(fields)) continue;
          for (const [key, value] of current.searchParams) {
            if (normalizedTextKey(value) === queryKey && receipt.fields.some(field => field.key === key && field.valueSha256 === hash(value))) {
              queryFields.add(key);
              queryBound = true;
            }
          }
        }
        const scope=input.session.readBoundary?.();
        if(selected&&scope?.readScopeId===selected.boundary.readScopeId&&page.pageId===selected.boundary.pageId
          &&current.origin===new URL(selected.url).origin&&current.pathname!==new URL(selected.url).pathname
          &&page.settlement!=="PENDING"&&!assessment.resultBusy&&!/(?:^|\/)(?:not-found|404|error)(?:\/|$)/i.test(current.pathname)){
          const completed=requests.some(request=>{
            const receipt=request.dynamicRead,rule=receipt&&this.networkPolicy?.dynamicReads[receipt.ruleIndex];
            if(!receipt||!rule||request.outcome!=="ADMITTED"||request.method!=="GET"||!["fetch","xhr"].includes(request.resourceType)
              ||receipt.status!==200||receipt.completedAt<receipt.startedAt||receipt.readScopeId!==scope.readScopeId||receipt.pageId!==page.pageId
              ||receipt.requestSequence<=selected!.boundary.requestSequence||new URL(request.origin).origin!==rule.origin)return false;
            return rule.pathname!==undefined?rule.pathname===request.pathname:rule.pathnamePattern!==undefined
              ?rule.pathnamePattern.startsWith("^")&&rule.pathnamePattern.endsWith("$")&&new RegExp(rule.pathnamePattern).test(request.pathname)
              :Boolean(rule.pathnamePrefix&&request.pathname.startsWith(rule.pathnamePrefix));
          });
          if(completed){queryBound=true;handoff={url:page.url,pageId:page.pageId!};}
        }
        const resultKeys = new Set((assessment.resultUrls ?? []).map(value => { const url = new URL(value, page.url); return url.origin + url.pathname; }));
        currentIsResult = !handoff && queryBound && resultKeys.has(current.origin + current.pathname);
        const resultHrefs = (controls ?? []).flatMap(control => {
          if (control.kind !== "LINK" || !control.href) return [];
          try { const url = new URL(control.href, page.url); return resultKeys.has(url.origin + url.pathname) ? [control.href] : []; }
          catch { return []; }
        });
        for (const value of [page.url, ...assessment.resultUrls ?? [], ...resultHrefs]) {
          try {
            const observed = new URL(value, page.url);
            if (observed.origin !== new URL(page.url).origin) continue;
            for (const field of queryFields) {
              const values = observed.searchParams.getAll(field);
              if (values.some(value => normalizedTextKey(value) !== queryKey)) queryConflict = true;
            }
          } catch { queryConflict = true; }
        }
        return queryConflict ? { ...assessment, complete: false, reason: "Observed result query contradicts the authoritative input in the observed source form" }
          : handoff ? {complete:true,resultKey:JSON.stringify(handoff),resultBusy:false,reason:"Selected source suggestion, same-tab path change, SETTLED page and current completed reviewed GET (200) hand off to adapter identity inspection"}
          : !queryBound ? { ...assessment, complete: false, reason: "No positive source result binding to the current authoritative query has been observed" }
          : currentIsResult ? { ...assessment, complete: false, reason: "The current document is an individual result, not the submitted result list; code inspects identities after list completion" } : assessment;
      } });
    // A stopped observation is not an identity or inventory verdict. Return
    // its current page to the adapter so explicit empty/error/challenge facts
    // retain their own diagnostic and fallback contract. Actual budget errors
    // still stop the shared run; no navigation or extra model call is added.
    if (result.status === "BUDGET_EXCEEDED") throw new BrowserRuntimeError("BROWSER_BUDGET_EXHAUSTED", "Source search exhausted its existing browser budget");
    return queryConflict ? { ...result, reasonCode: "OBSERVED_QUERY_CONFLICT" }
      : !queryBound ? { ...result, reasonCode: "OBSERVED_QUERY_UNBOUND" }
      : currentIsResult ? { ...result, reasonCode: "OBSERVED_QUERY_NOT_LIST" } : result.status==="COMPLETED"&&handoff?{...result,sourceHandoff:handoff}:result;
  }

  /** Code-owned source retry delay shares the current operation and wall-time budgets. */
  async waitForSourceRetry(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal">, delayMs: number): Promise<void> {
    await this.operation(input, "WAIT_FOR_SOURCE_RETRY", () => wait(delayMs, undefined, { signal: input.signal }));
  }

  private async settleAfterDirectAction(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession }): Promise<void> {
    await this.waitForSettled(input, { url: "", title: "", text: "", html: "" }, false);
  }

  async snapshot(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession }): Promise<BrowserSnapshot> {
    const snapshot = await this.operation(input, "SNAPSHOT", () => input.session.snapshot());
    this.record({ source: input.source, stage: input.stage, event: "OBSERVED", url: snapshot.url });
    return this.pageUnsettled ? { ...snapshot, settlement: "PENDING" } : snapshot;
  }

  /** Reuse an already captured current page; settle before inspecting controls.
   * A failed bounded wait leaves the snapshot PENDING and all completion gates intact. */
  async settledSnapshot(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & {session:BrowserSession}, previous?:BrowserSnapshot):Promise<BrowserSnapshot> {
    const current=previous ?? await this.snapshot(input);
    if (!this.pageUnsettled && current.settlement !== "PENDING") return current;
    await this.waitForSettled(input,current);
    return this.snapshot(input);
  }

  /** Reads the current source controls through the same operation/deadline budget as a skill observation. */
  async observeControls(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession }): Promise<BrowserPageControl[]> {
    if (!input.session.observeControls) return [];
    return this.operation(input, "OBSERVE_CONTROLS", () => input.session.observeControls!());
  }

  /** One bounded readiness observation, using the unchanged browser settlement
   * predicate and provider deadline. A still-pending page remains pending. */
  async reobservePageOnce(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & {session:BrowserSession}, previous?:BrowserSnapshot):Promise<BrowserSnapshot> {
    previous ??= await this.snapshot(input);
    await this.waitForSettled(input,previous);
    return this.snapshot(input);
  }

  /** G1 alone proves current prose readiness; global settlement keeps its
   * original loader and short-request semantics for interactive workflows. */
  async verifyPageContent(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & {session: BrowserSession}, previous: BrowserSnapshot): Promise<BrowserSnapshot> {
    await this.operation(input, "VERIFY_RESULT_STABILITY", () => new Promise<void>(resolve => setTimeout(resolve, 500)));
    const current = await this.snapshot(input);
    const ready = (page: BrowserSnapshot) => {
      const d = page.settlementDiagnostics;
      return Boolean(page.text.trim()) && !(page.settlement === "PENDING" && !d)
        && !d?.blockingDataRequests && !["document", "xhr", "fetch"].some(type => (d?.pendingByType[type] ?? 0) > 0)
        && !(d?.contentBusySelectors ?? d?.busySelectors)?.length;
    };
    const stable = current.url === previous.url && current.pageId === previous.pageId && current.text === previous.text;
    // Runtime flags describe only the fresh snapshot; static providers may
    // explicitly report changes inside their current observation window.
    const changing = !stable || Boolean(previous.settlementDiagnostics?.visibleTextChanging || current.settlementDiagnostics?.visibleTextChanging);
    return {...current, settlement: !changing && ready(previous) && ready(current) ? "SETTLED" : "PENDING",
      ...(current.settlementDiagnostics ? {settlementDiagnostics: {...current.settlementDiagnostics, visibleTextChanging: changing}} : {})};
  }

  async runSkill(input: BrowserSkillReadInput): Promise<BrowserGenericReadResult> {
    input.session.beginReadScope?.();
    let modelConfirmed = false;
    const assess = async (current: BrowserSnapshot, controls: BrowserPageControl[], options: { skipControlObserve?: boolean } = {}): Promise<BrowserCompletionAssessment> => {
      if (!options.skipControlObserve && this.disabledRequestedParty(input, {snapshot: current, controls, targets: toObservedTargets(controls, 0), revision: 0})) return {complete: false as const, reason: "PARTY_SIZE_NOT_SELECTABLE"};
      const pending: BrowserCompletionAssessment = { complete: false, reason: "Page is still loading after its bounded settlement wait; old results are not usable." };
      // Only the adapter's existing predicate can establish a bound result.
      // Readiness itself never establishes identity, request binding or inventory.
      const first = input.completion({ ...current, settlement: "SETTLED" }, controls);
      if (first.complete && input.requireModelConfirmation && !modelConfirmed) return { ...first, complete: false, reason: "Observe the current source results and choose COMPLETE only when they answer this search objective." };
      if (first.resultBusy) {
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: current.url, detail: "COMPLETION_RESULT_BUSY" });
        return pending;
      }
      if (current.settlement !== "PENDING") return first;
      if (!first.complete || !first.resultKey) return pending;
      await this.operation(input, "VERIFY_RESULT_STABILITY", () => new Promise<void>(resolve => setTimeout(resolve, 500)));
      const next = await this.snapshot(input);
      const observed = options.skipControlObserve ? [] : await this.observeControls(input);
      const second = input.completion({ ...next, settlement: "SETTLED" }, observed);
      // Retain the newest observation even when verification fails. Reusing the
      // first snapshot could falsely match a later rotation back to old results.
      Object.assign(current, next, { settlement: "PENDING" });
      controls.splice(0, controls.length, ...observed);
      if (second.resultBusy) this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: next.url, detail: "COMPLETION_RESULT_BUSY" });
      if (!second.complete || second.resultKey !== first.resultKey || second.resultBusy) return pending;
      this.pageUnsettled = false;
      Object.assign(current, next, { settlement: "SETTLED" });
      this.record({ source: input.source, stage: input.stage, event: "POST_ACTION_VERIFIED", url: next.url, detail: "BOUND_RESULT_STABLE" });
      return second;
    };
    const initial = !this.pageUnsettled && input.initialObservation?.snapshot.settlement !== "PENDING" ? input.initialObservation : undefined;
    let snapshot = initial?.snapshot ?? await this.settledSnapshot(input);
    // A request-shaped HTML link can be stale while the live control carrying
    // the same URL is disabled. Read both representations before accepting a
    // completion, including on the initial snapshot and after a source-owned
    // shortcut. HTML alone is never a shortcut around current DOM evidence.
    let verifiedObservation: Observation | undefined = await this.observe(input, snapshot, initial?.controls);
    if (this.disabledRequestedParty(input, verifiedObservation)) return {status: "NO_SAFE_ACTION", reasonCode: "PARTY_SIZE_NOT_SELECTABLE", snapshot, controls: verifiedObservation.controls};
    let completion = await assess(snapshot, verifiedObservation.controls);
    if (completion.complete) return { status: "COMPLETED", snapshot, controls: verifiedObservation.controls };
    let progress = input.methodReason ?? completion.reason;
    const history: BrowserReadHistoryStep[] = [];
    const remember = (step: BrowserReadHistoryStep) => {
      history.push(step);
      if (history.length > 6) history.shift();
    };
    let postAction = false;
    let pendingOption: (ObservedTarget & {selectionField: Extract<BrowserReadAction, {type:"CHOOSE_OPTION"}>["field"]}) | undefined;
    const confirmOption = (controls: BrowserPageControl[]) => {
      if (pendingOption && this.optionSelectionObserved(pendingOption,controls)) {
        input.onOptionConfirmed?.(pendingOption.selectionField,pendingOption.label);
        pendingOption = undefined;
      }
    };
    let pendingRadio: ObservedTarget | undefined;
    let pendingParty: { groupKey?: string } | undefined;
    let unchangedPageKey: string | undefined;
    let lastRejectedProposal: string | undefined;
    let repeatedRejectedProposals = 0;
    const recoveredObstructions = new Set<string>();
    const visibleProgress = new BrowserVisibleProgress();
    const recordRejectedProposal = (key: string) => {
      repeatedRejectedProposals = key === lastRejectedProposal ? repeatedRejectedProposals + 1 : 1;
      lastRejectedProposal = key;
      return repeatedRejectedProposals >= 2;
    };
    const pendingControlKeys = new Set<string>();
    for (;;) {
      const runModelCeiling = Math.min(
        this.options.maxModelCallsTotal,
        this.budget.maxModelCalls ?? Number.POSITIVE_INFINITY,
      );
      if (this.budget.totalModelCalls >= runModelCeiling) {
        const error = new BrowserRuntimeError("BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED", "Shared browser-model budget exhausted for this read run");
        this.recordLifecycleFailure(input.source, input.stage, "BUDGET_EXHAUSTED", error);
        throw error;
      }
      if (this.modelCalls >= (this.options.maxModelCallsPerCandidate)) {
        this.recordBudgetExhausted(input, "MODEL_BUDGET_EXHAUSTED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: [] };
      }
      if (this.operationCount >= (this.options.maxOperationsPerCandidate)) {
        this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: [] };
      }
      if (this.remaining(1) <= 0) {
        this.recordBudgetExhausted(input, "DEADLINE_EXCEEDED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: [] };
      }
      // The browser model may only choose a safe observed navigation/control.
      // It never writes or asserts a Restaurant fact; the adapter grounds a
      // later observation against candidate identity and source excerpts.
      // A post-action observation was already taken from this fresh snapshot.
      // Reuse it for the next decision; observing again spends budget without
      // making the target any fresher than the snapshot it belongs to.
      const observation: Observation = verifiedObservation ?? await this.observe(input, snapshot);
      verifiedObservation = undefined;
      confirmOption(observation.controls);
      if (pendingRadio && this.radioSelectionObserved(pendingRadio, observation.controls)) pendingRadio = undefined;
      if (pendingParty && partyGroupConfirmed(observation, input.goal, pendingParty.groupKey)) pendingParty = undefined;
      if (this.disabledRequestedParty(input, observation)) return {status: "NO_SAFE_ACTION", reasonCode: "PARTY_SIZE_NOT_SELECTABLE", snapshot, controls: observation.controls};
      completion = await assess(snapshot, observation.controls);
      if (completion.complete && !pendingOption && !pendingRadio && !pendingParty) return { status: "COMPLETED", snapshot, controls: observation.controls };
      if (!this.options.modelDecision) return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
      if (!postAction) {
        this.record({
          source: input.source,
          stage: input.stage,
          event: "SKILL_STARTED",
          url: snapshot.url,
          detail: progress,
          observation: this.diagnosticObservation(observation),
        });
      } else {
        this.record({
          source: input.source,
          stage: input.stage,
          event: "POST_ACTION_VERIFIED",
          url: snapshot.url,
          detail: "NEW_OBSERVATION_AFTER_MODEL_ACTION",
          observation: this.diagnosticObservation(observation),
        });
      }
      const pageKey = observationKey(snapshot);
      if (pageKey !== unchangedPageKey) pendingControlKeys.clear();
      // Disabled selected calendar days are still evidence of the current query.
      // Hide equivalent triggers too; repeatedly reopening an already selected date
      // cannot fix a different missing field such as guest count.
      const alreadySelected = observation.controls.filter(control => control.visible && control.selected === true
        && (matchesAuthoritativeControl(control, "DATE", input.goal) || matchesAuthoritativeControl(control, "PARTY_SIZE", input.goal)));
      const confirmedDate = (target:ObservedTarget) => completion.confirmedFields?.includes("DATE") && matchesAuthoritativeControl(target,"DATE",input.goal);
      const actionTargets = [...observation.targets.values()].filter(target => confirmedDate(target)
        || ((!pendingControlKeys.has(target.stableKey) || target.selected === true)
          && !(target.role === "combobox" && observation.controls.some(control => control.id === target.controlId && control.expanded === true))));
      if (pendingParty) progress = "PARTY_SIZE_NOT_CONFIRMED: no unique selected value in the clicked control group confirms the requested guest count. Read the current selected values; unrelated page changes are not confirmation.";
      let action: BrowserReadAction;
      const month = displayedCalendarMonth(observation.controls);
      try {
        this.modelCalls += 1;
        this.budget.totalModelCalls += 1;
        this.record({ source: input.source, stage: input.stage, event: "MODEL_DECISION_STARTED", detail: "MODEL_DECISION" });
        action = await this.bounded(input, "MODEL_DECISION", () => this.options.modelDecision!.decide({
          taskId: input.taskId,
          history: structuredClone(history),
          source: input.source,
          stage: input.stage,
          objective: typeof input.objective === "string" ? input.objective : input.objective(actionTargets),
          progress: `${progress}${alreadySelected.length ? ` Already selected (do not repeat): ${alreadySelected.map(target => target.label).join(", ")}.` : ""}`,
          skills: loadBrowserReadSkills(input.source, input.sourceSkillPath),
          goal: input.goal,
          observation: {
            revision: observation.revision,
            url: observation.snapshot.url,
            title: observation.snapshot.title,
            visibleText: safeText(observation.snapshot.text),
            ...(month ? { displayedCalendarMonth: month } : {}),
            controlGroups: observedControlGroups(observation),
            pageActions: input.session.pressEscape && input.session.metadata.readNetworkBoundary === "INSTALLED" ? [
        "WAIT",
        "PRESS_ESCAPE",
      ] : ["WAIT"],
            targets: actionTargets.map(({ controlId: _controlId, stableKey: _stableKey, controlGroupKey: _groupKey, nativeTag: _nativeTag, readOnly: _readOnly, optionNative: _optionNative, optionOwnerId: _optionOwnerId, ownerStableKey: _ownerStableKey, radioGroupKey: _radioGroupKey, ...target }) => ({
              ...target, ...(confirmedDate(observation.targets.get(target.ref)!)?{availableActions:[],rejectionReason:"SOURCE_DATE_CONFIRMED"}:this.actionHints(input, observation, observation.targets.get(target.ref)!, pendingOption !== undefined || pendingRadio !== undefined)),
            })),
          },
        }));
        const wire = this.options.modelDecision!.takeLastWireRecord?.();
        if (wire) this.record({ source: input.source, stage: input.stage, event: "MODEL_WIRE", url: snapshot.url, detail: this.replayWireDetail(wire, actionTargets) });
        this.record({ source: input.source, stage: input.stage, event: "MODEL_DECISION_FINISHED", detail: "MODEL_DECISION" });
      } catch (error) {
        const wire = this.options.modelDecision!.takeLastWireRecord?.();
        if (wire) this.record({ source: input.source, stage: input.stage, event: "MODEL_WIRE", url: snapshot.url, detail: this.replayWireDetail(wire, actionTargets) });
        this.recordLifecycleFailure(input.source, input.stage, "MODEL_DECISION_FAILED", error);
        const rejectionDetail = error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT"
          ? safeWireRejectionDetail(error.wireRejection) : safeErrorDetail(error);
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: rejectionDetail });
        if (error instanceof BrowserRuntimeError || (error && typeof error === "object" && "code" in error && error.code === "MODEL_CALL_BUDGET_EXHAUSTED")) throw error;
        if (error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT") {
          remember({ action: "MODEL_OUTPUT", outcome: "REJECTED", reason: rejectionDetail, urlChanged: false });
          if (recordRejectedProposal(`${observationKey(snapshot, observation.controls)}|${rejectionDetail}`)) {
            this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_PROGRESS_REJECTED_ACTION" });
            return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
          }
          progress = `The previous proposed action was rejected: ${rejectionDetail}. Correct those action fields using a current observed target, or request human help.`;
          continue;
        }
        return { status: "MODEL_FAILURE", snapshot, controls: observation.controls };
      }
      this.record({
        source: input.source,
        stage: input.stage,
        event: action.type === "COMPLETE" || action.type === "REQUEST_HUMAN_HELP" ? "MODEL_STOP" : "MODEL_ACTION",
        url: snapshot.url,
        // Model reasons are untrusted free text. The action type is enough to
        // reconstruct the executor path without retaining source/user content.
        detail: `MODEL_${action.type}`,
      });
      const unavailable = input.stage === "AVAILABILITY" && input.goal.date && [...observation.targets.values()].some(target =>
        this.targetDate(target) === input.goal.date && target.disabled && !target.selected)
        && (input.goal.partySize === undefined || observation.controls.some(control =>
          matchesAuthoritativeControl(control, "PARTY_SIZE", input.goal) && (control.selected || control.kind === "SELECT" || control.kind === "INPUT")));
      if (unavailable) {
        this.record({source:input.source,stage:input.stage,event:"METHOD_INCOMPLETE",url:snapshot.url,detail:"DATE_NOT_SELECTABLE"});
        return {status:"NO_SAFE_ACTION",reasonCode:"DATE_NOT_SELECTABLE",snapshot,controls:observation.controls};
      }
      if (action.type === "COMPLETE") {
        modelConfirmed = true;
        if (this.disabledRequestedParty(input, observation)) return {status: "NO_SAFE_ACTION", reasonCode: "PARTY_SIZE_NOT_SELECTABLE", snapshot, controls: observation.controls};
        completion = await assess(snapshot, observation.controls);
        if (pendingOption || pendingRadio) return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        if (completion.complete && !pendingParty) {
          const scope=action.scopeRef?observation.targets.get(action.scopeRef):undefined;
          const visible=scope&&observation.controls.some(c=>c.id===scope.controlId&&c.visible&&!c.blockedByActiveLayer);
          return {status:"COMPLETED",snapshot,controls:observation.controls,...(visible&&scope.label.trim()&&scope.label.length<=1600?{scopeQuote:{ref:scope.ref,text:scope.label,url:snapshot.url}}:{})};
        }
        // COMPLETE is a request to finish, never evidence that the source has
        // finished.  Keep the same browser session and give the concrete
        // missing predicate back to the model.  A second COMPLETE on the same
        // unmodified observation has made no progress and fails closed.
        if (recordRejectedProposal(`${observationKey(snapshot, observation.controls)}|COMPLETE`)) {
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_PROGRESS_COMPLETE_REQUEST" });
          return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        }
        progress = `Completion was not accepted: ${completion.reason} Continue with an observed safe action, wait for a visible result, or request human help.`;
        remember({ action: "COMPLETE", outcome: "REJECTED", reason: "COMPLETE_PREDICATE_UNSATISFIED", urlChanged: false });
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "COMPLETE_PREDICATE_UNSATISFIED" });
        // A rejected completion is not an action, but it may race a source's
        // asynchronous result rendering.  Refresh the entire observation once
        // before asking the model again: controls alone cannot expose a result
        // region that hydrated without changing a control value.
        if (this.operationCount + 3 > (this.options.maxOperationsPerCandidate)) {
          this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
          return { status: "BUDGET_EXCEEDED", snapshot, controls: observation.controls };
        }
        await this.waitForSettled(input, snapshot);
        snapshot = await this.snapshot(input);
        verifiedObservation = await this.observe(input, snapshot);
        completion = await assess(snapshot, verifiedObservation.controls);
        if (completion.complete && !pendingParty) return { status: "COMPLETED", snapshot, controls: verifiedObservation.controls };
        postAction = true;
        continue;
      }
      if (action.type === "REQUEST_HUMAN_HELP") return { status: "REQUESTED_HUMAN_HELP", snapshot, controls: observation.controls };
      const target = action.type === "WAIT" || action.type === "PRESS_ESCAPE" ? undefined : observation.targets.get(action.targetRef);
      if (!target && action.type !== "WAIT" && action.type !== "PRESS_ESCAPE") {
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: "STALE_OR_UNKNOWN_TARGET_REF" });
        return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
      }
      const visibleBefore = visibleProgressKey(snapshot.url, observation.controls);
      const actionValue = "field" in action ? this.authoritativeValues(input)[action.field] : action;
      const stateActionKey = visibleActionKey(action.type, target, action.type === "FILL_AUTHORITATIVE" ? actionValue
        : Object.fromEntries(Object.entries(action).filter(([key]) => !["targetRef", "reason"].includes(key))));
      if (visibleProgress.repeated(visibleBefore, stateActionKey)) {
        remember({action:action.type,...(target ? {targetLabel:safeText(target.label,160),targetKind:target.kind}:{}),
          ...("field" in action ? {field:action.field}:{}),outcome:"REJECTED",reason:"REPEATED_FROM_SAME_STATE",urlChanged:false,stateChanged:false});
        this.record({source:input.source,stage:input.stage,event:"REJECTED",url:snapshot.url,detail:"REPEATED_FROM_SAME_STATE"});
        if (visibleProgress.noProgress()) {
          this.record({source:input.source,stage:input.stage,event:"METHOD_INCOMPLETE",url:snapshot.url,detail:"NO_PROGRESS"});
          return {status:"NO_SAFE_ACTION",reasonCode:"NO_PROGRESS",snapshot,controls:observation.controls};
        }
        progress = "REPEATED_FROM_SAME_STATE: this action and value already ran on equivalent visible controls. Choose a different observed action that advances the goal.";
        continue;
      }
      const confirmationOperations = 2 + (input.session.observeControls ? 1 : 0);
      if (this.operationCount + confirmationOperations > (this.options.maxOperationsPerCandidate)) {
        this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: observation.controls };
      }
      try {
        if (target && confirmedDate(target)) throw new Error("SOURCE_DATE_CONFIRMED: the current source response already confirms the requested date");
        if (pendingOption && action.type === "CHOOSE_OPTION") {
          throw new Error("A previous option is still unconfirmed; WAIT for its selected value before choosing another option");
        }
        if (action.type === "ADVANCE_TO_AUTHORITATIVE") {
          if (pendingOption || pendingRadio || pendingParty) throw new Error("A previous selection is unconfirmed");
          const advanced = await this.advanceToAuthoritative(input, observation, target!, action.field, action.valueGroupRef);
          snapshot = advanced.observation.snapshot;
          verifiedObservation = advanced.observation;
          progress = advanced.reason;
          remember({action:action.type,field:action.field,outcome:advanced.reason === "ADVANCE_TARGET_FOUND" ? "PAGE_CHANGED" : "NO_CHANGE",reason:advanced.reason,urlChanged:snapshot.url!==observation.snapshot.url});
          if (advanced.reason !== "ADVANCE_TARGET_FOUND") return {status:"NO_SAFE_ACTION",reasonCode:advanced.reason,snapshot,controls:advanced.observation.controls};
          postAction = true;
          continue;
        }
        await this.applyGenericAction(input, observation, target, action);
        visibleProgress.executed(visibleBefore, stateActionKey);
      } catch (error) {
        const obstruction = target !== undefined && pointerObstruction(error);
        remember({ action: action.type, ...(target ? { targetLabel: safeText(target.label, 160), targetKind: target.kind } : {}),
          ...("field" in action ? { field: action.field } : {}), outcome: "REJECTED", reason: safeErrorDetail(error, 240), urlChanged: false });
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: obstruction ? "ACTION_OBSTRUCTED" : safeErrorDetail(error) });
        if (obstruction && input.session.dismissTransientObstruction && !recoveredObstructions.has(target.stableKey)) {
          recoveredObstructions.add(target.stableKey);
          try {
            const recovery = await this.operation(input, "DISMISS_TRANSIENT_OBSTRUCTION", () => input.session.dismissTransientObstruction!(target.controlId, this.actionOptions()));
            snapshot = await this.snapshot(input);
            verifiedObservation = await this.observe(input, snapshot);
            progress = "A visible page layer blocked the previous action. One bounded Escape/blur recovery was applied; inspect the fresh page before choosing another safe action.";
            postAction = true;
            this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: `ACTION_OBSTRUCTION_RECOVERED:${recovery.occluder}` });
            continue;
          } catch (recoveryError) {
            if (recoveryError instanceof BrowserRuntimeError && (recoveryError.code === "BROWSER_ABORTED" || recoveryError.code === "BROWSER_TIMEOUT")) throw recoveryError;
            this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "ACTION_OBSTRUCTION_RECOVERY_FAILED" });
          }
        }
        if (error instanceof BrowserRuntimeError && error.code === "BROWSER_STALE_TARGET") {
          snapshot = await this.snapshot(input);
          verifiedObservation = undefined;
          progress = "The observed control changed before the action. Inspect the fresh page and choose a current target.";
          postAction = true;
          continue;
        }
        if (error instanceof BrowserRuntimeError) {
          if (action.type === "OPEN_LINK" || action.type === "CLICK" && !!target && this.guardedPublicQuerySubmit(input, target)) throw error;
          return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        }
        if (recordRejectedProposal(`${observationKey(snapshot, observation.controls)}|${action.type}|${target?.stableKey ?? "PAGE"}|${safeErrorDetail(error, 240)}`)) {
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_PROGRESS_REJECTED_ACTION" });
          return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        }
        progress = `The previous proposed action was rejected by the executor: ${safeErrorDetail(error, 240)}. Choose another observed safe target, or request human help.`;
        continue;
      }
      lastRejectedProposal = undefined;
      repeatedRejectedProposals = 0;
      if (action.type === "CHOOSE_OPTION" && target) pendingOption = {...target, selectionField:action.field,
        ...(action.field === "RETRIEVAL" ? {retrievalValue:input.goal.retrievalExpression!} : {})};
      if (action.type === "SET_CHECKED" && target?.kind === "RADIO") {
        pendingRadio = target;
      }
      const priorSnapshot = snapshot;
      const calendarNavigation = action.type === "CLICK" && target?.controlGroupLabel === "Calendar"
        && /\b(?:next|previous|prev|forward|back)\b/i.test(target.label);
      const priorMonth = calendarNavigation ? displayedCalendarMonth(observation.controls) : undefined;
      const partyClick = action.type === "CLICK_AUTHORITATIVE" && action.field === "PARTY_SIZE"
        || action.type === "CLICK" && !!target?.controlGroupKey && /guest|people|person|party|pax|人数|名|人/i.test(target.controlGroupLabel ?? "")
          && matchesAuthoritativeControl(target, "PARTY_SIZE", input.goal);
      if (partyClick) pendingParty = target?.controlGroupKey ? { groupKey: target.controlGroupKey } : {};
      const publicQuerySubmit = action.type === "CLICK" && !!target && this.guardedPublicQuerySubmit(input, target);
      if (action.type !== "WAIT") await this.waitForSettled(input, priorSnapshot);
      snapshot = await this.snapshot(input);
      const priorConfirmedFields = completion.confirmedFields ?? [];
      // An opt-in predicate owns every terminal source check. Unresolved
      // option/radio/calendar state still needs the ordinary live observation.
      let snapshotAssessment: BrowserCompletionAssessment | undefined;
      if (input.completionUsesControls === false && !pendingOption && !pendingRadio && !calendarNavigation) {
        snapshotAssessment = await assess(snapshot, [], { skipControlObserve: true });
        if (snapshotAssessment.complete && (!pendingParty || snapshotAssessment.confirmedFields?.includes("PARTY_SIZE"))) {
          remember({ action: action.type, ...(target ? { targetLabel: safeText(target.label, 160), targetKind: target.kind } : {}),
            ...("field" in action ? { field: action.field } : {}), outcome: "PAGE_CHANGED",
            urlChanged: priorSnapshot.url !== snapshot.url, stateChanged: !sameObservation(priorSnapshot, snapshot) });
          this.record({ source: input.source, stage: input.stage, event: "POST_ACTION_VERIFIED", url: snapshot.url,
            detail: partyClick ? "PARTY_SIZE_CONFIRMED" : "BOUND_RESULT_COMPLETE" });
          return { status: "COMPLETED", snapshot, controls: [] };
        }
      }
      const postActionObservation = await this.observe(input, snapshot);
      const visibleStateChanged = visibleBefore !== visibleProgressKey(snapshot.url, postActionObservation.controls);
      const observedControlChange = controlsChanged(observation.controls, postActionObservation.controls);
      const observedPageChange = !sameObservation(priorSnapshot, snapshot) || observedControlChange;
      confirmOption(postActionObservation.controls);
      if (pendingRadio && this.radioSelectionObserved(pendingRadio, postActionObservation.controls)) pendingRadio = undefined;
      if (snapshotAssessment) {
        completion = this.disabledRequestedParty(input, postActionObservation)
          ? { complete: false, reason: "PARTY_SIZE_NOT_SELECTABLE" } : snapshotAssessment;
      } else completion = await assess(snapshot, postActionObservation.controls);
      const confirmedFieldsChanged = completion.confirmedFields?.some(field=>!priorConfirmedFields.includes(field)) === true;
      const changed = observedPageChange || confirmedFieldsChanged;
      const publicQueryWaitChanged = changed && snapshot.settlement !== "PENDING";
      const stateChanged = visibleStateChanged || confirmedFieldsChanged;
      if (pendingParty && (partyGroupConfirmed(postActionObservation, input.goal, pendingParty.groupKey) || completion.confirmedFields?.includes("PARTY_SIZE"))) pendingParty = undefined;
      const optionConfirmed = !pendingOption && !pendingRadio;
      // A source that did not show an async page change may still be settling
      // its controls. Reobserve on the next turn in that case.
      verifiedObservation = changed && optionConfirmed ? postActionObservation : undefined;
      const currentMonth = calendarNavigation ? displayedCalendarMonth(postActionObservation.controls) : undefined;
      const monthChanged = !!priorMonth && !!currentMonth && (priorMonth.year !== currentMonth.year || priorMonth.month !== currentMonth.month);
      const monthUnconfirmed = calendarNavigation && !monthChanged;
      const partyUnconfirmed = partyClick && pendingParty !== undefined;
      const effectVerified = confirmedFieldsChanged || (partyClick ? !partyUnconfirmed : calendarNavigation ? monthChanged : changed || observedControlChange);
      remember({ action: action.type, ...(target ? { targetLabel: safeText(target.label, 160), targetKind: target.kind } : {}),
        ...("field" in action ? { field: action.field } : {}), outcome: effectVerified ? "PAGE_CHANGED" : "NO_CHANGE",
        ...(partyUnconfirmed ? { reason: "PARTY_SIZE_NOT_CONFIRMED" } : monthUnconfirmed ? { reason: "CALENDAR_MONTH_UNCHANGED" } : {}),
        urlChanged: priorSnapshot.url !== snapshot.url, stateChanged });
      this.record({
        source: input.source,
        stage: input.stage,
        event: "POST_ACTION_VERIFIED",
        url: snapshot.url,
        detail: partyUnconfirmed ? "PARTY_SIZE_NOT_CONFIRMED" : partyClick ? "PARTY_SIZE_CONFIRMED" : monthUnconfirmed ? "CALENDAR_MONTH_UNCHANGED" : optionConfirmed ? effectVerified ? "OBSERVED_CHANGE_AFTER_MODEL_ACTION" : "ASYNC_RESULT_NOT_READY_AFTER_MODEL_ACTION" : "OPTION_VALUE_NOT_CONFIRMED",
        observation: this.diagnosticObservation(postActionObservation),
      });
      if (completion.complete && optionConfirmed && !monthUnconfirmed && !pendingParty) return { status: "COMPLETED", snapshot, controls: postActionObservation.controls };
      if (!stateChanged && visibleProgress.noProgress()) {
        this.record({source:input.source,stage:input.stage,event:"METHOD_INCOMPLETE",url:snapshot.url,detail:"NO_PROGRESS"});
        return {status:"NO_SAFE_ACTION",reasonCode:"NO_PROGRESS",snapshot,controls:postActionObservation.controls};
      }
      if (partyUnconfirmed) {
        if (target) pendingControlKeys.add(target.stableKey);
        unchangedPageKey = observationKey(snapshot);
        progress = "PARTY_SIZE_NOT_CONFIRMED: the clicked group has not shown the requested selected value. Wait for current source state or choose another observed control.";
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "PARTY_SIZE_NOT_CONFIRMED" });
        postAction = true;
        continue;
      }
      if (monthUnconfirmed) {
        if (target) pendingControlKeys.add(target.stableKey);
        unchangedPageKey = observationKey(snapshot);
        progress = `CALENDAR_MONTH_UNCHANGED: the calendar month did not confirm a change (${priorMonth?.caption ?? "unknown"} -> ${currentMonth?.caption ?? "unknown"}). Unrelated page changes are not calendar progress. Inspect another current observed control or request human help.`;
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "CALENDAR_MONTH_UNCHANGED" });
        postAction = true;
        continue;
      }
      if (publicQuerySubmit && !publicQueryWaitChanged) {
        pendingControlKeys.add(target!.stableKey);
        progress = "The public query submit changed only local form state and no result arrived within its bounded wait. Do not repeat that submit; wait for a result or choose another observed safe action.";
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "PUBLIC_QUERY_RESULT_NOT_READY" });
        postAction = true;
        continue;
      }
      if (!optionConfirmed) {
        pendingControlKeys.add((pendingOption ?? pendingRadio)!.stableKey);
        progress = "The selected query option was not confirmed by a fresh control observation. Wait for a visible selected value or use another observed safe action; do not repeat the same option blindly.";
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "OPTION_VALUE_NOT_CONFIRMED" });
        postAction = true;
        continue;
      }
      if (!effectVerified && sameObservation(priorSnapshot, snapshot)) {
        unchangedPageKey = observationKey(snapshot);
        if (target) pendingControlKeys.add(target.stableKey);
        progress = target
          ? `The previous ${action.type} did not produce a visible change. Choose a current observed target that advances the goal. Wait only if the result is actually still loading.`
          : "The bounded page-level wait ended without a visible result change. Choose another observed safe action or request human help.";
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "ASYNC_RESULT_NOT_READY" });
      } else {
        progress = completion.reason;
      }
      postAction = true;
    }
  }

  async close(reason: BrowserExecutionReason = "EXECUTOR_CLOSED"): Promise<void> {
    const outcome = reason === "PARENT_ABORTED" || reason === "DEADLINE_EXCEEDED" ? "ABANDONED" : reason === "RUNTIME_FAILURE" ? "FAILED" : "FINISHED";
    if (!this.session) {
      this.finishProvider(outcome, reason);
      this.finishCandidate(outcome, reason);
      return;
    }
    const session = this.session;
    this.session = undefined;
    this.sessionSignal = undefined;
    this.sessionAbortCleanup?.();
    this.sessionAbortCleanup = undefined;
    const lifecycle = this.activeLifecycle;
    if (lifecycle) this.record({ ...lifecycle, event: "CLOSED", detail: "SESSION_RETIRED" });
    this.finishProvider(outcome, reason);
    this.finishCandidate(outcome, reason);
    // The old session is detached before cleanup starts. A stuck browser close
    // cannot delay cancellation or attach its late completion to a new candidate.
    const closing = Promise.resolve().then(() => session.close());
    if (reason === "RUNTIME_FAILURE" || reason === "PARENT_ABORTED" || reason === "DEADLINE_EXCEEDED") {
      void closing.catch(() => undefined);
      return;
    }
    await closing;
  }

  /** The run owner closes every source context, including inactive ones. */
  async closeAll():Promise<void>{
    const parked=[...this.parkedSessions.values()];this.parkedSessions.clear();
    for(const item of parked)item.cleanup?.();
    await Promise.all([this.close(),...parked.map(item=>item.session.close())]);
  }

  private disabledRequestedParty(input: BrowserSkillReadInput, observation: Observation, useSourceDateConfirmation = false): boolean {
    if (input.stage !== "AVAILABILITY" || input.goal.partySize === undefined) return false;
    if (![...observation.targets.values()].some(target => target.disabled && !target.selected && !target.outsideViewport
      && matchesAuthoritativeControl(target, "PARTY_SIZE", input.goal))) return false;
    // Disabled counts can still belong to the old date while a future date is being selected.
    if (input.goal.date && ![...observation.targets.values()].some(target =>
      target.selected && this.targetDate(target) === input.goal.date
      || target.kind === "INPUT" && target.value === input.goal.date && /date/i.test(`${target.type ?? ""} ${target.inputName ?? ""} ${target.label}`))
      && !(useSourceDateConfirmation && input.completion(observation.snapshot, observation.controls).confirmedFields?.includes("DATE"))) return false;
    return [...observation.targets.values()].some(target => target.disabled && !target.selected && !target.outsideViewport
      && !partyGroupConfirmed(observation, input.goal, target.controlGroupKey)
      && (/^(?:guests?|people|party size|人数)$/i.test(target.controlGroupLabel ?? "") || /^(?:guests?|people|party size|人数)\s*\d+$/i.test(target.label)
        || target.kind === "OPTION" && /\b(?:guests?|people|party|adults?)\b|人数/i.test(observation.targets.get(target.ownerRef ?? "")?.label ?? ""))
      && matchesAuthoritativeControl(target, "PARTY_SIZE", input.goal));
  }

  /** The model chooses each control; code verifies only a newly observed,
   * selected time within the original request. No combobox/action sequence. */
  async advanceAvailabilityTime(input: BrowserSkillReadInput, checkedTimes: readonly string[], queryMatches: (page: BrowserSnapshot, controls: readonly BrowserPageControl[], time: string) => boolean): Promise<string | undefined> {
    let selected: string | undefined, chosen: string | undefined;
    const result = await this.runSkill({ ...input, requireModelConfirmation: true,
      onOptionConfirmed: (field,label) => {
        input.onOptionConfirmed?.(field,label);
        if (field === "TIME") chosen = observedClock(label);
      },
      objective: `Continue this same outlet's public availability query within the authoritative time window. Already checked times: ${JSON.stringify(checkedTimes)}. Choose each next step from the current observation. Never click a booking slot or widen the requested window.`,
      completion: (page, controls = []) => {
        selected = chosen && input.goal.timeWindow && chosen >= input.goal.timeWindow.earliest && chosen <= input.goal.timeWindow.latest
          && !checkedTimes.includes(chosen) && queryMatches(page,controls,chosen) ? chosen : undefined;
        return selected !== undefined
          ? {complete:true,resultKey:selected,resultBusy:false,reason:"Verify a new source-selected query time."}
          : {complete:false,reason:"No newly selected authoritative query time."};
      }});
    return result.status === "COMPLETED" ? selected : undefined;
  }

  private async observe(input: BrowserSkillReadInput, snapshot: BrowserSnapshot, initialControls?: BrowserPageControl[]): Promise<Observation> {
    this.observationRevision += 1;
    const controls = initialControls ?? (input.session.observeControls
      ? await this.operation(input, "OBSERVE_CONTROLS", () => input.session.observeControls!(input.controlHints?.(snapshot)))
      : []);
    const exposeSuggestions = input.stage === "DISCOVERY" && Boolean(input.goal.retrievalExpression)
      && input.session.metadata.readNetworkBoundary === "INSTALLED";
    const observation = { revision: this.observationRevision, snapshot, controls, targets: toObservedTargets(controls, this.observationRevision, exposeSuggestions) };
    input.onObservation?.({revision: observation.revision, url: snapshot.url, targets: [...observation.targets.values()].map(target => ({...target, ...this.actionHints(input, observation, target, false)}))});
    return observation;
  }

  private optionSelectionObserved(target: ObservedTarget, controls: BrowserPageControl[]): boolean {
    if (target.retrievalValue !== undefined) {
      return controls.some(control => control.role === "combobox" && control.stableKey === target.ownerStableKey
        && control.value === target.retrievalValue && control.expanded === false);
    }
    if (target.optionNative) {
      return controls.some(control => control.kind === "SELECT" && control.stableKey === target.ownerStableKey
        && control.value === target.value && control.options?.some(option => option.value === target.value && option.selected));
    }
    return controls.some(control => control.role === "combobox" && control.stableKey === target.ownerStableKey
      && control.visible && !control.disabled && !control.blockedByActiveLayer
      && (control.selectionReadback?.menuClosed ?? control.expanded === false)
      && (control.selectionReadback?.displayRequired
        ? control.selectionReadback.displayText?.trim() === target.label.trim()
        : control.value?.trim() === target.label.trim() || control.label.trim() === target.label.trim()));
  }

  /** Radio selection is valid only when its observed owning group now has this one selected item. */
  private radioSelectionObserved(target: ObservedTarget, controls: BrowserPageControl[]): boolean {
    if (target.kind !== "RADIO" || !target.radioGroupKey) return false;
    const group = controls.filter(control => control.kind === "RADIO" && control.structure?.radioGroupKey === target.radioGroupKey);
    const selected = group.filter(control => control.checked === true);
    return selected.length === 1 && selected[0]!.stableKey === target.stableKey;
  }

  private actionHints(input: BrowserSkillReadInput, observation: Observation, target: ObservedTarget, pendingSelection: boolean, allowAdvance = true): Pick<BrowserReadActionTarget, "availableActions" | "rejectionReason"> {
    const availableActions: string[] = [];
    let rejectionReason: string | undefined;
    if (target.href && isBrowserReadPathProhibited(this.networkPolicy, target.href)) return {availableActions, rejectionReason: "NAVIGATION_PROHIBITED"};
    const date = this.targetDate(target);
    if (input.stage === "AVAILABILITY" && input.goal.date && date) {
      if (date !== input.goal.date) return { availableActions, rejectionReason: "NON_REQUEST_DATE" };
      if (target.disabled && !target.selected) return { availableActions, rejectionReason: "DATE_NOT_SELECTABLE" };
    }
    if (target.disabled) return { availableActions, rejectionReason: "DISABLED" };
    if (target.kind === "OPTION") {
      const owner = target.ownerRef ? observation.targets.get(target.ownerRef) : undefined;
      if (!owner || owner.controlId !== target.optionOwnerId || owner.role !== "combobox") rejectionReason = "WRONG_OPTION_OWNER";
      else if (target.disabled || target.selected) rejectionReason = "DISABLED_OR_SELECTED";
      else if (pendingSelection) rejectionReason = "PREVIOUS_OPTION_UNCONFIRMED";
      else if (!target.optionNative && !this.safeGenericClick(target)) rejectionReason = "WRITE_PROHIBITED";
      else {
        for (const field of [
        "DATE",
        "PARTY_SIZE",
        "TIME",
      ] as const) {
          if (matchesAuthoritativeControl({ ...target, value: target.label }, field, input.goal)) availableActions.push(`CHOOSE_OPTION:${field}`);
        }
        if (this.matchesRetrievalOption(input, target, owner)) availableActions.push("CHOOSE_OPTION:RETRIEVAL");
        if (!availableActions.length) rejectionReason = "CONSTRAINT_MISMATCH";
      }
    } else if (target.kind === "SELECT") {
      rejectionReason = "CHOOSE_AN_OBSERVED_OPTION";
    } else if (target.kind === "LINK") {
      if (this.sameDocumentFragment(target, observation.snapshot.url)) {
        if (this.safeFragmentClick(input, observation.snapshot, target)) availableActions.push("CLICK");
        else rejectionReason = "WRITE_PROHIBITED";
      } else if (target.href && this.allowedUrl(target.href, input.allowedOrigins)
        && !/\/(?:login|signin|account|checkout|payment|reserve|booking|cancel)(?:\/|$)/i.test(new URL(target.href).pathname)) availableActions.push("OPEN_LINK");
      else rejectionReason = "NAVIGATION_PROHIBITED";
    } else if (target.kind === "BUTTON") {
      const dateConfirmed = matchesAuthoritativeControl(target, "DATE", input.goal)
        && observation.controls.some(control => control.visible && !control.blockedByActiveLayer && control.selected && matchesAuthoritativeControl(control, "DATE", input.goal));
      const partyConfirmed = matchesAuthoritativeControl(target, "PARTY_SIZE", input.goal) && partyGroupConfirmed(observation, input.goal, target.controlGroupKey);
      if (dateConfirmed || partyConfirmed || target.selected && ([
        "DATE",
        "PARTY_SIZE",
      ] as const).some(field => matchesAuthoritativeControl(target, field, input.goal))) {
        return { availableActions, rejectionReason: "ALREADY_SELECTED" };
      }
      if (this.safeGenericClick(target) || this.guardedReadControl(input, target)) availableActions.push("CLICK");
      else rejectionReason = "WRITE_PROHIBITED";
      if ((this.safeGenericClick(target) || this.guardedReadControl(input, target)) && target.role !== "combobox" && target.selected !== true) {
        for (const field of [
        "DATE",
        "PARTY_SIZE",
      ] as const) {
          if (matchesAuthoritativeControl(target, field, input.goal)
            && !(field === "PARTY_SIZE" && partyGroupConfirmed(observation, input.goal, target.controlGroupKey))) availableActions.push(`CLICK_AUTHORITATIVE:${field}`);
        }
      }
    } else if (target.kind === "INPUT") {
      if (target.readOnly && this.guardedReadControl(input, target)) availableActions.push("CLICK");
      const filled = filledAuthoritativeField(target.value, this.authoritativeValues(input));
      if (!filled && input.goal.date && this.boundInputField(target, "DATE")) availableActions.push("FILL_AUTHORITATIVE:DATE");
      if (!filled && input.goal.partySize !== undefined && this.boundInputField(target, "PARTY_SIZE")) availableActions.push("FILL_AUTHORITATIVE:PARTY_SIZE");
      if (!filled && input.goal.retrievalExpression && input.goal.retrievalSource && this.boundInputField(target, "RETRIEVAL") && this.guardedReadControl(input, target)) availableActions.push("FILL_AUTHORITATIVE:RETRIEVAL");
      if (!filled && input.stage === "DISCOVERY" && input.goal.location?.name && this.boundInputField(target, "LOCATION") && this.guardedReadControl(input, target)) availableActions.push("FILL_AUTHORITATIVE:LOCATION");
      if (!availableActions.length) rejectionReason = filled ? `AUTHORITATIVE_INPUT_PRESENT:${filled}: replacing this input would replace its current value, not add a second condition` : "NO_BOUND_INPUT_FIELD";
    } else if (target.kind === "CHECKBOX" || target.kind === "RADIO" || target.kind === "RANGE") {
      const action = target.kind === "RANGE" ? "ADJUST_RANGE" : "SET_CHECKED";
      if (pendingSelection) rejectionReason = "PREVIOUS_OPTION_UNCONFIRMED";
      else if (this.guardedReadControl(input, target) && (target.kind !== "RADIO" || target.checked !== true)) availableActions.push(action);
      else rejectionReason = "QUERY_PERMISSION_REQUIRED";
    } else if (target.kind === "REGION") {
      if (target.scrollable && this.guardedReadControl(input, target)) availableActions.push("SCROLL_REGION");
      else rejectionReason = "NOT_SCROLLABLE";
    }
      if (allowAdvance && this.safeAdvanceControl(input, observation, target) && !pendingSelection) {
        for (const field of [
        "DATE",
        "PARTY_SIZE",
        "TIME",
      ] as const) {
          if (this.authoritativeValues(input)[field] !== undefined && ![...observation.targets.values()].some(candidate=>matchesAuthoritativeControl(candidate,field,input.goal)&&(candidate.selected||this.actionHints(input,observation,candidate,false,false).availableActions?.some(a=>a===`CLICK_AUTHORITATIVE:${field}`||a===`CHOOSE_OPTION:${field}`)))) availableActions.push(`ADVANCE_TO_AUTHORITATIVE:${field}`);
        }
      }
    return { availableActions, ...(rejectionReason ? { rejectionReason } : {}) };
  }

  private targetDate(target: Pick<BrowserReadActionTarget, "kind" | "value" | "label" | "calendarDate">): string | undefined {
    if (target.kind !== "BUTTON" && target.kind !== "OPTION") return undefined;
    return target.calendarDate ?? target.value?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? target.label.match(/^(?:Date|Calendar date) (\d{4}-\d{2}-\d{2})$/)?.[1];
  }

  private boundInputField(target: ObservedTarget, field: "DATE" | "PARTY_SIZE" | "RETRIEVAL" | "LOCATION"): boolean {
    if (target.kind !== "INPUT" || target.readOnly || ![
        "INPUT",
        "TEXTAREA",
      ].includes(target.nativeTag ?? "")) return false;
    // Native types limit what can be entered. Meaning comes from the model's
    // current observation, rather than a search/date/guest label dictionary.
    const type = target.type?.toLowerCase();
    if (field === "DATE") return ["date", "text", "search"].includes(type || "text");
    if (field === "PARTY_SIZE") return ["number", "text", "search"].includes(type || "text");
    if (type && !["text", "search"].includes(type)) return false;
    const name = target.inputName ?? "";
    if (/(?:email|e-mail|phone|tel|password|card|address)/i.test(name)) return false;
    return true;
  }

  private matchesRetrievalOption(input: BrowserSkillReadInput, target: ObservedTarget, owner: ObservedTarget): boolean {
    if (input.stage !== "DISCOVERY" || !input.goal.retrievalExpression || target.optionNative
      || owner.kind !== "BUTTON" || owner.value !== input.goal.retrievalExpression) return false;
    const label = target.label.trim();
    const query = input.goal.retrievalExpression;
    return label === query || label === `"${query}"` || label === `“${query}”`;
  }

  private diagnosticObservation(observation: Observation): NonNullable<BrowserExecutionDiagnostic["observation"]> {
    return {
      title: safeText(observation.snapshot.title, 240),
      visibleTextExcerpt: safeText(observation.snapshot.text, 1_000),
      targets: [...observation.targets.values()].slice(0, 40).map(({ formObservation: _formObservation, controlId: _controlId, stableKey: _stableKey, nativeTag: _nativeTag, readOnly: _readOnly, optionNative: _optionNative, optionOwnerId: _optionOwnerId, ownerStableKey: _ownerStableKey, value: _value, formMethod: _formMethod, selected: _selected, ...target }) => ({
        ...target,
        ...(target.href ? { href: this.diagnosticUrl(target.href) } : {}),
      })),
    };
  }

  /**
   * A Replay artifact cannot trust an opaque ref alone: observation indices can
   * be reused after a DOM reorder. Store only a hash of the current semantic
   * target; the trace already retains the safe observed control projection.
   */
  private replayWireDetail(wire: import("./browser-action-decision.js").BrowserActionWireRecord, targets: readonly BrowserReadActionTarget[]): string {
    const target = targets.find(candidate => candidate.ref === wire.targetRef);
    return `MODEL_WIRE:${JSON.stringify({ ...wire, ...(wire.valueGroupRef ? {valueGroupFingerprint:browserReadGroupReplayFingerprint(targets.filter(t=>t.controlGroupRef===wire.valueGroupRef))} : {}), ...(target ? { targetFingerprint: browserReadActionTargetReplayFingerprint(target) } : {}) })}`;
  }

  private diagnosticUrl(value: string): string {
    try {
      const url = new URL(value);
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      return "<invalid-url>";
    }
  }

  private safeAdvanceControl(input: BrowserSkillReadInput, observation: Observation, target: ObservedTarget): boolean {
    return input.session.metadata.readNetworkBoundary === "INSTALLED" && !target.disabled
      && (this.safeGenericClick(target) && target.type === "button" && !target.href
        || this.sameDocumentFragment(target,observation.snapshot.url) && this.safeFragmentClick(input,observation.snapshot,target));
  }

  private groupAuthoritativeChoice(input: BrowserSkillReadInput, observation: Observation, groupKey: string, field: "DATE" | "PARTY_SIZE" | "TIME"): boolean {
    return [...observation.targets.values()].some(target=>target.controlGroupKey===groupKey
      && this.actionHints(input,observation,target,false,false).availableActions?.some(action=>action===`CLICK_AUTHORITATIVE:${field}`||action===`CHOOSE_OPTION:${field}`));
  }

  /** Model selects both the advancing control and the independently observed value scope. */
  private async advanceToAuthoritative(input: BrowserSkillReadInput, initial: Observation, selected: ObservedTarget, field: "DATE" | "PARTY_SIZE" | "TIME", valueGroupRef: string): Promise<{observation:Observation;reason:string}> {
    const groupKeys=new Set([...initial.targets.values()].filter(t=>t.controlGroupRef===valueGroupRef).map(t=>t.controlGroupKey).filter((key):key is string=>!!key));
    if(groupKeys.size!==1||!this.safeAdvanceControl(input,initial,selected)||this.authoritativeValues(input)[field]===undefined)throw new Error("Advance requires a current value group, guarded non-submit control and authoritative field");
    const groupKey=[...groupKeys][0]!,stableKey=selected.stableKey;
    if([...initial.targets.values()].some(t=>t.controlGroupKey===groupKey&&t.selected&&matchesAuthoritativeControl(t,field,input.goal)))throw new Error("Authoritative value is already selected");
    const maximum=this.options.maxAdvanceStepsPerAction??this.options.maxOperationsPerCandidate;
    if(!Number.isInteger(maximum)||maximum<1)throw new Error("Invalid advance step budget");
    const state=(o:Observation)=>JSON.stringify([...o.targets.values()].filter(t=>t.controlGroupKey===groupKey).map(({kind,role,label,value,selected,disabled,options})=>JSON.stringify({kind,role,label,value,selected,disabled,options})).sort());
    let current=initial;
    const stop=(reason:string)=>{this.record({source:input.source,stage:input.stage,event:"METHOD_INCOMPLETE",url:current.snapshot.url,detail:reason,observation:this.diagnosticObservation(current)});return {observation:current,reason};};
    for(let step=0;step<maximum;step++){
      if(this.groupAuthoritativeChoice(input,current,groupKey,field))return stop("ADVANCE_TARGET_FOUND");
      if(field==="PARTY_SIZE"&&this.disabledRequestedParty(input,current,true))return stop("PARTY_SIZE_NOT_SELECTABLE");
      const controls=[...current.targets.values()].filter(t=>t.stableKey===stableKey&&this.safeAdvanceControl(input,current,t));
      if(controls.length!==1)return stop("ADVANCE_CONTROL_UNAVAILABLE");
      if(this.operationCount+4>this.options.maxOperationsPerCandidate)return stop("ADVANCE_OPERATION_BUDGET");
      const previous=current,prior=state(current),count=current.snapshot.networkRequests?.length??0;
      await this.operation(input,"ADVANCE_CLICK",()=>input.session.click(controls[0]!.controlId,this.actionOptions()));
      await this.waitForSettled(input,previous.snapshot);
      const page=await this.snapshot(input);current=await this.observe(input,page);
      if(page.url!==previous.snapshot.url||page.pageId!==previous.snapshot.pageId||(page.networkRequests?.slice(count)??[]).some(r=>r.resourceType==="document"||r.formSubmission||![
        "GET",
        "HEAD",
      ].includes(r.method)))return stop("ADVANCE_NAVIGATION_OR_SUBMISSION");
      if(![...current.targets.values()].some(t=>t.controlGroupKey===groupKey))return stop("ADVANCE_GROUP_DISAPPEARED");
      if(state(current)===prior)return stop("ADVANCE_NO_PROGRESS");
    }
    return stop(this.groupAuthoritativeChoice(input,current,groupKey,field)?"ADVANCE_TARGET_FOUND":"ADVANCE_STEP_LIMIT");
  }

  private async applyGenericAction(input: BrowserSkillReadInput, observation: Observation, target: ObservedTarget | undefined, action: Exclude<BrowserReadAction, { type: "COMPLETE" | "REQUEST_HUMAN_HELP" | "ADVANCE_TO_AUTHORITATIVE" }>): Promise<void> {
    if (action.type === "WAIT") {
      await this.waitForSettled(input, observation.snapshot);
      return;
    }
    if (action.type === "PRESS_ESCAPE") {
      if (!input.session.pressEscape || input.session.metadata.readNetworkBoundary !== "INSTALLED") throw new Error("Page Escape requires an installed read boundary");
      await this.operation(input, "PRESS_ESCAPE", () => input.session.pressEscape!(this.actionOptions()));
      return;
    }
    if (!target) throw new Error("Action requires a current observed target");
    if (target.disabled) throw new Error("Observed target is disabled");
    if (input.stage === "AVAILABILITY" && input.goal.date && this.targetDate(target) && this.targetDate(target) !== input.goal.date) throw new Error("NON_REQUEST_DATE");
    if (action.type === "OPEN_LINK") {
      if (target.kind !== "LINK" || !target.href) throw new Error("OPEN_LINK target is not an observed link");
      if (this.sameDocumentFragment(target, observation.snapshot.url)) throw new Error("Same-document fragment controls use CLICK, then re-observe the page");
      if (!this.allowedUrl(target.href, input.allowedOrigins)) throw new Error("OPEN_LINK target is outside the allowed origin");
      if (/\/(?:login|signin|account|checkout|payment|reserve|booking|cancel)(?:\/|$)/i.test(new URL(target.href).pathname)) {
        throw new Error("OPEN_LINK target has a sensitive navigation path");
      }
      if (input.session.openLink) {
        await this.operation(input, "OPEN_LINK", async () => {
          const options = this.navigationOptions();
          if (input.session.prepareObservedNavigation) await input.session.prepareObservedNavigation(target.href!, options);
          else await input.session.prepareNavigation?.(target.href!, options);
          await input.session.openLink!(target.controlId, target.href!, this.navigationOptions());
        });
      } else {
        // A runtime without popup support may only retain the existing same-page
        // behavior; it never fabricates a new-page identity.
        await this.operation(input, "OPEN_LINK", async () => {
          await input.session.prepareObservedNavigation?.(target.href!, this.navigationOptions());
          await input.session.navigate(target.href!, { ...this.navigationOptions(), waitUntil: "domcontentloaded" });
        });
      }
      return;
    }
    if (action.type === "CLICK") {
      if (target.role === "option" && !isSuggestionButton(target)) throw new Error("CLICK cannot choose an option; use CHOOSE_OPTION with its observed owner");
      if (!this.safeGenericClick(target) && !this.safeFragmentClick(input, observation.snapshot, target)
        && !this.guardedReadControl(input, target)) {
        throw new Error("CLICK target has submit, navigation, or other write-capable structure");
      }
      const clicked = input.onBeforeClick?.(observation.snapshot, target);
      const navigation = this.guardedPublicQuerySubmit(input, target);
      await this.operation(input, navigation ? "SUBMIT_PUBLIC_QUERY" : "CLICK", () => input.session.click(target.controlId, navigation ? this.navigationOptions() : this.actionOptions()));
      clicked?.();
      if (navigation && target.formObservation) input.onQuerySubmitted?.(target.formObservation.owner);
      return;
    }
    if (action.type === "CLICK_AUTHORITATIVE") {
      if (target.role === "option") throw new Error("CLICK_AUTHORITATIVE cannot choose an option; use CHOOSE_OPTION");
      if (target.role === "combobox") throw new Error("Open a custom combobox with CLICK, then choose its newly observed option with CHOOSE_OPTION.");
      if (target.kind !== "BUTTON" || target.selected === true
        || action.field === "PARTY_SIZE" && partyGroupConfirmed(observation, input.goal, target.controlGroupKey)
        || (!this.safeGenericClick(target) && !this.guardedReadControl(input, target))
        || !matchesAuthoritativeControl(target, action.field, input.goal)) {
        throw new Error("CLICK_AUTHORITATIVE target is not a visible, exact, non-submit authoritative control");
      }
      await this.operation(input, "CLICK_AUTHORITATIVE", () => input.session.click(target.controlId, this.actionOptions()));
      return;
    }
    if (action.type === "CHOOSE_OPTION") {
      const owner = target.ownerRef ? observation.targets.get(target.ownerRef) : undefined;
      if (target.kind !== "OPTION" || !owner || owner.controlId !== target.optionOwnerId || owner.role !== "combobox"
        || (target.optionNative ? owner.kind !== "SELECT" : owner.kind !== "BUTTON")) {
        throw new Error("CHOOSE_OPTION has the wrong control kind or no observed parent combobox");
      }
      if (target.disabled || target.selected) throw new Error("CHOOSE_OPTION target is disabled or already selected");
      if (!(action.field === "RETRIEVAL" ? this.matchesRetrievalOption(input, target, owner)
        : matchesAuthoritativeControl({ ...target, value: target.label }, action.field, input.goal))) {
        throw new Error("CHOOSE_OPTION label conflicts with the authoritative request");
      }
      if (target.optionNative) {
        const selected = await this.operation(input, "CHOOSE_OPTION", () => input.session.select(owner.controlId, target.value ?? "", this.actionOptions()));
        if (!selected.includes(target.value ?? "")) throw new Error("Browser did not report the observed option value");
      } else {
        if (!this.safeGenericClick(target) && !this.guardedReadControl(input, target)) throw new Error("CHOOSE_OPTION has write-prohibited structure");
        await this.operation(input, "CHOOSE_OPTION", () => input.session.click(target.controlId, this.actionOptions()));
      }
      return;
    }
    if ((action.type === "SET_CHECKED" || action.type === "ADJUST_RANGE") && !this.guardedReadControl(input, target)) {
      throw new Error("A guarded read boundary is required for this public query control");
    }
    if (action.type === "SET_CHECKED") {
      if ((target.kind !== "CHECKBOX" && target.kind !== "RADIO") || target.checked === undefined || target.checked === action.checked
        || target.kind === "RADIO" && !action.checked || !input.session.setChecked) {
        throw new Error("SET_CHECKED target is not an observed permitted checkbox or selected radio option");
      }
      await this.operation(input, "SET_CHECKED", () => input.session.setChecked!(target.controlId, action.checked, this.actionOptions()));
      return;
    }
    if (action.type === "ADJUST_RANGE") {
      const current = Number(target.value);
      const boundary = Number(action.direction === "INCREASE" ? target.max : target.min);
      if (target.kind !== "RANGE" || !Number.isFinite(current) || !Number.isFinite(boundary) || (action.direction === "INCREASE" ? current >= boundary : current <= boundary) || !input.session.press) {
        throw new Error("ADJUST_RANGE target is not an observed in-range slider with a supported keyboard action");
      }
      await this.operation(input, "ADJUST_RANGE", () => input.session.press!(target.controlId, action.direction === "INCREASE" ? "ArrowRight" : "ArrowLeft", this.actionOptions()));
      return;
    }
    if (action.type === "SCROLL_REGION") {
      if (target.kind !== "REGION" || target.scrollable !== true || !input.session.scroll) {
        throw new Error("SCROLL_REGION target is not an observed scrollable region");
      }
      await this.operation(input, "SCROLL_REGION", () => input.session.scroll!(target.controlId, action.direction === "DOWN" ? 480 : -480, this.actionOptions()));
      return;
    }
    const authoritative = action.field === "DATE" ? input.goal.date
      : action.field === "PARTY_SIZE" ? input.goal.partySize : action.field === "LOCATION" && input.stage === "DISCOVERY" ? input.goal.location?.name : action.field === "RETRIEVAL" ? input.goal.retrievalExpression : undefined;
    if (authoritative === undefined) throw this.rejected(input.source, input.stage, `The current read has no authoritative ${action.field.toLowerCase()} value`);
    const value = String(authoritative);
    const filled = filledAuthoritativeField(target.value, this.authoritativeValues(input));
    if (filled) throw this.rejected(input.source,input.stage,`AUTHORITATIVE_INPUT_PRESENT:${filled}: one input retains one value; use a current observed option or a different input`);
    if (!this.boundInputField(target, action.field) || (action.field === "RETRIEVAL" || action.field === "LOCATION") && !this.guardedReadControl(input, target)) {
      throw new Error(`${action.type} target has the wrong control kind`);
    }
    const inputSource = action.field === "DATE" ? "DATE" : action.field === "PARTY_SIZE" ? "PARTY_SIZE"
      : action.field === "LOCATION" ? "AREA" : input.goal.retrievalSource;
    if (!inputSource) throw this.rejected(input.source, input.stage, "Retrieval input has no authoritative nonpersonal source");
    await this.operation(input, "FILL_AUTHORITATIVE", () => input.session.fill(target.controlId, value, { ...this.actionOptions(), inputSource }));
    // A new observation revision invalidates every prior reference, including this one.
    void observation;
  }

  private authoritativeValues(input: BrowserSkillReadInput): Record<string, string | number | undefined> {
    return {DATE:input.goal.date,PARTY_SIZE:input.goal.partySize,TIME:input.goal.timeWindow?.earliest,LOCATION:input.stage === "DISCOVERY" ? input.goal.location?.name : undefined,RETRIEVAL:input.goal.retrievalExpression};
  }

  private async waitForSettled(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession }, previous: BrowserSnapshot, countOperation = true): Promise<boolean> {
    // Navigation first samples readiness; a completed result can then use the
    // two-snapshot check. Explicit/action waits retain the four-second ceiling.
    const timeoutMs = this.remaining(countOperation ? 4_000 : 700);
    const startedAt = Date.now();
    const changed = input.session.waitForSettled
      ? await (countOperation ? this.operation(input, "WAIT_FOR_SETTLED", () => input.session.waitForSettled!(previous, timeoutMs))
        : this.bounded(input, "SETTLE_DIRECT_ACTION", () => input.session.waitForSettled!(previous, timeoutMs)))
      : false;
    this.pageUnsettled = !changed;
    this.record({
      source: input.source,
      stage: input.stage,
      event: "ASYNC_WAIT",
      url: input.session.settlementDiagnostics?.()?.url ?? previous.url,
      ...(input.session.settlementDiagnostics?.() ? { settlement: input.session.settlementDiagnostics!()! } : {}),
      detail: changed ? "PAGE_SETTLED" : "PAGE_STILL_LOADING_WITHIN_BOUND",
      waitMs: Date.now() - startedAt,
    });
    return changed;
  }

  private navigationOptions(timeoutMs = 20_000): { timeoutMs: number } {
    if (this.remaining(Number.MAX_SAFE_INTEGER) < 3_000) {
      throw new BrowserRuntimeError("BROWSER_BUDGET_EXHAUSTED", "Navigation requires at least 3000 ms of remaining browser budget");
    }
    return { timeoutMs: Math.max(1, this.remaining(timeoutMs)) };
  }

  /** Interactive Playwright APIs otherwise inherit their 30 second default. */
  private actionOptions(): { timeoutMs: number } {
    return { timeoutMs: Math.max(1, this.remaining(5_000)) };
  }

  /** Structural permit only: labels and a page's claimed read-only status never authorize an operation. */
  private sameDocumentFragment(target: ObservedTarget, currentUrl: string): boolean {
    if (target.kind !== "LINK" || target.nativeTag !== "A" || !target.href?.includes("#")) return false;
    const destination = new URL(target.href);
    const current = new URL(currentUrl);
    destination.hash = "";
    current.hash = "";
    return destination.href === current.href;
  }

  private safeFragmentClick(input: BrowserSkillReadInput, snapshot: BrowserSnapshot, target: ObservedTarget): boolean {
    return this.sameDocumentFragment(target, snapshot.url)
      && !!this.allowedUrl(target.href!, input.allowedOrigins)
      && !/\/(?:login|signin|account|checkout|payment|reserve|booking|cancel)(?:\/|$)/i.test(new URL(target.href!).pathname)
      && !/\b(?:login|sign\s*in|register|reserve|book|checkout|pay|purchase|cancel|delete|confirm)\b/i.test(target.label);
  }

  private safeGenericClick(target: ObservedTarget): boolean {
    if (target.kind !== "BUTTON" && target.kind !== "OPTION") return false;
    // A `type=button` calendar/navigation control may live inside a POST form but
    // cannot submit that form. A submit control remains forbidden regardless of the
    // surrounding method; this is structural, not a label- or method-only permit.
    // Registry marks only read-only INPUT comboboxes as BUTTON targets. Clicking
    // that input or a DIV/LI/SPAN option cannot natively submit its parent form.
    // Native buttons (including role=option) retain the default-submit guard.
    const nonSubmittingChoice = (target.role === "combobox" && [
        "INPUT",
        "DIV",
        "SPAN",
      ].includes(target.nativeTag ?? ""))
      || (target.role === "option" && nonSubmittingOptionTags.has(target.nativeTag ?? ""));
    if (target.type?.toLowerCase() === "submit" || (!target.type && target.formMethod === "POST" && !nonSubmittingChoice)) return false;
    if (/\b(?:login|sign\s*in|register|reserve|book|checkout|pay|purchase|cancel|delete|confirm)\b/i.test(target.label)) return false;
    return true;
  }

  /** Network admission, not page markup, is the one wider UI permission. */
  private guardedReadControl(input: BrowserSkillReadInput, target: ObservedTarget): boolean {
    if (input.session.metadata.readNetworkBoundary !== "INSTALLED") return false;
    if (![
        "BUTTON",
        "CHECKBOX",
        "RADIO",
        "RANGE",
        "REGION",
        "OPTION",
        "INPUT",
      ].includes(target.kind)) return false;
    if (target.kind === "INPUT" && !target.readOnly && !this.boundInputField(target, "RETRIEVAL") && !this.boundInputField(target, "LOCATION")) return false;
    return !/\b(?:login|sign\s*in|register|reserve|book|checkout|pay|purchase|cancel|delete|confirm)\b/i.test(target.label);
  }

  /** A Guarded GET form submit starts a public query, not an immediate result. */
  private guardedPublicQuerySubmit(input: BrowserSkillReadInput, target: ObservedTarget): boolean {
    return this.guardedReadControl(input, target)
      && target.kind === "BUTTON"
      && target.formMethod === "GET"
      && Boolean(target.formObservation);
  }

  private async operation<Value>(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal">,
    label: string,
    operation: () => Promise<Value>,
  ): Promise<Value> {
    if (input.signal.aborted || this.sessionSignal?.aborted) this.assertActive(input.signal);
    if (label === "NAVIGATE" || label === "OPEN_LINK" || label === "SUBMIT_PUBLIC_QUERY") {
      try { this.navigationOptions(); }
      catch (error) { this.recordLifecycleFailure(input.source, input.stage, "OPERATION_FAILED", error); throw error; }
    }
    this.assertActive(input.signal);
    if (this.operationCount >= (this.options.maxOperationsPerCandidate)) {
      this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
      throw new BrowserRuntimeError("BROWSER_OPERATION_BUDGET_EXCEEDED", "Browser operation budget exceeded", undefined, "CANDIDATE");
    }
    this.ensureLifecycle(input.source, input.stage);
    this.operationCount += 1;
    this.record({ source: input.source, stage: input.stage, event: "OPERATION_STARTED", detail: label });
    try {
      const value = await this.bounded(input, label, operation);
      this.assertActive(input.signal);
      this.record({ source: input.source, stage: input.stage, event: "OPERATION_FINISHED", detail: label });
      return value;
    } catch (error) {
      const navigation = label === "NAVIGATE" || label === "OPEN_LINK" || label === "SUBMIT_PUBLIC_QUERY";
      const timedNavigation = navigation && error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_FAILED"
        && error.cause instanceof Error && error.cause.name === "TimeoutError";
      const failure = input.signal.aborted
        ? new BrowserRuntimeError("BROWSER_ABORTED", "Browser operation was aborted", error)
        : timedNavigation ? new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser navigation exceeded its bounded navigation timeout", error) : error;
      this.recordLifecycleFailure(input.source, input.stage, "OPERATION_FAILED", failure);
      const invalidSession = this.options.reuseSourceSessions && this.session?.isClosed?.() === true;
      if ((navigation || invalidSession) && failure instanceof BrowserRuntimeError && (failure.code === "BROWSER_RUNTIME_FAILED" || failure.code === "BROWSER_TIMEOUT")) {
        void this.close("RUNTIME_FAILURE");
      }
      throw failure;
    }
  }

  /** Shared page-fact model work consumes the existing source/candidate/run budgets. */
  async readModel<Value>(signal: AbortSignal, work: () => Promise<Value>): Promise<Value> {
    this.assertActive(signal);
    if (this.budget.totalModelCalls >= Math.min(this.options.maxModelCallsTotal, this.budget.maxModelCalls ?? Infinity)) {
      throw new BrowserRuntimeError("BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED", "Shared browser-model budget exhausted");
    }
    if (this.modelCalls >= this.options.maxModelCallsPerCandidate) {
      throw new BrowserRuntimeError("BROWSER_CANDIDATE_MODEL_BUDGET_EXCEEDED", "Candidate browser-model budget exhausted");
    }
    if (this.remaining(1) <= 0) throw this.timeoutError("SOURCE_FACT_MODEL");
    this.modelCalls++; this.budget.totalModelCalls++;
    return this.bounded({signal}, "SOURCE_FACT_MODEL", work);
  }

  /**
   * Every awaited provider/runtime/model operation consumes the remaining
   * candidate window. On expiry discard the shared session so a late action
   * cannot race a later candidate through the same page.
   */
  private async bounded<Value>(
    input: Pick<BrowserSkillReadInput, "signal">,
    label: string,
    work: () => Promise<Value>,
  ): Promise<Value> {
    this.assertActive(input.signal);
    const timeoutMs = this.remaining(Number.MAX_SAFE_INTEGER);
    if (timeoutMs <= 0) throw this.timeoutError(label);
    let timedOut = false;
    let handle: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: ((reason: BrowserRuntimeError) => void) | undefined;
    const pending = work();
    const deadline = new Promise<never>((_resolve, reject) => {
      handle = setTimeout(() => {
        timedOut = true;
        reject(this.timeoutError(label));
      }, timeoutMs);
    });
    const parentAbort = new Promise<never>((_resolve, reject) => {
      rejectAbort = reject;
    });
    const onAbort = () => rejectAbort?.(new BrowserRuntimeError("BROWSER_ABORTED", "Browser operation was aborted"));
    input.signal.addEventListener("abort", onAbort, { once: true });
    try {
      return await Promise.race([pending, deadline, parentAbort]);
    } catch (error) {
      if (timedOut || input.signal.aborted) {
        void pending.catch(() => undefined);
        void this.close(timedOut ? "DEADLINE_EXCEEDED" : "PARENT_ABORTED").catch(() => undefined);
      }
      throw error;
    } finally {
      if (handle) clearTimeout(handle);
      input.signal.removeEventListener("abort", onAbort);
    }
  }

  private remaining(limit: number): number {
    const total = this.options.maxAutomaticElapsedMs;
    const candidate = this.options.maxElapsedMsPerCandidate ?? total;
    const provider = this.options.maxElapsedMsPerProvider ?? candidate;
    return Math.min(limit, total - (Date.now() - this.startedAt), candidate - (Date.now() - this.candidateStartedAt), provider - (Date.now() - this.providerStartedAt));
  }

  private assertActive(signal: AbortSignal): void {
    if (signal.aborted || this.sessionSignal?.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser execution was aborted");
    const scope = this.deadlineScope();
    if (scope === "run") {
      throw new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser execution exceeded its automatic deadline", undefined, "RUN");
    }
    if (scope === "candidate") {
      throw new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser candidate investigation exceeded its automatic deadline", undefined, "CANDIDATE");
    }
    if (scope === "provider") {
      throw new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser provider investigation exceeded its automatic deadline", undefined, "PROVIDER");
    }
  }

  private deadlineScope(): "run" | "candidate" | "provider" | "available" {
    const now = Date.now();
    const runRemaining = this.options.maxAutomaticElapsedMs - (now - this.startedAt);
    const candidateLimit = this.options.maxElapsedMsPerCandidate ?? this.options.maxAutomaticElapsedMs;
    const candidateRemaining = candidateLimit - (now - this.candidateStartedAt);
    const providerLimit = this.options.maxElapsedMsPerProvider ?? candidateLimit;
    const providerRemaining = providerLimit - (now - this.providerStartedAt);
    if (runRemaining > 0 && candidateRemaining > 0 && providerRemaining > 0) return "available";
    const expired = (["run", "candidate", "provider"] as const)
      .map((scope) => ({ scope, remaining: scope === "run" ? runRemaining : scope === "candidate" ? candidateRemaining : providerRemaining }))
      .filter((entry) => entry.remaining <= 0)
      .sort((left, right) => left.remaining - right.remaining);
    return expired[0]?.scope ?? "available";
  }

  private allowedUrl(value: string, allowedOrigins: readonly string[]): string | undefined {
    try {
      const url = new URL(value);
      return allowedOrigins.includes(url.origin) ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  }

  private rejected(source: BrowserExecutionDiagnostic["source"], stage: BrowserExecutionDiagnostic["stage"], detail: string): BrowserRuntimeError {
    this.record({ source, stage, event: "REJECTED", detail });
    return new BrowserRuntimeError("UNEXPECTED_PAGE", detail);
  }

  private timeoutError(label: string): BrowserRuntimeError {
    const scope = this.deadlineScope();
    const typedScope: BrowserDeadlineScope = scope === "run" ? "RUN" : scope === "candidate" ? "CANDIDATE" : "PROVIDER";
    return new BrowserRuntimeError("BROWSER_TIMEOUT", `Browser ${label} exceeded the ${scope} deadline`, undefined, typedScope);
  }

  private ensureLifecycle(source: BrowserExecutionDiagnostic["source"], stage: BrowserExecutionDiagnostic["stage"], preserveProviderWindow = false): void {
    if (!this.candidateLifecycleOpen) {
      this.candidateLifecycleOpen = true;
      this.record({ source, stage, event: "CANDIDATE_STARTED", detail: "CANDIDATE_SCOPE" });
    }
    if (!this.providerLifecycleOpen) {
      this.providerLifecycleOpen = true;
      this.activeLifecycle = { source, stage };
      if (!preserveProviderWindow) this.providerStartedAt = Date.now();
      this.providerModelCallsAtStart = this.modelCalls;
      this.providerOperationCountAtStart = this.operationCount;
      this.record({ source, stage, event: "PROVIDER_STARTED", detail: "PROVIDER_SCOPE" });
    }
  }

  private finishProvider(outcome: "FINISHED" | "FAILED" | "ABANDONED", reason: BrowserExecutionReason): void {
    if (!this.providerLifecycleOpen || !this.activeLifecycle) return;
    this.record({ ...this.activeLifecycle, event: "PROVIDER_FINISHED", detail: "PROVIDER_SCOPE", lifecycle: { outcome, reason } });
    this.providerLifecycleOpen = false;
  }

  private finishCandidate(outcome: "FINISHED" | "FAILED" | "ABANDONED", reason: BrowserExecutionReason): void {
    if (!this.candidateLifecycleOpen || !this.activeLifecycle) return;
    this.record({ ...this.activeLifecycle, event: "CANDIDATE_FINISHED", detail: "CANDIDATE_SCOPE", lifecycle: { outcome, reason } });
    this.candidateLifecycleOpen = false;
  }

  private reasonForFailure(error: unknown, fallback: BrowserExecutionReason = "OPERATION_FAILED"): BrowserExecutionReason {
    if (error instanceof BrowserRuntimeError) {
      if (error.code === "BROWSER_ABORTED") return "PARENT_ABORTED";
      if (error.code === "BROWSER_TIMEOUT") return "DEADLINE_EXCEEDED";
      if (error.code === "BROWSER_BUDGET_EXHAUSTED") return "NAVIGATION_BUDGET_EXHAUSTED";
      if (error.code === "BROWSER_OPERATION_BUDGET_EXCEEDED") return "OPERATION_BUDGET_EXHAUSTED";
      if (error.code === "BROWSER_RUNTIME_UNAVAILABLE") return "RUNTIME_UNAVAILABLE";
      if (error.code === "BROWSER_RUNTIME_FAILED") return "RUNTIME_FAILURE";
      if (error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED") return "MODEL_BUDGET_EXHAUSTED";
    }
    return fallback;
  }

  private recordLifecycleFailure(
    source: BrowserExecutionDiagnostic["source"],
    stage: BrowserExecutionDiagnostic["stage"],
    event: "SESSION_OPEN_FAILED" | "OPERATION_FAILED" | "MODEL_DECISION_FAILED" | "BUDGET_EXHAUSTED",
    error: unknown,
    fallback?: BrowserExecutionReason,
  ): void {
    const runtime = error instanceof BrowserRuntimeError ? error : undefined;
    this.record({
      source,
      stage,
      event,
      detail: safeErrorDetail(error),
      ...(runtime?.networkFailures?.length ? { networkFailures: runtime.networkFailures } : {}),
      lifecycle: {
        outcome: runtime?.code === "BROWSER_ABORTED" ? "ABANDONED" : "FAILED",
        reason: this.reasonForFailure(error, fallback),
        ...(runtime?.scope ? { scope: runtime.scope } : {}),
        ...(runtime ? { failureCode: runtime.code } : {}),
      },
    });
  }

  private recordBudgetExhausted(
    input: Pick<BrowserSkillReadInput, "source" | "stage">,
    reason: Extract<BrowserExecutionReason, "MODEL_BUDGET_EXHAUSTED" | "OPERATION_BUDGET_EXHAUSTED" | "DEADLINE_EXCEEDED">,
  ): void {
    const scope = reason === "DEADLINE_EXCEEDED" ? this.timeoutError("budget").scope : undefined;
    this.record({
      source: input.source,
      stage: input.stage,
      event: "BUDGET_EXHAUSTED",
      detail: reason,
      lifecycle: {
        outcome: "FAILED",
        reason,
        ...(scope ? { scope } : {}),
      },
    });
  }

  private record(
    input: Omit<BrowserExecutionDiagnostic, "elapsedMs" | "lifecycle"> & { lifecycle?: Partial<BrowserExecutionDiagnostic["lifecycle"]> },
  ): void {
    try {
      const now = Date.now();
      const defaultOutcome = input.event === "CANDIDATE_STARTED" || input.event === "PROVIDER_STARTED"
        || input.event === "SESSION_OPENING" || input.event === "OPERATION_STARTED" || input.event === "MODEL_DECISION_STARTED"
        ? "STARTED"
        : "FINISHED";
      this.options.onDiagnostic?.({
        ...input,
        effectiveLimits: { maxAutomaticElapsedMs: this.options.maxAutomaticElapsedMs, maxModelCallsPerCandidate: this.options.maxModelCallsPerCandidate, maxModelCallsTotal: Math.min(this.options.maxModelCallsTotal, this.budget.maxModelCalls ?? Infinity), maxOperationsPerCandidate: this.options.maxOperationsPerCandidate, maxAdvanceStepsPerAction:this.options.maxAdvanceStepsPerAction??this.options.maxOperationsPerCandidate },
        ...(this.candidateId ? { candidateId: this.candidateId } : {}),
        elapsedMs: now - this.startedAt,
        lifecycle: {
          outcome: input.lifecycle?.outcome ?? defaultOutcome,
          candidateElapsedMs: now - this.candidateStartedAt,
          providerElapsedMs: now - this.providerStartedAt,
          candidateModelCalls: this.modelCalls,
          providerModelCalls: this.modelCalls - this.providerModelCallsAtStart,
          candidateRuntimeOperations: this.operationCount,
          providerRuntimeOperations: this.operationCount - this.providerOperationCountAtStart,
          runModelCalls: this.budget.totalModelCalls,
          ...(input.lifecycle?.scope ? { scope: input.lifecycle.scope } : {}),
          ...(input.lifecycle?.reason ? { reason: input.lifecycle.reason } : {}),
          ...(input.lifecycle?.failureCode ? { failureCode: input.lifecycle.failureCode } : {}),
        },
      });
    } catch { /* diagnostics cannot affect execution */ }
  }
}

function sameObservation(left: BrowserSnapshot, right: BrowserSnapshot): boolean {
  // DOM hydration metadata can change after a click without changing what the reader can
  // observe. Completion has already inspected the fresh DOM; repeat prevention is based on
  // the user-visible page state only.
  return left.url === right.url && left.title === right.title && left.text === right.text;
}

/** No requested date participates in observing a displayed calendar month. */
function displayedCalendarMonth(controls: BrowserPageControl[]) {
  const months = new Map(controls.filter(control => control.visible && !control.blockedByActiveLayer && control.calendarMonth)
    .map(control => [`${control.calendarMonth!.year}-${control.calendarMonth!.month}`, control.calendarMonth!]));
  return months.size === 1 ? [...months.values()][0] : undefined;
}

/** Values are positive DOM observations. Empty or multiple values never imply a default. */
function observedControlGroups(observation: Observation): NonNullable<BrowserReadDecisionInput["observation"]["controlGroups"]> {
  const groups = new Map<string, { ref: string; label: string; selectedValues: string[] }>();
  for (const target of observation.targets.values()) {
    if (!target.controlGroupRef || !target.controlGroupLabel || target.controlGroupLabel === "Unlabelled group") continue;
    const group = groups.get(target.controlGroupRef) ?? { ref: target.controlGroupRef, label: target.controlGroupLabel, selectedValues: [] };
    groups.set(group.ref, group);
    const values = target.kind === "SELECT" ? (target.options ?? []).filter(option => option.selected).map(option => option.value || option.label)
      : target.selected || target.checked ? [target.calendarDate || target.value || target.label] : [];
    for (const value of values) if (value && !group.selectedValues.includes(value)) group.selectedValues.push(value);
  }
  return [...groups.values()];
}

function partyGroupConfirmed(observation: Observation, goal: BrowserReadGoal, groupKey: string | undefined): boolean {
  if (!groupKey || goal.partySize === undefined) return false;
  const ref = [...observation.targets.values()].find(target => target.controlGroupKey === groupKey)?.controlGroupRef;
  const group = ref ? observedControlGroups(observation).find(group => group.ref === ref) : undefined;
  return group?.selectedValues.length === 1 && matchesAuthoritativeControl({ label: group.selectedValues[0]!, value: group.selectedValues[0]!, role: "button" }, "PARTY_SIZE", goal);
}

function observationKey(snapshot: BrowserSnapshot, controls: BrowserPageControl[] = []): string {
  // A read-only filter can change live checkbox/range/select state while keeping
  // the same URL, title and prose.  The loop guard therefore keys off browser-
  // observed control state, without using opaque session ids or model refs.
  const controlState = controls.map((control) => JSON.stringify({
    kind: control.kind, role: control.role, label: control.label, value: control.value,
    href: control.href, type: control.type, disabled: control.disabled, visible: control.visible,
    selected: control.selected, expanded: control.expanded, checked: control.checked,
    min: control.min, max: control.max, valueText: control.valueText,
    scrollable: control.scrollable, scrollTop: control.scrollTop,
    blockedByActiveLayer: control.blockedByActiveLayer, observationOnly: control.observationOnly,
    options: control.options,
  })).sort().join("\n");
  return `${snapshot.url}\n${snapshot.title}\n${snapshot.text}\n${controlState}`;
}

/**
 * Page text is insufficient for public query controls: checkbox, range and
 * scroll state can change without changing the rendered prose.  Compare only
 * browser-observed state, never the model's claimed effect.
 */
function controlsChanged(before: BrowserPageControl[], after: BrowserPageControl[]): boolean {
  const state = (control: BrowserPageControl) => JSON.stringify({
    value: control.value, selected: control.selected, disabled: control.disabled, visible: control.visible,
    expanded: control.expanded, checked: control.checked,
    min: control.min, max: control.max, scrollable: control.scrollable, scrollTop: control.scrollTop,
    options: control.options,
  });
  const previous = new Map(before.map((control) => [control.stableKey, state(control)]));
  const current = new Map(after.map((control) => [control.stableKey, state(control)]));
  if (previous.size !== current.size) return true;
  return [...previous].some(([key, value]) => current.get(key) !== value);
}
