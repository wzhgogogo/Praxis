import type { ModelRequest } from "../../../../core/model/contracts.js";
import { createHash } from "node:crypto";
import { browserReadActionTargetReplayFingerprint, type BrowserReadActionTarget, type BrowserReadDecisionInput } from "../../../../infrastructure/browser/browser-action-decision.js";

export interface CapturedDecision {
  purpose: string;
  promptVersion: string;
  outputSchema: { name: string; version: string };
  messages: readonly { content: string }[];
  outputText: string;
}

export function capturedContractMatches(record: Pick<CapturedDecision, "purpose" | "promptVersion" | "outputSchema">, request: ModelRequest) {
  return record.purpose === request.purpose && record.promptVersion === request.promptVersion
    && record.outputSchema?.name === request.outputSchema.name && record.outputSchema?.version === request.outputSchema.version;
}

export interface RecordedReferenceBinding {
  kind: "CURRENT_DOM" | "OBSERVED_REGION_COLLECTION";
  recordedRef: string;
  replayRef: string;
  semanticSha256: string;
}
const pageActions = new Set(["WAIT", "PRESS_ESCAPE", "COMPLETE", "REQUEST_HUMAN_HELP"]);
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => JSON.stringify(key) + ":" + canonical(value)).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
function targetKey(target: BrowserReadActionTarget) {
  return canonical({ semantic: browserReadActionTargetReplayFingerprint(target), group: target.controlGroupLabel, value: target.value,
    selected: target.selected, checked: target.checked, disabled: target.disabled, calendarDate: target.calendarDate,
    options: target.options, availableActions: target.availableActions?.toSorted() });
}

/** ORIGINAL Replay only. Rebind ephemeral handles to a unique observed semantic
 * target; no action/value/href is generated. The normal production decoder and
 * stale-ref/authorization checks still receive and validate the current handle. */
export function rebindRecordedBrowserDecision(record: CapturedDecision, request: ModelRequest): { outputText: string; binding?: RecordedReferenceBinding } {
  if (!capturedContractMatches(record, request)) return fail("REPLAY_MODEL_CONTRACT_MISMATCH");
  if (request.purpose !== "browser_read_decide") return { outputText: record.outputText };
  let before: BrowserReadDecisionInput, after: BrowserReadDecisionInput, wire: Record<string, unknown>;
  try {
    before = JSON.parse(record.messages.at(-1)!.content);
    after = JSON.parse(request.messages.at(-1)!.content);
    wire = JSON.parse(record.outputText);
  } catch { return fail("REPLAY_BROWSER_CONTEXT_UNAVAILABLE"); }
  if (!before.observation || !after.observation || before.source !== after.source || before.stage !== after.stage
    || before.objective !== after.objective || before.observation.url !== after.observation.url || canonical(before.goal) !== canonical(after.goal)) return fail("REPLAY_BROWSER_CONTEXT_DIVERGED");
  if (pageActions.has(String(wire.action))) return { outputText: record.outputText };
  let key: string, recordedRef: string, replayRef: string;
  if (wire.action === "SELECT_REGION_ENTRANCE") return fail("REPLAY_RETIRED_ACTION");
  {
    const selected = before.observation.targets.filter(target => target.ref === wire.targetRef);
    if (selected.length !== 1) return fail("RECORDED_DOM_REFERENCE_MISSING");
    key = targetKey(selected[0]!);
    const matches = after.observation.targets.filter(target => targetKey(target) === key);
    if (matches.length !== 1) return fail("REPLAY_DOM_TARGET_MISSING_OR_AMBIGUOUS");
    recordedRef = selected[0]!.ref; replayRef = matches[0]!.ref;
  }
  return { outputText: JSON.stringify({ ...wire, targetRef: replayRef }), binding: {
    kind: "CURRENT_DOM", recordedRef, replayRef,
    semanticSha256: createHash("sha256").update(key).digest("hex"),
  } };
}
