import type { RestaurantCandidate } from "../../../domains/restaurant/contracts.js";
import type { BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import type { GooglePlacesSourceName } from "../../../integrations/google/google-places-contracts.js";
import { locateNamedSourceFragment } from "../../../integrations/restaurant-search/named-source-query.js";
import { inspectTabelogEntity, prioritizeTabelogOutlets } from "../../../integrations/tabelog/tabelog-entity-resolver.js";
import { parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets } from "../../../integrations/tabelog/tabelog-page-parser.js";
import type { TabelogOutletObservation } from "../../../integrations/tabelog/tabelog-contracts.js";

export const NAMED_RETRIEVAL_SIMULATION = "named-retrieval-4-plus-1@1";
type SavedRead = { page: BrowserSnapshot; problem?: never } | { page?: never; problem: string };

/** Eval only. No source adapter, model, transport, state or booking action. */
export async function simulateNamedRetrieval(input: {
  candidate: RestaurantCandidate;
  fragmentRecorded: boolean;
  fragmentProposal?: unknown;
  japaneseRecorded: boolean;
  japaneseName?: GooglePlacesSourceName;
  readSearch(query: string): Promise<SavedRead>;
  readDetail(outlet: TabelogOutletObservation): Promise<SavedRead>;
}) {
  const searches: Array<{ query: string; kind: "ORIGINAL" | "FRAGMENT" | "JAPANESE"; ordered: TabelogOutletObservation[] }> = [];
  const details: Array<{ url: string; query: string; phase: "FIRST_FOUR" | "JAPANESE" | "RETURNED_FIFTH"; problem?: string }> = [];
  const uncertainties: string[] = [];
  const pending: Array<{ outlet: TabelogOutletObservation; query: string }> = [];
  const visited = new Set<string>(), queried = new Set<string>();
  const enriched: ReturnType<typeof parseTabelogOutletIdentityWithEvidence>["outlet"][] = [];
  const normalized = (query: string) => query.normalize("NFKC").trim().toLocaleLowerCase();
  const inspect = () => inspectTabelogEntity(input.candidate, enriched);
  const matched = () => !uncertainties.length && inspect().resolution.confidence === "HIGH";
  async function search(query: string, kind: "ORIGINAL" | "FRAGMENT" | "JAPANESE") {
    if (queried.has(normalized(query))) return [];
    queried.add(normalized(query));
    const read = await input.readSearch(query);
    if (!read.page) {
      uncertainties.push(`${kind}_SEARCH:${read.problem}`);
      searches.push({ query, kind, ordered: [] });
      return [];
    }
    const ordered = prioritizeTabelogOutlets(input.candidate, parseTabelogSearchOutlets(read.page));
    searches.push({ query, kind, ordered });
    return ordered;
  }
  async function read(outlets: Array<{ outlet: TabelogOutletObservation; query: string }>, limit: number,
    phase: "FIRST_FOUR" | "JAPANESE" | "RETURNED_FIFTH") {
    for (const item of outlets) {
      if (visited.has(item.outlet.sourceUrl)) continue;
      if (details.length >= limit) break;
      visited.add(item.outlet.sourceUrl);
      const saved = await input.readDetail(item.outlet);
      if (!saved.page) {
        uncertainties.push(`DETAIL:${saved.problem}:${item.outlet.sourceUrl}`);
        details.push({ url: item.outlet.sourceUrl, query: item.query, phase, problem: saved.problem });
        continue;
      }
      enriched.push(parseTabelogOutletIdentityWithEvidence(saved.page, item.outlet).outlet);
      details.push({ url: item.outlet.sourceUrl, query: item.query, phase });
    }
  }
  function finish() {
    const identity = inspect();
    return { evaluator: NAMED_RETRIEVAL_SIMULATION,
      status: uncertainties.length ? "NOT_EVALUATED" : identity.resolution.confidence === "HIGH" ? "MATCH" : "NO_MATCH",
      acceptedUrl: matched() ? identity.resolution.outlet?.sourceUrl ?? null : null,
      searches, details, uncertainties, identity,
      deferred: pending.filter(row => !visited.has(row.outlet.sourceUrl)).map(row => row.outlet.sourceUrl),
      bounds: { searches: searches.length, details: details.length, realGET: 0, realModel: 0, google: 0 },
      scope: "EVAL_SIMULATION_NOT_PRODUCT_PATH_OR_LIVE" };
  }
  const original = input.candidate.restaurant.outletName;
  let query = original;
  for (const kind of ["ORIGINAL", "FRAGMENT"] as const) {
    if (kind === "FRAGMENT") {
      if (!input.fragmentRecorded) uncertainties.push("UNRECORDED_FRAGMENT_PROPOSAL");
      const fragment = locateNamedSourceFragment(input.candidate, input.fragmentProposal)?.query;
      if (!fragment) continue;
      query = fragment;
    }
    const outlets = await search(query, kind);
    const batch = outlets.map(outlet => ({ outlet, query }));
    pending.push(...batch);
    await read(batch, 4, "FIRST_FOUR");
    if (matched()) return finish();
  }
  if (!input.japaneseRecorded) uncertainties.push("UNRECORDED_JAPANESE_NAME");
  const japanese = input.japaneseName;
  if (japanese && (japanese.placeId !== input.candidate.restaurant.sourceIds.googlePlaces || !japanese.text.trim())) {
    uncertainties.push("JAPANESE_NAME_NOT_BOUND_TO_ORIGINAL_PLACE_ID");
  } else if (japanese && !queried.has(normalized(japanese.text))) {
    const outlets = await search(japanese.text, "JAPANESE");
    await read(outlets.map(outlet => ({ outlet, query: japanese.text })), 5, "JAPANESE");
    if (matched()) return finish();
  }
  // No new Japanese candidate (or fewer than the remaining slots): return all
  // unused capacity to the previously observed order. Total never resets.
  await read(pending, 5, "RETURNED_FIFTH");
  return finish();
}
