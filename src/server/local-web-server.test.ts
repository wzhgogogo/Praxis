import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { PGlite, type Results, type Transaction } from "@electric-sql/pglite";

import type { RestaurantCaseView } from "../application/agent-workspace.js";
import {
  PersistentRestaurantAgentApplication,
  PilotSessionService,
  type PilotAccessEntry,
} from "../application/persistent-restaurant-agent.js";
import type { RestaurantAvailabilityPort, RestaurantCandidateFactPort, RestaurantSearchPort } from "../application/restaurant-execution-router.js";
import { RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION } from "../eval/restaurant/agent-loop/diagnostic-evaluator.js";
import { FakeClock } from "../harness/fake-clock.js";
import { RestaurantSemanticInterpreter } from "../domains/restaurant/semantic-interpreter.js";
import { RestaurantAgentDecision, ScriptedRestaurantAgentDecisionPort, type RestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import type { RestaurantSemanticInterpreterPort, RestaurantPartySizeSupplementResolverPort } from "../application/restaurant-message-handler.js";
import type { RestaurantPartySizeSupplementResult } from "../domains/restaurant/party-size-supplement-resolver.js";
import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import { FixtureModelGateway } from "../infrastructure/fixture/fixture-model-gateway.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import { ModelGatewayError } from "../core/model/errors.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";
import type { RestaurantAvailabilityRequest, RestaurantCandidate, RestaurantCandidateFactRequest, RestaurantReadEvidence, RestaurantSearchRequest } from "../domains/restaurant/contracts.js";
import { applyPostgresMigrations } from "../infrastructure/postgres/migrations.js";
import type {
  SqlDatabase,
  SqlExecutor,
  SqlQueryResult,
} from "../infrastructure/postgres/sql-database.js";
import { assertLocalLiveReadEnvironment, createLocalWebServer, localPostgresConnectionString, localRestaurantProviderMode } from "./local-web-server.js";

const COMPLETE_REQUEST =
  "Tonight at 7pm near Shinjuku for two, yakiniku, around 5000 yen each.";
const COMPLETE_NEARBY_REQUEST =
  "Tonight at 7pm nearby for two, yakiniku, around 5000 yen each.";
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

interface StartServerOptions {
  mode?: "FIXTURE" | "LIVE_READ";
  restaurant?: RestaurantSearchPort & RestaurantAvailabilityPort & RestaurantCandidateFactPort;
  model?: ModelGateway;
  artifactDirectory?: string;
  liveReadLimits?: Readonly<Record<string, number>>;
  semanticInterpreter?: RestaurantSemanticInterpreterPort;
  partySizeSupplementResolver?: RestaurantPartySizeSupplementResolverPort;
  agentDecision?: RestaurantAgentDecisionPort;
}

async function startServer(database: SqlDatabase, clock: FakeClock, options: StartServerOptions = {}): Promise<TestServer> {
  const model = options.model ?? new FixtureModelGateway();
  const restaurant = options.restaurant ?? new FixtureRestaurantSearch();
  const application = new PersistentRestaurantAgentApplication({
    database,
    clock,
    semanticInterpreter: options.semanticInterpreter ?? new RestaurantSemanticInterpreter(model),
    ...(options.partySizeSupplementResolver ? { partySizeSupplementResolver: options.partySizeSupplementResolver } : {}),
    agentDecision: options.agentDecision ?? new RestaurantAgentDecision(model),
    restaurantSearch: restaurant,
    restaurantAvailability: restaurant,
    restaurantFacts: restaurant,
    ...(options.liveReadLimits ? { liveReadLimits: options.liveReadLimits } : {}),
    ...(options.mode ? { workspaceMode: options.mode } : {}),
  });
  const sessions = new PilotSessionService(application.store, ACCESS, clock);
  const server = createLocalWebServer({
    application,
    sessions,
    ...(options.artifactDirectory ? { artifactDirectory: options.artifactDirectory } : {}),
  });
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

class SemanticModelFailure implements ModelGateway {
  complete(_request: ModelRequest): Promise<ModelResponse> {
    return Promise.reject(new ModelGatewayError("Injected semantic transport failure", "NETWORK", true));
  }
}

class MeteredGoogleFixtureRestaurantSearch implements RestaurantSearchPort, RestaurantAvailabilityPort, RestaurantCandidateFactPort {
  readonly executionRoute = "STRUCTURED_ADAPTER" as const;
  private readonly fixture = new FixtureRestaurantSearch();

  async search(request: RestaurantSearchRequest, signal: AbortSignal) {
    const read = await this.fixture.search(request, signal);
    return {
      ...read,
      metadata: {
        ...read.metadata,
        provider: "GOOGLE_PLACES" as const,
        googleRequests: { limit: 100, total: 4, namedPlaceResolution: 1, discovery: 2, placeDetails: 1 },
      },
    };
  }

  check(...arguments_: Parameters<FixtureRestaurantSearch["check"]>) {
    return this.fixture.check(...arguments_);
  }

  inspectFacts(...arguments_: Parameters<FixtureRestaurantSearch["inspectFacts"]>) {
    return this.fixture.inspectFacts(...arguments_);
  }
}

class BlockingRestaurantSearch extends FixtureRestaurantSearch {
  private resolveStarted?: () => void;
  readonly started = new Promise<void>((resolve) => { this.resolveStarted = resolve; });

  override async search(_request: RestaurantSearchRequest, signal: AbortSignal) {
    this.resolveStarted?.();
    return new Promise<never>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason ?? new Error("aborted")), { once: true });
    });
  }
}

class SearchThenBlockRestaurantSearch extends FixtureRestaurantSearch {
  private releaseSearch?: () => void;
  private startCheck?: () => void;
  readonly searchGate = new Promise<void>((resolve) => { this.releaseSearch = resolve; });
  readonly checking = new Promise<void>((resolve) => { this.startCheck = resolve; });

  allowSearch(): void { this.releaseSearch?.(); }

  override async search(request: RestaurantSearchRequest, signal: AbortSignal) {
    await this.searchGate;
    return super.search(request, signal);
  }

