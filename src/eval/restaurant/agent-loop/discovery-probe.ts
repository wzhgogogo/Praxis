import { createHash } from "node:crypto";
import type { ModelGateway } from "../../../core/model/contracts.js";
import type { RestaurantSearchIntent, RestaurantSearchRead, RestaurantSearchContinuation } from "../../../domains/restaurant/contracts.js";
import { restaurantSearchIntentFingerprint } from "../../../domains/restaurant/contracts.js";
import { planDiscoverySources } from "../../../domains/restaurant/discovery-planner.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import type { BrowserExecutionDiagnostic } from "../../../infrastructure/browser/browser-task-executor.js";
import { createLiveReadAssembly, type LiveReadAssemblyConfig, type LiveReadTransports } from "../../../integrations/restaurant-search/live-read-assembly.js";
import { restaurantDiscoveryPacks, type DiscoverySourcePack } from "../../../integrations/restaurant-search/source-packs.js";

type Location = NonNullable<RestaurantSearchContinuation["locationContext"]>;
export interface DiscoveryProbeInput {
  caseId: string;
  role: "TARGET" | "CONTROL";
  intent: RestaurantSearchIntent;
  locationContext: Location;
  referenceTime: string;
}
export interface DiscoveryProbeWitness {
  sourceId: string;
  sourceEntityId: string;
  outletName: string;
}
export interface ProbeListing {
  sourceId: string;
  url: string;
  snapshot: number;
  htmlSha256: string;
  categoryLabel?: string | null;
  outlets: Array<{ sourceEntityId: string; sourceUrl: string; outletName: string }>;
}
export interface ProbeSourceRead {
  sourceId: string;
  read?: RestaurantSearchRead;
  failureCode?: string;
  failedFunnel?: RestaurantSearchRead["metadata"]["nativeDiscoveryFunnel"];
}
function code(error: unknown): string {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "DISCOVERY_PROBE_FAILED";
}
export function probeDistanceMeters(a: Location, b: { lat: number; lng: number }): number {
  const r = Math.PI / 180, p = a.latitude * r, q = b.lat * r;
  const h = Math.sin((q-p)/2)**2 + Math.cos(p)*Math.cos(q)*Math.sin((b.lng-a.longitude)*r/2)**2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1-h)));
}
/** Metrics consume source observations, never a production qualification verdict. */
export function discoveryProbeMetrics(input: DiscoveryProbeInput, witnesses: readonly DiscoveryProbeWitness[],
  listings: readonly ProbeListing[], details: readonly { sourceId: string; sourceEntityId: string; url: string }[], reads: readonly ProbeSourceRead[],
  packs: readonly DiscoverySourcePack[] = restaurantDiscoveryPacks) {
  const boundListings = listings.filter(listing => reads.some(row => row.sourceId === listing.sourceId &&
    (row.read?.metadata.nativeDiscoveryFunnel ?? row.failedFunnel)?.listingObservations?.some(observation => observation.sourceUrl === listing.url)));
  const matches = (sourceId: string, sourceEntityId: string) => witnesses.some(w => w.sourceId === sourceId && w.sourceEntityId === sourceEntityId);
  const inRadius = new Map<string, { sourceId: string; candidateId: string; distanceMeters: number }>();
  for (const row of reads) for (const candidate of row.read?.candidates ?? []) {
    const coordinates = candidate.restaurant.coordinates;
    if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) continue;
    const distanceMeters = probeDistanceMeters(input.locationContext, coordinates);
    if (distanceMeters <= input.locationContext.radiusMeters) inRadius.set(`${row.sourceId}:${candidate.restaurant.id}`, { sourceId: row.sourceId, candidateId: candidate.restaurant.id, distanceMeters });
  }
  const frozenPlan = planDiscoverySources(input.intent,input.locationContext,packs.map(p=>p.meta),input.referenceTime);
  const retrievalAttempts = reads.flatMap(row => {
    const pack = packs.find(p => p.meta.id === row.sourceId);
    const observations = (row.read?.metadata.nativeDiscoveryFunnel ?? row.failedFunnel)?.listingObservations ?? [];
    const query=frozenPlan.entries.find(entry=>entry.sourceId===row.sourceId)?.query;
    const fallback=pack&&query ? [{sourceUrl:pack.buildQuery(query).url,parsedOutlets:0}] : [];
    return (observations.length ? observations : fallback).map((observation, index) => {
      const expression = pack?.browser?.directory?.retrievalExpression(observation.sourceUrl);
      const planned = query;
      return { sourceId: row.sourceId, type: (expression ?? planned?.keyword) ? "KEYWORD" : "CATEGORY_OR_GENERAL_LIST", keyword: expression ?? planned?.keyword ?? null,
        categoryLabel: listings.find(l=>l.sourceId===row.sourceId&&l.url===observation.sourceUrl)?.categoryLabel ?? null, url: observation.sourceUrl, parsedCount: observations.length ? observation.parsedOutlets : null, displayedTotal: "resultCount" in observation ? observation.resultCount ?? null : null,
        observationStatus: observations.length ? "OBSERVED_LISTING" : "PLANNED_URL_WITHOUT_COMPLETED_LISTING",
        decidedBy: index === 0 ? "PLANNER_AND_OBSERVED_REGION_AGENT" : "BROWSER_AGENT_OR_SOURCE_PAGINATION",
        reason: row.read?.metadata.nativeDiscoveryFunnel?.queryAdjustment ?? (index === 0 ? "CURRENT_FIRST_BATCH" : "OBSERVED_LISTING_CONTINUATION") };
    });
  });
  return {
    witnessInListing: boundListings.some(listing => listing.outlets.some(outlet => matches(listing.sourceId, outlet.sourceEntityId))),
    witnessInFirstBatch: details.some(detail => matches(detail.sourceId, detail.sourceEntityId)),
    witnessCount: witnesses.length,
    witnessMatches: witnesses.map(w => ({ ...w, inListing: boundListings.some(l => l.sourceId === w.sourceId && l.outlets.some(o => o.sourceEntityId === w.sourceEntityId)),
      inFirstBatch: details.some(d => d.sourceId === w.sourceId && d.sourceEntityId === w.sourceEntityId) })),
    inRadiusParsed: inRadius.size, inRadiusParsedIsLowerBound: reads.some(row=>!row.read), inRadiusCandidates: [...inRadius.values()], retrievalAttempts,
    listingObservationScope: "Only source-funnel-bound listing URLs count; bootstrap/nationwide snapshots excluded. Google-native IDs do not establish cross-source identity.",
    pages: reads.reduce((sum,row) => sum + ((row.read?.metadata.nativeDiscoveryFunnel ?? row.failedFunnel)?.pagesRead ?? (!packs.find(p=>p.meta.id===row.sourceId)?.browser ? row.read?.continuation?.pagesRead ?? 0 : 0)),0),
    sources: reads.map(row => ({ sourceId: row.sourceId, candidates: row.read?.candidates.length ?? 0, failureCode: row.failureCode ?? row.read?.metadata.failureCode ?? null,
      funnel: row.read?.metadata.nativeDiscoveryFunnel ?? row.failedFunnel ?? null })),
  };
}

