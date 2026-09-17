import type { ModelGateway } from "../../../core/model/contracts.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../integrations/restaurant-availability/live-browser-availability.js";
import { composeLiveRestaurantFactRead } from "../../../integrations/restaurant-facts/live-restaurant-facts.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "./live-evaluation-location.js";
import type { CurrentDevelopmentSourceScenario } from "./current-development-source-scenarios.js";

export type FixedSourceCalls = { search: number; facts: number; availability: number; namedPlace: number; website: number };

/**
 * Real production source adapters against a deliberately small, fixed source
 * environment.  The only replacements are provider transport and browser
 * pages; validation, routing, grounding and fact composition remain real.
 *
 * It is shared by the code-contract and real-model runners.  In particular,
 * it does not know a user request, semantic expected result, or action plan.
 */
export function createCurrentDevelopmentFixedSources(
  scenario: CurrentDevelopmentSourceScenario,
  observedAt: string,
  model: ModelGateway,
) {
  const source = scenario.observation;
  const calls: FixedSourceCalls = { search: 0, facts: 0, availability: 0, namedPlace: 0, website: 0 };
  const address = "1 Ginza, Chuo City, Tokyo";
  const location = { latitude: HIGASHI_GINZA_EVALUATION_LOCATION.latitude, longitude: HIGASHI_GINZA_EVALUATION_LOCATION.longitude };
  const place = {
    id: source.placeId, displayName: { text: source.displayName }, formattedAddress: address, location,
    types: ["restaurant"], internationalPhoneNumber: "+81 3-1111-2222", websiteUri: "https://offline.example/cafe",
  };
  const client = new GooglePlacesClient({ apiKey: "mock-key", fetchImplementation: async (url, init) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { textQuery?: string };
      if (source.addressComponent && body.textQuery === source.addressComponent) {
        calls.namedPlace++;
        return new Response(JSON.stringify({ places: [{ id: "source-landmark", displayName: { text: source.addressComponent }, location, types: ["train_station"] }] }), { status: 200 });
      }
      calls.search++;
      return new Response(JSON.stringify({ places: [place] }), { status: 200 });
    }
    if (String(url).split("/").at(-1) !== place.id) return new Response(JSON.stringify({ error: "unknown place" }), { status: 404 });
    calls.facts++;
    if (!source.websiteFacts) return new Response(JSON.stringify({ error: "facts unavailable" }), { status: 404 });
    return new Response(JSON.stringify(place), { status: 200 });
  } });
  const search = new GooglePlacesRestaurantSearch(client, () => observedAt, 10, { maxRequests: 10 });
  const browser: BrowserRuntime = { openSession: async () => {
    let page: BrowserSnapshot | undefined;
    return {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: observedAt },
      navigate: async (target: string) => {
        const url = new URL(target);
        const inventory = source.availability;
        if (target === place.websiteUri && source.websiteFacts) {
          calls.website++;
          page = { url: target, title: place.displayName.text, text: place.displayName.text,
            html: `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: place.displayName.text, address, servesCuisine: source.websiteFacts.types, openingHours: source.websiteFacts.hours })}</script>` };
          return;
        }
        if (url.hostname !== "www.tablecheck.com" || !inventory) throw new Error(`Unplanned fixed-source navigation: ${target}`);
        if (url.pathname === "/en/japan/search") {
          page = { url: target, title: "Map search", text: place.displayName.text, html: `<a href="/en/source-venue">${place.displayName.text}</a>` };
          return;
        }
        if (url.pathname === "/en/source-venue") {
          page = { url: target, title: place.displayName.text, text: `${place.displayName.text} ${address} 03-1111-2222`, html: `<h1>${place.displayName.text}</h1><p class="address">${address}</p><a href="tel:03-1111-2222">03-1111-2222</a><a href="/en/source-venue/reserve/landing">Book a table</a>` };
          return;
        }
        if (url.pathname !== "/en/source-venue/reserve/landing") throw new Error(`Unplanned fixed-source TableCheck navigation: ${target}`);
        // The observation only answers its actual request scope.  A changed
        // date or party size cannot silently inherit a successful slot.
        if (url.searchParams.get("start_date") !== inventory.date || url.searchParams.get("pax") !== String(inventory.partySize)) {
          throw new Error(`Fixed source has no observation for date=${url.searchParams.get("start_date")} pax=${url.searchParams.get("pax")}`);
        }
        calls.availability++;
        page = { url: target, title: place.displayName.text, text: `${inventory.menuText} ${inventory.visibleSlots.join(" ")}`,
          html: `<div data-selected-date="${inventory.date}" data-pax="${inventory.partySize}"></div><section class="featured-menu">${inventory.menuText}</section>` +
            (inventory.status === "UNAVAILABLE" ? '<section data-availability-state="empty"></section>' : `<section data-availability-state="complete">${inventory.visibleSlots.map((slot) => `<button class="time-slot is-available" data-time="${slot}">${slot}</button>`).join("")}</section>`) };
      },
      snapshot: async () => { if (!page) throw new Error("No fixed-source page"); return page; },
      click: async () => { throw new Error("Fixed source does not script browser interactions"); },
      fill: async () => { throw new Error("Fixed source does not script browser interactions"); },
      select: async () => { throw new Error("Fixed source does not script browser interactions"); },
      waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
    };
  } };
  return {
    search,
    facts: composeLiveRestaurantFactRead(search, browser, model, undefined, () => observedAt),
    availability: new LiveBrowserAvailability(browser, model, { now: () => observedAt }),
    calls,
  };
}
