import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { PlaywrightControlRegistry } from "../../infrastructure/browser/playwright-browser-controls.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { url, localFixture } from "./browser-read-test-fixtures.js";

for (const initialParty of [1, 2]) test(`Matsumoto selected-party ${initialParty} escapes the guest Next loop through production observation`, async () => {
  const venue = "https://tabelog.com/en/tokyo/A1303/A130301/13261619/";
  const runtime = localFixture({ [venue]: `<title>Matsumoto calendar fixture</title>
    <style>.calendar-icon{display:none}.calendar-navi a{display:inline-block;padding:12px}</style>
    <div class="calendar-widget"><div class="calendar-wrap"><div class="calendar-navi">
      <a href="#" onclick="event.preventDefault();setMonth()"><i class="calendar-icon">Next month</i></a></div>
      <table><caption>Oct 2026</caption><tbody><tr><td><button type="button" data-year="2026" data-month="10" data-day="21" onclick="selectDate()">21</button></td></tr></tbody></table></div>
      <div class="guest-select"><span class="select-title">Guests</span><button type="button" aria-label="Previous">Previous</button><button type="button" value="1" class="${initialParty === 1 ? 'is-active' : ''}">1</button><button type="button" value="2" class="${initialParty === 2 ? 'is-active' : ''}" onclick="document.querySelectorAll('.guest-select button').forEach(b=>b.classList.remove('is-active'));this.classList.add('is-active');document.querySelector('tbody').insertAdjacentHTML('beforeend','<tr><td>Updated other content</td></tr>')">2</button>
      <button type="button" aria-label="Next" onclick="guestPages++;document.querySelector('#guest-page').textContent=guestPages">Next</button><output id="guest-page">0</output></div>
      <div class="time-select"><span class="select-title">Time</span><button type="button">7:00 PM</button><button type="button" aria-label="Next">Next</button></div></div>
    <output id="selected">No date selected</output><script>let guestPages=0;
    function setMonth(){document.querySelector('caption').textContent='Nov 2026';const day=document.querySelector('td button');day.textContent='3';day.dataset.month='11';day.dataset.day='3'}
    function selectDate(){document.querySelector('#selected').textContent='Selected 2026-11-03'}</script>` });
  const choices: string[] = [];
  const observed: unknown[] = [];
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 120_000, maxModelCallsPerCandidate: 6,
    maxModelCallsTotal: 6, maxOperationsPerCandidate: 60, modelDecision: { async decide(input) {
      observed.push({ month: input.observation.displayedCalendarMonth, controls: input.observation.targets.filter(t => /Next|month/.test(t.label)), progress: input.progress, history: input.history });
      const partyConfirmed = input.observation.controlGroups?.some(group => group.label === "Guests" && group.selectedValues.length === 1 && group.selectedValues[0] === "2");
      if (!partyConfirmed) {
        const party = input.observation.targets.find(t => t.value === "2" && t.availableActions?.includes("CLICK_AUTHORITATIVE:PARTY_SIZE"));
        if (party) { choices.push("PARTY"); return { type: "CLICK_AUTHORITATIVE", targetRef: party.ref, field: "PARTY_SIZE", reason: "Confirm requested guest count." }; }
        const wrongNext = input.observation.targets.find(t => t.label === "Next" && t.controlGroupLabel === "Guests")!;
        choices.push("GUEST_NEXT"); return { type: "CLICK", targetRef: wrongNext.ref, reason: "Try another guest control after an unconfirmed choice." };
      }
      const selectedParty = input.observation.targets.find(t => t.value === "2" && t.controlGroupLabel === "Guests");
      assert.equal(selectedParty?.selected, true, "keep the selected button as observation evidence");
      assert.deepEqual(selectedParty.availableActions, [], "confirmed party cannot be clicked again");
      const next = input.observation.targets.find(t => t.label === "Next month" && t.controlGroupLabel === "Calendar");
      const date = input.observation.targets.find(t => t.calendarDate === "2026-11-03");
      if (date) { choices.push("DATE"); return { type: "CLICK_AUTHORITATIVE", targetRef: date.ref, field: "DATE", reason: "Select the requested date." }; }
      if (next) {
        assert.deepEqual(input.observation.displayedCalendarMonth, { year: 2026, month: 10, caption: "Oct 2026", source: "DOM caption" });
        assert.ok(input.observation.targets.some(t => t.label === "Next" && t.controlGroupLabel === "Guests"));
        assert.ok(input.observation.targets.some(t => t.label === "Next" && t.controlGroupLabel === "Time"));
        choices.push("MONTH"); return { type: "CLICK", targetRef: next.ref, reason: "Advance the observed calendar." };
      }
      // Reproduces the original baseline's choice when the icon is unlabelled.
      const wrongNext = input.observation.targets.find(t => t.label === "Next")!;
      choices.push("GUEST_NEXT"); return { type: "CLICK", targetRef: wrongNext.ref, reason: "Attempt to advance November." };
    } } });
  const signal = new AbortController().signal;
  try {
    const session = await executor.acquire(signal, "TABELOG", "AVAILABILITY");
    await executor.navigate({ session, source: "TABELOG", stage: "AVAILABILITY", signal, allowedOrigins: [new URL(venue).origin], url: venue });
    const result = await executor.runSkill({ taskId: "matsumoto-month-fixture", session, source: "TABELOG", stage: "AVAILABILITY", signal,
      allowedOrigins: [new URL(venue).origin], goal: { outlet: { name: "Matsumoto" }, date: "2026-11-03", partySize: 2, hardCriteria: [] },
      objective: "Reach the requested November date", methodReason: "Calendar initially shows October",
      completion: snapshot => snapshot.text.includes("Selected 2026-11-03") ? { complete: true, reason: "Requested date selected", resultKey: "2026-11-03", resultBusy: false } : { complete: false, reason: "Requested date not yet selected" } });
    assert.equal(result.status, "COMPLETED", JSON.stringify({ status: result.status, choices, observed }));
    assert.deepEqual(choices, initialParty === 1 ? ["PARTY", "MONTH", "DATE"] : ["MONTH", "DATE"]);
    assert.match(result.snapshot!.text, /Nov 2026/);
    assert.match(result.snapshot!.html, /id="guest-page">0</);
  } finally { await executor.close(); }
});

