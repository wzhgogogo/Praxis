import type { ModelRequest } from "../../../../core/model/contracts.js";

export interface CapturedDecision {
  purpose: string;
  promptVersion: string;
  outputSchema: { name: string; version: string };
  messages: readonly { content: string }[];
  outputText: string;
}

/** Red-stage path: the current runner returns the recorded opaque ref unchanged. */
export function rebindRecordedBrowserDecision(record: CapturedDecision, _request: ModelRequest) {
  return { outputText: record.outputText };
}
