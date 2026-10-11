import assert from 'node:assert/strict';
import {loadFrozenLiveCases,validDevelopmentVariantParent} from '../../../src/eval/restaurant/agent-loop/live-case-materializer.ts';
const rows=await loadFrozenLiveCases('.eval-artifacts/p1-f-20261011/variants.yaml');
const accepted=[];
// Exact preflight-free extraction of the current Runner custom-source predicate.
for(const row of rows){const value=row.dataset==='restaurant-read-development-variant@1'&&await validDevelopmentVariantParent(row.parent);accepted.push(value);console.log(row.id,value);}
assert.equal(rows.length,8);assert.ok(accepted.every(Boolean),'Approved novel variants are rejected by the current Runner dataset/parent gate');
