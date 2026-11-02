import { mkdir,readFile,writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join,resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ModelRequest,ModelResponse } from "../../../../core/model/contracts.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { runG6DevelopmentPreflight } from "../g6-development-preflight.js";
import { chargeG6 } from "./budget.js";

interface ReplayRow {id:string;path:string;variant:number;turn:string;request:ModelRequest;expected:Record<string,unknown>;}
interface ReplayPack {schemaVersion:"phase3b-g6-decision-replay@1";provenance:string;rows:ReplayRow[];skipped:Array<{path:string;reason:string}>;}
const digest=(raw:string|Buffer)=>createHash("sha256").update(raw).digest("hex");
/** Fixed contexts come from successful real composition, never private holdout inputs. */
export async function prepareReplay(directory:string){
  await mkdir(directory,{recursive:false});const rows:ReplayRow[]=[],skipped:ReplayPack["skipped"]=[];
  for(const [path,variant] of [["P1",0],["P1",1],["P1",2],["P2",0],["P3",0],["P4",0]] as const){
    const capture=join(directory,`${path}-${variant}`);await mkdir(capture);
    try{await runG6DevelopmentPreflight(capture,path,variant);}catch{skipped.push({path:`${path}-${variant}`,reason:"SCRIPTED_COMPOSITION_RED; original preflight.json retained"});continue;}
    const record=JSON.parse(await readFile(join(capture,"preflight.json"),"utf8")) as {requests:Array<{turn:string;request:ModelRequest;response:ModelResponse}>};
    for(const [i,r] of record.requests.entries()){
      // Freeze one expected business action, or the independent local source
      // grounding for non-Agent transport. No real result is used to edit it.
      const body=JSON.parse(r.response.outputText) as Record<string,unknown>;
      const expected=r.request.purpose==="restaurant_agent_decide"?{action:body.action,...(body.candidateId?{candidateId:body.candidateId}:{}),...(Array.isArray(body.candidateIds)&&body.candidateIds.length?{candidateIds:body.candidateIds}:{}),...(body.action==="ASK_USER"?{asks:r.turn==="INITIAL"&&path==="P3"?"DATE":"PARTY"}:{})}
        :r.request.purpose==="restaurant_page_question"?{status:"ANSWERED",literalQuote:"A private room is available for groups of four or more."}
        :r.request.purpose==="restaurant_semantic_interpret"?{schemaVersion:"4",facts:body.facts}
        :r.request.purpose==="browser_read_decide"?{action:"COMPLETE"}:{selections:[]};
      rows.push({id:`${path}-${variant}-${i+1}`,path,variant,turn:r.turn,request:r.request,expected});
    }
  }
  const pack:ReplayPack={schemaVersion:"phase3b-g6-decision-replay@1",provenance:"LOCAL_CONSTRUCTION; current production Prompt/Schema captured through createLiveReadAssembly. Fixed-context transport replay, not live autonomous trajectory.",rows,skipped};
  const raw=JSON.stringify(pack,null,2)+"\n",path=join(directory,"inputs.json");await writeFile(path,raw,{flag:"wx"});await writeFile(join(directory,"inputs.sha256.json"),JSON.stringify({path,sha256:digest(raw),rows:rows.length,maximumPhysicalCalls:80},null,2)+"\n",{flag:"wx"});return {path,sha256:digest(raw),rows:rows.length,skipped};
}
function record(value:unknown):Record<string,unknown>{return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};}
/** Independent, deliberately narrow checks; novel wording remains for reviewer. */
export function checkReplay(row:ReplayRow,outputText:string){
  let body:Record<string,unknown>;try{body=record(JSON.parse(outputText));}catch{return {status:"FAIL",action:null,reason:"INVALID_JSON",s0:false};}
  const e=row.expected;let passed=true,reason="Within frozen acceptable decision/grounding";let s0=false;
  if(e.action){passed=body.action===e.action;
    if(e.candidateId&&body.candidateId!==e.candidateId){passed=false;s0=body.action==="SELECT_CANDIDATE";}
    if(e.candidateIds&&JSON.stringify(body.candidateIds)!==JSON.stringify(e.candidateIds))passed=false;
    if(e.asks){const q=String(body.question??"");passed=passed&&(e.asks==="DATE"?/date|which day|what day/iu.test(q):/people|guests|party|how many/iu.test(q));}
    if(!passed)reason="Action/selected outlet/requested clarification differs from frozen expectation";
  }else if(e.status){
    const payload=record(JSON.parse(row.request.messages.find(m=>m.role==="user")!.content)),documents=payload.sourceDocuments as Array<{id:string;statements:Array<{id:string;text:string}>}>;
    const citations=Array.isArray(body.citations)?body.citations.map(record):[];
    passed=body.status==="ANSWERED"&&citations.length>0&&citations.every(c=>c.quote===e.literalQuote&&documents.some(d=>d.id===c.documentId&&d.statements.some(s=>s.id===c.statementId&&s.text===c.quote)));
    s0=citations.some(c=>!documents.some(d=>d.id===c.documentId&&d.statements.some(s=>s.id===c.statementId&&s.text===c.quote)))||/\bguaranteed|safe for allergies\b/iu.test(String(body.answer??""));
    reason=passed?"Literal same-page grounding; answer paraphrase still requires reviewer":"Answer/quote does not match frozen same-page evidence";
  }else if(e.facts){
    const expected=(e.facts as Array<{field:string;value:Record<string,unknown>}>),actual=Array.isArray(body.facts)?body.facts.map(record):[];
    // Exact values only for dates/guests/time. Target wording remains reviewer
    // assessed; it must keep goal and selection scope from this user turn.
    passed=body.schemaVersion==="4"&&expected.every(f=>actual.some(a=>{const v=record(a.value);return a.field===f.field&&(f.field==="TARGET"?v.goal===f.value.goal&&v.selectionScope===f.value.selectionScope:f.field==="AREA"?typeof v.query==="string":Object.entries(f.value).filter(([k])=>!["raw","source"].includes(k)).every(([k,vv])=>v[k]===vv));}));
    const expectedDate=expected.find(f=>f.field==="DATE");if(!expectedDate&&actual.some(a=>a.field==="DATE")){passed=false;s0=true;reason="User supplied no date in this turn; model invented a date";}
    if(!passed&&!s0)reason="Semantic fields differ from frozen explicit user/source requirements; reviewer to inspect";
  }else{passed=Array.isArray(body.selections)&&body.selections.length===0;reason=passed?"No unsupported merchant fact selected":"Unexpected fact selections need review";}
  return {status:passed?"PASS":"FAIL",action:body.action??body.status??"SEMANTIC_OR_FACT_SELECTION",reason,s0};
}

