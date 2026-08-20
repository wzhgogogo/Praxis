import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { RestaurantAgentLoopCoordinator } from "../../../../application/restaurant-agent-loop.js";
import { RestaurantExecutionRouter } from "../../../../application/restaurant-execution-router.js";
import { InMemoryTaskRuntime } from "../../../../core/task-runtime/in-memory-task-runtime.js";
import { RestaurantAgentDecision } from "../../../../domains/restaurant/agent-decision.js";
import { compileRestaurantSemanticProposal } from "../../../../domains/restaurant/semantic-compiler.js";
import { RestaurantSemanticInterpreter } from "../../../../domains/restaurant/semantic-interpreter.js";
import type { RestaurantCommand, RestaurantEvent, RestaurantOutcome, RestaurantTaskState } from "../../../../domains/restaurant/contracts.js";
import { restaurantBookingTaskDefinition } from "../../../../domains/restaurant/task-definition.js";
import { CloudflareBrowserRun } from "../../../../infrastructure/browser/cloudflare-browser-run.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../../integrations/google/google-places-restaurant-search.js";
import { TabelogBrowserAvailability } from "../../../../integrations/tabelog/tabelog-browser-availability.js";
import { InMemoryRestaurantAgentTrajectoryStore } from "../../../../infrastructure/postgres/restaurant-agent-trajectory-store.js";
import { loadFrozenLiveCases, materializeLiveCase } from "../live-case-materializer.js";

function requiredGate(key: string): void {
  if (process.env[key] !== "1") throw new Error(`Set ${key}=1 to run a Live / Hybrid read diagnostic`);
}

function caseIdFromArgs(): string {
  const index = process.argv.indexOf("--case");
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1]! : "h001";
}

function requiresLocation(caseValue: unknown): boolean {
  return JSON.stringify(caseValue).includes("NEAR_USER");
}

requiredGate("PRAXIS_ALLOW_LIVE_RESTAURANT_READ");
requiredGate("PRAXIS_ALLOW_BROWSER_RUN");
requiredGate("PRAXIS_ALLOW_LIVE_MODEL_EVAL");
const sourcePath = resolve("src/eval/restaurant/agent-loop/drafts/e2e-cases.yaml");
const selectedId = caseIdFromArgs();
const source = await loadFrozenLiveCases(sourcePath);
const frozen = source.find((entry) => entry.id === selectedId);
if (!frozen) throw new Error(`Unknown frozen E2E case: ${selectedId}`);
if (requiresLocation(frozen) && (!process.env.PRAXIS_EVAL_USER_LAT || !process.env.PRAXIS_EVAL_USER_LNG)) {
  throw new Error("PRAXIS_EVAL_USER_LAT and PRAXIS_EVAL_USER_LNG are required for NEAR_USER Live cases");
}

const startedAt = new Date();
const materialized = materializeLiveCase(frozen, startedAt.toISOString());
const liveReadLimits = {
  maxGoogleSearches: 2,
  maxGooglePlaceDetails: 0,
  maxBrowserSessions: 3,
  maxTabelogCandidateMatches: 5,
  maxAvailabilityReads: 3,
  maxBrowserRuntimeFallbacks: 1,
} as const;
const taskId = `hybrid-live:${materialized.id}:${startedAt.valueOf()}`;
const runId = `run:${taskId}`;
const clock = { now: () => new Date() };
let sequence = 0;
const runtime = new InMemoryTaskRuntime<RestaurantTaskState, RestaurantEvent, RestaurantCommand, RestaurantOutcome>(
  restaurantBookingTaskDefinition,
  clock,
  (prefix) => `${prefix}:${++sequence}`,
);
runtime.createTask(taskId, {}, { runId });
const trajectories = new InMemoryRestaurantAgentTrajectoryStore();
const model = DeepSeekModelGateway.fromEnvironment();
const interpreter = new RestaurantSemanticInterpreter(model);
const semantic = await interpreter.interpret({
  taskId,
  message: String(materialized.content ?? ""),
  referenceTime: startedAt.toISOString(),
  timezone: "Asia/Tokyo",
});
if (semantic.status !== "PROPOSED") throw new Error(`Semantic Interpreter did not produce a proposal: ${semantic.status}`);
const compilation = compileRestaurantSemanticProposal(semantic.proposal);
const semanticEvent: RestaurantEvent = compilation.status === "COMPILED"
  ? { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compilation.patch }
  : { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict };
await runtime.dispatch({
  id: `event:${taskId}:semantic`, taskId, event: semanticEvent, occurredAt: startedAt.toISOString(),
  trace: { schemaVersion: "1", runId, correlationId: `event:${taskId}:semantic`, actor: "MODEL" },
});

const evaluationLocation = process.env.PRAXIS_EVAL_USER_LAT && process.env.PRAXIS_EVAL_USER_LNG
  ? { latitude: Number(process.env.PRAXIS_EVAL_USER_LAT), longitude: Number(process.env.PRAXIS_EVAL_USER_LNG) }
  : undefined;
const search = new GooglePlacesRestaurantSearch(
  new GooglePlacesClient({ apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "" }),
  undefined,
  10,
  { ...(evaluationLocation ? { evaluationLocation } : {}), maxSearches: liveReadLimits.maxGoogleSearches },
);
const availability = new TabelogBrowserAvailability(
  CloudflareBrowserRun.fromEnvironment(),
  undefined,
  liveReadLimits.maxTabelogCandidateMatches,
  { maxBrowserSessions: liveReadLimits.maxBrowserSessions },
);
const coordinator = new RestaurantAgentLoopCoordinator(
  {
    snapshot: async (id) => runtime.snapshot(id),
    dispatch: async (envelope, expectedVersion) => runtime.dispatch(envelope, expectedVersion),
  },
  new RestaurantAgentDecision(model),
  new RestaurantExecutionRouter(search, availability, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 25_000 }),
  trajectories,
  clock,
  { maxSteps: 6, maxRejectedActions: 2, timeoutMs: 90_000 },
);
const loop = await coordinator.run(taskId);
const finalSnapshot = runtime.snapshot(taskId);
const artifact = {
  schemaVersion: "1",
  mode: "HYBRID_LIVE_READ",
  scorerStatus: "NOT_INTEGRATED_REPOSITORY_DRAFT_ONLY",
  limits: liveReadLimits,
  rawRequest: materialized.content,
  materializedCase: materialized,
  semantic,
  events: runtime.eventLog,
  trajectories: trajectories.steps,
  finalSnapshot,
  loop,
  resolvedEvalLocation: evaluationLocation,
  latencyMs: Date.now() - startedAt.valueOf(),
  sideEffects: { booking: 0, payment: 0, cancellation: 0, personalInformationSubmission: 0 },
};
const directory = resolve(".eval-artifacts", "restaurant-hybrid-live-read");
await mkdir(directory, { recursive: true });
const path = resolve(directory, `${startedAt.toISOString().replace(/[:.]/g, "-")}-${materialized.id}.json`);
await writeFile(path, JSON.stringify(artifact, null, 2), "utf8");
console.log(JSON.stringify({ mode: artifact.mode, caseId: materialized.id, loop, artifactPath: path, latencyMs: artifact.latencyMs, scorerStatus: artifact.scorerStatus }, null, 2));