test("generic selected state comes from ARIA and exact state classes, with independent same-label groups", async () => {
  const runtime = localFixture(`<fieldset><legend>States</legend>
    ${["active", "selected", "current", "checked", "is-active", "is-selected", "is-current", "is-checked"].map((name, i) => `<button type="button" class="${name}" value="${i}">${name}</button>`).join("")}
    <button type="button" aria-pressed="true">Pressed</button><button type="button" aria-selected="true">Selected</button>
    <button type="button" aria-checked="true">Checked</button><a href="#" aria-current="page">Current</a>
    <button type="button" class="inactive not-selected current-price" aria-current="false" aria-checked="mixed">Unknown</button></fieldset>
    <fieldset><legend>Guests</legend><button type="button" value="2" class="active">2</button></fieldset>
    <fieldset><legend>Guests</legend><button type="button" value="4" class="selected">4</button></fieldset>
    <div><button type="button" class="is-active">Unowned</button></div>`);
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 120_000, maxModelCallsPerCandidate: 1,
    maxModelCallsTotal: 1, maxOperationsPerCandidate: 20, modelDecision: { async decide(input) {
      const states = input.observation.targets.filter(t => t.controlGroupLabel === "States");
      assert.equal(states.filter(t => t.selected).length, 12);
      assert.equal(states.find(t => t.label === "Unknown")?.selected, undefined);
      const guests = input.observation.controlGroups!.filter(group => group.label === "Guests");
      assert.equal(guests.length, 2, "same label must not merge distinct DOM owners");
      assert.notEqual(guests[0]!.ref, guests[1]!.ref);
      assert.deepEqual(guests.map(group => group.selectedValues), [["2"], ["4"]]);
      const unowned = input.observation.targets.find(t => t.label === "Unowned")!;
      assert.equal(unowned.selected, true);
      assert.equal(unowned.controlGroupLabel, "Unlabelled group");
      assert.equal(unowned.controlGroupRef, undefined);
      return { type: "REQUEST_HUMAN_HELP", reason: "Observation assertions complete." };
    } } });
  const signal = new AbortController().signal;
  try {
    const session = await executor.acquire(signal, "FIXTURE", "FACTS");
    await executor.navigate({ session, source: "FIXTURE", stage: "FACTS", signal, allowedOrigins: [new URL(url).origin], url });
    const result = await executor.runSkill({ taskId: "generic-selected-fixture", source: "FIXTURE", stage: "FACTS", session, signal,
      allowedOrigins: [new URL(url).origin], goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Read public selection state",
      completion: () => ({ complete: false, reason: "Read selected states" }) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
  } finally { await executor.close(); }
});

