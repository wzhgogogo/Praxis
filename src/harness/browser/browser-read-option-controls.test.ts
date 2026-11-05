import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { url, localFixture } from "./browser-read-test-fixtures.js";

test("button name metadata does not replace visible time or Reserve safety label", async () => {
  const runtime = localFixture(`<button name="action" value="slot-20" type="button">20:00</button><button name="action" value="reserve" type="button">Reserve</button>`);
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    const time = input.observation.targets.find(target => target.label === "20:00");
    const reserve = input.observation.targets.find(target => target.label === "Reserve");
    assert.ok(time?.availableActions?.includes("CLICK"));
    assert.equal(reserve?.availableActions?.includes("CLICK"), false);
    assert.equal(reserve?.rejectionReason, "WRITE_PROHIBITED");
    return { type: "REQUEST_HUMAN_HELP", reason: "Read-only label audit complete" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ observed: true, source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    await executor.runSkill({ taskId: "button-visible-label", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Audit public controls",
      completion: () => ({ complete: false, reason: "No availability" }) });
  } finally { await executor.close(); }
});

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} chooses a visible time option with an opaque native value and reads it back`, async () => {
    const runtime = localFixture(`<title>Public time query</title>
      <label for="arrival">Arrival time</label><select id="arrival" aria-label="Arrival time">
        <option value="">Choose time</option><option value="1763593200000">7:00 PM</option><option value="1763600400000">9:00 PM</option>
      </select><output id="selected">No time selected</output>
      <script>document.querySelector('select').onchange=event=>{document.body.dataset.selections=(document.body.dataset.selections||'')+event.target.value+';';document.querySelector('output').textContent=event.target.selectedOptions[0].textContent;if(event.target.value==='1763593200000'){const other=document.createElement('select');other.setAttribute('aria-label','Unrelated');document.body.prepend(other)}};</script>`, runtimeKind);
    const attempted: string[] = [];
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      const owner = input.observation.targets.find(target => target.kind === "SELECT" && target.label === "Arrival time");
      assert.ok(owner);
      const desired = input.observation.targets.find(target => target.kind === "OPTION" && target.ownerRef === owner.ref && target.label === (attempted.length ? "7:00 PM" : "9:00 PM"));
      assert.ok(desired);
      attempted.push(desired.label);
      return { type: "CHOOSE_OPTION", targetRef: desired.ref, field: "TIME", reason: "Choose the observed arrival time." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ observed: true, source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({
        taskId: "fixture:opaque-time", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-18", partySize: 2, timeWindow: { earliest: "18:30", latest: "19:30" }, hardCriteria: [] },
        objective: "Choose a requested public query time.",
        completion: (snapshot, controls) => ({ complete: /7:00 PM/.test(snapshot.text) && controls.some(control => control.kind === "SELECT" && control.value === "1763593200000"), reason: "The requested time is not selected.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
      });
      assert.equal(result.status, "COMPLETED");
      assert.deepEqual(attempted, ["9:00 PM", "7:00 PM"]);
      assert.equal(result.controls.find(control => control.kind === "SELECT" && control.label === "Arrival time")?.value, "1763593200000");
      // Read page effects independently of the Registry: a final correct value
      // must not conceal an earlier out-of-request selection.
      const actual = await session.snapshot();
      assert.match(actual.html, /data-selections="1763593200000;"/);
      assert.match(actual.html, /<output id="selected">7:00 PM<\/output>/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} binds a button combobox to its own listbox option through the strict browser wire`, async () => {
    const runtime = localFixture(`<button type="button" role="combobox" aria-controls="arrival-list" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('arrival-list').hidden=false">Choose time</button>
      <ul id="arrival-list" role="listbox" hidden><li role="option" onclick="document.querySelector('button').setAttribute('aria-label','7:15 PM');document.querySelector('button').setAttribute('aria-expanded','false');document.getElementById('arrival-list').hidden=true;document.querySelector('output').textContent='Selection settled'">7:15 PM</li></ul><output>Waiting</output>`, runtimeKind);
    let calls = 0;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; label: string; ownerRef?: string; availableActions?: string[] }> } };
      calls += 1;
      if (calls === 1) assert.equal(payload.observation.targets.filter(target => target.label === "Arrival time").length, 1, "button combobox is observed once");
      const target = calls === 1 ? payload.observation.targets.find(item => item.kind === "BUTTON" && item.label === "Arrival time")
        : payload.observation.targets.find(item => item.kind === "OPTION" && item.label === "7:15 PM" && item.ownerRef);
      assert.ok(target);
      assert.ok(target.availableActions?.includes(calls === 1 ? "CLICK" : "CHOOSE_OPTION:TIME"));
      return { invocationId: `fixture:button-combobox:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : "CHOOSE_OPTION", targetRef: target.ref, authoritativeField: calls === 1 ? "NONE" : "TIME", requestedState: "NONE", reason: "Choose the observed query control" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ observed: true, source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "fixture:button-combobox", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
        objective: "Choose the observed arrival time.", completion: snapshot => ({ complete: /Selection settled/.test(snapshot.text), reason: "The choice has not settled.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(calls, 2);
      assert.equal(result.controls.find(control => control.role === "combobox")?.label, "7:15 PM");
    } finally { await executor.close(); }
  });
}

for (const initialTime of ["17:30", "19:00"] as const) {
  test(`empty input reads its own selected display and ${initialTime === "17:30" ? "confirms a changed option" : "avoids a duplicate choice"}`, async () => {
    const runtime = localFixture(`<div data-testid="Value Container" id="other-value"><div class="fixture-singleValue">19:00</div><input role="combobox" aria-label="Other time" aria-readonly="true" aria-expanded="false" value=""></div>
      <div>Nearby time: 19:00</div>
      <div data-testid="Value Container" id="time-value"><div class="fixture-singleValue">${initialTime}</div><div><input id="time-input" role="combobox" aria-label="Time" aria-readonly="true" aria-expanded="false" value="" onkeydown="if(event.key==='ArrowDown'){this.setAttribute('aria-expanded','true');this.setAttribute('aria-controls','time-options');document.getElementById('time-options').hidden=false}"></div></div>
      <div id="time-options" role="listbox" hidden><div role="option" onclick="document.querySelector('#time-value .fixture-singleValue').textContent='19:00';document.body.dataset.selectedTime='19:00';document.getElementById('time-input').setAttribute('aria-expanded','false');document.getElementById('time-input').removeAttribute('aria-controls');document.getElementById('time-options').hidden=true">19:00</div></div>
      <script>document.body.dataset.selectedTime='${initialTime}'</script>`, "LOCAL");
    let calls = 0;
    const seenValues: Array<string | undefined> = [];
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string; value?: string; ownerRef?: string }> } };
      calls += 1;
      const time = payload.observation.targets.find(target => target.role === "combobox" && target.label === "Time");
      seenValues.push(time?.value);
      const option = payload.observation.targets.find(target => target.kind === "OPTION" && target.label === "19:00" && target.ownerRef);
      const action = calls === 1 && time?.value === "19:00" ? "COMPLETE" : calls === 1 ? "CLICK" : option ? "CHOOSE_OPTION" : "REQUEST_HUMAN_HELP";
      return { invocationId: `fixture:proxy-time:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action, targetRef: action === "CLICK" ? time?.ref : action === "CHOOSE_OPTION" ? option?.ref : "", authoritativeField: action === "CHOOSE_OPTION" ? "TIME" : "NONE", requestedState: "NONE", reason: "Use the current bound time value" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ observed: true, source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const initialControls = await session.observeControls!();
      assert.equal(initialControls.find(control => control.role === "combobox" && control.label === "Time")?.value, initialTime);
      const result = await executor.runSkill({ taskId: `fixture:proxy-time:${initialTime}`, source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Confirm the currently selected time.", completion: snapshot => ({ complete: /data-selected-time="19:00"/.test(snapshot.html), reason: "The actual page state has not selected 19:00.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED", JSON.stringify({ seenValues, controls: result.controls.filter(control => control.role === "combobox") }));
      if (initialTime === "17:30") {
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Time")?.value, "19:00", JSON.stringify(result.controls.filter(control => control.role === "combobox")));
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Time")?.controlledListboxId, undefined);
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Other time")?.value, "19:00");
        assert.deepEqual(seenValues, ["17:30", undefined]);
        assert.equal(calls, 2);
      } else {
        assert.equal(calls, 0, "the already selected page needs no redundant model action");
        assert.deepEqual(seenValues, []);
      }
      const settled = await session.snapshot();
      assert.match(settled.html, /data-selected-time="19:00"/);
      assert.match(settled.html, /id="time-input"[^>]*value=""/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} keeps the observed option node when unrelated buttons arrive during model decision`, async () => {
    const runtime = localFixture(`<button id="arrival" type="button" role="combobox" aria-controls="choices" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('choices').hidden=false">Arrival time</button>
      <ul id="choices" role="listbox" hidden>${["17:30", "18:00", "18:30", "19:00"].map(time => `<li role="option" onclick="document.body.dataset.selections=(document.body.dataset.selections||'')+'${time};';document.getElementById('arrival').setAttribute('aria-label','${time}');document.getElementById('arrival').setAttribute('aria-expanded','false');document.getElementById('choices').hidden=true;document.querySelector('output').textContent='Selection settled'">${time}</li>`).join("")}</ul>
      <button id="shift" type="button" onclick="for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.textContent='Late page navigation '+i;document.body.prepend(b)}">Fixture layout change</button>
      <button id="style" type="button" onclick="[...document.querySelectorAll('[role=option]')].find(item=>item.textContent==='19:00').style.color='red'">Fixture style change</button><output>Waiting</output>`, runtimeKind);
    let calls = 0;
    let session!: Awaited<ReturnType<typeof runtime.openSession>>;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string }> } };
      calls += 1;
      if (calls > 2) return { invocationId: `fixture:shifted-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: "REQUEST_HUMAN_HELP", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "The selected time did not match." }) };
      const target = payload.observation.targets.find(item => calls === 1 ? item.role === "combobox" : item.kind === "OPTION" && item.label === "19:00");
      assert.ok(target);
      if (calls === 2) { await session.click("#shift"); await session.click("#style"); }
      return { invocationId: `fixture:shifted-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : "CHOOSE_OPTION", targetRef: target.ref, authoritativeField: calls === 1 ? "NONE" : "TIME", requestedState: "NONE", reason: "Choose the observed 19:00 option" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
    const signal = new AbortController().signal;
    session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ observed: true, source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "fixture:shifted-option", source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Choose the observed 19:00 time.", completion: snapshot => ({ complete: /Selection settled/.test(snapshot.text), reason: "No selected time.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.controls.find(control => control.role === "combobox")?.label, "19:00");
      assert.equal(result.status, "COMPLETED");
      assert.equal(calls, 2);
      assert.match((await session.snapshot()).html, /data-selections="19:00;"/, "the page actually received only the requested selection");
    } finally { await executor.close(); }
  });
}

for (const mutation of ["role-change", "replacement", "legal-replacement"] as const) {
  test(`changed observed option ${mutation} is rejected before execution`, async () => {
    const canRecover = mutation === "legal-replacement";
    const runtime = localFixture(`<button id="arrival" type="button" role="combobox" aria-controls="choices" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('choices').hidden=false">Arrival time</button>
      <ul id="choices" role="listbox" hidden><li role="option" onclick="document.body.dataset.executed='yes';document.getElementById('arrival').setAttribute('aria-label','19:00')">19:00</li></ul>
      <button id="mutate" type="button" onclick="mutateOption()">Change control</button>
      <script>function mutateOption(){const option=document.querySelector('[role=option]');${canRecover ? "option.replaceWith(option.cloneNode(true))" : mutation === "replacement" ? "const next=document.createElement('button');next.type='submit';next.textContent='19:00';next.onclick=()=>document.body.dataset.executed='yes';option.replaceWith(next)" : "option.setAttribute('role','button');option.setAttribute('type','submit')"}}</script>`, "LOCAL");
    let calls = 0;
    const rejections: string[] = [];
    let session!: Awaited<ReturnType<typeof runtime.openSession>>;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string }> } };
      calls += 1;
      const target = payload.observation.targets.find(item => calls === 1 ? item.role === "combobox" : item.kind === "OPTION" && item.label === "19:00");
      if (calls === 2) await session.click("#mutate");
      const chooseOption = calls === 2 || (canRecover && calls === 3);
      return { invocationId: `fixture:stale-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : chooseOption ? "CHOOSE_OPTION" : "REQUEST_HUMAN_HELP", targetRef: calls === 1 || chooseOption ? target?.ref : "", authoritativeField: chooseOption ? "TIME" : "NONE", requestedState: "NONE", reason: "Use only the currently observed option" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision, maxModelCallsPerCandidate: 3,
      onDiagnostic: item => { if (item.event === "REJECTED") rejections.push(item.detail ?? ""); } });
    const signal = new AbortController().signal;
    session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ observed: true, source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: `fixture:stale-option:${mutation}`, source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Choose the observed 19:00 time.", completion: snapshot => ({ complete: snapshot.html.includes('data-executed="yes"'), reason: "No selected time.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, canRecover ? "COMPLETED" : "REQUESTED_HUMAN_HELP");
      assert.equal(calls, 3);
      assert.ok(rejections.some(detail => detail.includes("Observed target changed or detached")), "the old observed node is rejected before a fresh decision");
      if (canRecover) {
        assert.match(result.snapshot.html, /data-executed="yes"/);
        assert.equal(result.controls.find(control => control.role === "combobox")?.label, "19:00");
      } else assert.doesNotMatch(result.snapshot.html, /data-executed="yes"/);
    } finally { await executor.close(); }
  });
}

