import type {RestaurantCandidate} from '../../../domains/restaurant/contracts.js';
import {BrowserTaskExecutor,type BrowserExecutionDiagnostic} from '../../../infrastructure/browser/browser-task-executor.js';
import {BrowserReadDecisionError,type BrowserReadActionDecisionPort} from '../../../infrastructure/browser/browser-action-decision.js';
import type {BrowserRuntime,BrowserSnapshot,BrowserReadNetworkPolicy} from '../../../infrastructure/browser/browser-runtime.js';
import {TabelogBrowserAvailability} from '../../../integrations/tabelog/tabelog-browser-availability.js';
import {TableCheckBrowserAvailability} from '../../../integrations/tablecheck/tablecheck-browser-availability.js';
import {benchmarkOutlet,type NameResolutionPlatform,type NameResolutionSubject,type NameResolutionObservation} from './name-resolution-benchmark.js';

export interface NameResolutionLiveAdmission {
 sampleSha256:string;
 approval:{sampleSha256:string;reviewer:string;approved:boolean};
 preflight:{tablecheckStatus:number;tabelogStatus:number;tabelogBusy:boolean};
}
export function assertNameResolutionLiveAdmission(input:NameResolutionLiveAdmission){
 if(!input.approval.approved||!input.approval.reviewer||input.approval.sampleSha256!==input.sampleSha256)throw Error('Sample approval missing or SHA mismatch');
 if(input.preflight.tablecheckStatus!==200||(input.preflight.tabelogStatus<200||input.preflight.tabelogStatus>=300)||input.preflight.tabelogBusy)throw Error('Sources not ready');
}
type Ports={runtime:BrowserRuntime;decision?:BrowserReadActionDecisionPort;signal:AbortSignal;networkPolicy?:BrowserReadNetworkPolicy}
 &({mode:'OFFLINE_FIXTURE'}|{mode:'LIVE';admission:NameResolutionLiveAdmission});
