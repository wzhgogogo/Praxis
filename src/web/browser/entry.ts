import { render, renderAnswer, renderConditions } from "./views.js";
import { selectionKey } from "./slot-selection.js";
import { availabilityExpired, clearSlotSelection, currentHandoff, needsSlotReselection, offerFor, reconcileSlot, selectSlot, selectionScope } from "./selected-slot.js";
import { closePhotos, movePhoto, openPhotos } from "./photos.js";
import { closePlans, key, loadCase, moveCard, newPlan, savePosition, setView, syncBrand, syncSidebar } from "./navigation.js";
import { $, clearError, desktopLayout, element, report, requestId, show, state, text } from "./runtime.js";
import { draftKey } from "./session.js";
import { accept, api, casePath, currentCase, openStream, receiveCase, refreshCaseLinks, reportCaseError, resetCaseRequests, resumeCase, scheduleCaseListSync, updateCases } from "./transport.js";
'use strict';
desktopLayout.addEventListener('change',()=>{closePlans();syncSidebar();});syncSidebar();
$('collapse-plans').onclick=event=>{if(desktopLayout.matches){state.sidebarCollapsed=true;syncSidebar();if(event.detail===0)$('menu').focus({preventScroll:true});}else closePlans(event.detail===0);};








export function ids(){const r=state.view.restaurant;return state.view.case.phase==='PRESENT_RESULTS'?(r.presentedCandidateIds||[]):r.readyCandidateIds;}
export function candidate(){return state.view&&state.view.restaurant.candidates.find(c=>c.restaurant.id===state.ui.candidateId);}
export function canRefresh(){return !!state.view&&(state.view.case.phase==='PRESENT_RESULTS'||!!state.view.restaurant.readStatus.canRetry);}








window.addEventListener('storage',event=>{
 if(!state.view||!state.user||!state.ui.candidateId||event.key!==selectionKey(selectionScope()))return;
 const previous=state.ui.selectedSlot;
 reconcileSlot();
 if(state.ui.view==='HANDOFF'&&JSON.stringify(previous)!==JSON.stringify(state.ui.selectedSlot))state.ui.view='CANDIDATES';
 render();
});


export function sourceFor(id){const r=state.view.restaurant, check=r.availabilityChecks[id], evidence=new Set(check&&check.evidenceIds||[]);return r.readEvidence.find(e=>e.candidateId===id&&e.sourceUrl&&evidence.has(e.evidenceId))||r.currentFactEvidence.find(e=>e.candidateId===id&&e.sourceUrl);}
export function cancelPreparation(){state.preparing=null;}
const previewParameters=new URLSearchParams(location.search),previewPace=previewParameters.get('pace')==='preview';
const requestedPaceStep=Number(previewParameters.get('paceStep')),paceStep=Number.isFinite(requestedPaceStep)&&requestedPaceStep>0?requestedPaceStep:1600;
const previewSteps=[paceStep,paceStep*2,paceStep*3,paceStep*3.875];
export const fixturePresentation=view=>view.mode==='FIXTURE'||document.documentElement.dataset.fixturePreview==='true';
export function clearEntryPreview(){if(!state.preview)return;clearTimeout(state.preview.timer);state.preview=null;refreshCaseLinks();}
export function clearEntryTransition(){state.pendingCase=null;state.entryPace=null;clearEntryPreview();}
export function startEntryPreview(view,startedAt){
 if(!previewPace||!fixturePresentation(view)||view.restaurant.progress.active||view.case.phase!=='PRESENT_RESULTS'||!(view.restaurant.presentedCandidateIds||[]).length)return;
 const preview={caseId:view.case.caseId,startedAt,phase:'understanding',timer:0};state.preview=preview;
 const advance=()=>{if(state.preview!==preview)return;const elapsed=performance.now()-startedAt;
  if(elapsed>=previewSteps[3]){clearEntryPreview();return;}
  preview.phase=elapsed<previewSteps[0]?'understanding':elapsed<previewSteps[1]?'finding':elapsed<previewSteps[2]?'checking':'card';const next=previewSteps.find(at=>at>elapsed);
  preview.timer=setTimeout(()=>{advance();render();},Math.max(0,Math.ceil(next-elapsed)));
 };advance();
}





// The card shows short labels. About retains the full source excerpts.



export function canShortlist(){return ['SEARCHING','SELECTION_REQUIRED','PRESENT_RESULTS','NO_VERIFIED_RESULT'].includes(state.view?.case.phase);}

