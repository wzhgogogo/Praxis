import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {parseTabelogSourceFieldQuotes} from '../../../src/integrations/tabelog/tabelog-page-parser.js';
const root=resolve('src/application/fixtures/restaurant-presentation-evidence');
const dir=resolve(root,'checkpoint-c-live-20261020/c18-offline-reassessment-20261022');
const hard=JSON.parse(readFileSync(resolve(dir,'hard-evidence.json'),'utf8'));
const inputs=JSON.parse(readFileSync(resolve(dir,'c18-inputs.json'),'utf8'));
const hash=(s:Buffer|string)=>createHash('sha256').update(s).digest('hex');
const git=(path:string)=>execFileSync('git',['show','db1f44a2238b44fa92cff58dae4e17e8903875a5:'+path],{maxBuffer:64_000_000});
const quick='.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/recordings/hybrid-1792581432961';
const recording=JSON.parse(git(quick+'/recording.json').toString());
const files=[resolve(root,'checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.result.json.gz'),...inputs.runs.map((r:any)=>resolve(root,r.artifactPath)+(r.artifactPath.endsWith('.gz')?'':'.gz'))];
const rows:any[]=[];const misses:any[]=[];
const key=(s:string)=>s.normalize('NFKC').replace(/\s+/gu,'');
for(const file of [...new Set(files)].filter(f=>existsSync(f)||existsSync(f.replace(/\.gz$/,''))) as string[]){
 let bytes:Buffer;try{bytes=readFileSync(file)}catch{bytes=readFileSync(file.replace(/\.gz$/,''))};if(file.endsWith('.gz')&&bytes[0]===31)bytes=gunzipSync(bytes);
 const a=JSON.parse(bytes.toString());const state=a.finalSnapshot.domainState;
 const cited=new Set(state.readEvidence.filter((e:any)=>e.provider==='MODEL_JUDGMENT'&&state.presentedResults?.candidateIds.includes(e.candidateId)&&e.claims.verifiedHardCriteria?.length).flatMap((e:any)=>e.claims.supportingEvidenceIds));
 for(const fact of state.readEvidence.filter((e:any)=>cited.has(e.evidenceId)&&e.claims.sourceStatementIds?.length)){
  const bindings=(hard.runs.find((r:any)=>r.artifactSha256===hash(bytes))?.snapshots??[]).filter((s:any)=>s.evidenceId===fact.evidenceId);
  const pages=bindings.map((b:any)=>{const path=resolve(dir,b.path), saved='.eval-artifacts/'+path.slice(root.length+1);return {path:existsSync(path)?path:saved,sha256:b.sha256,html:existsSync(path)?readFileSync(path,'utf8'):git(saved).toString(),source:existsSync(path)?'existing product fixture':'db1f44a2238b44fa92cff58dae4e17e8903875a5'};});
  if(file.includes('quick-live-results'))for(const doc of recording.documents.filter((d:any)=>d.url===fact.sourceUrl)){
   const path=quick+'/'+doc.file,html=git(path).toString();pages.push({path,sha256:hash(html),html,source:'db1f44a2238b44fa92cff58dae4e17e8903875a5'});
  }
  const fields:any[]=[];const sources:any[]=[];
  for(const page of pages){
   if(hash(page.html)!==page.sha256)throw Error('SOURCE_SHA_MISMATCH');
   const parsed=parseTabelogSourceFieldQuotes({url:fact.sourceUrl,title:'',text:'',html:page.html});
   const selected=parsed.flatMap(q=>(fact.claims.restaurantTypeFacts as string[]).flatMap(text=>key(text).includes(key(q.quote))?[q]:key(q.quote).includes(key(text))?[{...q,quote:q.quote.includes('\n')?q.quote:text}]:[]));
   if(selected.length){fields.push(...selected);sources.push({path:page.path.startsWith(root)?page.path.slice(root.length+1):page.path,source:page.source,sha256:page.sha256});}
  }
  const unique=[...new Map(fields.map(q=>[JSON.stringify(q),q])).values()];
  if(!unique.length){misses.push({evidenceId:fact.evidenceId,runId:a.runId});continue;}
  rows.push({runId:a.runId,artifactSha256:hash(bytes),evidenceId:fact.evidenceId,sourceUrl:fact.sourceUrl,selectedTextSha256:hash(JSON.stringify(fact.claims.restaurantTypeFacts)),sourceFieldQuotes:unique,sources});
 }
}
writeFileSync(resolve(root,'hard-source-roles-20261103.json'),JSON.stringify({status:'frozen regression; exposed historical source role restoration only',collectedAt:'2026-10-21',generatedAt:'2026-11-03 CET',rows:[...new Map(rows.map(r=>[r.runId+":"+r.evidenceId,r])).values()]},null,2)+'\n');
console.log(JSON.stringify({rows:rows.length,misses},null,2));
