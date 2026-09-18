import type {
  ModelFinishReason,
  ModelGateway,
  ModelProvider,
  ModelResponse,
  ModelUsage,
} from "../../core/model/contracts.js";
import { ModelGatewayError, type ModelGatewayErrorCode } from "../../core/model/errors.js";
import type { RestaurantAgentContext } from "./agent-context.js";
import {
  RESTAURANT_AGENT_ACTION_SCHEMA,
  RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA,
  type RestaurantAgentAction,
  normalizeRestaurantAgentActionStrictWire,
  validateRestaurantAgentAction,
} from "./agent-action.js";
import type { RestaurantAgentCapability } from "./restaurant-capabilities.js";

export const RESTAURANT_AGENT_DECISION_PURPOSE = "restaurant_agent_decide" as const;
export const RESTAURANT_AGENT_DECISION_PROMPT_VERSION = "14" as const;
/**
 * Strict-function responses include a provider envelope as well as the action
 * arguments.  Ten discovery candidates can otherwise make a valid second
 * decision hit DeepSeek's output cap before the tool call is complete.
 */
export const RESTAURANT_AGENT_DECISION_MAX_OUTPUT_TOKENS = 512;

export interface RestaurantAgentDecisionInput {
  taskId: string;
  context: RestaurantAgentContext;
  recentExecutionHistory: Array<{ type: string; detail: string }>;
  capabilities: readonly RestaurantAgentCapability[];
  lastRejection?: { code: string; reason: string };
}

export interface RestaurantAgentModelAttempt {
  invocationId: string;
  provider: ModelProvider;
  model: string;
  purpose: typeof RESTAURANT_AGENT_DECISION_PURPOSE;
  promptVersion: typeof RESTAURANT_AGENT_DECISION_PROMPT_VERSION;
  outputSchema: typeof RESTAURANT_AGENT_ACTION_SCHEMA;
  finishReason: ModelFinishReason;
  latencyMs: number;
  usage?: ModelUsage;
  providerRequestId?: string;
}

export type RestaurantAgentDecisionResult =
  | {
      status: "PROPOSED";
      action: RestaurantAgentAction;
      decisionSummary?: string;
      modelAttempt: RestaurantAgentModelAttempt;
    }
  | { status: "INVALID_MODEL_OUTPUT"; errors: string[]; modelAttempt?: RestaurantAgentModelAttempt }
  | { status: "MODEL_FAILURE"; errorCode: ModelGatewayErrorCode; retryable: boolean };

export interface RestaurantAgentDecisionPort {
  decide(input: RestaurantAgentDecisionInput): Promise<RestaurantAgentDecisionResult>;
}

/** Deterministic test port for asserting that trajectories arise from proposed actions. */
export class ScriptedRestaurantAgentDecisionPort implements RestaurantAgentDecisionPort {
  private index = 0;

  constructor(private readonly actions: readonly RestaurantAgentAction[]) {}

  async decide(_input: RestaurantAgentDecisionInput): Promise<RestaurantAgentDecisionResult> {
    const action = this.actions[this.index];
    if (!action) {
      return { status: "INVALID_MODEL_OUTPUT", errors: ["Scripted Agent has no remaining action"] };
    }
    this.index += 1;
    return {
      status: "PROPOSED",
      action: structuredClone(action),
      decisionSummary: "scripted trajectory action",
      modelAttempt: {
        invocationId: `scripted-agent-${this.index}`,
        provider: "FIXTURE",
        model: "scripted-restaurant-agent",
        purpose: RESTAURANT_AGENT_DECISION_PURPOSE,
        promptVersion: RESTAURANT_AGENT_DECISION_PROMPT_VERSION,
        outputSchema: RESTAURANT_AGENT_ACTION_SCHEMA,
        finishReason: "TOOL_CALLS",
        latencyMs: 0,
      },
    };
  }
}

function toAttempt(response: ModelResponse): RestaurantAgentModelAttempt {
  return {
    invocationId: response.invocationId,
    provider: response.provider,
    model: response.model,
    purpose: RESTAURANT_AGENT_DECISION_PURPOSE,
    promptVersion: RESTAURANT_AGENT_DECISION_PROMPT_VERSION,
    outputSchema: RESTAURANT_AGENT_ACTION_SCHEMA,
    finishReason: response.finishReason,
    latencyMs: response.latencyMs,
    ...(response.usage ? { usage: response.usage } : {}),
    ...(response.providerRequestId ? { providerRequestId: response.providerRequestId } : {}),
  };
}

