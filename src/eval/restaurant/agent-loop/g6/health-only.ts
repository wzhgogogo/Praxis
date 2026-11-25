import{mkdir,writeFile,readFile}from'node:fs/promises';import{join,resolve}from'node:path';import{randomUUID}from'node:crypto';
import type{BrowserRuntime}from'../../../../infrastructure/browser/browser-runtime.js';import{restaurantDiscoveryPacks}from'../../../../integrations/restaurant-search/source-packs.js';import{checkHoldoutNetwork}from'./holdout-health.js';import{chargeG6}from'./budget.js';
/** Diagnostic monitoring only; no manifest, product session, model or Live. */
export async function runHealthOnly(input:{directory:string;budgetPath:string;sourceSHA:string;tabelogUrl:string;rounds:number;intervalMinutes:number},deps:{browser:BrowserRuntime;now?:()=>number;wait?:(ms:number)=>Promise<void>}){
 if(!Number.isInteger(input.rounds)||input.rounds<1||input.rounds>3||!Number.isFinite(input.intervalMinutes)||input.intervalMinutes<15)throw Error('HEALTH_ONLY_SCHEDULE_INVALID');
 const url=new URL(input.tabelogUrl),pack=restaurantDiscoveryPacks.find(p=>p.meta.id==='tabelog')!;
 if(!pack.documentOrigins.includes(url.origin)||url.username||url.password||url.hash)throw Error('HEALTH_ONLY_SOURCE_INVALID');
 const now=deps.now??Date.now,wait=deps.wait??(ms=>new Promise(r=>setTimeout(r,ms))),root=resolve(input.directory),id='health-only:'+randomUUID();await mkdir(root,{recursive:false});
 const ledger=JSON.parse(await readFile(input.budgetPath,'utf8'));if(ledger.status!=='APPROVED_FOR_EXECUTION')throw Error('HEALTH_ONLY_BUDGET_NOT_ACTIVE');
 const cet=()=>new Date(now()).toLocaleString('sv-SE',{timeZone:'Europe/Vienna'})+' CET';let GETs=0,lastGET=-Infinity,lastRound=-Infinity;
 const results=[];
 for(let round=1;round<=input.rounds;round++){
  const delay=input.intervalMinutes*60000-(now()-lastRound);if(delay>0)await wait(delay);lastRound=now();const startedAtCET=cet();
  const result=await checkHoldoutNetwork({browser:deps.browser,tabelogDetailUrl:input.tabelogUrl,continueOnFailure:true,beforeGET:async(source,repeat)=>{
   const delay=5000-(now()-lastGET);if(delay>0)await wait(delay);
   if(GETs>=input.rounds*4)throw Error('HEALTH_ONLY_GET_LIMIT');await chargeG6(input.budgetPath,id+':'+round+':'+source+':'+repeat,'evaluationPublicGET','User-approved health-only; no model/Live, no retry');GETs++;lastGET=now();
  }});
  results.push({round,startedAtCET,finishedAtCET:cet(),...result});await writeFile(join(root,'round-'+round+'.json'),JSON.stringify(results.at(-1),null,2)+'\n',{flag:'wx'});
 }
 const report={sourceSHA:input.sourceSHA,rounds:results,GETs,models:0,Live:0,intervalMinutes:input.intervalMinutes};await writeFile(join(root,'network-health.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
}
