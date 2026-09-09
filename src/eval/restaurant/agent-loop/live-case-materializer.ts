import { readFile } from "node:fs/promises";

import { parseAllDocuments } from "yaml";

export interface FrozenLiveCase {
  id: string;
  reference_time: string;
  semantic?: { date?: { expression?: string; value?: string } };
  [key: string]: unknown;
}

export interface MaterializedLiveCase extends FrozenLiveCase {
  materialization: {
    sourceReferenceTime: string;
    resolvedReferenceTime: string;
    resolvedTokyoDate?: string;
  };
}

function tokyoDate(input: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(input);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
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
  const sourceDate = source.semantic?.date?.value;
  const resolvedDate = resolveRelativeDate(source.semantic?.date?.expression, new Date(liveReferenceTime));
  const materialized = replaceDateValues(source, sourceDate, resolvedDate) as FrozenLiveCase;
  return {
    ...materialized,
    materialization: {
      sourceReferenceTime: source.reference_time,
      resolvedReferenceTime: liveReferenceTime,
      ...(resolvedDate ? { resolvedTokyoDate: resolvedDate } : {}),
    },
  };
}

export async function loadFrozenLiveCases(filePath: string): Promise<FrozenLiveCase[]> {
  const source = await readFile(filePath, "utf8");
  const documents = parseAllDocuments(source);
  const errors = documents.flatMap((document) => document.errors.map((error) => error.message));
  if (errors.length) throw new Error(`Frozen E2E case source is invalid: ${errors.join("; ")}`);
  return documents.map((document) => document.toJSON()).filter((value): value is FrozenLiveCase =>
    typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "string",
  );
}
