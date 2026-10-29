import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import type { RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { restaurantCurrentFactEvidence } from "../domains/restaurant/read-assessment.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import { RestaurantExecutionRouter } from "./restaurant-execution-router.js";

// Preserve the uncompressed input bytes/SHA while keeping large saved runs compact.
async function readFixture(path: URL): Promise<Buffer>;
async function readFixture(path: URL, encoding: "utf8"): Promise<string>;
async function readFixture(path: URL, encoding?: "utf8"): Promise<Buffer | string> {
  const raw = await readFile(path);
  const bytes = path.pathname.endsWith(".gz") ? gunzipSync(raw) : raw;
  return encoding ? bytes.toString(encoding) : bytes;
}

test("saved holdout case02 events expose five structured HARD budgets through Router to Reducer with independent price agreement", async()=>{
  const {createHash}=await import("node:crypto");
  const root=new URL("./fixtures/restaurant-presentation-evidence/",import.meta.url),dir="checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022";
  const inputs=JSON.parse(await readFixture(new URL(`${dir}/inputs.json`,root),"utf8"));let checked=0,reads=0;
  const noRead=async()=>{reads++;throw Error("OFFLINE_PRESENTATION_MUST_NOT_READ_SOURCE");};
  const router=new RestaurantExecutionRouter({executionRoute:"STRUCTURED_ADAPTER",search:noRead},{executionRoute:"STRUCTURED_ADAPTER",check:noRead},{structuredReadTimeoutMs:1000,browserReadTimeoutMs:1000});
  for(const runId of ["h-02","h-08","h-14"]){
    const row=inputs.runs.find((r:any)=>r.run.runId===runId),bytes=await readFixture(new URL(row.originalArtifactPath,root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"),row.originalArtifactSha256);const artifact=JSON.parse(bytes.toString());
    const ctx=(at:string)=>({taskId:artifact.runId,runId:artifact.runId,now:at,createId:(p:string)=>p});let state=restaurantBookingTaskDefinition.create({},ctx(artifact.startedAt));
    for(const envelope of artifact.events){if(envelope.event.type==="RESULTS_PRESENTED")break;state=restaurantBookingTaskDefinition.transition(state,envelope.event,ctx(envelope.occurredAt)).state;}
    assert.deepEqual(state.intentDraft?.budgetPerPerson,{max:8000,currency:"JPY"});assert.equal(state.intentDraft?.criteria.length,1);
    const actual=artifact.finalSnapshot.domainState.presentedResults,oracle=JSON.parse(await readFixture(new URL(`${dir}/evaluations-33/${runId}.evaluation.json`,root),"utf8"));
    const execution=await router.execute({type:"PRESENT_RESULTS",candidateIds:actual.candidateIds},state,actual.presentedAt);assert.equal(execution.event?.type,"RESULTS_PRESENTED");
    const shown=restaurantBookingTaskDefinition.transition(state,execution.event!,ctx(actual.presentedAt)).state.presentedResults!;
    for(const id of actual.candidateIds){
      const budget=shown.conditionStates[id]!.find(c=>c.criterionRef==="criterion:1");assert.ok(budget,`${runId}:${id}: structured budget must reach actual presentation`);
      const expected=oracle.conditionStates.find((c:any)=>c.candidateId===id).criteria.find((c:any)=>c.goldIndex===1);assert.equal(expected.status,"MET");assert.equal(budget.status,expected.status);assert.equal(budget.strength,"HARD");assert.ok(budget.sources.length);
      const facts=restaurantCurrentFactEvidence(state,id);
      for(const source of budget.sources)assert.ok(facts.some(f=>f.sourceUrl===source.sourceUrl&&[f.priceFacts?.dinnerBudgetRangeYen?.quote,...(f.priceFacts?.listedCoursePricesYen.map(p=>p.quote)??[])].includes(source.quote)),"every displayed quote is retained current merchant price text");
      assert.ok(!actual.conditionStates[id].some((c:any)=>c.criterionRef==="criterion:1"),"the original missing budget row remains an immutable red observation");checked++;
    }
  }
  assert.equal(checked,5);assert.equal(reads,0);
});

const raw = new URL("./fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.result.json.gz", import.meta.url);
const candidateId = "tabelog:en/tokyo/A1309/A130905/13048623";
const laterFact = "evidence:restaurant:tabelog-hard-criteria:90f76d3a50b0f0b768e8fa1f";

test("c05 Kaga Router to Reducer retains the later availability-read source fact", async () => {
  const artifact = JSON.parse(await readFixture(raw, "utf8"));
  const original: RestaurantTaskState = artifact.finalSnapshot.domainState;
  const now = original.presentedResults!.presentedAt;
  const candidateIds = [...original.presentedResults!.candidateIds];
  assert.ok(!original.presentedResults!.evidenceIds.includes(laterFact), "preserve the historical red-light observation");
  let state = restaurantBookingTaskDefinition.create({}, { taskId: "saved-c05", runId: "saved-c05", now: artifact.startedAt, createId: p => p });
  for (const envelope of artifact.events) {
    if (envelope.event.type === "RESULTS_PRESENTED") break;
    state = restaurantBookingTaskDefinition.transition(state, envelope.event, { taskId: "saved-c05", runId: "saved-c05", now: envelope.occurredAt, createId: p => p }).state;
  }
  assert.equal(state.phase, "SEARCHING");
  assert.ok(state.availabilityChecks[candidateId]!.evidenceIds.includes(laterFact));
  assert.ok(state.factChecks![candidateId]!.checkedAt < state.readEvidence.find(e => e.evidenceId === laterFact)!.observedAt);
  let reads = 0;
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { reads++; throw Error("NO_SOURCE_READS"); } },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { reads++; throw Error("NO_SOURCE_READS"); } },
    { structuredReadTimeoutMs: 1000, browserReadTimeoutMs: 1000 },
  );
  const execution = await router.execute({ type: "PRESENT_RESULTS", candidateIds }, state, now);
  assert.equal(execution.event?.type, "RESULTS_PRESENTED");
  assert.ok(execution.event?.type === "RESULTS_PRESENTED" && execution.event.evidenceIds.includes(laterFact), "the newer source fact must reach the presentation event");
  const shown = restaurantBookingTaskDefinition.transition(state, execution.event!, { taskId: "saved-c05", runId: "saved-c05", now, createId: p => p }).state;
  assert.ok(shown.presentedResults!.evidenceIds.includes(laterFact));
  assert.equal(shown.presentedResults!.conditionStates[candidateId]![0]!.status, "NOT_CHECKED", "merchant name and customer-review title alone must not display HARD MET");
  assert.equal(shown.presentedResults!.conditionStates[candidateId]![0]!.criterionRef, "criterion:0");
  assert.equal(reads, 0);
  assert.throws(() => restaurantBookingTaskDefinition.transition(state, { ...execution.event!, type: "RESULTS_PRESENTED", candidateIds, evidenceIds: shown.presentedResults!.evidenceIds.filter(id => id !== laterFact) },
    { taskId: "saved-c05", runId: "saved-c05", now, createId: p => p }), /omitted current required evidence/);


  const refreshed = structuredClone(state);
  refreshed.factChecks![candidateId]!.checkedAt = now;
  assert.ok(!restaurantCurrentFactEvidence(refreshed, candidateId).some(e => e.evidenceId === laterFact), "a later completed same-source fact read must not revive an earlier omitted fact");
  const superseded = structuredClone(state);
  superseded.factChecks![candidateId]!.supersededEvidenceIds = [laterFact];
  assert.ok(!restaurantCurrentFactEvidence(superseded, candidateId).some(e => e.evidenceId === laterFact));
  const wrongCandidate = structuredClone(state);
  wrongCandidate.readEvidence.find(e => e.evidenceId === laterFact)!.candidateId = "another-outlet";
  assert.ok(!restaurantCurrentFactEvidence(wrongCandidate, candidateId).some(e => e.evidenceId === laterFact));
});

