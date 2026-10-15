import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import type { BrowserReadNetworkObservation } from "../../../infrastructure/browser/browser-runtime.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import { RestaurantExecutionRouter } from "../../../application/restaurant-execution-router.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../integrations/restaurant-availability/live-browser-availability.js";
import { createLiveReadAssembly } from "../../../integrations/restaurant-search/live-read-assembly.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } from "../../../application/live-read-investigation-budget.js";
import { NativeRestaurantSearch } from "../../../integrations/restaurant-search/native-restaurant-search.js";
import { restaurantDiscoveryPacks, tableCheckDiscoveryPack, tabelogDiscoveryPack, type DiscoverySourcePack } from "../../../integrations/restaurant-search/source-packs.js";
import { restaurantSearchIntentFingerprint, type RestaurantTaskState } from "../../../domains/restaurant/contracts.js";
import { createHybridReadComposition } from "./hybrid-read-composition.js";
import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "./live-case-materializer.js";
import { ModelGatewayError } from "../../../core/model/errors.js";
import { createHybridDecisionCapture } from "./runners/run-hybrid-live-read.js";
import { BrowserReadRecording } from "./runners/browser-read-recording.js";
import { traceBrowserSession } from "./runners/browser-case-slice-evidence.js";

import { center, date, reference, sourcePages, type SourceScenario } from "./native-fixed-source-pages.js";

function reply(outputText: string, purpose: string): ModelResponse {
  return { invocationId: purpose, provider: "FIXTURE", model: "scripted-boundary", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

function action(type: string, candidateIds: string[] = []) {
  return { type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "Use current evidence" };
}

class H001NativeModel implements ModelGateway {
  readonly purposes: string[] = [];
  readonly requests: ModelRequest[] = [];
  private failedCaptureCall = false;
  retrievalFillUsed = false;
  readonly discoveryActions: string[] = [];
  readonly browserDecisionInputs: Array<{
    objective: string;
    progress: string;
    observation: { pageActions?: string[]; targets: Array<{ ref: string; label: string; availableActions?: string[] }> };
    skillSource?: string;
  }> = [];
  private searches = 0;
  private earlyEndAttempted = false;
  private earlyPartialAttempted = false;
  constructor(private readonly scenario: SourceScenario, private readonly availabilityFirst = false, private readonly areaQuery = "Shibuya", private readonly failSecondBrowserCall = false) {}
  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.purposes.push(request.purpose);
    this.requests.push(structuredClone(request));
    if (this.failSecondBrowserCall && request.purpose === "browser_read_decide" && !this.failedCaptureCall && this.purposes.filter(purpose => purpose === "browser_read_decide").length === 2) {
      this.failedCaptureCall = true;
      throw new ModelGatewayError("Deliberate offline timeout", "TIMEOUT", true);
    }
    if (this.purposes.length > 50) throw new Error("H001 shared 50-call model ceiling exceeded");
    if (request.purpose === "restaurant_semantic_interpret") return reply(JSON.stringify({ schemaVersion: "3", facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase spot", selectionScope: "OPEN_ENDED" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: `near ${this.areaQuery}` } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: date, raw: "tonight" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", strength: "HARD", polarity: "POSITIVE" } },
    ] }), request.purpose);
    if (request.purpose === "restaurant_fact_judgment") {
      const input = JSON.parse(request.messages.find((item) => item.role === "user")!.content) as {
        sourceDocuments: Array<{ id: string; statements: Array<{ id: string; text: string }> }>;
      };
      const selected = input.sourceDocuments.flatMap((document) => document.statements
        .filter((item) => /omakase course/i.test(item.text)).map((item) => ({ documentId: document.id, statementIds: [item.id] })))[0];
      return reply(JSON.stringify({ sourceSelections: selected ? [selected] : [], judgments: selected ? [{
        criterion: "omakase", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: [selected.documentId],
      }] : [] }), request.purpose);
    }
    if (request.purpose === "browser_read_decide") {
      const input = JSON.parse(request.messages.find((item) => item.role === "user")!.content) as {
        objective: string;
        progress: string;
        observation: { visibleText?: string; pageActions?: string[]; targets: Array<{ ref: string; label: string; availableActions?: string[] }> };
        skills?: { source?: string };
      };
      this.browserDecisionInputs.push({ objective: input.objective, progress: input.progress, observation: { targets: input.observation.targets, ...(input.observation.pageActions ? { pageActions: input.observation.pageActions } : {}) }, ...(input.skills?.source ? { skillSource: input.skills.source } : {}) });
      if (input.objective.includes("observed public region/station")) {
        const region = input.observation.targets.find(target => target.availableActions?.includes("OPEN_LINK") && (target.label === this.areaQuery || target.label === `Restaurants in ${this.areaQuery}`));
        if (region) return reply(JSON.stringify({action:"OPEN_LINK",targetRef:region.ref,authoritativeField:"NONE",requestedState:"NONE",reason:"Choose the observed region for the unchanged location."}),request.purpose);
      }

      if (["TABELOG_RETRIEVAL_CATEGORY_DELIVERS", "TABELOG_RESULT_PAGES_CONTINUE", "TABELOG_CATEGORY_REDIRECTS_ROOT"].includes(this.scenario) && input.objective.includes("related category")) {
        const link = input.observation.targets.find((target) => /^(?:Sushi|omakase ×)$/.test(target.label) && target.availableActions?.includes("OPEN_LINK"));
        if (link) return reply(JSON.stringify({ action: "OPEN_LINK", targetRef: link.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Use a related source category for discovery; retain the HARD fact requirement." }), request.purpose);
      }
      const retrieval = input.observation.visibleText?.includes("Loading current search") ? undefined
        : input.observation.targets.find((target) => /search|venue/i.test(target.label) && target.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL"));
      const menu = input.observation.targets.find((target) => /menu|course/i.test(target.label) && target.availableActions?.includes("OPEN_LINK"));
      const category = this.scenario === "TABLECHECK_SCOPED_MENU_DELIVERS"
        ? input.observation.targets.find((target) => target.label === "Sushi" && target.availableActions?.includes("SET_CHECKED"))
        : undefined;
      const reveal = input.observation.targets.find((target) => target.label === "Show public venues");
      const availabilityReveal = input.observation.targets.find((target) => /^Show availability(?: \d+)?$/.test(target.label));
      const loadingRegion = /Loading\s+(?:current\s+)?availability/i.test(input.observation.visibleText ?? "")
        && input.observation.pageActions?.includes("WAIT");
      return reply(JSON.stringify(retrieval
        ? (this.retrievalFillUsed = true, this.discoveryActions.push("FILL_AUTHORITATIVE"), { action: "FILL_AUTHORITATIVE", targetRef: retrieval.ref, authoritativeField: "RETRIEVAL", requestedState: "NONE", reason: "Apply the bounded public venue search expression." })
        : menu
        ? { action: "OPEN_LINK", targetRef: menu.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Read the observed public menu page for the missing HARD criterion." }
        : category
        ? { action: "SET_CHECKED", targetRef: category.ref, authoritativeField: "NONE", requestedState: "CHECKED", reason: "Read the permitted public service category and re-observe its current result." }
        : reveal
        ? (this.discoveryActions.push("CLICK"), { action: "CLICK", targetRef: reveal.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Reveal the observed public venue results." })
        : availabilityReveal
        ? { action: "CLICK", targetRef: availabilityReveal.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Reveal the observed public availability result." }
        : loadingRegion
        ? { action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "Wait only for the visible current availability result." }
        : { action: "REQUEST_HUMAN_HELP", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "No safe observed discovery action remains." },
      ), request.purpose);
    }
    if (request.purpose === "restaurant_agent_decide") {
      const input = JSON.parse(request.messages.find((item) => item.role === "user")!.content) as { context: {
        candidates?: Array<{ id: string }>; searchAvailability?: { available: boolean };
        factInvestigableCandidateIds?: string[]; checkableCandidateIds?: string[];
        presentation?: Array<{ candidateId: string; eligible: boolean }>;
        readCompletion?: { allowed: boolean };
      } };
      const context = input.context;
      if (this.scenario === "EARLY_END_ATTEMPT" && this.searches === 1 && !this.earlyEndAttempted) {
        this.earlyEndAttempted = true;
        return reply(JSON.stringify(action("END_READ")), request.purpose);
      }
      const eligible = context.presentation?.filter((item) => item.eligible).map((item) => item.candidateId) ?? [];
      if (this.scenario === "TABLECHECK_EARLY_ACTIONS") {
        if (this.searches === 2 && !this.earlyEndAttempted) {
          this.earlyEndAttempted = true;
          return reply(JSON.stringify(action("END_READ")), request.purpose);
        }
        if (this.searches === 2 && eligible.length && !this.earlyPartialAttempted) {
          this.earlyPartialAttempted = true;
          return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
        }
        if (this.searches === 2 && !this.earlyPartialAttempted && context.factInvestigableCandidateIds?.length === 1
          && context.checkableCandidateIds?.length) {
          return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 1))), request.purpose);
        }
        if (context.factInvestigableCandidateIds?.length) return reply(JSON.stringify(action("INVESTIGATE_CANDIDATE_FACTS", context.factInvestigableCandidateIds.slice(0, 1))), request.purpose);
        if (context.checkableCandidateIds?.length) return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 1))), request.purpose);
        if (eligible.length) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
      }
      if (this.availabilityFirst && context.checkableCandidateIds?.length) {
        return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 1))), request.purpose);
      }
      if (context.factInvestigableCandidateIds?.length) return reply(JSON.stringify(action("INVESTIGATE_CANDIDATE_FACTS", context.factInvestigableCandidateIds.slice(0, 3))), request.purpose);
      if (context.checkableCandidateIds?.length) return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 3))), request.purpose);
      if (eligible.length >= 3) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible.slice(0, 3))), request.purpose);
      if (eligible.length && !context.searchAvailability?.available) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
      if (context.searchAvailability?.available) {
        this.searches += 1;
        return reply(JSON.stringify(action("SEARCH_RESTAURANTS")), request.purpose);
      }
      if (context.readCompletion?.allowed) return reply(JSON.stringify(action("END_READ")), request.purpose);
      throw new Error(`No legal scripted action: ${JSON.stringify(context)}`);
    }
    throw new Error(`Unexpected model purpose ${request.purpose}`);
  }
}

