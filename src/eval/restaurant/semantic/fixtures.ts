import type {
  RestaurantSemanticExpectedDecision,
  RestaurantIntentDraft,
} from "../../../domains/restaurant/contracts.js";

export const RESTAURANT_SEMANTIC_REGRESSION_DATASET_ID =
  "restaurant-semantic-regression-v3";
export const RESTAURANT_SEMANTIC_REGRESSION_DATASET_VERSION = "3";
export const RESTAURANT_SEMANTIC_REGRESSION_REFERENCE_TIME = "2026-08-05T09:00:00+09:00";

export interface RestaurantSemanticRegressionTurn {
  id: string;
  message: string;
  expectedDraft: RestaurantIntentDraft;
  expectedDecision: Extract<RestaurantSemanticExpectedDecision, { type: "ASK_USER" | "SEARCH" }>;
}

export interface RestaurantSemanticRegressionSession {
  id: string;
  turns: readonly RestaurantSemanticRegressionTurn[];
}

export interface RestaurantSemanticRegressionDataset {
  id: string;
  version: string;
  referenceTime: string;
  sessions: readonly RestaurantSemanticRegressionSession[];
}

function draft(
  input: Omit<RestaurantIntentDraft, "schemaVersion" | "timezone">,
): RestaurantIntentDraft {
  return { schemaVersion: "3", timezone: "Asia/Tokyo", ...input };
}

/**
 * Static, manually labelled development regression for the Restaurant language-to-state boundary.
 * It covers HARD/SOFT semantics, negative criteria, relative time and location,
 * party-size inference, corrections, criterion removal, and hard budgets without live facts.
 */
