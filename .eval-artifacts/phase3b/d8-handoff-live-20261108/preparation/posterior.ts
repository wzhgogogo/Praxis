// Complements, never duplicates, the original G6 runner's posterior reads.
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve,join} from 'node:path';
import {createWitnessReader} from '../../../../src/eval/restaurant/agent-loop/g6/witness.js';
const root=resolve(process.argv[2]!),slot=join(root,'runs/D8/D8');assert.equal(process.env.PRAXIS_RUN_C_D8_POSTERIOR,'1');
const evaluation=JSON.parse(await readFile(join(slot,'evaluation.json'),'utf8'));
assert.equal(evaluation.verdict.stopBatch,false,'No extra read after safety stop');assert.equal(evaluation.verdict.s0,0);assert.equal(evaluation.verdict.s0Status,'PASS','Independent safety evidence must be present');
const execution=JSON.parse(await readFile(join(slot,'execution.result.json'),'utf8')),pack=JSON.parse(await readFile(join(root,'D8-pack.json'),'utf8')),ledger=join(root,'budget-C-live.json');
const budget=JSON.parse(await readFile(ledger,'utf8')),spent=budget.cumulative.evaluationPublicGET-356;
assert.ok(spent>=1&&spent<=3);assert.equal(budget.sharedApprovedLimits.evaluationPublicGET,467);
const remaining=3-spent,directory=join(root,'posterior');await mkdir(directory,{recursive:false});
const last=budget.entries.filter((e:any)=>e.evaluationPublicGET===1).at(-1)?.recordedAtUTC;let count=0;
const reader=createWitnessReader({directory,budgetPath:ledger,runId:'C-D8-HANDOFF-20261108-POSTERIOR',fetch,requestTiming:{last:last?Date.parse(last):-Infinity},beforeGET:()=>{assert.ok(count<remaining);count++;}});
let receipt;
if(remaining===2&&evaluationInputDelivered(evaluation,execution))receipt=await reader.read(pack.cases[0].witness,'AFTER',true);
else if(remaining===1&&evaluationInputDelivered(evaluation,execution))receipt=await reader.readDetail({...pack.cases[0].witness,allowDetailOnlyCertificate:true},'NO_DELIVERY_AFTER');
await writeFile(join(directory,'result.json'),JSON.stringify({remainingBefore:remaining,GET:reader.count,receipt:receipt??null,noRetry:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({GET:reader.count,exists:receipt?.exists??null,evidenceMode:receipt?.evidenceMode??null}));
function evaluationInputDelivered(_evaluation:any,execution:any):boolean{return (execution.view.restaurant.presentedCandidateIds?.length??0)>0;}
