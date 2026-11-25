// Existing public witness responses only. Does not read the private manifest/YAML.
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {independentVacancy,type G6Delivered} from '../../../src/eval/restaurant/agent-loop/g6/evaluator.js';
const original='/private/tmp/praxis-heldout-read-reliability/.eval-artifacts/phase3b/heldout-r2-certification';
const root='.eval-artifacts/phase3b/calendar-day-normalization-20261110';const sha=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex');
const raw=await readFile(original+'/certificates.json'),certificates=JSON.parse(raw.toString());const results=[];
for(const r of certificates.results){
 if(!r.bodyRef)throw Error('RECORDED_BODY_MISSING');const bytes=await readFile(original+'/'+r.bodyRef),meta=JSON.parse(await readFile(original+'/'+r.bodyRef+'.json','utf8'));
 if(sha(bytes)!==(meta.savedSHA256??meta.sha256))throw Error('RECORDED_BODY_SHA_MISMATCH');
 const u=new URL(meta.url),rawDate=u.searchParams.get('svd')!,rawTime=u.searchParams.get('svt')!;
 const expected:G6Delivered={candidateId:r.id,provider:'TABELOG',name:'Recorded public witness',sourceEntityId:u.searchParams.get('rst_id')!,date:rawDate.slice(0,4)+'-'+rawDate.slice(4,6)+'-'+rawDate.slice(6,8),time:rawTime.slice(0,2)+':'+rawTime.slice(2),partySize:Number(u.searchParams.get('svps'))};
 const read=independentVacancy({ref:r.bodyRef,phase:'BEFORE',url:meta.url,candidateId:r.id,body:JSON.parse(bytes.toString())},expected);
 results.push({id:r.id,originalExists:r.exists,exists:read.known?read.datedSlots!.some(s=>s.date===expected.date&&s.time===expected.time):null,reason:read.reason,slots:read.datedSlots,sourceBodySHA256:sha(bytes),originalResponseSHA256:r.responseSHA256,checkedAt:r.checkedAt});
}
await writeFile(root+'/certificates.offline.json',JSON.stringify({mode:'OFFLINE_REINTERPRETATION_NOT_A_NEW_READ',originalCertificateSHA256:sha(raw),results,GET:0,model:0,Live:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results.map(({id,originalExists,exists})=>({id,originalExists,exists}))));
