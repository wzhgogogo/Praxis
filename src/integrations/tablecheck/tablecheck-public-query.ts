import type { BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule } from "../../infrastructure/browser/browser-runtime.js";

const tableCheckGetPreflight = { requestOrigin: "https://www.tablecheck.com", requestedHeaderNames: ["x-api-key"] } as const;
export const TABLECHECK_PUBLIC_SEARCH_ORIGIN = "https://search-v4.production.ap-northeast-1.aws.tablecheck.net";
/** Observed public, unauthenticated GET JSON transports; no wildcard origin/path/method. */
export const tableCheckPublicSearchReads: readonly BrowserReadNetworkRequestRule[] = [
  // Four observed public text-search projections; exact keys, current-fill
  // text only, existing endpoint/method/CORS header contract unchanged.
  ...[
    ["country","hits","queryProfile"],
    ["country","hits","kind","queryProfile"],
    ["country","hits","q","queryProfile"],
    ["destination","hits","name","queryProfile"],
  ].map(queryKeys=>({origin:TABLECHECK_PUBLIC_SEARCH_ORIGIN,pathname:"/search/",methods:["GET"] as const,resourceTypes:["fetch","xhr"] as const,
    queryKeys,corsPreflight:tableCheckGetPreflight,
    queryValueClasses:{q:["EQUALS_AUTHORITATIVE_INPUT"] as const,name:["EQUALS_AUTHORITATIVE_INPUT"] as const,
      country:["SHORT_TOKEN","NUMERIC"] as const,kind:["SHORT_TOKEN","NUMERIC"] as const,destination:["SHORT_TOKEN","NUMERIC","NAMESPACED_TOKEN"] as const,hits:["NUMERIC"] as const},
  })),
  { origin: TABLECHECK_PUBLIC_SEARCH_ORIGIN, pathname: "/catalog.json", methods: ["GET"], resourceTypes: ["fetch", "xhr"], queryKeys: [], corsPreflight: tableCheckGetPreflight },
  { origin: TABLECHECK_PUBLIC_SEARCH_ORIGIN, pathname: "/search/", methods: ["GET"], resourceTypes: ["fetch", "xhr"],
    corsPreflight: tableCheckGetPreflight,
    queryKeyRules: { required: ["queryProfile"], allowed: ["hits", "scope", "lat", "lng", "radius_km", "party_size", "cuisine", "sort", "offset", "id", "open_day", "service_mode"] } },
];

/** Only document hits count. Catalog metadata and grouped facet nodes are not venues. */
export function observeTableCheckSearchCount(response: {url:string;method:string;status:number;contentType:string;body:Uint8Array}): number | undefined {
  let url:URL;try {url=new URL(response.url);}catch{return undefined;}
  if(url.origin!==TABLECHECK_PUBLIC_SEARCH_ORIGIN||url.pathname!=="/search/"||response.method!=="GET"||response.status!==200||!/^application\/json(?:;|$)/i.test(response.contentType)||response.body.byteLength>2_000_000)return undefined;
  try {
    const root=JSON.parse(new TextDecoder().decode(response.body)).root;
    if(!root||!Array.isArray(root.children))return undefined;
    const count=(nodes:unknown[],depth=0):number=>depth>12?0:nodes.reduce<number>((total,node)=>{
      if(!node||typeof node!=="object"||Array.isArray(node))return total;
      const item=node as Record<string,unknown>;
      return total+(typeof item.source==="string"&&typeof item.id==="string"&&item.fields&&typeof item.fields==="object"?1:Array.isArray(item.children)?count(item.children,depth+1):0);
    },0);
    return count(root.children);
  }catch{return undefined;}
}

/**
 * Public request shapes observed in the 2026-10-07 read-contract capture.
 * The calendar's four public fields are all captured as strings, without
 * values. This admits only that exact read-query shape, never inventory.
 */
