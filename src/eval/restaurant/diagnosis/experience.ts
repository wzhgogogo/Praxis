import { restaurantRunStageTimings } from "../agent-loop/run-stage-timings.js";
import { epoch, intervalUnion, missingMetric, number, pointer, record, rows, text, texts, token } from "./records.js";
import type { EvidenceRef, Metric, RecordValue, SourceRef } from "./records.js";

/** Independent frozen experience inputs. These observations never change an evaluator verdict. */
export interface ExperienceGold {
  artifactSha256: string;
  clarification?: { completeHistory: boolean; providedFields: Record<string, { value: unknown; ref: string }>;
    requiredMissingFields: string[]; beforePointer: string; afterPointer: string; trajectoryRange?: [number, number] };
  ordering?: { metric: "DISTANCE_METERS" | "PRICE" | "EARLIEST_SLOT"; candidateIds: string[];
    observations: Array<{ candidateId: string; valuePointer: string; sourcePointer: string }> } | null;
}
const canonicalField = (value: string) => ({ DATE: "date", PARTY_SIZE: "partySize", TIME_WINDOW: "timeWindow", AREA: "area" }[value] ?? value);
export function experienceMetrics(input: { raw: RecordValue; run: RecordValue; view: RecordValue; evaluation: RecordValue;
  source: SourceRef; runPointer: string; gold?: ExperienceGold; goldSource?: SourceRef; userRequest?: string; decisions?: unknown[] }) {
  const { raw, run, view, evaluation, source, runPointer } = input;
  if(input.gold&&Object.keys(input.gold).some(k=>!["artifactSha256","clarification","ordering"].includes(k)))throw Error("INVALID_EXPERIENCE_GOLD_KEYS");
  if(input.gold&&input.gold.artifactSha256!==source.sha256)throw Error("EXPERIENCE_GOLD_ARTIFACT_MISMATCH");
  const ref = (path: string): EvidenceRef => ({ ...source, pointer: path });
  const runRef = (path: string) => ref(runPointer + path);
  const measured = (value: number, basis: string, refs: EvidenceRef[]): Metric => ({ status: "MEASURED", value, basis, refs, missing: [] });
  const state = record(record(run.finalSnapshot).domainState), presented = record(state.presentedResults);
  const start = epoch(run.startedAt), finish = epoch(run.finishedAt), presentation = epoch(presented.presentedAt);
  const elapsed = start !== undefined && finish !== undefined && finish >= start ? finish-start : number(record(run.resourceUsage).elapsedMs);
  const atPresentation = start !== undefined && presentation !== undefined && presentation >= start
    ? measured(presentation-start, "RUN_START_PROXY_TO_SERVER_PRESENTATION", [runRef("/startedAt"),runRef("/finalSnapshot/domainState/presentedResults/presentedAt")])
    : missingMetric("RUN_START_PROXY_TO_SERVER_PRESENTATION", "Valid run start/presentation timestamps missing or reversed; no UI render evidence.");
  let complete = missingMetric("FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION", "No independently qualified presentation with complete timestamped citations.");
  let delay = missingMetric("OBSERVATION_TO_SERVER_PRESENTATION", "A supported observation-complete instant and server presentation in one clock are required.");
  if (record(evaluation.outcome).type === "QUALIFIED_DELIVERY" && rows(evaluation.findings).some(f => f.dimension === "FINAL_CLAIM" && f.status === "SATISFIED") && start !== undefined) {
    const ids = texts(presented.candidateIds), cited = texts(presented.evidenceIds), evidence = rows(state.readEvidence);
    if (cited.length && cited.every(id => evidence.some(e => e.evidenceId === id))) {
      const instants = ids.flatMap(id => {
        const relevant = evidence.filter(e => cited.includes(String(e.evidenceId)) && (e.candidateId === id || e.candidateId === undefined));
        const times = relevant.map(e => epoch(e.observedAt));
        return relevant.length && times.every((v): v is number => v !== undefined) ? [Math.max(...times)] : [];
      });
      if (ids.length && instants.length === ids.length) {
        const instant = Math.min(...instants);
        if (instant>=start&&(presentation === undefined || instant <= presentation)) {
          complete = measured(instant-start, "FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION; NOT_STATE_ACCEPTANCE", [runRef("/finalSnapshot/domainState/readEvidence"),runRef("/finalSnapshot/domainState/presentedResults/evidenceIds")]);
          if (presentation !== undefined) delay = measured(presentation-instant, "OBSERVATION_TO_SERVER_PRESENTATION", [...complete.refs,...atPresentation.refs]);
        }
      }
    }
  }
  const acceptance = rows(run.events).flatMap((event,index) => {
    const body = record(event.event), t = epoch(event.occurredAt);
    return ["AVAILABILITY_CHECKED","CANDIDATE_FACTS_INVESTIGATED"].includes(String(body.type)) && t !== undefined && start !== undefined
      ? [{ type: body.type, elapsedMs: t-start, ref: runRef(`/events/${index}`) }] : [];
  });
  const traces = [...rows(record(run.diagnostics).browserTrace),...rows(record(run.sourceTrace).browserTrace),...rows(raw.browserTrace)];
  const traceRefs=[...(Array.isArray(record(run.diagnostics).browserTrace)?[runRef("/diagnostics/browserTrace")]:[]),...(Array.isArray(record(run.sourceTrace).browserTrace)?[runRef("/sourceTrace/browserTrace")]:[]),...(Array.isArray(raw.browserTrace)?[ref("/browserTrace")]:[])];
  const calls: Array<{ method: string; url?: string; at: number; index: number }> = [], sourceSpans: Array<[number,number]> = [], systemSpans: Array<[number,number]> = [], repeated: Array<[number,number]> = [];
  const seen = new Set<string>(), traceGaps: string[] = [];
  const unique = [...new Map(traces.map((row,index) => [`${row.sequence ?? index}:${row.kind}:${row.at}`,row])).values()];
  for (const [index, row] of unique.entries()) {
    const detail = record(row.detail), method = text(detail.method), when = epoch(row.at);
    if (!["SESSION_CALL","SESSION_RETURN"].includes(String(row.kind))) continue;
    if (when === undefined || !method) { traceGaps.push("Session timing boundary missing timestamp or method."); continue; }
    if (row.kind === "SESSION_CALL") {
      const args = Array.isArray(detail.args) ? detail.args : [];
      const url = text(args[method === "openLink" ? 1 : 0]);
      calls.push({ method,at:when,index,...(url ? {url} : {}) });
    } else {
      const i = calls.findLastIndex(call => call.method === method), call = calls[i];
      if (!call || when < call.at) { traceGaps.push("Session return has no ordered matching start."); continue; }
      calls.splice(i,1);
      if (["navigate","openLink"].includes(method)) {
        sourceSpans.push([call.at,when]);
        if (call.url) { if (seen.has(call.url)) repeated.push([call.at,when]); seen.add(call.url); }
        else traceGaps.push("Navigation URL missing; exact reload duration unassessed.");
      } else systemSpans.push([call.at,when]);
    }
  }
  if (calls.length) traceGaps.push("Unfinished session calls cannot be assigned a duration.");
  const models = input.decisions?.length ? rows(input.decisions) : rows(run.modelInvocations);
  const modelSpans = models.flatMap(row => {
    const duration = number(row.latencyMs), settled = epoch(row.settledAt), from = epoch(row.startedAt) ?? (duration !== undefined && settled !== undefined ? settled-duration : undefined);
    return from !== undefined && duration !== undefined && duration >= 0 ? [[from,from+duration] as [number,number]] : [];
  });
  const navigationMs = sourceSpans.length ? measured(intervalUnion(sourceSpans),"SOURCE_IO_OPERATION_PROXY_INCLUDES_BROWSER_PROCESSING",traceRefs) : missingMetric("SOURCE_IO_OPERATION_PROXY","Timestamped matched navigation boundaries missing.");
  const urlScope=record(record(evaluation.investigationMetrics).urls);
  const reload = urlScope.status==="OBSERVED"&&urlScope.scope==="FULL_RECORDED_NAVIGATIONS"&&sourceSpans.length && !traceGaps.length && elapsed !== undefined && elapsed > 0
    ? measured(intervalUnion(repeated)/elapsed,"EXACT_RECORDED_NAVIGATION_RELOAD_INTERVAL_UNION_RATIO",traceRefs)
    : missingMetric("RELOAD_DURATION_RATIO","Counts alone or incomplete/redacted trace do not establish exact reload duration.");
  const conversation = record(view.conversation), messages = rows(conversation.messages);
  const viewPointer=raw.view?"/view":raw.after?"/after":raw.initial?"/initial":"";
  const turnResponses = messages.filter(m => m.role === "USER").map(m => {
    const answer=messages.find(a=>a.role==="ASSISTANT"&&a.inReplyTo===m.id),from=epoch(m.createdAt),to=epoch(answer?.createdAt);
    return {userMessageId:m.id??null,metric:conversation.clockDomain==="WALL_TIME"&&answer&&from!==undefined&&to!==undefined&&to>=from
      ?measured(to-from,"EXPLICIT_WALL_CLOCK_ASSOCIATED_MESSAGE_PAIR",[ref(viewPointer+"/conversation/messages")])
      :missingMetric("USER_TO_ASSOCIATED_ASSISTANT_WALL_TIME","Clock provenance and request/response association are not retained; equal fixture business times are not zero latency.")};
  });
  if(!turnResponses.length)turnResponses.push({userMessageId:null,metric:missingMetric("USER_TO_ASSOCIATED_ASSISTANT_WALL_TIME","Conversation messages are not present in this artifact.")});
  // A future Runner may provide independently recorded wall-clock message pairs.
  // Existing generic CaseView createdAt does not establish that clock domain.
  const gold = input.gold?.artifactSha256 === source.sha256 ? input.gold : undefined;
  const goldRef = (path: string): EvidenceRef[] => input.goldSource ? [{...input.goldSource,pointer:path}] : [];
  const clarification = gold?.clarification;
  let excess = missingMetric("FROZEN_GOLD_AND_ACTUAL_QUESTION","Frozen clarification Gold with a complete turn history was not supplied.");
  let missing = missingMetric("REQUIRED_MISSING_FIELD_AND_UNSOURCED_NEW_VALUE","Frozen required/missing fields and complete before/after history were not supplied.");
  const excessRows: RecordValue[] = [], missingRows: RecordValue[] = [];
  if (clarification?.completeHistory) {
    const all = rows(run.trajectories), [lo,hi] = clarification.trajectoryRange ?? [0,all.length];
    const steps = all.slice(lo,hi), questions = steps.flatMap((step,index) => {
      const action = record(step.agentAction ?? step.action);
      return action.type === "ASK_USER" && ["EXECUTED","TERMINAL"].includes(String(step.stepOutcome))
        ? [{fields:texts(action.relatedFields).map(canonicalField),question:action.question ?? record(step.observation).question ?? null,index:index+lo}] : [];
    });
    for (const q of questions) {
      const already = q.fields.filter(field => Object.hasOwn(clarification.providedFields,field));
      if (already.length) excessRows.push({question:q.question,fields:already,goldFields:already.map(f => clarification.providedFields[f]!.ref),refs:[runRef(`/trajectories/${q.index}`),...goldRef("/clarification/providedFields")]});
    }
    excess = measured(excessRows.length,"FROZEN_GOLD_AND_ACTUAL_STRUCTURED_QUESTION",[...goldRef("/clarification"),runRef("/trajectories")]);
    if (questions.some(q => !q.fields.length)) { excess.status="MEASURED_WITH_GAPS";excess.missing.push("A question has no structured field mapping; its free text is unassessed."); }
    const before = record(pointer(raw,clarification.beforePointer)), after = record(pointer(raw,clarification.afterPointer));
    if (pointer(raw,clarification.beforePointer) !== undefined && pointer(raw,clarification.afterPointer) !== undefined) {
      for (const field of clarification.requiredMissingFields) {
        if (before[field] === undefined && after[field] !== undefined && !questions.some(q => q.fields.includes(field))) {
          const origins = record(after.fieldSources);
          if (origins[field] === undefined) missingRows.push({field,value:after[field],refs:[ref(clarification.beforePointer),ref(clarification.afterPointer+"/"+token(field)),...goldRef("/clarification/requiredMissingFields")]});
        }
      }
      missing = measured(missingRows.length,"GOLD_REQUIRED_FIELD_NEW_VALUE_WITHOUT_QUESTION_OR_RECORDED_SOURCE",[ref(clarification.beforePointer),ref(clarification.afterPointer),...goldRef("/clarification")]);
      if (questions.some(q => !q.fields.length) || clarification.requiredMissingFields.some(f => record(after.fieldSources)[f] !== undefined)) {
        missing.status="MEASURED_WITH_GAPS";missing.missing.push("Unmapped question or recorded value origin needs independent source verification; not counted as an assumption.");
      }
    }
  }
  const userRequest = input.userRequest ?? text(record(run.materializedCase).request) ?? text(raw.request)
    ?? text(messages.filter(m => m.role === "USER").at(-1)?.content);
  const explicit = userRequest?.match(/\b(nearest|closest|cheapest|earliest available)\b|最近|最便宜|最早有空位/iu)?.[0];
  let ordering: RecordValue;
  if (gold?.ordering === null || gold?.ordering === undefined && userRequest !== undefined && !explicit) ordering={status:"NOT_APPLICABLE",requirement:null,gateEffect:"NONE",refs:[]};
  else if (!gold?.ordering) ordering={status:"NOT_EVALUATED",requirement:explicit ?? null,gateEffect:"NONE",missing:["Explicit objective requires a frozen comparison population and source-bound values."]};
  else {
    const ranking=gold.ordering;
    const values=ranking.candidateIds.map(candidateId => {
      const o=ranking.observations.find(o=>o.candidateId===candidateId),sourceRecord=record(o ? pointer(raw,o.sourcePointer) : undefined);
      const value=o ? number(pointer(raw,o.valuePointer)) : undefined;
      return {candidateId,value,o,valid:value!==undefined && sourceRecord.candidateId===candidateId && Boolean(text(sourceRecord.sourceUrl)) && epoch(sourceRecord.observedAt)!==undefined};
    });
    const selected=texts(presented.candidateIds), visible=selected.flatMap(id=>values.filter(v=>v.candidateId===id));
    if (!values.length || values.some(v=>!v.valid) || !visible.length || selected.some(id=>!values.some(v=>v.candidateId===id)))
      ordering={status:"NOT_EVALUATED",requirement:ranking.metric,gateEffect:"NONE",missing:["Missing source-bound comparable values, population or presentation."],observations:values.map(v=>({candidateId:v.candidateId,value:v.value??null,valid:v.valid}))};
    else {
      const best=Math.min(...values.map(v=>v.value!));
      ordering={status:visible[0]?.value===best&&visible.every((v,i)=>!i||visible[i-1]!.value!<=v.value!)?"PASSED":"DEVIATED",requirement:ranking.metric,gateEffect:"NONE",population:ranking.candidateIds,bestValue:best,presented:selected,
        refs:values.flatMap(v=>[ref(v.o!.valuePointer),ref(v.o!.sourcePointer)]),scope:"ONLY_FROZEN_COMPARABLE_OBSERVED_CANDIDATES"};
    }
  }
  const cet=(value:number|undefined)=>value===undefined?null:new Date(value+3_600_000).toISOString().replace("Z","+01:00");
  const elapsedRefs=start!==undefined&&finish!==undefined?[runRef("/startedAt"),runRef("/finishedAt")]:[runRef("/resourceUsage/elapsedMs")];
  return {gateEffect:"NONE",timing:{startBasis:start!==undefined?"RUN_START_PROXY":"NOT_EVALUATED",absoluteTimesCET:{runStart:cet(start),observationComplete:cet(start!==undefined&&complete.value!==null?start+complete.value:undefined),serverPresentation:cet(presentation)},elapsed:elapsed!==undefined?measured(elapsed,"RECORDED_RUN_ELAPSED",elapsedRefs):missingMetric("RUN_ELAPSED","Missing valid elapsed/start/end."),
    firstSupportedObservationComplete:complete,firstServerPresentation:atPresentation,observationToPresentation:delay,acceptanceEvents:acceptance,
    uiVisible:missingMetric("UI_VISIBLE","No client render acknowledgement."),turnResponses,
    stageBreakdown:run.stageTimings ?? restaurantRunStageTimings(run,input.decisions),repeatedLoads:{counts:record(evaluation.investigationMetrics).urls??null,durationRatio:reload},
    externalVsSystem:{navigationOperation:navigationMs,googleWait:missingMetric("GOOGLE_WAIT","No independently timestamped Google response boundary supplied."),modelWallMs:modelSpans.length?measured(intervalUnion(modelSpans),"RECORDED_MODEL_INTERVAL_UNION",[runRef("/modelInvocations")]):missingMetric("MODEL_WALL_TIME","Counters alone cannot place model intervals."),systemOperationMs:systemSpans.length?measured(intervalUnion(systemSpans),"RECORDED_NON_NAVIGATION_OPERATION_UNION",traceRefs):missingMetric("SYSTEM_OPERATION_WALL_TIME","Timestamped operation pairs missing."),gaps:traceGaps,additive:false}},
    clarifications:{excess,missing,excessQuestions:excessRows,missingQuestions:missingRows},conditions:structuredClone(evaluation.conditionStates??null),softPreferenceObservations:structuredClone(evaluation.softPreferenceObservations??null),explicitOrdering:ordering};
}