  override async check(_request: RestaurantAvailabilityRequest, signal: AbortSignal) {
    this.startCheck?.();
    return new Promise<never>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason ?? new Error("aborted")), { once: true });
    });
  }
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

async function createCase(baseUrl: string, cookie: string, requestId = "request-create", message = COMPLETE_REQUEST) {
  const result = await api(baseUrl, cookie, "/api/cases", {
    method: "POST",
    body: JSON.stringify({ message, requestId }),
  });
  assert.equal(result.response.status, 201);
  return result.payload.view as RestaurantCaseView;
}

async function withinTestTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), 1_000);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function availabilityProposal(partySize?: number): RestaurantSemanticProposal {
  return {
    schemaVersion: "3",
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "find a table" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-09", raw: "tomorrow" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7pm" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shibuya" } },
      ...(partySize === undefined ? [] : [{ field: "PARTY_SIZE" as const, operation: "ASSERT" as const, value: { kind: "PARTY_SIZE" as const, value: partySize, source: "EXPLICIT" as const } }]),
    ],
  };
}

class MessageProposalInterpreter implements RestaurantSemanticInterpreterPort {
  async interpret(input: { message: string }): ReturnType<RestaurantSemanticInterpreterPort["interpret"]> {
    const proposal = input.message === "recommendation"
      ? { schemaVersion: "3" as const, facts: [{ field: "TARGET" as const, operation: "ASSERT" as const, value: { kind: "TARGET" as const, goal: "RECOMMENDATION" as const, query: "recommend a cafe" } }] }
      : input.message === "explicit" ? availabilityProposal(4) : availabilityProposal();
    return { status: "PROPOSED", proposal, attempts: [] };
  }
}

class MessagePartySupplementResolver implements RestaurantPartySizeSupplementResolverPort {
  readonly messages: string[] = [];
  constructor(
    private readonly resultFor: (message: string) => RestaurantPartySizeSupplementResult | Promise<RestaurantPartySizeSupplementResult>,
  ) {}

  async resolve(input: { message: string }): Promise<RestaurantPartySizeSupplementResult> {
    this.messages.push(input.message);
    return this.resultFor(input.message);
  }
}

function askForPartyDecision(count: number): RestaurantAgentDecisionPort {
  return new ScriptedRestaurantAgentDecisionPort(
    Array.from({ length: count }, () => ({ type: "ASK_USER" as const, question: "Please provide the party size.", relatedFields: ["partySize"] })),
  );
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

async function nextCaseEvent(reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder): Promise<RestaurantCaseView> {
  let content = "";
  while (!content.includes("\n\n")) {
    const part = await reader.read();
    if (part.done) throw new Error("SSE stream ended before the next case event");
    content += decoder.decode(part.value, { stream: true });
  }
  const data = content
    .split("\n")
    .find((line) => line.startsWith("data: "))
    ?.slice(6);
  assert.ok(data);
  return JSON.parse(data) as RestaurantCaseView;
}

function strictFixtureAction(type: "SEARCH_RESTAURANTS" | "INVESTIGATE_CANDIDATE_FACTS" | "PRESENT_RESULTS", candidateIds: string[] = []): ModelResponse {
  return {
    invocationId: `selection-model:${type}:${candidateIds.join(",")}`,
    provider: "FIXTURE", model: "selection-session-fixture",
    outputText: JSON.stringify({ type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "controlled selection-session route" }),
    finishReason: "TOOL_CALLS", latencyMs: 0,
  };
}

function selectionSessionFixture(
  calls: { search: number; facts: number; availability: number },
  paginated = false,
  initiallyUnverifiedCandidateIds: readonly string[] = [],
): RestaurantSearchPort & RestaurantAvailabilityPort & RestaurantCandidateFactPort {
  const candidates: RestaurantCandidate[] = ["a", "b", "c", "d", "e", "f"].map((id) => ({
    restaurant: { id, outletName: `Session Restaurant ${id.toUpperCase()}`, address: "Shinjuku, Tokyo", sourceIds: { googlePlaces: `place-${id}` }, provenance: {} },
    matchReasons: ["fixture"], warnings: [], executionConfidence: "HIGH",
  }));
  const evidence: RestaurantReadEvidence[] = candidates.flatMap((candidate) => {
    const id = candidate.restaurant.id;
    const sourceEntityId = candidate.restaurant.sourceIds.googlePlaces!;
    return [
      { evidenceId: `area:${id}`, kind: "DISCOVERY" as const, provider: "GOOGLE_PLACES" as const, candidateId: id, sourceEntityId, observedAt: "2026-08-08T09:00:00.000Z", requestFingerprint: "session", claims: { areaQuery: "Shinjuku", areaMatch: true } },
      { evidenceId: `identity:${id}`, kind: "ENTITY_MATCH" as const, provider: "GOOGLE_PLACES" as const, candidateId: id, sourceEntityId, observedAt: "2026-08-08T09:00:00.000Z", requestFingerprint: "session", claims: {}, entityMatch: { confidence: "HIGH" as const, matchedBy: ["FIXTURE"] } },
      { evidenceId: `fact:${id}`, kind: "RESTAURANT_FACT" as const, provider: "GOOGLE_PLACES" as const, candidateId: id, sourceEntityId, observedAt: "2026-08-08T09:00:00.000Z", requestFingerprint: "session", claims: {} },
    ];
  });
  return {
    executionRoute: "STRUCTURED_ADAPTER" as const,
    async search(request: RestaurantSearchRequest) {
      calls.search += 1;
      const continuation = request.continuation;
      const selected = paginated ? (continuation ? candidates.slice(3) : candidates.slice(0, 3)) : candidates;
      const selectedIds = new Set(selected.map((candidate) => candidate.restaurant.id));
      return {
        candidates: selected,
        evidence: evidence.filter((item) => selectedIds.has(item.candidateId ?? "")
          && (Boolean(continuation)
            || item.kind !== "RESTAURANT_FACT"
            || !initiallyUnverifiedCandidateIds.includes(item.candidateId ?? ""))),
        continuation: {
          intentFingerprint: JSON.stringify(request.intent),
          ...(paginated && !continuation ? { nextPageToken: "fixture:page-2" } : {}),
          usedPageTokens: continuation ? ["fixture:page-2"] : [],
          pagesRead: continuation ? 2 : 1,
          exhausted: !paginated || Boolean(continuation),
        },
        metadata: { provider: "FIXTURE" as const, route: "STRUCTURED_ADAPTER" as const, latencyMs: 0 },
      };
    },
    async check() { calls.availability += 1; return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE" as const, route: "STRUCTURED_ADAPTER" as const, latencyMs: 0 } }; },
    async inspectFacts(request: RestaurantCandidateFactRequest) {
      calls.facts += 1;
      const requestedIds = new Set(request.candidateIds);
      const factEvidence = evidence.filter((item) => item.kind === "RESTAURANT_FACT" && requestedIds.has(item.candidateId ?? ""));
      return {
        evidence: factEvidence,
        factChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, {
          status: "COMPLETED" as const,
          checkedAt: "2026-08-08T09:00:00.000Z",
          evidenceIds: factEvidence.filter((item) => item.candidateId === candidateId).map((item) => item.evidenceId),
          sourceProvider: "GOOGLE_PLACES" as const,
        }])),
        metadata: { provider: "FIXTURE" as const, route: "STRUCTURED_ADAPTER" as const, latencyMs: 0 },
      };
    },
  };
}