export function buildRestaurantAgentDecisionSystemPrompt(): string {
  return `You are the single Restaurant Agent deciding one next business action.

Treat the supplied Restaurant Agent Context as the authoritative decision view. User constraints are immutable here: do not reinterpret, loosen, remove, or silently modify them. Do not claim an action or booking happened unless the context says so.

Availability checks have two independent business meanings. inventoryStatus AVAILABLE means a qualifying slot was observed; UNAVAILABLE means a correct, supported source checked the requested constraints and found no qualifying slot. receptionMode says only whether the source explicitly supports reservations, walk-in, both, or remains unknown. UNKNOWN and SOURCE_UNSUPPORTED do not mean unavailable, do not establish walk-in, and never let an absent booking entry become a walk-in claim. Use the candidate observations, sourceAttempts, key evidence gaps, and legalActions in context to choose an appropriate next business action. observedFacts.commercialNotes are the only candidate commercial facts supplied for comparison: each note has a matching source, and an absent note is UNKNOWN. Do not infer a price, tax treatment, private-room minimum, cancellation rule, or no-show rule from another note or candidate.

The context.intentDraft.target.goal determines the delivery standard. RECOMMENDATION is exploratory: partySize alone never makes availability mandatory. AVAILABILITY is a concrete visit requirement and must eventually be supported by a matching current slot; it does not mean that every earlier discovery or fact action requires every eventual slot parameter. If partySize is listed in missingBlockingFields for AVAILABILITY, ask for it before costly broad investigation. Date/time may be a broad authoritative window; preserve it and do not silently replace it with an exact clock value. When a bounded availability read is offered in context, you may use the observed business facts to decide whether it is valuable before presenting; do not claim a seat for a recommendation unless the resulting evidence supports one.

The context.presentation array is code-derived. Use PRESENT_RESULTS only for eligible candidate IDs. selectionFeedback is verbatim user preference feedback, not evidence and not permission to invent a numeric budget or alter the authoritative request. If resultBatchTarget is present, it is an explicit same-condition continuation: deliver exactly that number of eligible restaurants, exclude every listed delivered ID, and continue only through legal source actions until that bounded target can be met or no legal investigation remains. Do not investigate merely to fill a display cap outside such a user-requested batch, but a currently eligible candidate does not forbid another lawful, useful fact or availability observation needed to answer the user's full request. PRESENT_RESULTS pauses a read-only selection session and never selects, authorizes, or submits a booking.

When target.query names specific restaurants to investigate or compare, keep investigation focused on those outlets. Search results can include other branches or unrelated venues: their availability or policies cannot resolve a missing fact about a named outlet. Before proposing any additional read, check that the named candidate ID is actually in the corresponding factInvestigableCandidateIds or checkableCandidateIds list. A missing policy note after a recorded source attempt remains unknown; it does not permit another read for an ID absent from those lists. Once the named outlets have received the relevant permitted availability and commercial-fact reads, present their eligible results and leave unverified facts explicitly unknown; do not expand to other restaurants unless the user requested alternatives. For an open-ended restaurant search, continue choosing relevant candidates normally. Do not skip a still-needed permitted commercial-fact read merely because availability is already known.

INVESTIGATE_CANDIDATE_FACTS is allowed only for context.factInvestigableCandidateIds, at most three at once, and can establish facts for either delivery goal. CHECK_AVAILABILITY is allowed only for context.checkableCandidateIds, at most three at once, and can return request-bound availability plus source facts. A previously checked candidate appears there only when code supplies a recheckReason (expired display evidence or an explicit user refresh); use that bounded recheck instead of treating it as permanently checked. Do not recheck UNKNOWN or UNAVAILABLE candidates unless they are listed as checkable. An explicit matching no-slot observation excludes that candidate for the current request; an unknown, inaccessible, or unapplied condition does not mean no slot or no walk-in. If lastRejection is supplied, choose a different valid action that addresses it; never repeat the same rejected action. SEARCH_RESTAURANTS is available only when context.searchAvailability.available is true. A source budget or stable tool failure is not missing user input: do not ask the user to cure it or retry by changing wording. Never change date, time, area, party size, or HARD criteria yourself.

Use END_READ only if context.readCompletion.allowed is true. It records a bounded normal completion with no grounded result; it does not claim every restaurant is unavailable and it cannot replace a presentation, missing-user question, cancellation, or internal failure.

The strict response transport always requires every wire field. For fields that do not apply to your selected action, return an empty string or an empty array exactly as the schema permits; never put a meaningful value in a field for another action.

Choose exactly one action from the supplied Restaurant capability catalog. A failed read is information; you may choose another valid path. Never assume booking success. Never include provider names, adapter instructions, authorization objects, terms hashes, risks, evidence, state patches, events, tool calls, or chain-of-thought.

Return exactly one JSON object with action fields and an optional short decisionSummary. The summary is for trajectory debugging only and must not contain hidden reasoning.`;
}

