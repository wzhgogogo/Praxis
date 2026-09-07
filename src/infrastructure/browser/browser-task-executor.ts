import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";
import {
  type BrowserReadAction,
  type BrowserReadActionDecisionPort,
  type BrowserReadActionTarget,
  BrowserReadDecisionError,
} from "./browser-action-decision.js";
import { loadBrowserReadSkills } from "./browser-read-skills.js";

export interface BrowserExecutionDiagnostic {
  source: "TABLECHECK" | "TABELOG";
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY";
  event: "SESSION_OPENED" | "OBSERVED" | "SITE_METHOD" | "SKILL_STARTED" | "METHOD_INCOMPLETE" | "MODEL_ACTION" | "MODEL_STOP" | "POST_ACTION_VERIFIED" | "REJECTED" | "CLOSED";
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
}

export interface BrowserSkillReadInput {
  taskId: string;
  source: "TABLECHECK" | "TABELOG";
  stage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY";
  session: BrowserSession;
  signal: AbortSignal;
  allowedOrigins: readonly string[];
  authoritative: { date: string; partySize: number };
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
}

interface ObservedTarget extends BrowserReadActionTarget {
  selector: string;
}

interface Observation {
  revision: number;
  snapshot: BrowserSnapshot;
  targets: Map<string, ObservedTarget>;
}

const READ_ONLY_BUTTON = /\b(search|show\s+(?:times|availability|results)|check\s+availability|find\s+(?:more\s+)?(?:(?:a\s+)?table|availability)|空席|空き|検索|予約可能)\b/i;

