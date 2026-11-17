import { GooglePlacesPhotos } from "../integrations/restaurant-photos/google-photos.js";
import { withBookingHandoffs } from "../application/restaurant-booking-handoff.js";
import { workspaceViewContext } from "../application/agent-workspace.js";
import { readFile } from "node:fs/promises";
import type { PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";
import { DeliveryReservedModelGateway } from "../application/delivery-reserved-model-gateway.js";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolve } from "node:path";

import {
  PersistentRestaurantAgentApplication,
  PilotSessionService,
  StaleTaskVersionError,
  WorkspaceAuthenticationError,
  WorkspaceCaseNotFoundError,
  type PilotAccessEntry,
} from "../application/persistent-restaurant-agent.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } from "../application/live-read-investigation-budget.js";
import { RunBoundedModelGateway } from "../application/run-bounded-model-gateway.js";
import type { RestaurantCaseView } from "../application/agent-workspace.js";
import { RestaurantSemanticInterpreter } from "../domains/restaurant/semantic-interpreter.js";
import { RestaurantAgentDecision } from "../domains/restaurant/agent-decision.js";
import { RestaurantPartySizeSupplementResolver } from "../domains/restaurant/party-size-supplement-resolver.js";
import { FixtureModelGateway } from "../infrastructure/fixture/fixture-model-gateway.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";
import { DeepSeekModelGateway } from "../infrastructure/deepseek/deepseek-model-gateway.js";
import { browserRuntimeFromEnvironment } from "../infrastructure/browser/browser-runtime-factory.js";
import { GooglePlacesClient } from "../integrations/google/google-places-client.js";
import { createLiveReadAssembly } from "../integrations/restaurant-search/live-read-assembly.js";
import { applyPostgresMigrations } from "../infrastructure/postgres/migrations.js";
import { NodePostgresDatabase } from "../infrastructure/postgres/node-postgres-database.js";
import { LOCAL_WORKSPACE_PAGE } from "../web/local-workspace-page.js";
import { persistWebReadArtifact } from "../eval/restaurant/agent-loop/web-read-artifact.js";

const MAX_BODY_BYTES = 16 * 1024;
const SESSION_COOKIE = "praxis_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);

export const DEFAULT_FIXTURE_PILOT_ACCESS: PilotAccessEntry[] = [
  { accessToken: "praxis-fixture-a", id: "pilot-a", displayName: "Pilot A" },
];

export type LocalRestaurantProviderMode = "FIXTURE" | "LIVE_READ";

/** The local workspace is persistent; reject a copied provider URL before migrations touch it. */
export function localPostgresConnectionString(environment: NodeJS.ProcessEnv = process.env): string {
  const value = environment.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is required for the local persistent workspace");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL for the local persistent workspace");
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use postgresql:// (not an API or browser URL) for the local persistent workspace");
  }
  if (!url.hostname || !url.pathname || url.pathname === "/") {
    throw new Error("DATABASE_URL must name a PostgreSQL host and database for the local persistent workspace");
  }
  return value;
}

/** Explicit mode selection prevents a broken Live configuration from displaying fixture cards. */
export function localRestaurantProviderMode(environment: NodeJS.ProcessEnv = process.env): LocalRestaurantProviderMode {
  const configured = environment.PRAXIS_RESTAURANT_PROVIDER_MODE ?? "FIXTURE";
  if (configured === "FIXTURE" || configured === "LIVE_READ") return configured;
  throw new Error("PRAXIS_RESTAURANT_PROVIDER_MODE must be FIXTURE or LIVE_READ");
}

