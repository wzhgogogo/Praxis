import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const entry=new URL('../../../../.eval-artifacts/phase2b-exit-pipeline-20261022/inputs.mjs',import.meta.url).href;
const {loadCommittedCases}=await import(entry);
const root='.eval-artifacts/phase2-holdout';
test('Phase2b input gate stops on the actual exposed non-string required_claims, before date conversion',()=>{
 const bytes=readFileSync(root+'/holdout.yaml'),commitment=JSON.parse(readFileSync(root+'/commitment.json','utf8'));
 assert.throws(()=>loadCommittedCases(bytes,commitment),/required_claims\[1\].*string/);
});
const dir='.eval-artifacts/phase2b-exit-pipeline-20261022';
const inputs=await import(new URL('../../../../.eval-artifacts/phase2b-exit-pipeline-20261022/inputs.mjs',import.meta.url).href);
const witnesses=await import(new URL('../../../../.eval-artifacts/phase2b-exit-pipeline-20261022/witnesses.mjs',import.meta.url).href);
const pipeline=await import(new URL('../../../../.eval-artifacts/phase2b-exit-pipeline-20261022/execution.mjs',import.meta.url).href);
const {mkdtempSync,rmSync}=await import('node:fs');
const {tmpdir}=await import('node:os');
const {join}=await import('node:path');
const get=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const exposed=()=>loadCommittedCases(readFileSync(dir+'/old-exposed-recovered.yaml'),get(dir+'/old-exposed-recovered.commitment.json'));
const old='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022';

