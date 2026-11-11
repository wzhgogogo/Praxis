import type { BrowserExecutionBudget } from "../../infrastructure/browser/browser-task-executor.js";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantPageAnswer, RestaurantPageQuestionPort, RestaurantPageQuestionRequest } from "../../domains/restaurant/page-question.js";
import type { RestaurantFactPageObservation, RestaurantFactPageObserver } from "./fact-source-document.js";
import { ModelRestaurantPageQuestion } from "./model-page-question.js";
import { RunBoundedModelGateway } from "../../application/run-bounded-model-gateway.js";
import { RESTAURANT_PAGE_QUESTION_BUDGET, type RestaurantPageQuestionLimits } from "../../domains/restaurant/page-question-limits.js";
import type { QuestionPageVisits } from "./page-question-read-budget.js";
import { isDeepStrictEqual } from "node:util";
import { isRestaurantFactPageBound } from "./fact-page-binding.js";
import type { RestaurantPageQuestionState } from "../../domains/restaurant/page-question.js";

/** Fact and availability readers supply already HIGH-bound, observed pages. */
export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  readonly facts: RestaurantCandidateFactPort;
  private readonly questionModel: RunBoundedModelGateway;
  private readonly observe: RestaurantFactPageObserver;
  private readonly pages = new Map<string, RestaurantFactPageObservation>();
  private readonly answered = new Map<string, {input:RestaurantPageQuestionRequest; answer:RestaurantPageAnswer; pages:RestaurantFactPageObservation[]}>();

  constructor(
    private readonly model: ModelGateway,
    private readonly createFacts: (observe: RestaurantFactPageObserver, budget?: BrowserExecutionBudget, model?: ModelGateway, visits?: QuestionPageVisits, beforeRead?:()=>void) => RestaurantCandidateFactPort,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly retentionMs = 500_000,
    private readonly browserBudget?: BrowserExecutionBudget,
    private readonly limits: Readonly<RestaurantPageQuestionLimits> = RESTAURANT_PAGE_QUESTION_BUDGET,
  ) {
    this.questionModel = new RunBoundedModelGateway(model, limits.maxModelCalls, limits.maxElapsedMs, () => Date.parse(this.now()));
    this.observe = page => {
      this.expire();
      if (page.readRunId) this.pages.set(JSON.stringify([page.readRunId, page.candidateId, page.requestedSourceUrl, page.snapshot.url]), structuredClone(page));
    };
    this.facts = createFacts(this.observe,browserBudget);
  }

  /** Assembly-owned hook; no URL/name/identity is supplied by a model. */
  retainBoundPage(page:RestaurantFactPageObservation):void {
    if(page.readRunId&&isRestaurantFactPageBound(page,{candidateId:page.candidateId,sourceUrl:page.requestedSourceUrl,readRunId:page.readRunId,startedAt:page.identity.observedAt},this.now()))this.observe(page);
  }

  private expire(): void {
    const cutoff = Date.parse(this.now()) - this.retentionMs;
    for (const [key, page] of this.pages) if (Date.parse(page.observedAt) < cutoff) this.pages.delete(key);
    for (const [key, answer] of this.answered) if (answer.pages.every(page=>Date.parse(page.observedAt)<cutoff)) this.answered.delete(key);
  }

  /** Frozen current G1 observations; no new transport, parsing or identity rule. */
  currentPages(context:{runId:string;startedAt:string}, candidateId:string): RestaurantFactPageObservation[] {
    this.expire();
    return structuredClone([...this.pages.values()].filter(page=>isRestaurantFactPageBound(page,{candidateId,
      sourceUrl:page.requestedSourceUrl,readRunId:context.runId,startedAt:context.startedAt},this.now())));
  }

  /** Reuse only an answer actually admitted into the current authoritative view. */
  admittedQuestion(q:RestaurantPageQuestionState, context:{runId:string;startedAt:string}) {
    const saved=this.answered.get(JSON.stringify([q.readRunId,q.candidateId,q.requestId]));
    if(!saved || q.readRunId!==context.runId || !isDeepStrictEqual(q.result,saved.answer))return undefined;
    const current=this.currentPages(context,q.candidateId);
    if(!saved.pages.every(page=>current.some(item=>isDeepStrictEqual(item,page))))return undefined;
    return structuredClone(saved);
  }

  /** B1 uses the ORIGINAL fact reader/model, not the explicit question budget. */
  async captureBookingPages(input:RestaurantPageQuestionRequest,signal:AbortSignal):Promise<void> {
    const beforeRead=()=>this.beforeBookingRead(input,signal);
    beforeRead();
    const model:ModelGateway={complete:request=>{beforeRead();return this.model.complete(request);}};
    const capture=async(refresh:boolean)=>{
      const facts=this.createFacts(this.observe,this.browserBudget,model,undefined,beforeRead);
      await facts.inspectFacts({capturePagesOnly:true,...(refresh?{reobservePageOnce:true as const}:{captureLinkedTranslation:true as const}),candidateIds:[input.candidate.restaurant.id],
        candidates:[structuredClone(input.candidate)],intent:structuredClone(input.intent),readRunId:input.readContext.runId},signal);
    };
    const incomplete=()=>this.currentPages(input.readContext,input.candidate.restaurant.id).some(page=>page.snapshot.settlement==="PENDING");
    // Initial acquisition retains its existing observed language-link route.
    // Only incomplete captures get the one extra exact-page observation.
    if(incomplete())await capture(true);
    else {await capture(false);if(incomplete())await capture(true);}

    beforeRead();
  }

  /** B1 supplies the enclosing deadline minus reserve; never a fresh allowance. */
  private beforeBookingRead(input:RestaurantPageQuestionRequest,signal:AbortSignal):void {
    signal.throwIfAborted();
    const deadline=Date.parse(input.readContext.deadlineAt);
    if(!Number.isFinite(deadline)||Date.parse(this.now())>=deadline)throw Object.assign(new Error("B1 terms reached the conclusion reserve before a read"),{code:"DELIVERY_RESERVE_REACHED"});
  }

  async answerBookingQuestion(input:RestaurantPageQuestionRequest,pages:readonly RestaurantFactPageObservation[],signal:AbortSignal):Promise<RestaurantPageAnswer> {
    signal.throwIfAborted();
    if(Date.parse(this.now())>=Date.parse(input.readContext.deadlineAt))return {status:"UNVERIFIED",candidateId:input.candidate.restaurant.id,reason:"BUDGET_EXHAUSTED",checkedPages:[]};
    const model:ModelGateway={complete:request=>{this.beforeBookingRead(input,signal);return this.model.complete(request);}};
    return new ModelRestaurantPageQuestion(model,undefined,this.now).answer({question:input.question,
      displayedOutlet:{candidateId:input.candidate.restaurant.id,sourceUrl:pages[0]?.requestedSourceUrl??""},
      readContext:input.readContext,cachedPages:pages},signal);
  }

  async answerQuestion(input: RestaurantPageQuestionRequest, signal: AbortSignal): Promise<RestaurantPageAnswer> {
    signal.throwIfAborted();
    this.expire();
    const id = input.candidate.restaurant.id;
    const failure = (reason: Extract<RestaurantPageAnswer, {status:"UNVERIFIED"}>["reason"]): RestaurantPageAnswer => ({status:"UNVERIFIED",candidateId:id,reason,checkedPages:[]});
    const deadlineAt = Math.min(Date.parse(input.readContext.deadlineAt), Date.parse(this.now()) + this.limits.maxElapsedMs);
    const expired = () => Date.parse(this.now()) >= deadlineAt;
    if (expired()) return failure("BUDGET_EXHAUSTED");
    const cached = () => [...this.pages.values()].filter(p => p.candidateId === id && p.readRunId === input.readContext.runId
      && Date.parse(p.observedAt) >= Date.parse(input.readContext.startedAt));
    let usedPages:RestaurantFactPageObservation[]=[];
    try {
      const answer=await this.questionModel.run(JSON.stringify([input.readContext.runId, id, input.requestId]), async budgetSignal => {
        const combined = AbortSignal.any([signal, budgetSignal]);
        const visits: QuestionPageVisits = {used:0,limit:this.limits.maxNewPageVisits,exhausted:false};
        let modelExhausted = false;
        const model: ModelGateway = {complete: async request => {
          combined.throwIfAborted();
          try { return await this.questionModel.complete(request); }
          catch (error) { if (budgetError(error)) modelExhausted = true; throw error; }
        }};
        let pages = cached();
        if (!pages.length || pages.some(page => page.snapshot.settlement === "PENDING")) {
          // The same identity-producing source chain, with fresh question-only counters.
          const reader = this.createFacts(this.observe, {totalModelCalls:0,maxModelCalls:this.limits.maxModelCalls}, model, visits);
          const candidate=structuredClone(input.candidate);
          const bound=pages.find(page=>isRestaurantFactPageBound(page,{candidateId:id,sourceUrl:page.requestedSourceUrl,readRunId:input.readContext.runId,startedAt:input.readContext.startedAt},this.now()));
          // A fresh read is a navigation hint from the same HIGH proof, not a
          // rewritten Google URL or a new identity assertion. Native reader rechecks it.
          if(bound?.identity.sourceEntityId&&bound.identity.provider==="TABELOG"){candidate.restaurant.sourceIds.tabelog=bound.identity.sourceEntityId;candidate.restaurant.sourceIds.tabelogNativeDetailUri=bound.requestedSourceUrl;}
          else if(bound?.identity.sourceEntityId&&bound.identity.provider==="TABLECHECK"){candidate.restaurant.sourceIds.tablecheck=bound.identity.sourceEntityId;candidate.restaurant.sourceIds.tablecheckNativeGuideUri=bound.requestedSourceUrl;}
          await reader.inspectFacts({capturePagesOnly:true,...(pages.length?{reobservePageOnce:true as const}:{}),candidateIds:[id],candidates:[candidate],intent:structuredClone(input.intent),readRunId:input.readContext.runId},combined);
          combined.throwIfAborted();
          pages = cached();
        }
        if (expired() || visits.exhausted || modelExhausted) return failure("BUDGET_EXHAUSTED");
        const sourceUrl = pages[0]?.requestedSourceUrl;
        if (!sourceUrl) return failure("NO_BOUND_PAGE");
        usedPages=structuredClone(pages);
        const result = await new ModelRestaurantPageQuestion(model, undefined, this.now).answer({question:input.question,displayedOutlet:{candidateId:id,sourceUrl},
          readContext:{runId:input.readContext.runId,startedAt:input.readContext.startedAt},cachedPages:pages},combined);
        combined.throwIfAborted();
        return expired() || modelExhausted ? failure("BUDGET_EXHAUSTED") : result;
      }, deadlineAt);
      if(!signal.aborted && answer.status!=="UNVERIFIED")this.answered.set(JSON.stringify([input.readContext.runId,id,input.requestId]),
        {input:structuredClone(input),answer:structuredClone(answer),pages:usedPages});
      return answer;
    } catch (error) {
      if (signal.aborted) throw signal.reason;
      return failure(expired() || budgetError(error) ? "BUDGET_EXHAUSTED" : "SOURCE_READ_FAILED");
    }
  }
}

function budgetError(error: unknown): boolean {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return ["MODEL_CALL_BUDGET_EXHAUSTED", "RUN_DEADLINE_EXCEEDED", "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED", "QUESTION_PAGE_BUDGET_EXHAUSTED"].includes(String(code));
}