/** Live mode must fail at startup rather than render Fixture data under a Live label. */
export function assertLocalLiveReadEnvironment(environment: NodeJS.ProcessEnv): void {
  const gates = ["PRAXIS_ALLOW_LIVE_RESTAURANT_READ", "PRAXIS_ALLOW_BROWSER_RUN"] as const;
  for (const gate of gates) {
    if (environment[gate] !== "1") throw new Error(`Set ${gate}=1 before starting the local Live read-only workspace`);
  }
  for (const key of ["DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "GOOGLE_MAPS_API_KEY"] as const) {
    if (!environment[key]?.trim()) throw new Error(`${key} is required for PRAXIS_RESTAURANT_PROVIDER_MODE=LIVE_READ`);
  }
  if (environment.PRAXIS_BROWSER_ENGINE !== "LOCAL_CHROMIUM") {
    for (const key of ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"] as const) {
      if (!environment[key]?.trim()) throw new Error(`${key} is required unless PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`);
    }
  }
}

class CaseEventHub {
  private readonly subscribers = new Map<string, Set<(view: RestaurantCaseView) => void>>();

  subscribe(caseId: string, subscriber: (view: RestaurantCaseView) => void): () => void {
    const group = this.subscribers.get(caseId) ?? new Set();
    group.add(subscriber);
    this.subscribers.set(caseId, group);
    return () => {
      group.delete(subscriber);
      if (group.size === 0) this.subscribers.delete(caseId);
    };
  }

  publish(view: RestaurantCaseView): void {
    this.subscribers.get(view.case.caseId)?.forEach((subscriber) => subscriber(view));
  }
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown, headers = {}): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large");
    chunks.push(buffer);
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function requireString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value.trim();
}

function requireVersion(input: Record<string, unknown>): number {
  const value = input.taskVersion;
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error("taskVersion must be a non-negative integer");
  }
  return value as number;
}

