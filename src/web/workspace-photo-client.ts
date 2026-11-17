/** Runs in the workspace's existing script; consumes only authenticated photo DTOs. */
export const WORKSPACE_PHOTO_CLIENT_SCRIPT = String.raw`
const photoCache=new Map(),photoPositions=new Map();
let activePhotoKey='';
function photoKey(){const c=candidate();return state.view&&state.user&&c?JSON.stringify([state.user.id,state.view.case.caseId,c.restaurant.id,c.restaurant.outletName,c.restaurant.address,c.restaurant.sourceIds]):'';}
function photoGeneration(){const c=candidate();return c?JSON.stringify(state.view.restaurant.readEvidence.filter(e=>e.candidateId===c.restaurant.id&&e.kind==='ENTITY_MATCH').map(e=>[e.evidenceId,e.observedAt,e.sourceUrl])):'';}
function closePhotos(){if($('photo-viewer').open)$('photo-viewer').close();}
function photoPosition(key,photos){if(!photoPositions.has(key)){let index=0;try{index=Number(localStorage.getItem(key+':photo'))||0;}catch{}photoPositions.set(key,index);}return Math.max(0,Math.min(photoPositions.get(key)||0,photos.length-1));}
function photoList(entry){return (entry&&entry.result&&entry.result.photos||[]).filter(p=>!entry.failed.has(p.id));}
function setPhotoImage(id,photo,key,loaded,failed){
  const image=$(id),signature=key+':'+(photo&&photo.id||'');
  if(!photo){image.onload=null;image.onerror=null;image.removeAttribute('src');delete image.dataset.photo;return;}
  if(image.dataset.photo===signature){if(image.complete&&image.naturalWidth>0)loaded();return;}
  let url;try{url=new URL(photo.contentUrl,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/api/cases/'))return;}catch{return;}
  image.dataset.photo=signature;image.alt=candidate().restaurant.outletName+' photo';
  image.onload=()=>{if(photoKey()===key&&image.dataset.photo===signature)loaded();};
  image.onerror=()=>{if(photoKey()===key&&image.dataset.photo===signature)failed();};
  image.src=url.href;
}
function renderPhotoImages(key,entry){
  const photos=photoList(entry),index=photoPosition(key,photos),cover=photos[0],current=photos[index];
  const fail=photo=>{if(photo===cover&&photo.provider==='GOOGLE_PLACES'&&!entry.coverRetried){entry.coverRetried=true;entry.failedCoverId=photo.id;entry.scope=null;entry.result=null;}else entry.failed.add(photo.id);renderPhotos();};
  renderPhotoSource('cover-photo-source',cover);
  const coverReady=()=>{show('cover-photo-source',true);show('cover-open',true);show('restaurant-initial',false);show('no-photo',false);requestAnimationFrame(()=>fitPhotoCredit($('cover-photo-source')));};
  if($('cover-image').dataset.photo!==key+':'+(cover&&cover.id||'')){show('cover-photo-source',false);show('cover-open',false);show('restaurant-initial',true);show('no-photo',true);}
  setPhotoImage('cover-image',cover,key,coverReady,()=>fail(cover));
  show('place-photos',state.ui.view==='DETAILS'&&photos.length>0);
  if(state.ui.view==='DETAILS'){
    setPhotoImage('detail-photo',current,key,()=>{},()=>fail(current));
    text('detail-photo-counter',photos.length?(index+1)+' of '+photos.length:'');
    $('detail-photo-previous').disabled=index===0;$('detail-photo-next').disabled=index>=photos.length-1;
    show('detail-photo-controls',photos.length>1);renderPhotoSource('detail-photo-source',current);
  }
  if($('photo-viewer').open){
    if(!current){closePhotos();return;}
    text('photo-place',candidate().restaurant.outletName);
    setPhotoImage('large-photo',current,key,()=>{},()=>fail(current));
    text('photo-counter',(index+1)+' of '+photos.length);
    $('photo-previous').disabled=index===0;$('photo-next').disabled=index>=photos.length-1;
    show('photo-controls',photos.length>1);renderPhotoSource('photo-source',current);
  }
}
function fitPhotoCredit(host){
 const content=host.querySelector('.credit-text');if(!content||host.id==='photo-source')return;
 const width=host.parentElement.clientWidth-20;content.style.whiteSpace='nowrap';content.style.display='inline-block';
 const long=content.getBoundingClientRect().width>width;host.classList.toggle('long',long);content.style.whiteSpace='';content.style.display='';
}
function renderPhotoSource(id,photo){
 const host=$(id);host.replaceChildren();if(!photo){host.hidden=true;return;}
 host.hidden=false;const content=element('span',undefined,'credit-text');
 if(photo.provider==='GOOGLE_PLACES'){
  content.append(photo.sourcePageUrl?link('Google Maps',photo.sourcePageUrl):document.createTextNode('Google Maps'));
  for(const author of photo.authors||[]){content.append(' · ',author.uri?link(author.displayName,author.uri):document.createTextNode(author.displayName));}
 }else content.append(photo.attribution?document.createTextNode(photo.attribution):link('Source: '+photo.sourceLabel,photo.sourcePageUrl));
 host.append(content);requestAnimationFrame(()=>fitPhotoCredit(host));
}
const photoCreditObserver=new ResizeObserver(()=>{for(const id of ['cover-photo-source','detail-photo-source'])fitPhotoCredit($(id));});
for(const host of document.querySelectorAll('.photo-frame'))photoCreditObserver.observe(host);
function renderPhotos(){
  const key=photoKey(),visible=state.view&&['CANDIDATES','DETAILS'].includes(state.ui.view)&&!state.ui.atEnd;
  if(activePhotoKey!==key){closePhotos();activePhotoKey=key;show('cover-photo-source',false);show('cover-open',false);show('restaurant-initial',true);show('no-photo',true);}
  if(!visible||!key){show('place-photos',false);closePhotos();return;}
  const scope=state.ui.view==='DETAILS'||$('photo-viewer').open?'gallery':'cover',generation=photoGeneration();let entry=photoCache.get(key);
  if(entry&&entry.generation!==generation&&!entry.loading){if(!entry.result||entry.result.status!=='READY'){photoCache.delete(key);entry=null;}else entry.generation=generation;}
  if(entry&&entry.result&&Date.parse(entry.result.expiresAt)<=Date.now()&&!entry.loading){photoCache.delete(key);entry=null;}
  if(!entry){entry={result:null,scope:null,loading:false,generation,failed:new Set()};photoCache.set(key,entry);while(photoCache.size>32)photoCache.delete(photoCache.keys().next().value);}
  renderPhotoImages(key,entry);
  if(entry.loading||(entry.result&&(entry.scope==='gallery'||entry.scope===scope)))return;
  entry.loading=true;const target=entry,c=state.view.case.caseId,id=candidate().restaurant.id;
  api('/api/cases/'+encodeURIComponent(c)+'/candidates/'+encodeURIComponent(id)+'/photos?scope='+scope,{headers:target.failedCoverId?{'x-praxis-failed-photo':target.failedCoverId}:{}}).then(result=>{
    if(result.candidateId!==id)throw new Error('Photo response mismatch');target.result=result;target.scope=scope;
  }).catch(()=>{target.result={photos:[],expiresAt:new Date(Date.now()+600000).toISOString()};target.scope=scope;})
    .finally(()=>{target.loading=false;if(photoKey()===key)renderPhotos();});
}
function movePhoto(delta){const key=photoKey(),entry=photoCache.get(key),photos=photoList(entry);if(!photos.length)return;const index=Math.max(0,Math.min(photoPosition(key,photos)+delta,photos.length-1));photoPositions.set(key,index);try{localStorage.setItem(key+':photo',String(index));}catch{}renderPhotoImages(key,entry);}
function openPhotos(){const entry=photoCache.get(photoKey());if(!photoList(entry).length)return;$('photo-viewer').showModal();renderPhotos();}
$('cover-open').onclick=openPhotos;$('detail-photo-open').onclick=openPhotos;$('photo-close').onclick=closePhotos;
$('detail-photo-previous').onclick=()=>movePhoto(-1);$('detail-photo-next').onclick=()=>movePhoto(1);$('photo-previous').onclick=()=>movePhoto(-1);$('photo-next').onclick=()=>movePhoto(1);
$('photo-viewer').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();movePhoto(-1);}if(event.key==='ArrowRight'){event.preventDefault();movePhoto(1);}});
`;
