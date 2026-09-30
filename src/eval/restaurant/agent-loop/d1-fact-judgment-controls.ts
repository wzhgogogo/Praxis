import type { RestaurantCandidate, RestaurantReadEvidence, RestaurantSearchIntent } from "../../../domains/restaurant/contracts.js";
import { CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX, categoryNegativeFactJudgmentInput } from "./category-negative-fact-judgment-matrix.js";

export const D1_CRITERION = "Sichuan/Hunan-style cuisine where spicy food is the main focus";
export type D1Expected = "UNKNOWN" | "CONFLICT" | "SUPPORTED";
export type D1Control = { id: string; rationale: string; expected: D1Expected; eligible: boolean; candidate: RestaurantCandidate; intent: RestaurantSearchIntent; evidence: RestaurantReadEvidence[] };

function cuisineControl(id: string, rationale: string, typeFacts: string[], expected: D1Expected): D1Control {
  const candidateId = `d1:${id}`;
  const observedAt = "2026-09-24T04:03:41.377Z";
  return {
    id, rationale, expected, eligible: expected !== "CONFLICT",
    candidate: { restaurant: { id: candidateId, outletName: id === "saved-cantonese" ? "Jumping Dragon Gate Cantonese Restaurant" : "Controlled Restaurant", address: "Tokyo", sourceIds: {}, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" },
    intent: { timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "restaurant" }, area: { query: "Tokyo" }, criteria: [{ text: D1_CRITERION, polarity: "NEGATIVE", strength: "HARD" }] },
    evidence: [
      { evidenceId: `${candidateId}:identity`, kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: `${candidateId}:source`, observedAt, requestFingerprint: id, claims: { outletName: id === "saved-cantonese" ? "Jumping Dragon Gate Cantonese Restaurant" : "Controlled Restaurant" }, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_NAME_AND_ADDRESS"] } },
      { evidenceId: `${candidateId}:type`, kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: `${candidateId}:source`, observedAt, requestFingerprint: id, claims: { restaurantTypeFacts: typeFacts } },
    ],
  };
}

const f8 = categoryNegativeFactJudgmentInput(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.find(item => item.id === "F8")!, 1);

/** Exposed development controls, fixed before any Prompt@10 provider call. No Gold or frozen matrix input is modified. */
export const D1_FACT_JUDGMENT_CONTROLS: readonly D1Control[] = [
  cuisineControl("saved-cantonese", "H002 website's stated Cantonese primary cuisine does not settle an overlapping Sichuan/Hunan exclusion", [
    "中華の名店で腕を鳴らした料理長による広東料理から飲茶までを楽しめるお店『家寳 跳龍門(カポ チョウリュウモン)』。",
    "主力は広東料理ですが、提供方法やドリンクとの合わせ方は、今の時代の食べ方や銀座という場所が好む要素も柔軟に取り入れて、お客様の幅広い嗜好に応えていきます。",
  ], "UNKNOWN"),
  cuisineControl("explicit-conflict", "source explicitly states the full excluded cuisine and spicy main focus", ["Sichuan and Hunan cuisine, with spicy dishes as the main focus of this restaurant."], "CONFLICT"),
  cuisineControl("explicit-denial", "source explicitly rules out the excluded cuisine and its focus", ["We do not serve Sichuan or Hunan cuisine; spicy food is not our main focus."], "SUPPORTED"),
  cuisineControl("broad-parent", "a Chinese restaurant label is too broad for either conclusion", ["chinese restaurant"], "UNKNOWN"),
  { ...f8, id: "grounded-entity", rationale: "F8 same-source HIGH grounded McDonald's identity supports stable fast-food category knowledge", expected: "CONFLICT", eligible: false },
  { ...f8, id: "ungrounded-name", rationale: "the same name and broad type without a HIGH same-source identity cannot establish fast food", expected: "UNKNOWN", eligible: false, evidence: f8.evidence.filter(item => item.kind !== "ENTITY_MATCH") },
] as const;
