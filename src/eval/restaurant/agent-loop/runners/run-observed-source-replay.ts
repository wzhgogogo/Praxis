import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import type { ModelGateway, ModelResponse } from "../../../../core/model/contracts.js";
import { LocalPlaywrightChromium } from "../../../../infrastructure/browser/local-playwright-chromium.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { createG6Session, G6_USER } from "../g6/session.js";
import { loadReplayRecording, recordedResponse } from "./replay-read-recording.js";

/** Real source HAR + original model outputs through the ordinary persistent
 * createLiveReadAssembly composition. No business ports or accepted State are
 * replaced. Missing source/model material fails closed; no live fallback. */
export async function runObservedSourceReplay(inputRoot: string, outputPath: string) {
  const temporary = await mkdtemp(join(tmpdir(), "observed-source-replay-"));
  const decisions = (await readFile(join(inputRoot, "execution.decisions.jsonl"), "utf8")).trim().split("\n").map(line => JSON.parse(line));
  const turns = JSON.parse(await readFile(join(inputRoot, "user-turns.json"), "utf8")).turns;
  const first = decisions.find(row => row.purpose === "restaurant_semantic_interpret");
  assert.ok(first?.startedAt && turns.length);
  const boundaries = decisions.flatMap((row, index) => row.purpose === "restaurant_semantic_interpret" ? [index] : []);
  assert.equal(boundaries.length, turns.length, "this replay requires a captured semantic boundary for every user turn");
  const turnDecisions = boundaries.map((from, index) => decisions.slice(from, boundaries[index + 1] ?? decisions.length));
  let activeTurn = 0;
  const started = performance.now(), epoch = Date.parse(first.startedAt);
  const clock = { now: () => new Date(epoch + performance.now() - started) };
  const recordings = [];
  for (const name of await readdir(join(inputRoot, "recordings"))) {
    recordings.push(await loadReplayRecording(join(inputRoot, "recordings", name), join(temporary, `source-${recordings.length}.har`)));
  }
  assert.ok(recordings.length);
  const allowed = new Set(recordings.flatMap(recording => [...recording.allowed]));
  const entries = recordings.flatMap(recording => recording.entries);
  const merged = { ...recordings[0]!, entries, allowed };
  const harPath = join(temporary, "source.har");
  await writeFile(harPath, JSON.stringify({ log: { version: "1.2", creator: { name: "qualified source replay", version: "1" }, entries } }));
  const stops: Array<Record<string, unknown>> = [], selected: Array<Record<string, unknown>> = [];
  const offsets = new Map<string, number>(), browserBindings: Array<Record<string, unknown>> = [];
  const sessions: Awaited<ReturnType<LocalPlaywrightChromium["openSession"]>>[] = [];
  const missing = (reason: string, value: string, method: string) => {
    const url = new URL(value); stops.push({ reason, origin: url.origin, pathname: url.pathname, queryKeys: [...url.searchParams.keys()], method });
  };
  const runtime = new LocalPlaywrightChromium({ proxyServer: "http://127.0.0.1:9", browserType: { async launch(options) {
    const browser = await chromium.launch(options), newContext = browser.newContext.bind(browser);
    browser.newContext = async options => {
      const context = await newContext(options), fromHar = context.routeFromHAR.bind(context);
      const newPage = context.newPage.bind(context);
      context.newPage = async () => {
        const page = await newPage();
        // Source scripts must see the captured visit date, not the machine's
        // later calendar date. Runtime budgets still use the real run clock.
        await page.clock.install({ time: new Date(epoch) });
        return page;
      };
      context.routeFromHAR = async (...args) => {
        await fromHar(...args);
        await context.route("**/*", async route => {
          const request = route.request(), url = request.url();
          const reason = request.resourceType() === "document" && !allowed.has(url) ? "DOCUMENT_NOT_QUALIFIED"
            : !recordedResponse(merged, url, request.method(), request.postData() ?? undefined) ? "MISSING_RESPONSE" : undefined;
          if (!reason) { await route.fallback(); return; }
          if (!["image", "font", "media"].includes(request.resourceType())) {
            missing(reason, url, request.method()); void context.close().catch(() => {});
          }
          await route.abort("blockedbyclient").catch(() => {});
        });
      };
      return context;
    };
    return browser;
  } } });
  const browser = { readNetworkBoundaryCapability: runtime.readNetworkBoundaryCapability, async openSession(input: Parameters<LocalPlaywrightChromium["openSession"]>[0]) {
    const session = await runtime.openSession({ ...input, replayHarPath: harPath }); sessions.push(session); return session;
  } };
  const google = new GooglePlacesClient({ apiKey: "OFFLINE_NO_SECRET", fetchImplementation: async (url, init) => {
    const entry = recordedResponse(merged, String(url), init?.method ?? "GET", init?.body);
    if (!entry) { missing("MISSING_GOOGLE_RESPONSE", String(url), init?.method ?? "GET"); throw Error("OFFLINE_SOURCE_MISSING"); }
    return new Response(entry.response.content.text, { status: entry.response.status, headers: { "content-type": entry.response.content.mimeType } });
  } });
  const model: ModelGateway = { async complete(request): Promise<ModelResponse> {
    const counter = `${activeTurn}:${request.purpose}`, offset = offsets.get(counter) ?? 0;
    const rows = turnDecisions[activeTurn]!.filter(row => row.purpose === request.purpose), row = rows[offset];
    if (!row?.outputText) { stops.push({ reason: "MISSING_MODEL_OUTPUT", purpose: request.purpose, offset }); throw Error("UNRECORDED_MODEL_OUTPUT"); }
    offsets.set(counter, offset + 1);
    if (request.purpose === "restaurant_agent_decide") {
      const action = JSON.parse(row.outputText);
      selected.push({ sourceSequence: row.sequence, sourceStartedAt: row.startedAt, type: action.type, candidateIds: action.candidateIds, candidateId: action.candidateId });
    }
    let outputText = row.outputText;
    if (request.purpose === "browser_read_decide") {
      const original = JSON.parse(row.messages.find((message: { role: string }) => message.role === "user").content);
      const current = JSON.parse(request.messages.find(message => message.role === "user")!.content);
      const wire = JSON.parse(row.outputText), target = original.observation.targets.find((target: { ref: string }) => target.ref === wire.targetRef);
      if (target) {
        const same = (candidate: Record<string, unknown>) => target.calendarDate && candidate.calendarDate
          ? target.calendarDate === candidate.calendarDate && target.kind === candidate.kind
          : ["kind", "role", "label", "href", "type", "formMethod"].every(key => (target[key] ?? null) === (candidate[key] ?? null));
        const matches = current.observation.targets.filter(same);
        assert.equal(matches.length, 1, "captured browser target requires a unique semantic match in the current source DOM");
        browserBindings.push({ sourceSequence: row.sequence, from: wire.targetRef, to: matches[0].ref, sameObservedSemantics: true });
        wire.targetRef = matches[0].ref; outputText = JSON.stringify(wire);
      }
    }
    return { invocationId: `captured:${row.sequence}`, provider: "FIXTURE", model: "captured-original-output", outputText,
      finishReason: row.finishReason, latencyMs: 0 };
  } };
  let session: Awaited<ReturnType<typeof createG6Session>> | undefined;
  const views = []; let artifact: unknown, failure: unknown;
  try {
    session = await createG6Session({ model, browser, google, clock });
    let view = await session.create(turns[0].message, "original-model-source-replay"); views.push({ id: turns[0].id, view });
    for (const [index, turn] of turns.slice(1).entries()) {
      if (turn.status === "NOT_SENT") continue;
      if (view.case.phase !== turns[index].view?.case.phase) {
        stops.push({ reason: "PREVIOUS_TURN_DIVERGED", turn: turns[index].id, actualPhase: view.case.phase, capturedPhase: turns[index].view?.case.phase }); break;
      }
      activeTurn = index + 1;
      const current = view;
      await session.finished(() => session!.application.submitMessage({ userId: G6_USER, conversationId: current.case.conversationId,
        message: turn.message, requestId: turn.id, expectedVersion: current.case.taskVersion }));
      view = await session.view(current.case.caseId); views.push({ id: turn.id, view });
    }
    artifact = await session.application.exportReadArtifact(view.case.caseId);
  } catch (error) { failure = error instanceof Error ? { name: error.name, message: error.message } : String(error); }
  finally {
    await session?.close(); await Promise.all(sessions.map(session => session.close().catch(() => {})));
    await writeFile(outputPath, JSON.stringify({ mode: "REAL_SOURCE_REPLAY_ORIGINAL_MODEL_OUTPUTS", inputRoot,
      models: "Captured semantic and Agent outputText byte-for-byte; browser refs rebind only to unique identical observed semantics; no new inference", realCalls: { model: 0, google: 0, website: 0, live: 0 },
      originalAgentSelections: selected, sourceRecordings: recordings.map(recording => ({ sha256: recording.sha256, harSha256: recording.harSha256 })),
      views, artifact, failure, stops, browserBindings, modelCalls: session?.calls, modelOffsets: Object.fromEntries(offsets), elapsedMs: performance.now() - started }, null, 2) + "\n");
    await rm(temporary, { recursive: true, force: true });
  }
  return { failure, stops, selected, phases: views.map(row => row.view.case.phase) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [inputRoot, outputPath] = process.argv.slice(2); assert.ok(inputRoot && outputPath);
  console.log(JSON.stringify(await runObservedSourceReplay(resolve(inputRoot), resolve(outputPath))));
}
