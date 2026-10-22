import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {hasTabelogSelectedQuery} from '../../../src/integrations/tabelog/tabelog-query-controls.ts';
import {parseTabelogAvailabilitySlots} from '../../../src/integrations/tabelog/tabelog-page-parser.ts';
const dir='.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021';
globalThis.fetch=()=>{throw Error('SAVED_SOURCE_ONLY_NO_NETWORK');};
const sha=b=>createHash('sha256').update(b).digest('hex');
const freeze=JSON.parse(await fs.readFile(`${dir}/freeze.json`));
for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);
const manifest=JSON.parse(await fs.readFile(`${dir}/inputs/manifest.json`)),oracle=JSON.parse(await fs.readFile(`${dir}/independent-oracle.json`)),rows=[];
for(const row of manifest.rows){
 const detail=JSON.parse(await fs.readFile(row.snapshotPath)).detail;
 const snapshot={url:detail.url,title:detail.title,text:'',html:await fs.readFile(row.htmlPath,'utf8'),responses:detail.responses};
 const independent=oracle.rows.find(r=>r.id===row.id);
 const confirmed=hasTabelogSelectedQuery(snapshot,row.request.date,row.request.partySize),slots=parseTabelogAvailabilitySlots(snapshot,row.request);
 assert.equal(confirmed,independent.selectedQuery,row.id);
 assert.equal(row.responsesCount,0);assert.deepEqual(slots,{availableSlots:[],hasExplicitSlotUi:false});
 rows.push({id:row.id,runId:row.runId,candidateId:row.candidateId,request:row.request,originalReason:row.originalCheck.reasonCode,
  selectedQueryConfirmed:confirmed,independentSelectedDates:independent.selectedDates,independentSelectedGuests:independent.selectedGuests,
  productionRuntimeSlots:slots,inventoryStatus:'UNKNOWN',missingEvidence:'NO_CAPTURED_RUNTIME_RESPONSE',
  independentlyParsedRenderedSlots:independent.uiAvailableSlots,postRunComparison:independent.postRunComparison,
  snapshotPath:row.snapshotPath,htmlPath:row.htmlPath,originalSource:row.html});
}
const result={schema:'tabelog-query-binding-recompute@1',codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'SAVED_SOURCE_REPLAY',
 sampleCount:rows.length,beforeConfirmed:0,afterConfirmed:rows.filter(r=>r.selectedQueryConfirmed).length,stillSelectionUnknown:rows.filter(r=>!r.selectedQueryConfirmed).map(r=>r.id),
 runtimeInventoryConfirmed:0,runtimeInventoryUnknown:19,
 comparison:{covered:rows.filter(r=>r.postRunComparison.rawPath).length,comparable:rows.filter(r=>r.postRunComparison.everyRenderedSlotSupported!==null).length,
  renderedSubsetSupported:rows.filter(r=>r.postRunComparison.everyRenderedSlotSupported===true).length,exactSlotSetsEqual:rows.filter(r=>r.postRunComparison.exactSlotSetEqual===true).length,
  mismatches:rows.filter(r=>r.postRunComparison.status==='MISMATCH').length},
 sourceRequests:0,modelCalls:0,fullLiveRuns:0,rows,
 limits:'Missing runtime JSON remains missing. Rendered UI subsets and later GETs are separate observations, not reconstructed runtime responses or rerated Live deliveries.'};
await fs.writeFile(`${dir}/recomputed-results.json`,JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({samples:result.sampleCount,selectedConfirmed:result.afterConfirmed,inventoryUnknown:result.runtimeInventoryUnknown,comparison:result.comparison}));
