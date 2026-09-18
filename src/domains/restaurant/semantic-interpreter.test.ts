import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import { RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS, RestaurantSemanticInterpreter } from "./semantic-interpreter.js";
import { RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA } from "./semantic-proposal.js";
import { compileRestaurantSemanticProposal } from "./semantic-compiler.js";
import { applyRestaurantIntentPatch } from "./intent-state.js";

class QueuedGateway implements ModelGateway {
  readonly calls: ModelRequest[] = [];

  constructor(private readonly replies: ModelResponse[]) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.calls.push(request);
    const reply = this.replies.shift();
    if (!reply) throw new Error("Unexpected model call");
    return reply;
  }
}

function response(outputText: string): ModelResponse {
  return {
    invocationId: "semantic-invocation-1",
    provider: "DEEPSEEK",
    model: "deepseek-v4-flash",
    outputText,
    finishReason: "TOOL_CALLS",
    latencyMs: 42,
  };
}

test("Semantic Interpreter sends the proposal schema and separates user data from system context", async () => {
  const gateway = new QueuedGateway([
    response(
      JSON.stringify({
        schemaVersion: "3",
        facts: [
          {
            field: "PARTY_SIZE",
            operation: "CORRECT",
            value: { kind: "PARTY_SIZE", value: 3 },
          },
        ],
      }),
    ),
  ]);
  const interpreter = new RestaurantSemanticInterpreter(gateway);

  const result = await interpreter.interpret({
    taskId: "task-restaurant-001",
    message: "Make it three.",
    referenceTime: "2026-08-05T09:00:00+09:00",
    timezone: "Asia/Tokyo",
    currentDraft: {
      schemaVersion: "3",
      timezone: "Asia/Tokyo",
      partySize: 2,
      criteria: [],
    },
  });

  assert.equal(result.status, "PROPOSED");
  assert.equal(gateway.calls.length, 1);
  const request = gateway.calls[0]!;
  assert.equal(request.purpose, "restaurant_semantic_interpret");
  assert.equal(request.promptVersion, "v20");
  assert.deepEqual(request.outputSchema, {
    name: "restaurant-semantic-proposal",
    version: "3",
    jsonSchema: RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA,
  });
  assert.equal(request.responseFormat, "JSON_SCHEMA");
  assert.equal(request.timeoutMs, 30_000, "semantic requests retain the user-authorized 30-second ceiling");
  assert.equal(request.timeoutMs, RESTAURANT_SEMANTIC_REQUEST_TIMEOUT_MS);
  assert.equal(request.maxOutputTokens, 5_000);
  assert.deepEqual(request.messages.map((message) => message.role), ["system", "user"]);
  assert.ok(request.messages[0]!.content.includes("2026-08-05T09:00:00+09:00"));
  assert.match(request.messages[0]!.content, /code, not you, materializes relative dates and times/);
  assert.match(request.messages[0]!.content, /\{"kind":"DATE","value":"YYYY-MM-DD","raw":"the user expression"\}/);
  assert.match(request.messages[0]!.content, /\{"kind":"TIME_WINDOW","earliest":"HH:mm","latest":"HH:mm","raw":"7 PM"\}/);
  assert.match(request.messages[0]!.content, /\{"kind":"TIME_WINDOW","daypart":"AFTERNOON","relativeDay":"TODAY","raw":"this afternoon"\}/);
  assert.ok(request.messages[0]!.content.includes(JSON.stringify({ partySize: 2 })));
  assert.ok(!request.messages[0]!.content.includes("Make it three."));
  assert.equal(
    request.messages[1]!.content,
    'User restaurant message as JSON string: "Make it three."',
  );
});

test("Semantic Interpreter preserves an existing target scope in its bounded model context", async () => {
  const gateway = new QueuedGateway([response(JSON.stringify({ schemaVersion: "3", facts: [] }))]);
  const result = await new RestaurantSemanticInterpreter(gateway).interpret({
    taskId: "target-context",
    message: "Keep the same request.",
    referenceTime: "2026-09-18T09:00:00+09:00",
    timezone: "Asia/Tokyo",
    currentDraft: {
      schemaVersion: "3", timezone: "Asia/Tokyo", criteria: [],
      target: { goal: "RECOMMENDATION", query: "restaurants in Shibuya", selectionScope: "OPEN_ENDED", requestedResultCount: 5 },
    },
  });
  assert.equal(result.status, "PROPOSED");
  assert.ok(gateway.calls[0]?.messages[0]?.content.includes(JSON.stringify({
    target: { goal: "RECOMMENDATION", query: "restaurants in Shibuya", selectionScope: "OPEN_ENDED", requestedResultCount: 5 },
  })));
});

test("Semantic Interpreter rejects a structurally valid-looking state patch", async () => {
  const gateway = new QueuedGateway([
    response(JSON.stringify({ schemaVersion: "3", facts: [], statePatch: { phase: "SEARCHING" } })),
    response(JSON.stringify({ schemaVersion: "3", facts: [], statePatch: { phase: "SEARCHING" } })),
  ]);
  const interpreter = new RestaurantSemanticInterpreter(gateway);

  const result = await interpreter.interpret({
    taskId: "task-restaurant-001",
    message: "Book it.",
    referenceTime: "2026-08-05T09:00:00+09:00",
    timezone: "Asia/Tokyo",
  });

  assert.equal(result.status, "INVALID_MODEL_OUTPUT");
  if (result.status === "INVALID_MODEL_OUTPUT") {
    assert.equal(result.attempts.length, 2);
    assert.match(result.errors.join(" "), /unsupported fields/);
  }
});

