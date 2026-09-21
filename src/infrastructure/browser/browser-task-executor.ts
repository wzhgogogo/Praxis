import type { BrowserControlHint, BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError, type BrowserDeadlineScope, type BrowserRuntimeFailureCode } from "./browser-runtime-errors.js";
import {
  type BrowserReadAction,
  type BrowserReadActionDecisionPort,
  type BrowserReadGoal,
  type BrowserReadActionTarget,
  BrowserReadDecisionError,
} from "./browser-action-decision.js";
import { loadBrowserReadSkills } from "./browser-read-skills.js";

export interface BrowserExecutionDiagnostic {
  candidateId?: string;
  source: "TABLECHECK" | "TABELOG" | "WEBSITE";
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY" | "FACTS";
  event: "CANDIDATE_STARTED" | "CANDIDATE_FINISHED" | "PROVIDER_STARTED" | "PROVIDER_FINISHED"
    | "SESSION_OPENING" | "SESSION_OPENED" | "SESSION_OPEN_FAILED"
    | "OPERATION_STARTED" | "OPERATION_FINISHED" | "OPERATION_FAILED"
    | "MODEL_DECISION_STARTED" | "MODEL_DECISION_FINISHED" | "MODEL_DECISION_FAILED"
    | "BUDGET_EXHAUSTED"
    | "OBSERVED" | "SKILL_STARTED" | "METHOD_INCOMPLETE" | "MODEL_ACTION" | "MODEL_STOP" | "ASYNC_WAIT" | "POST_ACTION_VERIFIED" | "REJECTED" | "CLOSED";
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
  source: "TABLECHECK" | "TABELOG" | "WEBSITE";
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY" | "FACTS";
  session: BrowserSession;
  signal: AbortSignal;
  allowedOrigins: readonly string[];
  /** Complete Router-bound target; model guidance cannot alter it. */
  goal: BrowserReadGoal;
  objective: string;
  /** Current method result; it is context for continuation, never a provider failure by itself. */
  methodReason?: string;
  /** A source-owned, already-authorized shortcut; its effect is always post-condition checked. */
  shortcut?: { name: string; run(snapshot: BrowserSnapshot): Promise<void> };
  controlHints?(snapshot: Readonly<BrowserSnapshot>): readonly BrowserControlHint[];
  completion(snapshot: BrowserSnapshot): { complete: boolean; reason: string };
  /** Code-owned source classification, never model/page-provided permission. Absence
   * denies event-producing checkbox/range changes, including consent controls. */
  permitQueryControl?(input: {
    control: Readonly<BrowserPageControl>;
    snapshot: Readonly<BrowserSnapshot>;
    action: "SET_CHECKED" | "ADJUST_RANGE" | "CLICK";
  }): boolean;
}

export interface BrowserGenericReadResult {
  status: "COMPLETED" | "MODEL_HANDOFF" | "REQUESTED_HUMAN_HELP" | "NO_SAFE_ACTION" | "BUDGET_EXCEEDED" | "MODEL_FAILURE";
  snapshot: BrowserSnapshot;
  /** Live DOM controls from the same observation as the terminal browser decision. */
  controls: BrowserPageControl[];
}

