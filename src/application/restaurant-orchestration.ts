import type {
  ExecutableCandidate,
  RestaurantBookingIntent,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { decideRestaurantNext } from "../domains/restaurant/decision-kernel.js";
import { compileRestaurantSemanticProposal } from "../domains/restaurant/semantic-compiler.js";
import type {
  RestaurantSemanticInterpretInput,
  RestaurantSemanticInterpreter,
} from "../domains/restaurant/semantic-interpreter.js";

export type RestaurantSemanticInterpreterPort = Pick<RestaurantSemanticInterpreter, "interpret">;

export interface RestaurantSearchPort {
  search(intent: RestaurantBookingIntent): Promise<ExecutableCandidate[]>;
  revalidate(candidate: ExecutableCandidate): Promise<ExecutableCandidate>;
}

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

export async function executeRestaurantReadCommand(
  command: RestaurantCommand,
  state: Readonly<RestaurantTaskState>,
  search: RestaurantSearchPort,
): Promise<{ event: RestaurantEvent; actor: "SYSTEM" | "ADAPTER" }> {
  switch (command.type) {
    case "DECIDE_RESTAURANT_NEXT":
      return {
        event: { type: "RESTAURANT_DECISION_MADE", decision: decideRestaurantNext(state) },
        actor: "SYSTEM",
      };
    case "SEARCH_RESTAURANTS":
      return {
        event: { type: "SEARCH_COMPLETED", candidates: await search.search(command.intent) },
        actor: "ADAPTER",
      };
    case "REVALIDATE_OFFER":
      return {
        event: { type: "OFFER_REVALIDATED", candidate: await search.revalidate(command.candidate) },
        actor: "ADAPTER",
      };
    default:
      throw new Error(`Restaurant read orchestration cannot execute ${command.type}`);
  }
}
