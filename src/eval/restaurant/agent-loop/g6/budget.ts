import { readFile,writeFile,rename } from "node:fs/promises";
import { dirname,join } from "node:path";
import { randomUUID } from "node:crypto";

export type G6Charge="realModelCalls"|"fullLive"|"evaluationPublicGET"|"environmentReruns";
const writers=new Map<string,Promise<void>>();
/** Reload/append by unique id immediately before transmission; failed attempts consume quota. */
export async function chargeG6(path:string,id:string,kind:G6Charge,note:string){
  const previous=writers.get(path)??Promise.resolve();let release!:()=>void;
  const current=new Promise<void>(r=>{release=r;});writers.set(path,current);await previous;
  try{return await appendCharge(path,id,kind,note);}finally{release();if(writers.get(path)===current)writers.delete(path);}
}
async function appendCharge(path:string,id:string,kind:G6Charge,note:string){
  const ledger=JSON.parse(await readFile(path,"utf8")) as {entries:Array<{id:string}>;limits:Record<G6Charge,number>;cumulative:Record<G6Charge,number>;[key:string]:unknown};
  if(ledger.entries.some(e=>e.id===id))throw Error("Duplicate budget attempt id; no request was sent");
  const used=ledger.cumulative[kind];if(!Number.isSafeInteger(used)||used>=ledger.limits[kind])throw Error("Shared "+kind+" budget exhausted before request");
  const row={id,conversation:"A",recordedAtUTC:new Date().toISOString(),mode:"G6_CONTROLLED_ATTEMPT",fullLive:0,realModelCalls:0,evaluationPublicGET:0,environmentReruns:0,...(kind==="evaluationPublicGET"?{restaurantWebsiteRequests:1}:{}),[kind]:1,note};
  ledger.entries.push(row);ledger.cumulative[kind]=used+1;
  if(kind==="evaluationPublicGET"){
    const counts=ledger.cumulative as Record<string,number>;if(Number.isSafeInteger(counts.restaurantWebsiteRequests))counts.restaurantWebsiteRequests!+=1;
  }
  const temp=join(dirname(path),".g6-budget-"+randomUUID()+".tmp");await writeFile(temp,JSON.stringify(ledger,null,2)+"\n",{flag:"wx",mode:0o600});await rename(temp,path);
  return row;
}
