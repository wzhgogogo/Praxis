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
    requestedState: "NONE",
    reason: "The read-only page is ready.",
  }));
  assert.deepEqual(await decision.decide(input), { type: "COMPLETE", reason: "The read-only page is ready." });
});

test("strict browser wire COMPLETE rejects a fabricated placeholder or an authoritative field", async () => {
  const fabricated = new ModelBrowserReadActionDecision(gateway({
    action: "COMPLETE",
    targetRef: "observation:1:target:999",
    authoritativeField: "NONE",
    requestedState: "NONE",
    reason: "Ready.",
  }));
  await assert.rejects(() => fabricated.decide(input), (error: unknown) => error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT");

  const authority = new ModelBrowserReadActionDecision(gateway({
    action: "COMPLETE",
    targetRef: "",
    authoritativeField: "DATE",
    requestedState: "NONE",
    reason: "Ready.",
  }));
  await assert.rejects(() => authority.decide(input), (error: unknown) => error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT");
});

test("strict browser wire restores authoritative calendar and time-option actions", async () => {
 for (const field of ["DATE", "TIME"] as const) {
  const decision = new ModelBrowserReadActionDecision(gateway({
    action: "CLICK_AUTHORITATIVE",
    targetRef: "observation:1:target:1",
    authoritativeField: field,
    requestedState: "NONE",
    reason: "Choose the requested calendar day.",
  }));
  assert.deepEqual(await decision.decide(input), {
    type: "CLICK_AUTHORITATIVE",
    targetRef: "observation:1:target:1",
    field,
    reason: "Choose the requested calendar day.",
  });
 }
});

test("strict browser wire restores only bounded observed checkbox, slider, and region actions", async () => {
  const targets = [
    { ref: "observation:1:target:1", kind: "CHECKBOX" as const, role: "checkbox", label: "Sushi", checked: false },
    { ref: "observation:1:target:2", kind: "RANGE" as const, role: "slider", label: "Budget", value: "10", min: "0", max: "15" },
    { ref: "observation:1:target:3", kind: "REGION" as const, role: "dialog", label: "Filters", scrollable: true },
  ];
  const scoped = { ...input, observation: { ...input.observation, targets } };
  assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({
    action: "SET_CHECKED", targetRef: targets[0]!.ref, authoritativeField: "NONE", requestedState: "CHECKED", reason: "Apply the observed public filter.",
  })).decide(scoped), { type: "SET_CHECKED", targetRef: targets[0]!.ref, checked: true, reason: "Apply the observed public filter." });
  assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({
    action: "ADJUST_RANGE", targetRef: targets[1]!.ref, authoritativeField: "NONE", requestedState: "DECREASE", reason: "Move one observed slider step.",
  })).decide(scoped), { type: "ADJUST_RANGE", targetRef: targets[1]!.ref, direction: "DECREASE", reason: "Move one observed slider step." });
  assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({
    action: "SCROLL_REGION", targetRef: targets[2]!.ref, authoritativeField: "NONE", requestedState: "DOWN", reason: "Read the next visible part of this dialog.",
  })).decide(scoped), { type: "SCROLL_REGION", targetRef: targets[2]!.ref, direction: "DOWN", reason: "Read the next visible part of this dialog." });
});
