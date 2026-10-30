import { AsyncLocalStorage } from "node:async_hooks";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import { prepareBookingHandoff, type PreparedBookingHandoff } from "../../domains/restaurant/booking-handoff.js";
import { restaurantAvailabilityRequestFingerprint, type RestaurantAvailabilityRead, type RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { inspectTabelogVacancyResponse, type TabelogVacancyObservation } from "./tabelog-vacancy-response.js";

type Observed = Extract<TabelogVacancyObservation, { status: "OBSERVED" }>;
interface ReadScope { request: RestaurantAvailabilityRequest; pages: Map<string, TabelogVacancyObservation>; }
interface CachedLinks {
  candidateId: string; evidenceId: string; sourceEntityId: string; observedAt: string;
  expiresAt: string; requestFingerprint: string; observation: Observed;
}

/** Tabelog B1 cache only. It observes existing reads; it never navigates or parses response rows. */
export class TabelogBookingHandoffReader {
  readonly runtime: BrowserRuntime;
  private readonly reads = new AsyncLocalStorage<ReadScope>();
  private readonly cases = new Map<string, Map<string, CachedLinks>>();

  constructor(runtime: BrowserRuntime, private readonly currentTaskId: () => string | undefined, readonly now: () => string) {
    this.runtime = {
      ...(runtime.readNetworkBoundaryCapability ? { readNetworkBoundaryCapability: runtime.readNetworkBoundaryCapability } : {}),
      openSession: async input => {
        const session = await runtime.openSession(input);
        return new Proxy(session, { get: (target, key) => {
          if (key === "snapshot") return async () => {
            const page = await target.snapshot();
            const scope = this.reads.getStore();
            if (scope) scope.pages.set(page.url, inspectTabelogVacancyResponse(page, scope.request.date, scope.request.partySize));
            return page;
          };
          const value = Reflect.get(target, key, target) as unknown;
          return typeof value === "function" ? value.bind(target) : value;
        } });
      },
    };
  }

  async capture(request: RestaurantAvailabilityRequest, signal: AbortSignal, read: () => Promise<RestaurantAvailabilityRead>): Promise<RestaurantAvailabilityRead> {
    this.prune();
    const taskId = this.currentTaskId();
    if (!taskId) return read();
    for (const [key, entry] of this.cases.get(taskId) ?? []) {
      if (request.candidateIds.includes(entry.candidateId)) this.cases.get(taskId)!.delete(key);
    }
    const scope: ReadScope = { request, pages: new Map() };
    const result = await this.reads.run(scope, read);
    if (signal.aborted) return result;
    const entries = this.cases.get(taskId) ?? new Map<string, CachedLinks>();
    for (const evidence of result.evidence) {
      const check = evidence.candidateId ? result.availabilityChecks[evidence.candidateId] : undefined;
      const observation = evidence.sourceUrl ? scope.pages.get(evidence.sourceUrl) : undefined;
      if (evidence.kind !== "AVAILABILITY" || evidence.provider !== "TABELOG" || !evidence.candidateId
        || !evidence.sourceEntityId || evidence.entityMatch?.confidence !== "HIGH" || check?.status !== "AVAILABLE"
        || !check.evidenceIds.includes(evidence.evidenceId) || !evidence.displayExpiresAt || observation?.status !== "OBSERVED") continue;
      const responseTime = Date.parse(observation.sourceResponse.observedAt);
      const observedTime = Date.parse(evidence.observedAt);
      if (!Number.isFinite(responseTime) || responseTime > observedTime
        || Date.parse(this.now()) - responseTime >= Date.parse(evidence.displayExpiresAt) - observedTime) continue;
      entries.set(evidence.evidenceId, { candidateId: evidence.candidateId, evidenceId: evidence.evidenceId,
        sourceEntityId: evidence.sourceEntityId, observedAt: evidence.observedAt, expiresAt: evidence.displayExpiresAt,
        requestFingerprint: restaurantAvailabilityRequestFingerprint(request), observation: structuredClone(observation) });
    }
    if (entries.size) this.cases.set(taskId, entries);
    return result;
  }

  /** First check against current authenticated Case data; projection runs the existing second check. */
  readonly readPrepared = (view: RestaurantCaseView): PreparedBookingHandoff[] => {
    this.prune();
    const draft = view.restaurant.intentDraft;
    if (!draft?.date || !draft.timeWindow || !draft.partySize || !draft.area) return [];
    const request = { ...draft, date: draft.date, timeWindow: draft.timeWindow, partySize: draft.partySize, area: draft.area };
    const result: PreparedBookingHandoff[] = [];
    for (const entry of this.cases.get(view.case.rootTaskId)?.values() ?? []) {
      const candidate = view.restaurant.candidates.find(item => item.restaurant.id === entry.candidateId);
      const check = view.restaurant.availabilityChecks[entry.candidateId];
      if (!candidate || !check || check.requestFingerprint !== entry.requestFingerprint) continue;
      for (const offer of view.restaurant.availability[entry.candidateId] ?? []) {
        const time = offer.dateTime.slice(11, 16);
        for (const link of entry.observation.formCourseLinks.filter(item => item.time === time)) {
          // Qualify a root-relative source link without serializing its path, query or encoding.
          const url = link.url.startsWith("/") && !link.url.startsWith("//") ? "https://tabelog.com" + link.url : link.url;
          const prepared = prepareBookingHandoff({ provider: "TABELOG", linkBasis: "SOURCE_RESPONSE", candidateId: entry.candidateId,
            offerId: offer.id, sourceEntityId: entry.sourceEntityId, availabilityEvidenceId: entry.evidenceId,
            observedAt: entry.observedAt, url }, { candidate, offer, check, request, evidence: view.restaurant.readEvidence, now: this.now() });
          if (prepared) { result.push(prepared); break; }
        }
      }
    }
    return result;
  };

  private prune(): void {
    const now = Date.parse(this.now());
    for (const [taskId, entries] of this.cases) {
      for (const [id, entry] of entries) if (!(Date.parse(entry.expiresAt) > now)) entries.delete(id);
      if (!entries.size) this.cases.delete(taskId);
    }
  }
}
