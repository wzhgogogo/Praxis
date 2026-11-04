import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp,mkdir,readFile,writeFile,rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join,resolve } from "node:path";
import { developmentPack,developmentRequestSHA } from "./development-pack.js";
import { main as runLiveCLI } from "./run-g6.js";
import { captureDevelopmentWitnesses,importDevelopmentEvidence,type DevelopmentEvidence } from "./development-evidence.js";
import { recertifyW2 } from "./recertify-w2.js";
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");

test("G6 reviewed evidence import binds original bodies, attempts and targets without changing any frozen user turn",async()=>{
  // LOCAL_CONSTRUCTION of the evidence-file format, never public certification.
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-evidence-format-"));
  const pack=developmentPack(),packSHA=sha(JSON.stringify(pack)),getRecords:DevelopmentEvidence["getRecords"]=[],certificates:DevelopmentEvidence["certificates"]=[];
  try{
    for(const w of [pack.cases[0]!.witness!,pack.cases[1]!.witness!]){
      const detail=join(dir,w.sourceEntityId+"-detail.body"),detailBody="LOCAL_CONSTRUCTION "+w.name+" "+w.identityText.join(" ")+" 03-1234-5678";await writeFile(detail,detailBody);getRecords.push({path:detail,sha256:sha(detailBody)});
      const vacancy=join(dir,w.sourceEntityId+"-vacancy.body"),body={base_date:{year:2026,month:11,day:11},members:2,selection:[{time:"19:00"}]},text=JSON.stringify(body);await writeFile(vacancy,text);getRecords.push({path:vacancy,sha256:sha(text)});
      certificates.push({checkedAt:"2026-11-03T06:00:00.000Z",kind:"BEFORE",target:w,exists:true,evidenceMode:"AVAILABILITY",detailRef:detail,detailSHA256:sha(detailBody),responseSHA256:sha(text),vacancy:{ref:vacancy,phase:"BEFORE",url:`https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=${w.sourceEntityId}&svd=20261111&svps=2&svt=1900`,candidateId:w.candidateId,body}});
    }
    const tc=join(dir,"tablecheck-identity.body");await writeFile(tc,"LOCAL_CONSTRUCTION phone comparison");getRecords.push({path:tc,sha256:sha("LOCAL_CONSTRUCTION phone comparison")});
    const capture=join(dir,"capture.json"),raw=JSON.stringify({publicGETAttempts:5});await writeFile(capture,raw);
    const evidence:DevelopmentEvidence={schemaVersion:"g6-development-evidence@1",packSHA256:packSHA,reviewed:true,reviewer:"LOCAL_CONSTRUCTED_TEST_REVIEW",reviewedAt:"2026-11-03T06:01:00Z",identityChecks:{name:true,address:true,phone:true},w2ConfirmedNoOnline:false,publicGETAttempts:5,captureRef:capture,captureSHA256:sha(raw),getRecords,certificates,oracles:Object.fromEntries(pack.cases.map(c=>[c.id,{pages:[],qualificationOracles:[{name:c.witness!.name,address:c.witness!.address!,phone:"03-1234-5678",hardCriteriaMet:true,withinArea:true,evidenceRefs:[certificates.find(r=>r.target.sourceEntityId===c.witness!.sourceEntityId)!.detailRef!]}]}]))};
    const path=join(dir,"review.json");const save=async()=>{const b=JSON.stringify(evidence);await writeFile(path,b);return sha(b);};const now=Date.parse("2026-11-03T06:02:00Z");
    const approved=await importDevelopmentEvidence(pack,packSHA,path,await save(),now);assert.equal(developmentRequestSHA(approved.pack),developmentRequestSHA(pack));assert.equal(approved.initialWitnessGETs,5);
    const extended={...pack,witnessGETLimit:25};const extendedSHA=sha(JSON.stringify(extended));
    evidence.packSHA256=extendedSHA;evidence.publicGETAttempts=25;const cap25=JSON.stringify({publicGETAttempts:25});await writeFile(capture,cap25);evidence.captureSHA256=sha(cap25);
    const atLimit=await importDevelopmentEvidence(extended,extendedSHA,path,await save(),now);assert.equal(atLimit.initialWitnessGETs,25);
    evidence.publicGETAttempts=26;const cap26=JSON.stringify({publicGETAttempts:26});await writeFile(capture,cap26);evidence.captureSHA256=sha(cap26);
    await assert.rejects(importDevelopmentEvidence(extended,extendedSHA,path,await save(),now),/count/u);
    evidence.packSHA256=packSHA;evidence.publicGETAttempts=5;await writeFile(capture,raw);evidence.captureSHA256=sha(raw);
    evidence.reviewed=false;await assert.rejects(importDevelopmentEvidence(pack,packSHA,path,await save(),now),/review is required/u);evidence.reviewed=true;
    const original=certificates[0]!.vacancy!.body;certificates[0]!.vacancy!.body={base_date:{year:2026,month:11,day:11},members:2,selection:[{time:"19:00"},{time:"20:00"}]};await assert.rejects(importDevelopmentEvidence(pack,packSHA,path,await save(),now),/not available/u);certificates[0]!.vacancy!.body=original;
    const correct=certificates[1]!.target.detailUrl;certificates[1]!.target={...certificates[1]!.target,detailUrl:"https://tabelog.com/en/tokyo/A1301/A130101/13219563/"};await assert.rejects(importDevelopmentEvidence(pack,packSHA,path,await save(),now),/target\/body binding/u);certificates[1]!.target={...certificates[1]!.target,detailUrl:correct};
    await assert.rejects(importDevelopmentEvidence(pack,packSHA,path,await save(),now+86_400_000),/outside24h/u);
  }finally{await rm(dir,{recursive:true,force:true});}
});


