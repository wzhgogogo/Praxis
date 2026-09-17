import type { ModelGateway } from "../../../core/model/contracts.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../integrations/restaurant-availability/live-browser-availability.js";
import { composeLiveRestaurantFactRead } from "../../../integrations/restaurant-facts/live-restaurant-facts.js";
import type { CurrentDevelopmentSourceScenario, FixedSourceObservation } from "./current-development-source-scenarios.js";

export type FixedSourceCalls = { search: number; facts: number; availability: number; namedPlace: number; website: number; coverageGaps: string[] };

function gap(message: string): Error {
  return Object.assign(new Error(`Fixed-source coverage gap: ${message}`), { code: "FIXTURE_COVERAGE_GAP" });
}

function tokens(value: string): string[] {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean).map((token) => token.endsWith("s") ? token.slice(0, -1) : token);
}

function discoverable(observation: FixedSourceObservation, query: string): boolean {
  const queryTokens = new Set(tokens(query));
  // A source declares retrieval vocabulary, not one hard-coded prompt.  At
  // least one non-generic declared term must occur; a generic "restaurant"
  // query therefore cannot manufacture a candidate.
  return observation.searchTerms.some((term) => tokens(term).some((token) => token.length > 2 && queryTokens.has(token)));
}

function place(observation: FixedSourceObservation) {
  return {
    id: observation.placeId,
    displayName: { text: observation.displayName },
    formattedAddress: observation.venue.address,
    location: observation.venue.coordinates,
    types: ["restaurant"],
    internationalPhoneNumber: observation.venue.phone,
    websiteUri: observation.venue.websiteUri,
  };
}

/**
 * Production Google/fact/browser adapters backed by a small offline source
 * environment. Provider transport is replaced, but the Interpreter, Router,
 * grounding and browser availability adapters are the production ones.
 */
