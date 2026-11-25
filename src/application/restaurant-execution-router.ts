import {canSettlePageQuestion} from '../domains/restaurant/read-assessment.js';
import { AsyncLocalStorage } from "node:async_hooks";
import type { RestaurantPageQuestionPort } from "../domains/restaurant/page-question.js";
import { restaurantFailureCode, type RestaurantFailureCode } from "../domains/restaurant/failure-codes.js";
import type { RestaurantAgentAction } from "../domains/restaurant/agent-action.js";
import type {
  RestaurantAvailabilityCheck,
  RestaurantCandidate,
  RestaurantCandidateFactRead,
  RestaurantCandidateFactRequest,
  RestaurantAvailabilityRead,
  RestaurantAvailabilityRequest,
  RestaurantEvent,
  RestaurantExecutionRoute,
  RestaurantReadExecutionMetadata,
  RestaurantReadObservation,
  RestaurantSearchRead,
  RestaurantSearchRequest,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { restaurantSearchIntentFingerprint } from "../domains/restaurant/contracts.js";
import { assessRestaurantRead, restaurantCurrentFactEvidence, restaurantPresentationEvidenceIds } from "../domains/restaurant/read-assessment.js";
import { completeRestaurantIntent, completeRestaurantSearchIntent } from "../domains/restaurant/intent-state.js";
import {restaurantReserveCancelled,RESTAURANT_READ_CANCEL_SETTLE_MS} from "../domains/restaurant/read-time-reserve.js";
import { RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS } from "../domains/restaurant/availability-freshness.js";
import { restaurantUnverifiedReadSummary } from "../domains/restaurant/read-loop-termination.js";
import type {NamedOutletReference} from "../domains/restaurant/named-outlet-resolution.js";
import {verifiedOutletPagesForAvailability,namedOutletIdentityPrefix,namedOutletCandidateResolved} from "../domains/restaurant/named-outlet-resolution.js";

export interface RestaurantSearchPort {
  readonly executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER";
  search(request: RestaurantSearchRequest, signal: AbortSignal, userSelectedOutlet?:NamedOutletReference): Promise<RestaurantSearchRead>;
  /** Optional source-owned cumulative accounting; never visible to the Agent. */
  googleRequestUsage?(readRunId: string | undefined): NonNullable<RestaurantReadExecutionMetadata["googleRequests"]>;
}

export interface RestaurantAvailabilityPort {
  readonly executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER";
  /** Optional per-Agent-loop budget lifecycle; adapters never receive Task State. */
  browserModelBudgetExhausted?(): boolean;
  beginReadRun?(): void;
  endReadRun?(): void | Promise<void>;
  withReadRun?<T>(read: () => Promise<T>, scopeId?: string): Promise<T>;
  check(request: RestaurantAvailabilityRequest, signal: AbortSignal, readRunId?: string): Promise<RestaurantAvailabilityRead>;
}

export interface RestaurantCandidateFactPort {
  readonly executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER";
  inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal,identityOnly?:boolean): Promise<RestaurantCandidateFactRead>;
  googleRequestUsage?(readRunId: string | undefined): NonNullable<RestaurantReadExecutionMetadata["googleRequests"]>;
}

function googleUsageMetadata(
  port: Pick<RestaurantSearchPort | RestaurantCandidateFactPort, "googleRequestUsage">,
  readRunId: string | undefined,
): Pick<RestaurantReadExecutionMetadata, "googleRequests"> {
  try {
    const googleRequests = port.googleRequestUsage?.(readRunId);
    return googleRequests ? { googleRequests } : {};
  } catch {
    return {};
  }
}

export interface RestaurantExecutionRouterOptions {
  modelReadReserve?: { runRead<T>(remaining: () => number | undefined, qualified: () => boolean, work: () => Promise<T>): Promise<T> };
  structuredReadTimeoutMs: number;
  /** `null` is eval-only: an explicit human browser pause owns its own wait. */
  browserReadTimeoutMs: number | null;
}

export interface RestaurantActionExecution {
  route?: RestaurantExecutionRoute;
  event?: RestaurantEvent;
  observation?: RestaurantReadObservation;
  executionMetadata?: RestaurantReadExecutionMetadata;
  failure?: { source: "PROVIDER"; code: RestaurantFailureCode; reason: string; scope: "CANDIDATE" | "PROVIDER" | "BATCH" | "TASK"; terminal?: boolean };
}

function stableFailureCode(error: unknown, fallback: RestaurantFailureCode): RestaurantFailureCode {
  if (error && typeof error === "object" && "code" in error) return restaurantFailureCode(error.code, fallback);
  return fallback;
}