// C18 H002: a newer fact read superseded the priced availability fact. Its
// own saved page still contains the budget; preserve that fresh metadata.
test("C18 H002 current fact document carries same-page prices through judgment and Router to Reducer", async () => {
  const { createHash } = await import("node:crypto");
  const { quotedMenuFixtureModel } = await import("../integrations/restaurant-facts/fixtures/quoted-menu-model.js");
  const { sourcePriceElements, publicPriceText } = await import("../integrations/restaurant-availability/source-price-facts.js");
  const { NativeSourceFactRead } = await import("../integrations/restaurant-facts/native-source-facts.js");
  const { ModelRestaurantFactJudgment } = await import("../integrations/restaurant-facts/model-fact-judgment.js");
  const root = new URL("./fixtures/restaurant-presentation-evidence/", import.meta.url);
  const dir = new URL("checkpoint-c-live-20261020/c18-offline-reassessment-20261022/", root);
  const inputs = JSON.parse(await readFixture(new URL("c18-inputs.json", dir), "utf8"));
  const hard = JSON.parse(await readFixture(new URL("hard-evidence.json", dir), "utf8"));
  let checked = 0;
  for (const runId of ["c-12", "c-16"]) {
    const row = inputs.runs.find((r: any) => r.runId === runId);
    const bytes = await readFixture(new URL(row.artifactPath, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), row.artifactSha256);
    const artifact = JSON.parse(bytes.toString());
    const snapshots = hard.runs.find((r: any) => r.artifactSha256 === row.artifactSha256).snapshots;
    const context = (at: string) => ({ taskId: artifact.runId, runId: artifact.runId, now: at, createId: (p: string) => p });
    let state = restaurantBookingTaskDefinition.create({}, context(artifact.startedAt));
    for (const envelope of artifact.events) {
      if (envelope.event.type === "RESULTS_PRESENTED") break;
      state = restaurantBookingTaskDefinition.transition(state, envelope.event, context(envelope.occurredAt)).state;
    }
    const shownAt = artifact.finalSnapshot.domainState.presentedResults.presentedAt;
    for (const id of artifact.finalSnapshot.domainState.presentedResults.candidateIds) {
      if (!id.endsWith("13292459") && !id.endsWith("13295658")) continue;
      const check = state.factChecks![id]!;
      const current = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "RESTAURANT_FACT" && e.provider === "TABELOG")!;
      assert.ok(current && !current.priceFacts);
      const binding = snapshots.find((s: any) => s.evidenceId === current.evidenceId);
      const html = await readFixture(new URL(binding.path, dir), "utf8");
      assert.equal(createHash("sha256").update(html).digest("hex"), binding.sha256);
      const priceBlock = sourcePriceElements(html,tag=>/^<p\b/iu.test(tag)).find(block=>/aria-label=["']Dinner["']/iu.test(block));
      assert.ok(priceBlock,"saved page has public Dinner-labelled budget");
      const dinnerQuote = publicPriceText(priceBlock);
      const prices = { dinnerBudgetRangeYen: {min:8000,max:9999,quote:dinnerQuote,sourceUrl:current.sourceUrl!} };
      const identity = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "ENTITY_MATCH" && e.sourceUrl === current.sourceUrl)!;
      const statements = (current.claims.restaurantTypeFacts as string[]).map((text, i) => ({ id: `statement:${i}`, text }));
      const outlet = state.candidates.find(c => c.restaurant.id === id)!;
      const page = { url: current.sourceUrl!, html, title: outlet.restaurant.outletName,
        text: [outlet.restaurant.outletName, outlet.restaurant.address, ...statements.map(s => s.text), dinnerQuote].join("\n") };
      const quoteRequests: import("../core/model/contracts.js").ModelRequest[] = [];
      const quoteOutputs: any[] = [];
      const menuModel: import("../core/model/contracts.js").ModelGateway = {async complete(input){
        quoteRequests.push(input);const result=await quotedMenuFixtureModel.complete(input);
        quoteOutputs.push(JSON.parse(result.outputText));
        return result;
      }};
      const source = await new NativeSourceFactRead(
        { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 },
        { openSession: async () => ({
          metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: current.observedAt },
          navigate: async () => undefined, snapshot: async () => page, observeControls: async () => [],
          click: async () => undefined, fill: async () => undefined, select: async () => [],
          waitFor: async () => undefined, waitForSettled: async () => true, screenshot: async () => new Uint8Array(), close: async () => undefined,
        }) }, { async judge() { return { evidence: [] }; } }, () => current.observedAt, undefined, undefined, undefined, undefined, undefined, menuModel,
      ).inspectFacts({ candidateIds: [id], candidates: [outlet], intent: state.intent! }, new AbortController().signal);
      assert.equal(quoteRequests.length,1,"one immutable page quote read: "+JSON.stringify(source.factChecks));
      assert.ok(quoteOutputs[0]?.selections.some((row:any)=>row.role==="DINNER_BUDGET"),"same saved Dinner quote must be selected: "+quoteRequests[0]?.messages[1]!.content);
      const freshPrices = source.sourceDocuments?.find(d => d.candidateId === id)?.priceFacts;
      assert.deepEqual(freshPrices?.dinnerBudgetRangeYen, prices!.dinnerBudgetRangeYen, "native source producer retains same-page prices");
      assert.ok(freshPrices);
      const document = { id: current.evidenceId, candidateId: id, identityEvidenceId: identity.evidenceId, statements, priceFacts: freshPrices };
      let wire: any;
      const judgment = new ModelRestaurantFactJudgment({ async complete(request) {
        wire = JSON.parse(request.messages.find(m => m.role === "user")!.content);
        // Existing model input/output contracts do not gain parser metadata.
        return { invocationId: "offline-scripted", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
          outputText: JSON.stringify({ sourceSelections: [{ documentId: document.id, statementIds: statements.map(s => s.id) }], judgments: [] }) };
      } });
      const read = await judgment.judge({ candidate: state.candidates.find(c => c.restaurant.id === id)!, intent: state.intent!, evidence: [identity], sourceDocuments: [document] });
      const fresh = read.evidence.find(e => e.evidenceId === current.evidenceId)!;
      assert.deepEqual(fresh.priceFacts?.dinnerBudgetRangeYen, prices!.dinnerBudgetRangeYen, `${runId}:${id}: current document price metadata must survive judgment`);
      assert.equal(wire.sourceDocuments[0].priceFacts, undefined, "structured prices stay private, preserving the model contract");
      state.readEvidence = state.readEvidence.map(e => e.evidenceId === current.evidenceId ? fresh : e);
      assert.ok(check.supersededEvidenceIds?.some(old => state.readEvidence.find(e => e.evidenceId === old)?.priceFacts), "older priced fact remains superseded");
      checked++;
    }
    let reads = 0;
    const router = new RestaurantExecutionRouter(
      { executionRoute: "STRUCTURED_ADAPTER", async search() { reads++; throw Error("NO_SOURCE_READS"); } },
      { executionRoute: "STRUCTURED_ADAPTER", async check() { reads++; throw Error("NO_SOURCE_READS"); } },
      { structuredReadTimeoutMs: 1000, browserReadTimeoutMs: 1000 },
    );
    const execution = await router.execute({ type: "PRESENT_RESULTS", candidateIds: artifact.finalSnapshot.domainState.presentedResults.candidateIds }, state, shownAt);
    assert.equal(execution.event?.type, "RESULTS_PRESENTED");
    const shown = restaurantBookingTaskDefinition.transition(state, execution.event!, context(shownAt)).state.presentedResults!;
    for (const id of shown.candidateIds) if (id.endsWith("13292459") || id.endsWith("13295658")) {
      const condition = shown.conditionStates[id]!.find(c => c.criterionRef === "criterion:0")!;
      assert.equal(condition.status, "MET", `${runId}:${id}: price must reach actual presentation`);
      assert.ok(condition.sources.some(s => s.field === "PRICE" && /8,000/.test(s.quote)));
      assert.ok(condition.evidenceIds.every(e => !state.factChecks![id]!.supersededEvidenceIds?.includes(e)));
    }
    assert.equal(reads, 0);
  }
  assert.equal(checked, 3);
});