function selectionSessionModel(calls: { model: number }, supportsConditionRevision = false): ModelGateway {
  return {
    async complete(request) {
      calls.model += 1;
      if (request.purpose === "restaurant_semantic_interpret") {
        const userMessage = request.messages.find((message) => message.role === "user")?.content ?? "";
        if (supportsConditionRevision && userMessage.includes("Make it four on 2026-09-19")) {
          return {
            invocationId: `selection-semantic-revision:${calls.model}`, provider: "FIXTURE", model: "selection-session-fixture",
            outputText: JSON.stringify({ schemaVersion: "3", facts: [
              { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 4 } },
              { field: "DATE", operation: "CORRECT", value: { kind: "DATE", value: "2026-09-19", raw: "2026-09-19" } },
            ] }), finishReason: "TOOL_CALLS", latencyMs: 0,
          };
        }
        return {
          invocationId: `selection-semantic:${calls.model}`, provider: "FIXTURE", model: "selection-session-fixture",
          outputText: JSON.stringify({ schemaVersion: "3", facts: [
            { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "restaurants", selectionScope: "OPEN_ENDED" } },
            { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shinjuku" } },
          ] }), finishReason: "TOOL_CALLS", latencyMs: 0,
        };
      }
      const context = JSON.parse(request.messages.find((message) => message.role === "user")!.content).context as {
        candidates: Array<{ id: string }>;
        presentation: Array<{ candidateId: string; eligible: boolean }>;
        resultBatchTarget?: { candidateCount: number };
        legalActions: { investigateCandidateFacts: string[]; presentResults: string[] };
      };
      return context.candidates.length === 0
        ? strictFixtureAction("SEARCH_RESTAURANTS")
        : context.resultBatchTarget && context.legalActions.presentResults.length < context.resultBatchTarget.candidateCount
          ? context.legalActions.investigateCandidateFacts.length > 0
            ? strictFixtureAction("INVESTIGATE_CANDIDATE_FACTS", context.legalActions.investigateCandidateFacts.slice(0, 3))
            : strictFixtureAction("SEARCH_RESTAURANTS")
          : strictFixtureAction("PRESENT_RESULTS", context.legalActions.presentResults.slice(0, context.resultBatchTarget?.candidateCount ?? 3));
    },
  };
}

test("Stage 2B serves the fixture workspace and rejects unauthenticated case access", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const response = await fetch(running.baseUrl);
      assert.equal(response.status, 200);
      const page = await response.text();
      assert.match(page, /Fixture only/i);
      const unauthorized = await fetch(`${running.baseUrl}/api/cases`);
      assert.equal(unauthorized.status, 401);
    } finally {
      await running.close();
    }
  });
});