export async function runReplay(input:string,sha256:string,directory:string,environment:NodeJS.ProcessEnv){
  const raw=await readFile(input);if(digest(raw)!==sha256)throw Error("Replay input SHA mismatch");const pack=JSON.parse(raw.toString()) as ReplayPack;
  if(pack.schemaVersion!=="phase3b-g6-decision-replay@1"||pack.rows.length>80)throw Error("Replay pack exceeds approved physical-call budget");
  await mkdir(directory,{recursive:false});const invocation=`g6-replay-${Date.now()}`,ledger=resolve(".eval-artifacts/phase3b/budget.json");let physical=0;
  const gateway=DeepSeekModelGateway.fromEnvironment(environment,{fetchImplementation:async(url,init)=>{
    if(++physical>80)throw Error("Approved replay allowance exhausted before transmission");
    await chargeG6(ledger,`${invocation}:${physical}`,"realModelCalls","G6 frozen fixed-context decision replay; no schema/transport retry");
    return fetch(url,init);
  }});
  const results:Array<Record<string,unknown>>=[];
  for(const row of pack.rows){
    const startedAt=new Date().toISOString();let result:Record<string,unknown>;
    try{const response=await gateway.complete(row.request),serialized=JSON.stringify(response);
      if(environment.DEEPSEEK_API_KEY&&serialized.includes(environment.DEEPSEEK_API_KEY))throw Error("OWN_CREDENTIAL_REJECTED");
      result={id:row.id,path:row.path,variant:row.variant,turn:row.turn,purpose:row.request.purpose,startedAt,response,check:checkReplay(row,response.outputText)};
    }catch(error){result={id:row.id,path:row.path,variant:row.variant,turn:row.turn,purpose:row.request.purpose,startedAt,error:error instanceof Error?error.name:"TRANSPORT_ERROR",check:{status:"FAIL",reason:"Transport/provider failure; no retry",s0:false}};}
    results.push(result);await writeFile(join(directory,row.id+".json"),JSON.stringify(result,null,2)+"\n",{flag:"wx"});
    console.log(JSON.stringify({id:row.id,purpose:row.request.purpose,check:result.check,physicalCalls:physical}));
    if(record(result.check).s0){await writeFile(join(directory,"stopped.json"),JSON.stringify({reason:"S0_CANDIDATE_FOR_REVIEW",row:row.id})+"\n");break;}
  }
  const summary={schemaVersion:pack.schemaVersion,inputSHA256:sha256,physicalCalls:physical,live:0,publicGET:0,results,skipped:pack.skipped,unexecuted:pack.rows.slice(results.length).map(r=>r.id)};
  await writeFile(join(directory,"report.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});return {physicalCalls:physical,executed:results.length,unexecuted:summary.unexecuted.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [mode,input,sha,out]=process.argv.slice(2);
  const work=mode==="prepare"&&input?prepareReplay(resolve(input)):mode==="run"&&input&&sha&&out?runReplay(resolve(input),sha,resolve(out),process.env):Promise.reject(Error("Usage: replay.ts prepare <new-dir> | run <inputs> <sha256> <new-output-dir>"));
  work.then(x=>console.log(JSON.stringify(x))).catch(()=>{console.error("G6 decision replay stopped; inspect preserved safe evidence");process.exitCode=1;});
}
