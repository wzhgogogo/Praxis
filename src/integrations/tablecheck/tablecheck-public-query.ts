import type { BrowserSkillReadInput } from "../../infrastructure/browser/browser-task-executor.js";
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

/** Observed 2026-09-16: the public Budget dialog stages two rc-slider endpoints;
 * Update writes budget_dinner_avg_min/max to the public search URL.
 * Cuisine check/uncheck was also observed to add/remove cuisines[]=sushi.
 * This is not a grant for other dialogs, arbitrary GET forms, consent, or reservation pages.
 */
export const permitsTableCheckQueryControl: NonNullable<BrowserSkillReadInput["permitQueryControl"]> = ({ control, snapshot, action }) => {
  let url: URL;
  try { url = new URL(snapshot.url); } catch { return false; }
  if (url.origin !== "https://www.tablecheck.com" || url.pathname !== "/en/japan/search") return false;
  const structure = control.structure;
  // The source path, dialog and public field structure are the observed
  // contract. A generated form class is not a stable permission boundary.
  if (!structure || !["Budget", "Cuisine"].includes(structure.dialogLabel)) return false;
  if (control.disabled || !control.visible || control.blockedByActiveLayer) return false;
  if (action === "SET_CHECKED") return structure.dialogLabel === "Cuisine" && structure.tag === "INPUT"
    && structure.name === "cuisines" && structure.classes.includes("checkbox") && control.type === "checkbox" && control.kind === "CHECKBOX";
  if (action === "ADJUST_RANGE") return structure.dialogLabel === "Budget" && structure.sliderCount === 2 && control.kind === "RANGE" && structure.tag === "DIV"
    && control.min === "0" && control.max === "15" && structure.classes.includes("rc-slider-handle")
    && (structure.classes.includes("rc-slider-handle-1") || structure.classes.includes("rc-slider-handle-2"));
  return action === "CLICK" && control.kind === "BUTTON" && structure.tag === "BUTTON"
    && control.type === "submit" && control.label === "Update";
};

/** A source-owned availability category can be read only after its radio state is re-observed. */
export const permitsTableCheckAvailabilityServiceCategory: NonNullable<BrowserSkillReadInput["permitQueryControl"]> = ({ control, snapshot, action }) => {
  if (action !== "SET_CHECKED") return false;
  let url: URL;
  try { url = new URL(snapshot.url); } catch { return false; }
  if (url.origin !== "https://www.tablecheck.com") return false;
  const structure = control.structure;
  if (!structure || control.kind !== "RADIO" || control.type !== "radio" || structure.tag !== "INPUT"
    || control.disabled || !control.visible || control.blockedByActiveLayer) return false;
  // This exact observed reservation-query shape excludes radios in account,
  // consent, checkout, and booking-commit flows. HTTP method is deliberately
  // not a safety signal: the public query form observed in the source is POST.
  if (!/^\/(?:en|ja)\/(?:shops\/)?[^/]+\/reserve(?:\/landing)?\/?$/i.test(url.pathname)) return false;
  return structure.name === "reservation[service_category]"
    && /(?:^|\s)reserveform(?:\s|$)/i.test(structure.formClass);
};
