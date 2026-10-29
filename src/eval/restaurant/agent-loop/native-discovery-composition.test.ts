import { fixtureGoalBasis } from "../../../harness/restaurant-read-test-fixtures.js";
const fixtureRetrieval={decide:async()=>({accepted:true,keyword:"omakase",criterionRef:"criterion:0",reason:"Scripted retrieval control."})};
import { runDiscoveryProbe } from "./discovery-probe.js";
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
import { restaurantDiscoveryPacks, tableCheckDiscoveryPack, tabelogDiscoveryPack, googlePlacesDiscoveryPack, type DiscoverySourcePack } from "../../../integrations/restaurant-search/source-packs.js";
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
    if(request.purpose==='restaurant_discovery_retrieval'){
      const input=JSON.parse(request.messages.find(m=>m.role==='user')!.content);
      const category=input.observation?.categories?.find((c:{label:string})=>c.label==='Sushi');
      // The former fixture chose an illegal sparse KEEP after its category;
      // use a second valid model rewrite and retain prior observed outlets.
      if(this.scenario==='TABELOG_RETRIEVAL_CATEGORY_DELIVERS'&&input.current?.categoryUrl&&input.rewrites===1)
        return reply(JSON.stringify({choice:'KEYWORD',keyword:'sushi',criterionRef:'criterion:0',generalRef:'',categoryUrl:'',reason:'Second explicit retrieval; keep prior candidates'}),request.purpose);
      const useCategory=category&&['TABELOG_RETRIEVAL_CATEGORY_DELIVERS','TABELOG_RESULT_PAGES_CONTINUE','TABELOG_CATEGORY_REDIRECTS_ROOT'].includes(this.scenario)&&(input.current||this.scenario==='TABELOG_RESULT_PAGES_CONTINUE');
      return reply(JSON.stringify({choice:useCategory?'CATEGORY':input.current?'KEEP':'KEYWORD',keyword:useCategory||input.current?'':'omakase',criterionRef:useCategory||input.current?'':'criterion:0',generalRef:'',categoryUrl:useCategory?category.url:'',reason:'Scripted retrieval for independent controlled source.'}),request.purpose);
    }
    if (request.purpose === "restaurant_semantic_interpret") return reply(JSON.stringify({ schemaVersion: "4", facts: [
      { field: "TARGET", operation: "ASSERT", value: { goalBasis: fixtureGoalBasis(request), kind: "TARGET", goal: "AVAILABILITY", query: "omakase spot", selectionScope: "OPEN_ENDED" } },
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
        regionCorrection?: { entrances: Array<{ref: string; label: string}> };
      };
      this.browserDecisionInputs.push({ objective: input.objective, progress: input.progress, observation: { targets: input.observation.targets, ...(input.observation.pageActions ? { pageActions: input.observation.pageActions } : {}) }, ...(input.skills?.source ? { skillSource: input.skills.source } : {}) });
      if (this.scenario.startsWith("F5_")) {
        const correction = input.regionCorrection?.entrances.find(entry => entry.label === "F5 alternate");
        const target = input.observation.targets.find(target => /^F5 (parent|child)$/.test(target.label) && target.availableActions?.includes("OPEN_LINK"));
        if (correction || target) return reply(JSON.stringify({action:correction ? "SELECT_REGION_ENTRANCE" : "OPEN_LINK",targetRef:(correction ?? target)!.ref,authoritativeField:"NONE",requestedState:"NONE",reason:"Use supplied observed reference; the radius remains immutable"}),request.purpose);
      }
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
    // 本地构造，数量参照槽 1；保留真实两页读取与根 Agent 合法动作计算。
    if (scenario === "F5_PENDING_CORRECTION" && /omakase/i.test(query.textQuery ?? "")) {
      const second = (query as {pageToken?: string}).pageToken === "local-second-page";
      return new Response(JSON.stringify({places: Array.from({length: second ? 6 : 20}, (_, index) => ({
        id: `f5-pending-google-${index + (second ? 20 : 0)}`, displayName: {text: `Local Google ${index + (second ? 20 : 0)}`},
        formattedAddress: "Shibuya, Tokyo", location: center, types: ["restaurant"], businessStatus: "OPERATIONAL",
      })), ...(!second ? {nextPageToken: "local-second-page"} : {})}), {status: 200});
    }
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
  // These two existing unavailable controls previously relied on a private
  // is-unavailable class and an empty payload with no merchant binding. Keep
  // the UNAVAILABLE/continue assertions using an explicit constructed source
  // response outside H001's requested window; do not derive it from the DOM,
  // task request, production parser or evaluator. Other source cases unchanged.
  const fixtureBrowser = scenario === "TABELOG_CONTINUES" || scenario === "TABELOG_NEUTRAL_REGION_RECOVERS" ? {
    ...rawBrowser,
    async openSession(input: Parameters<typeof rawBrowser.openSession>[0]) {
      const session = await rawBrowser.openSession(input);
      return new Proxy(session, { get(target, key) {
        if (key === "snapshot") return async () => {
          const page = await target.snapshot();
          if (page.url !== "https://tabelog.com/tokyo/A1304/A130401/100/") return page;
          return { ...page, responses: [{ url: "https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=100&svd=20260819&svps=2", status: 200,
            observedAt: "2026-08-18T10:00:00Z", sequence: 1, body: { base_date: { year: 2026, month: 8, day: 19 }, members: 2,
              selection: [{ time: "23:00", url: "/en/booking/form_course/new?rcd=100&member=2&visit_date=20260819&visit_time=2300" }] } }] };
        };
        const value = Reflect.get(target, key, target); return typeof value === "function" ? value.bind(target) : value;
      } });
    },
  } : rawBrowser;
  const browserTrace: Array<{ sequence: number; at: string; kind: string; detail: unknown }> = [];
  let browserTraceSequence = 0;
  const browser = { ...(rawBrowser.readNetworkBoundaryCapability ? { readNetworkBoundaryCapability: rawBrowser.readNetworkBoundaryCapability } : {}), openSession: async (input: { signal: AbortSignal }) => traceBrowserSession(
    await fixtureBrowser.openSession(input), "TABLECHECK", (kind, detail) => {
      const sequence = ++browserTraceSequence;
      browserTrace.push({ sequence, at: reference.toISOString(), kind, detail });
      return sequence;
    }, options.decisionCapture?.snapshotSink,
  ) };
  const native = createLiveReadAssembly({ ...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,
    ...(scenario === "F5_PENDING_CORRECTION" ? {maxAgentSteps: 6} : {}),
    packs: options.packs ?? [tabelogDiscoveryPack, tableCheckDiscoveryPack] }, {
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
  const observed = result.trajectories.find(step => step.decisionContext?.candidates.length)?.decisionContext?.candidates;
  assert.ok(observed?.length);
  assert.ok(observed.every(candidate => candidate.availabilityPath === "DIRECT_SOURCE_PAGE"), "the production assembly must annotate before the Agent chooses, without another request");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 native cited-menu follow-up carries source-bound HARD evidence to a current Tabelog result", async () => {
  const result = await runScenario("NATIVE_FACT_FOLLOWUP_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, facts: result.state.factChecks, availability: result.state.availabilityChecks, purposes: result.model.purposes, navigations: result.navigations }));
  assert.equal(result.navigations.some((url) => url.endsWith("/100/menu/")), true, "the native fact reader follows the observed same-source menu link before citing HARD evidence");
  assert.equal(result.model.purposes.filter((purpose) => purpose === "restaurant_fact_judgment").length, 2, "the cited judgment runs once per retained source document set");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 TableCheck reserve-menu facts cannot bypass the permanent form prohibition", async () => {
  for (const availabilityFirst of [false, true]) {
    const result = await runScenario("TABLECHECK_SCOPED_MENU_DELIVERS", { availabilityFirst });
    assert.equal(result.state.phase, "NO_VERIFIED_RESULT");
    assert.equal(result.state.presentedResults, undefined);
    assert.equal(result.state.factChecks?.["tablecheck:native-omakase-1"]?.status, "UNKNOWN");
    assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "NO");
    assert.equal(result.navigations.some(url => new URL(url).pathname.split("/").includes("reserve")), false,
      "neither facts-first nor availability-first may reach the booking form");
    assert.equal(result.networkRequests.some(request => request.outcome === "ADMITTED" && request.pathname.includes("/reserve")), false);
    assert.equal(result.state.readEvidence.some(item => item.kind === "RESTAURANT_FACT" && item.claims.serviceScopeValue === "sushi"), false,
      "the inaccessible form cannot contribute scoped menu evidence");
  }
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

test("native source session acquisition consumes the remaining source window and retains an unstarted detail entrance", async t => {
  let elapsed=0;t.mock.method(Date,'now',()=>elapsed);
  const navigations: string[] = [];
  const delayed = sourcePages("TABELOG_DELIVERS", navigations);
  const browser = { openSession: async (input: { signal: AbortSignal }) => {
    elapsed+=20;
    return delayed.openSession(input);
  } };
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => {
    throw new Error("coordinates avoid Google resolution");
  } }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, locality, fixtureRetrieval, () => reference.toISOString(), undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
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
  const native = new NativeRestaurantSearch(browser, google, fixtureRetrieval, () => reference.toISOString(), undefined, undefined, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const router = new RestaurantExecutionRouter(native, {
    executionRoute: "STRUCTURED_ADAPTER",
    async check() { return { offers: [], availabilityChecks: {}, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } }; },
  }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 });
  const intentDraft: NonNullable<RestaurantTaskState["intentDraft"]> = {
    schemaVersion: "3" as const, timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY" as const, query: "nearby dinner" },
    date, timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
    area: { query: "Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } }, criteria: [],
  };
  let state: RestaurantTaskState = { schemaVersion: "24", phase: "UNDERSTANDING", intentDraft, candidates: [], availability: {}, availabilityChecks: {}, readEvidence: [], searchRevision: 0 };
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
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 4);
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"]);
});

test("H001 both source lists reject page-owned coordinates outside the existing area radius", async () => {
  const result = await runScenario("OUTSIDE_RADIUS");
  assert.equal(result.state.candidates.length, 0);
  assert.equal(result.state.presentedResults, undefined);
  assert.equal(result.state.searchContinuation?.exhausted, true);
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 4);
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
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/101"]?.status, "SOURCE_UNSUPPORTED");
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
  const region = result.navigations.find((url) => url.includes("/en/tokyo/A1303/A130301/rstLst/")&&new URL(url).searchParams.get("sw")==="omakase");
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
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), true);
  assert.ok(result.navigations.findIndex(url => url.includes("tablecheck.com")) < result.navigations.findIndex(url => url.endsWith("/105/")), "another source first batch precedes directory second chunk");
  const firstDetail = result.navigations.findIndex((url) => url.endsWith("/100/"));
  const category = result.navigations.findIndex((url) => url.includes("/rstLst/sushi/"));
  assert.ok(firstDetail >= 0 && category < firstDetail, "sparse retrieval is refined before details while observed entries stay at the queue front");
  const reads = result.trajectories.filter((step) => step.executionMetadata?.provider === "TABELOG" && step.agentAction?.type === "SEARCH_RESTAURANTS");
  assert.deepEqual(reads.map((step) => step.executionMetadata?.nativeDiscoveryFunnel?.inspectedOutlets), [5, 1, 1]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES");
  assert.ok(result.state.searchContinuation?.deferredSources?.some(item => item.progress.sourceId === "tablecheck" && item.progress.pagesRead > 0), "a finished source checkpoint is retained across handoff too; spent budgets and unread entrances are not discarded");
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
  assert.equal(result.navigations[0], "https://tabelog.com/en/tokyo/rstLst/");
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
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 4,
    "only the initial listing, keyword, hint and single fallback occur; retained entries do not reopen the list");
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
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 4, "retained entries add no listing navigation after the initial query, hint and single fallback");
});

