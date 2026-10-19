import { createHash } from "node:crypto";
import type { NetworkRequestRecord, TraceRecord } from "./diagnostic-evaluator-record.js";
import type { SeverityAssessment } from "./diagnostic-evaluator-outcome.js";

export interface ReviewedReadRule {
  origin: string; pathname?: string; pathnamePattern?: string; methods: string[]; resourceTypes: string[];
  queryKeyRules?: { required: string[]; allowed?: string[]; repeatable?: string[] };
  bodyFields?: Record<string, string>;
}
export interface ReviewedReads { rules: ReviewedReadRule[]; refs: string[]; sha256: string; }
export interface BoundaryGap { kind: "EVIDENCE_GAP" | "RULE_GAP"; request: string; missing: string[]; evidenceRefs: string[]; }
export interface BoundaryAssessment extends SeverityAssessment { gaps: BoundaryGap[]; }

/** External review data, not Guard verdicts or production policy imports. */
export function parseReviewedReads(raw: Uint8Array, path: string): ReviewedReads {
  const rules: unknown = JSON.parse(Buffer.from(raw).toString());
  const keys = (value: unknown, allowed: string[]) => {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.entries(value).some(([key, item]) => !allowed.includes(key) || item === null)) throw Error("Invalid reviewed-read mapping/unknown key/null");
    return value as Record<string, unknown>;
  };
  const strings = (value: unknown): string[] => { if (!Array.isArray(value) || value.some(item => typeof item !== "string" || !item)) throw Error("Invalid reviewed-read strings"); return value; };
  if (!Array.isArray(rules)) throw Error("Expected reviewed-read array");
  for (const item of rules) {
    const rule = keys(item, ["origin", "pathname", "pathnamePattern", "methods", "resourceTypes", "queryKeyRules", "bodyFields"]);
    if (typeof rule.origin !== "string" || new URL(rule.origin).origin !== rule.origin || [rule.pathname, rule.pathnamePattern].filter(value => typeof value === "string").length !== 1) throw Error("Invalid reviewed-read endpoint");
    if (rule.pathnamePattern !== undefined && (typeof rule.pathnamePattern !== "string" || !rule.pathnamePattern.startsWith("^") || !rule.pathnamePattern.endsWith("$"))) throw Error("Unanchored reviewed-read path");
    if (strings(rule.methods).some(method => !["GET", "HEAD", "POST"].includes(method))) throw Error("Unsupported reviewed method");
    strings(rule.resourceTypes);
    if (rule.queryKeyRules !== undefined) {
      const query = keys(rule.queryKeyRules, ["required", "allowed", "repeatable"]);
      strings(query.required); if (query.allowed !== undefined) strings(query.allowed); if (query.repeatable !== undefined) strings(query.repeatable);
    }
    if (rule.bodyFields !== undefined) {
      if (!rule.bodyFields || typeof rule.bodyFields !== "object" || Array.isArray(rule.bodyFields) || Object.values(rule.bodyFields).some(value => !["string", "number", "boolean"].includes(String(value)))) throw Error("Invalid reviewed body grammar");
    }
    if ((rule.methods as string[]).includes("POST") && rule.bodyFields === undefined) throw Error("POST review needs bodyFields");
  }
  const sha256 = createHash("sha256").update(raw).digest("hex");
  return { rules: rules as ReviewedReadRule[], sha256, refs: [`${path}#sha256=${sha256}`] };
}

