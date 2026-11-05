import { readFile,writeFile,rename } from "node:fs/promises";
import { dirname,join } from "node:path";
import { randomUUID } from "node:crypto";

export type G6Charge="realModelCalls"|"fullLive"|"evaluationPublicGET"|"environmentReruns";
const writers=new Map<string,Promise<void>>();
/** Reload/append by unique id immediately before transmission; failed attempts consume quota. */
export async function chargeG6(path:string,id:string,kind:G6Charge,note:string,developmentModel=false){
  const previous=writers.get(path)??Promise.resolve();let release!:()=>void;
  const current=new Promise<void>(r=>{release=r;});writers.set(path,current);await previous;
  try{return await appendCharge(path,id,kind,note,developmentModel);}finally{release();if(writers.get(path)===current)writers.delete(path);}
}
async function appendCharge(path:string,id:string,kind:G6Charge,note:string,developmentModel:boolean){
  const ledger=JSON.parse(await readFile(path,"utf8")) as {entries:Array<{id:string;realModelCalls?:number}>;limits:Record<G6Charge,number>;cumulative:Record<G6Charge,number>;[key:string]:unknown};
  if(ledger.entries.some(e=>e.id===id))throw Error("Duplicate budget attempt id; no request was sent");
  const used=ledger.cumulative[kind];if(!Number.isSafeInteger(used)||used>=ledger.limits[kind])throw Error("Shared "+kind+" budget exhausted before request");
  if(developmentModel){
    // D1–D8 is the already frozen development batch. Include its existing
    // immutable rows, including failed calls, rather than resetting at a new pack/turn.
    const developmentId=/^g6-D[1-8][:-].*:MODEL:\d+$/u;
    if(kind!=="realModelCalls"||!developmentId.test(id))throw Error("Invalid development model charge");
    const consumed=ledger.entries.filter(e=>developmentId.test(e.id)).reduce((n,e)=>n+(e.realModelCalls??0),0);
    if(!Number.isSafeInteger(consumed)||consumed>=400)throw Error("G6 development model ceiling 400 exhausted before request");
  }
  const row={id,conversation:typeof ledger.conversation==="string"?ledger.conversation:"A",recordedAtUTC:new Date().toISOString(),mode:"G6_CONTROLLED_ATTEMPT",fullLive:0,realModelCalls:0,evaluationPublicGET:0,environmentReruns:0,...(kind==="evaluationPublicGET"?{restaurantWebsiteRequests:1}:{}),[kind]:1,note};
  ledger.entries.push(row);ledger.cumulative[kind]=used+1;
  if(kind==="evaluationPublicGET"){
    const counts=ledger.cumulative as Record<string,number>;if(Number.isSafeInteger(counts.restaurantWebsiteRequests))counts.restaurantWebsiteRequests!+=1;
  }
  const temp=join(dirname(path),".g6-budget-"+randomUUID()+".tmp");await writeFile(temp,JSON.stringify(ledger,null,2)+"\n",{flag:"wx",mode:0o600});await rename(temp,path);
  return row;
}

/** Observed source I/O totals; model and public-witness attempts were charged individually. */
export async function recordG6SourceCounts(path:string,id:string,googleRequests:number,restaurantWebsiteRequests:number){
  const previous=writers.get(path)??Promise.resolve();let release!:()=>void;const current=new Promise<void>(r=>{release=r;});writers.set(path,current);await previous;
  try{
    if(![googleRequests,restaurantWebsiteRequests].every(v=>Number.isSafeInteger(v)&&v>=0))throw Error("Invalid observed I/O count");
    const ledger=JSON.parse(await readFile(path,"utf8"));if(ledger.entries.some((e:{id:string})=>e.id===id))throw Error("Duplicate source-observation budget row");
    ledger.entries.push({id,conversation:typeof ledger.conversation==="string"?ledger.conversation:"A",recordedAtUTC:new Date().toISOString(),mode:"G6_SOURCE_IO_OBSERVATION",fullLive:0,realModelCalls:0,evaluationPublicGET:0,environmentReruns:0,googleRequests,restaurantWebsiteRequests,note:"Actual source transport starts; no quotas charged twice; witness GETs have their own rows."});
    for(const [key,count] of Object.entries({googleRequests,restaurantWebsiteRequests})){if(!Number.isSafeInteger(ledger.cumulative[key]))throw Error("Invalid existing I/O ledger counter");ledger.cumulative[key]+=count;}
    const temp=join(dirname(path),".g6-budget-"+randomUUID()+".tmp");await writeFile(temp,JSON.stringify(ledger,null,2)+"\n",{flag:"wx",mode:0o600});await rename(temp,path);
  }finally{release();if(writers.get(path)===current)writers.delete(path);}
}