test("native detail chunk retains deferred outlets while another source gets its first batch", async () => {
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
    "the sixth observed entrance survives source handoff and is inspected in a later Tabelog chunk");
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
    const search = new NativeRestaurantSearch({ openSession: async () => session }, locality, fixtureRetrieval, () => reference.toISOString(), undefined, { decide: async input => { modelInputs.push(input.goal.location); return { type: "REQUEST_HUMAN_HELP", reason: "Fixture input observed; stop without navigation" }; } }, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 }, undefined, [tabelogDiscoveryPack]);
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
  // No browser executor ran, so this historical artifact shape records no
  // effectiveLimits. The bounded location failure is still the actual outcome,
  // but declarations alone cannot prove the required budget-compliance check.
  assert.equal(result.evaluation.findings.find(dimension => dimension.dimension === "RESOURCES")?.status, "NOT_EVALUATED");
  assert.equal(result.evaluation.findings.find(dimension => dimension.dimension === "COMPLETION_OUTCOME")?.status, "NOT_EVALUATED");
  assert.match(result.evaluation.findings.find(dimension => dimension.dimension === "COMPLETION_OUTCOME")!.directCause, /GOOGLE_LOCATION_UNRESOLVED/);
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


test("P21 discovery probe uses production assembly/Guard for one first batch and never availability",async()=>{
 const navigations:string[]=[],networkRequests:BrowserReadNetworkObservation[]=[];
 const model=new H001NativeModel("TABELOG_BATCH_CAP");
 const result=await runDiscoveryProbe({caseId:"probe-first-batch",role:"TARGET",referenceTime:reference.toISOString(),
   intent:{timezone:"Asia/Tokyo",target:{goal:"AVAILABILITY",query:"omakase",selectionScope:"OPEN_ENDED"},date,timeWindow:{earliest:"19:00",latest:"19:00"},partySize:2,area:{query:"near Shibuya"},criteria:[{text:"omakase",polarity:"POSITIVE",strength:"HARD"}]},
   locationContext:{...center,label:"Shibuya",radiusMeters:1000,areaMatchBasis:"NAMED_PLACE_RADIUS"}},[],
   {...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:15,maxAutomaticBrowserMs:180000,packs:[tabelogDiscoveryPack]},
   {model,google:new GooglePlacesClient({apiKey:"FIXTURE",fetchImplementation:async()=>{throw Error("No Google request expected for frozen named location")}}),
    browser:sourcePages("TABELOG_BATCH_CAP",navigations,[],[],[],{guardedReadBoundary:true,networkRequests}),clock:{now:()=>reference}});
 assert.deepEqual(result.attemptedSourceIds,["tabelog"]);
 assert.equal(result.firstBatchDetails.length,5,"do not resume into the second detail batch");
 assert.ok(result.inRadiusParsed>0);assert.ok(result.resources.modelCalls<=15);
 assert.ok(networkRequests.some(r=>r.method==="GET"&&r.outcome==="ADMITTED"));
 assert.ok(!model.purposes.includes("restaurant_semantic_interpret"));
 assert.ok(!model.purposes.includes("restaurant_fact_judgment"));
 assert.ok(!navigations.some(url=>/booking|reserve|calendar/.test(url)),"discovery must not navigate to availability or reservation pages");
});

