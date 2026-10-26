import { createHash } from "node:crypto";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantFactSourceDocument, RestaurantReadEvidence, RestaurantServiceScope } from "../../domains/restaurant/contracts.js";

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

export function createRestaurantFactSourceDocument(candidateId: string, identityEvidenceId: string, text: string, serviceScope?: RestaurantServiceScope, sourceFieldQuotes?: RestaurantFactSourceDocument["sourceFieldQuotes"], priceFacts?: RestaurantFactSourceDocument["priceFacts"]): RestaurantFactSourceDocument {
  const statements: RestaurantFactSourceDocument["statements"] = [];
  let total = 0;
  for (const line of text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    if (line.length > 1_600 || total + line.length > 6_000 || statements.length >= 50) continue;
    total += line.length;
    statements.push({ id: `${candidateId}:statement:${statements.length}`, text: line });
  }
  const scopeKey = serviceScope ? `${serviceScope.field}\u0000${serviceScope.group}\u0000${serviceScope.value}` : "unscoped";
  return { id: `${candidateId}:document:${createHash("sha256").update(`${scopeKey}\u0000${text}`).digest("hex").slice(0, 16)}`, candidateId, identityEvidenceId,
    ...(serviceScope ? { serviceScope } : {}), ...(sourceFieldQuotes?.length ? { sourceFieldQuotes } : {}), ...(priceFacts ? { priceFacts } : {}), statements };
}

/** The same bounded whole-statement rule serves fact judgment and G1. */
export function selectRestaurantFactStatements(document: RestaurantFactSourceDocument, ids: string[]) {
  if (!ids.length || ids.length > 3 || new Set(ids).size !== ids.length) return undefined;
  const statements = ids.map(id => document.statements.find(statement => statement.id === id));
  return statements.some(statement => !statement || !statement.text.trim() || statement.text.length > 1600)
    ? undefined : statements as RestaurantFactSourceDocument["statements"];
}
