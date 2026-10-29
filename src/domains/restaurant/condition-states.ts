import { quotedPriceApplicability } from "./quoted-price-applicability.js";
import policy from "./condition-policy.json" with { type: "json" };
import type { RestaurantReadEvidence, RestaurantSearchIntent, RestaurantSourceFieldQuote } from "./contracts.js";
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
  sources: RestaurantSourceFieldQuote[];
}
export const RESTAURANT_CONDITION_STATES_SCHEMA = "restaurant-condition-states@3";
const normalize = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

/** No semantic strength inference: compare only a recognized numeric price condition. */
export function priceCondition(text: string, budget?: RestaurantSearchIntent["budgetPerPerson"]): { amount: number; around: boolean } | undefined {
  const value = normalize(text);
  if (!/(?:yen|jpy|¥|円|budget|price|cost)/i.test(value)) return undefined;
  const raw = value.match(/(?:¥|jpy)\s*([\d,]+)|([\d,]+)\s*(?:yen|jpy|円)/)?.slice(1).find(Boolean);
  const amount = raw ? Number(raw.replaceAll(",", "")) : budget?.max;
  if (!amount || !Number.isSafeInteger(amount)) return undefined;
  if (!/around|about|approximately|approx\.?|under|no more than|at most|up to|less than|\bmax(?:imum)?\b|以下|以内|約/.test(value)) return undefined;
  return { amount, around: /around|about|approximately|approx\.?|約/.test(value) };
}