async function runScenario(scenario: SourceScenario, options: { postAvailabilityDiscovery?: boolean; availabilityFirst?: boolean; bareReserveLink?: boolean; guardedDiscoverySubmit?: boolean; packs?: readonly DiscoverySourcePack[]; areaQuery?: string; decisionCapture?: ReturnType<typeof createHybridDecisionCapture>; failSecondBrowserCall?: boolean; repeatCheckedAvailability?: boolean; unresolvedLocation?: boolean; advancingClock?: boolean } = {}) {
  const startedAt = Date.now();
  const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find((item) => item.id === "h001")!;
  const navigations: string[] = [];
  const networkRequests: BrowserReadNetworkObservation[] = [];
  const sessionsOpened: number[] = [];
  const navigationSessionIds: number[] = [];
  const closedSessionIds: number[] = [];
  const googleCalls: Array<{ query: string }> = [];
  const googleClient = new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async (_url, init) => {
    const query = JSON.parse(String(init?.body)) as { textQuery: string };
    googleCalls.push({ query: query.textQuery });
    const requested = options.areaQuery ?? "Shibuya";
    return new Response(JSON.stringify({ places: options.unresolvedLocation ? [] : [{ id: `${requested.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-landmark`, displayName: { text: requested },
      formattedAddress: `${requested}, Tokyo`, location: center, types: ["locality", "political"],
      addressComponents: [{ longText: requested, types: ["locality", "political"] }] }] }), { status: 200 });
  } });
  const model = new H001NativeModel(scenario, options.availabilityFirst, options.areaQuery, options.failSecondBrowserCall);
  const transport: ModelGateway = { complete: async request => {
    if (options.repeatCheckedAvailability && request.purpose === "restaurant_agent_decide") {
      const input = JSON.parse(request.messages.find(message => message.role === "user")!.content);
      const checked = Object.keys(input.context.availabilityChecks ?? {});
      if (checked.length) { model.purposes.push(request.purpose); model.requests.push(structuredClone(request));
        return reply(JSON.stringify(action("CHECK_AVAILABILITY", [checked[0]!])), request.purpose); }
    }
    return model.complete(request);
  } };
  const gateway: ModelGateway = options.decisionCapture
    ? { complete: request => options.decisionCapture!.complete(request, () => transport.complete(request)) } : transport;
  const rawBrowser = sourcePages(scenario, navigations, sessionsOpened, navigationSessionIds, closedSessionIds, {
    // This controlled source owns the same installed read boundary needed for
    // its public service-category query. Unguarded fixtures retain the narrow
    // action contract and cannot exercise Phase 1's wider query controls.
    availabilityRevealSteps: options.postAvailabilityDiscovery ? 13 : 1,
    guardedReadBoundary: options.postAvailabilityDiscovery === true || options.guardedDiscoverySubmit === true || scenario === "TABLECHECK_SCOPED_MENU_DELIVERS" || scenario === "TABLECHECK_DISCOVERY_RECOVERS",
    guardedQuerySubmit: options.guardedDiscoverySubmit === true,
    networkRequests,
    ...(options.bareReserveLink ? { bareReserveLink: true } : {}),
  });
  const browserTrace: Array<{ sequence: number; at: string; kind: string; detail: unknown }> = [];
  let browserTraceSequence = 0;
  const browser = { ...(rawBrowser.readNetworkBoundaryCapability ? { readNetworkBoundaryCapability: rawBrowser.readNetworkBoundaryCapability } : {}), openSession: async (input: { signal: AbortSignal }) => traceBrowserSession(
    await rawBrowser.openSession(input), "TABLECHECK", (kind, detail) => {
      const sequence = ++browserTraceSequence;
      browserTrace.push({ sequence, at: reference.toISOString(), kind, detail });
      return sequence;
    }, options.decisionCapture?.snapshotSink,
  ) };
  const native = createLiveReadAssembly({ ...LIVE_READ_DEBUG_INVESTIGATION_BUDGET, packs: options.packs ?? [tabelogDiscoveryPack, tableCheckDiscoveryPack] }, {
    google: googleClient, browser, model: gateway, clock: { now: () => reference },
    onBrowserDiagnostic: diagnostic => { browserTrace.push({ sequence: ++browserTraceSequence, at: reference.toISOString(), kind: "EXECUTOR_DIAGNOSTIC", detail: diagnostic }); },
  });
  const { availability, browserBudget, google } = native;
  let postAvailabilityDiscovery: unknown;
  let callsBeforeDiscovery = 0;
  const originalCheck = availability.check.bind(availability);
  availability.check = async (request, signal) => {
    const result = await originalCheck(request, signal);
    if (options.postAvailabilityDiscovery && browserBudget.totalModelCalls > 12 && !postAvailabilityDiscovery) {
      callsBeforeDiscovery = browserBudget.totalModelCalls;
      // Exercise the same composition and shared budget after actual source
      // actions; never seed or mutate the budget counter in this regression.
      try { postAvailabilityDiscovery = await native.search.search({ intent: composition.runtime.snapshot(taskId).domainState.intent! }, signal); }
      catch (error) { postAvailabilityDiscovery = { error: error instanceof Error ? error.message : String(error), code: (error as {code?: string}).code }; }
    }
    return result;
  };
  const taskId = `native-h001:${scenario}`;
  let clockTicks = 0;
  const composition = createHybridReadComposition({ taskId, runId: `run:${taskId}`, clock: { now: () => options.advancingClock ? new Date(reference.valueOf() + clockTicks++) : reference },
    model: gateway, ...native,
  });
  const semantic = await composition.interpretAndDispatch({ taskId, message: String(frozen.content),
    referenceTime: frozen.reference_time, timezone: "Asia/Tokyo" });
  const loop = await composition.coordinator.run(taskId);
  const snapshot = composition.runtime.snapshot(taskId);
  const readRunId = `${snapshot.runId}:investigation:${snapshot.domainState.investigationRevision}`;
  const decisionCaptureResult = await options.decisionCapture?.finish();
  const artifact = {
    schemaVersion: "1", mode: "SYNTHETIC_CONTROL", status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "h001", runId: snapshot.runId,
    ...(decisionCaptureResult ? { decisionCapture: decisionCaptureResult } : {}),
    diagnostics: { networkRequests },
    materializedCase: frozen, semantic, finalSnapshot: snapshot, trajectories: composition.trajectories.steps,
    events: composition.runtime.eventLog, loop, sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: "OFFLINE_FIXED_PAGES" },
    sourceTrace: { navigations, googleQueries: googleCalls.map((item) => item.query), browserTrace },
    runCeilings: native.runCeilings,
    resourceUsage: { elapsedMs: Date.now() - startedAt, agentDecisions: model.purposes.filter((item) => item === "restaurant_agent_decide").length,
      browserModelCalls: model.purposes.filter((item) => item === "browser_read_decide").length,
      modelCallsStarted: model.purposes.length, googleRequests: google.googleRequestUsage(readRunId) },
  };
  // The evaluator hashes the exact execution bytes that are retained for
  // independent replay; compact hashing while writing pretty JSON made the
  // recorded digest unverifiable from the saved artifact.
  const raw = JSON.stringify(artifact, null, 2);
  const executionPath = `${options.repeatCheckedAvailability ? "P1G-rejection-" : options.unresolvedLocation ? "P1G-unresolved-" : ""}${scenario}${options.availabilityFirst ? "-availability-first" : ""}${options.bareReserveLink ? "-bare-reserve-link" : ""}.execution.json`;
  if (process.env.PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS === "1") {
    const directory = resolve(".eval-artifacts", process.env.PRAXIS_NATIVE_STAGE2_ARTIFACT_DIR ?? "h001-native-stage2-20260929-review2-final");
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, executionPath), raw, { flag: "wx" });
  }
  const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: executionPath, sha256: createHash("sha256").update(raw).digest("hex") });
  if (process.env.PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS === "1") {
    const directory = resolve(".eval-artifacts", process.env.PRAXIS_NATIVE_STAGE2_ARTIFACT_DIR ?? "h001-native-stage2-20260929-review2-final");
    await writeFile(resolve(directory, executionPath.replace(".execution.json", ".evaluation.json")), JSON.stringify(evaluation, null, 2), { flag: "wx" });
  }
  return { postAvailabilityDiscovery, callsBeforeDiscovery, networkRequests, semantic, loop, state: snapshot.domainState, navigations, sessionsOpened, navigationSessionIds, closedSessionIds, googleCalls, model, evaluation, trajectories: composition.trajectories.steps, elapsedMs: Date.now() - startedAt, artifact };
}

