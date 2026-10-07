import type { BrowserControlHint, BrowserPageControl, BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError, type BrowserDeadlineScope, type BrowserRuntimeFailureCode } from "./browser-runtime-errors.js";
import {
  type BrowserReadAction,
  type BrowserReadActionDecisionPort,
  type BrowserReadGoal,
  type BrowserReadActionTarget,
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
    | "OBSERVED" | "SKILL_STARTED" | "METHOD_INCOMPLETE" | "MODEL_WIRE" | "MODEL_ACTION" | "MODEL_STOP" | "ASYNC_WAIT" | "POST_ACTION_VERIFIED" | "REJECTED" | "CLOSED";
  elapsedMs: number;
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
  observation?: {
    title: string;
    visibleTextExcerpt: string;
    targets: Array<Pick<BrowserReadActionTarget, "ref" | "kind" | "label" | "href">>;
  };
}

export type BrowserExecutionReason = "ADAPTER_RETURNED" | "SOURCE_SCOPE_REPLACED" | "EXECUTOR_CLOSED" | "PARENT_ABORTED"
  | "DEADLINE_EXCEEDED" | "MODEL_BUDGET_EXHAUSTED" | "OPERATION_BUDGET_EXHAUSTED"
  | "RUNTIME_UNAVAILABLE" | "RUNTIME_FAILURE" | "OPERATION_FAILED";

export interface BrowserTaskExecutorOptions {
  modelDecision?: BrowserReadActionDecisionPort;
  maxModelCallsPerCandidate?: number;
  maxModelCallsTotal?: number;
  maxOperationsPerCandidate?: number;
  /** Bounds all browser work for an outlet across source fallback. */
  maxElapsedMsPerCandidate?: number;
  /** Bounds one provider path without resetting the candidate-wide budget. */
  maxElapsedMsPerProvider?: number;
  maxAutomaticElapsedMs?: number;
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

export interface BrowserSkillReadInput {
  taskId: string;
  source: string;
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY" | "FACTS";
  session: BrowserSession;
  signal: AbortSignal;
  allowedOrigins: readonly string[];
  /** Complete Router-bound target; model guidance cannot alter it. */
  goal: BrowserReadGoal;
  objective: string;
  /** Pack-owned source guidance; the browser core never chooses a site skill. */
  sourceSkillPath?: string;
  /** Current method result; it is context for continuation, never a provider failure by itself. */
  methodReason?: string;
  /** A source-owned, already-authorized shortcut; its effect is always post-condition checked. */
  shortcut?: { name: string; run(snapshot: BrowserSnapshot): Promise<void> };
  controlHints?(snapshot: Readonly<BrowserSnapshot>): readonly BrowserControlHint[];
  completion(snapshot: BrowserSnapshot, controls: BrowserPageControl[]): { complete: boolean; reason: string };
}

export interface BrowserGenericReadResult {
  status: "COMPLETED" | "MODEL_HANDOFF" | "REQUESTED_HUMAN_HELP" | "NO_SAFE_ACTION" | "BUDGET_EXCEEDED" | "MODEL_FAILURE";
  snapshot: BrowserSnapshot;
  /** Live DOM controls from the same observation as the terminal browser decision. */
  controls: BrowserPageControl[];
}

interface ObservedTarget extends BrowserReadActionTarget { controlId: string; stableKey: string; nativeTag?: string; inputName?: string; optionNative?: boolean; optionOwnerId?: string; ownerStableKey?: string; radioGroupKey?: string; retrievalValue?: string; }

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

function toObservedTargets(controls: BrowserPageControl[], revision: number): Map<string, ObservedTarget> {
  const targets = new Map<string, ObservedTarget>();
  const controlRefs = new Map<string, string>();
  const eligible = controls.filter(control => control.visible && !control.blockedByActiveLayer && !control.observationOnly
    && (control.kind !== "LINK" || control.href !== undefined));
  for (const control of eligible) {
    const ref = `observation:${revision}:target:${targets.size + 1}`;
    controlRefs.set(control.id, ref);
    targets.set(ref, {
      ref, controlId: control.id, stableKey: control.stableKey, ...(control.structure ? { nativeTag: control.structure.tag, ...(control.structure.name ? { inputName: control.structure.name } : {}) } : {}), kind: control.kind, role: control.role, label: control.label,
      ...(control.kind === "RADIO" && control.structure?.radioGroupKey ? { radioGroupKey: control.structure.radioGroupKey } : {}),
      ...(control.value ? { value: control.value } : {}), ...(control.href ? { href: control.href } : {}), ...(control.formMethod ? { formMethod: control.formMethod } : {}), ...(control.type ? { type: control.type } : {}), ...(control.selected ? { selected: true } : {}),
      ...(control.disabled ? { disabled: true } : {}), ...(control.optionOwnerId ? { optionOwnerId: control.optionOwnerId } : {}),
      ...(control.checked !== undefined ? { checked: control.checked } : {}), ...(control.min ? { min: control.min } : {}), ...(control.max ? { max: control.max } : {}), ...(control.valueText ? { valueText: control.valueText } : {}), ...(control.scrollable !== undefined ? { scrollable: control.scrollable } : {}), ...(control.scrollTop !== undefined ? { scrollTop: control.scrollTop } : {}), ...(control.blockedByActiveLayer ? { blockedByActiveLayer: true } : {}), ...(control.options ? { options: control.options } : {}),
    });
    if (control.kind === "SELECT" && !control.disabled) {
      for (const option of control.options ?? []) {
        const optionRef = `observation:${revision}:target:${targets.size + 1}`;
        targets.set(optionRef, {
          ref: optionRef, kind: "OPTION", role: "option", label: option.label, value: option.value,
          selected: option.selected, disabled: option.disabled, ownerRef: ref,
          controlId: control.id, optionOwnerId: control.id, optionNative: true,
          ownerStableKey: control.stableKey,
          stableKey: `${control.stableKey}|option|${option.value}`,
        });
      }
    }
  }
  for (const target of targets.values()) {
    if (target.role !== "option" || target.optionNative) continue;
    target.kind = "OPTION";
    if (target.optionOwnerId) {
      const ownerRef = controlRefs.get(target.optionOwnerId);
      if (ownerRef) {
        target.ownerRef = ownerRef;
        const ownerStableKey = targets.get(ownerRef)?.stableKey;
        if (ownerStableKey) target.ownerStableKey = ownerStableKey;
      }
    }
  }
  return targets;
}

/**
 * A bounded, reusable browser session for one Restaurant availability read.
 * It deliberately has no Restaurant evidence or State knowledge.
 */
export class BrowserTaskExecutor {
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
  private readonly startedAt = Date.now();

