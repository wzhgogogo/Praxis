/** Offline re-evaluation sidecar only; the original D6 score remains immutable. */
import assert from "node:assert/strict";
import { readFile,writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve,join } from "node:path";
import { evaluateG6,type G6EvaluationInput } from "../../../../src/eval/restaurant/agent-loop/g6/evaluator.js";
import type { G6NamedState } from "../../../../src/eval/restaurant/agent-loop/g6/named-outlet-binding.js";
const out=resolve(".eval-artifacts/phase3b/g6-development-live/named-binding-continuation"),root=resolve(".eval-artifacts/phase3b/g6-development-live/d6-turn-budgets/runs/D6");
const sha=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
for(const r of JSON.parse(await readFile(join(out,"inputs-sha256.json"),"utf8")).files)assert.equal(sha(await readFile(r.path)),r.sha256);
const load=async(name:string)=>JSON.parse(await readFile(join(root,name),"utf8"));
const input:G6EvaluationInput=await load("evaluation.input.json"),events=(await load("execution.result.json")).execution.events,turns=(await load("user-turns.json")).turns;
const choice=events.findIndex((e:any)=>e.event.userBookingSelection?.candidateId),party=events.findIndex((e:any,i:number)=>i>choice&&e.event.type==="SEMANTIC_PROPOSAL_COMPILED");
const states:G6NamedState[]=turns.map((t:any)=>({candidates:t.view.restaurant.candidates,intentDraft:t.view.restaurant.intentDraft,readEvidence:t.view.restaurant.readEvidence}));
const selected=events[choice].event.userBookingSelection.candidateId,prior=states[0]!.candidates.find(c=>c.restaurant.id===selected)!.restaurant;
const discovery=events.slice(0,choice).flatMap((e:any)=>e.event.type==="SEARCH_COMPLETED"?e.event.candidates:[]).find((c:any)=>c.restaurant.id===selected).restaurant;
for(const key of ["id","outletName","address"]as const)assert.equal(prior[key],discovery[key]);
assert.equal(prior.sourceIds.phone,discovery.sourceIds.phone);assert.equal(prior.sourceIds.googlePlaces,discovery.sourceIds.googlePlaces);
input.namedReferences={initial:null,turns:[
  {turnId:"INITIAL",userMessage:turns[0].message,before:{candidates:[]},after:states[0]!,events:events.slice(0,choice)},
  {turnId:"book-recommendation",userMessage:turns[1].message,before:states[0]!,after:states[1]!,events:events.slice(choice,party)},
  {turnId:"supply-party",userMessage:turns[2].message,before:states[1]!,after:states[2]!,events:events.slice(party)},
]};
const score=evaluateG6(input);assert.equal(score.verdict.s0,1);assert.equal(score.verdict.s0Status,"FAIL");assert.equal(score.verdict.stopBatch,true);
input.request={...input.request,named:score.namedOutletBinding.named!};assert.deepEqual(evaluateG6(input),score);
await writeFile(join(out,"D6-recheck.input.json"),JSON.stringify(input,null,2)+"\n",{flag:"wx"});
await writeFile(join(out,"D6-recheck.evaluation.json"),JSON.stringify(score,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({mode:"OFFLINE_SAVED_D6_INPUT_NOT_LIVE",schemaVersion:score.schemaVersion,s0:score.verdict.s0,s0Status:score.verdict.s0Status,stopBatch:score.verdict.stopBatch,named:input.request.named,originalEvaluationUnchanged:true}));