test("H001 native first batch presents three source-bound Tabelog results without TableCheck", async () => {
  const result = await runScenario("TABELOG_DELIVERS", { packs: restaurantDiscoveryPacks });
  assert.equal(result.semantic.status, "PROPOSED");
  assert.equal(result.state.presentedResults?.candidateIds.length, 3, JSON.stringify({ phase: result.state.phase, failure: result.state.failure,
    candidates: result.state.candidates.map((item) => item.restaurant.id), checks: result.state.availabilityChecks,
    factChecks: result.state.factChecks, continuation: result.state.searchContinuation, navigations: result.navigations, purposes: result.model.purposes }));
  assert.equal(result.state.presentedResults?.candidateIds.every((id) => id.startsWith("tabelog:")), true);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.deepEqual(result.state.searchContinuation?.discoveryPlan?.entries.map((entry) => entry.sourceId), ["tabelog", "tablecheck", "google-places"], "the production composition retains the full three-pack plan while the first pack delivers");
  assert.equal(new Set(result.navigations.slice(0, 4).map((_url, index) => result.navigationSessionIds[index])).size, 1,
    "a healthy Tabelog list and its three details share one browser session");
  assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"]);
  assert.ok(result.state.readEvidence.some(item => item.kind === "DISCOVERY" && item.provider === "TABELOG" && Array.isArray(item.claims.sourceCategories) && item.claims.sourceCategories.includes("Sushi")));
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 native cited-menu follow-up carries source-bound HARD evidence to a current Tabelog result", async () => {
  const result = await runScenario("NATIVE_FACT_FOLLOWUP_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, facts: result.state.factChecks, availability: result.state.availabilityChecks, purposes: result.model.purposes, navigations: result.navigations }));
  assert.equal(result.navigations.some((url) => url.endsWith("/100/menu/")), true, "the native fact reader follows the observed same-source menu link before citing HARD evidence");
  assert.equal(result.model.purposes.filter((purpose) => purpose === "restaurant_fact_judgment").length, 2, "the cited judgment runs once per retained source document set");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 TableCheck reserve-menu scope reaches a synthetic-only current result without borrowing a sibling menu", async () => {
  const result = await runScenario("TABLECHECK_SCOPED_MENU_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, facts: result.state.factChecks, availability: result.state.availabilityChecks, purposes: result.model.purposes, browserInputs: result.model.browserDecisionInputs, navigations: result.navigations }));
  assert.ok(result.networkRequests.some(request => request.outcome === "ADMITTED" && request.pathname === "/en/shops/native-omakase-1/reserve"
    && request.method === "GET" && request.resourceType === "document" && request.queryKeys.join(",") === "pax,start_date"),
    "the same production Live Guard must admit the generated fixed-query document before this composition can deliver");
  assert.equal(result.navigations.some((url) => url === "https://www.tablecheck.com/en/native-omakase-1"), true, "the guide is read first and has no scoped menu text");
  assert.equal(result.navigations.some((url) => url.startsWith("https://www.tablecheck.com/en/shops/native-omakase-1/reserve")), true, "the scoped menu comes from the guide-observed same-outlet reserve entrance");
  assert.equal(result.model.purposes.filter((purpose) => purpose === "browser_read_decide").length >= 1, true, "the production executor selects the category and settles its result before another decision");
  const scopedFacts = result.state.readEvidence.filter((item) => item.kind === "RESTAURANT_FACT" && item.claims.serviceScopeValue === "sushi");
  assert.equal(scopedFacts.some((item) => Array.isArray(item.claims.verifiedHardCriteria) && item.claims.verifiedHardCriteria.includes("omakase")), true);
  const actions = result.trajectories.flatMap((step) => step.agentAction ? [step.agentAction.type] : []);
  assert.ok(actions.indexOf("INVESTIGATE_CANDIDATE_FACTS") < actions.indexOf("CHECK_AVAILABILITY"), `expected facts before availability, received ${actions.join(",")}`);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
  const rejected = await runScenario("TABLECHECK_SCOPED_MENU_DELIVERS", { bareReserveLink: true });
  assert.equal(rejected.state.phase, "NO_VERIFIED_RESULT", JSON.stringify(rejected.artifact));
  assert.equal(rejected.state.factChecks?.["tablecheck:native-omakase-1"]?.status, "UNKNOWN");
  assert.equal(rejected.state.presentedResults, undefined, "a bare reserve link cannot supply scoped HARD facts through the Live Guard");
  assert.ok(!rejected.navigations.some(url => new URL(url).pathname.endsWith("/reserve") && !new URL(url).search), "the Guard rejects a bare entry before the fixed source page can load");

});

test("H001 TableCheck reserve-menu scope can check availability before facts and exposes the service-radio prerequisite", async () => {
  const result = await runScenario("TABLECHECK_SCOPED_MENU_DELIVERS", { availabilityFirst: true });
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, facts: result.state.factChecks, availability: result.state.availabilityChecks, purposes: result.model.purposes }));
  assert.ok(result.networkRequests.some(request => request.outcome === "ADMITTED" && request.pathname === "/en/shops/native-omakase-1/reserve"
    && request.method === "GET" && request.resourceType === "document" && request.queryKeys.join(",") === "pax,start_date"),
    "the same production Live Guard must admit the generated fixed-query document before this composition can deliver");
  const categoryPrompt = result.model.browserDecisionInputs.find((input) => input.observation.targets.some((target) => target.label === "Sushi"));
  assert.ok(categoryPrompt, "the production browser executor sends a category decision input");
  assert.match(categoryPrompt.objective, /service-category radio/i);
  assert.match(categoryPrompt.progress, /no selected service category/i);
  assert.deepEqual(categoryPrompt.observation.targets.find((target) => target.label === "Sushi")?.availableActions, ["SET_CHECKED"]);
  const waitPrompt = result.model.browserDecisionInputs.find((input) => input.observation.pageActions?.includes("WAIT"));
  assert.ok(waitPrompt, "the loading result exposes canonical WAIT as a page action, never as a target capability");
  assert.equal(waitPrompt.observation.targets.some((target) => target.availableActions?.includes("WAIT")), false);
  const actions = result.trajectories.flatMap((step) => step.agentAction ? [step.agentAction.type] : []);
  assert.ok(actions.indexOf("CHECK_AVAILABILITY") < actions.indexOf("INVESTIGATE_CANDIDATE_FACTS"), `expected availability before facts, received ${actions.join(",")}`);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
  const rejected = await runScenario("TABLECHECK_SCOPED_MENU_DELIVERS", { bareReserveLink: true, availabilityFirst: true });
  assert.equal(rejected.state.phase, "NO_VERIFIED_RESULT", JSON.stringify(rejected.artifact));
  assert.equal(rejected.state.factChecks?.["tablecheck:native-omakase-1"]?.status, "UNKNOWN");
  assert.equal(rejected.state.presentedResults, undefined, "a bare reserve link cannot supply scoped HARD facts through the Live Guard");
  assert.ok(!rejected.navigations.some(url => new URL(url).pathname.endsWith("/reserve") && !new URL(url).search), "the Guard rejects a bare entry before the fixed source page can load");

});

