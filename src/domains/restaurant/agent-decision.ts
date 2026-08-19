import type {
  ModelFinishReason,
  ModelGateway,
  ModelProvider,
  ModelResponse,
  ModelUsage,
} from "../../core/model/contracts.js";
import { ModelGatewayError, type ModelGatewayErrorCode } from "../../core/model/errors.js";
import type { BookingProofBundle, RestaurantTaskState } from "./contracts.js";
import {
  RESTAURANT_AGENT_ACTION_JSON_SCHEMA,
  RESTAURANT_AGENT_ACTION_SCHEMA,
  type RestaurantAgentAction,
  validateRestaurantAgentAction,
} from "./agent-action.js";
import type { RestaurantAgentCapability } from "./restaurant-capabilities.js";

export const RESTAURANT_AGENT_DECISION_PURPOSE = "restaurant_agent_decide" as const;
export const RESTAURANT_AGENT_DECISION_PROMPT_VERSION = "1" as const;

export interface RestaurantAgentDecisionInput {
  taskId: string;
  authoritativeState: RestaurantTaskState;
  trustedEvidence?: BookingProofBundle;
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

Treat authoritative state and trusted evidence as truth. User constraints are immutable here: do not reinterpret, loosen, remove, or silently modify them. Do not claim an action or booking happened unless authoritative state or evidence says so.

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
              authoritativeState: input.authoritativeState,
              ...(input.trustedEvidence ? { trustedEvidence: input.trustedEvidence } : {}),
              recentExecutionHistory: input.recentExecutionHistory,
              capabilities: input.capabilities,
              ...(input.lastRejection ? { lastRejection: input.lastRejection } : {}),
            }),
          },
        ],
        responseFormat: "JSON_SCHEMA",
        outputSchema: {
          ...RESTAURANT_AGENT_ACTION_SCHEMA,
          jsonSchema: RESTAURANT_AGENT_ACTION_JSON_SCHEMA,
        },
        timeoutMs: 10_000,
        fallback: "FAIL_CLOSED",
        maxOutputTokens: 300,
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
    const validation = validateRestaurantAgentAction(parsed);
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