export function questionPending(){const q=state.view?.restaurant.pageQuestion;return !!q&&!q.result;}



export function closeAnswer(){show('answer-sheet',false);show('answer-backdrop',false);}
export function openAnswer(q){
  const c=candidate();if(!c||q.candidateId!==c.restaurant.id)return;
  text('answer-place',c.restaurant.outletName);renderAnswer($('question-result'),q.result);
  show('answer-sheet',true);show('answer-backdrop',true);$('answer-sheet').focus({preventScroll:true});
}
export async function askCurrentPlace(message){
  const old=state.view,c=candidate(),nav=state.nav,caseId=old?.case.caseId;
  if(!old||!c||old.case.phase!=='PRESENT_RESULTS')return;
  const id=requestId();state.pendingQuestion={requestId:id,caseId,candidateId:c.restaurant.id};
  state.asking=true;state.askingId=id;render();clearError();
  try{
    const p=await api(casePath(caseId)+'/questions',{method:'POST',body:JSON.stringify({
      candidateId:c.restaurant.id,question:message,taskVersion:old.case.taskVersion,requestId:id,
    })});
    if(state.drafts.get(caseId)?.trim()===message)state.drafts.delete(caseId);
    if(draftKey()===caseId&&$('message').value.trim()===message)setMessage('');
    receiveCase(p.view,nav,caseId);
  }catch(error){
    if(currentCase(nav,caseId)&&state.askingId===id){state.pendingQuestion=null;await reportCaseError(error,nav,caseId);}
  }finally{
    if(state.askingId===id){state.asking=false;state.askingId=null;render();}
  }
}
export function editCondition(button,label,kind,value,removable){
  if(state.blocked||state.asking)return;
  if(state.conditionEditor)state.conditionEditor.cancel();
  const bounds=button.getBoundingClientRect(),anchor=element('span',undefined,'condition-edit-anchor');anchor.style.width=bounds.width+'px';anchor.style.height=bounds.height+'px';
  const form=element('form',undefined,'condition-editor'),input=element('input'),save=element('button',undefined,'editor-save'),cancel=element('button',undefined,'editor-cancel');
  form.noValidate=true;const inputs=[input];input.type=kind==='date'?'date':kind==='time'?'time':kind==='guests'?'number':'text';input.required=true;
  input.value=kind==='text'?label:kind==='time'?value.earliest:String(value);input.setAttribute('aria-label','Edit '+label);input.autocomplete='off';
  if(kind==='text')input.maxLength=30;if(kind==='guests'){input.min='1';input.step='1';}
  if(kind==='time'){const end=element('input');end.type='time';end.required=true;end.value=value.latest;end.setAttribute('aria-label','End time');inputs.push(end);}
  const newValue=()=>kind==='time'?input.value+(inputs[1].value===input.value?'':'–'+inputs[1].value):kind==='guests'&&input.value?String(input.valueAsNumber):input.value.trim();
  const originalValue=newValue();
  save.type='submit';save.setAttribute('aria-label','Save');save.setAttribute('aria-busy','false');save.innerHTML='<svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>';
  cancel.type='button';cancel.setAttribute('aria-label','Cancel condition change');cancel.innerHTML='<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  const remove=removable?element('button',undefined,'editor-remove'):null;
  if(remove){remove.type='button';remove.setAttribute('aria-label','Remove '+label);remove.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>';}
  let busy=false;
  const position=()=>{form.style.left='0px';const host=$('request-conditions').getBoundingClientRect();form.style.maxWidth=host.width+'px';const rect=form.getBoundingClientRect(),at=anchor.getBoundingClientRect();form.style.left=Math.max(host.left-at.left,Math.min(0,host.right-at.left-rect.width))+'px';};
  const update=()=>{const n=Array.from(newValue()).length,valid=inputs.every(i=>i.validity.valid)&&!(kind==='time'&&input.value>inputs[1].value);save.disabled=busy||!newValue()||n>30||!valid;cancel.disabled=busy;if(remove)remove.disabled=busy;for(const i of inputs)i.disabled=busy;if(kind==='text')input.style.width=Math.min(Math.max(n,3)+1,18)+'ch';if(form.isConnected)position();};
  const close=(refresh=true)=>{if(anchor.isConnected)anchor.replaceWith(button);if(state.conditionEditor&&state.conditionEditor.form===form)state.conditionEditor=null;if(refresh&&state.view)renderConditions();};
  cancel.onclick=event=>{if(busy)return;close();if(event.detail===0)button.focus({preventScroll:true});};
  for(const i of inputs)i.oninput=update;form.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();cancel.click();}};
  const submitEdit=async(message,button)=>{if(busy||state.blocked||state.asking)return;
    busy=true;button.setAttribute('aria-busy','true');update();
    const accepted=await submitRequirement(message,true);
    busy=false;button.setAttribute('aria-busy','false');if(accepted)close();else update();
  };
  form.onsubmit=event=>{event.preventDefault();if(save.disabled)return;const value=newValue();if(value===originalValue){cancel.click();return;}void submitEdit('Change '+label+' to '+value,save);};
  form.append(input);if(kind==='time')form.append(element('span','–'),inputs[1]);form.append(save,cancel);
  if(remove){remove.onclick=()=>{void submitEdit('Remove '+label,remove);};form.append(remove);}
  anchor.append(form);button.replaceWith(anchor);
  state.conditionEditor={form,anchor,caseId:state.view.case.caseId,get busy(){return busy;},cancel:()=>{if(!busy)close(false);},position};update();input.focus({preventScroll:true});if(kind==='text')input.select();
}






