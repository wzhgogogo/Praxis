import { experienceMetrics } from "./experience.js";
import type { ExperienceGold } from "./experience.js";
import { pointer, record, rows, text, texts } from "./records.js";
import type { EvidenceRef, Metric, RecordValue, SourceRef } from "./records.js";

export const STAGES = ["UNDERSTANDING","LOCATION","DISCOVERY","IDENTITY","FACTS_HARD","AVAILABILITY","PRESENTATION","SELECTION","B1_HANDOFF","CARD_TERMS","QUESTION_PAGE","QUESTION_ANSWER","ENDING"] as const;
export type Stage = typeof STAGES[number];
type Certainty = "CONFIRMED" | "HYPOTHESIS";
export interface StageIssue { stage: Stage; certainty: Certainty; causeCertainty: "HYPOTHESIS"; reason: string; refs: EvidenceRef[]; scope: string; issueId: string; }
export interface StageNode {
  id: Stage; reach: "REACHED" | "NOT_REACHED" | "NOT_EVALUATED";
  assessment: "PASSED" | "DEVIATED" | "NOT_EVALUATED" | "BLOCKED_BY_UPSTREAM";
  refs: EvidenceRef[]; missing: string[]; independentConclusions: unknown[];
}
/** This is an input interface, not an implementation of A's grader. */
export interface TurnAssessments {
  schema: "run-stage-assessments@1"; artifactSha256: string;
  origin: "INDEPENDENT_EVALUATOR" | "TEST_INTERFACE_SAMPLE"; producer: SourceRef;
  stages: Array<{ stage: Stage; status: "PASSED" | "DEVIATED" | "NOT_EVALUATED" | "BLOCKED_BY_UPSTREAM";
    certainty: Certainty; scope: string; reason: string; refs: EvidenceRef[]; blockedBy?: string }>;
}
export interface DiagnosisContext {
  experienceGold?: ExperienceGold; goldSource?: SourceRef; userRequest?: string; decisions?: unknown[];
  turnAssessments?: TurnAssessments; allowTestInterfaceSample?: boolean;
  independentNotes?: Array<{ source: SourceRef; scope: string; content: unknown }>;
}
export interface RunDiagnosis {
  schema: "run-diagnosis@1"; runId: string | null; attemptId: string | null; caseId: string | null;
  evaluationMetadata: {evaluatorVersion:unknown;rubricVersion:unknown;goldCorrection:unknown;mode:unknown};
  inputs: {artifact:SourceRef;evaluation:SourceRef|null};
  summary: {outcome:unknown;severity:unknown;execution:unknown;evaluationFailure:unknown};
  stages: StageNode[];
  firstConfirmedDeviation: StageIssue | null; confirmedDeviations: StageIssue[];
  witnessCoverageObservations: StageIssue[]; hypothesizedBottlenecks: StageIssue[];
  firstPoint: {status:"DEVIATION"|"NO_CONFIRMED_DEVIATION"|"NOT_EVALUATED"|"NO_OBSERVED_DEVIATION";stage:Stage|null;certainty:Certainty|null;column:string|null;earliestKnownOnly:boolean};
  downstreamBlocked: unknown[]; unlocatedFindings: unknown[]; witnessFunnel: unknown[];
  systemObservations: RecordValue; unassessed: Array<{stage:string;missing:string[]}>;
  experience: ReturnType<typeof experienceMetrics>;
  independentNotes: unknown[]; deferred: string[]; testInterfaceInput: boolean;
  existingDiagnostics: RecordValue;
}
const stage = (value: unknown): Stage | undefined => {
  const mapped = ({ SEMANTIC_TO_FINAL_STATE:"UNDERSTANDING",SEMANTIC:"UNDERSTANDING",FACTS:"FACTS_HARD",PRESENT_RESULTS:"PRESENTATION",TERMINATION:"ENDING" } as Record<string,string>)[String(value)] ?? value;
  return STAGES.includes(mapped as Stage) ? mapped as Stage : undefined;
};
const byStage = (a: StageIssue,b: StageIssue) => STAGES.indexOf(a.stage)-STAGES.indexOf(b.stage);
export function buildRunDiagnosis(input: {artifact:unknown;evaluation?:unknown;source:SourceRef;evaluationSource?:SourceRef;context?:DiagnosisContext}): RunDiagnosis {
  const raw=record(input.artifact), e=record(input.evaluation), context=input.context??{};
  if(Object.keys(e).length&&e.status!=="EVALUATION_FAILED"&&record(e.sourceArtifact).sha256!==input.source.sha256)throw Error("EVALUATION_ARTIFACT_SHA_MISMATCH");
  const runPointer=raw.execution?"/execution":raw.afterArtifact?"/afterArtifact":"";
  const run=record(raw.execution??raw.afterArtifact??raw), state=record(record(run.finalSnapshot).domainState);
  const viewPointer=raw.view?"/view":raw.after?"/after":raw.initial?"/initial":"";
  const view=record(raw.view??raw.after??raw.initial), restaurant=record(view.restaurant);
  const r=(pointer:string):EvidenceRef=>({...input.source,pointer});
  const er=(pointer:string):EvidenceRef=>({...input.evaluationSource??input.source,pointer});
  const nodes:StageNode[]=STAGES.map(id=>({id,reach:"NOT_EVALUATED",assessment:"NOT_EVALUATED",refs:[],missing:["No independent stage-specific conclusion supplied."],independentConclusions:[]}));
  const node=(id:Stage)=>nodes[STAGES.indexOf(id)]!;
  const reached=(id:Stage,refs:EvidenceRef[])=>{node(id).reach="REACHED";node(id).refs.push(...refs);};
  const events=rows(run.events), steps=rows(run.trajectories), evidence=rows(state.readEvidence);
  const eventRefs=(types:string[])=>events.flatMap((v,i)=>types.includes(String(record(v.event).type))?[r(`${runPointer}/events/${i}`)]:[]);
  if (run.semantic||run.materializedCase||events.some(v=>record(v.event).type==="SEMANTIC_PROPOSAL_COMPILED")) reached("UNDERSTANDING",[r(runPointer+"/materializedCase"),...eventRefs(["SEMANTIC_PROPOSAL_COMPILED"])]);
  if (run.resolvedEvalLocation||record(state.searchContinuation).locationContext||restaurant.searchLocation||eventRefs(["EVALUATION_LOCATION_BOUND"]).length) reached("LOCATION",[r(runPointer+"/resolvedEvalLocation"),r(runPointer+"/finalSnapshot/domainState/searchContinuation/locationContext"),r(viewPointer+"/restaurant/searchLocation"),...eventRefs(["EVALUATION_LOCATION_BOUND"])]);
  if (rows(state.candidates).length||eventRefs(["SEARCH_COMPLETED"]).length) reached("DISCOVERY",[r(runPointer+"/finalSnapshot/domainState/candidates"),...eventRefs(["SEARCH_COMPLETED"])]);
  for (const [kind,id] of [["ENTITY_MATCH","IDENTITY"],["RESTAURANT_FACT","FACTS_HARD"],["AVAILABILITY","AVAILABILITY"]] as const) {
    const refs=evidence.flatMap((v,i)=>v.kind===kind?[r(`${runPointer}/finalSnapshot/domainState/readEvidence/${i}`)]:[]);
    if (refs.length) reached(id,refs);
  }
  if (Object.keys(record(state.availabilityChecks)).length||eventRefs(["AVAILABILITY_CHECKED"]).length) reached("AVAILABILITY",[r(runPointer+"/finalSnapshot/domainState/availabilityChecks"),...eventRefs(["AVAILABILITY_CHECKED"])]);
  if (texts(record(state.presentedResults).candidateIds).length||eventRefs(["RESULTS_PRESENTED"]).length) reached("PRESENTATION",[r(runPointer+"/finalSnapshot/domainState/presentedResults"),...eventRefs(["RESULTS_PRESENTED"])]);
  if (state.selectedCandidateId||restaurant.selectedCandidateId||eventRefs(["CANDIDATE_SELECTED"]).length) reached("SELECTION",[r(runPointer+"/finalSnapshot/domainState/selectedCandidateId"),r(viewPointer+"/restaurant/selectedCandidateId"),...eventRefs(["CANDIDATE_SELECTED"])]);
  if (Object.hasOwn(restaurant,"bookingHandoffs")) reached("B1_HANDOFF",[r(viewPointer+"/restaurant/bookingHandoffs")]);
  if (rows(restaurant.bookingHandoffs).some(h=>Object.hasOwn(h,"terms"))||rows(raw.timeline).some(t=>t.event==="TERMS_BEGIN")) reached("CARD_TERMS",[r(viewPointer+"/restaurant/bookingHandoffs"),r("/timeline")]);
  const question=record(state.pageQuestion??restaurant.pageQuestion);
  if (Object.keys(question).length||eventRefs(["PAGE_QUESTION_REQUESTED"]).length) reached("QUESTION_PAGE",[r(runPointer+"/finalSnapshot/domainState/pageQuestion"),...eventRefs(["PAGE_QUESTION_REQUESTED"])]);
  const pageRequests=rows(raw.requests).flatMap((row,i)=>record(row.request).purpose==="restaurant_page_question"?[r(`/requests/${i}`)]:[]);
  if (pageRequests.length) reached("QUESTION_PAGE",pageRequests);
  if (question.result||eventRefs(["PAGE_QUESTION_COMPLETED"]).length) reached("QUESTION_ANSWER",[r(runPointer+"/finalSnapshot/domainState/pageQuestion/result"),r(viewPointer+"/restaurant/pageQuestion/result"),...eventRefs(["PAGE_QUESTION_COMPLETED"])]);
  if (run.status||run.loop||run.interruption) reached("ENDING",[r(runPointer+"/status"),r(runPointer+"/loop"),r(runPointer+"/interruption")]);
  for (const value of texts(e.reachedStages)) {const id=stage(value);if(id)reached(id,[er("/reachedStages")]);}
  // A complete single-run trajectory can establish an action was never reached.
  // Projection-only and interrupted inputs do not establish an absent action.
  if (Array.isArray(run.trajectories)&&record(e.outcome).type!=="ORCHESTRATION_INTERRUPTED"&&run.finishedAt) {
    for (const id of STAGES.slice(0,7)) if(node(id).reach==="NOT_EVALUATED")node(id).reach="NOT_REACHED";
  }
  const confirmed:StageIssue[]=[],hypotheses:StageIssue[]=[],coverage:StageIssue[]=[],unlocated:unknown[]=[];
  const issue=(id:Stage,certainty:Certainty,reason:string,refs:EvidenceRef[],scope:string,issueId:string):StageIssue=>({stage:id,certainty,causeCertainty:"HYPOTHESIS",reason,refs,scope,issueId});
  for (const [i,finding] of rows(e.findings).entries()) {
    const id=stage(finding.stage), ref=er(`/findings/${i}`);
    if (!id) {if(finding.status!=="SATISFIED")unlocated.push({finding:structuredClone(finding),ref});continue;}
    node(id).independentConclusions.push({finding:structuredClone(finding),ref});node(id).refs.push(ref);
    if (finding.status==="SATISFIED") {node(id).assessment="PASSED";node(id).missing=[];}
    if (finding.status==="NOT_SATISFIED") {
      const certainty=finding.certainty==="CONFIRMED"?"CONFIRMED":"HYPOTHESIS";
      const row=issue(id,certainty,String(finding.directCause??"Existing evaluator reported a deviation."),[ref],"RUN",`finding:${i}`);
      if(certainty==="CONFIRMED"){confirmed.push(row);node(id).assessment="DEVIATED";node(id).missing=[];}else hypotheses.push(row);
    }
  }
  const downstream:unknown[]=[];
  const incoming=context.turnAssessments;
  if(incoming){
    if(incoming.schema!=="run-stage-assessments@1"||incoming.artifactSha256!==input.source.sha256)throw Error("STAGE_ASSESSMENT_SCOPE_MISMATCH");
    if(!["INDEPENDENT_EVALUATOR","TEST_INTERFACE_SAMPLE"].includes(incoming.origin)||!incoming.producer?.path||!/^[a-f0-9]{64}$/.test(incoming.producer.sha256)||!Array.isArray(incoming.stages))throw Error("INVALID_STAGE_ASSESSMENT_PRODUCER");
    if(incoming.origin==="TEST_INTERFACE_SAMPLE"&&!context.allowTestInterfaceSample)throw Error("TEST_STAGE_INPUT_IS_NOT_A_GRADER");
    for(const [i,a] of incoming.stages.entries()){
      if(!STAGES.includes(a.stage)||!["PASSED","DEVIATED","NOT_EVALUATED","BLOCKED_BY_UPSTREAM"].includes(a.status)||!["CONFIRMED","HYPOTHESIS"].includes(a.certainty)||!a.scope||!Array.isArray(a.refs)||!a.refs.length||a.refs.some(ref=>!ref.path||!/^[a-f0-9]{64}$/.test(ref.sha256)||typeof ref.pointer!=="string"))throw Error("INVALID_STAGE_ASSESSMENT");
      const n=node(a.stage);n.independentConclusions.push(structuredClone(a));n.refs.push(...a.refs);
      if(a.status==="BLOCKED_BY_UPSTREAM"){
        if(!a.blockedBy)throw Error("BLOCKED_STAGE_REQUIRES_CAUSAL_REFERENCE");
        n.assessment=a.status;downstream.push(structuredClone(a));
      }else if(a.status!=="NOT_EVALUATED"){
        n.assessment=a.status;n.missing=[];
        if(a.status==="DEVIATED"){
          const row=issue(a.stage,a.certainty,a.reason,a.refs,a.scope,`stage-assessment:${i}`);
          if(a.certainty==="CONFIRMED")confirmed.push(row);else hypotheses.push(row);
        }
      }
    }
  }
  for(const [i,w]of rows(e.witnessFunnel).entries()){
    const blocker=record(w.blocker),bid=stage(blocker.stage),scope=String(w.outletName??w.sourceId??i),ref=er(`/witnessFunnel/${i}`);
    if(bid)hypotheses.push(issue(bid,"HYPOTHESIS",String(blocker.reason??"Existing witness blocker hypothesis."),[ref],scope,`witness-blocker:${i}`));
    if(w.feasible!=="SUPPORTED")continue;
    const gaps:Array<{stage:Stage;field:string;value:unknown}>=[];
    if(record(w.discovery).status==="NOT_FOUND")gaps.push({stage:"DISCOVERY",field:"discovery/status",value:"NOT_FOUND"});
    if(record(w.identity).status==="NOT_READ")gaps.push({stage:"IDENTITY",field:"identity/status",value:"NOT_READ"});
    if(record(w.facts).status==="NOT_READ")gaps.push({stage:"FACTS_HARD",field:"facts/status",value:"NOT_READ"});
    const recorded=record(w.availability).recorded;
    if(Array.isArray(recorded)&&!recorded.length)gaps.push({stage:"AVAILABILITY",field:"availability/recorded",value:[]});
    if(w.presented==="NO")gaps.push({stage:"PRESENTATION",field:"presented",value:"NO"});
    const gap=gaps[0]; // Only explicit saved coverage fields, never the blocker hypothesis.
    if(gap)coverage.push(issue(gap.stage,"CONFIRMED",`Feasible witness coverage: ${gap.field} = ${JSON.stringify(gap.value)}; not a run correctness or causal conclusion.`,[er(`/witnessFunnel/${i}/${gap.field}`),er(`/witnessFunnel/${i}/feasible`)],scope,`witness-coverage:${i}`));
  }
  confirmed.sort(byStage);coverage.sort(byStage);hypotheses.sort(byStage);
  const first=confirmed[0]??null,qualified=record(e.outcome).type==="QUALIFIED_DELIVERY";
  const selected=first??(!qualified?(coverage[0]??hypotheses[0]):undefined);
  const unassessed=[...nodes.filter(n=>n.assessment==="NOT_EVALUATED").map(n=>({stage:n.id,missing:n.missing})),...texts(e.unassessedDimensions).map(missing=>({stage:"EVALUATOR_UNASSESSED",missing:[missing]}))];
  const firstPoint:RunDiagnosis["firstPoint"]=selected?{status:"DEVIATION",stage:selected.stage,certainty:selected.certainty,column:first?"FIRST_CONFIRMED_DEVIATION":coverage.includes(selected)?"WITNESS_COVERAGE":"HYPOTHESIZED_BOTTLENECK",earliestKnownOnly:nodes.slice(0,STAGES.indexOf(selected.stage)).some(n=>n.assessment==="NOT_EVALUATED")}
    :{status:qualified?"NO_CONFIRMED_DEVIATION":unassessed.length?"NOT_EVALUATED":"NO_OBSERVED_DEVIATION",stage:null,certainty:null,column:null,earliestKnownOnly:unassessed.length>0};
  for(const n of nodes)n.refs=n.refs.filter(ref=>ref.path===input.source.path?pointer(raw,ref.pointer)!==undefined:input.evaluationSource&&ref.path===input.evaluationSource.path?pointer(e,ref.pointer)!==undefined:true);
  return {schema:"run-diagnosis@1",runId:text(run.runId)??null,attemptId:text(run.runId)??null,caseId:text(run.caseId)??null,evaluationMetadata:{evaluatorVersion:e.evaluatorVersion??null,rubricVersion:e.rubricVersion??null,goldCorrection:structuredClone(e.goldCorrection??null),mode:run.mode??raw.mode??null},inputs:{artifact:input.source,evaluation:input.evaluationSource??null},
    summary:{outcome:structuredClone(e.outcome??null),severity:structuredClone(e.severity??null),execution:structuredClone(e.execution??null),evaluationFailure:e.status==="EVALUATION_FAILED"?{status:e.status,failureCode:e.failureCode??null}:null},stages:nodes,firstConfirmedDeviation:first,confirmedDeviations:confirmed,
    witnessCoverageObservations:coverage,hypothesizedBottlenecks:hypotheses,firstPoint,downstreamBlocked:downstream,unlocatedFindings:unlocated,witnessFunnel:structuredClone(Array.isArray(e.witnessFunnel)?e.witnessFunnel:[]),
    systemObservations:{status:run.status??null,startedAt:run.startedAt??null,finishedAt:run.finishedAt??null,stage:run.stage??null,failureCode:run.failureCode??null,noVerifiedResult:state.noVerifiedResult??null,availabilityChecks:state.availabilityChecks??null,selectedCandidateId:state.selectedCandidateId??restaurant.selectedCandidateId??null,bookingHandoffs:restaurant.bookingHandoffs??null,pageQuestion:state.pageQuestion??restaurant.pageQuestion??null},unassessed,
    experience:experienceMetrics({raw,run,view,evaluation:e,source:input.source,runPointer,...(context.experienceGold?{gold:context.experienceGold}:{}),...(context.goldSource?{goldSource:context.goldSource}:{}),...(context.userRequest!==undefined?{userRequest:context.userRequest}:{}),...(context.decisions?{decisions:context.decisions}:{})}),
    existingDiagnostics:structuredClone({investigationMetrics:e.investigationMetrics??null,effectiveResources:e.effectiveResources??null,reachedStages:e.reachedStages??null,recordReadIssues:e.recordReadIssues??null,unassessedDimensions:e.unassessedDimensions??null}),
    independentNotes:structuredClone(context.independentNotes??[]),deferred:["A G6 independent evaluator integration and B1/terms/page red-light first-point acceptance remain incomplete until that evaluator is merged."],testInterfaceInput:incoming?.origin==="TEST_INTERFACE_SAMPLE"};
}