test("H002 persistent Runtime preserves explicit or inferred party size and safely asks when the supplement is unknown or fails", async () => {
  await withDatabase(async ({ database, clock }) => {
    const resolver = new MessagePartySupplementResolver((message) => {
      if (message === "relational") {
        return {
          status: "RESOLVED",
          partySize: 3,
          attempts: [{ invocationId: "supplement-relational", provider: "FIXTURE", model: "fixture", purpose: "restaurant_party_size_supplement", promptVersion: "v2", outputSchema: { name: "restaurant-party-size-supplement", version: "2" }, finishReason: "TOOL_CALLS", latencyMs: 0 }],
        };
      }
      if (message === "unknown") {
        return {
          status: "UNKNOWN",
          attempts: [{ invocationId: "supplement-unknown", provider: "FIXTURE", model: "fixture", purpose: "restaurant_party_size_supplement", promptVersion: "v2", outputSchema: { name: "restaurant-party-size-supplement", version: "2" }, finishReason: "TOOL_CALLS", latencyMs: 0 }],
        };
      }
      return { status: "MODEL_FAILURE", errorCode: "NETWORK", retryable: false, attempts: [] };
    });
    const running = await startServer(database, clock, {
      semanticInterpreter: new MessageProposalInterpreter(),
      partySizeSupplementResolver: resolver,
      agentDecision: askForPartyDecision(6),
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const explicit = await createCase(running.baseUrl, cookie, "h002-explicit", "explicit");
      assert.equal(explicit.restaurant.intentDraft?.partySize, 4);
      assert.equal(explicit.restaurant.intentDraft?.partySizeSource, "EXPLICIT");
      assert.deepEqual(resolver.messages, [], "T1 primary explicit party must not call the supplement");

      const relational = await createCase(running.baseUrl, cookie, "h002-relational", "relational");
      assert.equal(relational.restaurant.intentDraft?.partySize, 3);
      assert.equal(relational.restaurant.intentDraft?.partySizeSource, "INFERRED_CLOSED_PARTY");
      assert.deepEqual(resolver.messages, ["relational"], "T2 closed-party result is applied once by the real Runtime");

      const unknown = await createCase(running.baseUrl, cookie, "h002-unknown", "unknown");
      assert.equal(unknown.case.phase, "NEEDS_INPUT");
      assert.equal(unknown.restaurant.intentDraft?.partySize, undefined);
      assert.ok(unknown.restaurant.missingRequiredFields.includes("partySize"), "T4 UNKNOWN remains a user-input requirement");

      const failed = await createCase(running.baseUrl, cookie, "h002-failed", "failure");
      assert.equal(failed.case.phase, "NEEDS_INPUT");
      assert.equal(failed.restaurant.intentDraft?.partySize, undefined);
      assert.ok(failed.restaurant.missingRequiredFields.includes("partySize"), "T5 model failure must not invent a party size");

      const revised = await api(running.baseUrl, cookie, `/api/conversations/${encodeURIComponent(explicit.conversation.id)}/messages`, {
        method: "POST",
        body: JSON.stringify({ requestId: "h002-existing-party", taskVersion: explicit.case.taskVersion, message: "keep party" }),
      });
      assert.equal(revised.response.status, 200, String(revised.payload.error));
      const revisedView = revised.payload.view as RestaurantCaseView;
      assert.equal(revisedView.restaurant.intentDraft?.partySize, 4, "a later omitted party must not overwrite the current Draft");
      assert.deepEqual(resolver.messages, ["relational", "unknown", "failure"], "existing party suppresses a second supplement invocation");

      const recommendation = await createCase(running.baseUrl, cookie, "h002-recommendation", "recommendation");
      assert.equal(recommendation.restaurant.intentDraft?.target?.goal, "RECOMMENDATION");
      assert.deepEqual(resolver.messages, ["relational", "unknown", "failure"], "T6 recommendation requests never invoke party supplementation");
    } finally {
      await running.close();
    }
  });
});

test("H002 persistent duplicate message delivery invokes the supplement once; completed retries and refresh do not invoke it", async () => {
  await withDatabase(async ({ database, clock }) => {
    let release: (() => void) | undefined;
    let started: (() => void) | undefined;
    let secondResolverCall: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const entered = new Promise<void>((resolve) => { started = resolve; });
    const secondCall = new Promise<void>((resolve) => { secondResolverCall = resolve; });
    let relationalCalls = 0;
    const resolver = new MessagePartySupplementResolver(async (message) => {
      if (message === "initial") {
        return {
          status: "UNKNOWN",
          attempts: [{ invocationId: "supplement-initial", provider: "FIXTURE", model: "fixture", purpose: "restaurant_party_size_supplement", promptVersion: "v2", outputSchema: { name: "restaurant-party-size-supplement", version: "2" }, finishReason: "TOOL_CALLS", latencyMs: 0 }],
        };
      }
      relationalCalls += 1;
      if (relationalCalls === 1) {
        started?.();
        await gate;
      } else {
        secondResolverCall?.();
      }
      return {
        status: "RESOLVED",
        partySize: 2,
        attempts: [{ invocationId: "supplement-duplicate", provider: "FIXTURE", model: "fixture", purpose: "restaurant_party_size_supplement", promptVersion: "v2", outputSchema: { name: "restaurant-party-size-supplement", version: "2" }, finishReason: "TOOL_CALLS", latencyMs: 0 }],
      };
    });
    const running = await startServer(database, clock, {
      semanticInterpreter: new MessageProposalInterpreter(),
      partySizeSupplementResolver: resolver,
      agentDecision: askForPartyDecision(1),
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const initial = await createCase(running.baseUrl, cookie, "h002-duplicate-create", "initial");
      assert.equal(initial.case.phase, "NEEDS_INPUT");
      const inFlight = (running.application as unknown as { applyingUserMessages: Map<string, Promise<unknown>> }).applyingUserMessages;
      const originalGet = inFlight.get.bind(inFlight);
      let secondJoinedGuard: (() => void) | undefined;
      const joinedGuard = new Promise<void>((resolve) => { secondJoinedGuard = resolve; });
      inFlight.get = ((key: string) => {
        const pending = originalGet(key);
        if (!pending) return pending;
        return new Proxy(pending, {
          get(target, property) {
            if (property === "then") {
              return (...arguments_: Parameters<Promise<unknown>["then"]>) => {
                secondJoinedGuard?.();
                return target.then(...arguments_);
              };
            }
            const value = Reflect.get(target, property, target);
            return typeof value === "function" ? value.bind(target) : value;
          },
        });
      }) as typeof inFlight.get;
      // Dispatch both deliveries before either reaches the resolver. The
      // guarded second Promise marks itself only if submitMessage actually
      // awaits the already-registered work; a bypass instead reaches the
      // resolver and is independently observable below.
      const first = running.application.submitMessage({
        userId: "user-a", conversationId: initial.conversation.id, message: "relational", requestId: "h002-duplicate-submit", expectedVersion: initial.case.taskVersion,
      });
      const duplicate = running.application.submitMessage({
        userId: "user-a", conversationId: initial.conversation.id, message: "relational", requestId: "h002-duplicate-submit", expectedVersion: initial.case.taskVersion,
      });
      await withinTestTimeout(entered, "one simultaneous duplicate submission to enter the supplement");
      const path = await withinTestTimeout(
        Promise.race([
          joinedGuard.then(() => "JOINED_GUARD" as const),
          secondCall.then(() => "SECOND_RESOLVER_CALL" as const),
        ]),
        "the second duplicate submission to join the guard or enter the resolver",
      );
      inFlight.get = originalGet as typeof inFlight.get;
      release?.();
      const settled = await Promise.allSettled([first, duplicate]);
      assert.equal(path, "JOINED_GUARD", "a second resolver call proves duplicate delivery escaped the in-flight guard");
      assert.ok(settled.every((result) => result.status === "fulfilled"), "both duplicate deliveries must resolve from the one durable event");
      const firstView = settled[0].status === "fulfilled" ? settled[0].value : undefined;
      assert.deepEqual(resolver.messages, ["initial", "relational"], "concurrent delivery shares one in-flight supplement");
      assert.equal(firstView?.restaurant.intentDraft?.partySize, 2);
      await running.application.submitMessage({
        userId: "user-a", conversationId: initial.conversation.id, message: "relational", requestId: "h002-duplicate-submit", expectedVersion: firstView!.case.taskVersion,
      });
      assert.deepEqual(resolver.messages, ["initial", "relational"], "a completed message retry is idempotent");
      const persisted = await running.application.getCase("user-a", initial.case.caseId);
      assert.equal(persisted.restaurant.intentDraft?.partySize, 2, "the persisted replay result remains authoritative");
    } finally {
      await running.close();
    }

    const refreshResolver = new MessagePartySupplementResolver(() => ({
      status: "MODEL_FAILURE", errorCode: "NETWORK", retryable: false, attempts: [],
    }));
    const refreshCalls = { model: 0, search: 0, facts: 0, availability: 0 };
    const refreshServer = await startServer(database, clock, {
      partySizeSupplementResolver: refreshResolver,
      restaurant: selectionSessionFixture(refreshCalls),
      model: selectionSessionModel(refreshCalls),
    });
    try {
      const cookie = await login(refreshServer.baseUrl, "token-a");
      const created = await createCase(refreshServer.baseUrl, cookie, "h002-refresh", "Recommend restaurants in Shinjuku.");
      assert.equal(refreshResolver.messages.length, 0, "a recommendation request suppresses supplementation");
      assert.equal(created.case.phase, "PRESENT_RESULTS");
      const refreshed = await api(refreshServer.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}/refresh`, {
        method: "POST",
        body: JSON.stringify({ requestId: "h002-refresh-action", taskVersion: created.case.taskVersion }),
      });
      assert.equal(refreshed.response.status, 200, String(refreshed.payload.error));
      assert.equal(refreshResolver.messages.length, 0, "availability refresh never re-interprets or supplements the original request");
    } finally {
      await refreshServer.close();
    }
  });
});

test("selection-session browse and shortlist use the persistent Web entry without new model or source work", async () => {
  await withDatabase(async ({ database, clock }) => {
    const calls = { model: 0, search: 0, facts: 0, availability: 0 };
    const running = await startServer(database, clock, { restaurant: selectionSessionFixture(calls), model: selectionSessionModel(calls) });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie, "selection-session", "Recommend restaurants in Shinjuku.");
      assert.equal(created.case.phase, "PRESENT_RESULTS");
      assert.deepEqual(created.restaurant.presentedCandidateIds, ["a", "b", "c"]);
      assert.deepEqual(created.restaurant.resultBatchTarget, { candidateCount: 3, met: true });
      assert.deepEqual(calls, { model: 3, search: 1, facts: 0, availability: 0 });
      const viewed = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}/browse-next`, {
        method: "POST", body: JSON.stringify({ requestId: "view-first", taskVersion: created.case.taskVersion }),
      });
      assert.equal(viewed.response.status, 200, String(viewed.payload.error));
      const viewedCase = viewed.payload.view as RestaurantCaseView;
      assert.deepEqual(viewedCase.restaurant.viewedCandidateIds, ["a"]);
      assert.equal(viewedCase.activities.at(-1)?.type, "RESULT_VIEWED");
      const shortlisted = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}/shortlist`, {
        method: "POST", body: JSON.stringify({ requestId: "shortlist-first", taskVersion: viewedCase.case.taskVersion, candidateId: "a", shortlisted: true }),
      });
      assert.equal(shortlisted.response.status, 200, String(shortlisted.payload.error));
      const shortlistCase = shortlisted.payload.view as RestaurantCaseView;
      assert.deepEqual(shortlistCase.restaurant.shortlistCandidateIds, ["a"]);
      const feedback = await api(running.baseUrl, cookie, `/api/conversations/${encodeURIComponent(created.conversation.id)}/messages`, {
        method: "POST", body: JSON.stringify({ requestId: "price-feedback", taskVersion: shortlistCase.case.taskVersion, message: "These are too expensive" }),
      });
      assert.equal(feedback.response.status, 200, String(feedback.payload.error));
      const feedbackCase = feedback.payload.view as RestaurantCaseView;
      assert.deepEqual(feedbackCase.restaurant.selectionFeedback, ["These are too expensive"]);
      assert.equal(feedbackCase.activities.at(-1)?.type, "SELECTION_FEEDBACK_RECORDED");
      const another = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}/another-batch`, {
        method: "POST", body: JSON.stringify({ requestId: "another-batch", taskVersion: feedbackCase.case.taskVersion }),
      });
      assert.equal(another.response.status, 200, String(another.payload.error));
      const anotherCase = another.payload.view as RestaurantCaseView;
      assert.deepEqual(anotherCase.restaurant.presentedCandidateIds, ["d", "e", "f"]);
      assert.deepEqual(anotherCase.restaurant.shortlistCandidateIds, ["a"]);
      const viaNaturalMessage = await api(running.baseUrl, cookie, `/api/conversations/${encodeURIComponent(created.conversation.id)}/messages`, {
        method: "POST", body: JSON.stringify({ requestId: "view-second-natural", taskVersion: anotherCase.case.taskVersion, message: "next" }),
      });
      assert.equal(viaNaturalMessage.response.status, 200, String(viaNaturalMessage.payload.error));
      assert.deepEqual((viaNaturalMessage.payload.view as RestaurantCaseView).restaurant.viewedCandidateIds, ["a", "d"]);
      assert.deepEqual(calls, { model: 3, search: 1, facts: 0, availability: 0 });
    } finally { await running.close(); }
  });
});

