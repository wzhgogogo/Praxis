import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {GooglePlacesRestaurantSearch as Current} from '../../../src/integrations/google/google-places-restaurant-search.ts';
import {fixtureIntent} from '../../../src/harness/restaurant-fixtures.ts';
globalThis.fetch=()=>{throw Error('OFFLINE_SAVED_LOCATIONS_NO_NETWORK');};
const dir='.eval-artifacts/phase2c-location-semantic-20261023',sha=b=>createHash('sha256').update(b).digest('hex');
const freeze=JSON.parse(await fs.readFile(`${dir}/location/execution-freeze.json`));for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h);
const source='src/integrations/google/google-places-restaurant-search.ts',baseline='1a715325f121db137c8e509ce8a2440e55cad968';
const original=execFileSync('git',['show',`${baseline}:${source}`],{encoding:'utf8'}),temporary=await fs.mkdtemp(path.join(os.tmpdir(),'phase2c-old-location-'));
const rewrite=original.replace(/(from\s+["'])(\.[^"']+)(["'])/g,(_s,a,relative,z)=>{let p=path.resolve(path.dirname(path.resolve(source)),relative);if(p.endsWith('.js'))p=p.slice(0,-3)+'.ts';return a+pathToFileURL(p).href+z;});
try{
 await fs.writeFile(path.join(temporary,'baseline.ts'),rewrite);
 const {GooglePlacesRestaurantSearch:Before}=await import(pathToFileURL(path.join(temporary,'baseline.ts')).href);
 const inputs=JSON.parse(await fs.readFile(`${dir}/location-inputs.json`)),rows=[];
 for(const input of inputs.runs){
  const base={source:input.source,query:input.area.query,responseScope:input.responseScope};
  if(input.responseScope==='SELECTED_PROJECTION_ONLY_NO_RANKED_RESPONSE'){
   rows.push({...base,before:{status:'RECORDED_RESOLVED',observations:input.recordedSuccessEvidence.map(e=>e.claims)},after:{status:'NOT_EVALUATED',reason:'Original ranked places/types response not saved; do not synthesize it from a chosen result.'}});continue;
  }
  if(input.responseScope==='NOT_OBSERVED'){rows.push({...base,before:{status:'NOT_OBSERVED'},after:{status:'NOT_OBSERVED'}});continue;}
  const run=async Class=>{
   let capturedBody,calls=0;
   const client=new GooglePlacesClient({apiKey:'offline',fetchImplementation:async(_url,init)=>{calls++;capturedBody=JSON.parse(String(init.body));return new Response(JSON.stringify({places:input.observedPlaces}),{status:200});}});
   const search=new Class(client,()=> '2026-10-23T00:00:00Z',10,{maxRequests:1,...(input.evaluationLocation?{evaluationLocation:input.evaluationLocation}:{})});
   try{const result=await search.resolveNamedNearbyLocation({intent:{...fixtureIntent,area:input.area}},new AbortController().signal);return {status:result.location?'RESOLVED':'SKIPPED',location:result.location,capturedBody,calls};}
   catch(e){return {status:e.code,capturedBody,calls};}
  };
  rows.push({...base,before:await run(Before),after:await run(Current)});
 }
 assert.ok(rows.filter(r=>['near Ningyocho','near Shimbashi'].includes(r.query)&&r.responseScope==='BOUNDED_PUBLIC_FAILURE_OBSERVATIONS').every(r=>r.after.status==='RESOLVED'));
 await fs.writeFile(`${dir}/location/saved-location-results.json`,JSON.stringify({mode:'OFFLINE_SOURCE_OBSERVATION_REPLAY',baseline,baselineSourceSha256:sha(original),currentCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),rows,newGoogleRequests:0,newModels:0,newWebsites:0,limitation:'Successful selected projections lacking original ranked response/types are NOT_EVALUATED, not fabricated as a full preserved response.'},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({rows:rows.length,changedObservedFailures:rows.filter(r=>r.before.status!==r.after.status).length,notEvaluated:rows.filter(r=>r.after.status==='NOT_EVALUATED').length,externalCalls:0}));
}finally{await fs.rm(temporary,{recursive:true,force:true});}
