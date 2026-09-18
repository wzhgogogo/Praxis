import type {
  RestaurantAvailabilityCheck,
  RestaurantAvailabilityRead,
  RestaurantAvailabilityRequest,
  RestaurantCandidateFactUpdate,
  RestaurantReadEvidence,
  RestaurantReadExecutionMetadata,
} from "../../domains/restaurant/contracts.js";
import type { RestaurantAvailabilityProvider } from "./contracts.js";

const PROVIDER_ORDER = ["TABLECHECK", "TABELOG"] as const;

function hintedProviderOrder(request: RestaurantAvailabilityRequest): readonly RestaurantAvailabilityProvider["provider"][] {
  const hint = request.candidates[0]?.restaurant.sourceIds.googleWebsiteUri;
  if (!hint) return PROVIDER_ORDER;
  try {
    const hostname = new URL(hint).hostname.toLocaleLowerCase("en-US");
    // A discovery URL may influence which provider is inspected first, but it
    // is not itself identity or availability evidence. The selected provider
    // must still prove the exact outlet before querying its controls.
    if (hostname === "www.tabelog.com" || hostname === "tabelog.com") return ["TABELOG", "TABLECHECK"];
    if (hostname === "www.tablecheck.com" || hostname === "tablecheck.com") return PROVIDER_ORDER;
  } catch {
    // An invalid/unrelated discovery pointer never changes the safe default.
  }
  return PROVIDER_ORDER;
}

function singleCandidateRequest(
  request: RestaurantAvailabilityRequest,
  candidateId: string,
): RestaurantAvailabilityRequest {
  const candidate = request.candidates.find((item) => item.restaurant.id === candidateId);
  if (!candidate) throw new Error(`Availability source resolver cannot bind unknown candidate ${candidateId}`);
  return { ...request, candidateIds: [candidateId], candidates: [structuredClone(candidate)] };
}

function stableFailureCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : "PROVIDER_READ_FAILED";
}

function usable(check: RestaurantAvailabilityCheck | undefined): check is RestaurantAvailabilityCheck & { status: "AVAILABLE" | "UNAVAILABLE" } {
  return check !== undefined && (check.status === "AVAILABLE" || check.status === "UNAVAILABLE");
}

/**
 * Deterministic Restaurant-only source routing. It is intentionally not a dynamic
 * provider registry and does not expose provider choice to the Agent.
 */
export class AvailabilitySourceResolver {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  private readonly providers: RestaurantAvailabilityProvider[];

  constructor(
    tableCheck: RestaurantAvailabilityProvider,
    tabelog: RestaurantAvailabilityProvider,
    private readonly options: { afterRead?: () => Promise<void> } = {},
  ) {
    if (tableCheck.provider !== "TABLECHECK" || tabelog.provider !== "TABELOG") {
      throw new Error("Availability source resolver requires TABLECHECK followed by TABELOG providers");
    }
    this.providers = [tableCheck, tabelog];
  }