test("P21 failed model calls count toward the shared probe ceiling; later source is not started",async()=>{
 let calls=0;
 const result=await runDiscoveryProbe({caseId:"probe-budget",role:"TARGET",referenceTime:reference.toISOString(),
  intent:{timezone:"Asia/Tokyo",area:{query:"near Shibuya"},criteria:[{text:"omakase",polarity:"POSITIVE",strength:"HARD"}]},
  locationContext:{...center,label:"Shibuya",radiusMeters:1000,areaMatchBasis:"NAMED_PLACE_RADIUS"}},[],
  {...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:1,maxAutomaticBrowserMs:180000},
  {model:{async complete(){calls++;throw new ModelGatewayError("Fixture provider failure","PROVIDER_REJECTED",true);}},
   google:new GooglePlacesClient({apiKey:"FIXTURE",fetchImplementation:async()=>{throw Error("Not reached")}}),
   browser:sourcePages("TABELOG_DELIVERS",[],[],[],[],{guardedReadBoundary:true}),clock:{now:()=>reference}});
 assert.equal(result.resources.modelCalls,1);assert.equal(calls,1);
 assert.equal(result.terminationReason,"MODEL_CALL_BUDGET_EXHAUSTED");
 assert.deepEqual(result.unattemptedSourceIds,["tablecheck","google-places"]);
 assert.equal(result.witnessInListing,false);
});