export function updateComposerClearance(){const host=$('workspace-composer'),bottom=parseFloat(getComputedStyle(host).bottom)||0;document.documentElement.style.setProperty('--composer-clearance',(host.hidden?0:host.getBoundingClientRect().height+bottom+24)+'px');}
export function resizeMessage(){const input=$('message');input.style.height='';if($('workspace-composer').contains(input)){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,140)+'px';}}
export function setMessage(value){$('message').value=value;resizeMessage();}
export function focusAdjustment(){const input=$('message');if(!input.value)input.placeholder='Try another area, time, or party size…';input.focus({preventScroll:true});}
$('message').addEventListener('blur',()=>{$('message').removeAttribute('placeholder');});
$('message').addEventListener('input',resizeMessage);
$('message').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('composer').requestSubmit();}});
new ResizeObserver(updateComposerClearance).observe($('workspace-composer'));window.addEventListener('resize',()=>{resizeMessage();updateComposerClearance();if(state.conditionEditor)state.conditionEditor.position();});
const caseScroller=$('case-workspace');
new IntersectionObserver(entries=>{$('topbar').classList.toggle('scrolled',!caseScroller.hidden&&!entries[0].isIntersecting);},{root:caseScroller,threshold:0}).observe($('topbar-sentinel'));

$('cover-open').onclick=openPhotos;$('detail-photo-open').onclick=openPhotos;$('photo-close').onclick=closePhotos;
$('detail-photo-previous').onclick=()=>movePhoto(-1);$('detail-photo-next').onclick=()=>movePhoto(1);$('photo-previous').onclick=()=>movePhoto(-1);$('photo-next').onclick=()=>movePhoto(1);
$('photo-viewer').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();movePhoto(-1);}if(event.key==='ArrowRight'){event.preventDefault();movePhoto(1);}});


