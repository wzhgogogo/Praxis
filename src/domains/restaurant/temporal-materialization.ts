import type { RestaurantTemporalResolution } from "./contracts.js";
import type { RestaurantSemanticValue } from "./semantic-proposal.js";

export const RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY = {
  version: "restaurant-temporal-materialization@2",
  timezone: "Asia/Tokyo" as const,
  afternoon: { earliest: "12:00", latest: "17:00" },
  /** A broad query range, never a claim that the user specified exact hours. */
  afterWork: { earliest: "17:30", latest: "22:00" },
} as const;

type TimeContext = { referenceTime: string; timezone: "Asia/Tokyo" };

function localParts(referenceTime: string): { date: string; time: string; weekday: number } {
  const instant = new Date(referenceTime);
  if (Number.isNaN(instant.valueOf())) throw new Error("Temporal materialization requires a valid reference time");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY.timezone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const field = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = field("year"); const month = field("month"); const day = field("day"); const hour = field("hour"); const minute = field("minute");
  if (!year || !month || !day || !hour || !minute) throw new Error("Temporal materialization could not read Tokyo local time");
  const date = `${year}-${month}-${day}`;
  return { date, time: `${hour}:${minute}`, weekday: new Date(`${date}T12:00:00.000Z`).getUTCDay() };
}

function addTokyoDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function inTokyo(instant: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY.timezone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const field = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = field("year"); const month = field("month"); const day = field("day"); const hour = field("hour"); const minute = field("minute");
  if (!year || !month || !day || !hour || !minute) throw new Error("Temporal materialization could not read Tokyo local time");
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}

function dateResolution(
  value: Extract<RestaurantSemanticValue, { kind: "DATE" }>,
  context: TimeContext,
): { date: string; record: NonNullable<RestaurantTemporalResolution["date"]> } {
  const reference = localParts(context.referenceTime);
  if ("value" in value) return { date: value.value, record: { expression: value.raw ?? value.value, resolvedDate: value.value, basis: "EXPLICIT_DATE" } };
  if ("relativeDay" in value) {
    const days = value.relativeDay === "TODAY" ? 0 : 1;
    const date = addTokyoDays(reference.date, days);
    return { date, record: { expression: value.raw, resolvedDate: date, basis: value.relativeDay } };
  }
  const target = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].indexOf(value.weekday);
  const date = addTokyoDays(reference.date, (target - reference.weekday + 7) % 7);
  return { date, record: { expression: value.raw, resolvedDate: date, basis: `WEEKDAY:${value.weekday}` } };
}

function timeResolution(
  value: Extract<RestaurantSemanticValue, { kind: "TIME_WINDOW" }>,
  context: TimeContext,
): { date?: string; timeWindow: { earliest: string; latest: string }; record: NonNullable<RestaurantTemporalResolution["timeWindow"]> } {
  if ("earliest" in value) return { timeWindow: { earliest: value.earliest, latest: value.latest }, record: { expression: value.raw ?? `${value.earliest}-${value.latest}`, resolvedTimeWindow: { earliest: value.earliest, latest: value.latest }, basis: "EXPLICIT_CLOCK" } };
  if ("daypart" in value) {
    const date = "relativeDay" in value ? localParts(context.referenceTime).date : undefined;
    const timeWindow = value.daypart === "AFTER_WORK"
      ? RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY.afterWork
      : RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY.afternoon;
    return {
      ...(date ? { date } : {}),
      timeWindow,
      record: {
        expression: value.raw,
        resolvedTimeWindow: timeWindow,
        basis: value.daypart === "AFTER_WORK" ? "DAYPART:AFTER_WORK_BROAD_WINDOW" : "DAYPART:AFTERNOON",
      },
    };
  }
  const reference = new Date(context.referenceTime);
  if (Number.isNaN(reference.valueOf())) throw new Error("Temporal materialization requires a valid reference time");
  const resolved = inTokyo(new Date(reference.valueOf() + value.relativeOffsetMinutes * 60_000));
  return { date: resolved.date, timeWindow: { earliest: resolved.time, latest: resolved.time }, record: { expression: value.raw, resolvedTimeWindow: { earliest: resolved.time, latest: resolved.time }, basis: `RELATIVE_OFFSET_MINUTES:${value.relativeOffsetMinutes}` } };
}

/** Code-owned materialization of a deliberately small temporal semantic contract. */
export function materializeRestaurantTemporalFacts(input: {
  date?: Extract<RestaurantSemanticValue, { kind: "DATE" }>;
  timeWindow?: Extract<RestaurantSemanticValue, { kind: "TIME_WINDOW" }>;
  referenceTime: string;
  timezone: "Asia/Tokyo";
}): { date?: string; timeWindow?: { earliest: string; latest: string }; temporalResolution?: RestaurantTemporalResolution } {
  const context: TimeContext = { referenceTime: input.referenceTime, timezone: input.timezone };
  const date = input.date ? dateResolution(input.date, context) : undefined;
  const timeWindow = input.timeWindow ? timeResolution(input.timeWindow, context) : undefined;
  // A user-specified calendar date owns the date component.  A relative clock
  // can compute its local clock (and supplies a date only when no DATE fact
  // was expressed), but cannot silently replace an explicit Friday/tomorrow.
  const resolvedDate = date?.date ?? timeWindow?.date;
  return {
    ...(resolvedDate ? { date: resolvedDate } : {}),
    ...(timeWindow ? { timeWindow: timeWindow.timeWindow } : {}),
    ...(date || timeWindow ? {
      temporalResolution: {
        policyVersion: RESTAURANT_TEMPORAL_MATERIALIZATION_POLICY.version,
        referenceTime: input.referenceTime,
        timezone: input.timezone,
        ...(date ? { date: date.record } : {}),
        ...(timeWindow ? { timeWindow: timeWindow.record } : {}),
      },
    } : {}),
  };
}
