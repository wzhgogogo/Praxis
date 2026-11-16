import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import { test } from "node:test";

import type { BrowserPageControl, BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserTaskExecutor } from "./browser-task-executor.js";
import { BrowserReadDecisionError, type BrowserReadActionDecisionPort, type BrowserReadDecisionInput } from "./browser-action-decision.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";

class FixtureSession implements BrowserSession {
  readonly metadata: BrowserSession["metadata"];
  closed = 0;
  clicks = 0;
  clickTimeouts: number[] = [];
  waits = 0;
  selected: string[] = [];
  dismisses = 0;
  escapes = 0;
  private index = 0;

  constructor(private readonly pages: BrowserSnapshot[], private readonly advanceOnWait = false, guarded = false) {
    this.metadata = {
      runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", sessionId: "fixture:shared", startedAt: "2026-09-07T00:00:00.000Z",
      ...(guarded ? { readNetworkBoundary: "INSTALLED" } : {}),
    };
  }

  async navigate(): Promise<void> { this.index = Math.min(this.index + 1, this.pages.length - 1); }
  async snapshot(): Promise<BrowserSnapshot> { return this.pages[this.index]!; }
  async observeControls(): Promise<BrowserPageControl[]> {
    const html = this.pages[this.index]!.html;
    const controls: BrowserPageControl[] = [];
    for (const match of html.matchAll(/<(a|button|input|select)\b([^>]*)>([^<]*)/gi)) {
      const tag = match[1]!.toLowerCase(); const attrs = match[2] ?? ""; const label = (match[3] ?? attrs.match(/aria-label=["']([^"']+)/i)?.[1] ?? "").trim();
      const value = attrs.match(/(?:data-date|data-value|value)=["']([^"']+)/i)?.[1];
      const href = attrs.match(/href=["']([^"']+)/i)?.[1];
      const type = attrs.match(/type=["']([^"']+)/i)?.[1];
      let absoluteHref: string | undefined; try { absoluteHref = href ? new URL(href, this.pages[this.index]!.url).toString() : undefined; } catch { /* malformed markup is not a control */ }
      const options = tag === "select" ? [...html.matchAll(/<option\b([^>]*)>([^<]*)/gi)].map(option => ({
        value: option[1]?.match(/value=["']([^"']+)/i)?.[1] ?? option[2] ?? "",
        label: option[2] ?? "", selected: /selected/i.test(option[1] ?? ""), disabled: /disabled/i.test(option[1] ?? ""),
      })) : undefined;
      controls.push({ id: `fixture:${this.index}:${controls.length}`, stableKey: `${tag}|${label}|${value ?? ""}|${controls.length}`, kind: tag === "a" ? "LINK" : tag === "select" ? "SELECT" : tag === "input" ? "INPUT" : "BUTTON", role: tag === "a" ? "link" : tag === "button" ? "button" : tag === "select" ? "combobox" : tag, label, ...(value ? { value } : {}), ...(absoluteHref ? { href: absoluteHref } : {}), ...(attrs.match(/formmethod=["']post/i) ? { formMethod: "POST" as const } : attrs.match(/formmethod=["']get/i) ? { formMethod: "GET" as const, formObservation: { owner: "fixture-form", visibleLines: [label] } } : {}), ...(type ? { type } : {}), ...(options?.length ? { options } : {}), disabled: /disabled|aria-disabled=["']true/i.test(attrs), visible: true });
    }
    return controls;
  }
  async click(_target?: string, options: import("./browser-runtime.js").BrowserActionOptions = {}): Promise<void> { this.clickTimeouts.push(options.timeoutMs ?? 0); this.clicks += 1; this.index = Math.min(this.index + 1, this.pages.length - 1); }
  async fill(): Promise<void> {}
  async select(_target: string, value: string): Promise<string[]> { this.selected.push(value); return [value]; }
  async waitFor(): Promise<void> {}
  async waitForSettled(previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">): Promise<boolean> {
    this.waits += 1;
    if (this.advanceOnWait) this.index = Math.min(this.index + 1, this.pages.length - 1);
    const current = this.pages[this.index]!;
    return true;
  }
  async dismissTransientObstruction(): Promise<{ occluder: string }> {
    this.dismisses += 1;
    this.index = Math.min(this.index + 1, this.pages.length - 1);
    return { occluder: "header" };
  }
  async pressEscape(): Promise<void> {
    this.escapes += 1;
    this.index = Math.min(this.index + 1, this.pages.length - 1);
  }
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closed += 1; }
}

function input(session: BrowserSession, signal = new AbortController().signal) {
  return {
    taskId: "task:browser-fixture",
    source: "TABLECHECK" as const,
    stage: "DISCOVERY" as const,
    session,
    signal,
    allowedOrigins: ["https://www.tablecheck.com"],
    goal: { outlet: { name: "Sushi Inase" }, date: "2026-09-10", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: ["omakase"] },
    objective: "Reveal public search results.",
    completion: (snapshot: BrowserSnapshot) => ({ complete: /Sushi Inase/.test(snapshot.text), reason: "A public result is not yet visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
  };
}

function decisions(...actions: Array<(value: BrowserReadDecisionInput) => ReturnType<BrowserReadActionDecisionPort["decide"]>>): BrowserReadActionDecisionPort {
  let index = 0;
  return { decide(value) { return actions[index++]!(value); } };
}

test("BrowserTaskExecutor shares one browser session across source work and closes it once at the enclosing read boundary", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  let opens = 0;
  const runtime: BrowserRuntime = { openSession: async () => { opens += 1; return session; } };
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), session);
  assert.equal(await executor.acquire(new AbortController().signal, "TABELOG", "DISCOVERY"), session);
  assert.equal(opens, 1);
  await executor.close();
  assert.equal(session.closed, 1);
});

test("BrowserTaskExecutor refuses a policy read when a runtime only exposes an unguarded session", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  const policy: BrowserReadNetworkPolicy = { documentOrigins: ["https://www.tablecheck.com"], staticResources: [], dynamicReads: [] };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  await assert.rejects(
    () => executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY", policy),
    (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_FAILED",
  );
  assert.equal(session.closed, 1);
});

test("BrowserTaskExecutor records candidate and provider lifecycle costs through a normal close", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
  executor.beginProvider("candidate-1", "TABLECHECK");
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  await executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: new AbortController().signal, session: acquired });
  await executor.close();
  assert.equal(diagnostics.find(item => item.event === "CANDIDATE_STARTED")?.candidateId, "candidate-1");
  assert.equal(diagnostics.find(item => item.event === "PROVIDER_STARTED")?.lifecycle.outcome, "STARTED");
  assert.equal(diagnostics.filter(item => item.event === "OPERATION_STARTED").length, 1);
  assert.equal(diagnostics.find(item => item.event === "OPERATION_FINISHED")?.lifecycle.candidateRuntimeOperations, 1);
  assert.equal(diagnostics.find(item => item.event === "PROVIDER_FINISHED")?.lifecycle.reason, "EXECUTOR_CLOSED");
  assert.equal(diagnostics.find(item => item.event === "CANDIDATE_FINISHED")?.lifecycle.outcome, "FINISHED");
});

test("BrowserTaskExecutor completes after a canonical page-level WAIT without an observed target", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Loading current availability", html: "<div>Loading current availability</div>" },
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Sushi Inase 19:00", html: "<div>Sushi Inase 19:00</div>" },
  ], true, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(value) {
      assert.deepEqual(value.observation.pageActions, ["WAIT", "PRESS_ESCAPE"]);
      assert.equal(value.observation.targets.some(target => target.availableActions?.includes("WAIT")), false);
      return { type: "WAIT", reason: "Wait for the current public result." };
    } },
    onDiagnostic: event => diagnostics.push(event),
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal), stage: "AVAILABILITY" as const, objective: "Wait for the current public availability result." });
    assert.equal(result.status, "COMPLETED", JSON.stringify(result));
    assert.equal(diagnostics.some(item => item.event === "MODEL_ACTION" && item.detail === "MODEL_WAIT"), true);
    assert.equal(diagnostics.some(item => item.event === "ASYNC_WAIT" && item.detail === "PAGE_SETTLED"), true);
  } finally {
    await executor.close();
  }
});

test("BrowserTaskExecutor spends one bounded operation on page-level Escape then re-observes", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "modal", text: "Search dialog open", html: "<dialog>Search dialog open</dialog>" },
    { url: "https://www.tablecheck.com/en/query", title: "results", text: "Sushi Inase 19:00", html: "<main>Sushi Inase 19:00</main>" },
  ], false, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(input) {
      assert.deepEqual(input.observation.pageActions, ["WAIT", "PRESS_ESCAPE"]);
      return { type: "PRESS_ESCAPE", reason: "Close the observed public layer before reading the result." };
    } },
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal) });
    assert.equal(result.status, "COMPLETED");
    assert.equal(session.escapes, 1);
    assert.equal(result.snapshot.title, "results", "Escape must be followed by a fresh page observation");
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor applies one obstruction recovery and re-observes instead of retrying an old click", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Find availability", html: '<button type="button" data-praxis-read-only="true">Find availability</button>' },
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Sushi Inase 19:00", html: "<div>Sushi Inase 19:00</div>" },
  ]);
  session.click = async () => {
    session.clicks += 1;
    throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Click failed", new Error("header strong intercepts pointer events"));
  };
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(value) {
      const target = value.observation.targets.find(item => item.label === "Find availability");
      assert.ok(target);
      return { type: "CLICK", targetRef: target.ref, reason: "Use the observed public query control." };
    } },
    onDiagnostic: event => diagnostics.push(event),
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal), stage: "AVAILABILITY", objective: "Read the current public availability." });
    assert.equal(result.status, "COMPLETED");
    assert.equal(session.clicks, 1, "recovery must not replay the blocked click");
    assert.equal(session.dismisses, 1);
    assert.ok(diagnostics.some(item => item.detail === "ACTION_OBSTRUCTED"));
    assert.ok(diagnostics.some(item => item.detail === "ACTION_OBSTRUCTION_RECOVERED:header"));
  } finally {
    await executor.close();
  }
});