export function createCurrentDevelopmentFixedSources(
  scenario: CurrentDevelopmentSourceScenario,
  observedAt: string,
  model: ModelGateway,
) {
  const observations = [...scenario.observations];
  const byId = new Map(observations.map((item) => [item.placeId, item]));
  const calls: FixedSourceCalls = { search: 0, facts: 0, availability: 0, namedPlace: 0, website: 0, coverageGaps: [] };
  const sourceGap = (message: string) => {
    calls.coverageGaps.push(message);
    return gap(message);
  };
  const client = new GooglePlacesClient({ apiKey: "mock-key", fetchImplementation: async (url, init) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { textQuery?: string };
      const query = body.textQuery ?? "";
      const landmark = observations.find((item) => item.landmark && tokens(item.landmark.displayName).join("") === tokens(query).join(""))?.landmark;
      if (landmark) {
        calls.namedPlace++;
        return new Response(JSON.stringify({ places: [{ id: `landmark:${landmark.displayName}`, displayName: { text: landmark.displayName }, location: landmark.coordinates, types: ["train_station"] }] }), { status: 200 });
      }
      calls.search++;
      return new Response(JSON.stringify({ places: observations.filter((item) => discoverable(item, query)).map(place) }), { status: 200 });
    }
    const placeId = String(url).split("/").at(-1) ?? "";
    const source = byId.get(placeId);
    if (!source) return new Response(JSON.stringify({ error: "unconfigured place", code: "FIXTURE_COVERAGE_GAP" }), { status: 404 });
    calls.facts++;
    if (!source.websiteFacts) return new Response(JSON.stringify({ error: "facts unavailable", code: "FIXTURE_COVERAGE_GAP" }), { status: 404 });
    return new Response(JSON.stringify(place(source)), { status: 200 });
  } });
  const search = new GooglePlacesRestaurantSearch(client, () => observedAt, 10, { maxRequests: 10 });
  const browser: BrowserRuntime = { openSession: async () => {
    let page: BrowserSnapshot | undefined;
    const sourceForTableCheckPath = (pathname: string) => observations.find((item) => pathname === item.venue.tableCheckPath || pathname === `${item.venue.tableCheckPath}/reserve/landing`);
    return {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: observedAt },
      navigate: async (target: string) => {
        const url = new URL(target);
        const websiteSource = observations.find((item) => item.venue.websiteUri === target);
        if (websiteSource) {
          if (!websiteSource.websiteFacts) throw sourceGap(`website facts are not configured for ${websiteSource.placeId}`);
          calls.website++;
          page = { url: target, title: websiteSource.displayName, text: websiteSource.displayName,
            html: `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: websiteSource.displayName, address: websiteSource.venue.address, servesCuisine: websiteSource.websiteFacts.types, openingHours: websiteSource.websiteFacts.hours })}</script>` };
          return;
        }
        if (url.hostname !== "www.tablecheck.com") throw sourceGap(`unconfigured browser origin ${url.origin}`);
        if (url.pathname === "/en/japan/search") {
          const requested = url.searchParams.get("search_text") ?? "";
          const matches = requested ? observations.filter((item) => tokens(item.displayName).every((token) => tokens(requested).includes(token))) : observations;
          if (requested && !matches.length) throw sourceGap(`TableCheck discovery has no configured outlet for ${requested}`);
          const links = matches.map((item) => `<a href="${item.venue.tableCheckPath}">${item.displayName}</a>`).join("");
          page = { url: target, title: "Map search", text: matches.map((item) => item.displayName).join(" "), html: links };
          return;
        }
        const source = sourceForTableCheckPath(url.pathname);
        if (!source) throw sourceGap(`TableCheck page ${url.pathname} is not configured`);
        if (url.pathname === source.venue.tableCheckPath) {
          page = { url: target, title: source.displayName, text: `${source.displayName} ${source.venue.address} ${source.venue.phone}`,
            html: `<h1>${source.displayName}</h1><p class="address">${source.venue.address}</p><a href="tel:${source.venue.phone.replace(/\s/g, "")}">${source.venue.phone}</a><a href="${source.venue.tableCheckPath}/reserve/landing">Book a table</a>` };
          return;
        }
        const inventory = source.availability;
        if (!inventory) throw sourceGap(`availability is not configured for ${source.placeId}`);
        if (url.searchParams.get("start_date") !== inventory.date || url.searchParams.get("pax") !== String(inventory.partySize)) {
          throw sourceGap(`no inventory for ${source.placeId} date=${url.searchParams.get("start_date")} pax=${url.searchParams.get("pax")}`);
        }
        calls.availability++;
        page = { url: target, title: source.displayName, text: `${inventory.menuText} ${inventory.visibleSlots.join(" ")}`,
          html: `<div data-selected-date="${inventory.date}" data-pax="${inventory.partySize}"></div><section class="featured-menu">${inventory.menuText}</section>` +
            (inventory.status === "UNAVAILABLE" ? '<section data-availability-state="empty"></section>' : `<section data-availability-state="complete">${inventory.visibleSlots.map((slot) => `<button class="time-slot is-available" data-time="${slot}">${slot}</button>`).join("")}</section>`) };
      },
      snapshot: async () => { if (!page) throw sourceGap("browser snapshot before navigation"); return page; },
      // The fixed page intentionally exposes no write-like interaction. It
      // does not pretend that arbitrary clicks/fills/selects changed state.
      click: async () => { throw sourceGap("unconfigured browser click"); },
      fill: async () => { throw sourceGap("unconfigured browser fill"); },
      select: async () => { throw sourceGap("unconfigured browser select"); },
      waitFor: async (selector) => {
        if (!page || !selector || !page.html.includes("href") && !page.html.includes("time-slot")) throw sourceGap(`wait target not present: ${selector}`);
      },
      screenshot: async () => new Uint8Array(), close: async () => {},
    };
  } };
  return {
    search,
    facts: composeLiveRestaurantFactRead(search, browser, model, undefined, () => observedAt),
    availability: new LiveBrowserAvailability(browser, model, { now: () => observedAt }),
    calls,
  };
}