test("selection-session fills an open-ended result target with candidate fact reads before presenting", async () => {
  await withDatabase(async ({ database, clock }) => {
    const calls = { model: 0, search: 0, facts: 0, availability: 0 };
    const running = await startServer(database, clock, {
      restaurant: selectionSessionFixture(calls, false, ["b", "c", "d", "e", "f"]),
      model: selectionSessionModel(calls),
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie, "selection-fact-replenishment", "Recommend restaurants in Shinjuku.");
      assert.equal(created.case.phase, "PRESENT_RESULTS");
      assert.deepEqual(calls, { model: 4, search: 1, facts: 1, availability: 0 });
      assert.deepEqual(created.restaurant.presentedCandidateIds, ["a", "b", "c"]);
      assert.deepEqual(created.restaurant.resultBatchTarget, { candidateCount: 3, met: true });
      assert.equal(created.activities.some((activity) => activity.type === "CANDIDATE_FACTS_CHECKED"), true);
      assert.equal(created.activities.filter((activity) => activity.type === "SEARCH_COMPLETED").length, 1);
    } finally { await running.close(); }
  });
});

test("selection-session replenishes an inadequate same-condition pool through its durable cursor", async () => {
  await withDatabase(async ({ database, clock }) => {
    const calls = { model: 0, search: 0, facts: 0, availability: 0 };
    const running = await startServer(database, clock, { restaurant: selectionSessionFixture(calls, true), model: selectionSessionModel(calls) });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie, "selection-replenishment", "Recommend restaurants in Shinjuku.");
      assert.deepEqual(created.restaurant.presentedCandidateIds, ["a", "b", "c"]);
      const another = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}/another-batch`, {
        method: "POST", body: JSON.stringify({ requestId: "replenish-batch", taskVersion: created.case.taskVersion }),
      });
      assert.equal(another.response.status, 200, String(another.payload.error));
      const view = another.payload.view as RestaurantCaseView;
      assert.equal(view.case.phase, "PRESENT_RESULTS");
      assert.deepEqual(view.restaurant.presentedCandidateIds, ["d", "e", "f"]);
      assert.equal(view.activities.some((activity) => activity.type === "NEXT_BATCH_REPLENISHMENT_REQUESTED"), true);
      assert.deepEqual(calls, { model: 5, search: 2, facts: 0, availability: 0 });
    } finally { await running.close(); }
  });
});

test("selection-session condition revision preserves shortlist memory but performs a fresh authoritative read", async () => {
  await withDatabase(async ({ database, clock }) => {
    const calls = { model: 0, search: 0, facts: 0, availability: 0 };
    const running = await startServer(database, clock, { restaurant: selectionSessionFixture(calls), model: selectionSessionModel(calls, true) });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie, "selection-revision", "Recommend restaurants in Shinjuku.");
      const shortlist = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}/shortlist`, {
        method: "POST", body: JSON.stringify({ requestId: "revision-shortlist", taskVersion: created.case.taskVersion, candidateId: "a", shortlisted: true }),
      });
      const revised = await api(running.baseUrl, cookie, `/api/conversations/${encodeURIComponent(created.conversation.id)}/messages`, {
        method: "POST", body: JSON.stringify({ requestId: "revision-message", taskVersion: (shortlist.payload.view as RestaurantCaseView).case.taskVersion, message: "Make it four on 2026-09-19." }),
      });
      assert.equal(revised.response.status, 200, String(revised.payload.error));
      const view = revised.payload.view as RestaurantCaseView;
      assert.equal(view.restaurant.intentDraft?.partySize, 4);
      assert.equal(view.restaurant.intentDraft?.date, "2026-09-19");
      assert.deepEqual(view.restaurant.shortlistCandidateIds, ["a"]);
      assert.deepEqual(view.restaurant.presentedCandidateIds, ["a", "b", "c"]);
      assert.equal(view.activities.filter((activity) => activity.type === "SEARCH_COMPLETED").length, 2);
      assert.deepEqual(calls, { model: 6, search: 2, facts: 0, availability: 0 });
    } finally { await running.close(); }
  });
});

