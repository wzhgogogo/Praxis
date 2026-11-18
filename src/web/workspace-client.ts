import { WORKSPACE_PHOTO_CLIENT_SCRIPT } from "./workspace-photo-client.js";
/** Browser projection only: all source facts and actions are checked by the server. */
export const WORKSPACE_CLIENT_SCRIPT = String.raw`'use strict';
const $ = id => document.getElementById(id);
const state = {user:null, cases:new Map(), view:null, nav:0, stream:null, blocked:false, ui:{view:'CANDIDATES',candidateId:null}, expiry:null, feedback:null, detailKey:'',questionKey:'',handoffKey:'',pendingQuestion:null,asking:false,diffKey:'',pendingCase:null,preview:null,entryPace:null};
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
function closePlans(restoreFocus=false){const wasOpen=$('plans').classList.contains('open');$('plans').classList.remove('open');show('backdrop',false);$('menu').setAttribute('aria-expanded','false');syncBrand();if(restoreFocus&&wasOpen)$('menu').focus({preventScroll:true});}
const desktopLayout=matchMedia('(min-width:960px)');let sidebarCollapsed=false;
function syncBrand(){
 const inSidebar=desktopLayout.matches?!sidebarCollapsed:$('plans').classList.contains('open');
 const brandHost=inSidebar?$('plans-brand'):$('topbar');
 if($('brand').parentElement!==brandHost){if(brandHost===$('topbar'))$('menu').after($('brand'));else brandHost.prepend($('brand'));}
}
function syncSidebar(){
 const desktop=desktopLayout.matches,collapsed=desktop&&sidebarCollapsed;
 document.body.classList.toggle('sidebar-collapsed',collapsed);$('plans').inert=collapsed;
 if(desktop)closePlans();else syncBrand();
 $('menu').setAttribute('aria-label',desktop?'Expand sidebar':'My plans');$('collapse-plans').setAttribute('aria-label',desktop?'Collapse sidebar':'Close sidebar');
}
desktopLayout.addEventListener('change',()=>{closePlans();syncSidebar();});syncSidebar();
$('collapse-plans').onclick=event=>{if(desktopLayout.matches){sidebarCollapsed=true;syncSidebar();if(event.detail===0)$('menu').focus({preventScroll:true});}else closePlans(event.detail===0);};
function sourceName(value){return ({TABLECHECK:'TableCheck',TABELOG:'Tabelog',GOOGLE_PLACES:'Google Maps',FIXTURE:'Fixture',fixture:'Fixture'})[value]||String(value||'Source');}
function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
function link(label,url){const n=element('a',label);const href=safeLink(url);if(href){n.href=href;n.target='_blank';n.rel='noopener noreferrer';}return n;}
function money(value){return '¥'+Number(value).toLocaleString('en-US');}
function displayTime(value){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
function displayDate(value){return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',weekday:'short',month:'short',day:'numeric'}).format(new Date(value.length===10?value+'T12:00:00+09:00':value));}
function availabilityTime(value){return displayDate(value)+' '+displayTime(value);}
function ids(){const r=state.view.restaurant;return state.view.case.phase==='PRESENT_RESULTS'?(r.presentedCandidateIds||[]):r.readyCandidateIds;}
function candidate(){return state.view&&state.view.restaurant.candidates.find(c=>c.restaurant.id===state.ui.candidateId);}
function offerFor(id){const fresh=(state.view.restaurant.availability[id]||[]).filter(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now());return fresh.find(o=>o.id===state.ui.offerId)||fresh[0];}
function handoffs(){return (state.view.restaurant.bookingHandoffs||[]).filter(h=>h.candidateId===state.ui.candidateId&&Date.parse(h.displayExpiresAt)>Date.now());}
function currentHandoff(){const list=handoffs(),viewed=(state.view.restaurant.availability[state.ui.candidateId]||[]).some(o=>o.id===state.ui.offerId);return viewed?list.find(h=>h.offerId===state.ui.offerId):list[0];}
function sourceFor(id){const r=state.view.restaurant, check=r.availabilityChecks[id], evidence=new Set(check&&check.evidenceIds||[]);return r.readEvidence.find(e=>e.candidateId===id&&e.sourceUrl&&evidence.has(e.evidenceId))||r.currentFactEvidence.find(e=>e.candidateId===id&&e.sourceUrl);}
function cancelPreparation(){state.preparing=null;}
function setView(view){closePhotos();clearEntryTransition();cancelPreparation();closeAnswer();state.ui.view=view;savePosition();clearError();render();$('case-workspace').scrollTop=0;}
// Fixture pacing changes presentation only; state.view remains the accepted server projection.
const previewParameters=new URLSearchParams(location.search),previewPace=previewParameters.get('pace')==='preview';
const requestedPaceStep=Number(previewParameters.get('paceStep')),paceStep=Number.isFinite(requestedPaceStep)&&requestedPaceStep>0?requestedPaceStep:1600;
const previewSteps=[paceStep,paceStep*2,paceStep*3,paceStep*3.875];
const fixturePresentation=view=>view.mode==='FIXTURE'||document.documentElement.dataset.fixturePreview==='true';
function clearEntryPreview(){if(!state.preview)return;clearTimeout(state.preview.timer);state.preview=null;refreshCaseLinks();}
function clearEntryTransition(){state.pendingCase=null;state.entryPace=null;clearEntryPreview();}
function startEntryPreview(view,startedAt){
 if(!previewPace||!fixturePresentation(view)||view.restaurant.progress.active||view.case.phase!=='PRESENT_RESULTS'||!(view.restaurant.presentedCandidateIds||[]).length)return;
 const preview={caseId:view.case.caseId,startedAt,phase:'understanding',timer:0};state.preview=preview;
 const advance=()=>{if(state.preview!==preview)return;const elapsed=performance.now()-startedAt;
  if(elapsed>=previewSteps[3]){clearEntryPreview();return;}
  preview.phase=elapsed<previewSteps[0]?'understanding':elapsed<previewSteps[1]?'finding':elapsed<previewSteps[2]?'checking':'card';const next=previewSteps.find(at=>at>elapsed);
  preview.timer=setTimeout(()=>{advance();render();},Math.max(0,Math.ceil(next-elapsed)));
 };advance();
}
function displayTitle(value){return String(value).replace(/\p{L}/u,letter=>letter.toLocaleUpperCase('en-US'));}
function updateCases(summary){state.cases.set(summary.caseId,summary);let button=$('case-list').querySelector('[data-case-id="'+CSS.escape(summary.caseId)+'"]');if(!button){button=element('button',undefined,'case-link');button.dataset.caseId=summary.caseId;button.append(element('span'),element('small'));button.onclick=()=>loadCase(summary.caseId);$('case-list').append(button);}button.firstChild.textContent=displayTitle(summary.title);button.title=summary.title;button.lastChild.textContent=state.preview&&state.preview.caseId===summary.caseId?'In progress':summary.phase==='PRESENT_RESULTS'?'Ready':summary.status==='ACTIVE'?'In progress':'';}
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
  if(state.entryPace!==null){
   if(!fixturePresentation(view)||view.restaurant.progress.active&&view.case.phase!=='UNDERSTANDING'||['MODEL_FAILURE','NO_QUALIFIED_RESULTS','ALL_SOURCES_FAILED','OTHER_FAILURE'].includes(view.restaurant.readStatus.kind))state.entryPace=null;
   else if(view.case.phase==='PRESENT_RESULTS'){const startedAt=state.entryPace;state.entryPace=null;startEntryPreview(view,startedAt);}
  }
  if(state.preview&&(view.restaurant.progress.active||view.case.phase!=='PRESENT_RESULTS'))clearEntryPreview();
  state.view=view;updateCases(view.case);finishPreparation();render();
  const pending=state.pendingQuestion,q=view.restaurant.pageQuestion;
  if(pending&&pending.caseId===view.case.caseId&&q&&q.requestId===pending.requestId&&q.result){
    state.pendingQuestion=null;
    if(state.ui.view==='DETAILS'&&state.ui.candidateId===pending.candidateId)openAnswer(q);
  }
  if(view.restaurant.bookingFeedbackAvailable)void claimFeedback();
}
async function loadCase(caseId){clearEntryTransition();state.sending=false;cancelPreparation();const nav=++state.nav;state.blocked=false;state.feedback=null;state.pendingQuestion=null;closeAnswer();if(state.stream)state.stream.close();show('reconnecting',false);clearError();try{const p=await api('/api/cases/'+encodeURIComponent(caseId));if(nav!==state.nav)return;state.view=null;state.ui=restorePosition(caseId);state.detailKey='';state.handoffKey='';accept(p.view);savePosition();openStream(caseId,nav);closePlans();}catch(error){if(nav===state.nav){render();report(error);}}}
function newPlan(){clearEntryTransition();state.sending=false;cancelPreparation();closeAnswer();show('reconnecting',false);state.pendingQuestion=null;++state.nav;if(state.stream)state.stream.close();state.stream=null;state.view=null;state.feedback=null;state.blocked=false;clearTimeout(state.expiry);localStorage.removeItem('praxis:active:'+state.user.id);state.ui={view:'CANDIDATES',candidateId:null};setMessage('');clearError();closePlans();render();refreshCaseLinks();$('message').focus();}
function renderProgress(){
 const pending=state.pendingCase,preview=state.preview,r=state.view&&state.view.restaurant,p=r&&r.progress;
 const understanding=!!state.view&&state.view.case.phase==='UNDERSTANDING';
 const active=!!pending||!!preview||understanding||!!(p.active&&!p.stopped&&!['MODEL_FAILURE','NO_QUALIFIED_RESULTS','ALL_SOURCES_FAILED','OTHER_FAILURE'].includes(r.readStatus.kind));
 const hasCard=!pending&&(!preview||preview.phase==='card')&&!!candidate();
 show('progress',active);$('progress').classList.toggle('has-card',hasCard);$('brand').classList.toggle('working',active);show('stop',!pending&&!preview&&!!p.active&&active);$('stop').disabled=state.blocked;
 if(!active)return;
 let rows;
 if(pending||understanding||preview&&preview.phase==='understanding')rows=[['request','Understanding your request',false]];
 else if(preview)rows=[['request','Request understood',true],['search',preview.phase==='finding'?'Finding places':'Places found',preview.phase!=='finding']];
 else rows=[['request','Request understood',true],['search',p.discoveredCount===undefined?'Finding places':'Places found',p.discoveredCount!==undefined]];
 if(!pending&&!understanding&&(!preview&&p.discoveredCount!==undefined||preview&&['checking','card'].includes(preview.phase))){
  const label=r.intentDraft&&r.intentDraft.target&&r.intentDraft.target.goal==='RECOMMENDATION'?'Checking details':'Checking availability';
  rows.push(['check',label,false,preview?(preview.phase==='checking'?0:Math.min(1,p.checkedCount||0)):p.checkedCount]);
 }
 for(const row of rows){
  let node=$('stages').querySelector('[data-stage="'+row[0]+'"]');
  if(!node){node=element('div',undefined,'stage');node.dataset.stage=row[0];node.append(element('span',undefined,'mark'),element('span'));$('stages').append(node);}
  node.hidden=false;node.lastChild.replaceChildren(document.createTextNode(row[1]));if(row[3]!==undefined)node.lastChild.append(element('span',' '+row[3]+' checked','stage-count'));node.className='stage '+(row[2]?'done':'current');
 }
 for(const node of $('stages').children)node.hidden=!rows.some(row=>row[0]===node.dataset.stage);
}
function citation(container,item,index){const d=element('details');d.dataset.sourceId=item.url+':'+index;d.append(element('summary','Source'));const quote=element('blockquote',item.text);d.append(quote,link('Source page',item.url),element('p','Read at: '+item.readAt,'muted'));container.append(d);}
function preserveSources(target,build){const open=new Set([...target.querySelectorAll('details[open]')].map(n=>n.dataset.sourceId));target.replaceChildren();build(target);for(const d of target.querySelectorAll('details'))d.open=open.has(d.dataset.sourceId);}
// Exact source statements remain separate; this display does not judge cuisine.
function renderSourceCategories(id){
 const target=$('source-categories'),facts=state.view.restaurant.currentFactEvidence.filter(f=>f.candidateId===id),rows=[],seen=new Set();target.replaceChildren();
 const generic=new Set(['restaurant','food','point of interest','establishment','store','food store']);
 for(const fact of facts){
  const raw=fact.provider==='GOOGLE_PLACES'&&Array.isArray(fact.claims.restaurantTypeFacts)?fact.claims.restaurantTypeFacts.filter(q=>typeof q==='string'):(fact.sourceFieldQuotes||[]).filter(q=>q.field==='CATEGORY').map(q=>q.quote);
  const quotes=raw.flatMap(q=>q.split(/[,，]/)).map(q=>q.trim()).filter(q=>q&&!generic.has(q.toLocaleLowerCase('en-US').replace(/_/g,' ')));
  if(!quotes.length||!fact.sourceUrl)continue;
  const quote=quotes.join(', '),key=fact.provider+':'+quote;if(seen.has(key))continue;seen.add(key);rows.push({fact,quote,signature:[...new Set(quotes.map(q=>q.toLowerCase().replace(/ restaurant$/,'')))].sort().join('|')});
 }
 const disagreement=new Set(rows.map(row=>row.fact.provider)).size>1&&new Set(rows.map(row=>row.signature)).size>1;
 if(disagreement)for(const {fact,quote}of rows){const row=element('p',sourceName(fact.provider)+': '+quote,'muted');row.append(document.createTextNode(' '),link('Source',fact.sourceUrl));target.append(row);}
 target.hidden=!disagreement;
}
function renderDelivery(){
 const r=state.view.restaurant,id=state.ui.candidateId;
 const offers=(r.availability[id]||[]).filter(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now());
 const groups=new Map();for(const offer of offers){const label=displayDate(offer.dateTime),key=label+':'+offer.partySize;let group=groups.get(key);if(!group){group={label,partySize:offer.partySize,offers:[]};groups.set(key,group);}group.offers.push(offer);}
 const selected=offerFor(id);$('delivery-slots').replaceChildren(...Array.from(groups.values()).map((group,index)=>{const row=element('div');if(index>0)row.append(element('p','Available '+group.label));const options=element('div',undefined,'slot-options');for(const offer of group.offers){const button=element('button',displayTime(offer.dateTime),'slot-time');button.dataset.offerId=offer.id;button.setAttribute('aria-label','Time '+displayTime(offer.dateTime)+' on '+group.label);button.setAttribute('aria-pressed',String(!!selected&&selected.id===offer.id));button.disabled=state.blocked||!!state.preparing;button.onclick=event=>{state.ui.offerId=offer.id;savePosition();renderCard();const current=$('delivery-slots').querySelector('[data-offer-id="'+CSS.escape(offer.id)+'"]');if(current&&event.detail===0)current.focus({preventScroll:true});};options.append(button);}row.append(options);return row;}));
 $('delivery-conditions').replaceChildren(...(r.conditionStates&&r.conditionStates[id]||[]).map(item=>element('p',item.text+' — '+({MET:'met',NOT_MET:'not met',NOT_CHECKED:'not checked'})[item.status])));
}
function renderCard(){renderDelivery();const c=candidate();if(!c)return;const id=c.restaurant.id,r=state.view.restaurant,offer=offerFor(id), eligible=ids().includes(id), check=r.availabilityChecks[id], source=sourceFor(id);const card=$('candidate-card'),changed=card.dataset.candidateId!==id;card.dataset.candidateId=id;text('restaurant-name',c.restaurant.outletName);text('restaurant-initial',Array.from(c.restaurant.outletName)[0]||'');const facts=[c.restaurant.address.replace(/^Japan,\s*/i,'').replace(/^〒\d{3}-\d{4}\s*/,'')];if(c.distanceObservation)facts.push(c.distanceObservation.meters+' m away');if(offer&&offer.price)facts.push(money(offer.price.amount)+(offer.price.basis==='PER_PERSON'?' per guest':''));$('key-facts').replaceChildren(...facts.map((v,i)=>element('span',v,i===0?'address-line':undefined)));$('availability').dataset.status=offer&&eligible?'available':'unknown';text('availability',offer&&eligible?'Available '+displayDate(((r.availability[id]||[]).find(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now())||offer).dateTime):check&&check.displayExpiresAt&&Date.parse(check.displayExpiresAt)<=Date.now()?'Availability expired':'Not checked');text('recommendation',(c.matchReasons||[]).find(reason=>!reason.startsWith('Address explicitly matches requested area:'))||'');renderSourceCategories(id);const saved=(r.shortlistCandidateIds||[]).includes(id);$('bookmark').setAttribute('aria-pressed',String(saved));$('bookmark').setAttribute('aria-label',saved?'Remove from saved':'Save for later');const n=ids().indexOf(id);text('card-counter',n>=0&&!r.progress.active&&!state.preview?(n+1)+' of '+ids().length:'');show('card-counter',!r.progress.active&&!state.preview);$('previous').disabled=n<=0;$('next').disabled=n<0||(n>=ids().length-1&&(r.progress.active||state.view.case.phase!=='PRESENT_RESULTS'));$('choose').disabled=state.blocked||!!state.preparing||!eligible;$('choose').setAttribute('aria-busy',String(!!state.preparing));if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches)card.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});}
function renderDetails(){
 const c=candidate();if(!c)return;const r=state.view.restaurant,id=c.restaurant.id,facts=r.currentFactEvidence.filter(f=>f.candidateId===id),conditions=r.conditionStates&&r.conditionStates[id]||[];
 text('details-name',c.restaurant.outletName);const source=sourceFor(id);show('evidence',!!source&&!!source.observedAt);if(source)text('evidence',sourceName(source.provider)+', checked '+displayTime(source.observedAt));
 const signature=JSON.stringify([id,facts,conditions]);if(signature!==state.detailKey){state.detailKey=signature;preserveSources($('details-content'),target=>{
  target.append(element('p',c.restaurant.address,'muted'));const sources=new Map();
  const addSource=(url,quote,readAt)=>{if(!url)return;let row=sources.get(url);if(!row){row={quotes:new Set(),times:new Set()};sources.set(url,row);}if(quote)row.quotes.add(quote);if(readAt)row.times.add(readAt);};
  for(const fact of facts){const values=[],claims=fact.claims||{};if(Array.isArray(claims.listedCourseDetails))values.push(...claims.listedCourseDetails);if(typeof claims.coursePriceYen==='number')values.push('Course '+money(claims.coursePriceYen));for(const k of ['cancellationTerms','noShowTerms'])if(typeof claims[k]==='string')values.push(claims[k]);for(const value of values){target.append(element('p',value));addSource(fact.sourceUrl,null,fact.observedAt);if(fact.sourceUrl)sources.get(fact.sourceUrl).commercial=true;}}
  for(const item of conditions){const row=element('div',undefined,'fact');row.append(element('p',item.text+' — '+({MET:'met',NOT_MET:'not met',NOT_CHECKED:'not checked'})[item.status]));
   for(const source of item.sources||[]){const evidence=r.readEvidence.find(e=>(item.evidenceIds||[]).includes(e.evidenceId)&&e.sourceUrl===source.sourceUrl);addSource(source.sourceUrl,(source.field==='PRICE'?'Observed price: ':source.field==='NAME'?'Based on outlet name: ':source.field==='GOOGLE_TYPE'?'Google category: ':source.field==='CATEGORY'?'Source category: ':'Observed ')+source.quote,evidence&&evidence.observedAt);}
   if(!(item.sources||[]).length&&item.status==='MET'&&item.explanation)row.append(element('p',item.explanation,'muted'));target.append(row);
  }
  for(const [url,row]of sources){const d=element('div',undefined,'fact');d.dataset.sourceId=url;for(const quote of row.quotes)d.append(element('blockquote',quote));d.append(link(row.commercial?'Terms source':'Source',url));for(const at of row.times)d.append(element('p','Read at: '+at,'muted'));target.append(d);}
 });}renderAsked(id);
}
function renderAnswer(target,result){
  preserveSources(target,container=>{
    container.append(element('p',result.status==='ANSWERED'?result.answer:result.status==='NOT_STATED'?'Not stated on the page':'This answer could not be verified.'));
    if((result.citations||[]).length){const d=element('details');d.dataset.sourceId='answer-sources';d.append(element('summary','Source'));const urls=new Set();for(const item of result.citations){d.append(element('blockquote',item.text),element('p','Read at: '+item.readAt,'muted'));if(!urls.has(item.url)){urls.add(item.url);d.append(link('Source page',item.url));}}container.append(d);}
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
  const id=requestId();state.pendingQuestion={requestId:id,caseId:old.case.caseId,candidateId:c.restaurant.id};state.asking=true;$('send').disabled=true;$('send').setAttribute('aria-busy','true');clearError();
  try{const p=await api('/api/cases/'+encodeURIComponent(old.case.caseId)+'/questions',{method:'POST',body:JSON.stringify({candidateId:c.restaurant.id,question:message,taskVersion:old.case.taskVersion,requestId:id})});if(nav!==state.nav)return;accept(p.view);}
  catch(error){if(nav===state.nav){state.pendingQuestion=null;report(error);}}
  finally{state.asking=false;if(nav===state.nav)render();}
}
function editCondition(button,label,kind,value){
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
  save.type='submit';save.setAttribute('aria-label','Save');save.innerHTML='<svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>';
  cancel.type='button';cancel.setAttribute('aria-label','Cancel condition change');cancel.innerHTML='<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  let busy=false;
  const position=()=>{form.style.left='0px';const host=$('request-conditions').getBoundingClientRect();form.style.maxWidth=host.width+'px';const rect=form.getBoundingClientRect(),at=anchor.getBoundingClientRect();form.style.left=Math.max(host.left-at.left,Math.min(0,host.right-at.left-rect.width))+'px';};
  const update=()=>{const n=Array.from(newValue()).length,valid=inputs.every(i=>i.validity.valid)&&!(kind==='time'&&input.value>inputs[1].value);save.disabled=busy||!newValue()||n>30||!valid;save.setAttribute('aria-busy',String(busy));for(const i of inputs)i.disabled=busy;if(kind==='text')input.style.width=Math.min(Math.max(n,3)+1,18)+'ch';if(form.isConnected)position();};
  const close=(refresh=true)=>{if(anchor.isConnected)anchor.replaceWith(button);if(state.conditionEditor&&state.conditionEditor.form===form)state.conditionEditor=null;if(refresh&&state.view)renderConditions();};
  cancel.onclick=event=>{if(busy)return;close();if(event.detail===0)button.focus({preventScroll:true});};
  for(const i of inputs)i.oninput=update;form.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();cancel.click();}};
  form.onsubmit=async event=>{event.preventDefault();const value=newValue();if(save.disabled||busy||state.blocked||state.asking||!value||Array.from(value).length>30)return;if(value===originalValue){cancel.click();return;}
    busy=true;update();cancel.disabled=true;
    const accepted=await submitRequirement('Change '+label+' to '+value,true);
    busy=false;cancel.disabled=false;if(accepted)close();else update();
  };
  form.append(input);if(kind==='time')form.append(element('span','–'),inputs[1]);form.append(save,cancel);anchor.append(form);button.replaceWith(anchor);
  state.conditionEditor={form,anchor,caseId:state.view.case.caseId,get busy(){return busy;},cancel:()=>{if(!busy)close(false);},position};update();input.focus({preventScroll:true});if(kind==='text')input.select();
}
function renderConditions(){
  const r=state.view.restaurant,draft=r.intentDraft||{},parts=[];
  if(draft.area)parts.push([(r.searchLocation&&r.searchLocation.label)||draft.area.query,false,'text']);
  if(draft.date)parts.push([displayDate(draft.date),false,'date',draft.date]);
  if(draft.timeWindow)parts.push([draft.timeWindow.earliest+(draft.timeWindow.latest!==draft.timeWindow.earliest?'–'+draft.timeWindow.latest:''),false,'time',draft.timeWindow]);
  if(draft.partySize)parts.push([draft.partySize+' guests',draft.partySizeSource==='INFERRED_CLOSED_PARTY','guests',draft.partySize]);
  if(draft.budgetPerPerson)parts.push([money(draft.budgetPerPerson.max)+' per guest']);
  for(const criterion of draft.criteria||[])parts.push([criterion.text]);
  if(state.conditionEditor&&state.conditionEditor.caseId===state.view.case.caseId)return;
  const signature=JSON.stringify([state.view.case.caseId,parts]);if($('request-conditions').dataset.signature===signature)return;
  $('request-conditions').dataset.signature=signature;state.conditionEditor=null;
  $('request-conditions').replaceChildren(...parts.map(([label,inferred,kind='text',value])=>{
    const button=element('button',label+(inferred?'?':''));button.title='Change '+label;button.onclick=()=>editCondition(button,label,kind,value);return button;
  }));
}
function changeReason(code){return ({OVER_BUDGET:'Over budget',NEW_TIME_MISMATCH:"Doesn't match the new time",NO_LONGER_MATCHES:'No longer matches'})[code]||'No longer matches';}
function renderChanges(){
  const diff=state.view.restaurant.revisionDiff,changed=!!diff&&(diff.removed.length>0||diff.added.length>0);show('revision-changes',changed&&state.ui.view==='CANDIDATES'&&!state.ui.atEnd);if(!changed)return;
  text('removed-count',diff.removed.length+(diff.removed.length===1?' place no longer matches':' places no longer match'));text('added-count',diff.added.length+' new');
  const signature=JSON.stringify(diff);if(signature===state.diffKey)return;state.diffKey=signature;$('revision-changes').open=false;
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
  if(empty){text('empty-message',status.kind==='ALL_SOURCES_FAILED'?"Couldn't reach the sources. Try again?":status.canContinue?'Nothing matched yet.':"Couldn't confirm a matching place this time. Try adjusting the area, time, or party size.");show('empty-adjust',status.kind==='NO_QUALIFIED_RESULTS');show('empty-more',status.kind==='NO_QUALIFIED_RESULTS'&&status.canContinue);show('empty-retry',status.kind==='ALL_SOURCES_FAILED'&&status.canRetry);$('empty-more').disabled=state.blocked;$('empty-retry').disabled=state.blocked;}
  const list=ids(),last=list.indexOf(state.ui.candidateId)===list.length-1;
  show('partial-source-note',status.partialSourceFailure&&!r.progress.active&&(end||(state.ui.view==='CANDIDATES'&&last)));
  return empty||status.kind==='MODEL_FAILURE';
}
function renderHandoff(){
  const c=candidate();if(!c)return;
  const h=currentHandoff(),source=sourceFor(c.restaurant.id);
  text('handoff-name',c.restaurant.outletName);
  const slots=handoffs(),selector=$('handoff-slot');show('handoff-slot-label',slots.length>0);show('handoff-time-row',slots.length>0);selector.disabled=slots.length<=1;
  selector.replaceChildren(...slots.map(slot=>{const offer=(state.view.restaurant.availability[c.restaurant.id]||[]).find(o=>o.id===slot.offerId);const option=element('option',offer?availabilityTime(offer.dateTime)+'　'+offer.partySize+' guests':slot.continueLabel);option.value=slot.offerId;return option;}));
  if(h)selector.value=h.offerId;else{const placeholder=element('option','Choose a time');placeholder.value='';placeholder.disabled=true;placeholder.selected=true;selector.prepend(placeholder);}
  const selectedOffer=h&&(state.view.restaurant.availability[c.restaurant.id]||[]).find(o=>o.id===h.offerId),price=selectedOffer&&selectedOffer.price;show('handoff-price',!!price);text('handoff-price',price?money(price.amount)+(price.basis==='PER_PERSON'?' per guest':price.basis==='TOTAL'?' total':''):'');
  selector.onchange=()=>{state.ui.offerId=selector.value;savePosition();renderHandoff();};
  text('handoff-provider-name',h?sourceName(h.provider):'');show('handoff-provider',!!h);
  const check=state.view.restaurant.availabilityChecks[c.restaurant.id],expired=!!(check&&check.displayExpiresAt&&Date.parse(check.displayExpiresAt)<=Date.now());
  show('departure',!!h||expired);show('departure-fields',!!h);show('handoff-unavailable',!h&&!expired);
  if(!h&&expired){text('departure-title','Check availability again');$('departure').href='#';}
  show('selection-hint',!!h&&!!h.selectionHint);show('verification-hint',!!h&&!!h.verificationHint&&!['Check date and guests','Check date and guests on the website'].includes(h.verificationHint));
  if(h){
    const parts=h.continueLabel.split(' — ');
    text('departure-title',parts[0]+' ↗');const fields=parts[1]||'';text('departure-fields',fields.charAt(0).toUpperCase()+fields.slice(1));
    $('departure').href=h.url;text('selection-hint',h.selectionHint||'');text('verification-hint',h.verificationHint==='Check date and guests'?'Check date and guests on the website':h.verificationHint||'');
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
  show('direct-source',!h&&!!href);if(href)$('direct-source').href=href;
}
function updateComposerClearance(){const host=$('workspace-composer'),bottom=parseFloat(getComputedStyle(host).bottom)||0;document.documentElement.style.setProperty('--composer-clearance',(host.hidden?0:host.getBoundingClientRect().height+bottom+24)+'px');}
function resizeMessage(){const input=$('message');input.style.height='';if($('workspace-composer').contains(input)){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,140)+'px';}}
function setMessage(value){$('message').value=value;resizeMessage();}
function focusAdjustment(){const input=$('message');if(!input.value)input.placeholder='Try another area, time, or party size…';input.focus({preventScroll:true});}
$('message').addEventListener('blur',()=>{$('message').removeAttribute('placeholder');});
$('message').addEventListener('input',resizeMessage);
$('message').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('composer').requestSubmit();}});
new ResizeObserver(updateComposerClearance).observe($('workspace-composer'));window.addEventListener('resize',()=>{resizeMessage();updateComposerClearance();if(state.conditionEditor)state.conditionEditor.position();});
const caseScroller=$('case-workspace');
new IntersectionObserver(entries=>{$('topbar').classList.toggle('scrolled',!caseScroller.hidden&&!entries[0].isIntersecting);},{root:caseScroller,threshold:0}).observe($('topbar-sentinel'));
${WORKSPACE_PHOTO_CLIENT_SCRIPT}
function render(){
  const real=!!state.view,pending=state.pendingCase,has=real||!!pending,mode=pending?'CANDIDATES':state.ui.view;caseScroller.dataset.view=mode;show('home',!has);show('case-workspace',has);show('workspace-composer',has&&['CANDIDATES','DETAILS'].includes(mode));const conditionRow=document.querySelector('.workspace-conditions');conditionRow.hidden=mode==='SAVED'||mode==='HANDOFF';
  for(const row of $('case-list').querySelectorAll('.case-link'))row.classList.toggle('active',real&&row.dataset.caseId===state.view.case.caseId);
  if(real&&caseScroller.dataset.caseId!==state.view.case.caseId){caseScroller.scrollTop=0;caseScroller.dataset.caseId=state.view.case.caseId;}
  if(!has){caseScroller.scrollTop=0;$('topbar').classList.remove('scrolled');if($('error').parentElement===caseScroller)$('workspace-composer').before($('error'));}else if($('error').parentElement!==caseScroller)caseScroller.append($('error'));
  const parent=has?$('workspace-composer'):$('home-composer');if($('composer').parentElement!==parent)parent.append($('composer'));resizeMessage();updateComposerClearance();
  const asking=real&&state.ui.view==='DETAILS';$('message').setAttribute('aria-label',asking?'Restaurant question':'Plan message');
  $('send').setAttribute('aria-busy',String(Boolean(state.sending||state.asking)));
  $('send').disabled=state.blocked||state.asking||(asking&&state.view.case.phase!=='PRESENT_RESULTS');
  if(!has){$('brand').classList.remove('working');show('progress',false);show('feedback',false);renderPhotos();return;}
  if(pending){
   caseScroller.scrollTop=0;delete caseScroller.dataset.caseId;
   text('case-title',displayTitle(pending.title));$('case-title').title=pending.title;
   for(const id of ['candidate-panel','details','handoff','saved-panel','batch-end','empty-state','understanding-error','revision-changes','partial-source-note','messages','feedback','mode-note','use-location','saved'])show(id,false);
   $('request-conditions').replaceChildren();delete $('request-conditions').dataset.signature;conditionRow.hidden=false;conditionRow.style.visibility='hidden';renderProgress();return;
  }
  const r=state.view.restaurant,candidateIds=ids();
  if(!state.ui.candidateId&&candidateIds.length)state.ui.candidateId=candidateIds[0];
  if(state.ui.candidateId&&!r.candidates.some(c=>c.restaurant.id===state.ui.candidateId))state.ui.candidateId=candidateIds[0]||null;
  if(state.ui.view==='CANDIDATES'&&!state.ui.atEnd&&state.view.case.phase==='PRESENT_RESULTS'&&candidateIds.length&&!candidateIds.includes(state.ui.candidateId))state.ui.candidateId=candidateIds[0];
  text('case-title',displayTitle(state.view.case.title));$('case-title').title=state.view.case.title;const savedCount=(r.shortlistCandidateIds||[]).length;text('saved-count',savedCount);show('saved-count',savedCount>0);$('saved').setAttribute('aria-label',savedCount>0?'Saved '+savedCount:'Saved');
  renderConditions();renderChanges();renderProgress();const end=mode==='CANDIDATES'&&state.ui.atEnd&&!r.progress.active&&state.view.case.phase==='PRESENT_RESULTS';
  show('candidate-panel',mode==='CANDIDATES'&&!!candidate()&&!end&&(!state.preview||state.preview.phase==='card'));show('batch-end',!!end);show('details',mode==='DETAILS'&&!!candidate());show('saved-panel',mode==='SAVED');show('saved',mode!=='SAVED');conditionRow.hidden=['SAVED','HANDOFF'].includes(mode);conditionRow.style.visibility=mode==='CANDIDATES'&&(state.preview&&state.preview.phase==='understanding'||!candidate()&&!$('request-conditions').childElementCount&&(r.progress.active||state.view.case.phase==='UNDERSTANDING'))?'hidden':'';show('handoff',mode==='HANDOFF'&&!!candidate());
  show('end-saved',savedCount>0);text('end-saved-count',savedCount);$('end-saved').setAttribute('aria-label','Saved '+savedCount);$('find-more').disabled=state.blocked;
  if(mode==='CANDIDATES'&&!end)renderCard();if(mode==='DETAILS')renderDetails();if(mode==='SAVED')renderSaved();if(mode==='HANDOFF')renderHandoff();renderPhotos();
  const shortState=renderReadState(end),busy=!!(pending||state.preview||state.sending||state.blocked||r.progress.active||['UNDERSTANDING','SEARCHING'].includes(state.view.case.phase));
  const message=!busy&&mode==='CANDIDATES'?(r.progress.stopped?'Search stopped.':state.view.case.phase==='NEEDS_INPUT'?r.clarificationQuestion||'':r.readStatus.kind==='OTHER_FAILURE'&&!candidateIds.length?"Couldn't complete this search. Please try again.":''):'';
  text('messages',message);show('messages',!!message);
  if(mode!=='CANDIDATES')for(const id of ['progress','empty-state','understanding-error','partial-source-note','messages'])show(id,false);
  show('mode-note',state.view.mode==='FIXTURE');text('mode-note','Fixture only. No real availability or reservations.');show('use-location',(r.missingRequiredFields||[]).includes('location'));savePosition();clearTimeout(state.expiry);
  const expiry=Object.values(r.availability).flat().map(o=>Date.parse(o.displayExpiresAt)).filter(t=>t>Date.now()).sort((a,b)=>a-b)[0];if(expiry)state.expiry=setTimeout(render,Math.min(expiry-Date.now()+10,2147483647));show('feedback',!!state.feedback);
}
function viewContext(){return {view:state.view?state.ui.view:'HOME',...(state.view&&!state.ui.atEnd&&state.ui.candidateId&&['CANDIDATES','DETAILS','HANDOFF'].includes(state.ui.view)?{candidateId:state.ui.candidateId}:{}),comparedCandidateIds:[]};}
async function submitRequirement(message,preserveComposer=false){
 if(!message||state.blocked||state.asking)return false;
 $('message').removeAttribute('placeholder');const nav=state.nav,old=state.view,context=viewContext(),draft=$('message').value,startedAt=performance.now();clearEntryTransition();state.blocked=true;state.sending=!preserveComposer;clearError();
 if(!old){state.pendingCase={title:message};if(!preserveComposer)setMessage('');render();}
 else{render();}
 try{
  const path=old?'/api/conversations/'+encodeURIComponent(old.conversation.id)+'/messages':'/api/cases';const body={message,requestId:requestId(),viewContext:context,...(old?{taskVersion:old.case.taskVersion}:{})};
  const p=await api(path,{method:'POST',body:JSON.stringify(body)});if(nav!==state.nav)return false;
  state.pendingCase=null;state.blocked=false;state.sending=false;const modelFailed=p.view.restaurant.readStatus.kind==='MODEL_FAILURE';state.view=null;
  if(!modelFailed||!old)state.ui={view:'CANDIDATES',candidateId:null};state.detailKey='';state.handoffKey='';
  if(!old&&modelFailed&&!$('message').value)setMessage(draft);
  if(!preserveComposer&&!modelFailed&&$('message').value.trim()===message)setMessage('');
  if(!old&&previewPace&&fixturePresentation(p.view))state.entryPace=startedAt;accept(p.view);
  if(modelFailed)$('understanding-error').scrollIntoView({block:'nearest',behavior:'instant'});openStream(p.view.case.caseId,nav);savePosition();return !modelFailed;
 }catch(error){
  if(nav===state.nav){if(!old)clearEntryTransition();state.blocked=false;state.sending=false;render();if(!$('message').value)setMessage(draft);report(error);}return false;
 }finally{if(nav===state.nav){state.blocked=false;state.sending=false;$('send').disabled=false;$('send').setAttribute('aria-busy','false');}}
}
$('composer').onsubmit=async event=>{event.preventDefault();const message=$('message').value.trim();if(!message||state.blocked||state.asking)return;if(state.view&&state.ui.view==='DETAILS'){await askCurrentPlace(message);return;}await submitRequirement(message);};
$('stop').onclick=async()=>{if(state.blocked||!state.view)return;const nav=state.nav;state.blocked=true;$('stop').disabled=true;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/run',{method:'DELETE'});if(nav!==state.nav)return;state.blocked=false;accept(p.view);}catch(error){report(error);}finally{if(nav===state.nav){state.blocked=false;$('stop').disabled=false;}}};
$('bookmark').onclick=async()=>{const c=candidate();if(!c)return;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/shortlist',{method:'POST',body:JSON.stringify({candidateId:c.restaurant.id,shortlisted:!(state.view.restaurant.shortlistCandidateIds||[]).includes(c.restaurant.id),taskVersion:state.view.case.taskVersion,requestId:requestId()})});accept(p.view);}catch(error){report(error);}};
function moveCard(delta){
  clearEntryPreview();cancelPreparation();const list=ids(),i=list.indexOf(state.ui.candidateId);
  if(state.ui.atEnd&&delta<0){state.ui.atEnd=false;savePosition();render();return;}
  const id=list[i+delta];
  if(id){closeAnswer();state.ui.offerId=null;state.ui.candidateId=id;state.ui.atEnd=false;state.detailKey='';state.handoffKey='';savePosition();render();}
  else if(delta>0&&i===list.length-1&&state.view.case.phase==='PRESENT_RESULTS'&&!state.view.restaurant.progress.active){state.ui.atEnd=true;savePosition();render();}
}
$('previous').onclick=()=>moveCard(-1);$('next').onclick=()=>moveCard(1);
$('details-button').onclick=()=>setView('DETAILS');$('details-back').onclick=()=>setView('CANDIDATES');$('saved').onclick=()=>setView('SAVED');$('saved-back').onclick=()=>setView('CANDIDATES');$('choose').onclick=prepareBooking;$('handoff-back').onclick=()=>setView('CANDIDATES');
async function refreshCase(){if(state.blocked)return false;const nav=state.nav;state.blocked=true;render();try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/refresh',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId()})});if(nav!==state.nav)return;state.blocked=false;accept(p.view);return true;}catch(error){if(nav===state.nav)report(error);return false;}finally{if(nav===state.nav){state.blocked=false;render();}}}
function finishPreparation(){
 const pending=state.preparing;if(!pending)return;
 if(pending.nav!==state.nav||state.ui.candidateId!==pending.id||state.ui.view!=='CANDIDATES'||state.view.restaurant.requirementRevision!==pending.revision){cancelPreparation();return;}
 if(state.view.restaurant.progress.active)return;
 cancelPreparation();
 const fresh=(state.view.restaurant.availability[pending.id]||[]).filter(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now()),matched=pending.slot?fresh.find(o=>o.dateTime===pending.slot.dateTime&&o.partySize===pending.slot.partySize):fresh[0];
 if(ids().includes(pending.id)&&state.view.restaurant.readyCandidateIds.includes(pending.id)&&matched){state.ui.offerId=matched.id;closeAnswer();state.ui.view='HANDOFF';savePosition();clearError();}
 else report(new Error("Availability couldn't be confirmed. Try again."));
}
async function prepareBooking(){
 if(state.blocked||state.preparing||!candidate()||!ids().includes(state.ui.candidateId))return;
 const id=state.ui.candidateId,nav=state.nav,revision=state.view.restaurant.requirementRevision,check=state.view.restaurant.availabilityChecks[id];
 const expired=!!(check&&check.displayExpiresAt&&Date.parse(check.displayExpiresAt)<=Date.now())||(state.view.restaurant.availability[id]||[]).length>0&&!offerFor(id);
 if(!expired){const viewed=offerFor(id);if(viewed)state.ui.offerId=viewed.id;setView('HANDOFF');return;}
 const old=(state.view.restaurant.availability[id]||[]).find(o=>o.id===state.ui.offerId)||(state.view.restaurant.availability[id]||[])[0];
 const pending={id,nav,revision,slot:old?{dateTime:old.dateTime,partySize:old.partySize}:null};state.preparing=pending;clearError();
 const refreshed=await refreshCase();
 if(!refreshed&&state.preparing===pending)cancelPreparation();
 if(nav===state.nav)render();
}
$('refresh').onclick=refreshCase;
$('answer-backdrop').onclick=closeAnswer;$('answer-dismiss').onclick=closeAnswer;
let answerDragY=null;$('answer-dismiss').onpointerdown=event=>{answerDragY=event.clientY;$('answer-dismiss').setPointerCapture(event.pointerId);};
$('answer-dismiss').onpointerup=event=>{if(answerDragY!==null&&event.clientY-answerDragY>40)closeAnswer();answerDragY=null;};
$('batch-back').onclick=()=>moveCard(-1);$('end-saved').onclick=()=>setView('SAVED');$('end-adjust').onclick=focusAdjustment;
async function findMore(){
  if(state.blocked)return;const nav=state.nav;state.blocked=true;$('find-more').disabled=true;
  try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/another-batch',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId()})});if(nav!==state.nav)return;state.blocked=false;state.ui.atEnd=false;state.ui.candidateId=null;accept(p.view);}
  catch(error){if(nav===state.nav)report(error);}finally{if(nav===state.nav){state.blocked=false;render();}}
}
$('find-more').onclick=findMore;$('empty-more').onclick=findMore;$('empty-retry').onclick=refreshCase;$('empty-adjust').onclick=focusAdjustment;
async function depart(event){const h=currentHandoff();if(!h){event.preventDefault();await refreshCase();return;}event.preventDefault();const target=window.open('about:blank','_blank');if(target)target.opener=null;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/booking-departures',{method:'POST',body:JSON.stringify({candidateId:h.candidateId,offerId:h.offerId,taskVersion:state.view.case.taskVersion,requestId:requestId()})});localStorage.setItem(key(state.view.case.caseId)+':return','1');if(target)target.location.href=p.url;else throw new Error('Please allow this source tab to open.');}catch(error){if(target)target.close();report(error);}}
$('departure').onclick=depart;$('direct-source').onclick=event=>{if(currentHandoff())void depart(event);};
async function claimFeedback(){if(!state.view||state.feedback||state.claiming)return;const id=state.view.case.caseId;state.claiming=true;try{const p=await api('/api/cases/'+encodeURIComponent(id)+'/booking-feedback/claim',{method:'POST',body:'{}'});if(!state.view||state.view.case.caseId!==id)return;localStorage.removeItem(key(id)+':return');state.feedback=p.prompt||null;show('feedback',!!state.feedback);}catch(error){report(error);}finally{state.claiming=false;}}
window.addEventListener('focus',async()=>{if(!state.view||!localStorage.getItem(key(state.view.case.caseId)+':return'))return;try{const p=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId));accept(p.view);}catch(error){report(error);}});
for(const button of $('feedback').querySelectorAll('[data-answer]'))button.onclick=async()=>{if(!state.feedback)return;const prompt=state.feedback;try{await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/booking-feedback',{method:'POST',body:JSON.stringify({departureId:prompt.departure.id,answer:button.dataset.answer})});state.feedback=null;show('feedback',false);}catch(error){report(error);}};
$('menu').onclick=event=>{if(desktopLayout.matches){sidebarCollapsed=false;syncSidebar();if(event.detail===0)$('collapse-plans').focus({preventScroll:true});return;}if($('plans').classList.contains('open'))return closePlans(event.detail===0);$('plans').classList.add('open');show('backdrop',true);$('menu').setAttribute('aria-expanded','true');syncBrand();if(event.detail===0)$('collapse-plans').focus({preventScroll:true});};$('backdrop').onclick=()=>closePlans();
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
$('logout').onclick=async()=>{clearEntryTransition();++state.nav;await api('/api/session',{method:'DELETE'});location.reload();};
$('use-location').onclick=()=>{if(!navigator.geolocation)return report(new Error('Type a nearby station, address, or district instead.'));navigator.geolocation.getCurrentPosition(async p=>{try{const result=await api('/api/cases/'+encodeURIComponent(state.view.case.caseId)+'/location',{method:'POST',body:JSON.stringify({taskVersion:state.view.case.taskVersion,requestId:requestId(),latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMeters:p.coords.accuracy})});accept(result.view);}catch(error){report(error);}},()=>report(new Error('Type a nearby station, address, or district instead.')));};
async function enter(user){state.user=user;show('login',false);show('app',true);text('profile-label',user.displayName||'Profile');text('profile-avatar',Array.from(user.displayName||'P')[0].toLocaleUpperCase('en-US'));render();const nav=state.nav;const p=await api('/api/cases');for(const item of p.cases)updateCases(item);const active=localStorage.getItem('praxis:active:'+user.id);if(nav===state.nav&&active&&state.cases.has(active))await loadCase(active);}
$('login-form').onsubmit=async event=>{event.preventDefault();try{const p=await api('/api/session',{method:'POST',body:JSON.stringify({accessToken:$('access-token').value})});await enter(p.user);}catch(error){text('login-error',error.message);show('login-error',true);}};
void api('/api/session').then(p=>enter(p.user)).catch(()=>{show('login',true);show('app',false);});
`;
