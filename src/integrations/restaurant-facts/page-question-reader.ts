import type { BrowserExecutionBudget } from "../../infrastructure/browser/browser-task-executor.js";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantPageAnswer, RestaurantPageQuestionPort, RestaurantPageQuestionRequest } from "../../domains/restaurant/page-question.js";
import type { RestaurantFactPageObservation, RestaurantFactPageObserver } from "./fact-source-document.js";
import { ModelRestaurantPageQuestion } from "./model-page-question.js";
import { RunBoundedModelGateway } from "../../application/run-bounded-model-gateway.js";
import { RESTAURANT_PAGE_QUESTION_BUDGET, type RestaurantPageQuestionLimits } from "../../domains/restaurant/page-question-limits.js";
import type { QuestionPageVisits } from "./page-question-read-budget.js";

/** The existing fact readers are the sole producers of identity-bound pages. */
export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  readonly facts: RestaurantCandidateFactPort;
  private readonly questionModel: RunBoundedModelGateway;
  private readonly observe: RestaurantFactPageObserver;
  private readonly pages = new Map<string, RestaurantFactPageObservation>();

  constructor(
    model: ModelGateway,
    private readonly createFacts: (observe: RestaurantFactPageObserver, budget?: BrowserExecutionBudget, model?: ModelGateway, visits?: QuestionPageVisits) => RestaurantCandidateFactPort,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly retentionMs = 500_000,
    browserBudget?: BrowserExecutionBudget,
    private readonly limits: Readonly<RestaurantPageQuestionLimits> = RESTAURANT_PAGE_QUESTION_BUDGET,
  ) {
    this.questionModel = new RunBoundedModelGateway(model, limits.maxModelCalls, limits.maxElapsedMs, () => Date.parse(this.now()));
    this.observe = page => {
      this.expire();
      if (page.readRunId) this.pages.set(JSON.stringify([page.readRunId, page.candidateId, page.requestedSourceUrl, page.snapshot.url]), structuredClone(page));
    };
    this.facts = createFacts(this.observe,browserBudget);
  }

  private expire(): void {
    const cutoff = Date.parse(this.now()) - this.retentionMs;
    for (const [key, page] of this.pages) if (Date.parse(page.observedAt) < cutoff) this.pages.delete(key);
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
    try {
      return await this.questionModel.run(JSON.stringify([input.readContext.runId, id, input.requestId]), async budgetSignal => {
        const combined = AbortSignal.any([signal, budgetSignal]);
        const visits: QuestionPageVisits = {used:0,limit:this.limits.maxNewPageVisits,exhausted:false};
        let modelExhausted = false;
        const model: ModelGateway = {complete: async request => {
          combined.throwIfAborted();
          try { return await this.questionModel.complete(request); }
          catch (error) { if (budgetError(error)) modelExhausted = true; throw error; }
        }};
        let pages = cached();
        if (!pages.length) {
          // The same identity-producing source chain, with fresh question-only counters.
          const reader = this.createFacts(this.observe, {totalModelCalls:0,maxModelCalls:this.limits.maxModelCalls}, model, visits);
          await reader.inspectFacts({capturePagesOnly:true,candidateIds:[id],candidates:[structuredClone(input.candidate)],intent:structuredClone(input.intent),readRunId:input.readContext.runId},combined);
          combined.throwIfAborted();
          pages = cached();
        }
        if (expired() || visits.exhausted || modelExhausted) return failure("BUDGET_EXHAUSTED");
        const sourceUrl = pages[0]?.requestedSourceUrl;
        if (!sourceUrl) return failure("NO_BOUND_PAGE");
        const result = await new ModelRestaurantPageQuestion(model, undefined, this.now).answer({question:input.question,displayedOutlet:{candidateId:id,sourceUrl},
          readContext:{runId:input.readContext.runId,startedAt:input.readContext.startedAt},cachedPages:pages},combined);
        combined.throwIfAborted();
        return expired() || modelExhausted ? failure("BUDGET_EXHAUSTED") : result;
      }, deadlineAt);
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