test("local workspace Live mode is explicit and never falls back to fixture on a misspelled provider mode", () => {
  assert.equal(localRestaurantProviderMode({}), "FIXTURE");
  assert.equal(localRestaurantProviderMode({ PRAXIS_RESTAURANT_PROVIDER_MODE: "LIVE_READ" }), "LIVE_READ");
  assert.throws(
    () => localRestaurantProviderMode({ PRAXIS_RESTAURANT_PROVIDER_MODE: "live" }),
    /FIXTURE or LIVE_READ/,
  );
});

test("local workspace Live mode rejects missing server-only gates and accepts LOCAL_CHROMIUM without Cloudflare credentials", () => {
  assert.throws(
    () => assertLocalLiveReadEnvironment({ PRAXIS_ALLOW_BROWSER_RUN: "1" }),
    /PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1/,
  );
  assert.throws(
    () => assertLocalLiveReadEnvironment({
      PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1", PRAXIS_ALLOW_BROWSER_RUN: "1",
      DEEPSEEK_API_KEY: "test", DEEPSEEK_MODEL: "test", GOOGLE_MAPS_API_KEY: "test", PRAXIS_BROWSER_ENGINE: "AUTO",
    }),
    /CLOUDFLARE_ACCOUNT_ID/,
  );
  assert.doesNotThrow(() => assertLocalLiveReadEnvironment({
    PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1", PRAXIS_ALLOW_BROWSER_RUN: "1",
    DEEPSEEK_API_KEY: "test", DEEPSEEK_MODEL: "test", GOOGLE_MAPS_API_KEY: "test", PRAXIS_BROWSER_ENGINE: "LOCAL_CHROMIUM",
  }));
});

