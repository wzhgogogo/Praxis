import test from "node:test";
import assert from "node:assert/strict";
import { projectSelection, readSelection, reconfirmationKey, selectionKey } from "./browser/slot-selection.js";

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

test("Round19 RECONFIRM spans revisions and candidates until its Case key is consumed",()=>{
 const scope={userId:'a',caseId:'dinner',revision:3,candidateId:'venue'};
 const offers=[{id:'first',dateTime:'2026-11-02T19:00:00+09:00',partySize:4}];
 const values=new Map([[reconfirmationKey(scope),JSON.stringify({kind:'RECONFIRM'})]]);
 const storage={getItem:(key:string)=>values.get(key)??null};
 for(const changed of [{},{revision:4},{candidateId:'other'},{revision:4,candidateId:'other'}]){
  const intent=readSelection(storage,{...scope,...changed});
  assert.deepEqual(intent,{kind:'RECONFIRM'});
  assert.deepEqual(projectSelection(intent,offers),{offerId:undefined,reselect:true});
  assert.deepEqual(projectSelection(intent,[]),{offerId:undefined,reselect:false});
 }
 for(const changed of [{userId:'b'},{caseId:'other'}])assert.equal(readSelection(storage,{...scope,...changed}),undefined);
 assert.equal(values.size,1);assert.equal(reconfirmationKey(scope),'praxis:slot-reconfirm:'+JSON.stringify(['a','dinner']));
 const revised={...scope,revision:4};values.delete(reconfirmationKey(revised));assert.equal(values.size,0);
 for(const revision of [3,4,5]){
  const intent=readSelection(storage,{...scope,revision});assert.equal(intent,undefined);
  assert.deepEqual(projectSelection(intent,offers),{offerId:'first',reselect:false});
 }
 for(const raw of ['{','null','"RECONFIRM"','{"kind":"SELECTED"}']){
  values.set(reconfirmationKey(scope),raw);assert.equal(readSelection(storage,scope),undefined);
 }
});