/** Existing production search/identity prefix; the outer boundary stops inventory work. */
export async function runNameResolutionMethodA(id:string,platform:NameResolutionPlatform,subject:NameResolutionSubject,ports:Ports){
 if(ports.mode==='LIVE')assertNameResolutionLiveAdmission(ports.admission);
 const started=Date.now(),pages:BrowserSnapshot[]=[],diagnostics:unknown[]=[],trace:BrowserExecutionDiagnostic[]=[];
 let identityStop=false,formStop=false;
 const noForm=(url:string)=>{if(/\/(?:reserve|booking|checkout|payment|cancel)(?:\/|[?#]|$)/i.test(new URL(url).pathname)){formStop=true;throw Error('BENCHMARK_FORM_BOUNDARY');}};
 const runtime:BrowserRuntime={...(ports.runtime.readNetworkBoundaryCapability?{readNetworkBoundaryCapability:ports.runtime.readNetworkBoundaryCapability}:{}),openSession:async input=>{
  const session=await ports.runtime.openSession(input);
  return new Proxy(session,{get(target,key){
   if(key==='snapshot')return async()=>{const page=await target.snapshot();pages.push(structuredClone(page));return page;};
   if(key==='navigate'||key==='prepareNavigation'||key==='prepareObservedNavigation'){
    const original=target[key];return original?async(url:string,options?:never)=>{noForm(url);await original.call(target,url,options);}:undefined;
   }
   if(key==='openLink'&&target.openLink)return async(ref:string,href?:string,options?:never)=>{if(!href)throw Error('Unbound public link');noForm(href);await target.openLink!(ref,href,options);};
   const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
  }});
 }};
 const executor=new BrowserTaskExecutor(runtime,{maxAutomaticElapsedMs:300_000,maxOperationsPerCandidate:24,maxModelCallsPerCandidate:3,maxModelCallsTotal:3,
  ...(ports.decision?{modelDecision:{decide:async input=>{
   // Required adapter DTO placeholders have no benchmark meaning and must
   // never appear in the model's identity-only task or legal field actions.
   const {date:_date,partySize:_party,timeWindow:_time,...goal}=input.goal;
   const action=await ports.decision!.decide({...input,goal,observation:{...input.observation,targets:input.observation.targets.map(t=>({...t,availableActions:(t.availableActions??[]).filter(a=>!/(?:DATE|PARTY_SIZE|TIME)$/.test(a))}))}});
   if('field' in action&&['DATE','PARTY_SIZE','TIME'].includes(action.field))throw new BrowserReadDecisionError('INVALID_MODEL_OUTPUT','Name benchmark prohibits request-control actions');
   return action;
  },...(ports.decision.takeLastWireRecord?{takeLastWireRecord:()=>ports.decision!.takeLastWireRecord!()}:{} )}}:{}),
  onDiagnostic:diagnostic=>{trace.push(structuredClone(diagnostic));if(diagnostic.stage==='AVAILABILITY'&&diagnostic.event==='OPERATION_STARTED'){identityStop=true;throw Error('BENCHMARK_IDENTITY_COMPLETE');}},
 });
 const candidate:RestaurantCandidate={restaurant:{id:'name-benchmark:'+id,outletName:subject.name,address:subject.address,coordinates:{lat:subject.coordinates.lat,lng:subject.coordinates.lng},sourceIds:{phone:subject.phone},provenance:{outletName:'benchmark-input',address:'benchmark-input',sourceIds:'benchmark-input'}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
 const options={...(ports.networkPolicy?{networkPolicy:ports.networkPolicy}:{}),onIdentityDiagnostic:(d:unknown)=>diagnostics.push(structuredClone(d))};
 const provider=platform==='TABELOG'?new TabelogBrowserAvailability(executor,undefined,5,options):new TableCheckBrowserAvailability(executor,undefined,options);
 // Adapter DTO fields are unreachable after the identity stop and are hidden
 // from the decision. No requested availability is being evaluated here.
 let read:Awaited<ReturnType<typeof provider.check>>|undefined,error:string|undefined;
 try{read=await provider.check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:'1970-01-01',partySize:1,timeWindow:{earliest:'00:00',latest:'00:00'},hardCriteria:[]},ports.signal);}
 catch(e){error=e instanceof Error?e.message:'Unknown resolution failure';}
 finally{await executor.close();}
 const entity=read?.evidence.find(e=>e.kind==='ENTITY_MATCH'&&e.entityMatch?.confidence==='HIGH');
 const returned=entity?.sourceUrl?benchmarkOutlet(entity.sourceUrl):undefined;
 const raw=entity?.sourceUrl?pages.findLast(page=>page.url===entity.sourceUrl||returned&&benchmarkOutlet(page.url)?.platform===returned.platform&&benchmarkOutlet(page.url)?.outletId===returned.outletId):undefined;
 const sourceUrls=diagnostics.flatMap(d=>{const x=d as {searchResults?:Array<{sourceUrl:string}>;discovery?:{discoveredOutletUrls:string[]}};return [...(x.searchResults??[]).map(o=>o.sourceUrl),...(x.discovery?.discoveredOutletUrls??[])];});
 const urls=[...new Set([...pages.map(page=>page.url),...sourceUrls].filter(url=>benchmarkOutlet(url)?.platform===platform))];
 const traceFailure=trace.findLast(d=>d.lifecycle.failureCode)?.lifecycle.failureCode;
 const busy=pages.some(p=>/現在アクセスが集中しています|現在アクセスが集中し、ページが表示されにくい状態/.test(p.title+' '+p.text));
 const lastDiagnostic=diagnostics.at(-1) as {resolution?:{reason?:string};search?:{parsedResultCount:number};discovery?:{status:string}}|undefined;
 const searchCompleted=(lastDiagnostic?.search?.parsedResultCount??0)>0||['RESULTS','NO_RESULT'].includes(lastDiagnostic?.discovery?.status??'')||pages.some(p=>/no results|no restaurants found|0 results/i.test(p.text));
 const result:NameResolutionObservation={sampleId:id,method:'A',platform,accepted:!!entity,identityRecorded:diagnostics.length>0,observedOutletUrls:urls,
  searchCompleted:searchCompleted&&!busy,elapsedMs:Date.now()-started,modelCalls:trace.filter(d=>d.event==='MODEL_DECISION_STARTED').length,
  ...(entity?.sourceUrl?{returnedUrl:entity.sourceUrl}:{}),...(raw?{rawSelectedPageUrl:raw.url}:{}),
  ...(!entity?{failure:busy?'SOURCE_BUSY':formStop?'BENCHMARK_FORM_BOUNDARY':traceFailure??error??lastDiagnostic?.resolution?.reason??read?.metadata.failureCode??'IDENTITY_NOT_ACCEPTED'}:{})};
 return {observation:result,pages,diagnostics,trace,boundary:{identityStop,formStop,availabilityEvaluated:false},
  methodB:{status:'NOT_ENABLED',reason:'Conditional on A evidence and separate frozen autonomous-query implementation; no B calls in this batch'}};
}
