import { compileRestaurantSemanticProposal } from "../domains/restaurant/semantic-compiler.js";
import type { RestaurantEvent } from "../domains/restaurant/contracts.js";
import type {
  RestaurantSemanticInterpretInput,
  RestaurantSemanticInterpreter,
} from "../domains/restaurant/semantic-interpreter.js";

export type RestaurantSemanticInterpreterPort = Pick<RestaurantSemanticInterpreter, "interpret">;

export async function restaurantEventForMessage(
  interpreter: RestaurantSemanticInterpreterPort,
  input: RestaurantSemanticInterpretInput,
): Promise<RestaurantEvent> {
  const interpreted = await interpreter.interpret(input);
  if (interpreted.status !== "PROPOSED") {
    throw new Error(`Restaurant Semantic Interpreter did not produce a proposal: ${interpreted.status}`);
  }
  const compilation = compileRestaurantSemanticProposal(interpreted.proposal);
  return compilation.status === "COMPILED"
    ? { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compilation.patch }
    : { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict };
}