test("H001 second native batch introduces its own TableCheck results after Tabelog cannot deliver", async () => {
  const result = await runScenario("TABLECHECK_RECOVERS");
  assert.equal(result.state.presentedResults?.candidateIds.length, 3);
  assert.equal(result.state.presentedResults?.candidateIds.every((id) => id.startsWith("tablecheck:")), true);
  assert.equal(result.navigations.some((url) => url.includes("tabelog.com")), true);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com/en/japan/search")), true);
  assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 native discovery uses the shared browser model loop to reveal an observed TableCheck result list", async () => {
  const result = await runScenario("TABLECHECK_DISCOVERY_RECOVERS");
  assert.ok(result.state.readEvidence.some(item => item.kind === "DISCOVERY" && item.provider === "TABLECHECK" && Array.isArray(item.claims.sourceCategories) && item.claims.sourceCategories.includes("Japanese")));
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"], JSON.stringify({ phase: result.state.phase, availability: result.state.availabilityChecks, browserInputs: result.model.browserDecisionInputs, purposes: result.model.purposes, navigations: result.navigations }));
  assert.equal(result.model.purposes.includes("browser_read_decide"), true);
  assert.equal(result.model.retrievalFillUsed, true);
  assert.equal(result.model.browserDecisionInputs.some((input) => input.objective.includes("public source search") && input.skillSource?.includes("# TableCheck Public Read")), true,
    "the production VENUE_SEARCH decision receives its Pack-owned TableCheck skill");
  assert.deepEqual(result.model.discoveryActions, ["FILL_AUTHORITATIVE", "CLICK"], "a stale nonempty list and loading query cannot complete before the observed current-query action");
  assert.equal(result.navigations.some((url) => url.includes("/en/native-omakase-1")), true);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 native discovery uses an observed ordinary query submit only in its installed read boundary", async () => {
  const result = await runScenario("TABLECHECK_DISCOVERY_RECOVERS", { guardedDiscoverySubmit: true });
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"]);
  assert.deepEqual(result.model.discoveryActions, ["FILL_AUTHORITATIVE", "CLICK"]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 confirms a ready TableCheck query through live controls without mistaking hidden or script loading text for a pending search", async () => {
  const result = await runScenario("TABLECHECK_QUERY_READY");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"]);
  assert.equal(result.model.retrievalFillUsed, false, "the current observed input already equals the authoritative expression");
  assert.deepEqual(result.model.discoveryActions, [], "the executor completes after its live control read without a model browser action");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 never admits stale busy discovery cards or an old explicit empty state after the browser declines a current-query action", async () => {
  for (const scenario of ["TABELOG_STALE_REJECTS", "TABLECHECK_STALE_REJECTS"] as const) {
    const result = await runScenario(scenario);
    assert.equal(result.state.presentedResults, undefined, scenario);
    assert.equal(result.state.candidates.length, 0, scenario);
    assert.equal(result.navigations.some((url) => /native-omakase-1|A130401\/100\/$/.test(url)), false,
      `${scenario} must retain the incomplete discovery diagnostic rather than inspect its stale card`);
  }
});

test("native source session acquisition consumes the remaining source window and retains an unstarted detail entrance", async () => {
  const navigations: string[] = [];
  const delayed = sourcePages("TABELOG_DELIVERS", navigations);
  const browser = { openSession: async (input: { signal: AbortSignal }) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    return delayed.openSession(input);
  } };
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => {
    throw new Error("coordinates avoid Google resolution");
  } }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, locality, () => reference.toISOString(), undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const intent = {
    timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "omakase" }, date,
    timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } },
    criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  const result = await native.search({ intent, continuation: {
    intentFingerprint: restaurantSearchIntentFingerprint(intent), usedPageTokens: [], pagesRead: 0, exhausted: false,
    sourceProgress: { sourceId: "tabelog", inspectedSourceIds: [], detailAttempts: 0, pagesRead: 0, elapsedMs: 89_999,
      pendingSourceIds: ["tokyo/A1304/A130401/100"], pendingSourceEntries: [{ sourceEntityId: "tokyo/A1304/A130401/100", sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/100/", observedAt: reference.toISOString() }] },
  } }, new AbortController().signal);
  assert.equal(navigations.length, 0, "a session that misses the remaining source window cannot begin detail navigation");
  assert.equal(result.metadata.nativeDiscoveryFunnel?.sourceTimeLimitReached, true);
  assert.deepEqual(result.continuation?.sourceProgress?.pendingSourceIds, ["tokyo/A1304/A130401/100"]);
});

test("Tabelog keeps the structured HARD retrieval keyword when an Agent hint repeats the whole reservation request", async () => {
  const navigations: string[] = [];
  const browser = sourcePages("TABELOG_DELIVERS", navigations);
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => {
    throw new Error("coordinates avoid Google resolution");
  } }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, locality, () => reference.toISOString(), undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const intent = {
    timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "omakase" }, date,
    timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "near Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } },
    criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  await native.search({ intent, retrievalHint: "omakase near Shibuya, party of 2, 2026-10-04 19:00" }, new AbortController().signal);
  const listing = new URL(navigations[0]!);
  assert.equal(listing.searchParams.get("sw"), "omakase");
});

