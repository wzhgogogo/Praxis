import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {benchmarkOutlet,benchmarkNameShapes} from '../../src/eval/restaurant/agent-loop/name-resolution-benchmark.ts';
const base='.eval-artifacts/name-resolution-benchmark-20261019';
const manifest=JSON.parse(readFileSync(base+'/source-manifest.json','utf8'));
const pool=new Map(),controls=new Map(),excluded={incomplete:0,missingGoogleId:0};
for(const ref of manifest.sources){
 const bytes=readFileSync(ref.path);if(createHash('sha256').update(bytes).digest('hex')!==ref.sha256)throw Error('Source SHA mismatch '+ref.path);
 const text=(ref.path.endsWith('.gz')?gunzipSync(bytes):bytes).toString('utf8');
 const rows=ref.path.endsWith('.jsonl')?text.split('\n').filter(Boolean).map(JSON.parse):JSON.parse(text).events.map(e=>e.event);
 for(let record=0;record<rows.length;record++){
  const row=rows[record];const read=row.kind==='SOURCE_FIRST_BATCH'?row.detail?.read:row.type==='SEARCH_COMPLETED'?row:undefined;
  if(!read)continue;
  for(const [candidate,c]of(read.candidates??[]).entries()){
   const r=c.restaurant,ids=r?.sourceIds;if(!ids?.googlePlaces){excluded.missingGoogleId++;continue;}
   const point=r.coordinates;
   if(!r.outletName||!r.address||!ids.phone||!Number.isFinite(point?.lat)||!Number.isFinite(point?.lng)){excluded.incomplete++;continue;}
   const expected=ids.googleWebsiteUri?benchmarkOutlet(ids.googleWebsiteUri):undefined;
   const evidence=read.evidence?.find(e=>e.candidateId===r.id&&e.claims?.areaQuery);
   const area=row.request?.intent?.area?.query??evidence?.claims?.areaQuery??'UNRECORDED';
   const provenance={path:ref.path,sha256:ref.sha256,record,candidate,googlePlaceId:ids.googlePlaces,...(ids.googleWebsiteUri?{website:ids.googleWebsiteUri}:{})};
   const key=expected?expected.platform+':'+expected.outletId:ids.googlePlaces;
   const target=expected?pool:controls;
   const old=target.get(key);
   if(old){old.provenance.push(provenance);if(!old.groups.areas.includes(area))old.groups.areas.push(area);continue;}
   target.set(key,{role:expected?'GOLD':'CONTROL',...(expected?{platform:expected.platform,expected:{outletId:expected.outletId,sourceUrl:ids.googleWebsiteUri}}:{}),
    subject:{name:r.outletName,address:r.address,phone:ids.phone,coordinates:point},groups:{areas:[area],nameShapes:benchmarkNameShapes(r.outletName),linkKind:expected?'DIRECT':!ids.googleWebsiteUri?'NONE':/instagram\.com/i.test(ids.googleWebsiteUri)?'INSTAGRAM':'OTHER_WEBSITE'},provenance:[provenance]});
  }
 }
}
// Greedy coverage selection: new area and name-shape labels first, then stable ID.
function choose(items,limit){
 const area=new Set(),shape=new Set(),linkKind=new Set(),remaining=[...items].sort((a,b)=>a[0].localeCompare(b[0],'en'));const chosen=[];
 while(remaining.length&&chosen.length<limit){
  remaining.sort((a,b)=>score(b[1])-score(a[1])||a[0].localeCompare(b[0],'en'));
  const [key,item]=remaining.shift();chosen.push(item);item.groups.areas.forEach(x=>area.add(x));item.groups.nameShapes.forEach(x=>shape.add(x));linkKind.add(item.groups.linkKind);
 }
 function score(x){return (linkKind.has(x.groups.linkKind)?0:3)+x.groups.areas.filter(v=>!area.has(v)).length*2+x.groups.nameShapes.filter(v=>!shape.has(v)).length;}
 return chosen;
}
const goldIds=new Set([...pool.values()].flatMap(v=>v.provenance.map(p=>p.googlePlaceId)));
const selected=[...choose([...pool].filter(([,x])=>x.platform==='TABELOG'),30),...choose([...pool].filter(([,x])=>x.platform==='TABLECHECK'),10),
 ...choose([...controls].filter(([,x])=>!x.provenance.some(p=>goldIds.has(p.googlePlaceId))),10).map((x,n)=>({...x,platform:n%2?'TABLECHECK':'TABELOG'}))];
const samples=selected.map((x,n)=>({id:'nr-'+String(n+1).padStart(3,'0'),...x}));
const dataset={schema:'name-resolution-benchmark@1',status:'PENDING_REVIEW',evidenceStatus:'exposed development inputs',samples};
const bytes=JSON.stringify(dataset,null,2)+'\n';writeFileSync(base+'/samples.json',bytes);
const summary={schema:'name-resolution-sample-freeze@1',status:'PENDING_REVIEW',sha256:createHash('sha256').update(bytes).digest('hex'),
 sourceManifestSha256:createHash('sha256').update(readFileSync(base+'/source-manifest.json')).digest('hex'),
 sources:manifest.sources.length,eligibleGold:{TABELOG:[...pool.values()].filter(x=>x.platform==='TABELOG').length,TABLECHECK:[...pool.values()].filter(x=>x.platform==='TABLECHECK').length},
 selected:{TABELOG:samples.filter(x=>x.role==='GOLD'&&x.platform==='TABELOG').length,TABLECHECK:samples.filter(x=>x.role==='GOLD'&&x.platform==='TABLECHECK').length,controls:samples.filter(x=>x.role==='CONTROL').length},
 exclusions:excluded,modelBudget:{A:150,B:100,BConditional:true,used:0},areas:[...new Set(samples.flatMap(x=>x.groups.areas))],shapes:[...new Set(samples.flatMap(x=>x.groups.nameShapes))],
 note:'TableCheck shortage is explicit; do not synthesize Gold. Control platform assigned alternately; no website or expected ID enters method input.'};
writeFileSync(base+'/sample-freeze.json',JSON.stringify(summary,null,2)+'\n');console.log(summary);