test('P21 pre-detail rewrites stay bounded and reject repeated or unobserved general expressions',async()=>{
 for(const mode of ['different','repeat','unobserved-general'] as const){
 const base=new H001NativeModel('BOTH_BOUNDED_EMPTY');let proposals=0;const navigations:string[]=[],networkRequests:BrowserReadNetworkObservation[]=[];
 const model:ModelGateway={complete:async request=>{
  if(request.purpose!=='restaurant_discovery_retrieval')return base.complete(request);
  proposals++;
  const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);
  if(proposals===3)assert.deepEqual(body.attemptedRetrievals.map((r:{keyword:string})=>r.keyword),['omakase','sushi']);
  const general=mode==='unobserved-general'&&proposals===2;
  return reply(JSON.stringify({choice:general?'GENERAL':'KEYWORD',keyword:general?'':proposals===1?'omakase':proposals===2?'sushi':mode==='repeat'?'omakase':'regional cuisine',criterionRef:general?'':'criterion:0',generalRef:general?'general:tablecheck:1':'',categoryUrl:'',reason:'Bounded empty retrieval challenge'}),request.purpose);
 }};
 const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:[tabelogDiscoveryPack]}, {model,browser:sourcePages('BOTH_BOUNDED_EMPTY',navigations,[],[],[],{guardedReadBoundary:true,networkRequests}),google:new GooglePlacesClient({apiKey:'FIXTURE',fetchImplementation:async()=>{throw Error('No external API');}}),clock:{now:()=>reference}});
 const intent={timezone:'Asia/Tokyo' as const,area:{query:'Shibuya'},criteria:[{text:'omakase',polarity:'POSITIVE' as const,strength:'HARD' as const}]};
 const read=await assembly.search.search({intent,readRunId:'rewrite-cap',continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{...center,label:'Shibuya',radiusMeters:1000,areaMatchBasis:'NAMED_PLACE_RADIUS'}}},new AbortController().signal);
 assert.equal(proposals,mode==='unobserved-general'?2:3,'no model repair after a rejected proposal');assert.equal(read.candidates.length,0);
 assert.equal(read.metadata.nativeDiscoveryFunnel?.retrieval?.rewrites,mode==='unobserved-general'?0:mode==='repeat'?1:2);
 assert.equal(read.metadata.nativeDiscoveryFunnel?.retrieval?.retrievalPages,mode==='unobserved-general'?1:mode==='repeat'?2:3);
 if(mode!=='different'){
  assert.equal(read.metadata.nativeDiscoveryFunnel?.retrieval?.history.at(-1)?.selection.rejectionReason,mode==='repeat'?'REPEATED_RETRIEVAL_EXPRESSION':'UNOBSERVED_GENERAL_LIST');
  assert.ok(navigations.filter(url=>new URL(url).searchParams.get('sw')==='omakase').length<=1,'the repeated query is never issued again');
 }
 assert.equal(read.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN');assert.ok(read.metadata.nativeDiscoveryFunnel?.sourceEnded);
 assert.ok(networkRequests.some(r=>r.outcome==='ADMITTED'));assert.ok(!base.purposes.includes('restaurant_fact_judgment'));
 }
});

test('P21 native venue and Google entries reuse one initial text retrieval proposal in a probe request',async()=>{
 const model=new H001NativeModel('BOTH_BOUNDED_EMPTY');
 const googleRequests:Array<{url:string;body:{textQuery?:string}}> = [];
 const result=await runDiscoveryProbe({caseId:'text-plan-once',role:'TARGET',referenceTime:reference.toISOString(),intent:{timezone:'Asia/Tokyo',area:{query:'Shibuya'},criteria:[{text:'omakase',polarity:'POSITIVE',strength:'HARD'}]},locationContext:{...center,label:'Shibuya',radiusMeters:1000,areaMatchBasis:'NAMED_PLACE_RADIUS'}},[],{...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:15,maxAutomaticBrowserMs:180000},{model,browser:sourcePages('BOTH_BOUNDED_EMPTY',[],[],[],[],{guardedReadBoundary:true}),google:new GooglePlacesClient({apiKey:'FIXTURE',fetchImplementation:async(url,init)=>{googleRequests.push({url:String(url),body:JSON.parse(String(init?.body))});return new Response(JSON.stringify({places:[]}),{status:200});}}),clock:{now:()=>reference}});
 assert.equal(googleRequests.length,1);
 assert.ok(googleRequests[0]!.url.endsWith('/places:searchText'),'shared keyword must select the text transport');
 assert.equal(googleRequests[0]!.body.textQuery,'omakase Shibuya');
 assert.deepEqual(result.attemptedSourceIds,['tabelog','tablecheck','google-places']);
 const initialTextPlans=model.requests.filter(r=>r.purpose==='restaurant_discovery_retrieval'&&JSON.parse(r.messages.find(m=>m.role==='user')!.content).observation===null);
 assert.equal(initialTextPlans.length,1);assert.ok(result.resources.modelCalls<=15);
});


