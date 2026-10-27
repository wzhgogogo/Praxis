import type { BrowserExecutionBudget } from "../../infrastructure/browser/browser-task-executor.js";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantPageAnswer, RestaurantPageQuestionPort, RestaurantPageQuestionRequest } from "../../domains/restaurant/page-question.js";
import type { RestaurantFactPageObservation, RestaurantFactPageObserver } from "./fact-source-document.js";
import { ModelRestaurantPageQuestion } from "./model-page-question.js";

/** The existing fact readers are the sole producers of identity-bound pages. */
export class RestaurantPageQuestionReader implements RestaurantPageQuestionPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  readonly facts: RestaurantCandidateFactPort;
  private readonly runBudgets = new Map<string, {budget:BrowserExecutionBudget;at:number}>();
  private readonly observe: RestaurantFactPageObserver;
  private readonly pages = new Map<string, RestaurantFactPageObservation>();

  constructor(
    private readonly model: ModelGateway,
    private readonly createFacts: (observe: RestaurantFactPageObserver, budget?: BrowserExecutionBudget) => RestaurantCandidateFactPort,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly retentionMs = 500_000,
    private readonly browserBudget?: BrowserExecutionBudget,
  ) {
    this.observe = page => {
      this.expire();
      if (page.readRunId) this.pages.set(JSON.stringify([page.readRunId, page.candidateId, page.requestedSourceUrl, page.snapshot.url]), structuredClone(page));
    };
    this.facts = createFacts(this.observe,browserBudget);
  }

  finishReadRun(readRunId:string):void {
    if(this.browserBudget)this.runBudgets.set(readRunId,{budget:{...this.browserBudget},at:Date.parse(this.now())});
  }

  private expire(): void {
    const cutoff = Date.parse(this.now()) - this.retentionMs;
    for(const [key,run] of this.runBudgets)if(run.at<cutoff)this.runBudgets.delete(key);
    for (const [key, page] of this.pages) if (Date.parse(page.observedAt) < cutoff) this.pages.delete(key);
  }

  async answerQuestion(input: RestaurantPageQuestionRequest, signal: AbortSignal): Promise<RestaurantPageAnswer> {
    signal.throwIfAborted();
    this.expire();
    const id = input.candidate.restaurant.id;
    const failure = (reason: Extract<RestaurantPageAnswer, {status:"UNVERIFIED"}>["reason"]): RestaurantPageAnswer => ({status:"UNVERIFIED",candidateId:id,reason,checkedPages:[]});
    if (Date.parse(input.readContext.deadlineAt) <= Date.parse(this.now())) return failure("BUDGET_EXHAUSTED");
    const cached = () => [...this.pages.values()].filter(p => p.candidateId === id && p.readRunId === input.readContext.runId
      && Date.parse(p.observedAt) >= Date.parse(input.readContext.startedAt));
    let pages = cached();
    try {
      if (!pages.length) {
        // No new crawler, name search or URL chosen by the model: this is the
        // same source-aware fact chain used for the original candidate.
        const run = this.runBudgets.get(input.readContext.runId);
        if(this.browserBudget && !run)return failure("RUN_BUDGET_UNAVAILABLE");
        const reader = run ? this.createFacts(this.observe,run.budget) : this.facts;
        await reader.inspectFacts({candidateIds:[id], candidates:[structuredClone(input.candidate)],
          intent:structuredClone(input.intent),readRunId:input.readContext.runId},signal);
        signal.throwIfAborted();
        pages = cached();
      }
      const sourceUrl = pages[0]?.requestedSourceUrl;
      if (!sourceUrl) return failure("NO_BOUND_PAGE");
      const core = new ModelRestaurantPageQuestion(this.model, undefined, this.now);
      return await core.answer({question:input.question,displayedOutlet:{candidateId:id,sourceUrl},
        readContext:{runId:input.readContext.runId,startedAt:input.readContext.startedAt},cachedPages:pages},signal);
    } catch (error) {
      if (signal.aborted) throw signal.reason;
      const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
      return failure(code === "MODEL_CALL_BUDGET_EXHAUSTED" || code === "RUN_DEADLINE_EXCEEDED" || code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" ? "BUDGET_EXHAUSTED" : "SOURCE_READ_FAILED");
    }
  }
}
