import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {parseAllDocuments} from 'yaml';
import {loadFrozenLiveCases,materializeLiveCase,customLiveCaseCohort} from '../../../src/eval/restaurant/agent-loop/live-case-materializer.ts';
const path='.eval-artifacts/p1-f-20261011/variants.yaml',raw=await readFile(path,'utf8'),oracle=parseAllDocuments(raw).map(d=>d.toJSON());
const rows=await loadFrozenLiveCases(path);assert.equal(rows.length,8);const results=[];
for(const [i,row] of rows.entries()) {assert.deepEqual(row.semantic,oracle[i].semantic);assert.deepEqual(row.content,oracle[i].content);const cohort=await customLiveCaseCohort(row);const materialized=materializeLiveCase(row,row.reference_time);assert.deepEqual(materialized.semantic,oracle[i].semantic);assert.deepEqual(materialized.content,oracle[i].content);results.push({id:row.id,dataset:row.dataset,cohort,parent:row.parent??null,semantic:row.semantic,contentUnchanged:true,semanticUnchanged:true});}
await writeFile('.eval-artifacts/p1-f-20261011/loading/parsed-cases.json',JSON.stringify({modelCalls:0,googleCalls:0,results},null,2),{flag:'wx'});console.log(JSON.stringify(results.map(({id,cohort})=>({id,cohort})),null,2));