test('Google-only planned retrieval omits nearby from place context and query while preserving its circle', async () => {
  for (const areaQuery of ['nearby', 'Fixture District']) {
    const modelInputs: Array<{location: string}> = [];
    const bodies: Array<{textQuery: string; locationRestriction: {rectangle: {low: {latitude: number; longitude: number}; high: {latitude: number; longitude: number}}}}> = [];
    const model: ModelGateway = {complete: async request => {
      assert.equal(request.purpose, 'restaurant_discovery_retrieval');
      modelInputs.push(JSON.parse(request.messages.find(message => message.role === 'user')!.content));
      return reply(JSON.stringify({choice:'KEYWORD',keyword:'local food',criterionRef:'criterion:0',generalRef:'',categoryUrl:'',reason:'Positive criterion'}), request.purpose);
    }};
    const assembly = createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET, packs:[googlePlacesDiscoveryPack]}, {
      model, google: new GooglePlacesClient({apiKey:'FIXTURE', fetchImplementation:async (_url, init) => {
        bodies.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({places:[]}), {status:200});
      }}),
      browser:{readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async () => {throw Error('Google-only discovery must not open a browser');}},
      clock:{now:() => reference},
    });
    const intent = {timezone:'Asia/Tokyo' as const,area:{query:areaQuery,coordinates:{latitude:35,longitude:139,observedAt:reference.toISOString(),source:'DEVICE' as const},radiusMeters:1000},criteria:[{text:'local food',polarity:'POSITIVE' as const,strength:'HARD' as const}]};
    const before = structuredClone(intent);
    await assembly.search.search({intent,readRunId:'google-only-nearby'}, new AbortController().signal);
    const place = areaQuery === 'nearby' ? '' : areaQuery;
    assert.deepEqual({location:modelInputs[0]?.location,textQuery:bodies[0]?.textQuery}, {location:place,textQuery:`local food ${place}`.trim()});
    assert.equal(modelInputs.length,1);assert.equal(bodies.length,1);
    const rectangle=bodies[0]!.locationRestriction.rectangle;
    assert.ok(rectangle.low.latitude<35 && rectangle.high.latitude>35);
    assert.ok(rectangle.low.longitude<139 && rectangle.high.longitude>139);
    assert.deepEqual(intent,before,'retrieval changes neither authoritative location nor HARD criteria');
  }
});

test('H002 without positive HARD uses general shared retrieval and Google nearby without a planning model call',async()=>{
 for(const packs of [[googlePlacesDiscoveryPack],restaurantDiscoveryPacks]){
  const requests:ModelRequest[]=[];const googleRequests:Array<{url:string;body:Record<string,unknown>}>=[];
  const base=new H001NativeModel('BOTH_BOUNDED_EMPTY');
  const model:ModelGateway={complete:async request=>{
   requests.push(request);
   if(request.purpose==='restaurant_discovery_retrieval')return reply(JSON.stringify({choice:'KEYWORD',keyword:'first date',criterionRef:'criterion:0',generalRef:'',categoryUrl:'',reason:'Original H002 UNSPECIFIED proposal'}),request.purpose);
   return base.complete(request);
  }};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs},{model,browser:sourcePages('BOTH_BOUNDED_EMPTY',[],[],[],[],{guardedReadBoundary:true}),google:new GooglePlacesClient({apiKey:'FIXTURE',fetchImplementation:async(url,init)=>{googleRequests.push({url:String(url),body:JSON.parse(String(init?.body))});return new Response(JSON.stringify({places:[]}),{status:200});}}),clock:{now:()=>reference}});
  // Actual frozen H002 criteria, not Gold or a rewritten HARD preference.
  const intent={timezone:'Asia/Tokyo' as const,target:{goal:'AVAILABILITY' as const,query:'first-date restaurant near Higashi-Ginza'},date:'2026-10-31',timeWindow:{earliest:'18:30',latest:'18:30'},partySize:2,area:{query:'near Higashi-Ginza',coordinates:{...center,observedAt:reference.toISOString(),source:'DEVICE' as const}},criteria:[{text:'first-date restaurant',polarity:'POSITIVE' as const,strength:'UNSPECIFIED' as const},{text:'around 10,000 yen per person',polarity:'POSITIVE' as const,strength:'SOFT' as const},{text:'hot-pot restaurants',polarity:'NEGATIVE' as const,strength:'HARD' as const},{text:'Sichuan/Hunan-style cuisine where spicy food is the main focus',polarity:'NEGATIVE' as const,strength:'HARD' as const}]};
  const before=structuredClone(intent);let continuation: import("../../../domains/restaurant/contracts.js").RestaurantSearchContinuation | undefined;
  do{const read=await assembly.search.search({intent,readRunId:'h002-hard-only',...(continuation?{continuation}:{})},new AbortController().signal);continuation=read.continuation;}while(continuation&&!continuation.exhausted);
  const sharedPlans=requests.filter(r=>r.purpose==='restaurant_discovery_retrieval'&&JSON.parse(r.messages.find(m=>m.role==='user')!.content).observation===null);
  console.log('H002 observed transport',JSON.stringify({packs:packs.map(p=>p.meta.id),googleRequests,sharedPlans:sharedPlans.length}));
  assert.equal(googleRequests.length,1);assert.ok(googleRequests[0]!.url.endsWith('/places:searchNearby'));
  assert.equal(googleRequests[0]!.body.textQuery,undefined);assert.equal(sharedPlans.length,0);
  assert.deepEqual(intent,before);
 }
});

