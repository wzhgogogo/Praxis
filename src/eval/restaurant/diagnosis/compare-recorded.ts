/** Calibration only. Neither the producer nor its post-finish hook imports this module. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { digest, readRecordedJson } from "./files.js";
import { pointer, record, rows } from "./records.js";
import type { EvidenceRef } from "./records.js";
import type { RunDiagnosis, Stage } from "./report.js";

interface HumanReference {runId:string;stage:Stage|null;certainty?:string;observationCompleteSeconds?:number;presentedSeconds?:number;source:string;}
interface ReviewedDisagreement {artifactSha256:string;expected:Stage;observed:Stage;attribution:"CONFIRMED_EVALUATOR_DEFECT"|"SUSPECTED_UNCONFIRMED";reason:string;reviewSource:{path:string;sha256:string};evidence:Array<{file:string;sha256:string;payloadSha256?:string;pointer:string;expectedValue:unknown}>;}
export async function compareRecordedDiagnoses(input:{summaryPath:string;oraclePath:string;output:string}){
  const summaryRaw=await readFile(input.summaryPath,"utf8"),oracleRaw=await readFile(input.oraclePath,"utf8");
  const summary=record(JSON.parse(summaryRaw)),oracle=record(JSON.parse(oracleRaw));
  if(oracle.schema!=="run-diagnosis-calibration-oracle@2"||!Array.isArray(oracle.references))throw Error("INVALID_CALIBRATION_ORACLE");
  const policy=record(oracle.firstPointRuleSource);
  if(typeof policy.path!=="string"||typeof policy.sha256!=="string"||digest(await readFile(policy.path))!==policy.sha256)throw Error("FIRST_POINT_REVIEW_SOURCE_MISSING_OR_CHANGED");
  const references=oracle.references as HumanReference[],reviewed=(oracle.reviewedDisagreements??[])as ReviewedDisagreement[];
  const paths=rows(summary.paths),results=[];
  for(const expected of references){
    const entry=paths.find(x=>x.id===expected.runId);if(!entry)throw Error("CALIBRATION_RUN_MISSING");
    const bytes=await readFile(String(entry.jsonPath));if(digest(bytes)!==entry.sha256)throw Error("CALIBRATION_REPORT_CHANGED");
    const report=JSON.parse(bytes.toString())as RunDiagnosis;
    const observed=report.firstPoint.stage,stageMatch=observed===expected.stage;
    let explanation:string|null=null,category=stageMatch?"STAGE_MATCH":"UNEXPLAINED_DISAGREEMENT",evidence:EvidenceRef[]=[];
    let reviewAttribution:{status:ReviewedDisagreement["attribution"];certainty:"CONFIRMED"|"HYPOTHESIS";source:{path:string;sha256:string}}|null=null;
    const supplied=reviewed.find(x=>x.artifactSha256===report.inputs.artifact.sha256&&x.expected===expected.stage&&x.observed===observed);
    if(!stageMatch&&supplied){
      if(!["CONFIRMED_EVALUATOR_DEFECT","SUSPECTED_UNCONFIRMED"].includes(supplied.attribution))throw Error("REVIEW_ATTRIBUTION_CERTAINTY_REQUIRED");
      const reviewBytes=await readFile(supplied.reviewSource.path);if(digest(reviewBytes)!==supplied.reviewSource.sha256)throw Error("REVIEW_ATTRIBUTION_SOURCE_CHANGED");
      for(const ref of supplied.evidence){
        const loaded=await readRecordedJson(ref.file,{path:ref.file,sha256:ref.sha256,...(ref.payloadSha256?{payloadSha256:ref.payloadSha256}:{})});
        if(JSON.stringify(pointer(loaded.value,ref.pointer))!==JSON.stringify(ref.expectedValue))throw Error("REVIEW_ATTRIBUTION_EVIDENCE_CHANGED");
        evidence.push({path:ref.file,sha256:loaded.source.sha256,pointer:ref.pointer});
      }
      category=supplied.attribution==="CONFIRMED_EVALUATOR_DEFECT"?"DISAGREEMENT_ATTRIBUTED_TO_EVALUATOR":"SUSPECTED_WITNESS_MATCHING_UNCONFIRMED";explanation=supplied.reason;
      reviewAttribution={status:supplied.attribution,certainty:supplied.attribution==="CONFIRMED_EVALUATOR_DEFECT"?"CONFIRMED":"HYPOTHESIS",source:supplied.reviewSource};
    }else if(!stageMatch&&report.firstPoint.status==="NO_CONFIRMED_DEVIATION"&&record(report.summary.outcome).type==="QUALIFIED_DELIVERY"&&report.firstConfirmedDeviation===null){
      category="HISTORICAL_SCOPE_DIFFERS_FROM_REVIEWED_FIRST_POINT_RULE";
      explanation="10/12 人工标签把见证覆盖观察和首个偏离混在一起；按已确认口径，合格交付且无确认偏离。旧人工标签和报告首点均保留，不修改任何评价。";
    }
    const seconds=(value:number|null)=>value===null?null:value/1000;
    const timings=[{name:"observationComplete",expected:expected.observationCompleteSeconds,observed:seconds(report.experience.timing.firstSupportedObservationComplete.value)},
      {name:"presentation",expected:expected.presentedSeconds,observed:seconds(report.experience.timing.firstServerPresentation.value)}].map(t=>({...t,
        status:t.expected===undefined?"NOT_APPLICABLE":t.observed===null?"NOT_EVALUATED":Math.abs(t.expected-t.observed)<=2?"WITHIN_TWO_SECONDS":"DIFFERENCE_REQUIRES_EXPLANATION",
        absoluteDifferenceSeconds:t.expected===undefined||t.observed===null?null:Math.abs(t.expected-t.observed)}));
    results.push({runId:expected.runId,expectedStage:expected.stage,observedStage:observed,stageMatch,category,explanation,reviewAttribution,source:expected.source,evidence,
      certainty:{expected:expected.certainty??"NOT_SPECIFIED",observed:report.firstPoint.certainty,status:expected.certainty===undefined?"NOT_EVALUATED":expected.certainty===report.firstPoint.certainty?"MATCH":"DIFFERENT_SEPARATE_FROM_STAGE"},timings});
  }
  const matched=results.filter(r=>r.stageMatch).length;
  const result={schema:"run-diagnosis-calibration@1",inputs:{summary:{path:input.summaryPath,sha256:digest(summaryRaw)},oracle:{path:input.oraclePath,sha256:digest(oracleRaw)},reviewedFirstPointRule:policy},stageAgreement:{matched,total:results.length,ratio:results.length?matched/results.length:null},results,
    disagreements:results.filter(r=>!r.stageMatch),certaintyDifferences:results.filter(r=>r.certainty.status==="DIFFERENT_SEPARATE_FROM_STAGE"),timeDifferences:results.flatMap(r=>r.timings.filter(t=>t.status==="DIFFERENCE_REQUIRES_EXPLANATION"||t.status==="NOT_EVALUATED").map(t=>({runId:r.runId,...t}))),
    noRuntimeIdRules:true,producerReadHumanLabels:false,gateEffect:"NONE"};
  await mkdir(input.output);
  await writeFile(resolve(input.output,"comparison.json"),JSON.stringify(result,null,2)+"\n",{flag:"wx"});
  const md=`# 首点与时间校准\n\n环节一致率：${matched}/${results.length}。保留所有分歧，不把已归因分歧从分母删除。确定性差异另列。\n\n| 运行 | 人工环节 | 报告首点 | 比对 | 说明 |\n| --- | --- | --- | --- | --- |\n${results.map(r=>`| ${r.runId} | ${r.expectedStage??"无"} | ${r.observedStage??"无确认偏离"} | ${r.category} | ${r.explanation??"一致"} |`).join("\n")}\n\n## 时间逐项比对\n\n\x60\x60\x60json\n${JSON.stringify(results.map(r=>({runId:r.runId,timings:r.timings})),null,2)}\n\x60\x60\x60\n\n不会修改结果类型、严重程度、Gold、人工标签或评测器。真实 A G6 多回合红灯对接仍未完成。\n`;
  await writeFile(resolve(input.output,"comparison.md"),md,{flag:"wx"});return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const [summaryPath,oraclePath,output]=process.argv.slice(2);if(!summaryPath||!oraclePath||!output)throw Error("Usage: compare-recorded.ts <summary.json> <compare-only-oracle.json> <new-output-directory>");
  console.log(JSON.stringify(await compareRecordedDiagnoses({summaryPath,oraclePath,output}),null,2));
}