test("the production Router advances the default three-pack cursor and reaches Google Nearby Search after bounded source batches", async () => {
  const navigations: string[] = [];
  const browser = sourcePages("BOTH_BOUNDED_EMPTY", navigations);
  const nearbyRequests: unknown[] = [];
  const google = new GooglePlacesRestaurantSearch(new GooglePlacesClient({
    apiKey: "fixture-only",
    fetchImplementation: async (url, init) => {
      assert.equal(String(url), "https://places.googleapis.com/v1/places:searchNearby");
      const body = JSON.parse(String(init?.body));
      nearbyRequests.push(body);
      return new Response(JSON.stringify({ places: [{
        id: "nearby-directory-result", displayName: { text: "Nearby restaurant" },
        formattedAddress: "Shibuya, Tokyo", location: center, types: ["restaurant"],
        addressComponents: [{ longText: "Shibuya", types: ["locality"] }],
      }] }), { status: 200, headers: { "content-type": "application/json" } });
    },
  }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, google, () => reference.toISOString(), undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const router = new RestaurantExecutionRouter(native, {
    executionRoute: "STRUCTURED_ADAPTER",
    async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; },
  }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 });
  const intentDraft: NonNullable<RestaurantTaskState["intentDraft"]> = {
    schemaVersion: "3" as const, timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY" as const, query: "nearby dinner" },
    date, timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
    area: { query: "Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } }, criteria: [],
  };
  let state: RestaurantTaskState = { schemaVersion: "15", phase: "UNDERSTANDING", intentDraft, candidates: [], availability: {}, availabilityChecks: {}, readEvidence: [], searchRevision: 0 };
  const first = await router.execute({ type: "SEARCH_RESTAURANTS" }, state, reference.toISOString(), "phase2-router-pack");
  assert.equal(first.event?.type, "SEARCH_COMPLETED");
  if (first.event?.type !== "SEARCH_COMPLETED") throw new Error("expected first discovery result");
  assert.equal(first.event.continuation?.discoveryPlan?.entries[first.event.continuation.discoveryPlan.cursor]?.sourceId, "tablecheck");
  state = { ...state, phase: "SEARCHING" as const, searchContinuation: first.event.continuation! };
  const second = await router.execute({ type: "SEARCH_RESTAURANTS" }, state, reference.toISOString(), "phase2-router-pack");
  assert.equal(second.event?.type, "SEARCH_COMPLETED");
  if (second.event?.type !== "SEARCH_COMPLETED") throw new Error("expected second discovery result");
  assert.equal(second.event.continuation?.discoveryPlan?.entries[second.event.continuation.discoveryPlan.cursor]?.sourceId, "google-places");
  state = { ...state, searchContinuation: second.event.continuation! };
  const third = await router.execute({ type: "SEARCH_RESTAURANTS" }, state, reference.toISOString(), "phase2-router-pack");
  assert.equal(third.event?.type, "SEARCH_COMPLETED");
  if (third.event?.type !== "SEARCH_COMPLETED") throw new Error("expected Google discovery result");
  assert.equal(third.event.candidates.length, 1, "Nearby pack should return its grounded candidate");
  assert.deepEqual(nearbyRequests, [{ includedTypes: ["restaurant"], maxResultCount: 20, locationRestriction: { circle: { center, radius: 1_000 } } }]);
  assert.equal(third.event.continuation?.exhausted, true);
  assert.equal(navigations.some((url) => url.includes("tablecheck.com")), true);
});

test("fixed TableCheck discovery stores the actual filled value and cannot reveal the current result after a wrong fill", async () => {
  const runtime = sourcePages("TABLECHECK_DISCOVERY_RECOVERS", []);
  const expected = "omakase near Shibuya, Tokyo";
  const url = `https://www.tablecheck.com/en/japan/search?service_mode=dining&search_text=${encodeURIComponent(expected)}`;
  const wrong = await runtime.openSession({ signal: new AbortController().signal });
  await wrong.navigate(url, { waitUntil: "domcontentloaded", timeoutMs: 1_000 });
  const wrongInput = (await wrong.observeControls!()).find((control) => control.kind === "INPUT")!;
  assert.equal(wrongInput.value, "stale query");
  await wrong.fill(wrongInput.id, "omakase near Ginza, Tokyo");
  assert.equal((await wrong.observeControls!()).find((control) => control.kind === "INPUT")?.value, "omakase near Ginza, Tokyo");
  await wrong.click((await wrong.observeControls!()).find((control) => control.label === "Show public venues")!.id);
  assert.equal((await wrong.snapshot()).html.includes("/en/native-omakase-1"), false);
  await wrong.close();

  const current = await runtime.openSession({ signal: new AbortController().signal });
  await current.navigate(url, { waitUntil: "domcontentloaded", timeoutMs: 1_000 });
  await current.fill((await current.observeControls!()).find((control) => control.kind === "INPUT")!.id, expected);
  await current.click((await current.observeControls!()).find((control) => control.label === "Show public venues")!.id);
  assert.equal((await current.snapshot()).html.includes("/en/native-omakase-1"), true);
  assert.equal((await current.observeControls!()).find((control) => control.kind === "INPUT")?.value, expected);
  await current.close();
});

test("H001 two bounded empty source batches cannot claim inventory or results", async () => {
  const result = await runScenario("BOTH_BOUNDED_EMPTY");
  assert.equal(result.state.presentedResults, undefined);
  assert.equal(result.state.searchContinuation?.exhausted, true);
  assert.match(result.state.noVerifiedResult?.remainingGaps.join(" ") ?? "", /bounded discovery plan/);
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 2);
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"]);
});

test("H001 both source lists reject page-owned coordinates outside the existing area radius", async () => {
  const result = await runScenario("OUTSIDE_RADIUS");
  assert.equal(result.state.candidates.length, 0);
  assert.equal(result.state.presentedResults, undefined);
  assert.equal(result.state.searchContinuation?.exhausted, true);
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 2);
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  const funnels = result.trajectories.flatMap((step) => step.executionMetadata?.nativeDiscoveryFunnel ? [step.executionMetadata.nativeDiscoveryFunnel] : []);
  assert.deepEqual(funnels.map((item) => ({ source: item.source, parsed: item.parsedOutlets, accepted: item.accepted,
    reasons: item.rejected.map((rejection) => rejection.reasonCode) })), [
    { source: "TABELOG", parsed: 1, accepted: 0, reasons: ["OUTSIDE_EXACT_RADIUS"] },
    { source: "TABLECHECK", parsed: 1, accepted: 0, reasons: ["OUTSIDE_EXACT_RADIUS"] },
  ]);
});

test("H001 one Tabelog detail failure retains earlier candidates and continues to the next detail", async () => {
  const result = await runScenario("TABELOG_ONE_DETAIL_FAILS");
  assert.deepEqual(result.state.candidates.map((item) => item.restaurant.id), [
    "tabelog:tokyo/A1304/A130401/100", "tabelog:tokyo/A1304/A130401/102",
  ]);
  assert.equal(result.navigations.some((url) => url.endsWith("/102/")), true);
  assert.notEqual(result.navigationSessionIds[result.navigations.findIndex((url) => url.endsWith("/100/"))],
    result.navigationSessionIds[result.navigations.findIndex((url) => url.endsWith("/102/"))],
    "the failed navigation must not leak into the next candidate session");
  assert.equal(result.closedSessionIds.includes(result.navigationSessionIds[result.navigations.findIndex((url) => url.endsWith("/101/"))]!), true);
  assert.equal(result.trajectories.some((step) => step.executionMetadata?.candidateFailures?.some((failure) =>
    failure.sourceUrl.endsWith("/101/") && failure.reasonCode === "BROWSER_TIMEOUT")), true,
  "the isolated candidate failure remains attributable in the read metadata");
});

test("H001 rejects an early END_READ after an empty Tabelog batch and continues to TableCheck", async () => {
  const result = await runScenario("EARLY_END_ATTEMPT");
  assert.equal(result.trajectories.some((step) => step.agentAction?.type === "END_READ" && step.actionValidation?.status === "REJECTED"), true);
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  assert.equal(result.state.searchContinuation?.exhausted, true);
  assert.equal(result.state.phase, "NO_VERIFIED_RESULT");
});

test("H001 native Tabelog batch continues past unavailable and unknown outlets, then presents its qualified outlet", async () => {
  const result = await runScenario("TABELOG_CONTINUES");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/102"]);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/100"]?.status, "UNAVAILABLE");
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/101"]?.status, "UNKNOWN");
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/102"]?.status, "AVAILABLE");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
  const funnel = result.trajectories.find((step) => step.executionMetadata?.provider === "TABELOG")?.executionMetadata?.nativeDiscoveryFunnel;
  assert.deepEqual({ parsed: funnel?.parsedOutlets, admitted: funnel?.accepted, rejected: funnel?.rejected.length, batchEnded: funnel?.batchEnded },
    { parsed: 3, admitted: 3, rejected: 0, batchEnded: true });
});

test("H001 native TableCheck batch continues after one nonqualifying outlet and presents the next", async () => {
  const result = await runScenario("TABLECHECK_CONTINUES");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-2"]);
  assert.equal(result.state.availabilityChecks["tablecheck:native-omakase-1"]?.status, "UNAVAILABLE");
  assert.equal(result.state.availabilityChecks["tablecheck:native-omakase-2"]?.status, "AVAILABLE");
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 open-ended native target three delivers one qualified outlet when the first batch is complete", async () => {
  const result = await runScenario("NATIVE_PARTIAL");
  assert.equal(result.state.intentDraft?.target?.selectionScope, "OPEN_ENDED");
  assert.equal(result.state.pendingResultBatchTarget, undefined);
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/101"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, navigations: result.navigations, candidates: result.state.candidates.map((candidate) => candidate.restaurant.id) }));
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 two investigated native batches with no qualified outlet stop without an inventory claim", async () => {
  const result = await runScenario("NATIVE_TRUE_NO_RESULT");
  assert.equal(result.state.phase, "NO_VERIFIED_RESULT");
  assert.equal(result.state.presentedResults, undefined);
  assert.equal(result.state.searchContinuation?.exhausted, true);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com/en/native-omakase-1")), true);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "NO");
});