test("C18 four split tempura statements inherit their containing merchant field through judgment and presentation", async () => {
  const { createHash } = await import("node:crypto");
  const { parseTabelogSourceFieldQuotes } = await import("../integrations/tabelog/tabelog-page-parser.js");
  const { ModelRestaurantFactJudgment } = await import("../integrations/restaurant-facts/model-fact-judgment.js");
  const root = new URL("./fixtures/restaurant-presentation-evidence/", import.meta.url);
  const dir = new URL("checkpoint-c-live-20261020/c18-offline-reassessment-20261022/", root);
  const inputs = JSON.parse(await readFixture(new URL("c18-inputs.json", dir), "utf8"));
  const hard = JSON.parse(await readFixture(new URL("hard-evidence.json", dir), "utf8"));
  const expected: Record<string, string[]> = { "c-06": ["13320287"], "c-10": ["13320287", "13282321"], "c-14": ["13192886"] };
  let checked = 0;
  for (const [runId, ids] of Object.entries(expected)) {
    const row = inputs.runs.find((r: any) => r.runId === runId), bytes = await readFixture(new URL(row.artifactPath, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), row.artifactSha256);
    const artifact = JSON.parse(bytes.toString());
    const ctx = (now: string) => ({ taskId: artifact.runId, runId: artifact.runId, now, createId: (p: string) => p });
    let state = restaurantBookingTaskDefinition.create({}, ctx(artifact.startedAt));
    for (const envelope of artifact.events) {
      if (envelope.event.type === "RESULTS_PRESENTED") break;
      state = restaurantBookingTaskDefinition.transition(state, envelope.event, ctx(envelope.occurredAt)).state;
    }
    for (const id of ids) {
      const candidate = state.candidates.find(c => c.restaurant.id.endsWith('/' + id))!, check = state.factChecks![candidate.restaurant.id]!;
      const fact = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "RESTAURANT_FACT" && e.provider === "TABELOG")!;
      const identity = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "ENTITY_MATCH" && e.sourceUrl === fact.sourceUrl)!;
      const binding = hard.runs.find((r: any) => r.artifactSha256 === row.artifactSha256).snapshots.find((s: any) => s.evidenceId === fact.evidenceId);
      const html = await readFixture(new URL(binding.path, dir), "utf8");
      assert.equal(createHash("sha256").update(html).digest("hex"), binding.sha256);
      const fields = parseTabelogSourceFieldQuotes({ url: fact.sourceUrl!, title: "", text: "", html });
      const statements = (fact.claims.restaurantTypeFacts as string[]).map((text, index) => ({ id: `selected:${index}`, text }));
      assert.ok(statements.some(s => s.text === "Tempura"));
      const document = { id: fact.evidenceId, candidateId: candidate.restaurant.id, identityEvidenceId: identity.evidenceId, sourceFieldQuotes: fields, statements };
      const judgment = new ModelRestaurantFactJudgment({ async complete() { return {
        invocationId: "scripted-original-selection", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
        outputText: JSON.stringify({ sourceSelections: [{ documentId: document.id, statementIds: statements.map(s => s.id) }], judgments: [] }),
      }; } });
      const read = await judgment.judge({ candidate, intent: state.intent!, evidence: [identity], sourceDocuments: [document] });
      const fresh = read.evidence.find(e => e.evidenceId === fact.evidenceId)!;
      assert.ok(fresh.sourceFieldQuotes?.some(q => q.field === "CATEGORY" && q.quote === "Tempura"), `${runId}:${id}: selected line must inherit CATEGORY from containing field`);
      assert.ok(fresh.sourceFieldQuotes!.every(q => statements.some(s => s.text === q.quote)), "do not expand a selected line into unselected field text");
      state.readEvidence = state.readEvidence.map(e => e.evidenceId === fact.evidenceId ? { ...e, sourceFieldQuotes: fresh.sourceFieldQuotes! } : e);
      checked++;
    }
    let sourceCalls = 0;
    const router = new RestaurantExecutionRouter(
      { executionRoute: "STRUCTURED_ADAPTER", async search() { sourceCalls++; throw Error("NO_SOURCE_READS"); } },
      { executionRoute: "STRUCTURED_ADAPTER", async check() { sourceCalls++; throw Error("NO_SOURCE_READS"); } },
      { structuredReadTimeoutMs: 1000, browserReadTimeoutMs: 1000 },
    );
    const at = artifact.finalSnapshot.domainState.presentedResults.presentedAt;
    const execution = await router.execute({ type: "PRESENT_RESULTS", candidateIds: artifact.finalSnapshot.domainState.presentedResults.candidateIds }, state, at);
    const shown = restaurantBookingTaskDefinition.transition(state, execution.event!, ctx(at)).state.presentedResults!;
    for (const id of ids) {
      const candidateId = shown.candidateIds.find(c => c.endsWith('/' + id))!;
      assert.equal(shown.conditionStates[candidateId]![0]!.status, "MET", `${runId}:${id}: split tempura must reach actual presentation`);
      assert.ok(shown.conditionStates[candidateId]![0]!.sources.some(q => q.field === "CATEGORY" && q.quote === "Tempura"));
    }
    assert.equal(sourceCalls, 0);
  }
  assert.equal(checked, 4);
});

