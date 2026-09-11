import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";
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
  event: "SESSION_OPENED" | "OBSERVED" | "SITE_METHOD" | "SKILL_STARTED" | "METHOD_INCOMPLETE" | "MODEL_ACTION" | "MODEL_STOP" | "ASYNC_WAIT" | "POST_ACTION_VERIFIED" | "REJECTED" | "CLOSED";
  elapsedMs: number;
  url?: string;
  detail?: string;
  observation?: {
    title: string;
    visibleTextExcerpt: string;
    targets: Array<Pick<BrowserReadActionTarget, "ref" | "kind" | "label" | "href">>;
  };
}

export interface BrowserTaskExecutorOptions {
  modelDecision?: BrowserReadActionDecisionPort;
  maxModelCallsPerCandidate?: number;
  maxModelCallsTotal?: number;
  maxOperationsPerCandidate?: number;
  maxAutomaticElapsedMs?: number;
  onDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void;
  /** Shared only by one Live availability composition, never process-global. */
  budget?: BrowserExecutionBudget;
}

/** Cumulative browser-model budget for one outer availability run. */
export interface BrowserExecutionBudget {
  totalModelCalls: number;
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
  completion(snapshot: BrowserSnapshot): { complete: boolean; reason: string };
}

export interface BrowserGenericReadResult {
  status: "COMPLETED" | "REQUESTED_HUMAN_HELP" | "NO_SAFE_ACTION" | "BUDGET_EXCEEDED" | "MODEL_FAILURE";
  snapshot: BrowserSnapshot;
  /** Live DOM controls from the same observation as the terminal browser decision. */
  controls: BrowserPageControl[];
}

interface ObservedTarget extends BrowserReadActionTarget { controlId: string; stableKey: string; }

interface Observation {
  revision: number;
  snapshot: BrowserSnapshot;
  controls: BrowserPageControl[];
  targets: Map<string, ObservedTarget>;
}

