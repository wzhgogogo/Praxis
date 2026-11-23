import type { Photo, PhotoResult } from './view-contracts.js';
import { $, element, requireUser, requireView, show, state, text } from "./runtime.js";
import { candidate } from "./queries.js";
import { link } from "./format.js";
import { actions } from "./actions.js";
interface PhotoEntry {result:PhotoResult|null;scope:'cover'|'gallery'|null;loading:boolean;generation:string;failed:Set<string>;prefetched:Set<string>;coverRetried?:boolean;failedCoverId?:string}
export const photoCache=new Map<string,PhotoEntry>(),photoPositions=new Map<string,number>();
export let activePhotoKey='';
export function photoKey(){const c=candidate();return state.view&&state.user&&c?JSON.stringify([requireUser().id,requireView().case.caseId,c.restaurant.id,c.restaurant.outletName,c.restaurant.address,c.restaurant.sourceIds]):'';}
export function photoGeneration(){const c=candidate();return c?JSON.stringify(requireView().restaurant.readEvidence.filter(e=>e.candidateId===c.restaurant.id&&e.kind==='ENTITY_MATCH').map(e=>[e.evidenceId,e.observedAt,e.sourceUrl])):'';}
export function closePhotos(){if($('photo-viewer').open)$('photo-viewer').close();}
export function photoPosition(key:string,photos:readonly Photo[]){if(!photoPositions.has(key)){let index=0;try{index=Number(localStorage.getItem(key+':photo'))||0;}catch{}photoPositions.set(key,index);}return Math.max(0,Math.min(photoPositions.get(key)||0,photos.length-1));}
export function photoList(entry:PhotoEntry|undefined){return (entry&&entry.result&&entry.result.photos||[]).filter(p=>!entry?.failed.has(p.id));}
export function setPhotoImage(id:'cover-image'|'detail-photo'|'large-photo',photo:Photo|undefined,key:string,loaded:()=>void,failed:()=>void){
  const image=$(id),signature=key+':'+(photo&&photo.id||'');
  if(!photo){image.onload=null;image.onerror=null;image.removeAttribute('src');delete image.dataset.photo;return;}
  if(image.dataset.photo===signature){if(image.complete&&image.naturalWidth>0)loaded();return;}
  let url;try{url=new URL(photo.contentUrl,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/api/cases/'))return;}catch{return;}
  image.dataset.photo=signature;image.alt=(candidate()?.restaurant.outletName??'')+' photo';
  image.onload=()=>{if(photoKey()===key&&image.dataset.photo===signature)loaded();};
  image.onerror=()=>{if(photoKey()===key&&image.dataset.photo===signature)failed();};
  image.src=url.href;
}
export function warmNextWebsitePhoto(key:string,entry:PhotoEntry,photo:Photo){
  if(photoKey()!==key||photoCache.get(key)!==entry||!(state.ui.view==='DETAILS'||$('photo-viewer').open))return;
  const photos=photoList(entry),index=photoPosition(key,photos);
  if(photos[index]?.id!==photo.id)return;
  const next=photos[index+1];
  // Google (and unknown providers) are strictly demand-loaded. Only one website image may look ahead.
  if(next?.provider!=='WEBSITE'||entry.prefetched.has(next.id))return;
  let url;try{url=new URL(next.contentUrl,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/api/cases/'))return;}catch{return;}
  entry.prefetched.add(next.id);
  const image=new Image();
  // Warm-up completion never changes the visible image, failed set, counters or starts another warm-up.
  image.onload=image.onerror=()=>{image.onload=null;image.onerror=null;};
  image.src=url.href;
}
export function renderPhotoImages(key:string,entry:PhotoEntry){
  const photos=photoList(entry),index=photoPosition(key,photos),cover=photos[0],current=photos[index];
  const fail=(photo:Photo)=>{if(photo===cover&&photo.provider==='GOOGLE_PLACES'&&!entry.coverRetried){entry.coverRetried=true;entry.failedCoverId=photo.id;entry.scope=null;entry.result=null;}else entry.failed.add(photo.id);renderPhotos();};
  renderPhotoSource('cover-photo-source',cover);
  const coverReady=()=>{show('cover-photo-source',true);show('cover-open',true);show('restaurant-initial',false);show('no-photo',false);requestAnimationFrame(()=>fitPhotoCredit($('cover-photo-source')));};
  if($('cover-image').dataset.photo!==key+':'+(cover&&cover.id||'')){show('cover-photo-source',false);show('cover-open',false);show('restaurant-initial',true);show('no-photo',true);}
  setPhotoImage('cover-image',cover,key,coverReady,()=>fail(cover));
  show('place-photos',state.ui.view==='DETAILS'&&photos.length>0);
  if(state.ui.view==='DETAILS'){
    setPhotoImage('detail-photo',current,key,()=>warmNextWebsitePhoto(key,entry,current),()=>fail(current));
    text('detail-photo-counter',photos.length?(index+1)+' of '+photos.length:'');
    $('detail-photo-previous').disabled=index===0;$('detail-photo-next').disabled=index>=photos.length-1;
    show('detail-photo-controls',photos.length>1);renderPhotoSource('detail-photo-source',current);
  }
  if($('photo-viewer').open){
    if(!current){closePhotos();return;}
    text('photo-place',(candidate()?.restaurant.outletName??''));
    setPhotoImage('large-photo',current,key,()=>warmNextWebsitePhoto(key,entry,current),()=>fail(current));
    text('photo-counter',(index+1)+' of '+photos.length);
    $('photo-previous').disabled=index===0;$('photo-next').disabled=index>=photos.length-1;
    show('photo-controls',photos.length>1);renderPhotoSource('photo-source',current);
  }
}
export function fitPhotoCredit(host:HTMLElement){
 const content=host.querySelector<HTMLElement>('.credit-text');if(!content||host.id==='photo-source')return;
 const width=(host.parentElement?.clientWidth??0)-20;content.style.whiteSpace='nowrap';content.style.display='inline-block';
 const long=content.getBoundingClientRect().width>width;host.classList.toggle('long',long);content.style.whiteSpace='';content.style.display='';
}
export function renderPhotoSource(id:string,photo:Photo|undefined){
 const host=$(id);host.replaceChildren();if(!photo){host.hidden=true;return;}
 host.hidden=false;const content=element('span',undefined,'credit-text');
 if(photo.provider==='GOOGLE_PLACES'){
  content.append(photo.sourcePageUrl?link('Google Maps',photo.sourcePageUrl):document.createTextNode('Google Maps'));
  for(const author of photo.authors||[]){content.append(' · ',author.uri?link(author.displayName,author.uri):document.createTextNode(author.displayName));}
 }else content.append(photo.attribution?document.createTextNode(photo.attribution):link('Source: '+photo.sourceLabel,photo.sourcePageUrl));
 host.append(content);requestAnimationFrame(()=>fitPhotoCredit(host));
}
export function observePhotoCredits(){const observer=new ResizeObserver(()=>{for(const id of ['cover-photo-source','detail-photo-source'])fitPhotoCredit($(id));});for(const host of document.querySelectorAll('.photo-frame'))observer.observe(host);}
export function renderPhotos(){
  const key=photoKey(),visible=state.view&&['CANDIDATES','DETAILS'].includes(state.ui.view)&&!state.ui.atEnd;
  if(activePhotoKey!==key){closePhotos();activePhotoKey=key;show('cover-photo-source',false);show('cover-open',false);show('restaurant-initial',true);show('no-photo',true);}
  if(!visible||!key){show('place-photos',false);closePhotos();return;}
  const scope=state.ui.view==='DETAILS'||$('photo-viewer').open?'gallery':'cover',generation=photoGeneration();let entry=photoCache.get(key);
  if(entry&&entry.generation!==generation&&!entry.loading){if(!entry.result||entry.result.status!=='READY'){photoCache.delete(key);entry=undefined;}else entry.generation=generation;}
  if(entry&&entry.result&&Date.parse(entry.result.expiresAt)<=Date.now()&&!entry.loading){photoCache.delete(key);entry=undefined;}
  if(!entry){entry={result:null,scope:null,loading:false,generation,failed:new Set(),prefetched:new Set()};photoCache.set(key,entry);while(photoCache.size>32)photoCache.delete(photoCache.keys().next().value!);}
  renderPhotoImages(key,entry);
  if(entry.loading||(entry.result&&(entry.scope==='gallery'||entry.scope===scope)))return;
  entry.loading=true;const target=entry,c=requireView().case.caseId,id=candidate()?.restaurant.id;if(!id)return;
  actions.api<PhotoResult>('/api/cases/'+encodeURIComponent(c)+'/candidates/'+encodeURIComponent(id)+'/photos?scope='+scope,{headers:target.failedCoverId?{'x-praxis-failed-photo':target.failedCoverId}:{}}).then(result=>{
    if(result.candidateId!==id)throw new Error('Photo response mismatch');target.result=result;target.scope=scope;
  }).catch(()=>{target.result={photos:[],expiresAt:new Date(Date.now()+600000).toISOString()};target.scope=scope;})
    .finally(()=>{target.loading=false;if(photoKey()===key)renderPhotos();});
}
export function movePhoto(delta:number){const key=photoKey(),entry=photoCache.get(key),photos=photoList(entry);if(!photos.length)return;const index=Math.max(0,Math.min(photoPosition(key,photos)+delta,photos.length-1));photoPositions.set(key,index);try{localStorage.setItem(key+':photo',String(index));}catch{}if(entry)renderPhotoImages(key,entry);}
export function openPhotos(){const entry=photoCache.get(photoKey());if(!photoList(entry).length)return;$('photo-viewer').showModal();renderPhotos();}

/** One-pointer swipes coexist with native pinch, vertical scroll and ordinary links. */
export function bindPhotoGestures(){
 for(const frame of [document.querySelector<HTMLElement>('.detail-photo-frame'),$('photo-viewer')]){
  if(!frame)continue;
  const pointers=new Set<number>();let multiple=false;
  let start:{x:number;y:number;id:number;key:string;viewer:boolean}|undefined,suppressClick=false,timer:number|undefined;
  frame.addEventListener('dragstart',event=>{if(!(event.target instanceof Element&&event.target.closest('a')))event.preventDefault();});
  frame.addEventListener('pointerdown',event=>{
   clearTimeout(timer);suppressClick=false;pointers.add(event.pointerId);
   if(pointers.size>1){multiple=true;start=undefined;return;}
   if(multiple)return;
   start=event.button!==0||event.target instanceof Element&&event.target.closest('a')?undefined:{x:event.clientX,y:event.clientY,id:event.pointerId,key:photoKey(),viewer:$('photo-viewer').open};
  });
  window.addEventListener('pointercancel',event=>{if(!pointers.delete(event.pointerId))return;start=undefined;suppressClick=false;if(!pointers.size)multiple=false;});
  window.addEventListener('pointerup',event=>{
   if(!pointers.delete(event.pointerId))return;const wasMultiple=multiple;if(!pointers.size)multiple=false;
   const down=start;start=undefined;if(wasMultiple||!down||down.id!==event.pointerId||down.key!==photoKey()||down.viewer!==$('photo-viewer').open||!(state.ui.view==='DETAILS'||$('photo-viewer').open))return;
   const dx=event.clientX-down.x,dy=event.clientY-down.y;if(Math.abs(dx)<40||Math.abs(dx)<=Math.abs(dy))return;movePhoto(dx<0?1:-1);suppressClick=true;timer=setTimeout(()=>{suppressClick=false;},0);
  });
  frame.addEventListener('click',event=>{if(!suppressClick||event.detail===0)return;suppressClick=false;clearTimeout(timer);event.preventDefault();event.stopImmediatePropagation();},true);
 }
}