  constructor(private readonly runtime: BrowserRuntime, private readonly options: BrowserTaskExecutorOptions = {}) {
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

  async acquire(signal: AbortSignal, source: BrowserExecutionDiagnostic["source"], stage: BrowserExecutionDiagnostic["stage"], networkPolicy?: BrowserReadNetworkPolicy): Promise<BrowserSession> {
    this.ensureLifecycle(source, stage);
    try {
      this.assertActive(signal);
    } catch (error) {
      this.recordLifecycleFailure(source, stage, "SESSION_OPEN_FAILED", error);
      this.finishProvider(error instanceof BrowserRuntimeError && error.code === "BROWSER_ABORTED" ? "ABANDONED" : "FAILED", this.reasonForFailure(error));
      throw error;
    }
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
    const onSessionAbort = () => { if (this.session === session) void this.close("PARENT_ABORTED"); };
    signal.addEventListener("abort", onSessionAbort, { once: true });
    this.sessionAbortCleanup = () => signal.removeEventListener("abort", onSessionAbort);
    this.record({ source, stage, event: "SESSION_OPENED", detail: session.metadata.runtimeProvider });
    return session;
  }

  async navigate(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal" | "allowedOrigins"> & { session: BrowserSession; url: string; observed?: boolean; timeoutMs?: number },
  ): Promise<void> {
    const url = this.allowedUrl(input.url, input.allowedOrigins);
    if (input.observed && !url) throw this.rejected(input.source, input.stage, "Observed navigation target is outside the source allowlist");
    if (!url) throw this.rejected(input.source, input.stage, "Site method navigation target is outside the source allowlist");
    await this.operation(input, "NAVIGATE", async () => {
      const timeoutMs = this.remaining(input.timeoutMs ?? 20_000);
      await input.session.prepareNavigation?.(url, { timeoutMs });
      await input.session.navigate(url, { waitUntil: "domcontentloaded", timeoutMs });
    });
  }

  async select(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession; selector: string; value: string; authoritativeValue: string },
  ): Promise<string[]> {
    if (input.value !== input.authoritativeValue) throw this.rejected(input.source, input.stage, "A site method attempted to select a non-authoritative value");
    return this.operation(input, "SELECT", () => input.session.select(input.selector, input.value, this.actionOptions()));
  }

  async fill(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession; selector: string; value: string; authoritativeValue: string },
  ): Promise<void> {
    if (input.value !== input.authoritativeValue) throw this.rejected(input.source, input.stage, "A site method attempted to fill a non-authoritative value");
    await this.operation(input, "FILL", () => input.session.fill(input.selector, input.value, this.actionOptions()));
  }

