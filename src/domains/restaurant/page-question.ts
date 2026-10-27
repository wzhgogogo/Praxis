import type { ModelUsage } from "../../core/model/contracts.js";
import type { RestaurantCandidate, RestaurantSearchIntent } from "./contracts.js";

export interface RestaurantPageCitation {
  text: string;
  url: string;
  readAt: string;
  identityEvidenceId: string;
}
type CheckedPage = { url: string; readAt: string };
export type RestaurantQuestionSensitiveCategory = "ALLERGY" | "RELIGIOUS_DIET" | "ACCESSIBILITY" | "NONE";
export type RestaurantPageAnswer = {
  status: "ANSWERED";
  candidateId: string;
  answer: string;
  sensitiveCategory: RestaurantQuestionSensitiveCategory;
  confirmationRequired: boolean;
  citations: RestaurantPageCitation[];
  checkedPages: CheckedPage[];
  modelUsage?: { calls: 1; usage?: ModelUsage };
} | {
  status: "NOT_STATED";
  candidateId: string;
  answer: null;
  sensitiveCategory: RestaurantQuestionSensitiveCategory;
  confirmationRequired: boolean;
  citations: [];
  checkedPages: CheckedPage[];
  modelUsage?: { calls: 1; usage?: ModelUsage };
} | {
  status: "UNVERIFIED";
  candidateId: string;
  reason: "NO_BOUND_PAGE" | "INCOMPLETE_PAGE" | "INVALID_QUESTION" | "INVALID_MODEL_OUTPUT" | "MODEL_FAILED" | "RUN_BUDGET_UNAVAILABLE" | "BUDGET_EXHAUSTED" | "CANCELLED" | "SOURCE_READ_FAILED" | "ACTION_REJECTED";
  checkedPages: CheckedPage[];
  modelUsage?: { calls: 1; usage?: ModelUsage };
};


/** Code-bound follow-up; no part of this request comes from an Agent action. */
export interface RestaurantPageQuestionRequest {
  requestId: string;
  question: string;
  candidate: RestaurantCandidate;
  intent: RestaurantSearchIntent;
  readContext: { runId: string; startedAt: string; deadlineAt: string };
}
export interface RestaurantPageQuestionState {
  requestId: string;
  question: string;
  candidateId: string;
  readRunId: string;
  readStartedAt: string;
  deadlineAt: string;
  requestedAt: string;
  result?: RestaurantPageAnswer;
}
export interface RestaurantPageQuestionPort {
  readonly executionRoute: "GENERIC_BROWSER" | "STRUCTURED_ADAPTER";
  finishReadRun?(readRunId: string): void;
  answerQuestion(input: RestaurantPageQuestionRequest, signal: AbortSignal): Promise<RestaurantPageAnswer>;
}
