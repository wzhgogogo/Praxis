import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { url, localFixture } from "./browser-read-test-fixtures.js";

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} projects TableCheck search wrapper as combobox and only its native input as fillable`, async () => {
    const saved = readFileSync(new URL("./fixtures/tablecheck-search-control-20260929.html", import.meta.url), "utf8");
    const runtime = localFixture(saved, runtimeKind);
    let projected = false;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      const wrapper = input.observation.targets.find(target => target.role === "combobox" && target.kind === "BUTTON");
      const field = input.observation.targets.find(target => target.label === "Sushi tonight for 2 in Ginza" && target.kind === "INPUT");
      assert.ok(wrapper?.availableActions?.includes("CLICK"));
      assert.equal(wrapper!.availableActions?.some(action => action.startsWith("FILL")), false);
      assert.equal(field?.availableActions?.some(action => action.startsWith("FILL")), false, "no unbound free-text model fill");
      projected = true;
      return { type: "REQUEST_HUMAN_HELP", reason: "No code-bound search text is supplied" };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await session.navigate(url);
      const controls = await session.observeControls!();
      const outer = controls.find(control => control.structure?.tag === "DIV" && control.role === "combobox");
      const inner = controls.find(control => control.structure?.tag === "INPUT" && control.structure.name === "search_text");
      assert.equal(outer?.kind, "BUTTON");
      assert.equal(outer?.value, "", "a combobox may project its single observed native input value");
      assert.equal(inner?.kind, "INPUT");
      assert.equal(inner?.label, "Sushi tonight for 2 in Ginza");
      assert.equal(inner?.value, "", "an observed empty native search property remains distinct from an absent value");
      await assert.rejects(session.fill(outer!.id, "Sushi"));
      await session.fill(inner!.id, "Sushi");
      assert.equal((await session.observeControls!()).find(control => control.structure?.name === "search_text")?.value, "Sushi");
      await executor.runSkill({ taskId: "saved-search-control", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Inspect the search field",
        completion: () => ({ complete: false, reason: "No query result" }) });
      assert.equal(projected, true);
    } finally { await executor.close(); }
  });

  test(`${runtimeKind} completes an exact bound search suggestion without clicking its covered background control`, async () => {
    const query = "vegetarian restaurants near Central Station";
    const saved = readFileSync(new URL("./fixtures/tablecheck-search-control-20260929.html", import.meta.url), "utf8");
    // Synthetic interaction around the saved wrapper and the Oct 7 observed
    // listbox/quoted query option shape; this is not a saved-response Replay.
    const runtime = localFixture(`${saved}
      <style>[role=combobox]{height:40px}#background{position:absolute;top:60px;left:10px;width:400px;height:40px}
      [role=listbox]{position:absolute;top:50px;left:0;width:450px;height:150px;background:white;z-index:2}
      [role=option]{height:50px}</style>
      <button id="background" type="button">Find availability</button>
      <div id="search-suggestions" role="listbox" hidden>
        <div role="option" aria-selected="false" aria-label='"${query}"' id="exact">Search for: "${query}"</div>
        <div role="option" aria-selected="false">Nearby</div>
      </div><output></output><script>
      const wrapper=document.querySelector('[role=combobox]'), field=wrapper.querySelector('input'), list=document.querySelector('[role=listbox]');
      field.value=${JSON.stringify(query)};
      wrapper.onclick=()=>{wrapper.setAttribute('aria-expanded','true');list.hidden=false};
      document.querySelector('#background').onclick=()=>{document.querySelector('output').textContent='WRONG_BACKGROUND_ACTION'};
      document.querySelector('#exact').onclick=()=>{wrapper.setAttribute('aria-expanded','false');list.hidden=true;
        document.querySelector('output').innerHTML='<a href="/en/public-result">Public result for '+field.value+'</a>'};
      </script>`, runtimeKind);
    let decisions = 0;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      decisions++;
      const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === `"${query}"`);
      if (!option) {
        const wrapper = input.observation.targets.find(target => target.role === "combobox");
        assert.ok(wrapper?.availableActions?.includes("CLICK"));
        return { type: "CLICK", targetRef: wrapper!.ref, reason: "Open the public query suggestions." };
      }
      assert.ok(option.availableActions?.includes("CHOOSE_OPTION:RETRIEVAL"), "the exact bound retrieval option must be actionable");
      assert.equal(input.observation.targets.some(target => target.label === "Find availability"), false, "the listbox-covered background control is not an action target");
      assert.equal(input.observation.targets.find(target => target.label === "Nearby")?.availableActions?.includes("CHOOSE_OPTION:RETRIEVAL"), false, "a different suggestion cannot replace the bound query");
      assert.equal(input.observation.targets.find(target => target.label === "Search")?.availableActions?.includes("CLICK"), false, "query selection grants no general submit permission");
      if (decisions === 2) return { type: "CHOOSE_OPTION", targetRef: input.observation.targets.find(target => target.label === "Nearby")!.ref, field: "RETRIEVAL", reason: "Counterexample: attempt an unrelated suggestion." };
      assert.match(input.progress, /label conflicts with the authoritative request/);
      return { type: "CHOOSE_OPTION", targetRef: option.ref, field: "RETRIEVAL", reason: "Submit the exact observed query suggestion." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await executor.navigate({ observed: true, source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "bound-search-suggestion", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Public search" }, retrievalExpression: query, hardCriteria: [] }, objective: "Find public result links for the bound query",
        completion: snapshot => ({ complete: snapshot.text.includes(`Public result for ${query}`), reason: "No result link observed", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(decisions, 3);
      assert.equal(result.controls.find(control => control.role === "combobox")?.value, query);
      assert.equal(result.controls.find(control => control.role === "combobox")?.expanded, false);
      assert.equal(result.snapshot.text.includes("WRONG_BACKGROUND_ACTION"), false);
    } finally { await executor.close(); }
  });

  for (const offset of [0, 1400]) test(`${runtimeKind} opens an observed covered public result at offset ${offset}`, async () => {
    const detail = "https://www.tablecheck.com/en/ginza-iwa?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.65860374437126&geo_longitude=139.74541383382513&search_text=omakase+ginza";
    const savedCard = readFileSync(new URL("./fixtures/tablecheck-ginza-card-20260929.html", import.meta.url), "utf8");
    const runtime = localFixture({
      [url]: savedCard.replace("</style>", `</style><div style="height:${offset}px"></div>`),
      [detail]: "<title>Ginza iwa</title><h1>Ginza iwa detail</h1>",
    }, runtimeKind);
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      const link = input.observation.targets.find(target => target.label === "Ginza iwa");
      assert.ok(link?.availableActions?.includes("OPEN_LINK"));
      return { type: "OPEN_LINK", targetRef: link!.ref, reason: "Open observed public result." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await executor.navigate({ observed: true, source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "covered-link", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Ginza iwa" }, hardCriteria: [] }, objective: "Open a public result",
        completion: snapshot => ({ complete: snapshot.url === detail && snapshot.text.includes("Ginza iwa detail"), reason: "Detail not observed", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(result.snapshot.url, detail);
    } finally { await executor.close(); }
  });
}
