import assert from "node:assert/strict";
import {mkdirSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {startWorkspaceFixture} from "../../src/harness/workspace-fixture-server.ts";

const nativeFetch=globalThis.fetch;
let allowedOrigin;
globalThis.fetch=async(input,init)=>{
  const url=new URL(String(input));
  assert.equal(url.origin,allowedOrigin,"This diagnostic permits only the current localhost Fixture");
  return nativeFetch(input,init);
};
assert.ok(process.argv[2],"Pass a fresh local diagnostic output directory");
const output=resolve(process.argv[2]);
mkdirSync(output,{recursive:true});
const rows=[];
for(const outcome of ["empty","all-sources-failed"]){
  const host=await startWorkspaceFixture({outcome});allowedOrigin=host.baseUrl;
  try{
    const login=await fetch(host.baseUrl+"/api/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accessToken:"workspace-fixture"})});
    assert.equal(login.status,201);
    const cookie=login.headers.get("set-cookie").split(";",1)[0];
    const request=async(path,body)=>fetch(host.baseUrl+path,{headers:{cookie,...(body?{"content-type":"application/json"}:{})},...(body?{method:"POST",body:JSON.stringify(body)}:{})});
    const created=await request("/api/cases",{message:"Dinner for source diagnostic",requestId:crypto.randomUUID(),viewContext:{view:"HOME",comparedCandidateIds:[]}});
    assert.equal(created.status,201);let view=(await created.json()).view;
    const deadline=Date.now()+5000;
    while(view.restaurant.progress.active||!["NO_VERIFIED_RESULT","FAILED"].includes(view.case.phase)){
      assert.ok(Date.now()<deadline,"Fixture did not finish within its diagnostic bound");
      await new Promise(resolve=>setTimeout(resolve,10));
      view=(await(await request("/api/cases/"+encodeURIComponent(view.case.caseId))).json()).view;
    }
    assert.equal(view.case.phase,"NO_VERIFIED_RESULT");
    assert.equal(view.restaurant.readStatus.canContinue,false,"Exhausted and all-failed reads have no continuation");
    assert.equal(view.restaurant.readStatus.canRetry,outcome==="all-sources-failed");
    const response=await request("/api/cases/"+encodeURIComponent(view.case.caseId)+"/another-batch",{taskVersion:view.case.taskVersion,requestId:crypto.randomUUID()});
    const payload=await response.json();
    assert.equal(response.status,400);
    assert.equal(payload.error,"Another batch requires presented results or proven unread work");
    rows.push({outcome,phase:view.case.phase,readStatus:view.restaurant.readStatus,taskVersion:view.case.taskVersion,
      status:response.status,error:payload.error,fixtureModelCalls:host.requests.length,fixtureSourceReads:host.providerCalls.length,
      realModelCalls:0,sourceGET:0,Google:0,Live:0,Holdout:0});
  }finally{await host.close();}
}
writeFileSync(resolve(output,"result.json"),JSON.stringify({mode:"LOCAL_HTTP_FIXTURE",rows,verdict:"EXHAUSTED_AND_FAILED_NOT_CONTINUABLE"},null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({status:"CONFIRMED",cases:rows.map(row=>({outcome:row.outcome,phase:row.phase,status:row.status})),realAPIRequests:0}));