function requireFiniteNumber(input: Record<string, unknown>, key: string): number {
  const value = input[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${key} must be a finite number`);
  return value;
}

function requireBoolean(input: Record<string, unknown>, key: string): boolean {
  if (typeof input[key] !== "boolean") throw new Error(`${key} must be a boolean`);
  return input[key] as boolean;
}

function cookies(request: IncomingMessage): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    result.set(part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim()));
  }
  return result;
}

function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function writeCaseEvent(response: ServerResponse, view: RestaurantCaseView): void {
  response.write(`id: ${view.case.taskVersion}\nevent: case\ndata: ${JSON.stringify(view)}\n\n`);
}

function errorStatus(error: unknown): number {
  if (error instanceof WorkspaceAuthenticationError) return 401;
  if (error instanceof WorkspaceCaseNotFoundError) return 404;
  if (error instanceof StaleTaskVersionError) return 409;
  return 400;
}

export interface LocalWebServerOptions {
  application: PersistentRestaurantAgentApplication;
  sessions: PilotSessionService;
  /** Optional diagnostic root. Omitting it keeps the server usable without filesystem output. */
  artifactDirectory?: string;
  /** The same production read assembly used by the persistent application. */
  readAssembly?: Pick<ReturnType<typeof createLiveReadAssembly>, "bookingHandoffs" | "photos">;
  /** Explicit cache-only reader for isolated composition controls. */
  bookingHandoffs?: {
    readPrepared(view: RestaurantCaseView): readonly PreparedBookingHandoff[];
    now(): string;
  };
}

export function createLocalWebServer(options: LocalWebServerOptions): Server {
  const photos = options.readAssembly?.photos;
  const bookingHandoffs = options.bookingHandoffs ?? options.readAssembly?.bookingHandoffs;
  const project = (view: RestaurantCaseView): RestaurantCaseView => bookingHandoffs
    ? withBookingHandoffs(view, bookingHandoffs.readPrepared(view), bookingHandoffs.now()) : view;
  const json = (response: ServerResponse, status: number, payload: Record<string, unknown>, headers = {}): void => {
    sendJson(response, status, payload.view ? {...payload, view: project(payload.view as RestaurantCaseView)} : payload, headers);
  };
  const emitCase = (response: ServerResponse, view: RestaurantCaseView): void => writeCaseEvent(response, project(view));
  const hub = new CaseEventHub();
  const unsubscribeUpdates = options.application.subscribeCaseUpdates((view) => hub.publish(view));
  const writtenArtifacts = new Set<string>();
  const unsubscribeReadFinished = options.application.subscribeReadFinished(async (caseId) => {
    if (!options.artifactDirectory) return;
    const artifact = await options.application.exportReadArtifact(caseId);
    const version = (artifact.finalSnapshot as { version?: number }).version ?? "unknown";
    const key = `${caseId}:${version}`;
    if (writtenArtifacts.has(key)) return;
    await persistWebReadArtifact(options.artifactDirectory, artifact);
    writtenArtifacts.add(key);
  });
  const server = createServer(async (request, response) => {
    try {
      const method = request.method ?? "GET";
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const fontFiles: Record<string,string> = {
        "/assets/dm-sans.woff2":"dm-sans/files/dm-sans-latin-wght-normal.woff2",
      };
      if (method === "GET" && fontFiles[url.pathname]) {
        const font = await readFile(new URL("../../node_modules/@fontsource-variable/" + fontFiles[url.pathname], import.meta.url));
        response.writeHead(200, {"content-type":"font/woff2", "cache-control":"public, max-age=3600"}); response.end(font); return;
      }
      if (method === "GET" && url.pathname === "/") {
        response.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'",
          "x-content-type-options": "nosniff",
        });
        response.end(LOCAL_WORKSPACE_PAGE);
        return;
      }
      if (method === "POST" && url.pathname === "/api/session") {
        const body = await readJson(request);
        const login = await options.sessions.login(requireString(body, "accessToken"));
        json(response, 201, { user: login.user }, { "set-cookie": sessionCookie(login.sessionToken) });
        return;
      }
      if (method === "DELETE" && url.pathname === "/api/session") {
        json(response, 200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
        return;
      }

      const user = await options.sessions.authenticate(cookies(request).get(SESSION_COOKIE));
      if (!user) throw new WorkspaceAuthenticationError();

      if (method === "GET" && url.pathname === "/api/session") {
        json(response, 200, { user });
        return;
      }
      if (method === "GET" && url.pathname === "/api/cases") {
        json(response, 200, { cases: await options.application.listCases(user.id) });
        return;
      }
      if (method === "POST" && url.pathname === "/api/cases") {
        const body = await readJson(request);
        const context = workspaceViewContext(body.viewContext);
        if (context.view !== "HOME" || context.candidateId || context.comparedCandidateIds.length) throw new Error("New plans require home view context");
        const view = await options.application.createCase(
          user.id,
          requireString(body, "message"),
          requireString(body, "requestId"),
        );
        hub.publish(view);
        json(response, 201, { view });
        return;
      }
      const caseMatch = /^\/api\/cases\/([^/]+)$/.exec(url.pathname);
      const photosMatch = /^\/api\/cases\/([^/]+)\/candidates\/([^/]+)\/photos(?:\/([a-f0-9]{32})\/content)?$/.exec(url.pathname);
      if (method === "GET" && photosMatch) {
        const view = await options.application.getCase(user.id, decodeURIComponent(photosMatch[1]!));
        const candidateId = decodeURIComponent(photosMatch[2]!);
        if (!view.restaurant.candidates.some(item => item.restaurant.id === candidateId)) { json(response,404,{error:"Not found"}); return; }
        const allowedKeys = photosMatch[3] ? [] : ["scope"];
        if ([...url.searchParams.keys()].some(key => !allowedKeys.includes(key)) || url.searchParams.getAll("scope").length > 1) { json(response,400,{error:"Invalid photo request"}); return; }
        const scope = url.searchParams.get("scope") ?? "cover";
        if (!photosMatch[3] && scope !== "cover" && scope !== "gallery") { json(response,400,{error:"Invalid photo scope"}); return; }
        const controller = new AbortController();
        response.on("close", () => { if (!response.writableEnded) controller.abort(); });
        if (photosMatch[3]) {
          try {
            const image = await photos?.content(view,candidateId,photosMatch[3],controller.signal);
            if (!image) { json(response,410,{error:"Photo unavailable"}); return; }
            response.writeHead(200,{"content-type":image.contentType,"cache-control":"private, no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'","content-length":String(image.body.byteLength)});
            response.end(image.body);
          } catch { if (!response.destroyed) json(response,410,{error:"Photo unavailable"}); }
        } else {
          const result = photos ? await photos.read(view,candidateId,scope as "cover"|"gallery",controller.signal,typeof request.headers["x-praxis-failed-photo"]==="string"&&/^[a-f0-9]{32}$/.test(request.headers["x-praxis-failed-photo"])?request.headers["x-praxis-failed-photo"]:undefined)
            : {candidateId,status:"EMPTY",photos:[],expiresAt:new Date(Date.now()+600_000).toISOString()};
          json(response,200,{...result},{"cache-control":"private, no-store"});
        }
        return;
      }
      if (method === "GET" && caseMatch) {
        json(response, 200, {
          view: await options.application.getCase(user.id, decodeURIComponent(caseMatch[1]!)),
        });
        return;
      }
      const departureMatch = /^\/api\/cases\/([^/]+)\/booking-departures$/.exec(url.pathname);
      if (method === "POST" && departureMatch) {
        const body=await readJson(request);
        if(Object.keys(body).some(key=>!["candidateId","offerId","requestId","taskVersion"].includes(key)))throw new Error("Departure request has unexpected fields");
        const caseId=decodeURIComponent(departureMatch[1]!);
        const view=project(await options.application.getCase(user.id,caseId));
        if(view.case.taskVersion!==requireVersion(body))throw new StaleTaskVersionError(requireVersion(body),view.case.taskVersion);
        const candidateId=requireString(body,"candidateId"),offerId=requireString(body,"offerId");
        const handoff=view.restaurant.bookingHandoffs?.find(item=>item.candidateId===candidateId&&item.offerId===offerId);
        if(!handoff)throw new Error("No current verified source handoff");
        const departure=await options.application.recordBookingDeparture({userId:user.id,caseId,expectedVersion:view.case.taskVersion,requestId:requireString(body,"requestId"),handoff});
        json(response,201,{departure,url:handoff.url});return;
      }
      const feedbackMatch = /^\/api\/cases\/([^/]+)\/booking-feedback(?:\/(claim))?$/.exec(url.pathname);
      if(method==="POST"&&feedbackMatch){
        const body=await readJson(request),caseId=decodeURIComponent(feedbackMatch[1]!);
        if(feedbackMatch[2]){
          if(Object.keys(body).length)throw new Error("Prompt claim accepts no extra data");
          const prompt=await options.application.claimBookingFeedback(user.id,caseId);
          json(response,200,{prompt:prompt??null});return;
        }
        if(Object.keys(body).some(key=>!["departureId","answer"].includes(key)))throw new Error("Feedback accepts only departure ID and Yes/No/Skip");
        const answer=requireString(body,"answer");
        if(answer!=="YES"&&answer!=="NO"&&answer!=="SKIP")throw new Error("Feedback must be Yes, No or Skip");
        const departure=await options.application.answerBookingFeedback({userId:user.id,caseId,departureId:requireString(body,"departureId"),answer});
        json(response,200,{departure});return;
      }
      const refreshMatch = /^\/api\/cases\/([^/]+)\/refresh$/.exec(url.pathname);
      if (method === "POST" && refreshMatch) {
        const body = await readJson(request);
        const view = await options.application.refreshAvailability({
          userId: user.id,
          caseId: decodeURIComponent(refreshMatch[1]!),
          requestId: requireString(body, "requestId"),
          expectedVersion: requireVersion(body),
        });
        hub.publish(view);
        json(response, 200, { view });
        return;
      }
      const questionMatch = /^\/api\/cases\/([^/]+)\/questions$/.exec(url.pathname);
      if (method === "POST" && questionMatch) {
        const body = await readJson(request);
        if (Object.keys(body).some(key => !["candidateId","question","requestId","taskVersion"].includes(key))) throw new Error("Question request has unexpected fields");
        const view = await options.application.askRestaurantQuestion({userId:user.id,caseId:decodeURIComponent(questionMatch[1]!),
          candidateId:requireString(body,"candidateId"),question:requireString(body,"question"),requestId:requireString(body,"requestId"),expectedVersion:requireVersion(body)});
        hub.publish(view);json(response,200,{view});return;
      }
      const browseNextMatch = /^\/api\/cases\/([^/]+)\/browse-next$/.exec(url.pathname);
      if (method === "POST" && browseNextMatch) {
        const body = await readJson(request);
        const view = await options.application.browseNextResult({
          userId: user.id,
          caseId: decodeURIComponent(browseNextMatch[1]!),
          requestId: requireString(body, "requestId"),
          expectedVersion: requireVersion(body),
        });
        hub.publish(view); json(response, 200, { view }); return;
      }
      const anotherBatchMatch = /^\/api\/cases\/([^/]+)\/another-batch$/.exec(url.pathname);
      if (method === "POST" && anotherBatchMatch) {
        const body = await readJson(request);
        const view = await options.application.requestAnotherBatch({
          userId: user.id,
          caseId: decodeURIComponent(anotherBatchMatch[1]!),
          requestId: requireString(body, "requestId"),
          expectedVersion: requireVersion(body),
        });
        hub.publish(view); json(response, 200, { view }); return;
      }
      const shortlistMatch = /^\/api\/cases\/([^/]+)\/shortlist$/.exec(url.pathname);
      if (method === "POST" && shortlistMatch) {
        const body = await readJson(request);
        const view = await options.application.setShortlist({
          userId: user.id,
          caseId: decodeURIComponent(shortlistMatch[1]!),
          candidateId: requireString(body, "candidateId"),
          shortlisted: requireBoolean(body, "shortlisted"),
          requestId: requireString(body, "requestId"),
          expectedVersion: requireVersion(body),
        });
        hub.publish(view); json(response, 200, { view }); return;
      }
      const cancelMatch = /^\/api\/cases\/([^/]+)\/run$/.exec(url.pathname);
      if (method === "DELETE" && cancelMatch) {
        const view = await options.application.cancelCase(user.id, decodeURIComponent(cancelMatch[1]!));
        hub.publish(view);
        json(response, 200, { view });
        return;
      }
      const locationMatch = /^\/api\/cases\/([^/]+)\/location$/.exec(url.pathname);
      if (method === "POST" && locationMatch) {
        const body = await readJson(request);
        const view = await options.application.recordLocation({ userId: user.id, caseId: decodeURIComponent(locationMatch[1]!), requestId: requireString(body, "requestId"), expectedVersion: requireVersion(body), latitude: requireFiniteNumber(body, "latitude"), longitude: requireFiniteNumber(body, "longitude"), ...(typeof body.accuracyMeters === "number" ? { accuracyMeters: body.accuracyMeters } : {}) });
        hub.publish(view); json(response, 200, { view }); return;
      }
      const messageMatch = /^\/api\/conversations\/([^/]+)\/messages$/.exec(url.pathname);
      if (method === "POST" && messageMatch) {
        const body = await readJson(request);
        const view = await options.application.submitMessage({
          userId: user.id,
          conversationId: decodeURIComponent(messageMatch[1]!),
          message: requireString(body, "message"),
          requestId: requireString(body, "requestId"),
          expectedVersion: requireVersion(body),
          viewContext: workspaceViewContext(body.viewContext),
        });
        hub.publish(view);
        json(response, 200, { view });
        return;
      }
      const eventMatch = /^\/api\/cases\/([^/]+)\/events$/.exec(url.pathname);
      if (method === "GET" && eventMatch) {
        const caseId = decodeURIComponent(eventMatch[1]!);
        const view = await options.application.getCase(user.id, caseId);
        response.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        });
        emitCase(response, view);
        const unsubscribe = hub.subscribe(caseId, (updated) => emitCase(response, updated));
        const heartbeat = setInterval(() => response.write(": keep-alive\n\n"), 15_000);
        request.on("close", () => {
          clearInterval(heartbeat);
          unsubscribe();
        });
        return;
      }
      json(response, 404, { error: "Not found" });
    } catch (error) {
      if (!response.headersSent) {
        json(response, errorStatus(error), {
          error: error instanceof Error ? error.message : "Request failed",
        });
      } else {
        response.end();
      }
    }
  });
  server.once("close", () => {
    unsubscribeUpdates();
    unsubscribeReadFinished();
  });
  return server;
}

function pilotEntriesFromEnvironment(): PilotAccessEntry[] {
  const encoded = process.env.PRAXIS_PILOT_ACCESS_JSON;
  if (!encoded) return DEFAULT_FIXTURE_PILOT_ACCESS;
  const value: unknown = JSON.parse(encoded);
  if (!Array.isArray(value)) throw new Error("PRAXIS_PILOT_ACCESS_JSON must be an array");
  return value.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Pilot access entry ${index} must be an object`);
    }
    const record = entry as Record<string, unknown>;
    return {
      accessToken: requireString(record, "accessToken"),
      id: requireString(record, "id"),
      displayName: requireString(record, "displayName"),
    };
  });
}