test("BrowserTaskExecutor exposes an ordinary observed query submit only in an installed read boundary", async () => {
  const pages = [
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Find a table", html: '<button type="submit">Find availability</button>' },
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Sushi Inase 19:00", html: "<main>Sushi Inase 19:00</main>" },
  ];
  const guarded = new FixtureSession(pages, false, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => guarded }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(value) {
      const target = value.observation.targets.find(item => item.label === "Find availability");
      assert.deepEqual(target?.availableActions, ["CLICK"]);
      return { type: "CLICK", targetRef: target!.ref, reason: "Use the current public query control." };
    } },
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal) });
    assert.equal(result.status, "COMPLETED");
    assert.equal(guarded.clicks, 1);
    assert.ok(guarded.clickTimeouts[0]! <= 5000, "a non-navigation control keeps the action deadline");
  } finally { await executor.close(); }

  const unguarded = new FixtureSession(pages);
  const unguardedExecutor = new BrowserTaskExecutor({ openSession: async () => unguarded }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(value) {
      const target = value.observation.targets.find(item => item.label === "Find availability");
      assert.deepEqual(target?.availableActions, []);
      return { type: "REQUEST_HUMAN_HELP", reason: "No installed request boundary." };
    } },
  });
  const second = await unguardedExecutor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await unguardedExecutor.runSkill({ ...input(second, signal) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
    assert.equal(unguarded.clicks, 0);
  } finally { await unguardedExecutor.close(); }
});

test("BrowserTaskExecutor waits once for a guarded GET submit when cosmetic form state changes before results", async () => {
  const pages = [
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Find a table", html: '<form><button type="submit" formmethod="get">Search</button></form>' },
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Search form is pending", html: '<form><button type="submit" formmethod="get" disabled>Search</button></form><p>Searching</p>' },
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Sushi Inase 19:00", html: "<main>Sushi Inase 19:00</main>" },
  ];
  const session = new FixtureSession(pages, true, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(value) {
      const target = value.observation.targets.find(item => item.label === "Search");
      assert.ok(target);
      assert.ok(target.availableActions?.includes("CLICK"));
      return { type: "CLICK", targetRef: target.ref, reason: "Submit the observed public query." };
    } },
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal) });
    assert.equal(result.status, "COMPLETED");
    assert.equal(session.clicks, 1, "a cosmetic post-submit change must not cause a second Search click");
    assert.ok(session.clickTimeouts[0]! > 5000 && session.clickTimeouts[0]! <= 20000, "a guarded GET submit can navigate and uses the bounded navigation deadline");
    assert.equal(session.waits, 1, "the single public submit gets one bounded result wait");
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor keeps an observed sensitive submit unavailable even in an installed read boundary", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Reserve", html: '<button type="submit">Reserve table</button>' },
  ], false, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(value) {
      const target = value.observation.targets.find(item => item.label === "Reserve table");
      assert.deepEqual(target?.availableActions, []);
      return { type: "REQUEST_HUMAN_HELP", reason: "Sensitive intent remains unavailable." };
    } },
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
    assert.equal(session.clicks, 0);
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor exposes generic public query controls only after the Guard boundary is installed", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/query", title: "query", text: "Filters", html: "" }], false, true);
  session.observeControls = async () => [
    { id: "radio", stableKey: "radio", kind: "RADIO", role: "radio", label: "Sushi", value: "sushi", checked: false, disabled: false, visible: true },
    { id: "check", stableKey: "check", kind: "CHECKBOX", role: "checkbox", label: "Counter", checked: false, disabled: false, visible: true },
    { id: "range", stableKey: "range", kind: "RANGE", role: "slider", label: "Budget", value: "3", min: "0", max: "5", disabled: false, visible: true },
    { id: "region", stableKey: "region", kind: "REGION", role: "region", label: "Filters", scrollable: true, disabled: false, visible: true },
    { id: "search", stableKey: "search", kind: "INPUT", role: "textbox", label: "Search", value: "", disabled: false, visible: true, structure: { tag: "INPUT", name: "search_text", classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } },
  ];
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    const action = (label: string) => input.observation.targets.find(target => target.label === label)?.availableActions ?? [];
    assert.deepEqual(action("Sushi"), ["SET_CHECKED"]);
    assert.deepEqual(action("Counter"), ["SET_CHECKED"]);
    assert.deepEqual(action("Budget"), ["ADJUST_RANGE"]);
    assert.deepEqual(action("Filters"), ["SCROLL_REGION"]);
    assert.deepEqual(action("Search"), ["FILL_AUTHORITATIVE:RETRIEVAL"]);
    return { type: "REQUEST_HUMAN_HELP", reason: "The fixture verifies exposure only." };
  } } });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal), goal: { outlet: { name: "Sushi" }, retrievalExpression: "omakase", retrievalSource: "CUISINE", hardCriteria: [] } });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor executes a guarded authoritative date button only for the Router-bound date", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Choose date", html: '<button type="submit" data-date="2026-09-10">10</button>' },
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Sushi Inase 19:00", html: "<main>Sushi Inase 19:00</main>" },
  ], false, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide(value) {
      const target = value.observation.targets.find(item => item.label === "10");
      assert.ok(target?.availableActions?.includes("CLICK_AUTHORITATIVE:DATE"));
      return { type: "CLICK_AUTHORITATIVE", targetRef: target!.ref, field: "DATE", reason: "Select the exact Router-bound date." };
    } },
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    const result = await executor.runSkill({ ...input(acquired, signal), stage: "AVAILABILITY" });
    assert.equal(result.status, "COMPLETED");
    assert.equal(session.clicks, 1);
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor identifies an operation ceiling before a denied next observation", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/sushi", title: "query", text: "", html: "" }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12,
    maxOperationsPerCandidate: 1, onDiagnostic: item => diagnostics.push(item),
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  await executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session: acquired });
  await assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session: acquired }),
    (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_OPERATION_BUDGET_EXCEEDED" && /operation budget/.test(error.message));
  assert.equal(diagnostics.find(item => item.event === "BUDGET_EXHAUSTED")?.lifecycle.reason, "OPERATION_BUDGET_EXHAUSTED");
  assert.equal(diagnostics.filter(item => item.event === "OPERATION_STARTED").length, 1);
  await executor.close();

  const actionSession = new FixtureSession([{ url: "https://www.tablecheck.com/en/sushi", title: "query", text: "Choose date", html: '<button type="button" data-date="2026-9-10">Thursday 10</button>' }]);
  const actionDiagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const actionExecutor = new BrowserTaskExecutor({ openSession: async () => actionSession }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12,
    maxOperationsPerCandidate: 3,
    onDiagnostic: item => actionDiagnostics.push(item),
    modelDecision: decisions(async value => ({ type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets[0]!.ref, field: "DATE", reason: "Select date." })),
  });
  const actionAcquired = await actionExecutor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  const actionResult = await actionExecutor.runSkill({ ...input(actionAcquired, signal), stage: "AVAILABILITY", completion: () => ({ complete: false, reason: "Date unconfirmed." }) });
  assert.equal(actionResult.status, "BUDGET_EXCEEDED");
  assert.equal(actionSession.clicks, 0, "A click must not consume the last operation without room to verify it");
  assert.equal(actionDiagnostics.find(item => item.event === "BUDGET_EXHAUSTED")?.lifecycle.reason, "OPERATION_BUDGET_EXHAUSTED");
  await actionExecutor.close();
});

test("BrowserTaskExecutor records the real acquisition root cause instead of inferring a run failure", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const executor = new BrowserTaskExecutor({
    openSession: async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_UNAVAILABLE", "Chromium binary is unavailable"); },
  }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
  executor.beginProvider("candidate-1", "TABLECHECK");
  await assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), { code: "BROWSER_RUNTIME_UNAVAILABLE" });
  const failure = diagnostics.find(item => item.event === "SESSION_OPEN_FAILED");
  assert.deepEqual(failure?.lifecycle, {
    outcome: "FAILED", candidateElapsedMs: failure?.lifecycle.candidateElapsedMs, providerElapsedMs: failure?.lifecycle.providerElapsedMs,
    candidateModelCalls: 0, providerModelCalls: 0, candidateRuntimeOperations: 0, providerRuntimeOperations: 0,
    runModelCalls: 0, reason: "RUNTIME_UNAVAILABLE", failureCode: "BROWSER_RUNTIME_UNAVAILABLE",
  });
  assert.equal(diagnostics.find(item => item.event === "PROVIDER_FINISHED")?.lifecycle.outcome, "FAILED");
});

test("BrowserTaskExecutor emits a typed provider deadline before opening a session", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const executor = new BrowserTaskExecutor({ openSession: async () => new FixtureSession([]) }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    maxElapsedMsPerProvider: 0,
    onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  });
  executor.beginProvider("candidate-1", "TABLECHECK");
  await assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), { code: "BROWSER_TIMEOUT" });
  const failure = diagnostics.find(item => item.event === "SESSION_OPEN_FAILED");
  assert.equal(failure?.lifecycle.reason, "DEADLINE_EXCEEDED");
  assert.equal(failure?.lifecycle.scope, "PROVIDER");
});

test("BrowserTaskExecutor aborts session acquisition immediately and closes a late session", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const late = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "late", text: "", html: "" }]);
  let resolveLate: ((session: BrowserSession) => void) | undefined;
  const executor = new BrowserTaskExecutor({
    openSession: async () => new Promise<BrowserSession>((resolve) => { resolveLate = resolve; }),
  }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
  executor.beginProvider("candidate-1", "TABLECHECK");
  const controller = new AbortController();
  const acquisition = executor.acquire(controller.signal, "TABLECHECK", "DISCOVERY");
  controller.abort();
  await assert.rejects(acquisition, { code: "BROWSER_ABORTED" });
  resolveLate!(late);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(late.closed, 1);
  assert.equal(diagnostics.find(item => item.event === "SESSION_OPEN_FAILED")?.lifecycle.reason, "PARENT_ABORTED");
  assert.equal(diagnostics.find(item => item.event === "PROVIDER_FINISHED")?.lifecycle.outcome, "ABANDONED");
});

