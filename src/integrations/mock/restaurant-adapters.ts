import type { ExecutionResult } from "../../core/execution/contracts.js";
import { SideEffectLedger } from "../../core/execution/side-effect-ledger.js";
import type {
  BookingProofBundle,
  BookingVerificationObservation,
  RestaurantAvailabilityRequest,
  RestaurantBookingSelection,
  RestaurantCandidate,
  RestaurantCommand,
  RestaurantSearchRequest,
} from "../../domains/restaurant/contracts.js";

export type MockCommitMode = "SUCCESS" | "FAILURE" | "UNCERTAIN";
export type MockVerificationMode =
  | "CONFIRMED"
  | "ABSENT"
  | "INCONCLUSIVE"
  | "WEAK"
  | "MISMATCHED_DETAILS"
  | "WRONG_ATTEMPT";

export class MockRestaurantSearchAdapter {
  readonly executionRoute = "STRUCTURED_ADAPTER" as const;
  constructor(
    private readonly candidates: RestaurantCandidate[],
    private readonly failure?: string,
    private readonly failureCode?: string,
  ) {}

  async search(_request: RestaurantSearchRequest, _signal: AbortSignal) {
    if (this.failure) {
      const error = Object.assign(new Error(this.failure), this.failureCode ? { code: this.failureCode } : {});
      throw error;
    }
    return {
      candidates: structuredClone(this.candidates),
      evidence: [],
      metadata: { provider: "FIXTURE" as const, route: this.executionRoute, latencyMs: 0 },
    };
  }
}

export class MockAvailabilityAdapter {
  readonly executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER";
  constructor(
    private readonly offers: import("../../domains/restaurant/contracts.js").AvailabilityOffer[],
    private readonly unavailableRestaurantIds: ReadonlySet<string> = new Set(),
    private readonly failure?: string,
    executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER" = "STRUCTURED_ADAPTER",
  ) { this.executionRoute = executionRoute; }

  async check(request: RestaurantAvailabilityRequest, _signal: AbortSignal) {
    if (this.failure) throw new Error(this.failure);
    const offers = this.offers
      .filter((offer) => request.candidateIds.includes(offer.restaurantId))
      .filter((offer) => !this.unavailableRestaurantIds.has(offer.restaurantId))
      .map((offer) => structuredClone(offer));
    const checkedAt = offers[0]?.checkedAt ?? "2026-08-05T09:00:00.000Z";
    return {
      offers,
      availabilityChecks: Object.fromEntries(request.candidateIds.map((candidateId) => {
        const candidateOffer = offers.find((offer) => offer.restaurantId === candidateId);
        return [candidateId, {
          status: candidateOffer ? "AVAILABLE" as const : "UNAVAILABLE" as const,
          checkedAt,
          ...(candidateOffer?.displayExpiresAt ? { displayExpiresAt: candidateOffer.displayExpiresAt } : {}),
          ...(candidateOffer ? { expiresAt: candidateOffer.expiresAt } : {}),
          evidenceIds: [],
        }];
      })),
      evidence: [],
      metadata: { provider: "FIXTURE" as const, route: this.executionRoute, latencyMs: 0 },
    };
  }
}

export class MockBookingExecutor {
  constructor(private readonly ledger: SideEffectLedger, private readonly mode: MockCommitMode) {}

  async commit(
    taskId: string,
    command: Extract<RestaurantCommand, { type: "COMMIT_BOOKING" }>,
    now: string,
  ): Promise<{ result: ExecutionResult; replayed: boolean }> {
    const attemptId = command.attemptId;
    const restaurantId = command.selection.candidate.restaurant.id;
    return this.ledger.executeOnce(
      { idempotencyKey: command.idempotencyKey, taskId, actionType: "BOOK", targetId: restaurantId, attemptedAt: now },
      async () => {
        switch (this.mode) {
          case "SUCCESS": return { status: "SUBMITTED", attemptId, providerReference: `mock-reservation-${restaurantId}`, submittedAt: now } satisfies ExecutionResult;
          case "FAILURE": return { status: "FAILED_BEFORE_SIDE_EFFECT", attemptId, reason: "Mock provider rejected the booking before creating a reservation" } satisfies ExecutionResult;
          case "UNCERTAIN": return { status: "SIDE_EFFECT_UNCERTAIN", attemptId, reason: "Mock connection was lost after submit", submittedAt: now } satisfies ExecutionResult;
        }
      },
    );
  }
}

export class MockBookingVerifier {
  constructor(private readonly mode: MockVerificationMode) {}

  async collect(
    selection: RestaurantBookingSelection,
    executionResult: ExecutionResult,
    now: string,
  ): Promise<BookingVerificationObservation> {
    const evidence = (overrides: Partial<BookingProofBundle> = {}): BookingProofBundle => ({
      evidenceId: `evidence:${executionResult.attemptId}:${this.mode.toLowerCase()}`,
      attemptId: executionResult.attemptId,
      strength: "STRONG",
      source: "MOCK_PROVIDER",
      observedAt: now,
      artifactRef: { kind: "MOCK", reference: `mock://booking/${executionResult.attemptId}` },
      claims: {
        status: "CONFIRMED",
        providerReference: executionResult.status === "SUBMITTED" && executionResult.providerReference
          ? executionResult.providerReference
          : `mock-verified-${selection.candidate.restaurant.id}`,
        restaurantId: selection.candidate.restaurant.id,
        dateTime: selection.offer.dateTime,
        partySize: selection.offer.partySize,
      },
      matchedFields: [],
      missingFields: [],
      conflictingFields: [],
      ...overrides,
    });

    switch (this.mode) {
      case "CONFIRMED": return { status: "EVIDENCE", evidence: evidence(), checkedAt: now };
      case "ABSENT": return { status: "ABSENT", checkedAt: now };
      case "WEAK": return { status: "EVIDENCE", evidence: evidence({ strength: "WEAK", source: "FORM_SUBMITTED", claims: { status: "SUBMITTED" } }), checkedAt: now };
      case "INCONCLUSIVE": return { status: "INCONCLUSIVE", checkedAt: now };
      case "MISMATCHED_DETAILS": return {
        status: "EVIDENCE",
        evidence: evidence({
          claims: {
            status: "CONFIRMED",
            providerReference: executionResult.status === "SUBMITTED" && executionResult.providerReference ? executionResult.providerReference : `mock-verified-${selection.candidate.restaurant.id}`,
            restaurantId: "restaurant-other",
            dateTime: "2026-08-05T20:00:00+09:00",
            partySize: selection.offer.partySize + 2,
          },
        }),
        checkedAt: now,
      };
      case "WRONG_ATTEMPT": return { status: "EVIDENCE", evidence: evidence({ attemptId: `${executionResult.attemptId}:other` }), checkedAt: now };
    }
  }
}