test("a visible option from another listbox cannot be claimed by the expanded combobox", async () => {
  const runtime = localFixture(`<input role="combobox" aria-readonly="true" aria-controls="expected" aria-expanded="true" aria-label="Arrival time">
    <div id="expected" role="listbox"><div role="option">6:00 PM</div></div>
    <div id="unrelated" role="listbox"><div role="option" onclick="document.body.dataset.foreign='clicked'">7:00 PM</div></div>`);
  const diagnostics: string[] = [];
  let calls = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: item => { if (item.event === "REJECTED") diagnostics.push(item.detail ?? ""); }, modelDecision: {
    async decide(input) {
      if (++calls > 1) return { type: "REQUEST_HUMAN_HELP", reason: "No bound option remains." };
      const foreign = input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM");
      assert.equal(foreign, undefined, "noncurrent list options are excluded from the action inventory");
      return { type: "CHOOSE_OPTION", targetRef: "observation:1:target:999", field: "TIME", reason: "Try an unobserved option." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ observed: true, source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:wrong-owner", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Select a bound public query time.", completion: () => ({ complete: false, reason: "No selection confirmed." }) });
    assert.equal(result.status, "NO_SAFE_ACTION");
    assert.ok(diagnostics.some(detail => detail === "STALE_OR_UNKNOWN_TARGET_REF"));
    assert.doesNotMatch(result.snapshot.html, /data-foreign="clicked"/);
  } finally { await executor.close(); }
});

