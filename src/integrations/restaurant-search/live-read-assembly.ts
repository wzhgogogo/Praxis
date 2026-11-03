import {positiveDiscoveryCriteria} from "../../domains/restaurant/discovery-retrieval.js";
import {ModelDiscoveryRetrievalPlanner} from "./discovery-retrieval-planner.js";
import {restaurantSearchIntentFingerprint, type RestaurantSearchRequest, type RestaurantSearchRead} from "../../domains/restaurant/contracts.js";
import type { LiveReadInvestigationBudget } from "../../application/live-read-investigation-budget.js";
import type { RestaurantAgentLoopOptions } from "../../application/restaurant-agent-loop.js";
import type { RestaurantExecutionRouterOptions } from "../../application/restaurant-execution-router.js";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RuntimeClock } from "../../core/task-runtime/contracts.js";
import type { BrowserExecutionBudget } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { LiveBrowserAvailability, type LiveBrowserAvailabilityOptions } from "../restaurant-availability/live-browser-availability.js";
import { composeNativeRestaurantRead } from "./native-read-composition.js";
import { candidateAvailabilityPath, restaurantDiscoveryPacks, type DiscoverySourcePack } from "./source-packs.js";
import { TabelogBookingHandoffReader } from "../tabelog/tabelog-booking-handoff-reader.js";
import { TableCheckBookingHandoffReader } from "../tablecheck/tablecheck-booking-handoff-reader.js";
import { RestaurantBookingTerms } from "../restaurant-facts/booking-terms.js";
import {ObservedOutletNames} from "../restaurant-identity/observed-outlet-names.js";

export interface LiveReadAssemblyConfig extends LiveReadInvestigationBudget {
  /** Existing Pack selection; controlled sources may explicitly restrict coverage. */
  packs?: readonly DiscoverySourcePack[];
  evaluationLocation?: { latitude: number; longitude: number; radiusMeters: number; label: string };
}

export interface LiveReadTransports {
  model: ModelGateway;
  google: GooglePlacesClient;
  browser: BrowserRuntime;
  clock: RuntimeClock;
  onBrowserDiagnostic?: LiveBrowserAvailabilityOptions["onBrowserDiagnostic"];
  onTableCheckIdentityDiagnostic?: LiveBrowserAvailabilityOptions["onTableCheckIdentityDiagnostic"];
  onTabelogIdentityDiagnostic?: LiveBrowserAvailabilityOptions["onTabelogIdentityDiagnostic"];
  onTabelogUserInterventionRequired?: LiveBrowserAvailabilityOptions["onTabelogUserInterventionRequired"];
  remainingModelCalls?: RestaurantAgentLoopOptions["remainingModelCalls"];
  /** Persistent Web root task scope; absent outside that authenticated composition. */
  currentTaskId?: () => string | undefined;
}

