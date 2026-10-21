import policy from "./condition-policy.json" with { type: "json" };
import type { RestaurantReadEvidence, RestaurantSearchIntent } from "./contracts.js";
import type { RestaurantQuotedCoursePrice } from "./price-facts.js";

export type RestaurantConditionStatus = "MET" | "NOT_MET" | "NOT_CHECKED";
export interface RestaurantConditionState {
  criterionRef: string;
  text: string;
  polarity: "POSITIVE" | "NEGATIVE";
  strength: "HARD" | "SOFT" | "UNSPECIFIED";
  status: RestaurantConditionStatus;
  explanation: string;
  evidenceIds: string[];
  sources: Array<{ sourceUrl: string; quote: string }>;
}
export const RESTAURANT_CONDITION_STATES_SCHEMA = "restaurant-condition-states@2";
const normalize = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

/** No semantic strength inference: compare only a recognized numeric price condition. */
export function priceCondition(text: string, budget?: RestaurantSearchIntent["budgetPerPerson"]): { amount: number; around: boolean } | undefined {
  const value = normalize(text);
  if (!/(?:yen|jpy|¥|円|budget|price|cost)/i.test(value)) return undefined;
  const raw = value.match(/(?:¥|jpy)\s*([\d,]+)|([\d,]+)\s*(?:yen|jpy|円)/)?.slice(1).find(Boolean);
  const amount = raw ? Number(raw.replaceAll(",", "")) : budget?.max;
  if (!amount || !Number.isSafeInteger(amount)) return undefined;
  if (!/around|about|approximately|approx\.?|under|no more than|at most|up to|less than|以下|以内|約/.test(value)) return undefined;
  return { amount, around: /around|about|approximately|approx\.?|約/.test(value) };
}

export function assessRestaurantConditions(intent: Pick<RestaurantSearchIntent, "criteria" | "budgetPerPerson" | "timeWindow">,
  facts: readonly RestaurantReadEvidence[]): RestaurantConditionState[] {
  if (policy.status !== "USER_APPROVED" || !(policy.aroundPriceTolerance >= 0 && policy.aroundPriceTolerance < 1)) throw Error("Unapproved restaurant price policy");
  const meal = intent.timeWindow?.earliest && intent.timeWindow.earliest >= "17:00" ? "DINNER"
    : intent.timeWindow?.latest && intent.timeWindow.latest <= "15:00" ? "LUNCH" : undefined;
  return intent.criteria.map((criterion, index) => {
    const base = { ...criterion, criterionRef: `criterion:${index}`, status: "NOT_CHECKED" as RestaurantConditionStatus,
      explanation: "No current source evidence establishes this condition.", evidenceIds: [] as string[], sources: [] as Array<{ sourceUrl: string; quote: string }> };
    const price = priceCondition(criterion.text, intent.budgetPerPerson);
    if (price) {
      const observations = facts.filter(fact => fact.provider !== "MODEL_JUDGMENT" && fact.priceFacts?.schemaVersion === "restaurant-price-facts@1").flatMap(fact => {
        const prices = fact.priceFacts!;
        const courses = prices.listedCoursePricesYen.filter(item => item.kind === "MEAL" && (item.meal === "UNSPECIFIED" || !meal || item.meal === meal));
        const range = meal === "DINNER" ? prices.dinnerBudgetRangeYen : meal === "LUNCH" ? prices.lunchBudgetRangeYen : undefined;
        return [...courses.map(item => ({ min: item.amount, max: item.amount, quote: item.quote, sourceUrl: item.sourceUrl, tax: item.tax })), ...(range ? [{ ...range, tax: "UNSPECIFIED" }] : [])]
          .filter(item => item.sourceUrl === fact.sourceUrl && item.quote && Number.isSafeInteger(item.min) && Number.isSafeInteger(item.max) && item.min > 0 && item.max >= item.min)
          .map(item => ({ ...item, evidenceId: fact.evidenceId }));
      });
      if (!observations.length) return { ...base, explanation: "No applicable meal price was recorded; add-ons and lunch-only prices do not establish a dinner budget." };
      const low = price.around ? price.amount * (1 - policy.aroundPriceTolerance) : 0;
      const high = price.around ? price.amount * (1 + policy.aroundPriceTolerance) : price.amount;
      let status: RestaurantConditionStatus = observations.some(item => item.min <= high && item.max >= low) ? "MET" : "NOT_MET";
      if (criterion.polarity === "NEGATIVE") status = status === "MET" ? "NOT_MET" : "MET";
      const mixedTax = observations.some(item => item.tax === "INCLUDED") && observations.some(item => item.tax === "EXCLUDED");
      return { ...base, status, evidenceIds: [...new Set(observations.map(item => item.evidenceId))], sources: observations.map(({ sourceUrl, quote }) => ({ sourceUrl, quote })),
        explanation: `Listed ${meal?.toLowerCase() ?? "meal"} prices ${status === "MET" ? "support" : "do not support"} this budget. ${mixedTax ? "Prices mix tax included and excluded; compared as listed without conversion." : "Tax treatment is retained as quoted; no conversion."} Listed-plan availability has not been verified.` };
    }
    const matches = (key: string) => facts.filter(fact => Array.isArray(fact.claims[key]) && (fact.claims[key] as string[]).some(text => normalize(text) === normalize(criterion.text)));
    const positive = matches("verifiedHardCriteria");
    const negative = matches("verifiedNegativeCriteria");
    const conflicts = matches("violatedNegativeCriteria");
    const literal = matches("restaurantTypeFacts");
    const supported = criterion.polarity === "NEGATIVE" ? negative : [...positive, ...literal];
    const contradicted = criterion.polarity === "NEGATIVE" ? [...conflicts, ...literal] : [];
    const applicable = contradicted.length ? contradicted : supported;
    return applicable.length ? { ...base, status: contradicted.length ? "NOT_MET" : "MET",
      explanation: "Current candidate-bound source facts establish this condition status.", evidenceIds: applicable.map(item => item.evidenceId),
      sources: applicable.filter(item => item.sourceUrl).map(item => ({ sourceUrl: item.sourceUrl!, quote: criterion.text })) } : base;
  });
}

export function priceCommercialNotes(facts: readonly RestaurantReadEvidence[]): Array<{ field: "COURSE_PRICE" | "DINNER_BUDGET" | "LUNCH_BUDGET"; value: string; source: string }> {
  return facts.flatMap(fact => {
    const prices = fact.priceFacts;
    if (!prices) return [];
    const notes: Array<{ field: "COURSE_PRICE" | "DINNER_BUDGET" | "LUNCH_BUDGET"; value: string; source: string }> = [];
    for (const [field, range] of [["DINNER_BUDGET", prices.dinnerBudgetRangeYen], ["LUNCH_BUDGET", prices.lunchBudgetRangeYen]] as const) {
      if (range) notes.push({ field, value: range.quote, source: fact.provider });
    }
    prices.listedCoursePricesYen.forEach((price: RestaurantQuotedCoursePrice) => notes.push({ field: "COURSE_PRICE", value: `${price.quote} [${price.kind}; ${price.meal}; ${price.tax}]`, source: fact.provider }));
    return notes;
  });
}
