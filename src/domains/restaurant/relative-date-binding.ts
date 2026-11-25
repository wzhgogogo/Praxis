import type { RestaurantSemanticConflict } from "./contracts.js";
import type { RestaurantSemanticProposal, RestaurantSemanticValue } from "./semantic-proposal.js";
import { materializeRestaurantTemporalFacts } from "./temporal-materialization.js";

type DateValue = Extract<RestaurantSemanticValue, { kind: "DATE" }>;
type Weekday = Extract<DateValue, { weekday: string }>["weekday"];
type TimeContext = { referenceTime: string; timezone: "Asia/Tokyo" };

const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const fixedOffsets: Readonly<Record<string, number>> = {
  今天: 0, today: 0, tonight: 0, 明天: 1, tomorrow: 1,
  后天: 2, "day after tomorrow": 2, 大后天: 3, 一周后: 7, "in a week": 7,
};
const smallNumbers = "零一二三四五六七八九";
const englishNumbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase().trim();
}

/** Longest lexical units own their span. No interpretation of surrounding clauses. */
function dateTokens(message: string, raw: string): string[] {
  const recognized = /(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)|(?<!\d)(?:\d{4}年)?\d{1,2}月\d{1,2}[日号]|(?<![\d/])\d{1,2}\/\d{1,2}(?![\d/])|(?:这|本|下)?个?(?:周|星期|礼拜)[一二三四五六日天]|大后天|后天|明天|今天|一周后|[-+\d.零〇一二两三四五六七八九十百]+(?:\s*[–~至到或-]\s*[-+\d.零〇一二两三四五六七八九十百]+)?天后|\b(?:day after tomorrow|tomorrow|today|tonight|in a week|in -?(?:\d+(?:\.\d+)?(?:\s*[-–~]\s*\d+)?|one|two|three|four|five|six|seven|eight|nine|ten) days?|(?:(?:this|next)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gu;
  const tokens = [...message.matchAll(recognized)];
  const matches = new Set<string>();
  for (let start = message.indexOf(raw); start !== -1; start = message.indexOf(raw, start + 1)) {
    const end = start + raw.length;
    if ((/^[a-z0-9]/u.test(raw) && /[a-z0-9_]/u.test(message[start - 1] ?? ""))
      || (/[a-z0-9]$/u.test(raw) && /[a-z0-9_]/u.test(message[end] ?? ""))) continue;
    const overlapping = tokens.filter(token => start < token.index + token[0].length && token.index < end);
    const first = overlapping[0];
    if (!first) {
      matches.add(raw);
      continue;
    }
    const wholeWord = overlapping.every(token => {
      if (token[0] !== first[0]) return false;
      const tokenEnd = token.index + token[0].length;
      const includesDate = start <= token.index && tokenEnd <= end;
      const qualifiedWeekdaySuffix = token.index <= start && end === tokenEnd && weekdayOf(raw) && weekdayOf(token[0]);
      return includesDate || qualifiedWeekdaySuffix;
    });
    if (wholeWord) matches.add(first[0]);
  }
  return [...matches];
}

function offsetDays(raw: string): number | undefined {
  if (Object.hasOwn(fixedOffsets, raw)) return fixedOffsets[raw];
  const english = /^in (.+) days?$/u.exec(raw)?.[1];
  if (english) {
    const named = englishNumbers.indexOf(english);
    return named >= 0 ? named : /^-?\d+$/u.test(english) ? Number(english) : NaN;
  }
  const chinese = /^(.+)天后$/u.exec(raw)?.[1]?.replaceAll("两", "二").replaceAll("〇", "零");
  if (!chinese) return undefined;
  if (/^-?\d+$/u.test(chinese)) return Number(chinese);
  if (chinese.length === 1 && smallNumbers.includes(chinese)) return smallNumbers.indexOf(chinese);
  const tens = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/u.exec(chinese);
  if (tens) return (tens[1] ? smallNumbers.indexOf(tens[1]) : 1) * 10 + (tens[2] ? smallNumbers.indexOf(tens[2]) : 0);
  const hundreds = /^([一二三四五六七八九])百(?:零([一二三四五六七八九])|([一二三四五六七八九])十([一二三四五六七八九])?)?$/u.exec(chinese);
  if (!hundreds) return NaN;
  return 100 * smallNumbers.indexOf(hundreds[1]!) + (hundreds[3] ? 10 * smallNumbers.indexOf(hundreds[3]) : 0)
    + smallNumbers.indexOf(hundreds[2] ?? hundreds[4] ?? "零");
}

function weekdayOf(raw: string): Weekday | undefined {
  const chinese = /^(?:这|本|下)?个?(?:周|星期|礼拜)([一二三四五六日天])$/u.exec(raw);
  if (chinese) return weekdays[Math.min("一二三四五六日天".indexOf(chinese[1]!), 6)];
  return weekdays.find(day => day.toLowerCase() === raw.replace(/^(?:this|next)\s+/u, ""));
}

function validDate(value: string): boolean {
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function calendarDate(raw: string, today: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) return raw;
  const chinese = /^(?:(\d{4})年)?(\d{1,2})月(\d{1,2})[日号]$/u.exec(raw);
  const slash = /^(\d{1,2})\/(\d{1,2})$/u.exec(raw);
  if (!chinese && !slash) return undefined;
  const suffix = "-" + (chinese?.[2] ?? slash![1]!).padStart(2, "0") + "-" + (chinese?.[3] ?? slash![2]!).padStart(2, "0");
  if (chinese?.[1]) return chinese[1] + suffix;
  const year = Number(today.slice(0, 4));
  const thisYear = year + suffix;
  return thisYear >= today ? thisYear : (year + 1) + suffix;
}

function weekdayDate(weekday: Weekday, token: string, today: string, context: TimeContext): string | undefined {
  let referenceTime = context.referenceTime;
  if (/^(?:[这本下]|(?:this|next)\s)/u.test(token)) {
    const monday = new Date(today + "T12:00:00.000Z");
    const next = /^(?:下|next\s)/u.test(token);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7 + (next ? 7 : 0));
    referenceTime = monday.toISOString().slice(0, 10) + "T12:00:00+09:00";
  }
  return materializeRestaurantTemporalFacts({ ...context, referenceTime, date: { kind: "DATE", weekday, raw: token } }).date;
}

export function bindRestaurantRelativeDate(proposal: RestaurantSemanticProposal, message: string, context: TimeContext):
  | { status: "BOUND"; proposal: RestaurantSemanticProposal }
  | { status: "CONFLICT"; conflict: RestaurantSemanticConflict } {
  const fail = (message: string) => ({ status: "CONFLICT" as const, conflict: {
    code: "UNSUPPORTED_SEMANTIC_EXPRESSION" as const, affectedFields: ["DATE" as const], message,
  } });
  const dates = proposal.facts.filter(fact => fact.field === "DATE");
  const isDateEdit = (fact: typeof dates[number]) => fact.operation === "ASSERT" || fact.operation === "CORRECT";
  const target = /^\s*Change\s+.+?\s+to\s+(\d{4}-\d{2}-\d{2})\s*$/iu.exec(message)?.[1];
  if (target) {
    if (!validDate(target) || !dates.length || !dates.every(isDateEdit)) return fail("Confirm the selected calendar date");
    return { status: "BOUND", proposal: { ...proposal, facts: [
      ...proposal.facts.filter(fact => fact.field !== "DATE"),
      { field: "DATE", operation: "CORRECT", value: { kind: "DATE", value: target, raw: target } },
    ] } };
  }
  if (!dates.some(isDateEdit)) return { status: "BOUND", proposal };

  const normalized = normalize(message);
  const facts = [];
  for (const fact of proposal.facts) {
    const value = fact.value;
    if (fact.field !== "DATE" || !isDateEdit(fact) || value?.kind !== "DATE") {
      facts.push(fact);
      continue;
    }
    const raw = normalize(value.raw);
    const tokens = raw ? dateTokens(normalized, raw) : [];
    const [token] = tokens;
    if (!token || tokens.length !== 1) return fail("The date expression must match one complete date term in this message");
    const days = offsetDays(token);
    if (days !== undefined) {
      if (!Number.isInteger(days) || days < 0 || days > 365) return fail("Clarify one supported relative date");
      const date: DateValue = days <= 1
        ? { kind: "DATE", raw: value.raw, relativeDay: days === 0 ? "TODAY" : "TOMORROW" }
        : { kind: "DATE", raw: value.raw, relativeOffsetDays: days };
      facts.push({ ...fact, value: date });
      continue;
    }
    const today = materializeRestaurantTemporalFacts({ ...context, date: { kind: "DATE", relativeDay: "TODAY", raw: "today" } }).date!;
    const actual = materializeRestaurantTemporalFacts({ ...context, date: value }).date;
    const expected = calendarDate(token, today);
    if (expected && (!validDate(expected) || actual !== expected
      || Date.parse(expected) - Date.parse(today) > 365 * 86_400_000 && !/^\d{4}[-年]/u.test(token))) {
      return fail("The model date disagrees with the calendar expression");
    }
    const weekday = weekdayOf(token);
    if (weekday) {
      const expected = weekdayDate(weekday, token, today, context);
      if (actual !== expected) {
        if ("weekday" in value && value.weekday === weekday && raw.includes(token) && expected && expected >= today) {
          const diffDays = Math.round((Date.parse(expected) - Date.parse(today)) / 86_400_000);
          facts.push({ ...fact, value: { kind: "DATE", raw: value.raw, relativeOffsetDays: diffDays } });
          continue;
        }
        return fail("The model date disagrees with the complete Tokyo date for this weekday");
      }
    }
    facts.push(fact);
  }
  return { status: "BOUND", proposal: { ...proposal, facts } };
}