for (const reuseSourceSessions of [false,true]) test(`a page-control failure preserves the current session for observation (reuse=${reuseSourceSessions})`,async()=>{
  const session=new FixtureSession([{url:"https://public.example/shop",title:"Current merchant",text:"Current merchant Date Guests",html:"<main>Current merchant</main>"}]);
  const snapshot=session.snapshot.bind(session);
  session.snapshot=async()=>{if(session.closed)throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED","session is closed");return snapshot();};
  let recovering=false, selected=false, failed=false, opens=0;
  session.observeControls=async()=>[{id:"guests",stableKey:"guests",kind:"SELECT",role:"combobox",label:"Guests",value:selected?"2":"1",options:[{value:"1",label:"1",selected:!selected,disabled:false},{value:"2",label:"2",selected,disabled:false}],disabled:false,visible:true}];
  session.select=async(_target,value)=>{if(!recovering){failed=true;throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED","Hidden obsolete control timed out",Object.assign(new Error("selectOption timed out"),{name:"TimeoutError"}));}selected=true;return[value];};
  const executor=new BrowserTaskExecutor({openSession:async()=>{opens++;return session;}},{reuseSourceSessions,maxAutomaticElapsedMs:90_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:40,modelDecision:{async decide(input){
    if(failed&&!recovering)return{type:"REQUEST_HUMAN_HELP",reason:"The control failed; retain the page for a later observation."};
    const target=input.observation.targets.find(t=>t.availableActions?.includes("CHOOSE_OPTION:PARTY_SIZE"))!;
    return{type:"CHOOSE_OPTION",targetRef:target.ref,field:"PARTY_SIZE",reason:"Choose only the currently observed authoritative guest option."};
  }}});
  const signal=new AbortController().signal;
  const skill={taskId:"operation-recovery",source:"TABELOG",stage:"AVAILABILITY" as const,signal,session,allowedOrigins:["https://public.example"],goal:{outlet:{name:"Current merchant"},partySize:2,hardCriteria:[]},objective:"Read the same public page",completion:()=>({complete:selected,reason:"Observe requested guests",resultBusy:false,resultKey:String(selected)})};
  try{
    executor.beginProvider("merchant","TABELOG");await executor.acquire(signal,"TABELOG","AVAILABILITY");
    assert.notEqual((await executor.runSkill(skill)).status,"COMPLETED");assert.equal(failed,true);
    assert.equal((await executor.snapshot({source:"TABELOG",stage:"AVAILABILITY",signal,session})).text,"Current merchant Date Guests");
    assert.equal(session.closed,0);
    assert.equal(await executor.acquire(signal,"TABELOG","AVAILABILITY"),session);assert.equal(opens,1);
    recovering=true;
    assert.equal((await executor.runSkill(skill)).status,"COMPLETED");assert.equal(selected,true);
  }finally{await executor.closeAll();}
});

test("BrowserTaskExecutor records a failed runtime operation with its local cause", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  session.snapshot = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "socket reset"); };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
  executor.beginProvider("candidate-1", "TABLECHECK");
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  await assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: new AbortController().signal, session: acquired }), { code: "BROWSER_RUNTIME_FAILED" });
  const failure = diagnostics.find(item => item.event === "OPERATION_FAILED");
  assert.equal(failure?.lifecycle.reason, "RUNTIME_FAILURE");
  assert.equal(failure?.lifecycle.failureCode, "BROWSER_RUNTIME_FAILED");
  await executor.close();
});

test("a runtime navigation failure retires its session before the next candidate without resetting the run", async () => {
  const failed = new FixtureSession([{ url: "https://www.tablecheck.com/old", title: "old", text: "old", html: "" }], false, true);
  failed.navigate = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "navigation failed"); };
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/new", title: "new", text: "new", html: "" }], false, true);
  let opens = 0;
  const budget = { totalModelCalls: 3 };
  const executor = new BrowserTaskExecutor({ openSession: async () => ++opens === 1 ? failed : next }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  budget });
  const signal = new AbortController().signal;
  executor.beginProvider("first", "TABLECHECK");
  const old = await executor.acquire(signal, "TABLECHECK", "DISCOVERY", {documentOrigins:["https://www.tablecheck.com"],startupDocuments:["https://www.tablecheck.com/fail"],staticResources:[],dynamicReads:[]});
  await assert.rejects(executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", signal, session: old, url: "https://www.tablecheck.com/fail", allowedOrigins: ["https://www.tablecheck.com"] }), { code: "BROWSER_RUNTIME_FAILED" });
  executor.beginProvider("second", "TABLECHECK");
  assert.equal(await executor.acquire(signal, "TABLECHECK", "DISCOVERY"), next);
  assert.equal(failed.closed, 1);
  assert.equal(opens, 2);
  assert.equal(budget.totalModelCalls, 3);
  await executor.close();
});

test("a stuck old close cannot delay cancellation or overwrite the next candidate", async t => {
  t.mock.timers.enable({apis:['Date','setTimeout'],now:0});
  const failed = new FixtureSession([{ url: "https://www.tablecheck.com/old", title: "old", text: "old", html: "" }], false, true);
  failed.navigate = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "navigation failed"); };
  let finishClose: (() => void) | undefined;
  failed.close = async () => new Promise<void>(resolve => { finishClose = resolve; });
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/new", title: "new", text: "new", html: "" }], false, true);
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => ++opens === 1 ? failed : next }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    maxElapsedMsPerCandidate: 40_000, onDiagnostic: diagnostic => diagnostics.push(diagnostic),
  });
  const oldSignal = new AbortController();
  executor.beginProvider("old", "TABLECHECK");
  const old = await executor.acquire(oldSignal.signal, "TABLECHECK", "IDENTITY", {documentOrigins:["https://www.tablecheck.com"],startupDocuments:["https://www.tablecheck.com/fail"],staticResources:[],dynamicReads:[]});
  await assert.rejects(executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", signal: oldSignal.signal, session: old, url: "https://www.tablecheck.com/fail", allowedOrigins: ["https://www.tablecheck.com"] }), { code: "BROWSER_RUNTIME_FAILED" });
  oldSignal.abort();
  executor.beginProvider("next", "TABLECHECK");
  const nextSignal = new AbortController().signal;
  const fresh = await executor.acquire(nextSignal, "TABLECHECK", "IDENTITY");
  assert.equal(fresh, next);
  assert.equal((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal: nextSignal, session: fresh })).title, "new");
  finishClose!();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(diagnostics.filter(item => item.candidateId === "next" && item.event === "CANDIDATE_FINISHED").length, 0);
  await executor.close();
});

test("a stuck runtime cleanup does not hold a canceled read or reset its candidate deadline", async t => {
  let clock=0;t.mock.method(Date,'now',()=>clock);
  const failed = new FixtureSession([{ url: "https://www.tablecheck.com/old", title: "old", text: "old", html: "" }], false, true);
  failed.navigate = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "navigation failed"); };
  let finishClose: (() => void) | undefined;
  failed.close = async () => new Promise<void>(resolve => { finishClose = resolve; });
  const executor = new BrowserTaskExecutor({ openSession: async () => failed }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxElapsedMsPerCandidate: 15_000 });
  const controller = new AbortController();
  executor.beginProvider("old", "TABLECHECK");
  const session = await executor.acquire(controller.signal, "TABLECHECK", "IDENTITY", {documentOrigins:["https://www.tablecheck.com"],startupDocuments:["https://www.tablecheck.com/fail"],staticResources:[],dynamicReads:[]});
  const navigation = executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", signal: controller.signal, session, url: "https://www.tablecheck.com/fail", allowedOrigins: ["https://www.tablecheck.com"] });
  controller.abort();
  await assert.rejects(navigation, { code: "BROWSER_ABORTED" });
  clock=20_000;
  await assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "IDENTITY"), { code: "BROWSER_TIMEOUT" });
  finishClose?.();
});

test("BrowserTaskExecutor aborts an in-flight operation, closes once asynchronously, and never reuses that session", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  let resolveSnapshot: ((snapshot: BrowserSnapshot) => void) | undefined;
  session.snapshot = async () => new Promise<BrowserSnapshot>((resolve) => { resolveSnapshot = resolve; });
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/en/next", title: "next", text: "", html: "" }]);
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => (++opens === 1 ? session : next) }, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  executor.beginProvider("candidate-1", "TABLECHECK");
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  const controller = new AbortController();
  const pending = executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: controller.signal, session: acquired });
  controller.abort();
  await assert.rejects(pending, { code: "BROWSER_ABORTED" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(session.closed, 1);
  resolveSnapshot!({ url: "https://www.tablecheck.com/en/japan", title: "late", text: "", html: "" });
  executor.beginCandidate("candidate-2");
  assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), next);
  await executor.close();
});

test("BrowserTaskExecutor bounds a late session acquisition without leaking its deadline into the next candidate", async t => {
  t.mock.timers.enable({apis:['Date','setTimeout'],now:0});
  const late = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "late", text: "", html: "" }]);
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "next", text: "", html: "" }]);
  let resolveLate: ((session: BrowserSession) => void) | undefined;
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => {
    opens += 1;
    if (opens === 1) return new Promise<BrowserSession>((resolve) => { resolveLate = resolve; });
    return next;
  } }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxElapsedMsPerCandidate: 10 });
  executor.beginCandidate("first");
  const rejected=assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), { code: "BROWSER_TIMEOUT" });
  await new Promise(resolve=>setImmediate(resolve));t.mock.timers.tick(10);await rejected;
  resolveLate!(late);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(late.closed, 1, "a session that resolves after its candidate deadline is closed rather than cached");
  executor.beginCandidate("second");
  assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), next);
  assert.equal(next.closed, 0, "the first candidate's deadline cannot close the next candidate's shared session");
  await executor.close();
});

test("BrowserTaskExecutor times out a hanging snapshot, closes that session, and permits the next candidate", async t => {
  t.mock.timers.enable({apis:['Date','setTimeout'],now:0});
  const stuck = new FixtureSession([{ url: "https://www.tablecheck.com/en/stuck", title: "stuck", text: "", html: "" }]);
  stuck.snapshot = async () => new Promise<BrowserSnapshot>(() => {});
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/en/next", title: "next", text: "", html: "" }]);
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => (++opens === 1 ? stuck : next) }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxElapsedMsPerCandidate: 10 });
  executor.beginCandidate("stuck");
  const first = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  const rejected=assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: new AbortController().signal, session: first }), { code: "BROWSER_TIMEOUT" });
  await new Promise(resolve=>setImmediate(resolve));t.mock.timers.tick(10);await rejected;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(stuck.closed, 1);
  executor.beginCandidate("next");
  assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), next);
  await executor.close();
});

test("BrowserTaskExecutor stops a repeated two-page cycle without spending the full operation budget", async () => {
  let page = 0;
  const pages: BrowserSnapshot[] = [
    { url: "https://www.tablecheck.com/en/a", title: "A", text: "page A", html: "" },
    { url: "https://www.tablecheck.com/en/b", title: "B", text: "page B", html: "" },
  ];
  let closes = 0;
  const session: BrowserSession = {
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", sessionId: "fixture:cycle", startedAt: "2026-09-07T00:00:00.000Z" },
    async navigate() {}, async snapshot() { return pages[page]!; },
    async observeControls() { return [{ id: "cycle", stableKey: "cycle", kind: "BUTTON", role: "button", label: "Next", type: "button", disabled: false, visible: true }]; },
    async click() { page = page === 0 ? 1 : 0; }, async fill() {}, async select() { return []; }, async waitFor() {},
    async waitForSettled() { return true; }, async screenshot() { return new Uint8Array(); }, async close() { closes += 1; },
  };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12,  maxOperationsPerCandidate: 24, onDiagnostic: (diagnostic) => diagnostics.push(diagnostic.detail ?? ""), modelDecision: {
    async decide(value) { return { type: "CLICK", targetRef: value.observation.targets[0]!.ref, reason: "Inspect next public page" }; },
  } });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  const diagnostics: string[] = [];
  const result = await executor.runSkill({ ...input(acquired), completion: () => ({ complete: false, reason: "Continue" }) });
  assert.equal(result.status, "NO_SAFE_ACTION");
  assert.equal(diagnostics.filter(detail => detail === "REPEATED_FROM_SAME_STATE").length, 2);
  await executor.close();
  assert.equal(closes, 1);
});

