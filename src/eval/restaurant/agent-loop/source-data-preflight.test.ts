import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runSourceDataPreflight,SourceDataPreflightError,preflightSourceIds} from './source-data-preflight.js';

test('source data preflight: nonempty controls pass once; empty and timeout prevent run start',async()=>{
 for(const outcome of ['NONEMPTY','EMPTY','TIMEOUT'] as const){
  const dir=await mkdtemp(join(tmpdir(),'source-data-'));let calls=0,started=false;
  try{
   const work=async()=>{await runSourceDataPreflight({sourceIds:['tabelog','tablecheck','google-places'],environment:{},artifactDirectory:dir,timeoutMs:20},{read:async(check,signal)=>{
    calls++;if(check.sourceId!=='tablecheck')return 2;if(outcome==='EMPTY')return 0;
    if(outcome==='TIMEOUT')return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));return 3;
   }});started=true;};
   if(outcome==='NONEMPTY')await work();else await assert.rejects(work(),(e:unknown)=>e instanceof SourceDataPreflightError&&e.code==='ENV_FAILURE'&&e.sourceIds.join()==='tablecheck');
   assert.equal(started,outcome==='NONEMPTY');assert.equal(calls,3);
   const artifact=JSON.parse(await readFile(join(dir,'source-data-preflight.json'),'utf8'));
   assert.equal(artifact.generationModelCalls,0);assert.equal(artifact.attempts[1].reason,outcome==='NONEMPTY'?null:outcome==='EMPTY'?'EMPTY_RESULT':'TIMEOUT');
  }finally{await rm(dir,{recursive:true,force:true});}
 }
 assert.equal(preflightSourceIds('RECOMMENDATION').includes('tablecheck'),false);
});
