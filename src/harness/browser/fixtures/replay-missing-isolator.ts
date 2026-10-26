// Linux fault control. Build the normal fixture first, then hide unshare
// only for the replay launch; production layers and original assertions stay intact.
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createReplayFixture,executeReplayFixture} from './replay-scenario.js';
assert.equal(process.platform,'linux','missing-unshare control requires real Linux');
const output=process.argv[2];assert.ok(output);
const root=await mkdtemp(join(tmpdir(),'replay-no-isolator-')),previous=process.env.PATH;
let failure='';
try{
 const {bundle}=await createReplayFixture(root),empty=join(root,'empty-path');await mkdir(empty);
 process.env.PATH=empty;
 await assert.rejects(executeReplayFixture(bundle,'complete'),error=>{
  if(!(error instanceof Error))return false;failure=error.message;
  return /OS network isolation unavailable/.test(failure)&&/unshare/.test(failure)&&/ENOENT/.test(failure);
 });
}finally{
 if(previous===undefined)delete process.env.PATH;else process.env.PATH=previous;
 await rm(root,{recursive:true,force:true});
}
await writeFile(output,JSON.stringify({status:'PASS',control:'MISSING_UNSHARE_FAILS_CLOSED',failure,realModelCalls:0,realGoogleCalls:0,realWebsiteCalls:0,liveRuns:0},null,2)+'\n');
console.log('Missing unshare explicitly rejected; no replay or network fallback.');