test("BrowserTaskExecutor keeps a model-call ceiling across sequential candidate executors", async () => {
  const budget = { totalModelCalls: 0 };
  let decisions = 0;
  const modelDecision: BrowserReadActionDecisionPort = {
    async decide() {
      decisions += 1;
      return { type: "REQUEST_HUMAN_HELP", reason: "fixture stop" };
    },
  };
  const firstSession = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "", html: "" }]);
  const first = new BrowserTaskExecutor({ openSession: async () => firstSession }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxOperationsPerCandidate: 24,  modelDecision, maxModelCallsTotal: 1, budget });
  const acquiredFirst = await first.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  assert.equal((await first.runSkill({ ...input(acquiredFirst), completion: () => ({ complete: false, reason: "continue" }) })).status, "REQUESTED_HUMAN_HELP");
  await first.close();

  const secondSession = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "", html: "" }]);
  const second = new BrowserTaskExecutor({ openSession: async () => secondSession }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxOperationsPerCandidate: 24,  modelDecision, maxModelCallsTotal: 1, budget });
  const acquiredSecond = await second.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  await assert.rejects(
    second.runSkill({ ...input(acquiredSecond), completion: () => ({ complete: false, reason: "continue" }) }),
    { code: "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" },
  );
  assert.equal(decisions, 1);
  await second.close();
});

test("BrowserTaskExecutor enforces the shared budget ceiling when no caller-specific option is supplied", async () => {
  const budget = { totalModelCalls: 0, maxModelCalls: 1 };
  let decisions = 0;
  const modelDecision: BrowserReadActionDecisionPort = {
    async decide() {
      decisions += 1;
      return { type: "REQUEST_HUMAN_HELP", reason: "fixture stop" };
    },
  };
  const first = new BrowserTaskExecutor(
    { openSession: async () => new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "", html: "" }]) },
    { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision, budget },
  );
  const firstSession = await first.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  assert.equal((await first.runSkill({ ...input(firstSession), completion: () => ({ complete: false, reason: "continue" }) })).status, "REQUESTED_HUMAN_HELP");
  await first.close();

  const second = new BrowserTaskExecutor(
    { openSession: async () => new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "", html: "" }]) },
    { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision, budget },
  );
  const secondSession = await second.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  await assert.rejects(
    second.runSkill({ ...input(secondSession), completion: () => ({ complete: false, reason: "continue" }) }),
    { code: "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" },
  );
  assert.equal(decisions, 1);
  await second.close();
});

test("BrowserTaskExecutor accepts only observed, read-only targets and invalidates old references after every observation", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "Find a table",
      html: '<a href="http://[not-a-valid-url">Ignore malformed page markup</a><button id="show" data-praxis-read-only="true">Show results</button>',
    },
    {
      url: "https://www.tablecheck.com/en/japan/search", title: "results", text: "Sushi Inase",
      html: '<a href="/en/sushiinase">Sushi Inase</a>',
    },
  ]);
  let firstRef = "";
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(
      async (value) => {
        assert.equal(value.observation.targets.length, 1);
        firstRef = value.observation.targets[0]!.ref;
        return { type: "CLICK", targetRef: firstRef, reason: "read results" };
      },
      async () => ({ type: "OPEN_LINK", targetRef: firstRef, reason: "stale target must fail" }),
    ),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  const result = await executor.runSkill({ ...input(acquired), completion: () => ({ complete: false, reason: "Continue to validate stale references." }) });
  assert.equal(result.status, "NO_SAFE_ACTION");
  assert.equal(session.clicks, 1);
  assert.match(result.snapshot.text, /Sushi Inase/);
  await executor.close();
});

test("BrowserTaskExecutor allows an observed GET availability-search control but never treats it as a booking submit", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "Find availability",
      html: '<button id="find" formmethod="get">Find availability</button>',
    },
    { url: "https://www.tablecheck.com/en/japan/search", title: "results", text: "Sushi Inase", html: "" },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(async (value) => ({ type: "CLICK", targetRef: value.observation.targets[0]!.ref, reason: "Run the public availability search." })),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  const result = await executor.runSkill(input(acquired));
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 1);
  await executor.close();
});

test("fragment UI click permission cannot be used for another document, origin, or sensitive action", async () => {
  const cases = [
    { name: "external origin", href: "https://other.test/en/japan/search#filters", label: "Filters" },
    { name: "different query", href: "?query=changed#filters", label: "Filters" },
    { name: "ordinary same-page URL", href: "https://www.tablecheck.com/en/japan/search", label: "Filters" },
    { name: "sensitive action", href: "#", label: "Confirm booking" },
    { name: "sensitive page", href: "#filters", label: "Filters", url: "https://www.tablecheck.com/en/fixture/reserve" },
  ];
  for (const scenario of cases) {
    const session = new FixtureSession([{ url: scenario.url ?? "https://www.tablecheck.com/en/japan/search", title: "Public page", text: scenario.label,
      html: `<a href="${scenario.href}">${scenario.label}</a>` }]);
    const observe = session.observeControls.bind(session);
    session.observeControls = async () => (await observe()).map(control => ({ ...control,
      structure: { tag: "A", name: "", classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } }));
    const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decisions(
      async value => {
        const target = value.observation.targets[0]!;
        assert.equal(target.availableActions?.includes("CLICK"), false, scenario.name);
        return { type: "CLICK", targetRef: target.ref, reason: "Counterexample: try a prohibited fragment click." };
      },
      async () => ({ type: "REQUEST_HUMAN_HELP", reason: "The unrelated or sensitive control is not allowed." }),
    ) });
    const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
    try {
      const result = await executor.runSkill(input(acquired));
      assert.equal(result.status, "REQUESTED_HUMAN_HELP", scenario.name);
      assert.equal(session.clicks, 0, scenario.name);
    } finally { await executor.close(); }
  }
});

test("BrowserTaskExecutor binds model-controlled fields to the Router authority and blocks an unsafe submit-looking click", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
      html: '<select id="date"><option value="2026-09-10">2026-09-10</option></select><button id="submit" formmethod="post">Reserve now</button>',
    },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(
      async (value) => {
        const select = value.observation.targets.find(target => target.kind === "SELECT");
        const option = value.observation.targets.find(target => target.kind === "OPTION");
        const submit = value.observation.targets.find(target => target.label === "Reserve now");
        assert.equal(select?.rejectionReason, "CHOOSE_AN_OBSERVED_OPTION");
        assert.deepEqual(option?.availableActions, ["CHOOSE_OPTION:DATE"]);
        assert.equal(submit?.rejectionReason, "WRITE_PROHIBITED");
        return { type: "CHOOSE_OPTION", targetRef: option!.ref, field: "DATE", reason: "set requested date" };
      },
      async (value) => ({ type: "CLICK", targetRef: value.observation.targets.find((target) => target.label === "Reserve now")!.ref, reason: "must reject write-looking click" }),
      async () => ({ type: "REQUEST_HUMAN_HELP", reason: "No other read-only control is observed." }),
    ),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: () => ({ complete: false, reason: "No read-only completion condition is met." }) });
  assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  assert.deepEqual(session.selected, ["2026-09-10"]);
  assert.equal(session.clicks, 0);
  await executor.close();
});

test("BrowserTaskExecutor binds a public retrieval field by observed native name without admitting PII entries", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "Search", html: "" }], false, true);
  const controls: BrowserPageControl[] = [
    { id: "search", stableKey: "input|search_text", kind: "INPUT", role: "textbox", label: "Sushi tonight for 2 in Ginza", value: "",
      disabled: false, visible: true, structure: { tag: "INPUT", name: "search_text", classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } },
    { id: "email", stableKey: "input|email", kind: "INPUT", role: "textbox", label: "Restaurant contact", value: "",
      type: "email", disabled: false, visible: true, structure: { tag: "INPUT", name: "customer_email", classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } },
  ];
  session.observeControls = async () => controls;
  const fills: string[] = [];
  const browserSession: BrowserSession = session;
  browserSession.fill = async target => { fills.push(target); };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decisions(
    async decision => {
      const search = decision.observation.targets.find(target => target.label === "Sushi tonight for 2 in Ginza")!;
      const email = decision.observation.targets.find(target => target.label === "Restaurant contact")!;
      assert.ok(search.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL"));
      assert.equal(email.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL"), false);
      assert.equal(email.rejectionReason, "NO_BOUND_INPUT_FIELD");
      return { type: "FILL_AUTHORITATIVE", targetRef: search.ref, field: "RETRIEVAL", reason: "Use the observed public search field." };
    },
    async () => ({ type: "REQUEST_HUMAN_HELP", reason: "The test stops after the bound fill." }),
  ) });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  const result = await executor.runSkill({ ...input(acquired, signal), goal: { outlet: { name: "Sushi" }, retrievalExpression: "omakase", retrievalSource: "CUISINE", hardCriteria: [] },
    completion: () => ({ complete: false, reason: "This verifies only the input binding." }) });
  assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  assert.deepEqual(fills, ["search"]);
  await executor.close();
});

test("BrowserTaskExecutor permits only an exact non-submit calendar button for a model-controlled date", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
      html: '<button id="requested" data-date="2026-9-10">Monday 10</button><button id="other" data-date="2026-9-11">Tuesday 11</button><button id="post" formmethod="post" data-date="2026-9-10">Monday 10</button>',
    },
    {
      url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Requested date applied",
      html: "",
    },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(async (value) => ({
      type: "CLICK_AUTHORITATIVE",
      targetRef: value.observation.targets.find((target) => target.value === "2026-9-10" && target.formMethod !== "POST")!.ref,
      field: "DATE",
      reason: "Select the requested date.",
    })),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: (snapshot) => ({ complete: /applied/.test(snapshot.text), reason: "Date has not been visibly applied.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 1);
  await executor.close();
});

