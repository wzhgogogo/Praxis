import type { ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import type { BrowserReadDecisionInput } from "../../infrastructure/browser/browser-action-decision.js";

/** Constructed-source model double only. Never used for recorded model wires. */
export function scriptedBrowserObservation(request: ModelRequest): ModelResponse | undefined {
  if (request.purpose !== "browser_read_decide") return undefined;
  const input = JSON.parse(request.messages.find(m => m.role === "user")!.content) as BrowserReadDecisionInput;
  const targets = input.observation.targets;
  let action = "COMPLETE", targetRef = "", authoritativeField = "NONE";
  const query = targets.find(t => t.kind === "INPUT" && t.formObservation && (t.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL") || t.value === input.goal.retrievalExpression));
  if (input.stage === "DISCOVERY" && query && query.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL") && query.value !== input.goal.retrievalExpression) {
    action = "FILL_AUTHORITATIVE"; targetRef = query.ref; authoritativeField = "RETRIEVAL";
  } else if (input.stage === "DISCOVERY" && query && (input.progress?.includes("No positive source result binding") || ![...new URL(input.observation.url).searchParams.values()].includes(input.goal.retrievalExpression ?? ""))) {
    const submit = targets.find(t => t.kind === "BUTTON" && t.formObservation?.owner === query.formObservation?.owner && t.formMethod === "GET");
    if (submit) { action = "CLICK"; targetRef = submit.ref; }
  } else if (input.stage !== "DISCOVERY") {
    const usable=(t:typeof targets[number],a:string)=>{if(!/^(?:CLICK_AUTHORITATIVE|FILL_AUTHORITATIVE|CHOOSE_OPTION):(?:DATE|PARTY_SIZE)$/.test(a))return false;const field=a.split(":")[1];if(t.kind==="INPUT"&&t.type!==(field==="DATE"?"date":"number"))return false;return t.kind!=="INPUT"||t.value!==(field==="DATE"?input.goal.date:String(input.goal.partySize));};
    const control = targets.find(t => t.availableActions?.some(a => usable(t,a)));
    const offered = control?.availableActions?.find(a => usable(control,a));
    if (control && offered) { [action, authoritativeField] = offered.split(":") as [string, string]; targetRef = control.ref; }
  }
  return { invocationId: "constructed-observation", provider: "FIXTURE", model: "observed-controls", outputText: JSON.stringify({ action, targetRef, authoritativeField, requestedState: "NONE", reason: "Choose from the current constructed page; production verifies all evidence." }), finishReason: "TOOL_CALLS", latencyMs: 0 };
}
