import type {
  AvailabilityOffer,
  RestaurantAvailabilityRequest,
  RestaurantBookingIntent,
  RestaurantCandidate,
  RestaurantSearchRequest,
} from "../../domains/restaurant/contracts.js";

function candidate(_intent: RestaurantBookingIntent, index: number): RestaurantCandidate {
  const restaurantId = `fixture-restaurant-${index}`;
  return {
    restaurant: {
      id: restaurantId,
      outletName: `Fixture Yakiniku Shinjuku ${index}`,
      sourceIds: { fixture: `fixture-${index}` },
      address: `${index}-1 Shinjuku, Tokyo`,
      coordinates: { lat: 35.69 + index / 1_000, lng: 139.7 + index / 1_000 },
      provenance: { outletName: "fixture", address: "fixture" },
    },
    matchReasons: ["Fixture match for the requested area"],
    warnings: ["Fixture data only — availability is not real."],
    executionConfidence: "LOW",
  };
}

/** Local-only read adapter for the Stage 2A vertical slice. */
export class FixtureRestaurantSearch {
  async search(request: RestaurantSearchRequest, _signal: AbortSignal): Promise<RestaurantCandidate[]> {
    return [candidate(request.intent, 1), candidate(request.intent, 2), candidate(request.intent, 3)];
  }

  async check(request: RestaurantAvailabilityRequest, _signal: AbortSignal): Promise<AvailabilityOffer[]> {
    return request.candidateIds.map((restaurantId, index) => ({
      id: `fixture-offer-${restaurantId}`,
      restaurantId,
      source: "fixture",
      dateTime: `${request.date}T${request.timeWindow.earliest}:00+09:00`,
      timezone: "Asia/Tokyo",
      partySize: request.partySize,
      seating: "TABLE",
      price: { amount: 4_400 + index * 200, currency: "JPY", basis: "PER_PERSON" },
      cancellationTerms: "Fixture only — no real reservation or cancellation terms.",
      bookingMode: "INSTANT",
      executionMode: "DEEPLINK",
      checkedAt: "2026-08-19T09:00:00.000Z",
      expiresAt: "2026-12-31T23:59:00.000Z",
    }));
  }
}
