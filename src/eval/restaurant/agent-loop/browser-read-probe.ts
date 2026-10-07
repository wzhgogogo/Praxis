import type { BrowserControlHint, BrowserPageControl, BrowserResponseRule, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { BrowserRuntimeError } from "../../../infrastructure/browser/browser-runtime-errors.js";
import type { RestaurantCandidate } from "../../../domains/restaurant/contracts.js";
import { inspectTableCheckEntity } from "../../../integrations/tablecheck/tablecheck-entity-resolver.js";
import { hasTableCheckBotChallenge, hasTableCheckPageUnavailable, hasTableCheckSelectedRequest, parseTableCheckAvailabilitySlots, parseTableCheckOutletIdentityWithEvidence } from "../../../integrations/tablecheck/tablecheck-page-parser.js";
import { hasBotChallenge, parseTabelogAvailabilitySlots, parseTabelogOutletIdentityWithEvidence } from "../../../integrations/tabelog/tabelog-page-parser.js";
import { resolveTabelogEntity } from "../../../integrations/tabelog/tabelog-entity-resolver.js";
import { diagnosticUrl } from "../../shared/diagnostic-run.js";
import { restaurantPublicReadNetworkPolicy } from "../../../integrations/restaurant-availability/public-browser-read-network-policy.js";

export interface BrowserReadProbeInput {
  url: string;
  /** A known visible marker, not an invented assertion that the entire site has loaded. */
  readySelector?: string;
  timeoutMs?: number;
  expectedCandidate?: RestaurantCandidate;
  schedule?: { date: string; partySize: number };
  /** Optional passive recorder; observes only, without adding a browser action. */
  queryObservation?: { hints: (snapshot: BrowserSnapshot) => readonly BrowserControlHint[];
    responses: readonly BrowserResponseRule[];
    record: (snapshot: BrowserSnapshot, controls: readonly BrowserPageControl[]) => void | Promise<void> };
}

export function probeProvider(value: string): "TABLECHECK" | "TABELOG" {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Use a public HTTPS source URL without credentials or a custom port");
  if (["tablecheck.com", "www.tablecheck.com"].includes(url.hostname)) return "TABLECHECK";
  if (["tabelog.com", "www.tabelog.com"].includes(url.hostname)) return "TABELOG";
  throw new Error("Only TableCheck and Tabelog public pages are supported");
}

export function inspectProbePage(input: BrowserReadProbeInput, page: BrowserSnapshot) {
  const provider = probeProvider(input.url);
  const base = { provider, finalUrl: diagnosticUrl(page.url), snapshotRead: true, resultScope: "PAGE_OBSERVATION_ONLY" as const };
  let finalProvider: string;
  try { finalProvider = probeProvider(page.url); } catch { return { ...base, pageState: "UNEXPECTED_PAGE" as const }; }
  if (provider !== finalProvider) return { ...base, pageState: "UNEXPECTED_PAGE" as const };
  const challenge = provider === "TABLECHECK" ? hasTableCheckBotChallenge(page) : hasBotChallenge(page);
  if (challenge) return { ...base, pageState: "BOT_CHALLENGE" as const };
  if (hasTableCheckPageUnavailable(page)) return { ...base, pageState: "PAGE_UNAVAILABLE" as const };
  const extraction = provider === "TABLECHECK"
    ? parseTableCheckOutletIdentityWithEvidence(page, page.url)
    : parseTabelogOutletIdentityWithEvidence(page, { sourceEntityId: new URL(page.url).pathname, sourceUrl: page.url, outletName: "" });
  const identity = input.expectedCandidate && extraction
    ? provider === "TABLECHECK"
      ? inspectTableCheckEntity(input.expectedCandidate, extraction.outlet).resolution
      : resolveTabelogEntity(input.expectedCandidate, [extraction.outlet])
    : undefined;
  const slots = provider === "TABLECHECK" ? parseTableCheckAvailabilitySlots(page) : parseTabelogAvailabilitySlots(page);
  return {
    ...base,
    pageState: "CONTENT_OBSERVED" as const,
    identity: identity ? { confidence: identity.confidence, matchedBy: identity.matchedBy, comparisonSource: "OPERATOR_SUPPLIED_NOT_GOOGLE_DISCOVERY" } : { confidence: "NOT_CHECKED" },
    identityFieldsDetected: extraction ? Object.fromEntries(Object.entries(extraction.fields).map(([name, field]) => [name, field.value !== undefined])) : {},
    requestSelection: provider === "TABLECHECK" && input.schedule
      ? hasTableCheckSelectedRequest(page, input.schedule.date, input.schedule.partySize) ? "OBSERVED_MATCH" : "NOT_CONFIRMED"
      : "NOT_CHECKED",
    slotsDetected: slots.availableSlots,
    slotControlsDetected: slots.hasExplicitSlotUi,
    controlOperation: "NOT_ATTEMPTED",
    availabilityConclusion: "NOT_ESTABLISHED",
  };
}

/** One navigation, optionally one bounded marker wait; never click, fill, submit, retry or produce domain Evidence. */
export async function runBrowserReadProbe(runtime: BrowserRuntime, input: BrowserReadProbeInput) {
  probeProvider(input.url);
  const timeoutMs = input.timeoutMs ?? 20_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new Error("Probe timeout must be 1–60000 ms");
  const controller = new AbortController();
  const networkPolicy = runtime.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? restaurantPublicReadNetworkPolicy : undefined;
  let session: BrowserSession | undefined;
  let rejectTimeout: (error: Error) => void = () => {};
  const timeout = new Promise<never>((_, reject) => { rejectTimeout = reject; });
  const timer = setTimeout(() => {
    controller.abort();
    rejectTimeout(new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser probe deadline exceeded"));
  }, timeoutMs);
  try {
    const operation = (async () => {
      session = await runtime.openSession({ signal: controller.signal, ...(networkPolicy ? { networkPolicy } : {}) });
      if (controller.signal.aborted) { await session.close(); throw new BrowserRuntimeError("BROWSER_TIMEOUT", "Browser probe deadline exceeded"); }
      if (networkPolicy && session.metadata.readNetworkBoundary !== "INSTALLED") {
        await session.close();
        throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Browser probe runtime did not install the required read network boundary");
      }
      if (input.queryObservation) await session.captureResponses?.(input.queryObservation.responses);
      await session.prepareNavigation?.(input.url, { timeoutMs });
      await session.navigate(input.url, { timeoutMs });
      let page = await session.snapshot();
      if (input.queryObservation) await input.queryObservation.record(page, await session.observeControls?.(input.queryObservation.hints(page)) ?? []);
      let observation = inspectProbePage(input, page);
      if (observation.pageState === "CONTENT_OBSERVED" && input.readySelector) {
        let waitError: unknown;
        try { await session.waitFor(input.readySelector, timeoutMs); } catch (error) { waitError = error; }
        page = await session.snapshot();
        if (input.queryObservation) await input.queryObservation.record(page, await session.observeControls?.(input.queryObservation.hints(page)) ?? []);
        if (waitError) throw waitError;
        observation = inspectProbePage(input, page);
      }
      return { ...observation, browser: session.metadata, readyMarker: input.readySelector && observation.pageState === "CONTENT_OBSERVED" ? "OBSERVED" : "NOT_OBSERVED_OR_NOT_REQUESTED" };
    })();
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timer);
    controller.abort();
    await session?.close();
  }
}