interface ObservedTarget extends BrowserReadActionTarget { controlId: string; stableKey: string; nativeTag?: string; }

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
    const clock = (target.value || target.label).trim();
    return target.role === "option" && /^([01]\d|2[0-3]):[0-5]\d$/.test(clock) && goal.timeWindow !== undefined
      && clock >= goal.timeWindow.earliest && clock <= goal.timeWindow.latest;
  }
  if (field === "PARTY_SIZE") {
    if (goal.partySize === undefined) return false;
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

function toObservedTargets(controls: BrowserPageControl[], revision: number): Map<string, ObservedTarget> {
  return new Map(controls.filter((control) => control.visible && !control.disabled && !control.blockedByActiveLayer && !control.observationOnly && !(control.kind === "BUTTON" && control.role === "combobox" && control.expanded === true) && (control.kind !== "LINK" || control.href !== undefined)).map((control, index) => {
    const ref = `observation:${revision}:target:${index + 1}`;
    return [ref, {
      ref, controlId: control.id, stableKey: control.stableKey, ...(control.structure ? { nativeTag: control.structure.tag } : {}), kind: control.kind, role: control.role, label: control.label,
      ...(control.value ? { value: control.value } : {}), ...(control.href ? { href: control.href } : {}), ...(control.formMethod ? { formMethod: control.formMethod } : {}), ...(control.type ? { type: control.type } : {}), ...(control.selected ? { selected: true } : {}),
      ...(control.checked !== undefined ? { checked: control.checked } : {}), ...(control.min ? { min: control.min } : {}), ...(control.max ? { max: control.max } : {}), ...(control.valueText ? { valueText: control.valueText } : {}), ...(control.scrollable !== undefined ? { scrollable: control.scrollable } : {}), ...(control.scrollTop !== undefined ? { scrollTop: control.scrollTop } : {}), ...(control.blockedByActiveLayer ? { blockedByActiveLayer: true } : {}), ...(control.options ? { options: control.options } : {}),
    }];
  }));
}

/**
 * A bounded, reusable browser session for one Restaurant availability read.
 * It deliberately has no Restaurant evidence or State knowledge.
 */
export class BrowserTaskExecutor {
  private session: BrowserSession | undefined;
  private sessionSignal: AbortSignal | undefined;
  private closing: Promise<void> | undefined;
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

  async acquire(signal: AbortSignal, source: BrowserExecutionDiagnostic["source"], stage: BrowserExecutionDiagnostic["stage"]): Promise<BrowserSession> {
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
    const opening = Promise.resolve().then(() => this.runtime.openSession({ signal }));
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
    this.session = session;
    signal.addEventListener("abort", () => { void this.close("PARENT_ABORTED"); }, { once: true });
    this.record({ source, stage, event: "SESSION_OPENED", detail: session.metadata.runtimeProvider });
    return session;
  }

  async navigate(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal" | "allowedOrigins"> & { session: BrowserSession; url: string; observed?: boolean },
  ): Promise<void> {
    const url = this.allowedUrl(input.url, input.allowedOrigins);
    if (input.observed && !url) throw this.rejected(input.source, input.stage, "Observed navigation target is outside the source allowlist");
    if (!url) throw this.rejected(input.source, input.stage, "Site method navigation target is outside the source allowlist");
    await this.operation(input, "NAVIGATE", () => input.session.navigate(url, { waitUntil: "domcontentloaded", timeoutMs: this.remaining(20_000) }));
  }

  async select(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession; selector: string; value: string; authoritativeValue: string },
  ): Promise<string[]> {
    if (input.value !== input.authoritativeValue) throw this.rejected(input.source, input.stage, "A site method attempted to select a non-authoritative value");
    return this.operation(input, "SELECT", () => input.session.select(input.selector, input.value));
  }

  async fill(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession; selector: string; value: string; authoritativeValue: string },
  ): Promise<void> {
    if (input.value !== input.authoritativeValue) throw this.rejected(input.source, input.stage, "A site method attempted to fill a non-authoritative value");
    await this.operation(input, "FILL", () => input.session.fill(input.selector, input.value));
  }

  async waitFor(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession; selector: string; timeoutMs?: number },
  ): Promise<void> {
    await this.operation(input, "WAIT", () => input.session.waitFor(input.selector, Math.min(input.timeoutMs ?? 10_000, this.remaining(10_000))));
  }

  async snapshot(input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal"> & { session: BrowserSession }): Promise<BrowserSnapshot> {
    const snapshot = await this.operation(input, "SNAPSHOT", () => input.session.snapshot());
    this.record({ source: input.source, stage: input.stage, event: "OBSERVED", url: snapshot.url });
    return snapshot;
  }

  async runSkill(input: BrowserSkillReadInput): Promise<BrowserGenericReadResult> {
    let snapshot = await this.snapshot(input);
    let completion = input.completion(snapshot);
    if (completion.complete) return { status: "COMPLETED", snapshot, controls: [] };
    let progress = input.methodReason ?? completion.reason;
    let shortcutUsed = false;
    let postAction = false;
    let unchangedPageKey: string | undefined;
    const pageVisits = new Map<string, number>();
    const recordPageVisit = (value: BrowserSnapshot, controls: BrowserPageControl[]) => {
      const key = observationKey(value, controls);
      const count = (pageVisits.get(key) ?? 0) + 1;
      pageVisits.set(key, count);
      return count;
    };
    const pendingControlKeys = new Set<string>();
    for (;;) {
      if (this.budget.totalModelCalls >= (this.options.maxModelCallsTotal ?? 12)) {
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
          completion = input.completion(snapshot);
          if (completion.complete) return { status: "COMPLETED", snapshot, controls: [] };
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
      if (!this.options.modelDecision) return { status: "NO_SAFE_ACTION", snapshot, controls: [] };
      const observation = await this.observe(input, snapshot);
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
          skills: loadBrowserReadSkills(input.source),
          goal: input.goal,
          observation: {
            revision: observation.revision,
            url: observation.snapshot.url,
            title: observation.snapshot.title,
            visibleText: safeText(observation.snapshot.text),
            targets: actionTargets.map(({ controlId: _controlId, stableKey: _stableKey, nativeTag: _nativeTag, ...target }) => target),
          },
        }));
        this.record({ source: input.source, stage: input.stage, event: "MODEL_DECISION_FINISHED", detail: "MODEL_DECISION" });
      } catch (error) {
        this.recordLifecycleFailure(input.source, input.stage, "MODEL_DECISION_FAILED", error);
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: safeErrorDetail(error) });
        if (error instanceof BrowserRuntimeError || (error && typeof error === "object" && "code" in error && error.code === "MODEL_CALL_BUDGET_EXHAUSTED")) throw error;
        if (error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT") {
          progress = `The previous proposed action was rejected: ${safeErrorDetail(error, 240)}. Correct those action fields using a current observed target, or request human help.`;
          continue;
        }
        return { status: "MODEL_FAILURE", snapshot, controls: observation.controls };
      }
      this.record({
        source: input.source,
        stage: input.stage,
        event: action.type === "COMPLETE" || action.type === "REQUEST_HUMAN_HELP" ? "MODEL_STOP" : "MODEL_ACTION",
        url: snapshot.url,
        detail: `${action.type}: ${safeText(action.reason, 240)}`,
      });
      if (action.type === "COMPLETE") {
        completion = input.completion(snapshot);
        // COMPLETE is only a browser-read handoff. The provider verifier still owns
        // request/result evidence and can fail closed using this same DOM observation.
        return { status: completion.complete ? "COMPLETED" : "MODEL_HANDOFF", snapshot, controls: observation.controls };
      }
      if (action.type === "REQUEST_HUMAN_HELP") return { status: "REQUESTED_HUMAN_HELP", snapshot, controls: observation.controls };
      const target = action.targetRef ? observation.targets.get(action.targetRef) : undefined;
      if (!target) return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
      try {
        await this.applyGenericAction(input, observation, target, action);
      } catch (error) {
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: safeErrorDetail(error) });
        if (error instanceof BrowserRuntimeError) return { status: "NO_SAFE_ACTION", snapshot, controls: observation.controls };
        progress = `The previous proposed action was rejected by the executor: ${safeErrorDetail(error, 240)}. Choose another observed safe target, or request human help.`;
        continue;
      }
      const priorSnapshot = snapshot;
      const waitedForAsyncChange = action.type === "OPEN_LINK" || action.type === "CLICK" || action.type === "CLICK_AUTHORITATIVE";
      const changed = waitedForAsyncChange ? await this.waitForChange(input, priorSnapshot) : false;
      snapshot = await this.snapshot(input);
      const postActionObservation = await this.observe(input, snapshot);
      const observedControlChange = controlsChanged(observation.controls, postActionObservation.controls);
      const effectVerified = changed || observedControlChange;
      this.record({
        source: input.source,
        stage: input.stage,
        event: "POST_ACTION_VERIFIED",
        url: snapshot.url,
        detail: effectVerified ? "OBSERVED_CHANGE_AFTER_MODEL_ACTION" : "ASYNC_RESULT_NOT_READY_AFTER_MODEL_ACTION",
        observation: this.diagnosticObservation(postActionObservation),
      });
      completion = input.completion(snapshot);
      if (completion.complete) return { status: "COMPLETED", snapshot, controls: postActionObservation.controls };
      if (recordPageVisit(snapshot, postActionObservation.controls) >= 3) {
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_PROGRESS_PAGE_CYCLE" });
        return { status: "NO_SAFE_ACTION", snapshot, controls: postActionObservation.controls };
      }
      if (!effectVerified && sameObservation(priorSnapshot, snapshot)) {
        unchangedPageKey = observationKey(snapshot);
        pendingControlKeys.add(target.stableKey);
        progress = `The previous ${action.type} was accepted, but its result is still not observable. Do not repeat that action on this unchanged page; use another observed safe control or WAIT for a bounded page-state change.`;
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "ASYNC_RESULT_NOT_READY" });
      } else {
        progress = completion.reason;
      }
      postAction = true;
    }
  }

  async close(reason: BrowserExecutionReason = "EXECUTOR_CLOSED"): Promise<void> {
    const outcome = reason === "PARENT_ABORTED" || reason === "DEADLINE_EXCEEDED" ? "ABANDONED" : "FINISHED";
    if (!this.session) {
      this.finishProvider(outcome, reason);
      this.finishCandidate(outcome, reason);
      return this.closing;
    }
    const session = this.session;
    this.session = undefined;
    this.sessionSignal = undefined;
    this.closing = session.close().finally(() => {
      const lifecycle = this.activeLifecycle;
      if (lifecycle) this.record({ ...lifecycle, event: "CLOSED", detail: "SESSION_CLOSED" });
      this.finishProvider(outcome, reason);
      this.finishCandidate(outcome, reason);
      this.closing = undefined;
    });
    await this.closing;
  }

  private async observe(input: BrowserSkillReadInput, snapshot: BrowserSnapshot): Promise<Observation> {
    this.observationRevision += 1;
    const controls = input.session.observeControls
      ? await this.operation(input, "OBSERVE_CONTROLS", () => input.session.observeControls!(input.controlHints?.(snapshot)))
      : [];
    return { revision: this.observationRevision, snapshot, controls, targets: toObservedTargets(controls, this.observationRevision) };
  }

  private diagnosticObservation(observation: Observation): NonNullable<BrowserExecutionDiagnostic["observation"]> {
    return {
      title: safeText(observation.snapshot.title, 240),
      visibleTextExcerpt: safeText(observation.snapshot.text, 1_000),
      targets: [...observation.targets.values()].slice(0, 40).map(({ controlId: _controlId, stableKey: _stableKey, nativeTag: _nativeTag, value: _value, formMethod: _formMethod, selected: _selected, ...target }) => ({
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

  private async applyGenericAction(input: BrowserSkillReadInput, observation: Observation, target: ObservedTarget, action: Exclude<BrowserReadAction, { type: "COMPLETE" | "REQUEST_HUMAN_HELP" }>): Promise<void> {
    if (action.type === "OPEN_LINK") {
      if (target.kind !== "LINK" || !target.href) throw new Error("OPEN_LINK target is not an observed link");
      if (/\/(?:login|signin|account|checkout|payment|reserve|booking|cancel)(?:\/|$)/i.test(new URL(target.href).pathname)) {
        throw new Error("OPEN_LINK target has a sensitive navigation path");
      }
      if (input.session.openLink) {
        await this.operation(input, "OPEN_LINK", () => input.session.openLink!(target.controlId));
      } else {
        // A runtime without popup support may only retain the existing same-page
        // behavior; it never fabricates a new-page identity.
        await this.navigate({ ...input, url: target.href, observed: true });
      }
      return;
    }
    if (action.type === "WAIT") {
      await this.waitForChange(input, observation.snapshot);
      return;
    }
    if (action.type === "CLICK") {
      if (target.role === "option" && /^([01]\d|2[0-3]):[0-5]\d$/.test((target.value || target.label).trim())
        && !matchesAuthoritativeControl(target, "TIME", input.goal)) {
        throw new Error("Time option is outside the authoritative time window");
      }
      const control = observation.controls.find(item => item.id === target.controlId);
      const permittedQuerySubmit = control && input.permitQueryControl?.({ control, snapshot: observation.snapshot, action: "CLICK" }) === true;
      if (!this.safeGenericClick(target) && !permittedQuerySubmit) {
        throw new Error("CLICK target has submit, navigation, or other write-capable structure");
      }
      await this.operation(input, "CLICK", () => input.session.click(target.controlId));
      return;
    }
    if (action.type === "CLICK_AUTHORITATIVE") {
      if (target.role === "combobox") throw new Error("Opening a combobox requires CLICK with authoritativeField NONE and requestedState NONE. Then select the exact observed option with CLICK_AUTHORITATIVE.");
      if (target.kind !== "BUTTON" || target.selected === true || !this.safeGenericClick(target) || !matchesAuthoritativeControl(target, action.field, input.goal)) {
        throw new Error("CLICK_AUTHORITATIVE target is not a visible, exact, non-submit authoritative control");
      }
      await this.operation(input, "CLICK_AUTHORITATIVE", () => input.session.click(target.controlId));
      return;
    }
    if (action.type === "SET_CHECKED" || action.type === "ADJUST_RANGE") {
      const control = observation.controls.find(control => control.id === target.controlId);
      if (!control || input.permitQueryControl?.({ control, snapshot: observation.snapshot, action: action.type }) !== true) {
        throw new Error("Source has not classified this control as a permitted read-only query operation");
      }
    }
    if (action.type === "SET_CHECKED") {
      if (target.kind !== "CHECKBOX" || target.checked === undefined || target.checked === action.checked || !input.session.setChecked) {
        throw new Error("SET_CHECKED target is not an observed changeable checkbox");
      }
      await this.operation(input, "SET_CHECKED", () => input.session.setChecked!(target.controlId, action.checked));
      return;
    }
    if (action.type === "ADJUST_RANGE") {
      const current = Number(target.value);
      const boundary = Number(action.direction === "INCREASE" ? target.max : target.min);
      if (target.kind !== "RANGE" || !Number.isFinite(current) || !Number.isFinite(boundary) || (action.direction === "INCREASE" ? current >= boundary : current <= boundary) || !input.session.press) {
        throw new Error("ADJUST_RANGE target is not an observed in-range slider with a supported keyboard action");
      }
      await this.operation(input, "ADJUST_RANGE", () => input.session.press!(target.controlId, action.direction === "INCREASE" ? "ArrowRight" : "ArrowLeft"));
      return;
    }
    if (action.type === "SCROLL_REGION") {
      if (target.kind !== "REGION" || target.scrollable !== true || !input.session.scroll) {
        throw new Error("SCROLL_REGION target is not an observed scrollable region");
      }
      await this.operation(input, "SCROLL_REGION", () => input.session.scroll!(target.controlId, action.direction === "DOWN" ? 480 : -480));
      return;
    }
    const authoritative = action.field === "DATE" ? input.goal.date : input.goal.partySize;
    if (authoritative === undefined) throw this.rejected(input.source, input.stage, `The current read has no authoritative ${action.field.toLowerCase()} value`);
    const value = String(authoritative);
    if (target.kind !== (action.type === "FILL_AUTHORITATIVE" ? "INPUT" : "SELECT")) {
      throw new Error(`${action.type} target has the wrong control kind`);
    }
    if (action.type === "FILL_AUTHORITATIVE") {
      await this.operation(input, "FILL_AUTHORITATIVE", () => input.session.fill(target.controlId, value));
    } else {
      const selected = await this.operation(input, "SELECT_AUTHORITATIVE", () => input.session.select(target.controlId, value));
      if (!selected.includes(value)) throw new Error("Browser did not report the authoritative selected value");
    }
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

  /** Structural permit only: labels and a page's claimed read-only status never authorize an operation. */
  private safeGenericClick(target: ObservedTarget): boolean {
    if (target.kind !== "BUTTON") return false;
    // A `type=button` calendar/navigation control may live inside a POST form but
    // cannot submit that form. A submit control remains forbidden regardless of the
    // surrounding method; this is structural, not a label- or method-only permit.
    // Registry marks only read-only INPUT comboboxes as BUTTON targets. Clicking
    // that input or a DIV/LI/SPAN option cannot natively submit its parent form.
    // Native buttons (including role=option) retain the default-submit guard.
    const nonSubmittingChoice = (target.role === "combobox" && target.nativeTag === "INPUT")
      || (target.role === "option" && ["DIV", "LI", "SPAN"].includes(target.nativeTag ?? ""));
    if (target.type?.toLowerCase() === "submit" || (!target.type && target.formMethod === "POST" && !nonSubmittingChoice)) return false;
    if (/\b(?:login|sign\s*in|register|reserve|book|checkout|pay|purchase|cancel|delete|confirm)\b/i.test(target.label)) return false;
    return true;
  }

  private async operation<Value>(
    input: Pick<BrowserSkillReadInput, "source" | "stage" | "signal">,
    label: string,
    operation: () => Promise<Value>,
  ): Promise<Value> {
    this.assertActive(input.signal);
    if (this.operationCount >= (this.options.maxOperationsPerCandidate ?? 24)) {
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
    value: control.value, selected: control.selected, expanded: control.expanded, checked: control.checked,
    min: control.min, max: control.max, scrollable: control.scrollable, scrollTop: control.scrollTop,
    options: control.options,
  });
  const previous = new Map(before.map((control) => [control.stableKey, state(control)]));
  const current = new Map(after.map((control) => [control.stableKey, state(control)]));
  if (previous.size !== current.size) return true;
  return [...previous].some(([key, value]) => current.get(key) !== value);
}
