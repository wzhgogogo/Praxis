import type { ModelInvocationRecord } from "../core/model/contracts.js";
import { RestaurantIntentParser } from "../domains/restaurant/intent-parser.js";
import { DeepSeekModelGateway } from "../infrastructure/deepseek/deepseek-model-gateway.js";
import { restaurantIntentEvalV1 } from "./restaurant-intent-eval-fixtures.js";
import { evaluateRestaurantIntentParser } from "./restaurant-intent-eval.js";
import {
  createRealModelRestaurantIntentEvalParser,
  requireRealModelEvalConfiguration,
  summarizeRealModelEval,
} from "./real-model-eval.js";

const configuration = requireRealModelEvalConfiguration(process.env, restaurantIntentEvalV1.length);
const invocationRecords: ModelInvocationRecord[] = [];
const gateway = DeepSeekModelGateway.fromEnvironment(process.env, {
  observer: {
    observe(record) {
      invocationRecords.push(record);
    },
  },
});
const parser = new RestaurantIntentParser(gateway);
const cases = restaurantIntentEvalV1.slice(0, configuration.caseLimit);
const report = await evaluateRestaurantIntentParser(
  createRealModelRestaurantIntentEvalParser(parser),
  cases,
);

console.log(
  JSON.stringify(
    {
      dataset: "restaurant-intent-eval-v1",
      mode: "REAL_MODEL",
      report,
      modelMetrics: summarizeRealModelEval(
        invocationRecords,
        cases.length,
        configuration.pricing,
      ),
    },
    null,
    2,
  ),
);