test("local workspace rejects copied non-PostgreSQL URLs before migrations", () => {
  assert.throws(
    () => localPostgresConnectionString({ DATABASE_URL: "https://api.example.test" }),
    /must use postgresql/i,
  );
  assert.equal(
    localPostgresConnectionString({ DATABASE_URL: "postgresql://localhost:55432/praxis_web" }),
    "postgresql://localhost:55432/praxis_web",
  );
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

test("W06 Live read creates a recoverable active Case and cancellation reaches the in-flight provider", async () => {
  await withDatabase(async ({ database, clock }) => {
    const restaurant = new BlockingRestaurantSearch();
    const running = await startServer(database, clock, { mode: "LIVE_READ", restaurant });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie, "live-cancel");
      assert.equal(created.mode, "LIVE_READ");
      assert.equal(created.case.status, "ACTIVE");
      assert.equal(created.case.phase, "UNDERSTANDING");
      await restaurant.started;
      const stopped = await api(
        running.baseUrl,
        cookie,
        `/api/cases/${encodeURIComponent(created.case.caseId)}/run`,
        { method: "DELETE" },
      );
      assert.equal(stopped.response.status, 200);
      const view = stopped.payload.view as RestaurantCaseView;
      assert.equal(view.case.phase, "FAILED");
      assert.match(view.conversation.messages.at(-1)?.content ?? "", /cancelled/i);
      assert.equal(view.activities.at(-1)?.type, "AGENT_LOOP_TERMINATED");
    } finally {
      await running.close();
    }
  });
});

test("W08 ordinary Web cancellation writes an immutable execution artifact and independent evaluation", async () => {
  await withDatabase(async ({ database, clock }) => {
    const artifactDirectory = await mkdtemp(join(tmpdir(), "praxis-web-artifact-"));
    const restaurant = new BlockingRestaurantSearch();
    const fixture = new FixtureModelGateway();
    const running = await startServer(database, clock, {
      mode: "LIVE_READ",
      restaurant,
      artifactDirectory,
      model: { async complete(request) {
        const response = await fixture.complete(request);
        if (request.purpose !== "restaurant_semantic_interpret") return response;
        const proposal = JSON.parse(response.outputText);
        const time = proposal.facts.find((fact: {field: string}) => fact.field === "TIME_WINDOW");
        Object.assign(time.value, { earliest: "19:00", latest: "19:00", alternativeEarliest: "18:30", alternativeLatest: "19:30", alternativeRaw: "18:30 to 19:30 is acceptable" });
        return { ...response, outputText: JSON.stringify(proposal) };
      } },
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie, "web-artifact-cancel", COMPLETE_REQUEST + " 18:30 to 19:30 is acceptable.");
      await restaurant.started;
      const stopped = await api(
        running.baseUrl,
        cookie,
        `/api/cases/${encodeURIComponent(created.case.caseId)}/run`,
        { method: "DELETE" },
      );
      assert.equal(stopped.response.status, 200);
      const files = await readdir(artifactDirectory);
      const resultName = files.find((file) => file.endsWith(".result.json"));
      const evaluationName = files.find((file) => file.includes(".evaluation."));
      assert.ok(resultName, "ordinary Web must persist a finished execution result");
      assert.ok(evaluationName, "ordinary Web must run the existing independent evaluator");
      const result = JSON.parse(await readFile(join(artifactDirectory, resultName), "utf8")) as Record<string, unknown>;
      const evaluation = JSON.parse(await readFile(join(artifactDirectory, evaluationName), "utf8")) as Record<string, unknown>;
      assert.equal(result.mode, "WEB_READ");
      assert.equal(result.status, "CANCELLED");
      const semantic = (result.materializedCase as {semantic: Record<string, unknown>}).semantic;
      assert.equal(semantic.party_size_source, "EXPLICIT");
      const partySourceEvent = (result.events as Array<{ event: Record<string, unknown> }>).find((item) => item.event.type === "SEMANTIC_PROPOSAL_COMPILED");
      assert.equal(partySourceEvent?.event.partySizeSourceMessageRequestId, "user:web-artifact-cancel");
      assert.deepEqual(semantic.time, {value: "19:00"});
      assert.deepEqual(semantic.permittedAlternativeTimeWindow, {earliest: "18:30", latest: "19:30"});
      assert.equal(evaluation.evaluatorVersion, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION);
      assert.equal((evaluation.execution as { status?: string }).status, "CANCELLED");
    } finally {
      await running.close();
    }
  });
});

