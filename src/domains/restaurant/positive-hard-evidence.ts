import type { RestaurantReadEvidence, RestaurantSourceFieldQuote } from "./contracts.js";

const normalize = (text: string) => text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** A name must explicitly contain every type qualifier; no semantic guess or name dictionary. */
export function outletNameSupportsHardCriterion(name: string, criterion: string): boolean {
  const key = normalize(criterion).replace(/ (?:restaurant|cuisine|food)$/, "");
  return Boolean(key) && (` ${normalize(name)} `).includes(` ${key} `);
}

export interface PositiveHardSupport {
  evidenceIds: string[];
  sources: RestaurantSourceFieldQuote[];
  basis: string[];
}

const broadCategories = new Set(["restaurant", "food", "dining", "cuisine", "point of interest", "establishment", "service", "wholesaler"]);
const beerServiceCategories = new Set(["brewpub", "beer bar", "beer hall", "beer garden", "beer restaurant",
  "craft beer bar", "craft beer hall", "craft beer garden", "craft beer restaurant"]);
const supply = (criterion: string) => /^(?:serves?|offers?|provides?|has|with) (.+)$/.exec(normalize(criterion))?.[1];
const concreteSupply = (criterion: string) => /\bbeers?\b|ビール|啤酒/.test(normalize(criterion))
  || Boolean(supply(criterion) && !["food", "drinks", "dining", "cuisine"].includes(supply(criterion)!));

/** A category is not a menu. Retail and generic types cannot prove a specific serving claim. */
function categorySupports(criterion: string, label: string): boolean {
  return label.split(/[,、;|]/).some(part => {
    const type = normalize(part);
    if (!type || broadCategories.has(type) || /\b(?:stores?|retail|wholesalers?|service)\b/.test(type)
      || /^(?:liquor|beer|wine|food|grocery) shop$/.test(type)) return false;
    if (/\bbeers?\b|ビール|啤酒/.test(normalize(criterion))) return beerServiceCategories.has(type);
    const serving = supply(criterion);
    return !concreteSupply(criterion) || Boolean(serving && outletNameSupportsHardCriterion(type, serving));
  });
}

/** Source roles are supplied by readers, never by the judgment model. */
export function positiveHardSourceSupport(criterion: string, source: RestaurantReadEvidence, meal?: "LUNCH" | "DINNER", semanticJudgment = true): PositiveHardSupport | undefined {
  const fields = source.sourceFieldQuotes ?? [];
  const quotes = fields.filter(q => q.sourceUrl === source.sourceUrl && q.quote.trim()
    && ["CATEGORY", "GOOGLE_TYPE", "COURSE_TITLE", "COURSE_DESCRIPTION", "SOURCE_TEXT", "NAME"].includes(q.field)
    && (q.field !== "NAME" || outletNameSupportsHardCriterion(q.quote, criterion))
    && (!["CATEGORY", "GOOGLE_TYPE"].includes(q.field) || categorySupports(criterion, q.quote))
    && (semanticJudgment || outletNameSupportsHardCriterion(q.quote, criterion))
    && (q.field === "NAME" || !/\bno\b|\bnot\b|without|not offered|提供していません/i.test(q.quote))
    && (!/course|menu|套餐|コース/i.test(criterion) || !meal || !q.meal || q.meal === "UNSPECIFIED" || q.meal === meal));
  // A selected prose record needs its observed field/region. In contrast,
  // structured provider type claims already passed the existing source rule;
  // they may have no textual quotation (and must not acquire a made-up one).
  const types = strings(source.claims.restaurantTypeFacts);
  const structured = !fields.length && !strings(source.claims.sourceStatementIds).length
    && (types.length ? types.some(type => categorySupports(criterion, type))
      : !concreteSupply(criterion) && strings(source.claims.verifiedHardCriteria).length > 0);
  if (!quotes.length && !structured) return undefined;
  const basis = quotes.length ? quotes.map(q => q.field === "NAME" ? "outlet name"
    : q.field === "GOOGLE_TYPE" ? "Google category" : q.field === "CATEGORY" && source.provider === "TABELOG" ? "Tabelog category"
    : "merchant website/menu text") : [source.provider === "GOOGLE_PLACES" ? "Google category" : source.provider === "TABELOG" ? "Tabelog category" : source.provider === "TABLECHECK" ? "TableCheck category" : "source category"];
  return { evidenceIds: [source.evidenceId], sources: quotes, basis: [...new Set(basis)] };
}

/** Shared positive non-price admission result; callers provide their current, identity/scope-bound facts. */
export function acceptedPositiveHardEvidence(criterion: string, facts: readonly RestaurantReadEvidence[], now?: string, meal?: "LUNCH" | "DINNER"): PositiveHardSupport | undefined {
  const fresh = (fact: RestaurantReadEvidence) => !now || [fact.expiresAt, fact.displayExpiresAt, fact.sourceExpiresAt]
    .every(until => until === undefined || Number.isFinite(Date.parse(until)) && Date.parse(until) > Date.parse(now));
  const supports: PositiveHardSupport[] = [];
  for (const fact of facts) {
    if (!fresh(fact) || !strings(fact.claims.verifiedHardCriteria).some(value => normalize(value) === normalize(criterion))) continue;
    const ids = fact.provider === "MODEL_JUDGMENT" ? strings(fact.claims.supportingEvidenceIds) : [fact.evidenceId];
    if (!ids.length) continue;
    const cited = ids.map(id => facts.find(source => source.evidenceId === id && source.provider !== "MODEL_JUDGMENT"
      && source.candidateId === fact.candidateId && fresh(source)));
    if (cited.some(source => !source)) continue;
    const allowed = cited.flatMap(source => positiveHardSourceSupport(criterion, source!, meal, fact.provider === "MODEL_JUDGMENT") ?? []);
    if (allowed.length) supports.push({ evidenceIds: [fact.evidenceId, ...allowed.flatMap(s => s.evidenceIds)],
      sources: allowed.flatMap(s => s.sources), basis: allowed.flatMap(s => s.basis) });
  }
  if (!supports.length) return undefined;
  const sources = [...new Map(supports.flatMap(s => s.sources).map(q => [JSON.stringify(q), q])).values()];
  return { evidenceIds: [...new Set(supports.flatMap(s => s.evidenceIds))], sources, basis: [...new Set(supports.flatMap(s => s.basis))] };
}
