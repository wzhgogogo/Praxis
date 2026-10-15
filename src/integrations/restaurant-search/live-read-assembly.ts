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
import type { DiscoverySourcePack } from "./source-packs.js";

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
}

/** One production assembly for in-memory Runner, persistent Web and offline controls. */
export function createLiveReadAssembly(config: LiveReadAssemblyConfig, transports: LiveReadTransports) {
  const { packs, evaluationLocation, ...ceilings } = config;
  for (const [key, value] of Object.entries(ceilings)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`Explicit positive read limit required: ${key}`);
  }
  const runCeilings = Object.freeze({ ...ceilings });
  const now = () => transports.clock.now().toISOString();
  const browserBudget: BrowserExecutionBudget = { totalModelCalls: 0, maxModelCalls: config.maxBrowserModelCallsTotal };
  const google = new GooglePlacesRestaurantSearch(transports.google, now, config.maxDiscoveryCandidates, { maxRequests: config.maxGoogleRequests });
  const native = composeNativeRestaurantRead(google, transports.browser, transports.model, browserBudget,
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
  const availability = new LiveBrowserAvailability(transports.browser, transports.model, {
    now, browserBudget,
    maxAvailabilitySourceBrowserSessions: config.maxAvailabilitySourceBrowserSessions,
    maxAvailabilitySourceCandidateMatches: config.maxAvailabilitySourceCandidateMatches,
    maxModelCallsPerCandidate: config.maxBrowserModelCallsPerCandidate,
    maxModelCallsTotal: config.maxBrowserModelCallsTotal,
    maxOperationsPerCandidate: config.maxBrowserOperationsPerCandidate,
    maxElapsedMsPerCandidate: config.maxCandidateBrowserMs,
    maxElapsedMsPerProvider: config.maxProviderBrowserMs,
    maxAutomaticElapsedMs: config.maxAutomaticBrowserMs,
    ...(packs?.some(pack => pack.availability) ? { packs } : {}),
    ...(transports.onBrowserDiagnostic ? { onBrowserDiagnostic: transports.onBrowserDiagnostic } : {}),
    ...(transports.onTableCheckIdentityDiagnostic ? { onTableCheckIdentityDiagnostic: transports.onTableCheckIdentityDiagnostic } : {}),
    ...(transports.onTabelogIdentityDiagnostic ? { onTabelogIdentityDiagnostic: transports.onTabelogIdentityDiagnostic } : {}),
    ...(transports.onTabelogUserInterventionRequired ? { onTabelogUserInterventionRequired: transports.onTabelogUserInterventionRequired } : {}),
  });
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
  const search = packs?.length === 1 && packs[0]?.meta.id === "google-places" ? google : native.search;
  return { ...native, search, google, availability, router, loop, browserBudget, runCeilings };
}