// Full production interpreter -> compiler -> Router -> events/Reducer -> output.
// Only model and source transport are local constructed; no prefilled evidence.
test("F5c Agent loop corrects within its Tabelog call despite TableCheck 2 and Google 26 pending candidates", async () => {
  const directory=await mkdtemp(resolve('.eval-artifacts','flow-decision-capture-'));
  const recording=new BrowserReadRecording({directory,runId:'browser'});
  const capture=createHybridDecisionCapture(resolve(directory,'offline.result.json'),recording);
  try{
  const result = await runScenario("F5_PENDING_CORRECTION", {packs: restaurantDiscoveryPacks,decisionCapture:capture});
  const decisions = result.model.requests.filter(request => request.purpose === "restaurant_agent_decide")
    .map(request => JSON.parse(request.messages.find(message => message.role === "user")!.content).context);
  const pending = decisions.find(context => context.candidates?.length === 28);
  assert.ok(pending, "the real Agent must observe all 2 TableCheck + 26 Google candidates");
  assert.equal(result.state.candidates.filter(candidate => candidate.restaurant.id.startsWith("tablecheck:")).length, 2);
  assert.equal(result.state.candidates.filter(candidate => candidate.restaurant.sourceIds.googlePlaces).length, 26);
  assert.equal(pending.searchAvailability.reason, "NATIVE_FIRST_BATCH_PENDING");
  assert.equal(pending.legalActions.search, false, "retain production SEARCH gating rather than bypassing it");
  const alternate = result.navigations.indexOf("https://tabelog.com/en/tokyo/A1323/");
  assert.ok(alternate >= 0, "F5c: correction must happen before the root Agent can queue other sources");
  assert.ok(alternate < result.navigations.findIndex(url => url.includes("tablecheck.com")), "correction belongs to the first Tabelog source invocation");
  const firstCall = result.trajectories[0]!.executionMetadata!.nativeDiscoveryFunnel!;
  assert.equal(firstCall.directoryRegion!.replacement!.url, "https://tabelog.com/en/tokyo/A1323/");
  assert.equal(firstCall.sourceDetailAttempts, 4);
  assert.equal(firstCall.retrieval!.regionPages, 4);
  assert.equal(result.model.requests.filter(request => request.purpose === "browser_read_decide"
    && JSON.parse(request.messages.find(message => message.role === "user")!.content).regionCorrection).length, 1);
  assert.equal(result.navigations.filter(url => /\/99[0-5]\/$/.test(url)).length, 4, "two first samples and two replacement samples share the source budget");
  const metadata=result.artifact.decisionCapture!;
  assert.deepEqual(metadata.errors,[],'flow selection has no current DOM by contract and must not be a snapshot mismatch');
  const rows=(await readFile(metadata.path,'utf8')).trim().split('\n').map(line=>JSON.parse(line));
  const flowRows=rows.filter(row=>row.browser?.observationKind==='SOURCE_FLOW_ENTRANCE_SELECTION');
  assert.equal(flowRows.length,1);
  const row=flowRows[0],context=JSON.parse(row.messages.find((message:any)=>message.role==='user').content);
  assert.equal(row.browser.recordingSnapshot,null,'never fabricate a current DOM for collected entrances');
  assert.deepEqual(row.browser.sourceFlow,{sourceId:context.regionCorrection.sourceId,flowId:context.regionCorrection.flowId,entrances:context.regionCorrection.entrances.map(({ref,originalTargetRef,observationRevision,observedOn}:any)=>({ref,originalTargetRef,observationRevision,observedOn}))});
  assert.deepEqual(row.messages,result.model.requests[row.sequence-1]!.messages,'capture may annotate provenance but never rewrite model input');
  }finally{await recording.finish();await rm(directory,{recursive:true,force:true});}
});

test('decision capture still diagnoses a mismatching DOM and an unbound empty observation',async t=>{
 const directory=await mkdtemp(resolve('.eval-artifacts','capture-dom-mismatch-'));
 t.mock.method(console,'error',()=>{});
 try{
  for(const empty of [false,true]){
   const recording=new BrowserReadRecording({directory,runId:`browser-${empty}`});
   const capture=createHybridDecisionCapture(resolve(directory,`${empty}.result.json`),recording);
   capture.snapshotSink.recordSnapshot!({url:'https://example.test/current',title:'Current',text:'Current document',html:'<h1>Current document</h1>'},{});
   const request:ModelRequest={taskId:'offline',purpose:'browser_read_decide',promptVersion:'fixture',messages:[{role:'user',content:JSON.stringify({observation:{revision:empty?0:7,url:empty?'':'https://example.test/other',title:empty?'':'Other',visibleText:'',targets:[],pageActions:[]}})}],outputSchema:{name:'browser-read-action',version:'1'},responseFormat:'JSON_SCHEMA',timeoutMs:100,fallback:'FAIL_CLOSED'};
   await capture.complete(request,async()=>reply('{}',request.purpose));
   assert.deepEqual((await capture.finish()).errors,[{operation:'SNAPSHOT_LINK',errorCode:'DECISION_SNAPSHOT_MISMATCH'}]);
   await recording.finish();
  }
 }finally{await rm(directory,{recursive:true,force:true});}
});

