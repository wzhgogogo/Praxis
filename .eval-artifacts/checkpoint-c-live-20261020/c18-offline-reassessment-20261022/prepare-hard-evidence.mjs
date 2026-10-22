import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadHardCriterionEvidence} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.ts';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c18-offline-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const relative=p=>path.relative(dir,p),local=p=>path.relative(process.cwd(),path.resolve(p));
const registryPath=`${base}/checkpoint-c-rerun-20261021/registry.certified.json`,registryBytes=await fs.readFile(registryPath),registry=JSON.parse(registryBytes);
const priorFreeze=await read(`${base}/checkpoint-c-rerun-20261021/live-freeze.json`);
assert.equal(sha(registryBytes),priorFreeze.files[registryPath]);
const input=await read(`${dir}/c18-inputs.json`),runs=[],audit=[];
const norm=s=>s.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[\p{P}\p{Z}\s]+/gu,' ').trim();
const plain=s=>s.replace(/<[^>]*>/g,' ').replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&#39;',"'").replace(/\s+/g,' ').trim();
for(const row of input.runs){
 const bytes=await fs.readFile(row.artifactPath);assert.equal(sha(bytes),row.artifactSha256);const a=JSON.parse(bytes);
 const facts=a.finalSnapshot.domainState.readEvidence.filter(e=>e.kind==='RESTAURANT_FACT'&&e.provider==='TABELOG');
 const snapshots=[],witnesses=[],bindings=[];let recordingPath,recording,recBytes;
 const recRoot=`${row.attempt}/recordings`;
 try{for(const name of await fs.readdir(recRoot)){const p=`${recRoot}/${name}/recording.json`;try{const b=await fs.readFile(p);assert.ok(!recordingPath,'Multiple recording manifests');recordingPath=p;recBytes=b;recording=JSON.parse(b);}catch(e){if(e.code!=='ENOENT')throw e;}}}catch(e){if(e.code!=='ENOENT')throw e;}
 const rawSnapshots=(a.diagnostics?.browserTrace??[]).filter(t=>t.kind==='SNAPSHOT');
 if(recording){
  const savedSnapshots=recording.entries.filter(t=>t.kind==='SNAPSHOT');
  for(const fact of facts){
   const eligible=recording.documents.filter(d=>d.url===fact.sourceUrl&&rawSnapshots[d.snapshot-1]&&Date.parse(rawSnapshots[d.snapshot-1].at)<=Date.parse(fact.observedAt));
   const doc=eligible.at(-1);if(!doc){bindings.push({evidenceId:fact.evidenceId,status:'NO_SAVED_SNAPSHOT',sourceUrl:fact.sourceUrl});continue;}
   const trace=rawSnapshots[doc.snapshot-1],stored=savedSnapshots[doc.snapshot-1];assert.equal(trace.detail.url,doc.url);assert.equal(stored.detail.url,doc.url);assert.equal(trace.detail.htmlSha256,stored.detail.htmlSha256);
   const p=path.join(path.dirname(recordingPath),doc.file),html=await fs.readFile(p);
   const binding={candidateId:fact.candidateId,evidenceId:fact.evidenceId,provider:fact.provider,sourceUrl:fact.sourceUrl,observedAt:fact.observedAt,path:relative(p),sha256:sha(html),snapshot:doc.snapshot,runtimeHtmlSha256:trace.detail.htmlSha256,recordingPath:relative(recordingPath),recordingSha256:sha(recBytes)};
   snapshots.push(binding);bindings.push({...binding,snapshotObservedAt:trace.at,factToSnapshotDeltaMs:Date.parse(fact.observedAt)-Date.parse(trace.at),selectedModelQuotes:Array.isArray(fact.claims?.restaurantTypeFacts)});
  }
 }
 const variant=registry.variants.find(v=>v.caseId===row.caseId);assert.ok(variant);assert.equal(variant.date,a.materializedCase.semantic.date.value);assert.equal(variant.partySize,a.materializedCase.semantic.party_size);
 const skipped=[];
 for(const witness of variant.witnesses){
  if(witness.classification!=='KNOWN_FEASIBLE_SUPPORTED'){skipped.push({rst_id:witness.rst_id,reason:'NOT_CERTIFIED'});continue;}
  for(const h of witness.hardEvidence??[]){
   if(!a.materializedCase.semantic.criteria.some(c=>c.strength==='HARD'&&c.polarity==='POSITIVE'&&norm(c.value)===norm(h.criterion)))continue;
   const sourceUrl=h.url??witness.sourceUrl,refs=(witness.observationRefs??[]).filter(r=>r.kind==='HARD');let source;
   for(const ref of refs){const p=local(ref.path),b=await fs.readFile(p);assert.equal(sha(b),ref.fileSha256);const r=JSON.parse(b);if(r.url===sourceUrl&&r.evidence?.rawQuotes?.some(q=>plain(q.raw)===plain(h.quote)))source={path:p,sha256:sha(b)};}
   if(!source){skipped.push({rst_id:witness.rst_id,criterion:h.criterion,reason:'REGISTERED_QUOTE_NOT_RETAINED_AS_CURRENT_RAW_QUOTE; no manual HARD input added'});continue;}
   const baseUrl=witness.sourceUrl.replace(/\/$/,'')+'/';
   const candidates=[...new Set(facts.filter(f=>f.sourceUrl===baseUrl||f.sourceUrl?.startsWith(baseUrl+'party/')).map(f=>f.candidateId))];
   for(const candidateId of candidates)witnesses.push({candidateId,sourceUrl,criterion:h.criterion,quote:h.quote,caseId:row.caseId,date:variant.date,time:variant.earliest,partySize:variant.partySize,artifactSha256:row.artifactSha256,path:relative(source.path),sha256:source.sha256,reviewedBy:'INDEPENDENT_REVIEWER',reviewPath:relative(input.review.path),reviewSha256:input.review.sha256,certificationPath:relative(registryPath),certificationSha256:sha(registryBytes)});
  }
 }
 runs.push({artifactSha256:row.artifactSha256,snapshots,witnesses});audit.push({runId:row.runId,artifactSha256:row.artifactSha256,snapshots:bindings,witnesses:witnesses.map(w=>({candidateId:w.candidateId,criterion:w.criterion,quote:w.quote,sourceUrl:w.sourceUrl,path:w.path,sha256:w.sha256})),skipped});
}
const manifest={schema:'restaurant-hard-criterion-evidence@1',runs};
await fs.writeFile(`${dir}/hard-evidence.json`,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
for(const row of input.runs)loadHardCriterionEvidence(`${dir}/hard-evidence.json`,row.artifactSha256);
await fs.writeFile(`${dir}/hard-evidence-audit.json`,JSON.stringify({status:'PASS',mode:'OFFLINE_INPUT_PREPARATION',review:input.review,certification:{path:registryPath,sha256:sha(registryBytes)},scope:'Current C18 recorded HTML and only current certified positive-HARD literal witness quotes. Reviewer/user-authorized reuse of that certification, not new type inference or any old quick-run exception. Noncertified Komuro excluded; negative exclusion labels not converted to positive evidence.',runs:audit,models:0,websites:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',runs:runs.length,snapshots:runs.reduce((n,r)=>n+r.snapshots.length,0),witnesses:runs.reduce((n,r)=>n+r.witnesses.length,0),currentCertificationSha256:sha(registryBytes)}));
