import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { LiveBrowserAvailability } from "../../../integrations/restaurant-availability/live-browser-availability.js";
import { composeNativeRestaurantRead } from "../../../integrations/restaurant-search/native-read-composition.js";
import { NativeRestaurantSearch } from "../../../integrations/restaurant-search/native-restaurant-search.js";
import { restaurantSearchIntentFingerprint } from "../../../domains/restaurant/contracts.js";
import { createHybridReadComposition } from "./hybrid-read-composition.js";
import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "./live-case-materializer.js";
import { traceBrowserSession } from "./runners/browser-case-slice-evidence.js";

import { center, date, reference, sourcePages, type SourceScenario } from "./native-fixed-source-pages.js";

function reply(outputText: string, purpose: string): ModelResponse {
  return { invocationId: purpose, provider: "FIXTURE", model: "scripted-boundary", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

function action(type: string, candidateIds: string[] = []) {
  return { type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "Use current evidence" };
}

class H001NativeModel implements ModelGateway {
  readonly purposes: string[] = [];
  retrievalFillUsed = false;
  readonly discoveryActions: string[] = [];
  private searches = 0;
  private earlyEndAttempted = false;
  private earlyPartialAttempted = false;
  constructor(private readonly scenario: SourceScenario) {}
  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.purposes.push(request.purpose);
    if (this.purposes.length > 50) throw new Error("H001 shared 50-call model ceiling exceeded");
    if (request.purpose === "restaurant_semantic_interpret") return reply(JSON.stringify({ schemaVersion: "3", facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase spot", selectionScope: "OPEN_ENDED" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: date, raw: "tonight" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", strength: "HARD", polarity: "POSITIVE" } },
    ] }), request.purpose);
    if (request.purpose === "restaurant_fact_judgment") {
      const input = JSON.parse(request.messages.find((item) => item.role === "user")!.content) as {
        sourceDocuments: Array<{ id: string; statements: Array<{ id: string; text: string }> }>;
      };
      const selected = input.sourceDocuments.flatMap((document) => document.statements
        .filter((item) => /omakase course/i.test(item.text)).map((item) => ({ documentId: document.id, statementIds: [item.id] })))[0];
      return reply(JSON.stringify({ sourceSelections: selected ? [selected] : [], judgments: selected ? [{
        criterion: "omakase", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: [selected.documentId],
      }] : [] }), request.purpose);
    }
    if (request.purpose === "browser_read_decide") {
      const input = JSON.parse(request.messages.find((item) => item.role === "user")!.content) as {
        observation: { visibleText?: string; targets: Array<{ ref: string; label: string; availableActions?: string[] }> };
      };
      const retrieval = input.observation.visibleText?.includes("Loading current search") ? undefined
        : input.observation.targets.find((target) => /search|venue/i.test(target.label) && target.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL"));
      const reveal = input.observation.targets.find((target) => target.label === "Show public venues");
      const availabilityReveal = input.observation.targets.find((target) => target.label === "Show availability");
      return reply(JSON.stringify(retrieval
        ? (this.retrievalFillUsed = true, this.discoveryActions.push("FILL_AUTHORITATIVE"), { action: "FILL_AUTHORITATIVE", targetRef: retrieval.ref, authoritativeField: "RETRIEVAL", requestedState: "NONE", reason: "Apply the bounded public venue search expression." })
        : reveal
        ? (this.discoveryActions.push("CLICK"), { action: "CLICK", targetRef: reveal.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Reveal the observed public venue results." })
        : availabilityReveal
        ? { action: "CLICK", targetRef: availabilityReveal.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Reveal the observed public availability result." }
        : { action: "REQUEST_HUMAN_HELP", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "No safe observed discovery action remains." },
      ), request.purpose);
    }
    if (request.purpose === "restaurant_agent_decide") {
      const input = JSON.parse(request.messages.find((item) => item.role === "user")!.content) as { context: {
        candidates?: Array<{ id: string }>; searchAvailability?: { available: boolean };
        factInvestigableCandidateIds?: string[]; checkableCandidateIds?: string[];
        presentation?: Array<{ candidateId: string; eligible: boolean }>;
        readCompletion?: { allowed: boolean };
      } };
      const context = input.context;
      if (this.scenario === "EARLY_END_ATTEMPT" && this.searches === 1 && !this.earlyEndAttempted) {
        this.earlyEndAttempted = true;
        return reply(JSON.stringify(action("END_READ")), request.purpose);
      }
      const eligible = context.presentation?.filter((item) => item.eligible).map((item) => item.candidateId) ?? [];
      if (this.scenario === "TABLECHECK_EARLY_ACTIONS") {
        if (this.searches === 2 && !this.earlyEndAttempted) {
          this.earlyEndAttempted = true;
          return reply(JSON.stringify(action("END_READ")), request.purpose);
        }
        if (this.searches === 2 && eligible.length && !this.earlyPartialAttempted) {
          this.earlyPartialAttempted = true;
          return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
        }
        if (this.searches === 2 && !this.earlyPartialAttempted && context.factInvestigableCandidateIds?.length === 1
          && context.checkableCandidateIds?.length) {
          return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 1))), request.purpose);
        }
        if (context.factInvestigableCandidateIds?.length) return reply(JSON.stringify(action("INVESTIGATE_CANDIDATE_FACTS", context.factInvestigableCandidateIds.slice(0, 1))), request.purpose);
        if (context.checkableCandidateIds?.length) return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 1))), request.purpose);
        if (eligible.length) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
      }
      if (context.factInvestigableCandidateIds?.length) return reply(JSON.stringify(action("INVESTIGATE_CANDIDATE_FACTS", context.factInvestigableCandidateIds.slice(0, 3))), request.purpose);
      if (context.checkableCandidateIds?.length) return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 3))), request.purpose);
      if (eligible.length >= 3) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible.slice(0, 3))), request.purpose);
      if (eligible.length && !context.searchAvailability?.available) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
      if (context.searchAvailability?.available) {
        this.searches += 1;
        return reply(JSON.stringify(action("SEARCH_RESTAURANTS")), request.purpose);
      }
      if (context.readCompletion?.allowed) return reply(JSON.stringify(action("END_READ")), request.purpose);
      throw new Error(`No legal scripted action: ${JSON.stringify(context)}`);
    }
    throw new Error(`Unexpected model purpose ${request.purpose}`);
  }
}

