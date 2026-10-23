import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {tabelogAvailabilityCompletion} from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {parseTabelogAvailabilitySlots} from '../../../src/integrations/tabelog/tabelog-page-parser.ts';
const dir='.eval-artifacts/phase2c-location-semantic-20261023/goya-followup',sha=b=>createHash('sha256').update(b).digest('hex');
globalThis.fetch=()=>{throw Error('SAVED_REPLAY_NO_NETWORK');};
const fixture=JSON.parse(await fs.readFile(`${dir}/saved-inputs.json`)),rows=[];
for(const row of fixture.rows){
 const bytes=await fs.readFile(row.source.htmlPath);assert.equal(sha(bytes),row.source.htmlSha256);
 const full={...row.snapshot,html:bytes.toString()},parsed=parseTabelogAvailabilitySlots(full,row.request),completion=tabelogAvailabilityCompletion(full,row.request);
 rows.push({id:row.id,parsed,completion,source:row.source,limitation:row.limitation});
}
console.log(JSON.stringify({mode:'SAVED_REAL_HTML_AND_PUBLIC_RESPONSE_PROJECTION',rows,newModels:0,Google:0,websites:0},null,2));
assert.ok(rows.every(r=>r.completion.complete&&r.parsed.availableSlots.includes('19:00')),'All three saved pages must retain independently bound 19:00 despite unsupported alternatives');