  async waitFor(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession; selector: string; timeoutMs?: number },
  ): Promise<void> {
    await this.operation(input, "WAIT", () => input.session.waitFor(input.selector, this.remaining(input.timeoutMs ?? 10_000)));
  }

  async snapshot(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession }): Promise<BrowserSnapshot> {
    const snapshot = await this.operation(input, "SNAPSHOT", () => input.session.snapshot());
    this.record({ source: input.source, stage: input.stage, event: "OBSERVED", url: snapshot.url });
    return snapshot;
  }

  /** Reads the current source controls through the same operation/deadline budget as a skill observation. */
  async observeControls(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession }): Promise<BrowserPageControl[]> {
    if (!input.session.observeControls) return [];
    return this.operation(input, "OBSERVE_CONTROLS", () => input.session.observeControls!());
  }

  async runSkill(input: BrowserSkillReadInput): Promise<BrowserGenericReadResult> {
    let snapshot = await this.snapshot(input);
    // A request-shaped HTML link can be stale while the live control carrying
    // the same URL is disabled. Read both representations before accepting a
    // completion, including on the initial snapshot and after a source-owned
    // shortcut. HTML alone is never a shortcut around current DOM evidence.
    let verifiedObservation: Observation | undefined = await this.observe(input, snapshot);
    let completion = input.completion(snapshot, verifiedObservation.controls);
    if (completion.complete) return { status: "COMPLETED", snapshot, controls: verifiedObservation.controls };
    let progress = input.methodReason ?? completion.reason;
    let shortcutUsed = false;
    let postAction = false;
    let pendingOption: ObservedTarget | undefined;
    let pendingRadio: ObservedTarget | undefined;
    let unchangedPageKey: string | undefined;
    let lastRejectedProposal: string | undefined;
    let repeatedRejectedProposals = 0;
    const recoveredObstructions = new Set<string>();
    const recordRejectedProposal = (key: string) => {
      repeatedRejectedProposals = key === lastRejectedProposal ? repeatedRejectedProposals + 1 : 1;
      lastRejectedProposal = key;
      return repeatedRejectedProposals >= 2;
    };
    const pageVisits = new Map<string, number>();
    const recordPageVisit = (value: BrowserSnapshot, controls: BrowserPageControl[]) => {
      const key = observationKey(value, controls);
      const count = (pageVisits.get(key) ?? 0) + 1;
      pageVisits.set(key, count);
      return count;
    };
    const pendingControlKeys = new Set<string>();
    for (;;) {
      const runModelCeiling = Math.min(
        this.options.maxModelCallsTotal ?? 12,
        this.budget.maxModelCalls ?? Number.POSITIVE_INFINITY,
      );
      if (this.budget.totalModelCalls >= runModelCeiling) {
        const error = new BrowserRuntimeError("BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED", "Shared browser-model budget exhausted for this read run");
        this.recordLifecycleFailure(input.source, input.stage, "BUDGET_EXHAUSTED", error);
        throw error;
      }
      if (this.modelCalls >= (this.options.maxModelCallsPerCandidate ?? 6)) {
        this.recordBudgetExhausted(input, "MODEL_BUDGET_EXHAUSTED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: [] };
      }
      if (this.operationCount >= (this.options.maxOperationsPerCandidate ?? 24)) {
        this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: [] };
      }
      if (this.remaining(1) <= 0) {
        this.recordBudgetExhausted(input, "DEADLINE_EXCEEDED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: [] };
      }
      if (!shortcutUsed && input.shortcut) {
        shortcutUsed = true;
        try {
          await this.bounded(input, "SHORTCUT", () => input.shortcut!.run(snapshot));
          snapshot = await this.snapshot(input);
          verifiedObservation = await this.observe(input, snapshot);
          completion = input.completion(snapshot, verifiedObservation.controls);
          if (completion.complete) return { status: "COMPLETED", snapshot, controls: verifiedObservation.controls };
          progress = completion.reason;
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: `${input.shortcut.name}: ${progress}` });
        } catch (error) {
          progress = `${input.shortcut.name} did not complete: ${error instanceof Error ? safeText(error.message, 240) : "unknown error"}`;
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: progress });
        }
      }
      // The browser model may only choose a safe observed navigation/control.
      // It never writes or asserts a Restaurant fact; the adapter grounds a
      // later observation against candidate identity and source excerpts.
      // A post-action observation was already taken from this fresh snapshot.
      // Reuse it for the next decision; observing again spends budget without
      // making the target any fresher than the snapshot it belongs to.
      const observation: Observation = verifiedObservation ?? await this.observe(input, snapshot);
      verifiedObservation = undefined;
      if (pendingOption && this.optionSelectionObserved(pendingOption, observation.controls)) pendingOption = undefined;
      if (pendingRadio && this.radioSelectionObserved(pendingRadio, observation.controls)) pendingRadio = undefined;
      completion = input.completion(snapshot, observation.controls);
      if (completion.complete && !pendingOption && !pendingRadio) return { status: "COMPLETED", snapshot, controls: observation.controls };
      if (!this.options.modelDecision) return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
      if (!postAction) {
        recordPageVisit(snapshot, observation.controls);
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
      const selectedFields = (["DATE", "PARTY_SIZE"] as const).filter(field => alreadySelected.some(control => matchesAuthoritativeControl(control, field, input.goal)));
      const actionTargets = [...observation.targets.values()].filter(target => !pendingControlKeys.has(target.stableKey)
        && !(target.role === "combobox" && observation.controls.some(control => control.id === target.controlId && control.expanded === true))
        && !(target.kind === "BUTTON" && selectedFields.some(field => matchesAuthoritativeControl(target, field, input.goal))));
      let action: BrowserReadAction;
      try {
        this.modelCalls += 1;
        this.budget.totalModelCalls += 1;
        this.record({ source: input.source, stage: input.stage, event: "MODEL_DECISION_STARTED", detail: "MODEL_DECISION" });
        action = await this.bounded(input, "MODEL_DECISION", () => this.options.modelDecision!.decide({
          taskId: input.taskId,
          source: input.source,
          stage: input.stage,
          objective: input.objective,
          progress: `${progress}${alreadySelected.length ? ` Already selected (do not repeat): ${alreadySelected.map(target => target.label).join(", ")}.` : ""}`,
          skills: loadBrowserReadSkills(input.source, input.sourceSkillPath),
          goal: input.goal,
          observation: {
            revision: observation.revision,
            url: observation.snapshot.url,
            title: observation.snapshot.title,
            visibleText: safeText(observation.snapshot.text),
            pageActions: input.session.pressEscape && input.session.metadata.readNetworkBoundary === "INSTALLED" ? ["WAIT", "PRESS_ESCAPE"] : ["WAIT"],
            targets: actionTargets.map(({ controlId: _controlId, stableKey: _stableKey, nativeTag: _nativeTag, optionNative: _optionNative, optionOwnerId: _optionOwnerId, ownerStableKey: _ownerStableKey, radioGroupKey: _radioGroupKey, ...target }) => ({
              ...target, ...this.actionHints(input, observation, observation.targets.get(target.ref)!, pendingOption !== undefined || pendingRadio !== undefined),
            })),
          },
        }));
        const wire = this.options.modelDecision!.takeLastWireRecord?.();
        if (wire) this.record({ source: input.source, stage: input.stage, event: "MODEL_WIRE", url: snapshot.url, detail: `MODEL_WIRE:${JSON.stringify(wire)}` });
        this.record({ source: input.source, stage: input.stage, event: "MODEL_DECISION_FINISHED", detail: "MODEL_DECISION" });
      } catch (error) {
        const wire = this.options.modelDecision!.takeLastWireRecord?.();
        if (wire) this.record({ source: input.source, stage: input.stage, event: "MODEL_WIRE", url: snapshot.url, detail: `MODEL_WIRE:${JSON.stringify(wire)}` });
        this.recordLifecycleFailure(input.source, input.stage, "MODEL_DECISION_FAILED", error);
        const rejectionDetail = error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT"
          ? safeWireRejectionDetail(error.wireRejection) : safeErrorDetail(error);
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: rejectionDetail });
        if (error instanceof BrowserRuntimeError || (error && typeof error === "object" && "code" in error && error.code === "MODEL_CALL_BUDGET_EXHAUSTED")) throw error;
        if (error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT") {
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
      if (action.type === "COMPLETE") {
        completion = input.completion(snapshot, observation.controls);
        if (pendingOption || pendingRadio) return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        if (completion.complete) return { status: "COMPLETED", snapshot, controls: observation.controls };
        // COMPLETE is a request to finish, never evidence that the source has
        // finished.  Keep the same browser session and give the concrete
        // missing predicate back to the model.  A second COMPLETE on the same
        // unmodified observation has made no progress and fails closed.
        if (recordRejectedProposal(`${observationKey(snapshot, observation.controls)}|COMPLETE`)) {
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_PROGRESS_COMPLETE_REQUEST" });
          return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        }
        progress = `Completion was not accepted: ${completion.reason} Continue with an observed safe action, wait for a visible result, or request human help.`;
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "COMPLETE_PREDICATE_UNSATISFIED" });
        // A rejected completion is not an action, but it may race a source's
        // asynchronous result rendering.  Refresh the entire observation once
        // before asking the model again: controls alone cannot expose a result
        // region that hydrated without changing a control value.
        if (this.operationCount + 3 > (this.options.maxOperationsPerCandidate ?? 24)) {
          this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
          return { status: "BUDGET_EXCEEDED", snapshot, controls: observation.controls };
        }
        await this.waitForChange(input, snapshot);
        snapshot = await this.snapshot(input);
        verifiedObservation = await this.observe(input, snapshot);
        completion = input.completion(snapshot, verifiedObservation.controls);
        if (completion.complete) return { status: "COMPLETED", snapshot, controls: verifiedObservation.controls };
        postAction = true;
        continue;
      }
      if (action.type === "REQUEST_HUMAN_HELP") return { status: "REQUESTED_HUMAN_HELP", snapshot, controls: observation.controls };
      const target = action.type === "WAIT" || action.type === "PRESS_ESCAPE" ? undefined : observation.targets.get(action.targetRef);
      if (!target && action.type !== "WAIT" && action.type !== "PRESS_ESCAPE") {
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: "STALE_OR_UNKNOWN_TARGET_REF" });
        return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
      }
      const confirmationOperations = 2 + (input.session.observeControls ? 1 : 0);
      if (this.operationCount + confirmationOperations > (this.options.maxOperationsPerCandidate ?? 24)) {
        this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
        return { status: "BUDGET_EXCEEDED", snapshot, controls: observation.controls };
      }
      try {
        if (pendingOption && action.type === "CHOOSE_OPTION") {
          throw new Error("A previous option is still unconfirmed; WAIT for its selected value before choosing another option");
        }
        await this.applyGenericAction(input, observation, target, action);
      } catch (error) {
        const obstruction = target !== undefined && pointerObstruction(error);
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
        if (error instanceof BrowserRuntimeError) return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        if (recordRejectedProposal(`${observationKey(snapshot, observation.controls)}|${action.type}|${target?.stableKey ?? "PAGE"}|${safeErrorDetail(error, 240)}`)) {
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_PROGRESS_REJECTED_ACTION" });
          return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        }
        progress = `The previous proposed action was rejected by the executor: ${safeErrorDetail(error, 240)}. Choose another observed safe target, or request human help.`;
        continue;
      }
      lastRejectedProposal = undefined;
      repeatedRejectedProposals = 0;
      if (action.type === "CHOOSE_OPTION" && target) pendingOption = action.field === "RETRIEVAL"
        ? { ...target, retrievalValue: input.goal.retrievalExpression! } : target;
      if (action.type === "SET_CHECKED" && target?.kind === "RADIO") {
        pendingRadio = target;
      }
      const priorSnapshot = snapshot;
      const waitedForAsyncChange = action.type === "OPEN_LINK" || action.type === "CLICK" || action.type === "CLICK_AUTHORITATIVE" || action.type === "FILL_AUTHORITATIVE" || action.type === "CHOOSE_OPTION";
      snapshot = await this.snapshot(input);
      let postActionObservation = await this.observe(input, snapshot);
      let observedControlChange = controlsChanged(observation.controls, postActionObservation.controls);
      let changed = !sameObservation(priorSnapshot, snapshot) || observedControlChange;
      // A synchronous visible change needs no second browser wait. An unchanged
      // page or unconfirmed option still gets a bounded wait and fresh readback.
      if (waitedForAsyncChange && (!changed
        || pendingOption && !this.optionSelectionObserved(pendingOption, postActionObservation.controls)
        || pendingRadio && !this.radioSelectionObserved(pendingRadio, postActionObservation.controls))) {
        const waitingFrom = snapshot;
        await this.waitForChange(input, waitingFrom);
        snapshot = await this.snapshot(input);
        postActionObservation = await this.observe(input, snapshot);
        observedControlChange = controlsChanged(observation.controls, postActionObservation.controls);
        changed = !sameObservation(priorSnapshot, snapshot) || observedControlChange;
      }
      if (pendingOption && this.optionSelectionObserved(pendingOption, postActionObservation.controls)) pendingOption = undefined;
      if (pendingRadio && this.radioSelectionObserved(pendingRadio, postActionObservation.controls)) pendingRadio = undefined;
      const optionConfirmed = !pendingOption && !pendingRadio;
      // A source that did not show an async page change may still be settling
      // its controls. Reobserve on the next turn in that case.
      verifiedObservation = changed && optionConfirmed ? postActionObservation : undefined;
      const effectVerified = changed || observedControlChange;
      this.record({
        source: input.source,
        stage: input.stage,
        event: "POST_ACTION_VERIFIED",
        url: snapshot.url,
        detail: optionConfirmed ? effectVerified ? "OBSERVED_CHANGE_AFTER_MODEL_ACTION" : "ASYNC_RESULT_NOT_READY_AFTER_MODEL_ACTION" : "OPTION_VALUE_NOT_CONFIRMED",
        observation: this.diagnosticObservation(postActionObservation),
      });
      completion = input.completion(snapshot, postActionObservation.controls);
      if (completion.complete && optionConfirmed) return { status: "COMPLETED", snapshot, controls: postActionObservation.controls };
      if (!optionConfirmed) {
        pendingControlKeys.add((pendingOption ?? pendingRadio)!.stableKey);
        progress = "The selected query option was not confirmed by a fresh control observation. Wait for a visible selected value or use another observed safe action; do not repeat the same option blindly.";
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "OPTION_VALUE_NOT_CONFIRMED" });
        postAction = true;
        continue;
      }
      if (recordPageVisit(snapshot, postActionObservation.controls) >= 3) {
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_PROGRESS_PAGE_CYCLE" });
        return { status: "NO_SAFE_ACTION", snapshot, controls: postActionObservation.controls };
      }
      if (!effectVerified && sameObservation(priorSnapshot, snapshot)) {
        unchangedPageKey = observationKey(snapshot);
        if (target) pendingControlKeys.add(target.stableKey);
        progress = target
          ? `The previous ${action.type} was accepted, but its result is still not observable. Do not repeat that action on this unchanged page; use another observed safe control or WAIT for a bounded page-state change.`
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

  private async observe(input: BrowserSkillReadInput, snapshot: BrowserSnapshot): Promise<Observation> {
    this.observationRevision += 1;
    const controls = input.session.observeControls
      ? await this.operation(input, "OBSERVE_CONTROLS", () => input.session.observeControls!(input.controlHints?.(snapshot)))
      : [];
    return { revision: this.observationRevision, snapshot, controls, targets: toObservedTargets(controls, this.observationRevision) };
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
      && (control.value?.trim() === target.label.trim() || control.label.trim() === target.label.trim()));
  }

  /** Radio selection is valid only when its observed owning group now has this one selected item. */
  private radioSelectionObserved(target: ObservedTarget, controls: BrowserPageControl[]): boolean {
    if (target.kind !== "RADIO" || !target.radioGroupKey) return false;
    const group = controls.filter(control => control.kind === "RADIO" && control.structure?.radioGroupKey === target.radioGroupKey);
    const selected = group.filter(control => control.checked === true);
    return selected.length === 1 && selected[0]!.stableKey === target.stableKey;
  }

  private actionHints(input: BrowserSkillReadInput, observation: Observation, target: ObservedTarget, pendingSelection: boolean): Pick<BrowserReadActionTarget, "availableActions" | "rejectionReason"> {
    const availableActions: string[] = [];
    let rejectionReason: string | undefined;
    if (target.disabled) return { availableActions, rejectionReason: "DISABLED" };
    if (target.kind === "OPTION") {
      const owner = target.ownerRef ? observation.targets.get(target.ownerRef) : undefined;
      if (!owner || owner.controlId !== target.optionOwnerId || owner.role !== "combobox") rejectionReason = "WRONG_OPTION_OWNER";
      else if (target.disabled || target.selected) rejectionReason = "DISABLED_OR_SELECTED";
      else if (pendingSelection) rejectionReason = "PREVIOUS_OPTION_UNCONFIRMED";
      else if (!target.optionNative && !this.safeGenericClick(target)) rejectionReason = "WRITE_PROHIBITED";
      else {
        for (const field of ["DATE", "PARTY_SIZE", "TIME"] as const) {
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
      if (this.safeGenericClick(target) || this.guardedReadControl(input, target)) availableActions.push("CLICK");
      else rejectionReason = "WRITE_PROHIBITED";
      if ((this.safeGenericClick(target) || this.guardedReadControl(input, target)) && target.role !== "combobox" && target.selected !== true) {
        for (const field of ["DATE", "PARTY_SIZE"] as const) {
          if (matchesAuthoritativeControl(target, field, input.goal)) availableActions.push(`CLICK_AUTHORITATIVE:${field}`);
        }
      }
    } else if (target.kind === "INPUT") {
      if (input.goal.date && this.boundInputField(target, "DATE")) availableActions.push("FILL_AUTHORITATIVE:DATE");
      if (input.goal.partySize !== undefined && this.boundInputField(target, "PARTY_SIZE")) availableActions.push("FILL_AUTHORITATIVE:PARTY_SIZE");
      if (input.goal.retrievalExpression && this.boundInputField(target, "RETRIEVAL") && this.guardedReadControl(input, target)) availableActions.push("FILL_AUTHORITATIVE:RETRIEVAL");
      if (!availableActions.length) rejectionReason = "NO_BOUND_INPUT_FIELD";
    } else if (target.kind === "CHECKBOX" || target.kind === "RADIO" || target.kind === "RANGE") {
      const action = target.kind === "RANGE" ? "ADJUST_RANGE" : "SET_CHECKED";
      if (pendingSelection) rejectionReason = "PREVIOUS_OPTION_UNCONFIRMED";
      else if (this.guardedReadControl(input, target) && (target.kind !== "RADIO" || target.checked !== true)) availableActions.push(action);
      else rejectionReason = "QUERY_PERMISSION_REQUIRED";
    } else if (target.kind === "REGION") {
      if (target.scrollable && this.guardedReadControl(input, target)) availableActions.push("SCROLL_REGION");
      else rejectionReason = "NOT_SCROLLABLE";
    }
    return { availableActions, ...(rejectionReason ? { rejectionReason } : {}) };
  }

  private boundInputField(target: ObservedTarget, field: "DATE" | "PARTY_SIZE" | "RETRIEVAL"): boolean {
    if (target.kind !== "INPUT" || !["INPUT", "TEXTAREA"].includes(target.nativeTag ?? "")) return false;
    if (field === "DATE") return target.type === "date" || /\bdate\b/i.test(target.label);
    if (field === "PARTY_SIZE") return /(?:party|guest|people|persons|名|人数)/i.test(target.label);
    // Placeholders can describe an example request rather than the input's
    // purpose. Bind retrieval only to a text entry whose observed native name
    // or visible label identifies it as search, never to email/phone/password
    // fields that happen to mention a restaurant.
    const type = target.type?.toLowerCase();
    if (type && !["text", "search"].includes(type)) return false;
    const name = target.inputName ?? "";
    if (/(?:email|e-mail|phone|tel|password|card|address)/i.test(name)) return false;
    return /(?:search|keyword|query|restaurant|venue|店名|検索)/i.test(name)
      || /(?:search|keyword|restaurant|venue|店名|検索)/i.test(target.label);
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
      targets: [...observation.targets.values()].slice(0, 40).map(({ controlId: _controlId, stableKey: _stableKey, nativeTag: _nativeTag, optionNative: _optionNative, optionOwnerId: _optionOwnerId, ownerStableKey: _ownerStableKey, value: _value, formMethod: _formMethod, selected: _selected, ...target }) => ({
        ...target,
        ...(target.href ? { href: this.diagnosticUrl(target.href) } : {}),
      })),
    };
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

  private async applyGenericAction(input: BrowserSkillReadInput, observation: Observation, target: ObservedTarget | undefined, action: Exclude<BrowserReadAction, { type: "COMPLETE" | "REQUEST_HUMAN_HELP" }>): Promise<void> {
    if (action.type === "WAIT") {
      await this.waitForChange(input, observation.snapshot);
      return;
    }
    if (action.type === "PRESS_ESCAPE") {
      if (!input.session.pressEscape || input.session.metadata.readNetworkBoundary !== "INSTALLED") throw new Error("Page Escape requires an installed read boundary");
      await this.operation(input, "PRESS_ESCAPE", () => input.session.pressEscape!(this.actionOptions()));
      return;
    }
    if (!target) throw new Error("Action requires a current observed target");
    if (target.disabled) throw new Error("Observed target is disabled");
    if (action.type === "OPEN_LINK") {
      if (target.kind !== "LINK" || !target.href) throw new Error("OPEN_LINK target is not an observed link");
      if (this.sameDocumentFragment(target, observation.snapshot.url)) throw new Error("Same-document fragment controls use CLICK, then re-observe the page");
      if (!this.allowedUrl(target.href, input.allowedOrigins)) throw new Error("OPEN_LINK target is outside the allowed origin");
      if (/\/(?:login|signin|account|checkout|payment|reserve|booking|cancel)(?:\/|$)/i.test(new URL(target.href).pathname)) {
        throw new Error("OPEN_LINK target has a sensitive navigation path");
      }
      if (input.session.openLink) {
        await this.operation(input, "OPEN_LINK", async () => {
          if (input.session.prepareObservedNavigation) await input.session.prepareObservedNavigation(target.href!, this.actionOptions());
          else await input.session.prepareNavigation?.(target.href!, this.actionOptions());
          await input.session.openLink!(target.controlId, target.href!, this.actionOptions());
        });
      } else {
        // A runtime without popup support may only retain the existing same-page
        // behavior; it never fabricates a new-page identity.
        await this.navigate({ ...input, url: target.href, observed: true });
      }
      return;
    }
    if (action.type === "CLICK") {
      if (target.role === "option") throw new Error("CLICK cannot choose an option; use CHOOSE_OPTION with its observed owner");
      if (!this.safeGenericClick(target) && !this.safeFragmentClick(input, observation.snapshot, target)
        && !this.guardedReadControl(input, target)) {
        throw new Error("CLICK target has submit, navigation, or other write-capable structure");
      }
      await this.operation(input, "CLICK", () => input.session.click(target.controlId, this.actionOptions()));
      return;
    }
    if (action.type === "CLICK_AUTHORITATIVE") {
      if (target.role === "option") throw new Error("CLICK_AUTHORITATIVE cannot choose an option; use CHOOSE_OPTION");
      if (target.role === "combobox") throw new Error("Open a custom combobox with CLICK, then choose its newly observed option with CHOOSE_OPTION.");
      if (target.kind !== "BUTTON" || target.selected === true
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
      : action.field === "PARTY_SIZE" ? input.goal.partySize : input.goal.retrievalExpression;
    if (authoritative === undefined) throw this.rejected(input.source, input.stage, `The current read has no authoritative ${action.field.toLowerCase()} value`);
    const value = String(authoritative);
    if (!this.boundInputField(target, action.field) || action.field === "RETRIEVAL" && !this.guardedReadControl(input, target)) {
      throw new Error(`${action.type} target has the wrong control kind`);
    }
    await this.operation(input, "FILL_AUTHORITATIVE", () => input.session.fill(target.controlId, value, this.actionOptions()));
    // A new observation revision invalidates every prior reference, including this one.
    void observation;
  }

  private async waitForChange(input: BrowserSkillReadInput, previous: BrowserSnapshot): Promise<boolean> {
    const timeoutMs = this.remaining(2_500);
    const changed = input.session.waitForChange
      ? await this.operation(input, "WAIT_FOR_CHANGE", () => input.session.waitForChange!(previous, timeoutMs))
      : false;
    this.record({
      source: input.source,
      stage: input.stage,
      event: "ASYNC_WAIT",
      url: previous.url,
      detail: changed ? "PAGE_STATE_CHANGED" : "PAGE_STATE_UNCHANGED_WITHIN_BOUND",
    });
    return changed;
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
    const nonSubmittingChoice = (target.role === "combobox" && ["INPUT", "DIV", "SPAN"].includes(target.nativeTag ?? ""))
      || (target.role === "option" && ["DIV", "LI", "SPAN"].includes(target.nativeTag ?? ""));
    if (target.type?.toLowerCase() === "submit" || (!target.type && target.formMethod === "POST" && !nonSubmittingChoice)) return false;
    if (/\b(?:login|sign\s*in|register|reserve|book|checkout|pay|purchase|cancel|delete|confirm)\b/i.test(target.label)) return false;
    return true;
  }

  /** Network admission, not page markup, is the one wider UI permission. */
  private guardedReadControl(input: BrowserSkillReadInput, target: ObservedTarget): boolean {
    if (input.session.metadata.readNetworkBoundary !== "INSTALLED") return false;
    if (!["BUTTON", "CHECKBOX", "RADIO", "RANGE", "REGION", "OPTION", "INPUT"].includes(target.kind)) return false;
    if (target.kind === "INPUT" && !this.boundInputField(target, "RETRIEVAL")) return false;
    return !/\b(?:login|sign\s*in|register|reserve|book|checkout|pay|purchase|cancel|delete|confirm)\b/i.test(target.label);
  }

  private async operation<Value>(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal">,
    label: string,
    operation: () => Promise<Value>,
  ): Promise<Value> {
    this.assertActive(input.signal);
    if (this.operationCount >= (this.options.maxOperationsPerCandidate ?? 24)) {
      this.recordBudgetExhausted(input, "OPERATION_BUDGET_EXHAUSTED");
      throw new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser operation budget exceeded", undefined, "CANDIDATE");
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
      const failure = input.signal.aborted
        ? new BrowserRuntimeError("BROWSER_ABORTED", "Browser operation was aborted", error)
        : error;
      this.recordLifecycleFailure(input.source, input.stage, "OPERATION_FAILED", failure);
      if ((label === "NAVIGATE" || label === "OPEN_LINK") && failure instanceof BrowserRuntimeError && failure.code === "BROWSER_RUNTIME_FAILED") {
        void this.close("RUNTIME_FAILURE");
      }
      throw failure;
    }
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
    const total = this.options.maxAutomaticElapsedMs ?? 300_000;
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
    const runRemaining = (this.options.maxAutomaticElapsedMs ?? 300_000) - (now - this.startedAt);
    const candidateLimit = this.options.maxElapsedMsPerCandidate ?? (this.options.maxAutomaticElapsedMs ?? 300_000);
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

  private ensureLifecycle(source: BrowserExecutionDiagnostic["source"], stage: BrowserExecutionDiagnostic["stage"]): void {
    if (!this.candidateLifecycleOpen) {
      this.candidateLifecycleOpen = true;
      this.record({ source, stage, event: "CANDIDATE_STARTED", detail: "CANDIDATE_SCOPE" });
    }
    if (!this.providerLifecycleOpen) {
      this.providerLifecycleOpen = true;
      this.activeLifecycle = { source, stage };
      this.providerStartedAt = Date.now();
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