test("party click does not confirm from unrelated page changes or an unchanged group value", async () => {
  const runtime = localFixture(`<fieldset><legend>Guests</legend><button type="button" value="1" class="is-active">1</button>
    <button type="button" value="2" onclick="document.querySelector('#noise').textContent='Unrelated update'">2</button></fieldset><output id="noise">Initial</output>`);
  let decisions = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 120_000, maxModelCallsPerCandidate: 3,
    maxModelCallsTotal: 3, maxOperationsPerCandidate: 36, modelDecision: { async decide(input) {
      if (++decisions === 1) return { type: "CLICK_AUTHORITATIVE", field: "PARTY_SIZE", targetRef: input.observation.targets.find(t => t.value === "2")!.ref, reason: "Set two guests." };
      assert.match(input.progress, /PARTY_SIZE_NOT_CONFIRMED/);
      assert.equal(input.history.at(-1)?.outcome, "NO_CHANGE");
      assert.equal(input.history.at(-1)?.reason, "PARTY_SIZE_NOT_CONFIRMED");
      assert.deepEqual(input.observation.controlGroups!.find(group => group.label === "Guests")?.selectedValues, ["1"]);
      return { type: "REQUEST_HUMAN_HELP", reason: "The source still shows one guest." };
    } } });
  const signal = new AbortController().signal;
  try {
    const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
    await executor.navigate({ session, source: "FIXTURE", stage: "AVAILABILITY", signal, allowedOrigins: [new URL(url).origin], url });
    const result = await executor.runSkill({ taskId: "party-unconfirmed-fixture", session, source: "FIXTURE", stage: "AVAILABILITY", signal,
      allowedOrigins: [new URL(url).origin], goal: { outlet: { name: "Fixture" }, partySize: 2, hardCriteria: [] }, objective: "Confirm two guests",
      completion: snapshot => snapshot.text.includes("Unrelated update") ? { complete: true, reason: "Unrelated UI changed", resultKey: "noise", resultBusy: false } : { complete: false, reason: "Two guests not selected" } });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP", "source completion cannot bypass party postcondition");
    assert.equal(decisions, 2);
  } finally { await executor.close(); }
});

test("Chromium labels public icon alternatives and leaves ambiguous calendar ownership unlabelled", async () => {
  const browser = await chromium.launch({ headless: true });
  const registry = new PlaywrightControlRegistry();
  try {
    const page = await browser.newPage();
    await page.route("**/*", route => route.abort());
    await page.setContent(`<style>a{display:inline-block;padding:10px}</style>
      <fieldset><legend>Public navigation</legend>
      <a href="#" aria-label="ARIA alternative"></a><a href="#" title="Title alternative"></a>
      <a href="#"><img alt="Image alternative" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"></a>
      <a href="#"><svg width="16" height="16"><title>Icon alternative</title></svg></a></fieldset>
      <div><a href="#" aria-label="Next month"></a><table><caption>Oct 2026</caption><tr><td>21</td></tr></table>
      <table><caption>Nov 2026</caption><tr><td>3</td></tr></table></div>`);
    const controls = await registry.observe(page);
    for (const label of ["ARIA alternative", "Title alternative", "Image alternative", "Icon alternative"]) {
      const control = controls.find(c => c.label === label);
      assert.ok(control, label);
      assert.equal(control.controlGroupLabel, "Public navigation");
    }
    const ambiguous = controls.find(c => c.label === "Next month")!;
    assert.equal(ambiguous.controlGroupLabel, "Unlabelled group");
    assert.equal(ambiguous.calendarMonth, undefined);
  } finally { await registry.dispose(); await browser.close(); }
});

test("calendar month postcondition ignores unrelated page changes and feeds NO_CHANGE back", async () => {
  const runtime = localFixture(`<div><a href="#" aria-label="Next month" onclick="event.preventDefault();document.querySelector('#noise').textContent='Unrelated update'">Next month</a>
    <table><caption>Oct 2026</caption><tbody><tr><td>21</td></tr></tbody></table></div><output id="noise">Initial text</output>`);
  let decisions = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 120_000, maxModelCallsPerCandidate: 3,
    maxModelCallsTotal: 3, maxOperationsPerCandidate: 36, modelDecision: { async decide(input) {
      if (++decisions === 1) return { type: "CLICK", targetRef: input.observation.targets.find(t => t.label === "Next month")!.ref, reason: "Advance month." };
      assert.match(input.progress, /CALENDAR_MONTH_UNCHANGED/);
      assert.equal(input.history.at(-1)?.outcome, "NO_CHANGE");
      assert.equal(input.history.at(-1)?.reason, "CALENDAR_MONTH_UNCHANGED");
      assert.equal(input.observation.displayedCalendarMonth?.month, 10);
      return { type: "REQUEST_HUMAN_HELP", reason: "The source calendar did not change." };
    } } });
  const signal = new AbortController().signal;
  try {
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    await executor.navigate({ session, source: "TABLECHECK", stage: "AVAILABILITY", signal, allowedOrigins: [new URL(url).origin], url });
    const result = await executor.runSkill({ taskId: "month-unchanged-fixture", session, source: "TABLECHECK", stage: "AVAILABILITY", signal,
      allowedOrigins: [new URL(url).origin], goal: { outlet: { name: "Fixture" }, date: "2026-11-03", hardCriteria: [] },
      objective: "Reach November", methodReason: "Reach requested month", completion: () => ({ complete: false, reason: "November not reached" }) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
    assert.equal(decisions, 2);
  } finally { await executor.close(); }
});

