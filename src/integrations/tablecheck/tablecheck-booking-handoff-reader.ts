import { AsyncLocalStorage } from "node:async_hooks";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import {completeRestaurantIntent} from "../../domains/restaurant/intent-state.js";
import { prepareBookingHandoff, type PreparedBookingHandoff } from "../../domains/restaurant/booking-handoff.js";
import { restaurantAvailabilityRequestFingerprint, type RestaurantAvailabilityRead, type RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserControlHint, BrowserPageControl, BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { sameReservationOutlet, tableCheckRequestedReservationUrl } from "./tablecheck-page-parser.js";

interface PageLinks { observedAt: string; entrances: string[]; }
interface ReadScope { pages: Map<string, PageLinks>; }
interface CachedLinks extends PageLinks {
  candidateId: string; evidenceId: string; sourceEntityId: string;
  expiresAt: string; requestFingerprint: string;
}

/** Only browser-observed public same-shop links; no HTML/private-selector interpretation. */
function entrances(pageUrl: string, controls: readonly BrowserPageControl[]): string[] {
  let page: URL;
  try { page = new URL(pageUrl); } catch { return []; }
  if (page.protocol !== "https:" || !["tablecheck.com", "www.tablecheck.com"].includes(page.hostname)
    || !/^\/(?:en|ja)\/(?:shops\/)?[a-zA-Z0-9_-]+(?:\/reserve(?:\/landing)?)?\/?$/.test(page.pathname)) return [];
  return [...new Set(controls.flatMap(control => {
    if (control.kind !== "LINK" || !control.visible || control.disabled || control.blockedByActiveLayer
      || !control.href || /[\u0000-\u0020\\]/u.test(control.href)) return [];
    try {
      const url = new URL(control.href, pageUrl);
      return sameReservationOutlet(pageUrl, url) ? [url.toString()] : [];
    } catch { return []; }
  }))];
}

/** Existing condition-bearing entrances must not be silently rewritten to another request/slot. */
function compatibleEntrance(value: string, date: string, guests: number, time: string): boolean {
  const url = new URL(value);
  return Object.entries({ start_date: date, num_people: String(guests), pax: String(guests), start_time: time })
    .every(([key, expected]) => !url.searchParams.has(key) || url.searchParams.get(key) === expected);
}

/** TableCheck B1 cache: taps existing observations without opening or reading another page. */
export class TableCheckBookingHandoffReader {
  readonly runtime: BrowserRuntime;
  private readonly reads = new AsyncLocalStorage<ReadScope>();
  private readonly cases = new Map<string, Map<string, CachedLinks>>();

  constructor(runtime: BrowserRuntime, private readonly currentTaskId: () => string | undefined, readonly now: () => string) {
    this.runtime = {
      ...(runtime.readNetworkBoundaryCapability ? { readNetworkBoundaryCapability: runtime.readNetworkBoundaryCapability } : {}),
      openSession: async input => {
        const session = await runtime.openSession(input);
        let pageUrl: string | undefined;
        return new Proxy(session, { get: (target, key) => {
          if (key === "snapshot") return async () => {
            const page = await target.snapshot();
            pageUrl = page.url;
            // Invalidate the previous tap; only controls actually observed for
            // this snapshot can supply an entrance. Global network settlement
            // is not a B1 inventory verdict. The completed read below must
            // independently ground current HIGH identity and AVAILABLE stock.
            this.reads.getStore()?.pages.delete(page.url);
            return page;
          };
          if (key === "observeControls" && target.observeControls) {
            const observe = target.observeControls.bind(target);
            return async (hints?: readonly BrowserControlHint[]) => {
              const controls = await observe(hints), scope = this.reads.getStore();
              if (scope && pageUrl) scope.pages.set(pageUrl, { observedAt: this.now(), entrances: entrances(pageUrl, controls) });
              return controls;
            };
          }
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
    for (const [key, entry] of this.cases.get(taskId) ?? []) if (request.candidateIds.includes(entry.candidateId)) this.cases.get(taskId)!.delete(key);
    const scope: ReadScope = { pages: new Map() };
    const result = await this.reads.run(scope, read);
    if (signal.aborted) return result;
    const entries = this.cases.get(taskId) ?? new Map<string, CachedLinks>();
    for (const evidence of result.evidence) {
      const check = evidence.candidateId ? result.availabilityChecks[evidence.candidateId] : undefined;
      const page = evidence.sourceUrl ? scope.pages.get(evidence.sourceUrl) : undefined;
      if (evidence.kind !== "AVAILABILITY" || evidence.provider !== "TABLECHECK" || !evidence.candidateId
        || !evidence.sourceEntityId || evidence.entityMatch?.confidence !== "HIGH" || check?.status !== "AVAILABLE"
        || !check.evidenceIds.includes(evidence.evidenceId) || !evidence.displayExpiresAt || !page?.entrances.length) continue;
      const capturedTime = Date.parse(page.observedAt), evidenceTime = Date.parse(evidence.observedAt);
      if (!Number.isFinite(capturedTime) || capturedTime > evidenceTime
        || Date.parse(this.now()) - capturedTime >= Date.parse(evidence.displayExpiresAt) - evidenceTime) continue;
      entries.set(evidence.evidenceId, { candidateId: evidence.candidateId, evidenceId: evidence.evidenceId,
        sourceEntityId: evidence.sourceEntityId, observedAt: evidence.observedAt, expiresAt: evidence.displayExpiresAt,
        requestFingerprint: restaurantAvailabilityRequestFingerprint(request), entrances: [...page.entrances] });
    }
    if (entries.size) this.cases.set(taskId, entries);
    return result;
  }

  /** Creation check; the authenticated projection still performs the existing second check. */
  readonly readPrepared = (view: RestaurantCaseView): PreparedBookingHandoff[] => {
    this.prune();
    const request = completeRestaurantIntent(view.restaurant.intentDraft);
    if (!request) return [];
    const result: PreparedBookingHandoff[] = [];
    for (const entry of this.cases.get(view.case.rootTaskId)?.values() ?? []) {
      const candidate = view.restaurant.candidates.find(item => item.restaurant.id === entry.candidateId), check = view.restaurant.availabilityChecks[entry.candidateId];
      if (!candidate || !check || check.requestFingerprint !== entry.requestFingerprint) continue;
      for (const offer of view.restaurant.availability[entry.candidateId] ?? []) {
        const time = offer.dateTime.slice(11, 16);
        for (const entrance of entry.entrances) {
          if (!compatibleEntrance(entrance, request.date, request.partySize, time)) continue;
          const url = tableCheckRequestedReservationUrl({ kind: "LINKED_PAGE", url: entrance }, request.date, request.partySize, { earliest: time, latest: time });
          const prepared = prepareBookingHandoff({ provider: "TABLECHECK", linkBasis: "VERIFIED_PARAMETERS", observedEntranceUrl: entrance,
            candidateId: entry.candidateId, offerId: offer.id, sourceEntityId: entry.sourceEntityId,
            availabilityEvidenceId: entry.evidenceId, observedAt: entry.observedAt, url },
          { candidate, offer, check, request, evidence: view.restaurant.readEvidence, now: this.now() });
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
