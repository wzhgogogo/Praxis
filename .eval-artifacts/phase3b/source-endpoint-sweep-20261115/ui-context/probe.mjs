import{writeFile}from'node:fs/promises';import{join,dirname}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{createHash}from'node:crypto';
const root=dirname(fileURLToPath(import.meta.url)),source='/private/tmp/praxis-premerge-scope-main-20261115',load=n=>import(pathToFileURL(join(source,'src',n)));
const {createG6LiveBrowser}=await load('eval/restaurant/agent-loop/g6/live-transports.ts');
const {chargeG6}=await load('eval/restaurant/agent-loop/g6/budget.ts');
const {discoveryPackNetworkPolicy}=await load('integrations/restaurant-search/source-packs.ts');
const {browserTransportError}=await load('infrastructure/browser/browser-runtime-errors.ts');
const responses=[],outcomes=[],actions=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let last=0;
for(const site of ['TABELOG','TABLECHECK']){
 let session;
 const controller=new AbortController(),started=Date.now();const timer=setTimeout(()=>controller.abort(),45_000);
 const entry=site==='TABELOG'?'https://tabelog.com/en/':'https://www.tablecheck.com/en/japan/search';
 const record=r=>{const u=new URL(r.url);responses.push({site,url:u.origin+u.pathname,queryKeys:[...u.searchParams.keys()],method:r.method,status:r.status,type:r.resourceType,bytes:r.body.byteLength,sha256:createHash('sha256').update(r.body).digest('hex'),at:new Date().toISOString()});};
 const choose=async(predicate,step)=>{const controls=await session.observeControls();const matches=controls.filter(c=>c.visible&&!c.disabled&&predicate(c));actions.push({site,step,matches:matches.map(c=>({id:c.id,label:c.label,kind:c.kind}))});if(matches.length!==1)throw Error('OBSERVED_CONTROL_NOT_UNIQUE:'+step);return matches[0];};
 const waitFor=async predicate=>{while(Date.now()-started<42_000){if(responses.some(predicate))return;await sleep(250);}throw Error('EXPECTED_SOURCE_RESPONSE_NOT_OBSERVED');};
 try{
  await sleep(Math.max(0,5000-(Date.now()-last)));await chargeG6(join(root,'active-budget.json'),site+':UI:'+Date.now(),'evaluationPublicGET','User requested existing paths: actual source-generated context for incomplete GET replay, no model/Live');last=Date.now();
  session=await createG6LiveBrowser(process.env).openSession({signal:controller.signal,networkPolicy:discoveryPackNetworkPolicy(),recordResponse:record});
  await session.prepareNavigation(entry,{timeoutMs:20_000});await session.navigate(entry,{waitUntil:'domcontentloaded'});
  if(site==='TABELOG'){
   const c=await choose(c=>c.kind==='INPUT'&&/restaurant|cuisine|keyword/i.test(c.label),'KEYWORD_INPUT');
   await session.fill(c.id,'Nakamata',{inputSource:'G4_SOURCE_TERM',timeoutMs:5000});
   await waitFor(r=>r.site===site&&r.url.endsWith('/en/suggest/keyword_suggest'));
  }else{
   await sleep(1000);
   const button=await choose(c=>c.kind==='BUTTON'&&c.label.startsWith('Destination'),'DESTINATION_OPEN');
   await session.click(button.id,{timeoutMs:5000});
   const input=await choose(c=>c.kind==='INPUT'&&c.label==='Destination','DESTINATION_INPUT');
   const name='Specializing in Nodoguro Ginza Nakamata';
   await session.fill(input.id,name,{inputSource:'SPECIFIC_OUTLET',timeoutMs:5000});
   await waitFor(r=>r.site===site&&r.url.includes('tablecheck.net/search/')&&r.queryKeys.includes('q')&&r.status===200);
   await sleep(1000);
   const suggestion=await choose(c=>c.kind==='BUTTON'&&c.label.trim()===name,'EXACT_SUGGESTION');
   await session.click(suggestion.id,{timeoutMs:5000});
   await waitFor(r=>r.site===site&&r.url.endsWith('/v2/shops/nakamata-nodoguro-ginza'));
   await sleep(1500);
  }
  const snapshot=await session.snapshot();
  outcomes.push({site,complete:true,elapsedMs:Date.now()-started,url:snapshot.url,title:snapshot.title,settlement:snapshot.settlement});
 }catch(error){outcomes.push({site,complete:false,error:browserTransportError(error),elapsedMs:Date.now()-started});}
 finally{clearTimeout(timer);controller.abort();await session?.close();await writeFile(join(root,'result.json'),JSON.stringify({outcomes,actions,responses,fullLive:0,modelCalls:0,scope:'Scripted read-only observed controls, no identity or inventory acceptance'},null,2)+'\n');}
}
console.log(JSON.stringify({outcomes,api:responses.filter(r=>r.url.includes('/suggest/')||r.url.includes('/v2/')||r.url.includes('tablecheck.net')).map(r=>({site:r.site,url:r.url,status:r.status,method:r.method}))}));
