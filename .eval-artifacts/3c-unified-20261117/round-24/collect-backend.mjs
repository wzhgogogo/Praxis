import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {bookingTermsComposition} from '../../../src/application/fixtures/booking-terms-composition.ts';
const modelResponse=JSON.parse(readFileSync(new URL('../../../src/application/fixtures/user-booking-selection/P1-0-8.json',import.meta.url),'utf8')).response;
const save=(file,data)=>writeFileSync(process.env.PRAXIS_ROUND24_OBSERVATIONS+'/'+file,JSON.stringify(data,null,2)+'\n');
const latch=()=>Promise.withResolvers();
async function choice(pending,limit) {
  const f=await bookingTermsComposition({selectionReplay:{response:modelResponse}});
  const app=f.app,store=app.store,append=store.appendMessage.bind(store);
  const complete=f.counted.complete.bind(f.counted), calls=[];
  const gate=Promise.withResolvers(),release=Promise.withResolvers();
  let asking;
  try{
    const initial=await f.initial();
    const caseId=initial.case.caseId,candidateId=initial.restaurant.presentedCandidateIds[0];
    if(limit!==undefined)Object.defineProperty(f.counted,"maxCalls",{value:limit});
    assert.ok(candidateId);
    store.appendMessage=async input=>{if(input.requestId==='user:pending-about'){gate.resolve();await release.promise;}return append(input);};
    if(pending){
      asking=app.askRestaurantQuestion({userId:'terms-user',caseId,candidateId,requestId:'pending-about',expectedVersion:initial.case.taskVersion,question:'What is the same-day cancellation policy?'});
      await Promise.race([gate.promise,asking.then(()=>{throw Error('question returned before it was parked');})]);
      const waiting=await f.project();assert.equal(waiting.restaurant.pageQuestion.requestId,'pending-about');assert.ok(!waiting.restaurant.pageQuestion.result);
    }
    f.counted.complete=async req=>{calls.push({purpose:req.purpose,inCaseBudget:f.counted.currentTaskId()===caseId});return complete(req);};
    const v=await f.select();
    release.resolve();if(asking)await asking;
    const end=await f.project();
    const events=await app.runtime.listEvents(caseId);
    const edit=events.findLast(e=>e.event.type==='SEMANTIC_PROPOSAL_COMPILED');
    const history=end.restaurant.questionHistory.map(q=>({id:q.requestId,status:q.result?.status,reason:q.result?.reason}));
    const decisions=events.slice(events.indexOf(edit)).filter(e=>e.event.type==='CANDIDATE_SELECTED').map(e=>({id:e.event.candidateId,actor:e.trace.actor}));
    const listing=end.restaurant.bookingHandoffs??[];
    return {pending,limit:limit??null,req:f.source.bookingFollowups[0],initialCandidate:candidateId,phase:end.case.phase,
      boundChoice:edit.event.userBookingSelection??null,partySizeBinding:edit.event.partySizeSourceMessageRequestId??null,partySizeSource:edit.event.patch?.partySizeSource??null,
      selected:end.restaurant.selectedCandidateId??null,decisions,handoffs:listing.map(h=>({id:h.candidateId,terms:(h.terms??[]).map(t=>t.label),sourceSelection:h.sourceSelection})),
      resultCandidates:end.restaurant.presentedCandidateIds??[],history,modelCalls:calls,
      countedCalls:f.counted.usage(caseId)?.calls??null,semanticCalls:calls.filter(c=>c.purpose==='restaurant_semantic_interpret'),firstPhase:v.case.phase};
  }finally{release.resolve();await asking?.catch(()=>{});store.appendMessage=append;f.counted.complete=complete;await f.close();}
}
async function answerWithSave(changes) {
  const f=await bookingTermsComposition(),app=f.app,runtime=app.runtime,dispatch=runtime.dispatch.bind(runtime);
  let originallyAnswered=false,save=null;
  try{
    const initial=await f.initial(),id=initial.case.caseId;
    runtime.dispatch=async(e,v)=>{
      if(e.event.type==='PAGE_QUESTION_COMPLETED'&&e.event.result.status==='ANSWERED'&&!originallyAnswered){
        originallyAnswered=true;
        if(changes){
          for(let n=0;n<changes;n++){
          const ready=await app.getCase('terms-user',id);
          const latestVersion=ready.case.taskVersion;
          const saved=await app.setShortlist({userId:'terms-user',caseId:id,candidateId:e.event.result.candidateId,shortlisted:n%2===0,requestId:'save-at-answer-'+n,expectedVersion:latestVersion});
          save={before:v,after:saved.case.taskVersion};
          }
        }
      }
      return dispatch(e,v);
    };
    const q=await f.question(),end=await f.project();
    const events=(await runtime.listEvents(id)).map(e=>e.event);
    return {changes,originallyAnswered,save,returnedPhase:q.case.phase,phase:end.case.phase,savedCount:end.restaurant.shortlistCandidateIds.length,
      results:events.filter(e=>e.type==='PAGE_QUESTION_COMPLETED').map(e=>({requestId:e.requestId,result:e.result.status,reason:e.result.reason??null})),
      history:end.restaurant.questionHistory.map(v=>({status:v.result?.status,reason:v.result?.reason??null}))};
  }finally{runtime.dispatch=dispatch;await f.close();}
}

