import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";

import { restaurantEventForMessage } from "../../../src/application/restaurant-message-handler.js";
import type { ModelInvocationRecord } from "../../../src/core/model/contracts.js";
import type { RestaurantIntentDraft } from "../../../src/domains/restaurant/contracts.js";
import { applyRestaurantIntentPatch } from "../../../src/domains/restaurant/intent-state.js";
import { RestaurantSemanticInterpreter, type RestaurantSemanticInterpretResult } from "../../../src/domains/restaurant/semantic-interpreter.js";
import { RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION } from "../../../src/domains/restaurant/semantic-proposal.js";
import { requireRealModelEvalConfiguration, summarizeRealModelEval } from "../../../src/eval/shared/real-model.js";
import { DeepSeekModelGateway } from "../../../src/infrastructure/deepseek/deepseek-model-gateway.js";

type Case = { id: string; message: string; expectedDate: string | null; expectedTime: string; focus: string };
type Inputs = {
  classification: string;
  referenceTime: string;
  draft: RestaurantIntentDraft;
  cases: Case[];
  policy: { maxModelInvocations: number };
};

const localFile = (name: string) => new URL(name, import.meta.url);
const inputFile = localFile("inputs.json");
const inputs = JSON.parse(readFileSync(inputFile, "utf8")) as Inputs;
assert.equal(inputs.cases.length, 10);
assert.equal(new Set(inputs.cases.map(row => row.id)).size, 10);
assert.equal(inputs.policy.maxModelInvocations, 20);
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const git = (...args: string[]) => execFileSync("git", ["--no-optional-locks", ...args], { encoding: "utf8" }).trim();
const sha = git("rev-parse", "HEAD");
const acceptedSourceTree = "a0455cd4a4580f6fb3597f48096afb322be6cf4f";
assert.equal(git("rev-parse", "HEAD:src"), acceptedSourceTree);
assert.equal(git("diff", "HEAD", "--name-only", "--", "src", "package.json", "package-lock.json"), "");
const paths = [inputFile, localFile("run.ts")];
const batchPath = ".eval-artifacts/3c-unified-20261117/round-28-deepseek-date-spotcheck";
const hashes = Object.fromEntries(paths.map(file => {
  const name = file.pathname.split("/").at(-1)!;
  const data = readFileSync(file);
  const digest = sha256(data);
  assert.equal(digest, sha256(execFileSync("git", ["show", `HEAD:${batchPath}/${name}`])));
  return [name, digest];
}));

const envFile = "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env";
const fileEnv = parseEnv(readFileSync(envFile, "utf8"));
const environment: NodeJS.ProcessEnv = {
  PRAXIS_ALLOW_LIVE_MODEL_EVAL: process.env.PRAXIS_ALLOW_LIVE_MODEL_EVAL,
  PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT: "10",
};
for (const key of [
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "PRAXIS_DEEPSEEK_API_PROXY_SERVER",
  "PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS",
  "PRAXIS_DEEPSEEK_OUTPUT_USD_PER_MILLION_TOKENS",
]) {
  environment[key] = process.env[key] ?? fileEnv[key];
}
const config = requireRealModelEvalConfiguration(environment, 10);
assert.equal(config.caseLimit, inputs.cases.length);
const invocations: ModelInvocationRecord[] = [];
const gateway = DeepSeekModelGateway.fromEnvironment(environment, {
  observer: { observe(record) { invocations.push(record); } },
});
const started = {
  sha,
  sourceTree: acceptedSourceTree,
  hashes,
  classification: inputs.classification,
  mode: "REAL_MODEL_SEMANTIC_ONLY",
  model: environment.DEEPSEEK_MODEL,
  promptVersion: RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION,
  startedAt: new Date().toISOString(),
  plannedSentences: config.caseLimit,
  maxModelInvocations: inputs.policy.maxModelInvocations,
};
const save = (name: string, value: unknown) => writeFileSync(localFile(name), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
save("started.json", started);

let reached = 0;
let passed = 0;
let blocked: string | undefined;
let finished = false;
const finish = (status: string) => {
  if (finished) return;
  finished = true;
  const summary = {
    ...started, finishedAt: new Date().toISOString(), status,
    evaluatedSentences: reached, passed,
    failed: reached - passed, notEvaluated: config.caseLimit - reached,
    blocked,
    modelMetrics: summarizeRealModelEval(invocations, reached + (blocked ? 1 : 0), config.pricing),
  };
  save("finished.json", summary);
  console.log(JSON.stringify(summary));
};
process.once("SIGINT", () => { finish("INTERRUPTED"); process.exit(130); });
process.once("SIGTERM", () => { finish("INTERRUPTED"); process.exit(143); });

try {
  for (const row of inputs.cases) {
    const raw: string[] = [];
    const start = invocations.length;
    let interpretation: RestaurantSemanticInterpretResult | undefined;
    const interpreter = new RestaurantSemanticInterpreter({
      async complete(request) {
        assert.ok(invocations.length < inputs.policy.maxModelInvocations);
        const response = await gateway.complete(request);
        raw.push(response.outputText);
        return response;
      },
    });
    const event = await restaurantEventForMessage({
      async interpret(input) {
        interpretation = await interpreter.interpret(input);
        return interpretation;
      },
    }, {
      taskId: `round-28-deepseek-date-${row.id}`,
      referenceTime: inputs.referenceTime,
      timezone: "Asia/Tokyo",
      currentDraft: inputs.draft,
      message: row.message,
    });
    assert.ok(interpretation);
    const projected = event.type === "SEMANTIC_PROPOSAL_COMPILED"
      ? applyRestaurantIntentPatch(inputs.draft, event.patch)
      : undefined;
    const modelFailure = interpretation.status === "MODEL_FAILURE";
    const accepted = !modelFailure && (row.expectedDate === null
      ? event.type === "SEMANTIC_CONFLICT_RECORDED" || projected?.date === undefined && projected !== undefined
      : projected?.date === row.expectedDate &&
        projected.timeWindow?.earliest === row.expectedTime && projected.timeWindow.latest === row.expectedTime);
    const dateFacts = interpretation.status === "PROPOSED"
      ? interpretation.proposal.facts.filter(fact => fact.field === "DATE")
      : [];
    const observation = {
      ...row,
      model: interpretation.status === "MODEL_FAILURE"
        ? { status: interpretation.status, errorCode: interpretation.errorCode }
        : interpretation,
      raw,
      providerCalls: invocations.slice(start).map(({ model, outcome, latencyMs, usage, providerStatus, errorCode }) =>
        ({ model, outcome, latencyMs, usage, providerStatus, errorCode })),
      dateFacts,
      event,
      effectiveDate: projected?.date,
      effectiveTime: projected?.timeWindow,
      outcome: modelFailure ? "NOT_EVALUATED_PROVIDER_FAILURE" : accepted ? "PASS" : "FAIL",
    };
    appendFileSync(localFile("observations.jsonl"), JSON.stringify(observation) + "\n");
    console.log(JSON.stringify({ id: row.id, status: observation.outcome, event: event.type, date: projected?.date }));
    if (modelFailure) {
      blocked = interpretation.errorCode;
      break;
    }
    reached++;
    if (accepted) passed++;
  }
  finish(blocked ? "PROVIDER_FAILURE" : "COMPLETED");
  if (blocked) process.exitCode = 1;
} catch (error) {
  finish("RUNNER_FAILURE");
  throw error;
}
