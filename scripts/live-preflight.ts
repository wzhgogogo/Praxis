import { parseArgs } from "node:util";

import {
  environmentWithEffectiveLiveNetwork,
  resolveEffectiveLiveNetworkConfiguration,
  runLivePreflight,
  type LivePreflightRunner,
  type LivePreflightTarget,
} from "../src/eval/restaurant/agent-loop/live-preflight.js";

const RUNNERS = new Set<LivePreflightRunner>([
  "HYBRID_LIVE_READ", "BROWSER_CASE_SLICE", "BROWSER_READ_PROBE", "NATIVE_FIXED_SOURCE_MODEL", "FIXED_SOURCE_MODEL",
]);
const TARGETS = new Set<LivePreflightTarget>(["DEEPSEEK", "GOOGLE", "TABELOG", "TABLECHECK"]);

const { values } = parseArgs({ options: {
  runner: { type: "string", default: "HYBRID_LIVE_READ" },
  targets: { type: "string", default: "DEEPSEEK,GOOGLE,TABELOG,TABLECHECK" },
  "timeout-ms": { type: "string", default: "10000" },
  "no-proxy": { type: "boolean", default: false },
} });
const runner = values.runner as LivePreflightRunner;
if (!RUNNERS.has(runner)) throw new Error("Unknown --runner");
const targets = values.targets.split(",").map(value => value.trim()).filter(Boolean) as LivePreflightTarget[];
if (targets.length === 0 || targets.some(target => !TARGETS.has(target))) throw new Error("--targets must contain known preflight targets");
const timeoutMs = Number(values["timeout-ms"]);
if (!Number.isSafeInteger(timeoutMs)) throw new Error("--timeout-ms must be an integer");
const argv = values["no-proxy"] ? [...process.argv, "--no-proxy"] : process.argv;
const network = resolveEffectiveLiveNetworkConfiguration(process.env, argv);
const environment = environmentWithEffectiveLiveNetwork(process.env, network);

try {
  const result = await runLivePreflight({ runner, targets, network, timeoutMs }, environment);
  console.log(JSON.stringify({ artifactPath: result.artifactPath, elapsedMs: result.elapsedMs, attempts: result.attempts }));
} catch (error) {
  const failure = error as { code?: unknown; artifactPath?: unknown };
  console.error(JSON.stringify({ failureCode: typeof failure.code === "string" ? failure.code : "PREFLIGHT_FAILED", artifactPath: typeof failure.artifactPath === "string" ? failure.artifactPath : undefined }));
  process.exitCode = 1;
}
