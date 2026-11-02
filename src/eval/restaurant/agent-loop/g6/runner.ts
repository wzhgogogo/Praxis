import { mkdir,writeFile,readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve,join } from "node:path";
import type { RestaurantCaseView } from "../../../../application/agent-workspace.js";
import type { ModelGateway } from "../../../../core/model/contracts.js";
import type { BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import type { LiveReadTransports } from "../../../../integrations/restaurant-search/live-read-assembly.js";
import { discoveryPackNetworkPolicy } from "../../../../integrations/restaurant-search/source-packs.js";
import { BrowserReadRecording } from "../runners/browser-read-recording.js";
import { traceBrowserRuntime } from "../runners/browser-case-slice-evidence.js";
import { createHybridDecisionCapture } from "../runners/run-hybrid-live-read.js";
import { createG6Session,G6_USER } from "./session.js";
import { evaluateG6,hasBoundedNoResultConclusion,type G6EvaluationInput,type G6Delivered,type G6Vacancy,type G6OraclePage } from "./evaluator.js";
import { recordingQualification,reserveObservations,type ReadStartObservation } from "./observations.js";
import { chargeG6,recordG6SourceCounts } from "./budget.js";
import { createWitnessReader,type G6Witness,type WitnessReceipt } from "./witness.js";

export type G6Trigger="DISPLAYED_RESULTS"|"DISPLAYED_AVAILABLE"|"ASKED_FOR_DATE"|"ASKED_FOR_PARTY";
export interface G6Followup {id:string;trigger:G6Trigger;kind:"MESSAGE"|"PAGE_QUESTION";text:string;}
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
  now?:()=>number;wait?:(ms:number)=>Promise<void>;witnessIntervalMs?:number;
}
export interface G6TransportHooks {googleFetch:(transport:typeof fetch)=>typeof fetch;observeRequest:(request:G6EvaluationInput["requests"][number])=>void;}
async function hasTrigger(view:RestaurantCaseView,trigger:G6Trigger,readState:()=>Promise<Record<string,unknown>>){
  if(trigger==="DISPLAYED_RESULTS")return Boolean(view.restaurant.presentedCandidateIds?.length);
  if(trigger==="DISPLAYED_AVAILABLE")return (view.restaurant.presentedCandidateIds??[]).some(id=>view.restaurant.availabilityChecks[id]?.status==="AVAILABLE");
  const field=trigger==="ASKED_FOR_DATE"?"date":"partySize";
  if(view.case.phase!=="NEEDS_INPUT"||!view.restaurant.missingRequiredFields.includes(field))return false;
  const artifact=await readState(),state=(artifact.finalSnapshot as {domainState?:{pendingUserQuestion?:{relatedFields?:string[]}}}|undefined)?.domainState;
  return state?.pendingUserQuestion?.relatedFields?.includes(field)===true;
}
function displayed(view:RestaurantCaseView):G6Delivered[]{return (view.restaurant.presentedCandidateIds??[]).flatMap(candidateId=>{
  const c=view.restaurant.candidates.find(c=>c.restaurant.id===candidateId),offers=view.restaurant.availability[candidateId]??[];
  return c?offers.map(o=>{const evidence=view.restaurant.readEvidence.find(e=>e.kind==="AVAILABILITY"&&e.candidateId===candidateId&&e.provider===o.source);return {candidateId,name:c.restaurant.outletName,...(c.restaurant.address?{address:c.restaurant.address}:{}),...(c.restaurant.sourceIds.phone?{phone:c.restaurant.sourceIds.phone}:{}),provider:o.source,sourceEntityId:evidence?.sourceEntityId??"",date:o.dateTime.slice(0,10),time:o.dateTime.slice(11,16),partySize:o.partySize};}):[];
});}
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
  const output=resolve(directory);await mkdir(output,{recursive:true});
  const policy=discoveryPackNetworkPolicy(),receipts:Array<{id:string;status:string;path:string;reason?:string}>=[],certifications=new Map<string,WitnessReceipt>();
  for(const receipt of dependencies.initialWitnesses??[]){const w=receipt.target;if(receipt.exists===null&&!w.allowDetailOnlyCertificate)throw Error("Detail-only receipt cannot replace a required availability witness");certifications.set(JSON.stringify([w.sourceEntityId,w.date,w.time,w.partySize]),receipt);}
  let witnessGETs=dependencies.initialWitnessGETs??0;
  const beforeGET=()=>{if(witnessGETs>=(pack.witnessGETLimit??Infinity))throw Error("Frozen development witness GET ceiling reached before charging or transmission");witnessGETs++;};
  const now=dependencies.now??Date.now;let stopReason:string|undefined;const requestTiming={last:-Infinity};
  for(const [index,spec] of pack.cases.entries()){
    if(stopReason){receipts.push({id:spec.id,status:"NOT_SENT",path:"",reason:stopReason});continue;}
    const slot=join(output,spec.id);await mkdir(slot,{recursive:false});const runId=`g6-${spec.id}-${now()}-${index}`;
    const recording=new BrowserReadRecording({directory:join(slot,"recordings"),runId,reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources,ownCredentials:dependencies.ownCredentials??[]});
    const capture=createHybridDecisionCapture(join(slot,"execution.result.json"),recording);
    let googleCalls=0;
    const googleFetch=(transport:typeof fetch)=>recording.captureGoogleFetch(async(url,init)=>{if(++googleCalls>40)throw Error("G6 slot Google request ceiling reached before transmission");return transport(url,init);});
    const forwarded:G6EvaluationInput["requests"]=[];
    const raw=await dependencies.transports(spec,recording,{googleFetch,observeRequest:r=>forwarded.push(r)}),snapshots:Array<{page:BrowserSnapshot;at:string}>=[],trace:Array<{sequence:number;at:string;kind:string;detail:unknown}>=[];
    const clock=raw.clock,traceEvent=(kind:string,detail:unknown)=>{
      const fields=detail&&typeof detail==="object"&&!Array.isArray(detail)?detail as Record<string,unknown>:{};
      const timingOnly=Object.fromEntries(["method","operationId","outcome"].filter(k=>typeof fields[k]==="string"||typeof fields[k]==="number").map(k=>[k,fields[k]]));
      trace.push({sequence:trace.length+1,at:clock.now().toISOString(),kind,detail:timingOnly});recording.record(kind,detail);return trace.length;
    };
    let operationSequence=0;
    const timed=async<T>(method:string,read:()=>Promise<T>):Promise<T>=>{
      const operationId=++operationSequence;traceEvent("OPERATION_STARTED",{operationId,method});let completed=false;
      try{const value=await read();completed=true;return value;}
      finally{traceEvent("OPERATION_FINISHED",{operationId,method,outcome:completed?"COMPLETED":"FAILED"});}
    };
    const sink={...capture.snapshotSink,recordSnapshot:(page:BrowserSnapshot,sanitized:unknown)=>{snapshots.push({page:structuredClone(page),at:clock.now().toISOString()});capture.snapshotSink.recordSnapshot?.(page,sanitized);}};
    let session:Awaited<ReturnType<typeof createG6Session>>|undefined,view:RestaurantCaseView|undefined;
    let activeTurn="INITIAL",activeTurnId="INITIAL",episodeDeadline=Infinity;const semanticAttempts=new Map<string,number>();const readStarts:ReadStartObservation[]=[];
    const start=(kind:ReadStartObservation["kind"],purpose:string)=>{
      const task=session?.budget.currentTaskId(),usage=task?session?.budget.usage(task):undefined;
      readStarts.push({kind,purpose,atMs:clock.now().valueOf(),deadlineAtMs:Math.min(episodeDeadline,usage?.deadlineAt??episodeDeadline)});
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
    const browser=traceBrowserRuntime(observedBrowser,"TABLECHECK",traceEvent,sink);
    const witness=createWitnessReader({directory:join(slot,"witness"),budgetPath:dependencies.budgetPath,runId,fetch:dependencies.witnessFetch,now,requestTiming,beforeGET,...(dependencies.wait?{wait:dependencies.wait}:{}),...(dependencies.witnessIntervalMs!==undefined?{minIntervalMs:dependencies.witnessIntervalMs}:{})});
    const witnesses:WitnessReceipt[]=[],turns:Array<{id:string;status:string;reason?:string}>=[];let failure:string|undefined,wallStart=performance.now(),elapsedMs=0;
    let deadlineTimer:ReturnType<typeof setTimeout>|undefined;
    try{
      if(spec.witness){
        const w=spec.witness,key=JSON.stringify([w.sourceEntityId,w.date,w.time,w.partySize]),cached=certifications.get(key);
        const before=cached&&now()-Date.parse(cached.checkedAt)<86_400_000?cached:await witness.read(w,"BEFORE",true);
        witnesses.push(before);if(before.exists===null&&!w.allowDetailOnlyCertificate)throw Error("Availability certification is required for this witness");if(before.exists===false)throw Error("WITNESS_NO_LONGER_EXISTS: no Live was started");certifications.set(key,before);
      }
      wallStart=performance.now();episodeDeadline=clock.now().valueOf()+500_000;
      if(pack.mode==="LIVE_READ")await chargeG6(dependencies.budgetPath,runId+":LIVE","fullLive","Frozen G6 serial slot; browser, decisions and Google recording on");
      let modelCalls=0;
      const boundedModel:ModelGateway={async complete(request){if(++modelCalls>50)throw Error("G6 slot model ceiling reached");
        if(performance.now()-wallStart>=500_000)throw Error("G6 slot deadline reached before model transmission");
        if(pack.mode==="LIVE_READ")await chargeG6(dependencies.budgetPath,runId+":MODEL:"+modelCalls,"realModelCalls",request.purpose);
        return model.complete(request);
      }};
      session=await createG6Session({...raw,model:boundedModel,browser,episode:{deadlineAtMs:episodeDeadline,remainingModelCalls:()=>Math.max(0,50-modelCalls)}});
      deadlineTimer=setTimeout(()=>{void session?.application.stopActiveReads();},Math.max(1,500_000-(performance.now()-wallStart)));
      view=await session.create(spec.request);
      for(const step of spec.followups){
        if(!await hasTrigger(view,step.trigger,()=>session!.application.exportReadArtifact(view!.case.caseId))){turns.push({id:step.id,status:"NOT_SENT",reason:"AUTHORITATIVE_STATE_TRIGGER_NOT_MET"});continue;}
        if(performance.now()-wallStart>=480_000){turns.push({id:step.id,status:"NOT_SENT",reason:"SLOT_CONCLUSION_RESERVE"});continue;}
        const current=view;
        activeTurnId=step.id;activeTurn=step.kind==="PAGE_QUESTION"?"FOLLOWUP_QUESTION":"FOLLOWUP_MESSAGE";
        if(step.kind==="PAGE_QUESTION"){
          const id=current.restaurant.presentedCandidateIds?.[0];if(!id){turns.push({id:step.id,status:"NOT_SENT",reason:"NO_DISPLAYED_OUTLET"});continue;}
          await session.finished(()=>session!.application.askRestaurantQuestion({userId:G6_USER,caseId:current.case.caseId,candidateId:id,question:step.text,requestId:step.id,expectedVersion:current.case.taskVersion}));
        }else await session.finished(()=>session!.application.submitMessage({userId:G6_USER,conversationId:current.case.conversationId,message:step.text,requestId:step.id,expectedVersion:current.case.taskVersion,
          ...(current.restaurant.presentedCandidateIds?.[0]?{viewContext:{view:"DETAILS" as const,candidateId:current.restaurant.presentedCandidateIds[0],comparedCandidateIds:[]}}:{})}));
        view=await session.view(current.case.caseId);turns.push({id:step.id,status:"SENT"});
      }
      elapsedMs=performance.now()-wallStart;if(deadlineTimer){clearTimeout(deadlineTimer);deadlineTimer=undefined;}
      const deliveries=displayed(view);
      // Each delivered Tabelog store is checked immediately and independently;
      // this precedes evaluation and the next slot, never opens the B1 link.
      for(const d of deliveries.filter(d=>d.provider==="TABELOG")){
        const page=view.restaurant.readEvidence.find(e=>e.kind==="AVAILABILITY"&&e.candidateId===d.candidateId&&e.provider==="TABELOG")?.sourceUrl;
        if(!page)throw Error("No public source detail URL for independent delivered-store check");
        witnesses.push(await witness.read({...d,detailUrl:page,identityText:[d.name,...(d.address?[d.address]:[])]},"AFTER",false));
      }
      if(!deliveries.length&&spec.witness)witnesses.push(witnesses[0]?.exists===null?await witness.readDetail(spec.witness,"NO_DELIVERY_AFTER"):await witness.read(spec.witness,"NO_DELIVERY_AFTER",true));
      const result=await session.application.exportReadArtifact(view.case.caseId);
      const question=view.restaurant.pageQuestion?.result;
      const input:G6EvaluationInput={runId,caseId:view.case.caseId,mode:pack.mode,artifactRefs:[join(slot,"execution.result.json")],request:spec.oracle.request,
        delivered:deliveries,handoffs:view.restaurant.bookingHandoffs??[],answers:question?[{...question,citations:question.status==="UNVERIFIED"?[]:question.citations}]:[],pages:bindOraclePages(spec,view,runId,snapshots),vacancy:[...capturedVacancies(snapshots,deliveries),...witnesses.flatMap(w=>w.vacancy?[w.vacancy]:[])],
        requests:forwarded,
        ...(spec.oracle.questions?{questions:spec.oracle.questions.flatMap(q=>{const candidateId=oracleCandidateId(spec,q.candidateId,view!);return candidateId?[{...q,candidateId}]:[];})}:{}),...(spec.oracle.qualificationOracles?{qualificationOracles:spec.oracle.qualificationOracles}:{}),...(spec.oracle.priceOracles?{priceOracles:spec.oracle.priceOracles}:{}),
        ...(spec.oracle.reviewedReadRules?{reviewedReadRules:spec.oracle.reviewedReadRules}:{}),
        ...(spec.witness&&witnesses[0]?.exists===true?{witnesses:[spec.witness]}:{}),boundedNoResult:hasBoundedNoResultConclusion(view.conversation.messages.filter(m=>m.role==="ASSISTANT").at(-1)?.content??""),
        deadline:{elapsedMs,readStartsInReserve:readStarts.filter(r=>r.kind!=="CONCLUSION_MODEL"&&r.atMs>=r.deadlineAtMs-20_000).length,termsStartsInReserve:readStarts.filter(r=>(r.kind==="TERMS_READ"||r.kind==="TERMS_MODEL")&&r.atMs>=r.deadlineAtMs-20_000).length}};
      const presentedConditions=Object.entries(view.restaurant.conditionStates??{}).filter(([id])=>deliveries.some(d=>d.candidateId===id));
      input.priceClaims=presentedConditions.flatMap(([candidateId,conditions])=>conditions.filter(c=>c.strength==="HARD"&&(c.sources.some(s=>s.field==="PRICE")||/yen|jpy|円|¥|budget|price/iu.test(c.text))).map(c=>({candidateId,hardStatus:c.status,
        quoteRefs:(spec.oracle.priceOracles??[]).filter(o=>o.candidateId===candidateId&&c.sources.some(s=>s.quote===o.quote)).map(o=>o.ref)})));
      input.softClaims=presentedConditions.flatMap(([candidateId,conditions])=>conditions.filter(c=>c.strength==="SOFT").map(c=>({candidateId,state:c.status,citations:c.sources.flatMap(s=>{
        const evidence=view!.restaurant.readEvidence.find(e=>c.evidenceIds.includes(e.evidenceId)&&e.sourceUrl===s.sourceUrl);
        return evidence?[{text:s.quote,url:s.sourceUrl,readAt:evidence.observedAt}]:[];
      })})));
      const evaluation=evaluateG6(input);await writeFile(join(slot,"execution.result.json"),JSON.stringify({schemaVersion:"phase3b-g6-run@1",mode:pack.mode,runId,view,execution:result,turns,witnesses,recordingConfig:pack.recording},null,2)+"\n",{flag:"wx"});
      await writeFile(join(slot,"boundary-observation.json"),JSON.stringify({...reserveObservations(0,elapsedMs,readStarts,input.requests.map(r=>({...r,forbidden:/yoyaku|payment|checkout|confirmation/iu.test(new URL(r.url).pathname)}))),googleRequests:googleCalls,modelCalls,semanticAttemptsByTurn:Object.fromEntries(semanticAttempts),semanticSchemaRetries:[...semanticAttempts.values()].reduce((n,c)=>n+Math.max(0,c-1),0)},null,2)+"\n",{flag:"wx"});
      await writeFile(join(slot,"evaluation.input.json"),JSON.stringify(input,null,2)+"\n",{flag:"wx"});await writeFile(join(slot,"evaluation.json"),JSON.stringify(evaluation,null,2)+"\n",{flag:"wx"});
      receipts.push({id:spec.id,status:evaluation.verdict.stopBatch?"STOPPED":"EVALUATED",path:slot});if(evaluation.verdict.stopBatch)stopReason=evaluation.verdict.s0?"S0_STOP":"INDEPENDENT_EVIDENCE_REVIEW_REQUIRED";
    }catch(error){failure=error instanceof Error?error.message:"G6_RUN_FAILED";stopReason=failure;receipts.push({id:spec.id,status:"FAILED",path:slot,reason:failure});
      await writeFile(join(slot,"failure.json"),JSON.stringify({failure,turns,witnesses,...(view?{view}:{}),...(view&&session?{execution:await session.application.exportReadArtifact(view.case.caseId)}:{})},null,2)+"\n",{flag:"wx"});
    }finally{
      if(deadlineTimer)clearTimeout(deadlineTimer);await session?.close();if(pack.mode==="LIVE_READ")await recordG6SourceCounts(dependencies.budgetPath,runId+":SOURCE_IO",googleCalls,forwarded.length);const decisions=await capture.finish(failure),recorded=await recording.finish();
      await writeFile(join(slot,"browser-trace.json"),JSON.stringify({schemaVersion:"phase3b-g6-browser-trace@1",runId,events:trace},null,2)+"\n",{flag:"wx"});
      await writeFile(join(slot,"recording-observation.json"),JSON.stringify({recordingConfig:pack.recording,decisions,...recordingQualification(recorded)},null,2)+"\n",{flag:"wx"});
    }
    await writeFile(join(output,"batch.json"),JSON.stringify({schemaVersion:"phase3b-g6-batch@1",serial:true,witnessGETs,stopReason:stopReason??null,slots:receipts},null,2)+"\n");
  }
  const result={schemaVersion:"phase3b-g6-batch@1",serial:true,witnessGETs,stopReason:stopReason??null,slots:receipts};await writeFile(join(output,"batch.json"),JSON.stringify(result,null,2)+"\n");return result;
}

export async function loadG6Pack(path:string,sha256:string):Promise<G6Pack>{
  const raw=await readFile(path);if(createHash("sha256").update(raw).digest("hex")!==sha256)throw Error("Frozen G6 pack SHA mismatch; no execution");
  const pack=JSON.parse(raw.toString()) as G6Pack;if(pack.schemaVersion!=="phase3b-g6-pack@1"||!["FIXTURE","LIVE_READ"].includes(pack.mode)||!pack.recording?.browser||!pack.recording.decisions||!pack.recording.googleResponses||!Array.isArray(pack.cases)||!pack.cases.length||pack.cases.length>26)throw Error("Unsupported or incomplete frozen G6 pack");
  for(const c of pack.cases)if(!c.id||!c.request?.trim()||!Array.isArray(c.followups)||!Array.isArray(c.oracle?.pages)||!Array.isArray(c.oracle.request?.dates)||c.followups.some(f=>!["DISPLAYED_RESULTS","DISPLAYED_AVAILABLE","ASKED_FOR_DATE","ASKED_FOR_PARTY"].includes(f.trigger)||!["MESSAGE","PAGE_QUESTION"].includes(f.kind)||!f.text?.trim()))throw Error("Invalid frozen G6 case");
  return pack;
}
