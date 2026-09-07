import assert from "node:assert/strict";
import { test } from "node:test";

import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserTaskExecutor } from "./browser-task-executor.js";
import { BrowserReadDecisionError, type BrowserReadActionDecisionPort, type BrowserReadDecisionInput } from "./browser-action-decision.js";

class FixtureSession implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, sessionId: "fixture:shared", startedAt: "2026-09-07T00:00:00.000Z" };
  closed = 0;
  clicks = 0;
  selected: string[] = [];
  private index = 0;

  constructor(private readonly pages: BrowserSnapshot[]) {}

  async navigate(): Promise<void> { this.index = Math.min(this.index + 1, this.pages.length - 1); }
  async snapshot(): Promise<BrowserSnapshot> { return this.pages[this.index]!; }
  async click(): Promise<void> { this.clicks += 1; this.index = Math.min(this.index + 1, this.pages.length - 1); }
  async fill(): Promise<void> {}
  async select(_target: string, value: string): Promise<string[]> { this.selected.push(value); return [value]; }
  async waitFor(): Promise<void> {}
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
    authoritative: { date: "2026-09-10", partySize: 2 },
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
      async () => { throw new BrowserReadDecisionError("INVALID_MODEL_OUTPUT", "CLICK requires a targetRef"); },
      async (value) => ({ type: "CLICK", targetRef: value.observation.targets[0]!.ref, reason: "Use the observed public result control" }),
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
