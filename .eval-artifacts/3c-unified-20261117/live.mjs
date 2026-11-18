import {mkdir,readFile,writeFile,readdir,stat,unlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright-core';
import {createHash} from 'node:crypto';
const base='.eval-artifacts/3c-unified-20261117/round-4',dir=base+'/live';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}))throw Error('DIRTY_TREE');
const gates=JSON.parse(await readFile(base+'/gates/manifest.json','utf8')),visual=JSON.parse(await readFile(base+'/visual/manifest.json','utf8'));
if(gates.length!==5||gates.some(r=>r.sha!==sha||r.exitCode!==0||!r.cleanAfter)||visual.length!==16||visual.some(r=>r.sha!==sha||r.status!=='PASS'))throw Error('OFFLINE_ACCEPTANCE_NOT_ALL_GREEN_AT_HEAD');
// Env is read only after offline acceptance has passed. No dotenv file is copied or edited.
const {parsed,envPath,target,login,redact,scrub,save,client,localEnv,verifyEffective}=await import('./live-common.mjs');
await mkdir(dir,{recursive:false});
const row={sha,target,engine:'LOCAL_CHROMIUM',mode:'LIVE_READ',request:'Find a yakiniku restaurant in Shinjuku, Tokyo, for 2 guests on 2026-11-20 at 19:30, around 5,000 yen per person.',question:'Do they have private rooms?',http:[],sse:[],console:[],pageerror:[],blocked:[],counts:{userDemands:0,questions:0,departures:0,refreshes:0},photoSnapshots:[],photoContentLoads:[],evaluatorSeverity:{},externalSideEffectCount:'NOT_MEASURED',backendWebsiteRequests:'NOT_MEASURED',independentS0:'NOT_EVALUATED'};
const started=performance.now(),tmp='.eval-artifacts/restaurant-web-read',before=new Set(existsSync(tmp)?await readdir(tmp):[]);
let server,browser,context,page,c,caseId,finalView,serverText='',fatal;
const pendingPhotoReads=new Set();
function trackPhotoRead(promise){pendingPhotoReads.add(promise);void promise.finally(()=>pendingPhotoReads.delete(promise));}
async function settlePhotoReads(){while(pendingPhotoReads.size)await Promise.allSettled([...pendingPhotoReads]);}
function summarizePhotos(){
 const snapshots=row.photoSnapshots.filter(v=>!row.displayedCandidateId||v.candidateId===row.displayedCandidateId);
 const preferred=row.enteredAbout?'gallery':'cover';const latest=snapshots.findLast(v=>v.scope===preferred)??snapshots.at(-1);if(latest){row.finalPhotos=latest;row.photoRequestCounts=latest.requests;row.photoListCount=latest.photos?.length??0;}
 row.photoListReturnedCounts=snapshots.map(v=>({scope:v.scope,count:v.photos?.length??0,status:v.status}));
 const loaded=row.photoContentLoads.filter(v=>v.status===200&&v.bodyCompleted);row.photoContentHttp200Count=loaded.length;row.photoContentHttp200DistinctCount=new Set(loaded.map(v=>v.path)).size;
 const q=row.photoRequestCounts;if(q&&(q.googleDetails>1||q.googleMedia>20||q.websitePages>2||q.websiteImages>10))throw Error('PHOTO_BUDGET_EXCEEDED');
}
function terminalBlock(view){
 const kind=view.restaurant.readStatus?.kind;
 if(['ALL_SOURCES_FAILED','MODEL_FAILURE'].includes(kind))return kind;
 if(view.case.phase==='NEEDS_INPUT')return 'NEEDS_INPUT';
 if(['NO_QUALIFIED_RESULTS','OTHER_FAILURE'].includes(kind))return kind;
 return 'NO_PRESENTED_RESULTS';
}
const snapshot=async()=>{const response=await context.request.get('http://127.0.0.1:4312/api/cases/'+encodeURIComponent(caseId));if(response.status()!==200)throw Error('FINAL_GET_FAILED');return(await response.json()).view;};
const shot=async name=>{await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:dir+'/'+name+'.png',animations:'disabled'});};
async function inspectArtifacts(){
 if(!existsSync(tmp))return;
 for(const name of await readdir(tmp))if(!before.has(name)&&name.endsWith('.json')){
  let value;try{value=JSON.parse(await readFile(tmp+'/'+name,'utf8'));}catch{continue;}
  const usage=value.resourceUsage;
  if(usage){row.searchResourceUsage=usage;if((usage.modelCallsStarted??0)>50||(usage.googleRequests?.total??0)>100)throw Error('SEARCH_BUDGET_EXCEEDED');}
  // Preserve evaluator/oracle boundaries; any explicit suspected false claim stops further reads.
  if(value.severity){const statuses=Object.fromEntries(['S0','S0_DECLARATION','S0_BOUNDARY'].map(k=>[k,value.severity?.[k]?.status??'NOT_EVALUATED']));row.evaluatorSeverity[name]=statuses;if(Object.values(statuses).some(status=>status==='PRESENT'))throw Error('SUSPECTED_S0_IN_CLI_ARTIFACT');}
 }
}
try{
 for(const key of ['DEEPSEEK_API_KEY','DEEPSEEK_MODEL','GOOGLE_MAPS_API_KEY'])if(!parsed[key]?.trim())throw Error('MISSING_REQUIRED_'+key);
 save(dir+'/environment-static.json',{variables:Object.fromEntries(['DEEPSEEK_API_KEY','DEEPSEEK_MODEL','GOOGLE_MAPS_API_KEY','PRAXIS_GOOGLE_API_PROXY_SERVER','LOCAL_CHROMIUM_PROXY','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_TOKEN'].map(k=>[k,parsed[k]?.trim()?'CONFIGURED':'MISSING'])),overrides:{DATABASE_URL:'LOCAL_SYSTEM_ACCOUNT_LOOPBACK_PRAXIS_SMOKE',PRAXIS_TEST_DATABASE_URL:'SAME_LOCAL_TARGET',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PORT:'4312'},credentialValidity:'NOT_PROBED'});
 const effective=await verifyEffective(dir);if(effective.exitCode!==0)throw Error('EFFECTIVE_LOCAL_DATABASE_TARGET_FAILED');
 c=client();await c.connect();row.existingCases=(await c.query('SELECT id FROM tasks ORDER BY id')).rows.map(r=>r.id);row.postgresConnected=true;
 server=spawn(process.execPath,['--env-file='+envPath,'--import','tsx','src/server/local-web-server.ts'],{env:localEnv(),stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',b=>{serverText+=b.toString();});
 const startup=performance.now();while(!serverText.includes('workspace is running at http://127.0.0.1:4312')){if(server.exitCode!==null)throw Error('CLI_STARTUP_FAILED');if(performance.now()-startup>15_000)throw Error('CLI_LISTEN_TIMEOUT');await new Promise(r=>setTimeout(r,100));}
 row.listening=true;browser=await chromium.launch({headless:true,args:['--disable-background-networking']});context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url());if(u.origin!=='http://127.0.0.1:4312'){row.blocked.push({url:redact(r.url()),method:r.method(),navigation:r.isNavigationRequest()});await route.abort('blockedbyclient');return;}
  if(r.method()==='POST'){
   let kind;if(u.pathname==='/api/session')kind='session';else if(u.pathname==='/api/cases')kind='userDemands';else if(u.pathname.endsWith('/questions'))kind='questions';else if(u.pathname.endsWith('/booking-departures'))kind='departures';else if(u.pathname.endsWith('/booking-feedback/claim'))kind='feedback';else{fatal='FORBIDDEN_LOCAL_POST_'+u.pathname;await route.abort();return;}
   if(['userDemands','questions','departures'].includes(kind)){row.counts[kind]++;if(row.counts[kind]>1){fatal='SINGLE_RUN_LIMIT_'+kind;await route.abort();return;}}
  }await route.continue();
 });
 context.on('response',r=>{
  const u=new URL(r.url());if(u.origin!=='http://127.0.0.1:4312')return;
  row.http.push({atMs:performance.now()-started,path:u.pathname,method:r.request().method(),status:r.status()});
  if(u.pathname.endsWith('/photos'))trackPhotoRead(r.json().then(v=>{row.photoSnapshots.push({...scrub(v),scope:u.searchParams.get('scope'),atMs:performance.now()-started});}).catch(e=>{row.photoSnapshots.push({scope:u.searchParams.get('scope'),captureError:redact(e.message)});}));
  if(/\/photos\/[a-f0-9]{32}\/content$/.test(u.pathname))trackPhotoRead(r.finished().then(error=>{row.photoContentLoads.push({path:u.pathname,status:r.status(),bodyCompleted:error===null,atMs:performance.now()-started});}).catch(()=>{row.photoContentLoads.push({path:u.pathname,status:r.status(),bodyCompleted:false});}));
 });
 context.on('request',r=>{if(r.method()==='POST'&&!r.url().endsWith('/api/session')){let b;try{b=r.postDataJSON();}catch{}row.http.push({atMs:performance.now()-started,path:new URL(r.url()).pathname,method:'POST',body:b?Object.fromEntries(['message','question','candidateId','offerId','taskVersion','requestId','viewContext'].filter(k=>k in b).map(k=>[k,b[k]])):undefined});}});
 page=await context.newPage();page.setDefaultTimeout(15_000);page.on('pageerror',e=>row.pageerror.push(redact(e.message)));page.on('console',m=>row.console.push({type:m.type(),text:redact(m.text())}));const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');cdp.on('Network.eventSourceMessageReceived',e=>{try{const v=JSON.parse(e.data);row.sse.push({atMs:performance.now()-started,eventName:e.eventName,case:v.case,progress:v.restaurant.progress,readStatus:v.restaurant.readStatus,pageQuestion:v.restaurant.pageQuestion});}catch{row.sse.push({eventName:e.eventName,invalidJSON:true});}});
 await page.goto('http://127.0.0.1:4312');await page.getByLabel('Access token',{exact:true}).fill(login);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#message').waitFor({state:'visible'});await shot('01-authenticated');
 await page.locator('#message').fill(row.request);const created=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/api/cases');await page.locator('#send').click();const response=await created;if(response.status()!==201)throw Error('CREATE_CASE_FAILED');let view=(await response.json()).view;caseId=view.case.caseId;row.caseId=caseId;row.conversationId=view.case.conversationId;save(dir+'/initial-view.json',view);await shot('02-request-started');
 let quiet=0;const searchStart=performance.now();while(true){if(fatal)throw Error(fatal);view=await snapshot();if(!view.restaurant.progress.active&&!['UNDERSTANDING','SEARCHING'].includes(view.case.phase)){if(++quiet>=2)break;}else quiet=0;if(performance.now()-searchStart>510_000)throw Error('SEARCH_WALL_LIMIT');await new Promise(r=>setTimeout(r,500));}
 row.searchWaitMs=performance.now()-searchStart;row.terminalPhase=view.case.phase;row.readStatusKind=view.restaurant.readStatus?.kind;row.readStatus=view.restaurant.readStatus;save(dir+'/search-finished-view.json',view);await shot('03-search-finished');if(!row.sse.length)throw Error('NO_ACTUAL_SSE');await inspectArtifacts();
 if(view.case.phase==='PRESENT_RESULTS'&&view.restaurant.presentedCandidateIds?.length){
  for(const id of view.restaurant.presentedCandidateIds)for(const offer of view.restaurant.availability[id]??[]){const t=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(offer.dateTime));if(offer.partySize!==2||!t.startsWith('2026-11-20')||!t.endsWith('19:30'))throw Error('SUSPECTED_REQUEST_MISMATCH');}
  const id=await page.locator('#candidate-card').getAttribute('data-candidate-id');row.displayedCandidateId=id;row.displayedRestaurant=view.restaurant.candidates.find(v=>v.restaurant.id===id)?.restaurant;
  await page.waitForFunction(()=>{const image=document.getElementById('cover-image');return image?.complete&&image.naturalWidth>0;},undefined,{timeout:20_000}).catch(()=>{});
  row.coverLoaded=await page.locator('#cover-image').evaluate(n=>n.complete&&n.naturalWidth>0);row.coverCredit=await page.locator('#cover-photo-source').textContent();await shot('04-cover');
  if(row.coverLoaded){
   await page.locator('#details-button').click();row.enteredAbout=true;await page.locator('#detail-photo').waitFor({state:'visible'});await page.waitForFunction(()=>document.getElementById('detail-photo')?.naturalWidth>0);row.aboutCredit=await page.locator('#detail-photo-source').textContent();row.aboutAddress=await page.locator('#details-content p').first().textContent();await shot('05-about');
   await page.locator('#detail-photo-open').click();await page.locator('#photo-viewer').waitFor({state:'visible'});await page.waitForFunction(()=>document.getElementById('large-photo')?.naturalWidth>0);row.viewerCredit=await page.locator('#photo-source').textContent();await shot('06-viewer');await page.locator('#photo-close').click();await inspectArtifacts();
   await page.locator('#message').fill(row.question);const qr=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'),{timeout:65_000});await page.locator('#send').click();const answer=await qr;row.g1HttpStatus=answer.status();if(answer.status()!==200)throw Error('G1_ENDPOINT_FAILED');await page.locator('#answer-sheet').waitFor({state:'visible',timeout:65_000});view=await snapshot();row.g1=view.restaurant.pageQuestion;save(dir+'/g1-view.json',view);await shot('07-g1');await inspectArtifacts();await page.locator('#answer-dismiss').click();await page.locator('#details-back').click();
   const h=await page.evaluate(()=>typeof currentHandoff==='function'?currentHandoff():null);row.b1CheckedAt=new Date().toISOString();
   if(!h||Date.parse(h.displayExpiresAt)<=Date.now())row.departureStatus='B1_MISSING_OR_EXPIRED_SKIP';else{
    row.currentHandoff=h;await page.locator('#choose').click();await page.locator('#handoff').waitFor({state:'visible'});if(await page.locator('#departure').getAttribute('href')!==h.url)throw Error('B1_DISPLAY_URL_MISMATCH');
    if(Date.parse(h.displayExpiresAt)<=Date.now())row.departureStatus='B1_EXPIRED_SKIP';else{const dr=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/booking-departures'));await page.locator('#departure').click();const result=await dr;row.departureHttpStatus=result.status();row.departure=await result.json();if(result.status()!==201||row.departure.url!==h.url)throw Error('DEPARTURE_RECEIPT_MISMATCH');for(let i=0;i<100&&!row.blocked.some(b=>b.url===h.url);i++)await new Promise(r=>setTimeout(r,20));if(!row.blocked.some(b=>b.url===h.url&&b.navigation))throw Error('POPUP_INTERCEPT_MISSING');row.departureStatus='RECORDED_AND_INTERCEPTED';await shot('08-departure');}
   }
  }else{row.firstBlock='NO_LOADABLE_COVER';row.g1Status='SKIPPED_NO_IMAGE';}
  await settlePhotoReads();summarizePhotos();
 }else{row.firstBlock=terminalBlock(view);row.g1Status='SKIPPED_NO_DELIVERY';}
 finalView=await snapshot();save(dir+'/final-view.json',finalView);
 const departures=(await c.query('SELECT id,conversation_id,candidate_id,offer_id,provider,departed_at::text FROM restaurant_booking_departures WHERE conversation_id=$1',[row.conversationId])).rows,after=(await c.query('SELECT id FROM tasks ORDER BY id')).rows.map(r=>r.id);row.sql={departures,caseIdsAfter:after,allExistingCasesPreserved:row.existingCases.every(id=>after.includes(id)),newTaskIds:after.filter(id=>!row.existingCases.includes(id))};save(dir+'/postgres-final.json',row.sql);
 if(!row.sql.allExistingCasesPreserved||row.sql.newTaskIds.length!==1||row.sql.newTaskIds[0]!==finalView.case.rootTaskId)throw Error('CASE_APPEND_ONLY_CHECK_FAILED');if(row.departureStatus==='RECORDED_AND_INTERCEPTED'&&!departures.some(d=>d.candidate_id===row.currentHandoff.candidateId&&d.offer_id===row.currentHandoff.offerId&&d.provider===row.currentHandoff.provider))throw Error('DEPARTURE_SQL_MISMATCH');
 if(fatal)throw Error(fatal);row.status=row.firstBlock?'COMPLETED_WITH_BLOCK':'COMPLETED_CONTROLLED_READ';
}catch(e){row.status='STOPPED';row.error={name:e.name,message:redact(e.message)};if(page&&!(await page.getByLabel('Access token',{exact:true}).isVisible().catch(()=>false)))await shot('failure').catch(()=>{});}
finally{
 await settlePhotoReads();try{summarizePhotos();}catch(e){row.status='STOPPED';row.error={message:redact(e.message)};}
 if(caseId&&context){try{finalView=await snapshot();save(dir+'/final-view.json',finalView);}catch{}}
 if(c&&row.conversationId){try{const rows=(await c.query('SELECT id,conversation_id,candidate_id,offer_id,provider,departed_at::text FROM restaurant_booking_departures WHERE conversation_id=$1',[row.conversationId])).rows;save(dir+'/final-departures.json',rows);}catch{}}
 if(c)await c.end().catch(()=>{});if(context)await context.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});
 if(server){if(server.exitCode===null)server.kill('SIGTERM');const exited=server.exitCode!==null?[server.exitCode,null]:await Promise.race([once(server,'close'),new Promise(r=>setTimeout(()=>r(null),10_000))]);row.serverShutdown=exited??{timeout:true};if(!exited&&server.exitCode===null){server.kill('SIGKILL');row.status='STOPPED';row.error={message:'SERVER_SHUTDOWN_TIMEOUT'};}await writeFile(dir+'/server.log',redact(serverText));}
 row.archivedArtifacts=[];if(existsSync(tmp)){await mkdir(dir+'/cli-read-artifacts',{recursive:true});for(const name of await readdir(tmp)){if(before.has(name))continue;const path=tmp+'/'+name;if(!(await stat(path)).isFile())continue;const b=await readFile(path);try{save(dir+'/cli-read-artifacts/'+name,JSON.parse(b.toString()));}catch{if(!/\.(md|txt|log)$/.test(name))throw Error('UNKNOWN_CLI_ARTIFACT_FORMAT');await writeFile(dir+'/cli-read-artifacts/'+name,redact(b.toString()));}row.archivedArtifacts.push({name,rawSHA256:createHash('sha256').update(b).digest('hex'),sanitizedSHA256:createHash('sha256').update(await readFile(dir+'/cli-read-artifacts/'+name)).digest('hex')});await unlink(path);}}
 row.wallMs=performance.now()-started;row.endedAt=new Date().toISOString();save(dir+'/run.json',row);console.log(JSON.stringify({sha,status:row.status,terminalPhase:row.terminalPhase,firstBlock:row.firstBlock,counts:row.counts,photoRequestCounts:row.photoRequestCounts,error:row.error,wallMs:row.wallMs}));
}
if(!['COMPLETED_CONTROLLED_READ','COMPLETED_WITH_BLOCK'].includes(row.status))process.exitCode=1;