/** Exactly one production first-batch search per planned source, no availability/facts/delivery loop. */
export async function runDiscoveryProbe(input: DiscoveryProbeInput, witnesses: readonly DiscoveryProbeWitness[],
  config: LiveReadAssemblyConfig, transports: LiveReadTransports,
  record: (kind: string, detail: unknown) => void = () => {}, parentSignal?: AbortSignal) {
  if (!Number.isSafeInteger(config.maxModelCalls) || config.maxModelCalls < 1 || config.maxModelCalls > 15
    || !Number.isSafeInteger(config.maxAutomaticBrowserMs) || config.maxAutomaticBrowserMs < 1 || config.maxAutomaticBrowserMs > 180_000) {
    throw new TypeError("Discovery probe ceiling: 1..15 models and 1..180000 ms");
  }
  const startedAt = Date.now(), deadline = startedAt + config.maxAutomaticBrowserMs;
  const timeout = AbortSignal.timeout(config.maxAutomaticBrowserMs);
  const signal = parentSignal ? AbortSignal.any([timeout,parentSignal]) : timeout;
  const packs = config.packs ?? restaurantDiscoveryPacks;
  let calls = 0, snapshotSequence = 0;
  let activePack: DiscoverySourcePack | undefined;
  const listings: ProbeListing[] = [], details: Array<{sourceId:string;sourceEntityId:string;url:string}> = [], reads: ProbeSourceRead[] = [];
  const diagnostics: BrowserExecutionDiagnostic[] = [];
  const categoryLabels = new Map<string,string>();
  const model: ModelGateway = { async complete(request) {
    if (Date.now() >= deadline) throw Object.assign(new Error("Probe deadline reached"), {code:"DISCOVERY_PROBE_TIMEOUT"});
    if (calls >= config.maxModelCalls) throw Object.assign(new Error("Probe model ceiling reached"), {code:"MODEL_CALL_BUDGET_EXHAUSTED"});
    calls++;
    record("MODEL_STARTED", { call:calls, purpose:request.purpose, promptVersion:request.promptVersion });
    try {
      const response = await transports.model.complete({...request,timeoutMs:Math.max(1,Math.min(request.timeoutMs,deadline-Date.now()))});
      record("MODEL_FINISHED", {call:calls,purpose:request.purpose,outcome:"SUCCEEDED"}); return response;
    } catch(error) { record("MODEL_FINISHED",{call:calls,purpose:request.purpose,outcome:"FAILED",failureCode:code(error)}); throw error; }
  } };
  function detail(url: string) {
    const entity = activePack?.browser?.sourceEntityIdForUrl(url);
    if (activePack && entity && listings.some(l=>l.sourceId===activePack!.meta.id && l.outlets.some(o=>o.sourceEntityId===entity))
      && !details.some(d=>d.sourceId===activePack!.meta.id && d.sourceEntityId===entity)) details.push({sourceId:activePack.meta.id,sourceEntityId:entity,url});
  }
  function observe(snapshot: BrowserSnapshot) {
    snapshotSequence++;
    if (!activePack) return;
    for(const link of activePack.browser?.directory?.links(snapshot) ?? []) if(link.category) categoryLabels.set(link.url,link.label);
    const outlets = activePack.parseListing(snapshot).outlets;
    listings.push({sourceId:activePack.meta.id,url:snapshot.url,snapshot:snapshotSequence,
      htmlSha256:createHash("sha256").update(snapshot.html).digest("hex"),categoryLabel:categoryLabels.get(snapshot.url)??null,outlets});
    detail(snapshot.url);
  }
  const browser: BrowserRuntime = { ...transports.browser,
    ...(transports.browser.readNetworkBoundaryCapability ? {readNetworkBoundaryCapability:transports.browser.readNetworkBoundaryCapability}:{}),
    async openSession(options) {
      const session = await transports.browser.openSession(options);
      return new Proxy(session,{get(target,key){
        if(key==="snapshot")return async()=>{const snapshot=await target.snapshot();observe(snapshot);return snapshot;};
        if(key==="navigate")return async (url: string, options?: Parameters<typeof target.navigate>[1])=>{detail(url);return target.navigate(url,options);};
        const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
      }});
    },
  };
  const assembly = createLiveReadAssembly(config,{...transports,model,browser,onBrowserDiagnostic(diagnostic){
    diagnostics.push(diagnostic);transports.onBrowserDiagnostic?.(diagnostic);
  }});
  const plan = planDiscoverySources(input.intent,input.locationContext,packs.map(p=>p.meta),input.referenceTime);
  record("DISCOVERY_PLAN",plan);
  let terminationReason = "ALL_PLANNED_FIRST_BATCHES_ATTEMPTED";
  for(let cursor=0;cursor<plan.entries.length;cursor++) {
    const entry=plan.entries[cursor]!;
    if (Date.now()>=deadline || signal.aborted) {terminationReason="DISCOVERY_PROBE_TIMEOUT";break;}
    if (calls>=config.maxModelCalls) {terminationReason="MODEL_CALL_BUDGET_EXHAUSTED";break;}
    activePack=packs.find(p=>p.meta.id===entry.sourceId);
    try {
      const read=await assembly.search.search({intent:input.intent,readRunId:input.caseId,
        continuation:{intentFingerprint:restaurantSearchIntentFingerprint(input.intent),usedPageTokens:[],pagesRead:0,exhausted:false,
          locationContext:input.locationContext,discoveryPlan:{entries:plan.entries,cursor}}},signal);
      reads.push({sourceId:entry.sourceId,read});record("SOURCE_FIRST_BATCH",{sourceId:entry.sourceId,read});
    } catch(error) {
      const partial=error&&typeof error==="object"&&"nativeFunnel" in error ? error.nativeFunnel as ProbeSourceRead["failedFunnel"] : undefined;
      reads.push({sourceId:entry.sourceId,failureCode:code(error),...(partial?{failedFunnel:partial}:{})});record("SOURCE_FAILED",{sourceId:entry.sourceId,failureCode:code(error)});
      if(signal.aborted || Date.now()>=deadline || calls>=config.maxModelCalls) {terminationReason=signal.aborted?"DISCOVERY_PROBE_TIMEOUT":code(error);break;}
    }
  }
  return {schemaVersion:"discovery-probe@1",mode:"LIVE_READ_ONLY_DISCOVERY_PROBE",caseId:input.caseId,role:input.role,
    ...discoveryProbeMetrics(input,witnesses,listings,details,reads,packs),
    resources:{modelCalls:calls,browserModelCalls:assembly.browserBudget.totalModelCalls,
      google:assembly.google.googleRequestUsage(input.caseId),elapsedMs:Date.now()-startedAt,ceilings:assembly.runCeilings},
    terminationReason,plannedSourceIds:plan.entries.map(e=>e.sourceId),attemptedSourceIds:reads.map(r=>r.sourceId),
    unattemptedSourceIds:plan.entries.slice(reads.length).map(e=>e.sourceId),
    failureCodes:reads.flatMap(r=>r.failureCode?[r.failureCode]:r.read?.metadata.failureCode?[r.read.metadata.failureCode]:[]),
    listings,firstBatchDetails:details,diagnostics,
    evidenceLimit:"Discovery probe only; source failure/empty result is not source exhaustion, availability or delivery. Witnesses are eval-only and never passed to production assembly/model.",
  };
}


/** The CLI's real preflight initialization, with only HTTP transport replaceable offline. */
export async function runDiscoveryProbePreflight(input: {
  environment: NodeJS.ProcessEnv;
  network: import("./live-preflight.js").EffectiveLiveNetworkConfiguration;
  artifactDirectory: string;
}, dependencies: import("./live-preflight.js").LivePreflightDependencies = {}) {
  const {runLivePreflight}=await import("./live-preflight.js");
  return runLivePreflight({runner:"SOURCE_STAGE_PROBE",targets:["DEEPSEEK","GOOGLE","TABELOG","TABLECHECK"],network:input.network},
    input.environment, {...dependencies,artifactDirectory:input.artifactDirectory});
}
