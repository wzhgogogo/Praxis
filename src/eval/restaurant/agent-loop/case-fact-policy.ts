/** Versioned, case-scoped evaluation policy. It does not reinterpret product-wide user language. */
export const RESTAURANT_CASE_FACT_POLICY_VERSION = "restaurant-case-fact-policy@1";

export const H002_NEGATIVE_TYPE_POLICY = {
  caseId: "h002",
  rules: [
    { criterion: "hot pot", acceptedCuisineFacts: ["hot pot", "shabu shabu", "sukiyaki"], decision: "EXCLUDE" },
    { criterion: "spicy food", acceptedCuisineFacts: ["sichuan", "hunan"], decision: "EXCLUDE" },
  ],
  unknown: "CONTINUE_OR_REPORT_UNKNOWN",
  evidence: "SOURCE_TYPE_OR_CUISINE_FACT",
} as const;

export type H002NegativeTypeAssessment = "SATISFIES" | "VIOLATES" | "UNKNOWN";

/**
 * This rule is frozen for H002 only. A positive assessment requires an explicit
 * source-stated restaurant type/cuisine fact; the absence of a keyword is not
 * evidence that a venue satisfies either exclusion.
 */
export function assessH002NegativeTypeCriterion(
  criterion: "hot pot" | "spicy food",
  sourceRestaurantTypeFacts: readonly string[],
): H002NegativeTypeAssessment {
  const normalizedFacts = sourceRestaurantTypeFacts
    .map((fact) => fact.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/_/g, " "))
    .filter((fact) => !["restaurant", "food", "point of interest", "establishment"].includes(fact))
    .filter(Boolean);
  if (!normalizedFacts.length) return "UNKNOWN";
  const rule = H002_NEGATIVE_TYPE_POLICY.rules.find((item) => item.criterion === criterion);
  if (!rule) return "UNKNOWN";
  const violates = rule.acceptedCuisineFacts.some((fact) => normalizedFacts.some((value) => value === fact || value.includes(fact)));
  return violates ? "VIOLATES" : "SATISFIES";
}
