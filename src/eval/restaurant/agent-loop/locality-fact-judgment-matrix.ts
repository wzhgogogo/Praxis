import type {
  RestaurantCandidate,
  RestaurantReadEvidence,
  RestaurantSearchIntent,
} from "../../../domains/restaurant/contracts.js";

/**
 * Frozen, exposed diagnostic inputs for Prompt@6 locality-relative cuisine
 * judgment. These are not discovery fixtures and never enter the H005 source
 * scenario or production routing.
 */
export const RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_VERSION = "restaurant-locality-fact-judgment-matrix@2";
export const RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS = 3;

export type LocalityFactJudgmentExpected = "SUPPORTED" | "UNKNOWN" | "NOT_SUPPORTED";

export type LocalityFactJudgmentMatrixCase = {
  id: "V2-L1" | "V2-L2" | "V2-L3" | "V2-L4" | "V2-L5" | "V2-L6" | "V2-L7" | "V2-L8" | "V2-L9" | "V2-L10" | "N1" | "N2";
  title: string;
  requestArea: string;
  criterion: string;
  candidate: { name: string; address: string };
  sourceFacts: readonly string[];
  expected: LocalityFactJudgmentExpected;
};

export const LOCALITY_FACT_JUDGMENT_MATRIX: readonly LocalityFactJudgmentMatrixCase[] = [
  { id: "V2-L1", title: "matching regional cuisine", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix Tokyo Regional", address: "1 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["Tokyo regional cuisine restaurant"], expected: "SUPPORTED" },
  { id: "V2-L2", title: "broader native national cuisine", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix National", address: "2 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["Japanese restaurant"], expected: "SUPPORTED" },
  { id: "V2-L3", title: "cuisine-specific native type", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix Noodle", address: "3 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["ramen restaurant"], expected: "SUPPORTED" },
  { id: "V2-L4", title: "second cuisine-specific native type", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix Sushi", address: "4 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["sushi restaurant"], expected: "SUPPORTED" },
  { id: "V2-L5", title: "other domestic regional cuisine", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix Other Region", address: "5 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["Kyoto regional cuisine restaurant"], expected: "SUPPORTED" },
  { id: "V2-L6", title: "foreign cuisine", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix Foreign", address: "6 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["Italian restaurant"], expected: "NOT_SUPPORTED" },
  { id: "V2-L7", title: "generic type", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix Generic", address: "7 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["casual restaurant"], expected: "UNKNOWN" },
  { id: "V2-L8", title: "local sourcing only", requestArea: "Tokyo", criterion: "local food", candidate: { name: "Matrix Sourcing", address: "8 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["locally sourced ingredients"], expected: "UNKNOWN" },
  { id: "V2-L9", title: "another destination native cuisine", requestArea: "Kyoto", criterion: "local food", candidate: { name: "Matrix Kyoto National", address: "9 Matrix Lane, Nakagyo Ward, Kyoto" }, sourceFacts: ["Japanese restaurant"], expected: "SUPPORTED" },
  { id: "V2-L10", title: "another destination regional cuisine", requestArea: "Kyoto", criterion: "local food", candidate: { name: "Matrix Kyoto Regional", address: "10 Matrix Lane, Nakagyo Ward, Kyoto" }, sourceFacts: ["Kyoto regional cuisine"], expected: "SUPPORTED" },
  { id: "N1", title: "narrow city criterion lacks national specificity", requestArea: "Tokyo", criterion: "Tokyo regional food", candidate: { name: "Matrix Narrow National", address: "11 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["Japanese restaurant"], expected: "UNKNOWN" },
  { id: "N2", title: "narrow city criterion rejects other regional cuisine", requestArea: "Tokyo", criterion: "Tokyo regional food", candidate: { name: "Matrix Narrow Mismatch", address: "12 Matrix Lane, Chuo City, Tokyo" }, sourceFacts: ["Kyoto regional cuisine"], expected: "NOT_SUPPORTED" },
] as const;

export function localityFactJudgmentInput(
  matrixCase: LocalityFactJudgmentMatrixCase,
  repetition: number,
): { candidate: RestaurantCandidate; intent: RestaurantSearchIntent; evidence: RestaurantReadEvidence[] } {
  const candidateId = `locality-matrix:${matrixCase.id}:${repetition}`;
  const evidenceId = `${candidateId}:source-cuisine`;
  return {
    candidate: {
      restaurant: {
        id: candidateId,
        outletName: matrixCase.candidate.name,
        address: matrixCase.candidate.address,
        sourceIds: { matrix: matrixCase.id },
        provenance: { matrix: RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_VERSION },
      },
      matchReasons: [], warnings: [], executionConfidence: "HIGH",
    },
    intent: {
      timezone: "Asia/Tokyo",
      target: { goal: "RECOMMENDATION", query: matrixCase.criterion },
      area: { query: matrixCase.requestArea },
      criteria: [{ text: matrixCase.criterion, polarity: "POSITIVE", strength: "HARD" }],
    },
    evidence: [{
      evidenceId, kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId,
      sourceUrl: `https://matrix.example/${matrixCase.id.toLocaleLowerCase("en-US")}`,
      observedAt: "2026-09-20T00:00:00.000Z", requestFingerprint: `matrix:${matrixCase.id}:${repetition}`,
      claims: { restaurantTypeFacts: [...matrixCase.sourceFacts] },
    }],
  };
}
