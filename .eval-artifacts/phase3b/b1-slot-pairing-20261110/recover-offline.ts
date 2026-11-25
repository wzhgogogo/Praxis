// Original public D02 records only; no transports/model imports, no original overwrite.
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {evaluateG6,type G6EvaluationInput} from '../../../src/eval/restaurant/agent-loop/g6/evaluator.js';
const slot='.eval-artifacts/phase3b/category-discovery-cost-20261110/runtime/D02/D02',root='.eval-artifacts/phase3b/b1-slot-pairing-20261110';
const digest=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const raw=await readFile(slot+'/failure.evaluation.input.json'),input=JSON.parse(raw.toString()) as G6EvaluationInput;
const failureRaw=await readFile(slot+'/failure.json'),failure=JSON.parse(failureRaw.toString());
// These exact IDs already exist on recorded product offers and handoffs.
// No parsing of synthetic ID strings and no new business assertion.
for(const d of input.delivered){const offers=failure.view.restaurant.availability[d.candidateId]??[];const matches=offers.filter((o:any)=>o.source===d.provider&&o.dateTime.slice(0,10)===d.date&&o.dateTime.slice(11,16)===d.time&&o.partySize===d.partySize);if(matches.length!==1)throw Error('RECORDED_OFFER_ID_UNBOUND');d.offerId=matches[0].id;}
const responseAudit=[];
for(const v of input.vacancy.filter(v=>v.phase==='AFTER')){const bytes=await readFile(v.ref),meta=JSON.parse(await readFile(v.ref+'.json','utf8'));if(meta.sha256!==digest(bytes)||meta.url!==v.url||JSON.stringify(JSON.parse(bytes.toString()))!==JSON.stringify(v.body))throw Error('POST_RESPONSE_BYTES_MISMATCH');responseAudit.push({ref:v.ref,sha256:digest(bytes),url:v.url});}
if(responseAudit.length!==2)throw Error('TWO_RECORDED_POST_RESPONSES_REQUIRED');
const source=input.vacancy.filter(v=>v.phase==='SOURCE_CAPTURE'&&new URL(v.url).searchParams.get('svps')==='6'&&new URL(v.url).searchParams.get('svt')==='1900');
const links=input.handoffs.map(h=>({offerId:h.offerId,url:h.url,sourceRefs:source.filter(s=>{const selection=(s.body as {selection:unknown}).selection;const values=Array.isArray(selection)?selection:Object.values(selection as object);return values.some((r:any)=>typeof r.url==='string'&&(r.url.startsWith('/')?'https://tabelog.com'+r.url:r.url)===h.url);}).map(v=>v.ref)}));
const result=evaluateG6(input);
await writeFile(slot+'/evaluation.offline-recovery-2.input.json',JSON.stringify(input,null,2)+'\n',{flag:'wx'});
await writeFile(slot+'/evaluation.offline-recovery-2.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
await writeFile(root+'/recovery-provenance.json',JSON.stringify({sourceInputSHA256:digest(raw),originalFailureSHA256:digest(failureRaw),recordedOfferIdsProjected:true,responseAudit,source1900Links:links,allFiveOriginalLinks:links.length===5&&links.every(l=>l.sourceRefs.length),GET:0,models:0,Live:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verdict:result.verdict,checks:result.checks.filter(c=>c.status!=='PASS').map(c=>({rule:c.rule,status:c.status,reason:c.reason})),allFiveOriginalLinks:links.every(l=>l.sourceRefs.length)}));
// Any S0 is a stop, never a trigger for another repair/re-run in this script.
if(result.verdict.s0)process.exitCode=2;