function validInput(input: RestaurantAgentDecisionInput): string[] {
  const errors: string[] = [];
  if (!input.taskId.trim()) errors.push("taskId must be non-empty");
  if (input.capabilities.length === 0) errors.push("capabilities must not be empty");
  return errors;
}

/** The model decides an untrusted action only; the coordinator always validates it against State. */
export class RestaurantAgentDecision implements RestaurantAgentDecisionPort {
  constructor(private readonly modelGateway: ModelGateway) {}

  async decide(input: RestaurantAgentDecisionInput): Promise<RestaurantAgentDecisionResult> {
    const inputErrors = validInput(input);
    if (inputErrors.length > 0) return { status: "INVALID_MODEL_OUTPUT", errors: inputErrors };
    let response: ModelResponse;
    try {
      response = await this.modelGateway.complete({
        taskId: input.taskId,
        purpose: RESTAURANT_AGENT_DECISION_PURPOSE,
        promptVersion: RESTAURANT_AGENT_DECISION_PROMPT_VERSION,
        messages: [
          { role: "system", content: buildRestaurantAgentDecisionSystemPrompt() },
          {
            role: "user",
            content: JSON.stringify({
              context: input.context,
              recentExecutionHistory: input.recentExecutionHistory,
              capabilities: input.capabilities,
              ...(input.lastRejection ? { lastRejection: input.lastRejection } : {}),
            }),
          },
        ],
        responseFormat: "JSON_SCHEMA",
        outputSchema: {
          ...RESTAURANT_AGENT_ACTION_SCHEMA,
          jsonSchema: RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA,
        },
        timeoutMs: 10_000,
        fallback: "FAIL_CLOSED",
        maxOutputTokens: RESTAURANT_AGENT_DECISION_MAX_OUTPUT_TOKENS,
        temperature: 0,
        thinking: "disabled",
      });
    } catch (error) {
      const modelError = error instanceof ModelGatewayError
        ? error
        : new ModelGatewayError("Restaurant Agent decision failed", "NETWORK", true);
      return { status: "MODEL_FAILURE", errorCode: modelError.code, retryable: modelError.retryable };
    }

    const modelAttempt = toAttempt(response);
    if (response.finishReason !== "TOOL_CALLS") {
      return {
        status: "INVALID_MODEL_OUTPUT",
        errors: [`Model response finished with ${response.finishReason}`],
        modelAttempt,
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.outputText);
    } catch {
      return { status: "INVALID_MODEL_OUTPUT", errors: ["Model response is not valid JSON"], modelAttempt };
    }
    const wire = normalizeRestaurantAgentActionStrictWire(parsed);
    if (!wire.valid) {
      return { status: "INVALID_MODEL_OUTPUT", errors: wire.errors, modelAttempt };
    }
    const validation = validateRestaurantAgentAction(wire.value);
    if (!validation.valid) {
      return { status: "INVALID_MODEL_OUTPUT", errors: validation.errors, modelAttempt };
    }
    return {
      status: "PROPOSED",
      action: validation.value.action,
      ...(validation.value.decisionSummary ? { decisionSummary: validation.value.decisionSummary } : {}),
      modelAttempt,
    };
  }
}
