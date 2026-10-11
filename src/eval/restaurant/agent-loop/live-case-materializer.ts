import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { parseAllDocuments } from "yaml";

/** Current exposed development input, shared by the actual Runner and contract tests. */
export const RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION = "restaurant-read-development@7";
export const RESTAURANT_READ_DEVELOPMENT_CASE_PATH = "src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml";

/** Frozen variants retain the actual immutable parent, independent of the default. */
const DEVELOPMENT_DATASET_SOURCES: Readonly<Record<string, string>> = {
  "restaurant-read-development@6": "src/eval/restaurant/agent-loop/cases/e2e-cases.yaml",
  [RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION]: RESTAURANT_READ_DEVELOPMENT_CASE_PATH,
};
export async function validDevelopmentVariantParent(value: unknown): Promise<boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const parent = value as Record<string, unknown>;
  if (typeof parent.dataset !== "string" || typeof parent.sha256 !== "string") return false;
  const path = DEVELOPMENT_DATASET_SOURCES[parent.dataset];
  return path !== undefined && createHash("sha256").update(await readFile(path)).digest("hex") === parent.sha256;
}

export interface FrozenLiveCase {
  id: string;
  reference_time: string;
  semantic?: { date?: { expression?: string; value?: string }; time?: { expression?: string; value?: string; type?: string; start?: string; end?: string } };
  [key: string]: unknown;
}

/** Custom eval sources retain development parents or explicitly form the parentless novel cohort. */
export async function customLiveCaseCohort(source: FrozenLiveCase): Promise<"DEVELOPMENT_DIAGNOSTIC" | "NOVEL_LOCATION_DIAGNOSTIC"> {
  if (source.dataset === "restaurant-read-novel-variant@1" && source.parent === undefined) return "NOVEL_LOCATION_DIAGNOSTIC";
  if (source.dataset === "restaurant-read-development-variant@1" && await validDevelopmentVariantParent(source.parent)) return "DEVELOPMENT_DIAGNOSTIC";
  throw new Error("Custom case source requires a retained development-variant parent with exact SHA-256, or restaurant-read-novel-variant@1 without a parent");
}

export interface MaterializedLiveCase extends FrozenLiveCase {
  materialization: {
    sourceReferenceTime: string;
    resolvedReferenceTime: string;
    resolvedTokyoDate?: string;
    resolvedTokyoTime?: string;
  };
}

