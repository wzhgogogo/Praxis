import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {locateNamedSourceFragment} from '../../../src/integrations/restaurant-search/named-source-query.ts';
const root='.eval-artifacts/phase3b/c-batch3',prior='.eval-artifacts/phase3b/c-batch2';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const subjects=load(`${prior}/subjects.json`).subjects;
const fragments=JSON.parse(load(`${prior}/retrieval-inputs/fragment.response.json`).outputText).samples;
const attempted=new Set(load(`${prior}/search/execution.json`).results.filter(r=>r.ledgerId).map(r=>r.subjectId));
const queries=[];
for(const old of load(`${prior}/queries.materialized.json`).queries.filter(q=>q.subjectId.startsWith('nr-')&&!attempted.has(q.subjectId))){
  const subject=subjects.find(s=>s.id===old.subjectId);assert(subject);
  if(old.variant==='MODEL_FRAGMENT'){
    const proposal=fragments.find(p=>p.id===old.subjectId);assert(proposal);
    const located=locateNamedSourceFragment({restaurant:{outletName:subject.subject.name,address:subject.subject.address}},{field:proposal.field,fragment:proposal.fragment});assert(located);
    queries.push({subjectId:old.subjectId,cohort:old.cohort,variant:old.variant,query:located.query,provenance:{kind:'ORIGINAL_GOOGLE_FRAGMENT_CODE_LOCATED',...located}});
  }else{
    const raw=load(old.provenance.raw);assert.equal(raw.id,subject.googlePlaceId);assert.equal(raw.displayName.text,old.query);
    queries.push(old);
  }
}
const input={schema:'phase3b-c-optional-queries@1',selection:'First12 by existing sample order among never-requested historical alternatives. Previous failed nr003 is not retried; no fishing after results.',
  intervalMs:30000,timeoutMs:20000,maximumRequests:12,excludedPreviouslyAttempted:[...attempted].filter(id=>id.startsWith('nr-')),queries:queries.slice(0,12),unselectedForBatchCap:queries.slice(12)};
assert.equal(input.queries.length,12);
writeFileSync(`${root}/optional-queries.json`,JSON.stringify(input,null,2)+'\n');
console.log(JSON.stringify({selected:input.queries.map(q=>q.subjectId),notRetried:input.excludedPreviouslyAttempted,notSelected:input.unselectedForBatchCap.map(q=>q.subjectId)}));