test("C18 selected Utou course titles remain known when the selected statement also contains the item count", async () => {
  const { createHash } = await import("node:crypto");
  const { parseTabelogSourceFieldQuotes } = await import("../integrations/tabelog/tabelog-page-parser.js");
  const { ModelRestaurantFactJudgment } = await import("../integrations/restaurant-facts/model-fact-judgment.js");
  const root = new URL("./fixtures/restaurant-presentation-evidence/", import.meta.url);
  const dir = new URL("checkpoint-c-live-20261020/c18-offline-reassessment-20261022/", root);
  const inputs = JSON.parse(await readFixture(new URL("c18-inputs.json", dir), "utf8"));
  const hard = JSON.parse(await readFixture(new URL("hard-evidence.json", dir), "utf8"));
  const expected: Record<string, string[]> = { "c-05": ["13300814"], "c-09": ["13300814"], "c-13": ["13300814"] };
  let checked = 0;
  const statuses: Array<{ runId: string; status: string }> = [];
  for (const [runId, ids] of Object.entries(expected)) {
    const row = inputs.runs.find((r: any) => r.runId === runId), bytes = await readFixture(new URL(row.artifactPath, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), row.artifactSha256);
    const artifact = JSON.parse(bytes.toString());
    const ctx = (now: string) => ({ taskId: artifact.runId, runId: artifact.runId, now, createId: (p: string) => p });
    let state = restaurantBookingTaskDefinition.create({}, ctx(artifact.startedAt));
    for (const envelope of artifact.events) {
      if (envelope.event.type === "RESULTS_PRESENTED") break;
      state = restaurantBookingTaskDefinition.transition(state, envelope.event, ctx(envelope.occurredAt)).state;
    }
    for (const id of ids) {
      const candidate = state.candidates.find(c => c.restaurant.id.endsWith('/' + id))!, check = state.factChecks![candidate.restaurant.id]!;
      const fact = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "RESTAURANT_FACT" && e.provider === "TABELOG")!;
      const identity = state.readEvidence.find(e => check.evidenceIds.includes(e.evidenceId) && e.kind === "ENTITY_MATCH" && e.sourceUrl === fact.sourceUrl)!;
      const binding = hard.runs.find((r: any) => r.artifactSha256 === row.artifactSha256).snapshots.find((s: any) => s.evidenceId === fact.evidenceId);
      const html = await readFixture(new URL(binding.path, dir), "utf8");
      assert.equal(createHash("sha256").update(html).digest("hex"), binding.sha256);
      const fields = parseTabelogSourceFieldQuotes({ url: fact.sourceUrl!, title: "", text: "", html });
      const statements = (fact.claims.restaurantTypeFacts as string[]).map((text, index) => ({ id: `selected:${index}`, text }));
      assert.ok(statements.some(s => s.text.includes("Kaiseki with Exquisite Ingredients") && s.text.endsWith("8 items")));
      const document = { id: fact.evidenceId, candidateId: candidate.restaurant.id, identityEvidenceId: identity.evidenceId, sourceFieldQuotes: fields, statements };
      const judgment = new ModelRestaurantFactJudgment({ async complete() { return {
        invocationId: "scripted-original-selection", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
        outputText: JSON.stringify({ sourceSelections: [{ documentId: document.id, statementIds: statements.map(s => s.id) }], judgments: [] }),
      }; } });
      const read = await judgment.judge({ candidate, intent: state.intent!, evidence: [identity], sourceDocuments: [document] });
      const fresh = read.evidence.find(e => e.evidenceId === fact.evidenceId)!;
      const title = fields.find(q => q.field === "COURSE_TITLE" && q.quote.includes("Kaiseki with Exquisite Ingredients"))!;
      assert.ok(title, "the saved merchant course title is the independent quote boundary");
      assert.ok(fresh.sourceFieldQuotes?.some(q => q.field === "COURSE_TITLE" && q.quote === title.quote));
      assert.ok(fresh.sourceFieldQuotes!.filter(q => q.field === "COURSE_TITLE").every(q => !q.quote.includes("8 items")), "adjacent item counts cannot inherit COURSE_TITLE");
      state.readEvidence = state.readEvidence.map(e => e.evidenceId === fact.evidenceId ? { ...e, sourceFieldQuotes: fresh.sourceFieldQuotes ?? [] } : e);
      checked++;
    }
    let sourceCalls = 0;
    const router = new RestaurantExecutionRouter(
      { executionRoute: "STRUCTURED_ADAPTER", async search() { sourceCalls++; throw Error("NO_SOURCE_READS"); } },
      { executionRoute: "STRUCTURED_ADAPTER", async check() { sourceCalls++; throw Error("NO_SOURCE_READS"); } },
      { structuredReadTimeoutMs: 1000, browserReadTimeoutMs: 1000 },
    );
    const at = artifact.finalSnapshot.domainState.presentedResults.presentedAt;
    const execution = await router.execute({ type: "PRESENT_RESULTS", candidateIds: artifact.finalSnapshot.domainState.presentedResults.candidateIds }, state, at);
    const shown = restaurantBookingTaskDefinition.transition(state, execution.event!, ctx(at)).state.presentedResults!;
    for (const id of ids) {
      const candidateId = shown.candidateIds.find(c => c.endsWith('/' + id))!;
      statuses.push({ runId, status: shown.conditionStates[candidateId]![0]!.status });
      assert.ok(shown.conditionStates[candidateId]![0]!.sources.some(q => q.field === "COURSE_TITLE" && q.quote.includes("Kaiseki with Exquisite Ingredients") && !q.quote.includes("8 items")));
    }
    assert.equal(sourceCalls, 0);
  }
  assert.equal(checked, 3);
  assert.deepEqual(statuses, Object.keys(expected).map(runId => ({ runId, status: "MET" })), "already selected complete merchant title cannot become an unknown condition");
});

