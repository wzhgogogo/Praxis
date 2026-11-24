import type { RestaurantSemanticConflict } from "./contracts.js";
import type { RestaurantSemanticProposal, RestaurantSemanticValue } from "./semantic-proposal.js";
import { materializeRestaurantTemporalFacts } from "./temporal-materialization.js";

type DateMention = { raw: string; index: number };
type RelativeExpression = DateMention & { days: number };
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
  const pattern = /大后天|后天|明天|今天|一周后|(?:-?\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百]+)(?:\s*[-–~～至到或]\s*(?:-?\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百]+))?天后|\bday after tomorrow\b|\btomorrow\b|\btoday\b(?!['’]s)|\btonight\b|\bin a week\b|\bin (-?\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten) days?\b/giu;
  return [...normalized.matchAll(pattern)].map(match => {
    const raw = match[0], lower = raw.toLowerCase();
    const fixed: Readonly<Record<string, number>> = { "今天": 0, today: 0, tonight: 0, "明天": 1, tomorrow: 1, "后天": 2, "day after tomorrow": 2, "大后天": 3, "一周后": 7, "in a week": 7 };
    const number = match[1] ?? raw.slice(0, -2);
    return { raw, index: match.index, days: fixed[lower] ?? englishNumbers[number.toLowerCase()] ?? (/^-?\d/.test(number) ? Number(number) : chineseNumber(number)) };
  });
}

function excludedDate(text: string, index: number, raw: string): boolean {
  return /(?:不要|不选|排除|不是|别选|别|\bnot|\brather than)\s*$/iu.test(text.slice(0, index))
    || /^\s*(?:(?:晚上|早上|中午|下午|晚餐|午餐|evening|morning)\s*)?(?:不行|不可以|不能|不合适|不方便|没空|is not|doesn['’]t work|won['’]t work)/iu.test(text.slice(index + raw.length));
}

/** Only explicitly linked alternatives share a date group; other dates keep their own context. */
function dateGroups(message: string, relative: readonly RelativeExpression[]): DateMention[][] {
  const named = /\b\d{4}-\d{2}-\d{2}\b|(?:\d{4}年)?\d{1,2}月\d{1,2}[日号]|\b\d{1,2}\/\d{1,2}\b|(?:这|本|下)?(?:个)?(?:周|星期|礼拜)[一二三四五六日天]|\b(?:(?:this|next)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/giu;
  const dates = [...relative, ...[...message.matchAll(named)].map(match => ({ raw: match[0], index: match.index }))]
    .filter(date => !excludedDate(message, date.index, date.raw)).sort((a, b) => a.index - b.index);
  const groups: DateMention[][] = [];
  for (const date of dates) {
    const group = groups.at(-1), prior = group?.at(-1);
    if (prior && /^[\s，,、]*(?:还是|或(?:者)?|要么|\bor\b(?:\s+the)?|\/)[\s，,、]*$/iu.test(message.slice(prior.index + prior.raw.length, date.index))) group!.push(date);
    else groups.push([date]);
  }
  return groups;
}

function dateContext(message: string, group: readonly DateMention[]): { before: string; after: string } {
  const first = group[0]!, last = group.at(-1)!;
  return {
    before: message.slice(0, first.index).split(/[，,;；。.!?\n]/u).at(-1) ?? "",
    after: message.slice(last.index + last.raw.length).split(/[，,;；。.!?\n]/u)[0]!,
  };
}

/** Uncertainty must address the date itself, not another undecided part of dinner. */
function dateSelectionIsUncertain(before: string, after: string): boolean {
  return /(?:未定|没定|待定|不确定|尚未决定|还没决定|\bundecided\b|\bnot (?:decided|sure)\b|\bhaven['’]t decided\b)\s*(?:(?:on|about)\s+(?:the\s+)?(?:date|day))?\s*$/iu.test(before)
    || /^\s*(?:(?:我(?:们)?|日期|日子|还|也|仍|is|still|I|we|it['’]s)\s*)*(?:未定|没定|待定|不确定|尚未决定|还没决定|\bundecided\b|\bnot (?:decided|sure)\b|\bhaven['’]t decided\b)/iu.test(after);
}

/** Omission repair requires a dining/date correction or a standalone temporal fragment. */
function selectsDiningDate(before: string, after: string, timeRaws: readonly string[]): boolean {
  if (/^\s*(?:(?:(?:把)?日期)?(?:改成|改为|改到)|(?:change|move)\s+(?:it\s+)?to|make\s+it|(?:set|change)\s+(?:the\s+)?date\s+to)\s*$/iu.test(before)
    || /^\s*(?:(?:so|then|please|just|only)\s+)*(?:make|find|book|have|plan|want|change)\s+(?:(?:a|the)\s+)?(?:dinner|lunch|breakfast|meal|table)\s*(?:for|on|to)?\s*$/iu.test(before)
    || /^\s*(?:dinner|lunch|breakfast|meal|table)\s*(?:for|on)?\s*$/iu.test(before)
    || /^\s*(?:把)?(?:晚餐|午餐|早餐|用餐)(?:日期|时间)?(?:改成|改为|改到|安排在|在)?\s*$/u.test(before)) return true;
  if (!/^\s*(?:(?:大概|大约|大致|约莫|差不多|约|about|around|approximately|on|for)\s*)?$/iu.test(before)) return false;
  let remainder = after.toLowerCase().replace(/\s+/gu, "");
  for (const raw of timeRaws) remainder = remainder.replaceAll(raw.toLowerCase().replace(/\s+/gu, ""), "");
  return !remainder.replace(/\b(?:at|from)\b|左右|前后|上下|[\s.!?]/giu, "")
    || /^(?:晚上|早上|中午|下午|晚餐|午餐|evening|morning)/iu.test(after.trim());
}

function namedDateDirective(date: DateMention): Extract<RestaurantSemanticValue, { kind: "DATE" }> | undefined {
  if (/^\d{4}-\d{2}-\d{2}$/u.test(date.raw)) return { kind: "DATE", value: date.raw, raw: date.raw };
  const calendar = /^(\d{4})年(\d{1,2})月(\d{1,2})[日号]$/u.exec(date.raw);
  if (calendar) return { kind: "DATE", value: `${calendar[1]}-${calendar[2]!.padStart(2, "0")}-${calendar[3]!.padStart(2, "0")}`, raw: date.raw };
  const chinese = /(?:周|星期|礼拜)([一二三四五六日天])$/u.exec(date.raw);
  const english = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/iu.exec(date.raw);
  const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
  const weekday = chinese ? weekdays[Math.min("一二三四五六日天".indexOf(chinese[1]!), 6)] : weekdays.find(day => day === english?.[1]?.toUpperCase());
  return weekday ? { kind: "DATE", weekday, raw: date.raw } : undefined;
}

export function bindRestaurantRelativeDate(proposal: RestaurantSemanticProposal, message: string, temporalContext: { referenceTime: string; timezone: "Asia/Tokyo" }):
  | { status: "BOUND"; proposal: RestaurantSemanticProposal }
  | { status: "CONFLICT"; conflict: RestaurantSemanticConflict } {
  message = message.normalize("NFKC");
  const mentions = relativeExpressions(message);
  const dateFacts = proposal.facts.filter(fact => fact.field === "DATE");
  const fail = (reason: string) => ({ status: "CONFLICT" as const, conflict: { code: "UNSUPPORTED_SEMANTIC_EXPRESSION" as const, affectedFields: ["DATE" as const], message: reason } });
  if (dateFacts.every(fact => fact.operation === "CONFIRM")
    && /\bkeep\s+(?:the\s+)?(?:same\s+)?date\b|\bdate\s+(?:unchanged|the same)\b|日期不变|日期照旧|保留(?:原|原来|原有)?日期/iu.test(message))
    return { status: "BOUND", proposal };
  const boundDates = dateFacts.flatMap(fact => {
    const value = fact.value;
    if ((fact.operation !== "ASSERT" && fact.operation !== "CORRECT") || value?.kind !== "DATE") return [];
    const raw = value.raw.normalize("NFKC").trim();
    const quotes = raw ? [...message.matchAll(new RegExp(raw.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&"), "giu"))] : [];
    return quotes.filter(quote => !excludedDate(message, quote.index, quote[0])).map(quote => ({ raw: quote[0], index: quote.index, value }));
  });
  const timeRaws = proposal.facts.flatMap(fact => fact.value?.kind === "TIME_WINDOW" && fact.value.raw ? [fact.value.raw.normalize("NFKC")] : []);
  const groups = dateGroups(message, mentions);
  const boundGroups = groups.filter(group => boundDates.some(quote => group.some(date => date.index >= quote.index && date.index + date.raw.length <= quote.index + quote.raw.length)));
  const compact = (text: string) => text.toLowerCase().replace(/\s+/gu, "");
  const timedGroups = boundGroups.filter(group => { const context = dateContext(message, group); return timeRaws.some(raw => compact(context.before + context.after).includes(compact(raw))); });
  const contextualGroups = timedGroups.length ? timedGroups : boundGroups;
  const diningGroups = contextualGroups.filter(group => /晚餐|午餐|早餐|用餐|\b(?:dinner|lunch|breakfast|meal|table)\b/iu.test(dateContext(message, group).before));
  const selectedBoundGroups = diningGroups.length ? diningGroups : contextualGroups;
  // The UI's Change <label> to <ISO> envelope gives an exact target position, even with a comma in the old label.
  const structuredEdit = /^(\s*Change\s+.+?\s+to\s+)(\d{4}-\d{2}-\d{2})\s*$/iu.exec(message);
  const structuredGroups = structuredEdit ? groups.filter(group => group.some(date => date.index === structuredEdit[1]!.length)) : [];
  const explicitGroups = groups.filter(group => { const { before, after } = dateContext(message, group); return selectsDiningDate(before, after, timeRaws); });
  const selectedGroups = structuredGroups.length ? structuredGroups : explicitGroups.length ? explicitGroups : selectedBoundGroups.length ? selectedBoundGroups : groups.filter(group => {
    const { before, after } = dateContext(message, group);
    return !before.trim() && dateSelectionIsUncertain(before, after);
  });
  if (selectedGroups.some(group => {
    const { before, after } = dateContext(message, group);
    return group.length > 1 || dateSelectionIsUncertain(before, after);
  })) return fail("Clarify the undecided or competing dining dates");
  if (selectedGroups.length && dateFacts.some(fact => fact.operation === "NEGATE" || fact.operation === "CONFIRM"))
    return fail("Clarify whether to clear, retain or replace the dining date");
  if (selectedGroups.length && structuredEdit && !dateFacts.length)
    return fail("Confirm the explicit calendar date change before reading availability");
  const qualified = selectedGroups.flat().filter(date => /^(?:[这本下](?:个)?(?:周|星期|礼拜)|(?:this|next)\s+)/iu.test(date.raw));
  if (qualified.length) {
    try {
      const today = materializeRestaurantTemporalFacts({ date: { kind: "DATE", relativeDay: "TODAY", raw: "today" }, ...temporalContext }).date!;
      const monday = new Date(`${today}T12:00:00.000Z`);
      monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
      for (const date of qualified) {
        const weekday = namedDateDirective(date);
        const original = boundDates.find(quote => date.index >= quote.index && date.index + date.raw.length <= quote.index + quote.raw.length)?.value;
        if (!weekday || !("weekday" in weekday) || !original) return fail("Clarify the qualified dining week without dropping its scope");
        const start = new Date(monday);
        if (/^(?:下|next\b)/iu.test(date.raw)) start.setUTCDate(start.getUTCDate() + 7);
        const expected = materializeRestaurantTemporalFacts({ date: weekday, referenceTime: start.toISOString().slice(0, 10) + "T12:00:00+09:00", timezone: temporalContext.timezone }).date;
        const actual = materializeRestaurantTemporalFacts({ date: original, ...temporalContext }).date;
        if (actual !== expected) return fail("Clarify the qualified dining week without rolling into another week");
      }
      return { status: "BOUND", proposal };
    } catch { return fail("Clarify the qualified dining date against a valid reference time"); }
  }
  // A recognized literal edit owns its target even when the model fabricates its quote.
  const directives = selectedGroups.flat().map(namedDateDirective).filter(value => value !== undefined);
  if (directives.length) {
    if (new Set(directives.map(value => "value" in value ? value.value : "weekday" in value ? value.weekday : undefined)).size > 1)
      return fail("Clarify one explicit dining date");
    const directive = directives[0]!;
    if ("value" in directive) {
      const parsed = new Date(`${directive.value}T00:00:00.000Z`);
      if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== directive.value) return fail("Clarify a valid calendar dining date");
    }
    return { status: "BOUND", proposal: { ...proposal, facts: [
      ...proposal.facts.filter(fact => fact.field !== "DATE"),
      { field: "DATE", operation: dateFacts[0]?.operation ?? "ASSERT", value: directive },
    ] } };
  }
  const boundCalendar = selectedGroups.some(group => group.some(date => !relativeExpressions(date.raw).length
    && boundDates.some(quote => ("value" in quote.value || "weekday" in quote.value)
      && date.index >= quote.index && date.index + date.raw.length <= quote.index + quote.raw.length)));
  if (boundCalendar) return { status: "BOUND", proposal };
  const available = mentions.filter(item => !excludedDate(message, item.index, item.raw));
  const expressions = available.filter(item => selectedGroups.some(group => group.some(date => date.index === item.index)));
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
    if (mentions.length && !available.length) return fail("Clarify a replacement for the excluded dining date");
    if (!dateFacts.length && available.some(item => {
      const before = message.slice(0, item.index).split(/[，,;；。.!?\n]/u).at(-1) ?? "";
      const after = message.slice(item.index).split(/[，,;；。.!?\n]/u)[0]!;
      const scope = (before + after).toLowerCase().replace(/\s+/gu, "");
      return timeRaws.some(raw => scope.includes(raw.toLowerCase().replace(/\s+/gu, "")));
    })) return fail("Clarify whether the relative date applies to the dining time");
    return { status: "BOUND", proposal };
  }
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