test('Phase2b commitment gate precedes parsing, detects file and per-document tampering, rejects unknown/null/condition objects',()=>{
 const raw=readFileSync(root+'/holdout.yaml'),commit=get(root+'/commitment.json');
 assert.equal(commit.fileSha256,'cb0efa949f21fc0c19c7a6fd48e6a51c1848bb722c795b0ccd51213c43ecb98e','independent literal oracle');
 assert.throws(()=>loadCommittedCases(Buffer.from('not: [valid YAML\n'),commit),/FILE_SHA_MISMATCH_BEFORE_YAML_PARSE/);
 const bad=structuredClone(commit);bad.caseSha256['p2-holdout-04']='0'.repeat(64);assert.throws(()=>loadCommittedCases(raw,bad),/CASE_SHA_MISMATCH_BEFORE_YAML_PARSE/);
 const c=exposed()[0];
 for(const [key,value]of [['value',{}],['polarity',null],['strength',3]] as const){const x=structuredClone(c);x.semantic.criteria[0][key]=value;assert.throws(()=>inputs.validateCase(x),/expected nonempty string/);}
 const extra=structuredClone(c);extra.semantic.criteria[0].guess='value';assert.throws(()=>inputs.validateCase(extra),/unknown field/);
 const unknown=structuredClone(c);unknown.acceptance.required_claims[0]=null;assert.throws(()=>inputs.validateCase(unknown),/required_claims\[0\].*string/);
});
test('Phase2b first weekday 7–14 Tokyo days, approved fallback only, and Runner-compatible dates are independently fixed',async()=>{
 const cases=exposed(),out=inputs.materializeCases(cases,'2026-10-22T00:00:00+09:00');
 assert.deepEqual(out.changes.map((r:any)=>r.date),['2026-11-04','2026-10-30','2026-10-29','2026-11-03','2026-10-31','2026-10-30']);
 assert.equal(out.cases[0].semantic.date.expression,'Wednesday, November 4');assert.equal(out.cases[0].semantic.location.value,'Ueno');assert.equal(out.cases[1].semantic.location.value,'Jiyugaoka');
 assert.equal(inputs.materializeCases(cases,'2026-10-22T15:30:00Z').changes[0].offsetDays,12,'Tokyo midnight boundary');
 assert.throws(()=>inputs.materializeCases(cases,'2026-10-22'),/EXPLICIT_EXIT_TIMESTAMP/);
 assert.throws(()=>inputs.materializeCases(cases,'2026-10-22T00:00:00+09:00',[{caseId:cases[0].id,place:'Wrong'}]),/ONLY_LISTED_FALLBACK/);
 const {loadFrozenLiveCases}=await import('./live-case-materializer.js');const runner=await loadFrozenLiveCases(dir+'/rehearsal-inputs/runner-input.yaml');assert.equal(runner.length,6);assert.equal(runner[1]!.content?.toString().includes('Sangenjaya'),true);
 const searches=witnesses.witnessSearchPlan(out.cases);assert.ok(!searches.variants[4].searchQuery.includes('Sichuan'));assert.equal(searches.sourceRules.radiusMeters,800);
});
test('Phase2b saved merchant/inventory certification enforces radius, raw HARD quote and independently reviewed negative evidence',()=>{
 const sources=get(dir+'/rehearsal-sources.json'),plan=get(sources.oldWitnessPlan),inventory=get(sources.oldInventoryIndex);
 const result=witnesses.certifySavedWitnesses(plan,inventory);assert.equal(result.status,'ALL_SIX_WITNESSES_CERTIFIED');assert.deepEqual(result.variants.map((v:any)=>v.witnesses.length),[3,3,2,3,1,2]);
 const far=structuredClone(plan);far.variants[0].center.latitude+=1;assert.throws(()=>witnesses.certifySavedWitnesses(far,inventory),/WITNESS_OUTSIDE_800M/);
 const missing=structuredClone(plan);delete missing.variants[4].witnesses[0].hardCriteria.find((h:any)=>h.polarity==='NEGATIVE').adjudication;assert.throws(()=>witnesses.certifySavedWitnesses(missing,inventory),/NEGATIVE_HARD_REVIEW_REQUIRED/);
 const quote=structuredClone(plan);quote.variants[0].witnesses[0].hardCriteria[0].quote='Unobserved invented merchant statement';assert.throws(()=>witnesses.certifySavedWitnesses(quote,inventory),/RAW_MERCHANT_QUOTE_REQUIRED/);
 const request=structuredClone(plan);request.variants[0].date='2026-12-31';assert.throws(()=>witnesses.certifySavedWitnesses(request,inventory),'old date inventory cannot certify another request');
});
test('Phase2b source reads share origin clock; 403/busy wait 15 minutes once, transport failure waits 2 minutes, writes are blocked',async()=>{
 let time=0,calls=0;const seen:number[]=[];const read=witnesses.sourceReader({now:()=>time,sleep:async(ms:number)=>{time+=ms;},transport:async()=>{seen.push(time);return new Response(++calls===1?'現在アクセスが集中しています':'{}',{status:200});}});
 const page='https://tabelog.com/en/tokyo/A1302/A130204/13022072/';await read(page);assert.deepEqual(seen,[0,900000]);await read(page);assert.equal(seen[2],930000);
 await assert.rejects(()=>read('https://tabelog.com/en/booking/confirm',{method:'POST'}),/READ_ONLY_SOURCE_REQUIRED/);assert.equal(calls,3);
 let failures=0;const fail=witnesses.sourceReader({now:()=>time,sleep:async(ms:number)=>{time+=ms;},transport:async()=>{failures++;return new Response('busy',{status:503});}});const start=time;await assert.rejects(()=>fail(page),/SOURCE_COOLDOWN_RETRY_EXHAUSTED/);assert.equal(failures,2);assert.equal(time-start,900000);
 let tries=0;const retry=witnesses.sourceReader({now:()=>time,sleep:async(ms:number)=>{time+=ms;},transport:async()=>{if(++tries===1)throw Error('fixture connection error');return new Response('{}');}});const before=time;await retry(page);assert.equal(tries,2);assert.equal(time-before,120000);
 const prior=time,continued=witnesses.sourceReader({initialFinishedByOrigin:{'https://tabelog.com':time},now:()=>time,sleep:async(ms:number)=>{time+=ms;},transport:async()=>new Response('{}')});await continued(page);assert.equal(time-prior,30000,'next capture command inherits the source clock');
});
test('Phase2b 18 slots preserve order/budgets; S0 and witness expiry stop the remaining batch',async()=>{
 const plan=get(dir+'/rehearsal-inputs/plan.json'),registry=get(dir+'/rehearsal-registry.json');pipeline.verifyPlan(plan);assert.equal(plan.runs.length,18);assert.equal(plan.ceilings.decisionTimeoutMs,30000);
 const bad=structuredClone(plan);bad.runs[1].caseId=bad.runs[0].caseId;assert.throws(()=>pipeline.verifyPlan(bad));
 const tmp=mkdtempSync(join(tmpdir(),'phase2b-controls-'));
 try{
  let now=Date.parse(registry.earliestWitnessObservedAt)+3600000,calls=0;const args={plan:{...plan,mode:'OFFLINE_SAVED_REPLAY'},registry,now:()=>now,sleep:async(ms:number)=>{now+=ms;},attempt:async()=>{calls++;now+=10;return {classification:'DEFERRED',s0:true};}};
  const stop=await pipeline.executePlan({...args,directory:join(tmp,'s0')});assert.equal(calls,1);assert.equal(stop.stop.reason,'S0');
  const expired=await pipeline.executePlan({...args,directory:join(tmp,'expired'),now:()=>Date.parse(registry.validUntil)});assert.equal(expired.recordedSlots,0);assert.equal(calls,1);
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
test('Phase2b wording pack contains no results; budgets correspond by numeric fields and independent review blocks evaluation',async()=>{
 const sources=get(dir+'/rehearsal-sources.json');const manifest={attempts:sources.runs.map((r:any)=>({...r,attempt:1}))};const budgets=get(dir+'/old-budget-bindings.json');
 const pack=pipeline.extractPending(manifest,budgets);assert.equal(pack.structuredBindings.length,3);assert.ok(pack.structuredBindings.every((b:any)=>b.status==='STRUCTURED_FIELDS_MATCH'));
 assert.ok(!JSON.stringify(pack.pending).includes('QUALIFIED_DELIVERY'));assert.ok(!JSON.stringify(pack.pending).includes('presentedResults'));assert.ok(!JSON.stringify(pack.pending).includes('conditionStates'));
 assert.ok(pack.pending.entries.every((e:any)=>!e.candidateWordingPairs.some((p:any)=>e.caseId==='p2-holdout-02'&&p.goldIndex===1)));
 const approved=get(sources.oldWordings),review={status:'APPROVED_BY_INDEPENDENT_REVIEWER',pendingSha256:inputs.sha(JSON.stringify(pack.pending)),reviewPath:approved.reviewPath,reviewSha256:approved.reviewSha256,decisions:approved.decisions};
 const tmp=mkdtempSync(join(tmpdir(),'phase2b-review-'));let evaluations=0;
 try{
  await assert.rejects(()=>pipeline.evaluateReviewed({pending:pack.pending,review:{...review,decisions:[]},manifest,directory:join(tmp,'blocked'),evaluate:()=>{evaluations++;}}),/AWAITING_INDEPENDENT_WORDING_REVIEW/);assert.equal(evaluations,0);
  pipeline.requireWordingReview(pack.pending,review);
  const tampered=structuredClone(pack.pending);tampered.entries[0].artifactSha256='0'.repeat(64);assert.throws(()=>pipeline.requireWordingReview(tampered,review),/REVIEW_PENDING_SHA/);
  const changed=get(dir+'/old-budget-bindings.json');changed[0].expected.max=7000;const mismatch=pipeline.extractPending(manifest,changed);assert.ok(mismatch.structuredBindings.every((b:any)=>b.status==='STRUCTURED_FIELDS_MISSING_OR_DIFFERENT'));
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
