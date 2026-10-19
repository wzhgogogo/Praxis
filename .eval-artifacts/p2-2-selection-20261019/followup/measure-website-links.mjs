// Offline diagnostic only. Run with node --import tsx; no env or provider calls.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {candidateAvailabilityPath} from '../../../src/integrations/restaurant-search/source-packs.ts';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const manifestPath='.eval-artifacts/p2-2-selection-20261019/timing-inputs.json';
const buckets=['DIRECT_SOURCE_PAGE','WEBSITE_FIELD_ONLY','NO_WEBSITE_FIELD','UNUSABLE_WEBSITE_FIELD'];
globalThis.fetch=async()=>{throw Error('Offline measurement: network forbidden');};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function verified(ref){
 const bytes=readFileSync(resolve(root,ref.path));
 if(sha(bytes)!==ref.sha256)throw Error('Input SHA mismatch: '+ref.path);
 return ref.path.endsWith('.gz')?gunzipSync(bytes).toString('utf8'):bytes.toString('utf8');
}
function publicWebsite(value){
 if(typeof value!=='string'||!value)return undefined;
 try{
  const url=new URL(value);
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return undefined;
  url.hash='';return url.href;
 }catch{return undefined;}
}
function observation(restaurant){
 const ids=restaurant.sourceIds??{};
 if(typeof ids.googlePlaces!=='string'||!ids.googlePlaces)return undefined;
 const website=publicWebsite(ids.googleWebsiteUri);
 const safeIds={...ids};if(!website)delete safeIds.googleWebsiteUri;
 const path=candidateAvailabilityPath({...restaurant,sourceIds:safeIds});
 const bucket=path==='DIRECT_SOURCE_PAGE'?'DIRECT_SOURCE_PAGE':website?'WEBSITE_FIELD_ONLY':ids.googleWebsiteUri?'UNUSABLE_WEBSITE_FIELD':'NO_WEBSITE_FIELD';
 return {googlePlaceId:ids.googlePlaces,name:restaurant.outletName,bucket,...(website?{website}:{}),unsafeWebsiteField:!!ids.googleWebsiteUri&&!website};
}
function firstObservations(candidates){
 const first=new Map();let occurrences=0;
 for(const candidate of candidates){
  const item=observation(candidate.restaurant??candidate);if(!item)continue;
  occurrences++;if(!first.has(item.googlePlaceId))first.set(item.googlePlaceId,item);
 }
 return {items:[...first.values()],occurrences};
}
function counts(items){
 const totals=Object.fromEntries(buckets.map(b=>[b,0]));
 for(const item of items)totals[item.bucket]++;
 return {total:items.length,...totals,websiteFieldOnlyFraction:items.length?totals.WEBSITE_FIELD_ONLY/items.length:null};
}
function uniquePlaces(runs){
 const places=new Map();
 for(const run of runs)for(const item of run.items){
  const row=places.get(item.googlePlaceId)??{googlePlaceId:item.googlePlaceId,names:new Set(),websites:new Set(),buckets:new Set(),runs:[]};
  row.names.add(item.name);if(item.website)row.websites.add(item.website);row.buckets.add(item.bucket);row.runs.push(run.id);places.set(item.googlePlaceId,row);
 }
 return [...places.values()].map(row=>({...row,names:[...row.names],websites:[...row.websites],buckets:[...row.buckets],classification:row.buckets.size===1?[...row.buckets][0]:'OBSERVATION_VARIANT'}));
}
function summarizeUnique(places){
 return {total:places.length,...Object.fromEntries([...buckets,'OBSERVATION_VARIANT'].map(bucket=>[bucket,places.filter(p=>p.classification===bucket).length])),
  note:'Each place ID counted once; conflicting observations stay variant, never choose the best link.'};
}
function selfTest(){
 const candidate=(id,website)=>({restaurant:{id,outletName:id,sourceIds:{googlePlaces:id,...(website?{googleWebsiteUri:website}:{})}}});
 const items=[candidate('tl','https://tabelog.com/tokyo/A1303/A130301/13293469/'),candidate('tc','https://www.tablecheck.com/en/shops/fixture/reserve'),candidate('official','https://restaurant.example.jp/'),candidate('unknown','https://unsupported.example/booking'),candidate('none'),candidate('secret','https://user:password@example.jp/'),candidate('bad','javascript:alert(1)'),candidate('official','https://www.tablecheck.com/en/shops/later/reserve')];
 const first=firstObservations(items);
 assert.equal(first.occurrences,8);assert.equal(first.items.length,7);
 assert.deepEqual(counts(first.items),{total:7,DIRECT_SOURCE_PAGE:2,WEBSITE_FIELD_ONLY:2,NO_WEBSITE_FIELD:1,UNUSABLE_WEBSITE_FIELD:2,websiteFieldOnlyFraction:2/7});
 assert.equal(first.items.find(x=>x.googlePlaceId==='official').bucket,'WEBSITE_FIELD_ONLY','later enrichment cannot rewrite the first discovery observation');
 assert.ok(!JSON.stringify(first).includes('password'),'unusable credential URL is not emitted');
 const second=firstObservations([candidate('official','https://www.tablecheck.com/en/shops/later/reserve')]);
 const places=uniquePlaces([{id:'a',items:first.items},{id:'b',items:second.items}]);
 assert.equal(places.find(x=>x.googlePlaceId==='official').classification,'OBSERVATION_VARIANT');
 assert.equal(summarizeUnique(places).total,7);
 assert.equal(counts([]).websiteFieldOnlyFraction,null,'unobserved denominator is not zero percent');
 assert.throws(()=>verified({path:manifestPath,sha256:'0'.repeat(64)}),/SHA mismatch/);
 console.log('PASS: literal counts, first-observation dedup, unsupported URLs, unsafe URLs, cross-run variants, missing denominator, SHA mismatch; 0 network/model.');
}
function measure(){
 const manifestBytes=readFileSync(resolve(root,manifestPath));
 const manifest=JSON.parse(manifestBytes);const runs=[];
 for(const row of manifest.inputs){
  const artifact=JSON.parse(verified(row.artifact));let candidates=[];let origin;
  if(row.trace){
   origin={...row.trace,kind:'SOURCE_FIRST_BATCH trace'};
   for(const line of verified(row.trace).split('\n').filter(Boolean)){
    const record=JSON.parse(line);
    if(record.kind==='SOURCE_FIRST_BATCH'&&record.detail?.sourceId==='google-places')candidates.push(...(record.detail.read?.candidates??[]));
   }
  }else{
   origin={...row.artifact,kind:'SEARCH_COMPLETED events, first Google place observation'};
   for(const envelope of artifact.events??[]){const event=envelope.event??envelope;if(event.type==='SEARCH_COMPLETED')candidates.push(...(event.candidates??[]));}
  }
  const first=firstObservations(candidates);
  runs.push({id:row.id,group:row.group,input:origin,status:first.items.length?'OBSERVED':'NO_GOOGLE_CANDIDATE_OBSERVED',...first,...counts(first.items)});
 }
 const places=uniquePlaces(runs);
 const groups=[...new Set(runs.map(r=>r.group))].map(group=>{
  const selected=runs.filter(r=>r.group===group);const items=selected.flatMap(r=>r.items);
  return {group,runs:selected.length,withCandidates:selected.filter(r=>r.items.length).length,noCandidatesObserved:selected.filter(r=>!r.items.length).map(r=>r.id),candidateAppearances:counts(items),uniquePlaceIds:summarizeUnique(uniquePlaces(selected))};
 });
 const output={schema:'google-website-link-coverage@1',status:'EXPOSED_OFFLINE_PROXY',network:0,models:0,
  manifest:{path:manifestPath,sha256:sha(manifestBytes)},
  productionPackSourceSha256:sha(readFileSync(resolve(root,'src/integrations/restaurant-search/source-packs.ts'))),
  definition:'Google-returned candidates, first observation per place ID per run. WEBSITE_FIELD_ONLY means a valid Google website field but no supported direct source entrance under current Packs. It does not verify official ownership or outbound reservation links.',
  limitations:['No current website read; official website ownership and supported-link yield NOT_EVALUATED.','All returned Google candidates, not a qualified/HARD/in-radius-only selection pool.','Repeated cases/runs are correlated; appearances are not independent restaurants.','No checkpoint C artifact in this frozen manifest; C NOT_EVALUATED.','No candidate observed is not proof that Google succeeded with zero candidates.'],
  candidateAppearances:counts(runs.flatMap(r=>r.items)),uniquePlaceIds:summarizeUnique(places),groups,
  runs:runs.map(({items,...run})=>run),places};
 const destination=resolve(root,'.eval-artifacts/p2-2-selection-20261019/followup/website-link-statistics.json');
 writeFileSync(destination,JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({output:destination,appearances:output.candidateAppearances,unique:output.uniquePlaceIds,groups},null,2));
}
if(process.argv.includes('--self-test'))selfTest();else measure();
