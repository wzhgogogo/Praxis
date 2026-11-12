import assert from 'node:assert/strict';
import {sanitizePublicJson} from '/private/tmp/praxis-browser-strict-fix/src/eval/restaurant/agent-loop/runners/browser-read-recording.ts';
import {join} from 'node:path';
let calls=0,fail=true;const rows:string[]=[];const output='/offline';
const error=Object.assign(new Error('simulated provider rejection'),{code:'PROVIDER_REJECTED',providerStatus:400,providerError:{code:'invalid_request_error',type:'schema',message:'Missing required field.'}});
const response={outputText:'fixture',finishReason:'TOOL_CALLS'};
const deps:any={transports:async()=>({model:{async complete(){calls++;if(fail)throw error;return response;}}})};
const capture={accept:()=>true,rejectsRecording:false};
const appendFile=async(_p:string,s:string)=>{rows.push(s);};
 // Observation only: preserve sanitized typed provider diagnostics; never
 // issue a replacement call, alter a model request, or swallow its failure.
 const originalTransports=deps.transports;
 deps.transports=async(...args:any[])=>{
  const t=await originalTransports(...args),originalModel=t.model;
  return {...t,model:{async complete(request:any){
   try{return await originalModel.complete(request);}catch(error){
    try{
     const e=error as {code?:string;providerStatus?:number;providerError?:{code?:string;type?:string;message?:string}};
     const data={atUTC:new Date().toISOString(),purpose:request.purpose,schemaVersion:request.outputSchema.version,errorCode:e.code??'UNKNOWN',providerStatus:Number.isInteger(e.providerStatus)?e.providerStatus:null};
     const detail=e.providerError?Object.fromEntries(Object.entries(e.providerError).filter(([k,v])=>['code','type','message'].includes(k)&&typeof v==='string').map(([k,v])=>[k,(v as string).slice(0,160)])):null;
     const full=JSON.stringify({...data,detail}),safe=sanitizePublicJson(full)??sanitizePublicJson(JSON.stringify({...data,detailOmitted:true}));
     if(safe&&capture.accept(safe,'RESPONSE')&&!capture.rejectsRecording)await appendFile(join(output!,'provider-failures.jsonl'),safe+'\n');
    }catch{/* Auxiliary diagnostics must never change the original result. */}
    throw error;
   }
  }}};
 };

const t=await deps.transports();const request={purpose:'browser_read_decide',outputSchema:{version:'16'}};
await assert.rejects(t.model.complete(request),(e:unknown)=>e===error);assert.equal(calls,1);assert.equal(rows.length,1);assert.equal(JSON.parse(rows[0]!).providerStatus,400);
fail=false;assert.equal(await t.model.complete(request),response);assert.equal(calls,2);assert.equal(rows.length,1);
fail=true;error.providerError.message='contact@example.invalid';await assert.rejects(t.model.complete(request),(e:unknown)=>e===error);assert.equal(calls,3);assert.equal(JSON.parse(rows[1]!).detailOmitted,true);assert.equal(rows[1]!.includes('@'),false);
console.log(JSON.stringify({mode:'OFFLINE_TRANSPORT_FIXTURE',passed:true,sameRequestAndErrorPreserved:true,oneInvocationPerRequest:true,unsafeErrorSummaryOmitted:true,realModelCalls:0,websiteGET:0}));