const escape=(value:unknown)=>String(value??"未评").replace(/\|/g,"\\|").replace(/\r?\n/g," ");
const cite=(refs:EvidenceRef[])=>refs.map(r=>`${r.path}#${r.pointer} (sha256=${r.sha256})`).join("; ");
const stageLabel:Record<Stage,string>={UNDERSTANDING:"理解请求",LOCATION:"地点",DISCOVERY:"发现",IDENTITY:"身份",FACTS_HARD:"事实/HARD",AVAILABILITY:"查位",PRESENTATION:"展示",SELECTION:"选店",B1_HANDOFF:"B1交接",CARD_TERMS:"卡片条款",QUESTION_PAGE:"追问取页",QUESTION_ANSWER:"追问作答",ENDING:"结束"};
const statusLabel:Record<string,string>={REACHED:"到达",NOT_REACHED:"未到达",PASSED:"通过",DEVIATED:"偏离",NOT_EVALUATED:"未评",BLOCKED_BY_UPSTREAM:"上游明确阻断",NO_CONFIRMED_DEVIATION:"无确认偏离",NO_OBSERVED_DEVIATION:"无已观察偏离",DEVIATION:"偏离",NOT_APPLICABLE:"不适用"};
export function renderRunDiagnosis(report:RunDiagnosis):string{
  const issueTable=(items:StageIssue[])=>items.length?"| 环节 | 确定性 | 范围/说明 | 证据 |\n| --- | --- | --- | --- |\n"+items.map(x=>`| ${stageLabel[x.stage]} | ${x.certainty} | ${escape(x.scope+": "+x.reason)} | ${escape(cite(x.refs))} |`).join("\n"):"无记录。";
  const e=report.experience,type=record(report.summary.outcome).type;
  const delivered=["QUALIFIED_DELIVERY","DELIVERED_UNQUALIFIED"].includes(String(type))?"YES（原结果类型）":["HONEST_NO_RESULT","CAPABILITY_MISS"].includes(String(type))?"NO（原结果类型）":"未评（结果类型未确认交付）";
  const brief=(items:StageIssue[])=>items.length?`${stageLabel[items[0]!.stage]} / ${items[0]!.certainty}；共${items.length}项，原范围和证据见附录`:"无已确认记录／未评不代表通过";
  const seconds=(metric:Metric)=>metric.value===null?"未评":`${(metric.value/1000).toFixed(3)}秒`;
  const json=(value:unknown)=>`\x60\x60\x60json\n${JSON.stringify(value,null,2)}\n\x60\x60\x60`;
  const conditions=rows(e.conditions).flatMap(candidate=>rows(candidate.criteria).map(c=>`| ${escape(candidate.candidateId)} | ${escape(c.text)} | ${escape(c.strength)} | ${escape(c.status)} | ${escape(c.supportObservation)} |`)).join("\n");
  const counts=record(report.existingDiagnostics.investigationMetrics);
  const funnel=report.witnessFunnel.map(value=>{const w=record(value),a=record(w.availability);return `| ${escape(w.outletName)} | ${escape(record(w.discovery).status)} | ${escape(record(w.identity).status)} | ${escape(record(w.facts).status)} | 记录：${escape(rows(a.recorded).map(r=>r.status+(r.reasonCode?` (${r.reasonCode})`:"")).join(", ")||"无读取记录")}；见证：${escape(a.witness)} | ${escape(w.presented)} | ${escape(w.feasible)} |`;}).join("\n");
  return `# 运行诊断 ${escape(report.runId)}\n\n`+
    `结果：${escape(type)}；是否交付：${delivered}；用户目标：${escape(record(report.summary.outcome).userGoalComplete)}。\n`+
    `首点：${statusLabel[report.firstPoint.status]} / ${report.firstPoint.stage?stageLabel[report.firstPoint.stage]:"—"} / ${report.firstPoint.certainty??"—"}；之前仍有未评：${report.firstPoint.earliestKnownOnly}。\n\n`+
    `- 首个确认偏离：${brief(report.firstConfirmedDeviation?[report.firstConfirmedDeviation]:[])}\n- 见证覆盖观察：${brief(report.witnessCoverageObservations)}\n- 推测瓶颈：${report.hypothesizedBottlenecks.length?brief(report.hypothesizedBottlenecks):"无记录；确定性始终HYPOTHESIS"}\n\n`+
    `| 环节 | 到达 | 判断 | 证据 |\n| --- | --- | --- | --- |\n${report.stages.map(n=>`| ${stageLabel[n.id]} (${n.id}) | ${statusLabel[n.reach]} | ${statusLabel[n.assessment]} | ${n.refs.length?`[引用](#stage-evidence-${n.id})`:"无记录"} |`).join("\n")}\n\n`+
    `关键耗时：证据齐全 ${seconds(e.timing.firstSupportedObservationComplete)}；服务端展示 ${seconds(e.timing.firstServerPresentation)}；两者之差 ${seconds(e.timing.observationToPresentation)}。\n`+
    `未评记录：${report.unassessed.length}条（环节/评价器清单）；体验缺项单列在附录，不按0计算。\n\n`+
    `只定位和度量，不重新判定；CET（UTC+1）。RUN_START_PROXY和服务端投影不等于用户发送和屏幕渲染。\n\n`+
    `## 见证漏斗\n\n| 店名 | 发现 | 身份 | 事实 | 查位 | 展示 | 可行性 |\n| --- | --- | --- | --- | --- | --- | --- |\n${funnel||"| 无见证记录 | 未评 | 未评 | 未评 | 未评 | 未评 | 未评 |"}\n\n`+
    `## 其他体验观察（无门槛）\n\n追问：多余 ${e.clarifications.excess.value??"未评"}（${e.clarifications.excess.status}）；缺失 ${e.clarifications.missing.value??"未评"}（${e.clarifications.missing.status}）。排序：${statusLabel[String(e.explicitOrdering.status)]??e.explicitOrdering.status}。\n\n拒绝动作：${counts.rejectedActions??"未评"}；最长连续无新观察：${counts.maxConsecutiveNoNewObservation??"未评"}。\n\n`+
    `## 附录\n\n### 严重程度原记录\n\n${json(report.summary.severity)}\n\n### 结果、执行与输入原记录\n\n${json({outcome:report.summary.outcome,execution:report.summary.execution,evaluationFailure:report.summary.evaluationFailure,inputs:report.inputs,evaluationMetadata:report.evaluationMetadata})}\n\n`+
    `### 首个确认偏离\n\n${issueTable(report.firstConfirmedDeviation?[report.firstConfirmedDeviation]:[])}\n\n### 见证覆盖观察\n\n${issueTable(report.witnessCoverageObservations)}\n\n### 推测瓶颈\n\n${issueTable(report.hypothesizedBottlenecks)}\n\n`+
    `### 环节证据\n\n${report.stages.map(n=>`<a id="stage-evidence-${n.id}"></a>\n\n${stageLabel[n.id]}：${cite(n.refs)||"无记录"}`).join("\n\n")}\n\n`+
    `### 下游明确阻断与未定位判断\n\n${json({downstreamBlocked:report.downstreamBlocked,unlocatedFindings:report.unlocatedFindings})}\n\n### 见证漏斗原始JSON\n\n${json(report.witnessFunnel)}\n\n`+
    `### 条件明细\n\n| 展示候选 | 条件 | 强度 | 原评测状态 | 支持来源类型 |\n| --- | --- | --- | --- | --- |\n${conditions}\n\n${json(e.conditions)}\n\n`+
    `### 完整体验、耗时分解、引用与已有资源诊断\n\n${json({experience:e,existingDiagnostics:report.existingDiagnostics})}\n\n### 已有独立核验（只限原范围）\n\n${json(report.independentNotes)}\n\n`+
    `### 未评与未完成\n\n${report.unassessed.map(x=>`- ${x.stage}: ${x.missing.join("; ")}`).join("\n")}\n${report.deferred.map(x=>`- ${x}`).join("\n")}\n\n### 系统说发生了什么（不作偏离证据）\n\n${json(report.systemObservations)}\n`;
}

