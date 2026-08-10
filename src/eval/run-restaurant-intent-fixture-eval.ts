import { restaurantIntentEvalFixtureByMessage, restaurantIntentEvalV1 } from "./restaurant-intent-eval-fixtures.js";
import { evaluateRestaurantIntentParser } from "./restaurant-intent-eval.js";

const report = await evaluateRestaurantIntentParser(
  {
    id: "restaurant-intent-fixture-oracle-v1",
    mode: "FIXTURE",
    async parse(input) {
      const expected = restaurantIntentEvalFixtureByMessage.get(input.message);
      if (!expected) {
        throw new Error(`Fixture output not found for message: ${input.message}`);
      }
      return expected;
    },
  },
  restaurantIntentEvalV1,
);

console.log(JSON.stringify(report, null, 2));
