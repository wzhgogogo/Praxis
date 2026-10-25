import test from 'node:test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runRecordingKeyScenario} from './fixtures/recording-key-scenario.js';

test('slot1 map DOM records in real Chromium and replays up to the first unqualified page without source traffic',{timeout:20000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'recording-keys-browser-'));
 try{t.diagnostic(JSON.stringify(await runRecordingKeyScenario(root)));}
 finally{await rm(root,{recursive:true,force:true});}
});
