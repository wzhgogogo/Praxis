import { isDeepStrictEqual } from "node:util";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import type { RestaurantBookingTermsRead } from "../../application/restaurant-booking-handoff.js";
import { bookingHandoffCandidateIds, bookingHandoffPageMatches, prepareBookingHandoff, type BookingHandoffSource, type BookingHandoffTerms, type PreparedBookingHandoff } from "../../domains/restaurant/booking-handoff.js";
import { completeRestaurantIntent, completeRestaurantSearchIntent } from "../../domains/restaurant/intent-state.js";
import type { RestaurantPageAnswer, RestaurantPageQuestionRequest } from "../../domains/restaurant/page-question.js";
import type { RestaurantFactPageObservation } from "./fact-source-document.js";
import type { RestaurantPageQuestionReader } from "./page-question-reader.js";
import { RESTAURANT_READ_CONCLUSION_RESERVE_MS } from "../../domains/restaurant/read-time-reserve.js";
import {namedOutletCandidateResolved} from "../../domains/restaurant/named-outlet-resolution.js";

type Topic="cancellation"|"card";
type Answer={answer:RestaurantPageAnswer;pages:RestaurantFactPageObservation[]};
interface CachedTerms {
  touchedAt:number; attempted:boolean; blocked:boolean; lastQuestion?:string;
  cancellation?:Answer; card?:Answer;
  conflict?:{japanese:Answer;english:Answer};
}
const cancellationQuestion="What is this restaurant's cancellation policy? Give one short English sentence, preserve all stated conditions and cite the original text. If Japanese and English policies differ, cite both and report the conflict without deciding which is stricter.";
const cardQuestion="Does this restaurant require a credit card for this booking? If the page states it, answer exactly one of: Card required; No card needed; May require a card. Cite the original statement and preserve any conditions in the quotations. Card payment acceptance alone does not answer whether a booking requires a card. If not stated, return NOT_STATED.";
const requirements={"Card required":"REQUIRED","No card needed":"NOT_REQUIRED","May require a card":"MAY_REQUIRE"} as const;

/** A conservative reuse selector, not a source-text/card-policy classifier. */
function topic(question:string):Topic|undefined {
  const cancellation=/\bcancell?ation\b|\bcancel(?:ling|ing|led|ed)?\b|キャンセル|取消/iu.test(question);
  const card=/\b(?:credit\s+)?card\b|クレジットカード/iu.test(question);
  return cancellation && !card ? "cancellation" : card && !cancellation ? "card" : undefined;
}
function language(page:RestaurantFactPageObservation):"japanese"|"english" {
  return new URL(page.snapshot.url).pathname.startsWith("/en/")?"english":"japanese";
}

/** B1 orchestration over the EXISTING G1 reader; no new page parser or transport. */
export class RestaurantBookingTerms implements RestaurantBookingTermsRead {
  private readonly cache=new Map<string,CachedTerms>();
  constructor(private readonly questions:RestaurantPageQuestionReader,
    private readonly readLinks:(view:RestaurantCaseView)=>PreparedBookingHandoff[],
    private readonly taskId:()=>string|undefined,
    private readonly remaining:(id:string)=>number|undefined,
    private readonly now:()=>string,
    private readonly retentionMs:number) {}