  async check(request: RestaurantAvailabilityRequest, signal: AbortSignal): Promise<RestaurantAvailabilityRead> {
    const startedAt = Date.now();
    const offers = [] as RestaurantAvailabilityRead["offers"];
    const evidence = [] as RestaurantReadEvidence[];
    const resultCandidateFactUpdates = [] as RestaurantCandidateFactUpdate[];
    const availabilityChecks: Record<string, RestaurantAvailabilityCheck> = {};
    const attempts: NonNullable<RestaurantReadExecutionMetadata["providerAttempts"]> = [];
    const providersUsed = new Set<RestaurantAvailabilityProvider["provider"]>();
    let lastBrowser: RestaurantReadExecutionMetadata["browser"];

    try {
      for (const candidateId of request.candidateIds) {
        const candidateRequest = singleCandidateRequest(request, candidateId);
        let conclusive = false;
        let lastCheck: RestaurantAvailabilityCheck | undefined;
        const candidateEvidence: RestaurantReadEvidence[] = [];
        const accumulatedCandidateFactUpdates: RestaurantCandidateFactUpdate[] = [];
        for (const providerName of hintedProviderOrder(candidateRequest)) {
          const provider = this.providers.find((item) => item.provider === providerName);
          if (!provider) continue;
          try {
            const read = await provider.check(candidateRequest, signal);
            const check = read.availabilityChecks[candidateId];
            lastBrowser = read.metadata.browser ?? lastBrowser;
            providersUsed.add(provider.provider);
            candidateEvidence.push(...read.evidence
              .filter((item) => item.candidateId === candidateId)
              .map((item) => structuredClone(item)));
            accumulatedCandidateFactUpdates.push(...(read.candidateFactUpdates ?? [])
              .filter((item) => item.candidateId === candidateId)
              .map((item) => structuredClone(item)));
            if (check) lastCheck = structuredClone(check);
            if (usable(check)) {
              conclusive = true;
              attempts.push({ candidateId, provider: provider.provider, outcome: check.status });
              availabilityChecks[candidateId] = {
                ...structuredClone(check),
                sourceAttempts: attempts
                  .filter((attempt) => attempt.candidateId === candidateId)
                  .map((attempt) => ({
                    source: attempt.provider,
                    outcome: attempt.outcome === "PROVIDER_FAILURE" ? "FAILED" : attempt.outcome,
                    ...(attempt.failureCode ? { reasonCode: attempt.failureCode } : {}),
                  })),
              };
              offers.push(...read.offers.filter((offer) => offer.restaurantId === candidateId).map((offer) => structuredClone(offer)));
              evidence.push(...candidateEvidence);
              resultCandidateFactUpdates.push(...accumulatedCandidateFactUpdates);
              break;
            }
            attempts.push({
              candidateId,
              provider: provider.provider,
              outcome: "PROVIDER_FAILURE",
              failureCode: check?.reasonCode ?? read.metadata.failureCode ?? "PROVIDER_OBSERVATION_MISSING",
            });
          } catch (error) {
            if (signal.aborted) throw error;
            attempts.push({ candidateId, provider: provider.provider, outcome: "PROVIDER_FAILURE", failureCode: stableFailureCode(error) });
          }
        }
        if (!conclusive) {
          evidence.push(...candidateEvidence);
          resultCandidateFactUpdates.push(...accumulatedCandidateFactUpdates);
          availabilityChecks[candidateId] = {
            ...(lastCheck ? structuredClone(lastCheck) : {}),
            status: "UNKNOWN",
            checkedAt: lastCheck?.checkedAt ?? new Date().toISOString(),
            evidenceIds: [...new Set(candidateEvidence.map((item) => item.evidenceId))],
            reasonCode: lastCheck?.reasonCode ?? "AVAILABILITY_SOURCES_EXHAUSTED",
            sourceAttempts: attempts
              .filter((attempt) => attempt.candidateId === candidateId)
              .map((attempt) => ({
                source: attempt.provider,
                outcome: attempt.outcome === "PROVIDER_FAILURE" ? "FAILED" : attempt.outcome,
                ...(attempt.failureCode ? { reasonCode: attempt.failureCode } : {}),
              })),
          };
        }
      }
      const allFailed = request.candidateIds.every((candidateId) => {
        const check = availabilityChecks[candidateId];
        return check?.status === "UNKNOWN" && (check.sourceAttempts?.length ?? 0) >= PROVIDER_ORDER.length &&
          check?.sourceAttempts?.every((attempt) => attempt.outcome === "FAILED");
      });
      return {
        offers,
        availabilityChecks,
        evidence,
        ...(resultCandidateFactUpdates.length ? { candidateFactUpdates: resultCandidateFactUpdates } : {}),
        metadata: {
          provider: providersUsed.size === 1 ? [...providersUsed][0]! : "AVAILABILITY_SOURCE_RESOLVER",
          route: this.executionRoute,
          latencyMs: Date.now() - startedAt,
          ...(allFailed ? { failureCode: "AVAILABILITY_SOURCES_EXHAUSTED" } : {}),
          providerAttempts: attempts,
          ...(lastBrowser ? { browser: lastBrowser } : {}),
        },
      };
    } finally {
      await this.options.afterRead?.();
    }
  }
}
