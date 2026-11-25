import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { restaurantEventForMessage } from "../../../src/application/restaurant-message-handler.js";
import type { ModelResponse } from "../../../src/core/model/contracts.js";
import type { RestaurantIntentDraft } from "../../../src/domains/restaurant/contracts.js";
import { applyRestaurantIntentPatch } from "../../../src/domains/restaurant/intent-state.js";
import { RestaurantSemanticInterpreter } from "../../../src/domains/restaurant/semantic-interpreter.js";

type Case = { id: string; message: string; expectedDate: string | null; expectedTime: string };
type Tap = Case & { raw: string[]; model: { attempts: Array<Omit<ModelResponse, "outputText">> }; outcome: string };

const archive = "../round-28-deepseek-date-spotcheck/";
const read = (name: string) => readFileSync(new URL(archive + name, import.meta.url), "utf8");
const sha256 = (data: string) => createHash("sha256").update(data).digest("hex");
const inputText = read("inputs.json");
const records = read("observations.jsonl");
const { files } = JSON.parse(read("artifact-sha256.json")) as { files: Record<string, string> };
assert.equal(sha256(inputText), files["inputs.json"]);
assert.equal(sha256(records), files["observations.jsonl"]);
const inputs = JSON.parse(inputText) as { referenceTime: string; draft: RestaurantIntentDraft; cases: Case[] };
const observations = records.trimEnd().split("\n").map(line => JSON.parse(line) as Tap);
assert.equal(observations.length, 10);
assert.deepEqual(observations.map(row => row.id), inputs.cases.map(row => row.id));

const rows = [];
for (const [index, test] of inputs.cases.entries()) {
  const recorded = observations[index]!;
  assert.equal(recorded.message, test.message);
  assert.equal(recorded.expectedDate, test.expectedDate);
  assert.equal(recorded.expectedTime, test.expectedTime);
  assert.equal(recorded.raw.length, 1);
  assert.equal(recorded.model.attempts.length, 1);
  let calls = 0;
  const interpreter = new RestaurantSemanticInterpreter({
    async complete(request) {
      assert.equal(request.promptVersion, "v29");
      assert.equal(request.outputSchema.version, "4");
      assert.equal(++calls, 1, "Replay must not require a different model response");
      return { ...recorded.model.attempts[0]!, outputText: recorded.raw[0]! };
    },
  });
  const event = await restaurantEventForMessage(interpreter, {
    taskId: test.id,
    message: test.message,
    currentDraft: inputs.draft,
    referenceTime: inputs.referenceTime,
    timezone: "Asia/Tokyo",
  });
  assert.equal(calls, 1);
  const draft = event.type === "SEMANTIC_PROPOSAL_COMPILED"
    ? applyRestaurantIntentPatch(inputs.draft, event.patch)
    : undefined;
  const pass = test.expectedDate === null
    ? event.type === "SEMANTIC_CONFLICT_RECORDED" || !!draft && draft.date === undefined
    : draft?.date === test.expectedDate && draft.timeWindow?.earliest === test.expectedTime
        && draft.timeWindow.latest === test.expectedTime;
  rows.push({
    id: test.id, message: test.message, expectedDate: test.expectedDate,
    priorOutcome: recorded.outcome, rawResponseSHA256: sha256(recorded.raw[0]!),
    result: event.type, effectiveDate: draft?.date, effectiveTime: draft?.timeWindow,
    temporalDateBasis: draft?.temporalResolution?.date, pass,
  });
}
const passed = rows.filter(row => row.pass).length;
console.log(JSON.stringify({
  mode: "RECORDED_MODEL_OFFLINE_REPLAY",
  sha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  sourceTree: execFileSync("git", ["rev-parse", "HEAD:src"], { encoding: "utf8" }).trim(),
  inputSHA256: sha256(inputText), observationsSHA256: sha256(records),
  passed, total: rows.length, rows,
}));
if (passed !== rows.length) process.exitCode = 1;