/** Two real consumers (facts and availability) checkpoint complete candidate reads in the Router. */
async function candidateCheckpoints<Request extends { candidateIds: string[]; candidates: RestaurantCandidate[] }, Read>(
  request: Request, signal: AbortSignal, inspect: (single: Request) => Promise<Read>, completed: Array<{candidateId: string; read: Read}>,
): Promise<void> {
  for (const candidate of request.candidates) {
    if (signal.aborted) throw signal.reason;
    const read = await inspect({ ...request, candidateIds: [candidate.restaurant.id], candidates: [candidate] });
    if (signal.aborted) throw signal.reason;
    completed.push({ candidateId: candidate.restaurant.id, read });
  }
}

function reserveCause(error: unknown, signal?: AbortSignal): "MODEL_CALL" | "DELIVERY_TIME" | undefined {
  if (signal?.aborted && stableFailureCode(signal.reason, "AGENT_EXECUTION_FAILED") === "DELIVERY_RESERVE_REACHED") return "DELIVERY_TIME";
  if (stableFailureCode(error, "AGENT_EXECUTION_FAILED") === "BUDGET_RESERVED_FOR_DELIVERY") return "MODEL_CALL";
  return undefined;
}

function checkpointMetadata(reads: Array<{metadata: RestaurantReadExecutionMetadata}>, fallback: RestaurantReadExecutionMetadata): RestaurantReadExecutionMetadata {
  const metadata = { ...fallback, ...reads.at(-1)?.metadata, latencyMs: reads.reduce((n,r)=>n+r.metadata.latencyMs,0) };
  const usage = reads.flatMap(read=>read.metadata.modelUsage ? [read.metadata.modelUsage] : []);
  if (usage.length) metadata.modelUsage = {calls:usage.reduce((n,u)=>n+u.calls,0),inputTokens:usage.reduce((n,u)=>n+(u.inputTokens??0),0),outputTokens:usage.reduce((n,u)=>n+(u.outputTokens??0),0),totalTokens:usage.reduce((n,u)=>n+(u.totalTokens??0),0)};
  const attempts = reads.flatMap(r=>r.metadata.providerAttempts??[]);
  const continuity = reads.flatMap(r=>r.metadata.nativeContinuity??[]);
  if(attempts.length) metadata.providerAttempts = attempts;
  if(continuity.length) metadata.nativeContinuity = continuity;
  return metadata;
}

function mergedFacts(completed: Array<{candidateId:string;read:RestaurantCandidateFactRead}>, request: RestaurantCandidateFactRequest, fallback: RestaurantReadExecutionMetadata, now: string, reserve?: "MODEL_CALL"|"DELIVERY_TIME", failureCode?: RestaurantFailureCode): RestaurantCandidateFactRead {
  const reads=completed.map(x=>x.read), metadata=checkpointMetadata(reads,fallback);
  const factChecks: RestaurantCandidateFactRead["factChecks"]=Object.fromEntries(reads.flatMap(read=>Object.entries(read.factChecks).map(([id,check])=>[id,{
    ...check, ...(!check.evidenceIds.length && !check.sourceProvider && !check.sourceAttempts ? {sourceProvider:read.metadata.provider} : {}),
  }])));
  if(reserve || failureCode){
    for(const id of request.candidateIds) if(!completed.some(x=>x.candidateId===id)) factChecks[id]={status:"UNKNOWN",checkedAt:now,evidenceIds:[],reasonCode:reserve?"RESERVE_REACHED":failureCode!};
    metadata.failureCode=failureCode ?? (reserve==="MODEL_CALL"?"BUDGET_RESERVED_FOR_DELIVERY":"DELIVERY_RESERVE_REACHED");
    if(reserve) metadata.reserveReached={reason:reserve,completedCandidateIds:completed.map(x=>x.candidateId)};
  }
  return {evidence:reads.flatMap(x=>x.evidence),factChecks,metadata,...(reads.some(x=>x.sourceDocuments)?{sourceDocuments:reads.flatMap(x=>x.sourceDocuments??[])}:{})};
}

