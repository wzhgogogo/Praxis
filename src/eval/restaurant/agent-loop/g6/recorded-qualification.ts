import{bindFrozenOracleSources}from'./oracle-source-binding.js';
import{readFile,readdir}from'node:fs/promises';
import{join}from'node:path';
import{createHash}from'node:crypto';
import{observedGoogleIdentities,observedQualificationEvidence,type ObservedGoogleIdentity}from'./qualification-evidence.js';
import{independentVisibleText}from'./source-document.js';
import{evaluateG6,type G6EvaluationInput}from'./evaluator.js';
import type{RestaurantCaseView}from'../../../../application/agent-workspace.js';
/** Supplement saved artifacts only. Original evaluation, Guard rows and product
 * HIGH/AVAILABLE decisions are never sources for the new source annotations. */
export async function supplementRecordedQualification(slot:string, supplied?:G6EvaluationInput){
 const input=supplied?structuredClone(supplied):JSON.parse(await readFile(join(slot,'evaluation.input.json'),'utf8'))as G6EvaluationInput;
 const execution=JSON.parse(await readFile(join(slot,supplied?.executionFailure?'failure.json':'execution.result.json'),'utf8'))as {view:RestaurantCaseView};
 const trace=JSON.parse(await readFile(join(slot,'browser-trace.json'),'utf8'))as {events:Array<{kind:string;at:string}>};
 const times=trace.events.filter(e=>e.kind==='SNAPSHOT').map(e=>e.at),frames:Array<{page:{url:string;html:string;text:string;title:string};at:string;ref:string}>=[],google:ObservedGoogleIdentity[]=[];
 for(const dir of await readdir(join(slot,'recordings'))){
  const folder=join(slot,'recordings',dir),recording=JSON.parse(await readFile(join(folder,'recording.json'),'utf8'))as {pages:Array<{snapshot:number;url?:string;diagnostic:{status:string;file?:string}}>};
  if(recording.pages.length!==times.length)throw Error('Recorded frame timestamp correspondence missing');
  for(const page of recording.pages){if(page.diagnostic.status!=='SAVED'||!page.diagnostic.file||!page.url)continue;
   const html=await readFile(join(folder,page.diagnostic.file),'utf8');frames.push({page:{url:page.url,html,text:independentVisibleText(html),title:''},at:times[page.snapshot-1]!,ref:`recording-snapshot:${page.snapshot}:sha256:${createHash('sha256').update(html).digest('hex')}`});
  }
  const har=JSON.parse(await readFile(join(folder,'replay.har'),'utf8'))as {log:{entries:Array<{request:{url:string};response:{content:{text?:string}}}>}};
  for(const [i,entry]of har.log.entries.entries())if(new URL(entry.request.url).hostname==='places.googleapis.com'&&entry.response.content.text)google.push(...observedGoogleIdentities(entry.response.content.text,`recorded-google:${i}`));
 }
 const extracted=execution.view?observedQualificationEvidence(execution.view,input.runId,frames,google):{pages:[],claims:[]};
 // Existing literal product claims remain claims. Recover their source text and
 // read times through independent recorded frames; never invent a missing quote.
 input.pages=extracted.pages;input.qualificationClaims=extracted.claims;
 if(input.qualificationOracles)await bindFrozenOracleSources(input.qualificationOracles);
 return {input,evaluation:evaluateG6(input),source:{frames:frames.length,googleResponses:google.length,annotations:extracted.pages.length}};
}