  private key(view:RestaurantCaseView,source:BookingHandoffSource):string {
    return JSON.stringify([view.case.rootTaskId,view.restaurant.sourceReadContext?.runId,source.candidateId,source.provider,source.sourceEntityId]);
  }
  private entry(view:RestaurantCaseView,source:BookingHandoffSource):CachedTerms {
    const cutoff=Date.parse(this.now())-this.retentionMs;
    for(const [key,item] of this.cache)if(item.touchedAt<cutoff)this.cache.delete(key);
    const key=this.key(view,source);
    let value=this.cache.get(key);
    if(!value){value={touchedAt:Date.parse(this.now()),attempted:false,blocked:false};this.cache.set(key,value);}
    return value;
  }
  private pages(view:RestaurantCaseView,source:BookingHandoffSource):RestaurantFactPageObservation[] {
    const context=view.restaurant.sourceReadContext;
    return context?this.questions.currentPages(context,source.candidateId).filter(page=>bookingHandoffPageMatches(source,page.snapshot.url)):[];
  }
  private current(value:Answer|undefined,view:RestaurantCaseView,source:BookingHandoffSource):value is Answer {
    if(!value)return false;
    const pages=this.pages(view,source);
    return value.pages.length>0 && value.pages.every(page=>pages.some(current=>isDeepStrictEqual(current,page)))
      && value.answer.checkedPages.every(checked=>value.pages.some(page=>checked.url===page.snapshot.url&&checked.readAt===page.observedAt));
  }
  private acceptQuestion(view:RestaurantCaseView,source:BookingHandoffSource,entry:CachedTerms):void {
    const q=view.restaurant.pageQuestion,context=view.restaurant.sourceReadContext;
    if(!q?.result || !context || q.candidateId!==source.candidateId || entry.lastQuestion===q.requestId)return;
    const kind=topic(q.question),saved=this.questions.admittedQuestion(q,context);
    if(!kind || !saved || !saved.pages.length || !saved.pages.every(page=>bookingHandoffPageMatches(source,page.snapshot.url)))return;
    entry[kind]={answer:saved.answer,pages:saved.pages};entry.lastQuestion=q.requestId;entry.blocked=false;
  }
  private terms(view:RestaurantCaseView,source:BookingHandoffSource,entry:CachedTerms):BookingHandoffTerms|undefined {
    if(entry.blocked||view.restaurant.progress.stopped)return undefined;
    const all:RestaurantFactPageObservation[]=[];
    const result:BookingHandoffTerms={pages:[]};
    if(this.current(entry.conflict?.japanese,view,source)&&this.current(entry.conflict?.english,view,source)){
      result.cancellationConflict={japanese:entry.conflict.japanese.answer,english:entry.conflict.english.answer};
      all.push(...entry.conflict.japanese.pages,...entry.conflict.english.pages);
    }else if(this.current(entry.cancellation,view,source)&&entry.cancellation.answer.status==="ANSWERED"
      && !entry.cancellation.answer.confirmationRequired){
      result.cancellation=entry.cancellation.answer;all.push(...entry.cancellation.pages);
    }
    if(this.current(entry.card,view,source)&&entry.card.answer.status==="ANSWERED"){
      const requirement=requirements[entry.card.answer.answer as keyof typeof requirements];
      if(requirement){result.card={requirement,answer:entry.card.answer};all.push(...entry.card.pages);}
    }
    result.pages=[...new Map(all.map(page=>[page.snapshot.url,page])).values()].map(page=>({candidateId:source.candidateId,
      provider:source.provider,sourceEntityId:source.sourceEntityId,identityEvidenceId:page.identity.evidenceId,
      url:page.snapshot.url,readAt:page.observedAt,text:page.snapshot.text,identity:structuredClone(page.identity),
      readRunId:page.readRunId!,expiresAt:new Date(Date.parse(page.observedAt)+this.retentionMs).toISOString()}));
    return result.pages.length?result:undefined;
  }
  private context(view:RestaurantCaseView,source:BookingHandoffSource){
    const request=completeRestaurantIntent(view.restaurant.intentDraft);
    const candidate=view.restaurant.candidates.find(item=>item.restaurant.id===source.candidateId);
    const offer=view.restaurant.availability[source.candidateId]?.find(item=>item.id===source.offerId);
    const check=view.restaurant.availabilityChecks[source.candidateId];
    if(!request||!candidate||!offer||!check||!namedOutletCandidateResolved(view.restaurant,source.candidateId))return undefined;
    return {candidate,offer,check,request,
      evidence:view.restaurant.readEvidence,now:this.now(),...(view.restaurant.sourceReadContext?{readContext:view.restaurant.sourceReadContext}:{})};
  }
  /** Cache-only, including reuse of the actual accepted G1 result. */
  readPrepared=(view:RestaurantCaseView):PreparedBookingHandoff[]=>this.readLinks(view).map(prepared=>{
    const context=this.context(view,prepared.source);
    if(!context||!view.restaurant.sourceReadContext)return prepared;
    const entry=this.entry(view,prepared.source);this.acceptQuestion(view,prepared.source,entry);
    const terms=this.terms(view,prepared.source,entry);
    return terms?prepareBookingHandoff({...prepared.source,terms},context)??prepared:prepared;
  });

