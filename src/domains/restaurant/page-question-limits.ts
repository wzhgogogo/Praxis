/** Code-owned limits for one explicit displayed-outlet follow-up, independent of search. */
export interface RestaurantPageQuestionLimits {
  maxElapsedMs: number;
  maxModelCalls: number;
  maxNewPageVisits: number;
  maxQuestionsPerConversation: number;
}

export const RESTAURANT_PAGE_QUESTION_BUDGET: Readonly<RestaurantPageQuestionLimits> = {
  maxElapsedMs: 60_000,
  maxModelCalls: 3,
  maxNewPageVisits: 2,
  maxQuestionsPerConversation: 20,
};