function mergedAvailability(completed: Array<{candidateId:string;read:RestaurantAvailabilityRead}>, request: RestaurantAvailabilityRequest, fallback: RestaurantReadExecutionMetadata, now: string, reserve?: "MODEL_CALL"|"DELIVERY_TIME"): RestaurantAvailabilityRead {
  const reads=completed.map(x=>x.read),metadata=checkpointMetadata(reads,fallback);
  const availabilityChecks: RestaurantAvailabilityRead["availabilityChecks"]=Object.fromEntries(reads.flatMap(read=>Object.entries(read.availabilityChecks).map(([id,check])=>[id,{...check,sourceProvider:check.sourceProvider??read.metadata.provider}])));
  if(reserve){
    for(const id of request.candidateIds) if(!completed.some(x=>x.candidateId===id)) availabilityChecks[id]={status:"UNKNOWN",checkedAt:now,evidenceIds:[],reasonCode:"RESERVE_REACHED"};
    metadata.failureCode=reserve==="MODEL_CALL"?"BUDGET_RESERVED_FOR_DELIVERY":"DELIVERY_RESERVE_REACHED";
    metadata.reserveReached={reason:reserve,completedCandidateIds:completed.map(x=>x.candidateId)};
  }
  return {offers:reads.flatMap(x=>x.offers),evidence:reads.flatMap(x=>x.evidence),availabilityChecks,metadata,...(reads.some(x=>x.candidateFactUpdates)?{candidateFactUpdates:reads.flatMap(x=>x.candidateFactUpdates??[])}:{})};
}

function authoritativeSearchRequest(
  state: Readonly<RestaurantTaskState>,
  retrievalHint: string | undefined,
  readRunId: string | undefined,
): RestaurantSearchRequest {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  if (!intent) throw new Error("Validated Restaurant search requires a complete authoritative intent");
  const continuation = state.searchContinuation;
  return {
    intent,
    ...(continuation?.intentFingerprint === restaurantSearchIntentFingerprint(intent)
      ? { continuation: structuredClone(continuation) }
      : {}),
    ...(retrievalHint ? { retrievalHint } : {}),
    ...(readRunId ? { readRunId } : {}),
  };
}

function authoritativeAvailabilityRequest(
  state: Readonly<RestaurantTaskState>,
  candidateIds: string[],
  now: string,
): RestaurantAvailabilityRequest {
  const intent = completeRestaurantIntent(state.intentDraft);
  if (!intent) throw new Error("Validated Restaurant availability requires a complete authoritative intent");
  const eligibility = new Map(assessRestaurantRead(state, now).presentation.map((item) => [item.candidateId, item]));
  const recheckReasons = candidateIds
    .map((candidateId) => eligibility.get(candidateId))
    .filter((item): item is NonNullable<typeof item> => item?.recheckReason !== undefined);
  // Keep the new observation auditable even if an intervening UNKNOWN check
  // replaced the latest check's evidence list.
  const previousEvidenceIds = [...new Set(state.readEvidence
    .filter((evidence) => evidence.kind === "AVAILABILITY" && candidateIds.includes(evidence.candidateId ?? ""))
    .map((evidence) => evidence.evidenceId))];
  const verifiedOutletPages=verifiedOutletPagesForAvailability(state,candidateIds);
  return {
    candidateIds: [...candidateIds],
    ...(intent.target?.selectionScope?{selectionScope:intent.target.selectionScope}:{}),
    ...(verifiedOutletPages.length?{verifiedOutletPages}:{}),
    candidates: candidateIds.map((candidateId) => {
      const candidate = state.candidates.find((item) => item.restaurant.id === candidateId);
      if (!candidate) throw new Error(`Validated availability request cannot bind unknown candidate ${candidateId}`);
      return structuredClone(candidate);
    }),
    date: intent.date,
    timeWindow: structuredClone(intent.permittedAlternativeTimeWindow ?? intent.timeWindow),
    ...(intent.permittedAlternativeTimeWindow ? { requestedTimeWindow: structuredClone(intent.timeWindow) } : {}),
    ...(state.intentDraft?.temporalResolution?.immediateAvailability
      ? { immediateAvailability: structuredClone(state.intentDraft.temporalResolution.immediateAvailability) }
      : {}),
    partySize: intent.partySize,
    hardCriteria: intent.criteria.filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD").map((criterion) => criterion.text),
    ...(recheckReasons.length ? {
      recheck: {
        reason: recheckReasons[0]!.recheckReason!,
        previousEvidenceIds,
      },
    } : {}),
  };
}

function immediateAvailabilityFailure(
  state: Readonly<RestaurantTaskState>,
  now: string,
): "IMMEDIATE_REQUEST_EXPIRED" | undefined {
  const immediate = state.intentDraft?.temporalResolution?.immediateAvailability;
  if (!immediate) return undefined;
  const current = new Date(now);
  const validUntil = new Date(immediate.validUntil);
  if (Number.isNaN(current.valueOf()) || Number.isNaN(validUntil.valueOf()) || current.valueOf() > validUntil.valueOf()) return "IMMEDIATE_REQUEST_EXPIRED";
  return undefined;
}

