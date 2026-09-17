import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import { executeFixedSourceCase } from "./fixed-source-case-execution.js";
import { loadRegisteredFixedSourceCase } from "./fixed-source-case-registry.js";

function response(outputText: string, invocationId: string): ModelResponse {
  return { invocationId, provider: "FIXTURE", model: "deadline-control", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

test("a frozen business clock cannot freeze the real outer deadline or admit a late model result", async () => {
  const { registration, materializedCase } = await loadRegisteredFixedSourceCase("h001");
  let resolveLate: ((value: ModelResponse) => void) | undefined;
  let calls = 0;
  const model: ModelGateway = { complete(_request: ModelRequest) {
    calls += 1;
    return new Promise<ModelResponse>((resolve) => { resolveLate = resolve; });
  } };
  const started = Date.now();
  const result = await executeFixedSourceCase({ registration, materializedCase, model, taskId: "deadline:frozen-business-clock", deadlineMs: 20, clock: { now: () => new Date(materializedCase.reference_time) } });
  assert.equal(result.execution.status, "CANCELLED");
  assert.equal(result.execution.failureCode, "CANCELLED");
  assert.ok(result.elapsedMs < 500, `deadline did not bound execution: ${result.elapsedMs}ms`);
  assert.equal(calls, 1, "the deadline must stop later model/agent work from starting");
  const terminal = structuredClone(result.execution);
  resolveLate?.(response('{"schemaVersion":"3","facts":[]}', "late-semantic"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(result.execution, terminal, "a late child result cannot overwrite the already-finalized execution record");
  assert.ok(Date.now() - started < 500);
});

test("a result that completes before the deadline retains its normal terminal outcome", async () => {
  const { registration, materializedCase } = await loadRegisteredFixedSourceCase("h001");
  const actions = ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"];
  const model: ModelGateway = { async complete(request) {
    if (request.purpose === "restaurant_semantic_interpret") {
      return response(JSON.stringify({ schemaVersion: "3", facts: [
        { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase near Shibuya" } },
        { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-19", raw: "tonight" } },
        { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
        { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
        { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
        { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", polarity: "POSITIVE", strength: "HARD" } },
      ] }), "semantic");
    }
    const type = actions.shift();
    const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context?: { candidates?: Array<{ id: string }> } };
    const candidateIds = payload.context?.candidates?.map((candidate) => candidate.id) ?? [];
    return response(JSON.stringify({ type, question: "", relatedFields: [], retrievalHint: "", candidateIds: type === "CHECK_AVAILABILITY" || type === "PRESENT_RESULTS" ? candidateIds : [], candidateId: "", offerId: "", decisionSummary: "deadline normal control" }), `agent:${type}`);
  } };
  const result = await executeFixedSourceCase({ registration, materializedCase, model, taskId: "deadline:normal", deadlineMs: 1_000 });
  assert.deepEqual(result.execution, { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" });
});