test("F5 provisional discovery crosses real Router/Reducer and retains bounded handoff to the next source", async () => {
 for (const scenario of ["F5_PROVISIONAL_DELIVERS", "F5_NO_ALTERNATE", "F5_SECOND_OUTSIDE", "F5_EDGE_WITH_PRIOR", "F5_EDGE_NO_ALTERNATE"] as const) {
  const prior = scenario.startsWith("F5_EDGE_");
  const result = await runScenario(scenario, {packs:prior?[tableCheckDiscoveryPack,tabelogDiscoveryPack]:[tabelogDiscoveryPack,tableCheckDiscoveryPack]});
  assert.equal(result.state.presentedResults?.candidateIds.length??0,scenario==="F5_SECOND_OUTSIDE"||prior?0:3,JSON.stringify({scenario,state:result.state.phase,continuation:result.state.searchContinuation,nav:result.navigations}));
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult,scenario==="F5_SECOND_OUTSIDE"||prior?"NO":"YES",JSON.stringify(result.evaluation.findings));
  const calls=result.model.requests.filter(request=>request.purpose==="browser_read_decide").map(request=>JSON.parse(request.messages.find(message=>message.role==="user")!.content));
  const corrections=calls.filter(input=>input.regionCorrection);
  assert.equal(corrections.length,(scenario==="F5_NO_ALTERNATE"||scenario==="F5_EDGE_NO_ALTERNATE")?0:1);
  assert.equal(result.navigations.filter(url=>new URL(url).pathname==="/en/tokyo/rstLst/").length,1,"no root restore");
  assert.equal(result.navigations.filter(url=>url==="https://tabelog.com/en/tokyo/A1322/A132201/").length,1);
  const finished=result.state.searchContinuation?.deferredSources?.find(item=>item.progress.sourceId==="tabelog")?.progress ?? result.state.searchContinuation?.sourceProgress;
  assert.ok(finished?.detailAttempts!>=2);assert.ok(finished?.retrieval?.regionPages!<=4);
  if(scenario!=="F5_PROVISIONAL_DELIVERS") {
   assert.equal(finished?.directoryRegion?.stopReason,(scenario==="F5_NO_ALTERNATE"||scenario==="F5_EDGE_NO_ALTERNATE")?"NO_OBSERVED_REPLACEMENT_ENTRANCE":"REPLACEMENT_SAMPLES_OUTSIDE_RADIUS");
   assert.ok(result.navigations.some(url=>url.includes("tablecheck.com")),"source UNKNOWN permits the next existing source");
  }
  if(prior) {
   assert.ok(result.state.candidates.some(candidate=>candidate.restaurant.id.startsWith("tablecheck:")),"the previously admitted nearby candidate survives correction; its missing HARD support cannot become a qualified delivery");
   assert.equal(finished?.detailAttempts,scenario==="F5_EDGE_WITH_PRIOR"?4:2);
  }
  assert.ok(result.model.purposes.length<=50);assert.ok(result.artifact.resourceUsage.modelCallsStarted>=corrections.length+2);
 }
});

// Local constructed pages/model transport, not a website replay. Production
// assembly, planner validation, Native search, Guard and budgets stay in place.
test('F3-034 rejected empty-list rewrites never navigate an implicit general list', async t => {
 for (const mode of ['invalid-keyword','sparse-keep','repeated-keyword'] as const) await t.test(mode, async () => {
  const navigations:string[]=[], requests:ModelRequest[]=[];
  const base=new H001NativeModel('BOTH_BOUNDED_EMPTY');
  let proposals=0;
  const model:ModelGateway={complete:async request=>{
   if(request.purpose!=='restaurant_discovery_retrieval')return base.complete(request);
   requests.push(request);proposals++;
   return reply(JSON.stringify({choice:proposals===1?'KEYWORD':mode==='sparse-keep'?'KEEP':'KEYWORD',
    keyword:proposals===1||mode==='repeated-keyword'?'omakase':mode==='invalid-keyword'?'Shibuya 2':'',
    criterionRef:proposals===1||mode!=='sparse-keep'?'criterion:0':'',generalRef:'',categoryUrl:'',reason:'Local rejected rewrite control'}),request.purpose);
  }};
  const raw=sourcePages('BOTH_BOUNDED_EMPTY',navigations,[],[],[],{guardedReadBoundary:true});
  const browser={...(raw.readNetworkBoundaryCapability?{readNetworkBoundaryCapability:raw.readNetworkBoundaryCapability}:{}),openSession:async(input:Parameters<typeof raw.openSession>[0])=>{
   const session=await raw.openSession(input);
   return new Proxy(session,{get(target,key){if(key==='snapshot')return async()=>{const p=await target.snapshot();return mode==='sparse-keep'&&p.url.includes('/A130301/rstLst/')?{...p,html:p.html+'<a href="https://tabelog.com/en/tokyo/A1303/A130301/rstLst/sushi/">Observed sushi</a>'}:p;};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  }};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:[tabelogDiscoveryPack]}, {model,browser,google:new GooglePlacesClient({apiKey:'FIXTURE',fetchImplementation:async()=>{throw Error('No external API');}}),clock:{now:()=>reference}});
  const intent={timezone:'Asia/Tokyo' as const,area:{query:'Shibuya'},criteria:[{text:'omakase',polarity:'POSITIVE' as const,strength:'HARD' as const}]};
  const read=await assembly.search.search({intent,readRunId:'f3-034-'+mode,continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{...center,label:'Shibuya',radiusMeters:1000,areaMatchBasis:'NAMED_PLACE_RADIUS'}}},new AbortController().signal);
  assert.ok(JSON.parse(requests[1]!.messages.find(x=>x.role==='user')!.content).observation.explicitEmpty,'the rejection follows an actually parsed empty list');
  assert.equal(navigations.some(url=>new URL(url).pathname==='/en/tokyo/A1303/A130301/rstLst/'&&!new URL(url).searchParams.get('sw')),false,`${mode}: rejected retrieval must not clear the keyword and navigate a general list`);
  assert.equal(proposals,2,'one initial and one rejected rewrite; no model repair loop');
  assert.equal(read.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN');
  assert.equal(read.metadata.nativeDiscoveryFunnel?.sourceEnded,true);
  assert.equal(read.candidates.length,0);assert.deepEqual(intent.criteria,[{text:'omakase',polarity:'POSITIVE',strength:'HARD'}]);
 }
 );
 await t.test('invalid shared text does not silently issue a general Google query',async()=>{
  let calls=0;
  const model:ModelGateway={complete:async request=>reply(JSON.stringify({choice:'KEYWORD',keyword:'Shibuya 2',criterionRef:'criterion:0',generalRef:'',categoryUrl:'',reason:'Rejected text plan control'}),request.purpose)};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:[googlePlacesDiscoveryPack]}, {model,browser:{openSession:async()=>{throw Error('No browser');}},google:new GooglePlacesClient({apiKey:'FIXTURE',fetchImplementation:async()=>{calls++;throw Error('No query after rejection');}}),clock:{now:()=>reference}});
  const intent={timezone:'Asia/Tokyo' as const,area:{query:'Shibuya'},criteria:[{text:'omakase',polarity:'POSITIVE' as const,strength:'HARD' as const}]};
  const read=await assembly.search.search({intent,readRunId:'invalid-text',continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{...center,label:'Shibuya',radiusMeters:1000,areaMatchBasis:'NAMED_PLACE_RADIUS'}}},new AbortController().signal);
  assert.equal(calls,0,'a rejected proposal must not become an unfiltered API query');
  assert.equal(read.metadata.failureCode,'DISCOVERY_SOURCE_INCOMPLETE');assert.equal(read.candidates.length,0);
 });
});

