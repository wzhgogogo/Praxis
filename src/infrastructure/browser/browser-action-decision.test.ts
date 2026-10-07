import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import { BrowserReadDecisionError, ModelBrowserReadActionDecision, buildBrowserReadDecisionSystemPrompt } from "./browser-action-decision.js";

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

test("runner model-call budget exhaustion remains a task cause, not a browser network failure", async () => {
  const decision = new ModelBrowserReadActionDecision({
    async complete() { throw Object.assign(new Error("run model-call ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" }); },
  });
  await assert.rejects(decision.decide(input), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
});

test("strict browser wire canonicalizes inert page-action envelope fields", async () => {
  const fabricated = new ModelBrowserReadActionDecision(gateway({
    action: "COMPLETE",
    targetRef: "observation:1:target:999",
    authoritativeField: "NONE",
    requestedState: "NONE",
    reason: "Ready.",
  }));
  assert.deepEqual(await fabricated.decide(input), { type: "COMPLETE", reason: "Ready." });

  const authority = new ModelBrowserReadActionDecision(gateway({
    action: "COMPLETE",
    targetRef: "",
    authoritativeField: "DATE",
    requestedState: "NONE",
    reason: "Ready.",
  }));
  assert.deepEqual(await authority.decide(input), { type: "COMPLETE", reason: "Ready." });
});

test("strict browser wire restores authoritative calendar and observed-option actions", async () => {
 for (const field of ["DATE", "TIME"] as const) {
  const action = field === "TIME" ? "CHOOSE_OPTION" : "CLICK_AUTHORITATIVE";
  const decision = new ModelBrowserReadActionDecision(gateway({
    action,
    targetRef: "observation:1:target:1",
    authoritativeField: field,
    requestedState: "NONE",
    reason: "Choose the requested calendar day.",
  }));
  assert.deepEqual(await decision.decide(input), {
    type: action,
    targetRef: "observation:1:target:1",
    field,
    reason: "Choose the requested calendar day.",
  });
 }
});

test("strict browser wire restores bound retrieval input fill and observed query-option selection", async () => {
  const scoped = {
    ...input,
    goal: { ...input.goal, retrievalExpression: "omakase" },
    observation: { ...input.observation, targets: [{ ref: "observation:1:target:1", kind: "INPUT" as const, role: "textbox", label: "Search venues" }] },
  };
  const decision = new ModelBrowserReadActionDecision(gateway({
    action: "FILL_AUTHORITATIVE", targetRef: "observation:1:target:1", authoritativeField: "RETRIEVAL", requestedState: "NONE",
    reason: "Use the current public search expression.",
  }));
  assert.deepEqual(await decision.decide(scoped), {
    type: "FILL_AUTHORITATIVE", targetRef: "observation:1:target:1", field: "RETRIEVAL", reason: "Use the current public search expression.",
  });
  const option = { ...scoped, observation: { ...scoped.observation, targets: [{ ref: "observation:1:target:1", kind: "OPTION" as const, role: "option", label: '"omakase"', ownerRef: "observation:1:target:2" }] } };
  assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({
    action: "CHOOSE_OPTION", targetRef: "observation:1:target:1", authoritativeField: "RETRIEVAL", requestedState: "NONE", reason: "Select the exact public query.",
  })).decide(option), { type: "CHOOSE_OPTION", targetRef: "observation:1:target:1", field: "RETRIEVAL", reason: "Select the exact public query." });
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

test("strict browser wire accepts page-level WAIT with inert envelope fields and rejects unknown fields", async () => {
  const wait = await new ModelBrowserReadActionDecision(gateway({
    action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "Wait for the public result.",
  })).decide(input);
  assert.deepEqual(wait, { type: "WAIT", reason: "Wait for the public result." });

  for (const wire of [
    { action: "WAIT", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "Wait" },
    { action: "WAIT", targetRef: "", authoritativeField: "DATE", requestedState: "NONE", reason: "Wait" },
    { action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "CHECKED", reason: "Wait" },
  ]) assert.deepEqual(await new ModelBrowserReadActionDecision(gateway(wire)).decide(input), { type: "WAIT", reason: "Wait" });
  await assert.rejects(
    () => new ModelBrowserReadActionDecision(gateway({ action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "Wait", authorization: "secret-marker-do-not-log" })).decide(input),
    (error: unknown) => error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT" && !error.message.includes("secret-marker-do-not-log"),
  );
});

test("strict browser wire canonicalizes inert metadata but records a typed rejection for an extra field", async () => {
  const rejected = new ModelBrowserReadActionDecision(gateway({
    action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "Use current control.",
    authorization: "secret-marker-do-not-log",
  }));
  await assert.rejects(
    () => rejected.decide(input),
    (error: unknown) => error instanceof BrowserReadDecisionError
      && error.wireRejection?.action === "CLICK"
      && error.wireRejection.fieldPath === "$.authorization"
      && error.wireRejection.valueType === "string"
      && error.wireRejection.reason === "UNSUPPORTED_FIELD"
      && !JSON.stringify(error.wireRejection).includes("secret-marker-do-not-log"),
  );
  assert.deepEqual(rejected.takeLastWireRecord?.(), {
    action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED",
    extras: [{ fieldPath: "$.authorization", valueType: "string" }],
  });
  assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({
    action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "DATE", requestedState: "CHECKED", reason: "Use current control.",
  })).decide(input), { type: "CLICK", targetRef: "observation:1:target:1", reason: "Use current control." });
});

test("strict browser wire ignores only action-inert metadata", async () => {
  const target = "observation:1:target:1";
  assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({
    action: "FILL_AUTHORITATIVE", targetRef: target, authoritativeField: "RETRIEVAL", requestedState: "CHECKED", reason: "Fill public query.",
  })).decide({ ...input, goal: { ...input.goal, retrievalExpression: "omakase" } }), { type: "FILL_AUTHORITATIVE", targetRef: target, field: "RETRIEVAL", reason: "Fill public query." });
  assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({
    action: "SET_CHECKED", targetRef: target, authoritativeField: "DATE", requestedState: "CHECKED", reason: "Apply filter.",
  })).decide(input), { type: "SET_CHECKED", targetRef: target, checked: true, reason: "Apply filter." });
  await assert.rejects(
    () => new ModelBrowserReadActionDecision(gateway({
      action: "SET_CHECKED", targetRef: target, authoritativeField: "NONE", requestedState: "UP", reason: "Invalid checked state.",
    })).decide(input),
    (error: unknown) => error instanceof BrowserReadDecisionError && error.wireRejection?.fieldPath === "$.requestedState",
  );
});

test("browser record keeps a valid wire shape but redacts its free-text reason", async () => {
  const decision = new ModelBrowserReadActionDecision(gateway({
    action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "A private reason must not be recorded.",
  }));
  await decision.decide(input);
  assert.deepEqual(decision.takeLastWireRecord?.(), {
    action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [],
  });
});

test("browser prompt describes installed public-query controls and page-level recovery", () => {
  const prompt = buildBrowserReadDecisionSystemPrompt();
  assert.match(prompt, /checkbox\/radio, option, range, and region scroll/i);
  assert.match(prompt, /Targeted actions are permitted only when their current availableActions explicitly list them/i);
  assert.match(prompt, /WAIT waits for one bounded visible result change at page level/i);
  assert.match(prompt, /PRESS_ESCAPE closes one page layer then requires a fresh observation/i);
  assert.match(prompt, /installed isolated read boundary may expose ordinary public-query controls/i);
  assert.match(prompt, /including a submit-shaped query control/i);
});
