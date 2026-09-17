import type { ModelGateway } from "../../../core/model/contracts.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../integrations/restaurant-availability/live-browser-availability.js";
import { composeLiveRestaurantFactRead } from "../../../integrations/restaurant-facts/live-restaurant-facts.js";
import type { CurrentDevelopmentSourceScenario, FixedSourceObservation } from "./current-development-source-scenarios.js";

export type FixedSourceCoverageGap = {
  source: "GOOGLE_SEARCH" | "GOOGLE_DETAILS" | "WEBSITE" | "TABLECHECK" | "BROWSER";
  stage: string;
  request: string;
  candidateId?: string;
  reason: string;
};

export type FixedSourceObservationTime = {
  source: "GOOGLE" | "WEBSITE" | "TABLECHECK";
  stage: string;
  observedAt: string;
  sampleCapturedAt?: string;
  candidateId?: string;
};

export type FixedSourceCalls = {
  search: number;
  facts: number;
  availability: number;
  namedPlace: number;
  website: number;
  browserNavigations: string[];
  coverageGaps: FixedSourceCoverageGap[];
  observations: FixedSourceObservationTime[];
};

export interface FixedSourceClock { now(): Date | string; }

function gap(record: FixedSourceCoverageGap): Error {
  return Object.assign(new Error("Fixed-source coverage gap: " + record.reason), {
    code: "FIXTURE_COVERAGE_GAP",
    fixedSourceCoverageGap: record,
  });
}

function tokens(value: string): string[] {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean).map((token) => token.endsWith("s") ? token.slice(0, -1) : token);
}

function discoverable(observation: FixedSourceObservation, query: string): boolean {
  const queryTokens = new Set(tokens(query));
  return observation.searchTerms.some((term) => tokens(term).some((token) => token.length > 2 && queryTokens.has(token)));
}

