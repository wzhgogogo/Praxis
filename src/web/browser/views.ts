import {citationFooter,renderCitations} from './citations.js';
import {questionCitations,type SourceExcerpt} from './citation-groups.js';
import type { Answer, Condition, IntentDraft, Offer } from './view-contracts.js';
import type { ConditionKind, ConditionValue } from './actions.js';
import { $, clearError, element, requireView, show, state, text } from "./runtime.js";
import { availabilityExpired, clearSlotSelection, currentHandoff, forgetSlotSelection, freshOffers, handoffs, needsSlotReselection, offerFor, reconcileSlot, selectSlot } from "./selected-slot.js";
import { closePhotos, renderPhotos } from "./photos.js";
import { canAskCurrentPlace, canRefresh, canShortlist, candidate, ids, questionPending, sourceFor } from "./queries.js";
import { savePosition } from "./position.js";
import { availabilityTime, displayDate, displayTime, displayTitle, link, money, safeLink, sourceName } from "./format.js";
import { resizeMessage, syncComposerPlaceholder, updateComposerClearance } from "./composer.js";
import { actions } from "./actions.js";
const caseScroller=$("case-workspace");

export function renderProgress(){
 const view=state.deferredView?.view??state.view;
 const pending=state.pendingCase,preview=state.preview,r=view?.restaurant,p=r?.progress??{active:false,stopped:false};
 const understanding=p.stage==='UNDERSTANDING'||!p.stage&&view?.case.phase==='UNDERSTANDING';
 const active=!!pending||!!preview||understanding||!!(p.active&&!p.stopped&&!['MODEL_FAILURE','NO_QUALIFIED_RESULTS','ALL_SOURCES_FAILED','OTHER_FAILURE'].includes(r?.readStatus.kind??'PENDING'));
 const hasCard=p.stage!=='FINDING'&&!understanding&&!pending&&state.ui.view==='CANDIDATES'&&(!preview||preview.phase==='card')&&!!candidate();
 show('progress',active);$('progress').classList.toggle('has-card',hasCard);$('brand').classList.toggle('working',active);show('stop',!pending&&!preview&&!!p.active&&active);$('stop').disabled=state.blocked;
 text('stop',hasCard?'Stop searching':'Stop');
 if(!active)return;
 let rows:Array<[string,string,boolean,number?]>;
 if(hasCard)rows=[['check','Looking for more options',false,preview?Math.min(1,p.checkedCount||0):p.checkedCount]];
 else if(pending||understanding||preview&&preview.phase==='understanding')rows=[['request','Understanding your request',false]];
 else if(preview)rows=[['request','Request understood',true],['search',preview.phase==='finding'?'Finding places':'Places found',preview.phase!=='finding']];
 else rows=[['request','Request understood',true],['search',(p.discoveredCount??0)>0?'Places found':'Finding places',(p.discoveredCount??0)>0]];
 if(!hasCard&&!pending&&!understanding&&(!preview&&(p.discoveredCount??0)>0||preview&&['checking','card'].includes(preview.phase))){
  const label=r?.intentDraft?.target?.goal==='RECOMMENDATION'?'Checking details':'Checking availability';
  rows.push(['check',label,false,preview?(preview.phase==='checking'?0:Math.min(1,p.checkedCount||0)):p.checkedCount]);
 }
 for(const row of rows){
  let node=$('stages').querySelector<HTMLElement>('[data-stage="'+row[0]+'"]');
  if(!node){node=element('div',undefined,'stage');node.dataset.stage=row[0];node.append(element('span',undefined,'mark'),element('span'));$('stages').append(node);}
  node.hidden=false;node.lastElementChild!.replaceChildren(document.createTextNode(row[1]));if(row[3]!==undefined)node.lastElementChild!.append(element('span',(hasCard?' · ':' ')+row[3]+' checked','stage-count'));node.className='stage '+(row[2]?'done':'current');
 }
 for(const node of $('stages').querySelectorAll<HTMLElement>(':scope > *'))node.hidden=!rows.some(row=>row[0]===node.dataset.stage);
}
export function preserveSources(target:HTMLElement,build:(target:HTMLElement)=>void){const open=new Set([...target.querySelectorAll<HTMLDetailsElement>('details[open]')].map(n=>n.dataset.sourceId));target.replaceChildren();build(target);for(const d of target.querySelectorAll('details'))d.open=open.has(d.dataset.sourceId);}
export function renderSourceCategories(id:string){
 const target=$('source-categories'),facts=requireView().restaurant.currentFactEvidence.filter(f=>f.candidateId===id),sources=new Map<string,{url:string;terms:Map<string,string>}>();target.replaceChildren();
 const generic=new Set(['','restaurant','food','point of interest','establishment','store','food store']);
 for(const fact of facts){
  if(!fact.sourceUrl)continue;
  const raw=fact.provider==='GOOGLE_PLACES'&&Array.isArray(fact.claims.restaurantTypeFacts)?fact.claims.restaurantTypeFacts.filter(q=>typeof q==='string'):(fact.sourceFieldQuotes||[]).filter(q=>q.field==='CATEGORY').map(q=>q.quote);
  const label=sourceName(fact.provider,fact.sourceUrl);
  for(const piece of raw.flatMap(q=>q.split(/[,，]/))){
   const quote=piece.trim(),normalized=quote.normalize('NFKC').toLowerCase().replace(/_/g,' ');
   if(!quote||/[\r\n\u2028\u2029]/.test(piece)||/[。.!?]$/.test(normalized)||Array.from(quote).length>40)continue;
   const key=normalized.replace(/\([^)]*\)/g,'').replace(/\b(?:japanese|restaurant|dishes|house)\b/g,' ').replace(/\s+/g,' ').trim();
   if(generic.has(key))continue;
   let source=sources.get(label);if(!source){source={url:fact.sourceUrl,terms:new Map()};sources.set(label,source);}
   if(!source.terms.has(key))source.terms.set(key,quote);
  }
 }
 const rows=[...sources.values()],disagreement=rows.some((row,i)=>rows.slice(i+1).some(other=>![...row.terms.keys()].some(key=>other.terms.has(key))));
 if(disagreement)for(const [label,source]of sources){const row=element('p',undefined,'source-category-row');row.append(link(label+' ↗',source.url),document.createTextNode(' '),element('span',[...source.terms.values()].slice(0,3).join(', ')));target.append(row);}
 target.hidden=!disagreement;
}
export function conditionRow(item:Condition){const row=element('div',undefined,'condition-row');row.append(element('span',displayTitle(item.text),'condition-name'),document.createTextNode(' '),element('span',({MET:'Confirmed',NOT_MET:'Not a match',NOT_CHECKED:'Unverified'})[item.status],'condition-status'));return row;}
export function renderDelivery(){
 const r=requireView().restaurant,id=state.ui.candidateId;
 const offers=freshOffers(id);
 const groups=new Map<string,{label:string;partySize:number;offers:Offer[]}>();for(const offer of offers){const label=displayDate(offer.dateTime),key=label+':'+offer.partySize;let group=groups.get(key);if(!group){group={label,partySize:offer.partySize,offers:[]};groups.set(key,group);}group.offers.push(offer);}
 const selected=offerFor(id);$('delivery-slots').replaceChildren(...Array.from(groups.values()).map((group,index)=>{const row=element('div');if(index>0)row.append(element('p','Available '+group.label));const options=element('div',undefined,'slot-options');for(const offer of group.offers){const button=element('button',displayTime(offer.dateTime),'slot-time');button.dataset.offerId=offer.id;button.setAttribute('aria-label','Time '+displayTime(offer.dateTime)+' on '+group.label);button.setAttribute('aria-pressed',String(!!selected&&selected.id===offer.id));button.disabled=state.blocked||!!state.preparing;button.onclick=event=>{selectSlot(offer);clearError();savePosition();renderCard();const current=$('delivery-slots').querySelector<HTMLButtonElement>('[data-offer-id="'+CSS.escape(offer.id)+'"]');if(current&&event.detail===0)current.focus({preventScroll:true});};options.append(button);}row.append(options);return row;}));
 if(state.ui.reconfirmSlot)$('delivery-slots').append(element('p','Plan conditions changed. Confirm the time again.','muted'));
 else if(needsSlotReselection(id))$('delivery-slots').append(element('p','Choose a new time to continue.','muted'));
 $('delivery-conditions').replaceChildren(...(id?r.conditionStates?.[id]||[]:[])
   .filter(item=>item.status!=='NOT_CHECKED'||item.strength==='HARD').map(conditionRow));
}
export function renderCard(){renderDelivery();const c=candidate();if(!c)return;const id=c.restaurant.id,r=requireView().restaurant,offer=offerFor(id), eligible=ids().includes(id), available=eligible&&freshOffers(id)[0], expired=availabilityExpired(id);const card=$('candidate-card'),changed=card.dataset.candidateId!==id;card.dataset.candidateId=id;text('restaurant-name',c.restaurant.outletName);text('restaurant-initial',Array.from(c.restaurant.outletName)[0]||'');const facts=[c.restaurant.address.replace(/^Japan,\s*/i,'').replace(/^(?:〒\s*)?\d{3}-?\d{4}\s*/,'')];if(c.distanceObservation)facts.push(c.distanceObservation.meters+' m away');if(offer&&offer.price)facts.push(money(offer.price.amount)+(offer.price.basis==='PER_PERSON'?' per guest':''));$('key-facts').replaceChildren(...facts.map((v,i)=>element('span',v,i===0?'address-line':undefined)));$('availability').dataset.status=available?'available':'unknown';text('availability-status',available?displayDate(available.dateTime):expired?'Expired':'Not checked');text('recommendation',(c.matchReasons||[]).find(reason=>!reason.startsWith('Address explicitly matches requested area:')&&!reason.startsWith('Source coordinates within'))||'');renderSourceCategories(id);const saved=(r.shortlistCandidateIds||[]).includes(id);$('bookmark').disabled=!canShortlist();$('bookmark').setAttribute('aria-pressed',String(saved));$('bookmark').setAttribute('aria-label',saved?'Remove from saved':'Save for later');const n=ids().indexOf(id);text('card-counter',n>=0?(n+1)+' of '+ids().length:'');show('card-counter',true);$('card-counter').style.visibility=!r.progress.active&&!state.preview?'visible':'hidden';$('previous').disabled=n<=0;$('next').disabled=n<0||(n>=ids().length-1&&(r.progress.active||requireView().case.phase!=='PRESENT_RESULTS'));$('choose').disabled=state.blocked||!!state.ui.reconfirmSlot||needsSlotReselection(id)||!!state.preparing||!eligible||!!state.ui.selectedSlot&&!!available&&!offer||expired&&!canRefresh();$('choose').setAttribute('aria-busy',String(!!state.preparing));if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches)card.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});}
export function renderDetails(){
 const c=candidate();if(!c)return;const r=requireView().restaurant,id=c.restaurant.id,facts=r.currentFactEvidence.filter(f=>f.candidateId===id),conditions=r.conditionStates?.[id]||[];
 const asking=state.asking||questionPending(),refreshBusy=!asking&&(r.progress.active||state.blocked),refreshSlots=r.readStatus.canRetry||ids().some(cid=>(r.availability[cid]||[]).length||r.availabilityChecks[cid]?.status==='AVAILABLE')||r.intentDraft?.target?.goal==='AVAILABILITY';
 show('refresh',requireView().case.phase==='PRESENT_RESULTS');$('refresh').disabled=refreshBusy||asking;if(asking)$('refresh').removeAttribute('aria-busy');else $('refresh').setAttribute('aria-busy',String(refreshBusy));text('refresh',refreshBusy?'Refreshing…':refreshSlots?'Refresh availability':'Refresh details');show('details-refresh-status',refreshBusy&&requireView().case.phase!=='PRESENT_RESULTS');
 text('details-name',c.restaurant.outletName);const source=sourceFor(id);show('evidence',!!source?.observedAt);if(source)text('evidence',sourceName(source.provider,source.sourceUrl)+' · Checked '+displayTime(source.observedAt));
 const signature=JSON.stringify([id,facts,conditions]);if(signature!==state.detailKey){state.detailKey=signature;preserveSources($('details-content'),target=>{
  target.append(element('p',c.restaurant.address,'about-address'));
  const groups=new Map<string,{url:string;readAt?:string;quotes:SourceExcerpt[];values:Set<string>}>(),categories=new Map<string,string>(),quotedCategories:string[]=[];
  const categoryKey=(value:string)=>{const key=value.normalize('NFKC').toLowerCase().replace(/_/g,' ').replace(/\s+/g,' ').trim();return ['steak','steak house','steakhouse'].includes(key)?'steak':key;};
  const generic=new Set(['','restaurant','food','point of interest','establishment','store','food store']);
  const sourceGroup=(url:string,at:string|undefined)=>{const key=JSON.stringify([url,at??null]);let group=groups.get(key);if(!group){group={url,readAt:at,quotes:[],values:new Set()};groups.set(key,group);}return group;};
  for(const item of conditions){const row=element('div',undefined,'fact');row.append(conditionRow(item));
   for(const q of item.sources||[]){if(!q.sourceUrl)continue;const evidence=r.readEvidence.filter(e=>e.candidateId===id&&(item.evidenceIds||[]).includes(e.evidenceId)&&e.sourceUrl===q.sourceUrl&&(!q.evidenceId||e.evidenceId===q.evidenceId));const readings=[...new Set(evidence.map(e=>e.observedAt))],at=readings.length===1?readings[0]:undefined;sourceGroup(q.sourceUrl,at).quotes.push({url:q.sourceUrl,text:q.quote,...(q.field==='PRICE'?{label:'Observed price:'}:{}),...(at?{readAt:at}:{})});}
   if(!(item.sources||[]).length&&item.status==='MET'&&item.explanation)row.append(element('p',item.explanation,'muted'));target.append(row);
  }
  for(const fact of facts){
   const values:string[]=[],claims=fact.claims||{};if(Array.isArray(claims.listedCourseDetails))values.push(...claims.listedCourseDetails);if(typeof claims.coursePriceYen==='number')values.push('Course '+money(claims.coursePriceYen));for(const k of ['cancellationTerms','noShowTerms'])if(typeof claims[k]==='string')values.push(claims[k]);
   if(values.length){if(fact.sourceUrl){const group=sourceGroup(fact.sourceUrl,fact.observedAt);for(const value of values)group.values.add(value);
    for(const quote of fact.sourceFieldQuotes||[])if(['COURSE_TITLE','COURSE_DESCRIPTION','PRICE'].includes(quote.field))sourceGroup(quote.sourceUrl||fact.sourceUrl,fact.observedAt).quotes.push({url:quote.sourceUrl||fact.sourceUrl,readAt:fact.observedAt,text:quote.quote});
   }else for(const value of values)target.append(element('p',value,'about-term'));}
   if(fact.provider==='GOOGLE_PLACES'&&Array.isArray(claims.restaurantTypeFacts))for(const raw of claims.restaurantTypeFacts){const key=categoryKey(raw);if(!generic.has(key)&&!categories.has(key))categories.set(key,raw.replace(/_/g,' '));}
   for(const quote of fact.sourceFieldQuotes||[])if(quote.field==='CATEGORY')quotedCategories.push(quote.quote);
  }
  const originals=new Map<string,string>();for(const quote of quotedCategories){for(const token of quote.split(/[,、\n]/))categories.delete(categoryKey(token));const key=categoryKey(quote);categories.delete(key);if(!originals.has(key))originals.set(key,quote);}
  const labels=[...categories.values(),...originals.values()];if(labels.length)target.append(element('p','Categories: '+labels.join(', '),'about-categories'));
  for(const group of groups.values()){
   const normalize=(text:string)=>text.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
   const quotes=new Map<string,SourceExcerpt>();for(const quote of group.quotes){const key=normalize(quote.text??''),previous=quotes.get(key);if(!previous||!previous.label&&quote.label)quotes.set(key,quote);}
   const row=element('section',undefined,group.values.size?'about-commercial':'about-source');row.dataset.sourceId=JSON.stringify([group.url,group.readAt??null]);for(const value of group.values)if(!quotes.has(normalize(value)))row.append(element('p',value,'about-term'));
   if(quotes.size)renderCitations(row,[...quotes.values()],false);else row.append(citationFooter(group));target.append(row);
  }
 });}renderAsked(id);
}
export function renderAnswer(target:HTMLElement,result:Answer){
  target.replaceChildren();
  target.append(element('p',result.status==='ANSWERED'?result.answer:result.status==='NOT_STATED'?'Not stated on the page':'This answer could not be verified.'));
  const citations=result.citations||[],checkedPages=result.checkedPages||[];
  renderCitations(target,questionCitations(citations.length?citations:checkedPages));
  if(result.confirmationRequired)target.append(element('p','Please confirm with the restaurant.'));
}
export function renderAsked(id:string){
  const r=requireView().restaurant,history=r.questionHistory.filter(q=>q.candidateId===id&&q.result),q=history[0];
  const pending=questionPending()&&r.pageQuestion?.candidateId===id;
  show('asked-history',!!q||pending);show('asked-pending',pending);show('asked-latest',!!q);
  show('question-stop',pending&&r.progress.active&&!!r.sourceReadContext?.handleId);$('question-stop').disabled=state.blocked;
  if(pending)text('asked-pending-question',r.pageQuestion!.question);
  const signature=JSON.stringify([id,history]);if(state.questionKey===signature)return;state.questionKey=signature;
  if(!q){$('asked-question').textContent='';$('asked-result').replaceChildren();$('asked-earlier').replaceChildren();return;}
  text('asked-question',q.question);if(q.result)renderAnswer($('asked-result'),q.result);
  $('asked-earlier').replaceChildren(...history.slice(1).map(item=>{const row=element('article',undefined,'asked-item'),answer=element('div',undefined,'asked-answer');row.append(element('p',item.question),answer);if(item.result)renderAnswer(answer,item.result);return row;}));
}
export function renderConditions(){
  const r=requireView().restaurant,draft:Partial<IntentDraft>=r.intentDraft||{},parts:Array<[string,boolean,ConditionKind,ConditionValue?,boolean?]>=[];
  if(draft.area)parts.push([(r.searchLocation&&r.searchLocation.label)||draft.area.query,false,'text']);
  if(draft.date)parts.push([displayDate(draft.date),false,'date',draft.date]);
  if(draft.timeWindow)parts.push([draft.timeWindow.earliest+(draft.timeWindow.latest!==draft.timeWindow.earliest?'–'+draft.timeWindow.latest:''),false,'time',draft.timeWindow]);
  if(draft.partySize)parts.push([draft.partySize+' guests',draft.partySizeSource==='INFERRED_CLOSED_PARTY','guests',draft.partySize]);
  if(draft.budgetPerPerson)parts.push([money(draft.budgetPerPerson.max)+' per guest',false,'text',undefined,true]);
  for(const criterion of draft.criteria||[])parts.push([criterion.text,false,'text',undefined,true]);
  if(state.conditionEditor&&state.conditionEditor.caseId===requireView().case.caseId)return;
  const signature=JSON.stringify([requireView().case.caseId,parts]);if($('request-conditions').dataset.signature===signature)return;
  $('request-conditions').dataset.signature=signature;state.conditionEditor=null;
  $('request-conditions').replaceChildren(...parts.map(([label,inferred,kind,value,removable])=>{
    const button=element('button',label+(inferred?'?':''));button.title='Change '+label;button.onclick=()=>actions.editCondition(button,label,kind,value,removable);return button;
  }));
}
export function changeReason(code:string){return (new Map(Object.entries({OVER_BUDGET:'Over budget',NEW_TIME_MISMATCH:"Doesn't match the new time",NO_LONGER_MATCHES:'No longer matches'}))).get(code)||'No longer matches';}
export function renderChanges(){
 const r=requireView().restaurant,diff=r.revisionDiff,added=diff?.added.length&&r.readStatus.kind==='RESULTS'&&ids().length>0?diff.added.length:0;
 const host=$('revision-changes'),changed=!!diff&&(diff.removed.length>0||added>0);show('revision-changes',changed&&state.ui.view==='CANDIDATES'&&!state.ui.atEnd);
 if(!changed||!diff){for(const id of ['added-count','removed-count','revision-chevron'])text(id,'');$('removed-list').replaceChildren();state.diffKey='';host.open=false;return;}
 const onlyAdded=diff.removed.length===0,summary=host.querySelector('summary')!;show('removed-count',!onlyAdded);show('added-count',added>0);show('revision-chevron',!onlyAdded);show('removed-list',!onlyAdded);host.classList.toggle('only-added',onlyAdded);summary.setAttribute('aria-disabled',String(onlyAdded));summary.tabIndex=onlyAdded?-1:0;summary.onclick=event=>{if(onlyAdded)event.preventDefault();};
 text('added-count',added?added+(onlyAdded?(added===1?' new place':' new places'):' new, '):'');text('removed-count',onlyAdded?'':diff.removed.length+' no longer match');text('revision-chevron',onlyAdded?'':'▾');
 const signature=JSON.stringify([diff,added]);if(signature===state.diffKey)return;state.diffKey=signature;host.open=false;
 $('removed-list').replaceChildren(...diff.removed.map(item=>{const row=element('li');row.dataset.candidateId=item.candidateId;row.append(item.sourceUrl?link(item.outletName+' ↗',item.sourceUrl):element('span',item.outletName));if(item.reasonCode!=='NO_LONGER_MATCHES')row.append(element('p',changeReason(item.reasonCode),'muted'));return row;}));
}
export function renderSaved(){
  const saved=requireView().restaurant.savedCandidates;show('saved-empty',!saved.length);$('saved-list').replaceChildren();
  for(const item of saved){const button=element('button',undefined,'saved-row'),description=element('div');description.append(element('span',item.outletName));
    if(item.reasonCode)description.append(element('p',changeReason(item.reasonCode),'muted'));button.append(description);button.dataset.candidateId=item.candidateId;button.disabled=!item.current;
    if(item.current){button.append(element('span','→'));button.onclick=()=>{state.ui.atEnd=false;if(state.ui.candidateId!==item.candidateId)forgetSlotSelection();state.ui.candidateId=item.candidateId;actions.setView('CANDIDATES');};}
    $('saved-list').append(button);
  }
}
export function renderReadState(end:boolean){
  const r=requireView().restaurant,status=r.readStatus;
  const failed=status.kind==='OTHER_FAILURE'&&!r.progress.active&&!r.progress.stopped;
  const empty=failed||status.kind==='NO_QUALIFIED_RESULTS'||status.kind==='ALL_SOURCES_FAILED';
  show('empty-state',empty);show('understanding-error',status.kind==='MODEL_FAILURE');
  if(empty){text('empty-message',failed?"Couldn't complete this search. Please try again.":status.kind==='ALL_SOURCES_FAILED'?"Couldn't reach the sources. Try again?":status.canContinue?'Nothing matched yet.':"Couldn't confirm a matching place this time. Try adjusting the area, time, or party size.");show('empty-adjust',status.kind==='NO_QUALIFIED_RESULTS');show('empty-more',status.kind==='NO_QUALIFIED_RESULTS'&&status.canContinue);show('empty-retry',status.kind==='ALL_SOURCES_FAILED'&&status.canRetry);$('empty-more').disabled=state.blocked;$('empty-retry').disabled=state.blocked;}
  show('partial-source-note',status.partialSourceFailure&&!r.progress.active&&end);
}
export function renderHandoff(){
  const c=candidate();if(!c)return;
  const h=currentHandoff(),source=sourceFor(c.restaurant.id);
  text('handoff-name',c.restaurant.outletName);
  const slots=handoffs(),selector=$('handoff-slot');show('handoff-slot-label',slots.length>0);show('handoff-time-row',slots.length>0);selector.disabled=state.blocked||!!state.preparing||!!h&&slots.length<=1;
  selector.replaceChildren(...slots.map(slot=>{const offer=(requireView().restaurant.availability[c.restaurant.id]||[]).find(o=>o.id===slot.offerId);const option=element('option',offer?availabilityTime(offer.dateTime)+'　'+offer.partySize+' guests':slot.continueLabel);option.value=slot.offerId;return option;}));
  if(h)selector.value=h.offerId;else{const placeholder=element('option','Choose a time');placeholder.value='';placeholder.disabled=true;placeholder.selected=true;selector.prepend(placeholder);}
  const selectedOffer=h&&(requireView().restaurant.availability[c.restaurant.id]||[]).find(o=>o.id===h.offerId),price=selectedOffer&&selectedOffer.price;show('handoff-price',!!price);text('handoff-price',price?money(price.amount)+(price.basis==='PER_PERSON'?' per guest':price.basis==='TOTAL'?' total':''):'');
  selector.onchange=()=>{const offer=freshOffers(c.restaurant.id).find(o=>o.id===selector.value);if(offer){selectSlot(offer);savePosition();renderHandoff();}};
  text('handoff-provider-name',h?sourceName(h.provider,h.url):'');show('handoff-provider',!!h);
  const refreshable=canRefresh(),refresh=refreshable&&availabilityExpired(c.restaurant.id);
  show('departure',!!h||refresh);show('departure-fields',!!h);show('handoff-unavailable',!h&&!refresh);
  if(!h&&refresh){text('departure-title','Check availability again');$('departure').href='#';}
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
      const citations:SourceExcerpt[]=[];
      for(const [index,term]of h.terms.entries()){
        const row=element('div',undefined,'fact');
        row.append(element('p',term.label));
        for(const quote of term.citations)citations.push({...quote,label:term.label});
        if(h.cancellationNotice&&index===1){
          row.dataset.kind='cancellation-conflict';
          row.append(element('p',h.cancellationConfirmation,'muted'));
        }
        target.append(row);
      }
      renderCitations(target,citations);
      if(h.platformFee)target.append(element('p',h.platformFee.label,'muted'));
    });
  }
  const href=h&&h.url||source&&safeLink(source.sourceUrl);
  show('direct-source',!h&&!!href);if(href)$('direct-source').href=href;
  text('handoff-unavailable',refreshable
    ? 'No current booking handoff is available. You can check the source website or refresh availability.'
    : href?'No current booking handoff is available. You can check the source website.':'No current booking handoff is available.');
}
export function render(){
  const view = state.view;
  const question = view?.restaurant.pageQuestion;
  // An accepted question can retain its About page after booking inventory expires.
  const retainQuestionDetails = state.ui.view === 'DETAILS' && view?.case.stopped
    && question && question.candidateId === state.ui.candidateId
    && !!question.readRunId && question.readRunId === view.restaurant.sourceReadContext?.runId
    && !!candidate();
  if(!retainQuestionDetails&&state.view&&!state.pendingCase&&!requireView().restaurant.progress.active&&['DETAILS','HANDOFF'].includes(state.ui.view)){
   const currentIds=ids();if(requireView().restaurant.readStatus.kind!=='RESULTS'||!currentIds.length||!currentIds.includes(state.ui.candidateId??'')){
    actions.closeAnswer();closePhotos();state.ui.view='CANDIDATES';state.ui.atEnd=false;
   }
  }
  const real=!!state.view,pending=state.pendingCase,has=real||!!pending,mode=pending?'CANDIDATES':state.ui.view;caseScroller.dataset.view=mode;show('home',!has);show('case-workspace',has);show('workspace-composer',has&&['CANDIDATES','DETAILS'].includes(mode));const conditionRow=document.querySelector<HTMLElement>('.workspace-conditions')!;conditionRow.hidden=mode==='SAVED'||mode==='HANDOFF';
  for(const row of $('case-list').querySelectorAll<HTMLElement>('.case-link'))row.classList.toggle('active',real&&row.dataset.caseId===requireView().case.caseId);
  if(real&&caseScroller.dataset.caseId!==requireView().case.caseId){caseScroller.scrollTop=0;caseScroller.dataset.caseId=requireView().case.caseId;}
  if(!has){caseScroller.scrollTop=0;$('topbar').classList.remove('scrolled');if($('error').parentElement===caseScroller)$('workspace-composer').before($('error'));}else if($('error').parentElement!==caseScroller)caseScroller.append($('error'));
  const parent=has?$('workspace-composer'):$('home-composer');if($('composer').parentElement!==parent)parent.append($('composer'));resizeMessage();updateComposerClearance();
  const asking=real&&state.ui.view==='DETAILS';$('message').setAttribute('aria-label',asking?'Restaurant question':'Plan message');
  const waiting=state.asking||questionPending();
  $('send').setAttribute('aria-busy',String(Boolean(state.sending||waiting)));
  $('send').disabled=state.blocked||waiting||(asking&&!canAskCurrentPlace());
  if(!has){$('brand').classList.remove('working');show('progress',false);show('feedback',false);renderPhotos();syncComposerPlaceholder();return;}
  if(pending){
   caseScroller.scrollTop=0;delete caseScroller.dataset.caseId;
   reconcileSlot();
  text('case-title',displayTitle(pending.title));$('case-title').title=pending.title;
   for(const id of ['candidate-panel','details','handoff','saved-panel','batch-end','empty-state','understanding-error','revision-changes','partial-source-note','clarification-reply','messages','feedback','mode-note','use-location','saved'])show(id,false);
   $('request-conditions').replaceChildren();delete $('request-conditions').dataset.signature;conditionRow.hidden=false;conditionRow.style.visibility='hidden';renderProgress();syncComposerPlaceholder();return;
  }
  const r=requireView().restaurant,candidateIds=ids();
  let currentId=state.ui.candidateId;
  if(!r.progress.active&&!retainQuestionDetails){
    if(r.readStatus.kind!=='RESULTS'||!candidateIds.length)currentId=null;
    else if(!candidateIds.includes(currentId??''))currentId=candidateIds[0];
  }else if(!currentId||!r.candidates.some(c=>c.restaurant.id===currentId)){
    currentId=candidateIds[0]||currentId;
  }
  if(currentId!==state.ui.candidateId){
    state.ui.candidateId=currentId;clearSlotSelection();state.detailKey='';state.handoffKey='';
  }
  reconcileSlot();
  text('case-title',displayTitle(requireView().case.title));$('case-title').title=requireView().case.title;const savedCount=(r.shortlistCandidateIds||[]).length;text('saved-count',savedCount);show('saved-count',savedCount>0);$('saved').setAttribute('aria-label',savedCount>0?'Saved '+savedCount:'Saved');
  renderConditions();renderChanges();renderProgress();const end=mode==='CANDIDATES'&&state.ui.atEnd&&!r.progress.active&&requireView().case.phase==='PRESENT_RESULTS';
  show('candidate-panel',mode==='CANDIDATES'&&!!candidate()&&!end&&(!state.preview||state.preview.phase==='card'));show('batch-end',!!end);show('details',mode==='DETAILS'&&!!candidate());show('saved-panel',mode==='SAVED');show('saved',mode!=='SAVED');conditionRow.hidden=['SAVED','HANDOFF'].includes(mode);conditionRow.style.visibility=mode==='CANDIDATES'&&(state.preview&&state.preview.phase==='understanding'||!candidate()&&!$('request-conditions').childElementCount&&(r.progress.active||requireView().case.phase==='UNDERSTANDING'))?'hidden':'';show('handoff',mode==='HANDOFF'&&!!candidate());
  $('find-more').disabled=state.blocked;
  if(mode==='CANDIDATES'&&!end)renderCard();if(mode==='DETAILS')renderDetails();if(mode==='SAVED')renderSaved();if(mode==='HANDOFF')renderHandoff();renderPhotos();
  renderReadState(!!end);const busy=!!(pending||state.preview||state.sending||state.blocked||r.progress.active||['UNDERSTANDING','SEARCHING'].includes(requireView().case.phase));
  const clarifying=!busy&&mode==='CANDIDATES'&&requireView().case.phase==='NEEDS_INPUT';
  const replies=clarifying?requireView().conversation.messages.filter(message=>message.role==='USER'):[];
  const reply=replies.at(-1)?.content||'';
  text('clarification-reply',reply);show('clarification-reply',!!reply);
  const message=clarifying?r.clarificationQuestion||'':!busy&&mode==='CANDIDATES'&&r.progress.stopped?'Search stopped.':'';
  text('messages',message);show('messages',!!message);
  const area=r.intentDraft?.area,needsLocation=!!area&&area.query.trim().toLocaleLowerCase('en-US')==='nearby'&&!area.coordinates;
  show('use-location',mode==='CANDIDATES'&&!busy&&((r.missingRequiredFields||[]).includes('location')||needsLocation));
  $('use-location').disabled=!!state.locating;
  if(mode!=='CANDIDATES')for(const id of ['progress','empty-state','understanding-error','partial-source-note','messages','use-location'])show(id,false);
  show('mode-note',requireView().mode==='FIXTURE');text('mode-note','Fixture only. No real availability or reservations.');savePosition();clearTimeout(state.expiry);
  const expiry=Object.values(r.availability).flat().map((o)=>Date.parse(o.displayExpiresAt??'')).filter(t=>t>Date.now()).sort((a,b)=>a-b)[0];if(expiry)state.expiry=setTimeout(()=>{reconcileSlot();render();},Math.min(expiry-Date.now()+10,2147483647));show('feedback',state.feedbackPrompts.has(requireView().case.caseId));syncComposerPlaceholder();
}
