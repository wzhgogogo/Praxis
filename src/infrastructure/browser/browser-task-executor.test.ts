import assert from "node:assert/strict";
import { test } from "node:test";

import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserTaskExecutor } from "./browser-task-executor.js";
import { BrowserReadDecisionError, type BrowserReadActionDecisionPort, type BrowserReadDecisionInput } from "./browser-action-decision.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";

class FixtureSession implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, sessionId: "fixture:shared", startedAt: "2026-09-07T00:00:00.000Z" };
  closed = 0;
  clicks = 0;
  selected: string[] = [];
  private index = 0;

  constructor(private readonly pages: BrowserSnapshot[]) {}

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
      controls.push({ id: `fixture:${this.index}:${controls.length}`, stableKey: `${tag}|${label}|${value ?? ""}|${controls.length}`, kind: tag === "a" ? "LINK" : tag === "select" ? "SELECT" : tag === "input" ? "INPUT" : "BUTTON", role: tag === "a" ? "link" : tag === "button" ? "button" : tag, label, ...(value ? { value } : {}), ...(absoluteHref ? { href: absoluteHref } : {}), ...(attrs.match(/formmethod=["']post/i) ? { formMethod: "POST" as const } : attrs.match(/formmethod=["']get/i) ? { formMethod: "GET" as const } : {}), ...(type ? { type } : {}), disabled: /disabled|aria-disabled=["']true/i.test(attrs), visible: true });
    }
    return controls;
  }
  async click(): Promise<void> { this.clicks += 1; this.index = Math.min(this.index + 1, this.pages.length - 1); }
  async fill(): Promise<void> {}
  async select(_target: string, value: string): Promise<string[]> { this.selected.push(value); return [value]; }
  async waitFor(): Promise<void> {}
  async waitForChange(previous: Pick<BrowserSnapshot, "url" | "title" | "text">): Promise<boolean> {
    const current = this.pages[this.index]!;
    return current.url !== previous.url || current.title !== previous.title || current.text !== previous.text;
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

test("BrowserTaskExecutor binds model-controlled fields to the Router authority and blocks an unsafe submit-looking click", async () => {
  const session = new FixtureSession([
    {
      url: "https://www.tablecheck.com/en/sushi", title: "availability", text: "Choose date",
      html: '<select id="date"><option value="2026-09-10">2026-09-10</option></select><button id="submit" formmethod="post">Reserve now</button>',
    },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: decisions(
      async (value) => ({ type: "SELECT_AUTHORITATIVE", targetRef: value.observation.targets.find((target) => target.kind === "SELECT")!.ref, field: "DATE", reason: "set requested date" }),
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
        assert.match(value.progress, /no authoritative field or requested state/);
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


test("model COMPLETE cannot claim that the source completion predicate passed", async () => {
  const session = new FixtureSession([{ url: "https://www.tablecheck.com/en/japan/search", title: "Options only", text: "19:00 19:15 19:30", html: "<p>Options only</p>" }]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision: decisions(async () => ({ type: "COMPLETE", reason: "Options are visible" })) });
  const acquired = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    const result = await executor.runSkill({ ...input(acquired), completion: () => ({ complete: false, reason: "Date and party are unconfirmed" }) });
    assert.equal(result.status, "MODEL_HANDOFF");
  } finally { await executor.close(); }
});
