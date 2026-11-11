import { mkdir,writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { chargeG6 } from "./budget.js";
import { independentVacancy,type G6Delivered,type G6Vacancy } from "./evaluator.js";

export interface G6Witness extends G6Delivered {detailUrl:string;identityText:string[];allowDetailOnlyCertificate?:boolean;/** Explicit exposed diagnostic only; never a positive feasibility witness. */allowKnownUnavailableCertificate?:true;}
export interface WitnessReceipt {checkedAt:string;kind:string;target:G6Witness;exists:boolean|null;vacancy?:G6Vacancy;evidenceMode?:"AVAILABILITY"|"DETAIL_ONLY";detailRef?:string;detailSHA256?:string;responseSHA256:string;}
export function witnessURL(w:G6Delivered){
  const id=w.sourceEntityId.match(/(?:^|\/)(\d+)\/?$/u)?.[1];if(!id)throw Error("Witness must use an observed numeric Tabelog source identity");
  const u=new URL("https://tabelog.com/en/booking/calendar/find_vacancy");u.searchParams.set("rst_id",id);u.searchParams.set("svd",w.date.replaceAll("-",""));u.searchParams.set("svps",String(w.partySize));u.searchParams.set("svt",w.time.replace(":",""));return u.toString();
}
export function createWitnessReader(input:{directory:string;budgetPath:string;runId:string;fetch:typeof fetch;now?:()=>number;wait?:(ms:number)=>Promise<void>;minIntervalMs?:number;requestTiming?:{last:number};beforeGET?:()=>void|Promise<void>;sanitizeResponse?:(text:string)=>string|undefined}){
  let lastResponse:{checkedAt:string;responseSHA256:string;status:number;bodyRef:string|null;recording:"SAVED"|"OMITTED"}|undefined;
  let count=0;const timing=input.requestTiming??{last:-Infinity};const now=input.now??Date.now,wait=input.wait??(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
  const interval=input.minIntervalMs??5000;
  async function get(url:string,name:string){
    const u=new URL(url);if(u.origin!=="https://tabelog.com"||!u.pathname.startsWith("/en/")||u.username||u.password||u.hash||/booking\/form|yoyaku|confirm|pay|checkout/iu.test(u.pathname))throw Error("Witness GET must stay on public https://tabelog.com/en pages");
    const elapsed=now()-timing.last;if(elapsed<interval)await wait(interval-elapsed);
    await input.beforeGET?.();
    await chargeG6(input.budgetPath,`${input.runId}:GET:${++count}`,"evaluationPublicGET",name+"; public credential-free GET, no retry");
    timing.last=now();const response=await input.fetch(url,{method:"GET",redirect:"manual",credentials:"omit",headers:{accept:"text/html,application/json"},signal:AbortSignal.timeout(20_000)});
    const raw=new Uint8Array(await response.arrayBuffer());if(raw.byteLength>8_000_000)throw Error("Public witness response exceeds frozen8MB limit");
    const path=join(input.directory,`${String(count).padStart(3,"0")}-${name}.body`),text=new TextDecoder().decode(raw);
    const sha256=createHash("sha256").update(raw).digest("hex"),checkedAt=new Date(now()).toISOString();
    const saved=input.sanitizeResponse?input.sanitizeResponse(text):text;
    lastResponse={checkedAt,responseSHA256:sha256,status:response.status,bodyRef:saved===undefined?null:path,recording:saved===undefined?"OMITTED":"SAVED"};
    await mkdir(input.directory,{recursive:true});if(saved!==undefined)await writeFile(path,input.sanitizeResponse?saved:raw,{flag:"wx",mode:0o600});
    await writeFile(path+".json",JSON.stringify({url,status:response.status,checkedAt,sha256,bytes:raw.byteLength,cookiesSent:false,retried:false,
      ...(input.sanitizeResponse?{recording:lastResponse.recording,savedSHA256:saved===undefined?null:createHash("sha256").update(saved).digest("hex")}:{} )},null,2)+"\n",{flag:"wx",mode:0o600});
    if(response.status!==200)throw Error("Witness GET status "+response.status+"; stopped without retry");return {path,sha256,text};
  }
  return {get count(){return count;},get lastResponse(){return lastResponse;},async readDetail(target:G6Witness,kind:"BEFORE"|"NO_DELIVERY_AFTER"):Promise<WitnessReceipt>{
    if(!target.allowDetailOnlyCertificate)throw Error("This witness requires availability certification");
    const detail=await get(target.detailUrl,"detail");if(!target.identityText.length||!target.identityText.every(s=>detail.text.includes(s)))throw Error("Public witness identity could not be certified");
    return {checkedAt:new Date(now()).toISOString(),kind,target,exists:null,evidenceMode:"DETAIL_ONLY",detailRef:detail.path,detailSHA256:detail.sha256,responseSHA256:detail.sha256};
  },async read(target:G6Witness,kind:"BEFORE"|"AFTER"|"NO_DELIVERY_AFTER",detail=true):Promise<WitnessReceipt>{
    let identity:Awaited<ReturnType<typeof get>>|undefined;
    if(detail){identity=await get(target.detailUrl,"detail");if(!target.identityText.length||!target.identityText.every(s=>identity!.text.includes(s)))throw Error("Public witness identity could not be certified");}
    const response=await get(witnessURL(target),"vacancy");let body:unknown;try{body=JSON.parse(response.text);}catch{throw Error("Witness response is not public JSON");}
    const vacancy:G6Vacancy={ref:response.path,phase:kind,url:witnessURL(target),candidateId:target.candidateId,body};const observed=independentVacancy(vacancy,target);
    if(!observed.known)throw Error(observed.reason);return {checkedAt:new Date(now()).toISOString(),kind,target,evidenceMode:"AVAILABILITY",exists:observed.slots.includes(target.time),vacancy,responseSHA256:response.sha256,...(identity?{detailRef:identity.path,detailSHA256:identity.sha256}:{})};
  }};
}
