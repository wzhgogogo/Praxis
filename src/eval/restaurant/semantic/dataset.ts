import gold from "./cases/restaurant-semantic-regression.gold4.json" with { type: "json" };
import type { RestaurantSemanticRegressionDataset } from "./fixtures.js";

/** Exposed development Gold@4; Gold@3 remains frozen in fixtures.ts. */
export const restaurantSemanticRegression: RestaurantSemanticRegressionDataset = gold as RestaurantSemanticRegressionDataset;
export const restaurantSemanticRegressionTurnCount = restaurantSemanticRegression.sessions.reduce(
  (count, session) => count + session.turns.length, 0,
);
