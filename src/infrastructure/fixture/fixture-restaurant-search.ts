import type {
  ExecutableCandidate,
  RestaurantBookingIntent,
} from "../../domains/restaurant/contracts.js";

function candidate(intent: RestaurantBookingIntent, index: number): ExecutableCandidate {
  const restaurantId = `fixture-restaurant-${index}`;
  const earliest = intent.timeWindow.earliest;
  return {
    restaurant: {
      id: restaurantId,
      outletName: `Fixture Yakiniku Shinjuku ${index}`,
      sourceIds: { fixture: `fixture-${index}` },
      address: `${index}-1 Shinjuku, Tokyo`,
      coordinates: { lat: 35.69 + index / 1_000, lng: 139.7 + index / 1_000 },
      provenance: { outletName: "fixture", address: "fixture" },
    },
    offer: {
      id: `fixture-offer-${index}`,
      restaurantId,
      source: "fixture",
      dateTime: `${intent.date}T${earliest}:00+09:00`,
      timezone: "Asia/Tokyo",
      partySize: intent.partySize,
      seating: "TABLE",
      price: { amount: 4_400 + index * 200, currency: "JPY", basis: "PER_PERSON" },
      cancellationTerms: "Fixture only — no real reservation or cancellation terms.",
      bookingMode: "INSTANT",
      executionMode: "DEEPLINK",
      checkedAt: "2026-08-05T09:00:00.000Z",
      expiresAt: "2026-08-05T09:30:00.000Z",
    },
    matchReasons: ["Fixture match for the requested area", "Fixture availability for the requested time"],
    warnings: ["Fixture data only — availability is not real."],
    executionConfidence: "LOW",
  };
}

/** Local-only read adapter for the Stage 2A vertical slice. */
export class FixtureRestaurantSearch {
  async search(intent: RestaurantBookingIntent): Promise<ExecutableCandidate[]> {
    return [candidate(intent, 1), candidate(intent, 2), candidate(intent, 3)];
  }

  async revalidate(candidate: ExecutableCandidate): Promise<ExecutableCandidate> {
    return structuredClone(candidate);
  }
}
