import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { assessRestaurantConditions } from '../../../../src/domains/restaurant/condition-states.js';
const rows = JSON.parse(gunzipSync(readFileSync(new URL('./old-condition-calls.json.gz',import.meta.url))).toString());
const changes: unknown[] = [];
const sourceChanges: unknown[] = [];
let states = 0;
for (const [call, row] of rows.entries()) {
 const current = assessRestaurantConditions(row.intent,row.facts);
 assert.equal(current.length,row.conditions.length);
 for (const [index, before] of row.conditions.entries()) {
  states++;
  const after = current[index]!;
  if (JSON.stringify(before.sources)!==JSON.stringify(after.sources) || JSON.stringify(before.evidenceIds)!==JSON.stringify(after.evidenceIds)) sourceChanges.push({call,index,criterion:before.text,oldStatus:before.status,newStatus:after.status,intent:row.intent,removedSources:before.sources.filter((q:any)=>!after.sources.some(r=>JSON.stringify(q)===JSON.stringify(r))),addedSources:after.sources.filter(q=>!before.sources.some((r:any)=>JSON.stringify(q)===JSON.stringify(r)))});
  if (before.status !== after.status) changes.push({call,index,criterion:before.text,strength:before.strength,oldStatus:before.status,newStatus:after.status,intent:row.intent,
   originalPrices:row.facts.flatMap((f:any)=>f.priceFacts?[...f.priceFacts.listedCoursePricesYen,...[f.priceFacts.lunchBudgetRangeYen,f.priceFacts.dinnerBudgetRangeYen].filter(Boolean)]:[]),
   oldExplanation:before.explanation,newExplanation:after.explanation,oldSources:before.sources,newSources:after.sources});
 }
}
const result={mode:'FROZEN_DEFAULT_REGRESSION_ACTUAL_INPUTS',calls:rows.length,states,changedStates:changes.length,changes,sourceChanges};
writeFileSync(process.argv[2]!,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({calls:rows.length,states,changedStates:changes.length}));