test("H001 TableCheck search with a raw link but no parsed outlet retains the observed funnel and fails incomplete", async () => {
  const result = await runScenario("TABLECHECK_UNPARSED");
  const step = result.trajectories.find((item) => item.executionMetadata?.provider === "TABLECHECK");
  assert.equal(step?.executionMetadata?.failureCode, "DISCOVERY_SOURCE_INCOMPLETE");
  assert.deepEqual({ raw: step?.executionMetadata?.nativeDiscoveryFunnel?.rawSourceLinks,
    parsed: step?.executionMetadata?.nativeDiscoveryFunnel?.parsedOutlets,
    accepted: step?.executionMetadata?.nativeDiscoveryFunnel?.accepted,
    reason: step?.executionMetadata?.nativeDiscoveryFunnel?.progressionReason },
  { raw: 1, parsed: 0, accepted: 0, reason: "SOURCE_FAILURE" });
  assert.equal(result.state.presentedResults, undefined);
  assert.deepEqual({ source: result.state.searchContinuation?.sourceProgress?.sourceId,
    pagesRead: result.state.searchContinuation?.sourceProgress?.pagesRead,
    inspected: result.state.searchContinuation?.sourceProgress?.inspectedSourceIds },
  { source: "tablecheck", pagesRead: 1, inspected: [] }, "a failed source keeps its spent cursor instead of reopening with zero progress");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "UNKNOWN", "a source discovery failure must not be rewritten as a completed no-result read");
});

test("H001 enters the observed named Shibuya directory with the authoritative keyword", async () => {
  const result = await runScenario("TABELOG_REGION_PRESERVES_QUERY");
  const region = result.navigations.find((url) => url.includes("/en/tokyo/A1303/A130301/rstLst/"));
  assert.ok(region);
  assert.equal(new URL(region!).searchParams.get("sw"), "omakase");
  assert.equal(result.navigations.some((url) => url.endsWith("/100/")), true);
});

test("native discovery adjusts a sparse keyword through an observed category without relaxing HARD facts", async () => {
  const result = await runScenario("TABELOG_RETRIEVAL_CATEGORY_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/101"]);
  assert.equal(result.navigations.includes("https://tabelog.com/en/tokyo/A1303/A130301/rstLst/sushi/"), true);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.deepEqual(result.state.intent?.criteria, [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES");
});

test("native discovery rejects a category result that leaves the observed regional listing root", async () => {
  const result = await runScenario("TABELOG_CATEGORY_REDIRECTS_ROOT");
  assert.equal(result.trajectories.some((step) => step.executionMetadata?.failureCode === "DISCOVERY_SOURCE_LOCATION_UNGROUNDED"), true);
  assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "a category redirect cannot retain the earlier area proof");
  assert.equal(result.state.presentedResults, undefined);
});

test("native discovery retains category pagination including links revealed by a query action and deduplicates outlets", async () => {
  const result = await runScenario("TABELOG_RESULT_PAGES_CONTINUE");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/106"], JSON.stringify({navigations:result.navigations,search:result.state.searchContinuation,metadata:result.trajectories.filter(x=>x.agentAction?.type==="SEARCH_RESTAURANTS").map(x=>x.executionMetadata)}));
  assert.equal(result.navigations.includes("https://tabelog.com/en/tokyo/A1303/A130301/rstLst/sushi/2/"), true);
  assert.equal(result.navigations.includes("https://tabelog.com/en/tokyo/A1303/A130301/rstLst/sushi/3/"), true);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  const firstDetail = result.navigations.findIndex((url) => url.endsWith("/100/"));
  const category = result.navigations.findIndex((url) => url.includes("/rstLst/sushi/"));
  assert.ok(firstDetail >= 0 && category > firstDetail, "the initial observed detail is investigated before optional category widening");
  const reads = result.trajectories.filter((step) => step.executionMetadata?.provider === "TABELOG" && step.agentAction?.type === "SEARCH_RESTAURANTS");
  assert.deepEqual(reads.map((step) => step.executionMetadata?.nativeDiscoveryFunnel?.inspectedOutlets), [1, 4, 1, 1]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES");
});

test("H001's named Shibuya entry avoids an unrelated root-list candidate before investigation", async () => {
  const result = await runScenario("TABELOG_NONEMPTY_REGION_RECOVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"]);
  assert.equal(result.navigations.some((url) => url.includes("/en/tokyo/A1303/A130301/rstLst/")), true);
  assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "the observed source refinement precedes unsuitable detail investigation");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("native discovery refuses a broad listing when an observed regional entrance redirects away", async () => {
  const result = await runScenario("TABELOG_REGION_REDIRECTS_ROOT");
  const failed = result.trajectories.find((step) => step.executionMetadata?.failureCode === "DISCOVERY_SOURCE_LOCATION_UNGROUNDED");
  assert.ok(failed, "a redirected national list is not a current Shibuya discovery result");
  assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "no broad-list candidate may reach detail investigation");
  assert.equal(result.state.presentedResults, undefined);
});

test("native discovery reaches a neutral locality only through its observed source-region entrance", async () => {
  const result = await runScenario("TABELOG_NEUTRAL_REGION_RECOVERS", { areaQuery: "Higashi-Ginza" });
  assert.deepEqual(result.state.candidates.map((candidate) => candidate.restaurant.id), ["tabelog:tokyo/A1304/A130401/100"], JSON.stringify({
    phase: result.state.phase, failure: result.state.failure, navigations: result.navigations, candidates: result.state.candidates,
    facts: result.state.factChecks, availability: result.state.availabilityChecks, trajectories: result.trajectories,
  }));
  assert.equal(result.navigations.some((url) => url === "https://tabelog.com/en/tokyo/A1302/A130201/rstLst/?sw=omakase"), true,
    "the shared executor follows the public source control instead of borrowing Shibuya's Pack mapping");
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/100"]?.status, "UNAVAILABLE",
    "the controlled discovery regression does not manufacture a slot; existing delivery controls cover PRESENT_RESULTS separately");
});

test("native discovery restores an observed regional listing after same-region homepage canonicalization", async () => {
  const result = await runScenario("TABELOG_REGION_HOMEPAGE_RECOVERS");
  assert.equal(result.navigations[0], "https://tabelog.com/en/tokyo/rstLst/?sw=omakase");
  assert.equal(result.navigations[1], "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/?sw=omakase",
    "the Pack-owned homepage link restores the same observed listing rather than treating a homepage as a result list");
  assert.deepEqual(result.state.candidates.map((candidate) => candidate.restaurant.id), ["tabelog:tokyo/A1304/A130401/100"]);
});

test("native discovery does not treat an unscoped national homepage as the observed regional homepage", async () => {
  const result = await runScenario("TABELOG_REGION_HOMEPAGE_DRIFTS_NATIONAL");
  assert.equal(result.trajectories.some((step) => step.executionMetadata?.failureCode === "DISCOVERY_SOURCE_LOCATION_UNGROUNDED"), true);
  assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "a page with no regional boundary cannot inherit the earlier source area");
  assert.equal(result.state.presentedResults, undefined);
});

test("H001 presents one investigated Tabelog current-batch result without exhausting the source or starting TableCheck", async () => {
  const result = await runScenario("TABELOG_CURRENT_BATCH_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"]);
  assert.equal(result.state.searchContinuation?.exhausted, false, "the source remains open after the current bounded batch");
  assert.deepEqual(result.state.searchContinuation?.currentDiscoveryBatch, {
    sourceId: "tabelog",
    candidateIds: ["tabelog:tokyo/A1304/A130401/100", "tabelog:tokyo/A1304/A130401/101", "tabelog:tokyo/A1304/A130401/102", "tabelog:tokyo/A1304/A130401/103", "tabelog:tokyo/A1304/A130401/104"],
  });
  assert.deepEqual(result.state.searchContinuation?.sourceProgress?.pendingSourceIds, ["tokyo/A1304/A130401/105"]);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 presents one investigated TableCheck current-batch result without reading a second TableCheck chunk", async () => {
  const result = await runScenario("TABLECHECK_CURRENT_BATCH_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"]);
  assert.deepEqual(result.state.searchContinuation?.currentDiscoveryBatch, {
    sourceId: "tablecheck",
    candidateIds: ["tablecheck:native-omakase-1", "tablecheck:native-omakase-2", "tablecheck:native-omakase-3", "tablecheck:native-omakase-4", "tablecheck:native-omakase-5"],
  });
  assert.deepEqual(result.state.searchContinuation?.sourceProgress?.pendingSourceIds, ["native-omakase-6"]);
  assert.equal(result.navigations.filter((url) => url.includes("/en/japan/search")).length, 1);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 consumes a retained Tabelog detail entrance without reopening a volatile listing", async () => {
  const result = await runScenario("TABELOG_PENDING_RESTORED");
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 2,
    "the persisted source-owned entrance must not depend on a refreshed listing");
  assert.equal(result.navigations.some((url) => url.endsWith("/105/")), true,
    "the sixth observed entrance must survive the changed second listing");
  assert.equal(new Set(result.navigations.filter((url) => /\/tokyo\/A1304\/A130401\/\d+\/$/.test(url))).size, 6,
    "already inspected entries are not re-read while the retained one is consumed");
});

