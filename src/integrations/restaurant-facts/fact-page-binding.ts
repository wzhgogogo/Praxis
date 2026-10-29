import type { RestaurantFactPageObservation } from "./fact-source-document.js";

export interface RestaurantFactPageBinding {
  candidateId: string; sourceUrl: string; readRunId: string; startedAt: string;
}
const publicUrl = (value: string): boolean => {
  try { const url = new URL(value); return /^https?:$/u.test(url.protocol) && !url.username && !url.password; }
  catch { return false; }
};
/** Shared by G1 answers and source-fact selection; neither trusts a model's outlet or URL. */
export function isRestaurantFactPageBound(page: RestaurantFactPageObservation, binding: RestaurantFactPageBinding, now: string): boolean {
  const identity = page.identity, started = Date.parse(binding.startedAt);
  const readAt = Date.parse(page.observedAt), identityAt = Date.parse(identity.observedAt);
  return page.candidateId === binding.candidateId && identity.candidateId === binding.candidateId
    && page.readRunId === binding.readRunId && page.requestedSourceUrl === binding.sourceUrl
    && identity.kind === "ENTITY_MATCH" && identity.entityMatch?.confidence === "HIGH"
    && ["TABELOG", "TABLECHECK", "RESTAURANT_WEBSITE"].includes(identity.provider)
    && !!identity.sourceEntityId && !!identity.evidenceId && typeof identity.claims.outletName === "string" && !!identity.claims.outletName.trim()
    && identity.sourceUrl === page.snapshot.url && publicUrl(page.snapshot.url)
    && Number.isFinite(identityAt) && identityAt >= started && identityAt <= readAt
    && Number.isFinite(readAt) && readAt >= started && readAt <= Date.parse(now);
}
