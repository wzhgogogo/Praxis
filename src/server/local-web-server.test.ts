import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";

import { PGlite, type Results, type Transaction } from "@electric-sql/pglite";

import type { RestaurantCaseView } from "../application/agent-workspace.js";
import {
  PersistentRestaurantAgentApplication,
  PilotSessionService,
  type PilotAccessEntry,
} from "../application/persistent-restaurant-agent.js";
import { FakeClock } from "../harness/fake-clock.js";
import { RestaurantSemanticInterpreter } from "../domains/restaurant/semantic-interpreter.js";
import { RestaurantAgentDecision } from "../domains/restaurant/agent-decision.js";
import { FixtureModelGateway } from "../infrastructure/fixture/fixture-model-gateway.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";
import { applyPostgresMigrations } from "../infrastructure/postgres/migrations.js";
import type {
  SqlDatabase,
  SqlExecutor,
  SqlQueryResult,
} from "../infrastructure/postgres/sql-database.js";
import { createLocalWebServer } from "./local-web-server.js";

const COMPLETE_REQUEST =
  "Tonight at 7pm near Shinjuku for two, yakiniku, around 5000 yen each.";
const ACCESS: PilotAccessEntry[] = [
  { accessToken: "token-a", id: "user-a", displayName: "User A" },
  { accessToken: "token-b", id: "user-b", displayName: "User B" },
];

class PGliteSqlExecutor implements SqlExecutor {
  constructor(private readonly executor: Pick<PGlite | Transaction, "query">) {}

  async query<Row>(
    sql: string,
    parameters: readonly unknown[] = [],
  ): Promise<SqlQueryResult<Row>> {
    const result = (await this.executor.query<Row>(sql, [...parameters])) as Results<Row>;
    return { rows: result.rows, affectedRows: result.affectedRows ?? 0 };
  }
}

class PGliteSqlDatabase extends PGliteSqlExecutor implements SqlDatabase {
  constructor(private readonly database: PGlite) {
    super(database);
  }

  transaction<Result>(callback: (transaction: SqlExecutor) => Promise<Result>): Promise<Result> {
    return this.database.transaction((transaction) =>
      callback(new PGliteSqlExecutor(transaction)),
    );
  }
}

interface TestServer {
  baseUrl: string;
  application: PersistentRestaurantAgentApplication;
  close(): Promise<void>;
}

async function startServer(database: SqlDatabase, clock: FakeClock): Promise<TestServer> {
  const model = new FixtureModelGateway();
  const restaurant = new FixtureRestaurantSearch();
  const application = new PersistentRestaurantAgentApplication({
    database,
    clock,
    semanticInterpreter: new RestaurantSemanticInterpreter(model),
    agentDecision: new RestaurantAgentDecision(model),
    restaurantSearch: restaurant,
    restaurantAvailability: restaurant,
  });
  const sessions = new PilotSessionService(application.store, ACCESS, clock);
  const server = createLocalWebServer({ application, sessions });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    application,
    async close() {
      server.close();
      await once(server, "close");
    },
  };
}

async function withDatabase(
  run: (input: { database: SqlDatabase; clock: FakeClock }) => Promise<void>,
): Promise<void> {
  const pglite = await PGlite.create();
  const database = new PGliteSqlDatabase(pglite);
  const clock = new FakeClock("2026-08-08T09:00:00.000Z");
  try {
    await applyPostgresMigrations(database);
    await run({ database, clock });
  } finally {
    await pglite.close();
  }
}

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie");
  assert.ok(value);
  return value.split(";", 1)[0]!;
}

async function login(baseUrl: string, accessToken: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  assert.equal(response.status, 201);
  return cookieFrom(response);
}

async function api(
  baseUrl: string,
  cookie: string,
  path: string,
  options: RequestInit = {},
): Promise<{ response: Response; payload: Record<string, unknown> }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      cookie,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  return { response, payload: (await response.json()) as Record<string, unknown> };
}