async function overlap(){
 const f=await bookingTermsComposition(),a=latch(),b=latch(),allowA=latch(),allowB=latch(),park=latch(),release=latch();let old,first,second;
 const complete=f.counted.complete.bind(f.counted),append=f.app.store.appendMessage.bind(f.app.store),observed=[];let semantic=0;
 try{const initial=await f.initial(),id=initial.case.caseId;
  f.app.store.appendMessage=async input=>{if(input.requestId==='user:park-question'){park.resolve();await release.promise;}return append(input);};
  old=f.app.askRestaurantQuestion({userId:'terms-user',caseId:id,candidateId:initial.restaurant.presentedCandidateIds[0],requestId:'park-question',expectedVersion:initial.case.taskVersion,question:'What is the cancellation policy?'});await park.promise;
  f.counted.complete=async request=>{const scope=f.counted.usage(id),before=f.counted.remainingCalls(id);if(request.purpose==='restaurant_semantic_interpret'){semantic++;if(semantic===1){a.resolve();await allowA.promise;}else if(semantic===2){b.resolve();await allowB.promise;}}
   try{return await complete(request);}finally{const after=f.counted.usage(id);observed.push({scope:scope.startedAt,purpose:request.purpose,before,after:f.counted.remainingCalls(id),calls:after.calls,deadlineAt:after.deadlineAt});}};
  first=f.select();await a.promise;await new Promise(r=>setTimeout(r,5));const v=await f.project();
  second=f.app.submitMessage({userId:'terms-user',conversationId:v.case.conversationId,requestId:'conflicting-edit',expectedVersion:v.case.taskVersion,message:f.source.bookingFollowups[0]+' Please.'});const failure=second.then(()=>({status:200}),error=>({status:error.constructor.name,actualVersion:error.actualVersion,expectedVersion:error.expectedVersion}));await b.promise;
  allowA.resolve();await first;const before=structuredClone(f.counted.usage(id)),exportBefore=(await f.app.exportReadArtifact(id)).resourceUsage;
  allowB.resolve();const conflict=await failure;release.resolve();await old;
  return {before,after:f.counted.usage(id),exportBefore,exportAfter:(await f.app.exportReadArtifact(id)).resourceUsage,conflict,observed,phase:(await f.project()).case.phase};
 }finally{allowA.resolve();allowB.resolve();release.resolve();await Promise.allSettled([old,first,second]);f.counted.complete=complete;f.app.store.appendMessage=append;await f.close();}
}
async function replacement(kind){
 const f=await bookingTermsComposition(),park=latch(),release=latch(),append=f.app.store.appendMessage.bind(f.app.store);let old;
 try{const initial=await f.initial(),id=initial.case.caseId;f.app.store.appendMessage=async input=>{if(input.requestId==='user:guard-question'){park.resolve();await release.promise;}return append(input);};
  old=f.app.askRestaurantQuestion({userId:'terms-user',caseId:id,candidateId:initial.restaurant.presentedCandidateIds[0],requestId:'guard-question',expectedVersion:initial.case.taskVersion,question:'Card required?'});await park.promise;
  const snapshot=await f.app.runtime.snapshot(id),q=snapshot.domainState.pageQuestion;
  if(kind==='stop'){const v=await f.project();await f.app.cancelCase('terms-user',id,{readRunId:v.restaurant.sourceReadContext.runId,expectedVersion:v.case.taskVersion});}
  else if(kind==='edit')await f.select();
  else {const v=await f.project();await f.app.askRestaurantQuestion({userId:'terms-user',caseId:id,candidateId:q.candidateId,requestId:'replacement-question',expectedVersion:v.case.taskVersion,question:'Card required?'});}
  const envelope={id:'stale-answer-guard',taskId:id,occurredAt:f.clock.now().toISOString(),trace:{schemaVersion:'1',runId:snapshot.runId,correlationId:'stale-answer',actor:'SYSTEM'},event:{type:'PAGE_QUESTION_COMPLETED',requestId:q.requestId,readRunId:q.readRunId,result:{status:'ANSWERED',candidateId:q.candidateId,answer:'Guard-only staged answer',citations:[],checkedPages:[],sensitiveCategory:'NONE',confirmationRequired:false}}};
  const outcome=await f.app.agentLoop.runtime.dispatch(envelope,snapshot.version).then(()=>({status:200}),error=>({status:error.constructor.name}));
  return {kind,outcome,results:(await f.app.runtime.listEvents(id)).filter(e=>e.event.type==='PAGE_QUESTION_COMPLETED'&&e.event.requestId===q.requestId).map(e=>e.event.result)};
 }finally{release.resolve();await old?.catch(()=>{});f.app.store.appendMessage=append;await f.close();}
}

const rows={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'OFFLINE_PRODUCTION_APPLICATION_PGLITE',choices:[],answerSave:[],negative:[]};
for(const limit of [undefined,6])for(const pending of [false,true]){rows.choices.push(await choice(pending,limit));save('backend.json',rows);}
for(const changes of [0,1,2]){rows.answerSave.push(await answerWithSave(changes));save('backend.json',rows);}
rows.overlap=await overlap();save('backend.json',rows);
for(const kind of ['stop','edit','second-question']){rows.negative.push(await replacement(kind));save('backend.json',rows);}
console.log(JSON.stringify({choices:rows.choices.length,answerSave:rows.answerSave.length,negative:rows.negative.length,overlap:true}));