// LOCAL CONSTRUCTED cancellation, not a website replay. The real source,
// Router and Reducer must preserve only candidates completed before the abort.
test('F6 reserve search hands completed Native and Google children through SEARCH_COMPLETED',async t=>{
 for(const source of ['native','google'] as const)await t.test(source,async()=>{
  const controller=new AbortController();const navigations:string[]=[];let calls=0,closed=0;
  const stop=()=>controller.abort(Object.assign(Error('F6 reserve boundary'),{code:'DELIVERY_RESERVE_REACHED'}));
  const delegate=new H001NativeModel('TABELOG_DELIVERS');
  const model:ModelGateway={complete:async request=>{
   const result=await delegate.complete(request);
   if(request.purpose==='restaurant_semantic_interpret'){
    const proposal=JSON.parse(result.outputText);proposal.facts.find((f:{field:string})=>f.field==='AREA').value.query='nearby';
    return {...result,outputText:JSON.stringify(proposal)};
   }
   return result;
  }};
  const raw=sourcePages('TABELOG_DELIVERS',navigations,[],[],[],{guardedReadBoundary:true});
  const browser:import('../../../infrastructure/browser/browser-runtime.js').BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{
   const session=await raw.openSession(input);
   return new Proxy(session,{get(target,key){
    if(key==='navigate')return async(url:string,...args:unknown[])=>{if(/\/101\/$/.test(new URL(url).pathname)){stop();throw controller.signal.reason;}return target.navigate(url,...args as []);};
    if(key==='close')return async()=>{closed++;await target.close();};
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
   }});
  }};
  const google=new GooglePlacesClient({apiKey:'FIXTURE',fetchImplementation:async(_url,init)=>{
   calls++;const body=JSON.parse(String(init?.body));
   if(body.pageToken){stop();throw controller.signal.reason;}
   return new Response(JSON.stringify({places:[{id:'completed-a',displayName:{text:'Completed A'},formattedAddress:'Shibuya, Tokyo',location:center,types:['restaurant'],primaryType:'japanese_restaurant',businessStatus:'OPERATIONAL'}],nextPageToken:'unfinished-b'}),{status:200});
  }});
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:source==='native'?[tabelogDiscoveryPack]:[googlePlacesDiscoveryPack]}, {model,browser,google,clock:{now:()=>reference}});
  const composition=createHybridReadComposition({taskId:'f6-search-'+source,runId:'f6-search-'+source,clock:{now:()=>reference},model,...assembly});
  await composition.interpretAndDispatch({taskId:'f6-search-'+source,message:'Find omakase in Shibuya for two at 7pm.',referenceTime:reference.toISOString(),timezone:'Asia/Tokyo'},{...center,radiusMeters:1000,label:'Local Shibuya circle',source:'LOCAL_CONSTRUCTED'});
  const before=composition.runtime.snapshot('f6-search-'+source);
  const router=new RestaurantExecutionRouter(assembly.search,assembly.availability,assembly.router,assembly.facts);
  const result=await router.execute({type:'SEARCH_RESTAURANTS'},before.domainState,reference.toISOString(),'f6-search-'+source,controller.signal);
  assert.equal(controller.signal.aborted,true,'the second child must actually enter the reserve cancellation');
  assert.equal(result.event?.type,'SEARCH_COMPLETED','a reserve abort must not discard a completed child as SEARCH_FAILED');
  if(result.event?.type!=='SEARCH_COMPLETED')throw Error('Missing retained search event');
  assert.equal(result.event.candidates.length,1,'only fully accepted A survives, never partial B');
  assert.equal(result.event.continuation?.exhausted,false,'cancelled source remains unknown, not exhausted');
  assert.deepEqual(result.event.metadata.reserveReached?.completedCandidateIds,result.event.candidates.map(c=>c.restaurant.id));
  if(source==='native'){
   assert.equal(result.event.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN');
   assert.equal(result.event.continuation?.sourceProgress?.detailAttempts,2,'started B remains charged');assert.equal(closed,1);
  }else{assert.equal(calls,2);assert.equal(result.event.continuation?.pagesRead,1);assert.equal(result.event.metadata.googleRequests?.total,2);}
  await composition.runtime.dispatch({id:'f6-partial-search',taskId:before.id,event:result.event,occurredAt:reference.toISOString(),trace:{schemaVersion:'1',runId:before.runId,correlationId:'partial',actor:'ADAPTER'}},before.version);
  const after=composition.runtime.snapshot(before.id).domainState;
  assert.equal(after.candidates.length,1);assert.equal(after.searchContinuation?.exhausted,false);
  assert.ok(after.readEvidence.some(e=>e.candidateId===after.candidates[0]!.restaurant.id&&e.kind==='DISCOVERY'));
  assert.equal(after.presentedResults,undefined,'discovery retention alone grants no qualification');
 });
});
