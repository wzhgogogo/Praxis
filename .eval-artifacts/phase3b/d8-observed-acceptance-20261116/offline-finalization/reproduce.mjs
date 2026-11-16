import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url)),copy=join(root,'ledger-copy.json');
const source=join(root,'../d8/active-budget.json');
await copyFile(source,copy);const before=await readFile(copy);
const {recordG6SourceCounts}=await import(pathToFileURL('/private/tmp/praxis-premerge-scope-main-20261115/src/eval/restaurant/agent-loop/g6/budget.ts').href);
let observed;try{await recordG6SourceCounts(copy,'offline-reproduction-only',1,354);}catch(error){observed=error.message;}
assert.equal(observed,'Invalid existing I/O ledger counter');assert.deepEqual(await readFile(copy),before);
const ledger=JSON.parse(before);
const result={sourceSHA:'ccdce4703e36f05d08d076d4fdf86735acf487d6',basis:'First finalizer operation before capture.finish/recording.finish; original outer exception contains no inner cause, this is deterministic offline reproduction from its exact budget bytes.',missingFields:['googleRequests','restaurantWebsiteRequests'].filter(k=>!Number.isSafeInteger(ledger.cumulative[k])),reproducedError:observed,copyUnchangedSHA256:createHash('sha256').update(before).digest('hex'),realModelCalls:0,websiteGET:0,Live:0};
await writeFile(join(root,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
