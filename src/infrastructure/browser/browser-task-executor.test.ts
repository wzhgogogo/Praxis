import assert from "node:assert/strict";
import { test } from "node:test";

import type { BrowserPageControl, BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserTaskExecutor } from "./browser-task-executor.js";
import { BrowserReadDecisionError, type BrowserReadActionDecisionPort, type BrowserReadDecisionInput } from "./browser-action-decision.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";

class FixtureSession implements BrowserSession {
  readonly metadata: BrowserSession["metadata"];
  closed = 0;
  clicks = 0;
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
      controls.push({ id: `fixture:${this.index}:${controls.length}`, stableKey: `${tag}|${label}|${value ?? ""}|${controls.length}`, kind: tag === "a" ? "LINK" : tag === "select" ? "SELECT" : tag === "input" ? "INPUT" : "BUTTON", role: tag === "a" ? "link" : tag === "button" ? "button" : tag === "select" ? "combobox" : tag, label, ...(value ? { value } : {}), ...(absoluteHref ? { href: absoluteHref } : {}), ...(attrs.match(/formmethod=["']post/i) ? { formMethod: "POST" as const } : attrs.match(/formmethod=["']get/i) ? { formMethod: "GET" as const } : {}), ...(type ? { type } : {}), ...(options?.length ? { options } : {}), disabled: /disabled|aria-disabled=["']true/i.test(attrs), visible: true });
    }
    return controls;
  }
  async click(): Promise<void> { this.clicks += 1; this.index = Math.min(this.index + 1, this.pages.length - 1); }
  async fill(): Promise<void> {}
  async select(_target: string, value: string): Promise<string[]> { this.selected.push(value); return [value]; }
  async waitFor(): Promise<void> {}
  async waitForChange(previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">): Promise<boolean> {
    if (this.advanceOnWait) this.index = Math.min(this.index + 1, this.pages.length - 1);
    const current = this.pages[this.index]!;
    return current.url !== previous.url || current.title !== previous.title || current.text !== previous.text;
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
    completion: (snapshot: BrowserSnapshot) => ({ complete: /Sushi Inase/.test(snapshot.text), reason: "A public result is not yet visible." }),
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
  const executor = new BrowserTaskExecutor(runtime);
  assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), session);
  assert.equal(await executor.acquire(new AbortController().signal, "TABELOG", "DISCOVERY"), session);
  assert.equal(opens, 1);
  await executor.close();
  assert.equal(session.closed, 1);
});

test("BrowserTaskExecutor refuses a policy read when a runtime only exposes an unguarded session", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  const policy: BrowserReadNetworkPolicy = { documentOrigins: ["https://www.tablecheck.com"], staticResources: [], dynamicReads: [] };
  const executor = new BrowserTaskExecutor({ openSession: async () => session });
  await assert.rejects(
    () => executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY", policy),
    (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_FAILED",
  );
  assert.equal(session.closed, 1);
});

test("BrowserTaskExecutor records candidate and provider lifecycle costs through a normal close", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
    assert.equal(diagnostics.some(item => item.event === "ASYNC_WAIT" && item.detail === "PAGE_STATE_CHANGED"), true);
  } finally {
    await executor.close();
  }
});

