import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantAvailabilityRead, RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { BrowserTaskExecutor, type BrowserExecutionBudget, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { TableCheckBrowserAvailability } from "../tablecheck/tablecheck-browser-availability.js";
import type { TableCheckIdentityDiagnostic } from "../tablecheck/tablecheck-contracts.js";
import { TabelogBrowserAvailability } from "../tabelog/tabelog-browser-availability.js";
import type { TabelogIdentityDiagnostic, TabelogUserInterventionHandler } from "../tabelog/tabelog-contracts.js";
import { AvailabilitySourceResolver } from "./availability-source-resolver.js";

export interface LiveBrowserAvailabilityOptions {
  maxTableCheckBrowserSessions?: number;
  maxTabelogBrowserSessions?: number;
  maxTabelogCandidateMatches?: number;
  maxModelCallsPerCandidate?: number;
  maxModelCallsTotal?: number;
  maxOperationsPerCandidate?: number;
  maxAutomaticElapsedMs?: number;
  onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void;
  onTableCheckIdentityDiagnostic?: (diagnostic: TableCheckIdentityDiagnostic) => void;
  onTabelogIdentityDiagnostic?: (diagnostic: TabelogIdentityDiagnostic) => void;
  onTabelogUserInterventionRequired?: TabelogUserInterventionHandler;
}

/**
 * The one real Live availability composition used by both the local Web and H001.
 * Each call owns one shared browser session, which is closed after the source chain.
 */
export class LiveBrowserAvailability {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  /** Persists across candidate batches in one Live availability composition. */
  private readonly browserBudget: BrowserExecutionBudget = { totalModelCalls: 0 };

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly model: ModelGateway,
    private readonly options: LiveBrowserAvailabilityOptions = {},
  ) {}

  /** Called by the Router once per Agent loop, not once per candidate batch. */
  beginReadRun(): void {
    this.browserBudget.totalModelCalls = 0;
  }

  /** No session survives a check; reset avoids carrying a completed case into another one. */
  endReadRun(): void {
    this.browserBudget.totalModelCalls = 0;
  }

  async check(request: RestaurantAvailabilityRequest, signal: AbortSignal): Promise<RestaurantAvailabilityRead> {
    const executor = new BrowserTaskExecutor(this.runtime, {
      modelDecision: new ModelBrowserReadActionDecision(this.model),
      ...(this.options.maxModelCallsPerCandidate !== undefined ? { maxModelCallsPerCandidate: this.options.maxModelCallsPerCandidate } : {}),
      ...(this.options.maxModelCallsTotal !== undefined ? { maxModelCallsTotal: this.options.maxModelCallsTotal } : {}),
      ...(this.options.maxOperationsPerCandidate !== undefined ? { maxOperationsPerCandidate: this.options.maxOperationsPerCandidate } : {}),
      ...(this.options.maxAutomaticElapsedMs !== undefined ? { maxAutomaticElapsedMs: this.options.maxAutomaticElapsedMs } : {}),
      ...(this.options.onBrowserDiagnostic ? { onDiagnostic: this.options.onBrowserDiagnostic } : {}),
      budget: this.browserBudget,
    });
    const tableCheck = new TableCheckBrowserAvailability(executor, undefined, {
      ...(this.options.maxTableCheckBrowserSessions !== undefined ? { maxBrowserSessions: this.options.maxTableCheckBrowserSessions } : {}),
      ...(this.options.onTableCheckIdentityDiagnostic ? { onIdentityDiagnostic: this.options.onTableCheckIdentityDiagnostic } : {}),
    });
    const tabelog = new TabelogBrowserAvailability(executor, undefined, this.options.maxTabelogCandidateMatches, {
      ...(this.options.maxTabelogBrowserSessions !== undefined ? { maxBrowserSessions: this.options.maxTabelogBrowserSessions } : {}),
      ...(this.options.onTabelogIdentityDiagnostic ? { onIdentityDiagnostic: this.options.onTabelogIdentityDiagnostic } : {}),
      ...(this.options.onTabelogUserInterventionRequired ? { onUserInterventionRequired: this.options.onTabelogUserInterventionRequired } : {}),
    });
    return new AvailabilitySourceResolver(tableCheck, tabelog, { afterRead: () => executor.close() }).check(request, signal);
  }
}
