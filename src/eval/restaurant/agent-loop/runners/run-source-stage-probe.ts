import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import type { RestaurantSearchIntent } from "../../../../domains/restaurant/contracts.js";
import { browserRuntimeFromEnvironment } from "../../../../infrastructure/browser/browser-runtime-factory.js";
import { ModelBrowserReadActionDecision } from "../../../../infrastructure/browser/browser-action-decision.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../../integrations/google/google-places-restaurant-search.js";
import { discoveryPackById } from "../../../../integrations/restaurant-search/source-packs.js";
import { diagnosticFailureCode, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { environmentWithEffectiveLiveNetwork, resolveEffectiveLiveNetworkConfiguration, runLivePreflight } from "../live-preflight.js";
import { BrowserReadRecording } from "./browser-read-recording.js";
import { safeRecord, traceBrowserRuntime } from "./browser-case-slice-evidence.js";
import {
  createSourceStageProbeManifest,
  runSourceStageNativeDiscoveryProbe,
  sourceStageManifestFingerprint,
  summarizeSourceStageAttempts,
  sourceStageSampleBudgetViolations,
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
const matrixJournal = await startDiagnosticRun(artifactDirectory, {
  mode: values.execute ? "SOURCE_STAGE_PROBE" : "SOURCE_STAGE_PROBE_PLAN",
  manifest: { ...manifest, inputManifestPath: relative(process.cwd(), manifestPath) },
  manifestFingerprint,
  execution: values.execute ? "LIVE_READ_ONLY_PENDING_PREFLIGHT" : "NOT_STARTED_PLAN_ONLY",
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
  const evaluation = { schemaVersion: "source-stage-probe-evaluation@1", applicability: "NOT_APPLICABLE", reason: "Discovery page parse does not create a restaurant claim or user-goal completion.", sampleId: attempt.sampleId, resultArtifactPath: resultPath };
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
  // or model setup can occur. A plan/replay manifest is never executable live.
  if (values.execute && manifest.mode !== "LIVE_READ_ONLY") {
    lifecycleStage = "MODE_VALIDATION";
    throw Object.assign(new Error("Only LIVE_READ_ONLY source-stage manifests may execute"), { code: "SOURCE_STAGE_MODE_NOT_EXECUTABLE" });
  }
  if (values["resolve-named-location"]) {
    lifecycleStage = "NAMED_LOCATION_VALIDATION";
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
      const usage = search.googleRequestUsage(readRunId);
      await matrixJournal.finish({
        status: "SUCCEEDED", stage: "NAMED_LOCATION_RESOLUTION", sampleId: sample.id,
        requestedLabel: label, elapsedMs: Date.now() - startedAt, modelCallsStarted: 0,
        preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs },
        location: resolution.location, googleRequestUsage: usage,
        replay: "NOT_APPLICABLE",
      });
      console.log(JSON.stringify({ artifactPath: matrixJournal.resultPath, sampleId: sample.id, location: resolution.location, googleRequestUsage: usage }));
    } catch (error) {
      const usage = search.googleRequestUsage(readRunId);
      const publicLocationObservations = error && typeof error === "object" && "publicLocationObservations" in error
        && Array.isArray(error.publicLocationObservations) ? error.publicLocationObservations : undefined;
      await matrixJournal.finish({
        status: "FAILED", stage: "NAMED_LOCATION_RESOLUTION", sampleId: sample.id,
        requestedLabel: label, elapsedMs: Date.now() - startedAt, modelCallsStarted: 0,
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
    if (manifest.stage !== "DISCOVERY") throw new Error("Only DISCOVERY source-stage execution is currently wired; identity, availability and website-facts manifests remain plan-only until their source inputs are frozen");
    if (process.env.PRAXIS_ALLOW_LIVE_RESTAURANT_READ !== "1" || process.env.PRAXIS_ALLOW_BROWSER_RUN !== "1") {
      throw new Error("Enable PRAXIS_ALLOW_LIVE_RESTAURANT_READ and PRAXIS_ALLOW_BROWSER_RUN for an authorized source-stage read");
    }
    const matrixStartedAt = Date.now();
    lifecycleStage = "PREFLIGHT";
    preflightStarted = true;
    const preflight = await runLivePreflight({ runner: "SOURCE_STAGE_PROBE", targets: manifest.network.preflightTargets, network, timeoutMs: 10_000 }, effectiveEnvironment);
    preflightArtifactPath = preflight.artifactPath;
    lifecycleStage = "DISCOVERY_EXECUTION";
    sourceExecutionStarted = true;
    for (const sample of manifest.samples) {
      const journal = await startDiagnosticRun(artifactDirectory, {
        mode: "LIVE_READ_ONLY_SOURCE_STAGE_DISCOVERY", manifestFingerprint, sample: { id: sample.id, sourcePackId: sample.sourcePackId, input: sample.input },
        budget: { maxElapsedMs: manifest.budget.sampleMaxElapsedMs, maxModelCalls: manifest.budget.sampleMaxModelCalls },
        preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs },
        evaluator: { applicability: "NOT_APPLICABLE", reason: "Discovery parse does not establish a restaurant claim." },
        replay: { fallbackNetwork: "DISABLED_BY_CONTRACT", status: "NOT_STARTED" },
      });
      const startedAt = Date.now();
      let attempt: SourceStageProbeAttempt;
      let recording: BrowserReadRecording | undefined;
      const diagnostics: Array<ReturnType<typeof safeSourceStageDiagnostic>> = [];
      const browserTrace: Array<{ kind: string; detail: unknown }> = [];
      try {
        if (sample.input.locationResolution === "UNRESOLVED") {
          throw Object.assign(new Error("Frozen named-location resolution did not produce an exact coordinate context"), { code: "LOCATION_RESOLUTION_UNRESOLVED" });
        }
        const pack = discoveryPackById(sample.sourcePackId);
        if (!pack) throw new Error(`No registered Source Pack for ${sample.sourcePackId}`);
        recording = manifest.recording.enabled
          ? new BrowserReadRecording({ directory: resolve(".eval-artifacts", "recordings"), runId: `source-stage-${sample.id}-${Date.now()}` })
          : undefined;
        let recordingResult: Awaited<ReturnType<BrowserReadRecording["finish"]>> | undefined;
        const recordTrace = (kind: string, detail: unknown) => {
          const safeDetail = safeSourceStageTrace(kind, detail);
          browserTrace.push({ kind, detail: safeDetail });
          recording?.record(kind, safeDetail);
          return browserTrace.length;
        };
        const rawRuntime = browserRuntimeFromEnvironment(effectiveEnvironment);
        const browser = traceBrowserRuntime(rawRuntime, pack.browser?.provider ?? "TABLECHECK", recordTrace, recording?.snapshotSink());
        // Google discovery has a deterministic structured request and must
        // not acquire an unrelated model configuration or preflight target.
        // Browser Packs receive the existing bounded decision port only when
        // their current page actually needs an uncertain-layout action.
        const modelDecision = pack.browser ? new ModelBrowserReadActionDecision(DeepSeekModelGateway.fromEnvironment(effectiveEnvironment)) : undefined;
        const locationContext = frozenLocationContext(sample.input);
        const result = await runSourceStageNativeDiscoveryProbe({
          pack,
          intent: discoveryIntent(sample.input),
          ...(locationContext ? { locationContext } : {}),
          runtime: browser,
          locality: new GooglePlacesRestaurantSearch(
            GooglePlacesClient.fromEnvironment(effectiveEnvironment),
            undefined,
            10,
            { maxRequests: 2 },
          ),
          readRunId: `source-stage:${manifestFingerprint}:${sample.id}`,
          timeoutMs: manifest.budget.sampleMaxElapsedMs,
          signal: AbortSignal.timeout(manifest.budget.sampleMaxElapsedMs),
          ...(modelDecision ? { modelDecision } : {}),
          browserBudget: { totalModelCalls: 0, maxModelCalls: manifest.budget.sampleMaxModelCalls },
          onDiagnostic: (diagnostic) => {
            diagnostics.push(safeSourceStageDiagnostic(diagnostic));
            recordTrace("EXECUTOR_DIAGNOSTIC", diagnostic);
          },
        });
        recordingResult = recording ? await recording.finish() : undefined;
        recording = undefined;
        const status = result.status === "LIST_OBSERVED" || result.status === "EXPLICIT_EMPTY" ? "SUCCEEDED" as const
          : result.status === "NO_COVERAGE" ? "NO_COVERAGE" as const : "FAILED" as const;
        const replay = recordingResult?.replay.status === "REPLAYABLE" ? "NO_COVERAGE" as const : manifest.recording.enabled ? "NO_COVERAGE" as const : "NOT_APPLICABLE" as const;
        await journal.finish({ status: status === "NO_COVERAGE" ? "FAILED" : status, stage: "DISCOVERY", elapsedMs: Date.now() - startedAt, modelCallsStarted: result.modelCallsStarted, result: { ...result, read: safeRecord(result.read), diagnostics, browserTrace, ...(recordingResult ? { recording: recordingResult } : {}) } });
        attempt = { sampleId: sample.id, status, elapsedMs: Date.now() - startedAt, modelCallsStarted: result.modelCallsStarted, preflightArtifactPath: preflight.artifactPath, resultArtifactPath: journal.resultPath, ...(result.failureCode ? { failureCode: result.failureCode } : {}), discoveryCoverage: result.discoveryCoverage, guardAssessment: "NOT_ASSESSED", replay };
      } catch (error) {
        const recordingResult = recording ? await recording.finish() : undefined;
        recording = undefined;
        const modelCallsStarted = error && typeof error === "object" && "sourceStageModelCalls" in error && typeof error.sourceStageModelCalls === "number"
          ? error.sourceStageModelCalls : 0;
        await journal.finish({ status: "FAILED", stage: "DISCOVERY", elapsedMs: Date.now() - startedAt, modelCallsStarted, failureCode: diagnosticFailureCode(error), diagnostics, browserTrace, ...(recordingResult ? { recording: recordingResult } : {}) });
        attempt = { sampleId: sample.id, status: "FAILED", elapsedMs: Date.now() - startedAt, modelCallsStarted, preflightArtifactPath: preflight.artifactPath, resultArtifactPath: journal.resultPath, failureCode: diagnosticFailureCode(error), guardAssessment: "NOT_ASSESSED", replay: manifest.recording.enabled ? "NO_COVERAGE" : "NOT_APPLICABLE" };
      }
      // Keep the settled attempt before optional sidecar writes. If a sidecar
      // fails, the outer journal still reports known model use truthfully.
      settledSourceAttempts.push(attempt);
      const sidecars = await writeEvaluationAndAcceptance(manifest, journal.resultPath, attempt);
      settledSourceAttempts[settledSourceAttempts.length - 1] = { ...attempt, evaluationArtifactPath: sidecars.evaluationPath, acceptanceArtifactPath: sidecars.acceptancePath };
    }
    lifecycleStage = "DISCOVERY_MATRIX_SETTLEMENT";
    const summary = summarizeSourceStageAttempts(manifest, settledSourceAttempts, { matrixElapsedMs: Date.now() - matrixStartedAt });
    // `LIST_OBSERVED` can still be a broad result set whose candidates were
    // filtered locally. It is useful evidence, but cannot claim a current
    // frozen-region source query without dedicated production metadata.
    const eligibleEvidenceCount = settledSourceAttempts.filter((attempt) => attempt.status === "SUCCEEDED").length;
    const matrixFailed = !summary.completeDenominator
      || !summary.budgetCompliant
      || eligibleEvidenceCount < 9
      || summary.guardAssessment === "FALSE_GUARD_BLOCK";
    const acceptance = matrixFailed ? "FAIL" : "REVIEW_REQUIRED";
    await matrixJournal.finish({
      status: matrixFailed ? "FAILED" : "SUCCEEDED",
      stage: "DISCOVERY_MATRIX",
      preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs },
      attempts: settledSourceAttempts,
      summary,
      acceptance,
      reviewReasons: ["CURRENT_QUERY_BINDING_NOT_ASSESSED", ...(summary.guardAssessment === "NOT_ASSESSED" ? ["GUARD_ASSESSMENT_NOT_ASSESSED"] : [])],
      threshold: { minimumEligibleEvidence: 9, guardAssessment: summary.guardAssessment },
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