export const tableCheckPublicReadNetworkPolicy: BrowserReadNetworkPolicy = {
  startupDocuments: ["https://www.tablecheck.com/en/japan/search"],
  documentOrigins: ["https://www.tablecheck.com"],
  prohibitedPaths: [{ hostname: "tablecheck.com", pathSegment: "reserve" }],
  staticResources: [
    ...[0, 1, 2, 3].map(cdn => ({ origin: `https://cdn${cdn}.tablecheck.com`, pathnamePrefix: "/assets/table_check/", resourceTypes: ["script", "stylesheet", "font", "image"] as const, methods: ["GET", "HEAD"] as const })),
    { origin: "https://www.tablecheck.com", pathnamePrefix: "/portal/assets/", resourceTypes: ["script", "stylesheet"] },
    { origin: "https://cdn0.tablecheck.com", pathnamePrefix: "/common/", resourceTypes: ["script", "stylesheet", "font", "image", "fetch", "xhr"], corsPreflight: tableCheckGetPreflight },
    ...["https://image.cdn.tablecheck.com", "https://1.image.cdn.tablecheck.com", "https://2.image.cdn.tablecheck.com", "https://3.image.cdn.tablecheck.com", "https://4.image.cdn.tablecheck.com"].map(origin => ({ origin, pathnamePrefix: "/unsafe/", resourceTypes: ["image"] as const })),
  ],
  dynamicReads: [...tableCheckPublicSearchReads, {
    // The Pack's deterministic discovery entry is a public GET document.
    // Retain its source-owned query grammar for guarded navigation and for
    // faithful recording; values remain outside policy and diagnostics.
    origin: "https://www.tablecheck.com",
    pathname: "/en/japan/search",
    resourceTypes: ["document"], methods: ["GET"],
    strictQueryKeys: ["date", "time", "num_people", "availability_mode"],
    queryKeyRules: {
      required: ["service_mode", "sort_by", "venue_type", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate"],
      allowed: ["search_text", "date", "time", "num_people", "availability_mode"],
    },
  }, {
    // The source's public carousel continuation calls this exact GET after
    // discovery. Its reviewed client builds `limit` and `sort_by`, adding
    // repeated public shop IDs only for a sufficiently long source list.
    // This admits a response transport only; it does not assert any outlet,
    // inventory, or qualification result.
    origin: "https://production.tablecheck.com",
    pathname: "/v2/hub/public_shop_lists",
    resourceTypes: ["fetch", "xhr"], corsPreflight: tableCheckGetPreflight,
    queryKeyRules: {
      required: ["limit", "sort_by"],
      allowed: ["shop_ids[]"],
      repeatable: ["shop_ids[]"],
    },
  }, {
    origin: "https://production.tablecheck.com",
    pathname: "/v2/hub/availability_calendar_v2",
    resourceTypes: ["fetch", "xhr"], methods: ["POST"], corsPreflight: { requestOrigin: "https://www.tablecheck.com", requestedHeaderNames: ["content-type"] },
    bodyFields: { locale: "string", start_at: "string", shop_id: "string", num_people: "string" },
  }, {
    // The guarded search-contract capture observed this prerequisite before a
    // query result. It has no public query fields and is not inventory.
    origin: "https://production.tablecheck.com",
    pathname: "/v2/geolocation",
    resourceTypes: ["fetch", "xhr"], queryKeys: [], corsPreflight: tableCheckGetPreflight,
  }, {
    // The same capture observed this exact public suggestion grammar. It is a
    // prerequisite read, never a result or inventory assertion.
    origin: "https://production.tablecheck.com",
    pathname: "/v2/autocomplete",
    resourceTypes: ["fetch", "xhr"], queryKeys: ["locale", "shop_universe_id", "text"], corsPreflight: tableCheckGetPreflight,
  }, {
    // CIt always adds the source's universe and include-ID fields. The search
    // builder and pagination add the remaining public keys only when relevant.
    // Values stay outside the policy. Cuisine is an observed multi-select,
    // therefore only its public `cuisines[]` key may repeat.
    origin: "https://search-api.ai.ingress.production.tablecheck.com",
    pathname: "/ai_search",
    resourceTypes: ["fetch", "xhr"], corsPreflight: tableCheckGetPreflight,
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
    resourceTypes: ["fetch", "xhr"], corsPreflight: tableCheckGetPreflight,
    queryKeyRules: {
      required: ["shop_universe_id", "include_ids"],
      allowed: ["service_mode", "sort_by", "venue_type", "search_text", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate", "cuisines[]", "budget_dinner_avg_min", "budget_dinner_avg_max", "search_after", "per_page", "randomize_geo"],
      repeatable: ["cuisines[]"],
    },
  }],
};
