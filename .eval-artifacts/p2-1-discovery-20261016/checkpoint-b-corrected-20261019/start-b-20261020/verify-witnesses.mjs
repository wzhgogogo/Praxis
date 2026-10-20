// Offline independent binding checks; never opens a source URL or booking link.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const base=resolve('.eval-artifacts/p2-1-discovery-20261016'),output=resolve(base,'checkpoint-b-corrected-20261019/start-b-20261020');
const bytes=await readFile(resolve(output,'witnesses.certified.json')),registry=JSON.parse(bytes),plan=JSON.parse(await readFile(resolve(base,'witness-certification-plan.json')));
const rows=[];
for(const expected of plan.variants){
 const variant=registry.variants.find(v=>v.caseId===expected.caseId);if(!variant)throw Error('MISSING_REGISTERED_CASE');
 const ids=expected.witnesses.map(w=>new URL(w.sourceUrl).pathname.match(/(\d{8})\/$/)[1]).sort();
 if(ids.join()!==variant.allRegisteredWitnesses.map(w=>w.rst_id).sort().join())throw Error('REGISTERED_WITNESS_SET_CHANGED');
 for(const row of variant.allRegisteredWitnesses){
  const raw=await readFile(resolve(base,row.inventory.bodyPath)),sha256=createHash('sha256').update(raw).digest('hex');
  if(sha256!==row.inventory.sha256)throw Error('RAW_WITNESS_SHA_MISMATCH');
  let body;try{body=JSON.parse(raw.toString())}catch{}
  const date=body?.base_date,actualDate=date?`${date.year}${String(date.month).padStart(2,'0')}${String(date.day).padStart(2,'0')}`:null;
  const matches=actualDate===expected.date.replaceAll('-','')&&Number(body?.members)===expected.partySize;
  const slot=Object.values(body?.selection??{}).find(slot=>slot?.time===expected.time);
  let bound=false;if(slot?.url){const url=new URL(slot.url,'https://tabelog.com');bound=url.origin==='https://tabelog.com'&&url.searchParams.get('rcd')===row.rst_id&&url.searchParams.get('member')===String(expected.partySize)&&url.searchParams.get('visit_date')===expected.date.replaceAll('-','')&&url.searchParams.get('visit_time')===expected.time.replace(':','');}
  if(row.classification==='KNOWN_FEASIBLE_SUPPORTED'&&(!matches||!bound||row.inventory.status!==200))throw Error('CERTIFIED_WITNESS_REQUEST_BINDING_FAILED');
  rows.push({caseId:expected.caseId,rst_id:row.rst_id,sha256,rawDate:actualDate,rawParty:body?.members??null,requestMatches:matches,requestedSlotAndLinkBound:bound,classification:row.classification});
 }
 if(!variant.witnesses.length)throw Error('NO_CURRENT_CERTIFIED_WITNESS: '+variant.caseId);
}
const result={status:'PASS',registrySha256:createHash('sha256').update(bytes).digest('hex'),registered:rows.length,checks:['registered sets retained','every raw response SHA verified','certified date/party and requested slot merchant/date/party/time link bound without opening it'],rows};
await writeFile(resolve(output,'witness-certification/verification.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:result.status,registered:rows.length}));
