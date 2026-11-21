import test from "node:test";
import assert from "node:assert/strict";
import { projectSelection, readSelection, selectionKey } from "./browser/slot-selection.js";

test("Round15 explicit selection survives empty inventory and rebinds only the same time",()=>{
 const selected={kind:"SELECTED" as const,dateTime:"2026-11-02T19:30:00+09:00",partySize:2};
 assert.deepEqual(projectSelection(selected,[]),{offerId:undefined,reselect:false});
 const earlier={id:"new-19",dateTime:"2026-11-02T19:00:00+09:00",partySize:2};
 assert.deepEqual(projectSelection(selected,[earlier]),{offerId:undefined,reselect:true});
 assert.deepEqual(projectSelection(selected,[earlier,{...selected,id:"replacement"}]),{offerId:"replacement",reselect:false});
});
test("Round15 choice storage is scoped independently of navigation and other plans",()=>{
 const scope={userId:"a",caseId:"dinner",revision:2,candidateId:"venue"};
 const selected={kind:"SELECTED" as const,dateTime:"2026-11-02T19:30:00+09:00",partySize:2};
 const values=new Map([[selectionKey(scope),JSON.stringify(selected)]]);
 assert.deepEqual(readSelection({getItem:key=>values.get(key)??null},scope),selected);
 for(const changed of [{userId:"b"},{caseId:"other"},{revision:3},{candidateId:"other"}]){
  assert.equal(readSelection({getItem:key=>values.get(key)??null},{...scope,...changed}),undefined);
 }
});

test("Round18 RECONFIRM is revision-scoped, survives empty inventory and never picks a default",async()=>{
 const {reconfirmationKey}=await import('./browser/slot-selection.js');
 const scope={userId:'a',caseId:'dinner',revision:3,candidateId:'venue'};
 const offers=[{id:'first',dateTime:'2026-11-02T19:00:00+09:00',partySize:3}];
 const values=new Map([[reconfirmationKey(scope),JSON.stringify({kind:'RECONFIRM'})]]);
 const intent=readSelection({getItem:key=>values.get(key)??null},scope);
 assert.deepEqual(intent,{kind:'RECONFIRM'});
 assert.deepEqual(projectSelection(intent,offers),{offerId:undefined,reselect:true});
 assert.deepEqual(projectSelection(intent,[]),{offerId:undefined,reselect:false});
 assert.deepEqual(projectSelection(undefined,offers),{offerId:'first',reselect:false});
 assert.equal(readSelection({getItem:key=>values.get(key)??null},{...scope,revision:4}),undefined);
 assert.deepEqual(readSelection({getItem:key=>values.get(key)??null},{...scope,candidateId:'other'}),{kind:'RECONFIRM'});
});
