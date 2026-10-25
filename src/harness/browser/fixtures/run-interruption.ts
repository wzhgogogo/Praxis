// Minimal synthetic source transport, 2026-10-24. No historical run copied.
// Real child process, Chromium, Interpreter/Compiler/Runtime/Agent/Router and
// production read assembly; only model and source I/O are controlled.
import { mock } from "node:test";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join,relative } from "node:path";
import {createHash} from 'node:crypto';
import { runHybridReadDiagnostic } from "../../../eval/restaurant/agent-loop/runners/run-hybrid-live-read.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } from "../../../application/live-read-investigation-budget.js";
import { googlePlacesDiscoveryPack, discoveryPackNetworkPolicy } from "../../../integrations/restaurant-search/source-packs.js";
import type { GooglePlacesClientOptions } from "../../../integrations/google/google-places-client.js";
import { replayHarPages, exactGuideAvailabilityUrl } from "../browser-read-test-fixtures.js";
import { LocalPlaywrightChromium } from "../../../infrastructure/browser/local-playwright-chromium.js";
import { response, strictAction } from "../../restaurant-read-test-fixtures.js";
import type { ModelRequest } from "../../../core/model/contracts.js";

const mode = process.argv[2]!, parentRoot = process.argv[3]!;
if(process.argv.includes('--exit-before-artifact'))process.exit(9);
const repositoryRoot=process.cwd(),reviewedArgument=process.argv.find(arg=>arg.startsWith('--independent-reviewed-reads='));
const reviewedPath=reviewedArgument?.slice('--independent-reviewed-reads='.length);
const preflight=reviewedPath?{reviewedReadsPath:relative(repositoryRoot,reviewedPath),reviewedReadsSha256:process.argv.includes('--invalid-reviewed-sha')?'0'.repeat(64):createHash('sha256').update(await readFile(reviewedPath)).digest('hex')}:undefined;
await mkdir(parentRoot, { recursive: true });
// Registered by the same preloaded read guard as both test suites. The child
// owns its generated inputs instead of accepting arbitrary external fixtures.
const root = await mkdtemp(join(parentRoot, "run-"));
process.chdir(root);
let externalCalls = 0;
globalThis.fetch = async () => { externalCalls++; throw new Error("OFFLINE_FIXTURE_NO_NETWORK"); };
const stopped = new AbortController();
const reference = new Date();
const date = "2026-10-30", source = "https://www.tablecheck.com/en/fixture";
const html = '<h1>Fixture restaurant</h1><p class="address">1-1 Ginza, Chuo City, Tokyo</p><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability" data-selected-date="2026-10-30" data-pax="2"><a href="/en/shops/fixture/reserve?start_date=2026-10-30&num_people=2&start_time=19:00">19:00</a></div>';
const replayHarPath = join(root, "fixture-source.har");
await writeFile(replayHarPath, replayHarPages({ [source]: html, [exactGuideAvailabilityUrl(source, date, 2, "19:00")]: html }));
const runtime = new LocalPlaywrightChromium();
let snapshots = 0, notified = false, availabilityStage = false;
let deadlineFire: (() => void) | undefined;
if (mode === "deadline") {
  const timer = globalThis.setTimeout;
  mock.method(globalThis, "setTimeout", (callback: (...args: any[]) => void, delay: number, ...args: any[]) => {
    if (delay === 500_000 && !deadlineFire) deadlineFire = () => callback(...args);
    return timer(callback, delay, ...args);
  });
}
process.on("message", message => {
  if (message === "external-stop") stopped.abort();
  if (message === "advance-deadline-500000") {
    if (!deadlineFire) throw new Error("No production 500-second deadline timer registered");
    process.send?.({ stage: "SIMULATED_TIME", elapsedMs: 500_000 });
    deadlineFire();
  }
});
const googleResponse = JSON.stringify({ places: [{
  id: "fixture", displayName: { text: "Fixture restaurant" }, formattedAddress: "1-1 Ginza, Chuo City, Tokyo", types: ["restaurant"],
  nationalPhoneNumber: "03-1111-2222", websiteUri: source, location: { latitude: 35.6697, longitude: 139.767 },
}] });
const google: GooglePlacesClientOptions = { apiKey: "fixture-only", fetchImplementation: async () => new Response(googleResponse, { status: 200, headers: { "content-type": "application/json" } }) };
const fixtureModel = async (request: ModelRequest) => {
  if (request.purpose === "restaurant_semantic_interpret") return response(JSON.stringify({ schemaVersion: "3", facts: [
    { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "restaurants" } },
    { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: date, raw: date } },
    { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 pm" } },
    { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
    { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
  ] }), "semantic");
  if (request.purpose === "browser_read_decide") return response(JSON.stringify({ action: "COMPLETE", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "Read public fixture" }), "browser");
  if (request.purpose !== "restaurant_agent_decide") throw new Error(`Unexpected fixture purpose ${request.purpose}`);
  const { context } = JSON.parse(request.messages.find(row => row.role === "user")!.content);
  if (!context.candidates?.length) return response(JSON.stringify(strictAction("SEARCH_RESTAURANTS")), "search");
  const eligible = context.presentation?.filter((row: any) => row.eligible).map((row: any) => row.candidateId) ?? [];
  if (eligible.length) return response(JSON.stringify(strictAction("PRESENT_RESULTS", eligible)), "present");
  if (context.checkableCandidateIds?.length) return response(JSON.stringify(strictAction("CHECK_AVAILABILITY", context.checkableCandidateIds)), "availability");
  return response(JSON.stringify(strictAction("END_READ")), "end");
};
const result = await runHybridReadDiagnostic({
  frozen: { id: "interruption-fixture", dataset: "synthetic-interruption@1", reference_time: reference.toISOString(), content: "Find restaurants nearby on October 30 at 7 pm for two.",
    semantic: { target: { goal: "AVAILABILITY" }, date: { value: date }, time: { start: "19:00", end: "19:00" }, party_size: 2, location: { value: "nearby", relation: "NEAR_USER" }, criteria: [] } as any },
  startedAt: reference, runtimeContext: { browserEngine: "LOCAL_CHROMIUM", mode: "OFFLINE_SYNTHETIC_SOURCE", realModelCalls: 0, ...(preflight?{preflight}:{}) },
  limits: { ...LIVE_READ_DEBUG_INVESTIGATION_BUDGET }, packs: [googlePlacesDiscoveryPack], recordBrowser: true, recordDecisions: true,
  evaluationLocation: { label: "Public synthetic center", latitude: 35.6697, longitude: 139.767, radiusMeters: 1000, source: "FIXTURE" },
}, {
  signal: stopped.signal, google,
  onBrowserDiagnostic: diagnostic => { availabilityStage = diagnostic.stage === "AVAILABILITY"; },
  createModel: observe => ({ async complete(request) {
    const result = await fixtureModel(request);
    observe({ invocationId: result.invocationId, taskId: request.taskId, purpose: request.purpose, promptVersion: request.promptVersion, fallback: request.fallback,
      provider: "FIXTURE", model: "synthetic", responseFormat: request.responseFormat, outputSchema: request.outputSchema, outcome: "SUCCEEDED", latencyMs: 0 });
    return result;
  } }),
  browser: { readNetworkBoundaryCapability: "ISOLATED_CONTEXT", async openSession(input) {
    const session = await runtime.openSession({ ...input, networkPolicy: discoveryPackNetworkPolicy(), replayHarPath });
    const read = session.snapshot.bind(session);
    session.snapshot = async () => {
      const snapshot = await read();
      snapshots++;
      if (mode !== "complete" && availabilityStage && !notified) {
        notified = true;
        process.send?.({ stage: "AVAILABILITY_READING", snapshots });
        await new Promise<never>(() => {});
      }
      return snapshot;
    };
    return session;
  } },
});
await writeFile(join(root, "fixture-finished.json"), JSON.stringify({ ...result, externalCalls, realModelCalls: 0, snapshots, mode }));
const receiptArgument=process.argv.find(arg=>arg.startsWith('--wait-for-receipt='));
if(receiptArgument){
  const path=receiptArgument.slice('--wait-for-receipt='.length),until=Date.now()+20_000;
  let receipt:unknown;
  while(!receipt&&Date.now()<until){
    try{receipt=JSON.parse(await readFile(path,'utf8'));}catch(error){if(!(error instanceof SyntaxError)&&!(error&&typeof error==='object'&&'code' in error&&error.code==='ENOENT'))throw error;}
    if(!receipt)await new Promise(resolve=>setTimeout(resolve,25));
  }
  if(!receipt){console.error('FIRST_SLOT_NOT_EVALUATED_BEFORE_SECOND_EXIT');process.exit(98);}
  await writeFile(join(root,'observed-first-receipt.json'),JSON.stringify(receipt));
}
if(process.argv.includes('--contradict-displayed-party')){
  const artifact=JSON.parse(await readFile(result.resultPath,'utf8'));
  const candidate=artifact.finalSnapshot.domainState.presentedResults.candidateIds[0];
  artifact.finalSnapshot.domainState.availability[candidate][0].partySize=9;
  await writeFile(result.resultPath,JSON.stringify(artifact,null,2));
}
if (process.argv.includes("--capture-replay-fixture")) {
  const artifact = JSON.parse(await readFile(result.resultPath,"utf8"));
  await writeFile(join(root,"replay-case.json"),JSON.stringify({frozen:{...artifact.materializedCase,content:"Find restaurants nearby on October 30 at 7 pm for two."},startedAt:reference.toISOString(),runtimeContext:{mode:"SYNTHETIC_REPLAY_FIXTURE"},limits:artifact.limits,evaluationLocation:artifact.resolvedEvalLocation,packIds:["google-places"],recordBrowser:false,recordDecisions:false}));
}
process.send?.({ stage: "FINISHED", ...result });
const forcedCode=process.argv.find(arg=>arg.startsWith('--fixture-exit-code='));
process.exit(forcedCode?Number(forcedCode.split('=')[1]):process.exitCode??0);