async function start(): Promise<void> {
  const connectionString = localPostgresConnectionString();
  const database = new NodePostgresDatabase({ connectionString });
  await applyPostgresMigrations(database);
  const providerMode = localRestaurantProviderMode();
  const fixtureMode = providerMode === "FIXTURE";
  const fixtureSearch = fixtureMode ? new FixtureRestaurantSearch() : undefined;
  if (!fixtureMode) assertLocalLiveReadEnvironment(process.env);
  const providerModel = fixtureMode ? new FixtureModelGateway() : DeepSeekModelGateway.fromEnvironment();
  // The wrapper scope begins in PersistentRestaurantAgentApplication before
  // semantic interpretation and propagates through its async read lifecycle.
  const countedModel = fixtureMode ? providerModel : new RunBoundedModelGateway(providerModel, LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxModelCalls, LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxAutomaticBrowserMs);
  const modelRunBudget = fixtureMode ? undefined : countedModel as RunBoundedModelGateway;
  const model = new DeliveryReservedModelGateway(countedModel);
  const readAssembly = fixtureMode ? undefined : createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET, {
    model, clock: { now: () => new Date() },
    googlePhotos: new GooglePlacesPhotos({apiKey:process.env.GOOGLE_MAPS_API_KEY??"",proxyServer:process.env.PRAXIS_GOOGLE_API_PROXY_SERVER}),
    google: new GooglePlacesClient({
      apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      proxyServer: process.env.PRAXIS_GOOGLE_API_PROXY_SERVER,
      timeoutMs: LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxStructuredReadMs,
    }),
    browser: browserRuntimeFromEnvironment(),
    ...(modelRunBudget?.remainingCalls ? { remainingModelCalls: (taskId: string) => modelRunBudget.remainingCalls(taskId) } : {}),
    ...(modelRunBudget ? { currentTaskId: () => modelRunBudget.currentTaskId() } : {}),
  });
  const restaurantSearch = fixtureSearch ?? readAssembly!.search;
  const restaurantAvailability = fixtureSearch ?? readAssembly!.availability;
  const application = new PersistentRestaurantAgentApplication({
    database,
    semanticInterpreter: new RestaurantSemanticInterpreter(model),
    partySizeSupplementResolver: new RestaurantPartySizeSupplementResolver(model),
    agentDecision: new RestaurantAgentDecision(model),
    restaurantSearch,
    restaurantAvailability,
    restaurantFacts: fixtureSearch ?? readAssembly!.facts,
    ...(readAssembly ? {restaurantQuestions:readAssembly.questions} : {}),
    executionRouterOptions: readAssembly?.router ?? { structuredReadTimeoutMs: LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxStructuredReadMs, browserReadTimeoutMs: LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxAutomaticBrowserMs },
    agentLoopOptions: readAssembly?.loop ?? { maxSteps: LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxAgentSteps, maxRejectedActions: LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxRejectedActions, timeoutMs: LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxAutomaticBrowserMs },
    workspaceMode: providerMode,
    ...(fixtureMode ? {} : {
      liveReadLimits: readAssembly!.runCeilings,
      ...(modelRunBudget ? { modelRunBudget } : {}),
    }),
  });
  const sessions = new PilotSessionService(application.store, pilotEntriesFromEnvironment(), {
    now: () => new Date(),
  });
  const server = createLocalWebServer({
    application,
    sessions,
    artifactDirectory: resolve(".eval-artifacts", "restaurant-web-read"),
    ...(readAssembly ? { readAssembly } : {}),
  });
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Praxis ${providerMode === "FIXTURE" ? "fixture" : "Live read-only"} workspace is running at http://127.0.0.1:${PORT}`);
  });
  const shutdown = () => {
    void application.stopActiveReads().finally(() => server.close(() => void database.close()));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  void start().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