export function viewContext(){return {view:state.view?state.ui.view:'HOME',...(state.view&&!state.ui.atEnd&&state.ui.candidateId&&['CANDIDATES','DETAILS','HANDOFF'].includes(state.ui.view)?{candidateId:state.ui.candidateId}:{}),comparedCandidateIds:[]};}
export async function submitRequirement(message,preserveComposer=false){
 if(!message||state.blocked||state.asking)return false;
 $('message').removeAttribute('placeholder');
 const nav=state.nav,old=state.view,caseId=old?.case.caseId,context=viewContext(),draft=$('message').value,startedAt=performance.now();
 clearEntryTransition();state.blocked=true;state.sending=!preserveComposer;clearError();
 if(!old){state.pendingCase={title:message};if(!preserveComposer)setMessage('');}
 render();
 try{
  const path=old?'/api/conversations/'+encodeURIComponent(old.conversation.id)+'/messages':'/api/cases';
  const body={message,requestId:requestId(),viewContext:context,...(old?{taskVersion:old.case.taskVersion}:{})};
  const p=await api(path,{method:'POST',body:JSON.stringify(body)});
  const modelFailed=p.view.restaurant.readStatus.kind==='MODEL_FAILURE';
  if(!preserveComposer&&!modelFailed){
    const targetKey=caseId||'HOME';
    if(state.drafts.get(targetKey)?.trim()===message)state.drafts.delete(targetKey);
    if(draftKey()===targetKey&&$('message').value.trim()===message)setMessage('');
  }
  if(!currentCase(nav,caseId)){updateCases(p.view.case);return false;}
  state.pendingCase=null;state.blocked=false;state.sending=false;
  if(!modelFailed||!old)state.ui={view:'CANDIDATES',candidateId:null,reselectSlot:false};
  state.detailKey='';state.handoffKey='';
  if(!old&&modelFailed&&!$('message').value)setMessage(draft);
  if(!old&&previewPace&&fixturePresentation(p.view))state.entryPace=startedAt;
  accept(p.view);
  if(modelFailed)$('understanding-error').scrollIntoView({block:'nearest',behavior:'instant'});
  if(!old||state.streamCaseId!==p.view.case.caseId)openStream(p.view.case.caseId,nav);
  savePosition();return !modelFailed;
 }catch(error){
  if(currentCase(nav,caseId)){
    if(!old)clearEntryTransition();
    state.sending=false;
    if(!$('message').value)setMessage(draft);
    await reportCaseError(error,nav,caseId);
  }
  return false;
 }finally{resumeCase(nav,caseId);}
}
$('composer').onsubmit=async event=>{event.preventDefault();const message=$('message').value.trim();if(!message||$('send').disabled)return;if(state.view&&state.ui.view==='DETAILS'){await askCurrentPlace(message);return;}await submitRequirement(message);};
$('stop').onclick=async()=>{
  if(state.blocked||!state.view)return;
  const nav=state.nav,{caseId,taskVersion}=state.view.case,readRunId=state.view.restaurant.sourceReadContext?.runId;
  if(!readRunId)return;
  state.blocked=true;$('stop').disabled=true;
  try{
    const p=await api(casePath(caseId)+'/run',{method:'DELETE',body:JSON.stringify({readRunId,taskVersion})});
    receiveCase(p.view,nav,caseId);
  }catch(error){await reportCaseError(error,nav,caseId);}
  finally{resumeCase(nav,caseId);}
};
$('bookmark').onclick=async()=>{
  const c=candidate();if(state.blocked||!c||!canShortlist())return;
  const nav=state.nav,caseId=state.view.case.caseId;
  try{
    const p=await api(casePath(caseId)+'/shortlist',{method:'POST',body:JSON.stringify({
      candidateId:c.restaurant.id,shortlisted:!(state.view.restaurant.shortlistCandidateIds||[]).includes(c.restaurant.id),
      taskVersion:state.view.case.taskVersion,requestId:requestId(),
    })});
    receiveCase(p.view,nav,caseId);
  }catch(error){await reportCaseError(error,nav,caseId);}
};
$('previous').onclick=()=>moveCard(-1);$('next').onclick=()=>moveCard(1);
$('details-button').onclick=()=>setView('DETAILS');$('details-back').onclick=()=>setView('CANDIDATES');$('saved').onclick=()=>setView('SAVED');$('saved-back').onclick=()=>setView('CANDIDATES');$('choose').onclick=prepareBooking;$('handoff-back').onclick=()=>setView('CANDIDATES');
export async function refreshCase(){
 if(state.blocked||!state.view)return false;
 const nav=state.nav,caseId=state.view.case.caseId;
 state.blocked=true;render();
 try{
  const p=await api(casePath(caseId)+'/refresh',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId()})});
  return receiveCase(p.view,nav,caseId);
 }catch(error){
  if(currentCase(nav,caseId))cancelPreparation();
  await reportCaseError(error,nav,caseId);return false;
 }finally{resumeCase(nav,caseId);}
}
export function finishPreparation(){
 const pending=state.preparing;if(!pending)return;
 if(!currentCase(pending.nav,pending.caseId)||state.ui.candidateId!==pending.id
  ||!['CANDIDATES','HANDOFF'].includes(state.ui.view)||state.view.restaurant.requirementRevision!==pending.revision){cancelPreparation();return;}
 if(state.view.restaurant.progress.active)return;
 cancelPreparation();
 const matched=offerFor(pending.id);
 if(ids().includes(pending.id)&&state.view.restaurant.readyCandidateIds.includes(pending.id)&&matched){
   selectSlot(matched);closeAnswer();state.ui.view='HANDOFF';savePosition();clearError();
 }else{
   if(state.ui.view==='HANDOFF'){state.ui.view='CANDIDATES';state.handoffKey='';}
   savePosition();report(new Error("Availability couldn't be confirmed. Try again."));
 }
}
export async function refreshSelectedSlot(){
 if(!canRefresh()||state.blocked||state.preparing)return;
 const id=state.ui.candidateId,nav=state.nav,caseId=state.view.case.caseId,revision=state.view.restaurant.requirementRevision;
 const old=(state.view.restaurant.availability[id]||[])[0];
 if(old&&!state.ui.selectedSlot)selectSlot(old);
 const pending={id,nav,caseId,revision};
 state.preparing=pending;clearError();
 const refreshed=await refreshCase();
 if(!refreshed&&state.preparing===pending){cancelPreparation();if(currentCase(nav,caseId))render();}
}
export async function prepareBooking(){
 if(state.blocked||state.preparing||!candidate()||!ids().includes(state.ui.candidateId))return;
 const id=state.ui.candidateId;
 if(needsSlotReselection(id))return;
 if(!availabilityExpired(id)){const viewed=offerFor(id);if(state.ui.selectedSlot&&!viewed)return;if(viewed)selectSlot(viewed);setView('HANDOFF');return;}
 await refreshSelectedSlot();
}
$('refresh').onclick=refreshCase;
$('answer-backdrop').onclick=closeAnswer;$('answer-dismiss').onclick=closeAnswer;
let answerDragY=null;$('answer-dismiss').onpointerdown=event=>{answerDragY=event.clientY;$('answer-dismiss').setPointerCapture(event.pointerId);};
$('answer-dismiss').onpointerup=event=>{if(answerDragY!==null&&event.clientY-answerDragY>40)closeAnswer();answerDragY=null;};
$('batch-back').onclick=()=>moveCard(-1);$('end-saved').onclick=()=>setView('SAVED');$('end-adjust').onclick=focusAdjustment;
export async function findMore(){
  if(state.blocked||!state.view)return;
  const nav=state.nav,caseId=state.view.case.caseId;
  state.blocked=true;$('find-more').disabled=true;
  try{
    const p=await api(casePath(caseId)+'/another-batch',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId()})});
    if(currentCase(nav,caseId)){state.ui.atEnd=false;state.ui.candidateId=null;clearSlotSelection();}
    receiveCase(p.view,nav,caseId);
  }catch(error){await reportCaseError(error,nav,caseId);}
  finally{resumeCase(nav,caseId);}
}
$('find-more').onclick=findMore;$('empty-more').onclick=findMore;$('empty-retry').onclick=refreshCase;$('empty-adjust').onclick=focusAdjustment;
export async function depart(event){
 event.preventDefault();
 if(!state.view||state.blocked||state.preparing)return;
 const nav=state.nav,caseId=state.view.case.caseId,h=currentHandoff();
 if(!h){await refreshSelectedSlot();return;}
 const returnKey=key(caseId)+':return';
 const target=window.open('about:blank','_blank');
 if(!target){report(new Error('Please allow this source tab to open.'));return;}
 target.opener=null;
 try{
  const p=await api(casePath(caseId)+'/booking-departures',{method:'POST',body:JSON.stringify({
    candidateId:h.candidateId,offerId:h.offerId,taskVersion:state.view.case.taskVersion,requestId:requestId(),
  })});
  if(state.signingOut){target.close();return;}
  localStorage.setItem(returnKey,'1');target.location.href=p.url;
 }catch(error){target.close();await reportCaseError(error,nav,caseId);}
}
$('departure').onclick=depart;$('direct-source').onclick=event=>{if(currentHandoff())void depart(event);};
window.addEventListener('focus',async()=>{
 scheduleCaseListSync(true);
 const nav=state.nav,caseId=state.view?.case.caseId;
 if(!caseId||!localStorage.getItem(key(caseId)+':return'))return;
 try{const p=await api(casePath(caseId));receiveCase(p.view,nav,caseId);}
 catch(error){await reportCaseError(error,nav,caseId);}
});
for(const button of $('feedback').querySelectorAll('[data-answer]'))button.onclick=async()=>{
 const nav=state.nav,caseId=state.view?.case.caseId,prompt=state.feedbackPrompts.get(caseId);
 if(!prompt)return;
 try{
   await api(casePath(caseId)+'/booking-feedback',{method:'POST',body:JSON.stringify({departureId:prompt.departure.id,answer:button.dataset.answer})});
   state.feedbackPrompts.delete(caseId);
   if(draftKey()===caseId)show('feedback',false);
 }catch(error){await reportCaseError(error,nav,caseId);}
};
$('menu').onclick=event=>{
 if(desktopLayout.matches){state.sidebarCollapsed=false;syncSidebar();if(event.detail===0)$('collapse-plans').focus({preventScroll:true});return;}
 if($('plans').classList.contains('open'))return closePlans(event.detail===0);
 $('plans').classList.add('open');show('backdrop',true);$('menu').setAttribute('aria-expanded','true');syncBrand();scheduleCaseListSync(true);
 if(event.detail===0)$('collapse-plans').focus({preventScroll:true});
};$('backdrop').onclick=()=>closePlans();
document.addEventListener('pointerdown',event=>{
 const editor=state.conditionEditor;if(editor&&!editor.busy&&!editor.form.contains(event.target)&&!editor.anchor.contains(event.target))editor.cancel();
 if($('profile').open&&!$('profile').contains(event.target))$('profile').open=false;
});
document.addEventListener('keydown',event=>{
 if($('photo-viewer').open)return;
 if(event.key==='Escape'){if(state.conditionEditor&&!state.conditionEditor.busy)state.conditionEditor.cancel();$('profile').open=false;closeAnswer();closePlans(true);return;}
 if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.metaKey||event.ctrlKey||event.altKey||event.isComposing||!state.view||state.ui.view!=='CANDIDATES'||state.ui.atEnd||!$('answer-sheet').hidden||$('plans').classList.contains('open')||state.conditionEditor||document.activeElement?.closest('input,textarea,select,[contenteditable]'))return;
 const button=$(event.key==='ArrowLeft'?'previous':'next');if(!button.disabled){event.preventDefault();button.click();}
});
$('new-case').onclick=newPlan;$('brand').onclick=event=>{event.preventDefault();newPlan();};
$('logout').onclick=async()=>{
 clearEntryTransition();++state.nav;state.signingOut=true;scheduleCaseListSync();
 try{await api('/api/session',{method:'DELETE'});state.feedbackPrompts.clear();location.reload();}
 catch(error){
  state.signingOut=false;resetCaseRequests();render();
  if(state.view)openStream(state.view.case.caseId,state.nav);
  scheduleCaseListSync(true);report(error);
 }
};
$('use-location').onclick=()=>{
 const nav=state.nav,caseId=state.view?.case.caseId,taskVersion=state.view?.case.taskVersion;
 if(!caseId||state.locating||state.blocked)return;
 const fallback=new Error('Type a nearby station, address, or district instead.');
 clearError();
 if(!navigator.geolocation){report(fallback);return;}
 const id=requestId();state.locating=id;$('use-location').disabled=true;
 const finish=()=>{if(state.locating===id){state.locating=null;render();}};
 const denied=()=>{if(currentCase(nav,caseId))report(fallback);finish();};
 try{
  navigator.geolocation.getCurrentPosition(async p=>{
    if(!currentCase(nav,caseId))return;
    try{
      const result=await api(casePath(caseId)+'/location',{method:'POST',body:JSON.stringify({
        taskVersion,requestId:id,latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMeters:p.coords.accuracy,
      })});
      receiveCase(result.view,nav,caseId);
    }catch(error){await reportCaseError(error,nav,caseId);}
    finally{finish();}
  },denied);
 }catch{denied();}
};
export async function enter(user){state.user=user;show('login',false);show('app',true);text('profile-label',user.displayName||'Profile');text('profile-avatar',Array.from(String(user.displayName||'P'))[0].toLocaleUpperCase('en-US'));render();const nav=state.nav;const p=await api('/api/cases');for(const item of p.cases)updateCases(item);const active=localStorage.getItem('praxis:active:'+user.id);if(nav===state.nav&&active&&state.cases.has(active))await loadCase(active);}
$('login-form').onsubmit=async event=>{event.preventDefault();try{const p=await api('/api/session',{method:'POST',body:JSON.stringify({accessToken:$('access-token').value})});await enter(p.user);}catch(error){text('login-error',error.message);show('login-error',true);}};
void api('/api/session').then(p=>enter(p.user)).catch(()=>{show('login',true);show('app',false);});
