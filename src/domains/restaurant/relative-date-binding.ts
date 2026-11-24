import type { RestaurantSemanticConflict } from "./contracts.js";
import type { RestaurantSemanticProposal, RestaurantSemanticValue } from "./semantic-proposal.js";

type RelativeExpression = { raw: string; days: number };
const englishNumbers: Readonly<Record<string, number>> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
function chineseNumber(text: string): number {
  const digits: Readonly<Record<string, number>> = { "零": 0, "〇": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
  let total = 0, digit = 0;
  for (const char of text) {
    if (char === "十" || char === "百") { total += (digit || 1) * (char === "十" ? 10 : 100); digit = 0; }
    else digit = digits[char]!;
  }
  return total + digit;
}

/** Bounded point-date phrases only; not a general natural-language calendar parser. */
function relativeExpressions(text: string): RelativeExpression[] {
  const normalized = text.normalize("NFKC");
  const pattern = /大后天|后天|明天|今天|一周后|(?:-?\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百]+)天后|\bday after tomorrow\b|\btomorrow\b|\btoday\b(?!['’]s)|\bin a week\b|\bin (-?\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten) days?\b/giu;
  return [...normalized.matchAll(pattern)].map(match => {
    const raw = match[0], lower = raw.toLowerCase();
    const fixed: Readonly<Record<string, number>> = { "今天": 0, today: 0, "明天": 1, tomorrow: 1, "后天": 2, "day after tomorrow": 2, "大后天": 3, "一周后": 7, "in a week": 7 };
    const number = match[1] ?? raw.slice(0, -2);
    return { raw, days: fixed[lower] ?? englishNumbers[number.toLowerCase()] ?? (/^-?\d/.test(number) ? Number(number) : chineseNumber(number)) };
  });
}

export function bindRestaurantRelativeDate(proposal: RestaurantSemanticProposal, message: string):
  | { status: "BOUND"; proposal: RestaurantSemanticProposal }
  | { status: "CONFLICT"; conflict: RestaurantSemanticConflict } {
  const expressions = relativeExpressions(message);
  const offsets = new Set(expressions.map(item => item.days));
  const dateFacts = proposal.facts.filter(fact => fact.field === "DATE");
  const fail = (reason: string) => ({ status: "CONFLICT" as const, conflict: { code: "UNSUPPORTED_SEMANTIC_EXPRESSION" as const, affectedFields: ["DATE" as const], message: reason } });
  if (offsets.size > 1 || expressions.some(item => !Number.isInteger(item.days) || item.days < 0 || item.days > 365))
    return fail("Clarify one supported relative dining date before reading availability");
  for (const fact of dateFacts) {
    if (fact.value?.kind !== "DATE") continue;
    const raw = relativeExpressions(fact.value.raw);
    if (raw.some(item => !offsets.has(item.days))) return fail("The DATE raw expression is not bound to this user message");
  }
  if (!expressions.length) return { status: "BOUND", proposal };
  if (dateFacts.some(fact => fact.operation === "NEGATE" || fact.operation === "CONFIRM"))
    return fail("Clarify whether to clear, retain or replace the relative dining date");
  const expression = expressions[0]!;
  const value: Extract<RestaurantSemanticValue, { kind: "DATE" }> = expression.days < 2
    ? { kind: "DATE", relativeDay: expression.days === 0 ? "TODAY" : "TOMORROW", raw: expression.raw }
    : { kind: "DATE", relativeOffsetDays: expression.days, raw: expression.raw };
  // The message, not a model-computed calendar date or an inherited old date,
  // owns this directive. This also repairs an omitted DATE fact.
  return { status: "BOUND", proposal: { ...proposal, facts: [
    ...proposal.facts.filter(fact => fact.field !== "DATE"),
    { field: "DATE", operation: dateFacts[0]?.operation ?? "ASSERT", value },
  ] } };
}
