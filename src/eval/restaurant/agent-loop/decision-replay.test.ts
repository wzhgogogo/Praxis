import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runDecisionReplay, acceptableReplayAction, reproducesRecordedAction, rebuildBrowserInput, type ReplaySeed } from "./runners/run-decision-replay.js";

test("P1-B original replay preserves complete captured messages and counts the failed call once", async () => {
  const directory = await mkdtemp(join(tmpdir(), "decision-replay-"));
  const messages = [{ role: "system" as const, content: "captured system\nunchanged" }, { role: "user" as const, content: JSON.stringify({ source: "FIXTURE", stage: "AVAILABILITY", goal: { outlet: { name: "Fixture" } }, observation: { revision: 7, url: "https://fixture.example", targets: [] } }) }];
  const row = { sequence: 1, purpose: "browser_read_decide", promptVersion: "12", messages, outputSchema: { name: "browser_read_action", version: "8" }, responseFormat: "JSON_SCHEMA", timeoutMs: 1000, maxOutputTokens: 320, temperature: 0, thinking: "disabled", outputText: '{"action":"WAIT","targetRef":"","authoritativeField":"NONE","requestedState":"NONE","reason":"Recorded wait"}' };
  const seeds: ReplaySeed[] = [1, 2].map(number => ({ seedId: `seed-${number}`, level: "BROWSER", subCause: "ASYNC_SETTLE", labelStatus: "FROZEN", origin: { run: "fixture", runArtifact: "capture.jsonl", decisionIndex: number, recordingDir: "none" }, recordedAction: { type: "WAIT" }, acceptableActions: [{ type: "WAIT" }] }));
  await writeFile(join(directory, "capture.jsonl"), [row, { ...row, sequence: 2 }].map(value => JSON.stringify(value)).join("\n"));
  await writeFile(join(directory, "seeds.json"), JSON.stringify({ seeds }));
  await writeFile(join(directory, "budget.json"), JSON.stringify({ limit: 2, phaseReplayLimit: 1500, previousPhaseReplayCalls: 0, nightRealModelCalls: 0, calls: [] }));
  let calls = 0;
  const result = await runDecisionReplay({ mode: "original", seedsPath: join(directory, "seeds.json"), sourceRoot: directory, outputDir: join(directory, "out"), budgetPath: join(directory, "budget.json"), item: "fixture", round: 1, gateway: { async complete(request) {
    assert.deepEqual(request.messages, messages); calls++;
    if (calls === 2) throw Object.assign(new Error("fixture failure"), { code: "TIMEOUT" });
    return { invocationId: "fixture", provider: "FIXTURE", model: "fixture", outputText: row.outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
  } } });
  assert.equal(result.realModelCalls, 2); assert.equal(calls, 2);
  assert.equal(result.byLabel[0]?.passed, 1); assert.equal(result.byLabel[0]?.failures, 1);
  const budget = JSON.parse(await readFile(join(directory, "budget.json"), "utf8"));
  assert.equal(budget.nightRealModelCalls, 2); assert.deepEqual(budget.calls.map((value: { status: string }) => value.status), ["SUCCEEDED", "FAILED"]);
  assert.equal(acceptableReplayAction({ type: "CHOOSE_OPTION", field: "PARTY_SIZE", targetLabel: "10 guests", targetKind: "OPTION" }, { type: "CHOOSE_OPTION", field: "PARTY_SIZE", targetLabelPattern: "^10 guests$" }), true);
  assert.equal(acceptableReplayAction({ type: "CHOOSE_OPTION", field: "TIME", targetLabel: "10 guests" }, { type: "CHOOSE_OPTION", field: "PARTY_SIZE", targetLabelPattern: "^10 guests$" }), false);
  assert.equal(reproducesRecordedAction({ type: "CLICK", targetLabel: "wrong" }, { type: "CLICK", targetLabel: "right" }), false);
});

test("P1-B static saved DOM uses current Executor targets with scripts and external requests disabled", async () => {
  const input = { history: [], taskId: "static-fixture", source: "FIXTURE", stage: "AVAILABILITY" as const,
    objective: "Observe the guest choice", progress: "Prior action opened the list", skills: { generic: "fixture", source: "fixture" },
    goal: { outlet: { name: "Fixture" }, partySize: 10, hardCriteria: [] },
    observation: { revision: 4, url: "https://offline.invalid/venue", title: "Fixture", visibleText: "10 guests", targets: [] } };
  const html = '<title>Fixture</title><button role="combobox" aria-label="Guests" aria-expanded="true" aria-controls="guests">Guests</button><div role="listbox" id="guests"><div role="option">10 guests</div></div><script>document.body.innerHTML="scripts executed";fetch("https://never.invalid")</script><img src="https://never.invalid/image">';
  const result = await rebuildBrowserInput(html, input, []);
  assert.equal(result.limitations.length, 0);
  const target = result.input.observation.targets.find(target => target.label === "10 guests");
  assert.equal(target?.kind, "OPTION"); assert.deepEqual(target?.availableActions, ["CHOOSE_OPTION:PARTY_SIZE"]);
  assert.equal(result.input.observation.visibleText.includes("scripts executed"), false);
  assert.equal(result.input.progress, input.progress);
});

test("C1 injection preserves captured goals and targets and limits history to six steps in the same read", async () => {
  const { historyInjectedRequest, injectedBrowserHistory } = await import("./runners/run-decision-replay.js");
  const rows = Array.from({length:9},(_,i)=>({sequence:i+1,purpose:"browser_read_decide",promptVersion:"12",messages:[{role:"system" as const,content:"captured rules"},{role:"user" as const,content:JSON.stringify({source:"FIXTURE",stage:"DISCOVERY",goal:{outlet:{name:"A"}},progress:i===2?"The previous proposed action was rejected: forbidden":"wait",observation:{revision:i+1,url:"https://fixture.example",visibleText:`state ${i}`,targets:[]}})}],outputSchema:{name:"browser_read_action",version:"8"},responseFormat:"JSON_SCHEMA" as const,timeoutMs:1000,maxOutputTokens:320,temperature:0,thinking:"disabled" as const,outputText:'{"action":"WAIT","targetRef":"","authoritativeField":"NONE","requestedState":"NONE","reason":"Recorded wait"}'}));
  const seed:ReplaySeed={seedId:"history",level:"BROWSER",subCause:"NO_ACTION_MEMORY",labelStatus:"FROZEN",origin:{run:"fixture",runArtifact:"none",decisionIndex:9,recordingDir:"none"},recordedAction:{type:"WAIT"},acceptableActions:[{type:"WAIT"}]};
  const row=rows.at(-1)!; const before=JSON.parse(row.messages[1]!.content);
  const request=historyInjectedRequest(seed,row,rows), after=JSON.parse(request.messages[1]!.content);
  assert.equal(after.history.length,6);delete after.history;assert.deepEqual(after,before);
  assert.ok(request.messages[0]!.content.startsWith(row.messages[0]!.content));
  assert.equal(injectedBrowserHistory(rows,rows[2]!)[1]?.outcome,"REJECTED");
  const reset={...row,messages:[row.messages[0]!,{...row.messages[1]!,content:JSON.stringify({...before,goal:{outlet:{name:"B"}}})}]};
  assert.deepEqual(injectedBrowserHistory(rows,reset),[]);
  assert.equal(row.messages[1]!.content,JSON.stringify(before));
});

test("C8 raw Agent replay injects only categories observed before the decision and preserves legal actions", async () => {
  const { categoryInjectedRequest } = await import("./runners/run-decision-replay.js");
  const context = { schemaVersion: "9", now: "2026-10-10T10:00:00Z", candidates: [{id:"a",outletName:"A"}], legalActions:{checkAvailability:["a"]}, constraints:{hard:["local cuisine"]} };
  const row = { sequence: 15, purpose: "restaurant_agent_decide", promptVersion: "23", startedAt: context.now,
    messages:[{role:"system" as const,content:"original rules"},{role:"user" as const,content:JSON.stringify({context,capabilities:["READ"]})}],
    outputSchema:{name:"restaurant_agent_action",version:"1"}, responseFormat:"JSON_SCHEMA" as const, timeoutMs:1000,maxOutputTokens:320,temperature:0,thinking:"disabled" as const,outputText:null };
  const seed: ReplaySeed = { seedId:"categories",level:"AGENT",subCause:"CATEGORY_SELECTION",labelStatus:"PROPOSED",origin:{run:"fixture",runArtifact:"capture",decisionIndex:15,recordingDir:"none"},recordedAction:{type:"CHECK_AVAILABILITY"},acceptableActions:[] };
  const evidence = [{evidenceId:"fixture",requestFingerprint:"fixture",kind:"DISCOVERY",candidateId:"a",provider:"GOOGLE_PLACES",observedAt:"2026-10-10T09:59:00Z",claims:{types:["japanese_restaurant"]}},
    {evidenceId:"fixture",requestFingerprint:"fixture",kind:"DISCOVERY",candidateId:"a",provider:"TABLECHECK",observedAt:"2026-10-10T10:01:00Z",claims:{sourceCategories:["future fact"]}}] as import("../../../domains/restaurant/contracts.js").RestaurantReadEvidence[];
  const request = categoryInjectedRequest(seed,row,evidence);
  const injected = JSON.parse(request.messages[1]!.content);
  assert.deepEqual(injected.context.candidates[0].sourceCategories,[{source:"GOOGLE_PLACES",values:["japanese_restaurant"]}]);
  const {sourceCategories: _categories,...candidate} = injected.context.candidates[0];
  assert.deepEqual(candidate,context.candidates[0]);
  assert.deepEqual(injected.context.legalActions,context.legalActions);
  assert.deepEqual(injected.context.constraints,context.constraints);
  assert.deepEqual(injected.capabilities,["READ"]);
  assert.ok(request.messages[0]!.content.startsWith("original rules"));
});
