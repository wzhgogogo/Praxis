import type {
  AvailabilityOffer,
  RestaurantBookingIntent,
  RestaurantCandidate,
} from "../domains/restaurant/contracts.js";

export const fixtureIntent: RestaurantBookingIntent = {
  timezone: "Asia/Tokyo",
  target: { goal: "AVAILABILITY", query: "find a bookable restaurant" },
  date: "2026-08-05",
  timeWindow: { earliest: "19:00", latest: "19:30" },
  partySize: 2,
  area: { query: "Shinjuku" },
  criteria: [{ text: "yakiniku", polarity: "POSITIVE", strength: "HARD" }],
  budgetPerPerson: { max: 5_000, currency: "JPY" },
};

function candidate(index: number): RestaurantCandidate {
  const restaurantId = `restaurant-${index}`;
  return {
    restaurant: {
      id: restaurantId,
      outletName: `Restaurant ${index}`,
      sourceIds: { fixture: `source-${index}` },
      address: `${index}-1 Shinjuku, Tokyo`,
      provenance: { outletName: "fixture", address: "fixture" },
    },
    matchReasons: ["Matches hard fixture criterion"],
    warnings: [],
    executionConfidence: "HIGH",
  };
}

export const fixtureCandidates = [candidate(1), candidate(2), candidate(3), candidate(4)];

export const fixtureOffers: AvailabilityOffer[] = fixtureCandidates.map((candidate, index) => ({
  id: `offer-${index + 1}`,
  restaurantId: candidate.restaurant.id,
  source: "fixture",
  dateTime: "2026-08-05T19:00:00+09:00",
  timezone: "Asia/Tokyo",
  partySize: 2,
  price: { amount: 4_000 + index * 500, currency: "JPY", basis: "PER_PERSON" },
  cancellationTerms: "Fixture cancellation terms",
  bookingMode: "INSTANT",
  executionMode: "API",
  checkedAt: "2026-08-05T09:00:00.000Z",
  displayExpiresAt: "2026-08-05T09:10:00.000Z",
  expiresAt: "2026-08-05T10:00:00.000Z",
}));