export function summarizeDiagnoses(reports:RunDiagnosis[],plannedRunIds?:string[]){
  const ids=reports.map(r=>r.attemptId??r.runId??r.inputs.artifact.sha256);
  if(new Set(ids).size!==ids.length)throw Error("DUPLICATE_RUN_IN_SUMMARY");
  if(plannedRunIds&&reports.some((_,i)=>!plannedRunIds.includes(ids[i]!)))throw Error("UNPLANNED_RUN_IN_SUMMARY");
  const cells=new Map<string,string[]>(),cases=new Map<string,unknown[]>();
  for(const [i,r]of reports.entries()){
    const severity=record(r.summary.severity);const level=["S0","S1","S2","S3","S4"].find(s=>record(severity[s]).status==="PRESENT"||s==="S0"&&["S0_DECLARATION","S0_BOUNDARY"].some(part=>record(severity[part]).status==="PRESENT"))??"NO_CONFIRMED_SEVERITY_OR_UNASSESSED";
    const key=`${r.firstPoint.stage??r.firstPoint.status} × ${level}`,list=cells.get(key)??[];list.push(ids[i]!);cells.set(key,list);
    const group=cases.get(r.caseId??"UNKNOWN_CASE")??[];group.push({runId:ids[i],artifactRunId:r.runId,outcome:r.summary.outcome,firstPoint:r.firstPoint,evaluation:r.inputs.evaluation,version:r.evaluationMetadata});cases.set(r.caseId??"UNKNOWN_CASE",group);
  }
  const coverage=new Map<string,{stage:Stage;feasibility:"SUPPORTED"|"NOT_EVALUATED";observations:Array<{runId:string;witnessSourceId:string;outletName:unknown;ref:EvidenceRef}>}>();
  for(const [runIndex,r]of reports.entries())for(const [witnessIndex,w]of rows(r.witnessFunnel).entries()){
    if(w.feasible!=="SUPPORTED"&&w.feasible!=="NOT_EVALUATED")continue;
    // Confirmed-feasible coverage is exactly the existing report column. A
    // separate stratum retains raw missing coverage whose feasibility is ungraded.
    const observed=r.witnessCoverageObservations.find(x=>x.issueId===`witness-coverage:${witnessIndex}`);
    const unconfirmed=record(w.discovery).status==="NOT_FOUND"?"DISCOVERY":record(w.identity).status==="NOT_READ"?"IDENTITY":record(w.facts).status==="NOT_READ"?"FACTS_HARD":undefined;
    const id=w.feasible==="SUPPORTED"?observed?.stage:unconfirmed;if(!id)continue;
    const key=`${id}:${w.feasible}`,cell=coverage.get(key)??{stage:id,feasibility:w.feasible,observations:[]};
    const runId=ids[runIndex]!,witnessSourceId=text(w.sourceId)??`${r.inputs.artifact.sha256}:witness:${witnessIndex}`;
    if(!cell.observations.some(x=>x.runId===runId&&x.witnessSourceId===witnessSourceId))cell.observations.push({runId,witnessSourceId,outletName:w.outletName??null,ref:{...r.inputs.evaluation??r.inputs.artifact,pointer:`/witnessFunnel/${witnessIndex}`}});
    coverage.set(key,cell);
  }
  const witnessCoverageByStage=[...coverage.values()].sort((a,b)=>STAGES.indexOf(a.stage)-STAGES.indexOf(b.stage)||a.feasibility.localeCompare(b.feasibility)).map(cell=>({...cell,
    witnessCount:new Set(cell.observations.map(x=>x.witnessSourceId)).size,occurrenceCount:cell.observations.length,runIds:[...new Set(cell.observations.map(x=>x.runId))]}));
  const distributeMetrics=(values:Metric[])=>{
    const measured=values.filter(v=>v.status==="MEASURED"&&v.value!==null).map(v=>v.value!).sort((a,b)=>a-b),n=measured.length;
    return {measured:n,unassessed:values.filter(v=>v.status==="NOT_EVALUATED"||v.status==="MEASURED_WITH_GAPS").length,median:n?(measured[Math.floor((n-1)/2)]!+measured[Math.floor(n/2)]!)/2:null,max:n?measured[n-1]:null};
  };
  const distribution=(select:(r:RunDiagnosis)=>Metric)=>distributeMetrics(reports.map(select));
  const observedCount=(select:(r:RunDiagnosis)=>Metric)=>{
    const values=reports.map(select),known=values.filter(v=>v.value!==null),sum=known.reduce((n,v)=>n+v.value!,0);
    return {observedTotal:known.length?sum:null,completeTotal:known.length===values.length&&values.every(v=>v.status==="MEASURED")?sum:null,unassessedRuns:values.filter(v=>v.status!=="MEASURED").length};
  };
  const cohorts=new Map<string,string[]>();for(const [i,r]of reports.entries()){
    const meta=r.evaluationMetadata,key=JSON.stringify({evaluatorVersion:meta.evaluatorVersion,rubricVersion:meta.rubricVersion,mode:meta.mode,goldRevisionSha256:record(meta.goldCorrection).rev2Sha256??null});
    const list=cohorts.get(key)??[];list.push(ids[i]!);cohorts.set(key,list);
  }
  return {schema:"run-diagnosis-summary@1",denominators:{planned:plannedRunIds?.length??null,received:reports.length,started:reports.filter(r=>r.systemObservations.startedAt!==null).length,
    finished:reports.filter(r=>r.systemObservations.finishedAt!==null).length,completed:reports.filter(r=>record(r.summary.outcome).type!=="ORCHESTRATION_INTERRUPTED"&&r.systemObservations.finishedAt!==null).length,
    interrupted:reports.filter(r=>record(r.summary.outcome).type==="ORCHESTRATION_INTERRUPTED").length,classificationAvailable:reports.filter(r=>record(r.summary.outcome).type&&record(r.summary.outcome).type!=="NOT_EVALUATED").length,
    scorable:reports.filter(r=>record(r.summary.outcome).type&&!["NOT_EVALUATED","ORCHESTRATION_INTERRUPTED","NOT_A_VALID_SAMPLE","ENV_FAILURE"].includes(String(record(r.summary.outcome).type))).length,capabilityIncluded:reports.filter(r=>record(r.summary.outcome).capabilityDenominator==="INCLUDED"&&record(r.summary.outcome).type!=="ORCHESTRATION_INTERRUPTED").length},denominatorNotes:{planned:"Only an explicitly supplied manifest count; null without one.",completed:"A recorded finish timestamp excluding orchestration interruptions; this is run completion, not user-goal completion.",scorable:"Existing classified result, excluding unassessed/interrupted/invalid/environment-only samples; per-dimension gaps remain visible."},
    firstPointBySeverity:[...cells].map(([cell,runIds])=>({cell,count:runIds.length,runIds})),witnessCoverageByStage,sameCaseAttempts:[...cases].map(([caseId,attempts])=>({caseId,attempts})),cohorts:[...cohorts].map(([metadata,runIds])=>({metadata:JSON.parse(metadata) as unknown,runIds})),
    experience:{elapsed:distribution(r=>r.experience.timing.elapsed),firstEvidence:distribution(r=>r.experience.timing.firstSupportedObservationComplete),firstPresentation:distribution(r=>r.experience.timing.firstServerPresentation),delay:distribution(r=>r.experience.timing.observationToPresentation),turnResponses:distributeMetrics(reports.flatMap(r=>r.experience.timing.turnResponses.map(t=>t.metric))),excessQuestions:observedCount(r=>r.experience.clarifications.excess),missingQuestions:observedCount(r=>r.experience.clarifications.missing),ordering:{passed:reports.filter(r=>r.experience.explicitOrdering.status==="PASSED").length,deviated:reports.filter(r=>r.experience.explicitOrdering.status==="DEVIATED").length,notEvaluated:reports.filter(r=>r.experience.explicitOrdering.status==="NOT_EVALUATED").length,notApplicable:reports.filter(r=>r.experience.explicitOrdering.status==="NOT_APPLICABLE").length}},inputs:reports.map(r=>r.inputs),gateEffect:"NONE"};
}
