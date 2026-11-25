import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import type {ModelResponse} from '../core/model/contracts.js';
import type {RestaurantAgentLoopRuntime} from './restaurant-agent-loop.js';
import {StaleTaskVersionError} from './persistent-restaurant-agent.js';
import {bookingTermsComposition,cancellationAnswer} from './fixtures/booking-terms-composition.js';

const latch=()=>{let resolve!:()=>void;const promise=new Promise<void>(r=>{resolve=r;});return {promise,resolve};};
async function bounded<T>(work:Promise<T>):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Fixture boundary not reached')),10_000);})]);}finally{clearTimeout(timer);}}
type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
type Runtime=Fixture["app"]["runtime"];
const runtimeFor=(f:Fixture)=>(f.app as unknown as {runtime:Runtime}).runtime;
async function parkQuestion(f:Fixture){
 const initial=await f.project(),parked=latch(),release=latch(),append=f.app.store.appendMessage.bind(f.app.store);
 f.app.store.appendMessage=async input=>{if(input.requestId==='user:pending-edit-question'){parked.resolve();await release.promise;}return append(input);};
 const work=f.app.askRestaurantQuestion({userId:'terms-user',caseId:initial.case.caseId,candidateId:initial.restaurant.presentedCandidateIds![0]!,requestId:'pending-edit-question',expectedVersion:initial.case.taskVersion,question:'What is the same-day cancellation policy?'});
 await bounded(Promise.race([parked.promise,work.then(()=>{throw new Error('Question returned before admission boundary');})]));
 return {work,release,restore:()=>{f.app.store.appendMessage=append;}};
}

test('Round24 B1 pending question preserves recorded explicit selection and evidenced booking terms',{timeout:30_000},async()=>{
 const {response}=JSON.parse(await readFile(new URL('./fixtures/user-booking-selection/P1-0-8.json',import.meta.url),'utf8')) as {response:ModelResponse};
 const f=await bookingTermsComposition({selectionReplay:{response}});let pending:Awaited<ReturnType<typeof parkQuestion>>|undefined;
 try{const initial=await f.initial();pending=await parkQuestion(f);await f.select();pending.release.resolve();await pending.work;const final=await f.project();
  assert.equal(final.restaurant.selectedCandidateId,initial.restaurant.presentedCandidateIds![0]);
  assert.deepEqual(final.restaurant.bookingHandoffs![0]!.terms.map(row=>row.label),[cancellationAnswer,'Card required']);
  const events=await runtimeFor(f).listEvents(initial.case.caseId),semantic=events.findLast(row=>row.event.type==='SEMANTIC_PROPOSAL_COMPILED')!;assert.equal(semantic.event.type,'SEMANTIC_PROPOSAL_COMPILED');
  if(semantic.event.type==='SEMANTIC_PROPOSAL_COMPILED'){assert.equal(semantic.event.userBookingSelection?.candidateId,final.restaurant.selectedCandidateId);if(semantic.event.patch.partySizeSource)assert.match(semantic.event.partySizeSourceMessageRequestId!,/^user:/);}
  assert.equal(events.filter(row=>row.event.type==='PAGE_QUESTION_COMPLETED'&&row.event.requestId==='pending-edit-question').length,1);
 }finally{pending?.release.resolve();await pending?.work.catch(()=>{});pending?.restore();await f.close();}
});

for(const limit of [undefined,6])for(const pendingQuestion of [false,true])test(`Round24 B2 selected edit reconciles actual model calls pending=${pendingQuestion} limit=${limit??'default'}`,{timeout:30_000},async()=>{
 const f=await bookingTermsComposition();let pending:Awaited<ReturnType<typeof parkQuestion>>|undefined;
 try{const initial=await f.initial();if(pendingQuestion)pending=await parkQuestion(f);if(limit!==undefined)Object.defineProperty(f.counted,'maxCalls',{value:limit});await f.select();pending?.release.resolve();await pending?.work;
  const actual=f.requests.filter(row=>row.turn==='SELECTED').length,usage=f.counted.usage(initial.case.caseId)!;
  assert.ok(actual>0);assert.equal(actual,usage.calls);if(limit!==undefined)assert.ok(actual<=limit);
 }finally{pending?.release.resolve();await pending?.work.catch(()=>{});pending?.restore();await f.close();}
});

