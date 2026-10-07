import type {
  RestaurantAvailabilityCheck,
  RestaurantAvailabilityRead,
  RestaurantAvailabilityRequest,
  RestaurantCandidateFactUpdate,
  RestaurantReadEvidence,
  RestaurantReadExecutionMetadata,
} from "../../domains/restaurant/contracts.js";
import type { RestaurantAvailabilityProvider } from "./contracts.js";
import type { DiscoverySourcePack } from "../restaurant-search/source-packs.js";

/** A pack owns its provider label and candidate affinity; the resolver only orders bindings. */
export interface AvailabilitySourceBinding {
  pack: Pick<DiscoverySourcePack, "meta" | "availability">;
  provider: RestaurantAvailabilityProvider;
}

function hintedProviderOrder(
  request: RestaurantAvailabilityRequest,
  bindings: readonly AvailabilitySourceBinding[],
): readonly RestaurantAvailabilityProvider[] {
  const candidate = request.candidates[0]?.restaurant;
  if (!candidate) return [];
  const ranked = bindings.map((binding) => ({ binding, affinity: binding.pack.availability?.candidateBinding(candidate) ?? "INAPPLICABLE" }));
  const exclusive = ranked.filter((item) => item.affinity === "EXCLUSIVE");
  if (exclusive.length === 1) return [exclusive[0]!.binding.provider];
  if (exclusive.length > 1) return [];
  const applicable = ranked.filter((item) => item.affinity !== "INAPPLICABLE");
  const byPackPriority = (left: typeof applicable[number], right: typeof applicable[number]) =>
    (right.binding.pack.availability?.availabilityPriority ?? 0) - (left.binding.pack.availability?.availabilityPriority ?? 0);
  return [...applicable.filter((item) => item.affinity === "PREFERRED").sort(byPackPriority), ...applicable.filter((item) => item.affinity === "NEUTRAL").sort(byPackPriority)]
    .map((item) => item.binding.provider);
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

/** Pack-bound deterministic Restaurant routing. Provider choice remains internal to the Adapter. */
export class AvailabilitySourceResolver {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  constructor(
    private readonly bindings: readonly AvailabilitySourceBinding[],
    private readonly options: { afterRead?: () => Promise<void> } = {},
  ) {
    if (!bindings.length || bindings.some(({ pack, provider }) => !pack.availability || pack.availability.provider !== provider.provider)) {
      throw new Error("Availability source resolver requires each provider to be bound by its Pack metadata");
    }
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
        for (const provider of hintedProviderOrder(candidateRequest, this.bindings)) {
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
            if (error && typeof error === "object" && "code" in error && (
              error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"
              || error.code === "MODEL_CALL_BUDGET_EXHAUSTED"
              || error.code === "BROWSER_RUNTIME_UNAVAILABLE"
              || error.code === "BROWSER_ABORTED"
            )) throw error;
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
        const expectedSources = hintedProviderOrder(singleCandidateRequest(request, candidateId), this.bindings).length;
        return expectedSources > 0 && check?.status === "UNKNOWN" && (check.sourceAttempts?.length ?? 0) >= expectedSources &&
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
