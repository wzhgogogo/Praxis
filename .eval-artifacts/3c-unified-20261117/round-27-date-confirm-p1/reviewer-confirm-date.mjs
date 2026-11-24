import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {startWorkspaceFixture} from '/private/tmp/praxis-3c-unified/src/harness/workspace-fixture-server.ts';
import {compileRestaurantSemanticProposal} from '/private/tmp/praxis-3c-unified/src/domains/restaurant/semantic-compiler.ts';
const referenceTime = "2026-11-24T10:00:00+09:00";
const user = "workspace-user";
const oldDate = "2026-11-28";
const baseMessage = "Find a table for two in Tokyo on 2026-11-28 at 18:00";
const base = [
  {field: "TARGET", operation: "ASSERT", value: {kind:"TARGET", goal:"AVAILABILITY", query:"dinner in Tokyo", selectionScope:"OPEN_ENDED", goalBasis:{type:"BOOKING_WORDING",reason:"User requested a table",quotes:["Find a table"]}}},
  {field: "DATE", operation:"ASSERT", value:{kind:"DATE",value:oldDate,raw:oldDate}},
  {field: "TIME_WINDOW", operation:"ASSERT", value:{kind:"TIME_WINDOW",earliest:"18:00",latest:"18:00",raw:"18:00"}},
  {field: "PARTY_SIZE", operation:"ASSERT", value:{kind:"PARTY_SIZE",value:2}},
  {field: "AREA", operation:"ASSERT", value:{kind:"AREA",query:"Tokyo"}},
];
const note = (value) => ({field:"DATE",operation:"CORRECT",value:{kind:"DATE",...value}});
const clock = (raw,value) => ({field:"TIME_WINDOW",operation:"CORRECT",value:{kind:"TIME_WINDOW",earliest:value,latest:value,raw}});
const confirm = {field:"DATE",operation:"CONFIRM"};
const tomorrow = note({relativeDay:"TOMORROW",raw:"明天"});
const friday = note({weekday:"FRIDAY",raw:"周五"});
const afterTomorrow = note({relativeOffsetDays:2,raw:"后天"});
const seven = clock("晚上7点","19:00");
const eight = clock("8点","20:00");
const recommend = (message) => [
  {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"RECOMMENDATION",query:"sukiyaki in Shibuya",selectionScope:"OPEN_ENDED",goalBasis:{type:"JUDGMENT",reason:"User requests restaurant recommendations",quotes:[message]}}},
  {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Shibuya"}},
];
const rows = [
  {name:"confirm no date change control",message:"日期不变，只改晚上7点",facts:[confirm,seven],expected:oldDate,time:"19:00"},
  {name:"explicit date correction control",message:"改成后天晚上7点",facts:[afterTomorrow,seven],expected:"2026-11-26",time:"19:00"},
  {name:"wrong model CONFIRM on explicit date edit",message:"改成后天晚上7点",facts:[confirm,seven],expected:"clarify",time:"19:00"},
  {name:"one明天 control",message:"我们明天晚上7点去吃寿喜锅",facts:[tomorrow,seven],expected:"2026-11-25",time:"19:00"},
  {name:"first明天 rejected, second chosen",message:"不要明天中午，我们明天晚上7点去吃寿喜锅",facts:[tomorrow,seven],expected:"2026-11-25",time:"19:00"},
  {name:"weekday in its own sentence control",message:"我明天或后天到东京。晚餐就订周五晚上7点",facts:[friday,seven],expected:"2026-11-27",time:"19:00"},
  {name:"weekday with unrelated arrival alternatives",message:"我明天或后天到东京，但晚餐就订周五晚上7点",facts:[friday,seven],expected:"2026-11-27",time:"19:00"},
  {name:"recommendation control",message:"推荐几家涩谷寿喜锅",fresh:true,expected:"search"},
  {name:"recommendation with approximate arrival",message:"大概3天后到东京，推荐几家涩谷寿喜锅",fresh:true,expected:"search"},
  {name:"only change the time control",message:"只把时间改成8点",facts:[eight],expected:oldDate,time:"20:00"},
  {name:"only change time with departure range",message:"我还有2-3天后才飞，只把时间改成8点",facts:[eight],expected:oldDate,time:"20:00"},
  {name:"omitted DATE with noun before correction",message:"其余条件不变，日期改成后天晚上7点",facts:[seven],expected:"2026-11-26",time:"19:00"},
];
const selected=process.argv.includes("--confirm-only")?rows.slice(0,3):rows;
for (const row of selected) {
  const facts = row.facts ?? recommend(row.message);
  const proposal = {schemaVersion:"4",facts};
  const compile = compileRestaurantSemanticProposal(proposal,{referenceTime,timezone:"Asia/Tokyo",message:row.message});
  const host = await startWorkspaceFixture({semanticProposal(message) {
    if (message===baseMessage) return {schemaVersion:"4",facts:structuredClone(base)};
    assert.equal(message,row.message);
    return structuredClone(proposal);
  }});
  try {
    host.clock.advance(Date.parse(referenceTime) - host.clock.now().valueOf());
    await host.application.store.upsertUser({id:user,displayName:"Offline review"},host.clock.now().toISOString());
    const settled = async (caseId) => {
      const until=Date.now()+10000;
      while (Date.now()<until) {
        const view=await host.application.getCase(user,caseId);
        if (!view.restaurant.progress.active) return view;
        await delay(10);
      }
      throw Error("Fixture read did not settle");
    };
    let caseId, callStart=0, searchStart=0;
    if (row.fresh) {
      const {case: created}=await host.application.createCase(user,row.message,"review-recommend");
      caseId=created.caseId;
    } else {
      const {case: created}=await host.application.createCase(user,baseMessage,"review-initial");
      caseId=created.caseId;
      const prior = await settled(caseId);
      assert.equal(prior.restaurant.intentDraft?.date,oldDate);
      assert.ok(host.providerCalls.length);
      callStart=host.providerCalls.length;
      searchStart=host.searches.length;
      await host.application.submitMessage({userId:user,conversationId:prior.case.conversationId,expectedVersion:prior.case.taskVersion,requestId:"review-edit",message:row.message});
    }
    const after=await settled(caseId);
    const calls=host.providerCalls.slice(callStart);
    const searches=host.searches.slice(searchStart);
    const dates=[...new Set(calls.map(call=>call.date))];
    const times=[...new Set(calls.map(call=>call.timeWindow.earliest))];
    const pass=row.expected==="clarify"?after.case.phase==="NEEDS_INPUT"&&calls.length===0:
      row.expected==="search"?searches.length>0:dates.length===1&&dates[0]===row.expected&&times.length===1&&times[0]===row.time;
    console.log(JSON.stringify({case:row.name,message:row.message,expected:row.expected,compiler:compile.status,
      patchDate:compile.patch?.date,conflict:compile.conflict?.message,phase:after.case.phase,draftDate:after.restaurant.intentDraft?.date,
      searches:searches.length,calls:calls.length,dates,times,pass}));
  } finally {
    await host.close();
  }
}
