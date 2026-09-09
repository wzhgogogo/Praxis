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
    const candidateFactUpdates = [] as RestaurantCandidateFactUpdate[];
    const availabilityChecks: Record<string, RestaurantAvailabilityCheck> = {};
    const attempts: NonNullable<RestaurantReadExecutionMetadata["providerAttempts"]> = [];
    const providersUsed = new Set<RestaurantAvailabilityProvider["provider"]>();
    let lastBrowser: RestaurantReadExecutionMetadata["browser"];

    try {
      for (const candidateId of request.candidateIds) {
        const candidateRequest = singleCandidateRequest(request, candidateId);
        let conclusive = false;
        for (const providerName of PROVIDER_ORDER) {
          const provider = this.providers.find((item) => item.provider === providerName);
          if (!provider) continue;
          try {
            const read = await provider.check(candidateRequest, signal);
            const check = read.availabilityChecks[candidateId];
            lastBrowser = read.metadata.browser ?? lastBrowser;
            if (usable(check)) {
              conclusive = true;
              providersUsed.add(provider.provider);
              attempts.push({ candidateId, provider: provider.provider, outcome: check.status });
              availabilityChecks[candidateId] = structuredClone(check);
              offers.push(...read.offers.filter((offer) => offer.restaurantId === candidateId).map((offer) => structuredClone(offer)));
              evidence.push(...read.evidence.filter((item) => item.candidateId === candidateId).map((item) => structuredClone(item)));
              candidateFactUpdates.push(...(read.candidateFactUpdates ?? []).filter((item) => item.candidateId === candidateId).map((item) => structuredClone(item)));
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
          availabilityChecks[candidateId] = {
            status: "UNKNOWN",
            checkedAt: new Date().toISOString(),
            evidenceIds: [],
            reasonCode: "AVAILABILITY_SOURCES_EXHAUSTED",
          };
        }
      }
      const allFailed = request.candidateIds.every((candidateId) => availabilityChecks[candidateId]?.reasonCode === "AVAILABILITY_SOURCES_EXHAUSTED");
      return {
        offers,
        availabilityChecks,
        evidence,
        ...(candidateFactUpdates.length ? { candidateFactUpdates } : {}),
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