async function runScenario(scenario: SourceScenario) {
  const startedAt = Date.now();
  const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find((item) => item.id === "h001")!;
  const navigations: string[] = [];
  const sessionsOpened: number[] = [];
  const navigationSessionIds: number[] = [];
  const closedSessionIds: number[] = [];
  const googleCalls: Array<{ query: string }> = [];
  const google = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async (_url, init) => {
    const query = JSON.parse(String(init?.body)) as { textQuery: string };
    googleCalls.push({ query: query.textQuery });
    return new Response(JSON.stringify({ places: [{ id: "shibuya-landmark", displayName: { text: "Shibuya" },
      formattedAddress: "Shibuya, Tokyo", location: center, types: ["train_station"],
      addressComponents: [{ longText: "Tokyo", types: ["locality"] }] }] }), { status: 200 });
  } }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const model = new H001NativeModel(scenario);
  const rawBrowser = sourcePages(scenario, navigations, sessionsOpened, navigationSessionIds, closedSessionIds);
  const browserTrace: Array<{ sequence: number; at: string; kind: string; detail: unknown }> = [];
  let browserTraceSequence = 0;
  const browser = { openSession: async (input: { signal: AbortSignal }) => traceBrowserSession(
    await rawBrowser.openSession(input), "TABLECHECK", (kind, detail) => {
      const sequence = ++browserTraceSequence;
      browserTrace.push({ sequence, at: reference.toISOString(), kind, detail });
      return sequence;
    },
  ) };
  const native = composeNativeRestaurantRead(google, browser, model, undefined, undefined, undefined, () => reference.toISOString());
  const availability = new LiveBrowserAvailability(browser, model, { now: () => reference.toISOString(), maxModelCallsTotal: 50 });
  const taskId = `native-h001:${scenario}`;
  const composition = createHybridReadComposition({ taskId, runId: `run:${taskId}`, clock: { now: () => reference },
    model, search: native.search, facts: native.facts, availability,
    router: { structuredReadTimeoutMs: 30_000, browserReadTimeoutMs: 300_000 },
    loop: { maxSteps: 30, timeoutMs: 300_000 },
  });
  const semantic = await composition.interpretAndDispatch({ taskId, message: String(frozen.content),
    referenceTime: frozen.reference_time, timezone: "Asia/Tokyo" });
  const loop = await composition.coordinator.run(taskId);
  const snapshot = composition.runtime.snapshot(taskId);
  const readRunId = `${snapshot.runId}:investigation:${snapshot.domainState.investigationRevision}`;
  const artifact = {
    schemaVersion: "1", mode: "SYNTHETIC_CONTROL", status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "h001", runId: snapshot.runId,
    materializedCase: frozen, semantic, finalSnapshot: snapshot, trajectories: composition.trajectories.steps,
    events: composition.runtime.eventLog, loop, sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: "OFFLINE_FIXED_PAGES" },
    sourceTrace: { navigations, googleQueries: googleCalls.map((item) => item.query), browserTrace },
    runCeilings: { maxAutomaticBrowserMs: 300_000, maxAgentSteps: 30, maxBrowserModelCallsTotal: 50, maxModelCalls: 50 },
    resourceUsage: { elapsedMs: Date.now() - startedAt, agentDecisions: model.purposes.filter((item) => item === "restaurant_agent_decide").length,
      browserModelCalls: model.purposes.filter((item) => item === "browser_read_decide").length,
      modelCallsStarted: model.purposes.length, googleRequests: google.googleRequestUsage(readRunId) },
  };
  const raw = JSON.stringify(artifact);
  const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: `${scenario}.execution.json`, sha256: createHash("sha256").update(raw).digest("hex") });
  if (process.env.PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS === "1") {
    const directory = resolve(".eval-artifacts", process.env.PRAXIS_NATIVE_STAGE2_ARTIFACT_DIR ?? "h001-native-stage2-20260929-review2-final");
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, `${scenario}.execution.json`), JSON.stringify(artifact, null, 2), { flag: "wx" });
    await writeFile(resolve(directory, `${scenario}.evaluation.json`), JSON.stringify(evaluation, null, 2), { flag: "wx" });
  }
  return { semantic, loop, state: snapshot.domainState, navigations, sessionsOpened, navigationSessionIds, closedSessionIds, googleCalls, model, evaluation, trajectories: composition.trajectories.steps };
}

