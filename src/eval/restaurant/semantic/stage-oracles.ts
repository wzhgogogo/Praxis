import type { RestaurantSemanticProposal } from "../../../domains/restaurant/semantic-proposal.js";

const criterion = (text: string): RestaurantSemanticProposal["facts"][number] => ({
  field: "CRITERION",
  operation: "ASSERT",
  value: { kind: "CRITERION", text, polarity: "POSITIVE", strength: "UNSPECIFIED" },
});

const explicitDate = (value: string) => ({ kind: "DATE" as const, value, raw: value });
const explicitTimeWindow = (earliest: string, latest: string) => ({
  kind: "TIME_WINDOW" as const, earliest, latest, raw: `${earliest}-${latest}`,
});

const proposals: Readonly<Record<string, RestaurantSemanticProposal>> = {
  "Tomorrow between 19:00 and 19:30 in Shinjuku for two people, yakiniku under 5000 JPY per person.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-06") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("19:00", "19:30") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shinjuku" } },
      criterion("yakiniku"),
      { field: "BUDGET_PER_PERSON", operation: "ASSERT", value: { kind: "BUDGET_PER_PERSON", max: 5000, currency: "JPY" } },
    ],
  },
  "Actually make it three people in Shibuya, and remove yakiniku.": {
    schemaVersion: "3",
    facts: [
      { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 3 } },
      { field: "AREA", operation: "CORRECT", value: { kind: "AREA", query: "Shibuya" } },
      {
        field: "CRITERION",
        operation: "NEGATE",
        value: { kind: "CRITERION", text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" },
      },
    ],
  },
  "I need a table in Shinjuku for two people.": {
    schemaVersion: "3",
    facts: [
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shinjuku" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
    ],
  },
  "Tomorrow between 19:00 and 19:30.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-06") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("19:00", "19:30") },
    ],
  },
  "I want Sushi Dai.": {
    schemaVersion: "3",
    facts: [{ field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "Sushi Dai" } }],
  },
  "Tomorrow between 19:00 and 19:30 for two people in Tsukiji.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-06") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("19:00", "19:30") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Tsukiji" } },
    ],
  },
  "Tomorrow between 18:00 and 18:30 in Ginza for four people, Japanese food.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-06") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("18:00", "18:30") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 4 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Ginza" } },
      criterion("Japanese food"),
    ],
  },
  "This Friday evening near our office for three colleagues and me; no smoking is essential, and a quiet room would be nice.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-07") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("18:00", "21:00") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 4 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near our office" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "smoking", polarity: "NEGATIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "quiet room", polarity: "POSITIVE", strength: "SOFT" } },
    ],
  },
  "Tomorrow afternoon nearby for my parents and me. Around 3,000 yen per person would be ideal.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-06") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("13:00", "17:00") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 3 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "around 3,000 yen per person", polarity: "POSITIVE", strength: "SOFT" } },
    ],
  },
  "In about 30 minutes near me for two people, Korean food.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-05") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("09:30", "09:30") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near me" } },
      criterion("Korean food"),
    ],
  },
  "Tonight at dinner in Ginza for two. I need sushi, but not omakase.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-05") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("18:00", "21:00") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Ginza" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "sushi", polarity: "POSITIVE", strength: "UNSPECIFIED" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", polarity: "NEGATIVE", strength: "UNSPECIFIED" } },
    ],
  },
  "Drop the omakase restriction; keep sushi.": {
    schemaVersion: "3",
    facts: [
      { field: "CRITERION", operation: "NEGATE", value: { kind: "CRITERION", text: "omakase", polarity: "NEGATIVE", strength: "UNSPECIFIED" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "sushi", polarity: "POSITIVE", strength: "UNSPECIFIED" } },
    ],
  },
  "This Saturday night near my hotel for two people, Italian food.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-08") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("19:00", "22:00") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near my hotel" } },
      criterion("Italian food"),
    ],
  },
  "Actually, use the area near our office instead.": {
    schemaVersion: "3",
    facts: [
      { field: "AREA", operation: "CORRECT", value: { kind: "AREA", query: "near our office" } },
    ],
  },
  "Tomorrow after work in Shinjuku for two. The 5,000 yen maximum is firm.": {
    schemaVersion: "3",
    facts: [
      { field: "DATE", operation: "ASSERT", value: explicitDate("2026-08-06") },
      { field: "TIME_WINDOW", operation: "ASSERT", value: explicitTimeWindow("18:00", "20:00") },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shinjuku" } },
      { field: "BUDGET_PER_PERSON", operation: "ASSERT", value: { kind: "BUDGET_PER_PERSON", max: 5000, currency: "JPY" } },
    ],
  },
};

export function restaurantSemanticRegressionProposalFor(
  message: string,
): RestaurantSemanticProposal | undefined {
  const proposal = proposals[message];
  return proposal ? structuredClone(proposal) : undefined;
}
