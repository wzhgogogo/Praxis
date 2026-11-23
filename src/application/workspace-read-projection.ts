import { isDeepStrictEqual } from "node:util";
import type { RecordedEventEnvelope } from "../core/task-runtime/contracts.js";
import type { RestaurantCandidate, RestaurantEvent, RestaurantIntentDraft, RestaurantReadEvidence, RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { applyRestaurantIntentPatch } from "../domains/restaurant/intent-state.js";
import { restaurantIntentPatchHasChanges } from "../domains/restaurant/semantic-compiler.js";
import { assessRestaurantConditions, priceCondition } from "../domains/restaurant/condition-states.js";
import { restaurantCurrentFactEvidence } from "../domains/restaurant/read-assessment.js";
import type { RestaurantWorkspaceReadProjection, WorkspaceCandidateChangeReason } from "./agent-workspace.js";
import type { RestaurantPageQuestionState } from "../domains/restaurant/page-question.js";
import { allRestaurantSourcesFailed, canContinueRestaurantRead, failedSourceRetryCandidateIds } from "../domains/restaurant/read-continuation.js";

/** Read-only Case projection from its existing authoritative events. No model,
 * storage, new event or old availability is used as a current qualification. */
export function projectWorkspaceRead(input: {
  state: Readonly<RestaurantTaskState>;
  events: readonly RecordedEventEnvelope<RestaurantEvent>[];
  readyCandidateIds: readonly string[];
  qualifiedCandidateIds?: readonly string[];
  openableCandidateIds: readonly string[];
  active: boolean;
  now: string;
}): RestaurantWorkspaceReadProjection {
  const { state, readyCandidateIds } = input;
  const groups: Array<{ revision: number; draft: RestaurantIntentDraft | undefined; presented: Set<string>; events: RestaurantEvent[] }> = [];
  let group = { revision: 0, presented: new Set<string>(), events: [] as RestaurantEvent[], draft: undefined as RestaurantIntentDraft | undefined };
  const known = new Map<string, RestaurantCandidate>();
  const historicalEvidence:RestaurantReadEvidence[]=[];
  const savedAt = new Map<string, number>();
  const questions = new Map<string, RestaurantPageQuestionState>();
  const completedQuestions = new Map<string, RestaurantPageQuestionState>();
  for (const { event } of input.events) {
    if(event.type==="SEARCH_COMPLETED"||event.type==="AVAILABILITY_CHECKED"||event.type==="CANDIDATE_FACTS_CHECKED")historicalEvidence.push(...event.evidence);
    const nextDraft = event.type === "SEMANTIC_PROPOSAL_COMPILED" && restaurantIntentPatchHasChanges(event.patch)
      ? applyRestaurantIntentPatch(group.draft, event.patch) : group.draft;
    // Field presence is not a revision: the reducer may retain presentation for
    // an identical applied draft without emitting another RESULTS_PRESENTED.
    if (!isDeepStrictEqual(nextDraft, group.draft) || event.type === "SEMANTIC_CONFLICT_RECORDED") {
      groups.push(group);
      group = { revision: group.revision + 1, presented: new Set(), events: [], draft: nextDraft };
    }
    if (event.type === "EVALUATION_LOCATION_BOUND" && group.draft?.area) {
      group.draft = { ...group.draft, area: { ...group.draft.area,
        ...(event.coordinates.radiusMeters !== undefined ? { radiusMeters: event.coordinates.radiusMeters } : {}),
        coordinates: { latitude: event.coordinates.latitude, longitude: event.coordinates.longitude,
          ...(event.coordinates.accuracyMeters !== undefined ? { accuracyMeters: event.coordinates.accuracyMeters } : {}),
          observedAt: event.coordinates.observedAt, source: "EVALUATION" } } };
    }
    group.events.push(event);
    if (event.type === "SEARCH_COMPLETED") for (const candidate of event.candidates) known.set(candidate.restaurant.id, candidate);
    if (event.type === "RESULTS_PRESENTED") for (const id of event.candidateIds) group.presented.add(id);
    if (event.type === "SHORTLIST_UPDATED") {
      if (event.shortlisted) {
        if (!savedAt.has(event.candidateId)) savedAt.set(event.candidateId, group.revision);
      } else savedAt.delete(event.candidateId);
    }
    if (event.type === "PAGE_QUESTION_REQUESTED") questions.set(event.question.requestId, event.question);
    if (event.type === "PAGE_QUESTION_COMPLETED") {
      const question = questions.get(event.requestId);
      if (question && question.readRunId === event.readRunId && question.candidateId === event.result.candidateId) {
        completedQuestions.set(event.requestId, { ...structuredClone(question), result: structuredClone(event.result) });
      }
    }
  }
  for (const candidate of state.candidates) known.set(candidate.restaurant.id, candidate);
  const previous = groups.findLast(item => item.revision > 0 && item.events.some(event => event.type === "SEARCH_COMPLETED" || event.type === "RESULTS_PRESENTED" || event.type === "READ_ENDED_NO_VERIFIED_RESULT"));
  const ready = new Set(readyCandidateIds);
  const qualified = new Set(input.qualifiedCandidateIds ?? readyCandidateIds);
  const openable = new Set(input.openableCandidateIds);
  const finished = !input.active && ["PRESENT_RESULTS", "NO_VERIFIED_RESULT", "FAILED"].includes(state.phase);
  const terminal = group.events.findLast(event => event.type === "RESULTS_PRESENTED" || event.type === "READ_ENDED_NO_VERIFIED_RESULT" || event.type === "AGENT_LOOP_TERMINATED");
  const qualifiedRevision = !input.active && (state.phase === "PRESENT_RESULTS" || state.phase === "NO_VERIFIED_RESULT" && !allRestaurantSourcesFailed(state))
    && !(terminal?.type === "AGENT_LOOP_TERMINATED" && terminal.termination === "CANCELLED");
  const name = (id: string) => known.get(id)?.restaurant.outletName ?? "Saved restaurant";
  const reason = (id: string): WorkspaceCandidateChangeReason => {
    const draft = state.intentDraft;
    if (draft) {
      const conditions = assessRestaurantConditions(draft, restaurantCurrentFactEvidence(state, id));
      if (conditions.some(item => item.strength === "HARD" && item.status === "NOT_MET" && priceCondition(item.text, draft.budgetPerPerson))) return "OVER_BUDGET";
    }
    const changedTime = previous?.draft?.timeWindow && draft?.timeWindow
      && (previous.draft.timeWindow.earliest !== draft.timeWindow.earliest || previous.draft.timeWindow.latest !== draft.timeWindow.latest);
    const check = state.availabilityChecks[id];
    if (changedTime && check?.status === "UNAVAILABLE" && check.reasonCode === "NO_MATCHING_SLOT") return "NEW_TIME_MISMATCH";
    return "NO_LONGER_MATCHES";
  };
  const evidence=[...historicalEvidence,...state.readEvidence];
  const humanUrl=(value:string|undefined)=>{
    if(!value)return undefined;
    try{const url=new URL(value);if(url.protocol!=="https:"||url.username||url.password||url.hostname==="googleapis.com"||url.hostname.endsWith(".googleapis.com"))return undefined;
      if((url.hostname==="google.com"||url.hostname.endsWith(".google.com"))&&url.hostname!=="maps.google.com"&&!(url.hostname==="www.google.com"&&/^\/maps(?:\/|$)/.test(url.pathname)))return undefined;
      return url.href;
    }catch{return undefined;}
  };
  const sourceUrl=(id:string)=>{
    const own=evidence.filter(item=>item.candidateId===id);
    const high=own.filter(item=>item.kind==="ENTITY_MATCH"&&item.entityMatch?.confidence==="HIGH"&&humanUrl(item.sourceUrl));
    const sameOrigin=(a:string|undefined,b:string|undefined)=>!!a&&!!b&&humanUrl(a)!==undefined&&humanUrl(b)!==undefined&&new URL(a).origin===new URL(b).origin;
    for(const kind of ["AVAILABILITY","RESTAURANT_FACT","ENTITY_MATCH"] as const){
      const item=own.findLast(item=>item.kind===kind&&humanUrl(item.sourceUrl)&&(kind==="AVAILABILITY"||kind==="ENTITY_MATCH"&&item.entityMatch?.confidence==="HIGH"||kind==="RESTAURANT_FACT"&&(item.entityMatch?.confidence==="HIGH"||!item.entityMatch&&high.some(identity=>sameOrigin(identity.sourceUrl,item.sourceUrl)))));
      if(item)return humanUrl(item.sourceUrl);
    }
    const ids=known.get(id)?.restaurant.sourceIds;return humanUrl(ids?.googleWebsiteUri)||humanUrl(ids?.googleMapsUri);
  };
  const interpretation = group.events.findLast(event => event.type === "SEMANTIC_INTERPRETATION_FAILED" || event.type === "SEMANTIC_PROPOSAL_COMPILED");
  const modelFailed = interpretation?.type === "SEMANTIC_INTERPRETATION_FAILED" && interpretation.status === "MODEL_FAILURE";
  const savedCandidates = (state.selectionSession?.shortlistCandidateIds ?? []).map(id => ({
    candidateId: id, outletName: name(id), current: !modelFailed && openable.has(id),
    ...(!openable.has(id) && !qualified.has(id) && qualifiedRevision && group.revision > (savedAt.get(id) ?? group.revision) ? { reasonCode: reason(id) } : {}),
  }));
  const revisionDiff = previous && groups.some(item => item.presented.size > 0) && qualifiedRevision && group.revision > previous.revision ? {
    fromRevision: previous.revision, toRevision: group.revision,
    removed: [...previous.presented].filter(id => !group.presented.has(id) && !qualified.has(id)).map(id => {const url=sourceUrl(id);return {candidateId:id,outletName:name(id),reasonCode:reason(id),...(url?{sourceUrl:url}:{})};}),
    added: [...group.presented].filter(id => !previous.presented.has(id)).map(id => ({ candidateId: id, outletName: name(id) })),
  } : undefined;
  const attempts = [...Object.values(state.availabilityChecks).flatMap(check => check.sourceAttempts ?? []),
    ...Object.values(state.factChecks ?? {}).flatMap(check => check.sourceAttempts ?? [])];
  const unchecked = attempts.some(attempt => ["FAILED", "UNKNOWN", "SOURCE_UNSUPPORTED"].includes(attempt.outcome));
  // Displayed cards can remain browsable after their inventory expires.
  const hasResults = state.phase === "PRESENT_RESULTS" ? openable.size > 0
    : state.phase !== "NO_VERIFIED_RESULT" && ready.size > 0;
  const kind = state.phase === "NO_VERIFIED_RESULT" ? (allRestaurantSourcesFailed(state) ? "ALL_SOURCES_FAILED" : "NO_QUALIFIED_RESULTS")
    : modelFailed ? "MODEL_FAILURE" : hasResults ? "RESULTS" : input.active ? "PENDING"
    : finished && allRestaurantSourcesFailed(state) ? "ALL_SOURCES_FAILED"
    : state.phase === "FAILED" ? "OTHER_FAILURE" : "PENDING";
  return { requirementRevision: group.revision, questionHistory: [...completedQuestions.values()].reverse(), savedCandidates, ...(revisionDiff ? { revisionDiff } : {}),
    readStatus: { kind, partialSourceFailure: hasResults && unchecked,
      canContinue: !input.active && canContinueRestaurantRead(state, input.now), canRetry: !input.active && failedSourceRetryCandidateIds(state, input.now).length > 0 } };
}
