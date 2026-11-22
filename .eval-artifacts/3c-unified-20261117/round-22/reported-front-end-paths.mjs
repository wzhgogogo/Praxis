import assert from "node:assert/strict";
import { startWorkspaceFixture } from "../../../src/harness/workspace-fixture-server.ts";
import { responseOf, stateOf, until, walk } from "./walkthrough-tools.mjs";

const currentCard = ui => ui.page.locator("#candidate-card").getAttribute("data-candidate-id");

async function waitSecondCheck(host, id, ui) {
  await ui.visible("#candidate-card");
  await until(() => host.providerCalls.length === 2 && !host.providerCalls[1].completed,
    "first card exists and the second availability request is in flight");
  const view = await stateOf(host,id);
  assert.equal(view.restaurant.progress.active,true);
  const first = await currentCard(ui);
  assert.ok(view.restaurant.readyCandidateIds.includes(first));
  return first;
}

const settled = (host,id) => until(async()=>{
  const v=await stateOf(host,id);
  return !v.restaurant.progress.active && ["PRESENT_RESULTS","NO_VERIFIED_RESULT","FAILED"].includes(v.case.phase) ? v : null;
}, "read settles");

function savedShortBatch(width, count) {
  const options={staged:true,sourceValidityMs:60_000};
  return {
    name:"save-first-card-before-budget-close-"+count,
    width,
    start:()=>startWorkspaceFixture(options),
    scenario:async ({main,host})=>{
      const id=await main.create("Dinner for two in Ginza",0);
      const first=await waitSecondCheck(host,id,main);
      const saved=await responseOf(main.page,"POST","/shortlist",()=>main.click("#bookmark"));
      assert.equal(saved.status(),200);
      const savedView=(await saved.json()).view;
      assert.deepEqual(savedView.restaurant.shortlistCandidateIds,[first]);
      assert.equal(savedView.restaurant.progress.active,true);
      await main.image("saved-during-search");
      if(count===1) options.outcome="empty";
      // Exhaust only the fixture's real coordinator budget, after the bookmark write.
      host.application.agentLoop.remainingModelCalls=()=>0;
      host.release();
      const after=await settled(host,id);
      assert.equal(after.case.phase,"PRESENT_RESULTS");
      assert.equal(after.restaurant.presentedCandidateIds.length,count);
      assert.equal(after.restaurant.presentedCandidateIds[0],first);
      assert.deepEqual(after.restaurant.shortlistCandidateIds,[first]);
      await main.page.getByText("1 of "+count,{exact:true}).waitFor();
      assert.equal(await currentCard(main),first);
      await main.click("#saved");
      await main.visible("#saved-panel");
      const row=main.page.locator('#saved-list [data-candidate-id="'+first+'"]');
      assert.equal(await row.isEnabled(),true);
      await main.click(row);
      await main.visible("#candidate-card");
      assert.equal(await currentCard(main),first);
      await main.image("back-from-saved-to-delivered-card");
      const events=(await host.application.runtime.listEvents(id)).map(e=>e.event.type);
      assert.ok(events.indexOf("SHORTLIST_UPDATED") < events.lastIndexOf("RESULTS_PRESENTED"));
      return {savedStatus:200,actualDelivery:after.restaurant.presentedCandidateIds,
        sameRestaurant:await currentCard(main),finalPhase:after.case.phase,sourceCalls:host.providerCalls.length,
        savedBeforeDelivery:true,retainedAfterSavedBack:true,verdict:"pass"};
    },
  };
}

function aboutDuringRead(width) {
  return {
    name:"about-does-not-bounce-during-real-read",
    width,
    start:()=>startWorkspaceFixture({staged:true}),
    scenario:async ({main,host})=>{
      const id=await main.create("Dinner for two in Ginza",0);
      const first=await waitSecondCheck(host,id,main);
      const title=await main.page.locator("#restaurant-name").innerText();
      await main.click("#details-button");
      await main.visible("#details");
      const draft="Could we sit somewhere quieter?";
      await main.field.fill(draft);
      assert.equal(await main.page.locator("#details-name").innerText(),title);
      assert.equal(await main.page.locator("#refresh").isDisabled(),true);
      await main.image("about-with-second-source-held");
      host.release();
      const ready=await settled(host,id);
      assert.equal(ready.case.phase,"PRESENT_RESULTS");
      assert.ok(ready.restaurant.presentedCandidateIds.includes(first));
      await main.page.waitForFunction(() => document.querySelector(".case-link.active small")?.textContent === "Ready");
      assert.equal(await main.page.locator("#details").isVisible(),true);
      assert.equal(await main.page.locator("#details-name").innerText(),title);
      assert.equal(await main.field.inputValue(),draft);
      await main.image("about-after-real-sse-completion");
      await main.click("#details-back");
      await main.visible("#candidate-card");
      assert.equal(await currentCard(main),first);
      assert.equal(await main.field.inputValue(),draft);
      return {enteredAboutWhileActive:true,aboutAfterDelivery:true,restaurant:first,draftRetained:true,backRestoredCard:true,verdict:"pass"};
    },
  };
}

function sidebarByActualActivity(width) {
  return {
    name:"sidebar-reorders-by-actual-plan-activity",
    width,
    start:()=>startWorkspaceFixture(),
    scenario:async ({main,host})=>{
      const ids=()=>main.page.locator("#case-list .case-link").evaluateAll(rows=>rows.map(r=>r.dataset.caseId));
      const a=await main.create("Dinner for two in Ginza");
      host.clock.advance(1000);
      await main.click("#new-case");
      const b=await main.create("Dinner for two in Shinjuku");
      assert.deepEqual(await ids(),[b,a]);
      await main.select(a);
      await main.ready();
      assert.deepEqual(await ids(),[b,a]);
      const row=await main.page.locator(".case-link.active").elementHandle();
      const before=await stateOf(host,a);
      host.clock.advance(1000);
      const edit=await main.send("Make it three people");
      assert.equal(edit.status(),200);
      const newest=await settled(host,a);
      assert.equal(newest.restaurant.intentDraft.partySize,3);
      assert.ok(Date.parse(newest.case.updatedAt)>Date.parse(before.case.updatedAt));
      await main.page.waitForFunction(id=>document.querySelector("#case-list .case-link")?.dataset.caseId===id,a);
      assert.deepEqual(await ids(),[a,b]);
      assert.equal(await row.evaluate(node=>node===document.querySelector(".case-link.active")),true);
      if(width===390)await main.click("#menu");
      await main.image("edited-older-plan-now-first");
      return {afterTwoCreates:[b,a],afterOnlyOpeningA:[b,a],afterEditingA:await ids(),sameActiveRow:true,
        before:before.case.updatedAt,after:newest.case.updatedAt,verdict:"pass"};
    },
  };
}

await walk("reported-front-end-paths",[390,1440].flatMap(width=>[
  savedShortBatch(width,1),savedShortBatch(width,2),aboutDuringRead(width),sidebarByActualActivity(width),
]));

