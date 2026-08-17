import type {
  RestaurantSemanticInterpretInput,
  RestaurantSemanticInterpretResult,
} from "../../domains/restaurant/semantic-interpreter.js";
import type { RestaurantSemanticRegressionInterpreter } from "./regression.js";
import { restaurantSemanticRegressionProposalFor } from "./stage-oracles.js";

export class RestaurantSemanticRegressionFixtureInterpreter
  implements RestaurantSemanticRegressionInterpreter
{
  readonly inputs: RestaurantSemanticInterpretInput[] = [];

  async interpret(input: RestaurantSemanticInterpretInput): Promise<RestaurantSemanticInterpretResult> {
    this.inputs.push(input);
    const proposal = restaurantSemanticRegressionProposalFor(input.message);
    if (!proposal) throw new Error(`Unexpected exposed Regression message: ${input.message}`);
    return { status: "PROPOSED", proposal: structuredClone(proposal), attempts: [] };
  }
}
