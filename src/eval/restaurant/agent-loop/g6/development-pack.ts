import { createHash } from "node:crypto";
import type { G6Pack,G6Case,G6Followup } from "./runner.js";

export const G6_DEVELOPMENT_DATE="2026-11-11";
export const G6_PLANNED_RUN_DATE="2026-11-03";
export const W2_SOURCE_ID="13186922";
export const W2_EXCLUDED_SOURCE_ID="13219563";
const booking=(text:string):G6Followup=>({id:"book-first",trigger:"DISPLAYED_AVAILABLE",kind:"MESSAGE",text});

/** Public development configuration only. Witness truth is not asserted before approved GETs. */
export function developmentPack():G6Pack{
  const date=G6_DEVELOPMENT_DATE,time="19:00",partySize=2;
  const w1={candidateId:"witness-W1",name:"Kushi Katsu Dengana Akabane ten",address:"1-15-1, Akabane, Kita-ku, Tokyo",provider:"TABELOG",sourceEntityId:"13108466",date,time,partySize,detailUrl:"https://tabelog.com/en/tokyo/A1323/A132305/13108466/",identityText:["Kushi Katsu Dengana Akabane ten","1-15-1"]};
  const w2={candidateId:"witness-W2",name:"のどぐろ専門 銀座 中俣",address:"東京都中央区銀座4-10-12 銀座サマリアビル B1",provider:"TABELOG",sourceEntityId:W2_SOURCE_ID,date,time,partySize,detailUrl:"https://tabelog.com/en/tokyo/A1301/A130101/13186922/",identityText:["4-10-12"],allowDetailOnlyCertificate:true};
  const d1="Could you find a kushikatsu place near Akabane with a table for 2 on Wednesday, November 11, 2026 at 7 PM?";
  const d2="Check whether Specializing in Nodoguro Ginza Nakamata has a table for two on November 11, 2026 at 7 PM.";
  const d3="Can you find a table for two at Kushi Katsu Dengana Akabane ten on November 11, 2026 at 7 PM?";
  const rows:Array<[string,string,G6Followup[]]>=[
    ["D1",d1,[]],["D2",d2,[]],["D3",d3,[booking("Please book the first restaurant for me.")]],
    ["D4",d1,[{id:"ask-private-room",trigger:"DISPLAYED_AVAILABLE",kind:"PAGE_QUESTION",text:"Does the first restaurant have a private room?"}]],
    ["D5","I'd like to book Kushi Katsu Dengana Akabane ten at 7 PM sometime next week, for two people.",[{id:"supply-date",trigger:"ASKED_FOR_DATE",kind:"MESSAGE",text:"November 11, 2026."}]],
    ["D6","Recommend a restaurant near Akabane Station.",[{id:"book-recommendation",trigger:"DISPLAYED_RESULTS",kind:"MESSAGE",text:"I'd like to book the first restaurant on November 11, 2026 at 7 PM."},{id:"supply-party",trigger:"ASKED_FOR_PARTY",kind:"MESSAGE",text:"Two people."}]],
    ["D7",d1,[]],["D8",d2,[booking("I'd like to reserve the first restaurant.")]],
  ];
  const cases:G6Case[]=rows.map(([id,request,followups])=>({id,request,followups,witness:id==="D2"||id==="D8"?w2:w1,
    oracle:{request:{dates:[date],time,partySize,requiresIndependentQualification:true},pages:[]}}));
  return {schemaVersion:"phase3b-g6-pack@1",mode:"LIVE_READ",recording:{browser:true,decisions:true,googleResponses:true},witnessGETLimit:20,cases};
}
export function developmentRequestSHA(pack:G6Pack){return createHash("sha256").update(JSON.stringify(pack.cases.map(({id,request,followups})=>({id,request,followups})))).digest("hex");}
export function assertDevelopmentDates(runDate:string,visitDate=G6_DEVELOPMENT_DATE){
  const delta=(Date.parse(visitDate+"T00:00:00Z")-Date.parse(runDate+"T00:00:00Z"))/86_400_000;
  if(!Number.isInteger(delta)||delta<7||delta>14||new Date(visitDate+"T00:00:00Z").getUTCDay()!==3)throw Error("Development date outside7-14days or original Wednesday; re-freeze before execution");
}