export function assessRestaurantConditions(intent: Pick<RestaurantSearchIntent, "criteria" | "budgetPerPerson" | "timeWindow" | "date" | "partySize">,
  facts: readonly RestaurantReadEvidence[]): RestaurantConditionState[] {
  if (policy.status !== "USER_APPROVED" || !(policy.aroundPriceTolerance >= 0 && policy.aroundPriceTolerance < 1)) throw Error("Unapproved restaurant price policy");
  const meal = intent.timeWindow?.earliest && intent.timeWindow.earliest >= "17:00" ? "DINNER"
    : intent.timeWindow?.latest && intent.timeWindow.latest <= "15:00" ? "LUNCH" : undefined;
  // BUDGET_PER_PERSON is the semantic contract's explicit firm cap. Append its
  // condition so existing criterion references remain stable; soft targets stay
  // separate criteria and retain their approved comparison policy.
  const criteria = [...intent.criteria, ...(intent.budgetPerPerson ? [{
    text: `at most ${intent.budgetPerPerson.max} yen per person`,
    polarity: "POSITIVE" as const, strength: "HARD" as const,
  }] : [])];
  return criteria.map((criterion, index) => {
    const base = { ...criterion, criterionRef: `criterion:${index}`, status: "NOT_CHECKED" as RestaurantConditionStatus,
      explanation: "No current source evidence establishes this condition.", evidenceIds: [] as string[], sources: [] as RestaurantSourceFieldQuote[] };
    const price = priceCondition(criterion.text, intent.budgetPerPerson);
    if (price) {
      const observations = facts.filter(fact => fact.provider !== "MODEL_JUDGMENT" && fact.priceFacts?.schemaVersion === "restaurant-price-facts@1").flatMap(fact => {
        const prices = fact.priceFacts!;
        const courses = prices.listedCoursePricesYen.filter(item => item.kind === "MEAL" && (item.meal === "UNSPECIFIED" || item.meal === meal));
        const range = meal === "DINNER" ? prices.dinnerBudgetRangeYen : meal === "LUNCH" ? prices.lunchBudgetRangeYen : undefined;
        return [...courses.map(item => ({ min: item.amount, max: item.amount, quote: item.quote, sourceUrl: item.sourceUrl, tax: item.tax })), ...(range ? [{ ...range, tax: "UNSPECIFIED" }] : [])]
          .filter(item => quotedPriceApplicability(item.quote, {date:intent.date,partySize:intent.partySize,...(meal ? {meal} : {})}).status === "APPLICABLE")
          .filter(item => item.sourceUrl === fact.sourceUrl && item.quote && Number.isSafeInteger(item.min) && Number.isSafeInteger(item.max) && item.min > 0 && item.max >= item.min)
          .map(item => ({ ...item, evidenceId: fact.evidenceId }));
      });
      if (!observations.length) return { ...base, explanation: "No applicable meal price was recorded; add-ons, mismatched meal/party/date conditions and unverified restrictions do not establish this budget." };
      const low = price.around ? price.amount * (1 - policy.aroundPriceTolerance) : 0;
      const high = price.around ? price.amount * (1 + policy.aroundPriceTolerance) : price.amount;
      let status: RestaurantConditionStatus = observations.some(item => item.min <= high && item.max >= low) ? "MET" : "NOT_MET";
      if (criterion.polarity === "NEGATIVE") status = status === "MET" ? "NOT_MET" : "MET";
      const mixedTax = observations.some(item => item.tax === "INCLUDED") && observations.some(item => item.tax === "EXCLUDED");
      return { ...base, status, evidenceIds: [...new Set(observations.map(item => item.evidenceId))], sources: observations.map(({ sourceUrl, quote }) => ({ sourceUrl, quote, field: "PRICE" as const })),
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
    const sourceFacts = [...new Map(applicable.flatMap(fact => fact.provider === "MODEL_JUDGMENT"
      ? facts.filter(source => source.provider !== "MODEL_JUDGMENT" && source.candidateId === fact.candidateId && Array.isArray(fact.claims.supportingEvidenceIds) && fact.claims.supportingEvidenceIds.includes(source.evidenceId)) : [fact]).map(fact => [fact.evidenceId, fact])).values()];
    const fieldQuotes: Array<RestaurantSourceFieldQuote & { evidenceId: string }> = sourceFacts.flatMap(fact => [
      ...(fact.sourceFieldQuotes ?? []),
      ...(fact.provider === "GOOGLE_PLACES" && fact.sourceUrl && Array.isArray(fact.claims.restaurantTypeFacts)
        ? (fact.claims.restaurantTypeFacts as string[]).map(quote => ({ field: "GOOGLE_TYPE" as const, quote, sourceUrl: fact.sourceUrl! })) : []),
    ].filter(q => q.sourceUrl === fact.sourceUrl && q.quote.trim()).map(q => ({ ...q, evidenceId: fact.evidenceId })));
    const literalText = (text: string) => normalize(text).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    // A generic type descriptor is not part of the cuisine name. Keep every
    // qualifier and require the remaining literal in a current merchant field.
    const key = literalText(criterion.text).replace(/ (?:restaurant|cuisine|food)$/, "");
    const requestedCourseMeal = /course|menu|套餐|コース/i.test(criterion.text) ? meal : undefined;
    const accepted = fieldQuotes.filter(q => ["CATEGORY", "COURSE_TITLE", "COURSE_DESCRIPTION", "GOOGLE_TYPE"].includes(q.field)
      && (` ${literalText(q.quote)} `).includes(` ${key} `)
      && !(criterion.polarity === "POSITIVE" && /\bno\b|\bnot\b|without|not offered|提供していません/i.test(q.quote))
      && (!requestedCourseMeal || !q.meal || q.meal === "UNSPECIFIED" || q.meal === requestedCourseMeal));
    const sources = accepted.map(({ evidenceId: _id, ...source }) => source);
    if (accepted.length) {
      const meals = [...new Set(accepted.map(q => q.meal).filter(q => q && q !== "UNSPECIFIED"))];
      return { ...base, status: contradicted.length ? "NOT_MET" : "MET", evidenceIds: [...new Set([...applicable.map(e => e.evidenceId), ...accepted.map(q => q.evidenceId)])], sources,
        explanation: `Merchant source fields support this restaurant offering${meals.length ? `, limited to ${meals.join("/")} where stated` : ""}. Requested-time course availability has not been verified.` };
    }
    const weak: RestaurantSourceFieldQuote[] = fieldQuotes.length ? fieldQuotes : sourceFacts.flatMap(fact => fact.sourceUrl && Array.isArray(fact.claims.restaurantTypeFacts)
      ? (fact.claims.restaurantTypeFacts as string[]).map(quote => ({ field: "SOURCE_TEXT" as const, quote, sourceUrl: fact.sourceUrl! })) : []);
    return { ...base, evidenceIds: applicable.map(e => e.evidenceId), sources: weak.slice(0, 3).map(({ field, quote, sourceUrl, meal }) => ({ field, quote, sourceUrl, ...(meal ? { meal } : {}) })),
      explanation: "No current merchant type/course field explicitly establishes this condition. Names and customer reviews alone cannot establish it; meal-restricted courses do not verify another sitting." };
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
