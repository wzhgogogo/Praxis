import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantCandidate, RestaurantCandidateFactRead, RestaurantCandidateFactRequest } from "../../domains/restaurant/contracts.js";

function websitePointer(read: RestaurantCandidateFactRead, candidateId: string): string | undefined {
  const value = read.evidence.find((item) => item.candidateId === candidateId && item.kind === "RESTAURANT_FACT")?.claims.websiteUri;
  return typeof value === "string" && value.trim() ? value : undefined;
}

/**
 * One bounded candidate-fact chain: stable Google Place Details first, then a
 * candidate website only when Google supplied a website pointer.  The browser
 * source produces its own evidence; Google metadata never masquerades as page
 * content.  Both reads are attached to the same authoritative request.
 */
export class GoogleThenWebsiteFactRead implements RestaurantCandidateFactPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;

  constructor(
    private readonly google: RestaurantCandidateFactPort,
    private readonly website: RestaurantCandidateFactPort,
  ) {}

  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const startedAt = Date.now();
    const google = await this.google.inspectFacts(request, signal);
    const candidates: RestaurantCandidate[] = request.candidates.flatMap((candidate) => {
      const uri = websitePointer(google, candidate.restaurant.id);
      return uri ? [{
        ...candidate,
        restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri: uri } },
      }] : [];
    });
    if (!candidates.length) {
      return { ...google, metadata: { ...google.metadata, latencyMs: Date.now() - startedAt } };
    }
    const website = await this.website.inspectFacts({ ...request, candidateIds: candidates.map((candidate) => candidate.restaurant.id), candidates }, signal);
    const factChecks: RestaurantCandidateFactRead["factChecks"] = { ...google.factChecks };
    for (const candidate of candidates) {
      const websiteCheck = website.factChecks[candidate.restaurant.id]!;
      const googleCheck = google.factChecks[candidate.restaurant.id]!;
      factChecks[candidate.restaurant.id] = {
        status: websiteCheck.status === "COMPLETED" || googleCheck.status === "COMPLETED" ? "COMPLETED" : "UNKNOWN",
        checkedAt: websiteCheck.checkedAt,
        evidenceIds: [...googleCheck.evidenceIds, ...websiteCheck.evidenceIds],
        ...(websiteCheck.reasonCode ? { reasonCode: websiteCheck.reasonCode } : googleCheck.reasonCode ? { reasonCode: googleCheck.reasonCode } : {}),
      };
    }
    return {
      evidence: [...google.evidence, ...website.evidence],
      factChecks,
      metadata: {
        provider: website.evidence.length ? "RESTAURANT_WEBSITE" : google.metadata.provider,
        route: this.website.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(google.metadata.failureCode ? { failureCode: google.metadata.failureCode } : website.metadata.failureCode ? { failureCode: website.metadata.failureCode } : {}),
      },
    };
  }
}
