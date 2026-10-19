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
    calls++;if(check.sourceId!=='tablecheck')return {count:2,responseStatus:200,reason:null};if(outcome==='EMPTY')return {count:0,responseStatus:200,reason:'EMPTY_RESULT'};
    if(outcome==='TIMEOUT')return new Promise<never>((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));return {count:3,responseStatus:200,reason:null};
   }});started=true;};
   if(outcome==='NONEMPTY')await work();else await assert.rejects(work(),(e:unknown)=>e instanceof SourceDataPreflightError&&e.code==='ENV_FAILURE'&&e.sourceIds.join()==='tablecheck');
   assert.equal(started,outcome==='NONEMPTY');assert.equal(calls,3);
   const artifact=JSON.parse(await readFile(join(dir,'source-data-preflight.json'),'utf8'));
   assert.equal(artifact.generationModelCalls,0);assert.equal(artifact.attempts[1].countsTowardStop,outcome!=='NONEMPTY');assert.equal(artifact.attempts[1].reason,outcome==='NONEMPTY'?null:outcome==='EMPTY'?'EMPTY_RESULT':'NO_RESPONSE');
  }finally{await rm(dir,{recursive:true,force:true});}
 }
 assert.equal(preflightSourceIds('RECOMMENDATION').includes('tablecheck'),false);
});

test('source preflight distinguishes an explicit empty200 from no valid response and missing diagnostics',async()=>{
 for(const observed of [
  {count:0,responseStatus:200,reason:'EMPTY_RESULT' as const},
  {count:null,responseStatus:503,reason:'NO_RESPONSE' as const,detail:'HTTP_STATUS'},
  {count:null,responseStatus:null,reason:'NO_RESPONSE' as const,detail:'NO_VALID_SEARCH_RESPONSE'},
 ]){
  const dir=await mkdtemp(join(tmpdir(),'source-status-'));
  try{
   await assert.rejects(runSourceDataPreflight({sourceIds:['tablecheck'],environment:{},artifactDirectory:dir},{read:async()=>observed}),SourceDataPreflightError);
   const result=JSON.parse(await readFile(join(dir,'source-data-preflight.json'),'utf8'));
   assert.equal(result.attempts[0].reason,observed.reason);assert.equal(result.attempts[0].responseStatus,observed.responseStatus);
   assert.equal(result.attempts[0].count,observed.count);assert.equal(result.attempts[0].countsTowardStop,observed.responseStatus!==null);
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});

test('TableCheck readiness counts result documents, never catalog metadata or grouped facets', async()=>{
 const {observeTableCheckSearchCount,TABLECHECK_PUBLIC_SEARCH_ORIGIN}=await import('../../../integrations/tablecheck/tablecheck-public-query.js');
 const response={url:TABLECHECK_PUBLIC_SEARCH_ORIGIN+'/search/?queryProfile=public&hits=5',method:'GET',status:200,contentType:'application/json; charset=utf-8',body:Buffer.from(JSON.stringify({root:{children:[{id:'group',children:[{id:'venue-one',source:'public-shop',fields:{id:'venue-one'}}]},{id:'venue-two',source:'public-shop',fields:{id:'venue-two'}}]}}))};
 assert.equal(observeTableCheckSearchCount(response),2);
 assert.equal(observeTableCheckSearchCount({...response,body:Buffer.from('{"root":{"children":[]}}')}),0);
 assert.equal(observeTableCheckSearchCount({...response,body:Buffer.from('{"root":{"children":[{"id":"facet","children":[]}]}}')}),0);
 for(const patch of [{url:TABLECHECK_PUBLIC_SEARCH_ORIGIN+'/catalog.json'},{url:'https://foreign.example/search/'},{method:'POST'},{status:503},{contentType:'text/html'},{body:Buffer.from('not JSON')}])assert.equal(observeTableCheckSearchCount({...response,...patch}),undefined);
});
