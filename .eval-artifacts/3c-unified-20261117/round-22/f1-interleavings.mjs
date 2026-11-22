import assert from 'node:assert/strict';
import { startWorkspaceFixture } from '../../../src/harness/workspace-fixture-server.ts';
import { walk,control,until,apiCase,responseOf } from './walkthrough-tools.mjs';
const question='Does this place require a card?';
await walk('f1-interleavings',[390,1440].flatMap(width=>['second-question','model-failure','shortlist-wins','system-answer-first'].map(kind=>({
 name:'f1-'+kind,width,
 start:async()=>{const host=await startWorkspaceFixture({questions:true,semanticFailureMessage:'Change Tokyo to Failure'});return {...host,gate:control(),release:control()};},
 scenario:async({main,secondary,host,receipt})=>{
  const id=await main.create('Dinner in Tokyo');const other=await secondary();await other.select(id);await main.click('#details-button');
  const append=host.application.store.appendMessage.bind(host.application.store),runtime=host.application.runtime,dispatch=runtime.dispatch.bind(runtime);
  const read=async()=>{const r=await main.page.request.get(host.baseUrl+apiCase(id));assert.equal(r.status(),200);return (await r.json()).view;};
  const post=async(page,suffix,body)=>{const r=await page.request.post(host.baseUrl+(suffix==='/messages'?'/api/conversations/'+encodeURIComponent((await read()).case.conversationId)+suffix:apiCase(id)+suffix),{data:body});return {http:r.status(),body:await r.json()};};
  let first;
  try{
   host.application.store.appendMessage=async input=>{if(input.content===question){host.gate.release();await host.release.ready;}return append(input);};
   first=main.page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'));
   await main.field.fill(question);await main.click('#send');await host.gate.ready;
   const accepted=await read(),q=accepted.restaurant.pageQuestion,candidateId=q.candidateId,version=accepted.case.taskVersion;
   assert.ok(q&&!q.result);receipt.accepted={version,question:q};
   if(kind==='second-question'){
    receipt.second=await post(other.page,'/questions',{candidateId,question:'Is a card accepted?',requestId:'question-b',taskVersion:version});assert.equal(receipt.second.http,200);
   }else{
    if(kind==='system-answer-first'){
     const snapshot=await runtime.snapshot(id);await dispatch({id:'answer-first',taskId:id,event:{type:'PAGE_QUESTION_COMPLETED',requestId:q.requestId,readRunId:q.readRunId,result:{status:'ANSWERED',candidateId,answer:'Original answer',citations:[],checkedPages:[],sensitiveCategory:'NONE',confirmationRequired:false}},occurredAt:host.clock.now().toISOString(),trace:{schemaVersion:'1',runId:snapshot.runId,correlationId:'answer-first',actor:'SYSTEM'}},version);
    }
    if(kind==='shortlist-wins'){
     let once=true;runtime.dispatch=async(envelope,v)=>{if(once&&envelope.event.type==='SEMANTIC_PROPOSAL_COMPILED'){once=false;receipt.shortlist=await post(other.page,'/shortlist',{candidateId,shortlisted:true,requestId:'save-winner',taskVersion:version});assert.equal(receipt.shortlist.http,200);}return dispatch(envelope,v);};
    }
    // The captured accepted version deliberately survives only SYSTEM progress.
    receipt.edit=await post(other.page,'/messages',{message:kind==='model-failure'?'Change Tokyo to Failure':'Change Tokyo to Osaka',requestId:'edit-b',taskVersion:version});
    assert.equal(receipt.edit.http,kind==='shortlist-wins'?409:200);
   }
   host.release.release();assert.equal((await first).status(),200);
   await until(async()=>!(await read()).restaurant.progress.active,'question lifecycle finish');
   const view=await read(),events=await runtime.listEvents(id),completions=events.filter(e=>e.event.type==='PAGE_QUESTION_COMPLETED'&&e.event.requestId===q.requestId);
   assert.equal(completions.length,1);assert.equal(completions[0].taskId,id);assert.equal(completions[0].event.readRunId,q.readRunId);assert.equal(completions[0].event.result.candidateId,candidateId);const answerFirst=kind==='shortlist-wins'||kind==='system-answer-first';assert.equal(completions[0].event.result.status,answerFirst?'ANSWERED':'UNVERIFIED');
   if(!answerFirst)assert.equal(completions[0].event.result.reason,'CANCELLED');
   assert.ok(view.restaurant.questionHistory.some(h=>h.requestId===q.requestId));
   if(kind==='second-question'){
    assert.equal(view.restaurant.questionHistory.length,2);assert.equal(view.restaurant.pageQuestion.requestId,'question-b');assert.equal(view.restaurant.pageQuestion.result.status,'ANSWERED');
    assert.ok(events.indexOf(completions[0])<events.findIndex(e=>e.event.type==='PAGE_QUESTION_REQUESTED'&&e.event.question.requestId==='question-b'));
    const retry=await post(other.page,'/questions',{candidateId,question:'Is a card accepted?',requestId:'question-b',taskVersion:version});assert.equal(retry.http,200);assert.equal(retry.body.view.restaurant.questionHistory.length,2);
   }
   if(kind==='shortlist-wins')assert.ok(view.restaurant.shortlistCandidateIds.includes(candidateId));
   if(kind==='model-failure')assert.equal(view.case.phase,'FAILED');
   for(const tab of [main,other]){
    await tab.page.reload();await tab.visible('#app');await tab.active(id);
    await tab.page.waitForFunction(()=>document.getElementById('asked-pending')?.hidden!==false);
    assert.equal(await tab.page.locator('#question-stop').isVisible(),false);
   }
   receipt.events=events;receipt.view=view;await main.image('settled');await other.image('second-tab');return {phase:view.case.phase,history:view.restaurant.questionHistory.map(h=>({id:h.requestId,result:h.result})),completionCount:completions.length};
  }finally{host.release.release();await first?.catch(()=>{});runtime.dispatch=dispatch;host.application.store.appendMessage=append;}
 }
}))));