test("Chromium control observation discards only a handle confirmed disconnected between reads", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<button id="transient">Transient</button><button id="attached">Attached</button><button id="disabled" disabled>Disabled</button>');
    const registry = new PlaywrightControlRegistry();
    let removed = false;
    const observedPage = {
      locator(selector: string) {
        const locator = page.locator(selector);
        if (!selector.startsWith("button,")) return locator;
        return {
          elementHandles: async () => (await locator.elementHandles()).map((handle, index) => {
            if (index !== 0) return handle;
            const evaluate = handle.evaluate.bind(handle) as (...args: any[]) => Promise<unknown>;
            return new Proxy(handle, {
              get(target, property, receiver) {
                if (property === "evaluate") return async (...args: any[]) => {
                  const result = await evaluate(...args);
                  if (!removed) {
                    removed = true;
                    await page.locator("#transient").evaluate(element => element.remove());
                  }
                  return result;
                };
                const value = Reflect.get(target, property, receiver);
                return typeof value === "function" ? value.bind(target) : value;
              },
            });
          }),
        };
      },
      url: () => page.url(),
      evaluate: page.evaluate.bind(page),
    } as Parameters<PlaywrightControlRegistry["observe"]>[0];
    const controls = await registry.observe(observedPage);
    assert.equal(removed, true);
    assert.deepEqual(controls.map(control => [control.label, control.disabled]), [["Attached", false], ["Disabled", true]]);
  } finally { await browser.close(); }
});

test("Chromium control observation preserves an attached control-read failure", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<button id="attached">Attached</button>');
    const registry = new PlaywrightControlRegistry();
    const observedPage = {
      locator(selector: string) {
        const locator = page.locator(selector);
        if (!selector.startsWith("button,")) return locator;
        return {
          elementHandles: async () => (await locator.elementHandles()).map(handle => new Proxy(handle, {
            get(target, property, receiver) {
              if (property === "isVisible") return async () => { throw new Error("CONTROL_READ_FAILURE"); };
              const value = Reflect.get(target, property, receiver);
              return typeof value === "function" ? value.bind(target) : value;
            },
          })),
        };
      },
      url: () => page.url(),
      evaluate: page.evaluate.bind(page),
    } as Parameters<PlaywrightControlRegistry["observe"]>[0];
    await assert.rejects(registry.observe(observedPage), /CONTROL_READ_FAILURE/);
  } finally { await browser.close(); }
});

test("Chromium control signatures ignore presentation-only classes but reject value and owner changes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<form id="first"><label><input id="choice" type="radio" name="category" value="sushi"> Sushi</label></form><form id="second"></form><button id="attribute-value" value="public-query">Open public query</button>`);
    const registry = new PlaywrightControlRegistry();
    try {
      const initial = await registry.observe(page);
      const first = initial.find(control => control.kind === "RADIO");
      assert.ok(first);
      assert.equal(initial.find(control => control.label === "Open public query")?.value, "public-query", "a non-native public value attribute remains observable");
      await page.locator("#choice").evaluate(element => {
        element.classList.add("hovered-by-page");
        (element as HTMLInputElement).form?.classList.add("transitioning-layout");
      });
      assert.ok(await registry.target(first.id), "presentational control and form class changes leave the observed semantic target actionable");

      await page.locator("#choice").evaluate(element => { (element as HTMLInputElement).value = "bar"; });
      await assert.rejects(registry.target(first.id), /Observed target changed/, "a changed public radio value invalidates its earlier target");

      const second = (await registry.observe(page)).find(control => control.kind === "RADIO");
      assert.ok(second);
      await page.locator("#choice").evaluate(element => element.setAttribute("form", "second"));
      await assert.rejects(registry.target(second.id), /Observed target changed/, "a changed native form owner invalidates its earlier target");
    } finally { await registry.dispose(); }
  } finally { await browser.close(); }
});

