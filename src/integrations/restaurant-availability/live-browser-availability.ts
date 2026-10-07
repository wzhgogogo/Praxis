import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantAvailabilityRead, RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { BrowserTaskExecutor, type BrowserExecutionBudget, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadNetworkPolicy, BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { TableCheckEntryLedger } from "../tablecheck/tablecheck-browser-availability.js";
import type { TableCheckIdentityDiagnostic } from "../tablecheck/tablecheck-contracts.js";

import type { TabelogIdentityDiagnostic, TabelogUserInterventionHandler } from "../tabelog/tabelog-contracts.js";
import { AvailabilitySourceResolver } from "./availability-source-resolver.js";
import { restaurantPublicReadNetworkPolicy } from "./public-browser-read-network-policy.js";
import { restaurantDiscoveryPacks } from "../restaurant-search/source-packs.js";

export interface LiveBrowserAvailabilityOptions {
  now?: () => string;
  /** Shared with fact reads for one Router-owned investigation, never process-global. */
  browserBudget?: BrowserExecutionBudget;
  maxAvailabilitySourceBrowserSessions?: number;
  maxAvailabilitySourceCandidateMatches?: number;
  maxModelCallsPerCandidate?: number;
  maxModelCallsTotal?: number;
  maxOperationsPerCandidate?: number;
  maxElapsedMsPerCandidate?: number;
  maxElapsedMsPerProvider?: number;
  maxAutomaticElapsedMs?: number;
  onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void;
  onTableCheckIdentityDiagnostic?: (diagnostic: TableCheckIdentityDiagnostic) => void;
  onTabelogIdentityDiagnostic?: (diagnostic: TabelogIdentityDiagnostic) => void;
  onTabelogUserInterventionRequired?: TabelogUserInterventionHandler;
  /** Required before this composition uses its broader observed-query controls. */
  networkPolicy?: BrowserReadNetworkPolicy;
}

/**
 * The one real Live availability composition used by both the local Web and H001.
 * Each call owns one shared browser session, which is closed after the source chain.
 */
export class LiveBrowserAvailability {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  /** Persists across candidate batches in one Live availability composition. */
  private readonly browserBudget: BrowserExecutionBudget;
  private readonly networkPolicy: BrowserReadNetworkPolicy | undefined;
  private tableCheckEntryLedger = new TableCheckEntryLedger();

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly model: ModelGateway,
    private readonly options: LiveBrowserAvailabilityOptions = {},
  ) {
    this.browserBudget = options.browserBudget ?? { totalModelCalls: 0 };
    this.networkPolicy = options.networkPolicy
      ?? (runtime.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? restaurantPublicReadNetworkPolicy : undefined);
    if (options.maxModelCallsTotal !== undefined) this.browserBudget.maxModelCalls = options.maxModelCallsTotal;
  }

  /** Called by the Router once per Agent loop, not once per candidate batch. */
  beginReadRun(): void {
    this.browserBudget.totalModelCalls = 0;
    this.tableCheckEntryLedger = new TableCheckEntryLedger();
  }

  /** No session survives a check; reset avoids carrying a completed case into another one. */
  endReadRun(): void {
    this.browserBudget.totalModelCalls = 0;
    this.tableCheckEntryLedger = new TableCheckEntryLedger();
  }

  async check(request: RestaurantAvailabilityRequest, signal: AbortSignal): Promise<RestaurantAvailabilityRead> {
    const executor = new BrowserTaskExecutor(this.runtime, {
      modelDecision: new ModelBrowserReadActionDecision(this.model),
      ...(this.options.maxModelCallsPerCandidate !== undefined ? { maxModelCallsPerCandidate: this.options.maxModelCallsPerCandidate } : {}),
      ...(this.options.maxModelCallsTotal !== undefined ? { maxModelCallsTotal: this.options.maxModelCallsTotal } : {}),
      ...(this.options.maxOperationsPerCandidate !== undefined ? { maxOperationsPerCandidate: this.options.maxOperationsPerCandidate } : {}),
      ...(this.options.maxElapsedMsPerCandidate !== undefined ? { maxElapsedMsPerCandidate: this.options.maxElapsedMsPerCandidate } : {}),
      ...(this.options.maxElapsedMsPerProvider !== undefined ? { maxElapsedMsPerProvider: this.options.maxElapsedMsPerProvider } : {}),
      ...(this.options.maxAutomaticElapsedMs !== undefined ? { maxAutomaticElapsedMs: this.options.maxAutomaticElapsedMs } : {}),
      ...(this.options.onBrowserDiagnostic ? { onDiagnostic: this.options.onBrowserDiagnostic } : {}),
      budget: this.browserBudget,
    });
    const providerContext = {
      executor,
      ...(this.options.now ? { now: this.options.now } : {}),
      ...(this.options.maxAvailabilitySourceBrowserSessions !== undefined ? { maxBrowserSessions: this.options.maxAvailabilitySourceBrowserSessions } : {}),
      ...(this.options.maxAvailabilitySourceCandidateMatches !== undefined ? { maxCandidateMatches: this.options.maxAvailabilitySourceCandidateMatches } : {}),
      tableCheckEntryLedger: this.tableCheckEntryLedger,
      ...(this.options.onTableCheckIdentityDiagnostic ? { onTableCheckIdentityDiagnostic: this.options.onTableCheckIdentityDiagnostic } : {}),
      ...(this.options.onTabelogIdentityDiagnostic ? { onTabelogIdentityDiagnostic: this.options.onTabelogIdentityDiagnostic } : {}),
      ...(this.options.onTabelogUserInterventionRequired ? { onTabelogUserInterventionRequired: this.options.onTabelogUserInterventionRequired } : {}),
      ...(this.networkPolicy ? { networkPolicy: this.networkPolicy } : {}),
    };
    const bindings = restaurantDiscoveryPacks
      .flatMap((pack) => pack.availability ? [{ pack, provider: pack.availability.createProvider(providerContext) }] : []);
    return new AvailabilitySourceResolver(bindings, { afterRead: () => executor.close() }).check(request, signal);
  }
}
