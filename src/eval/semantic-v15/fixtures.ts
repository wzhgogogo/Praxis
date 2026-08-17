import type {
  RestaurantDecision,
  RestaurantIntentDraft,
} from "../../domains/restaurant/contracts.js";

export const RESTAURANT_SEMANTIC_REGRESSION_DATASET_ID =
  "restaurant-semantic-regression-v2";
export const RESTAURANT_SEMANTIC_REGRESSION_DATASET_VERSION = "2";
export const RESTAURANT_SEMANTIC_REGRESSION_REFERENCE_TIME = "2026-08-05T09:00:00+09:00";

export interface RestaurantSemanticRegressionTurn {
  id: string;
  message: string;
  expectedDraft: RestaurantIntentDraft;
  expectedDecision: Extract<RestaurantDecision, { type: "ASK_USER" | "SEARCH" }>;
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
  return { schemaVersion: "2", timezone: "Asia/Tokyo", ...input };
}

/**
 * Static, manually labelled development regression for the v16 language-to-state boundary.
 * It covers complete requests, incremental completion, correction, criterion removal,
 * and a named restaurant target without any live restaurant facts.
 */
export const restaurantSemanticRegressionV2: RestaurantSemanticRegressionDataset = {
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
          expectedDraft: draft({ target: { query: "Sushi Dai" }, criteria: [] }),
          expectedDecision: {
            type: "ASK_USER",
            missingRequiredFields: ["date", "timeWindow", "partySize", "area"],
          },
        },
        {
          id: "SR03-T02",
          message: "Tomorrow between 19:00 and 19:30 for two people in Tsukiji.",
          expectedDraft: draft({
            target: { query: "Sushi Dai" },
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
  ],
};

export const restaurantSemanticRegressionTurnCount = restaurantSemanticRegressionV2.sessions.reduce(
  (count, session) => count + session.turns.length,
  0,
);
