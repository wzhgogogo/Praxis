import type {
  ExecutableCandidate,
  RestaurantBookingIntent,
} from "../domains/restaurant/contracts.js";

export const fixtureIntent: RestaurantBookingIntent = {
  timezone: "Asia/Tokyo",
  date: "2026-08-05",
  timeWindow: { earliest: "19:00", latest: "19:30" },
  partySize: 2,
  area: { query: "Shinjuku", radiusMeters: 2_000 },
  criteria: [{ text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
  budgetPerPerson: { max: 5_000, currency: "JPY" },
};

function candidate(index: number): ExecutableCandidate {
  const restaurantId = `restaurant-${index}`;
  return {
    restaurant: {
      id: restaurantId,
      outletName: `Mock Yakiniku Shinjuku ${index}`,
      sourceIds: { mock: `mock-${index}` },
      address: `${index}-1 Shinjuku, Tokyo`,
      coordinates: { lat: 35.69 + index / 1_000, lng: 139.7 + index / 1_000 },
      provenance: { outletName: "mock", address: "mock" },
    },
    offer: {
      id: `offer-${index}`,
      restaurantId,
      source: "mock",
      dateTime: "2026-08-05T19:00:00+09:00",
      timezone: "Asia/Tokyo",
      partySize: 2,
      seating: "TABLE",
      price: { amount: 4_500 + index * 100, currency: "JPY", basis: "PER_PERSON" },
      cancellationTerms: "Free cancellation until 17:00 JST",
      bookingMode: "INSTANT",
      executionMode: "API",
      checkedAt: "2026-08-05T09:00:00.000Z",
      expiresAt: "2026-08-05T09:30:00.000Z",
    },
    matchReasons: ["Available in the requested time window", "Within budget"],
    warnings: [],
    executionConfidence: "HIGH",
  };
}

export const fixtureCandidates = [candidate(1), candidate(2), candidate(3)];