test("H001 native first batch presents three source-bound Tabelog results without TableCheck", async () => {
  const result = await runScenario("TABELOG_DELIVERS");
  assert.equal(result.semantic.status, "PROPOSED");
  assert.equal(result.state.presentedResults?.candidateIds.length, 3, JSON.stringify({ phase: result.state.phase, failure: result.state.failure,
    candidates: result.state.candidates.map((item) => item.restaurant.id), checks: result.state.availabilityChecks,
    factChecks: result.state.factChecks, continuation: result.state.searchContinuation, navigations: result.navigations, purposes: result.model.purposes }));
  assert.equal(result.state.presentedResults?.candidateIds.every((id) => id.startsWith("tabelog:")), true);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.equal(new Set(result.navigations.slice(0, 4).map((_url, index) => result.navigationSessionIds[index])).size, 1,
    "a healthy Tabelog list and its three details share one browser session");
  assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 second native batch introduces its own TableCheck results after Tabelog cannot deliver", async () => {
  const result = await runScenario("TABLECHECK_RECOVERS");
  assert.equal(result.state.presentedResults?.candidateIds.length, 3);
  assert.equal(result.state.presentedResults?.candidateIds.every((id) => id.startsWith("tablecheck:")), true);
  assert.equal(result.navigations.some((url) => url.includes("tabelog.com")), true);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com/en/japan/search")), true);
  assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 native discovery uses the shared browser model loop to reveal an observed TableCheck result list", async () => {
  const result = await runScenario("TABLECHECK_DISCOVERY_RECOVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"]);
  assert.equal(result.model.purposes.includes("browser_read_decide"), true);
  assert.equal(result.model.retrievalFillUsed, true);
  assert.deepEqual(result.model.discoveryActions, ["FILL_AUTHORITATIVE", "CLICK"], "a stale nonempty list and loading query cannot complete before the observed current-query action");
  assert.equal(result.navigations.some((url) => url.includes("/en/native-omakase-1")), true);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 confirms a ready TableCheck query through live controls without mistaking hidden or script loading text for a pending search", async () => {
  const result = await runScenario("TABLECHECK_QUERY_READY");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"]);
  assert.equal(result.model.retrievalFillUsed, false, "the current observed input already equals the authoritative expression");
  assert.deepEqual(result.model.discoveryActions, [], "the executor completes after its live control read without a model browser action");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 never admits stale busy discovery cards or an old explicit empty state after the browser declines a current-query action", async () => {
  for (const scenario of ["TABELOG_STALE_REJECTS", "TABLECHECK_STALE_REJECTS"] as const) {
    const result = await runScenario(scenario);
    assert.equal(result.state.presentedResults, undefined, scenario);
    assert.equal(result.state.candidates.length, 0, scenario);
    assert.equal(result.navigations.some((url) => /native-omakase-1|A130401\/100\/$/.test(url)), false,
      `${scenario} must retain the incomplete discovery diagnostic rather than inspect its stale card`);
  }
});

