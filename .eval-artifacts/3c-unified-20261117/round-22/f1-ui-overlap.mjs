import assert from 'node:assert/strict';
import { startWorkspaceFixture } from '../../../src/harness/workspace-fixture-server.ts';
import { response } from '../../../src/harness/restaurant-read-test-fixtures.ts';
import { walk, control, until, responseOf } from './walkthrough-tools.mjs';

const q='Does this place require a card?';
const inputs=[['preparation',true,1440],['execution',true,1440],['preparation',false,1440],['preparation',true,390],['execution',false,1440],['preparation',false,390],['execution',true,390],['execution',false,390]].map(([stage,same,width])=>({
 name:'f1-'+stage+'-'+(same?'equivalent':'changed'),width,start:async()=>{
  const gate=control(),release=control();
  const host=await startWorkspaceFixture({questions:{beforeAnswer:async(_input,signal)=>{
   if(stage!=='execution')return;gate.release();
   if(!signal.aborted)await Promise.race([release.ready,new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}))]);
  }}});
  return {...host,overlapControl:{gate,release}};
 },
 scenario:async({main,host,secondary,receipt})=>{
  const id=await main.create('Dinner in Tokyo');
  const other=await secondary();await other.select(id);
  await main.click('#details-button');
  const {gate,release}=host.overlapControl;
  const append=host.application.store.appendMessage.bind(host.application.store);
  const gateway=host.application.interpreter.modelGateway;
  const complete=gateway.complete.bind(gateway);
  // Only the injected semantic model canonicalizes the Japanese spelling of Tokyo.
  gateway.complete=async request=>{
   const user=request.messages.find(m=>m.role==='user')?.content??'';
   if(request.purpose==='restaurant_semantic_interpret'&&user.includes('Change Tokyo to 東京')){
    return response(JSON.stringify({schemaVersion:'4',facts:[{field:'AREA',operation:'CORRECT',value:{kind:'AREA',query:'Tokyo'}}]}),'recorded-equivalent-area');
   }
   return complete(request);
  };
  if(stage==='preparation'){
   host.application.store.appendMessage=async input=>{if(input.content===q){gate.release();await release.ready;}return append(input);};
  }
  const read=async()=>{const r=await main.page.request.get(host.baseUrl+'/api/cases/'+encodeURIComponent(id));assert.equal(r.status(),200);return (await r.json()).view;};
  const state=v=>({phase:v.case.phase,status:v.case.status,version:v.case.taskVersion,active:v.restaurant.progress.active,area:v.restaurant.intentDraft.area.query,run:v.restaurant.sourceReadContext?.runId,question:v.restaurant.pageQuestion?{requestId:v.restaurant.pageQuestion.requestId,run:v.restaurant.pageQuestion.readRunId,result:v.restaurant.pageQuestion.result?.status??null}:null,history:v.restaurant.questionHistory.map(x=>({requestId:x.requestId,status:x.result?.status,reason:x.result?.reason}))});
  try{
   const first=main.page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'));
   await main.field.fill(q);await main.click('#send');await gate.ready;
   await other.page.waitForFunction(()=>document.getElementById('send').disabled);
   receipt.observed={before:state(await read()),stage,modelFixture:same?'Tokyo and 東京 normalize to the same area':'Tokyo and Osaka are distinct'};
   const chip=other.page.locator('#request-conditions').getByRole('button',{name:'Tokyo',exact:true});
   await other.click(chip);await other.page.getByLabel('Edit Tokyo',{exact:true}).fill(same?'東京':'Osaka');
   const edit=await responseOf(other.page,'POST','/messages',()=>other.click(other.page.getByRole('button',{name:'Save',exact:true})));
   receipt.observed.edit={http:edit.status(),message:edit.request().postDataJSON().message};assert.equal(edit.status(),200);
   release.release();receipt.observed.questionHttp=(await first).status();
   await until(async()=>!(await read()).restaurant.progress.active,'worker completion');
   receipt.observed.after=state(await read());
   await main.page.reload();await main.visible('#app');await main.page.waitForFunction(()=>document.querySelector('.case-link.active'));
   receipt.observed.reload=state(await read());
   receipt.observed.controls={sendDisabled:await main.page.locator('#send').isDisabled(),stop:await main.page.locator('#question-stop').isVisible(),pending:await main.page.locator('#asked-pending').isVisible(),pendingText:await main.page.locator('#asked-pending').innerText()};
   const events=await host.application.runtime.listEvents(id);
  const originalId=receipt.observed.before.question.requestId;
  const completed=events.filter(e=>e.event.type==='PAGE_QUESTION_COMPLETED'&&e.event.requestId===originalId);
  assert.equal(completed.length,1);
  assert.equal(completed[0].event.result.reason,'CANCELLED');
  receipt.questionEvents=completed;
  await main.image('reloaded');assert.ok(!receipt.observed.reload.question||receipt.observed.reload.question.result,'no pending question without a worker after both responses and reload');
   return receipt.observed;
  }finally{release.release();gateway.complete=complete;host.application.store.appendMessage=append;}
 },
}));
await walk('f1-ui-overlap',inputs);