test("BrowserTaskExecutor shows a disabled date as read-only and rejects a proposed click", async () => {
  const session = new FixtureSession([{
    url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
    html: '<button type="button" data-date="2026-9-10" disabled>Thursday 10</button>',
  }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(async (value) => {
      const date = value.observation.targets.find(target => target.value === "2026-9-10")!;
      assert.equal(date.disabled, true);
      assert.deepEqual(date.availableActions, []);
      assert.equal(date.rejectionReason, "DISABLED");
      return { type: "CLICK_AUTHORITATIVE", targetRef: date.ref, field: "DATE", reason: "Try the disabled date." };
    }, async () => ({ type: "REQUEST_HUMAN_HELP", reason: "The requested date cannot be selected." })),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: () => ({ complete: false, reason: "No verified date." }) });
  assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  assert.equal(session.clicks, 0);
  await executor.close();
});

test("BrowserTaskExecutor reuses post-action controls to confirm two selections within the operation limit", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date", html: '<button type="button" data-date="2026-9-10">Thursday 10</button>' },
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose guests", html: '<button type="button" data-value="2">2 guests</button>' },
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Date and guests confirmed", html: '<button type="button" data-value="2" aria-pressed="true">2 guests</button>' },
  ]);
  const observe = session.observeControls.bind(session);
  session.observeControls = async () => {
    const controls = await observe();
    const selected = /aria-pressed="true"/.test((await session.snapshot()).html);
    return controls.map(control => control.value === "2" ? { ...control, controlGroupKey: "fixture:guests", controlGroupLabel: "Guests", selected } : control);
  };
  const events: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12,
    maxOperationsPerCandidate: 10,
    onDiagnostic: event => events.push(event),
    modelDecision: decisions(
      async value => ({ type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets.find(target => target.value === "2026-9-10")!.ref, field: "DATE", reason: "Select date." }),
      async value => ({ type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets.find(target => target.value === "2")!.ref, field: "PARTY_SIZE", reason: "Select guests." }),
    ),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: snapshot => ({ complete: /confirmed/.test(snapshot.text), reason: "Request is not visibly selected.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 2);
  assert.equal(events.filter(event => event.event === "OPERATION_STARTED").length, 10);
  await executor.close();
});

test("BrowserTaskExecutor permits a non-submit calendar control nested in a POST form", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
      html: '<button formmethod="post" type="button" data-date="2026-9-10">Monday 10</button>',
    },
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Requested date applied", html: "" },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(async (value) => ({
      type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets[0]!.ref, field: "DATE", reason: "Select the exact visible date.",
    })),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: (snapshot) => ({ complete: /applied/.test(snapshot.text), reason: "Date is not applied.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 1);
  await executor.close();
});

test("BrowserTaskExecutor addresses a distinct observed calendar value before a shared test id", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
      html: '<button data-testid="calendar-day" data-date="2026-9-10">Monday 10</button><button data-testid="calendar-day" data-date="2026-9-11">Tuesday 11</button>',
    },
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Requested date applied", html: "" },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(async (value) => {
      const target = value.observation.targets.find((item) => item.value === "2026-9-10")!;
      return { type: "CLICK_AUTHORITATIVE", targetRef: target.ref, field: "DATE", reason: "Choose the exact date." };
    }),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: (snapshot) => ({ complete: /applied/.test(snapshot.text), reason: "Date has not been visibly applied.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 1);
  await executor.close();
});

test("BrowserTaskExecutor rejects an ambiguous calendar day and a submit-looking authoritative button", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
      html: '<button id="bare">10</button><button id="post" formmethod="post">Sep 10th</button>',
    },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(async (value) => ({
      type: "CLICK_AUTHORITATIVE",
      targetRef: value.observation.targets.find((target) => target.label === "10")!.ref,
      field: "DATE",
      reason: "This must be rejected because the month is not observed.",
    }), async () => ({ type: "REQUEST_HUMAN_HELP", reason: "The calendar does not expose a full date." })),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: () => ({ complete: false, reason: "No verified selection." }) });
  assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  assert.equal(session.clicks, 0);
  await executor.close();
});

test("BrowserTaskExecutor keeps an invalid model action in the same bounded session and accepts a later observed-target proposal", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "Find a table", html: '<button id="show" data-praxis-read-only="true">Show results</button>' },
    { url: "https://www.tablecheck.com/en/japan/search", title: "results", text: "Sushi Inase", html: '<a href="/en/sushiinase">Sushi Inase</a>' },
  ]);
  const events: string[] = [];
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(
      async () => { throw new BrowserReadDecisionError("INVALID_MODEL_OUTPUT", "CLICK requires a targetRef and no authoritative field or requested state"); },
      async (value) => {
        assert.match(value.progress, /MODEL_WIRE_REJECTED/);
        return { type: "CLICK", targetRef: value.observation.targets[0]!.ref, reason: "Use the observed public result control" };
      },
    ),
    onDiagnostic: (event) => events.push(event.event),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  const result = await executor.runSkill(input(acquired));
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 1);
  assert.equal(events.filter((event) => event === "REJECTED").length, 1);
  await executor.close();
});

test("BrowserTaskExecutor abandons two identical rejected proposals on an unchanged page", async () => {
  const session = new FixtureSession([{
    url: "https://www.tablecheck.com/en/restaurant1", title: "availability", text: "10 guests unavailable",
    html: '<button id="party" data-value="2">2 guests</button>',
  }]);
  let calls = 0;
  const diagnostics: string[] = [];
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: { async decide() {
      calls += 1;
      throw new BrowserReadDecisionError("INVALID_MODEL_OUTPUT", "Selected party option is not an observed target");
    } },
    onDiagnostic: (event) => { if (event.detail) diagnostics.push(event.detail); },
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: () => ({ complete: false, reason: "Party remains unconfirmed." }) });
  assert.equal(result.status, "NO_SAFE_ACTION");
  assert.equal(calls, 2);
  assert.equal(session.clicks, 0);
  assert.ok(diagnostics.includes("NO_PROGRESS_REJECTED_ACTION"));
  await executor.close();
});

test("BrowserTaskExecutor removes an observed target after its action makes no page progress and continues in the same session", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Select date and party", html: '<button id="date" data-date="2026-9-10" data-hydrated="1">Monday 10</button><button id="party" data-value="2">2 guests</button>' },
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Select date and party", html: '<button id="date" data-date="2026-9-10">Monday 10</button><button id="party" data-value="2">2 guests</button>' },
  ]);
  let calls = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    modelDecision: decisions(
      async (value) => {
        calls += 1;
        return { type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets.find((target) => target.value === "2026-9-10")!.ref, field: "DATE", reason: "Try date." };
      },
      async (value) => {
        calls += 1;
        assert.equal(value.observation.targets.some((target) => target.value === "2026-9-10"), false);
        return { type: "REQUEST_HUMAN_HELP", reason: "No verified party control remains." };
      },
    ),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: () => ({ complete: false, reason: "No verified selection." }) });
  assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  assert.equal(calls, 2);
  assert.equal(session.clicks, 1);
  await executor.close();
});


test("model COMPLETE is returned to the same browser loop until the completion predicate passes or makes no progress", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "Options only", text: "19:00 19:15 19:30", html: "<p>Options only</p>" }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decisions(
    async () => ({ type: "COMPLETE", reason: "Options are visible" }),
    async () => ({ type: "COMPLETE", reason: "Options are visible" }),
  ) });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired), completion: () => ({ complete: false, reason: "Date and party are unconfirmed" }) });
    assert.equal(result.status, "NO_SAFE_ACTION");
  } finally { await executor.close(); }
});

test("an early COMPLETE receives the missing predicate and can take a later safe action in the same session", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/search", title: "Search", text: "Choose a public result", html: '<button type="button" data-date="2026-09-10">Sep 10</button>' },
    { url: "https://www.tablecheck.com/en/search", title: "Result", text: "Inventory ready", html: '<p>Inventory ready</p>' },
  ]);
  let secondProgress = "";
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decisions(
    async () => ({ type: "COMPLETE", reason: "I am done" }),
    async value => {
      secondProgress = value.progress;
      return { type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets[0]!.ref, field: "DATE", reason: "Open the observed result" };
    },
  ) });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired), completion: snapshot => ({ complete: snapshot.text === "Inventory ready", reason: "A request-bound result is not yet visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.equal(result.status, "COMPLETED");
    assert.equal(session.clicks, 1);
    assert.match(secondProgress, /Completion was not accepted: A request-bound result is not yet visible/);
  } finally { await executor.close(); }
});

test("a rejected COMPLETE refreshes an asynchronous result before requesting another model decision", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/search", title: "Search", text: "Loading availability", html: "<p>Loading availability</p>" },
    { url: "https://www.tablecheck.com/en/search", title: "Search", text: "Inventory ready", html: "<p>Inventory ready</p>" },
  ], true);
  let decisionsRequested = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decisions(
    async () => { decisionsRequested += 1; return { type: "COMPLETE", reason: "The page may have settled" }; },
  ) });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired), completion: snapshot => ({
      complete: snapshot.text === "Inventory ready",
      reason: "A request-bound result is not yet visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.snapshot.text, "Inventory ready");
    assert.equal(decisionsRequested, 1);
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor never advertises or executes page Escape without an installed read boundary", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/query", title: "modal", text: "Search dialog", html: "<dialog>Search dialog</dialog>" }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    assert.deepEqual(input.observation.pageActions, ["WAIT"]);
    return { type: "PRESS_ESCAPE", reason: "Try a page action." };
  } } });
  const signal = new AbortController().signal; const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try { const result = await executor.runSkill({ ...input(acquired, signal) }); assert.equal(result.status, "NO_SAFE_ACTION"); assert.equal(session.escapes, 0); }
  finally { await executor.close(); }
});

