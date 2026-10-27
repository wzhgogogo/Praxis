import type { ModelGateway, ModelRequest } from "../../../core/model/contracts.js";
import { ModelRestaurantPageQuestion } from "../../../integrations/restaurant-facts/model-page-question.js";
import type { RestaurantFactPageObservation } from "../../../integrations/restaurant-facts/fact-source-document.js";
import type { BoundQuestion, SavedQuestionPage } from "./bound-question-input.js";
import type { QaRead, QaResponse } from "./scorer.js";

// All pinned-core assumptions, including fixture wire format, are confined here.
export const G1_CORE_REF = "0a466bcded02700b11bfe86e99bf4924e0d22d32";
export const G1_CORE_ADAPTER = "g1-core-adapter@1-legacy-extractive";
export type SensitiveCategory = "ALLERGY" | "RELIGIOUS_DIET" | "ACCESSIBILITY" | "NONE";
export interface QuestionOutcome {
  status: "ANSWERED" | "NOT_STATED" | "UNVERIFIED"; candidateId: string; answer: string;
  citations: Array<{ text: string; url: string; readAt: string }>;
  sensitiveCategory: SensitiveCategory; reason?: string;
  checkedPages: Array<{ url: string; readAt: string }>;
}
export interface BoundRead extends QaRead { questionId: string; url: string; readAt: string; }

export async function invokeQuestionCore(input: { question: BoundQuestion; page: SavedQuestionPage; html: string; text: string; now: string }, model: ModelGateway, signal: AbortSignal) {
  const { question, page } = input, given = question.providedPage;
  const observed: RestaurantFactPageObservation = {
    // Red-control defect: relabelling an earlier run as current must be rejected.
    readRunId: question.readContext.runId,
    requestedSourceUrl: given.sourceUrl, candidateId: given.candidateId, observedAt: given.observedAt,
    snapshot: { url: given.sourceUrl, title: page.outlet.name, html: input.html, text: input.text, settlement: "SETTLED" },
    identity: { evidenceId: given.readId + ":identity", kind: "ENTITY_MATCH", provider: page.site, candidateId: given.candidateId,
      sourceEntityId: page.outlet.id, sourceUrl: given.sourceUrl, observedAt: given.identityObservedAt, requestFingerprint: "OFFLINE_BOUND_PAGE",
      claims: { outletName: page.outlet.name }, entityMatch: { confidence: "HIGH", matchedBy: ["LOCAL_CONSTRUCTED_REVIEWED_PAGE_BINDING"] } },
  };
  // No readPages dependency: this offline runner cannot perform fresh reads.
  const raw = await new ModelRestaurantPageQuestion(model, undefined, () => input.now).answer({ question: question.question,
    displayedOutlet: { candidateId: question.displayedOutlet.candidateId, sourceUrl: question.displayedOutlet.sourceUrl },
    readContext: question.readContext, cachedPages: [observed] }, signal);
  const answer: QuestionOutcome = { status: raw.status, candidateId: raw.candidateId, answer: raw.status === "UNVERIFIED" ? "" : raw.answer,
    citations: raw.status === "UNVERIFIED" ? [] : raw.citations.map(({ text, url, readAt }) => ({ text, url, readAt })),
    // This old core has no classifier. NONE is an unsupported temporary projection,
    // never a claim that sensitive-category classification has been evaluated.
    sensitiveCategory: "NONE", ...(raw.status === "UNVERIFIED" ? { reason: raw.reason } : {}), checkedPages: raw.checkedPages };
  return { answer, raw, categorySupport: "NOT_SUPPORTED_BY_PINNED_CORE" as const };
}

/** Bind model-independent URL/readAt to the retained read, never invent a match. */
export function scoringResponse(answer: QuestionOutcome, read: BoundRead): QaResponse {
  return { kind: answer.status, text: answer.answer, sensitiveCategory: answer.sensitiveCategory,
    citations: answer.citations.map(citation => {
      if (citation.url !== read.url || citation.readAt !== read.readAt) throw new Error("CITATION_NOT_BOUND_TO_RUNNER_READ");
      return { pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId, quote: citation.text };
    }) };
}

/** Fixture model only, source-driven; no answer file or production provider. */
export function fixtureQuestionModel(selection: { quote?: string; question?: string } = {}): ModelGateway {
  return { complete: async (request: ModelRequest) => {
    const body = JSON.parse(request.messages[1]!.content) as { question: string; sourceDocuments: Array<{ id: string; statements: Array<{ id: string; text: string }> }> };
    const found = (!selection.question || selection.question === body.question) && selection.quote && body.sourceDocuments.flatMap(document => document.statements.map(statement => ({ document, statement }))).find(row => row.statement.text === selection.quote);
    return { invocationId: "g1-fixture", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
      outputText: JSON.stringify(found ? { status: "ANSWERED", citations: [{ documentId: found.document.id, statementId: found.statement.id, quote: found.statement.text }] } : { status: "NOT_STATED", citations: [] }) };
  } };
}
