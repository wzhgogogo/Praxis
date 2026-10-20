import { readFileSync } from "node:fs";
import type { EvidenceRecord, RunRecord } from "./diagnostic-evaluator-record.js";

// Shared approved DATA only. Never import a production parser or comparator.
const policy = JSON.parse(readFileSync(new URL("../../../domains/restaurant/condition-policy.json", import.meta.url), "utf8")) as { status: string; aroundPriceTolerance: number };
const clean = (value: string) => value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<del\b[^>]*>[\s\S]*?<\/del>/gi, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();

export interface RawPriceRegion { markup: string; visibleTextIncluded: boolean; truncated: boolean; }
/** Bounded raw menu/budget elements. Strip links, images, scripts and fields. */
export function captureRawPriceRegions(html: string, visibleText: string): RawPriceRegion[] {
  const output: RawPriceRegion[] = []; const open: string[] = []; let start = -1, depth = -1;
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi)) {
    const token = match[0]; if (/^<!--|^<script|^<style/i.test(token)) continue;
    const closing = token.match(/^<\/([\w-]+)/)?.[1]?.toLowerCase();
    if (closing) {
      const index = open.lastIndexOf(closing); if (index < 0) continue;
      open.length = index;
      if (start >= 0 && open.length < depth) {
        const original = html.slice(start, match.index + token.length);
        const quote = clean(original);
        const markup = original.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<(?:input|img|source|link|meta)\b[^>]*>/gi, "")
          .replace(/<([a-z][\w-]*)\b[^>]*>/gi, (tag, name: string) => {
            const attrs = [...tag.matchAll(/\s(class|data-testid|data-price|aria-label|aria-hidden|hidden)=("[^"]*"|'[^']*')/gi)].map(a => `${a[1]}=${a[2]}`);
            return `<${name}${attrs.length ? " " + attrs.join(" ") : ""}>`;
          })
          .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
        output.push({ markup: markup.slice(0, 12_000), truncated: markup.length > 12_000,
          visibleTextIncluded: Boolean(quote && visibleText.replace(/\s+/g, " ").includes(quote)) });
        start = -1; depth = -1;
      }
      continue;
    }
    const name = token.match(/^<([\w-]+)/)?.[1]?.toLowerCase();
    if (!name || /^(?:input|img|source|link|meta|br|hr|wbr)$/.test(name) || /\/>$/.test(token)) continue;
    open.push(name);
    if (start < 0 && /(?:rdheader-budget__icon|class=["']rstdtl-course-list js-rstdtl-course-list["']|data-testid=["']Menu Item Card["'])/.test(token)) { start = match.index; depth = open.length; }
  }
  return output;
}

interface IndependentPrice { low: number; high: number; meal?: "LUNCH" | "DINNER"; quote: string; ref: string; }
/** Independently reparse retained raw source markup, never normalized claims. */
export function readRawPrices(regions: readonly RawPriceRegion[], ref: string): IndependentPrice[] {
  return regions.flatMap((region, i) => {
    if (region.truncated || !region.visibleTextIncluded || /aria-hidden=["']true/.test(region.markup)) return [];
    const quote = clean(region.markup);
    const budget = /rdheader-budget__icon/.test(region.markup);
    if (budget) {
      const prices = [...quote.matchAll(/(?:JPY|¥)\s*(\d[\d,]*)/g)].map(x => Number(x[1]!.replaceAll(",", "")));
      const meal = /aria-label=["']Dinner["']/.test(region.markup) ? "DINNER" as const : /aria-label=["']Lunch["']/.test(region.markup) ? "LUNCH" as const : undefined;
      return meal && prices.length === 2 && prices[0]! > 0 && prices[1]! >= prices[0]! ? [{ low: prices[0]!, high: prices[1]!, meal, quote, ref: `${ref}[${i}]` }] : [];
    }
    // A drink add-on cannot establish a complete meal price. Preserve lunch
    // restrictions instead of comparing it to an after-work dinner request.
    if (/optional menu|add[ -]?on|オプション|追加/i.test(quote) || !/course|set menu|コース|套餐/i.test(quote)) return [];
    const value = /data-testid=["']Menu Item Card["']/.test(region.markup)
      ? region.markup.match(/data-price=["'](\d+(?:\.0+)?)["']/)?.[1]
      : clean(region.markup.match(/<span\b[^>]*class=["']rstdtl-course-list__price-num["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "").match(/(?:JPY|¥)\s*(\d[\d,]*)/)?.[1];
    const amount = value ? Number(value.replaceAll(",", "")) : NaN;
    if (!Number.isSafeInteger(amount) || amount <= 0) return [];
    const lunch = /lunch|ランチ|昼食/i.test(quote), dinner = /dinner|ディナー|夕食/i.test(quote);
    return [{ low: amount, high: amount, ...(lunch !== dinner ? { meal: lunch ? "LUNCH" as const : "DINNER" as const } : {}), quote, ref: `${ref}[${i}]` }];
  });
}

export interface IndependentPriceCondition { status: "MET" | "NOT_MET" | "NOT_CHECKED"; basis: string[]; evidenceRefs: string[]; }
export function independentPriceCondition(root: RunRecord, candidateId: string, criterionText: string, applicableFacts?: EvidenceRecord[]): IndependentPriceCondition | undefined {
  const text = criterionText.normalize("NFKC").toLowerCase();
  if (!/(?:yen|jpy|¥|円|budget|price|cost)/.test(text)) return undefined;
  const numeric = text.match(/(?:¥|jpy)\s*(\d[\d,]*)|(\d[\d,]*)\s*(?:yen|jpy|円)/)?.slice(1).find(Boolean);
  if (!numeric || !/around|about|approximately|approx\.?|under|no more than|at most|up to|less than|以下|以内|約/.test(text)) return undefined;
  const amount = Number(numeric.replaceAll(",", ""));
  if (policy.status !== "USER_APPROVED" || !(policy.aroundPriceTolerance >= 0 && policy.aroundPriceTolerance < 1)) throw Error("Unapproved independent price policy");
  const domain = root.finalSnapshot?.domainState, shownAt = domain?.presentedResults?.presentedAt;
  const facts = (applicableFacts ?? domain?.readEvidence)?.filter(x => x.kind === "RESTAURANT_FACT" && x.provider !== "MODEL_JUDGMENT" && x.candidateId === candidateId && x.sourceUrl) ?? [];
  const traces = [...root.diagnostics?.browserTrace ?? [], ...root.sourceTrace?.browserTrace ?? []];
  const latest = new Map<string, { at: number; prices: IndependentPrice[] }>();
  for (const trace of traces) {
    const url = trace.detail?.url;
    if (trace.kind !== "SNAPSHOT" || !url || !facts.some(x => x.sourceUrl === url) || !trace.at || !shownAt || Date.parse(trace.at) > Date.parse(shownAt)) continue;
    const regions = trace.detail?.priceRegions;
    if (!regions?.length) continue;
    const at = Date.parse(trace.at); if (at < (latest.get(url)?.at ?? -Infinity)) continue;
    latest.set(url, { at, prices: readRawPrices(regions as RawPriceRegion[], `rawSnapshot[${trace.sequence}].priceRegions`) });
  }
  const time = root.materializedCase?.semantic?.time;
  const start = time?.value ?? time?.start, end = time?.value ?? time?.end;
  const meal = start && start >= "17:00" ? "DINNER" : end && end <= "15:00" ? "LUNCH" : undefined;
  const prices = [...latest.values()].flatMap(x => x.prices).filter(price => !price.meal || meal && price.meal === meal);
  if (!prices.length) return { status: "NOT_CHECKED", basis: ["No applicable independently retained raw meal-price region; missing data is not a contradiction."], evidenceRefs: [] };
  const around = /around|about|approximately|approx\.?|約/.test(text);
  const lower = around ? amount * (1 - policy.aroundPriceTolerance) : 0, upper = around ? amount * (1 + policy.aroundPriceTolerance) : amount;
  return { status: prices.some(price => price.low <= upper && price.high >= lower) ? "MET" : "NOT_MET",
    basis: prices.map(price => `Independent raw price: ${price.quote}; tax retained without conversion.`), evidenceRefs: prices.map(price => price.ref) };
}
