import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import { ModelGatewayError } from "../core/model/errors.js";
import {
  RESTAURANT_DECISION_EVAL_OUTPUT_SCHEMA,
  RESTAURANT_DECISION_EVAL_PROMPT_VERSION,
  RESTAURANT_DECISION_EVAL_PURPOSE,
  RestaurantDecisionEvalModelContract,
  buildRestaurantDecisionEvalSystemPrompt,
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
    preferences: [],
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
    rankedCandidateIds: ["ginza-western-bistro-lune"],
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
  assert.equal(request.maxOutputTokens, 700);
  assert.equal(request.temperature, 0);
  assert.equal(request.thinking, "disabled");
  assert.equal(request.messages[0]?.content.includes("semantic extraction only"), true);
  assert.equal(request.messages[0]?.content.includes("Decision Kernel owns readiness"), true);
  assert.equal(request.messages[0]?.content.includes("Classify each fact into exactly one role"), true);
  assert.equal(request.messages[0]?.content.includes("Relationship words never imply party size"), true);
  assert.equal(request.messages[0]?.content.includes("Travel tolerance belongs to location, never preferences"), true);
  assert.equal(request.messages[0]?.content.includes("anchorQuery"), true);
  assert.equal(request.messages[0]?.content.includes('"kind":"SMOKING_POLICY","value":"FULLY_NON_SMOKING"'), true);
  assert.equal(request.messages[0]?.content.includes('"facet":"CUISINE"|"VIBE"|"MENU_FORMAT"|"FORMALITY"'), true);
  assert.equal(request.messages[0]?.content.includes("Soft cuisine wording remains a CUISINE preference with target OPEN"), true);
  assert.equal(request.messages[0]?.content.includes("Copy namedTargetResolution.target exactly"), true);
  assert.equal(request.messages[0]?.content.includes("positivePreferences"), false);
  assert.equal(request.messages[0]?.content.includes("negativePreferences"), false);
  assert.equal(request.messages[0]?.content.includes("Sora Dining"), false);
  assert.equal(request.messages[0]?.content.includes("Ginza"), false);
  assert.equal(request.messages[0]?.content.includes("Western food"), false);
  assert.equal(request.messages[1]?.content.includes("Bistro Lune Ginza"), true);
});

test("Decision Eval Model Contract keeps static prompt examples free of regression fixture facts", () => {
  const prompt = buildRestaurantDecisionEvalSystemPrompt(1);

  for (const forbiddenFixtureFact of [
    "Sora Dining",
    "Ginza",
    "Western food",
    "intimate, but not a tasting menu",
    "candidate-id",
    "no smoking",
    "willing to travel a little farther for a good restaurant",
    "nothing too formal",
    "Kameido is fine",
  ]) {
    assert.equal(prompt.includes(forbiddenFixtureFact), false, forbiddenFixtureFact);
  }
  assert.equal(prompt.includes("Decision Kernel owns readiness"), true);
  assert.equal(prompt.includes("Classify each fact into exactly one role"), true);
  assert.equal(prompt.includes("A named venue that the user says they want to eat at is RESTAURANT"), false);
  assert.equal(prompt.includes('"occasion":"DATE"'), false);
  assert.equal(prompt.includes("Occasion is explicit social context"), true);
  assert.equal(prompt.includes("Relationship words never imply party size"), true);
  assert.equal(prompt.includes("Soft cuisine wording remains a CUISINE preference with target OPEN"), true);
  assert.equal(prompt.includes("rankedCandidateIds may contain only unique supplied IDs"), true);
  assert.equal(prompt.includes("Travel tolerance belongs to location, never preferences"), true);
  assert.equal(prompt.includes("positivePreferences"), false);
  assert.equal(prompt.includes("negativePreferences"), false);
  assert.ok(prompt.length < 5_000, `v14 prompt is unexpectedly long: ${prompt.length}`);
});

test("Decision Eval Model Contract retries exactly once after invalid JSON or schema", async () => {
  const invalidTimePrecision = JSON.stringify({
    ...JSON.parse(validProposal()),
    statePatch: { set: { time: { date: "2026-08-11", precision: "DATE" } }, add: {}, remove: {} },
  });
  const gateway = new QueuedGateway([
    response(invalidTimePrecision),
    response(validProposal()),
  ]);
  const contract = new RestaurantDecisionEvalModelContract(gateway);

  const result = await contract.propose(input);

  assert.equal(result.status, "PARSED");
  assert.equal(result.attempts.length, 2);
  assert.equal(gateway.calls.length, 2);
  assert.equal(
    gateway.calls[1]?.messages[0]?.content.includes("prior completion failed these validator checks"),
    true,
  );
  assert.equal(
    gateway.calls[1]?.messages[0]?.content.includes("statePatch.set.time.precision must be supported"),
    true,
  );
});

test("Decision Eval Model Contract exposes each completion only to an explicit in-memory diagnostic observer", async () => {
  const diagnostics: Array<{ status: string; outputText: string; errors?: string[]; taskId: string; turnId: string }> = [];
  const gateway = new QueuedGateway([response("not JSON"), response(validProposal())]);
  const contract = new RestaurantDecisionEvalModelContract(gateway, {
    onCompletionDiagnostic(diagnostic) {
      diagnostics.push(diagnostic);
    },
  });

  const result = await contract.propose(input);

  assert.equal(result.status, "PARSED");
  assert.deepEqual(diagnostics.map(({ status, outputText, errors, taskId, turnId }) => ({ status, outputText, errors, taskId, turnId })), [
    {
      status: "INVALID_JSON",
      outputText: "not JSON",
      errors: ["Model response is not valid JSON"],
      taskId: input.taskId,
      turnId: input.turnId,
    },
    {
      status: "PARSED",
      outputText: validProposal(),
      errors: undefined,
      taskId: input.taskId,
      turnId: input.turnId,
    },
  ]);
});

test("Decision Eval Model Contract rejects policy-owned output and fails closed", async () => {
  const invalid = JSON.stringify({
    ...JSON.parse(validProposal()),
    readiness: "RECOMMENDATION_READY",
  });
  const gateway = new QueuedGateway([response(invalid), response(invalid)]);
  const contract = new RestaurantDecisionEvalModelContract(gateway);

  const result = await contract.propose(input);

  assert.equal(result.status, "INVALID_MODEL_OUTPUT");
  assert.equal(result.fallback, "FAIL_CLOSED");
  assert.equal(result.attempts.length, 2);
  assert.equal(result.errors.some((error) => error.includes("readiness")), true);
});

test("Decision Eval Model Contract rejects unknown nested state fields and invalid ranking", () => {
  const raw = JSON.parse(validProposal()) as Record<string, unknown>;
  const statePatch = raw.statePatch as { set: Record<string, unknown> };
  statePatch.set.invented = "no";
  raw.rankedCandidateIds = ["ginza-western-bistro-lune", "ginza-western-bistro-lune"];

  const validation = validateDecisionEvalModelProposal(raw);

  assert.equal(validation.valid, false);
  if (!validation.valid) {
    assert.equal(validation.errors.some((error) => error.includes("unsupported state fields")), true);
    assert.equal(validation.errors.some((error) => error.includes("rankedCandidateIds")), true);
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
