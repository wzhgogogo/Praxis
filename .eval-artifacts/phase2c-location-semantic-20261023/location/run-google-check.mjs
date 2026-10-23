import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {GooglePlacesRestaurantSearch} from '../../../src/integrations/google/google-places-restaurant-search.ts';
import {fixtureIntent} from '../../../src/harness/restaurant-fixtures.ts';

const dir='.eval-artifacts/phase2c-location-semantic-20261023',dry=process.argv.includes('--dry-run');
assert.ok(dry||process.argv.includes('--google-read'),'Explicit read mode required');
const sha=b=>createHash('sha256').update(b).digest('hex'),bytes=await fs.readFile(`${dir}/google-30-inputs.json`),plan=JSON.parse(bytes);
const approved=JSON.parse(await fs.readFile(`${dir}/input-shas.json`));assert.equal(sha(bytes),approved[`${dir}/google-30-inputs.json`]);assert.equal(plan.names.length,30);
const freeze=JSON.parse(await fs.readFile(`${dir}/location/execution-freeze.json`));for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`Frozen change:${p}`);
const output=`${dir}/location/google-30-${dry?'dryrun':'read'}.json`,started=`${dir}/location/google-30-${dry?'dryrun':'read'}-started.json`;
await fs.writeFile(started,JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),inputSha256:sha(bytes),mode:dry?'OFFLINE_CONTROL':'AUTHORIZED_GOOGLE_ONLY'},null,2)+'\n',{flag:'wx'});
const transport=globalThis.fetch;let calls=0,current,wire;
globalThis.fetch=async(url,init)=>{
 assert.equal(String(url),'https://places.googleapis.com/v1/places:searchText');assert.equal(init?.method,'POST');assert.ok(++calls<=30);
 const body=JSON.parse(String(init.body));assert.equal(body.textQuery,current);assert.deepEqual(body.locationBias.circle,{center:{latitude:plan.context.latitude,longitude:plan.context.longitude},radius:1000});
 const response=dry?new Response(JSON.stringify({places:[{id:`fixture-${calls}`,displayName:{text:current},types:['neighborhood'],location:plan.context}]}),{status:200}):await transport(url,init);
 const publicBytes=await response.clone().text();let raw;try{raw=JSON.parse(publicBytes);}catch{raw=null;}
 wire={method:'POST',origin:'https://places.googleapis.com',path:'/v1/places:searchText',body,status:response.status,responseSha256:sha(publicBytes),places:(raw?.places??[]).map(p=>({id:p.id,displayName:p.displayName,types:p.types,location:p.location,addressComponents:p.addressComponents})),rawErrorCode:raw?.error?.code};return response;
};
const client=dry?new GooglePlacesClient({apiKey:'offline-fixture'}):GooglePlacesClient.fromEnvironment();
const search=new GooglePlacesRestaurantSearch(client,undefined,10,{evaluationLocation:plan.context,maxRequests:30});
const rows=[];let blocker;
for(const name of plan.names){
 current=name;wire=undefined;const start=Date.now();
 try{
  const result=await search.resolveNamedNearbyLocation({readRunId:'phase2c-google30',intent:{...fixtureIntent,area:{query:`near ${name}`}}},AbortSignal.timeout(15000));
  rows.push({name,status:'RESOLVED',location:result.location,observation:result.publicLocationObservation,elapsedMs:Date.now()-start,wire});
 }catch(error){
  const code=error.code??'UNCLASSIFIED_ERROR';rows.push({name,status:'UNRESOLVED',code,publicObservations:error.publicLocationObservations??[],elapsedMs:Date.now()-start,wire});
  if(!['GOOGLE_LOCATION_UNRESOLVED','GOOGLE_LOCATION_AMBIGUOUS'].includes(code)){blocker=code;break;}
 }
 const partial={mode:dry?'OFFLINE_CONTROL':'AUTHORIZED_GOOGLE_ONLY',inputSha256:sha(bytes),rows,realGoogleRequests:dry?0:calls,modelCalls:0,restaurantWebsiteRequests:0};
 await fs.writeFile(output,JSON.stringify(partial,null,2)+'\n');
}
const passed=rows.filter(r=>r.status==='RESOLVED').length,result={mode:dry?'OFFLINE_CONTROL':'AUTHORIZED_GOOGLE_ONLY',inputSha256:sha(bytes),startedAt:JSON.parse(await fs.readFile(started)).startedAt,finishedAt:new Date().toISOString(),planned:30,attempted:rows.length,passed,required:29,status:!blocker&&passed>=29?'PASS':'NOT_SATISFIED',blocker,rows,realGoogleRequests:dry?0:calls,modelCalls:0,restaurantWebsiteRequests:0,fullLive:0};
await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({mode:result.mode,status:result.status,passed,attempted:rows.length,realGoogleRequests:result.realGoogleRequests,blocker}));
if(result.status!=='PASS')process.exitCode=1;
