/** Browser projection only: all source facts and actions are checked by the server. */
export const WORKSPACE_CLIENT_SCRIPT = String.raw`'use strict';
const $ = id => document.getElementById(id);
const state = {user:null, cases:new Map(), view:null, nav:0, stream:null, blocked:false, ui:{view:'CANDIDATES',candidateId:null}, expiry:null, feedback:null, detailKey:'',questionKey:'',handoffKey:'',pendingQuestion:null,asking:false,diffKey:''};
const requestId = () => window.crypto.randomUUID();
const text = (id,value) => {const node=$(id), next=String(value == null?'':value);if(node.textContent!==next)node.textContent=next;};
const show = (id,visible) => {$(id).hidden=!visible;};
const element = (tag,value,className) => {const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(className)n.className=className;return n;};
function report(error){text('error',error.message||'Please try again.');show('error',true);}
function clearError(){text('error','');show('error',false);}
async function api(path,options){const init=options||{}, response=await fetch(path,{...init,headers:{...(init.body?{'content-type':'application/json'}:{}),...(init.headers||{})}});const payload=await response.json();if(!response.ok){const e=new Error(payload.error||'Please try again.');e.status=response.status;throw e;}return payload;}
function key(caseId){return 'praxis:workspace:'+state.user.id+':'+caseId;}
function savePosition(){if(!state.view)return;localStorage.setItem(key(state.view.case.caseId),JSON.stringify(state.ui));localStorage.setItem('praxis:active:'+state.user.id,state.view.case.caseId);}
function restorePosition(caseId){try{return JSON.parse(localStorage.getItem(key(caseId)))||{view:'CANDIDATES',candidateId:null};}catch{return {view:'CANDIDATES',candidateId:null};}}
function closePlans(){$('plans').classList.remove('open');show('backdrop',false);$('menu').setAttribute('aria-expanded','false');}
function sourceName(value){return ({TABLECHECK:'TableCheck',TABELOG:'Tabelog',GOOGLE_PLACES:'Google Maps',FIXTURE:'Fixture',fixture:'Fixture'})[value]||String(value||'Source');}
function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
function link(label,url){const n=element('a',label);const href=safeLink(url);if(href){n.href=href;n.target='_blank';n.rel='noopener noreferrer';}return n;}
function money(value){return '¥'+Number(value).toLocaleString('en-US');}
function displayTime(value){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
function displayDate(value){return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',weekday:'short',month:'short',day:'numeric'}).format(new Date(value.length===10?value+'T12:00:00+09:00':value));}
function availabilityTime(value){return displayDate(value)+' '+displayTime(value);}
function ids(){const r=state.view.restaurant;return state.view.case.phase==='PRESENT_RESULTS'?(r.presentedCandidateIds||[]):r.readyCandidateIds;}
function candidate(){return state.view&&state.view.restaurant.candidates.find(c=>c.restaurant.id===state.ui.candidateId);}
function offerFor(id){const r=state.view.restaurant;return (r.availability[id]||[]).find(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now());}
function currentHandoff(){const r=state.view.restaurant;return (r.bookingHandoffs||[]).find(h=>h.candidateId===state.ui.candidateId&&Date.parse(h.displayExpiresAt)>Date.now());}
function sourceFor(id){const r=state.view.restaurant, check=r.availabilityChecks[id], evidence=new Set(check&&check.evidenceIds||[]);return r.readEvidence.find(e=>e.candidateId===id&&e.sourceUrl&&evidence.has(e.evidenceId))||r.currentFactEvidence.find(e=>e.candidateId===id&&e.sourceUrl);}
function setView(view){closeAnswer();state.ui.view=view;savePosition();clearError();render();}
function updateCases(summary){state.cases.set(summary.caseId,summary);let button=$('case-list').querySelector('[data-case-id="'+CSS.escape(summary.caseId)+'"]');if(!button){button=element('button',undefined,'case-link');button.dataset.caseId=summary.caseId;button.append(element('span'),element('small'));button.onclick=()=>loadCase(summary.caseId);$('case-list').append(button);}button.firstChild.textContent=summary.title;button.lastChild.textContent=summary.phase==='PRESENT_RESULTS'?'Ready':summary.status==='ACTIVE'?'In progress':'';button.classList.toggle('active',!!state.view&&state.view.case.caseId===summary.caseId);}
function refreshCaseLinks(){for(const s of state.cases.values())updateCases(s);}
function openStream(caseId,nav){
  if(state.stream)state.stream.close();show('reconnecting',false);
  const stream=new EventSource('/api/cases/'+encodeURIComponent(caseId)+'/events');state.stream=stream;
  const current=()=>nav===state.nav&&state.stream===stream;
  stream.addEventListener('open',()=>{if(current())show('reconnecting',false);});
  stream.addEventListener('error',()=>{if(current())show('reconnecting',stream.readyState===EventSource.CONNECTING);});
  stream.addEventListener('case',event=>{if(!current()||state.blocked)return;try{accept(JSON.parse(event.data));}catch(error){report(error);}});
}
function accept(view){
  if(state.view&&view.case.caseId!==state.view.case.caseId)return;
  if(state.view&&view.case.taskVersion<state.view.case.taskVersion)return;
  if(state.ui.atEnd&&view.case.phase==='PRESENT_RESULTS'&&state.view&&JSON.stringify(view.restaurant.presentedCandidateIds)!==JSON.stringify(state.view.restaurant.presentedCandidateIds)){state.ui.atEnd=false;state.ui.candidateId=null;}
  state.view=view;updateCases(view.case);render();
  const pending=state.pendingQuestion,q=view.restaurant.pageQuestion;
  if(pending&&pending.caseId===view.case.caseId&&q&&q.requestId===pending.requestId&&q.result){
    state.pendingQuestion=null;
    if(state.ui.view==='DETAILS'&&state.ui.candidateId===pending.candidateId)openAnswer(q);
  }
  if(view.restaurant.bookingFeedbackAvailable)void claimFeedback();
}
async function loadCase(caseId){const nav=++state.nav;state.blocked=false;state.feedback=null;state.pendingQuestion=null;closeAnswer();if(state.stream)state.stream.close();show('reconnecting',false);clearError();try{const p=await api('/api/cases/'+encodeURIComponent(caseId));if(nav!==state.nav)return;state.view=null;state.ui=restorePosition(caseId);state.detailKey='';state.handoffKey='';accept(p.view);savePosition();openStream(caseId,nav);closePlans();}catch(error){if(nav===state.nav)report(error);}}
function newPlan(){closeAnswer();show('reconnecting',false);state.pendingQuestion=null;++state.nav;if(state.stream)state.stream.close();state.stream=null;state.view=null;state.feedback=null;state.blocked=false;clearTimeout(state.expiry);localStorage.removeItem('praxis:active:'+state.user.id);state.ui={view:'CANDIDATES',candidateId:null};$('message').value='';clearError();closePlans();render();refreshCaseLinks();$('message').focus();}
function renderProgress(){
  const r=state.view.restaurant,p=r.progress;
  show('progress',p.active);$('progress').classList.toggle('has-card',ids().length>0);$('brand').classList.toggle('working',p.active);
  if(!p.active)return;
  const rows=[['request','Request understood',true],['search',p.discoveredCount===undefined?'Finding places':'Places found',p.discoveredCount!==undefined]];
  if(p.discoveredCount!==undefined){
    let label=r.intentDraft&&r.intentDraft.target&&r.intentDraft.target.goal==='RECOMMENDATION'?'Checking details':'Checking availability';
    if(p.checkedCount!==undefined)label+='　'+p.checkedCount+' checked';
    rows.push(['check',label,false]);
  }
  for(const row of rows){
    let node=$('stages').querySelector('[data-stage="'+row[0]+'"]');
    if(!node){node=element('div',undefined,'stage');node.dataset.stage=row[0];node.append(element('span',undefined,'mark'),element('span'));$('stages').append(node);}
    node.hidden=false;node.lastChild.textContent=row[1];node.className='stage '+(row[2]?'done':'current');
  }
  for(const node of $('stages').children)node.hidden=!rows.some(row=>row[0]===node.dataset.stage);
  $('stop').disabled=state.blocked;
}
function citation(container,item,index){const d=element('details');d.dataset.sourceId=item.url+':'+index;d.append(element('summary','Source'));const quote=element('blockquote',item.text);d.append(quote,link('Source page',item.url),element('p','Read at: '+item.readAt,'muted'));container.append(d);}
function preserveSources(target,build){const open=new Set([...target.querySelectorAll('details[open]')].map(n=>n.dataset.sourceId));target.replaceChildren();build(target);for(const d of target.querySelectorAll('details'))d.open=open.has(d.dataset.sourceId);}
function renderCard(){const c=candidate();if(!c)return;const id=c.restaurant.id,r=state.view.restaurant,offer=offerFor(id), eligible=ids().includes(id), check=r.availabilityChecks[id], source=sourceFor(id);const card=$('candidate-card'),changed=card.dataset.candidateId!==id;card.dataset.candidateId=id;text('restaurant-name',c.restaurant.outletName);text('restaurant-initial',Array.from(c.restaurant.outletName)[0]||'');const facts=[c.restaurant.address];if(c.distanceObservation)facts.push(c.distanceObservation.meters+' m away');if(offer&&offer.price)facts.push(money(offer.price.amount)+(offer.price.basis==='PER_PERSON'?' per guest':''));$('key-facts').replaceChildren(...facts.map(v=>element('span',v)));$('availability').dataset.status=offer&&eligible?'available':'unknown';text('availability',offer&&eligible?'Available '+availabilityTime(offer.dateTime):check&&check.displayExpiresAt&&Date.parse(check.displayExpiresAt)<=Date.now()?'Availability expired':'Not checked');show('evidence',!!source&&!!source.observedAt);if(source)text('evidence',sourceName(source.provider)+', checked '+displayTime(source.observedAt));text('recommendation',(c.matchReasons||[])[0]||'');const saved=(r.shortlistCandidateIds||[]).includes(id);$('bookmark').setAttribute('aria-pressed',String(saved));$('bookmark').setAttribute('aria-label',saved?'Remove from saved':'Save for later');const n=ids().indexOf(id);text('card-counter',n>=0&&!r.progress.active?(n+1)+' of '+ids().length:'');show('card-counter',!r.progress.active);$('previous').disabled=n<=0;$('next').disabled=n<0||(n>=ids().length-1&&(r.progress.active||state.view.case.phase!=='PRESENT_RESULTS'));$('choose').disabled=!eligible;if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches)card.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});}
function renderDetails(){const c=candidate();if(!c)return;const r=state.view.restaurant,id=c.restaurant.id,facts=r.currentFactEvidence.filter(f=>f.candidateId===id),conditions=r.conditionStates&&r.conditionStates[id]||[];text('details-name',c.restaurant.outletName);const signature=JSON.stringify([id,facts,conditions]);if(signature!==state.detailKey){state.detailKey=signature;preserveSources($('details-content'),target=>{target.append(element('p',c.restaurant.address,'muted'));for(const fact of facts){const values=[],claims=fact.claims||{};if(Array.isArray(claims.listedCourseDetails))values.push(...claims.listedCourseDetails);if(typeof claims.coursePriceYen==='number')values.push('Course '+money(claims.coursePriceYen));for(const k of ['cancellationTerms','noShowTerms'])if(typeof claims[k]==='string')values.push(claims[k]);if(!values.length)continue;const row=element('div',undefined,'fact');for(const value of values)row.append(element('p',value));if(fact.sourceUrl)row.append(link('Terms source',fact.sourceUrl));target.append(row);}for(const item of conditions){const row=element('div',undefined,'fact');row.append(element('p',item.text+' — '+({MET:'met',NOT_MET:'not met',NOT_CHECKED:'not checked'})[item.status]));for(const source of item.sources||[])row.append(element('p','Observed '+(source.field==='PRICE'?'price: ':'')+source.quote,'muted'),link('Source',source.sourceUrl));target.append(row);}});}renderAsked(id);}
function renderAnswer(target,result){
  preserveSources(target,container=>{
    container.append(element('p',result.status==='ANSWERED'?result.answer:result.status==='NOT_STATED'?'Not stated on the page':'This answer could not be verified.'));
    for(const [i,item]of(result.citations||[]).entries())citation(container,item,i);
    if(!(result.citations||[]).length)for(const item of result.checkedPages||[])container.append(link('Checked page',item.url),element('p','Read at: '+item.readAt,'muted'));
    if(result.confirmationRequired)container.append(element('p','Please confirm with the restaurant.'));
  });
}
function renderAsked(id){
  const history=state.view.restaurant.questionHistory.filter(q=>q.candidateId===id&&q.result),q=history[0];
  show('asked-history',!!q);if(!q)return;
  const signature=JSON.stringify([id,history]);if(state.questionKey===signature)return;state.questionKey=signature;
  text('asked-question',q.question);renderAnswer($('asked-result'),q.result);
  $('asked-earlier').replaceChildren(...history.slice(1).map(item=>{const row=element('article',undefined,'asked-item'),answer=element('div',undefined,'asked-answer');row.append(element('p',item.question),answer);renderAnswer(answer,item.result);return row;}));
}
function closeAnswer(){show('answer-sheet',false);show('answer-backdrop',false);}
function openAnswer(q){
  const c=candidate();if(!c||q.candidateId!==c.restaurant.id)return;
  text('answer-place',c.restaurant.outletName);renderAnswer($('question-result'),q.result);
  show('answer-sheet',true);show('answer-backdrop',true);$('answer-sheet').focus({preventScroll:true});
}
async function askCurrentPlace(message){
  const old=state.view,c=candidate(),nav=state.nav;if(!old||!c||old.case.phase!=='PRESENT_RESULTS')return;
  const id=requestId();state.pendingQuestion={requestId:id,caseId:old.case.caseId,candidateId:c.restaurant.id};state.asking=true;$('send').disabled=true;clearError();
  try{const p=await api('/api/cases/'+encodeURIComponent(old.case.caseId)+'/questions',{method:'POST',body:JSON.stringify({candidateId:c.restaurant.id,question:message,taskVersion:old.case.taskVersion,requestId:id})});if(nav!==state.nav)return;accept(p.view);}
  catch(error){if(nav===state.nav){state.pendingQuestion=null;report(error);}}
  finally{state.asking=false;if(nav===state.nav)render();}
}
function renderConditions(){
  const r=state.view.restaurant,draft=r.intentDraft||{},parts=[];
  if(draft.area)parts.push([(r.searchLocation&&r.searchLocation.label)||draft.area.query]);
  if(draft.date)parts.push([displayDate(draft.date)]);
  if(draft.timeWindow)parts.push([draft.timeWindow.earliest+(draft.timeWindow.latest!==draft.timeWindow.earliest?'–'+draft.timeWindow.latest:'')]);
  if(draft.partySize)parts.push([draft.partySize+' guests',draft.partySizeSource==='INFERRED_CLOSED_PARTY']);
  if(draft.budgetPerPerson)parts.push([money(draft.budgetPerPerson.max)+' per guest']);
  for(const criterion of draft.criteria||[])parts.push([criterion.text]);
  $('request-conditions').replaceChildren(...parts.map(([label,inferred])=>{
    const button=element('button',label+(inferred?'?':''));button.onclick=()=>{setView('CANDIDATES');$('message').value='Change '+label+' to ';$('message').focus({preventScroll:true});};return button;
  }));
}
function changeReason(code){return ({OVER_BUDGET:'Over budget',NEW_TIME_MISMATCH:"Doesn't match the new time",NO_LONGER_MATCHES:'No longer matches'})[code]||'No longer matches';}
function renderChanges(){
  const diff=state.view.restaurant.revisionDiff;show('revision-changes',!!diff);if(!diff)return;
  text('removed-count',diff.removed.length+' removed');text('added-count',diff.added.length+' added');
  const signature=JSON.stringify(diff);if(signature===state.diffKey)return;state.diffKey=signature;
  $('removed-list').replaceChildren(...diff.removed.map(item=>{const row=element('li');row.dataset.candidateId=item.candidateId;row.append(element('span',item.outletName),element('p',changeReason(item.reasonCode),'muted'));return row;}));
}
function renderSaved(){
  const saved=state.view.restaurant.savedCandidates;show('saved-empty',!saved.length);$('saved-list').replaceChildren();
  for(const item of saved){const button=element('button',undefined,'saved-row'),description=element('div');description.append(element('span',item.outletName));
    if(item.reasonCode)description.append(element('p',changeReason(item.reasonCode),'muted'));button.append(description);button.dataset.candidateId=item.candidateId;button.disabled=!item.current;
    if(item.current){button.append(element('span','→'));button.onclick=()=>{state.ui.atEnd=false;state.ui.candidateId=item.candidateId;setView('CANDIDATES');};}
    $('saved-list').append(button);
  }
}
function renderReadState(end){
  const r=state.view.restaurant,status=r.readStatus;
  const empty=status.kind==='NO_QUALIFIED_RESULTS'||status.kind==='ALL_SOURCES_FAILED';
  show('empty-state',empty);show('understanding-error',status.kind==='MODEL_FAILURE');
  if(empty){text('empty-message',status.kind==='ALL_SOURCES_FAILED'?"Couldn't reach the sources. Try again?":'Nothing matched yet.');show('empty-adjust',status.kind==='NO_QUALIFIED_RESULTS');show('empty-more',status.kind==='NO_QUALIFIED_RESULTS'&&status.canFindMore);show('empty-retry',status.kind==='ALL_SOURCES_FAILED'&&status.canFindMore);}
  const list=ids(),last=list.indexOf(state.ui.candidateId)===list.length-1;
  show('partial-source-note',status.partialSourceFailure&&!r.progress.active&&(end||(state.ui.view==='CANDIDATES'&&last)));
  return empty||status.kind==='MODEL_FAILURE';
}
function renderHandoff(){
  const c=candidate();if(!c)return;
  const h=currentHandoff(),source=sourceFor(c.restaurant.id);
  text('handoff-name',c.restaurant.outletName);
  text('handoff-provider-name',h?sourceName(h.provider):'');show('handoff-provider',!!h);
  const check=state.view.restaurant.availabilityChecks[c.restaurant.id],expired=!!(check&&check.displayExpiresAt&&Date.parse(check.displayExpiresAt)<=Date.now());
  show('departure',!!h||expired);show('departure-fields',!!h);show('handoff-unavailable',!h&&!expired);
  if(!h&&expired){text('departure-title','Check availability again');$('departure').href='#';}
  show('selection-hint',!!h&&!!h.selectionHint);show('verification-hint',!!h&&!!h.verificationHint);
  if(h){
    const parts=h.continueLabel.split(' — ');
    text('departure-title',parts[0]+' ↗');const fields=parts[1]||'';text('departure-fields',fields.charAt(0).toUpperCase()+fields.slice(1));
    $('departure').href=h.url;text('selection-hint',h.selectionHint||'');text('verification-hint',h.verificationHint||'');
  }
  const signature=JSON.stringify([c.restaurant.id,h||null]);
  if(signature!==state.handoffKey){
    state.handoffKey=signature;
    preserveSources($('handoff-terms'),target=>{
      if(!h)return;
      if(h.selectionHint)target.append(element('h3',h.selectionHint.replace(/^Pick /,'')));
      for(const [index,term]of h.terms.entries()){
        const row=element('div',undefined,'fact');
        row.append(element('p',term.label));
        for(const [i,quote]of term.citations.entries())citation(row,quote,i);
        if(h.cancellationNotice&&index===1){
          row.dataset.kind='cancellation-conflict';
          row.append(element('p',h.cancellationConfirmation,'muted'));
        }
        target.append(row);
      }
      if(h.platformFee)target.append(element('p',h.platformFee.label,'muted'));
    });
  }
  const href=h&&h.url||source&&safeLink(source.sourceUrl);
  show('direct-source',!!href);if(href)$('direct-source').href=href;
}
function updateComposerClearance(){const host=$('workspace-composer');if(host.hidden)return;const bottom=parseFloat(getComputedStyle(host).bottom)||0;document.documentElement.style.setProperty('--composer-clearance',(host.getBoundingClientRect().height+bottom+24)+'px');}
new ResizeObserver(updateComposerClearance).observe($('workspace-composer'));window.addEventListener('resize',updateComposerClearance);
function render(){
  const has=!!state.view;show('home',!has);show('case-workspace',has);show('workspace-composer',has);
  const parent=has?$('workspace-composer'):$('home-composer');if($('composer').parentElement!==parent)parent.append($('composer'));
  const asking=has&&state.ui.view==='DETAILS';$('message').placeholder=has?(asking?'Ask about this place':'Adjust anything?'):'A quiet dinner with friends in Shibuya on Saturday';
  $('send').disabled=state.blocked||state.asking||(asking&&state.view.case.phase!=='PRESENT_RESULTS');
  if(!has){$('brand').classList.remove('working');show('feedback',false);return;}
  const r=state.view.restaurant,candidateIds=ids();
  if(!state.ui.candidateId&&candidateIds.length)state.ui.candidateId=candidateIds[0];
  if(state.ui.candidateId&&!r.candidates.some(c=>c.restaurant.id===state.ui.candidateId))state.ui.candidateId=candidateIds[0]||null;
  if(state.ui.view==='CANDIDATES'&&!state.ui.atEnd&&state.view.case.phase==='PRESENT_RESULTS'&&candidateIds.length&&!candidateIds.includes(state.ui.candidateId))state.ui.candidateId=candidateIds[0];
  text('case-title',state.view.case.title);const savedCount=(r.shortlistCandidateIds||[]).length;text('saved-count',savedCount||'');show('saved-count',savedCount>0);$('saved').setAttribute('aria-label','Saved'+(savedCount?' '+savedCount:''));
  renderConditions();renderChanges();renderProgress();const mode=state.ui.view,end=mode==='CANDIDATES'&&state.ui.atEnd&&!r.progress.active&&state.view.case.phase==='PRESENT_RESULTS';
  show('candidate-panel',mode==='CANDIDATES'&&!!candidate()&&!end);show('batch-end',!!end);show('details',mode==='DETAILS'&&!!candidate());show('saved-panel',mode==='SAVED');show('handoff',mode==='HANDOFF'&&!!candidate());
  show('end-saved',savedCount>0);text('end-saved-count',savedCount);$('end-saved').setAttribute('aria-label','Saved '+savedCount);$('find-more').disabled=state.blocked;
  if(mode==='CANDIDATES'&&!end)renderCard();if(mode==='DETAILS')renderDetails();if(mode==='SAVED')renderSaved();if(mode==='HANDOFF')renderHandoff();
  const shortState=renderReadState(end),last=[...state.view.conversation.messages].reverse().find(m=>m.role==='ASSISTANT');text('messages',!shortState&&last&&(!candidate()||mode==='CONVERSATION')?last.content:'');if(r.progress.stopped)text('messages','Search stopped.');
  show('mode-note',state.view.mode==='FIXTURE');text('mode-note','Fixture only. No real availability or reservations.');show('use-location',(r.missingRequiredFields||[]).includes('location'));savePosition();clearTimeout(state.expiry);
  const expiry=Object.values(r.availability).flat().map(o=>Date.parse(o.displayExpiresAt)).filter(t=>t>Date.now()).sort((a,b)=>a-b)[0];if(expiry)state.expiry=setTimeout(render,Math.min(expiry-Date.now()+10,2147483647));show('feedback',!!state.feedback);
}
function viewContext(){return {view:state.view?state.ui.view:'HOME',...(state.view&&!state.ui.atEnd&&state.ui.candidateId&&['CANDIDATES','DETAILS','HANDOFF'].includes(state.ui.view)?{candidateId:state.ui.candidateId}:{}),comparedCandidateIds:[]};}
$('composer').onsubmit=async event=>{event.preventDefault();const message=$('message').value.trim();if(!message||state.blocked||state.asking)return;if(state.view&&state.ui.view==='DETAILS'){await askCurrentPlace(message);return;}const nav=state.nav,old=state.view,context=viewContext();state.blocked=true;$('send').disabled=true;clearError();try{const path=old?'/api/conversations/'+encodeURIComponent(old.conversation.id)+'/messages':'/api/cases';const body={message,requestId:requestId(),viewContext:context,...(old?{taskVersion:old.case.taskVersion}:{})};const p=await api(path,{method:'POST',body:JSON.stringify(body)});if(nav!==state.nav)return;state.blocked=false;const modelFailed=p.view.restaurant.readStatus.kind==='MODEL_FAILURE';state.view=null;if(!modelFailed||!old)state.ui={view:'CANDIDATES',candidateId:null};state.detailKey='';state.handoffKey='';if(!modelFailed&&$('message').value.trim()===message)$('message').value='';accept(p.view);openStream(p.view.case.caseId,nav);savePosition();}catch(error){if(nav===state.nav)report(error);}finally{if(nav===state.nav){state.blocked=false;$('send').disabled=false;}}};
$('stop').onclick=async()=>{if(state.blocked||!state.view)return;const nav=state.nav;state.blocked=true;$('stop').disabled=true;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/run',{method:'DELETE'});if(nav!==state.nav)return;state.blocked=false;accept(p.view);}catch(error){report(error);}finally{if(nav===state.nav){state.blocked=false;$('stop').disabled=false;}}};
$('bookmark').onclick=async()=>{const c=candidate();if(!c)return;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/shortlist',{method:'POST',body:JSON.stringify({candidateId:c.restaurant.id,shortlisted:!(state.view.restaurant.shortlistCandidateIds||[]).includes(c.restaurant.id),taskVersion:state.view.case.taskVersion,requestId:requestId()})});accept(p.view);}catch(error){report(error);}};
function moveCard(delta){
  const list=ids(),i=list.indexOf(state.ui.candidateId);
  if(state.ui.atEnd&&delta<0){state.ui.atEnd=false;savePosition();render();return;}
  const id=list[i+delta];
  if(id){closeAnswer();state.ui.candidateId=id;state.ui.atEnd=false;state.detailKey='';state.handoffKey='';savePosition();render();}
  else if(delta>0&&i===list.length-1&&state.view.case.phase==='PRESENT_RESULTS'&&!state.view.restaurant.progress.active){state.ui.atEnd=true;savePosition();render();}
}
$('previous').onclick=()=>moveCard(-1);$('next').onclick=()=>moveCard(1);
$('details-button').onclick=()=>setView('DETAILS');$('details-back').onclick=()=>setView('CANDIDATES');$('saved').onclick=()=>setView('SAVED');$('saved-back').onclick=()=>setView('CANDIDATES');$('choose').onclick=()=>setView('HANDOFF');$('handoff-back').onclick=()=>setView('CANDIDATES');
async function refreshCase(){try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/refresh',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId()})});accept(p.view);}catch(error){report(error);}}
$('refresh').onclick=refreshCase;
$('answer-backdrop').onclick=closeAnswer;$('answer-dismiss').onclick=closeAnswer;
let answerDragY=null;$('answer-dismiss').onpointerdown=event=>{answerDragY=event.clientY;$('answer-dismiss').setPointerCapture(event.pointerId);};
$('answer-dismiss').onpointerup=event=>{if(answerDragY!==null&&event.clientY-answerDragY>40)closeAnswer();answerDragY=null;};
$('batch-back').onclick=()=>moveCard(-1);$('end-saved').onclick=()=>setView('SAVED');$('end-adjust').onclick=()=>{$('message').focus({preventScroll:true});};
async function findMore(){
  if(state.blocked)return;const nav=state.nav;state.blocked=true;$('find-more').disabled=true;
  try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/another-batch',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId()})});if(nav!==state.nav)return;state.blocked=false;state.ui.atEnd=false;state.ui.candidateId=null;accept(p.view);}
  catch(error){if(nav===state.nav)report(error);}finally{if(nav===state.nav){state.blocked=false;render();}}
}
$('find-more').onclick=findMore;$('empty-more').onclick=findMore;$('empty-retry').onclick=findMore;$('empty-adjust').onclick=()=>{$('message').focus({preventScroll:true});};
async function depart(event){const h=currentHandoff();if(!h){event.preventDefault();await refreshCase();return;}event.preventDefault();const target=window.open('about:blank','_blank');if(target)target.opener=null;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/booking-departures',{method:'POST',body:JSON.stringify({candidateId:h.candidateId,offerId:h.offerId,taskVersion:state.view.case.taskVersion,requestId:requestId()})});localStorage.setItem(key(state.view.case.caseId)+':return','1');if(target)target.location.href=p.url;else throw new Error('Please allow this source tab to open.');}catch(error){if(target)target.close();report(error);}}
$('departure').onclick=depart;$('direct-source').onclick=event=>{if(currentHandoff())void depart(event);};
async function claimFeedback(){if(!state.view||state.feedback||state.claiming)return;const id=state.view.case.caseId;state.claiming=true;try{const p=await api('/api/cases/'+encodeURIComponent(id)+'/booking-feedback/claim',{method:'POST',body:'{}'});if(!state.view||state.view.case.caseId!==id)return;localStorage.removeItem(key(id)+':return');state.feedback=p.prompt||null;show('feedback',!!state.feedback);}catch(error){report(error);}finally{state.claiming=false;}}
window.addEventListener('focus',async()=>{if(!state.view||!localStorage.getItem(key(state.view.case.caseId)+':return'))return;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId));accept(p.view);}catch(error){report(error);}});
for(const button of $('feedback').querySelectorAll('[data-answer]'))button.onclick=async()=>{if(!state.feedback)return;const prompt=state.feedback;try{await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/booking-feedback',{method:'POST',body:JSON.stringify({departureId:prompt.departure.id,answer:button.dataset.answer})});state.feedback=null;show('feedback',false);}catch(error){report(error);}};
$('menu').onclick=()=>{const open=$('plans').classList.toggle('open');show('backdrop',open);$('menu').setAttribute('aria-expanded',String(open));};$('backdrop').onclick=closePlans;
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeAnswer();closePlans();}});
$('new-case').onclick=newPlan;$('brand').onclick=event=>{event.preventDefault();newPlan();};
$('logout').onclick=async()=>{await api('/api/session',{method:'DELETE'});location.reload();};
$('use-location').onclick=()=>{if(!navigator.geolocation)return report(new Error('Type a nearby station, address, or district instead.'));navigator.geolocation.getCurrentPosition(async p=>{try{const result=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/location',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId(),latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMeters:p.coords.accuracy})});accept(result.view);}catch(error){report(error);}},()=>report(new Error('Type a nearby station, address, or district instead.')));};
async function enter(user){state.user=user;show('login',false);show('app',true);text('profile-name',user.displayName||'Your account');render();const nav=state.nav;const p=await api('/api/cases');for(const item of p.cases)updateCases(item);const active=localStorage.getItem('praxis:active:'+user.id);if(nav===state.nav&&active&&state.cases.has(active))await loadCase(active);}
$('login-form').onsubmit=async event=>{event.preventDefault();try{const p=await api('/api/session',{method:'POST',body:JSON.stringify({accessToken:$('access-token').value})});await enter(p.user);}catch(error){text('login-error',error.message);show('login-error',true);}};
void api('/api/session').then(p=>enter(p.user)).catch(()=>{show('login',true);show('app',false);});
`;