test("BrowserTaskExecutor passes only the recent six executed or rejected steps to the next decision", async () => {
  const captured: BrowserReadDecisionInput[] = [];
  const pages = Array.from({length: 9}, (_, i) => ({ url: `https://www.tablecheck.com/en/japan?step=${i}`, title: "search", text: i === 8 ? "Sushi Inase" : `step ${i}`, html: "" }));
  const session = new FixtureSession(pages, true);
  const executor = new BrowserTaskExecutor({openSession:async()=>session}, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxModelCallsPerCandidate:10,maxOperationsPerCandidate:100,modelDecision:{async decide(value){captured.push(structuredClone(value));return {type:"WAIT",reason:"Await next source state"};}}});
  assert.equal((await executor.runSkill(input(session))).status,"COMPLETED");
  assert.deepEqual((captured[0] as any).history, []);
  const history = (captured.at(-1) as any).history;
  assert.equal(history.length,6);
  assert.ok(history.every((x:any)=>x.action==='WAIT' && x.outcome==='PAGE_CHANGED' && x.urlChanged===true));
  await executor.close();
  const rejected: BrowserReadDecisionInput[]=[];
  const stuck=new FixtureSession([pages[0]!, pages[1]!],true);
  const other=new BrowserTaskExecutor({openSession:async()=>stuck},{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(value){rejected.push(value);return rejected.length===1?{type:"COMPLETE",reason:"Unverified finish"}:{type:"REQUEST_HUMAN_HELP",reason:"No safe completion"};}}});
  assert.equal((await other.runSkill(input(stuck))).status,"REQUESTED_HUMAN_HELP");
  assert.equal((rejected[1] as any).history[0].outcome,"REJECTED");
  assert.equal((rejected[1] as any).history[0].reason,"COMPLETE_PREDICATE_UNSATISFIED");
  await other.close();
});

test("BrowserTaskExecutor no-change feedback directs a current target and waits only on actual loading", async () => {
  const session=new FixtureSession([{url:"https://www.tablecheck.com/en/japan",title:"Results",text:"Categories All Sushi",html:'<button>All</button><a href="/en/sushi">Sushi</a>'}]);
  let calls=0;
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(value){
    if(++calls===1)return {type:"CLICK",targetRef:value.observation.targets.find(x=>x.label==="All")!.ref,reason:"Reveal categories"};
    assert.match(value.progress,/did not produce a visible change/i);
    assert.match(value.progress,/current observed target/i);
    assert.match(value.progress,/only.*(?:actually|still).*loading/i);
    assert.doesNotMatch(value.progress,/result is still not observable|or WAIT/);
    assert.ok(value.observation.targets.some(x=>x.label==="Sushi"));
    return {type:"REQUEST_HUMAN_HELP",reason:"Fixture stops after feedback capture"};
  }}});
  try{assert.equal((await executor.runSkill({...input(session),completion:()=>({complete:false,reason:"Select a category"})})).status,"REQUESTED_HUMAN_HELP");}
  finally{await executor.close();}
});

test("C2a rejects ordinary wrong-date clicks at execution even when the model ignores hints", async () => {
  const session=new FixtureSession([{url:"https://www.tablecheck.com/en/outlet",title:"Calendar",text:"Pick date",html:'<button data-date="2026-09-10">Date 2026-09-10</button><button data-date="2026-09-11">Date 2026-09-11</button>'}],false,true);
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(value){const other=value.observation.targets.find(t=>t.value==='2026-09-11')!;assert.equal(other.rejectionReason,'NON_REQUEST_DATE');return {type:'CLICK',targetRef:other.ref,reason:'Try another day'};}}});
  try{const read=await executor.runSkill({...input(session),stage:'AVAILABILITY',completion:()=>({complete:false,reason:'Date not selected'})});assert.equal(read.status,'NO_SAFE_ACTION');assert.equal(session.clicks,0);}
  finally{await executor.close();}
});

test('LOCATION fills only the same-request authoritative name in an observed public location input', async () => {
  const session=new FixtureSession([{url:'https://tabelog.com/en/tokyo/rstLst/',title:'Regions',text:'Choose area',html:''}],false,true);
  const controls:BrowserPageControl[]=[{id:'area',stableKey:'location',kind:'INPUT',role:'textbox',label:'Station or area',type:'search',visible:true,disabled:false,structure:{tag:'INPUT',name:'location',classes:[],dialogLabel:'',formClass:'',sliderCount:0}},{id:'address',stableKey:'personal-address',kind:'INPUT',role:'textbox',label:'Location address',type:'text',visible:true,disabled:false,structure:{tag:'INPUT',name:'customer_address',classes:[],dialogLabel:'',formClass:'',sliderCount:0}}];
  controls.push({id:'readonly-date',stableKey:'readonly-date',kind:'INPUT',role:'textbox',label:'November 6, 2026 (Fri)',type:'text',readOnly:true,visible:true,disabled:false,structure:{tag:'INPUT',name:'',classes:[],dialogLabel:'',formClass:'',sliderCount:0}});
  session.observeControls=async()=>controls;const fills:Array<[string,string]>=[];const publicSession:BrowserSession=session;publicSession.fill=async(id,value)=>{fills.push([id,value]);};
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:decisions(async d=>{const area=d.observation.targets.find(t=>t.label==='Station or area')!;assert.ok(area.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'));const date=d.observation.targets.find(t=>t.label==='November 6, 2026 (Fri)')!;assert.equal(date.availableActions?.some(action=>action.startsWith('FILL_AUTHORITATIVE:')),false);assert.ok(date.availableActions?.includes('CLICK'));assert.equal(d.observation.targets.find(t=>t.label==='Location address')!.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'),false);return {type:'FILL_AUTHORITATIVE',targetRef:area.ref,field:'LOCATION',reason:'Use the unchanged name'};},async()=>({type:'REQUEST_HUMAN_HELP',reason:'Stop after one fill'}))});
  const signal=new AbortController().signal;const acquired=await executor.acquire(signal,'TABELOG','DISCOVERY');await executor.runSkill({...input(acquired,signal),goal:{outlet:{name:'Restaurants'},location:{name:'Ebisu Station',latitude:35.66,longitude:139.7,radiusMeters:1000},hardCriteria:[]},completion:()=>({complete:false,reason:'Only input binding'})});assert.deepEqual(fills,[['area','Ebisu Station']]);await executor.close();
});
test('LOCATION is unavailable for coordinate-only requests without an authoritative name', async()=>{
 const session=new FixtureSession([{url:'https://tabelog.com/en/tokyo/rstLst/',title:'Regions',text:'Area',html:''}],false,true);session.observeControls=async()=>[{id:'area',stableKey:'area',kind:'INPUT',role:'textbox',label:'Area',type:'text',visible:true,disabled:false,structure:{tag:'INPUT',name:'location',classes:[],dialogLabel:'',formClass:'',sliderCount:0}}];
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:decisions(async d=>{assert.ok(d.observation.targets.every(t=>!t.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION')));return {type:'REQUEST_HUMAN_HELP',reason:'No name may be inferred'};})});const acquired=await executor.acquire(new AbortController().signal,'TABELOG','DISCOVERY');await executor.runSkill({...input(acquired),goal:{outlet:{name:'Restaurants'},location:{latitude:35.66,longitude:139.7,radiusMeters:1000},hardCriteria:[]},completion:()=>({complete:false,reason:'No guessed location'})});await executor.close();
});


test("executor requires explicit positive model and operation limits", () => {
  // @ts-expect-error Missing per-candidate and operation bounds cannot compile.
  assert.throws(() => new BrowserTaskExecutor({ openSession: async () => new FixtureSession([]) }, { maxModelCallsTotal: 120 }), TypeError);
  assert.throws(() => new BrowserTaskExecutor({ openSession: async () => new FixtureSession([]) }, { maxAutomaticElapsedMs: 300_000,  maxModelCallsTotal: 120, maxModelCallsPerCandidate: 0, maxOperationsPerCandidate: 80 }), TypeError);
});


test("group-window: visible disabled requested party ends before another model decision", async () => {
 const session=new FixtureSession([{url:"https://example.com/menu",title:"Menu",text:"Guests 10 unavailable",html:"<main></main>"}]);
 session.observeControls=async()=>[{id:"ten",stableKey:"ten",kind:"BUTTON",role:"button",label:"Guests 10",value:"10",controlGroupLabel:"Guests",controlGroupKey:"guests",visible:true,disabled:true}];
 let decisions=0;const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:1000,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,maxOperationsPerCandidate:20,modelDecision:{async decide(){decisions++;return {type:"REQUEST_HUMAN_HELP",reason:"old path"};}}});
 const result=await executor.runSkill({taskId:"disabled-party",source:"fixture",stage:"AVAILABILITY",session,signal:new AbortController().signal,allowedOrigins:["https://example.com"],goal:{outlet:{name:"Fixture",address:"Fixture"},partySize:10,hardCriteria:[]},objective:"Read request",completion:()=>({complete:false,reason:"No bound result"})});
 assert.equal(result.reasonCode,"PARTY_SIZE_NOT_SELECTABLE");assert.equal(decisions,0);assert.equal(session.clicks,0);await executor.close();
});

for (const control of [
 {label:"Guests 10",value:"10",controlGroupLabel:"Guests",disabled:false,visible:true},
 {label:"Guests 10",value:"10",controlGroupLabel:"Guests",disabled:true,visible:false},
 {label:"Guests 10",value:"10",controlGroupLabel:"Guests",disabled:true,visible:true,outsideViewport:true},
 {label:"Guests 9",value:"9",controlGroupLabel:"Guests",disabled:true,visible:true},
 {label:"10",value:"10",controlGroupLabel:"Booking time",disabled:true,visible:true},
 {label:"Guests 10",value:"10",controlGroupLabel:"Guests",disabled:true,visible:true,selected:true},
]) test(`group-window: party stop excludes ${JSON.stringify(control)}`,async()=>{
 const session=new FixtureSession([{url:"https://example.com",title:"Fixture",text:"",html:""}]);
 session.observeControls=async()=>[{id:"control",stableKey:"control",kind:"BUTTON",role:"button",...control}];
 let decisions=0;const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:1000,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,maxOperationsPerCandidate:20,modelDecision:{async decide(){decisions++;return {type:"REQUEST_HUMAN_HELP",reason:"No explicit result"};}}});
 const result=await executor.runSkill({taskId:"normal-party-control",source:"fixture",stage:"AVAILABILITY",session,signal:new AbortController().signal,allowedOrigins:["https://example.com"],goal:{outlet:{name:"Fixture",address:"Fixture"},partySize:10,hardCriteria:[]},objective:"Read",completion:()=>({complete:false,reason:"No bound result"})});
 assert.notEqual(result.reasonCode,"PARTY_SIZE_NOT_SELECTABLE");assert.equal(decisions,1);await executor.close();
});