test("native source session acquisition consumes the remaining source window and retains an unstarted detail entrance", async () => {
  const navigations: string[] = [];
  const delayed = sourcePages("TABELOG_DELIVERS", navigations);
  const browser = { openSession: async (input: { signal: AbortSignal }) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    return delayed.openSession(input);
  } };
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => {
    throw new Error("coordinates avoid Google resolution");
  } }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, locality, () => reference.toISOString());
  const intent = {
    timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "omakase" }, date,
    timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } },
    criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  const result = await native.search({ intent, continuation: {
    intentFingerprint: restaurantSearchIntentFingerprint(intent), usedPageTokens: [], pagesRead: 0, exhausted: false,
    nativeSourceProgress: { source: "TABELOG", inspectedSourceIds: [], detailAttempts: 0, pagesRead: 0, elapsedMs: 89_999,
      pendingSourceIds: ["tokyo/A1304/A130401/100"], pendingSourceEntries: [{ sourceEntityId: "tokyo/A1304/A130401/100", sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/100/", observedAt: reference.toISOString() }] },
  } }, new AbortController().signal);
  assert.equal(navigations.length, 0, "a session that misses the remaining source window cannot begin detail navigation");
  assert.equal(result.metadata.nativeDiscoveryFunnel?.sourceTimeLimitReached, true);
  assert.deepEqual(result.continuation?.nativeSourceProgress?.pendingSourceIds, ["tokyo/A1304/A130401/100"]);
});

test("Tabelog keeps the structured HARD retrieval keyword when an Agent hint repeats the whole reservation request", async () => {
  const navigations: string[] = [];
  const browser = sourcePages("TABELOG_DELIVERS", navigations);
  const locality = new GooglePlacesRestaurantSearch(new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => {
    throw new Error("coordinates avoid Google resolution");
  } }), () => reference.toISOString(), 10, { maxRequests: 100 });
  const native = new NativeRestaurantSearch(browser, locality, () => reference.toISOString());
  const intent = {
    timezone: "Asia/Tokyo" as const, target: { goal: "AVAILABILITY" as const, query: "omakase" }, date,
    timeWindow: { earliest: "19:00", latest: "19:00" }, area: { query: "near Shibuya", coordinates: { ...center, observedAt: reference.toISOString(), source: "MANUAL_PLACE" as const } },
    criteria: [{ text: "omakase", polarity: "POSITIVE" as const, strength: "HARD" as const }],
  };
  await native.search({ intent, retrievalHint: "omakase near Shibuya, party of 2, 2026-10-04 19:00" }, new AbortController().signal);
  const listing = new URL(navigations[0]!);
  assert.equal(listing.searchParams.get("sw"), "omakase");
});

test("fixed TableCheck discovery stores the actual filled value and cannot reveal the current result after a wrong fill", async () => {
  const runtime = sourcePages("TABLECHECK_DISCOVERY_RECOVERS", []);
  const expected = "omakase near Shibuya, Tokyo";
  const url = `https://www.tablecheck.com/en/japan/search?service_mode=dining&search_text=${encodeURIComponent(expected)}`;
  const wrong = await runtime.openSession({ signal: new AbortController().signal });
  await wrong.navigate(url, { waitUntil: "domcontentloaded", timeoutMs: 1_000 });
  const wrongInput = (await wrong.observeControls!()).find((control) => control.kind === "INPUT")!;
  assert.equal(wrongInput.value, "stale query");
  await wrong.fill(wrongInput.id, "omakase near Ginza, Tokyo");
  assert.equal((await wrong.observeControls!()).find((control) => control.kind === "INPUT")?.value, "omakase near Ginza, Tokyo");
  await wrong.click((await wrong.observeControls!()).find((control) => control.label === "Show public venues")!.id);
  assert.equal((await wrong.snapshot()).html.includes("/en/native-omakase-1"), false);
  await wrong.close();

  const current = await runtime.openSession({ signal: new AbortController().signal });
  await current.navigate(url, { waitUntil: "domcontentloaded", timeoutMs: 1_000 });
  await current.fill((await current.observeControls!()).find((control) => control.kind === "INPUT")!.id, expected);
  await current.click((await current.observeControls!()).find((control) => control.label === "Show public venues")!.id);
  assert.equal((await current.snapshot()).html.includes("/en/native-omakase-1"), true);
  assert.equal((await current.observeControls!()).find((control) => control.kind === "INPUT")?.value, expected);
  await current.close();
});