test("W10 ordinary Web persists a semantic-model failure as a failed case and artifact", async () => {
  await withDatabase(async ({ database, clock }) => {
    const artifactDirectory = await mkdtemp(join(tmpdir(), "praxis-web-semantic-failure-"));
    const running = await startServer(database, clock, {
      mode: "LIVE_READ",
      model: new SemanticModelFailure(),
      artifactDirectory,
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const result = await api(running.baseUrl, cookie, "/api/cases", {
        method: "POST",
        body: JSON.stringify({ message: COMPLETE_REQUEST, requestId: "semantic-model-failure" }),
      });
      assert.equal(result.response.status, 201, String(result.payload.error));
      const view = result.payload.view as RestaurantCaseView;
      assert.equal(view.case.phase, "FAILED");
      assert.equal(view.activities.at(-1)?.type, "SEMANTIC_INTERPRETATION_FAILED");
      assert.match(view.conversation.messages.at(-1)?.content ?? "", /No verified availability result was presented/i);

      const files = await readdir(artifactDirectory);
      const resultName = files.find((file) => file.endsWith(".result.json"));
      const evaluationName = files.find((file) => file.includes(".evaluation."));
      assert.ok(resultName, "semantic-model failures must persist an ordinary Web execution artifact");
      assert.ok(evaluationName, "semantic-model failures must be independently evaluated");
      const artifact = JSON.parse(await readFile(join(artifactDirectory, resultName), "utf8")) as Record<string, unknown>;
      const evaluation = JSON.parse(await readFile(join(artifactDirectory, evaluationName), "utf8")) as Record<string, unknown>;
      assert.equal(artifact.status, "FAILED");
      assert.equal((artifact.finalSnapshot as { domainState?: { failure?: { code?: string } } }).domainState?.failure?.code, "SEMANTIC_INTERPRETATION_FAILED");
      assert.equal((evaluation.execution as { status?: string }).status, "FAILED");
    } finally {
      await running.close();
    }
  });
});

test("W11 ordinary Web artifact retains shared Google request limits and category totals", async () => {
  await withDatabase(async ({ database, clock }) => {
    const artifactDirectory = await mkdtemp(join(tmpdir(), "praxis-web-google-accounting-"));
    const running = await startServer(database, clock, {
      restaurant: new MeteredGoogleFixtureRestaurantSearch(),
      artifactDirectory,
      liveReadLimits: { maxGoogleRequests: 100 },
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      await createCase(running.baseUrl, cookie, "web-google-accounting");
      const files = await readdir(artifactDirectory);
      const resultName = files.find((file) => file.endsWith(".result.json"));
      assert.ok(resultName, "finished Web reads must export their resource accounting");
      const artifact = JSON.parse(await readFile(join(artifactDirectory, resultName), "utf8")) as {
        limits?: Record<string, number>;
        resourceUsage?: { googleRequests?: Record<string, number> };
      };
      assert.equal(artifact.limits?.maxGoogleRequests, 100);
      assert.deepEqual(artifact.resourceUsage?.googleRequests, {
        limit: 100,
        total: 4,
        namedPlaceResolution: 1,
        discovery: 2,
        placeDetails: 1,
      });
    } finally {
      await running.close();
    }
  });
});

test("W09 HTTP/SSE publishes background progress and accepts an edit based on the last user-visible version", async () => {
  await withDatabase(async ({ database, clock }) => {
    const restaurant = new SearchThenBlockRestaurantSearch();
    const running = await startServer(database, clock, { mode: "LIVE_READ", restaurant });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const created = await createCase(running.baseUrl, cookie, "web-progress-edit");
      assert.equal(created.case.taskVersion, 1);
      const controller = new AbortController();
      const response = await fetch(`${running.baseUrl}/api/cases/${encodeURIComponent(created.case.caseId)}/events`, {
        headers: { cookie }, signal: controller.signal,
      });
      assert.ok(response.body);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        const initial = await nextCaseEvent(reader, decoder);
        assert.equal(initial.case.taskVersion, created.case.taskVersion);
        restaurant.allowSearch();
        await restaurant.checking;
        const progressed = await nextCaseEvent(reader, decoder);
        assert.ok(progressed.case.taskVersion > created.case.taskVersion);
        assert.equal(progressed.case.phase, "SEARCHING");
        const edited = await api(
          running.baseUrl,
          cookie,
          `/api/conversations/${encodeURIComponent(created.conversation.id)}/messages`,
          { method: "POST", body: JSON.stringify({ taskVersion: created.case.taskVersion, requestId: "web-progress-edit-message", message: "Change party size to three." }) },
        );
        assert.equal(edited.response.status, 200, String(edited.payload.error));
        const view = edited.payload.view as RestaurantCaseView;
        assert.equal(view.restaurant.intentDraft?.partySize, 3);
        assert.ok(view.case.taskVersion > progressed.case.taskVersion);
      } finally {
        await reader.cancel();
        controller.abort();
      }
    } finally {
      await running.application.stopActiveReads();
      await running.close();
    }
  });
});

test("W07 a Live Case left without an in-process owner is ended explicitly after restart", async () => {
  await withDatabase(async ({ database, clock }) => {
    const restaurant = new BlockingRestaurantSearch();
    const first = await startServer(database, clock, { mode: "LIVE_READ", restaurant });
    let second: TestServer | undefined;
    try {
      const cookie = await login(first.baseUrl, "token-a");
      const created = await createCase(first.baseUrl, cookie, "live-interrupted");
      await restaurant.started;
      second = await startServer(database, clock, { mode: "LIVE_READ" });
      const restored = await api(second.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}`);
      assert.equal(restored.response.status, 200);
      const view = restored.payload.view as RestaurantCaseView;
      assert.equal(view.case.phase, "FAILED");
      assert.match(view.activities.at(-1)?.display.detail ?? "", /not resumed automatically/i);
    } finally {
      await first.application.stopActiveReads();
      await first.close();
      if (second) await second.close();
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

test("Web location is bound once to the authenticated nearby case and is rejected for a named area", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const createdResult = await api(running.baseUrl, cookie, "/api/cases", { method: "POST", body: JSON.stringify({ message: COMPLETE_NEARBY_REQUEST, requestId: "location-case" }) });
      assert.equal(createdResult.response.status, 201);
      const created = createdResult.payload.view as RestaurantCaseView;
      const located = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}/location`, { method: "POST", body: JSON.stringify({ taskVersion: created.case.taskVersion, requestId: "device-location", latitude: 35.6697, longitude: 139.767, accuracyMeters: 25 }) });
      assert.equal(located.response.status, 200, String(located.payload.error));
      const view = located.payload.view as RestaurantCaseView;
      assert.equal(view.restaurant.intentDraft?.area?.coordinates?.source, "DEVICE");
      assert.equal(view.restaurant.intentDraft?.area?.coordinates?.latitude, 35.6697);
      const namedArea = await createCase(running.baseUrl, cookie, "named-area");
      const rejected = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(namedArea.case.caseId)}/location`, { method: "POST", body: JSON.stringify({ taskVersion: namedArea.case.taskVersion, requestId: "named-location", latitude: 35.6697, longitude: 139.767 }) });
      assert.equal(rejected.response.status, 400);
      assert.match(String(rejected.payload.error), /only for a nearby request/i);
    } finally { await running.close(); }
  });
});

test("Web nearby fallback accepts a manually supplied place through the normal message path", async () => {
  await withDatabase(async ({ database, clock }) => {
    const running = await startServer(database, clock);
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const createdResult = await api(running.baseUrl, cookie, "/api/cases", { method: "POST", body: JSON.stringify({ message: COMPLETE_NEARBY_REQUEST, requestId: "manual-place-case" }) });
      const created = createdResult.payload.view as RestaurantCaseView;
      const continued = await api(running.baseUrl, cookie, `/api/conversations/${encodeURIComponent(created.conversation.id)}/messages`, { method: "POST", body: JSON.stringify({ taskVersion: created.case.taskVersion, requestId: "manual-place", message: "Use Higashi-Ginza instead." }) });
      assert.equal(continued.response.status, 200, String(continued.payload.error));
      const view = continued.payload.view as RestaurantCaseView;
      assert.equal(view.restaurant.intentDraft?.area?.query, "Higashi-Ginza");
      assert.equal(view.restaurant.intentDraft?.area?.coordinates, undefined);
    } finally { await running.close(); }
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