test("BrowserTaskExecutor spends one bounded operation on page-level Escape then re-observes", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "modal", text: "Search dialog open", html: "<dialog>Search dialog open</dialog>" },
    { url: "https://www.tablecheck.com/en/query", title: "results", text: "Sushi Inase 19:00", html: "<main>Sushi Inase 19:00</main>" },
  ], false, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => guarded }, {
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
  } finally { await executor.close(); }

  const unguarded = new FixtureSession(pages);
  const unguardedExecutor = new BrowserTaskExecutor({ openSession: async () => unguarded }, {
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

test("BrowserTaskExecutor keeps an observed sensitive submit unavailable even in an installed read boundary", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Reserve", html: '<button type="submit">Reserve table</button>' },
  ], false, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: { async decide(input) {
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
    const result = await executor.runSkill({ ...input(acquired, signal), goal: { outlet: { name: "Sushi" }, retrievalExpression: "omakase", hardCriteria: [] } });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor executes a guarded authoritative date button only for the Router-bound date", async () => {
  const session = new FixtureSession([
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Choose date", html: '<button type="submit" data-date="2026-09-10">10</button>' },
    { url: "https://www.tablecheck.com/en/query", title: "query", text: "Sushi Inase 19:00", html: "<main>Sushi Inase 19:00</main>" },
  ], false, true);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    maxOperationsPerCandidate: 1, onDiagnostic: item => diagnostics.push(item),
  });
  const signal = new AbortController().signal;
  const acquired = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  await executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session: acquired });
  await assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session: acquired }),
    (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_TIMEOUT" && /operation budget/.test(error.message));
  assert.equal(diagnostics.find(item => item.event === "BUDGET_EXHAUSTED")?.lifecycle.reason, "OPERATION_BUDGET_EXHAUSTED");
  assert.equal(diagnostics.filter(item => item.event === "OPERATION_STARTED").length, 1);
  await executor.close();

  const actionSession = new FixtureSession([{ url: "https://www.tablecheck.com/en/sushi", title: "query", text: "Choose date", html: '<button type="button" data-date="2026-9-10">Thursday 10</button>' }]);
  const actionDiagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const actionExecutor = new BrowserTaskExecutor({ openSession: async () => actionSession }, {
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
  }, { onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
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
  const executor = new BrowserTaskExecutor({ openSession: async () => new FixtureSession([]) }, {
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
  }, { onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
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

test("BrowserTaskExecutor records a failed runtime operation with its local cause", async () => {
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  session.snapshot = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "socket reset"); };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
  executor.beginProvider("candidate-1", "TABLECHECK");
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  await assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: new AbortController().signal, session: acquired }), { code: "BROWSER_RUNTIME_FAILED" });
  const failure = diagnostics.find(item => item.event === "OPERATION_FAILED");
  assert.equal(failure?.lifecycle.reason, "RUNTIME_FAILURE");
  assert.equal(failure?.lifecycle.failureCode, "BROWSER_RUNTIME_FAILED");
  await executor.close();
});

test("a runtime navigation failure retires its session before the next candidate without resetting the run", async () => {
  const failed = new FixtureSession([{ url: "https://www.tablecheck.com/old", title: "old", text: "old", html: "" }]);
  failed.navigate = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "navigation failed"); };
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/new", title: "new", text: "new", html: "" }]);
  let opens = 0;
  const budget = { totalModelCalls: 3 };
  const executor = new BrowserTaskExecutor({ openSession: async () => ++opens === 1 ? failed : next }, { budget });
  const signal = new AbortController().signal;
  executor.beginProvider("first", "TABLECHECK");
  const old = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  await assert.rejects(executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", signal, session: old, url: "https://www.tablecheck.com/fail", allowedOrigins: ["https://www.tablecheck.com"] }), { code: "BROWSER_RUNTIME_FAILED" });
  executor.beginProvider("second", "TABLECHECK");
  assert.equal(await executor.acquire(signal, "TABLECHECK", "DISCOVERY"), next);
  assert.equal(failed.closed, 1);
  assert.equal(opens, 2);
  assert.equal(budget.totalModelCalls, 3);
  await executor.close();
});

test("a stuck old close cannot delay cancellation or overwrite the next candidate", async () => {
  const failed = new FixtureSession([{ url: "https://www.tablecheck.com/old", title: "old", text: "old", html: "" }]);
  failed.navigate = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "navigation failed"); };
  let finishClose: (() => void) | undefined;
  failed.close = async () => new Promise<void>(resolve => { finishClose = resolve; });
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/new", title: "new", text: "new", html: "" }]);
  const diagnostics: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => ++opens === 1 ? failed : next }, {
    maxElapsedMsPerCandidate: 40, onDiagnostic: diagnostic => diagnostics.push(diagnostic),
  });
  const oldSignal = new AbortController();
  executor.beginProvider("old", "TABLECHECK");
  const old = await executor.acquire(oldSignal.signal, "TABLECHECK", "IDENTITY");
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

test("a stuck runtime cleanup does not hold a canceled read or reset its candidate deadline", async () => {
  const failed = new FixtureSession([{ url: "https://www.tablecheck.com/old", title: "old", text: "old", html: "" }]);
  failed.navigate = async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "navigation failed"); };
  let finishClose: (() => void) | undefined;
  failed.close = async () => new Promise<void>(resolve => { finishClose = resolve; });
  const executor = new BrowserTaskExecutor({ openSession: async () => failed }, { maxElapsedMsPerCandidate: 15 });
  const controller = new AbortController();
  executor.beginProvider("old", "TABLECHECK");
  const session = await executor.acquire(controller.signal, "TABLECHECK", "IDENTITY");
  const navigation = executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", signal: controller.signal, session, url: "https://www.tablecheck.com/fail", allowedOrigins: ["https://www.tablecheck.com"] });
  controller.abort();
  await assert.rejects(navigation, { code: "BROWSER_ABORTED" });
  await new Promise(resolve => setTimeout(resolve, 20));
  await assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "IDENTITY"), { code: "BROWSER_TIMEOUT" });
  finishClose?.();
});