test("H001 two bounded empty source batches cannot claim inventory or results", async () => {
  const result = await runScenario("BOTH_BOUNDED_EMPTY");
  assert.equal(result.state.presentedResults, undefined);
  assert.equal(result.state.searchContinuation?.nativeStage, "TABLECHECK_DONE");
  assert.match(result.state.noVerifiedResult?.remainingGaps.join(" ") ?? "", /bounded Tabelog and TableCheck native batches/);
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 1);
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"]);
});

test("H001 both source lists reject page-owned coordinates outside the existing area radius", async () => {
  const result = await runScenario("OUTSIDE_RADIUS");
  assert.equal(result.state.candidates.length, 0);
  assert.equal(result.state.presentedResults, undefined);
  assert.equal(result.state.searchContinuation?.nativeStage, "TABLECHECK_DONE");
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 1);
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  const funnels = result.trajectories.flatMap((step) => step.executionMetadata?.nativeDiscoveryFunnel ? [step.executionMetadata.nativeDiscoveryFunnel] : []);
  assert.deepEqual(funnels.map((item) => ({ source: item.source, parsed: item.parsedOutlets, accepted: item.accepted,
    reasons: item.rejected.map((rejection) => rejection.reasonCode) })), [
    { source: "TABELOG", parsed: 1, accepted: 0, reasons: ["OUTSIDE_EXACT_RADIUS"] },
    { source: "TABLECHECK", parsed: 1, accepted: 0, reasons: ["OUTSIDE_EXACT_RADIUS"] },
  ]);
});

test("H001 one Tabelog detail failure retains earlier candidates and continues to the next detail", async () => {
  const result = await runScenario("TABELOG_ONE_DETAIL_FAILS");
  assert.deepEqual(result.state.candidates.map((item) => item.restaurant.id), [
    "tabelog:tokyo/A1304/A130401/100", "tabelog:tokyo/A1304/A130401/102",
  ]);
  assert.equal(result.navigations.some((url) => url.endsWith("/102/")), true);
  assert.notEqual(result.navigationSessionIds[result.navigations.findIndex((url) => url.endsWith("/100/"))],
    result.navigationSessionIds[result.navigations.findIndex((url) => url.endsWith("/102/"))],
    "the failed navigation must not leak into the next candidate session");
  assert.equal(result.closedSessionIds.includes(result.navigationSessionIds[result.navigations.findIndex((url) => url.endsWith("/101/"))]!), true);
  assert.equal(result.trajectories.some((step) => step.executionMetadata?.candidateFailures?.some((failure) =>
    failure.sourceUrl.endsWith("/101/") && failure.reasonCode === "BROWSER_TIMEOUT")), true,
  "the isolated candidate failure remains attributable in the read metadata");
});

test("H001 rejects an early END_READ after an empty Tabelog batch and continues to TableCheck", async () => {
  const result = await runScenario("EARLY_END_ATTEMPT");
  assert.equal(result.trajectories.some((step) => step.agentAction?.type === "END_READ" && step.actionValidation?.status === "REJECTED"), true);
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  assert.equal(result.state.searchContinuation?.nativeStage, "TABLECHECK_DONE");
  assert.equal(result.state.phase, "NO_VERIFIED_RESULT");
});

test("H001 native Tabelog batch continues past unavailable and unknown outlets, then presents its qualified outlet", async () => {
  const result = await runScenario("TABELOG_CONTINUES");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/102"]);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/100"]?.status, "UNAVAILABLE");
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/101"]?.status, "UNKNOWN");
  assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/102"]?.status, "AVAILABLE");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
  const funnel = result.trajectories.find((step) => step.executionMetadata?.provider === "TABELOG")?.executionMetadata?.nativeDiscoveryFunnel;
  assert.deepEqual({ parsed: funnel?.parsedOutlets, admitted: funnel?.accepted, rejected: funnel?.rejected.length, batchEnded: funnel?.batchEnded },
    { parsed: 3, admitted: 3, rejected: 0, batchEnded: true });
});