for(const changes of [0,1,2])test(`Round24 B3 answer commit preserves ANSWERED across ${changes} shortlist changes`,{timeout:30_000},async()=>{
 const f=await bookingTermsComposition(),dispatch=runtimeFor(f).dispatch.bind(runtimeFor(f));let reached=false;
 try{const initial=await f.initial(),id=initial.case.caseId;
  runtimeFor(f).dispatch=async(envelope,version)=>{if(!reached&&envelope.event.type==='PAGE_QUESTION_COMPLETED'&&envelope.event.result.status==='ANSWERED'){reached=true;
   for(let n=0;n<changes;n++){const view=await f.app.getCase('terms-user',id);await f.app.setShortlist({userId:'terms-user',caseId:id,candidateId:envelope.event.result.candidateId,shortlisted:n%2===0,requestId:'save-before-answer-'+n,expectedVersion:view.case.taskVersion});}}
   return dispatch(envelope,version);
  };
  await f.question();const final=await f.project(),completions=(await runtimeFor(f).listEvents(id)).filter(row=>row.event.type==='PAGE_QUESTION_COMPLETED');
  assert.ok(reached);assert.equal((final.restaurant.shortlistCandidateIds??[]).length,changes===1?1:0);assert.equal(completions.length,1);assert.equal(final.restaurant.questionHistory[0]!.result?.status,'ANSWERED');
 }finally{runtimeFor(f).dispatch=dispatch;await f.close();}
});


test('Round24 B2 overlapping application edits keep the committed read budget after the late 409',{timeout:30_000},async()=>{
 const f=await bookingTermsComposition(),winnerEntered=latch(),loserEntered=latch(),allowWinner=latch(),allowLoser=latch();let pending:Awaited<ReturnType<typeof parkQuestion>>|undefined,winner:Promise<unknown>|undefined,loser:Promise<unknown>|undefined;
 const complete=f.counted.complete.bind(f.counted);let semantics=0;
 const observed:Array<{scope:number;purpose:string;before:number;after:number;calls:number;deadlineAt:number}>=[];
 try{const initial=await f.initial(),id=initial.case.caseId;pending=await parkQuestion(f);
  f.counted.complete=async request=>{const scope=f.counted.usage(id)!,before=f.counted.remainingCalls(id)!;
   if(request.purpose==='restaurant_semantic_interpret'){semantics++;if(semantics===1){winnerEntered.resolve();await allowWinner.promise;}else if(semantics===2){loserEntered.resolve();await allowLoser.promise;}}
   try{return await complete(request);}finally{const after=f.counted.usage(id)!;observed.push({scope:scope.startedAt,purpose:request.purpose,before,after:f.counted.remainingCalls(id)!,calls:after.calls,deadlineAt:after.deadlineAt});}
  };
  winner=f.select();await bounded(winnerEntered.promise);await new Promise(r=>setTimeout(r,5));const current=await f.project();
  loser=f.app.submitMessage({userId:'terms-user',conversationId:current.case.conversationId,requestId:'late-conflicting-edit',expectedVersion:current.case.taskVersion,message:f.source.bookingFollowups[0]+' Please.'});const rejected=assert.rejects(loser,StaleTaskVersionError);await bounded(loserEntered.promise);
  allowWinner.resolve();await bounded(winner);const usage=structuredClone(f.counted.usage(id)!);assert.ok(usage.calls>1);const exported=await f.app.exportReadArtifact(id);
  allowLoser.resolve();await rejected;pending.release.resolve();await pending.work;
  assert.deepEqual(f.counted.usage(id),usage,'a later exiting 409 cannot overwrite final winner usage');assert.equal((exported.resourceUsage as {modelCallsStarted:number}).modelCallsStarted,usage.calls);assert.deepEqual((await f.app.exportReadArtifact(id)).resourceUsage,exported.resourceUsage);
  const successful=observed.filter(row=>row.scope===usage.startedAt),conflict=observed.filter(row=>row.scope!==usage.startedAt);assert.equal(successful.length,usage.calls);assert.equal(conflict.length,1);assert.notEqual(conflict[0]!.deadlineAt,usage.deadlineAt);
  for(const row of successful){assert.equal(row.deadlineAt,usage.deadlineAt);assert.equal(row.after,row.before-1);}
  assert.equal(conflict[0]!.calls,1);assert.equal(conflict[0]!.after,conflict[0]!.before-1);assert.equal((await f.project()).case.phase,'PRESENT_RESULTS');
 }finally{allowWinner.resolve();allowLoser.resolve();pending?.release.resolve();await Promise.allSettled([winner,loser,pending?.work]);pending?.restore();f.counted.complete=complete;await f.close();}
});