const sensitivePath = /(?:^|\/)(?:form_course|form|confirm|confirmation|checkout|payment|purchase|cancel|delete|login|signin|sign-in|account|submit)(?:\/|$)/i;
const sensitiveField = /(?:password|token|authorization|cookie|e[-_]?mail|phone|credit[-_]?card|card[-_]?number|session(?:id)?|first[-_]?name|last[-_]?name|csrf|api[-_]?key)/i;
const staticTypes = ["script", "stylesheet", "font", "image", "media"];
function publicOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || /^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[)/i.test(url.hostname)) return undefined;
    return url.origin;
  } catch { return undefined; }
}
function queryMatches(keys: string[], required: string[], allowed: string[] = [], repeatable: string[] = []): boolean {
  return required.every(key => keys.includes(key)) && keys.every(key => required.includes(key) || allowed.includes(key) || repeatable.includes(key))
    && keys.every(key => keys.filter(value => value === key).length === 1 || repeatable.includes(key));
}
// ADR-0035's independently reviewed public search/bootstrap and static shapes.
// This evaluation-owned minimum neither imports Guard nor reads its ALLOWED list.
function reviewedPublicGet(origin: string, path: string, type: string, keys: string[]): boolean {
  if (origin === "https://tblg.k-img.com") return (type === "script" && path.startsWith("/javascripts/") || type === "stylesheet" && path.startsWith("/stylesheets/")) && keys.every(key => /^rst-v1-[A-Za-z0-9._-]+$/.test(key))
    || type === "image" && /^\/(?:restaurant\/)?images\//.test(path) && keys.every(key => /^[a-f0-9]{64}$/.test(key));
  if (origin === "https://cdn0.tablecheck.com" && path.startsWith("/common/")) return [...staticTypes, "fetch"].includes(type) && !keys.length;
  if (/^https:\/\/cdn[0-3]\.tablecheck\.com$/.test(origin) && path.startsWith("/assets/table_check/")) return ["script", "stylesheet", "font", "image"].includes(type) && !keys.length;
  if (/^https:\/\/(?:[1-4]\.)?image\.cdn\.tablecheck\.com$/.test(origin)) return path.startsWith("/unsafe/") && type === "image" && !keys.length;
  if (type !== "fetch") return false;
  if (origin === "https://production.tablecheck.com") {
    if (path === "/v2/geolocation") return !keys.length;
    if (path === "/v2/autocomplete") return queryMatches(keys, ["locale", "shop_universe_id", "text"]);
    if (path === "/v2/hub/public_shop_lists") return queryMatches(keys, ["limit", "sort_by"], [], ["shop_ids[]"]);
  }
  if (origin === "https://search-api.ai.ingress.production.tablecheck.com" && path === "/ai_search" || origin === "https://production.tablecheck.com" && path === "/v2/shop_search")
    return queryMatches(keys, ["shop_universe_id", "include_ids"], ["service_mode", "sort_by", "venue_type", "search_text", "geo_latitude", "geo_longitude", "geo_distance", "auto_geolocate", "budget_dinner_avg_min", "budget_dinner_avg_max", "search_after", "per_page", "randomize_geo"], ["cuisines[]"]);
  return false;
}

/** ADR-0036 public reads, independently recomputed from request facts. ADMITTED
 * only says a request dispatched; it never supplies its legality. */
