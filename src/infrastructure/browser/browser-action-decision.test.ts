import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import { BrowserReadDecisionError, ModelBrowserReadActionDecision } from "./browser-action-decision.js";

const input = {
  taskId: "task:browser-wire",
  source: "TABLECHECK" as const,
  stage: "DISCOVERY" as const,
  objective: "Read public search results.",
  progress: "A public result is not yet visible.",
  skills: { generic: "observe then re-observe", source: "use public results" },
  goal: { outlet: { name: "Sushi Inase" }, date: "2026-09-10", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: ["omakase"] },
  observation: {
    revision: 1,
    url: "https://www.tablecheck.com/en/japan/search",
    title: "Search",
    visibleText: "No result",
    targets: [{ ref: "observation:1:target:1", kind: "BUTTON" as const, role: "button", label: "Show results" }],
  },
};

function gateway(output: Record<string, string>): ModelGateway {
  return {
    async complete(_request: ModelRequest): Promise<ModelResponse> {
      return {
        invocationId: "browser-wire",
        provider: "FIXTURE",
        model: "fixture",
        outputText: JSON.stringify(output),
        finishReason: "TOOL_CALLS",
        latencyMs: 1,
      };
    },
  };
}

test("strict browser wire COMPLETE accepts only a current observed placeholder and restores target-free canonical action", async () => {
  const decision = new ModelBrowserReadActionDecision(gateway({
    action: "COMPLETE",
    targetRef: "observation:1:target:1",
    authoritativeField: "NONE",
    reason: "The read-only page is ready.",
  }));
  assert.deepEqual(await decision.decide(input), { type: "COMPLETE", reason: "The read-only page is ready." });
});

test("strict browser wire COMPLETE rejects a fabricated placeholder or an authoritative field", async () => {
  const fabricated = new ModelBrowserReadActionDecision(gateway({
    action: "COMPLETE",
    targetRef: "observation:1:target:999",
    authoritativeField: "NONE",
    reason: "Ready.",
  }));
  await assert.rejects(() => fabricated.decide(input), (error: unknown) => error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT");

  const authority = new ModelBrowserReadActionDecision(gateway({
    action: "COMPLETE",
    targetRef: "",
    authoritativeField: "DATE",
    reason: "Ready.",
  }));
  await assert.rejects(() => authority.decide(input), (error: unknown) => error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT");
});

test("strict browser wire restores an authoritative calendar-button action", async () => {
  const decision = new ModelBrowserReadActionDecision(gateway({
    action: "CLICK_AUTHORITATIVE",
    targetRef: "observation:1:target:1",
    authoritativeField: "DATE",
    reason: "Choose the requested calendar day.",
  }));
  assert.deepEqual(await decision.decide(input), {
    type: "CLICK_AUTHORITATIVE",
    targetRef: "observation:1:target:1",
    field: "DATE",
    reason: "Choose the requested calendar day.",
  });
});