for (const selectedDate of ["2026-11-05", "2026-11-06"]) test(`group-window: disabled party is bound to selected date ${selectedDate}`,async()=>{
 const session=new FixtureSession([{url:"https://example.com",title:"Fixture",text:"",html:""}]);
 session.observeControls=async()=>[
  {id:"date",stableKey:"date",kind:"BUTTON",role:"button",label:`Date ${selectedDate}`,calendarDate:selectedDate,selected:true,visible:true,disabled:false},
  {id:"ten",stableKey:"ten",kind:"BUTTON",role:"button",label:"Guests 10",value:"10",controlGroupLabel:"Guests",visible:true,disabled:true},
 ];
 let models=0;const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:1000,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,maxOperationsPerCandidate:20,modelDecision:{async decide(){models++;return{type:"REQUEST_HUMAN_HELP",reason:"Request date still unselected"};}}});
 const result=await executor.runSkill({taskId:"date-bound-party",source:"fixture",stage:"AVAILABILITY",session,signal:new AbortController().signal,allowedOrigins:["https://example.com"],goal:{outlet:{name:"Fixture",address:"Fixture"},date:"2026-11-06",partySize:10,hardCriteria:[]},objective:"Read exact date and party",completion:()=>({complete:false,reason:"No current inventory"})});
 assert.equal(result.reasonCode,selectedDate==="2026-11-06"?"PARTY_SIZE_NOT_SELECTABLE":undefined);assert.equal(models,selectedDate==="2026-11-06"?0:1);await executor.close();
});


test("navigation below 3000ms remaining browser budget dispatches nothing and reports budget exhaustion",async t=>{
 t.mock.timers.enable({apis:['Date'],now:0});
 const session=new FixtureSession([{url:'https://public.example/',title:'',text:'',html:''}], false, true);let navigations=0,prepared=0;
 session.navigate=async()=>{navigations++};(session as BrowserSession).prepareNavigation=async()=>{prepared++};
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:90000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24});
 const signal=new AbortController().signal;await executor.acquire(signal,'TABELOG','DISCOVERY',{documentOrigins:['https://public.example'],startupDocuments:['https://public.example/'],staticResources:[],dynamicReads:[]});
 // A short requested operation timeout is not a depleted browser window.
 await executor.navigate({source:'TABELOG',stage:'DISCOVERY',signal,allowedOrigins:['https://public.example'],session,observed:true,url:'https://public.example/',timeoutMs:100});
 assert.equal(navigations,1);assert.equal(prepared,1);
 t.mock.timers.setTime(87500);
 await assert.rejects(executor.navigate({source:'TABELOG',stage:'DISCOVERY',signal,allowedOrigins:['https://public.example'],session,observed:true,url:'https://public.example/'}),e=>e instanceof BrowserRuntimeError&&e.code==='BROWSER_BUDGET_EXHAUSTED');
 assert.equal(navigations,1);assert.equal(prepared,1);
 t.mock.timers.setTime(90000);
 await assert.rejects(executor.navigate({source:'TABELOG',stage:'DISCOVERY',signal,allowedOrigins:['https://public.example'],session,observed:true,url:'https://public.example/'}),{code:'BROWSER_BUDGET_EXHAUSTED'});
 const aborted=new AbortController();aborted.abort();
 await assert.rejects(executor.navigate({source:'TABELOG',stage:'DISCOVERY',signal:aborted.signal,allowedOrigins:['https://public.example'],session,observed:true,url:'https://public.example/'}),{code:'BROWSER_ABORTED'});
 assert.equal(navigations,1);assert.equal(prepared,1);await executor.close();
});

test("source-bound exact documents can open without a homepage or model search, while unknown destinations stay rejected", async () => {
  const session = new FixtureSession([{url:"https://public.example/shop?source=original",title:"Merchant",text:"Merchant",html:""}]);
  const navigated:string[]=[],prepared:string[]=[];let models=0;
  (session as BrowserSession).navigate=async url=>{navigated.push(url);};
  (session as BrowserSession).prepareObservedNavigation=async url=>{prepared.push(url);};
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:90_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24,modelDecision:{async decide(){models++;throw Error("A source-provided URL does not require a model-generated URL");}}});
  const signal=new AbortController().signal;
  await executor.acquire(signal,"SOURCE","IDENTITY");
  try {
    const input={source:"SOURCE",stage:"IDENTITY" as const,signal,session,allowedOrigins:["https://public.example"],observed:true};
    await executor.navigate({...input,url:"https://public.example/shop?source=original"});
    await executor.navigate({...input,url:"https://public.example/another-observed-shop"});
    assert.deepEqual(navigated,["https://public.example/shop?source=original","https://public.example/another-observed-shop"]);
    assert.deepEqual(prepared,navigated);assert.equal(models,0);
    await assert.rejects(executor.navigate({...input,url:"https://other.example/shop"}));
    await assert.rejects(executor.navigate({...input,url:"https://public.example/invented",observed:false}));
    assert.equal(navigated.length,2);
  }finally{await executor.close();}
});


test("named query receipts bind unnamed inputs, normalized values and complete field multisets without admitting stale or conflicting results",async()=>{
 for(const mode of ["BOUND","NORMALIZED","MISSING","STALE","ORIGIN","PATH","EXTRA_FIELD","REPEATED_FIELD","CONFLICT","DETAIL"] as const){
  const origin="https://public.example",query="Source Restaurant",field="arbitrary_keyword";
  let submitted=false;
  const url=new URL("/results",origin);url.searchParams.set(field,mode==="NORMALIZED"?"Ｓｏｕｒｃｅ   Restaurant":query);
  const receipt={documentOrigin:mode==="ORIGIN"?"https://other.example":origin,actionOrigin:origin,actionPathname:mode==="PATH"?"/different":"/results",
   fields:[{key:field,valueSha256:createHash("sha256").update(url.searchParams.get(field)!).digest("hex"),source:"PAGE" as const}]};
  if(mode==="EXTRA_FIELD")url.searchParams.append("unexpected","new value");
  if(mode==="REPEATED_FIELD")url.searchParams.append(field,query);
  const request={outcome:"ADMITTED" as const,origin,pathname:"/results",method:"GET",resourceType:"document",queryKeys:[field],formSubmission:receipt};
  const session=new FixtureSession([],false,true);
  session.snapshot=async()=>({url:submitted?url.toString():origin+"/start",title:"Public search",text:submitted?"Results":"Query",html:"",networkRequests:mode==="MISSING"?[]:submitted||mode==="STALE"?[request]:[]});
  session.click=async()=>{submitted=true;};
  session.observeControls=async()=>[
   {id:"query",stableKey:"query",kind:"INPUT",role:"textbox",label:"Public keyword",type:"text",value:query,visible:true,disabled:false,formMethod:"GET",formObservation:{owner:"form",visibleLines:[]}},
   {id:"submit",stableKey:"submit",kind:"BUTTON",role:"button",label:"Submit",visible:true,disabled:false,formMethod:"GET",formObservation:{owner:"form",visibleLines:[]}},
  ];
  const result=mode==="DETAIL"?new URL(url):new URL("/outlet",origin);if(mode==="CONFLICT")result.searchParams.set(field,"A different query");
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:10000,maxModelCallsPerCandidate:4,maxModelCallsTotal:4,maxOperationsPerCandidate:30,
   modelDecision:{async decide(input){return submitted?{type:"COMPLETE",reason:"Verify current list"}:{type:"CLICK",targetRef:input.observation.targets.find(t=>t.label==="Submit")!.ref,reason:"Submit observed GET"};}}});
  const signal=new AbortController().signal;
  try{
   await executor.acquire(signal,"fixture","DISCOVERY",{documentOrigins:[origin],startupDocuments:[origin+"/start"],staticResources:[],dynamicReads:[]});
   const read=await executor.search({source:"fixture",signal,session,allowedOrigins:[origin],url:origin+"/start",query,completion:()=>({complete:submitted,resultKey:"list",resultUrls:[result.toString()],resultBusy:false,reason:"Observed source list"})});
   assert.equal(read.status,mode==="BOUND"||mode==="NORMALIZED"?"COMPLETED":"NO_SAFE_ACTION",mode);
   assert.equal(read.reasonCode,mode==="CONFLICT"?"OBSERVED_QUERY_CONFLICT":mode==="DETAIL"?"OBSERVED_QUERY_NOT_LIST":mode==="BOUND"||mode==="NORMALIZED"?undefined:"OBSERVED_QUERY_UNBOUND",mode);
  }finally{await executor.closeAll();}
 }
});

test('source-confirmed date stays observable without another permitted action, even if a model insists',async()=>{
  const session=new FixtureSession([{url:'https://www.tablecheck.com/en/sushi',title:'Calendar',text:'Choose guests',html:'<button type="button" data-date="2026-9-10">Date 2026-09-10</button>'}]);
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:300_000,maxModelCallsPerCandidate:3,maxModelCallsTotal:3,maxOperationsPerCandidate:24,modelDecision:decisions(
    async value=>{const date=value.observation.targets.find(t=>t.label==='Date 2026-09-10')!;assert.deepEqual(date.availableActions,[]);assert.equal(date.rejectionReason,'SOURCE_DATE_CONFIRMED');return{type:'CLICK_AUTHORITATIVE',targetRef:date.ref,field:'DATE',reason:'LOCAL_CONSTRUCTION malicious repeated date'};},
    async()=>({type:'REQUEST_HUMAN_HELP',reason:'No unconfirmed action selected'}),
  )});
  const acquired=await executor.acquire(new AbortController().signal,'TABLECHECK','AVAILABILITY');
  try{const result=await executor.runSkill({...input(acquired),stage:'AVAILABILITY',completion:()=>({complete:false,confirmedFields:['DATE'],reason:'Source date confirmed; guests still unknown'})});assert.equal(result.status,'REQUESTED_HUMAN_HELP');assert.equal(session.clicks,0);}finally{await executor.close();}
});

test('new completion confirmation is verified progress even when DOM and controls are unchanged',async()=>{
 const page={url:'https://public.example/filter',title:'Public query',text:'Apply filter',html:'<button type="button" formmethod="get">Apply filter</button>'};
 const session=new FixtureSession([page],false,true);let confirmed=false,observes=0,models=0;
 const originalObserve=session.observeControls.bind(session);session.observeControls=async()=>{observes++;return originalObserve();};session.click=async()=>{confirmed=true;};
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:90000,maxModelCallsPerCandidate:3,maxModelCallsTotal:3,maxOperationsPerCandidate:30,modelDecision:{async decide(value){models++;if(models===1)return{type:'CLICK',targetRef:value.observation.targets.find(t=>t.label==='Apply filter')!.ref,reason:'Observed public filter'};assert.equal(value.progress,'Source-confirmed field; another field remains');return{type:'REQUEST_HUMAN_HELP',reason:'Component stops after checking observation reuse'};}}});
 try{const signal=new AbortController().signal;await executor.acquire(signal,'PUBLIC','AVAILABILITY');const result=await executor.runSkill({taskId:'confirmation-progress',source:'PUBLIC',stage:'AVAILABILITY',signal,session,allowedOrigins:['https://public.example'],goal:{outlet:{name:'Public outlet'},date:'2030-01-02',partySize:8,timeWindow:{earliest:'20:30',latest:'20:30'},hardCriteria:[]},objective:'Apply authoritative fields',completion:()=>({complete:false,reason:confirmed?'Source-confirmed field; another field remains':'Await source',confirmedFields:confirmed?['DATE']:[]})});assert.equal(result.status,'REQUESTED_HUMAN_HELP');assert.equal(observes,2,'same post-action snapshot must reuse its controls');}finally{await executor.closeAll();}
});