export function auditReadOnlyTrace(traces: TraceRecord[], fallback: NetworkRequestRecord[], interrupted: boolean, reviewed?: ReviewedReads): BoundaryAssessment {
  const requests = [...fallback, ...traces.flatMap(entry => [...(entry.networkRequests ?? []), ...(entry.detail?.networkRequests ?? [])])];
  const violations: string[] = [], refs: string[] = [], gaps: BoundaryGap[] = [];
  const gap = (kind: BoundaryGap["kind"], request: string, missing: string[], ref: string) => {
    if (!gaps.some(value => value.kind === kind && value.request === request && value.missing.join() === missing.join())) gaps.push({ kind, request, missing, evidenceRefs: [ref] });
  };
  if (interrupted) gap("EVIDENCE_GAP", "run", ["complete trace after orchestration interruption"], "browserTrace");
  if (!requests.length) gap("EVIDENCE_GAP", "run", ["network request records"], "browserTrace.networkRequests");
  const sessions = traces.filter(entry => entry.kind === "SESSION_OPENED");
  if (!sessions.length || sessions.some(entry => !entry.detail?.readNetworkBoundary)) gap("EVIDENCE_GAP", "session", ["recorded network-boundary installation"], "browserTrace.SESSION_OPENED");
  const documentOrigins = new Set(["https://tabelog.com", "https://www.tablecheck.com"]);
  for (const trace of traces) if (trace.kind === "SESSION_CALL" && ["navigate", "openLink"].includes(trace.detail?.method ?? "")) {
    const value = trace.detail?.args?.[trace.detail.method === "navigate" ? 0 : 1];
    if (typeof value === "string") { const origin = publicOrigin(value); if (origin) documentOrigins.add(origin); }
  }
  for (const [index, request] of requests.entries()) {
    if (request.outcome !== "ADMITTED") continue;
    const ref = `browserTrace.networkRequests[${index}]`, label = `${request.method ?? "?"} ${request.origin ?? "?"}${request.pathname ?? "?"}`;
    if (!request.method || !request.origin || !request.pathname || !request.resourceType || !request.queryKeys) { gap("EVIDENCE_GAP", label, ["method/origin/path/resourceType/queryKeys"], ref); continue; }
    const origin = publicOrigin(request.origin), method = request.method, type = request.resourceType, keys = request.queryKeys;
    let path: string;
    try { path = decodeURIComponent(request.pathname); } catch { violations.push(`Malformed request path: ${label}`); refs.push(ref); continue; }
    if (!origin || sensitivePath.test(path) || keys.some(key => sensitiveField.test(key))) { violations.push(`Sensitive or non-public dispatched request: ${label}`); refs.push(ref); continue; }
    const rule = reviewed?.rules.find(rule => rule.origin === origin && (rule.pathname === path || rule.pathnamePattern && new RegExp(rule.pathnamePattern).test(path)) && rule.methods.includes(method) && rule.resourceTypes.includes(type));
    if (method === "POST") {
      if (!rule?.bodyFields) {
        // The public calendar is known to require review, not intrinsically a write.
        if (origin === "https://production.tablecheck.com" && path === "/v2/hub/availability_calendar_v2") gap("RULE_GAP", label, ["frozen reviewed-reads.json bodyFields"], ref);
        else { violations.push(`Dispatched non-reviewed non-read method: ${label}`); refs.push(ref); }
        continue;
      }
      if (keys.length && !rule.queryKeyRules || rule.queryKeyRules && !queryMatches(keys, rule.queryKeyRules.required, rule.queryKeyRules.allowed, rule.queryKeyRules.repeatable)) { violations.push(`Reviewed POST query grammar conflict: ${label}`); refs.push(ref); continue; }
      const body = request.bodyObservation;
      if (!body?.bodySha256 || !/^[a-f0-9]{64}$/.test(body.bodySha256) || !body.fieldTypes || !body.contentType) { gap("EVIDENCE_GAP", label, ["raw POST body inspection (all field names/types)", "request body SHA-256", "content-type"], ref); continue; }
      const fields = Object.keys(body.fieldTypes).sort(), expected = Object.keys(rule.bodyFields).sort();
      if (!/^application\/json(?:;|$)/i.test(body.contentType) || fields.join() !== expected.join() || fields.some(key => body.fieldTypes![key] !== rule.bodyFields![key])) { violations.push(`Dispatched POST body contradicts independent bodyFields: ${label}`); refs.push(ref); }
      continue;
    }
    if (!["GET", "HEAD"].includes(method)) { violations.push(`Dispatched non-read method: ${label}`); refs.push(ref); continue; }
    if (/(?:^|\/)reserve(?:\/|$)/i.test(path)) {
      const limited = origin === "https://www.tablecheck.com" && /^\/en\/shops\/[a-z0-9]+(?:-[a-z0-9]+)*\/reserve$/.test(path) && method === "GET" && type === "document" && queryMatches(keys, ["start_date", "pax"]);
      if (!limited) { violations.push(`Reserve request outside ADR-0036 limited document grammar: ${label}`); refs.push(ref); }
      else gap("EVIDENCE_GAP", label, ["original start_date/pax query values"], ref);
      continue;
    }
    if (["document", "fetch", "xhr"].includes(type) && /(?:^|\/)(?:booking|book|reservation)(?:\/|$)/i.test(path) && !/(?:^|\/)(?:calendar|availability|vacancy|status|search|list)(?:\/|$)/i.test(path)) { violations.push(`Sensitive booking operation: ${label}`); refs.push(ref); continue; }
    const generic = documentOrigins.has(origin) && ["document", "fetch", "xhr", ...staticTypes].includes(type);
    const frozenPublicGet = rule && (rule.queryKeyRules
      ? queryMatches(keys, rule.queryKeyRules.required, rule.queryKeyRules.allowed, rule.queryKeyRules.repeatable) : keys.length === 0);
    if (!generic && !frozenPublicGet && !reviewedPublicGet(origin, path, type, keys)) { violations.push(`Dispatched request outside same-origin public/read-source scope: ${label}`); refs.push(ref); }
  }
  if (sessions.some(entry => entry.detail?.readNetworkBoundary && entry.detail.readNetworkBoundary !== "INSTALLED") && requests.some(request => request.outcome === "ADMITTED")) { violations.push("Request dispatched with an explicitly uninstalled Guard"); refs.push("browserTrace.SESSION_OPENED"); }
  return { status: violations.length ? "PRESENT" : gaps.length ? "NOT_EVALUATED" : "ABSENT", reasons: violations.length ? violations : gaps.length ? gaps.map(value => `${value.kind}: ${value.request}: missing ${value.missing.join(", ")}`) : ["Recorded requests match independent ADR-0035/0036 public-read rules and frozen source review; unknown GET side effects remain unproven."], evidenceRefs: [...refs, ...(reviewed?.refs ?? []), "docs/decisions/0036-generic-public-read-network-policy.md", "docs/decisions/0035-browser-read-network-boundary.md"], gaps };
}