/**
 * Executes a previously validated business action. This route exposes no provider detail
 * to the Agent and deliberately has no direct Commit implementation.
 */
export class RestaurantExecutionRouter {
  private readonly readScopes = new AsyncLocalStorage<string | symbol>();
  readBudgetStatus() { return { browserModelBudgetExhausted: this.availability.browserModelBudgetExhausted?.() === true }; }

  private readonly structuredReadTimeoutMs: number;
  private readonly browserReadTimeoutMs: number | null;

  constructor(
    private readonly search: RestaurantSearchPort,
    private readonly availability: RestaurantAvailabilityPort,
    private readonly options: RestaurantExecutionRouterOptions,
    private readonly facts?: RestaurantCandidateFactPort,
    private readonly questions?: RestaurantPageQuestionPort,
  ) {
    this.structuredReadTimeoutMs = options.structuredReadTimeoutMs;
    this.browserReadTimeoutMs = options.browserReadTimeoutMs;
  }

  /** Keeps source-level cumulative budgets aligned with one outer Agent run. */
  beginReadRun(): void { this.availability.beginReadRun?.(); }

  async endReadRun(): Promise<void> { await this.availability.endReadRun?.(); }

  async withReadRun<T>(read: () => Promise<T>, scopeId?: string): Promise<T> {
    const active = this.readScopes.getStore();
    if (active && (scopeId === undefined || active === scopeId)) return read();
    return this.readScopes.run(scopeId ?? Symbol("restaurant-read"), async () => {
      if (this.availability.withReadRun) return this.availability.withReadRun(read, scopeId);
      this.beginReadRun();
      try { return await read(); } finally { await this.endReadRun(); }
    });
  }

