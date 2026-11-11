import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rebindRecordedBrowserDecision, type CapturedDecision } from "./runners/recorded-browser-decision.js";
import { runRecordedRead, type RecordedReadInput } from "./runners/run-recorded-read.js";
import type { ModelRequest } from "../../../core/model/contracts.js";
import { type BrowserReadDecisionInput } from "../../../infrastructure/browser/browser-action-decision.js";

const rows = readFileSync(new URL("../../../../.eval-artifacts/phase3a-prime/replay-url-qualification-20261025/inputs/decisions.jsonl", import.meta.url), "utf8").trim().split("\n").map(line => JSON.parse(line) as CapturedDecision);
const request = (record: CapturedDecision, context: unknown): ModelRequest => ({ taskId: "offline-rebinding", purpose: record.purpose, promptVersion: record.promptVersion,
  messages: [{ role: "user", content: JSON.stringify(context) }], responseFormat: "JSON_SCHEMA", outputSchema: record.outputSchema, timeoutMs: 1000, fallback: "FAIL_CLOSED" });
const context = (record: CapturedDecision): BrowserReadDecisionInput => JSON.parse(record.messages.at(-1)!.content);

test("recorded DOM reference changes only the opaque handle and refuses ambiguous or altered observations", () => {
  const record = rows[3]!, current = context(record);
  current.observation.targets = current.observation.targets.map(target => ({ ...target, ref: "fresh:" + target.ref }));
  const result = rebindRecordedBrowserDecision(record, request(record, current));
  const original = JSON.parse(record.outputText), rebound = JSON.parse(result.outputText);
  assert.deepEqual(rebound, { ...original, targetRef: "fresh:" + original.targetRef });
  assert.equal(result.binding?.kind, "CURRENT_DOM");
  const selected = current.observation.targets.find(target => target.ref === rebound.targetRef)!;
  const ambiguous = structuredClone(current); ambiguous.observation.targets.push({ ...selected, ref: "another-identical-link" });
  assert.throws(() => rebindRecordedBrowserDecision(record, request(record, ambiguous)), { code: "REPLAY_DOM_TARGET_MISSING_OR_AMBIGUOUS" });
  for (const patch of [{ label: "Other place" }, { href: "https://other.example/" }, { availableActions: [] }]) {
    const changed = structuredClone(current); Object.assign(changed.observation.targets.find(target => target.ref === rebound.targetRef)!, patch);
    assert.throws(() => rebindRecordedBrowserDecision(record, request(record, changed)), { code: "REPLAY_DOM_TARGET_MISSING_OR_AMBIGUOUS" });
  }
  for (const patch of [{ source: "TABLECHECK" }, { stage: "FACTS" }, { goal: { ...current.goal, hardCriteria: ["other criterion"] } }, { observation: { ...current.observation, url: "https://tabelog.com/en/tokyo/A1322/" } }]) {
    assert.throws(() => rebindRecordedBrowserDecision(record, request(record, { ...current, ...patch })), { code: "REPLAY_BROWSER_CONTEXT_DIVERGED" });
  }
  const invented = { ...record, outputText: JSON.stringify({ ...original, targetRef: selected.href }) };
  assert.throws(() => rebindRecordedBrowserDecision(invented, request(record, current)), { code: "RECORDED_DOM_REFERENCE_MISSING" });
  assert.throws(() => rebindRecordedBrowserDecision(record, { ...request(record, current), promptVersion: "changed" }), { code: "REPLAY_MODEL_CONTRACT_MISMATCH" });

});

test("retired region actions fail closed rather than reviving an old collection path", () => {
  const record = rows[5]!;
  assert.throws(() => rebindRecordedBrowserDecision(record, request(record, context(record))), { code: "REPLAY_RETIRED_ACTION" });
});

test("an intentional old-contract Replay stop returns a bounded incomplete receipt without upgrading its output", async () => {
  // Actual F5 recording. No browser or model transport can start: its first
  // recorded semantic contract is incompatible with the signed-off main.
  const config = JSON.parse(readFileSync(new URL("../../../../.eval-artifacts/phase3a-prime/replay-url-qualification-20261025/inputs/config.json", import.meta.url), "utf8")) as RecordedReadInput;
  const directory = await mkdtemp(join(tmpdir(), "f5-replay-contract-"));
  const priorExitCode = process.exitCode;
  let summary: Awaited<ReturnType<typeof runRecordedRead>> | undefined;
  try {
    await assert.doesNotReject(async () => { summary = await runRecordedRead(config, directory); }, "An intentional incomplete Replay must retain its reason instead of losing the receipt in the Runner exception");
    assert.equal(summary!.status, "REPLAY_INCOMPLETE");
    assert.equal(summary!.consumedPages, 0); assert.equal(summary!.replayedDecisionCount, 0);
    assert.equal(summary!.modelTransportCalls, 0);
    assert.equal(summary!.decisionMismatch?.recordedSequence, 1);
    assert.deepEqual(summary!.decisionMismatch?.recorded, { purpose: "restaurant_semantic_interpret", promptVersion: "v23", outputSchema: { name: "restaurant-semantic-proposal", version: "3" } });
  } finally { process.exitCode = priorExitCode; await rm(directory, { recursive: true, force: true }); }
});