for(const replacement of ['stop','edit','second-question'] as const)test(`Round24 B3 a ${replacement} transition rejects a stale answer instead of retrying`,{timeout:30_000},async()=>{
 const f=await bookingTermsComposition(),runtime=runtimeFor(f);let pending:Awaited<ReturnType<typeof parkQuestion>>|undefined;
 try{const initial=await f.initial(),id=initial.case.caseId;pending=await parkQuestion(f);const snapshot=await runtime.snapshot(id),q=snapshot.domainState.pageQuestion!;
  const envelope={id:'stale-answer-guard',taskId:id,occurredAt:f.clock.now().toISOString(),trace:{schemaVersion:'1' as const,runId:snapshot.runId,correlationId:'stale-answer-guard',actor:'SYSTEM' as const},event:{type:'PAGE_QUESTION_COMPLETED' as const,requestId:q.requestId,readRunId:q.readRunId,result:{status:'ANSWERED' as const,candidateId:q.candidateId,answer:'Guard-only staged answer',citations:[],checkedPages:[],sensitiveCategory:'NONE' as const,confirmationRequired:false}}};
  if(replacement==='stop'){const v=await f.project();await f.app.cancelCase('terms-user',id,{readRunId:v.restaurant.sourceReadContext!.runId,expectedVersion:v.case.taskVersion});}
  else if(replacement==='edit')await f.select();
  else {const v=await f.project();await f.app.askRestaurantQuestion({userId:'terms-user',caseId:id,candidateId:q.candidateId,requestId:'replacement-question',expectedVersion:v.case.taskVersion,question:'Does this restaurant require a card?'});}
  const port=(f.app as unknown as {agentLoop:{runtime:RestaurantAgentLoopRuntime}}).agentLoop.runtime;
  await assert.rejects(()=>port.dispatch(envelope,snapshot.version),StaleTaskVersionError);
  const rows=(await runtime.listEvents(id)).filter(e=>e.event.type==='PAGE_QUESTION_COMPLETED'&&e.event.requestId===q.requestId);assert.equal(rows.length,1);if(rows[0]!.event.type==='PAGE_QUESTION_COMPLETED')assert.equal(rows[0]!.event.result.status,'UNVERIFIED');
 }finally{pending?.release.resolve();await pending?.work.catch(()=>{});pending?.restore();await f.close();}
});

test('Round25 R2 a tentative edit losing to shortlist preserves completed usage while waiting and after 409',{timeout:30_000},async()=>{
 const f=await bookingTermsComposition(),entered=latch(),allow=latch(),complete=f.counted.complete.bind(f.counted);let edit:Promise<unknown>|undefined;
 try{const first=await f.initial(),id=first.case.caseId,usage=structuredClone(f.counted.usage(id)),original=(await f.app.exportReadArtifact(id)).resourceUsage;
  f.counted.complete=async request=>{if(request.purpose==='restaurant_semantic_interpret'){entered.resolve();await allow.promise;}return complete(request);};
  edit=f.app.submitMessage({userId:'terms-user',conversationId:first.case.conversationId,requestId:'round25-losing',expectedVersion:first.case.taskVersion,message:f.source.bookingFollowups[0]!});const rejected=assert.rejects(edit,StaleTaskVersionError);await bounded(entered.promise);
  assert.deepEqual(f.counted.usage(id),usage);assert.deepEqual((await f.app.exportReadArtifact(id)).resourceUsage,original);
  await f.app.setShortlist({userId:'terms-user',caseId:id,candidateId:first.restaurant.presentedCandidateIds![0]!,shortlisted:true,requestId:'round25-save',expectedVersion:first.case.taskVersion});
  allow.resolve();await rejected;assert.deepEqual(f.counted.usage(id),usage);assert.deepEqual((await f.app.exportReadArtifact(id)).resourceUsage,original);
 }finally{allow.resolve();await edit?.catch(()=>{});f.counted.complete=complete;await f.close();}
});

for(const entry of ['refresh','batch','location'] as const)test(`Round25 R2 direct ${entry} publishes its own usage and deadline`,{timeout:30_000},async()=>{
 const f=await bookingTermsComposition();
 try{let view=await f.initial();const id=view.case.caseId,prior=structuredClone(f.counted.usage(id)!);
  if(entry==='location'){
   const runtime=runtimeFor(f),s=await runtime.snapshot(id);
   await runtime.dispatch({id:'round25-nearby',taskId:id,occurredAt:f.clock.now().toISOString(),trace:{schemaVersion:'1',runId:s.runId,correlationId:'round25-nearby',actor:'USER'},event:{type:'SEMANTIC_PROPOSAL_COMPILED',patch:{schemaVersion:'3',area:{query:'nearby'}}}},s.version);
   view=await f.project();
  }
  await new Promise(resolve=>setTimeout(resolve,2));
  const input={userId:'terms-user',caseId:id,requestId:'round25-direct-'+entry,expectedVersion:view.case.taskVersion};
  if(entry==='refresh')await f.app.refreshAvailability(input);
  else if(entry==='batch')await f.app.requestAnotherBatch(input);
  else await f.app.recordLocation({...input,latitude:35.777,longitude:139.72});
  const until=Date.now()+15000;while((await f.project()).restaurant.progress.active){assert.ok(Date.now()<until);await new Promise(resolve=>setTimeout(resolve,10));}
  const usage=f.counted.usage(id)!;assert.ok(usage.startedAt>prior.startedAt);assert.ok(usage.deadlineAt>prior.deadlineAt);assert.equal(usage.deadlineAt-usage.startedAt,prior.deadlineAt-prior.startedAt);
  assert.equal(((await f.app.exportReadArtifact(id)).resourceUsage as {modelCallsStarted:number}).modelCallsStarted,usage.calls);
 }finally{await f.close();}
});