function tokyoDate(input: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(input);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function tokyoTime(input: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(input);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("hour")}:${value("minute")}`;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year!, month! - 1, day! + days));
  return utc.toISOString().slice(0, 10);
}

function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function resolveRelativeDate(expression: string | undefined, now: Date): string | undefined {
  if (!expression) return undefined;
  const today = tokyoDate(now);
  const normalized = expression.trim().toLowerCase();
  if (["tonight", "today", "right now", "now", "this afternoon"].includes(normalized)) return today;
  if (normalized === "tomorrow") return addDays(today, 1);
  const matchedWeekday = normalized.match(/^this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (!matchedWeekday) return undefined;
  const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = names.indexOf(matchedWeekday[1]!);
  const offset = (target - weekday(today) + 7) % 7;
  return addDays(today, offset);
}

function resolveRelativeTime(expression: string | undefined, now: Date): string | undefined {
  const normalized = expression?.trim().toLowerCase();
  return normalized === "right now" || normalized === "now" ? tokyoTime(now) : undefined;
}

function replaceDateValues(value: unknown, sourceDate: string | undefined, resolvedDate: string | undefined): unknown {
  if (!sourceDate || !resolvedDate || sourceDate === resolvedDate) return structuredClone(value);
  // Frozen scenario prose is itself an assertion surface. Keep dates in both
  // structured arguments and human-readable eligibility requirements aligned.
  if (typeof value === "string") return value.replaceAll(sourceDate, resolvedDate);
  if (Array.isArray(value)) return value.map((item) => replaceDateValues(item, sourceDate, resolvedDate));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceDateValues(item, sourceDate, resolvedDate)]));
  }
  return value;
}

/** Materializes relative date expectations while leaving the frozen source content unchanged. */
export function materializeLiveCase(source: FrozenLiveCase, liveReferenceTime: string): MaterializedLiveCase {
  const reference = new Date(liveReferenceTime);
  const sourceDate = source.semantic?.date?.value;
  const resolvedDate = resolveRelativeDate(source.semantic?.date?.expression, reference);
  const sourceTime = source.semantic?.time?.value;
  const resolvedTime = resolveRelativeTime(source.semantic?.time?.expression, reference);
  // Materialize expectation fields, never rewrite the actual user message.
  const { content, ...expectations } = source;
  const materialized = replaceDateValues(
    replaceDateValues(expectations, sourceDate, resolvedDate),
    sourceTime,
    resolvedTime,
  ) as FrozenLiveCase;
  if (resolvedTime && source.semantic?.time?.type === "TIME_WINDOW") {
    // Gold7's independent immediate expectation shares the original live
    // reference, never the frozen illustrative start/end or a renewed clock.
    materialized.semantic!.time = { ...materialized.semantic!.time,
      start: resolvedTime, end: tokyoTime(new Date(reference.valueOf() + 30 * 60_000)) };
  }
  return {
    ...materialized,
    ...(content !== undefined ? { content: structuredClone(content) } : {}),
    materialization: {
      sourceReferenceTime: source.reference_time,
      resolvedReferenceTime: liveReferenceTime,
      ...(resolvedDate ? { resolvedTokyoDate: resolvedDate } : {}),
      ...(resolvedTime ? { resolvedTokyoTime: resolvedTime } : {}),
    },
  };
}

export async function loadFrozenLiveCases(filePath: string): Promise<FrozenLiveCase[]> {
  const source = await readFile(filePath, "utf8");
  const documents = parseAllDocuments(source);
  const errors = documents.flatMap((document) => document.errors.map((error) => error.message));
  if (errors.length) throw new Error(`Frozen E2E case source is invalid: ${errors.join("; ")}`);
  return documents.map((document) => {
    const value: unknown = document.toJSON();
    validateCaseDocument(value);
    return value as FrozenLiveCase;
  });
}

/** Current executable cases only; archived annotation formats are read as evidence. */
function validateCaseDocument(value: unknown): void {
  const invalid = (path: string, reason: string): never => { throw new Error(`Frozen E2E case source is invalid: ${path}: ${reason}`); };
  const nonNull = (item: unknown, path: string): void => {
    if (item === null) invalid(path, "null value");
    if (Array.isArray(item)) item.forEach((child, index) => nonNull(child, `${path}[${index}]`));
    else if (item && typeof item === "object") for (const [key, child] of Object.entries(item)) nonNull(child, `${path}.${key}`);
  };
  const keys = (item: unknown, path: string, allowed: readonly string[]): Record<string, unknown> => {
    if (!item || typeof item !== "object" || Array.isArray(item)) invalid(path, "expected mapping");
    const record = item as Record<string, unknown>;
    for (const key of Object.keys(record)) if (!allowed.includes(key)) invalid(`${path}.${key}`, "unknown key");
    return record;
  };
  nonNull(value, "case");
  const source = keys(value, "case", ["id", "dataset", "reference_time", "content", "semantic", "acceptance", "parent"]);
  for (const field of ["id", "dataset", "reference_time", "content"]) {
    if (typeof source[field] !== "string" || !source[field]) invalid(`case.${field}`, "expected nonempty string");
  }
  if (source.parent !== undefined) keys(source.parent, "case.parent", ["dataset", "sha256"]);
  const semantic = keys(source.semantic, "case.semantic", ["target", "location", "date", "time", "party_size", "criteria"]);
  for (const [field, allowed] of Object.entries({
    target: ["goal"], location: ["value", "relation"], date: ["expression", "value"], time: ["expression", "value", "type", "start", "end"],
  })) if (semantic[field] !== undefined) keys(semantic[field], `case.semantic.${field}`, allowed);
  if (semantic.criteria !== undefined) {
    if (!Array.isArray(semantic.criteria)) invalid("case.semantic.criteria", "expected sequence");
    (semantic.criteria as unknown[]).forEach((criterion, index) => keys(criterion, `case.semantic.criteria[${index}]`, ["value", "polarity", "strength"]));
  }
  if (source.acceptance !== undefined) keys(source.acceptance, "case.acceptance", ["required_claims", "optional_investigation", "review"]);
}
