import type { ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import type { BrowserReadDecisionInput } from "../../infrastructure/browser/browser-action-decision.js";

/** Constructed-source model double only. Never used for recorded model wires. */
export function scriptedBrowserObservation(request: ModelRequest): ModelResponse | undefined {
  if (request.purpose !== "browser_read_decide") return undefined;
  const input = JSON.parse(request.messages.find(m => m.role === "user")!.content) as BrowserReadDecisionInput;
  const targets = input.observation.targets;
  let action = "COMPLETE", targetRef = "", authoritativeField = "NONE";
  const query = targets.find(t => t.kind === "INPUT" && t.formObservation && t.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL"));
  if (input.stage === "DISCOVERY" && query && query.value !== input.goal.retrievalExpression) {
    action = "FILL_AUTHORITATIVE"; targetRef = query.ref; authoritativeField = "RETRIEVAL";
  } else if (input.stage === "DISCOVERY" && query && ![...new URL(input.observation.url).searchParams.values()].includes(input.goal.retrievalExpression ?? "")) {
    const submit = targets.find(t => t.kind === "BUTTON" && t.formObservation?.owner === query.formObservation?.owner && t.formMethod === "GET");
    if (submit) { action = "CLICK"; targetRef = submit.ref; }
  } else if (input.stage !== "DISCOVERY") {
    const control = targets.find(t => t.availableActions?.some(a => /^(?:CLICK_AUTHORITATIVE|FILL_AUTHORITATIVE|CHOOSE_OPTION):(?:DATE|PARTY_SIZE)$/.test(a)));
    const offered = control?.availableActions?.find(a => /^(?:CLICK_AUTHORITATIVE|FILL_AUTHORITATIVE|CHOOSE_OPTION):(?:DATE|PARTY_SIZE)$/.test(a));
    if (control && offered) { [action, authoritativeField] = offered.split(":") as [string, string]; targetRef = control.ref; }
  }
  return { invocationId: "constructed-observation", provider: "FIXTURE", model: "observed-controls", outputText: JSON.stringify({ action, targetRef, authoritativeField, requestedState: "NONE", reason: "Choose from the current constructed page; production verifies all evidence." }), finishReason: "TOOL_CALLS", latencyMs: 0 };
}
