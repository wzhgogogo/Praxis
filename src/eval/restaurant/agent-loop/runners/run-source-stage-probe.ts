import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import type { RestaurantAvailabilityRequest, RestaurantCandidateFactRequest, RestaurantSearchIntent } from "../../../../domains/restaurant/contracts.js";
import type { BrowserExecutionBudget } from "../../../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../../../infrastructure/browser/browser-runtime.js";
import { browserRuntimeFromEnvironment } from "../../../../infrastructure/browser/browser-runtime-factory.js";
import { ModelBrowserReadActionDecision } from "../../../../infrastructure/browser/browser-action-decision.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../../integrations/restaurant-availability/live-browser-availability.js";
import { restaurantPublicReadNetworkPolicy } from "../../../../integrations/restaurant-availability/public-browser-read-network-policy.js";
import { GoogleListedWebsiteFactRead } from "../../../../integrations/restaurant-facts/google-listed-website-facts.js";
import { ModelRestaurantFactJudgment } from "../../../../integrations/restaurant-facts/model-fact-judgment.js";
import { discoveryPackById, discoveryPackNetworkPolicy } from "../../../../integrations/restaurant-search/source-packs.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { environmentWithEffectiveLiveNetwork, resolveEffectiveLiveNetworkConfiguration, runLivePreflight } from "../live-preflight.js";
import { BrowserReadRecording } from "./browser-read-recording.js";
import { safeRecord, traceBrowserRuntime } from "./browser-case-slice-evidence.js";
import {
  createSourceStageProbeManifest,
  createFrozenReplayBrowserDecision,
  runSourceStageAvailabilityProbe,
  runSourceStageFactsProbe,
  runSourceStageNativeDiscoveryProbe,
  runSourceStagePackDiscoveryProbe,
  reportedSourceStageModelCalls,
  remainingSourceStageSampleModelCalls,
  sourceStageManifestFingerprint,
  summarizeSourceStageAttempts,
  sourceStageSampleBudgetViolations,
  sharedSourceStageModelGateway,
  type FrozenReplayWire,
  type SourceStageProbeAttempt,
  type SourceStageProbeManifest,
  type SourceStageProbeManifestInput,
} from "../source-stage-probe.js";

const { values } = parseArgs({ options: {
  manifest: { type: "string" },
  "artifact-dir": { type: "string", default: ".eval-artifacts/source-stage-probes" },
  "no-proxy": { type: "boolean", default: false },
  execute: { type: "boolean", default: false },
  "resolve-named-location": { type: "string" },
  "sample-id": { type: "string" },
} });
if (!values.manifest) throw new Error("--manifest is required");
const manifestPath = resolve(values.manifest);
const artifactDirectory = resolve(values["artifact-dir"]!);
if (relative(resolve(".eval-artifacts"), artifactDirectory).startsWith("..")) throw new Error("--artifact-dir must remain below .eval-artifacts");
const raw = JSON.parse(await readFile(manifestPath, "utf8")) as SourceStageProbeManifestInput;
const network = resolveEffectiveLiveNetworkConfiguration(process.env, process.argv);
const manifest = createSourceStageProbeManifest({
  ...raw,
  network: { ...raw.network, proxyMode: network.proxyMode },
});
// The manifest, rather than ambient AUTO selection, fixes the engine used by
// this matrix.  It deliberately does not provide a fallback runtime.
const effectiveEnvironment: NodeJS.ProcessEnv = {
  ...environmentWithEffectiveLiveNetwork(process.env, network),
  PRAXIS_BROWSER_ENGINE: manifest.runtime.browserEngine,
};
const manifestFingerprint = sourceStageManifestFingerprint(manifest);
const stageRunMode = manifest.stage === "REPLAY"
  ? "OFFLINE_HAR_SOURCE_STAGE_REPLAY"
  : `LIVE_READ_ONLY_SOURCE_STAGE_${manifest.stage}`;
const matrixJournal = await startDiagnosticRun(artifactDirectory, {
  mode: values.execute ? stageRunMode : "SOURCE_STAGE_PROBE_PLAN",
  manifest: { ...manifest, inputManifestPath: relative(process.cwd(), manifestPath) },
  manifestFingerprint,
  execution: values.execute
    ? manifest.stage === "REPLAY" ? "OFFLINE_HAR_NO_PREFLIGHT_PENDING" : `LIVE_READ_ONLY_${manifest.stage}_PENDING_PREFLIGHT`
    : "NOT_STARTED_PLAN_ONLY",
  effectiveNetwork: { proxyMode: network.proxyMode, googleProxyConfigured: Boolean(effectiveEnvironment.PRAXIS_GOOGLE_API_PROXY_SERVER), browserProxyConfigured: Boolean(effectiveEnvironment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER) },
  runtime: manifest.runtime,
  evaluator: manifest.evaluator,
});

// The outer catch is deliberately conservative.  Once a preflight or source
// run starts, it must never turn an incomplete measurement into a literal
// zero merely because a later journal or sidecar write failed.
let lifecycleStage = "MANIFEST_VALIDATION";
let preflightStarted = false;
let preflightArtifactPath: string | undefined;
let sourceExecutionStarted = false;
const settledSourceAttempts: SourceStageProbeAttempt[] = [];

function discoveryIntent(value: Record<string, unknown>): RestaurantSearchIntent {
  const intent = value.intent;
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) throw new Error("Discovery source-stage sample requires a frozen input.intent");
  const candidate = intent as Partial<RestaurantSearchIntent>;
  if (candidate.timezone !== "Asia/Tokyo" || !candidate.area || typeof candidate.area.query !== "string" || !candidate.area.query.trim()
    || !Array.isArray(candidate.criteria)) {
    throw new Error("Discovery source-stage intent is not an authoritative RestaurantSearchIntent");
  }
  if (candidate.area.coordinates && (!Number.isFinite(candidate.area.coordinates.latitude) || !Number.isFinite(candidate.area.coordinates.longitude))) {
    throw new Error("Discovery source-stage intent coordinates must be finite when supplied");
  }
  if (candidate.area.radiusMeters !== undefined && (!Number.isFinite(candidate.area.radiusMeters) || candidate.area.radiusMeters < 1)) {
    throw new Error("Discovery source-stage intent radius must be positive when supplied");
  }
  return structuredClone(candidate as RestaurantSearchIntent);
}