test("H001 native TableCheck batch continues after one nonqualifying outlet and presents the next", async () => {
  const result = await runScenario("TABLECHECK_CONTINUES");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-2"]);
  assert.equal(result.state.availabilityChecks["tablecheck:native-omakase-1"]?.status, "UNAVAILABLE");
  assert.equal(result.state.availabilityChecks["tablecheck:native-omakase-2"]?.status, "AVAILABLE");
  assert.equal(result.navigations.filter((url) => url.includes("/japan/search")).length, 1);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 open-ended native target three delivers one qualified outlet when the first batch is complete", async () => {
  const result = await runScenario("NATIVE_PARTIAL");
  assert.equal(result.state.intentDraft?.target?.selectionScope, "OPEN_ENDED");
  assert.equal(result.state.pendingResultBatchTarget, undefined);
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/101"]);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 two investigated native batches with no qualified outlet stop without an inventory claim", async () => {
  const result = await runScenario("NATIVE_TRUE_NO_RESULT");
  assert.equal(result.state.phase, "NO_VERIFIED_RESULT");
  assert.equal(result.state.presentedResults, undefined);
  assert.equal(result.state.searchContinuation?.nativeStage, "TABLECHECK_DONE");
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com/en/native-omakase-1")), true);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "NO");
});

test("H001 TableCheck search with a raw link but no parsed outlet retains the observed funnel and fails incomplete", async () => {
  const result = await runScenario("TABLECHECK_UNPARSED");
  const step = result.trajectories.find((item) => item.executionMetadata?.provider === "TABLECHECK");
  assert.equal(step?.executionMetadata?.failureCode, "TABLECHECK_DISCOVERY_INCOMPLETE");
  assert.deepEqual({ raw: step?.executionMetadata?.nativeDiscoveryFunnel?.rawSourceLinks,
    parsed: step?.executionMetadata?.nativeDiscoveryFunnel?.parsedOutlets,
    accepted: step?.executionMetadata?.nativeDiscoveryFunnel?.accepted,
    reason: step?.executionMetadata?.nativeDiscoveryFunnel?.progressionReason },
  { raw: 1, parsed: 0, accepted: 0, reason: "SOURCE_FAILURE" });
  assert.equal(result.state.presentedResults, undefined);
  assert.deepEqual({ source: result.state.searchContinuation?.nativeSourceProgress?.source,
    pagesRead: result.state.searchContinuation?.nativeSourceProgress?.pagesRead,
    inspected: result.state.searchContinuation?.nativeSourceProgress?.inspectedSourceIds },
  { source: "TABLECHECK", pagesRead: 1, inspected: [] }, "a failed source keeps its spent cursor instead of reopening with zero progress");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "UNKNOWN", "a source discovery failure must not be rewritten as a completed no-result read");
});

test("H001 preserves the authoritative keyword when an observed Tabelog area link changes the listing route", async () => {
  const result = await runScenario("TABELOG_REGION_PRESERVES_QUERY");
  const region = result.navigations.find((url) => url.includes("/en/tokyo/A1303/A130301/rstLst/"));
  assert.ok(region);
  assert.equal(new URL(region!).searchParams.get("sw"), "omakase");
  assert.equal(result.navigations.some((url) => url.endsWith("/100/")), true);
});