test("BrowserTaskExecutor aborts an in-flight operation, closes once asynchronously, and never reuses that session", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "search", text: "", html: "" }]);
  let resolveSnapshot: ((snapshot: BrowserSnapshot) => void) | undefined;
  session.snapshot = async () => new Promise<BrowserSnapshot>((resolve) => { resolveSnapshot = resolve; });
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/en/next", title: "next", text: "", html: "" }]);
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => (++opens === 1 ? session : next) });
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

test("BrowserTaskExecutor bounds a late session acquisition without leaking its deadline into the next candidate", async () => {
  const late = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "late", text: "", html: "" }]);
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan", title: "next", text: "", html: "" }]);
  let resolveLate: ((session: BrowserSession) => void) | undefined;
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => {
    opens += 1;
    if (opens === 1) return new Promise<BrowserSession>((resolve) => { resolveLate = resolve; });
    return next;
  } }, { maxElapsedMsPerCandidate: 10 });
  executor.beginCandidate("first");
  await assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), { code: "BROWSER_TIMEOUT" });
  resolveLate!(late);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(late.closed, 1, "a session that resolves after its candidate deadline is closed rather than cached");
  executor.beginCandidate("second");
  assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), next);
  assert.equal(next.closed, 0, "the first candidate's deadline cannot close the next candidate's shared session");
  await executor.close();
});

test("BrowserTaskExecutor times out a hanging snapshot, closes that session, and permits the next candidate", async () => {
  const stuck = new FixtureSession([{ url: "https://www.tablecheck.com/en/stuck", title: "stuck", text: "", html: "" }]);
  stuck.snapshot = async () => new Promise<BrowserSnapshot>(() => {});
  const next = new FixtureSession([{ url: "https://www.tablecheck.com/en/next", title: "next", text: "", html: "" }]);
  let opens = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => (++opens === 1 ? stuck : next) }, { maxElapsedMsPerCandidate: 10 });
  executor.beginCandidate("stuck");
  const first = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  await assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: new AbortController().signal, session: first }), { code: "BROWSER_TIMEOUT" });
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
    async waitForChange() { return true; }, async screenshot() { return new Uint8Array(); }, async close() { closes += 1; },
  };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxOperationsPerCandidate: 24, onDiagnostic: (diagnostic) => diagnostics.push(diagnostic.detail ?? ""), modelDecision: {
    async decide(value) { return { type: "CLICK", targetRef: value.observation.targets[0]!.ref, reason: "Inspect next public page" }; },
  } });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  const diagnostics: string[] = [];
  const result = await executor.runSkill({ ...input(acquired), completion: () => ({ complete: false, reason: "Continue" }) });
  assert.equal(result.status, "NO_SAFE_ACTION");
  assert.ok(diagnostics.includes("NO_PROGRESS_PAGE_CYCLE"));
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
  const first = new BrowserTaskExecutor({ openSession: async () => firstSession }, { modelDecision, maxModelCallsTotal: 1, budget });
  const acquiredFirst = await first.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  assert.equal((await first.runSkill({ ...input(acquiredFirst), completion: () => ({ complete: false, reason: "continue" }) })).status, "REQUESTED_HUMAN_HELP");
  await first.close();

  const secondSession = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "", html: "" }]);
  const second = new BrowserTaskExecutor({ openSession: async () => secondSession }, { modelDecision, maxModelCallsTotal: 1, budget });
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
    { modelDecision, budget },
  );
  const firstSession = await first.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  assert.equal((await first.runSkill({ ...input(firstSession), completion: () => ({ complete: false, reason: "continue" }) })).status, "REQUESTED_HUMAN_HELP");
  await first.close();

  const second = new BrowserTaskExecutor(
    { openSession: async () => new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "search", text: "", html: "" }]) },
    { modelDecision, budget },
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
    const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: decisions(
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
    { id: "search", stableKey: "input|search_text", kind: "INPUT", role: "textbox", label: "Sushi tonight for 2 in Ginza", value: "omakase",
      disabled: false, visible: true, structure: { tag: "INPUT", name: "search_text", classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } },
    { id: "email", stableKey: "input|email", kind: "INPUT", role: "textbox", label: "Restaurant contact", value: "",
      type: "email", disabled: false, visible: true, structure: { tag: "INPUT", name: "customer_email", classes: [], dialogLabel: "", formClass: "", sliderCount: 0 } },
  ];
  session.observeControls = async () => controls;
  const fills: string[] = [];
  const browserSession: BrowserSession = session;
  browserSession.fill = async target => { fills.push(target); };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: decisions(
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
  const result = await executor.runSkill({ ...input(acquired, signal), goal: { outlet: { name: "Sushi" }, retrievalExpression: "omakase", hardCriteria: [] },
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: decisions(async (value) => ({
      type: "CLICK_AUTHORITATIVE",
      targetRef: value.observation.targets.find((target) => target.value === "2026-9-10" && target.formMethod !== "POST")!.ref,
      field: "DATE",
      reason: "Select the requested date.",
    })),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: (snapshot) => ({ complete: /applied/.test(snapshot.text), reason: "Date has not been visibly applied." }) });
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 1);
  await executor.close();
});

