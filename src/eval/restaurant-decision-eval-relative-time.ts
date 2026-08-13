import type {
  DecisionDaypart,
  DecisionState,
  DecisionStatePatch,
  DecisionTime,
} from "./restaurant-decision-eval-contract.js";

/**
 * Eval-only trusted interpretation of a deliberately small English relative
 * time vocabulary. This is not a general natural-language date parser and it
 * never reads the machine clock: callers must provide a fixed reference time.
 */
export interface DecisionEvalRelativeTimeResolution {
  source: "TODAY" | "TOMORROW" | "TONIGHT" | "NOW";
  time: DecisionTime;
}

interface LocalReferenceParts {
  date: string;
  clockTime: string;
}

const LATE_NIGHT_PATTERN = /\blate[\s-]+night\b/i;

const DAYPART_PATTERNS: Array<{ pattern: RegExp; daypart: DecisionDaypart }> = [
  { pattern: /\bbreakfast\b/i, daypart: "BREAKFAST" },
  { pattern: /\blunch\b/i, daypart: "LUNCH" },
  { pattern: /\bafternoon\b/i, daypart: "AFTERNOON" },
  { pattern: /\b(?:dinner|evening|night)\b/i, daypart: "DINNER" },
];

function hasUnnegatedMatch(userMessage: string, pattern: RegExp): boolean {
  const globalPattern = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );
  for (const match of userMessage.matchAll(globalPattern)) {
    const prefix = userMessage.slice(0, match.index);
    if (!/\b(?:not|no)(?:\s+right)?\s*$/i.test(prefix)) return true;
  }
  return false;
}

function localReferenceParts(referenceTime: string, timezone: "Asia/Tokyo"): LocalReferenceParts | undefined {
  const instant = new Date(referenceTime);
  if (Number.isNaN(instant.valueOf())) return undefined;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const valueFor = (type: Intl.DateTimeFormatPartTypes): string | undefined =>
    parts.find((part) => part.type === type)?.value;
  const year = valueFor("year");
  const month = valueFor("month");
  const day = valueFor("day");
  const hour = valueFor("hour");
  const minute = valueFor("minute");
  if ([year, month, day, hour, minute].some((value) => value === undefined)) return undefined;
  return { date: `${year}-${month}-${day}`, clockTime: `${hour}:${minute}` };
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const instant = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days));
  return instant.toISOString().slice(0, 10);
}

function detectedDaypart(userMessage: string): DecisionDaypart | undefined | "CONFLICT" {
  const dayparts = new Set<DecisionDaypart>();
  if (hasUnnegatedMatch(userMessage, LATE_NIGHT_PATTERN)) dayparts.add("LATE_NIGHT");

  // A generic "night" must not double-match the "night" in "late night".
  // Remove that compound phrase only for the generic daypart scan; the
  // unnegated LATE_NIGHT result above remains authoritative.
  const withoutLateNight = userMessage.replace(/\blate[\s-]+night\b/gi, " ");
  for (const { pattern, daypart } of DAYPART_PATTERNS) {
    if (hasUnnegatedMatch(withoutLateNight, pattern)) dayparts.add(daypart);
  }
  if (dayparts.size > 1) return "CONFLICT";
  return dayparts.values().next().value;
}

function hasToday(userMessage: string): boolean {
  return hasUnnegatedMatch(userMessage, /\btoday\b/i) || hasUnnegatedMatch(userMessage, /\btonight\b/i);
}

function hasTomorrow(userMessage: string): boolean {
  return hasUnnegatedMatch(userMessage, /\btomorrow\b/i);
}

function hasImmediate(userMessage: string): boolean {
  return hasUnnegatedMatch(userMessage, /\bright\s+now\b/i) || hasUnnegatedMatch(userMessage, /\bnow\b/i);
}

/**
 * Resolves only unambiguous relative expressions. Multiple incompatible date
 * anchors return undefined rather than selecting one by heuristic.
 */
export function resolveDecisionEvalRelativeTime(
  userMessage: string,
  referenceTime: string,
  timezone: "Asia/Tokyo",
): DecisionEvalRelativeTimeResolution | undefined {
  const reference = localReferenceParts(referenceTime, timezone);
  if (reference === undefined) return undefined;
  const today = hasToday(userMessage);
  const tomorrow = hasTomorrow(userMessage);
  const immediate = hasImmediate(userMessage);
  const daypart = detectedDaypart(userMessage);
  if (daypart === "CONFLICT" || (today && tomorrow) || (immediate && tomorrow)) return undefined;
  if (!today && !tomorrow && !immediate) return undefined;
  if (immediate) {
    return {
      source: "NOW",
      time: { date: reference.date, precision: "APPROXIMATE", preferred: reference.clockTime },
    };
  }
  const date = tomorrow ? addDays(reference.date, 1) : reference.date;
  const tonight = hasUnnegatedMatch(userMessage, /\btonight\b/i);
  const resolvedDaypart = tonight ? "DINNER" : daypart;
  return {
    source: tomorrow ? "TOMORROW" : tonight ? "TONIGHT" : "TODAY",
    time: resolvedDaypart === undefined
      ? { date, precision: "DAY" }
      : { date, precision: "DAYPART", daypart: resolvedDaypart },
  };
}

function cloneTime(time: DecisionTime): DecisionTime {
  return structuredClone(time);
}

function hasRelativeDaypart(resolution: DecisionEvalRelativeTimeResolution): boolean {
  return resolution.time.precision === "DAYPART";
}

/**
 * Keeps existing user time precision when a relative day supplies only a date,
 * but lets an immediate request override stale timing with the reference clock.
 */
export function applyDecisionEvalRelativeTimeToState(
  state: DecisionState,
  resolution: DecisionEvalRelativeTimeResolution | undefined,
): DecisionState {
  if (resolution === undefined) return structuredClone(state);
  const resolvedDate = resolution.time.date;
  if (resolvedDate === undefined) return structuredClone(state);
  const current = state.time;
  let time: DecisionTime;
  if (resolution.source === "NOW") {
    time = cloneTime(resolution.time);
  } else if (current === undefined || current.precision === "UNKNOWN") {
    time = cloneTime(resolution.time);
  } else if (hasRelativeDaypart(resolution) && current.precision === "DAY") {
    time = cloneTime(resolution.time);
  } else {
    time = { ...cloneTime(current), date: resolvedDate };
  }
  return { ...structuredClone(state), time };
}

/**
 * Adds trusted relative-time facts to a model patch. This prevents a valid but
 * date-less DAYPART proposal from erasing a date already derived from the
 * fixed reference clock, while preserving a model-provided clock time when a
 * relative day only supplied the date.
 */
export function applyDecisionEvalRelativeTimeToPatch(
  priorState: DecisionState,
  patch: DecisionStatePatch,
  resolution: DecisionEvalRelativeTimeResolution | undefined,
): DecisionStatePatch {
  if (resolution === undefined) return structuredClone(patch);
  const rawTime = patch.set?.time;
  const stateWithTrustedTime = applyDecisionEvalRelativeTimeToState(priorState, resolution);
  const baseTime = rawTime === undefined || rawTime === null ? stateWithTrustedTime.time : rawTime;
  const effectiveState = applyDecisionEvalRelativeTimeToState(
    { ...stateWithTrustedTime, ...(baseTime === undefined ? {} : { time: baseTime }) },
    resolution,
  );
  if (effectiveState.time === undefined) return structuredClone(patch);
  return {
    ...structuredClone(patch),
    set: {
      ...structuredClone(patch.set ?? {}),
      time: effectiveState.time,
    },
  };
}
