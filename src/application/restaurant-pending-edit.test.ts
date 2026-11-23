import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import type {ModelResponse} from '../core/model/contracts.js';
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
  const actual=f.requests.filter(row=>row.turn==='SELECTED'&&row.request.purpose!=='restaurant_page_question').length,usage=f.counted.usage(initial.case.caseId)!;
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
