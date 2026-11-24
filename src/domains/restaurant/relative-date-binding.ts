import type { RestaurantSemanticConflict } from "./contracts.js";
import type { RestaurantSemanticProposal, RestaurantSemanticValue } from "./semantic-proposal.js";

type RelativeExpression = { raw: string; days: number; index: number };
const englishNumbers: Readonly<Record<string, number>> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
function chineseNumber(text: string): number {
  // Adjacent numerals such as 两三 express a range, not a positional integer.
  if (!/^(?:[零〇一二两三四五六七八九]|[一二两三四五六七八九]?十[一二两三四五六七八九]?|[一二两三四五六七八九]百(?:[零〇][一二两三四五六七八九]|[一二两三四五六七八九]?十[一二两三四五六七八九]?)?)$/u.test(text)) return NaN;
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
  const pattern = /大后天|后天|明天|今天|一周后|(?:-?\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百]+)(?:\s*[-–~～至到或]\s*(?:-?\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百]+))?天后|\bday after tomorrow\b|\btomorrow\b|\btoday\b(?!['’]s)|\bin a week\b|\bin (-?\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten) days?\b/giu;
  return [...normalized.matchAll(pattern)].map(match => {
    const raw = match[0], lower = raw.toLowerCase();
    const fixed: Readonly<Record<string, number>> = { "今天": 0, today: 0, "明天": 1, tomorrow: 1, "后天": 2, "day after tomorrow": 2, "大后天": 3, "一周后": 7, "in a week": 7 };
    const number = match[1] ?? raw.slice(0, -2);
    return { raw, index: match.index, days: fixed[lower] ?? englishNumbers[number.toLowerCase()] ?? (/^-?\d/.test(number) ? Number(number) : chineseNumber(number)) };
  });
}

function excludedDate(text: string, index: number, raw: string): boolean {
  return /(?:不要|不选|排除|不是|别选|别|\bnot|\brather than)\s*$/iu.test(text.slice(0, index))
    || /^\s*(?:(?:晚上|早上|中午|下午|晚餐|午餐|evening|morning)\s*)?(?:不行|不可以|不能|不合适|不方便|没空|is not|doesn['’]t work|won['’]t work)/iu.test(text.slice(index + raw.length));
}

/** Recognize date-selection relations only; date interpretation stays in the materializer. */
function dateSelectionIsUncertain(message: string, relative: readonly RelativeExpression[]): boolean {
  const named = /\b\d{4}-\d{2}-\d{2}\b|(?:\d{4}年)?\d{1,2}月\d{1,2}[日号]|\b\d{1,2}\/\d{1,2}\b|(?:这|本|下)?(?:个)?(?:周|星期|礼拜)[一二三四五六日天]|\b(?:(?:this|next)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/giu;
  const dates = [...relative, ...[...message.matchAll(named)].map(match => ({ raw: match[0], index: match.index }))]
    .sort((a, b) => a.index - b.index);
  return dates.some((date, index) => {
    const before = message.slice(0, date.index).split(/[，,;；。.!?\n]/u).at(-1) ?? "";
    const after = message.slice(date.index).split(/[，,;；。.!?\n]/u)[0]!;
    const next = dates[index + 1];
    return /(?:未定|没定|待定|不确定|尚未决定|还没决定|\bundecided\b|\bnot (?:decided|sure)\b|\bhaven['’]t decided\b)/iu.test(before + after)
      || !!next && /^[\s，,、]*(?:还是|或(?:者)?|要么|\bor\b|\/)[\s，,、]*$/iu.test(message.slice(date.index + date.raw.length, next.index));
  });
}

export function bindRestaurantRelativeDate(proposal: RestaurantSemanticProposal, message: string):
  | { status: "BOUND"; proposal: RestaurantSemanticProposal }
  | { status: "CONFLICT"; conflict: RestaurantSemanticConflict } {
  message = message.normalize("NFKC");
  const mentions = relativeExpressions(message);
  const dateFacts = proposal.facts.filter(fact => fact.field === "DATE");
  const fail = (reason: string) => ({ status: "CONFLICT" as const, conflict: { code: "UNSUPPORTED_SEMANTIC_EXPRESSION" as const, affectedFields: ["DATE" as const], message: reason } });
  const selectedDateRaws = dateFacts.flatMap(fact => {
    if ((fact.operation !== "ASSERT" && fact.operation !== "CORRECT") || fact.value?.kind !== "DATE" || (!("value" in fact.value) && !("weekday" in fact.value))) return [];
    const raw = fact.value.raw.normalize("NFKC").trim(), index = message.indexOf(raw);
    return raw && index >= 0 && !relativeExpressions(raw).length && !excludedDate(message, index, raw) ? [raw] : [];
  });
  if (dateSelectionIsUncertain(message, mentions)) return fail("Clarify the undecided or competing dining dates");
  // Bound calendar and weekday directives share the same selected-date priority.
  // Incidental relative mentions cannot replace either; alternatives above clarify.
  if (selectedDateRaws.length) return { status: "BOUND", proposal };
  const expressions = mentions.filter(item => !excludedDate(message, item.index, item.raw));
  const offsets = new Set(expressions.map(item => item.days));
  if (offsets.size > 1 || expressions.some(item => !Number.isInteger(item.days) || item.days < 0 || item.days > 365
    || /(?:大概|大约|大致|约莫|差不多|约|\babout|\baround|\bapproximately)\s*$/iu.test(message.slice(0, item.index))
    || /^\s*(?:左右|前后|上下)/u.test(message.slice(item.index + item.raw.length))))
    return fail("Clarify one supported relative dining date before reading availability");
  for (const fact of dateFacts) {
    if (fact.value?.kind !== "DATE") continue;
    const raw = relativeExpressions(fact.value.raw);
    if (raw.some(item => !offsets.has(item.days))) return fail("The DATE raw expression is not bound to this user message");
  }
  if (!expressions.length) {
    if (mentions.length) return fail("Clarify a replacement for the excluded dining date");
    return { status: "BOUND", proposal };
  }
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
