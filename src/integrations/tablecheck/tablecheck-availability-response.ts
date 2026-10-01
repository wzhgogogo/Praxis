import type { BrowserCapturedResponse, BrowserResponseRule } from "../../infrastructure/browser/browser-runtime.js";
import type { TableCheckReservationTarget } from "./tablecheck-page-parser.js";

export interface TableCheckCapturedAvailability {
  /** The source has returned a completed negative result for one exact selected mealtime. */
  exactTimeEmpty: boolean;
  observedAt: string;
  time: string;
}

/**
 * TableCheck's public reservation surface requests this same-shop endpoint
 * after its query controls are selected.  The rule is derived only from the
 * page-owned reservation target; it never guesses a shop slug.
 */
export function tableCheckAvailabilityResponseRule(target: TableCheckReservationTarget): BrowserResponseRule | undefined {
  try {
    const url = new URL(target.url);
    const matched = url.pathname.match(/^\/(?:en|ja)\/shops\/([^/]+)\/reserve(?:\/|$)/i);
    if (!matched) return undefined;
    return { origin: url.origin, pathname: `/en/shops/${matched[1]}/available` };
  } catch {
    return undefined;
  }
}

function dateTimeInTokyo(epochSeconds: string): { date: string; time: string } | undefined {
  if (!/^\d{10}$/.test(epochSeconds)) return undefined;
  const date = new Date(Number(epochSeconds) * 1_000);
  if (Number.isNaN(date.getTime())) return undefined;
  const fields = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => fields.find(item => item.type === type)?.value;
  const year = read("year"); const month = read("month"); const day = read("day");
  const hour = read("hour"); const minute = read("minute");
  return year && month && day && hour && minute ? { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` } : undefined;
}

function isExplicitFailure(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const record = body as Record<string, unknown>;
  return record.status === "failure" && record.data === null;
}

/**
 * A passive response is useful only when its URL itself carries the exact
 * source request.  `failure` is intentionally accepted only for one exact
 * requested time: a failed 19:00 lookup cannot establish an empty 18:30–20:00
 * range.
 */
export function parseTableCheckCapturedAvailability(
  responses: readonly BrowserCapturedResponse[] | undefined,
  target: TableCheckReservationTarget,
  request: { date: string; partySize: number; timeWindow: { earliest: string; latest: string } },
): TableCheckCapturedAvailability | undefined {
  if (request.timeWindow.earliest !== request.timeWindow.latest) return undefined;
  const rule = tableCheckAvailabilityResponseRule(target);
  if (!rule) return undefined;
  for (const response of [...(responses ?? [])].sort((left, right) => right.sequence - left.sequence)) {
    if (response.status < 200 || response.status >= 300 || !isExplicitFailure(response.body)) continue;
    let url: URL;
    try { url = new URL(response.url); } catch { continue; }
    if (url.origin !== rule.origin || url.pathname !== rule.pathname) continue;
    const selected = dateTimeInTokyo(url.searchParams.get("reservation[start_at_epoch]") ?? "");
    if (!selected || selected.date !== request.date || selected.time !== request.timeWindow.earliest) continue;
    if (url.searchParams.get("reservation[num_people_adult]") !== String(request.partySize)) continue;
    return { exactTimeEmpty: true, observedAt: response.observedAt, time: selected.time };
  }
  return undefined;
}