test("H001 retains unstarted Tabelog entries when a failed detail cannot reopen its session", async () => {
  const result = await runScenario("TABELOG_REOPEN_RETAINS");
  assert.equal(result.state.phase, "PRESENT_RESULTS");
  assert.equal(result.navigations.filter((url) => url.endsWith("/100/")).length, 1, "the failed detail navigation is attempted once");
  assert.equal(result.navigations.some((url) => url.endsWith("/101/")), true, "the first unstarted entry is retained and later consumed");
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 2, "the retained queue does not reopen a volatile listing");
});

test("native detail chunk continues through later observed Tabelog results before changing source", async () => {
  const result = await runScenario("TABELOG_BATCH_CAP");
  const funnel = result.trajectories.find((step) => step.executionMetadata?.provider === "TABELOG")?.executionMetadata?.nativeDiscoveryFunnel;
  assert.deepEqual({ raw: funnel?.rawSourceLinks, parsed: funnel?.parsedOutlets, inspected: funnel?.inspectedOutlets,
    cap: funnel?.batchCap, limited: funnel?.batchLimitReached, exhausted: funnel?.sourceExhausted },
  { raw: 6, parsed: 6, inspected: 5, cap: 5, limited: true, exhausted: false });
  assert.deepEqual(funnel?.deferredByBatchCap, [{
    sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/105/",
    reasonCode: "DETAIL_BATCH_CAP",
  }], "the observed sixth entrance is deferred, not rejected or represented as source exhaustion");
  assert.equal(new Set(result.navigations.filter((url) => /tabelog\.com\/tokyo\/A1304\/A130401\/\d+\/$/.test(url))).size, 6,
    "the sixth observed entrance is inspected in a later Tabelog chunk before the source changes");
});

test("H001 rejects early end and short presentation after TableCheck discovery until its batch is investigated", async () => {
  const result = await runScenario("TABLECHECK_EARLY_ACTIONS");
  assert.equal(result.state.intentDraft?.target?.selectionScope, "OPEN_ENDED");
  assert.equal(result.trajectories.some((item) => item.agentAction?.type === "END_READ" && item.actionValidation?.status === "REJECTED"), true);
  assert.equal(result.trajectories.some((item) => item.agentAction?.type === "PRESENT_RESULTS" && item.actionValidation?.status === "REJECTED"), true,
    JSON.stringify(result.trajectories.map((item) => ({ action: item.agentAction?.type, validation: item.actionValidation?.status,
      candidates: item.agentAction && "candidateIds" in item.agentAction ? item.agentAction.candidateIds : undefined,
      provider: item.executionMetadata?.provider }))));
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1", "tablecheck:native-omakase-2"]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});


test("WP-A offline composition captures every model call including a timeout and links browser observations to DOM snapshots", async () => {
  await mkdir(resolve(".eval-artifacts"), { recursive: true });
  const directory = await mkdtemp(resolve(".eval-artifacts", "wp-a-decisions-"));
  const resultPath = resolve(directory, "offline.result.json");
  const recording = new BrowserReadRecording({ directory, runId: "browser", reviewedReads: restaurantDiscoveryPacks.flatMap(pack=>pack.reviewedReads), reviewedStaticResources:restaurantDiscoveryPacks.flatMap(pack=>pack.staticResources) });
  const capture = createHybridDecisionCapture(resultPath, recording);
  try {
    const result = await runScenario("TABLECHECK_RECOVERS", { decisionCapture: capture, failSecondBrowserCall: true });
    const browserRecording = await recording.finish();
    await writeFile(resultPath, JSON.stringify({ ...result.artifact, browserRecording }, null, 2), { flag: "wx" });
    const metadata = result.artifact.decisionCapture!;
    const bytes = await readFile(metadata.path);
    const rows = bytes.toString().trim().split("\n").map(line => JSON.parse(line));
    assert.equal(rows.length, result.model.purposes.length);
    assert.equal(metadata.callsStarted, rows.length);
    assert.equal(metadata.rowsWritten, rows.length);
    assert.deepEqual(metadata.errors, []);
    assert.equal(metadata.sha256, createHash("sha256").update(bytes).digest("hex"));
    const failed = rows.filter(row => row.outcome === "FAILED");
    assert.equal(failed.length, 1);
    assert.equal(failed[0].errorCode, "TIMEOUT");
    assert.equal(failed[0].outputText, null);
    const manifest = JSON.parse(await readFile(resolve(browserRecording.path, "recording.json"), "utf8"));
    let browserCalls = 0;
    for (const row of rows) {
      const request = result.model.requests[row.sequence - 1]!;
      assert.deepEqual(row.messages, request.messages);
      assert.equal(row.purpose, request.purpose);
      assert.equal(row.promptVersion, request.promptVersion);
      assert.equal(row.timeoutMs, request.timeoutMs);
      assert.equal(row.maxOutputTokens, request.maxOutputTokens ?? null);
      assert.equal(row.temperature, request.temperature ?? null);
      assert.equal(row.thinking, request.thinking ?? null);
      assert.equal(row.outputSchema.name, request.outputSchema.name);
      assert.ok(Number.isFinite(Date.parse(row.startedAt)) && row.latencyMs >= 0);
      if (row.outcome === "SUCCEEDED") {
        assert.equal(typeof row.outputText, "string");
        assert.equal(row.finishReason, "TOOL_CALLS");
      }
      if (row.purpose !== "browser_read_decide") continue;
      browserCalls += 1;
      const { observation } = JSON.parse(request.messages.find(message => message.role === "user")!.content);
      assert.equal(row.browser.observationRevision, observation.revision);
      assert.equal(row.browser.url, observation.url);
      const document = manifest.documents.find((item: { snapshot: number }) => item.snapshot === row.browser.recordingSnapshot);
      assert.ok(document, "a decision must point to an existing recorded DOM snapshot");
      assert.equal(document.url, observation.url);
      const html = await readFile(resolve(browserRecording.path, document.file), "utf8");
      assert.ok(html.length > 0);
    }
    assert.ok(browserCalls >= 2, "normal and failed browser decisions both traverse the production executor");
    assert.ok(rows.some(row => row.browser && row.browser.observationRevision !== row.browser.recordingSnapshot),
      "executor revisions must not be confused with the global Recording snapshot counter");
    if (process.env.PRAXIS_KEEP_WP_A_CAPTURE === "1") console.log(JSON.stringify({ wpAOfflineArtifact: resultPath,
      modelCalls: rows.length, failures: failed.length, browserCalls, decisionCapture: metadata }));
  } finally {
    if (process.env.PRAXIS_KEEP_WP_A_CAPTURE !== "1") await rm(directory, { recursive: true, force: true });
  }
});


test("WP-A capture keeps model results and errors when storage fails, and finalizes an outstanding deadline call once", async () => {
  await mkdir(resolve(".eval-artifacts"), { recursive: true });
  const directory = await mkdtemp(resolve(".eval-artifacts", "wp-a-capture-boundary-"));
  const request: ModelRequest = { taskId: "offline-capture", purpose: "browser_read_decide", promptVersion: "12",
    messages: [{ role: "user", content: JSON.stringify({ observation: { revision: 7, url: "https://example.test/calendar" } }) }],
    outputSchema: { name: "browser-read-action", version: "1" }, responseFormat: "JSON_SCHEMA",
    timeoutMs: 100, fallback: "FAIL_CLOSED" };
  try {
    const unavailable = createHybridDecisionCapture(resolve(directory, "missing", "offline.result.json"));
    const response = { ...reply("{}", request.purpose), usage: { inputTokens: 2, outputTokens: 1, totalTokens: 3 } };
    assert.equal(await unavailable.complete(request, async () => response), response);
    const failure = new ModelGatewayError("Offline failed request", "NETWORK", true);
    await assert.rejects(unavailable.complete(request, async () => { throw failure; }), error => error === failure);
    const unavailableResult = await unavailable.finish();
    assert.equal(unavailableResult.callsStarted, 2);
    assert.equal(unavailableResult.rowsWritten, 0);
    assert.equal(unavailableResult.sha256, null);
    assert.equal(unavailableResult.errors[0]?.operation, "CREATE");

    const capture = createHybridDecisionCapture(resolve(directory, "deadline.result.json"));
    assert.equal(await capture.complete(request, async () => response), response);
    let resolvePending!: (response: ModelResponse) => void;
    const pendingCall = capture.complete(request, () => new Promise(resolve => { resolvePending = resolve; }));
    const deadline = await capture.finish();
    const before = await readFile(deadline.path, "utf8");
    const captured = before.trim().split("\n").map(line => JSON.parse(line));
    assert.equal(captured.length, 2);
    assert.deepEqual(captured[0].usage, response.usage);
    const row = captured[1];
    assert.equal(row.outcome, "FAILED");
    assert.equal(row.errorCode, "RUN_DEADLINE_EXCEEDED");
    assert.deepEqual(row.browser, { observationRevision: 7, url: "https://example.test/calendar", recordingSnapshot: null });
    resolvePending(response);
    assert.equal(await pendingCall, response);
    assert.equal(await readFile(deadline.path, "utf8"), before, "late provider settlement cannot append a duplicate row");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

// Verifies the actual Native → Executor → browser decision boundary; no source page reconstruction.
test("coordinate-only discovery passes source-attributed address observations, including failure, to browser input", async () => {
  for (const failure of [false, true]) {
    const modelInputs: unknown[] = [];
    const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async () => new Response(JSON.stringify({ results: [{ addressComponents: [{ longText: "Observed district", types: ["sublocality"] }] }] }), { status: failure ? 403 : 200 }) }), () => reference.toISOString(), 10, { maxRequests: 1 });
    let url = "https://tabelog.com/en/";
    const session = { metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, startedAt: reference.toISOString() },
      navigate: async (next: string) => { url = next; }, snapshot: async () => ({ url, title: "Public directory", text: "Choose an observed region", html: "<main>Choose an observed region</main>" }),
      click: async () => {}, fill: async () => {}, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
    };
    const search = new NativeRestaurantSearch({ openSession: async () => session }, locality, () => reference.toISOString(), undefined, { decide: async input => { modelInputs.push(input.goal.location); return { type: "REQUEST_HUMAN_HELP", reason: "Fixture input observed; stop without navigation" }; } }, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 }, undefined, [tabelogDiscoveryPack]);
    await search.search({ intent: { timezone: "Asia/Tokyo", area: { query: "nearby", coordinates: { latitude: 1, longitude: 2, observedAt: reference.toISOString(), source: "DEVICE" } }, criteria: [], target: { goal: "RECOMMENDATION", query: "restaurants nearby" } }, readRunId: `coordinate-input-${failure}` }, new AbortController().signal);
    assert.equal(modelInputs.length, 1);
    assert.deepEqual(modelInputs[0], { latitude: 1, longitude: 2, radiusMeters: 1000,
      ...(!failure ? { addressComponents: [{ longText: "Observed district", types: ["sublocality"] }] } : {}),
      addressObservation: { source: "GOOGLE_GEOCODING", observedAt: reference.toISOString(), status: failure ? "UNAVAILABLE" : "OBSERVED", ...(failure ? { reasonCode: "GOOGLE_SERVICE_QUOTA_OR_PERMISSION" } : {}) } });
    assert.equal(locality.googleRequestUsage(`coordinate-input-${failure}`).total, 1);
  }
});