test("Chromium projects an owned default-method submit as GET without classifying bare or POST submits as public GET", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<form id="public-search"><button id="default-get" type="submit">Search</button><button id="override-post" type="submit" formmethod="post">Post search</button></form><button id="bare" type="submit">Bare submit</button>`);
    const registry = new PlaywrightControlRegistry();
    try {
      const controls = await registry.observe(page);
      assert.equal(controls.find(control => control.label === "Search")?.formMethod, "GET");
      assert.equal(controls.find(control => control.label === "Post search")?.formMethod, "POST");
      assert.equal(controls.find(control => control.label === "Bare submit")?.formMethod, undefined);
      assert.equal(controls.find(control => control.label === "Bare submit")?.value, undefined, "a non-value button does not acquire a synthetic empty value");
    } finally { await registry.dispose(); }
  } finally { await browser.close(); }
});


test("C2a recorded unavailable calendar dates are observed and cannot drift to other days", async () => {
  const {tabelogQueryControlHints}=await import("../../integrations/tabelog/tabelog-query-controls.js");
  for(const [name,date,sourceUrl] of [["yuu","2026-10-24","https://tabelog.com/en/tokyo/A1301/A130101/13291436/"],["labo","2026-10-22","https://tabelog.com/en/tokyo/A1303/A130301/13284556/"]]){
    const html=await readFile(new URL(`./fixtures/calendar-${name}-20261010.html`,import.meta.url),'utf8');
    let calls=0;
    const executor=new BrowserTaskExecutor(localFixture({[sourceUrl!]:html}),{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(value){calls++;
      const requested=value.observation.targets.find(t=>t.value===date);
      assert.ok(requested,"the recorded unavailable day must be an observed target");
      assert.equal(requested.rejectionReason,"DATE_NOT_SELECTABLE");assert.deepEqual(requested.availableActions,[]);
      const other=value.observation.targets.find(t=>/^Date 2026-10-/.test(t.label)&&t.value!==date&&!t.disabled);
      assert.ok(other);assert.ok(!other.availableActions?.includes("CLICK"),"another date cannot be a generic click");
      return {type:"CLICK",targetRef:other.ref,reason:"Counterexample tries another day"};
    }}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','AVAILABILITY');
    try{
      await executor.navigate({session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://tabelog.com'],url:sourceUrl!});
      const read=await executor.runSkill({taskId:'calendar',session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://tabelog.com'],goal:{outlet:{name:'Recorded outlet'},date:date!,partySize:2,hardCriteria:[]},objective:'Read exact requested date',controlHints:tabelogQueryControlHints,completion:()=>({complete:false,reason:'Requested date cannot be selected'})});
      assert.equal(read.status,'NO_SAFE_ACTION');assert.equal(read.reasonCode,'DATE_NOT_SELECTABLE');assert.ok(calls>=1&&calls<=2);
    }finally{await executor.close();}
  }
});

test("C2a selectable requested date retains authoritative click and blocks an ordinary other-date click", async () => {
  const html='<table><caption>October 2026</caption><tr><td><button onclick="this.textContent=\'Selected\'">24</button></td><td><button>25</button></td></tr></table>';
  const executor=new BrowserTaskExecutor(localFixture(html),{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(value){
    const requested=value.observation.targets.find(t=>t.value==='2026-10-24')!;
    assert.ok(requested.availableActions?.includes('CLICK_AUTHORITATIVE:DATE'));
    const other=value.observation.targets.find(t=>t.value==='2026-10-25')!;assert.deepEqual(other.availableActions,[]);
    return {type:'CLICK_AUTHORITATIVE',field:'DATE',targetRef:requested.ref,reason:'Select current requested date'};
  }}});
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','AVAILABILITY');
  try{await executor.navigate({session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://www.tablecheck.com'],url});
    const read=await executor.runSkill({taskId:'selectable',session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://www.tablecheck.com'],goal:{outlet:{name:'Fixture'},date:'2026-10-24',hardCriteria:[]},objective:'Select date',completion:s=>({complete:s.text.includes('Selected'),reason:'Date not selected', resultKey: JSON.stringify([s.url, s.text, s.interactiveState]), resultBusy: false })});assert.equal(read.status,'COMPLETED');
  }finally{await executor.close();}
});