export const restaurantSemanticRegressionV3: RestaurantSemanticRegressionDataset = {
  id: RESTAURANT_SEMANTIC_REGRESSION_DATASET_ID,
  version: RESTAURANT_SEMANTIC_REGRESSION_DATASET_VERSION,
  referenceTime: RESTAURANT_SEMANTIC_REGRESSION_REFERENCE_TIME,
  sessions: [
    {
      id: "SR01-complete-then-correct",
      turns: [
        {
          id: "SR01-T01",
          message:
            "Tomorrow between 19:00 and 19:30 in Shinjuku for two people, yakiniku under 5000 JPY per person.",
          expectedDraft: draft({
            date: "2026-08-06",
            timeWindow: { earliest: "19:00", latest: "19:30" },
            partySize: 2,
            area: { query: "Shinjuku" },
            criteria: [{ text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
            budgetPerPerson: { max: 5000, currency: "JPY" },
          }),
          expectedDecision: { type: "SEARCH" },
        },
        {
          id: "SR01-T02",
          message: "Actually make it three people in Shibuya, and remove yakiniku.",
          expectedDraft: draft({
            date: "2026-08-06",
            timeWindow: { earliest: "19:00", latest: "19:30" },
            partySize: 3,
            area: { query: "Shibuya" },
            criteria: [],
            budgetPerPerson: { max: 5000, currency: "JPY" },
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR02-incremental-completion",
      turns: [
        {
          id: "SR02-T01",
          message: "I need a table in Shinjuku for two people.",
          expectedDraft: draft({ partySize: 2, area: { query: "Shinjuku" }, criteria: [] }),
          expectedDecision: { type: "ASK_USER", missingRequiredFields: ["date", "timeWindow"] },
        },
        {
          id: "SR02-T02",
          message: "Tomorrow between 19:00 and 19:30.",
          expectedDraft: draft({
            date: "2026-08-06",
            timeWindow: { earliest: "19:00", latest: "19:30" },
            partySize: 2,
            area: { query: "Shinjuku" },
            criteria: [],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR03-named-target-then-complete",
      turns: [
        {
          id: "SR03-T01",
          message: "I want Sushi Dai.",
          expectedDraft: draft({ target: { goal: "RECOMMENDATION", query: "Sushi Dai" }, criteria: [] }),
          expectedDecision: {
            type: "ASK_USER",
            missingRequiredFields: ["date", "timeWindow", "partySize", "area"],
          },
        },
        {
          id: "SR03-T02",
          message: "Tomorrow between 19:00 and 19:30 for two people in Tsukiji.",
          expectedDraft: draft({
            target: { goal: "RECOMMENDATION", query: "Sushi Dai" },
            date: "2026-08-06",
            timeWindow: { earliest: "19:00", latest: "19:30" },
            partySize: 2,
            area: { query: "Tsukiji" },
            criteria: [],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR04-simple-complete",
      turns: [
        {
          id: "SR04-T01",
          message: "Tomorrow between 18:00 and 18:30 in Ginza for four people, Japanese food.",
          expectedDraft: draft({
            date: "2026-08-06",
            timeWindow: { earliest: "18:00", latest: "18:30" },
            partySize: 4,
            area: { query: "Ginza" },
            criteria: [{ text: "Japanese food", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR05-relative-time-hard-soft-and-party-inference",
      turns: [
        {
          id: "SR05-T01",
          message:
            "This Friday evening near our office for three colleagues and me; no smoking is essential, and a quiet room would be nice.",
          expectedDraft: draft({
            date: "2026-08-07",
            timeWindow: { earliest: "18:00", latest: "21:00" },
            partySize: 4,
            area: { query: "near our office" },
            criteria: [
              { text: "smoking", polarity: "NEGATIVE", strength: "HARD" },
              { text: "quiet room", polarity: "POSITIVE", strength: "SOFT" },
            ],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR06-approximate-budget-is-soft",
      turns: [
        {
          id: "SR06-T01",
          message:
            "Tomorrow afternoon nearby for my parents and me. Around 3,000 yen per person would be ideal.",
          expectedDraft: draft({
            date: "2026-08-06",
            timeWindow: { earliest: "13:00", latest: "17:00" },
            partySize: 3,
            area: { query: "nearby" },
            criteria: [
              { text: "around 3,000 yen per person", polarity: "POSITIVE", strength: "SOFT" },
            ],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR07-relative-offset-time",
      turns: [
        {
          id: "SR07-T01",
          message: "In about 30 minutes near me for two people, Korean food.",
          expectedDraft: draft({
            date: "2026-08-05",
            timeWindow: { earliest: "09:30", latest: "09:30" },
            partySize: 2,
            area: { query: "near me" },
            criteria: [{ text: "Korean food", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR08-criterion-removal",
      turns: [
        {
          id: "SR08-T01",
          message: "Tonight at dinner in Ginza for two. I need sushi, but not omakase.",
          expectedDraft: draft({
            date: "2026-08-05",
            timeWindow: { earliest: "18:00", latest: "21:00" },
            partySize: 2,
            area: { query: "Ginza" },
            criteria: [
              { text: "sushi", polarity: "POSITIVE", strength: "UNSPECIFIED" },
              { text: "omakase", polarity: "NEGATIVE", strength: "UNSPECIFIED" },
            ],
          }),
          expectedDecision: { type: "SEARCH" },
        },
        {
          id: "SR08-T02",
          message: "Drop the omakase restriction; keep sushi.",
          expectedDraft: draft({
            date: "2026-08-05",
            timeWindow: { earliest: "18:00", latest: "21:00" },
            partySize: 2,
            area: { query: "Ginza" },
            criteria: [{ text: "sushi", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR09-relative-location-overwrite",
      turns: [
        {
          id: "SR09-T01",
          message: "This Saturday night near my hotel for two people, Italian food.",
          expectedDraft: draft({
            date: "2026-08-08",
            timeWindow: { earliest: "19:00", latest: "22:00" },
            partySize: 2,
            area: { query: "near my hotel" },
            criteria: [{ text: "Italian food", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
          }),
          expectedDecision: { type: "SEARCH" },
        },
        {
          id: "SR09-T02",
          message: "Actually, use the area near our office instead.",
          expectedDraft: draft({
            date: "2026-08-08",
            timeWindow: { earliest: "19:00", latest: "22:00" },
            partySize: 2,
            area: { query: "near our office" },
            criteria: [{ text: "Italian food", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
    {
      id: "SR10-hard-budget",
      turns: [
        {
          id: "SR10-T01",
          message: "Tomorrow after work in Shinjuku for two. The 5,000 yen maximum is firm.",
          expectedDraft: draft({
            date: "2026-08-06",
            timeWindow: { earliest: "18:00", latest: "20:00" },
            partySize: 2,
            area: { query: "Shinjuku" },
            criteria: [],
            budgetPerPerson: { max: 5000, currency: "JPY" },
          }),
          expectedDecision: { type: "SEARCH" },
        },
      ],
    },
  ],
};

export const restaurantSemanticRegressionTurnCount = restaurantSemanticRegressionV3.sessions.reduce(
  (count, session) => count + session.turns.length,
  0,
);
