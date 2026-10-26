import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ModelBrowserReadActionDecision, type BrowserReadDecisionInput } from "../../infrastructure/browser/browser-action-decision.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { rebindRecordedBrowserDecision, type CapturedDecision } from "../../eval/restaurant/agent-loop/runners/recorded-browser-decision.js";
import { localFixture } from "./browser-read-test-fixtures.js";

const recording = new URL("../../../.eval-artifacts/phase3a-prime/replay-url-qualification-20261025/inputs/", import.meta.url);
test("F5 recorded region action rebinds to the same observed link and reaches the next saved page", async t => {
  // Saved F5 DOM + locally constructed transport/CSP. This is a bounded
  // production execution window, never a complete website network Replay.
  const rows = (await readFile(new URL("decisions.jsonl", recording), "utf8")).trim().split("\n").map(line => JSON.parse(line) as CapturedDecision);
  const record = rows[3]!, original = JSON.parse(record.messages.at(-1)!.content) as BrowserReadDecisionInput;
  const selected = original.observation.targets.find(target => target.ref === JSON.parse(record.outputText).targetRef)!;
  assert.equal(selected.href, "https://tabelog.com/en/tokyo/A1322/");
  const csp = '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;">';
  const runtime = localFixture({
    [original.observation.url]: csp + await readFile(new URL("recording/snapshot-0002.html", recording), "utf8"),
    [selected.href!]: csp + await readFile(new URL("recording/snapshot-0004.html", recording), "utf8"),
  });
  let calls = 0;
  const diagnostics: Array<{ event: string; detail?: string }> = [];
  const model = new ModelBrowserReadActionDecision({ async complete(request) {
    calls++;
    const output = calls === 1 ? rebindRecordedBrowserDecision(record, request).outputText
      : JSON.stringify({ action: "REQUEST_HUMAN_HELP", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "Stop the uncovered window" });
    return { invocationId: "offline-recorded-window", provider: "FIXTURE", model: "original-captured-response", outputText: output, finishReason: "TOOL_CALLS", latencyMs: 0 };
  } });
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 60_000, maxModelCallsTotal: 2, maxModelCallsPerCandidate: 2, maxOperationsPerCandidate: 20, modelDecision: model,
    onDiagnostic: row => diagnostics.push({ event: row.event, ...(row.detail ? { detail: row.detail } : {}) }) });
  const signal = AbortSignal.timeout(60_000);
  try {
    const session = await executor.acquire(signal, "DIRECTORY", "DISCOVERY");
    await executor.navigate({ session, signal, source: "DIRECTORY", stage: "DISCOVERY", allowedOrigins: ["https://tabelog.com"], url: original.observation.url });
    const result = await executor.runSkill({ taskId: "offline-f5-region-window", source: "DIRECTORY", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://tabelog.com"], goal: original.goal, objective: original.objective,
      completion: snapshot => ({ complete: snapshot.url === selected.href, resultKey: snapshot.url, resultBusy: false, reason: "The selected observed region page has not been reached" }) });
    t.diagnostic(JSON.stringify({ status: result.status, calls, rejected: diagnostics.filter(row => row.event === "REJECTED"), sourceTransportCalls: 0 }));
    assert.equal(result.status, "COMPLETED", JSON.stringify({ status: result.status, diagnostics }));
    assert.equal(result.snapshot.url, selected.href); assert.equal(calls, 1);
  } finally { await executor.close(); }
});
