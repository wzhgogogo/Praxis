import assert from "node:assert/strict";
import test from "node:test";
import { checkReplay } from "./replay.js";
import type { ModelRequest } from "../../../../core/model/contracts.js";
const request={purpose:"restaurant_agent_decide",messages:[]} as unknown as ModelRequest;
test("G6 replay oracle rejects a different selected outlet and silent date invention, accepting the frozen clarification",()=>{
  const row={id:"local-control",path:"P1",variant:0,turn:"BOOK",request,expected:{action:"SELECT_CANDIDATE",candidateId:"same-outlet"}};
  assert.equal(checkReplay(row,JSON.stringify({type:"SELECT_CANDIDATE",candidateId:"same-outlet"})).status,"PASS");
  const wrong=checkReplay(row,JSON.stringify({type:"SELECT_CANDIDATE",candidateId:"other-outlet"}));assert.equal(wrong.status,"FAIL");assert.equal(wrong.s0,true);
  const undated={...row,request:{...request,purpose:"restaurant_semantic_interpret"},expected:{facts:[]}};
  assert.equal(checkReplay(undated,JSON.stringify({schemaVersion:"4",facts:[{field:"DATE",value:{kind:"DATE",value:"2026-11-11"}}]})).s0,true);
  assert.equal(checkReplay({...row,expected:{action:"ASK_USER",asks:"DATE"}},JSON.stringify({type:"ASK_USER",question:"Which day would you like?"})).status,"PASS");
});
