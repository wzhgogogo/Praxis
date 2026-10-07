import type { BrowserReadNetworkPolicy } from "../../infrastructure/browser/browser-runtime.js";

/**
 * Public request shapes observed in the 2026-10-07 read-contract capture.
 * The calendar's four public fields are all captured as strings, without
 * values. This admits only that exact read-query shape, never inventory.
 */
export const tableCheckPublicReadNetworkPolicy: BrowserReadNetworkPolicy = {
  documentOrigins: ["https://www.tablecheck.com"],
  staticResources: [
    { origin: "https://www.tablecheck.com", pathnamePrefix: "/portal/assets/", resourceTypes: ["script", "stylesheet"] },
    { origin: "https://cdn0.tablecheck.com", pathnamePrefix: "/common/", resourceTypes: ["script", "stylesheet", "font", "image", "fetch"] },
    ...["https://image.cdn.tablecheck.com", "https://1.image.cdn.tablecheck.com", "https://2.image.cdn.tablecheck.com", "https://3.image.cdn.tablecheck.com", "https://4.image.cdn.tablecheck.com"].map(origin => ({ origin, pathnamePrefix: "/unsafe/", resourceTypes: ["image"] as const })),
  ],
  dynamicReads: [{
    // The Pack's deterministic discovery entry is a public GET document.
    // Retain its source-owned query grammar for guarded navigation and for
    // faithful recording; values remain outside policy and diagnostics.
    origin: "https://www.tablecheck.com",
    pathname: "/en/japan/search",
    resourceTypes: ["document"],
    queryKeyRules: {
      required: ["service_mode", "sort_by", "venue_type", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate"],
      allowed: ["search_text"],
    },
  }, {
    // The source's public carousel continuation calls this exact GET after
    // discovery. Its reviewed client builds `limit` and `sort_by`, adding
    // repeated public shop IDs only for a sufficiently long source list.
    // This admits a response transport only; it does not assert any outlet,
    // inventory, or qualification result.
    origin: "https://production.tablecheck.com",
    pathname: "/v2/hub/public_shop_lists",
    resourceTypes: ["fetch"],
    queryKeyRules: {
      required: ["limit", "sort_by"],
      allowed: ["shop_ids[]"],
      repeatable: ["shop_ids[]"],
    },
  }, {
    origin: "https://production.tablecheck.com",
    pathname: "/v2/hub/availability_calendar_v2",
    resourceTypes: ["fetch"], methods: ["POST"],
    bodyFields: { locale: "string", start_at: "string", shop_id: "string", num_people: "string" },
  }, {
    // The guarded search-contract capture observed this prerequisite before a
    // query result. It has no public query fields and is not inventory.
    origin: "https://production.tablecheck.com",
    pathname: "/v2/geolocation",
    resourceTypes: ["fetch"], queryKeys: [],
  }, {
    // The same capture observed this exact public suggestion grammar. It is a
    // prerequisite read, never a result or inventory assertion.
    origin: "https://production.tablecheck.com",
    pathname: "/v2/autocomplete",
    resourceTypes: ["fetch"], queryKeys: ["locale", "shop_universe_id", "text"],
  }, {
    // CIt always adds the source's universe and include-ID fields. The search
    // builder and pagination add the remaining public keys only when relevant.
    // Values stay outside the policy. Cuisine is an observed multi-select,
    // therefore only its public `cuisines[]` key may repeat.
    origin: "https://search-api.ai.ingress.production.tablecheck.com",
    pathname: "/ai_search",
    resourceTypes: ["fetch"],
    queryKeyRules: {
      required: ["shop_universe_id", "include_ids"],
      allowed: ["service_mode", "sort_by", "venue_type", "search_text", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate", "cuisines[]", "budget_dinner_avg_min", "budget_dinner_avg_max", "search_after", "per_page", "randomize_geo"],
      repeatable: ["cuisines[]"],
    },
  }, {
    // q4e is the public non-AI counterpart of CIt. It shares the same
    // source-owned query grammar and uses the same reviewed read boundary.
    origin: "https://production.tablecheck.com",
    pathname: "/v2/shop_search",
    resourceTypes: ["fetch"],
    queryKeyRules: {
      required: ["shop_universe_id", "include_ids"],
      allowed: ["service_mode", "sort_by", "venue_type", "search_text", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate", "cuisines[]", "budget_dinner_avg_min", "budget_dinner_avg_max", "search_after", "per_page", "randomize_geo"],
      repeatable: ["cuisines[]"],
    },
  }],
};