function frozenLocationContext(value: Record<string, unknown>) {
  const location = value.locationContext;
  if (location === undefined) return undefined;
  if (!location || typeof location !== "object" || Array.isArray(location)) throw new Error("Frozen source-stage locationContext must be an object");
  const candidate = location as Record<string, unknown>;
  if (!Number.isFinite(candidate.latitude) || !Number.isFinite(candidate.longitude) || !Number.isFinite(candidate.radiusMeters)
    || typeof candidate.label !== "string" || !candidate.label.trim()
    || !["NAMED_PLACE_RADIUS", "TASK_LOCATION_RADIUS", "EVALUATION_LOCATION_RADIUS"].includes(String(candidate.areaMatchBasis))) {
    throw new Error("Frozen source-stage locationContext is invalid");
  }
  return {
    latitude: candidate.latitude as number,
    longitude: candidate.longitude as number,
    radiusMeters: candidate.radiusMeters as number,
    label: candidate.label,
    areaMatchBasis: candidate.areaMatchBasis as "NAMED_PLACE_RADIUS" | "TASK_LOCATION_RADIUS" | "EVALUATION_LOCATION_RADIUS",
  };
}

function frozenRequest(input: Record<string, unknown>, stage: "AVAILABILITY" | "WEBSITE_FACTS"): Record<string, unknown> {
  const value = input.request;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error(`${stage} source-stage sample requires a frozen input.request`), { code: "SOURCE_STAGE_REQUEST_NOT_FROZEN" });
  }
  return structuredClone(value as Record<string, unknown>);
}

function frozenAvailabilityRequest(input: Record<string, unknown>): RestaurantAvailabilityRequest {
  const request = frozenRequest(input, "AVAILABILITY");
  const timeWindow = request.timeWindow;
  if (!Array.isArray(request.candidateIds) || !Array.isArray(request.candidates)
    || request.candidateIds.length !== request.candidates.length || !request.candidateIds.every(item => typeof item === "string" && item.trim())
    || typeof request.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(request.date)
    || !Number.isSafeInteger(request.partySize) || (request.partySize as number) < 1
    || !timeWindow || typeof timeWindow !== "object" || Array.isArray(timeWindow)
    || typeof (timeWindow as Record<string, unknown>).earliest !== "string" || typeof (timeWindow as Record<string, unknown>).latest !== "string"
    || !Array.isArray(request.hardCriteria) || !request.hardCriteria.every(item => typeof item === "string")) {
    throw Object.assign(new Error("Availability source-stage request is not an authoritative frozen request"), { code: "SOURCE_STAGE_REQUEST_NOT_FROZEN" });
  }
  return request as unknown as RestaurantAvailabilityRequest;
}

function frozenFactRequest(input: Record<string, unknown>): RestaurantCandidateFactRequest {
  const request = frozenRequest(input, "WEBSITE_FACTS");
  if (!Array.isArray(request.candidateIds) || !Array.isArray(request.candidates)
    || request.candidateIds.length !== request.candidates.length || !request.candidateIds.every(item => typeof item === "string" && item.trim())
    || !request.intent || typeof request.intent !== "object" || Array.isArray(request.intent)) {
    throw Object.assign(new Error("Website-facts source-stage request is not an authoritative frozen request"), { code: "SOURCE_STAGE_REQUEST_NOT_FROZEN" });
  }
  // Reuse the same authoritative intent validation as Discovery rather than
  // letting a fact-stage manifest introduce a second intent shape.
  discoveryIntent({ intent: request.intent });
  return request as unknown as RestaurantCandidateFactRequest;
}

function frozenReplayHarPath(input: Record<string, unknown>): string {
  if (typeof input.replayHarPath !== "string" || !input.replayHarPath.trim()) {
    throw Object.assign(new Error("Replay source-stage sample requires an existing frozen input.replayHarPath"), { code: "SOURCE_STAGE_REPLAY_NOT_FROZEN" });
  }
  const path = resolve(input.replayHarPath);
  if (relative(resolve(".eval-artifacts"), path).startsWith("..")) {
    throw Object.assign(new Error("Replay HAR must remain below .eval-artifacts"), { code: "SOURCE_STAGE_REPLAY_NOT_FROZEN" });
  }
  return path;
}

function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }

function replayFrozenString(input: Record<string, unknown>, field: string): string {
  const value = input[field];
  if (typeof value !== "string" || !value.trim()) {
    throw Object.assign(new Error(`Replay source-stage sample requires frozen ${field}`), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  return value;
}

export async function frozenReplayWires(input: Record<string, unknown>, expectedSourcePackId: string): Promise<{ originalStage: "DISCOVERY" | "IDENTITY" | "AVAILABILITY"; wires: FrozenReplayWire[] }> {
  if (typeof input.replayTraceArtifactPath !== "string" || !input.replayTraceArtifactPath.trim()) {
    throw Object.assign(new Error("Replay source-stage sample requires its frozen input.replayTraceArtifactPath"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  const path = resolve(input.replayTraceArtifactPath);
  if (relative(resolve(".eval-artifacts"), path).startsWith("..")) {
    throw Object.assign(new Error("Replay trace must remain below .eval-artifacts"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  const rawArtifact = await readFile(path, "utf8");
  if (sha256(rawArtifact) !== replayFrozenString(input, "replayTraceSha256")) {
    throw Object.assign(new Error("Replay trace bytes no longer match the frozen digest"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  const artifact = JSON.parse(rawArtifact) as Record<string, unknown>;
  const originalStage = artifact.stage;
  if (originalStage !== "DISCOVERY" && originalStage !== "IDENTITY" && originalStage !== "AVAILABILITY") {
    throw Object.assign(new Error("Replay only supports an original Discovery, Identity, or Availability stage"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  const sample = artifact.sample;
  if (!sample || typeof sample !== "object" || Array.isArray(sample)
    || (sample as Record<string, unknown>).sourcePackId !== expectedSourcePackId) {
    throw Object.assign(new Error("Replay trace source Pack does not match the current replay Pack"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  const originalInput = (sample as Record<string, unknown>).input;
  const originalPayload = originalInput && typeof originalInput === "object" && !Array.isArray(originalInput)
    ? originalStage === "DISCOVERY" ? (originalInput as Record<string, unknown>).intent : (originalInput as Record<string, unknown>).request
    : undefined;
  const replayPayload = originalStage === "DISCOVERY" ? input.intent : input.request;
  if (!originalPayload || typeof originalPayload !== "object" || Array.isArray(originalPayload)
    || !replayPayload || typeof replayPayload !== "object" || Array.isArray(replayPayload)
    || sha256(JSON.stringify(originalPayload)) !== sha256(JSON.stringify(replayPayload))) {
    throw Object.assign(new Error("Replay request does not match the frozen original sample request"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  // A Discovery continuation owns its resolved coordinate/radius separately
  // from the user intent. Replaying it with a different context would turn
  // the same source trace into a different current-region query.
  const originalLocationContext = originalInput && typeof originalInput === "object" && !Array.isArray(originalInput)
    ? (originalInput as Record<string, unknown>).locationContext : undefined;
  if (sha256(JSON.stringify(originalLocationContext ?? null)) !== sha256(JSON.stringify(input.locationContext ?? null))) {
    throw Object.assign(new Error("Replay location context does not match the frozen original sample"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  }
  const result = artifact.result;
  const resultTrace = result && typeof result === "object" && !Array.isArray(result)
    ? (result as Record<string, unknown>).browserTrace : undefined;
  // Successful sample journals retain the trace inside `result`; a failed
  // journal retains the same canonical trace at its top level.  Both are the
  // current source-stage journal shape, never a reconstructed legacy trace.
  const trace = Array.isArray(resultTrace) ? resultTrace : artifact.browserTrace;
  if (!Array.isArray(trace)) throw Object.assign(new Error("Replay trace did not retain browser events"), { code: "REPLAY_ACTION_NO_COVERAGE" });
  const wires = trace.flatMap((event) => {
    if (!event || typeof event !== "object" || Array.isArray(event)) return [];
    const item = event as Record<string, unknown>;
    // The canonical source-stage runner persists an executor diagnostic; a
    // model wire is therefore nested under `detail.detail`.
    const diagnostic = item.detail && typeof item.detail === "object" && !Array.isArray(item.detail)
      ? item.detail as Record<string, unknown> : undefined;
    const detail = item.kind === "EXECUTOR_DIAGNOSTIC" && diagnostic?.event === "MODEL_WIRE"
        && diagnostic.detail && typeof diagnostic.detail === "object" && !Array.isArray(diagnostic.detail)
        ? diagnostic.detail as Record<string, unknown>
        : undefined;
    if (!detail) return [];
    const extras = Array.isArray(detail.extras) ? detail.extras.flatMap((extra) => {
      if (!extra || typeof extra !== "object" || Array.isArray(extra)) return [];
      const value = extra as Record<string, unknown>;
      return typeof value.fieldPath === "string" && typeof value.valueType === "string"
        ? [{ fieldPath: value.fieldPath, valueType: value.valueType }] : [];
    }) : [];
    const targetFingerprint = typeof detail.targetFingerprint === "string" && /^[a-f0-9]{64}$/i.test(detail.targetFingerprint)
      ? detail.targetFingerprint : undefined;
    if (typeof detail.action !== "string" || typeof detail.targetRef !== "string"
      || typeof detail.authoritativeField !== "string" || typeof detail.requestedState !== "string"
      || detail.reason !== "REDACTED"
      || (!["WAIT", "PRESS_ESCAPE", "COMPLETE", "REQUEST_HUMAN_HELP"].includes(detail.action) && !targetFingerprint)) return [];
    return [{ action: detail.action as FrozenReplayWire["action"], targetRef: detail.targetRef,
      authoritativeField: detail.authoritativeField, requestedState: detail.requestedState,
      reason: "REDACTED" as const, extras, ...(targetFingerprint ? { targetFingerprint } : {}) }];
  });
  // A deterministic source pass may legitimately need no model decision.
  // Keep the frozen schedule empty; if the restored production path later
  // requires a decision, the replay decision port rejects at that point.
  return { originalStage, wires };
}

function normalizedLocationLabel(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function frozenSampleLocationLabel(sample: { input: Record<string, unknown> }): string | undefined {
  const inputLabel = sample.input.label;
  const intent = sample.input.intent;
  const area = intent && typeof intent === "object" && !Array.isArray(intent)
    ? (intent as { area?: unknown }).area : undefined;
  const query = area && typeof area === "object" && !Array.isArray(area)
    ? (area as { query?: unknown }).query : undefined;
  const directLabel = typeof inputLabel === "string" && inputLabel.trim() ? inputLabel : undefined;
  const discoveryLabel = typeof query === "string" && query.trim() ? query : undefined;
  // Named-location resolution manifests use input.label. Discovery samples
  // resolve the frozen area query. A disagreement is ambiguous rather than a
  // license to pick whichever label happens to work at the provider.
  if (directLabel && discoveryLabel && normalizedLocationLabel(directLabel) !== normalizedLocationLabel(discoveryLabel)) return undefined;
  return directLabel ?? discoveryLabel;
}

function frozenNamedLocationRadius(sample: { input: Record<string, unknown> }): number | undefined {
  const radius = sample.input.radiusMeters;
  if (radius === undefined) return undefined;
  if (typeof radius !== "number" || !Number.isSafeInteger(radius) || radius < 1) {
    throw Object.assign(new Error("Named-location sample radius must be a positive frozen integer"), { code: "LOCATION_RADIUS_NOT_FROZEN" });
  }
  return radius;
}

function safeModelDiagnosticDetail(event: string, detail: unknown): unknown | undefined {
  if (typeof detail !== "string") return undefined;
  if (event === "MODEL_WIRE" && detail.startsWith("MODEL_WIRE:")) {
    try {
      const wire = JSON.parse(detail.slice("MODEL_WIRE:".length)) as Record<string, unknown>;
      return {
        action: typeof wire.action === "string" ? wire.action : "UNKNOWN",
        targetRef: typeof wire.targetRef === "string" ? wire.targetRef : "REDACTED",
        authoritativeField: typeof wire.authoritativeField === "string" ? wire.authoritativeField : "UNKNOWN",
        requestedState: typeof wire.requestedState === "string" ? wire.requestedState : "UNKNOWN",
        reason: "REDACTED",
        extras: Array.isArray(wire.extras) ? wire.extras.map(item => safeRecord(item)) : [],
        ...(typeof wire.targetFingerprint === "string" && /^[a-f0-9]{64}$/i.test(wire.targetFingerprint)
          ? { targetFingerprint: wire.targetFingerprint } : {}),
      };
    } catch { return { action: "UNKNOWN", targetRef: "REDACTED", authoritativeField: "UNKNOWN", requestedState: "UNKNOWN", reason: "REDACTED", extras: [] }; }
  }
  if ((event === "MODEL_ACTION" || event === "MODEL_STOP") && /^MODEL_[A-Z_]+$/.test(detail)) return { action: detail.slice("MODEL_".length) };
  return undefined;
}

/**
 * A source-stage artifact needs a lifecycle cause, never a provider's raw
 * stack, HTML, or message.  The executor already supplies stable failure
 * codes and reasons for that purpose.
 */
function safeSourceStageDiagnostic(diagnostic: import("../../../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic) {
  const modelDetail = safeModelDiagnosticDetail(diagnostic.event, diagnostic.detail);
  return {
    source: diagnostic.source,
    stage: diagnostic.stage,
    event: diagnostic.event,
    ...(diagnostic.candidateId ? { candidateId: diagnostic.candidateId } : {}),
    ...(modelDetail ? { detail: modelDetail } : {}),
    elapsedMs: diagnostic.elapsedMs,
    lifecycle: {
      outcome: diagnostic.lifecycle.outcome,
      ...(diagnostic.lifecycle.scope ? { scope: diagnostic.lifecycle.scope } : {}),
      ...(diagnostic.lifecycle.reason ? { reason: diagnostic.lifecycle.reason } : {}),
      ...(diagnostic.lifecycle.failureCode ? { failureCode: diagnostic.lifecycle.failureCode } : {}),
      candidateElapsedMs: diagnostic.lifecycle.candidateElapsedMs,
      providerElapsedMs: diagnostic.lifecycle.providerElapsedMs,
      candidateModelCalls: diagnostic.lifecycle.candidateModelCalls,
      providerModelCalls: diagnostic.lifecycle.providerModelCalls,
      candidateRuntimeOperations: diagnostic.lifecycle.candidateRuntimeOperations,
      providerRuntimeOperations: diagnostic.lifecycle.providerRuntimeOperations,
      runModelCalls: diagnostic.lifecycle.runModelCalls,
    },
  };
}

function safeSourceStageTrace(kind: string, detail: unknown): unknown {
  if (kind === "EXECUTOR_DIAGNOSTIC" && detail && typeof detail === "object") {
    return safeSourceStageDiagnostic(detail as import("../../../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic);
  }
  // Browser provider errors can contain DOM, request, or opaque runtime
  // internals.  Retain the operation shape and stable classification only.
  if (kind === "SESSION_OPEN_ERROR" || kind === "SNAPSHOT_ERROR" || kind === "CONTROLS_ERROR") {
    return { failureCode: "BROWSER_RUNTIME_FAILED" };
  }
  if (kind === "SESSION_ERROR") {
    const method = detail && typeof detail === "object" && "method" in detail && typeof detail.method === "string"
      ? detail.method : "UNKNOWN";
    return { method, failureCode: "BROWSER_RUNTIME_FAILED" };
  }
  return safeRecord(detail);
}

async function writeEvaluationAndAcceptance(manifest: SourceStageProbeManifest, resultPath: string, attempt: SourceStageProbeAttempt): Promise<{ evaluationPath: string; acceptancePath: string }> {
  const base = resultPath.replace(/\.result\.json$/, "");
  const evaluationPath = `${base}.evaluation.json`;
  const acceptancePath = `${base}.acceptance.json`;
  const budgetViolations = sourceStageSampleBudgetViolations(manifest, attempt);
  const budgetCompliant = Object.keys(budgetViolations).length === 0;
  const evaluation = { schemaVersion: "source-stage-probe-evaluation@1", applicability: manifest.evaluator.applicability, reason: manifest.evaluator.reason, sampleId: attempt.sampleId, resultArtifactPath: resultPath };
  const acceptance = {
    schemaVersion: "source-stage-probe-acceptance@2",
    // A bounded list or explicit empty is useful evidence only. This runner
    // has no producer for current-query grounding, so human review remains
    // required instead of manufacturing a pass from parsed candidates.
    acceptance: attempt.status === "SUCCEEDED" && budgetCompliant ? "REVIEW_REQUIRED" : "FAIL",
    sampleId: attempt.sampleId,
    resultArtifactPath: resultPath,
    replay: attempt.replay,
    discoveryCoverage: attempt.discoveryCoverage ?? "NO_COVERAGE",
    guardAssessment: attempt.guardAssessment ?? "NOT_ASSESSED",
    budgetCompliant,
    ...(budgetCompliant ? {} : { budgetViolations }),
  };
  await writeFile(evaluationPath, JSON.stringify(evaluation, null, 2), { flag: "wx" });
  await writeFile(acceptancePath, JSON.stringify(acceptance, null, 2), { flag: "wx" });
  return { evaluationPath, acceptancePath };
}

try {
  // These failures must settle a journal before a preflight, provider, browser,
  // or model setup can occur. The one exception is an explicit REPLAY stage:
  // it runs only against its frozen HAR and never opens live transport.
  const executableMode = manifest.stage === "REPLAY"
    ? manifest.mode === "REPLAY"
    : manifest.mode === "LIVE_READ_ONLY";
  if (values.execute && !executableMode) {
    lifecycleStage = "MODE_VALIDATION";
    throw Object.assign(new Error("Only LIVE_READ_ONLY source-stage manifests may execute"), { code: "SOURCE_STAGE_MODE_NOT_EXECUTABLE" });
  }
  if (values["resolve-named-location"]) {
    lifecycleStage = "NAMED_LOCATION_VALIDATION";
    if (manifest.stage === "REPLAY" || manifest.mode === "REPLAY") {
      throw Object.assign(new Error("--resolve-named-location is unavailable for disconnected Replay"), { code: "SOURCE_STAGE_MODE_NOT_EXECUTABLE" });
    }
    if (!values.execute) throw new Error("--resolve-named-location requires --execute so the preflight and Google request are retained");
    if (!values["sample-id"]) throw new Error("--resolve-named-location requires --sample-id from the frozen manifest");
    const sample = manifest.samples.find((candidate) => candidate.id === values["sample-id"]);
    if (!sample) throw new Error("Named-location sample id is not in the frozen manifest");
    if (process.env.PRAXIS_ALLOW_LIVE_RESTAURANT_READ !== "1") {
      throw new Error("Enable PRAXIS_ALLOW_LIVE_RESTAURANT_READ for an authorized named-location source read");
    }
    const label = values["resolve-named-location"].trim();
    if (!label || label.length > 120) throw Object.assign(new Error("--resolve-named-location must be a bounded public place label"), { code: "LOCATION_LABEL_NOT_FROZEN" });
    const frozenLabel = frozenSampleLocationLabel(sample);
    if (!frozenLabel || normalizedLocationLabel(label) !== normalizedLocationLabel(frozenLabel)) {
      throw Object.assign(new Error("--resolve-named-location must match the frozen sample label"), { code: "LOCATION_LABEL_NOT_FROZEN" });
    }
    const requestedRadiusMeters = frozenNamedLocationRadius(sample);
    lifecycleStage = "PREFLIGHT";
    preflightStarted = true;
    const preflight = await runLivePreflight({ runner: "SOURCE_STAGE_PROBE", targets: ["GOOGLE"], network, timeoutMs: 10_000 }, effectiveEnvironment);
    preflightArtifactPath = preflight.artifactPath;
    lifecycleStage = "NAMED_LOCATION_RESOLUTION";
    sourceExecutionStarted = true;
    const startedAt = Date.now();
    const readRunId = `source-stage-location:${manifestFingerprint}:${sample.id}`;
    const search = new GooglePlacesRestaurantSearch(
      GooglePlacesClient.fromEnvironment(effectiveEnvironment),
      undefined,
      10,
      { maxRequests: 1 },
    );
    try {
      const resolution = await search.resolveNamedNearbyLocation({
        intent: { timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: label }, area: { query: `near ${label}` }, criteria: [] },
        readRunId,
      }, AbortSignal.timeout(manifest.budget.sampleMaxElapsedMs));
      if (!resolution.location) throw Object.assign(new Error("Named place did not resolve a coordinate"), { code: "GOOGLE_LOCATION_UNRESOLVED" });
      if (requestedRadiusMeters !== undefined && resolution.location.radiusMeters !== requestedRadiusMeters) {
        throw Object.assign(new Error("Named place resolution did not retain the frozen radius"), { code: "LOCATION_RADIUS_NOT_FROZEN" });
      }
      const usage = search.googleRequestUsage(readRunId);
      await matrixJournal.finish({
        status: "SUCCEEDED", stage: "NAMED_LOCATION_RESOLUTION", sampleId: sample.id,
        requestedLabel: label, ...(requestedRadiusMeters !== undefined ? { requestedRadiusMeters } : {}), elapsedMs: Date.now() - startedAt, modelCallsStarted: 0,
        preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs },
        location: resolution.location, ...(resolution.publicLocationObservation ? { publicLocationObservation: resolution.publicLocationObservation } : {}), googleRequestUsage: usage,
        replay: "NOT_APPLICABLE",
      });
      console.log(JSON.stringify({ artifactPath: matrixJournal.resultPath, sampleId: sample.id, location: resolution.location, googleRequestUsage: usage }));
    } catch (error) {
      const usage = search.googleRequestUsage(readRunId);
      const publicLocationObservations = error && typeof error === "object" && "publicLocationObservations" in error
        && Array.isArray(error.publicLocationObservations) ? error.publicLocationObservations : undefined;
      await matrixJournal.finish({
        status: "FAILED", stage: "NAMED_LOCATION_RESOLUTION", sampleId: sample.id,
        requestedLabel: label, ...(requestedRadiusMeters !== undefined ? { requestedRadiusMeters } : {}), elapsedMs: Date.now() - startedAt, modelCallsStarted: 0,
        preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs },
        googleRequestUsage: usage, failureCode: diagnosticFailureCode(error),
        ...(publicLocationObservations ? { publicLocationObservations } : {}),
        replay: "NOT_APPLICABLE",
      });
      console.error(JSON.stringify({ artifactPath: matrixJournal.resultPath, sampleId: sample.id, failureCode: diagnosticFailureCode(error) }));
      process.exitCode = 1;
    }
  } else if (!values.execute) {
    lifecycleStage = "PLAN_FROZEN";
    await matrixJournal.finish({
      status: "SUCCEEDED",
      stage: "PLAN_FROZEN",
      plannedSampleCount: manifest.samples.length,
      actualModelCalls: 0,
      externalRequests: 0,
      downstreamTaskStarts: 0,
      replay: "NOT_STARTED",
    });
    console.log(JSON.stringify({ artifactPath: matrixJournal.resultPath, manifestFingerprint, status: "PLAN_FROZEN", plannedSampleCount: manifest.samples.length }));
  } else {
    lifecycleStage = "EXECUTION_VALIDATION";
    const offlineReplay = manifest.stage === "REPLAY";
    if (!offlineReplay && (process.env.PRAXIS_ALLOW_LIVE_RESTAURANT_READ !== "1" || process.env.PRAXIS_ALLOW_BROWSER_RUN !== "1")) {
      throw new Error("Enable PRAXIS_ALLOW_LIVE_RESTAURANT_READ and PRAXIS_ALLOW_BROWSER_RUN for an authorized source-stage read");
    }
    const matrixStartedAt = Date.now();
    const preflight = offlineReplay ? undefined : await (async () => {
      lifecycleStage = "PREFLIGHT";
      preflightStarted = true;
      const value = await runLivePreflight({ runner: "SOURCE_STAGE_PROBE", targets: manifest.network.preflightTargets, network, timeoutMs: 10_000 }, effectiveEnvironment);
      preflightArtifactPath = value.artifactPath;
      return value;
    })();
    lifecycleStage = `${manifest.stage}_EXECUTION`;
    sourceExecutionStarted = true;
    for (const sample of manifest.samples) {
      // The matrix cap is enforced before a provider can dispatch a model,
      // not reconstructed only from the final summary. A zero remainder still
      // lets a deterministic source path settle its planned denominator.
      const sampleModelLimit = remainingSourceStageSampleModelCalls(manifest, settledSourceAttempts);
      const journal = await startDiagnosticRun(artifactDirectory, {
        mode: stageRunMode,
        manifestFingerprint, sample: { id: sample.id, sourcePackId: sample.sourcePackId, input: sample.input },
        budget: { maxElapsedMs: manifest.budget.sampleMaxElapsedMs, maxModelCalls: sampleModelLimit },
        ...(preflight ? { preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs } } : { replayTransport: "OFFLINE_HAR_NO_PREFLIGHT" }),
        evaluator: manifest.evaluator,
        replay: { fallbackNetwork: "DISABLED_BY_CONTRACT", status: "NOT_STARTED" },
      });
      const startedAt = Date.now();
      let attempt: SourceStageProbeAttempt;
      let recording: BrowserReadRecording | undefined;
      let replayDecision: ReturnType<typeof createFrozenReplayBrowserDecision> | undefined;
      const diagnostics: Array<ReturnType<typeof safeSourceStageDiagnostic>> = [];
      const browserTrace: Array<{ kind: string; detail: unknown }> = [];
      const sampleBudget: BrowserExecutionBudget = { totalModelCalls: 0, maxModelCalls: sampleModelLimit };
      try {
        if (sample.input.locationResolution === "UNRESOLVED" || sample.input.locationResolution === "PENDING_NAMED_LOCATION_READ") {
          throw Object.assign(new Error("Frozen named-location resolution did not produce an exact coordinate context"), { code: "LOCATION_RESOLUTION_UNRESOLVED" });
        }
        const pack = discoveryPackById(sample.sourcePackId);
        if (!pack) throw new Error(`No registered Source Pack for ${sample.sourcePackId}`);
        recording = manifest.recording.enabled
          ? new BrowserReadRecording({ directory: resolve(".eval-artifacts", "recordings"), runId: `source-stage-${sample.id}-${Date.now()}`,
            reviewedStaticResources: pack.staticResources, reviewedReads: pack.reviewedReads })
          : undefined;
        let recordingResult: Awaited<ReturnType<BrowserReadRecording["finish"]>> | undefined;
        const recordTrace = (kind: string, detail: unknown) => {
          const safeDetail = safeSourceStageTrace(kind, detail);
          browserTrace.push({ kind, detail: safeDetail });
          recording?.record(kind, safeDetail);
          return browserTrace.length;
        };
        const locationContext = frozenLocationContext(sample.input);
        const common = {
          now: () => new Date().toISOString(),
          browserBudget: sampleBudget,
          onBrowserDiagnostic: (diagnostic: import("../../../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic) => {
            diagnostics.push(safeSourceStageDiagnostic(diagnostic));
            recordTrace("EXECUTOR_DIAGNOSTIC", diagnostic);
          },
        };
        let stageResult: Record<string, unknown>;
        let modelCallsStarted: number;
        let status: SourceStageProbeAttempt["status"];
        let discoveryCoverage: SourceStageProbeAttempt["discoveryCoverage"];
        if (manifest.stage === "DISCOVERY" && !pack.browser) {
          const intent = discoveryIntent(sample.input);
          const location = locationContext ?? (intent.area.coordinates ? {
            latitude: intent.area.coordinates.latitude,
            longitude: intent.area.coordinates.longitude,
            radiusMeters: intent.area.radiusMeters ?? 3_000,
            label: intent.area.query,
            areaMatchBasis: "TASK_LOCATION_RADIUS" as const,
          } : undefined);
          if (!location) throw Object.assign(new Error("Frozen Google discovery sample requires a resolved location context"), { code: "LOCATION_RESOLUTION_UNRESOLVED" });
          const google = new GooglePlacesRestaurantSearch(
            GooglePlacesClient.fromEnvironment(effectiveEnvironment), undefined, 10, { maxRequests: 2 },
          );
          const result = await runSourceStagePackDiscoveryProbe({ pack, search: google, intent, location,
            readRunId: `source-stage:${manifestFingerprint}:${sample.id}`, signal: AbortSignal.timeout(manifest.budget.sampleMaxElapsedMs),
            modelCallsStarted: sampleBudget.totalModelCalls });
          status = result.status === "LIST_OBSERVED" ? "SUCCEEDED" : result.status === "NO_COVERAGE" ? "NO_COVERAGE" : "FAILED";
          discoveryCoverage = result.discoveryCoverage;
          modelCallsStarted = result.modelCallsStarted;
          stageResult = { route: "GOOGLE_DISCOVERY_PACK", result: { ...result, read: safeRecord(result.read) } };
        } else {
          const rawRuntime = browserRuntimeFromEnvironment(effectiveEnvironment);
          const replayHarPath = manifest.stage === "REPLAY" ? frozenReplayHarPath(sample.input) : undefined;
          let replay: Awaited<ReturnType<typeof frozenReplayWires>> | undefined;
          if (replayHarPath) {
            const rawHar = await readFile(replayHarPath, "utf8");
            if (sha256(rawHar) !== replayFrozenString(sample.input, "replayHarSha256")) {
              throw Object.assign(new Error("Replay HAR bytes no longer match the frozen digest"), { code: "REPLAY_ACTION_NO_COVERAGE" });
            }
            replay = await frozenReplayWires(sample.input, pack.meta.id);
          }
          replayDecision = replay ? createFrozenReplayBrowserDecision(replay.wires) : undefined;
          const replayRuntime: BrowserRuntime = replayHarPath ? {
            ...(rawRuntime.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? { readNetworkBoundaryCapability: "ISOLATED_CONTEXT" as const } : {}),
            openSession: (input: Parameters<typeof rawRuntime.openSession>[0]) => rawRuntime.openSession({ ...input, replayHarPath }),
          } : rawRuntime;
          const browserProvider = manifest.stage === "WEBSITE_FACTS" ? "RESTAURANT_WEBSITE" : pack.browser?.provider;
          if (!browserProvider) throw Object.assign(new Error("Source Pack has no browser provider for this stage"), { code: "SOURCE_STAGE_BROWSER_NOT_APPLICABLE" });
          const browser = traceBrowserRuntime(replayRuntime, browserProvider, recordTrace, recording?.snapshotSink());
          const model = replayHarPath
            ? { async complete() { throw Object.assign(new Error("Replay never dispatches a model request"), { code: "REPLAY_MODEL_DISABLED" }); } }
            : sharedSourceStageModelGateway(DeepSeekModelGateway.fromEnvironment(effectiveEnvironment), sampleBudget);
        if (manifest.stage === "DISCOVERY" || replay?.originalStage === "DISCOVERY") {
          if (manifest.stage === "REPLAY" && replay?.originalStage !== "DISCOVERY") {
            throw Object.assign(new Error("Frozen Replay stage does not match the discovery production port"), { code: "REPLAY_ACTION_NO_COVERAGE" });
          }
          const result = await runSourceStageNativeDiscoveryProbe({
            pack,
            intent: discoveryIntent(sample.input),
            ...(locationContext ? { locationContext } : {}),
            runtime: browser,
            // A frozen replay with a frozen location context must not require
            // a Google credential merely to construct the unchanged Native
            // production port.  Any unexpected locality call is an explicit
            // no-coverage failure rather than an external fallback.
            locality: new GooglePlacesRestaurantSearch(
              replayHarPath
                ? new GooglePlacesClient({
                  apiKey: "offline-replay-disabled",
                  fetchImplementation: async () => {
                    throw Object.assign(new Error("Frozen replay cannot resolve a new location"), { code: "REPLAY_LOCATION_NO_COVERAGE" });
                  },
                })
                : GooglePlacesClient.fromEnvironment(effectiveEnvironment),
              undefined,
              10,
              { maxRequests: 2 },
            ),
            readRunId: `source-stage:${manifestFingerprint}:${sample.id}`,
            timeoutMs: manifest.budget.sampleMaxElapsedMs,
            signal: AbortSignal.timeout(manifest.budget.sampleMaxElapsedMs),
            ...(pack.browser ? { modelDecision: replayDecision ?? new ModelBrowserReadActionDecision(model) } : {}),
            browserBudget: sampleBudget,
            onDiagnostic: common.onBrowserDiagnostic,
          });
          status = result.status === "LIST_OBSERVED" || result.status === "EXPLICIT_EMPTY" ? "SUCCEEDED"
            : result.status === "NO_COVERAGE" ? "NO_COVERAGE" : "FAILED";
          discoveryCoverage = result.discoveryCoverage;
          modelCallsStarted = reportedSourceStageModelCalls(manifest.stage, result.modelCallsStarted);
          stageResult = { ...(replay ? { route: "OFFLINE_HAR_REPLAY_DISCOVERY", replayedDecisionCount: replayDecision?.replayedDecisionCount() ?? 0 } : {}), result: { ...result, read: safeRecord(result.read) } };
        } else if (manifest.stage === "AVAILABILITY" || manifest.stage === "IDENTITY" || replay?.originalStage === "AVAILABILITY" || replay?.originalStage === "IDENTITY") {
          if (manifest.stage === "REPLAY" && replay?.originalStage !== "AVAILABILITY" && replay?.originalStage !== "IDENTITY") {
            throw Object.assign(new Error("Frozen Replay stage does not match the availability-backed production port"), { code: "REPLAY_ACTION_NO_COVERAGE" });
          }
          if (!pack.availability) throw Object.assign(new Error("Frozen source Pack has no browser availability provider"), { code: "SOURCE_STAGE_PACK_UNSUPPORTED" });
          const availability = new LiveBrowserAvailability(browser, model, {
            ...common,
            packs: [pack],
            maxModelCallsTotal: sampleModelLimit,
            maxElapsedMsPerCandidate: manifest.budget.sampleMaxElapsedMs,
            maxElapsedMsPerProvider: manifest.budget.sampleMaxElapsedMs,
            maxAutomaticElapsedMs: manifest.budget.sampleMaxElapsedMs,
            ...(replayDecision ? { modelDecision: replayDecision } : {}),
            ...(browser.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? { networkPolicy: discoveryPackNetworkPolicy([pack]) } : {}),
          });
          const result = await runSourceStageAvailabilityProbe({
            availability,
            request: frozenAvailabilityRequest(sample.input),
            signal: AbortSignal.timeout(manifest.budget.sampleMaxElapsedMs),
            browserBudget: sampleBudget,
          });
          // Identity reads the existing availability provider because it owns
          // the outlet page and source-bound identity extraction. It is never
          // promoted to an availability or evaluator verdict by this runner.
          status = "SUCCEEDED";
          modelCallsStarted = reportedSourceStageModelCalls(manifest.stage, result.modelCallsStarted);
          stageResult = { route: replay ? replay.originalStage === "IDENTITY" ? "OFFLINE_HAR_REPLAY_IDENTITY" : "OFFLINE_HAR_REPLAY_AVAILABILITY" : manifest.stage === "IDENTITY" ? "IDENTITY_READ_THROUGH_AVAILABILITY" : "AVAILABILITY", ...(replay ? { replayedDecisionCount: replayDecision?.replayedDecisionCount() ?? 0 } : {}), read: safeRecord(result.read) };
        } else if (manifest.stage === "WEBSITE_FACTS") {
          // This stage measures the Google-listed public website itself. The
          // normal full composition first reuses Google facts, which is right
          // for a hybrid task but would make this stage report a completed
          // Google record without opening its listed website.
          const facts = new GoogleListedWebsiteFactRead(
            browser,
            new ModelRestaurantFactJudgment(model, common.now),
            common.now,
            new ModelBrowserReadActionDecision(model),
            sampleBudget,
            common.onBrowserDiagnostic,
            browser.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? restaurantPublicReadNetworkPolicy : undefined,
          );
          const result = await runSourceStageFactsProbe({
            facts,
            request: frozenFactRequest(sample.input),
            signal: AbortSignal.timeout(manifest.budget.sampleMaxElapsedMs),
            browserBudget: sampleBudget,
          });
          status = "SUCCEEDED";
          modelCallsStarted = result.modelCallsStarted;
          stageResult = { route: "WEBSITE_FACTS", read: safeRecord(result.read) };
        } else throw Object.assign(new Error("Frozen Replay source stage has no executable production port"), { code: "REPLAY_ACTION_NO_COVERAGE" });
        }
        recordingResult = recording ? await recording.finish() : undefined;
        recording = undefined;
        const replay = manifest.stage === "REPLAY"
          ? (status === "SUCCEEDED" ? "REPLAYED" as const : "NO_COVERAGE" as const)
          : recordingResult?.replay.status === "REPLAYABLE" ? "NO_COVERAGE" as const
            : manifest.recording.enabled ? "NO_COVERAGE" as const : "NOT_APPLICABLE" as const;
        await journal.finish({ status: status === "NO_COVERAGE" ? "FAILED" : status, stage: manifest.stage, elapsedMs: Date.now() - startedAt, modelCallsStarted,
          result: { ...stageResult, diagnostics, browserTrace, ...(recordingResult ? { recording: recordingResult } : {}) } });
        attempt = { sampleId: sample.id, status, elapsedMs: Date.now() - startedAt, modelCallsStarted, ...(preflight ? { preflightArtifactPath: preflight.artifactPath } : {}),
          resultArtifactPath: journal.resultPath, ...(manifest.stage === "DISCOVERY" && discoveryCoverage ? { discoveryCoverage } : {}), guardAssessment: "NOT_ASSESSED", replay };
      } catch (error) {
        const recordingResult = recording ? await recording.finish() : undefined;
        recording = undefined;
        const measuredModelCalls = error && typeof error === "object" && "sourceStageModelCalls" in error && typeof error.sourceStageModelCalls === "number"
          ? error.sourceStageModelCalls : sampleBudget.totalModelCalls;
        const modelCallsStarted = reportedSourceStageModelCalls(manifest.stage, measuredModelCalls);
        const failureCode = diagnosticFailureCode(error);
        // Frozen Replay is only executable when its original action trace can
        // rebind to the current DOM. A missing trace/HAR action is evidence of
        // coverage loss, not a failed remote source operation.
        const replayNoCoverage = manifest.stage === "REPLAY" && failureCode.startsWith("REPLAY_");
        await journal.finish({ status: "FAILED", stage: manifest.stage, elapsedMs: Date.now() - startedAt, modelCallsStarted, failureCode, diagnostics, browserTrace, ...(manifest.stage === "REPLAY" ? { replayedDecisionCount: replayDecision?.replayedDecisionCount() ?? 0 } : {}), ...(recordingResult ? { recording: recordingResult } : {}) });
        attempt = { sampleId: sample.id, status: replayNoCoverage ? "NO_COVERAGE" : "FAILED", elapsedMs: Date.now() - startedAt, modelCallsStarted, ...(preflight ? { preflightArtifactPath: preflight.artifactPath } : {}), resultArtifactPath: journal.resultPath, failureCode, guardAssessment: "NOT_ASSESSED", replay: manifest.stage === "REPLAY" ? "NO_COVERAGE" : manifest.recording.enabled ? "NO_COVERAGE" : "NOT_APPLICABLE" };
      }
      // Keep the settled attempt before optional sidecar writes. If a sidecar
      // fails, the outer journal still reports known model use truthfully.
      settledSourceAttempts.push(attempt);
      const sidecars = await writeEvaluationAndAcceptance(manifest, journal.resultPath, attempt);
      settledSourceAttempts[settledSourceAttempts.length - 1] = { ...attempt, evaluationArtifactPath: sidecars.evaluationPath, acceptanceArtifactPath: sidecars.acceptancePath };
    }
    lifecycleStage = `${manifest.stage}_MATRIX_SETTLEMENT`;
    const summary = summarizeSourceStageAttempts(manifest, settledSourceAttempts, { matrixElapsedMs: Date.now() - matrixStartedAt });
    // `LIST_OBSERVED` can still be a broad result set whose candidates were
    // filtered locally. It is useful evidence, but cannot claim a current
    // frozen-region source query without dedicated production metadata.
    const eligibleEvidenceCount = settledSourceAttempts.filter((attempt) => attempt.status === "SUCCEEDED").length;
    // Direct stage artifacts still need a complete successful source read
    // before they can advance to independent human/raw-support review. A
    // missing Replay action or HAR entry is NO_COVERAGE, never a successful
    // matrix merely because this runner does not apply the full Hybrid scorer.
    const directStageCoverageMissing = manifest.stage !== "DISCOVERY"
      && settledSourceAttempts.some((attempt) => attempt.status !== "SUCCEEDED");
    const matrixFailed = !summary.completeDenominator
      || !summary.budgetCompliant
      || (manifest.stage === "DISCOVERY" && eligibleEvidenceCount < 9)
      || directStageCoverageMissing
      || summary.guardAssessment === "FALSE_GUARD_BLOCK";
    const acceptance = matrixFailed ? "FAIL" : "REVIEW_REQUIRED";
    await matrixJournal.finish({
      status: matrixFailed ? "FAILED" : "SUCCEEDED",
      stage: `${manifest.stage}_MATRIX`,
      ...(preflight ? { preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs } } : { replayTransport: "OFFLINE_HAR_NO_PREFLIGHT" }),
      attempts: settledSourceAttempts,
      summary,
      acceptance,
      reviewReasons: [
        ...(manifest.stage === "DISCOVERY" ? ["CURRENT_QUERY_BINDING_NOT_ASSESSED"] : ["DIRECT_STAGE_RAW_SUPPORT_REQUIRES_INDEPENDENT_REVIEW"]),
        ...(summary.guardAssessment === "NOT_ASSESSED" ? ["GUARD_ASSESSMENT_NOT_ASSESSED"] : []),
      ],
      threshold: { minimumEligibleEvidence: manifest.stage === "DISCOVERY" ? 9 : "STAGE_SPECIFIC_INDEPENDENT_REVIEW", guardAssessment: summary.guardAssessment },
    });
    console.log(JSON.stringify({ artifactPath: matrixJournal.resultPath, manifestFingerprint, acceptance, summary }));
    if (matrixFailed) process.exitCode = 1;
  }
} catch (error) {
  const knownSourceModelCalls = settledSourceAttempts.reduce((total, attempt) => total + attempt.modelCallsStarted, 0);
  const failedPreflightArtifactPath = error && typeof error === "object" && "artifactPath" in error && typeof error.artifactPath === "string"
    ? error.artifactPath : undefined;
  await matrixJournal.finish({
    status: "FAILED",
    stage: lifecycleStage,
    failureCode: diagnosticFailureCode(error),
    actualModelCalls: sourceExecutionStarted
      ? { status: "NOT_MEASURED", knownSettledCalls: knownSourceModelCalls }
      : 0,
    externalRequests: preflightStarted
      ? { status: "NOT_MEASURED", ...((preflightArtifactPath ?? failedPreflightArtifactPath) ? { preflightArtifactPath: preflightArtifactPath ?? failedPreflightArtifactPath } : {}) }
      : 0,
    downstreamTaskStarts: sourceExecutionStarted ? "NOT_MEASURED" : 0,
  });
  throw error;
}