for (const variant of ["disabled", "unchanged", "complete"] as const) {
  test(`native option ${variant} cannot be signed off as a selected time`, async () => {
    const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose</option><option value="opaque" ${variant === "disabled" ? "disabled" : ""}>7:00 PM</option></select><output>Waiting</output>
      <script>document.querySelector('select').onchange=event=>{ ${variant !== "disabled" ? "event.target.value='';document.querySelector('output').textContent='Inventory ready';" : ""} };</script>`);
    const diagnostics: string[] = [];
    let calls = 0;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: item => { if (item.event === "REJECTED" || item.detail === "OPTION_VALUE_NOT_CONFIRMED") diagnostics.push(item.detail ?? ""); }, modelDecision: {
      async decide(input) {
        if (++calls > 1) return variant === "complete"
          ? { type: "COMPLETE", reason: "The independent result changed." }
          : { type: "REQUEST_HUMAN_HELP", reason: "Selection did not persist." };
        const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM");
        if (variant === "disabled") assert.equal(option, undefined, "disabled native options are excluded from the action inventory");
        else assert.ok(option);
        return { type: "CHOOSE_OPTION", targetRef: option?.ref ?? "observation:1:target:999", field: "TIME", reason: "Try the observed time." };
      },
    } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ observed: true, source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: `fixture:${variant}`, source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
        objective: "Select a public query time.", completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No result yet.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, variant === "complete" || variant === "disabled" ? "NO_SAFE_ACTION" : "REQUESTED_HUMAN_HELP");
      assert.ok(diagnostics.some(detail => variant === "disabled" ? detail === "STALE_OR_UNKNOWN_TARGET_REF" : detail === "OPTION_VALUE_NOT_CONFIRMED"));
      assert.notEqual(result.controls.find(control => control.kind === "SELECT")?.value, "opaque");
    } finally { await executor.close(); }
  });
}

test("an asynchronously applied option can complete after a later selected-value observation", async () => {
  const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose</option><option value="opaque">7:00 PM</option></select><output>Waiting</output>
    <button id="settle" type="button" onclick="document.querySelector('select').value='opaque';document.querySelector('output').textContent='Inventory ready / 7:00 PM';document.body.dataset.settled='yes'">Fixture release</button>
    <script>document.querySelector('select').onchange=event=>{event.target.value='';document.querySelector('output').textContent='Inventory ready';};</script>`);
  let calls = 0;
  let session!: Awaited<ReturnType<typeof runtime.openSession>>;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxModelCallsPerCandidate: 2, modelDecision: { async decide(input) {
    if (++calls > 1) {
      assert.equal(input.observation.targets.find(target => target.kind === "SELECT")?.options?.find(option => option.selected)?.value, "", "inventory readiness does not confirm the selected time");
      // Release only after the pending state was observed; no wall-clock race.
      await session.click("#settle");
      return { type: "WAIT", reason: "Wait for the selected value." };
    }
    return { type: "CHOOSE_OPTION", targetRef: input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM")!.ref, field: "TIME", reason: "Choose the observed time." };
  } } });
  const signal = new AbortController().signal;
  session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ observed: true, source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:async-option", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Observe the requested time after it settles.",
      completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No inventory result yet.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.ok((await session.snapshot()).html.includes('data-settled="yes"'), "completion requires actual selected-value settlement");
    assert.equal(result.status, "COMPLETED");
    assert.equal(calls, 2);
    assert.equal(result.controls.find(control => control.kind === "SELECT")?.value, "opaque");
  } finally { await executor.close(); }
});