test("Phase2c observed cuisine and approved price applicability reach Router to Reducer without changing other saved displays", async () => {
  const {createHash}=await import("node:crypto");
  const root=new URL("./fixtures/restaurant-presentation-evidence/",import.meta.url),dir="near-and-condition-display-20261023";
  const manifest=JSON.parse(await readFixture(new URL(`${dir}/inputs/manifest.json`,root),"utf8"));
  const expected:Record<string,string[]>={"h-02":["13093277","13018986","13271031"],"h-08":["13271031"]};
  // Independently reviewed literal exclusions in these frozen historical pages.
  // Raw quotes remain evidence; they no longer participate in a budget claim.
  const excludedPriceQuotes = new Map([
    ["cdb311583ede41e9656c40c1a227ce6dc015c6eae4ca4533ba9edd1ee1f005aa", "all-you-can-drink-only scope does not establish a meal"],
    ["2b5e30076c8cb38f2788bc2efb728f09bf2e79e7b60ebe21cfcccc82b6a8e18e", "limited time offer has no checkable validity period"],
    ["65ac774d7b20f0a2044552de8eed9d132df16a7fe5a5f46e625f03c16df52831", "limited offer has no checkable validity period"],
    ["af03c93330f50ca839c56aa9194ea042fdbef56882776f49e3cab0423f33d7a2", "terrace-exclusive eligibility not established"],
    ["e16c18f43417f77290923c14e5bfb30950a74b27ec215c07859a68747a05e3c3", "terrace-limited eligibility not established"],
  ]);
  const excludedSeen = new Set<string>();
  let conditions=0,unchangedRuns=0,sourceCalls=0;
  const noRead=async()=>{sourceCalls++;throw Error("SAVED_EVENT_REPLAY_MUST_NOT_READ_SOURCES");};
  const router=new RestaurantExecutionRouter({executionRoute:"STRUCTURED_ADAPTER",search:noRead},{executionRoute:"STRUCTURED_ADAPTER",check:noRead},{structuredReadTimeoutMs:1000,browserReadTimeoutMs:1000});
  for(const row of manifest.runs){
    const bytes=await readFixture(new URL(row.projectionPath,root));assert.equal(createHash("sha256").update(bytes).digest("hex"),row.projectionSha256);
    const saved=JSON.parse(bytes.toString()),ctx=(now:string)=>({taskId:saved.runId,runId:saved.runId,now,createId:(p:string)=>p});
    let state=restaurantBookingTaskDefinition.create({},ctx(saved.startedAt));
    for(const envelope of saved.events){if(envelope.event.type==="RESULTS_PRESENTED")break;state=restaurantBookingTaskDefinition.transition(state,envelope.event,ctx(envelope.occurredAt)).state;}
    const original=structuredClone(saved.originalPresentation);
    if (original) for (const [id, rows] of Object.entries(original.conditionStates) as Array<[string, any[]]>) for (const condition of rows) {
      condition.sources = condition.sources.filter((quote: {field: string; quote: string; sourceUrl: string}) => {
        const digest = createHash("sha256").update(quote.quote).digest("hex");
        if (quote.field !== "PRICE" || !excludedPriceQuotes.has(digest)) return true;
        excludedSeen.add(digest);
        assert.ok(restaurantCurrentFactEvidence(state,id).some(fact => fact.provider !== "MODEL_JUDGMENT" && fact.sourceUrl === quote.sourceUrl
          && [fact.priceFacts?.lunchBudgetRangeYen,fact.priceFacts?.dinnerBudgetRangeYen,...fact.priceFacts?.listedCoursePricesYen ?? []].some(price=>price?.quote===quote.quote)),
          "excluded price and complete quotation remain in the current same-outlet raw evidence");
        return false;
      });
    }
    if(!original){assert.equal(state.presentedResults,undefined);unchangedRuns++;continue;}
    const result=await router.execute({type:"PRESENT_RESULTS",candidateIds:original.candidateIds},state,original.presentedAt);
    assert.equal(result.event?.type,"RESULTS_PRESENTED");
    const shown=restaurantBookingTaskDefinition.transition(state,result.event!,ctx(original.presentedAt)).state.presentedResults!;
    if(!expected[row.runId]){assert.deepEqual(shown,original,`${row.runId}: unrelated presentation must remain byte-equivalent as data`);unchangedRuns++;continue;}
    const withoutChanges=structuredClone(shown);
    for(const id of shown.candidateIds){
      assert.ok(expected[row.runId]!.includes(id.split('/').at(-1)!));
      const before=original.conditionStates[id][0],after=shown.conditionStates[id]![0]!;
      assert.equal(before.status,"NOT_CHECKED");assert.equal(after.status,"MET",`${row.runId}:${id}: already observed cuisine must be displayed`);
      const independent=saved.originalEvaluation.conditionStates.find((c:any)=>c.candidateId===id).criteria.find((c:any)=>c.goldIndex===0);
      assert.equal(independent.status,"MET");assert.equal(after.status,independent.status);
      assert.ok(after.sources.some(q=>["CATEGORY","COURSE_TITLE","COURSE_DESCRIPTION"].includes(q.field)));
      for(const q of after.sources)assert.ok(restaurantCurrentFactEvidence(state,id).some(f=>f.provider!=="MODEL_JUDGMENT"&&f.sourceUrl===q.sourceUrl&&f.sourceFieldQuotes?.some(field=>field.field===q.field&&field.quote===q.quote)),"only current same-outlet raw merchant quotes reach display");
      assert.deepEqual(shown.conditionStates[id]!.slice(1),original.conditionStates[id].slice(1),"price state and all remaining applicable quotations stay unchanged");
      withoutChanges.conditionStates[id]![0]=before;conditions++;
    }
    assert.deepEqual(withoutChanges,original,"only the four cuisine rows and the five literal price-source exclusions change; all states, identities and times remain identical");
  }
  assert.deepEqual([...excludedSeen].sort(), [...excludedPriceQuotes.keys()].sort());
  assert.equal(conditions,4);assert.equal(unchangedRuns,9);assert.equal(sourceCalls,0);
});
