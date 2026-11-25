import { AsyncLocalStorage } from "node:async_hooks";
import type { BrowserReadLimits } from "../../infrastructure/browser/browser-task-executor.js";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantAvailabilityRead, RestaurantAvailabilityRequest,RestaurantCandidateFactRead } from "../../domains/restaurant/contracts.js";
import { ModelBrowserReadActionDecision, type BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { BrowserTaskExecutor, type BrowserExecutionBudget, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadNetworkPolicy, BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { TableCheckEntryLedger } from "../tablecheck/tablecheck-browser-availability.js";
import type { TableCheckIdentityDiagnostic } from "../tablecheck/tablecheck-contracts.js";

import type { TabelogIdentityDiagnostic, TabelogUserInterventionHandler } from "../tabelog/tabelog-contracts.js";
import { AvailabilitySourceResolver } from "./availability-source-resolver.js";
import { restaurantPublicReadNetworkPolicy } from "./public-browser-read-network-policy.js";
import { restaurantDiscoveryPacks } from "../restaurant-search/source-packs.js";
import type { DiscoverySourcePack } from "../restaurant-search/source-packs.js";
import { ModelNamedSourceQuery, type NamedSourceAlternative } from "../restaurant-search/named-source-query.js";
import type { GooglePlacesSourceName } from "../google/google-places-contracts.js";

export interface LiveBrowserAvailabilityOptions extends BrowserReadLimits {
  now?: () => string;
  /** Shared with fact reads for one Router-owned investigation, never process-global. */
  browserBudget?: BrowserExecutionBudget;
  maxAvailabilitySourceBrowserSessions?: number;
  maxAvailabilitySourceCandidateMatches?: number;
  maxElapsedMsPerCandidate?: number;
  maxElapsedMsPerProvider?: number;
  onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void;
  onTableCheckIdentityDiagnostic?: (diagnostic: TableCheckIdentityDiagnostic) => void;
  onTabelogIdentityDiagnostic?: (diagnostic: TabelogIdentityDiagnostic) => void;
  onTabelogUserInterventionRequired?: TabelogUserInterventionHandler;
  /** Frozen offline Replay may supply prior sanitized wires; live reads create the model decision below. */
  modelDecision?: BrowserReadActionDecisionPort;
  /** Required before this composition uses its broader observed-query controls. */
  networkPolicy?: BrowserReadNetworkPolicy;
  /**
   * A source-stage read may deliberately exercise one reviewed Pack. Normal
   * Hybrid execution keeps the registered set and therefore unchanged routing.
   */
  packs?: readonly DiscoverySourcePack[];
  /** Offline Replay may bind a frozen fragment instead of a new model proposal. */
  alternativeSearch?: NamedSourceAlternative;
  japaneseName?: (placeId: string, readRunId: string | undefined, signal: AbortSignal) => Promise<GooglePlacesSourceName>;
}

/**
 * The one real Live availability composition used by both the local Web and H001.
 * An Agent read owns source-specific sessions; standalone calls close after their source chain.
 */
export class LiveBrowserAvailability {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  private readonly readRuns = new AsyncLocalStorage<{
    browserBudget: BrowserExecutionBudget; tableCheckEntryLedger: TableCheckEntryLedger;
    namedQueries: ModelNamedSourceQuery; readExecutor: BrowserTaskExecutor | undefined; scopeId?: string;
  }>();
  private readonly legacyRun: NonNullable<ReturnType<typeof this.readRuns.getStore>>;
  private readonly networkPolicy: BrowserReadNetworkPolicy | undefined;
  private get run() { return this.readRuns.getStore() ?? this.legacyRun; }
  private get browserBudget() { return this.run.browserBudget; }
  private get tableCheckEntryLedger() { return this.run.tableCheckEntryLedger; }
  private set tableCheckEntryLedger(value: TableCheckEntryLedger) { this.run.tableCheckEntryLedger = value; }
  private get namedQueries() { return this.run.namedQueries; }
  private get readExecutor() { return this.run.readExecutor; }
  private set readExecutor(value: BrowserTaskExecutor | undefined) { this.run.readExecutor = value; }

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly model: ModelGateway,
    private readonly options: LiveBrowserAvailabilityOptions,
  ) {
    const browserBudget = options.browserBudget ?? { totalModelCalls: 0 };
    this.legacyRun = { browserBudget, tableCheckEntryLedger: new TableCheckEntryLedger(),
      namedQueries: new ModelNamedSourceQuery(model, browserBudget), readExecutor: undefined };
    this.networkPolicy = options.networkPolicy
      ?? (runtime.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? restaurantPublicReadNetworkPolicy : undefined);
    if (options.maxModelCallsTotal !== undefined) this.browserBudget.maxModelCalls = options.maxModelCallsTotal;
  }

  /** One invocation owns its sessions/ledger, including work after the Agent loop. */
  async withReadRun<T>(read: () => Promise<T>, scopeId?: string, sharedBudget?: BrowserExecutionBudget): Promise<T> {
    const active = this.readRuns.getStore();
    if (active && (scopeId === undefined || active.scopeId === scopeId) && (!sharedBudget || active.browserBudget === sharedBudget)) return read();
    const browserBudget = sharedBudget ?? { totalModelCalls: 0, maxModelCalls: this.options.maxModelCallsTotal };
    return this.readRuns.run({ browserBudget, ...(scopeId !== undefined ? { scopeId } : {}), tableCheckEntryLedger: new TableCheckEntryLedger(),
      namedQueries: new ModelNamedSourceQuery(this.model, browserBudget), readExecutor: undefined }, async () => {
      this.beginReadRun();
      try { return await read(); } finally { await this.endReadRun(); }
    });
  }

  browserModelBudgetExhausted(): boolean {
    return this.browserBudget.totalModelCalls >= Math.min(this.options.maxModelCallsTotal, this.browserBudget.maxModelCalls ?? Infinity);
  }

  /** Called by the Router once per Agent loop, not once per candidate batch. */
  beginReadRun(): void {
    if (this.readExecutor) throw new Error("A browser read run is already active");
    this.browserBudget.totalModelCalls = 0;
    this.tableCheckEntryLedger = new TableCheckEntryLedger();
    this.namedQueries.clear();
    this.readExecutor = this.createExecutor(true);
  }

  /** Session ownership ends at the Agent read boundary, never at a candidate checkpoint. */
  async endReadRun(): Promise<void> {
    const executor=this.readExecutor;this.readExecutor=undefined;
    this.browserBudget.totalModelCalls = 0;
    this.tableCheckEntryLedger = new TableCheckEntryLedger();
    this.namedQueries.clear();
    await executor?.closeAll();
  }

  async check(request: RestaurantAvailabilityRequest, signal: AbortSignal, readRunId?: string): Promise<RestaurantAvailabilityRead> {
    return this.read(request,signal,readRunId,false);
  }

  /** Existing source search/match, stopped before any inventory controls. */
  async identify(request:RestaurantAvailabilityRequest,signal:AbortSignal,readRunId?:string,targetQuery?:string):Promise<RestaurantCandidateFactRead>{
    const read=await this.read(request,signal,readRunId,true,targetQuery);
    const evidence=read.evidence.filter(e=>e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH");
    return {evidence,factChecks:Object.fromEntries(request.candidateIds.map(candidateId=>{
      const bound=evidence.filter(e=>e.candidateId===candidateId);
      return [candidateId,{status:bound.length?"COMPLETED" as const:"UNKNOWN" as const,
        checkedAt:this.options.now?.()??new Date().toISOString(),evidenceIds:bound.map(e=>e.evidenceId),
        reasonCode:bound.length?"NAMED_OUTLET_IDENTITY_ONLY":"NAMED_OUTLET_IDENTITY_UNCONFIRMED"}];
    })),metadata:read.metadata};
  }

  private createExecutor(reuseSourceSessions:boolean):BrowserTaskExecutor {
    return new BrowserTaskExecutor(this.runtime, { reuseSourceSessions, maxAutomaticElapsedMs: this.options.maxAutomaticElapsedMs,
      maxModelCallsPerCandidate: this.options.maxModelCallsPerCandidate,
      maxModelCallsTotal: this.options.maxModelCallsTotal,
      maxOperationsPerCandidate: this.options.maxOperationsPerCandidate,
      modelDecision: this.options.modelDecision ?? new ModelBrowserReadActionDecision(this.model),
      ...(this.options.maxElapsedMsPerCandidate !== undefined ? { maxElapsedMsPerCandidate: this.options.maxElapsedMsPerCandidate } : {}),
      ...(this.options.maxElapsedMsPerProvider !== undefined ? { maxElapsedMsPerProvider: this.options.maxElapsedMsPerProvider } : {}),
      ...(this.options.maxAutomaticElapsedMs !== undefined ? { maxAutomaticElapsedMs: this.options.maxAutomaticElapsedMs } : {}),
      ...(this.options.onBrowserDiagnostic ? { onDiagnostic: this.options.onBrowserDiagnostic } : {}),
      budget: this.browserBudget,
    });
  }

  private async read(request:RestaurantAvailabilityRequest,signal:AbortSignal,readRunId:string|undefined,identityOnly:boolean,targetQuery?:string):Promise<RestaurantAvailabilityRead>{
    const executor=this.readExecutor??this.createExecutor(true);
    if(identityOnly&&targetQuery)request={...request,selectionScope:"SPECIFIC_OUTLET"};
    const providerContext = {
      executor,
      ...(identityOnly?{identityOnly:true}:{}),
      ...(targetQuery?{targetQuery}:{}),
      sourceFactsModel: this.model,
      ...(this.options.now ? { now: this.options.now } : {}),
      ...(this.options.maxAvailabilitySourceBrowserSessions !== undefined ? { maxBrowserSessions: this.options.maxAvailabilitySourceBrowserSessions } : {}),
      ...(this.options.maxAvailabilitySourceCandidateMatches !== undefined ? { maxCandidateMatches: this.options.maxAvailabilitySourceCandidateMatches } : {}),
      tableCheckEntryLedger: this.tableCheckEntryLedger,
      alternativeSearch: this.options.alternativeSearch ?? this.namedQueries.alternative,
      ...(this.options.japaneseName ? {japaneseName: (candidate: RestaurantAvailabilityRequest["candidates"][number], nameSignal: AbortSignal) =>
        this.options.japaneseName!(candidate.restaurant.sourceIds.googlePlaces!, readRunId, nameSignal)} : {}),
      ...(this.options.onTableCheckIdentityDiagnostic ? { onTableCheckIdentityDiagnostic: this.options.onTableCheckIdentityDiagnostic } : {}),
      ...(this.options.onTabelogIdentityDiagnostic ? { onTabelogIdentityDiagnostic: this.options.onTabelogIdentityDiagnostic } : {}),
      ...(this.options.onTabelogUserInterventionRequired ? { onTabelogUserInterventionRequired: this.options.onTabelogUserInterventionRequired } : {}),
      ...(this.networkPolicy ? { networkPolicy: this.networkPolicy } : {}),
    };
    const bindings = (this.options.packs ?? restaurantDiscoveryPacks)
      .flatMap((pack) => pack.availability ? [{ pack, provider: pack.availability.createProvider(providerContext) }] : []);
    return new AvailabilitySourceResolver(bindings, { afterRead: async () => {
      if (this.readExecutor === executor) executor.endReadScope();
      else await executor.closeAll();
    },...(identityOnly?{identityOnly:true}:{}) }).check(request, signal);
  }
}