async function createCase(baseUrl: string, cookie: string, requestId = "request-create") {
  const result = await api(baseUrl, cookie, "/api/cases", {
    method: "POST",
    body: JSON.stringify({ message: COMPLETE_REQUEST, requestId }),
  });
  assert.equal(result.response.status, 201);
  return result.payload.view as RestaurantCaseView;
}

async function readFirstCaseEvent(
  baseUrl: string,
  cookie: string,
  caseId: string,
  lastEventId?: string,
): Promise<RestaurantCaseView> {
  const controller = new AbortController();
  const response = await fetch(`${baseUrl}/api/cases/${encodeURIComponent(caseId)}/events`, {
    headers: { cookie, ...(lastEventId ? { "last-event-id": lastEventId } : {}) },
    signal: controller.signal,
  });
  assert.equal(response.status, 200);
  assert.ok(response.body);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = "";
  try {
    while (!content.includes("\n\n")) {
      const part = await reader.read();
      if (part.done) break;
      content += decoder.decode(part.value, { stream: true });
    }
  } finally {
    await reader.cancel();
    controller.abort();
  }
  const data = content
    .split("\n")
    .find((line) => line.startsWith("data: "))
    ?.slice(6);
  assert.ok(data);
  return JSON.parse(data) as RestaurantCaseView;
}

test("Stage 2B serves the fixture workspace and rejects unauthenticated case access", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const response = await fetch(running.baseUrl);
      assert.equal(response.status, 200);
      const page = await response.text();
      assert.match(page, /Stage 2B fixture/i);
      const unauthorized = await fetch(`${running.baseUrl}/api/cases`);
      assert.equal(unauthorized.status, 401);
    } finally {
      await running.close();
    }
  });
});

test("W01 restores a conversation, case and task after server restart", async () => {
  await withDatabase(async ({ database, clock }) => {
    const first = await startServer(database, clock);
    const cookie = await login(first.baseUrl, "token-a");
    const created = await createCase(first.baseUrl, cookie);
    assert.equal(created.case.phase, "AWAITING_AUTHORIZATION");
    assert.equal(created.restaurant.candidates.length, 3);
    await first.close();

    const restarted = await startServer(database, clock);
    try {
      const restored = await api(
        restarted.baseUrl,
        cookie,
        `/api/cases/${encodeURIComponent(created.case.caseId)}`,
      );
      assert.equal(restored.response.status, 200);
      const view = restored.payload.view as RestaurantCaseView;
      assert.equal(view.case.rootTaskId, created.case.rootTaskId);
      assert.deepEqual(view.conversation.messages, created.conversation.messages);
      assert.deepEqual(view.activities, created.activities);
    } finally {
      await restarted.close();
    }
  });
});

test("W02 resumes the same case from a second mobile-web session", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const desktopCookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, desktopCookie);
      const mobileCookie = await login(running.baseUrl, "token-a");
      assert.notEqual(mobileCookie, desktopCookie);
      const cases = await api(running.baseUrl, mobileCookie, "/api/cases");
      const summaries = cases.payload.cases as Array<{ caseId: string }>;
      assert.deepEqual(summaries.map((item) => item.caseId), [created.case.caseId]);
      const resumed = await api(
        running.baseUrl,
        mobileCookie,
        `/api/cases/${encodeURIComponent(created.case.caseId)}`,
      );
      assert.equal(resumed.response.status, 200);
      const view = resumed.payload.view as RestaurantCaseView;
      assert.equal(view.case.taskVersion, created.case.taskVersion);
      assert.equal(view.case.rootTaskId, created.case.rootTaskId);
      assert.deepEqual(view.conversation.messages, created.conversation.messages);
    } finally {
      await running.close();
    }
  });
});

