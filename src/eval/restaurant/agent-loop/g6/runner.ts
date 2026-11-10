import {readPostDeliveryWitnesses,type PostDeliveryCheck} from './post-delivery-witness.js';
import {readJSON} from "./holdout-checkpoint.js";
import {checkSavedReview} from "./holdout-review.js";
import {bindFrozenOracleSources} from "./oracle-source-binding.js";
import {browserTransportError} from "../../../../infrastructure/browser/browser-runtime-errors.js";
import {holdoutConditionMet} from "../holdout-protocol.js";
import { mkdir,writeFile,readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve,join } from "node:path";
import type { RestaurantCaseView } from "../../../../application/agent-workspace.js";
import type { ModelGateway } from "../../../../core/model/contracts.js";
import type { BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import type { LiveReadTransports } from "../../../../integrations/restaurant-search/live-read-assembly.js";
import { discoveryPackNetworkPolicy } from "../../../../integrations/restaurant-search/source-packs.js";
import { BrowserReadRecording } from "../runners/browser-read-recording.js";
import { traceBrowserRuntime,safeRecord } from "../runners/browser-case-slice-evidence.js";
import { createHybridDecisionCapture } from "../runners/run-hybrid-live-read.js";
import { createG6Session,G6_USER } from "./session.js";
import { evaluateG6,hasBoundedNoResultConclusion,type G6EvaluationInput,type G6Delivered,type G6Vacancy,type G6OraclePage } from "./evaluator.js";
import { recordingQualification,reserveObservations,type ReadStartObservation } from "./observations.js";
import { chargeG6,recordG6SourceCounts } from "./budget.js";
import { createWitnessReader,type G6Witness,type WitnessReceipt } from "./witness.js";
import { observedGoogleIdentities,observedQualificationEvidence,type ObservedGoogleIdentity } from "./qualification-evidence.js";
import { namedIdentityFromState,type G6NamedState,type G6NamedTurn,type G6AuthorityEvent } from "./named-outlet-binding.js";

export type G6Trigger="DISPLAYED_RESULTS"|"DISPLAYED_AVAILABLE"|"ASKED_FOR_DATE"|"ASKED_FOR_PARTY"|"TARGET_PRESENTED_WITH_SLOT";
export interface G6Followup {target?:{provider:"TABELOG"|"TABLECHECK";sourceEntityId:string};time?:string;id:string;trigger:G6Trigger;kind:"MESSAGE"|"PAGE_QUESTION";text:string;allowOtherOutlets?:true;}
export interface G6Case {
  id:string;request:string;followups:G6Followup[];witness?:G6Witness;
  /** Independent frozen request/source/answer annotations, never State/eligibility. */
  oracle:Pick<G6EvaluationInput,"request"|"questions"|"priceOracles"|"reviewedReadRules"|"qualificationOracles"> & {pages:Array<Omit<G6OraclePage,"runId"|"readAt">>};
}
export interface G6Pack {schemaVersion:"phase3b-g6-pack@1";mode:"FIXTURE"|"LIVE_READ";recording:{browser:true;decisions:true;googleResponses:true};cases:G6Case[];witnessGETLimit?:number;}
export interface G6RunnerDependencies {
  /** Transport construction only; product capabilities always come from session's factory. */
  transports:(spec:G6Case,recording:BrowserReadRecording,hooks:G6TransportHooks)=>Promise<Omit<LiveReadTransports,"currentTaskId"|"remainingModelCalls">>;
  witnessFetch:typeof fetch;budgetPath:string;ownCredentials?:readonly string[];
  initialWitnesses?:WitnessReceipt[];initialWitnessGETs?:number;
  beforeLive?:()=>Promise<void>;
  maximumWitnessGETs?:number;artifactTransform?:(value:unknown)=>unknown;
  /** Held-out certification is one vacancy GET with independently frozen identity. */
  witnessDetailRead?:boolean;
  now?:()=>number;wait?:(ms:number)=>Promise<void>;witnessIntervalMs?:number;
  /** Monotonic elapsed-time seam; Live always uses performance.now. */
  monotonicNow?:()=>number;
}
export interface G6TransportHooks {googleFetch:(transport:typeof fetch)=>typeof fetch;observeRequest:(request:G6EvaluationInput["requests"][number])=>void;}
async function hasTrigger(view:RestaurantCaseView,step:G6Followup,readState:()=>Promise<Record<string,unknown>>,at:number){
  const trigger=step.trigger;
  if(trigger==="TARGET_PRESENTED_WITH_SLOT")return Boolean(step.target&&holdoutConditionMet(view,{type:trigger,target:step.target,...(step.time?{time:step.time}:{})},at));
  if(trigger==="DISPLAYED_RESULTS")return Boolean(view.restaurant.presentedCandidateIds?.length);
  if(trigger==="DISPLAYED_AVAILABLE")return holdoutConditionMet(view,{type:"PRESENTED_WITH_SLOT"},at);
  const field=trigger==="ASKED_FOR_DATE"?"date":"partySize";
  if(view.case.phase!=="NEEDS_INPUT"||!view.restaurant.missingRequiredFields.includes(field))return false;
  const artifact=await readState(),state=(artifact.finalSnapshot as {domainState?:{pendingUserQuestion?:{relatedFields?:string[]}}}|undefined)?.domainState;
  return state?.pendingUserQuestion?.relatedFields?.includes(field)===true;
}
function displayed(view:RestaurantCaseView):G6Delivered[]{return (view.restaurant.presentedCandidateIds??[]).flatMap(candidateId=>{
  const c=view.restaurant.candidates.find(c=>c.restaurant.id===candidateId),offers=view.restaurant.availability[candidateId]??[];
  const identity=c?namedIdentityFromState(view.restaurant,candidateId):undefined;
  return c?offers.map(o=>{const evidence=view.restaurant.readEvidence.find(e=>e.kind==="AVAILABILITY"&&e.candidateId===candidateId&&e.provider===o.source);return {candidateId,name:c.restaurant.outletName,...(c.restaurant.address?{address:c.restaurant.address}:{}),...(c.restaurant.sourceIds.phone?{phone:c.restaurant.sourceIds.phone}:{}),...(identity?.googlePlaceId?{googlePlaceId:identity.googlePlaceId}:{}),...(identity?.sourceIds?{sourceIds:identity.sourceIds}:{}),provider:o.source,sourceEntityId:evidence?.sourceEntityId??"",date:o.dateTime.slice(0,10),time:o.dateTime.slice(11,16),partySize:o.partySize};}):[];
});}

function namedState(artifact:Record<string,unknown>):G6NamedState{
  const state=(artifact.finalSnapshot as {domainState:G6NamedState}).domainState;
  return {candidates:state.candidates.map(({restaurant:r})=>({restaurant:{id:r.id,outletName:r.outletName,sourceIds:{...r.sourceIds},address:r.address}})),
    ...(state.intentDraft?.target?{intentDraft:{target:{...(state.intentDraft.target.selectionScope?{selectionScope:state.intentDraft.target.selectionScope}:{})}}}:{}),
    readEvidence:(state.readEvidence??[]).filter(e=>e.kind==="ENTITY_MATCH").map(e=>({...(e.candidateId?{candidateId:e.candidateId}:{}),kind:e.kind,provider:e.provider,...(e.sourceEntityId?{sourceEntityId:e.sourceEntityId}:{}),...(e.entityMatch?{entityMatch:{confidence:e.entityMatch.confidence}}:{})}))};
}
function authorityEvents(artifact:Record<string,unknown>):G6AuthorityEvent[]{
  return (artifact.events as G6AuthorityEvent[]).map(({id,trace,event:e})=>({id,trace:{actor:trace.actor},event:{type:e.type,...(e.candidateId?{candidateId:e.candidateId}:{}),...(e.candidateIds?{candidateIds:[...e.candidateIds]}:{}),...(e.userBookingSelection?{userBookingSelection:{...e.userBookingSelection}}:{}),...(e.patch?.target?{patch:{target:{...(e.patch.target.selectionScope?{selectionScope:e.patch.target.selectionScope}:{})}}}:{})}}));
}
function capturedVacancies(snapshots:readonly {page:BrowserSnapshot;at:string}[],delivery:G6Delivered[]):G6Vacancy[]{return snapshots.flatMap(({page},i)=>(page.responses??[]).flatMap(r=>{
  const d=delivery.find(d=>d.provider==="TABELOG"&&r.url.includes("find_vacancy")&&new URL(r.url).searchParams.get("rst_id")===d.sourceEntityId.match(/(?:^|\/)(\d+)\/?$/u)?.[1]);
  return d?[{ref:`captured-snapshot:${i}:response:${r.sequence}`,phase:"SOURCE_CAPTURE" as const,url:r.url,candidateId:d.candidateId,body:r.body}]:[];
}));}
function oracleCandidateId(spec:G6Case,id:string,view:RestaurantCaseView){
  // Only logical witness-* aliases need resolution; concrete IDs retain their binding.
  if(id!==spec.witness?.candidateId||!id.startsWith("witness-"))return id;
  const phone=(value:string|undefined)=>value?.replace(/\D/gu,"").replace(/^81/u,"0");
  const matches=view.restaurant.candidates.filter(c=>(spec.oracle.qualificationOracles??[]).some(o=>o.name===c.restaurant.outletName&&Boolean(o.phone&&phone(o.phone)===phone(c.restaurant.sourceIds.phone)||o.address&&o.address===c.restaurant.address)));
  return matches.length===1?matches[0]!.restaurant.id:undefined;
}
function bindOraclePages(spec:G6Case,view:RestaurantCaseView,runId:string,snapshots:readonly {page:BrowserSnapshot;at:string}[]):G6OraclePage[]{
  const answer=view.restaurant.pageQuestion?.result;
  return spec.oracle.pages.flatMap(p=>{
    const candidateId=oracleCandidateId(spec,p.candidateId,view);const frame=snapshots.find(s=>s.page.url===p.url&&s.page.text.includes(p.merchantText));if(!frame||!candidateId)return [];
    const citation=answer?.status!=="UNVERIFIED"?answer?.citations.find(c=>c.url===p.url):undefined;
    return [{...p,candidateId,merchantScope:p.merchantScope??"EXCERPTS",runId,readAt:citation?.readAt??frame.at}];
  });
}

/** Serial batch. Only invocation starts Live/GET work; importing/preparing never does. */
export async function runG6Batch(pack:G6Pack,dependencies:G6RunnerDependencies,directory:string){
  if(pack.schemaVersion!=="phase3b-g6-pack@1"||!pack.recording.browser||!pack.recording.decisions||!pack.recording.googleResponses)throw Error("Frozen G6 pack must enable all three recordings");
  if(new Set(pack.cases.map(c=>c.id)).size!==pack.cases.length||pack.cases.some(c=>!/^[-\w]+$/u.test(c.id)))throw Error("Unsafe or duplicate G6 case id");
  if(pack.cases.some(c=>c.followups.length>2))throw Error("G6 slot permits at most three user turns");
  const serialize=(value:unknown)=>JSON.stringify(dependencies.artifactTransform?dependencies.artifactTransform(value):value,null,2);
  const output=resolve(directory);await mkdir(output,{recursive:true});
  if((await readJSON<{status?:string}>(join(output,"batch.json")))?.status==="FAILED_S0")throw Error("G6_S0_RESUME_FORBIDDEN");
  const policy=discoveryPackNetworkPolicy(),receipts:Array<{id:string;status:string;path:string;reason?:string;witnessPolicy?:string;certificationMode?:string;witnessExists?:boolean|null}>=[],certifications=new Map<string,WitnessReceipt>();
  for(const receipt of dependencies.initialWitnesses??[]){const w=receipt.target;if(receipt.exists===null&&!w.allowDetailOnlyCertificate)throw Error("Detail-only receipt cannot replace a required availability witness");certifications.set(JSON.stringify([w.sourceEntityId,w.date,w.time,w.partySize]),receipt);}
  let witnessGETs=dependencies.initialWitnessGETs??0;
  const beforeGET=()=>{if(witnessGETs>=(dependencies.maximumWitnessGETs??pack.witnessGETLimit??Infinity))throw Error("Frozen development witness GET ceiling reached before charging or transmission");witnessGETs++;};
  const now=dependencies.now??Date.now,monotonicNow=dependencies.monotonicNow??(()=>performance.now());let stopReason:string|undefined;const requestTiming={last:-Infinity};
  for(const [index,caseInput] of pack.cases.entries()){
    const spec=structuredClone(caseInput);
    const witnessPolicy=spec.witness?.allowKnownUnavailableCertificate===true?"ALLOW_KNOWN_UNAVAILABLE":"POSITIVE_REQUIRED";
    let certificationMode:"STANDARD_G6"|"NO_POSITIVE_WITNESS_DIAGNOSTIC"|undefined=spec.witness?undefined:"STANDARD_G6",witnessExists:boolean|null|undefined;
    const certification=()=>({witnessPolicy,...(certificationMode?{certificationMode}:{}),...(witnessExists!==undefined?{witnessExists}:{})});
    if(stopReason){receipts.push({...certification(),id:spec.id,status:"NOT_SENT",path:"",reason:stopReason});continue;}
    const slot=join(output,spec.id);
    const inputHash=createHash('sha256').update(JSON.stringify(caseInput)).digest('hex'),binding=await readJSON<{sha256:string}>(join(slot,'case-input.json'));
    const saved=await readJSON<import('./evaluator.js').G6Evaluation>(join(slot,'evaluation.json'));
    if(saved){
      if(!binding||binding.sha256!==inputHash)throw Error('G6_RESUME_CASE_INPUT_MISMATCH');
      if(saved.verdict.s0)throw Error('G6_S0_RESUME_FORBIDDEN');
      const review=await readJSON<import('./holdout-checkpoint.js').HoldoutAttempt>(join(output,spec.id+'-review-receipt.json'));
      const supplemented=review?await checkSavedReview(review):undefined,effective=supplemented??saved;
      if(effective.verdict.s0)throw Error('G6_S0_RESUME_FORBIDDEN');
      const status=supplemented&&effective.verdict.status==='EVALUATED'&&!effective.verdict.stopBatch?'EVALUATED_BY_REVIEW':effective.verdict.stopBatch?'STOPPED':effective.verdict.status==='PENDING_REVIEW'?'PENDING_REVIEW':effective.verdict.status==='NOT_EVALUATED'?'RECORDED_NOT_EVALUATED':'EVALUATED';
      receipts.push({id:spec.id,status,path:slot});if(effective.verdict.stopBatch)stopReason='INDEPENDENT_EVIDENCE_REVIEW_REQUIRED';continue;
    }
    if(binding)throw Error('G6_CHARGED_ATTEMPT_NEEDS_REVIEW');
    await mkdir(slot,{recursive:false});await writeFile(join(slot,'case-input.json'),JSON.stringify({sha256:inputHash})+'\n',{flag:'wx'});
    const runId=`g6-${spec.id}-${now()}-${index}`;
    const recording=new BrowserReadRecording({directory:join(slot,"recordings"),runId,reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources,ownCredentials:dependencies.ownCredentials??[],...(dependencies.artifactTransform?{artifactTransform:dependencies.artifactTransform}:{})});
    const capture=createHybridDecisionCapture(join(slot,"execution.result.json"),recording,dependencies.artifactTransform);
    let googleCalls=0,modelCalls=0;const identities:ObservedGoogleIdentity[]=[];
    const turnBudgets:Array<{id:string;startedAtMs:number;deadlineAtMs:number;elapsedMs:number;modelCalls:number;googleRequests:number;exceeded500Seconds:boolean}>=[];
    let activeBudget:typeof turnBudgets[number]|undefined,turnWallStart=0,turnFinished=true;
    const googleFetch=(transport:typeof fetch)=>recording.captureGoogleFetch(async(url,init)=>{
      if(!activeBudget||turnFinished||activeBudget.googleRequests>=40||googleCalls>=120)throw Error("G6 turn/slot Google request ceiling reached before transmission");
      if(monotonicNow()-turnWallStart>=500_000)throw Error("G6 user-turn deadline reached before Google transmission");
      activeBudget.googleRequests++;const sequence=++googleCalls,response=await transport(url,init);
      try{
        const text=await response.clone().text();
        if(!(dependencies.ownCredentials??[]).some(k=>k&&text.includes(k)))identities.push(...observedGoogleIdentities(text,`google-response:${sequence}`));
      }catch{/* A missing independent identity is not replaced by the product's match verdict. */}
      return response;
    });
    const forwarded:G6EvaluationInput["requests"]=[];
    const raw=await dependencies.transports(spec,recording,{googleFetch,observeRequest:r=>forwarded.push(r)}),snapshots:Array<{page:BrowserSnapshot;at:string}>=[],trace:Array<{sequence:number;at:string;kind:string;detail:unknown}>=[];
    const clock=raw.clock,traceEvent=(kind:string,detail:unknown)=>{
      const fields=detail&&typeof detail==="object"&&!Array.isArray(detail)?detail as Record<string,unknown>:{};
      const timingOnly=Object.fromEntries(["method","operationId","outcome"].filter(k=>typeof fields[k]==="string"||typeof fields[k]==="number").map(k=>[k,fields[k]]));
      const timeline=/^(?:NETWORK_REQUEST_|NETWORK_RESPONSE_HEADERS|NAVIGATION_|GUARD_TRANSPORT_|GUARD_ROUTE_BLOCK|REQUEST_TIMELINE_)/u.test(kind);
      trace.push({sequence:trace.length+1,at:clock.now().toISOString(),kind,detail:timeline||kind==="NATIVE_GET_FORM"?safeRecord(fields):timingOnly});recording.record(kind,detail);return trace.length;
    };
    let operationSequence=0;
    const timed=async<T>(method:string,read:()=>Promise<T>):Promise<T>=>{
      const operationId=++operationSequence;traceEvent("OPERATION_STARTED",{operationId,method});let completed=false;
      try{const value=await read();completed=true;return value;}
      finally{traceEvent("OPERATION_FINISHED",{operationId,method,outcome:completed?"COMPLETED":"FAILED"});}
    };
    const sink={...capture.snapshotSink,recordSnapshot:(page:BrowserSnapshot,sanitized:unknown)=>{snapshots.push({page:structuredClone(page),at:clock.now().toISOString()});capture.snapshotSink.recordSnapshot?.(page,sanitized);}};
    const browserDiagnostics:Array<Record<string,unknown>>=[];
    let session:Awaited<ReturnType<typeof createG6Session>>|undefined,view:RestaurantCaseView|undefined;
    let postDeliveryChecks:PostDeliveryCheck[]=[];
    let activeTurn="INITIAL",activeTurnId="INITIAL";const semanticAttempts=new Map<string,number>();const readStarts:ReadStartObservation[]=[];
    const start=(kind:ReadStartObservation["kind"],purpose:string)=>{
      const task=session?.budget.currentTaskId(),usage=task?session?.budget.usage(task):undefined;
      const deadline=activeBudget?.deadlineAtMs??Infinity;
      readStarts.push({kind,purpose,turnId:activeTurnId,atMs:clock.now().valueOf(),deadlineAtMs:Math.min(deadline,usage?.deadlineAt??deadline)});
    };
    const model:ModelGateway={complete:request=>{
      if(request.purpose==="restaurant_semantic_interpret")semanticAttempts.set(activeTurnId,(semanticAttempts.get(activeTurnId)??0)+1);
      start(request.purpose==="restaurant_agent_decide"?"CONCLUSION_MODEL":request.purpose==="restaurant_page_question"&&activeTurn==="FOLLOWUP_MESSAGE"?"TERMS_MODEL":"READ",request.purpose);
      return capture.complete(request,()=>raw.model.complete(request));
    }};
    const observedBrowser={...(raw.browser.readNetworkBoundaryCapability?{readNetworkBoundaryCapability:raw.browser.readNetworkBoundaryCapability}:{}),async openSession(input:Parameters<typeof raw.browser.openSession>[0]){
      start(activeTurn==="FOLLOWUP_MESSAGE"?"TERMS_READ":"READ","OPEN_SESSION");const original=await timed("openSession",()=>raw.browser.openSession(input));
      return new Proxy(original,{get(target,key){const value=Reflect.get(target,key,target);if(typeof value!=="function")return value;
        return (...args:unknown[])=>{if(["navigate","openLink","fill","select","click","snapshot"].includes(String(key)))start(activeTurn==="FOLLOWUP_MESSAGE"?"TERMS_READ":"READ",String(key));
          return ["navigate","openLink","fill","select","click","snapshot","observeControls","waitForSettled","captureResponses","screenshotLayoutOnly","close"].includes(String(key))
            ?timed(String(key),()=>value.apply(target,args)):value.apply(target,args);};}});
    }};
    const browser=traceBrowserRuntime(observedBrowser,"TABLECHECK",traceEvent,sink,{remainingBudgetMs:()=>{
      const task=session?.budget.currentTaskId(),usage=task?session?.budget.usage(task):undefined;
      const deadline=Math.min(activeBudget?.deadlineAtMs??Infinity,usage?.deadlineAt??Infinity);
      return Number.isFinite(deadline)?Math.max(0,deadline-clock.now().valueOf()):undefined;
    }});
    const witness=createWitnessReader({directory:join(slot,"witness"),budgetPath:dependencies.budgetPath,runId,fetch:dependencies.witnessFetch,now,requestTiming,beforeGET,...(dependencies.wait?{wait:dependencies.wait}:{}),...(dependencies.witnessIntervalMs!==undefined?{minIntervalMs:dependencies.witnessIntervalMs}:{})});
    const witnesses:WitnessReceipt[]=[],turns:Array<{id:string;status:string;reason?:string}>=[];let failure:string|undefined,wallStart=monotonicNow(),elapsedMs=0;
    const userTurns:Array<{id:string;message:string;view:RestaurantCaseView}>=[],namedReferences:G6NamedTurn[]=[];
    let lastArtifact:Record<string,unknown>|undefined;
    const rememberTurn=async(id:string,message:string,allowOtherOutlets?:true)=>{
      const artifact=await session!.application.exportReadArtifact(view!.case.caseId),prior=lastArtifact?authorityEvents(lastArtifact):[],seen=new Set(prior.map(e=>e.id));
      namedReferences.push({turnId:id,userMessage:message,before:lastArtifact?namedState(lastArtifact):{candidates:[]},after:namedState(artifact),events:authorityEvents(artifact).filter(e=>!seen.has(e.id)),...(allowOtherOutlets?{alternativeConsent:{quote:message}}:{})});
      lastArtifact=artifact;userTurns.push({id,message,view:structuredClone(view!)});
    };
    let deadlineTimer:ReturnType<typeof setTimeout>|undefined;
    const beginTurn=(id:string)=>{
      if(turnBudgets.length>=3)throw Error("G6 slot user-turn ceiling reached");
      if(deadlineTimer)clearTimeout(deadlineTimer);
      activeTurnId=id;turnWallStart=monotonicNow();turnFinished=false;
      const startedAtMs=clock.now().valueOf();activeBudget={id,startedAtMs,deadlineAtMs:startedAtMs+500_000,elapsedMs:0,modelCalls:0,googleRequests:0,exceeded500Seconds:false};turnBudgets.push(activeBudget);
      deadlineTimer=setTimeout(()=>{void session?.application.stopActiveReads();},500_000);
    };
    const endTurn=()=>{
      if(activeBudget&&!turnFinished){activeBudget.elapsedMs=monotonicNow()-turnWallStart;activeBudget.exceeded500Seconds=activeBudget.elapsedMs>500_000;turnFinished=true;}
      if(deadlineTimer){clearTimeout(deadlineTimer);deadlineTimer=undefined;}
    };
    // One projection for success and failure: partial failures retain every
    // claim observed by this outer runner, including price/soft assertions.
    const evaluationInput=():G6EvaluationInput=>{
      if(!view)return {runId,caseId:spec.id,mode:pack.mode,artifactRefs:[join(slot,"failure.json")],request:{...spec.oracle.request},
        delivered:[],handoffs:[],answers:[],pages:[],vacancy:[],requests:forwarded,...(spec.oracle.reviewedReadRules?{reviewedReadRules:spec.oracle.reviewedReadRules}:{})};
      const deliveries=displayed(view);
      const question=view.restaurant.pageQuestion?.result;
      const qualification=observedQualificationEvidence(view,runId,snapshots,identities);
      const input:G6EvaluationInput={runId,caseId:view.case.caseId,mode:pack.mode,artifactRefs:[join(slot,"execution.result.json")],request:{...spec.oracle.request},namedReferences:{initial:spec.oracle.request.named??null,turns:namedReferences},
        delivered:deliveries,handoffs:view.restaurant.bookingHandoffs??[],answers:question?[{...question,citations:question.status==="UNVERIFIED"?[]:question.citations}]:[],pages:[...bindOraclePages(spec,view,runId,snapshots),...qualification.pages],qualificationClaims:qualification.claims,vacancy:[...capturedVacancies(snapshots,deliveries),...witnesses.flatMap(w=>w.vacancy?[w.vacancy]:[])],
        requests:forwarded,
        postDeliveryChecks,
        ...(spec.oracle.questions?{questions:spec.oracle.questions.flatMap(q=>{const candidateId=oracleCandidateId(spec,q.candidateId,view!);return candidateId?[{...q,candidateId}]:[];})}:{}),...(spec.oracle.qualificationOracles?{qualificationOracles:spec.oracle.qualificationOracles}:{}),...(spec.oracle.priceOracles?{priceOracles:spec.oracle.priceOracles}:{}),
        ...(spec.oracle.reviewedReadRules?{reviewedReadRules:spec.oracle.reviewedReadRules}:{}),
        ...(spec.witness&&witnesses[0]?.exists===true?{witnesses:[spec.witness]}:{}),boundedNoResult:hasBoundedNoResultConclusion(view.conversation.messages.filter(m=>m.role==="ASSISTANT").at(-1)?.content??""),
        deadline:{elapsedMs,turns:turnBudgets,readStartsInReserve:readStarts.filter(r=>r.kind!=="CONCLUSION_MODEL"&&r.atMs>=r.deadlineAtMs-20_000).length,termsStartsInReserve:readStarts.filter(r=>(r.kind==="TERMS_READ"||r.kind==="TERMS_MODEL")&&r.atMs>=r.deadlineAtMs-20_000).length}};
      const presentedConditions=Object.entries(view.restaurant.conditionStates??{}).filter(([id])=>deliveries.some(d=>d.candidateId===id));
      input.priceClaims=presentedConditions.flatMap(([candidateId,conditions])=>conditions.filter(c=>c.strength==="HARD"&&(c.sources.some(s=>s.field==="PRICE")||/yen|jpy|円|¥|budget|price/iu.test(c.text))).map(c=>({candidateId,hardStatus:c.status,
        quoteRefs:(spec.oracle.priceOracles??[]).filter(o=>o.candidateId===candidateId&&c.sources.some(s=>s.quote===o.quote)).map(o=>o.ref)})));
      input.softClaims=presentedConditions.flatMap(([candidateId,conditions])=>conditions.filter(c=>c.strength==="SOFT").map(c=>({candidateId,state:c.status,citations:c.sources.flatMap(s=>{
        const evidence=view!.restaurant.readEvidence.find(e=>c.evidenceIds.includes(e.evidenceId)&&e.sourceUrl===s.sourceUrl);
        return evidence?[{text:s.quote,url:s.sourceUrl,readAt:evidence.observedAt}]:[];
      })})));
      return input;
    };
    try{
      if(spec.witness){
        const w=spec.witness,key=JSON.stringify([w.sourceEntityId,w.date,w.time,w.partySize]),cached=certifications.get(key);
        const before=cached&&now()-Date.parse(cached.checkedAt)<86_400_000?cached:await witness.read(w,"BEFORE",dependencies.witnessDetailRead??true);
        witnessExists=before.exists;
        certificationMode=before.exists===false&&w.allowKnownUnavailableCertificate===true?"NO_POSITIVE_WITNESS_DIAGNOSTIC":"STANDARD_G6";
        witnesses.push(before);if(before.exists===null&&!w.allowDetailOnlyCertificate)throw Error("Availability certification is required for this witness");if(before.exists===false&&w.allowKnownUnavailableCertificate!==true)throw Error("WITNESS_NO_LONGER_EXISTS: no Live was started");certifications.set(key,before);
      }
      wallStart=monotonicNow();
      if(pack.mode==="LIVE_READ"){await dependencies.beforeLive?.();await chargeG6(dependencies.budgetPath,runId+":LIVE","fullLive","Frozen G6 serial slot; browser, decisions and Google recording on");}
      const boundedModel:ModelGateway={async complete(request){
        if(!activeBudget||turnFinished||activeBudget.modelCalls>=50||modelCalls>=150)throw Error("G6 turn/slot model ceiling reached before transmission");
        if(monotonicNow()-turnWallStart>=500_000)throw Error("G6 user-turn deadline reached before model transmission");
        activeBudget.modelCalls++;modelCalls++;
        if(pack.mode==="LIVE_READ")await chargeG6(dependencies.budgetPath,runId+":MODEL:"+modelCalls,"realModelCalls",request.purpose,pack.witnessGETLimit!==undefined);
        return model.complete(request);
      }};
      session=await createG6Session({...raw,model:boundedModel,browser,onBrowserDiagnostic:diagnostic=>{
        const {source,stage,event,elapsedMs,lifecycle,candidateId,url,detail}=diagnostic;
        browserDiagnostics.push({sequence:browserDiagnostics.length+1,at:clock.now().toISOString(),source,stage,event,elapsedMs,lifecycle,
          ...(candidateId?{candidateId}:{}),...(url?{page:safeRecord({url})}:{}),
          ...(detail&&/^[A-Z_]+$/u.test(detail)?{operation:detail}:{})});
        raw.onBrowserDiagnostic?.(diagnostic);
      }});beginTurn("INITIAL");
      view=await session.create(spec.request);endTurn();await rememberTurn("INITIAL",spec.request);
      for(const step of spec.followups){
        if(!await hasTrigger(view,step,()=>session!.application.exportReadArtifact(view!.case.caseId),clock.now().valueOf())){turns.push({id:step.id,status:"NOT_SENT",reason:"AUTHORITATIVE_STATE_TRIGGER_NOT_MET"});continue;}
        const current=view;
        activeTurn=step.kind==="PAGE_QUESTION"?"FOLLOWUP_QUESTION":"FOLLOWUP_MESSAGE";
        if(step.kind==="PAGE_QUESTION"){
          const id=current.restaurant.presentedCandidateIds?.[0];if(!id){turns.push({id:step.id,status:"NOT_SENT",reason:"NO_DISPLAYED_OUTLET"});continue;}
          beginTurn(step.id);
          await session.finished(()=>session!.application.askRestaurantQuestion({userId:G6_USER,caseId:current.case.caseId,candidateId:id,question:step.text,requestId:step.id,expectedVersion:current.case.taskVersion}));
        }else {beginTurn(step.id);await session.finished(()=>session!.application.submitMessage({userId:G6_USER,conversationId:current.case.conversationId,message:step.text,requestId:step.id,expectedVersion:current.case.taskVersion,
          ...(current.restaurant.presentedCandidateIds?.[0]?{viewContext:{view:"DETAILS" as const,candidateId:current.restaurant.presentedCandidateIds[0],comparedCandidateIds:[]}}:{})}));
        }
        view=await session.view(current.case.caseId);endTurn();turns.push({id:step.id,status:"SENT"});await rememberTurn(step.id,step.text,step.allowOtherOutlets);
      }
      elapsedMs=monotonicNow()-wallStart;if(deadlineTimer){clearTimeout(deadlineTimer);deadlineTimer=undefined;}
      const deliveries=displayed(view);
      // Each delivered Tabelog store is checked immediately and independently;
      // this precedes evaluation and the next slot, never opens the B1 link.
      postDeliveryChecks=await readPostDeliveryWitnesses(deliveries,async d=>{
        const page=view!.restaurant.readEvidence.find(e=>e.kind==="AVAILABILITY"&&e.candidateId===d.candidateId&&e.provider==="TABELOG")?.sourceUrl;
        if(!page)throw Error("No public source detail URL for independent delivered-store check");
        const receipt=await witness.read({...d,detailUrl:page,identityText:[d.name,...(d.address?[d.address]:[])]},"AFTER",false);
        witnesses.push(receipt);return receipt;
      });
      if(!deliveries.length&&spec.witness)witnesses.push(witnesses[0]?.exists===null?await witness.readDetail(spec.witness,"NO_DELIVERY_AFTER"):await witness.read(spec.witness,"NO_DELIVERY_AFTER",dependencies.witnessDetailRead??true));
      const result=lastArtifact!;
      const input=evaluationInput();
      if(input.qualificationOracles)await bindFrozenOracleSources(input.qualificationOracles);
      const evaluation=evaluateG6(input),{named:_named,...request}=input.request;
      input.request={...request,...(evaluation.namedOutletBinding.named?{named:evaluation.namedOutletBinding.named}:{})};
      await writeFile(join(slot,"execution.result.json"),serialize({schemaVersion:"phase3b-g6-run@1",mode:pack.mode,...certification(),runId,view,execution:result,turns,witnesses,postDeliveryChecks,recordingConfig:pack.recording})+"\n",{flag:"wx"});
      await writeFile(join(slot,"boundary-observation.json"),JSON.stringify({...reserveObservations(0,elapsedMs,readStarts,input.requests.map(r=>({...r,forbidden:/yoyaku|payment|checkout|confirmation/iu.test(new URL(r.url).pathname)}))),exceeded500Seconds:turnBudgets.some(t=>t.exceeded500Seconds),limits:{perTurn:{milliseconds:500_000,models:50,google:40},slot:{turns:3,models:150,google:120}},turnBudgets,googleRequests:googleCalls,modelCalls,semanticAttemptsByTurn:Object.fromEntries(semanticAttempts),semanticSchemaRetries:[...semanticAttempts.values()].reduce((n,c)=>n+Math.max(0,c-1),0)},null,2)+"\n",{flag:"wx"});
      await writeFile(join(slot,"evaluation.input.json"),serialize(input)+"\n",{flag:"wx"});await writeFile(join(slot,"evaluation.json"),serialize(evaluation)+"\n",{flag:"wx"});
      receipts.push({...certification(),id:spec.id,status:evaluation.verdict.stopBatch?"STOPPED":evaluation.verdict.status==="PENDING_REVIEW"?"PENDING_REVIEW":evaluation.verdict.status==="NOT_EVALUATED"?"RECORDED_NOT_EVALUATED":"EVALUATED",path:slot});if(evaluation.verdict.stopBatch)stopReason=evaluation.verdict.s0?"S0_STOP":"INDEPENDENT_EVIDENCE_REVIEW_REQUIRED";
    }catch(error){failure=error instanceof Error?error.message:"G6_RUN_FAILED";stopReason=failure;receipts.push({...certification(),id:spec.id,status:"FAILED",path:slot,reason:failure});
      endTurn();
      elapsedMs=monotonicNow()-wallStart;
      await writeFile(join(slot,"failure.evaluation.input.json"),serialize(evaluationInput())+"\n",{flag:"wx"});
      await writeFile(join(slot,"failure.json"),serialize({...certification(),failure,transportError:browserTransportError(error),turns,turnBudgets,witnesses,...(view?{view}:{}),...(view&&session?{execution:await session.application.exportReadArtifact(view.case.caseId)}:{})})+"\n",{flag:"wx"});
    }finally{
      if(deadlineTimer)clearTimeout(deadlineTimer);await session?.close();
      await writeFile(join(slot,"outer-requests.json"),serialize({runId,complete:true,requests:forwarded})+"\n",{flag:"wx"});
      await writeFile(join(slot,"user-turns.json"),serialize({schemaVersion:"phase3b-g6-user-turns@2",runId,turns:userTurns,budgets:turnBudgets,namedReferences:{initial:spec.oracle.request.named??null,turns:namedReferences}})+"\n",{flag:"wx"});
      if(pack.mode==="LIVE_READ")await recordG6SourceCounts(dependencies.budgetPath,runId+":SOURCE_IO",googleCalls,forwarded.length);const decisions=await capture.finish(failure),recorded=await recording.finish();
      await writeFile(join(slot,"browser-diagnostics.json"),JSON.stringify({schemaVersion:"phase3b-g6-browser-diagnostics@1",runId,events:browserDiagnostics},null,2)+"\n",{flag:"wx"});
      await writeFile(join(slot,"browser-trace.json"),JSON.stringify({schemaVersion:"phase3b-g6-browser-trace@1",runId,events:trace},null,2)+"\n",{flag:"wx"});
      await writeFile(join(slot,"recording-observation.json"),JSON.stringify({recordingConfig:pack.recording,decisions,...recordingQualification(recorded)},null,2)+"\n",{flag:"wx"});
    }
    await writeFile(join(output,"batch.json"),serialize({schemaVersion:"phase3b-g6-batch@1",serial:true,witnessGETs,pendingReviewCount:receipts.filter(r=>r.status==="PENDING_REVIEW").length,passRateReportable:!stopReason&&receipts.every(r=>["EVALUATED","EVALUATED_BY_REVIEW"].includes(r.status)),...(stopReason==="S0_STOP"?{status:"FAILED_S0"}:{}),stopReason:stopReason??null,slots:receipts})+"\n");
  }
  const result={schemaVersion:"phase3b-g6-batch@1",serial:true,witnessGETs,pendingReviewCount:receipts.filter(r=>r.status==="PENDING_REVIEW").length,passRateReportable:!stopReason&&receipts.every(r=>["EVALUATED","EVALUATED_BY_REVIEW"].includes(r.status)),...(stopReason==="S0_STOP"?{status:"FAILED_S0"}:{}),stopReason:stopReason??null,slots:receipts};await writeFile(join(output,"batch.json"),serialize(result)+"\n");return result;
}

export async function loadG6Pack(path:string,sha256:string):Promise<G6Pack>{
  const raw=await readFile(path);if(createHash("sha256").update(raw).digest("hex")!==sha256)throw Error("Frozen G6 pack SHA mismatch; no execution");
  const pack=JSON.parse(raw.toString()) as G6Pack;if(pack.schemaVersion!=="phase3b-g6-pack@1"||!["FIXTURE","LIVE_READ"].includes(pack.mode)||!pack.recording?.browser||!pack.recording.decisions||!pack.recording.googleResponses||!Array.isArray(pack.cases)||!pack.cases.length||pack.cases.length>26)throw Error("Unsupported or incomplete frozen G6 pack");
  for(const c of pack.cases)if(!c.id||!c.request?.trim()||!Array.isArray(c.followups)||c.followups.length>2||!Array.isArray(c.oracle?.pages)||!Array.isArray(c.oracle.request?.dates)||c.followups.some(f=>!["DISPLAYED_RESULTS","DISPLAYED_AVAILABLE","ASKED_FOR_DATE","ASKED_FOR_PARTY","TARGET_PRESENTED_WITH_SLOT"].includes(f.trigger)||!["MESSAGE","PAGE_QUESTION"].includes(f.kind)||!f.text?.trim()||f.allowOtherOutlets!==undefined&&f.allowOtherOutlets!==true))throw Error("Invalid frozen G6 case");
  for(const c of pack.cases)for(const f of c.followups)if(f.trigger==="TARGET_PRESENTED_WITH_SLOT"&&(!f.target||!["TABLECHECK","TABELOG"].includes(f.target.provider)||!f.target.sourceEntityId||f.time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/u.test(f.time)))throw Error("Invalid structured target trigger");
  if(pack.cases.some(c=>c.witness?.allowKnownUnavailableCertificate!==undefined&&c.witness.allowKnownUnavailableCertificate!==true))throw Error("Unavailable-witness admission must be explicit diagnostic true");
  return pack;
}