function asIso(clock: FixedSourceClock): string {
  const value = clock.now();
  return typeof value === "string" ? value : value.toISOString();
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function matchesSelector(html: string, selector: string): boolean {
  const value = selector.trim();
  if (!value) return false;
  const id = value.match(/^#([\w-]+)$/);
  if (id) return new RegExp("\\bid=[\"'][^\"']*\\b" + escapeRegExp(id[1]!) + "\\b[^\"']*[\"']", "i").test(html);
  const className = value.match(/^\.([\w-]+)$/);
  if (className) return new RegExp("\\bclass=[\"'][^\"']*\\b" + escapeRegExp(className[1]!) + "\\b[^\"']*[\"']", "i").test(html);
  const hrefContains = value.match(/^a\[href\*=[\"']([^\"']+)[\"']\]$/);
  if (hrefContains) return new RegExp("<a\\b[^>]*\\bhref=[\"'][^\"']*" + escapeRegExp(hrefContains[1]!) + "[^\"']*[\"']", "i").test(html);
  const dataEquals = value.match(/^\[data-([\w-]+)=[\"']([^\"']+)[\"']\]$/);
  if (dataEquals) return new RegExp("\\bdata-" + dataEquals[1]! + "=[\"']" + escapeRegExp(dataEquals[2]!) + "[\"']", "i").test(html);
  return false;
}

function googlePlace(observation: FixedSourceObservation) {
  const source = observation.google;
  return {
    id: source.placeId,
    displayName: { text: source.displayName },
    formattedAddress: source.address,
    location: source.coordinates,
    types: ["restaurant"],
    nationalPhoneNumber: source.phone,
    websiteUri: source.websiteUri,
    ...(source.listedTableCheckUri ? { googleMapsUri: source.listedTableCheckUri } : {}),
  };
}

/**
 * Production Google/fact/browser adapters backed by a small offline source
 * environment. Transport is replaced; interpretation, grounding, Router and
 * browser availability are the production path. Each observation reads the
 * injected controlled clock at the point it is actually acquired.
 */
export function createCurrentDevelopmentFixedSources(
  scenario: CurrentDevelopmentSourceScenario,
  clock: FixedSourceClock,
  model: ModelGateway,
) {
  const observations = [...scenario.observations];
  const byId = new Map(observations.map((item) => [item.google.placeId, item]));
  const calls: FixedSourceCalls = {
    search: 0, facts: 0, availability: 0, namedPlace: 0, website: 0,
    coverageGaps: [], observations: [], browserNavigations: [],
  };
  const observed = (
    source: FixedSourceObservationTime["source"],
    stage: string,
    options: Pick<FixedSourceObservationTime, "candidateId" | "sampleCapturedAt"> = {},
  ) => {
    const event = { source, stage, observedAt: asIso(clock), ...options };
    calls.observations.push(event);
    return event.observedAt;
  };
  const sourceGap = (record: FixedSourceCoverageGap) => {
    calls.coverageGaps.push(record);
    return gap(record);
  };
  const client = new GooglePlacesClient({ apiKey: "mock-key", fetchImplementation: async (url, init) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { textQuery?: string };
      const query = body.textQuery ?? "";
      const landmark = observations.find((item) => item.landmark && tokens(item.landmark.displayName).join("") === tokens(query).join(""))?.landmark;
      if (landmark) {
        calls.namedPlace++;
        observed("GOOGLE", "LANDMARK");
        return new Response(JSON.stringify({ places: [{ id: "landmark:" + landmark.displayName, displayName: { text: landmark.displayName }, location: landmark.coordinates, types: ["train_station"] }] }), { status: 200 });
      }
      calls.search++;
      observed("GOOGLE", "SEARCH");
      return new Response(JSON.stringify({ places: observations.filter((item) => discoverable(item, query)).map(googlePlace) }), { status: 200 });
    }
    const placeId = decodeURIComponent(String(url).split("/").at(-1) ?? "");
    const source = byId.get(placeId);
    if (!source) throw sourceGap({
      source: "GOOGLE_DETAILS", stage: "DETAILS", request: "placeId=" + placeId,
      ...(placeId ? { candidateId: placeId } : {}), reason: "Google details are not configured for this legal candidate",
    });
    calls.facts++;
    observed("GOOGLE", "DETAILS", { candidateId: source.google.placeId, ...(source.websiteFacts ? { sampleCapturedAt: source.websiteFacts.sampleCapturedAt } : {}) });
    if (source.google.detailStatus === "NOT_FOUND") return new Response(JSON.stringify({ error: "configured not found" }), { status: 404 });
    return new Response(JSON.stringify(googlePlace(source)), { status: 200 });
  } });
  const search = new GooglePlacesRestaurantSearch(client, () => asIso(clock), 10, { maxRequests: 10 });
  const browser: BrowserRuntime = { openSession: async () => {
    let page: BrowserSnapshot | undefined;
    const sourceForTableCheckPath = (pathname: string) => observations.find((item) => {
      const path = item.tableCheck?.reservationEntryPath;
      return path !== undefined && (pathname === path || pathname === path + "/reserve/landing");
    });
    return {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: asIso(clock) },
      navigate: async (target: string) => {
        calls.browserNavigations.push(target);
        const url = new URL(target);
        const websiteSource = observations.find((item) => item.google.websiteUri === target);
        if (websiteSource && url.hostname !== "www.tablecheck.com") {
          if (!websiteSource.websiteFacts) throw sourceGap({
            source: "WEBSITE", stage: "FACTS", request: target, candidateId: websiteSource.google.placeId,
            reason: "Website facts are not configured for this legal source page",
          });
          calls.website++;
          observed("WEBSITE", "FACTS", { candidateId: websiteSource.google.placeId, sampleCapturedAt: websiteSource.websiteFacts.sampleCapturedAt });
          page = { url: target, title: websiteSource.google.displayName, text: websiteSource.google.displayName,
            html: "<main id=\"restaurant-facts\"><script type=\"application/ld+json\">" + JSON.stringify({ "@type": "Restaurant", name: websiteSource.google.displayName, address: websiteSource.google.address, servesCuisine: websiteSource.websiteFacts.types, openingHours: websiteSource.websiteFacts.hours }) + "</script></main>" };
          return;
        }
        if (url.hostname !== "www.tablecheck.com") throw sourceGap({
          source: "BROWSER", stage: "NAVIGATE", request: target, reason: "Browser origin " + url.origin + " is not configured",
        });
        if (url.pathname === "/en/japan/search") {
          const requested = url.searchParams.get("search_text") ?? "";
          const rawMatches = requested ? observations.filter((item) => tokens(item.google.displayName).every((token) => tokens(requested).includes(token))) : observations;
          const matches = rawMatches.filter((item) => item.tableCheck?.discoveryListed !== false);
          if (requested && !matches.length && !rawMatches.some((item) => item.tableCheck?.discoveryListed === false)) throw sourceGap({
            source: "TABLECHECK", stage: "DISCOVERY", request: target, reason: "TableCheck discovery has no configured outlet for " + requested,
          });
          observed("TABLECHECK", "DISCOVERY");
          const links = matches.flatMap((item) => item.tableCheck ? ["<a href=\"" + item.tableCheck.reservationEntryPath + "?search_text=" + encodeURIComponent(item.tableCheck.displayName) + "\">" + item.tableCheck.displayName + "</a>"] : []).join("");
          page = { url: target, title: "Map search", text: matches.length ? matches.map((item) => item.google.displayName).join(" ") : "0 venues found", html: "<section id=\"tablecheck-results\">" + links + "</section>" };
          return;
        }
        const source = sourceForTableCheckPath(url.pathname);
        if (!source || !source.tableCheck) throw sourceGap({
          source: "TABLECHECK", stage: "PAGE", request: target, reason: "TableCheck page " + url.pathname + " is not configured",
        });
        const tableCheck = source.tableCheck;
        if (url.pathname === tableCheck.reservationEntryPath) {
          observed("TABLECHECK", "IDENTITY", { candidateId: source.google.placeId });
          page = { url: target, title: tableCheck.displayName, text: tableCheck.displayName + " " + tableCheck.address + " " + tableCheck.phone,
            html: "<h1 id=\"outlet-name\">" + tableCheck.displayName + "</h1><p class=\"address\">" + tableCheck.address + "</p><a href=\"tel:" + tableCheck.phone.replace(/\s/g, "") + "\">" + tableCheck.phone + "</a><a id=\"reservation-entry\" href=\"" + tableCheck.reservationEntryPath + "/reserve/landing\">Book a table</a>" };
          return;
        }
        const inventory = source.availability;
        if (!inventory) throw sourceGap({
          source: "TABLECHECK", stage: "AVAILABILITY", request: target, candidateId: source.google.placeId,
          reason: "Availability is not configured for this legal TableCheck outlet",
        });
        if (url.searchParams.get("start_date") !== inventory.date || url.searchParams.get("pax") !== String(inventory.partySize)) throw sourceGap({
          source: "TABLECHECK", stage: "AVAILABILITY", request: target, candidateId: source.google.placeId,
          reason: "No fixture inventory matches the requested date or party size",
        });
        calls.availability++;
        observed("TABLECHECK", "AVAILABILITY", { candidateId: source.google.placeId, sampleCapturedAt: inventory.sampleCapturedAt });
        const slots = inventory.visibleSlots.map((slot) => "<button class=\"time-slot is-available\" data-time=\"" + slot + "\">" + slot + "</button>").join("");
        page = { url: target, title: tableCheck.displayName, text: inventory.menuText + " " + inventory.visibleSlots.join(" "),
          html: "<div data-selected-date=\"" + inventory.date + "\" data-pax=\"" + inventory.partySize + "\"></div><section class=\"featured-menu\">" + inventory.menuText + "</section>" +
            (inventory.status === "UNAVAILABLE" ? "<section id=\"availability-results\" data-availability-state=\"empty\"></section>" : "<section id=\"availability-results\" data-availability-state=\"complete\">" + slots + "</section>") };
      },
      snapshot: async () => { if (!page) throw sourceGap({ source: "BROWSER", stage: "SNAPSHOT", request: "<none>", reason: "Browser snapshot occurred before navigation" }); return page; },
      click: async () => { throw sourceGap({ source: "BROWSER", stage: "CLICK", request: "<opaque>", reason: "Fixture does not configure write-like browser interaction" }); },
      fill: async () => { throw sourceGap({ source: "BROWSER", stage: "FILL", request: "<opaque>", reason: "Fixture does not configure write-like browser interaction" }); },
      select: async () => { throw sourceGap({ source: "BROWSER", stage: "SELECT", request: "<opaque>", reason: "Fixture does not configure write-like browser interaction" }); },
      waitFor: async (selector) => {
        if (!page || !matchesSelector(page.html, selector)) throw sourceGap({
          source: "BROWSER", stage: "WAIT_FOR", request: selector, reason: "The requested browser wait target is not present in the configured page",
        });
      },
      screenshot: async () => new Uint8Array(), close: async () => {},
    };
  } };
  return {
    search,
    facts: composeLiveRestaurantFactRead(search, browser, model, undefined, () => asIso(clock)),
    availability: new LiveBrowserAvailability(browser, model, { now: () => asIso(clock) }),
    browser,
    calls,
  };
}