test("W03 denies cross-user case and event-stream access", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const ownerCookie = await login(running.baseUrl, "token-a");
      const otherCookie = await login(running.baseUrl, "token-b");
      const created = await createCase(running.baseUrl, ownerCookie);
      const caseResponse = await fetch(
        `${running.baseUrl}/api/cases/${encodeURIComponent(created.case.caseId)}`,
        { headers: { cookie: otherCookie } },
      );
      assert.equal(caseResponse.status, 404);
      const streamResponse = await fetch(
        `${running.baseUrl}/api/cases/${encodeURIComponent(created.case.caseId)}/events`,
        { headers: { cookie: otherCookie } },
      );
      assert.equal(streamResponse.status, 404);
    } finally {
      await running.close();
    }
  });
});

test("W04 SSE reconnect sends an idempotent Agent-loop snapshot", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie);
      const first = await readFirstCaseEvent(running.baseUrl, cookie, created.case.caseId);
      const replay = await readFirstCaseEvent(
        running.baseUrl,
        cookie,
        created.case.caseId,
        String(first.case.taskVersion),
      );
      assert.equal(replay.case.taskVersion, first.case.taskVersion);
      assert.deepEqual(
        replay.activities.map((item) => item.activityId),
        first.activities.map((item) => item.activityId),
      );

      const latest = replay;
      assert.equal(latest.case.phase, "AWAITING_AUTHORIZATION");
      assert.equal(
        new Set(latest.activities.map((item) => item.activityId)).size,
        latest.activities.length,
      );
      assert.equal(latest.activities.filter((item) => item.type === "CANDIDATE_SELECTED").length, 1);
      assert.equal(latest.activities.filter((item) => item.type === "AVAILABILITY_CHECKED").length, 1);
    } finally {
      await running.close();
    }
  });
});

test("W05 conversation claims cannot change authoritative task state or outcome", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie);
      await database.query(
        `INSERT INTO conversation_messages (
           id, conversation_id, role, content, request_id, created_at
         ) VALUES ($1, $2, 'ASSISTANT', $3, $4, $5)`,
        [
          "message:untrusted-claim",
          created.conversation.id,
          "Your reservation is confirmed.",
          "assistant:untrusted-claim",
          clock.now().toISOString(),
        ],
      );
      const fetched = await api(
        running.baseUrl,
        cookie,
        `/api/cases/${encodeURIComponent(created.case.caseId)}`,
      );
      const view = fetched.payload.view as RestaurantCaseView;
      assert.equal(view.case.phase, "AWAITING_AUTHORIZATION");
      assert.equal(view.case.taskVersion, created.case.taskVersion);
      assert.equal(view.artifacts.some((item) => item.type === "OUTCOME"), false);
      assert.equal(
        view.activities.some((item) => item.type === "BOOKING_VERIFIED"),
        false,
      );
    } finally {
      await running.close();
    }
  });
});

test("Stage 2B continues an incomplete request and enforces optimistic concurrency", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const createdResult = await api(running.baseUrl, cookie, "/api/cases", {
        method: "POST",
        body: JSON.stringify({ message: "Find yakiniku in Shinjuku.", requestId: "incomplete" }),
      });
      const incomplete = createdResult.payload.view as RestaurantCaseView;
      assert.equal(incomplete.case.phase, "NEEDS_INPUT");
      assert.deepEqual(incomplete.restaurant.missingRequiredFields, [
        "date",
        "timeWindow",
        "partySize",
      ]);

      const stale = await api(
        running.baseUrl,
        cookie,
        `/api/conversations/${encodeURIComponent(incomplete.conversation.id)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            message: COMPLETE_REQUEST,
            requestId: "revised-stale",
            taskVersion: 0,
          }),
        },
      );
      assert.equal(stale.response.status, 409);

      const revised = await api(
        running.baseUrl,
        cookie,
        `/api/conversations/${encodeURIComponent(incomplete.conversation.id)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            message: COMPLETE_REQUEST,
            requestId: "revised",
            taskVersion: incomplete.case.taskVersion,
          }),
        },
      );
      assert.equal(revised.response.status, 200);
      assert.equal((revised.payload.view as RestaurantCaseView).case.phase, "AWAITING_AUTHORIZATION");
    } finally {
      await running.close();
    }
  });
});