// Same Runner composition, semantic/compiler/reducer/grounding/router and installed
// production Guard. Only model transport and source pages are fixed; no State injection.
for (const [scenario, expectedPhase, deliveries] of [
  ["NATIVE_TRUE_NO_RESULT", "NO_VERIFIED_RESULT", 0],
  ["TABELOG_CURRENT_BATCH_DELIVERS", "PRESENT_RESULTS", 1],
] as const) test(`P1-G repeated already-checked availability ends honestly: ${scenario}`, async () => {
  const result = await runScenario(scenario, { guardedDiscoverySubmit: true, repeatCheckedAvailability: true, advancingClock: true });
  assert.ok(result.networkRequests.some(request => request.outcome === "ADMITTED"));
  assert.ok(result.trajectories.some(step => step.actionValidation?.status === "REJECTED" && step.actionValidation.code === "AVAILABILITY_ALREADY_CHECKED"));
  assert.equal(result.state.phase, expectedPhase, JSON.stringify(result.state.failure));
  assert.equal(result.state.presentedResults?.candidateIds.length ?? 0, deliveries);
  assert.equal(result.state.failure?.code?.startsWith("AGENT_LOOP_"), undefined);
  if (deliveries) {
    assert.ok(result.artifact.events.some(entry => entry.event.type === "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED"));
    assert.ok(result.state.presentedResults!.evidenceIds.length);
  } else {
    assert.ok(result.state.noVerifiedResult?.remainingGaps.some(gap => gap.includes("REJECTION_LIMIT") && gap.includes("AVAILABILITY_ALREADY_CHECKED")));
    assert.ok(result.state.noVerifiedResult?.investigatedCandidateIds.length);
    assert.ok(!result.state.noVerifiedResult?.remainingGaps.some(gap => gap.startsWith("MODEL_CALL_RESERVE")));
    assert.equal(result.evaluation.findings.find(dimension => dimension.dimension === "COMPLETION_OUTCOME")?.status, "SATISFIED", "structured bounded completion is auditable; source exhaustiveness remains unassessed");
  }
  assert.ok(result.networkRequests.every(request => request.method === "GET" || request.method === "HEAD"));
});
test("P1-G unresolved location NO_PROGRESS gives an honest user outcome", async () => {
  const result = await runScenario("NATIVE_TRUE_NO_RESULT", { guardedDiscoverySubmit: true, unresolvedLocation: true, advancingClock: true });
  assert.equal(result.state.phase, "NO_VERIFIED_RESULT");
  assert.equal(result.state.presentedResults, undefined);
  assert.ok(result.state.noVerifiedResult?.remainingGaps.some(gap => gap.includes("GOOGLE_LOCATION_UNRESOLVED") && gap.includes("NO_PROGRESS")));
  assert.deepEqual(result.state.noVerifiedResult?.investigatedCandidateIds, []);
  assert.equal(result.navigations.length, 0);
  assert.equal(result.evaluation.findings.find(dimension => dimension.dimension === "COMPLETION_OUTCOME")?.status, "SATISFIED", "structured unresolved-location completion makes no source-exhaustiveness claim");
});


test("T1 production assembly shares Live limits after more than twelve actual availability model calls (discoveryPacks=tabelog,tablecheck)", async () => {
  const result = await runScenario("TABLECHECK_RECOVERS", { postAvailabilityDiscovery: true });
  assert.ok(result.callsBeforeDiscovery > 12, JSON.stringify({ calls: result.callsBeforeDiscovery, checks: result.state.availabilityChecks }));
  assert.ok(result.postAvailabilityDiscovery, "follow-up source search must run");
  assert.ok(!JSON.stringify(result.postAvailabilityDiscovery).includes("BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"), JSON.stringify(result.postAvailabilityDiscovery));
  assert.ok(result.networkRequests.some(request => request.outcome === "ADMITTED"), "production Guard admitted fixed source requests");
  assert.ok(result.model.purposes.length <= 50, "whole-model ceiling remains 50");
});

test("T1 Runner and Web assemblies expose equal effective limits and independent run budgets", () => {
  const transports = () => ({
    google: new GooglePlacesClient({ apiKey: "offline", fetchImplementation: async () => { throw new Error("No source read expected"); } }),
    browser: sourcePages("TABELOG_CURRENT_BATCH_DELIVERS", []),
    model: new H001NativeModel("TABELOG_CURRENT_BATCH_DELIVERS"),
    clock: { now: () => reference },
  });
  // Both hosts consume this production factory; compare actual returned
  // components/options, not independently copied configuration constants.
  const runner = createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET, transports());
  const web = createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET, transports());
  assert.deepEqual(runner.runCeilings, web.runCeilings);
  assert.deepEqual(runner.router, web.router);
  assert.deepEqual(runner.loop, web.loop);
  assert.equal(runner.browserBudget.maxModelCalls, web.browserBudget.maxModelCalls);
  assert.notEqual(runner.browserBudget, web.browserBudget, "distinct assemblies must not share a process-global counter");
  assert.equal(runner.loop.maxRejectedActions, 5, "neither host may fall back to the retired test default of three");
  assert.equal(runner.router.structuredReadTimeoutMs, 30_000);
  assert.equal(runner.router.browserReadTimeoutMs, runner.runCeilings.maxAutomaticBrowserMs);
});
