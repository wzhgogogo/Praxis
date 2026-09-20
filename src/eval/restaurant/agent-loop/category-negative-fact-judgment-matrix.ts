import type { RestaurantCandidate, RestaurantReadEvidence, RestaurantSearchIntent } from "../../../domains/restaurant/contracts.js";

/**
 * Frozen, exposed Prompt@7 diagnostic inputs for ADR-0030. They are not
 * discovery fixtures and never enter the H005 source scenario or production
 * routing. The existing fact-judgment matrix runner must execute exactly two
 * repetitions of these eight rows (16 calls, zero retries) when authorized.
 */
export const RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_VERSION = "restaurant-category-negative-fact-judgment-matrix@1";
export const RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS = 2;

export type CategoryNegativeExpected = "ELIGIBLE_UNKNOWN" | "BLOCKED";
export type CategoryNegativeFactJudgmentMatrixCase = {
  id: "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8";
  title: string;
  criterion: string;
  candidate: { name: string; address: string };
  sourceFacts: readonly string[];
  requiresHighIdentity?: boolean;
  expected: CategoryNegativeExpected;
};

export const CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX: readonly CategoryNegativeFactJudgmentMatrixCase[] = [
  { id: "F1", title: "stated fast-food type conflicts", criterion: "fast food", candidate: { name: "Matrix F1", address: "1 Matrix Lane, Tokyo" }, sourceFacts: ["fast food restaurant"], expected: "BLOCKED" },
  { id: "F2", title: "source-stated quick-service type conflicts", criterion: "fast food", candidate: { name: "Matrix F2", address: "2 Matrix Lane, Tokyo" }, sourceFacts: ["quick-service restaurant"], expected: "BLOCKED" },
  { id: "F3", title: "Japanese type remains unresolved", criterion: "fast food", candidate: { name: "Matrix F3", address: "3 Matrix Lane, Tokyo" }, sourceFacts: ["Japanese restaurant"], expected: "ELIGIBLE_UNKNOWN" },
  { id: "F4", title: "ramen type remains unresolved", criterion: "fast food", candidate: { name: "Matrix F4", address: "4 Matrix Lane, Tokyo" }, sourceFacts: ["ramen restaurant"], expected: "ELIGIBLE_UNKNOWN" },
  { id: "F5", title: "sushi type remains unresolved", criterion: "fast food", candidate: { name: "Matrix F5", address: "5 Matrix Lane, Tokyo" }, sourceFacts: ["sushi restaurant"], expected: "ELIGIBLE_UNKNOWN" },
  { id: "F6", title: "conveyor-belt sushi remains unresolved", criterion: "fast food", candidate: { name: "Matrix F6", address: "6 Matrix Lane, Tokyo" }, sourceFacts: ["conveyor-belt sushi restaurant"], expected: "ELIGIBLE_UNKNOWN" },
  { id: "F7", title: "broad source fact reaches the existing judgment", criterion: "fast food", candidate: { name: "Matrix F7", address: "7 Matrix Lane, Tokyo" }, sourceFacts: ["restaurant"], expected: "ELIGIBLE_UNKNOWN" },
  { id: "F8", title: "grounded McDonald's entity/type conflicts", criterion: "fast food", candidate: { name: "McDonald's Matrix", address: "8 Matrix Lane, Tokyo" }, sourceFacts: ["restaurant"], requiresHighIdentity: true, expected: "BLOCKED" },
] as const;

export function categoryNegativeFactJudgmentInput(matrixCase: CategoryNegativeFactJudgmentMatrixCase, repetition: number): { candidate: RestaurantCandidate; intent: RestaurantSearchIntent; evidence: RestaurantReadEvidence[] } {
  const candidateId = `category-negative-matrix:${matrixCase.id}:${repetition}`;
  return {
    candidate: { restaurant: { id: candidateId, outletName: matrixCase.candidate.name, address: matrixCase.candidate.address, sourceIds: { matrix: matrixCase.id }, provenance: { matrix: RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_VERSION } }, matchReasons: [], warnings: [], executionConfidence: "HIGH" },
    intent: { timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: matrixCase.criterion }, area: { query: "Tokyo" }, criteria: [{ text: matrixCase.criterion, polarity: "NEGATIVE", strength: "HARD" }] },
    evidence: matrixCase.sourceFacts.length === 0 ? [] : [
      ...(matrixCase.requiresHighIdentity ? [{ evidenceId: `${candidateId}:identity`, kind: "ENTITY_MATCH" as const, provider: "RESTAURANT_WEBSITE" as const, candidateId, sourceEntityId: "mcdonalds-matrix", sourceUrl: `https://matrix.example/${matrixCase.id.toLocaleLowerCase("en-US")}`, observedAt: "2026-09-20T00:00:00.000Z", requestFingerprint: `matrix:${matrixCase.id}:${repetition}`, claims: { outletName: "McDonald's" }, entityMatch: { confidence: "HIGH" as const, matchedBy: ["EXACT_NAME_AND_ADDRESS"] } }] : []),
      { evidenceId: `${candidateId}:source-type`, kind: "RESTAURANT_FACT" as const, provider: "RESTAURANT_WEBSITE" as const, candidateId, ...(matrixCase.requiresHighIdentity ? { sourceEntityId: "mcdonalds-matrix" } : {}), sourceUrl: `https://matrix.example/${matrixCase.id.toLocaleLowerCase("en-US")}`, observedAt: "2026-09-20T00:00:00.000Z", requestFingerprint: `matrix:${matrixCase.id}:${repetition}`, claims: { restaurantTypeFacts: [...matrixCase.sourceFacts] } },
    ],
  };
}
