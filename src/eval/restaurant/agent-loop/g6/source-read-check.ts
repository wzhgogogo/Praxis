import {setTimeout as wait} from 'node:timers/promises';
import {normalizedTextKey} from '../../../../core/text-key.js';
import type {BrowserRuntime,BrowserReadNetworkPolicy,BrowserSnapshot} from '../../../../infrastructure/browser/browser-runtime.js';
import {isBrowserReadPathProhibited} from '../../../../infrastructure/browser/browser-read-policy.js';

export interface G6SourceReadSpec {startUrl:string;query:string;minimumIntervalMs:number;}
/** One authorized source diagnostic inside the Live runner, without model/Google/Live work.
 * The runner supplies its actual browser factory/policy, recording, catalog terminal and charging hooks. */
export async function runG6SourceReadCheck(input:{browser:BrowserRuntime;policy:BrowserReadNetworkPolicy;spec:G6SourceReadSpec;
 signal:AbortSignal;beforeEntry:()=>Promise<void>;catalogTerminal:Promise<boolean>;phase:(value:string)=>void;
 record:(kind:string,detail:unknown)=>void;}){
 const {browser,policy,spec,signal}=input;
 const session=await browser.openSession({signal,networkPolicy:policy});let phase='ENTRY';
 const setPhase=(next:string)=>{phase=next;input.phase(next);};
 const violations=(snapshot:BrowserSnapshot,from:number)=>(snapshot.networkRequests??[]).slice(from).flatMap(r=>{
  const rule=policy.dynamicReads.find(rule=>rule.queryValueClasses&&rule.origin===r.origin&&rule.pathname===r.pathname&&rule.queryKeys?.length===r.queryKeys.length&&rule.queryKeys.every(key=>r.queryKeys.includes(key)));
  if(!rule?.queryValueClasses)return [];
  return (r.queryValues??[]).filter(f=>rule.queryValueClasses![f.queryKey]&&!rule.queryValueClasses![f.queryKey]!.includes(f.valueClass==='PAGE_OBSERVED_VALUE'?'OTHER':f.valueClass)).map(f=>({method:r.method,outcome:r.outcome,...f}));
 });
 try{
  session.beginReadScope?.();await input.beforeEntry();setPhase('ENTRY');
  await session.prepareNavigation!(spec.startUrl,{timeoutMs:20000});await session.navigate(spec.startUrl,{waitUntil:'domcontentloaded',timeoutMs:20000});
  let timer:ReturnType<typeof setTimeout>|undefined;
  const catalogOK=await Promise.race([input.catalogTerminal,new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),5000);})]).finally(()=>{if(timer)clearTimeout(timer);});
  if(!catalogOK)return {status:'STOP_CATALOG_NOT_200',phase,catalog200:false};
  let snapshot=await session.snapshot(),controls=await session.observeControls!();
  const destination=controls.filter(c=>c.visible&&!c.disabled&&c.kind==='BUTTON'&&/\bDestination\b/i.test(c.label)&&c.formMethod!=='POST');
  if(destination.length!==1)return {status:'STOP_DESTINATION_CONTROL',phase,catalog200:true};
  setPhase('OPEN_DESTINATION');await session.click!(destination[0]!.id,{timeoutMs:5000});snapshot=await session.snapshot();controls=await session.observeControls!();
  const fields=controls.filter(c=>c.visible&&!c.disabled&&!c.readOnly&&c.kind==='INPUT'&&/\bDestination\b/i.test(c.label)&&c.formMethod!=='POST');
  if(fields.length!==1)return {status:'STOP_DESTINATION_INPUT',phase,catalog200:true};
  const boundary=(snapshot.networkRequests??[]).length;
  setPhase('FILL_FULL_NAME');await session.fill!(fields[0]!.id,spec.query,{timeoutMs:5000,inputSource:'SPECIFIC_OUTLET'});
  await wait(spec.minimumIntervalMs,undefined,{signal});await session.waitForSettled?.(snapshot,5000);snapshot=await session.snapshot();controls=await session.observeControls!();
  const rejected=violations(snapshot,boundary);
  const options=controls.filter(c=>c.visible&&!c.disabled&&c.kind!=='INPUT'&&c.formMethod!=='POST'&&normalizedTextKey(c.label).includes(normalizedTextKey(spec.query))&&(!c.href||!isBrowserReadPathProhibited(policy,c.href)));
  input.record('OBSERVED_QUERY_OPTIONS',{options:options.map(c=>({id:c.id,label:c.label,kind:c.kind,href:c.href??null})),violations:rejected});
  if(rejected.length)return {status:'STOP_VALUE_REVIEW',phase,catalog200:true,violations:rejected,options:options.length};
  if(options.length!==1)return {status:'STOP_NO_UNIQUE_SUGGESTION',phase,catalog200:true,options:options.length};
  setPhase('SELECT_MATCH');const selected=options[0]!;
  if(selected.kind==='LINK'&&selected.href){await session.prepareObservedNavigation!(selected.href,{timeoutMs:20000});await session.openLink!(selected.id,selected.href,{timeoutMs:20000});}
  else await session.click!(selected.id,{timeoutMs:5000});
  await wait(spec.minimumIntervalMs,undefined,{signal});await session.waitForSettled?.(snapshot,5000);snapshot=await session.snapshot();await session.observeControls!();
  const later=violations(snapshot,boundary);
  return {status:later.length?'STOP_VALUE_REVIEW':'SELECTED_RESULT_OBSERVED',phase,catalog200:true,violations:later,currentQueryKeys:[...new URL(snapshot.url).searchParams.keys()]};
 }catch(error){return {status:'STOP_OPERATION_FAILURE',phase,error:{name:error instanceof Error?error.name:'Error',message:error instanceof Error?error.message:'Unknown'}};}
 finally{await session.flushRecordedResponses?.();await session.close();}
}