test("G6 declared25 ceiling still requires reviewed evidence before credential construction",async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-cli-evidence-"));const previous=process.env.GOOGLE_MAPS_API_KEY;delete process.env.GOOGLE_MAPS_API_KEY;
  try{const body=JSON.stringify({...developmentPack(),witnessGETLimit:25}),path=join(dir,"pack.json");await writeFile(path,body);
    await assert.rejects(runLiveCLI(["--pack",path,"--sha256",sha(body),"--record-browser","--record-decisions","--output",join(dir,"never-run")]),/Missing --evidence/u);
  }finally{if(previous===undefined)delete process.env.GOOGLE_MAPS_API_KEY;else process.env.GOOGLE_MAPS_API_KEY=previous;await rm(dir,{recursive:true,force:true});}
});

test("G6 public GET collector preserves the original cause code and message without retry",{timeout:15000},async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-cause-")),budget=join(dir,"budget.json");await writeFile(budget,JSON.stringify({entries:[],limits:{evaluationPublicGET:25},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}}));let calls=0,clock=Date.now();
  try{const cause=Object.assign(new Error("Local transport failure"),{code:"LOCAL_TEST_CAUSE"});const transport:typeof fetch=async()=>{calls++;throw new TypeError("fetch failed",{cause});};
    const result=await captureDevelopmentWitnesses(developmentPack(),"local-pack",join(dir,"capture"),transport,budget,{now:()=>clock,wait:async(ms:number)=>{clock+=ms;}});
    const record=JSON.parse(await readFile(join(dir,"capture/capture.json"),"utf8"));assert.equal(calls,3);assert.equal(result.publicGETAttempts,3);
    for(const failure of record.failures){assert.equal(failure.detail.name,"TypeError");assert.equal(failure.detail.message,"fetch failed");assert.equal(failure.detail.cause.code,"LOCAL_TEST_CAUSE");assert.equal(failure.detail.cause.message,"Local transport failure");}
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("G6 W2 certification requires all five continuation slots to clear, preserving historical D1 without rerun",async()=>{
  // LOCAL_CONSTRUCTION: public response shape and temporary budget, never a website replay.
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-w2-continuation-")),originalFetch=globalThis.fetch;let calls=0;
  const put=async(name:string,value:unknown)=>{const path=join(dir,name),raw=JSON.stringify(value);await writeFile(path,raw);return {path,sha:sha(raw)};};
  try{
    const all=developmentPack(),cases=all.cases.filter(c=>["D2","D8"].includes(c.id)).map(c=>({...c,witness:{...c.witness!,time:"20:00"},oracle:{...c.oracle,request:{...c.oracle.request,time:"20:00"}}}));
    const pack=await put("pack.json",{...all,witnessGETLimit:25,cases}),detail=await put("detail.body",{LOCAL_CONSTRUCTION:"same outlet public detail"});
    const template=await put("template.json",{schemaVersion:"g6-development-evidence@1",getRecords:[{path:detail.path,sha256:detail.sha}],oracles:{}});
    const budget=await put("budget.json",{entries:[],limits:{evaluationPublicGET:390},cumulative:{evaluationPublicGET:262,restaurantWebsiteRequests:0}});
    const previous=join(dir,"previous.json"),ids=["D3","D4","D5","D6","D7"];
    const previousValue={witnessGETs:7,stopReason:null as string|null,slots:ids.map(id=>({id,status:"EVALUATED"}))};
    const config=await put("config.json",{pack:pack.path,packSHA256:pack.sha,template:template.path,templateSHA256:template.sha,budget:budget.path,publicGETBaseline:255,ceiling:25,previousBatch:previous,output:join(dir,"capture"),detailRef:detail.path,detailSHA256:detail.sha,detailCheckedAt:new Date().toISOString()});
    globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({base_date:{year:2026,month:11,day:11},members:2,selection:[{time:"20:00"}]}),{status:200});};
    await writeFile(previous,JSON.stringify({...previousValue,stopReason:"S0_STOP"}));await assert.rejects(recertifyW2(config.path,config.sha),/not cleared/u);assert.equal(calls,0);
    await writeFile(previous,JSON.stringify({...previousValue,slots:previousValue.slots.slice(1)}));await assert.rejects(recertifyW2(config.path,config.sha),/not cleared/u);assert.equal(calls,0);
    await writeFile(previous,JSON.stringify(previousValue));const result=await recertifyW2(config.path,config.sha);assert.equal(result.status,"CERTIFIED");assert.equal(result.publicGETAttempts,8);assert.equal(calls,1);
    const ledger=JSON.parse(await readFile(budget.path,"utf8"));assert.equal(ledger.cumulative.evaluationPublicGET,263);
    const receipt=JSON.parse(await readFile(join(dir,"capture/execution-evidence.json"),"utf8"));assert.equal(receipt.certificates[0].target.time,"20:00");assert.deepEqual(receipt.getRecords[0],{path:detail.path,sha256:detail.sha});
  }finally{globalThis.fetch=originalFetch;await rm(dir,{recursive:true,force:true});}
});