test("BrowserTaskExecutor shows a disabled date as read-only and rejects a proposed click", async () => {
  const session = new FixtureSession([{
    url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
    html: '<button type="button" data-date="2026-9-10" disabled>Thursday 10</button>',
  }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
    { url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Date and guests confirmed", html: '<p>Selected request</p>' },
  ]);
  const events: import("./browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    maxOperationsPerCandidate: 8,
    onDiagnostic: event => events.push(event),
    modelDecision: decisions(
      async value => ({ type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets.find(target => target.value === "2026-9-10")!.ref, field: "DATE", reason: "Select date." }),
      async value => ({ type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets.find(target => target.value === "2")!.ref, field: "PARTY_SIZE", reason: "Select guests." }),
    ),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: snapshot => ({ complete: /confirmed/.test(snapshot.text), reason: "Request is not visibly selected." }) });
  assert.equal(result.status, "COMPLETED");
  assert.equal(session.clicks, 2);
  assert.equal(events.filter(event => event.event === "OPERATION_STARTED").length, 8);
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: decisions(async (value) => ({
      type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets[0]!.ref, field: "DATE", reason: "Select the exact visible date.",
    })),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: (snapshot) => ({ complete: /applied/.test(snapshot.text), reason: "Date is not applied." }) });
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: decisions(async (value) => {
      const target = value.observation.targets.find((item) => item.value === "2026-9-10")!;
      return { type: "CLICK_AUTHORITATIVE", targetRef: target.ref, field: "DATE", reason: "Choose the exact date." };
    }),
  });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  const result = await executor.runSkill({ ...input(acquired), stage: "AVAILABILITY", completion: (snapshot) => ({ complete: /applied/.test(snapshot.text), reason: "Date has not been visibly applied." }) });
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: decisions(
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: decisions(
    async () => ({ type: "COMPLETE", reason: "I am done" }),
    async value => {
      secondProgress = value.progress;
      return { type: "CLICK_AUTHORITATIVE", targetRef: value.observation.targets[0]!.ref, field: "DATE", reason: "Open the observed result" };
    },
  ) });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired), completion: snapshot => ({ complete: snapshot.text === "Inventory ready", reason: "A request-bound result is not yet visible." }) });
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
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: decisions(
    async () => { decisionsRequested += 1; return { type: "COMPLETE", reason: "The page may have settled" }; },
  ) });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired), completion: snapshot => ({
      complete: snapshot.text === "Inventory ready",
      reason: "A request-bound result is not yet visible.",
    }) });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.snapshot.text, "Inventory ready");
    assert.equal(decisionsRequested, 1);
  } finally { await executor.close(); }
});

test("BrowserTaskExecutor never advertises or executes page Escape without an installed read boundary", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/query", title: "modal", text: "Search dialog", html: "<dialog>Search dialog</dialog>" }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: { async decide(input) {
    assert.deepEqual(input.observation.pageActions, ["WAIT"]);
    return { type: "PRESS_ESCAPE", reason: "Try a page action." };
  } } });
  const signal = new AbortController().signal; const acquired = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try { const result = await executor.runSkill({ ...input(acquired, signal) }); assert.equal(result.status, "NO_SAFE_ACTION"); assert.equal(session.escapes, 0); }
  finally { await executor.close(); }
});