for(const viaNavigation of [true,false])test(`pending initial page settles before its only control scan (navigation=${viaNavigation})`,async()=>{
 const page={url:'https://www.tablecheck.com/en/japan',title:'Public page',text:'Current controls',html:'<button>Inspect</button>'};
 const session=new FixtureSession([page]);let ready=false,waits=0,scans=0;
 session.snapshot=async()=>({...page,settlement:ready?'SETTLED':'PENDING'});
 session.waitForSettled=async()=>{waits++;ready=!viaNavigation||waits>1;return ready;};
 const observe=session.observeControls.bind(session);session.observeControls=async()=>{assert.equal(ready,true,'never scan a pending pre-settlement page');scans++;return observe();};
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:90000,maxModelCallsPerCandidate:2,maxModelCallsTotal:2,maxOperationsPerCandidate:20,modelDecision:decisions(async()=>{assert.equal(scans,1);return{type:'REQUEST_HUMAN_HELP',reason:'Component stops at first decision'};})});
 try{const signal=new AbortController().signal;await executor.acquire(signal,'PUBLIC','AVAILABILITY');if(viaNavigation)await executor.navigate({source:'PUBLIC',stage:'IDENTITY',signal,session,allowedOrigins:['https://www.tablecheck.com'],url:page.url,observed:true});const result=await executor.runSkill({...input(session,signal),source:'PUBLIC',stage:'AVAILABILITY',completion:()=>({complete:false,reason:'Query not applied'})});assert.equal(result.status,'REQUESTED_HUMAN_HELP');assert.equal(scans,1);}finally{await executor.closeAll();}
});

for (const usesControls of [undefined,true,false]) test(`terminal controls remain default; snapshot-only completion is explicit (${usesControls})`,async()=>{
 const url='https://public.example/shop',before={url,title:'query',text:'waiting',html:'<button type="button">Refresh public result</button>'};
 const session=new FixtureSession([before,{...before,text:'ready'}],false,true);let scans=0,after=false;
 const click=session.click.bind(session),observe=session.observeControls.bind(session);session.click=async(...a)=>{await click(...a);after=true;};session.observeControls=async()=>{scans++;return observe();};
 const controls=await observe();const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:5000,maxModelCallsPerCandidate:1,maxModelCallsTotal:3,maxOperationsPerCandidate:12,modelDecision:{async decide(i){return{type:'CLICK',targetRef:i.observation.targets[0]!.ref,reason:'Observed read-only update'};}}});
 try{const result=await executor.runSkill({taskId:'terminal',source:'fixture',stage:'DISCOVERY',session,signal:new AbortController().signal,allowedOrigins:[new URL(url).origin],goal:{outlet:{name:'Fixture'},hardCriteria:[]},objective:'Read source result',initialObservation:{snapshot:before,controls},...(usesControls===undefined?{}:{completionUsesControls:usesControls}),completion:(_s,c)=>({complete:after&&(usesControls===false||c.length>0),reason:'Await current source result',resultKey:'bound',resultBusy:false})});assert.equal(result.status,'COMPLETED');assert.equal(scans,usesControls===false?0:1);assert.equal(result.controls.length===0,usesControls===false);}finally{await executor.closeAll();}
});

for(const mode of ['INCOMPLETE','DISABLED','BUSY']as const)test(`snapshot-only nonterminal assessment preserves control checks without reassessment (${mode})`,async()=>{
 const url='https://public.example/query',page={url,title:'query',text:'source',html:''};let acted=false,scans=0,postAssessments=0;const events:string[]=[];
 const controls=():BrowserPageControl[]=>[{id:'refresh',stableKey:'refresh',kind:'BUTTON',role:'button',type:'button',label:'Refresh source',visible:true,disabled:false},
  {id:'date',stableKey:'date',kind:'BUTTON',role:'button',label:'Date 2026-09-10',calendarDate:'2026-09-10',selected:true,visible:true,disabled:false},
  {id:'party',stableKey:'party',kind:'BUTTON',role:'button',label:'Guests 2',value:'2',controlGroupLabel:'Guests',visible:true,disabled:acted&&mode==='DISABLED'}];
 const session=new FixtureSession([page],false,true);session.click=async()=>{acted=true;};session.observeControls=async()=>{scans++;assert.equal(postAssessments,1,'only one predicate evaluation precedes fallback controls');return controls();};
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:5000,maxModelCallsPerCandidate:mode==='DISABLED'?2:1,maxModelCallsTotal:3,maxOperationsPerCandidate:15,onDiagnostic:d=>{if(d.detail)events.push(d.detail);},modelDecision:{async decide(i){return{type:'CLICK',targetRef:i.observation.targets.find(t=>t.label==='Refresh source')!.ref,reason:'Read current result'};}}});
 try{const result=await executor.runSkill({...input(session),source:'fixture',stage:'AVAILABILITY',allowedOrigins:[new URL(url).origin],initialObservation:{snapshot:page,controls:controls()},completionUsesControls:false,completion:()=>{if(acted)postAssessments++;return{complete:false,reason:'No bound inventory',resultBusy:acted&&mode==='BUSY'};}});assert.notEqual(result.status,'COMPLETED');assert.equal(scans,1);assert.equal(postAssessments,1);if(mode==='DISABLED')assert.equal(result.reasonCode,'PARTY_SIZE_NOT_SELECTABLE');assert.equal(events.filter(s=>s==='COMPLETION_RESULT_BUSY').length,mode==='BUSY'?1:0);}finally{await executor.closeAll();}
});

for(const guard of ['OPTION','RADIO','CALENDAR','PARTY']as const)test(`snapshot-only completion cannot bypass an unresolved ${guard} observation`,async()=>{
 const url='https://public.example/query',page={url,title:'query',text:'source',html:''};let acted=false,scans=0;const required=new Error('Required post-action control observation');
 const control:BrowserPageControl=guard==='OPTION'?{id:'select',stableKey:'select',kind:'SELECT',role:'combobox',label:'Date',options:[{value:'2026-09-10',label:'2026-09-10',selected:false,disabled:false}],disabled:false,visible:true}
 :guard==='RADIO'?{id:'radio',stableKey:'radio',kind:'RADIO',role:'radio',label:'Public filter',checked:false,disabled:false,visible:true}
 :guard==='CALENDAR'?{id:'calendar',stableKey:'calendar',kind:'BUTTON',role:'button',type:'button',label:'Next month',controlGroupLabel:'Calendar',calendarMonth:{year:2026,month:9,caption:'September 2026',source:'ARIA label'},disabled:false,visible:true}
 :{id:'party',stableKey:'party',kind:'BUTTON',role:'button',type:'button',label:'Guests 2',value:'2',controlGroupLabel:'Guests',disabled:false,visible:true};
 const session=new FixtureSession([page],false,true);session.observeControls=async()=>{scans++;throw required;};session.click=async()=>{acted=true;};session.select=async(_id,value)=>{acted=true;return[value];};(session as BrowserSession).setChecked=async()=>{acted=true;};
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:5000,maxModelCallsPerCandidate:1,maxModelCallsTotal:3,maxOperationsPerCandidate:15,modelDecision:{async decide(i){const target=i.observation.targets.find(t=>guard!=='OPTION'||t.kind==='OPTION')!;return guard==='OPTION'?{type:'CHOOSE_OPTION',targetRef:target.ref,field:'DATE',reason:'Observed date option'}:guard==='RADIO'?{type:'SET_CHECKED',targetRef:target.ref,checked:true,reason:'Observed read filter'}:guard==='PARTY'?{type:'CLICK_AUTHORITATIVE',targetRef:target.ref,field:'PARTY_SIZE',reason:'Observed requested count'}:{type:'CLICK',targetRef:target.ref,reason:'Observed calendar navigation'};}}});
 try{await assert.rejects(executor.runSkill({...input(session),source:'fixture',stage:'AVAILABILITY',allowedOrigins:[new URL(url).origin],initialObservation:{snapshot:page,controls:[control]},completionUsesControls:false,completion:()=>({complete:acted,reason:'Snapshot alone cannot confirm the pending control',resultKey:'bound',resultBusy:false})}),e=>e===required);assert.equal(acted,true);assert.equal(scans,1);}finally{await executor.closeAll();}
});

for(const stable of [true,false])test(`snapshot-only pending terminal result still requires matching stability (${stable})`,async()=>{
 const url='https://public.example/result',page={url,title:'query',text:'before',html:'<button type="button">Refresh public result</button>'};let acted=false,postSnapshots=0,scans=0;const events:string[]=[];
 const session=new FixtureSession([page],false,true);const originalObserve=session.observeControls.bind(session);const initial=await originalObserve();session.click=async()=>{acted=true;};session.waitForSettled=async()=>false;session.snapshot=async()=>{if(acted)postSnapshots++;return{...page,text:acted?(stable||postSnapshots===1?'ready':'rotated'):'before',settlement:acted?'PENDING':'SETTLED'};};session.observeControls=async()=>{scans++;return originalObserve();};
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:5000,maxModelCallsPerCandidate:1,maxModelCallsTotal:3,maxOperationsPerCandidate:16,onDiagnostic:d=>{if(d.detail)events.push(d.detail);},modelDecision:{async decide(i){return{type:'CLICK',targetRef:i.observation.targets[0]!.ref,reason:'Read source result'};}}});
 try{const result=await executor.runSkill({...input(session),source:'fixture',allowedOrigins:[new URL(url).origin],initialObservation:{snapshot:page,controls:initial},completionUsesControls:false,completion:s=>({complete:acted,reason:'Bound current result',resultKey:s.text,resultBusy:false})});assert.equal(result.status==='COMPLETED',stable);assert.equal(postSnapshots,2);assert.equal(scans,stable?0:1);assert.equal(events.filter(x=>x==='COMPLETION_RESULT_BUSY').length,0);assert.ok(events.includes('VERIFY_RESULT_STABILITY'));if(stable)assert.equal(result.snapshot.settlement,'SETTLED');}finally{await executor.closeAll();}
});