/** One production assembly for in-memory Runner, persistent Web and offline controls. */
export function createLiveReadAssembly(config: LiveReadAssemblyConfig, transports: LiveReadTransports) {
  const { packs, evaluationLocation, ...ceilings } = config;
  for (const [key, value] of Object.entries(ceilings)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`Explicit positive read limit required: ${key}`);
  }
  const runCeilings = Object.freeze({ ...ceilings });
  const now = () => transports.clock.now().toISOString();
  const taskId = transports.currentTaskId ?? (() => undefined);
  const sourceNames=new ObservedOutletNames(transports.browser);
  const tabelogHandoffs = new TabelogBookingHandoffReader(sourceNames.runtime, taskId, now);
  const tablecheckHandoffs = new TableCheckBookingHandoffReader(tabelogHandoffs.runtime, taskId, now);
  const bookingLinks = {
    runtime: tablecheckHandoffs.runtime, now,
    capture: (request: Parameters<typeof tablecheckHandoffs.capture>[0], signal: AbortSignal, read: () => ReturnType<typeof tablecheckHandoffs.capture>) =>
      tabelogHandoffs.capture(request, signal, () => tablecheckHandoffs.capture(request, signal, read)),
    readPrepared: (view: Parameters<typeof tablecheckHandoffs.readPrepared>[0]) => [...tabelogHandoffs.readPrepared(view), ...tablecheckHandoffs.readPrepared(view)],
  };
  const browserBudget: BrowserExecutionBudget = { totalModelCalls: 0, maxModelCalls: config.maxBrowserModelCallsTotal };
  const google = new GooglePlacesRestaurantSearch(transports.google, now, config.maxDiscoveryCandidates, { maxRequests: config.maxGoogleRequests });
  const native = composeNativeRestaurantRead(google, sourceNames.runtime, transports.model, browserBudget,
    transports.onBrowserDiagnostic, evaluationLocation, now, {
      maxModelCallsPerCandidate: config.maxBrowserModelCallsPerCandidate,
      maxModelCallsTotal: config.maxBrowserModelCallsTotal,
      maxOperationsPerCandidate: config.maxBrowserOperationsPerCandidate,
      maxAutomaticElapsedMs: config.maxAutomaticBrowserMs,
    }, {
      maxModelCallsPerCandidate: config.maxFactModelCallsPerCandidate,
      maxModelCallsTotal: config.maxBrowserModelCallsTotal,
      maxOperationsPerCandidate: config.maxFactBrowserOperationsPerCandidate,
      maxAutomaticElapsedMs: config.maxFactBrowserMs,
      maxElapsedMsPerCandidate: config.maxFactBrowserMs,
      maxElapsedMsPerProvider: config.maxFactProviderMs,
    }, packs);
  const terms = new RestaurantBookingTerms(native.questions, bookingLinks.readPrepared, taskId,
    transports.remainingModelCalls ?? (()=>undefined), now, config.maxAutomaticBrowserMs);
  const bookingHandoffs = {...bookingLinks,readPrepared:terms.readPrepared};
  const questions=Object.assign(native.questions,{readBookingTerms:terms.readBookingTerms.bind(terms)});
  const availabilityPacks = packs?.some(pack => pack.availability) ? packs : restaurantDiscoveryPacks;
  const sourceAvailability = new LiveBrowserAvailability(bookingHandoffs.runtime, transports.model, {
    now, browserBudget,
    japaneseName: google.japaneseName.bind(google),
    maxAvailabilitySourceBrowserSessions: config.maxAvailabilitySourceBrowserSessions,
    maxAvailabilitySourceCandidateMatches: config.maxAvailabilitySourceCandidateMatches,
    maxModelCallsPerCandidate: config.maxBrowserModelCallsPerCandidate,
    maxModelCallsTotal: config.maxBrowserModelCallsTotal,
    maxOperationsPerCandidate: config.maxBrowserOperationsPerCandidate,
    maxElapsedMsPerCandidate: config.maxCandidateBrowserMs,
    maxElapsedMsPerProvider: config.maxProviderBrowserMs,
    maxAutomaticElapsedMs: config.maxAutomaticBrowserMs,
    packs: availabilityPacks,
    ...(transports.onBrowserDiagnostic ? { onBrowserDiagnostic: transports.onBrowserDiagnostic } : {}),
    ...(transports.onTableCheckIdentityDiagnostic ? { onTableCheckIdentityDiagnostic: transports.onTableCheckIdentityDiagnostic } : {}),
    ...(transports.onTabelogIdentityDiagnostic ? { onTabelogIdentityDiagnostic: transports.onTabelogIdentityDiagnostic } : {}),
    ...(transports.onTabelogUserInterventionRequired ? { onTabelogUserInterventionRequired: transports.onTabelogUserInterventionRequired } : {}),
  });
  const availability = {
    executionRoute: sourceAvailability.executionRoute,
    beginReadRun: () => sourceAvailability.beginReadRun(),
    endReadRun: () => sourceAvailability.endReadRun(),
    browserModelBudgetExhausted: () => sourceAvailability.browserModelBudgetExhausted(),
    check: async (request: Parameters<LiveBrowserAvailability["check"]>[0], signal: AbortSignal, readRunId?: string) => {
      const read = await sourceNames.capture(()=>bookingHandoffs.capture(request, signal, () => sourceAvailability.check(request, signal, readRunId)));
      return {...read,evidence:[...read.evidence,...await google.observedSourceNames(request.candidates,readRunId)],metadata:{...read.metadata,googleRequests:google.googleRequestUsage(readRunId)}};
    },
  };
  const modelReadReserve = transports.model as ModelGateway & Partial<NonNullable<RestaurantExecutionRouterOptions["modelReadReserve"]>>;
  const router: RestaurantExecutionRouterOptions = {
    structuredReadTimeoutMs: config.maxStructuredReadMs,
    browserReadTimeoutMs: transports.onTabelogUserInterventionRequired ? null : config.maxAutomaticBrowserMs,
    ...(modelReadReserve.runRead ? { modelReadReserve: { runRead: modelReadReserve.runRead.bind(modelReadReserve) } } : {}),
  };
  const loop: RestaurantAgentLoopOptions = {
    maxSteps: config.maxAgentSteps, maxRejectedActions: config.maxRejectedActions, timeoutMs: config.maxAutomaticBrowserMs,
    ...(transports.remainingModelCalls ? { remainingModelCalls: transports.remainingModelCalls } : {}),
  };
  const retrievalPlanner=new ModelDiscoveryRetrievalPlanner(transports.model,browserBudget);
  const plannedSearch = packs?.length===1&&packs[0]&&!packs[0].browser?{
    executionRoute:google.executionRoute,
    googleRequestUsage:google.googleRequestUsage.bind(google),
    async search(request:RestaurantSearchRequest,signal:AbortSignal):Promise<RestaurantSearchRead>{
      const locationName=request.intent.area?.query.trim().toLowerCase()==='nearby'?'':request.intent.area?.query??'';
      const selection=request.continuation?.structuredRetrieval??(positiveDiscoveryCriteria(request.intent).length?await retrievalPlanner.decide({taskId:request.readRunId??'discovery',intent:request.intent,locationName,attemptedRetrievals:[],rewrites:0,timeoutMs:config.maxStructuredReadMs}):{accepted:true,reason:'General retrieval: no positive criteria.'});
      if (!selection.accepted) return {candidates:[],evidence:[],
        continuation:{intentFingerprint:restaurantSearchIntentFingerprint(request.intent),usedPageTokens:request.continuation?.usedPageTokens??[],pagesRead:request.continuation?.pagesRead??0,exhausted:true,structuredRetrieval:selection,lastFailureCode:'DISCOVERY_SOURCE_INCOMPLETE',...(request.continuation?.locationContext?{locationContext:request.continuation.locationContext}:{})},
        metadata:{provider:'GOOGLE_PLACES',route:'STRUCTURED_ADAPTER',latencyMs:0,failureCode:'DISCOVERY_SOURCE_INCOMPLETE',googleRequests:google.googleRequestUsage(request.readRunId)}};
      const read=await google.search({...request,discoveryRetrieval:selection},signal);
      return {...read,...(read.continuation?{continuation:{...read.continuation,structuredRetrieval:selection}}:{})};
    },
  }:native.search;
  const search = {
    ...plannedSearch,
    executionRoute: plannedSearch.executionRoute,
    googleRequestUsage: plannedSearch.googleRequestUsage?.bind(plannedSearch),
    async search(request: RestaurantSearchRequest, signal: AbortSignal) {
      const read = await (request.intent.target?.selectionScope==="SPECIFIC_OUTLET"?google:plannedSearch).search(request, signal);
      return { ...read, evidence: read.evidence.map(evidence => {
        const candidate = read.candidates.find(item => item.restaurant.id === evidence.candidateId);
        return evidence.kind === "DISCOVERY" && candidate
          ? { ...evidence, claims: { ...evidence.claims, availabilityPath: candidateAvailabilityPath(candidate.restaurant, availabilityPacks) } }
          : evidence;
      }) };
    },
  };
  const facts={...native.facts,executionRoute:native.facts.executionRoute,
    inspectFacts:(...args:Parameters<typeof native.facts.inspectFacts>)=>sourceNames.capture(()=>native.facts.inspectFacts(...args))};
  return { ...native, facts, questions, search, google, availability, bookingHandoffs, router, loop, browserBudget, runCeilings };
}
