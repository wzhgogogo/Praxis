import {fixtureGetRuntime} from "../harness/fixtures/observed-get-session.js";
import {scriptedBrowserObservation} from "../harness/fixtures/restaurant-observation-model.js";
import { prepareBookingHandoff, type BookingHandoffContext, type BookingHandoffSource, type PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";
import { groundTabelogAvailability } from "../domains/restaurant/read-grounding.js";
import { RestaurantPageQuestionReader } from "../integrations/restaurant-facts/page-question-reader.js";
import { GoogleListedWebsiteFactRead } from "../integrations/restaurant-facts/google-listed-website-facts.js";
import { ModelRestaurantFactJudgment } from "../integrations/restaurant-facts/model-fact-judgment.js";
import type { BrowserRuntime } from "../infrastructure/browser/browser-runtime.js";
import { fixtureGoalBasis } from "../harness/restaurant-read-test-fixtures.js";
import {scriptedRetrieval} from "../harness/restaurant-read-test-fixtures.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { PGlite, type Results, type Transaction } from "@electric-sql/pglite";

import type { RestaurantCaseView } from "../application/agent-workspace.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET as readLimits } from "../application/live-read-investigation-budget.js";
import {
  PersistentRestaurantAgentApplication,
  PilotSessionService,
  type PilotAccessEntry,
  type PersistentRestaurantAgentOptions,
} from "../application/persistent-restaurant-agent.js";
import type { RestaurantAvailabilityPort, RestaurantCandidateFactPort, RestaurantSearchPort } from "../application/restaurant-execution-router.js";
import { evaluateRestaurantHybridLiveArtifact, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION } from "../eval/restaurant/agent-loop/diagnostic-evaluator.js";
import { FakeClock } from "../harness/fake-clock.js";
import { RestaurantSemanticInterpreter } from "../domains/restaurant/semantic-interpreter.js";
import { RestaurantAgentDecision, ScriptedRestaurantAgentDecisionPort, type RestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import type { RestaurantSemanticInterpreterPort, RestaurantPartySizeSupplementResolverPort } from "../application/restaurant-message-handler.js";
import type { RestaurantPartySizeSupplementResult } from "../domains/restaurant/party-size-supplement-resolver.js";
import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import { FixtureModelGateway } from "../infrastructure/fixture/fixture-model-gateway.js";
import { RunBoundedModelGateway } from "../application/run-bounded-model-gateway.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import { ModelGatewayError } from "../core/model/errors.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";
import { createLiveReadAssembly } from "../integrations/restaurant-search/live-read-assembly.js";
import { googlePlacesDiscoveryPack } from "../integrations/restaurant-search/source-packs.js";
import { GooglePlacesClient } from "../integrations/google/google-places-client.js";
import type { RestaurantAvailabilityRequest, RestaurantCandidate, RestaurantCandidateFactRequest, RestaurantReadEvidence, RestaurantSearchRequest, RestaurantTaskState } from "../domains/restaurant/contracts.js";
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
  bookingHandoffs?: import("./local-web-server.js").LocalWebServerOptions["bookingHandoffs"];
  readAssembly?: ReturnType<typeof createLiveReadAssembly>;
  restaurantQuestions?: import("../domains/restaurant/page-question.js").RestaurantPageQuestionPort;
  readTimeouts?: import("../application/restaurant-execution-router.js").RestaurantExecutionRouterOptions;
  mode?: "FIXTURE" | "LIVE_READ";
  restaurant?: RestaurantSearchPort & RestaurantAvailabilityPort & RestaurantCandidateFactPort;
  model?: ModelGateway;
  artifactDirectory?: string;
  liveReadLimits?: Readonly<Record<string, number>>;
  semanticInterpreter?: RestaurantSemanticInterpreterPort;
  partySizeSupplementResolver?: RestaurantPartySizeSupplementResolverPort;
  agentDecision?: RestaurantAgentDecisionPort;
  modelRunBudget?: PersistentRestaurantAgentOptions["modelRunBudget"];
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
    restaurantSearch: options.readAssembly?.search ?? restaurant,
    restaurantAvailability: options.readAssembly?.availability ?? restaurant,
    restaurantFacts: options.readAssembly?.facts ?? restaurant,
    ...(options.restaurantQuestions || options.readAssembly?.questions ? {restaurantQuestions:options.restaurantQuestions ?? options.readAssembly!.questions} : {}),
    executionRouterOptions: options.readTimeouts ?? options.readAssembly?.router ?? { structuredReadTimeoutMs: readLimits.maxStructuredReadMs, browserReadTimeoutMs: readLimits.maxAutomaticBrowserMs },
    agentLoopOptions: options.readAssembly?.loop ?? { maxSteps: readLimits.maxAgentSteps, maxRejectedActions: readLimits.maxRejectedActions, timeoutMs: readLimits.maxAutomaticBrowserMs },
    ...(options.liveReadLimits ? { liveReadLimits: options.liveReadLimits } : {}),
    ...(options.mode ? { workspaceMode: options.mode } : {}),
    ...(options.modelRunBudget ? { modelRunBudget: options.modelRunBudget } : {}),
  });
  const sessions = new PilotSessionService(application.store, ACCESS, clock);
  const server = createLocalWebServer({
    application,
    sessions,
    ...(options.readAssembly ? {readAssembly:options.readAssembly} : {}),
    ...(options.bookingHandoffs ? {bookingHandoffs:options.bookingHandoffs} : {}),
    ...(options.artifactDirectory ? { artifactDirectory: options.artifactDirectory } : {}),
  });
  server.listen(0, "127.0.0.1");
  await withinTestTimeout(once(server, "listening"), "local HTTP server to listen");
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    application,
    async close() {
      server.close();
      // A cancelled SSE client may leave a keep-alive socket until Node's
      // idle timeout. Test cleanup owns all local connections at this point.
      server.closeAllConnections();
      await withinTestTimeout(once(server, "close"), "local HTTP server to close");
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
      evidence: read.candidates.map((candidate) => ({
        evidenceId: `metered-discovery:${candidate.restaurant.id}`, kind: "DISCOVERY" as const, provider: "GOOGLE_PLACES" as const,
        candidateId: candidate.restaurant.id, sourceEntityId: candidate.restaurant.id, observedAt: "2026-08-08T09:00:00.000Z", requestFingerprint: "metered-discovery",
        claims: { areaMatch: true, areaQuery: request.intent.area!.query },
      })),
      metadata: {
        ...read.metadata,
        provider: "GOOGLE_PLACES" as const,
        googleRequests: { limit: 50, total: 4, namedPlaceResolution: 1, discovery: 2, placeDetails: 1, reverseAddressObservation: 0 },
      },
    };
  }

  async check(request: RestaurantAvailabilityRequest, signal: AbortSignal) {
    const read = await this.fixture.check(request, signal);
    const evidence: RestaurantReadEvidence[] = request.candidateIds.flatMap((candidateId) => {
      const price = read.offers.find(offer => offer.restaurantId === candidateId)?.price;
      assert.ok(price, "metered fixture must preserve the source offer's quoted price");
      const amount = price.amount;
      const sourceUrl = `https://fixture.invalid/${candidateId}`;
      return [
      { evidenceId: `metered-identity:${candidateId}`, kind: "ENTITY_MATCH" as const, provider: "TABLECHECK" as const, candidateId, sourceEntityId: candidateId,
        observedAt: "2026-08-08T09:00:00.000Z", requestFingerprint: "metered-availability", claims: {}, entityMatch: { confidence: "HIGH" as const, matchedBy: ["FIXTURE_SOURCE"] } },
      { evidenceId: `metered-hours:${candidateId}`, kind: "RESTAURANT_FACT" as const, provider: "TABLECHECK" as const, candidateId, sourceEntityId: candidateId,
        sourceUrl, priceFacts: { schemaVersion: "restaurant-price-facts@1", listedCoursePricesYen: [{ amount, quote: `Fixture dinner course ¥${amount}`, sourceUrl, kind: "MEAL", meal: "DINNER", tax: "UNSPECIFIED" }] },
        observedAt: "2026-08-08T09:00:00.000Z", requestFingerprint: "metered-availability", claims: { openingHoursMatch: true, restaurantTypeFacts: ["fixture restaurant"] }, entityMatch: { confidence: "HIGH" as const, matchedBy: ["FIXTURE_SOURCE"] } },
      { evidenceId: `metered-availability:${candidateId}`, kind: "AVAILABILITY" as const, provider: "TABLECHECK" as const, candidateId, sourceEntityId: candidateId,
        observedAt: "2026-08-08T09:00:00.000Z", expiresAt: "2026-12-31T23:59:00.000Z", displayExpiresAt: "2026-12-31T23:59:00.000Z", requestFingerprint: "metered-availability",
        claims: { date: request.date, partySize: request.partySize, visibleSlots: read.offers.filter(offer => offer.restaurantId === candidateId).map(offer => offer.dateTime.slice(11, 16)) }, entityMatch: { confidence: "HIGH" as const, matchedBy: ["FIXTURE_SOURCE"] } },
    ];
    });
    return { ...read, evidence, availabilityChecks: Object.fromEntries(Object.entries(read.availabilityChecks).map(([candidateId, check]) => [candidateId, { ...check, evidenceIds: [`metered-identity:${candidateId}`, `metered-hours:${candidateId}`, `metered-availability:${candidateId}`] }])) };
  }

  inspectFacts(...arguments_: Parameters<FixtureRestaurantSearch["inspectFacts"]>) {
    return this.fixture.inspectFacts(...arguments_);
  }
}