  async readBookingTerms(view:RestaurantCaseView,deadlineAt:string,parent:AbortSignal):Promise<void>{
    const selected=view.restaurant.selectedCandidateId,context=view.restaurant.sourceReadContext;
    if(!selected||!context||view.case.phase!=="PRESENT_RESULTS"
      ||!bookingHandoffCandidateIds(view.case.phase,view.restaurant.presentedCandidateIds,view.restaurant.readyCandidateIds).includes(selected)
      ||!namedOutletCandidateResolved(view.restaurant,selected)
      ||view.restaurant.intentDraft?.target?.selectionScope!=="SPECIFIC_OUTLET")return;
    const prepared=this.readLinks(view).find(item=>item.source.candidateId===selected);
    if(!prepared)return;
    const source=prepared.source,entry=this.entry(view,source);this.acceptQuestion(view,source,entry);
    if(entry.attempted)return;
    entry.attempted=true;
    const readDeadline=Date.parse(deadlineAt)-RESTAURANT_READ_CONCLUSION_RESERVE_MS;
    const available=()=>this.taskId()===view.case.rootTaskId && (this.remaining(view.case.rootTaskId)??0)>0
      && Date.parse(this.now())<readDeadline;
    const controller=new AbortController();
    const signal=AbortSignal.any([parent,controller.signal]);
    const timer=setTimeout(()=>controller.abort(Object.assign(new Error("B1 terms reached the conclusion reserve"),{code:"DELIVERY_RESERVE_REACHED"})),Math.max(0,readDeadline-Date.parse(this.now())));
    try{
      if(signal.aborted||!available())throw new Error("No remaining enclosing read budget");
      const authoritative=this.context(view,source),intent=completeRestaurantSearchIntent(view.restaurant.intentDraft);
      const bound=view.restaurant.readEvidence.find(item=>item.evidenceId===source.availabilityEvidenceId);
      if(!authoritative||!intent||!bound?.sourceUrl||!bookingHandoffPageMatches(source,bound.sourceUrl))return;
      const candidate=structuredClone(authoritative.candidate);
      // Route the existing fact reader to the observed channel only. Identity
      // still comes from that reader; the availability URL is not a proof.
      candidate.restaurant.sourceIds=source.provider==="TABELOG"
        ? {tabelog:source.sourceEntityId,tabelogNativeDetailUri:bound.sourceUrl}
        : {tablecheck:source.sourceEntityId,tablecheckNativeGuideUri:bound.sourceUrl};
      const input:RestaurantPageQuestionRequest={requestId:"b1-terms",question:cancellationQuestion,candidate,intent,
        readContext:{...context,deadlineAt:new Date(readDeadline).toISOString()}};
      let pages=this.pages(view,source);
      if(!pages.length){await this.questions.captureBookingPages(input,signal);pages=this.pages(view,source);}
      if(!pages.length)return;
      const ask=async(question:string,documents=pages):Promise<Answer>=>{
        if(!available())throw new Error("No remaining enclosing read budget");
        signal.throwIfAborted();
        const answer=await this.questions.answerBookingQuestion({...input,question},documents,signal);
        signal.throwIfAborted();
        if(Date.parse(this.now())>=readDeadline || answer.status==="UNVERIFIED"&&answer.reason==="BUDGET_EXHAUSTED")throw new Error("B1 terms read budget exhausted");
        return {answer,pages:structuredClone(documents)};
      };
      if(!this.current(entry.cancellation,view,source))entry.cancellation=await ask(cancellationQuestion);
      const cancel=entry.cancellation.answer;
      if(cancel.status==="ANSWERED"&&cancel.confirmationRequired&&cancel.sensitiveCategory==="NONE"){
        const cited=pages.filter(page=>cancel.citations.some(c=>c.url===page.snapshot.url&&c.readAt===page.observedAt));
        const japanese=cited.filter(p=>language(p)==="japanese"),english=cited.filter(p=>language(p)==="english");
        if(japanese.length&&english.length){
          const ja=await ask(cancellationQuestion,japanese),en=await ask(cancellationQuestion,english);
          if(ja.answer.status==="ANSWERED"&&en.answer.status==="ANSWERED")entry.conflict={japanese:ja,english:en};
        }
      }
      if(!this.current(entry.card,view,source))entry.card=await ask(cardQuestion);
      signal.throwIfAborted();
      if(Date.parse(this.now())>=readDeadline)throw new Error("B1 terms reached the conclusion reserve");
    }catch{entry.blocked=true;}finally{clearTimeout(timer);}
  }
}
