import {writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {GooglePlacesRestaurantSearch as NewSearch} from '../../../src/integrations/google/google-places-restaurant-search.ts';
import {GooglePlacesRestaurantSearch as OldSearch} from '/tmp/p1f-original-google-search.ts';
import {googleDiscoveryGeoDiagnostics} from '../../../src/domains/restaurant/read-grounding.ts';
const dir=resolve('.eval-artifacts/p1-f-prep-20261011/location-resolver');
const variants=await readFile('.eval-artifacts/known-feasible-baseline-20261008/variants.yaml','utf8');
const {parseAllDocuments}=await import('yaml');const variant=parseAllDocuments(variants).map(d=>d.toJSON()).find(d=>d.id==='kf-h002-20261024');
const center=variant.evaluation_location ?? variant.acceptance?.evaluation_location;console.log('center-shape',Object.keys(variant));
const point=center?{latitude:center.latitude??center.lat,longitude:center.longitude??center.lng,radiusMeters:1000}:{latitude:35.6697,longitude:139.767,radiusMeters:1000};
let calls=0;const client=new GooglePlacesClient({apiKey:process.env.GOOGLE_MAPS_API_KEY??'',timeoutMs:10000,fetchImplementation:async(url,init)=>{calls++;return fetch(url,init);}});const rows=[];
for(const [name,confirmation] of [['Azabu','Azabu restaurant Miami'],['Kanda','Kanda restaurant Montreal'],['Ueno','Ueno restaurant United States'],['Akasaka','Akasaka restaurant Seattle'],['Asakusa','Asakusa restaurant London']]){
 const overseas=await client.textSearch({textQuery:confirmation,pageSize:10},AbortSignal.timeout(15000));
 const versions=[];
 for(const [version,Search] of [['old',OldSearch],['new',NewSearch]]){
  const observations=[];const observedClient={textSearch:async(req,signal)=>{const places=await client.textSearch(req,signal);observations.push(...places);return places;}};
  const search=new Search(observedClient,()=>new Date().toISOString(),10,{evaluationLocation:point,maxRequests:1});let result,error;
  try{result=await search.resolveNamedNearbyLocation({intent:{timezone:'Asia/Tokyo',target:{goal:'RECOMMENDATION',query:'restaurants'},area:{query:`near ${name}`},criteria:[]},readRunId:`${version}:${name}`},AbortSignal.timeout(15000));}catch(e){error={code:e.code,message:e.message,publicLocationObservations:e.publicLocationObservations};}
  const distance=result?.location?googleDiscoveryGeoDiagnostics({location:result.location},{evaluationLocation:{...point,label:'bound evaluation context'}}).distanceMeters:undefined;
  versions.push({version,result,error,distanceMeters:distance,candidates:observations});
 }
 rows.push({name,overseasConfirmationQuery:confirmation,overseasObserved:overseas,versions});await writeFile(resolve(dir,'google-probes.json'),JSON.stringify({mode:'LIVE_READ_ONLY_GOOGLE_ONLY',modelCalls:0,browserCalls:0,googleCalls:calls,center:point,rows},null,2));console.log(name,versions.map(v=>[v.version,v.result?.location?.label,v.error?.code]));
}
