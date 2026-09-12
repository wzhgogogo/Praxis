import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantCandidate, RestaurantCandidateFactRead, RestaurantCandidateFactRequest } from "../../domains/restaurant/contracts.js";
import type { RestaurantFactJudgmentPort } from "./model-fact-judgment.js";

function accumulatedModelUsage(results: Awaited<ReturnType<RestaurantFactJudgmentPort["judge"]>>[]): { calls: number; inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined {
  const usages = results.flatMap((result) => result.modelUsage ? [result.modelUsage] : []);
  if (!usages.length) return undefined;
  const sum = (key: "inputTokens" | "outputTokens" | "totalTokens") => {
    const values = usages.map((item) => item.usage?.[key]).filter((value): value is number => typeof value === "number");
    return values.length ? values.reduce((total, value) => total + value, 0) : undefined;
  };
  const inputTokens = sum("inputTokens"); const outputTokens = sum("outputTokens"); const totalTokens = sum("totalTokens");
  return { calls: usages.length, ...(inputTokens !== undefined ? { inputTokens } : {}), ...(outputTokens !== undefined ? { outputTokens } : {}), ...(totalTokens !== undefined ? { totalTokens } : {}) };
}

function websitePointer(read: RestaurantCandidateFactRead, candidateId: string): string | undefined {
  const value = read.evidence.find((item) => item.candidateId === candidateId && item.kind === "RESTAURANT_FACT")?.claims.websiteUri;
  return typeof value === "string" && value.trim() ? value : undefined;
}

function candidateWebsitePointer(candidate: RestaurantCandidate): string | undefined {
  const value = candidate.restaurant.sourceIds.googleWebsiteUri;
  return value?.trim() || undefined;
}

function stringClaims(read: RestaurantCandidateFactRead, candidateId: string, key: string): string[] {
  return read.evidence
    .filter((item) => item.candidateId === candidateId && item.kind === "RESTAURANT_FACT")
    .flatMap((item) => Array.isArray(item.claims[key]) && item.claims[key].every((value) => typeof value === "string")
      ? item.claims[key] as string[]
      : []);
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

/** Browser work is gap-driven; an already sufficient Google fact read ends here. */
function needsWebsiteFactEvidence(
  read: RestaurantCandidateFactRead,
  candidateId: string,
  intent: RestaurantCandidateFactRequest["intent"],
): boolean {
  const verifiedPositive = new Set(stringClaims(read, candidateId, "verifiedHardCriteria").map(normalized));
  const verifiedNegative = new Set(stringClaims(read, candidateId, "verifiedNegativeCriteria").map(normalized));
  const positiveMissing = intent.criteria.some((criterion) =>
    criterion.polarity === "POSITIVE" && criterion.strength === "HARD" && !verifiedPositive.has(normalized(criterion.text)),
  );
  const negativeMissing = intent.criteria.some((criterion) =>
    criterion.polarity === "NEGATIVE" && criterion.strength === "HARD" && !verifiedNegative.has(normalized(criterion.text)),
  );
  const hoursMissing = intent.target?.goal === "RECOMMENDATION" && intent.date !== undefined && intent.timeWindow !== undefined && !read.evidence.some((item) =>
    item.candidateId === candidateId && item.kind === "RESTAURANT_FACT" && item.claims.openingHoursMatch === true,
  );
  return positiveMissing || negativeMissing || hoursMissing;
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
    private readonly judgment?: RestaurantFactJudgmentPort,
  ) {}

  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const startedAt = Date.now();
    const google = await this.google.inspectFacts(request, signal);
    const candidates: RestaurantCandidate[] = request.candidates.flatMap((candidate) => {
      const uri = websitePointer(google, candidate.restaurant.id) ?? candidateWebsitePointer(candidate);
      return uri && needsWebsiteFactEvidence(google, candidate.restaurant.id, request.intent) ? [{
        ...candidate,
        restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri: uri } },
      }] : [];
    });
    if (!candidates.length) {
      const judgments = this.judgment
        ? await Promise.all(request.candidates.map((candidate) => this.judgment!.judge({ candidate, intent: request.intent, evidence: google.evidence })))
        : [];
      const modelUsage = accumulatedModelUsage(judgments);
      const evidence = [...google.evidence, ...judgments.flatMap((item) => item.evidence)];
      const factChecks = structuredClone(google.factChecks);
      for (const candidate of request.candidates) {
        const judgmentEvidenceIds = evidence.filter((item) => item.candidateId === candidate.restaurant.id && item.provider === "MODEL_JUDGMENT").map((item) => item.evidenceId);
        if (judgmentEvidenceIds.length && factChecks[candidate.restaurant.id]) factChecks[candidate.restaurant.id]!.evidenceIds.push(...judgmentEvidenceIds);
      }
      return { ...google, evidence, factChecks, metadata: { ...google.metadata, latencyMs: Date.now() - startedAt, ...(modelUsage ? { modelUsage } : {}) } };
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
    const sourceEvidence = [...google.evidence, ...website.evidence];
    const judgments = this.judgment
      ? await Promise.all(request.candidates.map((candidate) => this.judgment!.judge({ candidate, intent: request.intent, evidence: sourceEvidence })))
      : [];
    const modelUsage = accumulatedModelUsage(judgments);
    const evidence = [...sourceEvidence, ...judgments.flatMap((item) => item.evidence)];
    for (const candidate of request.candidates) {
      const judgmentEvidenceIds = evidence.filter((item) => item.candidateId === candidate.restaurant.id && item.provider === "MODEL_JUDGMENT").map((item) => item.evidenceId);
      if (judgmentEvidenceIds.length && factChecks[candidate.restaurant.id]) factChecks[candidate.restaurant.id]!.evidenceIds.push(...judgmentEvidenceIds);
    }
    return {
      evidence,
      factChecks,
      metadata: {
        provider: website.evidence.length ? "RESTAURANT_WEBSITE" : google.metadata.provider,
        route: this.website.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(modelUsage ? { modelUsage } : {}),
        ...(google.metadata.failureCode ? { failureCode: google.metadata.failureCode } : website.metadata.failureCode ? { failureCode: website.metadata.failureCode } : {}),
      },
    };
  }
}
