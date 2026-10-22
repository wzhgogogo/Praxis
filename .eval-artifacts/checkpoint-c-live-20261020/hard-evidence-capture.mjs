// Bind executed saved HTML to the independent evaluator; no production parser or source read.
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative,dirname,join} from 'node:path';
import {sha,base} from './freeze.mjs';
export function captureHardEvidence({artifact,artifactSha256,directory,registryPath,stem}){
 const output=resolve(directory,stem+'.hard-evidence.json'),snapshots=[],witnesses=[],gaps=[];
 const facts=(artifact.finalSnapshot?.domainState?.readEvidence??[]).filter(f=>f.kind==='RESTAURANT_FACT'&&f.provider==='TABELOG');
 const root=resolve(directory,'recordings'),recordings=[];
 if(existsSync(root))for(const entry of readdirSync(root,{withFileTypes:true})){const p=join(root,entry.name,'recording.json');if(entry.isDirectory()&&existsSync(p)){const bytes=readFileSync(p);recordings.push({path:p,bytes,value:JSON.parse(bytes)});}}
 if(recordings.length>1)throw Error('AMBIGUOUS_HARD_RECORDING');
 const recording=recordings[0],traces=(artifact.diagnostics?.browserTrace??[]).filter(t=>t.kind==='SNAPSHOT');
 if(recording)for(const fact of facts){
  const eligible=recording.value.documents.filter(d=>d.url===fact.sourceUrl&&traces[d.snapshot-1]&&Date.parse(traces[d.snapshot-1].at)<=Date.parse(fact.observedAt));
  const doc=eligible.at(-1);if(!doc){gaps.push({evidenceId:fact.evidenceId,reason:'NO_SAVED_EXECUTED_SNAPSHOT'});continue;}
  const trace=traces[doc.snapshot-1],stored=recording.value.entries.filter(t=>t.kind==='SNAPSHOT')[doc.snapshot-1];
  if(trace.detail.url!==doc.url||stored?.detail.url!==doc.url||trace.detail.htmlSha256!==stored.detail.htmlSha256)throw Error('HARD_SNAPSHOT_EXECUTION_BINDING_MISMATCH');
  const p=join(dirname(recording.path),doc.file),html=readFileSync(p);
  snapshots.push({candidateId:fact.candidateId,evidenceId:fact.evidenceId,provider:fact.provider,sourceUrl:fact.sourceUrl,observedAt:fact.observedAt,path:relative(directory,p),sha256:sha(html),snapshot:doc.snapshot,runtimeHtmlSha256:trace.detail.htmlSha256,recordingPath:relative(directory,recording.path),recordingSha256:sha(recording.bytes)});
 }
 // Only the reviewed C certification is eligible for manual interpretation.
 // New holdout certification is not silently treated as reviewer annotation.
 const reviewedRegistry=resolve(base,'checkpoint-c-rerun-20261021/registry.certified.json');
 if(registryPath&&resolve(registryPath)===reviewedRegistry){
  const certificationBytes=readFileSync(registryPath),registry=JSON.parse(certificationBytes),variant=registry.variants.find(v=>v.caseId===artifact.caseId);
  const reviewPath=resolve(base,'checkpoint-c-continuation-20261021/independent-review.md'),reviewBytes=readFileSync(reviewPath);
  const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]+/gu,' ').trim();
  const plain=s=>s.replace(/<[^>]*>/g,' ').replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&#39;',"'").replace(/\s+/g,' ').trim();
  if(variant)for(const witness of variant.witnesses.filter(w=>w.classification==='KNOWN_FEASIBLE_SUPPORTED'))for(const h of witness.hardEvidence??[]){
   if(!artifact.materializedCase.semantic.criteria.some(c=>c.strength==='HARD'&&c.polarity==='POSITIVE'&&norm(c.value)===norm(h.criterion)))continue;
   const url=h.url??witness.sourceUrl;let source;
   for(const ref of (witness.observationRefs??[]).filter(r=>r.kind==='HARD')){const p=resolve(ref.path),bytes=readFileSync(p);if(sha(bytes)!==ref.fileSha256)throw Error('CERTIFIED_HARD_RAW_CHANGED');const raw=JSON.parse(bytes);if(raw.url===url&&raw.evidence?.rawQuotes?.some(q=>plain(q.raw)===plain(h.quote)))source={path:p,sha256:sha(bytes)};}
   if(!source){gaps.push({rst_id:witness.rst_id,criterion:h.criterion,reason:'CERTIFIED_QUOTE_NOT_RETAINED_IN_CURRENT_RAW; no inferred support'});continue;}
   const prefix=witness.sourceUrl.replace(/\/$/,'')+'/';
   for(const candidateId of new Set(facts.filter(f=>f.sourceUrl===prefix||f.sourceUrl?.startsWith(prefix+'party/')).map(f=>f.candidateId)))witnesses.push({candidateId,sourceUrl:url,criterion:h.criterion,quote:h.quote,caseId:artifact.caseId,date:variant.date,time:variant.earliest,partySize:variant.partySize,artifactSha256,path:relative(directory,source.path),sha256:source.sha256,reviewedBy:'INDEPENDENT_REVIEWER',reviewPath:relative(directory,reviewPath),reviewSha256:sha(reviewBytes),certificationPath:relative(directory,resolve(registryPath)),certificationSha256:sha(certificationBytes)});
  }
 }
 writeFileSync(output,JSON.stringify({schema:'restaurant-hard-criterion-evidence@1',runs:[{artifactSha256,snapshots,witnesses}]},null,2)+'\n',{flag:'wx'});
 writeFileSync(resolve(directory,stem+'.hard-evidence-audit.json'),JSON.stringify({artifactSha256,snapshots:snapshots.length,witnesses:witnesses.length,gaps,network:0,models:0},null,2)+'\n',{flag:'wx'});
 return output;
}