function matchesAuthoritativeControl(
  target: Pick<ObservedTarget, "label" | "value" | "selected">,
  field: "DATE" | "PARTY_SIZE",
  goal: BrowserReadGoal,
): boolean {
  const normalized = target.label.replace(/\s+/g, " ").trim().toLowerCase();
  if (field === "PARTY_SIZE") {
    return String(target.value ?? "") === String(goal.partySize)
      || (new RegExp(`(?:^|\\D)${goal.partySize}(?:\\D|$)`).test(normalized)
      && /(?:guest|guests|people|persons|名|人)/i.test(normalized));
  }
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
  return new Map(controls.filter((control) => control.visible && !control.disabled && (control.kind !== "LINK" || control.href !== undefined)).map((control, index) => {
    const ref = `observation:${revision}:target:${index + 1}`;
    return [ref, { ref, controlId: control.id, stableKey: control.stableKey, kind: control.kind, role: control.role, label: control.label, ...(control.value ? { value: control.value } : {}), ...(control.href ? { href: control.href } : {}), ...(control.formMethod ? { formMethod: control.formMethod } : {}), ...(control.type ? { type: control.type } : {}), ...(control.selected ? { selected: true } : {}) }];
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
  private observationRevision = 0;
  private readonly startedAt = Date.now();

  constructor(private readonly runtime: BrowserRuntime, private readonly options: BrowserTaskExecutorOptions = {}) {
    this.budget = options.budget ?? { totalModelCalls: 0 };
  }

  /** A source fallback for the same outlet shares its budget; a new outlet starts a new bounded unit. */
  beginCandidate(candidateId: string): void {
    if (this.candidateId === candidateId) return;
    this.candidateId = candidateId;
    this.operationCount = 0;
    this.modelCalls = 0;
  }

  async acquire(signal: AbortSignal, source: BrowserExecutionDiagnostic["source"], stage: BrowserExecutionDiagnostic["stage"]): Promise<BrowserSession> {
    this.assertActive(signal);
    if (this.session) return this.session;
    this.sessionSignal = signal;
    const session = await this.runtime.openSession({ signal });
    if (signal.aborted) {
      await session.close();
      throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser session creation was aborted");
    }
    this.session = session;
    signal.addEventListener("abort", () => { void this.close(); }, { once: true });
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
    const pendingControlKeys = new Set<string>();
    for (;;) {
      if (this.modelCalls >= (this.options.maxModelCallsPerCandidate ?? 6) || this.budget.totalModelCalls >= (this.options.maxModelCallsTotal ?? 12) || this.operationCount >= (this.options.maxOperationsPerCandidate ?? 24) || this.remaining(1) <= 0) {
        return { status: "BUDGET_EXCEEDED", snapshot, controls: [] };
      }
      if (!shortcutUsed && input.shortcut) {
        shortcutUsed = true;
        try {
          await input.shortcut.run(snapshot);
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
      // Website fact reads deliberately never delegate page interpretation or
      // navigation to the model.  They may use acquire/navigate/snapshot only
      // and parse the resulting structured data in their adapter.
      if (!this.options.modelDecision || input.source === "WEBSITE") return { status: "NO_SAFE_ACTION", snapshot, controls: [] };
      const observation = await this.observe(input, snapshot);
      if (!postAction) {
        this.record({
          source: input.source,
          stage: input.stage as "DISCOVERY" | "IDENTITY" | "AVAILABILITY",
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
      const actionTargets = [...observation.targets.values()].filter((target) => !pendingControlKeys.has(target.stableKey));
      let action: BrowserReadAction;
      try {
        this.modelCalls += 1;
        this.budget.totalModelCalls += 1;
        action = await this.options.modelDecision.decide({
          taskId: input.taskId,
          source: input.source,
          stage: input.stage as "DISCOVERY" | "IDENTITY" | "AVAILABILITY",
          objective: input.objective,
          progress,
          skills: loadBrowserReadSkills(input.source),
          goal: input.goal,
          observation: {
            revision: observation.revision,
            url: observation.snapshot.url,
            title: observation.snapshot.title,
            visibleText: safeText(observation.snapshot.text),
            targets: actionTargets.map(({ controlId: _controlId, stableKey: _stableKey, ...target }) => target),
          },
        });
      } catch (error) {
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: safeErrorDetail(error) });
        if (error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT") {
          progress = "The previous proposed action was rejected because it did not name a current observed target. Choose exactly one current target reference or request human help.";
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
        return { status: "COMPLETED", snapshot, controls: observation.controls };
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
      const changed = await this.waitForChange(input, priorSnapshot);
      snapshot = await this.snapshot(input);
      const postActionObservation = await this.observe(input, snapshot);
      this.record({
        source: input.source,
        stage: input.stage,
        event: "POST_ACTION_VERIFIED",
        url: snapshot.url,
        detail: changed ? "OBSERVED_CHANGE_AFTER_MODEL_ACTION" : "ASYNC_RESULT_NOT_READY_AFTER_MODEL_ACTION",
        observation: this.diagnosticObservation(postActionObservation),
      });
      completion = input.completion(snapshot);
      if (completion.complete) return { status: "COMPLETED", snapshot, controls: postActionObservation.controls };
      if (!changed && sameObservation(priorSnapshot, snapshot)) {
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

  async close(): Promise<void> {
    if (!this.session) return this.closing;
    const session = this.session;
    this.session = undefined;
    this.sessionSignal = undefined;
    this.closing = session.close().finally(() => { this.closing = undefined; });
    await this.closing;
  }

  private async observe(input: BrowserSkillReadInput, snapshot: BrowserSnapshot): Promise<Observation> {
    this.observationRevision += 1;
    const controls = input.session.observeControls
      ? await this.operation(input, "OBSERVE_CONTROLS", () => input.session.observeControls!())
      : [];
    return { revision: this.observationRevision, snapshot, controls, targets: toObservedTargets(controls, this.observationRevision) };
  }

  private diagnosticObservation(observation: Observation): NonNullable<BrowserExecutionDiagnostic["observation"]> {
    return {
      title: safeText(observation.snapshot.title, 240),
      visibleTextExcerpt: safeText(observation.snapshot.text, 1_000),
      targets: [...observation.targets.values()].slice(0, 40).map(({ controlId: _controlId, stableKey: _stableKey, value: _value, formMethod: _formMethod, selected: _selected, ...target }) => ({
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
      await this.navigate({ ...input, url: target.href, observed: true });
      return;
    }
    if (action.type === "WAIT") {
      await this.waitForChange(input, observation.snapshot);
      return;
    }
    if (action.type === "CLICK") {
      if (!this.safeGenericClick(target)) {
        throw new Error("CLICK target has submit, navigation, or other write-capable structure");
      }
      await this.operation(input, "CLICK", () => input.session.click(target.controlId));
      return;
    }
    if (action.type === "CLICK_AUTHORITATIVE") {
      if (target.kind !== "BUTTON" || !this.safeGenericClick(target) || !matchesAuthoritativeControl(target, action.field, input.goal)) {
        throw new Error("CLICK_AUTHORITATIVE target is not a visible, exact, non-submit authoritative control");
      }
      await this.operation(input, "CLICK_AUTHORITATIVE", () => input.session.click(target.controlId));
      return;
    }
    const value = action.field === "DATE" ? input.goal.date : String(input.goal.partySize);
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
    if (target.type?.toLowerCase() === "submit" || (!target.type && target.formMethod === "POST")) return false;
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
      throw new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser operation budget exceeded");
    }
    this.operationCount += 1;
    try {
      const value = await operation();
      this.assertActive(input.signal);
      this.record({ source: input.source, stage: input.stage, event: "SITE_METHOD", detail: label });
      return value;
    } catch (error) {
      if (input.signal.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser operation was aborted", error);
      throw error;
    }
  }

  private remaining(limit: number): number {
    const total = this.options.maxAutomaticElapsedMs ?? 300_000;
    return Math.max(1, Math.min(limit, total - (Date.now() - this.startedAt)));
  }

  private assertActive(signal: AbortSignal): void {
    if (signal.aborted || this.sessionSignal?.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser execution was aborted");
    if (Date.now() - this.startedAt >= (this.options.maxAutomaticElapsedMs ?? 300_000)) {
      throw new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser execution exceeded its automatic deadline");
    }
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

  private record(input: Omit<BrowserExecutionDiagnostic, "elapsedMs">): void {
    try {
      this.options.onDiagnostic?.({
        ...input,
        ...(this.candidateId ? { candidateId: this.candidateId } : {}),
        elapsedMs: Date.now() - this.startedAt,
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

function observationKey(snapshot: BrowserSnapshot): string {
  return `${snapshot.url}\n${snapshot.title}\n${snapshot.text}`;
}
