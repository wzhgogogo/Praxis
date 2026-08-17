import type { RestaurantSemanticProposal } from "../../domains/restaurant/semantic-proposal.js";

const proposals: Readonly<Record<string, RestaurantSemanticProposal>> = {
  "Tomorrow between 19:00 and 19:30 in Shinjuku for two people, yakiniku under 5000 JPY per person.": {
    schemaVersion: "1",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-06" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:30" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shinjuku" } },
      { field: "CUISINE", operation: "ASSERT", value: { kind: "CUISINE", value: "yakiniku" } },
      { field: "BUDGET_PER_PERSON", operation: "ASSERT", value: { kind: "BUDGET_PER_PERSON", max: 5000, currency: "JPY" } },
    ],
  },
  "Actually make it three people in Shibuya, and remove yakiniku.": {
    schemaVersion: "1",
    facts: [
      { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 3 } },
      { field: "AREA", operation: "CORRECT", value: { kind: "AREA", query: "Shibuya" } },
      { field: "CUISINE", operation: "NEGATE", value: { kind: "CUISINE", value: "yakiniku" } },
    ],
  },
  "I need a table in Shinjuku for two people.": {
    schemaVersion: "1",
    facts: [
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shinjuku" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
    ],
  },
  "Tomorrow between 19:00 and 19:30.": {
    schemaVersion: "1",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-06" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:30" } },
    ],
  },
  "I want Sushi Dai.": {
    schemaVersion: "1",
    facts: [{ field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", query: "Sushi Dai" } }],
  },
  "Tomorrow between 19:00 and 19:30 for two people in Tsukiji.": {
    schemaVersion: "1",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-06" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:30" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Tsukiji" } },
    ],
  },
  "Tomorrow between 18:00 and 18:30 in Ginza for four people, Japanese food.": {
    schemaVersion: "1",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-06" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "18:00", latest: "18:30" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 4 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Ginza" } },
      { field: "CUISINE", operation: "ASSERT", value: { kind: "CUISINE", value: "Japanese" } },
    ],
  },
};

export function restaurantSemanticRegressionProposalFor(
  message: string,
): RestaurantSemanticProposal | undefined {
  const proposal = proposals[message];
  return proposal ? structuredClone(proposal) : undefined;
}