function matchesAuthoritativeButton(
  target: Pick<ObservedTarget, "label" | "value">,
  field: "DATE" | "PARTY_SIZE",
  authoritative: { date: string; partySize: number },
): boolean {
  const normalized = target.label.replace(/\s+/g, " ").trim().toLowerCase();
  if (field === "PARTY_SIZE") {
    return new RegExp(`(?:^|\\D)${authoritative.partySize}(?:\\D|$)`).test(normalized)
      && /(?:guest|guests|people|persons|名|人)/i.test(normalized);
  }
  const [year, month, day] = authoritative.date.split("-").map(Number);
  if (!year || !month || !day) return false;
  if (normalizeObservedIsoDate(target.value) === authoritative.date || normalized.includes(authoritative.date)) return true;
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

function decodeHtml(value: string): string {
  return value.replace(/&(?:amp|quot|#39|lt|gt);/gi, (match) => ({ "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" }[match.toLowerCase()] ?? match));
}

function attributes(fragment: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of fragment.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    const key = match[1]?.toLowerCase();
    if (!key || key === "a" || key === "button" || key === "input" || key === "select") continue;
    result[key] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return result;
}

function attributeSelector(tag: string, attrs: Record<string, string>, index: number): string | undefined {
  const id = attrs.id;
  if (id && /^[A-Za-z][\w-]*$/.test(id)) return `#${id}`;
  const name = attrs.name;
  if (name && /^[\w:-]+$/.test(name)) return `${tag}[name="${name.replaceAll('"', "\\\"")}"]`;
  const href = attrs.href;
  if (tag === "a" && href) return `a[href="${href.replaceAll('"', "\\\"")}"]`;
  const dataDate = attrs["data-date"];
  if (dataDate) return `${tag}[data-date="${dataDate.replaceAll('"', "\\\"")}"]`;
  const dataValue = attrs["data-value"];
  if (dataValue) return `${tag}[data-value="${dataValue.replaceAll('"', "\\\"")}"]`;
  if (attrs.value && tag === "button") return `${tag}[value="${attrs.value.replaceAll('"', "\\\"")}"]`;
  if (attrs["data-testid"]) return `[data-testid="${attrs["data-testid"]!.replaceAll('"', "\\\"")}"]`;
  if (attrs["data-praxis-read-only"] === "true") return `${tag}[data-praxis-read-only="true"]:nth-of-type(${index + 1})`;
  return undefined;
}

function resolvedHref(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    // Page markup is untrusted input. An invalid href is not an executable target.
    return undefined;
  }
}

/** Only exposes controls that code can subsequently address without a model-provided selector. */
function observedTargets(snapshot: BrowserSnapshot, revision: number): Map<string, ObservedTarget> {
  const targets = new Map<string, ObservedTarget>();
  let index = 0;
  const add = (tag: "a" | "button" | "input" | "select", attributeText: string, innerText = "") => {
    const attrs = attributes(`${tag} ${attributeText}`);
    if (attrs.hidden !== undefined || attrs["aria-hidden"] === "true" || attrs.disabled !== undefined || attrs["aria-disabled"] === "true") return;
    const selector = attributeSelector(tag, attrs, index);
    index += 1;
    if (!selector) return;
    const href = resolvedHref(attrs.href, snapshot.url);
    if (tag === "a" && !href) return;
    const label = safeText(decodeHtml(attrs["aria-label"] || attrs.title || innerText || attrs.value || attrs.name || ""), 180);
    const ref = `observation:${revision}:target:${targets.size + 1}`;
    const elementOffset = snapshot.html.indexOf(attributeText);
    const lastFormOpen = snapshot.html.lastIndexOf("<form", elementOffset);
    const lastFormClose = snapshot.html.lastIndexOf("</form", elementOffset);
    const enclosingForm = lastFormOpen > lastFormClose
      ? snapshot.html.slice(lastFormOpen, snapshot.html.indexOf(">", lastFormOpen) + 1)
      : "";
    const submitsPost = attrs.formmethod?.toUpperCase() === "POST"
      || (tag === "button" && attrs.type?.toLowerCase() !== "button" && /\bmethod\s*=\s*["']?post/i.test(enclosingForm));
    const formMethod = submitsPost ? "POST" : "GET";
    const kind = tag === "a" ? "LINK" : tag === "button" ? "BUTTON" : tag === "input" ? "INPUT" : "SELECT";
    targets.set(ref, {
      ref,
      kind,
      label,
      selector,
      ...(attrs.value ?? attrs["data-date"] ?? attrs["data-value"] ? { value: attrs.value ?? attrs["data-date"] ?? attrs["data-value"] } : {}),
      ...(href ? { href } : {}),
      ...(tag === "button" || tag === "input" || tag === "select" ? { formMethod } : {}),
      ...(attrs["data-praxis-read-only"] === "true" ? { readOnlyHint: true } : {}),
    });
  };
  for (const match of snapshot.html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>|<button\b([^>]*)>([\s\S]*?)<\/button>|<(input|select)\b([^>]*)>/gi)) {
    if (match[1] !== undefined) add("a", match[1], match[2]?.replace(/<[^>]+>/g, "") ?? "");
    else if (match[3] !== undefined) add("button", match[3], match[4]?.replace(/<[^>]+>/g, "") ?? "");
    else if (match[5] === "input") add("input", match[6] ?? "");
    else if (match[5] === "select") add("select", match[6] ?? "");
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
  private closing: Promise<void> | undefined;
  private operationCount = 0;
  private modelCalls = 0;
  private totalModelCalls = 0;
  private candidateId: string | undefined;
  private observationRevision = 0;
  private readonly startedAt = Date.now();

  constructor(private readonly runtime: BrowserRuntime, private readonly options: BrowserTaskExecutorOptions = {}) {}

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
    if (completion.complete) return { status: "COMPLETED", snapshot };
    let progress = input.methodReason ?? completion.reason;
    let shortcutUsed = false;
    let postAction = false;
    const noProgressActionSelectors = new Set<string>();
    for (;;) {
      if (this.modelCalls >= (this.options.maxModelCallsPerCandidate ?? 6) || this.totalModelCalls >= (this.options.maxModelCallsTotal ?? 12) || this.operationCount >= (this.options.maxOperationsPerCandidate ?? 24) || this.remaining(1) <= 0) {
        return { status: "BUDGET_EXCEEDED", snapshot };
      }
      if (!shortcutUsed && input.shortcut) {
        shortcutUsed = true;
        try {
          await input.shortcut.run(snapshot);
          snapshot = await this.snapshot(input);
          completion = input.completion(snapshot);
          if (completion.complete) return { status: "COMPLETED", snapshot };
          progress = completion.reason;
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: `${input.shortcut.name}: ${progress}` });
        } catch (error) {
          progress = `${input.shortcut.name} did not complete: ${error instanceof Error ? safeText(error.message, 240) : "unknown error"}`;
          this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: progress });
        }
      }
      if (!this.options.modelDecision) return { status: "NO_SAFE_ACTION", snapshot };
      const observation = this.observe(snapshot);
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
      const actionTargets = [...observation.targets.values()].filter((target) => !noProgressActionSelectors.has(target.selector));
      let action: BrowserReadAction;
      try {
        this.modelCalls += 1;
        this.totalModelCalls += 1;
        action = await this.options.modelDecision.decide({
          taskId: input.taskId,
          source: input.source,
          stage: input.stage,
          objective: input.objective,
          progress,
          skills: loadBrowserReadSkills(input.source),
          authoritative: input.authoritative,
          observation: {
            revision: observation.revision,
            url: observation.snapshot.url,
            title: observation.snapshot.title,
            visibleText: safeText(observation.snapshot.text),
            targets: actionTargets.map(({ selector: _selector, ...target }) => target),
          },
        });
      } catch (error) {
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: safeErrorDetail(error) });
        if (error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT") {
          progress = "The previous proposed action was rejected because it did not name a current observed target. Choose exactly one current target reference or request human help.";
          continue;
        }
        return { status: "MODEL_FAILURE", snapshot };
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
        if (completion.complete) return { status: "COMPLETED", snapshot };
        progress = completion.reason;
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: `MODEL_COMPLETE_REJECTED: ${progress}` });
        continue;
      }
      if (action.type === "REQUEST_HUMAN_HELP") return { status: "REQUESTED_HUMAN_HELP", snapshot };
      const target = action.targetRef ? observation.targets.get(action.targetRef) : undefined;
      if (!target) return { status: "NO_SAFE_ACTION", snapshot };
      try {
        await this.applyGenericAction(input, observation, target, action);
      } catch (error) {
        this.record({ source: input.source, stage: input.stage, event: "REJECTED", url: snapshot.url, detail: safeErrorDetail(error) });
        if (error instanceof BrowserRuntimeError) return { status: "NO_SAFE_ACTION", snapshot };
        progress = `The previous proposed action was rejected by the executor: ${safeErrorDetail(error, 240)}. Choose another observed safe target, or request human help.`;
        continue;
      }
      const priorSnapshot = snapshot;
      snapshot = await this.snapshot(input);
      const postActionObservation = this.observe(snapshot);
      this.record({
        source: input.source,
        stage: input.stage,
        event: "POST_ACTION_VERIFIED",
        url: snapshot.url,
        detail: "NEW_OBSERVATION_AFTER_MODEL_ACTION",
        observation: this.diagnosticObservation(postActionObservation),
      });
      completion = input.completion(snapshot);
      if (completion.complete) return { status: "COMPLETED", snapshot };
      if (sameObservation(priorSnapshot, snapshot)) {
        noProgressActionSelectors.add(target.selector);
        progress = `The previous ${action.type} on the observed target produced no visible page-state change, so it is unavailable for this session. Do not repeat it; choose another observed safe target or request human help.`;
        this.record({ source: input.source, stage: input.stage, event: "METHOD_INCOMPLETE", url: snapshot.url, detail: "NO_OBSERVABLE_PROGRESS_AFTER_MODEL_ACTION" });
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

  private observe(snapshot: BrowserSnapshot): Observation {
    this.observationRevision += 1;
    return { revision: this.observationRevision, snapshot, targets: observedTargets(snapshot, this.observationRevision) };
  }

  private diagnosticObservation(observation: Observation): NonNullable<BrowserExecutionDiagnostic["observation"]> {
    return {
      title: safeText(observation.snapshot.title, 240),
      visibleTextExcerpt: safeText(observation.snapshot.text, 1_000),
      targets: [...observation.targets.values()].slice(0, 40).map(({ selector: _selector, value: _value, formMethod: _formMethod, readOnlyHint: _readOnlyHint, ...target }) => ({
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
      await this.navigate({ ...input, url: target.href, observed: true });
      return;
    }
    if (action.type === "WAIT") {
      await this.waitFor({ ...input, selector: target.selector, timeoutMs: 10_000 });
      return;
    }
    if (action.type === "CLICK") {
      if (target.kind !== "BUTTON" || target.formMethod === "POST" || (!target.readOnlyHint && !READ_ONLY_BUTTON.test(target.label))) {
        throw new Error("CLICK target is not an explicitly read-only control");
      }
      await this.operation(input, "CLICK", () => input.session.click(target.selector));
      return;
    }
    if (action.type === "CLICK_AUTHORITATIVE") {
      if (target.kind !== "BUTTON" || target.formMethod === "POST" || !matchesAuthoritativeButton(target, action.field, input.authoritative)) {
        throw new Error("CLICK_AUTHORITATIVE target is not a visible, exact, non-submit authoritative control");
      }
      await this.operation(input, "CLICK_AUTHORITATIVE", () => input.session.click(target.selector));
      return;
    }
    const value = action.field === "DATE" ? input.authoritative.date : String(input.authoritative.partySize);
    if (target.kind !== (action.type === "FILL_AUTHORITATIVE" ? "INPUT" : "SELECT")) {
      throw new Error(`${action.type} target has the wrong control kind`);
    }
    if (action.type === "FILL_AUTHORITATIVE") {
      await this.fill({ ...input, selector: target.selector, value, authoritativeValue: value });
    } else {
      const selected = await this.select({ ...input, selector: target.selector, value, authoritativeValue: value });
      if (!selected.includes(value)) throw new Error("Browser did not report the authoritative selected value");
    }
    // A new observation revision invalidates every prior reference, including this one.
    void observation;
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
    try { this.options.onDiagnostic?.({ ...input, elapsedMs: Date.now() - this.startedAt }); } catch { /* diagnostics cannot affect execution */ }
  }
}

function sameObservation(left: BrowserSnapshot, right: BrowserSnapshot): boolean {
  // DOM hydration metadata can change after a click without changing what the reader can
  // observe. Completion has already inspected the fresh DOM; repeat prevention is based on
  // the user-visible page state only.
  return left.url === right.url && left.title === right.title && left.text === right.text;
}
