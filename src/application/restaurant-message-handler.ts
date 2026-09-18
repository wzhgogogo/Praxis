import { compileRestaurantSemanticProposal } from "../domains/restaurant/semantic-compiler.js";
import { applyRestaurantIntentPatch } from "../domains/restaurant/intent-state.js";
import {
  type RestaurantPartySizeSupplementResolver,
} from "../domains/restaurant/party-size-supplement-resolver.js";
import type { RestaurantEvent, RestaurantIntentPatch } from "../domains/restaurant/contracts.js";
import type {
  RestaurantSemanticInterpretInput,
  RestaurantSemanticInterpreter,
} from "../domains/restaurant/semantic-interpreter.js";

export type RestaurantSemanticInterpreterPort = Pick<RestaurantSemanticInterpreter, "interpret">;
export type RestaurantPartySizeSupplementResolverPort = Pick<RestaurantPartySizeSupplementResolver, "resolve">;

export async function supplementMissingAvailabilityPartySize(input: {
  resolver: RestaurantPartySizeSupplementResolverPort | undefined;
  semanticInput: RestaurantSemanticInterpretInput;
  patch: RestaurantIntentPatch;
}): Promise<{ patch: RestaurantIntentPatch; audit?: { status: "RESOLVED" | "UNKNOWN" | "INVALID_MODEL_OUTPUT" | "MODEL_FAILURE" | "INPUT_INVALID"; invocationCount: number; responseAttemptCount: number } }> {
  if (!input.resolver) return { patch: input.patch };
  const projected = applyRestaurantIntentPatch(input.semanticInput.currentDraft, input.patch);
  if (projected.target?.goal !== "AVAILABILITY" || projected.partySize !== undefined) return { patch: input.patch };
  const resolved = await input.resolver.resolve({
    taskId: input.semanticInput.taskId,
    message: input.semanticInput.message,
    currentDraft: projected,
  });
  // The resolver owns only an untrusted count proposal. The composition owns
  // provenance and never overwrites a primary interpreter party value.
  const audit = { status: resolved.status, invocationCount: 1, responseAttemptCount: resolved.attempts.length } as const;
  return resolved.status === "RESOLVED"
    ? { patch: { ...input.patch, partySize: resolved.partySize, partySizeSource: "INFERRED_CLOSED_PARTY" }, audit }
    : { patch: input.patch, audit };
}

export async function restaurantEventForMessage(
  interpreter: RestaurantSemanticInterpreterPort,
  input: RestaurantSemanticInterpretInput,
  partySizeSupplementResolver?: RestaurantPartySizeSupplementResolverPort,
): Promise<RestaurantEvent> {
  const interpreted = await interpreter.interpret(input);
  if (interpreted.status !== "PROPOSED") {
    return {
      type: "SEMANTIC_INTERPRETATION_FAILED",
      status: interpreted.status,
      reason: `Restaurant Semantic Interpreter did not produce a proposal: ${interpreted.status}`,
    };
  }
  const compilation = compileRestaurantSemanticProposal(interpreted.proposal, { referenceTime: input.referenceTime, timezone: input.timezone });
  if (compilation.status !== "COMPILED") {
    return { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict };
  }
  const supplemented = await supplementMissingAvailabilityPartySize({
    resolver: partySizeSupplementResolver,
    semanticInput: input,
    patch: compilation.patch,
  });
  return {
    type: "SEMANTIC_PROPOSAL_COMPILED",
    patch: supplemented.patch,
    ...(supplemented.audit ? { partySizeSupplement: supplemented.audit } : {}),
  };
}
