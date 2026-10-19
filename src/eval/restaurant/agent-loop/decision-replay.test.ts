import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { runDecisionReplay, acceptableReplayAction, reproducesRecordedAction, rebuildBrowserInput, type ReplaySeed } from "./runners/run-decision-replay.js";
import { assessSelectionReplay } from "./selection-replay-assessment.js";

test("P2-2 conditional selection oracle checks every target and leaves uncompiled reviewer conditions unassessed", async () => {
  const root = new URL("../../../../",import.meta.url);
  const annotations = JSON.parse(await readFile(new URL(".eval-artifacts/p2-2-selection-20261019/seed-annotations.rev1.frozen.json",root),"utf8"));
  const contracts = JSON.parse(await readFile(new URL(".eval-artifacts/p2-2-selection-20261019/selection-contracts.rev1.json",root),"utf8"));
  const seed = JSON.parse(await readFile(new URL(".eval-artifacts/phase1-replay/seeds.v7.json",root),"utf8")).seeds.find((seed: ReplaySeed) => seed.seedId === "p1-seed-0134");
  const capture = (await readFile(new URL(seed.origin.runArtifact,root),"utf8")).split(/\n/).filter(Boolean).map(line => JSON.parse(line)).find(row => row.sequence === seed.origin.decisionIndex);
  const context = JSON.parse(capture.messages.find((message: {role:string}) => message.role === "user").content).context;
  const artifact = JSON.parse(gunzipSync(await readFile(new URL(seed.origin.resultArtifact,root))).toString());
  const observed = artifact.events.filter((event: any) => event.event.type === "SEARCH_COMPLETED" && event.occurredAt <= capture.startedAt).flatMap((event: any) => event.event.candidates.map((candidate: any) => candidate.restaurant));
  const annotation = annotations.annotations.find((a: {seedId:string}) => a.seedId === seed.seedId), rules = contracts.rules.filter((rule: {seedId:string}) => rule.seedId === seed.seedId);
  const before = assessSelectionReplay(seed.recordedAction,context,observed,annotation,rules,1000);
  assert.equal(before.metrics.directInRadiusCheckable,8);
  assert.equal(before.metrics.directSelected,1);
  assert.equal(before.verdict,"NOT_ACCEPTABLE","one direct among three does not satisfy the independent all-selected condition");
  const directIds = observed.filter((outlet: any) => outlet.sourceIds.googleWebsiteUri?.startsWith("https://tabelog.com/")).map((outlet: any) => outlet.id).slice(0,3);
  assert.equal(assessSelectionReplay({type:"CHECK_AVAILABILITY",candidateIds:directIds},context,observed,annotation,rules,1000).verdict,"ACCEPTABLE");
  const altered = {...annotation,acceptableActions:annotation.acceptableActions.map((action: any) => ({...action,when:action.when+" UNCOMPILED_NEW_CONDITION"}))};
  assert.equal(assessSelectionReplay({type:"CHECK_AVAILABILITY",candidateIds:directIds},context,observed,altered,rules,1000).verdict,"NOT_EVALUATED");
  const rev2 = JSON.parse(await readFile(new URL(".eval-artifacts/p2-2-selection-20261019/seed-annotations.reviewer.json",root),"utf8")).annotations.find((a: {seedId:string}) => a.seedId === seed.seedId);
  const currentRules = JSON.parse(await readFile(new URL(".eval-artifacts/p2-2-selection-20261019/selection-contracts.json",root),"utf8")).rules.filter((rule: {seedId:string}) => rule.seedId === seed.seedId);
  const mixedIds = [...directIds.slice(0,2),seed.recordedAction.candidateIds[1]];
  assert.equal(assessSelectionReplay({type:"CHECK_AVAILABILITY",candidateIds:mixedIds},context,observed,rev2,currentRules,1000).verdict,"ACCEPTABLE","approved revision2 permits two DIRECT plus one in-radius name resolution");
  assert.equal(assessSelectionReplay({type:"CHECK_AVAILABILITY",candidateIds:mixedIds},context,observed,annotation,rules,1000).verdict,"NOT_ACCEPTABLE","same output remains below the old strict rule");
  const reduced = {...context,checkableCandidateIds:directIds.slice(0,2),candidates:context.candidates.filter((c: {id:string}) => directIds.slice(0,2).includes(c.id) || c.id === seed.recordedAction.candidateIds[1])};
  assert.equal(assessSelectionReplay({type:"CHECK_AVAILABILITY",candidateIds:[directIds[0]]},reduced,observed,rev2,currentRules,1000).verdict,"NOT_ACCEPTABLE","with two direct options, both must be included");
  assert.equal(assessSelectionReplay({type:"CHECK_AVAILABILITY",candidateIds:directIds.slice(0,2)},reduced,observed,rev2,currentRules,1000).verdict,"ACCEPTABLE");
});