test("H001 refines a nonempty Tabelog list through an observed source area link before investigating an unsuitable candidate", async () => {
  const result = await runScenario("TABELOG_NONEMPTY_REGION_RECOVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"]);
  assert.equal(result.navigations.some((url) => url.includes("/en/tokyo/A1303/A130301/rstLst/")), true);
  assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "the observed source refinement precedes unsuitable detail investigation");
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 presents one investigated Tabelog current-batch result without exhausting the source or starting TableCheck", async () => {
  const result = await runScenario("TABELOG_CURRENT_BATCH_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"]);
  assert.equal(result.state.searchContinuation?.nativeStage, undefined, "the source remains open after the current bounded batch");
  assert.deepEqual(result.state.searchContinuation?.nativeCurrentBatch, {
    source: "TABELOG",
    candidateIds: ["tabelog:tokyo/A1304/A130401/100", "tabelog:tokyo/A1304/A130401/101", "tabelog:tokyo/A1304/A130401/102", "tabelog:tokyo/A1304/A130401/103", "tabelog:tokyo/A1304/A130401/104"],
  });
  assert.deepEqual(result.state.searchContinuation?.nativeSourceProgress?.pendingSourceIds, ["tokyo/A1304/A130401/105"]);
  assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 presents one investigated TableCheck current-batch result without reading a second TableCheck chunk", async () => {
  const result = await runScenario("TABLECHECK_CURRENT_BATCH_DELIVERS");
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"]);
  assert.deepEqual(result.state.searchContinuation?.nativeCurrentBatch, {
    source: "TABLECHECK",
    candidateIds: ["tablecheck:native-omakase-1", "tablecheck:native-omakase-2", "tablecheck:native-omakase-3", "tablecheck:native-omakase-4", "tablecheck:native-omakase-5"],
  });
  assert.deepEqual(result.state.searchContinuation?.nativeSourceProgress?.pendingSourceIds, ["native-omakase-6"]);
  assert.equal(result.navigations.filter((url) => url.includes("/en/japan/search")).length, 1);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});

test("H001 consumes a retained Tabelog detail entrance without reopening a volatile listing", async () => {
  const result = await runScenario("TABELOG_PENDING_RESTORED");
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 1,
    "the persisted source-owned entrance must not depend on a refreshed listing");
  assert.equal(result.navigations.some((url) => url.endsWith("/105/")), true,
    "the sixth observed entrance must survive the changed second listing");
  assert.equal(new Set(result.navigations.filter((url) => /\/tokyo\/A1304\/A130401\/\d+\/$/.test(url))).size, 6,
    "already inspected entries are not re-read while the retained one is consumed");
});

test("H001 retains unstarted Tabelog entries when a failed detail cannot reopen its session", async () => {
  const result = await runScenario("TABELOG_REOPEN_RETAINS");
  assert.equal(result.state.phase, "PRESENT_RESULTS");
  assert.equal(result.navigations.filter((url) => url.endsWith("/100/")).length, 1, "the failed detail navigation is attempted once");
  assert.equal(result.navigations.some((url) => url.endsWith("/101/")), true, "the first unstarted entry is retained and later consumed");
  assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 1, "the retained queue does not reopen a volatile listing");
});

test("native detail chunk continues through later observed Tabelog results before changing source", async () => {
  const result = await runScenario("TABELOG_BATCH_CAP");
  const funnel = result.trajectories.find((step) => step.executionMetadata?.provider === "TABELOG")?.executionMetadata?.nativeDiscoveryFunnel;
  assert.deepEqual({ raw: funnel?.rawSourceLinks, parsed: funnel?.parsedOutlets, inspected: funnel?.inspectedOutlets,
    cap: funnel?.batchCap, limited: funnel?.batchLimitReached, exhausted: funnel?.sourceExhausted },
  { raw: 6, parsed: 6, inspected: 5, cap: 5, limited: true, exhausted: false });
  assert.deepEqual(funnel?.deferredByBatchCap, [{
    sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/105/",
    reasonCode: "DETAIL_BATCH_CAP",
  }], "the observed sixth entrance is deferred, not rejected or represented as source exhaustion");
  assert.equal(new Set(result.navigations.filter((url) => /tabelog\.com\/tokyo\/A1304\/A130401\/\d+\/$/.test(url))).size, 6,
    "the sixth observed entrance is inspected in a later Tabelog chunk before the source changes");
});

test("H001 rejects early end and short presentation after TableCheck discovery until its batch is investigated", async () => {
  const result = await runScenario("TABLECHECK_EARLY_ACTIONS");
  assert.equal(result.state.intentDraft?.target?.selectionScope, "OPEN_ENDED");
  assert.equal(result.trajectories.some((item) => item.agentAction?.type === "END_READ" && item.actionValidation?.status === "REJECTED"), true);
  assert.equal(result.trajectories.some((item) => item.agentAction?.type === "PRESENT_RESULTS" && item.actionValidation?.status === "REJECTED"), true,
    JSON.stringify(result.trajectories.map((item) => ({ action: item.agentAction?.type, validation: item.actionValidation?.status,
      candidates: item.agentAction && "candidateIds" in item.agentAction ? item.agentAction.candidateIds : undefined,
      provider: item.executionMetadata?.provider }))));
  assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1", "tablecheck:native-omakase-2"]);
  assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings));
});
