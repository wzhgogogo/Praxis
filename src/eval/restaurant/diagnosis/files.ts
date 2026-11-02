import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";
import { buildRunDiagnosis, renderRunDiagnosis, summarizeDiagnoses } from "./report.js";
import type { DiagnosisContext, RunDiagnosis, TurnAssessments } from "./report.js";
import type { ExperienceGold } from "./experience.js";
import { record, rows } from "./records.js";
import type { SourceRef } from "./records.js";

export const digest = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export interface FrozenFile extends SourceRef { payloadSha256?: string; }
function keys(value:unknown,allowed:string[],name:string){
  const parsed=record(value);
  if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(parsed).some(key=>!allowed.includes(key)))throw Error(`INVALID_${name}_KEYS`);
  return parsed;
}
export async function readRecordedJson(path:string,expected?:FrozenFile){
  if(/^\.env(?:\.|$)/.test(basename(path))||basename(path)==="labels.yaml")throw Error("DIAGNOSIS_FORBIDDEN_INPUT");
  const bytes=await readFile(path);if(expected&&digest(bytes)!==expected.sha256)throw Error("RECORDED_INPUT_SHA_MISMATCH");
  const raw=path.endsWith(".gz")?gunzipSync(bytes):bytes;
  if(expected?.payloadSha256&&digest(raw)!==expected.payloadSha256)throw Error("RECORDED_PAYLOAD_SHA_MISMATCH");
  return {value:JSON.parse(raw.toString()) as unknown,source:{path,sha256:digest(raw)}};
}
interface RecordedContext {
  experienceGold?:FrozenFile; userRequest?:string; turnAssessments?:FrozenFile;
  independentNotes?:Array<{file:FrozenFile;scope:string}>;
}
async function loadContext(value:unknown):Promise<DiagnosisContext>{
  const config=keys(value,["experienceGold","userRequest","turnAssessments","independentNotes"],"DIAGNOSIS_CONTEXT") as RecordedContext;
  const context:DiagnosisContext={};
  if(config.userRequest!==undefined){if(typeof config.userRequest!=="string")throw Error("INVALID_USER_REQUEST");context.userRequest=config.userRequest;}
  if(config.experienceGold){const loaded=await readRecordedJson(config.experienceGold.path,config.experienceGold);context.experienceGold=loaded.value as ExperienceGold;context.goldSource=loaded.source;}
  if(config.turnAssessments){const loaded=await readRecordedJson(config.turnAssessments.path,config.turnAssessments);context.turnAssessments=loaded.value as TurnAssessments;}
  if(config.independentNotes){
    if(!Array.isArray(config.independentNotes))throw Error("INVALID_INDEPENDENT_NOTES");
    context.independentNotes=await Promise.all(config.independentNotes.map(async note=>{
      keys(note,["file","scope"],"INDEPENDENT_NOTE");const loaded=await readRecordedJson(note.file.path,note.file);
      return {source:loaded.source,scope:note.scope,content:loaded.value};
    }));
  }
  return context;
}
export async function writeRecordedDiagnosis(input:{artifact:FrozenFile|string;evaluation?:FrozenFile|string;prefix:string;context?:unknown;attemptId?:string}){
  const artifactFile=typeof input.artifact==="string"?{path:input.artifact}:input.artifact;
  const artifact=await readRecordedJson(artifactFile.path,"sha256"in artifactFile?artifactFile:undefined);
  const evaluationFile=typeof input.evaluation==="string"?{path:input.evaluation}:input.evaluation;
  const evaluation=evaluationFile?await readRecordedJson(evaluationFile.path,"sha256"in evaluationFile?evaluationFile:undefined):undefined;
  if(evaluation){
    const saved=record(evaluation.value),binding=record(saved.sourceArtifact);
    const boundFailure=saved.status==="EVALUATION_FAILED"&&typeof binding.path==="string"&&resolve(binding.path)===resolve(artifactFile.path);
    if(!boundFailure&&binding.sha256!==artifact.source.sha256)throw Error("EVALUATION_ARTIFACT_SHA_MISMATCH");
  }
  const report=buildRunDiagnosis({artifact:artifact.value,source:artifact.source,...(evaluation?{evaluation:evaluation.value,evaluationSource:evaluation.source}:{}),...(input.context?{context:await loadContext(input.context)}:{})});
  if(input.attemptId!==undefined)report.attemptId=input.attemptId;
  const jsonPath=input.prefix+".diagnosis.json",markdownPath=input.prefix+".diagnosis.md";
  await mkdir(dirname(input.prefix),{recursive:true});
  await writeFile(jsonPath,JSON.stringify(report,null,2)+"\n",{flag:"wx"});
  await writeFile(markdownPath,renderRunDiagnosis(report),{flag:"wx"});
  return {report,jsonPath,markdownPath};
}
/** Never lets report I/O turn a saved evaluation into an evaluation failure. */
export async function writeDiagnosisAfterEvaluation(artifactPath:string,evaluationPath:string):Promise<void>{
  try{await writeRecordedDiagnosis({artifact:artifactPath,evaluation:evaluationPath,prefix:evaluationPath});}
  catch(error){
    const code=error instanceof Error&&"code"in error?String(error.code):error instanceof Error&&/^[A-Z][A-Z0-9_]{0,63}$/.test(error.message)?error.message:"DIAGNOSIS_GENERATION_FAILED";
    try{await writeFile(evaluationPath+".diagnosis.failed.json",JSON.stringify({schema:"run-diagnosis-failure@1",status:"DIAGNOSIS_FAILED",artifactPath,evaluationPath,failureCode:code},null,2)+"\n",{flag:"wx"});}catch{/* Existing evaluation/diagnosis files are never overwritten. */}
  }
}
interface BatchInput {id:string;artifact:FrozenFile;evaluation?:FrozenFile;context?:RecordedContext;}
export async function generateRecordedDiagnoses(manifestPath:string,output:string){
  const loaded=await readRecordedJson(manifestPath),m=keys(loaded.value,["schema","plannedRunIds","inputs"],"DIAGNOSIS_BATCH");
  if(m.schema!=="run-diagnosis-inputs@1"||!Array.isArray(m.inputs))throw Error("INVALID_DIAGNOSIS_BATCH");
  const inputs=m.inputs as BatchInput[];
  if(new Set(inputs.map(x=>x.id)).size!==inputs.length||inputs.some(x=>!/^[-\w]+$/.test(x.id)))throw Error("INVALID_OR_DUPLICATE_RUN_ID");
  await mkdir(output); // Must be new; partial/previous reports remain immutable.
  const reports:RunDiagnosis[]=[],paths=[];
  for(const input of inputs){
    keys(input,["id","artifact","evaluation","context"],"DIAGNOSIS_BATCH_ENTRY");
    const result=await writeRecordedDiagnosis({artifact:input.artifact,...(input.evaluation?{evaluation:input.evaluation}:{}),prefix:resolve(output,input.id),attemptId:input.id,...(input.context?{context:input.context}:{})});
    // The manifest label is an attempt identity, never a diagnostic rule.
    reports.push(result.report);
    paths.push({id:input.id,jsonPath:relative(process.cwd(),result.jsonPath),markdownPath:relative(process.cwd(),result.markdownPath),sha256:digest(await readFile(result.jsonPath))});
  }
  const planned=Array.isArray(m.plannedRunIds)&&m.plannedRunIds.every(x=>typeof x==="string")?m.plannedRunIds as string[]:undefined;
  const summary={...summarizeDiagnoses(reports,planned),manifest:loaded.source,paths};
  await writeFile(resolve(output,"summary.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});
  const width=Math.max(1,...summary.sameCaseAttempts.map(c=>c.attempts.length));
  const attemptsTable=`| 用例 | ${Array.from({length:width},(_,i)=>`第${i+1}次`).join(" | ")} |\n| --- | ${Array.from({length:width},()=>"---").join(" | ")} |\n`+summary.sameCaseAttempts.map(c=>{
    const attempts=rows(c.attempts);
    return `| ${c.caseId} | ${Array.from({length:width},(_,i)=>{const a=attempts[i];return a?`${a.runId}: ${record(a.outcome).type??"未评"}; ${record(a.firstPoint).stage??record(a.firstPoint).status}`:"—";}).join(" | ")} |`;
  }).join("\n");
  const markdown=`# 跨运行诊断汇总\n\n只读已有产物；不改判定，不设体验门槛。时间口径 CET。版本/Gold分层与原分母依据一并保留；总体分布仅描述，不代表不同版本可比。\n\n## 分母\n\n\x60\x60\x60json\n${JSON.stringify({counts:summary.denominators,definitions:summary.denominatorNotes},null,2)}\n\x60\x60\x60\n\n## 首点 × 严重程度\n\n| 首点 × 严重程度 | 次数 | 运行 ID |\n| --- | --- | --- |\n${summary.firstPointBySeverity.map(c=>`| ${c.cell} | ${c.count} | ${c.runIds.join(", ")} |`).join("\n")}\n\n## 同用例多次运行\n\n${attemptsTable}\n\n版本/Gold分层：\n\n\x60\x60\x60json\n${JSON.stringify(summary.cohorts,null,2)}\n\x60\x60\x60\n\n## 体验分布\n\n\x60\x60\x60json\n${JSON.stringify(summary.experience,null,2)}\n\x60\x60\x60\n`;
  await writeFile(resolve(output,"summary.md"),markdown,{flag:"wx"});return summary;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const [manifest,output]=process.argv.slice(2);if(!manifest||!output)throw Error("Usage: files.ts <frozen-diagnosis-inputs.json> <new-output-directory>");
  console.log(JSON.stringify(await generateRecordedDiagnoses(manifest,output),null,2));
}