test("an unconfirmed time choice cannot be replaced by a successful party choice", async () => {
  const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose time</option><option value="time-opaque">7:00 PM</option></select>
    <select aria-label="Party size"><option value="2">2</option><option value="4">4 guests</option></select><output>Waiting</output>
    <script>document.querySelectorAll('select')[0].onchange=event=>{event.target.value='';document.querySelector('output').textContent='Inventory ready';};</script>`);
  let calls = 0;
  const diagnostics: string[] = [];
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: item => { if (item.event === "REJECTED") diagnostics.push(item.detail ?? ""); }, modelDecision: { async decide(input) {
    calls += 1;
    if (calls === 3) return { type: "COMPLETE", reason: "The result text changed." };
    const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === (calls === 1 ? "7:00 PM" : "4 guests"));
    assert.ok(option);
    return { type: "CHOOSE_OPTION", targetRef: option.ref, field: calls === 1 ? "TIME" : "PARTY_SIZE", reason: "Choose an observed request option." };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ observed: true, source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:cross-option", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, partySize: 4, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Confirm both requested values.", completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No result yet.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.equal(result.status, "NO_SAFE_ACTION");
    assert.ok(diagnostics.some(detail => detail.includes("previous option is still unconfirmed")));
    assert.equal(result.controls.find(control => control.label === "Party size")?.value, "2");
  } finally { await executor.close(); }
});

/** Real Chromium, wholly intercepted local HTML; all other network requests are aborted. */