test("closed-party and open-group proposals stay distinct through the semantic boundary and compiler", async () => {
  // This is a transport/compiler contract, not a claim that a real model will
  // infer either case correctly. Real-model quality remains a separately
  // authorized evaluation concern.
  const closedGateway = new QueuedGateway([response(JSON.stringify({
    schemaVersion: "3",
    facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2, source: "INFERRED_CLOSED_PARTY" } }],
  }))]);
  const closed = await new RestaurantSemanticInterpreter(closedGateway).interpret({
    taskId: "closed-pair", message: "Dinner with my partner in Shibuya.", referenceTime: "2026-09-18T09:00:00+09:00", timezone: "Asia/Tokyo",
  });
  assert.equal(closed.status, "PROPOSED");
  if (closed.status === "PROPOSED") {
    assert.deepEqual(compileRestaurantSemanticProposal(closed.proposal), { status: "COMPILED", patch: { schemaVersion: "3", partySize: 2, partySizeSource: "INFERRED_CLOSED_PARTY" } });
  }
  const prompt = closedGateway.calls[0]?.messages[0]?.content ?? "";
  assert.match(prompt, /closed participant set/i);
  assert.match(prompt, /singular counterpart contributes one/i);
  assert.match(prompt, /open social group/i);
  assert.match(prompt, /Do not substitute\s+an average or customary group size/i);
  assert.doesNotMatch(prompt, /first-date request is a clear two-person/i);
  assert.match(prompt, /do not add\s+"suitable for"/i);
  assert.match(prompt, /paraphrase cannot change the strength determined from the\s+original user meaning/i);

  const openGateway = new QueuedGateway([response(JSON.stringify({ schemaVersion: "3", facts: [] }))]);
  const open = await new RestaurantSemanticInterpreter(openGateway).interpret({
    taskId: "open-group", message: "Find somewhere for a team dinner in Shibuya.", referenceTime: "2026-09-18T09:00:00+09:00", timezone: "Asia/Tokyo",
  });
  assert.equal(open.status, "PROPOSED");
  if (open.status === "PROPOSED") {
    assert.deepEqual(compileRestaurantSemanticProposal(open.proposal), { status: "COMPILED", patch: { schemaVersion: "3" } });
  }
});

test("party-size transport preserves an enumerated or explicit count and never supplies one for an open or generic request", async () => {
  // The gateway replies are controlled contract fixtures, not an evaluation of
  // a paid model's language understanding. They prove that the Interpreter →
  // Compiler → Draft path neither drops a declared count nor invents one.
  const cases = [
    { id: "enumerated", message: "Dinner with Mei, Ken, and me in Ginza.", facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 3, source: "INFERRED_CLOSED_PARTY" } }], expected: 3, source: "INFERRED_CLOSED_PARTY", currentPartySize: undefined },
    { id: "explicit-override", message: "Make it four people.", facts: [{ field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 4, source: "EXPLICIT" } }], expected: 4, source: "EXPLICIT", currentPartySize: 2 },
    { id: "open-group", message: "Find somewhere for friends and whoever else joins.", facts: [], expected: undefined, source: undefined, currentPartySize: undefined },
    { id: "extra-attendee", message: "Dinner with my partner and possibly colleagues.", facts: [], expected: undefined, source: undefined, currentPartySize: undefined },
    { id: "generic-date", message: "Recommend a romantic dinner for Friday.", facts: [], expected: undefined, source: undefined, currentPartySize: undefined },
  ] as const;

  for (const item of cases) {
    const gateway = new QueuedGateway([response(JSON.stringify({ schemaVersion: "3", facts: item.facts }))]);
    const result = await new RestaurantSemanticInterpreter(gateway).interpret({
      taskId: item.id,
      message: item.message,
      referenceTime: "2026-09-18T09:00:00+09:00",
      timezone: "Asia/Tokyo",
      ...(item.currentPartySize ? { currentDraft: { schemaVersion: "3", timezone: "Asia/Tokyo", partySize: item.currentPartySize, criteria: [] } } : {}),
    });
    assert.equal(result.status, "PROPOSED", item.id);
    if (result.status !== "PROPOSED") continue;
    const compiled = compileRestaurantSemanticProposal(result.proposal);
    assert.equal(compiled.status, "COMPILED", item.id);
    if (compiled.status !== "COMPILED") continue;
    const draft = applyRestaurantIntentPatch(
      item.currentPartySize ? { schemaVersion: "3", timezone: "Asia/Tokyo", partySize: item.currentPartySize, criteria: [] } : undefined,
      compiled.patch,
    );
    assert.equal(draft.partySize, item.expected, item.id);
    assert.equal(draft.partySizeSource, item.source, item.id);
  }
});