class BlockingRestaurantSearch extends FixtureRestaurantSearch {
  private resolveStarted?: () => void;
  readonly started = new Promise<void>((resolve) => { this.resolveStarted = resolve; });
  aborted = false;

  override async search(_request: RestaurantSearchRequest, signal: AbortSignal) {
    this.resolveStarted?.();
    return new Promise<never>((_resolve, reject) => {
      signal.addEventListener("abort", () => { this.aborted = true; reject(signal.reason ?? new Error("aborted")); }, { once: true });
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
    await withinTestTimeout(this.searchGate, "test to release the source search");
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
  // These HTTP fixtures operate from Home or the conversation view unless a
  // test explicitly supplies a candidate reference. No identity is inferred.
  if (typeof options.body === "string" && (path === "/api/cases" || /\/messages$/.test(path))) {
    try {
      const body = JSON.parse(options.body) as Record<string, unknown>;
      if (body && typeof body === "object" && !Array.isArray(body) && body.viewContext === undefined) {
        body.viewContext = {view:path === "/api/cases" ? "HOME" : "CONVERSATION", comparedCandidateIds:[]};
        options = {...options, body:JSON.stringify(body)};
      }
    } catch { /* Invalid-body tests must reach the real HTTP decoder. */ }
  }
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

const wallSetTimeout = globalThis.setTimeout;
const wallClearTimeout = globalThis.clearTimeout;

async function withinTestTimeout<T>(promise: Promise<T>, label: string, timeoutMs = 10_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = wallSetTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) wallClearTimeout(timer);
  }
}

function availabilityProposal(partySize?: number): RestaurantSemanticProposal {
  return {
    schemaVersion: "4",
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { goalBasis: { type: "JUDGMENT" as const, reason: "Controlled fixture target.", quotes: ["find"] }, kind: "TARGET", goal: "AVAILABILITY", query: "find a table" } },
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
      ? { schemaVersion: "4" as const, facts: [{ field: "TARGET" as const, operation: "ASSERT" as const, value: { goalBasis: { type: "JUDGMENT" as const, reason: "Controlled fixture target.", quotes: ["recommend"] }, kind: "TARGET" as const, goal: "RECOMMENDATION" as const, query: "recommend a cafe" } }] }
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
  try {
    return await nextCaseEvent(reader, new TextDecoder());
  } finally {
    await reader.cancel();
    controller.abort();
  }
}

async function nextCaseEvent(reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder, timeoutMs = 1_000): Promise<RestaurantCaseView> {
  return withinTestTimeout((async () => {
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
  })(), "next SSE event", timeoutMs);
}

test("T1 Web waits fail with the target signal label when no SSE event arrives (timeoutMs=20)", async () => {
  const stream = new ReadableStream<Uint8Array>();
  const reader = stream.getReader();
  try {
    const error = await withinTestTimeout(
      nextCaseEvent(reader, new TextDecoder(), 20).then(() => undefined, error => error),
      "outer test control", 200,
    ).catch(error => error);
    assert.ok(error instanceof Error);
    assert.match(error.message, /Timed out waiting for next SSE event/, "the SSE wait itself must fail, not the outer test deadline");
    assert.equal(await withinTestTimeout(Promise.resolve("ready"), "resolved signal", 20), "ready");
  } finally {
    await reader.cancel();
  }
});

function strictFixtureAction(type: "ANSWER_PAGE_QUESTION" | "SEARCH_RESTAURANTS" | "INVESTIGATE_CANDIDATE_FACTS" | "PRESENT_RESULTS", candidateIds: string[] = []): ModelResponse {
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
    if(request.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(request)!;
      calls.model += 1;
      if (request.purpose === "restaurant_semantic_interpret") {
        const userMessage = request.messages.find((message) => message.role === "user")?.content ?? "";
        if (supportsConditionRevision && userMessage.includes("Make it four on 2026-09-19")) {
          return {
            invocationId: `selection-semantic-revision:${calls.model}`, provider: "FIXTURE", model: "selection-session-fixture",
            outputText: JSON.stringify({ schemaVersion: "4", facts: [
              { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 4 } },
              { field: "DATE", operation: "CORRECT", value: { kind: "DATE", value: "2026-09-19", raw: "2026-09-19" } },
            ] }), finishReason: "TOOL_CALLS", latencyMs: 0,
          };
        }
        return {
          invocationId: `selection-semantic:${calls.model}`, provider: "FIXTURE", model: "selection-session-fixture",
          outputText: JSON.stringify({ schemaVersion: "4", facts: [
            { field: "TARGET", operation: "ASSERT", value: { goalBasis: fixtureGoalBasis(request), kind: "TARGET", goal: "RECOMMENDATION", query: "restaurants", selectionScope: "OPEN_ENDED" } },
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
      const settled = await withinTestTimeout(Promise.allSettled([first, duplicate]), "duplicate user messages to settle");
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
    const refreshModel = new RunBoundedModelGateway(selectionSessionModel(refreshCalls), 50, 500_000);
    const refreshServer = await startServer(database, clock, {
      partySizeSupplementResolver: refreshResolver,
      restaurant: selectionSessionFixture(refreshCalls),
      model: refreshModel,
      modelRunBudget: refreshModel,
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
      assert.equal(refreshCalls.availability,0,"pure recommendation refresh is fact-only");
      const execution=await refreshServer.application.exportReadArtifact(created.case.caseId);
      assert.ok((execution.events as Array<{event:{type:string}}>).some(e=>e.event.type==="CANDIDATE_FACTS_REFRESH_REQUESTED"),"pure recommendation dispatches the fact refresh route even when other already-qualified candidates can be presented");
      assert.equal(refreshResolver.messages.length, 0, "availability refresh never re-interprets or supplements the original request");
      assert.ok((refreshModel.usage(created.case.caseId)?.calls ?? 0) > 0, "a direct refresh owns a fresh bounded model scope rather than borrowing the completed message run");
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
      assert.deepEqual(calls, { model: 4, search: 1, facts: 3, availability: 0 }, "three outlet checkpoints retain one Agent fact action and event");
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
      await withinTestTimeout(restaurant.started, "W06 source search to start");
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
    if(request.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(request)!;
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
      await withinTestTimeout(restaurant.started, "W08 source search to start");
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
    const boundedModel = new RunBoundedModelGateway(new FixtureModelGateway(), 50, 500_000);
    const fixtureIds = ["fixture-restaurant-1", "fixture-restaurant-2", "fixture-restaurant-3"];
    const running = await startServer(database, clock, {
      mode: "LIVE_READ",
      model: boundedModel,
      modelRunBudget: boundedModel,
      restaurant: new MeteredGoogleFixtureRestaurantSearch(),
      agentDecision: new ScriptedRestaurantAgentDecisionPort([
        { type: "SEARCH_RESTAURANTS" },
        { type: "CHECK_AVAILABILITY", candidateIds: fixtureIds },
        { type: "PRESENT_RESULTS", candidateIds: fixtureIds },
      ]),
      liveReadLimits: { maxGoogleRequests: 100 },
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const finished = new Promise<void>((resolve) => {
        const unsubscribe = running.application.subscribeReadFinished(() => { unsubscribe(); resolve(); });
      });
      const created = await createCase(running.baseUrl, cookie, "web-google-accounting");
      await withinTestTimeout(finished, "W11 read-finished notification");
      // `readFinished` subscribers deliberately run concurrently so artifact
      // persistence cannot delay UI completion. Export from the completed
      // application state here to test the production accounting contract.
      const artifact = await running.application.exportReadArtifact(created.case.caseId) as {
        limits?: Record<string, number>;
        resourceUsage?: { googleRequests?: Record<string, number>; modelCallsStarted?: number; elapsedMs?: number };
        finalSnapshot?: { domainState?: { phase?: string; presentedResults?: { candidateIds?: string[] } } };
        trajectories?: unknown;
      };
      assert.equal(artifact.limits?.maxGoogleRequests, 100);
      assert.deepEqual(artifact.resourceUsage?.googleRequests, {
        limit: 50,
        total: 4,
        namedPlaceResolution: 1,
        discovery: 2,
        placeDetails: 1, reverseAddressObservation: 0,
      });
      assert.ok((artifact.resourceUsage?.modelCallsStarted ?? 0) > 0, "the artifact records the model calls made under its live per-run scope");
      assert.ok((artifact.resourceUsage?.elapsedMs ?? 0) >= 0, "resource elapsed time is taken from the same completed per-run scope");
      assert.equal(artifact.finalSnapshot?.domainState?.phase, "PRESENT_RESULTS", JSON.stringify({ snapshot: artifact.finalSnapshot, trajectories: artifact.trajectories }));
      assert.ok((artifact.finalSnapshot?.domainState?.presentedResults?.candidateIds?.length ?? 0) > 0);
    } finally {
      await running.close();
    }
  });
});

test("W13 ordinary Web presents a qualified short batch using its shared model-call reserve", async () => {
  await withDatabase(async ({ database, clock }) => {
    const calls = { model: 0, search: 0, facts: 0, availability: 0 };
    const semanticModel = selectionSessionModel(calls);
    const boundedModel = new RunBoundedModelGateway({ async complete(request) {
    if(request.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(request)!;
      if (request.purpose === "restaurant_semantic_interpret") return semanticModel.complete(request);
      calls.model += 1;
      const { context } = JSON.parse(request.messages.find(message => message.role === "user")!.content);
      return !context.candidates.length ? strictFixtureAction("SEARCH_RESTAURANTS")
        : context.legalActions.investigateCandidateFacts.length
          ? strictFixtureAction("INVESTIGATE_CANDIDATE_FACTS", context.legalActions.investigateCandidateFacts.slice(0, 1))
          : strictFixtureAction("PRESENT_RESULTS", context.legalActions.presentResults);
    } }, 6, 500_000);
    const running = await startServer(database, clock, {
      mode: "LIVE_READ", model: boundedModel, modelRunBudget: boundedModel,
      restaurant: selectionSessionFixture(calls, false, ["b", "c", "d", "e", "f"]),
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const finished = new Promise<void>(resolve => {
        const unsubscribe = running.application.subscribeReadFinished(() => { unsubscribe(); resolve(); });
      });
      const created = await createCase(running.baseUrl, cookie, "web-model-call-delivery", "Recommend restaurants in Shinjuku.");
      await withinTestTimeout(finished, "the model-call delivery window");
      const artifact = await running.application.exportReadArtifact(created.case.caseId);
      const state = (artifact.finalSnapshot as { domainState: RestaurantTaskState }).domainState;
      assert.equal(state.phase, "PRESENT_RESULTS");
      assert.deepEqual(state.presentedResults?.candidateIds, ["a"]);
      assert.deepEqual(state.selectionSession?.resultBatchTarget, { candidateCount: 3, met: false });
      assert.equal(calls.facts, 0, "the shared reserve blocks further fact reads while a qualified result exists");
      assert.equal(calls.model, 3, "semantic and both Agent decisions share the six-call scope");
      assert.ok((artifact.events as Array<{ event: { type: string } }>).some(event => event.event.type === "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED"));
      assert.equal(evaluateRestaurantHybridLiveArtifact(artifact, { path: "w13-call-delivery.result.json", sha256: "fixture" }).execution.completion, "PRESENTATION_RECORDED");
    } finally {
      await running.close();
    }
  });
});

test("W12 F6 Live Persistent run inherits the semantic-started deadline and its twenty-second reserve", { timeout: 30_000 }, async t => {
  await withDatabase(async ({ database, clock }) => {
    t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: Date.now() });
    const initial = clock.now().valueOf();
    const restaurant = new BlockingRestaurantSearch();
    const fixture = new FixtureModelGateway();
    const boundedModel = new RunBoundedModelGateway({ async complete(request) {
      const value = await fixture.complete(request);
      if (request.purpose === "restaurant_semantic_interpret") {
        clock.advance(100_000);
        t.mock.timers.tick(100_000);
      }
      return value;
    } }, 50, 500_000);
    const running = await startServer(database, clock, {
      mode: "LIVE_READ", restaurant, model: boundedModel, modelRunBudget: boundedModel,
      readTimeouts: { structuredReadTimeoutMs: 500_000, browserReadTimeoutMs: 500_000 },
    });
    try {
      const cookie = await login(running.baseUrl, "token-a");
      const finished = new Promise<void>((resolve) => {
        const unsubscribe = running.application.subscribeReadFinished(() => { unsubscribe(); resolve(); });
      });
      const created = await createCase(running.baseUrl, cookie, "web-whole-read-deadline");
      await restaurant.started;
      clock.advance(379_999);
      t.mock.timers.tick(379_999);
      assert.equal(restaurant.aborted, false, "the admitted read remains valid until the original reserve boundary");
      clock.advance(1);
      t.mock.timers.tick(1);
      assert.equal(restaurant.aborted, true, "F6 must cancel at the semantic-started deadline minus 20 seconds, not restart 500 seconds after semantic work");
      await finished;
      const artifact = await running.application.exportReadArtifact(created.case.caseId);
      const state = (artifact.finalSnapshot as { domainState: RestaurantTaskState }).domainState;
      assert.equal(state.phase, "NO_VERIFIED_RESULT", JSON.stringify({failure:state.failure,window:state.readEndWindow,trajectories:artifact.trajectories}));
      assert.equal(state.failure, undefined);
      const window = (artifact.events as Array<{event: import("../domains/restaurant/contracts.js").RestaurantEvent}>).find(entry => entry.event.type === "READ_END_WINDOW_OPENED")?.event;
      assert.equal(window?.type, "READ_END_WINDOW_OPENED");
      assert.ok(window?.type === "READ_END_WINDOW_OPENED");
      assert.equal(window.reason, "DELIVERY_TIME");
      assert.equal(window.deadlineAt, new Date(initial + 500_000).toISOString());
      assert.equal(clock.now().valueOf(), initial + 480_000);
      assert.ok(state.noVerifiedResult?.remainingGaps.some(gap => gap.includes("READ_TIME_RESERVE")));
      assert.equal(evaluateRestaurantHybridLiveArtifact(artifact, { path: "w12-deadline.result.json", sha256: "fixture" }).execution.completion, "NO_VERIFIED_RESULT");
    } finally {
      t.mock.timers.reset();
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
        await withinTestTimeout(restaurant.checking, "W09 availability check to start");
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

test("T1 Web shared assembly keeps ownership during semantic parsing and completes after a concurrent list (packs=Google)", async () => {
  await withDatabase(async ({ database, clock }) => {
    let announceSemantic!: () => void;
    let releaseSemantic!: () => void;
    let announceFinished!: () => void;
    const semanticStarted = new Promise<void>(resolve => { announceSemantic = resolve; });
    const semanticGate = new Promise<void>(resolve => { releaseSemantic = resolve; });
    const finished = new Promise<void>(resolve => { announceFinished = resolve; });
    let modelCalls = 0;
    const model: ModelGateway = { async complete(request) {
    if(request.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(request)!;
      modelCalls++;
      if (request.purpose === "restaurant_semantic_interpret") {
        announceSemantic();
        await withinTestTimeout(semanticGate, "test to release the semantic transport");
        return { invocationId: "delayed-semantic", provider: "FIXTURE", model: "controlled-delay", latencyMs: 0, finishReason: "TOOL_CALLS", outputText: JSON.stringify({ schemaVersion: "4", facts: [
          { field: "TARGET", operation: "ASSERT", value: { goalBasis: fixtureGoalBasis(request), kind: "TARGET", goal: "RECOMMENDATION", query: "restaurants" } },
          { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-09", raw: "tomorrow" } },
          { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:30", raw: "7pm" } },
          { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
          { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shinjuku" } },
        ] }) };
      }
      assert.equal(request.purpose, "restaurant_agent_decide");
      return { invocationId: `search-${modelCalls}`, provider: "FIXTURE", model: "controlled-delay", latencyMs: 0, finishReason: "TOOL_CALLS", outputText: JSON.stringify({
        type: "SEARCH_RESTAURANTS", question: "", relatedFields: [], retrievalHint: "", candidateIds: [], candidateId: "", offerId: "", decisionSummary: "read independently empty source",
      }) };
    } };
    let googleCalls = 0;
    const google = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async (_url,init) => {
      googleCalls++;
      if (JSON.parse(String(init?.body)).textQuery === "Shinjuku") return new Response(JSON.stringify({places:[{id:"fixture-station",displayName:{text:"Actual source supplied location"},types:["train_station"],location:{latitude:35.69,longitude:139.70}}]}),{status:200});
      return new Response(JSON.stringify({ places: [] }), { status: 200 });
    } });
    const readAssembly = createLiveReadAssembly({ ...readLimits, packs: [googlePlacesDiscoveryPack] }, {
      model, google, clock, browser: { async openSession() { throw new Error("Empty Google discovery must not open a browser"); } },
    });
    const running = await startServer(database, clock, { mode: "LIVE_READ", model, readAssembly, liveReadLimits: readAssembly.runCeilings });
    running.application.subscribeReadFinished(() => { announceFinished(); });
    let creation: ReturnType<typeof createCase> | undefined;
    try {
      const cookie = await login(running.baseUrl, "token-a");
      creation = createCase(running.baseUrl, cookie, "semantic-concurrent-list", "Tomorrow at 7pm near Shinjuku for two, recommend restaurants.");
      // Catch a rejected creation even when the ownership assertion fails first.
      void creation.catch(() => {});
      await withinTestTimeout(semanticStarted, "semantic model transport to start");
      const listed = await api(running.baseUrl, cookie, "/api/cases");
      assert.equal(listed.response.status, 200);
      const summaries = listed.payload.cases as Array<{ phase: string }>;
      assert.equal(summaries.length, 1);
      assert.equal(summaries[0]!.phase, "UNDERSTANDING", "a current-process semantic call must not become EXECUTION_FAILURE");
      assert.equal(googleCalls, 0, "list cannot start discovery or finish a pending semantic call");
      releaseSemantic();
      const created = await withinTestTimeout(creation, "case creation after semantic release");
      await withinTestTimeout(finished, "assembled Web read to finish");
      const result = await api(running.baseUrl, cookie, `/api/cases/${encodeURIComponent(created.case.caseId)}`);
      const view = result.payload.view as RestaurantCaseView;
      assert.equal(view.case.phase, "NO_VERIFIED_RESULT", JSON.stringify(view));
      assert.equal(googleCalls, 2, "named-place observation and assembled general Nearby discovery follow semantic release");
      const artifact = await running.application.exportReadArtifact(created.case.caseId);
      const snapshot = artifact.finalSnapshot as { domainState: RestaurantTaskState };
      const adopted = snapshot.domainState.searchContinuation?.locationContext;
      assert.equal(adopted?.label, "Actual source supplied location");
      assert.deepEqual(view.restaurant.searchLocation, adopted, "Web and exported evaluator input use the identical adopted center");
      assert.match(view.conversation.messages.at(-1)!.content, /Searching around Actual source supplied location/);
      const resolution = snapshot.domainState.readEvidence.find(e => e.claims.resolvedPlaceName);
      assert.equal(resolution?.claims.resolvedPlaceName, adopted?.label);
      assert.equal(resolution?.claims.latitude, adopted?.latitude);
      assert.equal(resolution?.claims.longitude, adopted?.longitude);
      assert.equal(snapshot.domainState.failure, undefined);
      assert.ok(snapshot.domainState.noVerifiedResult);
      assert.notEqual(snapshot.domainState.noVerifiedResult.termination.type, "EXECUTION_FAILURE");
    } finally {
      releaseSemantic();
      if (creation) await creation.catch(() => {});
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
      await withinTestTimeout(restaurant.started, "W07 pre-restart source search to start");
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


// Persistent HTTP/Agent/Validator/Router/Reducer controls with real identity parsing and G1 core.
// A manually built PageQuestionReader/GoogleListedWebsiteFactRead and a stub search Port warm
// the page cache. This bypasses live-read-assembly and GoogleThenWebsiteFactRead; it does not
// prove production page acquisition. Full G1 assembly coverage belongs to a separate test.
function questionSessionFixture(clock: FakeClock, output?: (request: ModelRequest) => unknown) {
  const calls = {model:0,search:0,facts:0,availability:0,pages:0};
  let beforeAnswer: (()=>Promise<void>) | undefined;
  let extraReadCalls = 0;
  const spend:ModelRequest={taskId:"fixture-budget",purpose:"question_budget_fixture",promptVersion:"1",messages:[],responseFormat:"TEXT",outputSchema:{name:"fixture",version:"1"},timeoutMs:8000,fallback:"FAIL_CLOSED"};
  const ordinary = selectionSessionFixture(calls);
  const ordinaryModel = selectionSessionModel(calls);
  const quote = "Credit cards accepted: Visa and MasterCard.";
  const model: ModelGateway = {async complete(request) {
    if (request.purpose === "question_budget_fixture") {calls.model++;return {invocationId:"budget-fixture",provider:"FIXTURE",model:"fixture",finishReason:"STOP",latencyMs:0,outputText:"{}"};}
    if (request.purpose === "restaurant_page_question") {
      calls.model++;
      await beforeAnswer?.();
      const wire = JSON.parse(request.messages[1]!.content);
      const d = wire.sourceDocuments[0], statement = d.statements.find((x:{text:string})=>x.text===quote);
      return {invocationId:"question-fixture",provider:"FIXTURE",model:"fixture",finishReason:"TOOL_CALLS",latencyMs:0,
        outputText:JSON.stringify({sourceConflict:false,...(output ? output(request) as object : {status:"ANSWERED",answer:"They accept Visa and MasterCard.",sensitiveCategory:"NONE",citations:[{documentId:d.id,statementId:statement.id,quote}]})})};
    }
    if (request.purpose === "restaurant_agent_decide" && JSON.parse(request.messages[1]!.content).context.pageQuestion) {
      calls.model++;return strictFixtureAction("ANSWER_PAGE_QUESTION");
    }
    return ordinaryModel.complete(request);
  }};
  const now = () => clock.now().toISOString();
  const browser: BrowserRuntime = {async openSession() {
    let target = "";
    return {metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:now()},
      async navigate(url) {target=url;calls.pages++;},async snapshot() {
        const id = new URL(target).pathname.slice(1); const name = `Session Restaurant ${id.toUpperCase()}`;
        return {url:target,title:name,text:[name,"Shinjuku, Tokyo",quote].join("\n"),settlement:"SETTLED",html:`<script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name,address:"Shinjuku, Tokyo"})}</script>`};
      },async observeControls(){return[];},async click(){},async fill(){},async select(){return[];},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
  }};
  const budget = new RunBoundedModelGateway(model,50,500_000);
  const questions = new RestaurantPageQuestionReader(budget, (observe, _scope, scopedModel:ModelGateway=budget) => {
    const reader=new GoogleListedWebsiteFactRead(
      {maxAutomaticElapsedMs:30_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24},browser,new ModelRestaurantFactJudgment(scopedModel,now),now,undefined,undefined,undefined,undefined,observe);
    return {executionRoute:reader.executionRoute,async inspectFacts(request:RestaurantCandidateFactRequest,signal:AbortSignal){
      for(let n=0;n<extraReadCalls;n++)await scopedModel.complete(spend);
      return reader.inspectFacts(request,signal);
    }};
  },now);
  const restaurant = {...ordinary,async search(request:RestaurantSearchRequest,signal:AbortSignal) {
    const read = await ordinary.search(request,signal);
    const candidates = read.candidates.map(c=>({...c,restaurant:{...c.restaurant,sourceIds:{...c.restaurant.sourceIds,googleWebsiteUri:`https://merchant.example/${c.restaurant.id}`}}}));
    // Actual original fact read warms the current-run cache; no hand-built observation is injected.
    await questions.facts.inspectFacts({candidateIds:[candidates[0]!.restaurant.id],candidates:[candidates[0]!],intent:request.intent,...(request.readRunId ? {readRunId:request.readRunId} : {})},signal);
    return {...read,candidates};
  }};
  return {calls,model,budget,restaurant,questions,quote,setBeforeAnswer:(hook:(()=>Promise<void>)|undefined)=>{beforeAnswer=hook;},setExtraReadCalls:(n:number)=>{extraReadCalls=n;},spend};
}

test("G1 displayed restaurant follow-up answers through the persistent HTTP entry", async () => {
  await withDatabase(async ({ database, clock }) => {
    const f = questionSessionFixture(clock);
    const budget = f.budget;
    const running = await startServer(database,clock,{restaurant:f.restaurant,model:budget,modelRunBudget:budget,restaurantQuestions:f.questions});
    try {
      const cookie = await login(running.baseUrl,"token-a");
      const view = await createCase(running.baseUrl,cookie,"g1-create","Recommend restaurants in Shinjuku.");
      assert.equal(view.case.phase,"PRESENT_RESULTS");
      const candidateId = view.restaurant.presentedCandidateIds![0]!;
      assert.equal(f.calls.pages,1);
      const before = budget.usage(view.case.caseId)!;
      const ask = (body:Record<string,unknown>,session=cookie) => api(running.baseUrl,session,`/api/cases/${encodeURIComponent(view.case.caseId)}/questions`,{method:"POST",body:JSON.stringify(body)});
      const body = {candidateId,question:"Do they take credit cards?",taskVersion:view.case.taskVersion,requestId:"g1-credit"};
      const reply = await ask(body);
      assert.equal(reply.response.status,200,"A user must be able to ask a question about a displayed restaurant");
      const answered = reply.payload.view as RestaurantCaseView;
      const result = answered.restaurant.pageQuestion?.result;
      assert.equal(result?.status,"ANSWERED",JSON.stringify(result));
      assert.ok(result?.status==="ANSWERED");
      assert.equal(result.answer,"They accept Visa and MasterCard.");
      assert.deepEqual(result.citations.map(x=>({text:x.text,url:x.url,readAt:x.readAt})),[{text:f.quote,url:`https://merchant.example/${candidateId}`,readAt:clock.now().toISOString()}]);
      assert.equal(f.calls.pages,1,"current-run cached page is reused without source navigation");
      assert.deepEqual(budget.usage(view.case.caseId),before,"question does not consume or restart the search budget");
      assert.equal(budget.usage(view.case.caseId)!.deadlineAt,before.deadlineAt,"the original search deadline stays unchanged");
      const trajectory = await running.application.listAgentTrajectory("user-a",view.case.caseId);
      assert.equal(trajectory.at(-1)?.agentAction?.type,"ANSWER_PAGE_QUESTION");
      assert.equal(trajectory.at(-1)?.modelAttempt,undefined,"the sole-action path must not fabricate an Agent invocation");
      assert.match(trajectory.at(-1)?.decisionSummary ?? "",/selected by code/);
      const callCount = f.calls.model;
      assert.equal((await ask(body)).response.status,200,"repeated completed request is idempotent despite old taskVersion");
      assert.equal(f.calls.model,callCount);
      assert.equal((await ask({...body,requestId:"g1-url",taskVersion:answered.case.taskVersion,url:"https://other.example"})).response.status,400);
      assert.equal((await ask({...body,requestId:"g1-other-outlet",candidateId:"f",taskVersion:answered.case.taskVersion})).response.status,400,"unshown candidate rejected");
      const stranger = await login(running.baseUrl,"token-b");
      assert.equal((await ask({...body,requestId:"g1-stranger"},stranger)).response.status,404);
      assert.equal(f.calls.model,callCount);
      assert.equal((await ask({...body,requestId:"g1-stale"})).response.status,409);
      const nextId = view.restaurant.presentedCandidateIds![1]!;
      const fresh = await ask({...body,candidateId:nextId,requestId:"g1-no-cache",taskVersion:answered.case.taskVersion});
      assert.equal(fresh.response.status,200);
      assert.equal((fresh.payload.view as RestaurantCaseView).restaurant.pageQuestion?.result?.status,"ANSWERED");
      assert.equal(f.calls.pages,2,"cache miss reuses the existing identity-checking website reader");
    } finally {await running.close();}
  });
});


test("G1 persistent follow-up preserves NOT_STATED, sensitivity and quote rejection", async () => {
  await withDatabase(async ({database,clock}) => {
    for (const [index,variant] of ["absence","sensitive","forged","yes-no"].entries()) {
      const f = questionSessionFixture(clock,request => {
        if (variant==="absence") return {status:"NOT_STATED",answer:null,sensitiveCategory:"NONE",citations:[]};
        const d=JSON.parse(request.messages[1]!.content).sourceDocuments[0];
        const statement=d.statements.find((x:{text:string})=>x.text.startsWith("Credit cards accepted"));
        return {status:"ANSWERED",answer:variant==="yes-no"?"Yes, accessible.":"The page describes accepted payment cards.",sensitiveCategory:variant==="sensitive"||variant==="yes-no"?"ACCESSIBILITY":"NONE",
          citations:[{documentId:d.id,statementId:statement.id,quote:variant==="forged"?"Unwritten guarantee":statement.text}]};
      });
      const server=await startServer(database,clock,{restaurant:f.restaurant,model:f.budget,modelRunBudget:f.budget,restaurantQuestions:f.questions});
      try {
        const cookie=await login(server.baseUrl,"token-a");
        const view=await createCase(server.baseUrl,cookie,`g1-contract-${index}`,"Recommend restaurants in Shinjuku.");
        const reply=await api(server.baseUrl,cookie,`/api/cases/${encodeURIComponent(view.case.caseId)}/questions`,{method:"POST",body:JSON.stringify({candidateId:view.restaurant.presentedCandidateIds![0],question:"What does the page state?",requestId:`answer-${index}`,taskVersion:view.case.taskVersion})});
        assert.equal(reply.response.status,200);
        const result=(reply.payload.view as RestaurantCaseView).restaurant.pageQuestion!.result!;
        if(variant==="absence") {assert.equal(result.status,"NOT_STATED");assert.equal(result.checkedPages.length,1);}
        else if(variant==="sensitive") {assert.equal(result.status,"ANSWERED");assert.ok(result.confirmationRequired);}
        else {assert.equal(result.status,"UNVERIFIED");assert.ok(result.status==="UNVERIFIED"&&result.reason==="INVALID_MODEL_OUTPUT");assert.equal("answer" in result,false);}
      } finally {await server.close();}
    }
  });
});

function questionPath(view:RestaurantCaseView):string {return "/api/cases/"+encodeURIComponent(view.case.caseId)+"/questions";}

for(const scenario of ["after 520 seconds","after 49 original calls","after process restart"] as const) {
  test("G1 independent question answers "+scenario,async()=>{
    await withDatabase(async({database,clock})=>{
      let f=questionSessionFixture(clock);
      let server=await startServer(database,clock,{restaurant:f.restaurant,model:f.budget,modelRunBudget:f.budget,restaurantQuestions:f.questions});
      try {
        let cookie=await login(server.baseUrl,"token-a");
        let view=await createCase(server.baseUrl,cookie,"g1-independent","Recommend restaurants in Shinjuku.");
        if(scenario==="after 520 seconds")clock.advance(520_000);
        if(scenario==="after 49 original calls") {
          await f.budget.run(view.case.caseId,async()=>{for(let n=0;n<49;n++)await f.budget.complete(f.spend);});
          assert.equal(f.budget.usage(view.case.caseId)?.calls,49);
        }
        if(scenario==="after process restart") {
          await server.close();f=questionSessionFixture(clock);
          server=await startServer(database,clock,{restaurant:f.restaurant,model:f.budget,modelRunBudget:f.budget,restaurantQuestions:f.questions});
          cookie=await login(server.baseUrl,"token-a");view=await server.application.getCase("user-a",view.case.caseId);
        }
        const original=f.budget.usage(view.case.caseId),calls=f.calls.model,pages=f.calls.pages;
        const reply=await api(server.baseUrl,cookie,questionPath(view),{method:"POST",body:JSON.stringify({candidateId:view.restaurant.presentedCandidateIds![0],question:"Do they take cards?",requestId:"independent-question",taskVersion:view.case.taskVersion})});
        assert.equal(reply.response.status,200);
        const after=reply.payload.view as RestaurantCaseView;
        assert.equal(after.restaurant.pageQuestion!.result!.status,"ANSWERED");
        assert.deepEqual(after.restaurant.presentedCandidateIds,view.restaurant.presentedCandidateIds);
        assert.deepEqual(f.budget.usage(view.case.caseId),original,"the search's accounting is not spent or restarted");
        assert.equal(f.calls.model-calls,1,"a sole legal action needs only the answer model");
        if(scenario==="after process restart")assert.equal(f.calls.pages-pages,1,"fresh process uses the existing identity-bound reader");
      } finally {await server.close();}
    });
  });
}

for(const limit of ["60 seconds","3 model calls"] as const) {
  test("G1 independent question stops at its own "+limit+" and the next question still answers",async()=>{
    await withDatabase(async({database,clock})=>{
      const f=questionSessionFixture(clock);
      const server=await startServer(database,clock,{restaurant:f.restaurant,model:f.budget,modelRunBudget:f.budget,restaurantQuestions:f.questions});
      try {
        const cookie=await login(server.baseUrl,"token-a");
        let view=await createCase(server.baseUrl,cookie,"g1-own-limit","Recommend restaurants in Shinjuku.");
        const ids=[...view.restaurant.presentedCandidateIds!],original=f.budget.usage(view.case.caseId);
        const ask=(requestId:string,id:string)=>api(server.baseUrl,cookie,questionPath(view),{method:"POST",body:JSON.stringify({candidateId:id,question:"Do they take cards?",requestId,taskVersion:view.case.taskVersion})});
        if(limit==="60 seconds")f.setBeforeAnswer(async()=>{clock.advance(60_001);});
        else f.setExtraReadCalls(3);
        const calls=f.calls.model;
        const reply=await ask("over-limit",limit==="60 seconds"?ids[0]!:ids[1]!);
        assert.equal(reply.response.status,200);view=reply.payload.view as RestaurantCaseView;
        const result=view.restaurant.pageQuestion!.result!;
        assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","question must stop at its own limit");
        if(limit==="3 model calls")assert.equal(f.calls.model-calls,3,"fourth transport call must never start");
        assert.deepEqual(f.budget.usage(view.case.caseId),original);
        f.setBeforeAnswer(undefined);f.setExtraReadCalls(0);
        const next=await ask("after-limit",ids[0]!);assert.equal(next.response.status,200);
        view=next.payload.view as RestaurantCaseView;assert.equal(view.restaurant.pageQuestion!.result!.status,"ANSWERED");
        assert.deepEqual(view.restaurant.presentedCandidateIds,ids);
      } finally {await server.close();}
    });
  });
}

test("G1 twenty-question conversation limit survives restart and duplicate delivery",async()=>{
  await withDatabase(async({database,clock})=>{
    let f=questionSessionFixture(clock);
    let server=await startServer(database,clock,{restaurant:f.restaurant,model:f.budget,modelRunBudget:f.budget,restaurantQuestions:f.questions});
    try {
      let cookie=await login(server.baseUrl,"token-a");
      let view=await createCase(server.baseUrl,cookie,"g1-session-limit","Recommend restaurants in Shinjuku.");
      for(let n=0;n<20;n++){
        const body={candidateId:view.restaurant.presentedCandidateIds![0],question:"Do they take cards?",requestId:"session-question-"+n,taskVersion:view.case.taskVersion};
        const reply=await api(server.baseUrl,cookie,questionPath(view),{method:"POST",body:JSON.stringify(body)});
        assert.equal(reply.response.status,200);view=reply.payload.view as RestaurantCaseView;
        assert.equal(view.restaurant.pageQuestion!.result!.status,"ANSWERED");
        if(n===0){const duplicate=await api(server.baseUrl,cookie,questionPath(view),{method:"POST",body:JSON.stringify(body)});assert.equal(duplicate.response.status,200);}
      }
      await server.close();f=questionSessionFixture(clock);
      server=await startServer(database,clock,{restaurant:f.restaurant,model:f.budget,modelRunBudget:f.budget,restaurantQuestions:f.questions});
      cookie=await login(server.baseUrl,"token-a");view=await server.application.getCase("user-a",view.case.caseId);
      const reply=await api(server.baseUrl,cookie,questionPath(view),{method:"POST",body:JSON.stringify({candidateId:view.restaurant.presentedCandidateIds![0],question:"Do they take cards?",requestId:"question-21",taskVersion:view.case.taskVersion})});
      assert.equal(reply.response.status,400);assert.match(String(reply.payload.error),/start a new search/i);
      assert.equal(f.calls.model,0);assert.equal(f.calls.pages,0);
    } finally {await server.close();}
  });
});

test("G1 async cancellation and newer question discard a late model answer", async () => {
  await withDatabase(async({database,clock})=>{
    const f=questionSessionFixture(clock);
    let release: (()=>void)|undefined;
    let entered: (()=>void)|undefined;
    let modelStarted=Promise.resolve();
    const blockAnswer=()=>{const gate=new Promise<void>(resolve=>{release=resolve;});modelStarted=new Promise<void>(resolve=>{entered=resolve;});f.setBeforeAnswer(async()=>{entered?.();await gate;});};
    const questions={executionRoute:f.questions.executionRoute,async answerQuestion(input:Parameters<typeof f.questions.answerQuestion>[0],signal:AbortSignal){
      signal.addEventListener("abort",()=>{f.setBeforeAnswer(undefined);release?.();},{once:true});
      return f.questions.answerQuestion(input,signal);
    }};
    const server=await startServer(database,clock,{mode:"LIVE_READ",restaurant:f.restaurant,model:f.budget,modelRunBudget:f.budget,restaurantQuestions:questions});
    let releaseAppend!:()=>void;
    const appendGate=new Promise<void>(resolve=>{releaseAppend=resolve;});
    let announceAppend!:()=>void;
    const appendEntered=new Promise<void>(resolve=>{announceAppend=resolve;});
    const append=server.application.store.appendMessage.bind(server.application.store);
    server.application.store.appendMessage=async input=>{if(input.requestId==="user:question-old"){announceAppend();await appendGate;}return append(input);};
    let finish!:()=>void;const firstFinished=new Promise<void>(resolve=>{finish=resolve;});
    server.application.subscribeReadFinished(()=>finish());
    try {
      const cookie=await login(server.baseUrl,"token-a");
      const initial=await createCase(server.baseUrl,cookie,"g1-async","Recommend restaurants in Shinjuku.");
      await withinTestTimeout(firstFinished,"initial fixture read to finish");
      let view=await server.application.getCase("user-a",initial.case.caseId);
      const ask=(requestId:string,current:RestaurantCaseView)=>api(server.baseUrl,cookie,`/api/cases/${encodeURIComponent(current.case.caseId)}/questions`,{method:"POST",body:JSON.stringify({candidateId:current.restaurant.presentedCandidateIds![0],question:"Do they take credit cards?",requestId,taskVersion:current.case.taskVersion})});
      blockAnswer();
      const firstRequest=ask("question-old",view);void firstRequest.catch(()=>{});
      await withinTestTimeout(appendEntered,"question user message append to block");
      const duringAppend=await server.application.getCase("user-a",view.case.caseId);
      assert.equal(duringAppend.restaurant.pageQuestion?.result,undefined,"a current-process preparation must not be marked as an orphan by concurrent GET");
      releaseAppend();
      const first=await withinTestTimeout(firstRequest,"question HTTP mutation to return");assert.equal(first.response.status,200);
      await withinTestTimeout(modelStarted,"first G1 fixture model answer to block");
      view=await server.application.getCase("user-a",view.case.caseId);
      let completed!: (view:RestaurantCaseView)=>void;
      const newerFinished=new Promise<RestaurantCaseView>(resolve=>{completed=resolve;});
      const unsubscribe=server.application.subscribeCaseUpdates(v=>{if(v.restaurant.pageQuestion?.requestId==="question-new"&&v.restaurant.pageQuestion.result)completed(v);});
      const next=await ask("question-new",view);assert.equal(next.response.status,200);
      view=await withinTestTimeout(newerFinished,"newer question to finish after cancellation");unsubscribe();
      assert.equal(view.restaurant.pageQuestion!.requestId,"question-new");assert.equal(view.restaurant.pageQuestion!.result?.status,"ANSWERED");
      const artifact=await server.application.exportReadArtifact(view.case.caseId);
      const events=artifact.events as Array<{event:{type:string;requestId?:string;result?:{status:string;reason?:string}}}>;
      const old=events.find(e=>e.event.type==="PAGE_QUESTION_COMPLETED"&&e.event.requestId==="question-old")?.event.result;
      assert.equal(old?.status,"UNVERIFIED");assert.equal(old?.reason,"CANCELLED","a late answer cannot restore old success after supersession");
      blockAnswer();await ask("question-cancel",view);
      await withinTestTimeout(modelStarted,"second fixture model answer to block");
      const cancelled=await server.application.cancelCase("user-a",view.case.caseId);
      const result=cancelled.restaurant.pageQuestion!.result!;
      assert.ok(result.status==="UNVERIFIED"&&result.reason==="CANCELLED");
      assert.equal(cancelled.case.phase,"PRESENT_RESULTS","question cancellation does not destroy the displayed batch");
    } finally {releaseAppend();release?.();await server.application.stopActiveReads();await server.close();}
  });
});

// Authenticated HTTP/Interpreter/Compiler/Agent/Validator/Router/Reducer/PGlite -> B1 projection.
// Business Ports, evidence and handoff cache are constructed here, bypassing live-read-assembly;
// this verifies projection/rechecks/owner isolation, not production source-link acquisition.
// The "B1 ordinary assembly" test below covers the actual factory/source-response chain.
test("B1 persistent HTTP composition projects a cached source link, rechecks it and isolates owners", async()=>{
  await withDatabase(async({database,clock})=>{
    const raw=JSON.parse(await readFile(new URL("../domains/restaurant/fixtures/booking-handoff/source.json",import.meta.url),"utf8")) as {context:BookingHandoffContext;source:BookingHandoffSource};
    clock.advance(Date.parse(raw.context.now)-clock.now().valueOf());
    let cached:PreparedBookingHandoff[]=[];let sourceReads=0;
    const restaurant:RestaurantSearchPort & RestaurantAvailabilityPort & RestaurantCandidateFactPort={
      executionRoute:"STRUCTURED_ADAPTER",
      async search(){return {candidates:[raw.context.candidate],evidence:[{evidenceId:"b1:area",kind:"DISCOVERY",provider:"GOOGLE_PLACES",candidateId:raw.context.candidate.restaurant.id,sourceEntityId:"synthetic-place",observedAt:clock.now().toISOString(),requestFingerprint:"b1:search",claims:{areaQuery:"Tokyo",areaMatch:true}}],metadata:{provider:"FIXTURE",route:"STRUCTURED_ADAPTER",latencyMs:0}};},
      async check(request){
        sourceReads++;
        const grounded=groundTabelogAvailability(raw.context.candidate,request,{
          candidateId:raw.context.candidate.restaurant.id,sourceEntityId:"13123456",sourceUrl:"https://tabelog.com/en/tokyo/A1301/A130101/13123456/",
          observedAt:clock.now().toISOString(),requestedDate:"2026-11-02",requestedPartySize:2,visibleSlots:["19:00"],pageState:"AVAILABLE",
          entityMatch:{confidence:"HIGH",matchedBy:["SYNTHETIC_SAME_OUTLET"]},
        },clock.now().toISOString());
        const availability=grounded.evidence.find(e=>e.kind==="AVAILABILITY")!;
        const source={...raw.source,offerId:grounded.offers[0]!.id,availabilityEvidenceId:availability.evidenceId};delete source.terms;
        const prepared=prepareBookingHandoff(source,{candidate:raw.context.candidate,offer:grounded.offers[0]!,check:{...grounded.check,sourceProvider:"TABELOG",requestFingerprint:raw.context.check.requestFingerprint!},request:raw.context.request,evidence:grounded.evidence,now:clock.now().toISOString()});
        assert.ok(prepared,"first server check must accept independent synthetic source response");cached=[prepared];
        return {offers:grounded.offers,availabilityChecks:{[raw.context.candidate.restaurant.id]:grounded.check},evidence:grounded.evidence,metadata:{provider:"TABELOG",route:"STRUCTURED_ADAPTER",latencyMs:0}};
      },
      async inspectFacts(){throw new Error("B1 must not trigger a new source read for a link");},
    };
    const message="Book Fixture Sushi for 2026-11-02 at 19:00 for two in Tokyo.";
    const proposal:RestaurantSemanticProposal={schemaVersion:"4",facts:[
      {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:"Fixture Sushi",selectionScope:"SPECIFIC_OUTLET",goalBasis:{type:"BOOKING_WORDING",reason:"Explicit booking request",quotes:["Book Fixture Sushi"]}}},
      {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:"2026-11-02",raw:"2026-11-02"}},
      {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:"19:00",latest:"19:30",raw:"19:00"}},
      {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:2,source:"EXPLICIT"}},
      {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Tokyo"}},
    ]};
    let decision=0;
    const model:ModelGateway={async complete(request){
      const actions=[{type:"SEARCH_RESTAURANTS",candidateIds:[]},{type:"CHECK_AVAILABILITY",candidateIds:["fixture:outlet"]},{type:"PRESENT_RESULTS",candidateIds:["fixture:outlet"]}];
      const action=request.purpose==="restaurant_agent_decide" ? actions[decision++] : undefined;
      assert.ok(request.purpose==="restaurant_semantic_interpret" || action,"unexpected model fixture call");
      return {invocationId:"b1-fixture:"+decision,provider:"FIXTURE",model:"b1-offline",latencyMs:0,finishReason:"TOOL_CALLS",
        outputText:JSON.stringify(action ? {...action,question:"",relatedFields:[],retrievalHint:"",candidateId:"",offerId:"",decisionSummary:"Frozen B1 fixture"} : proposal)};
    }};
    let running=await startServer(database,clock,{restaurant,model,
      bookingHandoffs:{readPrepared:()=>cached,now:()=>clock.now().toISOString()},
    });
    try {
      const cookie=await login(running.baseUrl,"token-a");
      const view=await createCase(running.baseUrl,cookie,"b1-create",message);
      assert.equal(view.case.phase,"PRESENT_RESULTS");
      const summary=view.conversation.messages.filter(m=>m.role==="ASSISTANT").at(-1)!.content;
      assert.match(summary,/Found 1 restaurant/);assert.match(summary,/Fixture Sushi/);assert.match(summary,/19:00/);assert.match(summary,/2 guests/);assert.doesNotMatch(summary,/present results/i);
      assert.equal(view.restaurant.bookingHandoffs?.[0]?.url,"https://tabelog.com/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261102&visit_time=1900");
      assert.equal(view.restaurant.selectedCandidateId,"fixture:outlet");
      const path="/api/cases/"+encodeURIComponent(view.case.caseId);
      const leave=await api(running.baseUrl,cookie,path+"/booking-departures",{method:"POST",body:JSON.stringify({candidateId:"fixture:outlet",offerId:view.restaurant.bookingHandoffs![0]!.offerId,requestId:"b1-departure",taskVersion:view.case.taskVersion})});
      assert.equal(leave.response.status,201,"a validated B1 departure must be durable before leaving");
      const departure=leave.payload.departure as {id:string;provenance:string};assert.equal(departure.provenance,"USER_REPORTED");
      const duplicate=await api(running.baseUrl,cookie,path+"/booking-departures",{method:"POST",body:JSON.stringify({candidateId:"fixture:outlet",offerId:view.restaurant.bookingHandoffs![0]!.offerId,requestId:"b1-departure",taskVersion:view.case.taskVersion})});
      assert.equal((duplicate.payload.departure as {id:string}).id,departure.id);
      assert.equal((await api(running.baseUrl,cookie,path+"/booking-feedback",{method:"POST",body:JSON.stringify({departureId:departure.id,answer:"YES"})})).response.status,400,"answer before a prompt is not accepted");

      cached[0]!.source.url=cached[0]!.source.url.replace("member=2","member=3");
      const modified=(await api(running.baseUrl,cookie,path)).payload.view as RestaurantCaseView;
      assert.deepEqual(modified.restaurant.bookingHandoffs,[],"second server check rejects a modified cache object");
      cached[0]!.source.url=raw.source.url;
      const stranger=await login(running.baseUrl,"token-b");
      assert.equal((await api(running.baseUrl,stranger,path)).response.status,404);
      clock.advance(600_000);
      assert.deepEqual(((await api(running.baseUrl,cookie,path)).payload.view as RestaurantCaseView).restaurant.bookingHandoffs,[]);
      assert.equal(sourceReads,1,"projection and expiry may not open any booking page or rerun availability");
      // Recreate the complete server/application without a source cache; receipts must survive.
      const before=await running.application.getCase("user-a",view.case.caseId);assert.equal(before.restaurant.bookingFeedbackAvailable,true);
      await running.close();running=await startServer(database,clock);
      const claims=await Promise.all(Array.from({length:4},()=>api(running.baseUrl,cookie,path+"/booking-feedback/claim",{method:"POST",body:"{}"})));
      const shown=claims.map(item=>item.payload.prompt).filter(Boolean) as Array<{question:string;departure:{id:string}}>;
      assert.equal(shown.length,1,"concurrent clients can claim at most one prompt per Case");
      assert.equal(shown[0]!.question,"Did you get the booking?");assert.equal(shown[0]!.departure.id,departure.id);
      assert.equal((await api(running.baseUrl,stranger,path+"/booking-feedback/claim",{method:"POST",body:"{}"})).response.status,404);
      await running.close();running=await startServer(database,clock);
      assert.equal((await api(running.baseUrl,cookie,path+"/booking-feedback/claim",{method:"POST",body:"{}"})).payload.prompt,null,"an unanswered prompt also survives restart without re-asking");
      const answer=await api(running.baseUrl,cookie,path+"/booking-feedback",{method:"POST",body:JSON.stringify({departureId:departure.id,answer:"YES"})});
      assert.equal(answer.response.status,200);assert.equal((answer.payload.departure as {answer:string;provenance:string}).answer,"YES");
      assert.equal((answer.payload.departure as {provenance:string}).provenance,"USER_REPORTED");
      const repeated=await api(running.baseUrl,cookie,path+"/booking-feedback",{method:"POST",body:JSON.stringify({departureId:departure.id,answer:"YES"})});assert.deepEqual(repeated.payload,answer.payload);
      const changed=await api(running.baseUrl,cookie,path+"/booking-feedback",{method:"POST",body:JSON.stringify({departureId:departure.id,answer:"NO"})});assert.equal(changed.response.status,400);
      const privateData=await api(running.baseUrl,cookie,path+"/booking-feedback",{method:"POST",body:JSON.stringify({departureId:departure.id,answer:"YES",email:"do-not-store@example.invalid"})});assert.equal(privateData.response.status,400);
      await running.close();running=await startServer(database,clock);
      assert.equal((await api(running.baseUrl,cookie,path+"/booking-feedback/claim",{method:"POST",body:"{}"})).payload.prompt,null,"restart and answered/ignored prompts never re-ask");
      const after=await running.application.getCase("user-a",view.case.caseId);
      assert.equal(after.restaurant.bookingFeedbackAvailable,false);
      assert.equal(after.case.taskVersion,before.case.taskVersion);assert.equal(after.case.phase,before.case.phase);
      assert.deepEqual(after.restaurant.availability,before.restaurant.availability);assert.equal(after.restaurant.selectedCandidateId,before.restaurant.selectedCandidateId);
      const rows=await database.query<{count:string}>("SELECT COUNT(*) AS count FROM restaurant_booking_departures");assert.equal(Number(rows.rows[0]!.count),1);
      for(const choice of ["NO","SKIP"] as const){
        await running.close();decision=0;raw.source.observedAt=clock.now().toISOString();
        running=await startServer(database,clock,{restaurant,model,bookingHandoffs:{readPrepared:()=>cached,now:()=>clock.now().toISOString()}});
        const other=await createCase(running.baseUrl,cookie,"b1-"+choice,message),otherPath="/api/cases/"+encodeURIComponent(other.case.caseId);
        const out=await api(running.baseUrl,cookie,otherPath+"/booking-departures",{method:"POST",body:JSON.stringify({candidateId:"fixture:outlet",offerId:other.restaurant.bookingHandoffs![0]!.offerId,requestId:"depart-"+choice,taskVersion:other.case.taskVersion})});assert.equal(out.response.status,201);
        const prompt=(await api(running.baseUrl,cookie,otherPath+"/booking-feedback/claim",{method:"POST",body:"{}"})).payload.prompt as {departure:{id:string}};assert.ok(prompt);
        assert.equal((await api(running.baseUrl,cookie,otherPath+"/booking-feedback",{method:"POST",body:JSON.stringify({departureId:departure.id,answer:choice})})).response.status,400,"another Case's receipt cannot be used");
        const saved=await api(running.baseUrl,cookie,otherPath+"/booking-feedback",{method:"POST",body:JSON.stringify({departureId:prompt.departure.id,answer:choice})});assert.equal(saved.response.status,200);assert.equal((saved.payload.departure as {answer:string}).answer,choice);
        assert.equal((await api(running.baseUrl,cookie,otherPath+"/booking-feedback/claim",{method:"POST",body:"{}"})).payload.prompt,null);
      }


    } finally {await running.close();}
  });
});

// Real persistent HTTP/assembly/Router/Reducer/availability/parser path; only model,
// Google and BrowserSession transports are constructed fixtures. No prepared B1 record.
test("B1 ordinary assembly exposes only the exact G3 source link", async t => {
  await withDatabase(async ({database, clock}) => {
    const pageUrl = "https://tabelog.com/en/tokyo/A1301/A130101/13123456/";
    const original = "https://tabelog.com/en/booking/form_course/new?visit_time=%31%39%30%30&member=2&rcd=13123456&visit_date=20260809";
    let sourceLink: string | undefined = original;
    let decisions = 0;
    let opens = 0;
    let useJapanese = false;
    let japaneseLookups = 0;
    const navigations: string[] = [];
    const fixture: ModelGateway = {async complete(request) {
      const observed=scriptedBrowserObservation(request);if(observed)return observed;
      let output: unknown;
      if (request.purpose === "restaurant_semantic_interpret") output = availabilityProposal(2);
      else if (request.purpose === "restaurant_source_facts") output = {selections: []};
      else if (request.purpose === "restaurant_named_source_query") output = {field:"name",fragment:"Fixture Sushi"};
      else {
        assert.equal(request.purpose, "restaurant_agent_decide");
        const context = JSON.parse(request.messages[1]!.content).context;
        const ids = context.candidates.map((c: {id:string}) => c.id);
        const hasOffer = Object.values(context.availability).some(v => Array.isArray(v) && v.length);
        const action = decisions++ === 0 ? {type:"SEARCH_RESTAURANTS",candidateIds:[]}
          : decisions === 2 ? {type:"CHECK_AVAILABILITY",candidateIds:ids}
          : hasOffer ? {type:"PRESENT_RESULTS",candidateIds:ids} : {type:"END_READ",candidateIds:[]};
        output = {...action,question:"",relatedFields:[],retrievalHint:"",candidateId:"",offerId:"",decisionSummary:"Offline B1 transport fixture"};
      }
      return {invocationId:"b1-g3-fixture",provider:"FIXTURE",model:"offline",latencyMs:0,finishReason:"TOOL_CALLS",outputText:JSON.stringify(output)};
    }};
    const model = new RunBoundedModelGateway(fixture, 50, readLimits.maxAutomaticBrowserMs);
    const google = new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async (_url,init) => {
      if (new URL(String(_url)).searchParams.get("languageCode") === "ja") {
        japaneseLookups++;
        assert.equal(new URL(String(_url)).pathname,"/v1/places/b1-g3-outlet");
        assert.equal(new Headers(init?.headers).get("X-Goog-FieldMask"),"id,displayName");
        return new Response(JSON.stringify({id:"b1-g3-outlet",displayName:{text:"すし本店",languageCode:"ja"}}));
      }
      const query = init?.body ? JSON.parse(String(init.body)).textQuery : undefined;
      return new Response(JSON.stringify({places:query === "Shibuya" ? [{id:"b1-location",displayName:{text:"Shibuya"},types:["train_station"],location:{latitude:35.66,longitude:139.70}}]
        : [{id:"b1-g3-outlet",displayName:{text:useJapanese ? "Fixture Sushi Tokyo" : "Fixture Sushi"},formattedAddress:"1-2-3 Shibuya Tokyo",types:["restaurant"],location:{latitude:35.66,longitude:139.70},nationalPhoneNumber:"03-1234-5678",...(useJapanese ? {} : {websiteUri:pageUrl})}]}),{status:200});
    }});
    const browser: BrowserRuntime = {readNetworkBoundaryCapability:"ISOLATED_CONTEXT",async openSession() {
      opens++;
      let currentUrl=pageUrl,query="";
      return {metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:clock.now().toISOString(),readNetworkBoundary:"INSTALLED"},
        async navigate(url) {navigations.push(url);currentUrl=url;assert.ok(url===pageUrl || (useJapanese && ["/en/","/en/rstLst/"].includes(new URL(url).pathname)),"never open a workflow to check the link");},
        async snapshot() {
          if (new URL(currentUrl).pathname.includes("rstLst")||new URL(currentUrl).pathname==="/en/") {
            const found=new URL(currentUrl).searchParams.get("sw")==="すし本店";
            return {url:currentUrl,title:"Search",text:found ? "すし本店" : "No restaurants were found that match your search criteria",html:found ? `<a href="${pageUrl}">すし本店</a>` : ""};
          }
          return {url:pageUrl,title:"Fixture Sushi",text:"Fixture Sushi Availability Guests 2 19:00",
          html:`<script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name:"Fixture Sushi",address:"1-2-3 Shibuya Tokyo",telephone:"03-1234-5678"})}</script><select name="party"><option selected value="2">2 guests</option></select><select name="date"><option selected value="2026-08-09">2026-08-09</option></select>`,
          responses:[{url:"https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13123456&svd=20260809&svps=2",status:200,sequence:7,observedAt:clock.now().toISOString(),
            body:{base_date:{year:2026,month:8,day:9},members:2,selection:sourceLink === undefined ? [] : [{time:"19:00",url:sourceLink}]}}]};},
        async observeControls(){return new URL(currentUrl).pathname===new URL(pageUrl).pathname?[]:[{id:"query",stableKey:"query",kind:"INPUT",role:"searchbox",label:"Name",type:"search",value:query,structure:{tag:"INPUT",name:"sw",classes:[],dialogLabel:"",formClass:"",sliderCount:0},formMethod:"GET",formObservation:{owner:"search",visibleLines:["Name","Search"]},visible:true,disabled:false},{id:"submit",stableKey:"submit",kind:"BUTTON",role:"button",label:"Search",type:"submit",formMethod:"GET",formObservation:{owner:"search",visibleLines:["Name","Search"]},visible:true,disabled:false}];},async select(_selector,value) {return [value];},async click() {currentUrl="https://tabelog.com/en/rstLst/?sw="+encodeURIComponent(query);navigations.push(currentUrl);},async fill(_id,value){query=value;},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
    }};
    const readAssembly = createLiveReadAssembly({...readLimits,packs:[googlePlacesDiscoveryPack]}, {
      google,browser:fixtureGetRuntime(browser),model,clock,currentTaskId:()=>model.currentTaskId(),
    });
    let running = await startServer(database,clock,{model,modelRunBudget:model,readAssembly,mode:"LIVE_READ",liveReadLimits:readAssembly.runCeilings});
    try {
      const cookie = await login(running.baseUrl,"token-a");
      let last:RestaurantCaseView | undefined;
      for (const [label,link,accepted] of [
        ["original",original,true],
        ["relative",original.slice("https://tabelog.com".length),true],
        ["missing",undefined,false],
        ["date",original.replace("20260809","20260810"),false],
        ["party",original.replace("member=2","member=3"),false],
        ["time",original.replace("%31%39%30%30","1930"),false],
        ["outlet",original.replace("rcd=13123456","rcd=99999999"),false],
        ["domain",original.replace("tabelog.com","example.invalid"),false],
        ["path",original.replace("/en/booking/form_course/new","/yoyaku/tabelog_booking/confirm"),false],
        ["extra-query",original+"&redirect=https%3A%2F%2Fexample.invalid",false],
        ["japanese-name",original,true],
      ] as const) await t.test(label,async()=>{
        sourceLink=link;decisions=0;useJapanese=label==="japanese-name";
        const navigationStart=navigations.length;
        let finish!:()=>void;const done=new Promise<void>(resolve=>{finish=resolve;});
        const unsubscribe=running.application.subscribeReadFinished(()=>{finish();});
        try {
          const created=await createCase(running.baseUrl,cookie,"b1-g3-"+label,"Tomorrow at 7pm for two in Shibuya, find a table.");
          await withinTestTimeout(done,"G3 availability and B1 projection");
          const result=await api(running.baseUrl,cookie,"/api/cases/"+encodeURIComponent(created.case.caseId));
          const view=result.payload.view as RestaurantCaseView;
          const handoffs=view.restaurant.bookingHandoffs ?? [];
          if(useJapanese && process.env.PRAXIS_G4_JAPANESE_DIAGNOSTIC === "1"){
            const artifact=await running.application.exportReadArtifact(created.case.caseId);
            console.log("G4_JAPANESE_DIAGNOSTIC "+JSON.stringify({phase:view.case.phase,handoffs:handoffs.length,checks:view.restaurant.availabilityChecks,
              evidence:view.restaurant.readEvidence.map(e=>({kind:e.kind,provider:e.provider,sourceEntityId:e.sourceEntityId,confidence:e.entityMatch?.confidence})),
              resourceUsage:artifact.resourceUsage,navigations:navigations.slice(navigationStart)}));
          }
          if(accepted){
            assert.equal(view.case.phase,"PRESENT_RESULTS",JSON.stringify(view));
            if(useJapanese)assert.equal(view.restaurant.availabilityChecks[view.restaurant.candidates[0]!.restaurant.id]?.sourceProvider,"TABELOG");
            assert.equal(handoffs.length,1,"ordinary startup assembly must supply the source reader without a test-prepared handoff");
            assert.equal(handoffs[0]!.url,original,"original bytes/order/encoding must survive, with only the source origin for a relative URL");
            assert.equal(handoffs[0]!.directLabel,"Book on Tabelog");
            assert.equal(handoffs[0]!.sourceSelection,"UNKNOWN");
            last=view;
            if(label === "original" && process.env.PRAXIS_B1_UI_SNAPSHOT === "1") console.log("B1_G3_HTTP_VIEW " + Buffer.from(JSON.stringify(view)).toString("base64"));
            if(useJapanese){
              assert.deepEqual(navigations.slice(navigationStart).filter(url=>url.includes("rstLst")).map(url=>new URL(url).searchParams.get("sw")),["Fixture Sushi Tokyo","Fixture Sushi","すし本店"]);
              assert.equal(japaneseLookups,1,"one same-ID source name, after both earlier terms fail");
              const artifact=await running.application.exportReadArtifact(created.case.caseId);
              assert.equal((artifact.resourceUsage as {googleRequests?:{placeDetails:number}}).googleRequests?.placeDetails,1,"the source-name Details request appears in the ordinary run artifact");
            }
          }else assert.equal(handoffs.length,0,"mismatched or unsupported link must hide the button");
        }finally{unsubscribe();}
      });
      assert.ok(last);
      const stranger=await login(running.baseUrl,"token-b");
      assert.equal((await api(running.baseUrl,stranger,"/api/cases/"+encodeURIComponent(last.case.caseId))).response.status,404);
      const before=opens;
      const current=(await api(running.baseUrl,cookie,"/api/cases/"+encodeURIComponent(last.case.caseId))).payload.view as RestaurantCaseView;
      assert.equal(current.restaurant.bookingHandoffs?.[0]?.url,original,"other Cases with identical clocks/evidence IDs cannot replace this Case cache");
      const freshAssembly=createLiveReadAssembly({...readLimits,packs:[googlePlacesDiscoveryPack]}, {google,browser:fixtureGetRuntime(browser),model,clock,currentTaskId:()=>model.currentTaskId()});
      await running.close();
      running=await startServer(database,clock,{model,modelRunBudget:model,readAssembly:freshAssembly,mode:"LIVE_READ"});
      const restarted=(await api(running.baseUrl,cookie,"/api/cases/"+encodeURIComponent(last.case.caseId))).payload.view as RestaurantCaseView;
      assert.deepEqual(restarted.restaurant.bookingHandoffs,[],"a new process cache cannot reconstruct a lost source URL from the offer");
      assert.ok(Object.values(restarted.restaurant.availability).some(items=>items.length),"restart control retains fresh authoritative availability");
      assert.equal(opens,before,"restart/projection never triggers a new source read");
      clock.advance(600_000);
      const stale=(await api(running.baseUrl,cookie,"/api/cases/"+encodeURIComponent(last.case.caseId))).payload.view as RestaurantCaseView;
      assert.deepEqual(stale.restaurant.bookingHandoffs,[]);
      assert.equal(opens,before,"projection/expiry may not open or re-read a source");
      assert.ok(navigations.length>0);
    }finally{await running.application.stopActiveReads();await running.close();}
  });
});
