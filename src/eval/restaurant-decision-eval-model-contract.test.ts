import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import { ModelGatewayError } from "../core/model/errors.js";
import {
  RESTAURANT_DECISION_EVAL_OUTPUT_SCHEMA,
  RESTAURANT_DECISION_EVAL_PROMPT_VERSION,
  RESTAURANT_DECISION_EVAL_PURPOSE,
  RestaurantDecisionEvalModelContract,
  validateDecisionEvalModelProposal,
  type DecisionEvalModelInput,
} from "./restaurant-decision-eval-model-contract.js";

class QueuedGateway implements ModelGateway {
  readonly calls: ModelRequest[] = [];

  constructor(private readonly replies: Array<ModelResponse | Error>) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.calls.push(request);
    const next = this.replies.shift();
    if (next === undefined) throw new Error("No queued model response");
    if (next instanceof Error) throw next;
    return next;
  }
}

function response(outputText: string, finishReason: ModelResponse["finishReason"] = "STOP"): ModelResponse {
  return {
    invocationId: crypto.randomUUID(),
    provider: "FIXTURE",
    model: "fixture-decision-v1",
    outputText,
    finishReason,
    latencyMs: 7,
  };
}

const input: DecisionEvalModelInput = {
  taskId: "eval:decision:DGS01:DGS01-T01",
  turnId: "DGS01-T01",
  userMessage: "Tomorrow evening, four people, Western food near Ginza.",
  referenceTime: "2026-08-10T10:00:00+09:00",
  timezone: "Asia/Tokyo",
  accumulatedState: {
    target: { kind: "OPEN" },
    positivePreferences: [],
    negativePreferences: [],
    hardConstraints: [],
  },
  candidateContext: [
    {
      id: "ginza-western-bistro-lune",
      facts: [
        {
          id: "ginza-western-bistro-lune.outlet-name",
          field: "outletName",
          value: "Bistro Lune Ginza",
        },
      ],
    },
  ],
};

function validProposal(): string {
  return JSON.stringify({
    statePatch: {
      set: {
        time: { date: "2026-08-11", precision: "DAYPART", daypart: "DINNER" },
        party: { min: 4, max: 4, precision: "EXACT" },
        location: { kind: "AREA", query: "Ginza" },
        target: { kind: "CATEGORY", query: "Western food" },
      },
    },
    readiness: "RECOMMENDATION_READY",
    nextAction: { type: "SHOW_RECOMMENDATIONS" },
    recommendation: {
      candidateIds: ["ginza-western-bistro-lune"],
      explainsInsufficientCandidates: false,
    },
    grounding: {
      stateFactRefs: ["state.time", "state.party", "state.location", "state.target"],
      candidateFactRefs: ["ginza-western-bistro-lune.outlet-name"],
      claimLabels: [],
      candidateDisclosures: [],
    },
  });
}

test("Decision Eval Model Contract sends a bounded server-side JSON proposal request", async () => {
  const gateway = new QueuedGateway([response(validProposal())]);
  const contract = new RestaurantDecisionEvalModelContract(gateway);

  const result = await contract.propose(input);

  assert.equal(result.status, "PARSED");
  assert.equal(result.attempts.length, 1);
  assert.equal(gateway.calls.length, 1);
  const request = gateway.calls[0];
  assert.ok(request !== undefined);
  assert.equal(request.purpose, RESTAURANT_DECISION_EVAL_PURPOSE);
  assert.equal(request.promptVersion, RESTAURANT_DECISION_EVAL_PROMPT_VERSION);
  assert.deepEqual(request.outputSchema, RESTAURANT_DECISION_EVAL_OUTPUT_SCHEMA);
  assert.equal(request.responseFormat, "JSON_OBJECT");
  assert.equal(request.fallback, "FAIL_CLOSED");
  assert.equal(request.timeoutMs, 10_000);
  assert.equal(request.maxOutputTokens, 900);
  assert.equal(request.temperature, 0);
  assert.equal(request.thinking, "disabled");
  assert.equal(request.messages[0]?.content.includes("never return retrievedCandidateIds"), true);
  assert.equal(request.messages[1]?.content.includes("Bistro Lune Ginza"), true);
});

test("Decision Eval Model Contract retries exactly once after invalid JSON or schema", async () => {
  const gateway = new QueuedGateway([
    response("not JSON"),
    response(validProposal()),
  ]);
  const contract = new RestaurantDecisionEvalModelContract(gateway);

  const result = await contract.propose(input);

  assert.equal(result.status, "PARSED");
  assert.equal(result.attempts.length, 2);
  assert.equal(gateway.calls.length, 2);
  assert.equal(
    gateway.calls[1]?.messages[0]?.content.includes("prior completion was invalid"),
    true,
  );
});

test("Decision Eval Model Contract rejects unsupported retrieval output and fails closed", async () => {
  const invalid = JSON.stringify({
    ...JSON.parse(validProposal()),
    retrievedCandidateIds: ["ginza-western-bistro-lune"],
  });
  const gateway = new QueuedGateway([response(invalid), response(invalid)]);
  const contract = new RestaurantDecisionEvalModelContract(gateway);

  const result = await contract.propose(input);

  assert.equal(result.status, "INVALID_MODEL_OUTPUT");
  assert.equal(result.fallback, "FAIL_CLOSED");
  assert.equal(result.attempts.length, 2);
  assert.equal(result.errors.some((error) => error.includes("retrievedCandidateIds")), true);
});

test("Decision Eval Model Contract rejects unknown nested state and action fields", () => {
  const raw = JSON.parse(validProposal()) as Record<string, unknown>;
  const statePatch = raw.statePatch as { set: Record<string, unknown> };
  statePatch.set.invented = "no";
  const action = raw.nextAction as Record<string, unknown>;
  action.untrusted = "no";

  const validation = validateDecisionEvalModelProposal(raw);

  assert.equal(validation.valid, false);
  if (!validation.valid) {
    assert.equal(validation.errors.some((error) => error.includes("unsupported state fields")), true);
    assert.equal(validation.errors.some((error) => error.includes("cannot include parameters")), true);
  }
});

test("Decision Eval Model Contract separates provider failure and does not retry it", async () => {
  const gateway = new QueuedGateway([
    new ModelGatewayError("provider rejected", "PROVIDER_REJECTED", false, 400),
  ]);
  const contract = new RestaurantDecisionEvalModelContract(gateway);

  const result = await contract.propose(input);

  assert.equal(result.status, "MODEL_FAILURE");
  if (result.status === "MODEL_FAILURE") {
    assert.equal(result.errorCode, "PROVIDER_REJECTED");
    assert.equal(result.retryable, false);
    assert.equal(result.fallback, "FAIL_CLOSED");
  }
  assert.equal(gateway.calls.length, 1);
});

test("Decision Eval Model Contract rejects invalid input before calling a provider", async () => {
  const gateway = new QueuedGateway([response(validProposal())]);
  const contract = new RestaurantDecisionEvalModelContract(gateway);

  const result = await contract.propose({ ...input, turnId: "not a valid turn id" });

  assert.equal(result.status, "INPUT_INVALID");
  assert.equal(result.fallback, "FAIL_CLOSED");
  assert.equal(gateway.calls.length, 0);
});
