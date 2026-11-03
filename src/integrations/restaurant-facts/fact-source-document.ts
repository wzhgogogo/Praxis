import { createHash } from "node:crypto";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantFactSourceDocument, RestaurantReadEvidence, RestaurantServiceScope } from "../../domains/restaurant/contracts.js";
import { reviewStatementIndices } from "./page-review-sections.js";
import { publicPriceText, sourcePriceElements } from "../restaurant-availability/source-price-facts.js";

export interface RestaurantFactPageObservation {
  readRunId: string | undefined;
  /** The reader entry from the displayed outlet, never supplied by the model. */
  requestedSourceUrl: string;
  candidateId: string;
  snapshot: BrowserSnapshot;
  identity: RestaurantReadEvidence;
  observedAt: string;
}
export type RestaurantFactPageObserver = (page: RestaurantFactPageObservation) => void;

export interface RestaurantFactDocumentLimits {
  maxStatementCharacters: number;
  maxTotalCharacters: number;
  maxStatements: number;
}
// Existing HARD readers omit this parameter; their limits and output stay identical.
const hardDocumentLimits: RestaurantFactDocumentLimits = { maxStatementCharacters: 1_600, maxTotalCharacters: 6_000, maxStatements: 50 };

export function createRestaurantFactSourceDocument(candidateId: string, identityEvidenceId: string, text: string, serviceScope?: RestaurantServiceScope, sourceFieldQuotes?: RestaurantFactSourceDocument["sourceFieldQuotes"], priceFacts?: RestaurantFactSourceDocument["priceFacts"], limits: RestaurantFactDocumentLimits = hardDocumentLimits): RestaurantFactSourceDocument {
  const statements: RestaurantFactSourceDocument["statements"] = [];
  let total = 0;
  for (const line of text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    if (line.length > limits.maxStatementCharacters || total + line.length > limits.maxTotalCharacters || statements.length >= limits.maxStatements) continue;
    total += line.length;
    statements.push({ id: `${candidateId}:statement:${statements.length}`, text: line });
  }
  const scopeKey = serviceScope ? `${serviceScope.field}\u0000${serviceScope.group}\u0000${serviceScope.value}` : "unscoped";
  return { id: `${candidateId}:document:${createHash("sha256").update(`${scopeKey}\u0000${text}`).digest("hex").slice(0, 16)}`, candidateId, identityEvidenceId,
    ...(serviceScope ? { serviceScope } : {}), ...(sourceFieldQuotes?.length ? { sourceFieldQuotes } : {}), ...(priceFacts ? { priceFacts } : {}), statements };
}

/** The same bounded whole-statement rule serves fact judgment and G1. */
export function selectRestaurantFactStatements(document: RestaurantFactSourceDocument, ids: string[], maxStatementCharacters = hardDocumentLimits.maxStatementCharacters) {
  if (!ids.length || ids.length > 3 || new Set(ids).size !== ids.length) return undefined;
  const statements = ids.map(id => document.statements.find(statement => statement.id === id));
  return statements.some(statement => !statement || !statement.text.trim() || statement.text.length > maxStatementCharacters)
    ? undefined : statements as RestaurantFactSourceDocument["statements"];
}

/** Bind provenance to statement IDs using public headings/regions, before any model selection. */
export function bindRestaurantFactSourceRoles(document: RestaurantFactSourceDocument, page: Pick<BrowserSnapshot, "text" | "html">): RestaurantFactSourceDocument {
  const compact = (text: string) => text.normalize("NFKC").replace(/\s+/gu, " ").trim();
  const lines = page.text.split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
  const review = reviewStatementIndices(page, true);
  const reviewLines = new Set(lines.filter((_, index) => review.has(index)).map(compact));
  const reviewRegions = sourcePriceElements(page.html, tag => /aria-label=["'](?:customer |user )?(?:reviews?|口コミ|クチコミ)["']/iu.test(tag)).map(region => compact(publicPriceText(region)));
  const names = [...page.html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/giu)].map(m => compact(publicPriceText(m[1]!)));
  document.statementSourceFields = Object.fromEntries(document.statements.map(statement => {
    const text = compact(statement.text);
    const fields = (document.sourceFieldQuotes ?? []).filter(q => text.includes(compact(q.quote)) || compact(q.quote).includes(text));
    const field = reviewLines.has(text) || reviewRegions.some(region => text && region.includes(text)) || fields.some(q => q.field === "CUSTOMER_REVIEW") || /^(?:customer|user) review\s*:/iu.test(text) ? "CUSTOMER_REVIEW"
      : names.includes(text) || fields.some(q => q.field === "NAME") ? "NAME" : "SOURCE_TEXT";
    return [statement.id, field];
  }));
  return document;
}