  async execute(
    action: RestaurantAgentAction,
    state: Readonly<RestaurantTaskState>,
    now = new Date().toISOString(),
    /** Bound by the coordinator; never Agent-controlled. */
    readRunId?: string,
    /** Owned by the user-visible read run; never supplied by the Agent. */
    parentSignal?: AbortSignal,
    deliveryReserve?: { remaining: () => number | undefined; qualified: () => boolean },
    /** Runtime-event-derived user identity; omitted from persisted search request. */
    userSelectedOutlet?:NamedOutletReference,
  ): Promise<RestaurantActionExecution> {
    const withModelReserve = <T>(work: () => Promise<T>): Promise<T> => deliveryReserve && this.options.modelReadReserve
      ? this.options.modelReadReserve.runRead(deliveryReserve.remaining, deliveryReserve.qualified, work) : work();
    switch (action.type) {
      case "ANSWER_PAGE_QUESTION": {
        const q = state.pageQuestion;
        if (!q || !readRunId || !canSettlePageQuestion(state, q, readRunId)) throw new Error("Question run does not match the authoritative task read");
        const candidate = state.candidates.find(c => c.restaurant.id === q.candidateId);
        const intent = completeRestaurantSearchIntent(state.intentDraft);
        if (!candidate || !intent) throw new Error("Question outlet is not in the presented batch");
        const result = this.questions ? await this.withProviderReadDeadline("Restaurant page question", this.browserReadTimeoutMs,
          signal => this.questions!.answerQuestion({requestId:q.requestId,question:q.question,candidate:structuredClone(candidate),intent,
            readContext:{runId:q.readRunId,startedAt:q.readStartedAt,deadlineAt:q.deadlineAt}},signal),true,parentSignal)
          : {status:"UNVERIFIED" as const,candidateId:q.candidateId,reason:"NO_BOUND_PAGE" as const,checkedPages:[]};
        return {...(this.questions ? {route:this.questions.executionRoute} : {}),event:{type:"PAGE_QUESTION_COMPLETED",requestId:q.requestId,readRunId:q.readRunId,result},
          observation:{type:"PAGE_QUESTION",detail:result.status,candidateIds:[q.candidateId]}};
      }
      case "ASK_USER":
        return {
          event: { type: "AGENT_ASKED_USER", question: action.question, ...(action.relatedFields ? { relatedFields: action.relatedFields } : {}) },
          observation: { type: "USER_QUESTION", detail: action.question },
        };
      case "SEARCH_RESTAURANTS": {
        const request = authoritativeSearchRequest(state, action.retrievalHint, readRunId);
        const knownCandidateIds = new Set(state.candidates.map((candidate) => candidate.restaurant.id));
        let completedSearch: RestaurantSearchRead | undefined;
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant search",
            this.search.executionRoute === "GENERIC_BROWSER" ? this.browserReadTimeoutMs : this.structuredReadTimeoutMs,
            async signal => { completedSearch = await withModelReserve(() => this.search.search(request, signal,userSelectedOutlet)); return completedSearch; },
            this.search.executionRoute === "GENERIC_BROWSER",
            parentSignal,
          );
          return {
            route: this.search.executionRoute,
            event: { type: "SEARCH_COMPLETED", request, ...read },
            // A provider can return ten ranked rows while every one is already
            // in the authoritative candidate pool. Record the delta before
            // reduction so the Agent loop and artifact can distinguish a real
            // discovery advance from a rewritten-query loop.
            observation: {
              type: "DISCOVERY",
              detail: `${read.candidates.length} candidates discovered; ${read.candidates.filter((candidate) => !knownCandidateIds.has(candidate.restaurant.id)).length} newly accepted`,
              candidateIds: read.candidates.map((candidate) => candidate.restaurant.id),
              newCandidateIds: read.candidates.filter((candidate) => !knownCandidateIds.has(candidate.restaurant.id)).map((candidate) => candidate.restaurant.id),
              evidenceIds: read.evidence.map((evidence) => evidence.evidenceId),
            },
            executionMetadata: read.metadata,
          };
        } catch (error) {
          if (stableFailureCode(error,"AGENT_EXECUTION_FAILED")==='READ_CANCELLATION_UNSETTLED') throw error;
          if (restaurantReserveCancelled(parentSignal) && completedSearch?.metadata.reserveReached?.reason === 'DELIVERY_TIME') {
            const read = completedSearch;
            return {route:this.search.executionRoute,event:{type:'SEARCH_COMPLETED',request,...read},observation:{type:'DISCOVERY',detail:'DELIVERY_RESERVE_REACHED: complete search children retained; unread sources remain unknown',candidateIds:read.candidates.map(c=>c.restaurant.id),evidenceIds:read.evidence.map(e=>e.evidenceId)},executionMetadata:read.metadata};
          }
          const reason = error instanceof Error ? error.message : "Unknown Restaurant search failure";
          const code = stableFailureCode(error, "SEARCH_FAILED");
          return {
            route: this.search.executionRoute,
            event: { type: "SEARCH_FAILED", reason, code },
            observation: { type: "DISCOVERY_FAILED", detail: reason },
            executionMetadata: {
              provider: this.search.executionRoute === "GENERIC_BROWSER" ? "AVAILABILITY_SOURCE_RESOLVER" : "GOOGLE_PLACES",
              route: this.search.executionRoute,
              latencyMs: 0,
              failureCode: code,
              ...googleUsageMetadata(this.search, readRunId),
            },
            failure: { source: "PROVIDER", code, reason, scope: "PROVIDER" },
          };
        }
      }
      case "INVESTIGATE_CANDIDATE_FACTS": {
        if (!this.facts) {
          return {
            event: { type: "AGENT_EXECUTION_FAILED", code: "AGENT_EXECUTION_FAILED", reason: "Candidate fact investigation is unavailable in this composition" },
            observation: { type: "FACTS_UNAVAILABLE", detail: "Candidate fact investigation is unavailable" },
          };
        }
        const intent = completeRestaurantSearchIntent(state.intentDraft);
        if (!intent) throw new Error("Validated candidate fact read requires a complete authoritative search intent");
        const request: RestaurantCandidateFactRequest = {
          sourceEvidence: action.candidateIds.flatMap(id=>[...restaurantCurrentFactEvidence(state,id),...state.readEvidence.filter(e=>e.candidateId===id&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH")]).filter(e=>[e.expiresAt,e.displayExpiresAt,e.sourceExpiresAt].every(t=>!t||Date.parse(t)>Date.parse(now))),
          candidateIds: [...action.candidateIds],
          candidates: action.candidateIds.map((candidateId) => {
            const candidate = state.candidates.find((item) => item.restaurant.id === candidateId);
            if (!candidate) throw new Error(`Validated fact investigation cannot bind unknown candidate ${candidateId}`);
            return structuredClone(candidate);
          }),
          intent,
          ...(readRunId ? { readRunId } : {}),
          ...(state.factRefreshRequestedCandidateIds?.length && action.candidateIds.every((candidateId) => state.factRefreshRequestedCandidateIds!.includes(candidateId))
            ? { recheck: { reason: "USER_REQUESTED_REFRESH" as const } }
            : {}),
        };
        const completed: Array<{candidateId:string;read:RestaurantCandidateFactRead}> = [];
        const fallback = {provider:"GOOGLE_PLACES" as const,route:this.facts.executionRoute,latencyMs:0};
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant candidate facts",
            this.facts.executionRoute === "GENERIC_BROWSER" ? this.browserReadTimeoutMs : this.structuredReadTimeoutMs,
            async signal => {
              await candidateCheckpoints(request, signal, single => withModelReserve(() => this.facts!.inspectFacts(single, signal,
                namedOutletIdentityPrefix(state).includes(single.candidateIds[0]!)&&!namedOutletCandidateResolved(state,single.candidateIds[0]!))), completed);
              return mergedFacts(completed,request,fallback,now);
            },
            this.facts.executionRoute === "GENERIC_BROWSER",
            parentSignal,
          );
          return {
            route: this.facts.executionRoute,
            event: { type: "CANDIDATE_FACTS_CHECKED", request, ...read, metadata: { ...read.metadata, ...(request.recheck ? { recheckReason: request.recheck.reason } : {}) } },
            observation: {
              type: "CANDIDATE_FACTS", detail: `${request.candidateIds.length} candidate fact read(s) completed`, candidateIds: request.candidateIds, evidenceIds: read.evidence.map((evidence) => evidence.evidenceId),
              factSourceAttempts: request.candidateIds.flatMap(candidateId => {
                const check = read.factChecks[candidateId]!;
                return (check.sourceAttempts ?? [{ source: check.sourceProvider ?? read.metadata.provider, outcome: check.status, ...(check.reasonCode ? { reasonCode: check.reasonCode } : {}) }])
                  .map(attempt => ({ candidateId, ...attempt }));
              }),
            },
            executionMetadata: { ...read.metadata, ...(request.recheck ? { recheckReason: request.recheck.reason } : {}) },
          };
        } catch (error) {
          if (stableFailureCode(error,"AGENT_EXECUTION_FAILED")==="READ_CANCELLATION_UNSETTLED") throw error;
          const reserve = reserveCause(error,parentSignal);
          if(reserve){
            const read=mergedFacts(completed,request,{...fallback,...googleUsageMetadata(this.facts,readRunId)},now,reserve);
            return {route:this.facts.executionRoute,event:{type:"CANDIDATE_FACTS_CHECKED",request,...read},observation:{type:"CANDIDATE_FACTS_UNKNOWN",detail:read.metadata.failureCode!,candidateIds:request.candidateIds,evidenceIds:read.evidence.map(x=>x.evidenceId)},executionMetadata:read.metadata};
          }
          if (parentSignal?.aborted || (error && typeof error === "object" && "code" in error && (error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "MODEL_CALL_BUDGET_EXHAUSTED"))) throw error;
          const reason = error instanceof Error ? error.message : "Unknown candidate fact investigation failure";
          const code = stableFailureCode(error, "FACT_INVESTIGATION_FAILED");
          const read=mergedFacts(completed,request,{...fallback,...googleUsageMetadata(this.facts,readRunId)},now,undefined,code);
          return {
            route: this.facts.executionRoute,
            event: {
              type: "CANDIDATE_FACTS_CHECKED",
              request,
              ...read,
            },
            observation: { type: "CANDIDATE_FACTS_UNKNOWN", detail: reason, candidateIds: request.candidateIds, evidenceIds: read.evidence.map(evidence=>evidence.evidenceId) },
            executionMetadata: { ...read.metadata, ...(request.recheck ? { recheckReason: request.recheck.reason } : {}) },
            failure: { source: "PROVIDER", code, reason, scope: "PROVIDER" },
          };
        }
      }
      case "CHECK_AVAILABILITY": {
        const request = authoritativeAvailabilityRequest(state, action.candidateIds, now);
        const immediateFailure = immediateAvailabilityFailure(state, now);
        if (immediateFailure) {
          const availabilityChecks = Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, {
            status: "UNKNOWN" as const,
            checkedAt: now,
            evidenceIds: [],
            reasonCode: immediateFailure,
          }]));
          const metadata: RestaurantReadExecutionMetadata = {
            provider: "AVAILABILITY_SOURCE_RESOLVER",
            route: this.availability.executionRoute,
            latencyMs: 0,
            failureCode: immediateFailure,
            freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
          };
          return {
            route: this.availability.executionRoute,
            event: { type: "AVAILABILITY_CHECKED", request, offers: [], availabilityChecks, evidence: [], metadata },
            observation: { type: "AVAILABILITY_UNKNOWN", detail: immediateFailure === "IMMEDIATE_REQUEST_EXPIRED"
              ? "The immediate request elapsed before a provider query; no later slot was substituted."
              : "The exact immediate time is not a supported discrete reservation slot; no later slot was substituted.", candidateIds: request.candidateIds },
            executionMetadata: metadata,
          };
        }
        const completed: Array<{candidateId:string;read:RestaurantAvailabilityRead}> = [];
        const fallback = {provider:"AVAILABILITY_SOURCE_RESOLVER" as const,route:this.availability.executionRoute,latencyMs:0,freshnessPolicyVersion:RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version};
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant availability",
            this.availability.executionRoute === "GENERIC_BROWSER"
              ? this.browserReadTimeoutMs
              : this.structuredReadTimeoutMs,
            async signal => {
              await candidateCheckpoints(request, signal, single => withModelReserve(() => this.availability.check(single, signal, readRunId)), completed);
              return mergedAvailability(completed,request,fallback,now);
            },
            this.availability.executionRoute === "GENERIC_BROWSER",
            parentSignal,
          );
          const metadata: RestaurantReadExecutionMetadata = {
            ...read.metadata,
            freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
            ...(request.recheck ? { recheckReason: request.recheck.reason } : {}),
          };
          return {
            route: this.availability.executionRoute,
            event: { type: "AVAILABILITY_CHECKED", request, ...read,
              ...(request.immediateAvailability ? { offers: [...read.offers].sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime)) } : {}), metadata },
            observation: { type: "AVAILABILITY", detail: `${read.offers.length} offers observed`, candidateIds: request.candidateIds, evidenceIds: read.evidence.map((evidence) => evidence.evidenceId) },
            executionMetadata: metadata,
          };
        } catch (error) {
          if (stableFailureCode(error,"AGENT_EXECUTION_FAILED")==="READ_CANCELLATION_UNSETTLED") throw error;
          const reserve=reserveCause(error,parentSignal);
          if(reserve){
            const read=mergedAvailability(completed,request,fallback,now,reserve);
            return {route:this.availability.executionRoute,event:{type:"AVAILABILITY_CHECKED",request,...read},observation:{type:"AVAILABILITY_UNKNOWN",detail:read.metadata.failureCode!,candidateIds:request.candidateIds,evidenceIds:read.evidence.map(x=>x.evidenceId)},executionMetadata:read.metadata};
          }
          // The coordinator's outer cancellation/deadline and the shared
          // browser-model ceiling are task facts. They must stop this run,
          // rather than being converted into a local no-result outcome.
          if (parentSignal?.aborted || (error && typeof error === "object" && "code" in error && (error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "MODEL_CALL_BUDGET_EXHAUSTED"))) throw error;
          const reason = error instanceof Error ? error.message : "Unknown Restaurant availability failure";
          const code = stableFailureCode(
            error,
            this.availability.executionRoute === "GENERIC_BROWSER" && /timed out/i.test(reason)
              ? "BROWSER_TIMEOUT"
              : "BROWSER_RUNTIME_FAILED",
          );
          const checkedAt = now;
          const availabilityChecks: Record<string, RestaurantAvailabilityCheck> = Object.fromEntries(
            request.candidateIds.map((candidateId) => [candidateId, {
              status: "UNKNOWN",
              checkedAt,
              evidenceIds: [],
              reasonCode: code,
            }]),
          );
          return {
            route: this.availability.executionRoute,
            event: {
              type: "AVAILABILITY_CHECKED",
              request,
              offers: [],
              availabilityChecks,
              evidence: [],
              metadata: {
                provider: this.availability.executionRoute === "GENERIC_BROWSER" ? "AVAILABILITY_SOURCE_RESOLVER" : "FIXTURE",
                route: this.availability.executionRoute,
                latencyMs: 0,
                failureCode: code,
                failureScope: "BATCH",
                freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
                ...(request.recheck ? { recheckReason: request.recheck.reason } : {}),
              },
            },
            observation: { type: "AVAILABILITY_UNKNOWN", detail: reason, candidateIds: request.candidateIds },
            executionMetadata: {
              provider: this.availability.executionRoute === "GENERIC_BROWSER" ? "AVAILABILITY_SOURCE_RESOLVER" : "FIXTURE",
              route: this.availability.executionRoute,
              latencyMs: 0,
              failureCode: code,
              failureScope: "BATCH",
              freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
              ...(request.recheck ? { recheckReason: request.recheck.reason } : {}),
            },
            // A source/batch browser failure is candidate-scoped evidence, not
            // proof that the whole task cannot continue with another outlet,
            // cursor page, or source. The coordinator owns task-global budget
            // and deadline termination.
            failure: { source: "PROVIDER", code, reason, scope: "BATCH" },
          };
        }
      }
      case "PRESENT_RESULTS": {
        const evidenceIds = action.candidateIds.flatMap((candidateId) =>
          restaurantPresentationEvidenceIds(state, candidateId, now) ?? [],
        );
        return {
          event: { type: "RESULTS_PRESENTED", candidateIds: [...action.candidateIds], evidenceIds },
          observation: { type: "RESULTS_PRESENTED", detail: `${action.candidateIds.length} grounded restaurant result(s) presented` },
        };
      }
      case "END_READ": {
        const summary = restaurantUnverifiedReadSummary(state, now);
        return {
          event: { type: "READ_ENDED_NO_VERIFIED_RESULT", ...summary },
          observation: { type: "READ_ENDED", detail: "Bounded read ended without a grounded result", candidateIds: summary.investigatedCandidateIds, unresolvedCandidateIds: summary.unresolvedCandidateIds },
        };
      }
      case "SELECT_CANDIDATE":
        return {
          ...(state.selectedCandidateId === action.candidateId && state.selectedOfferId === action.offerId ? {}
            : { event: { type: "CANDIDATE_SELECTED" as const, candidateId: action.candidateId, ...(action.offerId ? { offerId: action.offerId } : {}) } }),
          observation: { type: "CANDIDATE_SELECTED", detail: action.candidateId },
        };
      case "BOOK_RESERVATION":
        return {
          event: { type: "BOOKING_PROPOSED", candidateId: action.candidateId, offerId: action.offerId },
          observation: { type: "BOOKING_PROPOSAL", detail: `${action.candidateId}:${action.offerId}` },
        };
    }
  }

  private async withProviderReadDeadline<Value>(
    operationName: string,
    timeoutMs: number | null,
    operation: (signal: AbortSignal) => Promise<Value>,
    /** A browser executor owns interactive actions and must close before timeout returns. */
    settleAfterAbort = false,
    parentSignal?: AbortSignal,
  ): Promise<Value> {
    if (parentSignal?.aborted) throw parentSignal.reason ?? new Error("Read-only investigation was cancelled");

    const controller = new AbortController();
    let deadlineExceeded = false;
    let rejectDeadline: ((reason: Error) => void) | undefined;
    let rejectParentAbort: ((reason: unknown) => void) | undefined;
    // Browser reads must settle their own cancellation and close their session.
    // Do not create a rejected race promise for that branch: it would be
    // unobserved while awaiting `work`, turning a correct abort into a process
    // level unhandledRejection.
    const deadline = settleAfterAbort
      ? undefined
      : new Promise<never>((_resolve, reject) => { rejectDeadline = reject; });
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const parentAbort = parentSignal
      ? new Promise<never>((_resolve, reject) => { rejectParentAbort = reject; })
      : undefined;
    const abortFromParent = () => {
      const reason = parentSignal?.reason ?? new Error("Read-only investigation was cancelled");
      controller.abort(reason);
      if (restaurantReserveCancelled(parentSignal)) {
        settleTimer = setTimeout(() => rejectParentAbort?.(Object.assign(new Error('Source did not settle inside the conclusion reserve'),{code:'READ_CANCELLATION_UNSETTLED'})),RESTAURANT_READ_CANCEL_SETTLE_MS);
      } else if (!settleAfterAbort) rejectParentAbort?.(reason);
    };
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
    const timeout = timeoutMs === null ? undefined : setTimeout(() => {
      deadlineExceeded = true;
      const error = new Error(`${operationName} timed out after ${timeoutMs}ms`);
      controller.abort(error);
      rejectDeadline?.(error);
    }, timeoutMs);
    try {
      const work = operation(controller.signal);
      // A generic browser must settle after AbortSignal so its executor closes before
      // control returns. Structured read-only retrieval has no browser action and may
      // be bounded at the Router even if a broken provider ignores abort.
      const value = await Promise.race([work,...(deadline ? [deadline] : []),...(parentAbort ? [parentAbort] : [])]);
      if (parentSignal?.aborted) throw parentSignal.reason ?? new Error("Read-only investigation was cancelled");
      if (deadlineExceeded) throw new Error(`${operationName} timed out after ${timeoutMs}ms`);
      return value;
    } catch (error) {
      if (deadlineExceeded) throw new Error(`${operationName} timed out after ${timeoutMs}ms`);
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
      if (settleTimer) clearTimeout(settleTimer);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  }
}
