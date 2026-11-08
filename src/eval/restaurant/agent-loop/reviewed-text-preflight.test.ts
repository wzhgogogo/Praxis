import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {evaluateG6,type G6EvaluationInput} from "./g6/evaluator.js";
import {parseReviewedReads} from "./diagnostic-evaluator-network.js";

test("actual D8 four text preflights match independently approved exact contracts, with boundary negatives",async()=>{
 const f=JSON.parse(await readFile(new URL("./fixtures/d8-text-preflights-20261108.json",import.meta.url),"utf8"));
 const catalog=parseReviewedReads(await readFile(new URL("./cases/reviewed-public-reads.json",import.meta.url)),"independent-literal-catalog");
 const rules=catalog.rules.map((r,i)=>({ref:`literal:${i}`,origin:r.origin,...(r.pathname?{pathname:r.pathname}:{}),...(r.pathnamePattern?{pathnamePattern:r.pathnamePattern}:{}),methods:r.methods,
  queryKeys:[...r.queryKeyRules?.required??[],...r.queryKeyRules?.allowed??[],...r.queryKeyRules?.repeatable??[]],requiredQueryKeys:r.queryKeyRules?.required??[],...(r.bodyFields?{bodyFields:r.bodyFields}:{}),...(r.corsPreflight?{corsPreflight:r.corsPreflight}:{})}));
 assert.equal(f.requests.length,4);
 for(const recorded of f.requests)for(const mode of ["VALID","EXTRA_KEY","MISSING_KEY","WRONG_ORIGIN","WRONG_PATH","POST","WRONG_HEADER","WRONG_REQUEST_ORIGIN","BODY"]){
  const r=structuredClone(recorded);
  if(mode==="EXTRA_KEY")r.queryKeys.push("unreviewed");if(mode==="MISSING_KEY")r.queryKeys=r.queryKeys.filter((k:string)=>k!=="hits");
  if(mode==="WRONG_ORIGIN")r.url=r.url.replace("search-v4.production.ap-northeast-1.aws.tablecheck.net","unreviewed.example");
  if(mode==="WRONG_PATH")r.url=r.url.replace("/search/","/other/");if(mode==="POST")r.method="POST";
  if(mode==="WRONG_HEADER")r.preflight.headerNames.push("authorization");if(mode==="WRONG_REQUEST_ORIGIN")r.preflight.requestOrigin="https://other.example";if(mode==="BODY")r.preflight.bodyBytes=1;
  const input:G6EvaluationInput={runId:"actual-D8-component",caseId:"D8",mode:"LIVE_READ",artifactRefs:[f.sha256],request:{dates:[]},requests:[r],reviewedReadRules:rules,delivered:[],handoffs:[],answers:[],pages:[],vacancy:[],boundedNoResult:true};
  assert.equal(evaluateG6(input).checks.find(c=>c.rule==="REQUEST_BOUNDARY")?.status,mode==="VALID"?"PASS":"FAIL",recorded.ref+":"+mode);
 }
});