test("E1 replay seeds retain both real h001 decisions and leave conditional proposals unscored", async () => {
  // Read/validate only. Never dispatch either new seed to runDecisionReplay.
  const root = new URL("../../../../", import.meta.url);
  const old = JSON.parse(await readFile(new URL(".eval-artifacts/phase1-replay/seeds.v6.json", root), "utf8"));
  const current = JSON.parse(await readFile(new URL(".eval-artifacts/phase1-replay/seeds.v7.json", root), "utf8"));
  const added = current.seeds.filter((seed: any) => seed.origin.run === "p20-h001-a1");
  assert.equal(added.length, 2, "both the post-single-Tabelog decision and the 37-Google-candidate selection must be retained");
  assert.deepEqual(current.seeds.slice(0, old.seeds.length), old.seeds, "no historic annotations change");
  const artifact = JSON.parse(gunzipSync(await readFile(new URL(".eval-artifacts/calibration-phase1-20261015/inputs/p20-h001-a1.result.json.gz", root))).toString());
  assert.deepEqual(added.map((seed: any) => seed.origin.stepNumber), [2, 8]);
  assert.deepEqual(added.map((seed: any) => seed.origin.decisionIndex), [4, 28]);
  for (const [index, seed] of added.entries()) {
    assert.equal(seed.labelStatus, "PROPOSED"); assert.match(seed.labelBasis, /待独立标注/);
    assert.deepEqual(seed.acceptableActions, [], "conditional proposal metadata must not silently become a scored type-only match");
    assert.equal(seed.scoring.includedInPassRate, false);
    assert.ok(seed.proposedAcceptableActions.some((action: any) => action.type === "CHECK_AVAILABILITY" && /supported.*source/i.test(action.when)));
    assert.ok(seed.proposedAcceptableActions.every((action: any) => !/Matsumoto|13261619/.test(action.when)), "no named-shop requirement");
    const bytes = await readFile(new URL(seed.origin.runArtifact, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), seed.origin.packagedCaptureSha256);
    const line = bytes.toString().trim().split("\n").find(line => JSON.parse(line).sequence === seed.origin.decisionIndex)!;
    assert.equal(createHash("sha256").update(line).digest("hex"), seed.origin.originalRowSha256);
    const row = JSON.parse(line), context = JSON.parse(row.messages.find((message: any) => message.role === "user").content).context;
    const trajectory = artifact.trajectories.find((step: any) => step.stepNumber === seed.origin.stepNumber);
    assert.deepEqual(context, trajectory.decisionContext, "complete original decision input, not reconstructed from the final candidate list");
    assert.deepEqual(context.candidates.length, [1, 38][index]);
    assert.equal(row.purpose, "restaurant_agent_decide");
    assert.equal(seed.origin.originalCaptureSha256, artifact.decisionCapture.sha256);
    const output = JSON.parse(row.outputText);
    assert.equal(output.type, trajectory.agentAction.type);
    assert.deepEqual(output.candidateIds, trajectory.agentAction.candidateIds);
    const preceding = artifact.trajectories.find((step: any) => step.stepNumber === seed.origin.stepNumber - 1);
    assert.equal(preceding.observation.newCandidateIds.length, [1, 37][index]);
  }
});

test("replay excludeCandidateIds rejects intersections and accepts disjoint candidate sets", () => {
  const expected = { type: "CHECK_AVAILABILITY", excludeCandidateIds: ["excluded"] };
  assert.equal(acceptableReplayAction({ type: "CHECK_AVAILABILITY", candidateIds: ["eligible"] }, expected), true);
  assert.equal(acceptableReplayAction({ type: "CHECK_AVAILABILITY", candidateIds: ["eligible", "excluded"] }, expected), false);
  assert.equal(acceptableReplayAction({ type: "CHECK_AVAILABILITY" }, expected), false, "missing selected candidates cannot establish disjointness");
});

test("replay candidateIdsExact compares sets independently of order and rejects missing or extra candidates", () => {
  const expected = { type: "PRESENT_RESULTS", candidateIdsExact: ["a", "b"] };
  assert.equal(acceptableReplayAction({ type: "PRESENT_RESULTS", candidateIds: ["b", "a"] }, expected), true);
  assert.equal(acceptableReplayAction({ type: "PRESENT_RESULTS", candidateIds: ["a", "b", "extra"] }, expected), false);
  assert.equal(acceptableReplayAction({ type: "PRESENT_RESULTS", candidateIds: ["a"] }, expected), false);
});

test("replay rejects unknown match fields rather than ignoring their requirements", () => {
  assert.throws(() => acceptableReplayAction({ type: "WAIT" }, JSON.parse('{"type":"WAIT","futureMatchRule":true}')), /UNSUPPORTED_REPLAY_MATCH_FIELD:futureMatchRule/);
});

test("replay validates every matching alternative before any model call", async () => {
  const directory = await mkdtemp(join(tmpdir(), "replay-invalid-label-"));
  const seed = { seedId: "invalid", level: "BROWSER", subCause: "FIXTURE", labelStatus: "FROZEN", origin: { run: "fixture", runArtifact: "unused.jsonl", decisionIndex: 1, recordingDir: "none" }, recordedAction: { type: "WAIT" }, acceptableActions: [{ type: "WAIT" }, { type: "WAIT", futureMatchRule: true }] };
  await writeFile(join(directory, "seeds.json"), JSON.stringify({ seeds: [seed] }));
  let calls = 0;
  await assert.rejects(() => runDecisionReplay({ mode: "original", seedsPath: join(directory, "seeds.json"), sourceRoot: directory, outputDir: join(directory, "out"), budgetPath: join(directory, "budget.json"), item: "fixture", round: 1, gateway: { async complete() { calls++; throw new Error("must not call"); } } }), /UNSUPPORTED_REPLAY_MATCH_FIELD:futureMatchRule/);
  assert.equal(calls, 0);
});

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
