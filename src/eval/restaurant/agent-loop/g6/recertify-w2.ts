import { readFile,mkdir,writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve,join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadG6Pack } from "./runner.js";
import { createWitnessReader } from "./witness.js";
import { publicGETError,type DevelopmentEvidence } from "./development-evidence.js";
const hash=(b:Uint8Array|string)=>createHash("sha256").update(b).digest("hex");
/** One approved public GET after D3–D7. D1 retains its reviewed historical S0. */
export async function recertifyW2(configPath:string,expectedSHA:string){
  const raw=await readFile(configPath);if(hash(raw)!==expectedSHA)throw Error("Resume configuration SHA mismatch");
  const c=JSON.parse(raw.toString()) as {pack:string;packSHA256:string;template:string;templateSHA256:string;budget:string;publicGETBaseline:number;ceiling:number;previousBatch:string;output:string;detailRef:string;detailSHA256:string;detailCheckedAt:string};
  const pack=await loadG6Pack(c.pack,c.packSHA256),previous=JSON.parse(await readFile(c.previousBatch,"utf8"));
  const continuationIds=["D3","D4","D5","D6","D7"];
  if(previous.stopReason||previous.slots.length!==continuationIds.length||previous.slots.some((s:{id:string;status:string},i:number)=>s.id!==continuationIds[i]||s.status!=="EVALUATED"))throw Error("W1 continuation has not cleared independent safety review");
  if(pack.cases.length!==2||pack.cases.some(s=>s.witness?.sourceEntityId!=="13186922"||s.witness?.time!=="20:00"))throw Error("Unexpected W2 request");
  const detail=await readFile(c.detailRef),age=Date.now()-Date.parse(c.detailCheckedAt);if(hash(detail)!==c.detailSHA256||age<0||age>=86400000)throw Error("W2 detail expired or changed");
  const templateRaw=await readFile(c.template);if(hash(templateRaw)!==c.templateSHA256)throw Error("W2 review template SHA mismatch");const template=JSON.parse(templateRaw.toString()) as DevelopmentEvidence;
  const before=JSON.parse(await readFile(c.budget,"utf8"));let used=before.cumulative.evaluationPublicGET-c.publicGETBaseline;
  if(used!==previous.witnessGETs||used>=c.ceiling||c.ceiling!==25)throw Error("Development quota binding mismatch/exhausted");
  await mkdir(c.output,{recursive:false});const entries=before.entries.filter((e:{evaluationPublicGET?:number})=>e.evaluationPublicGET===1);const last=entries.at(-1)?.recordedAtUTC;
  const reader=createWitnessReader({directory:c.output,budgetPath:c.budget,runId:"g6-w2-recert-"+Date.now(),fetch,requestTiming:{last:last?Date.parse(last):-Infinity},beforeGET:()=>{if(used>=c.ceiling)throw Error("Development25 GET ceiling before transmission");used++;}});
  try{
    const receipt=await reader.read(pack.cases[0]!.witness!,"BEFORE",false);receipt.detailRef=c.detailRef;receipt.detailSHA256=c.detailSHA256;
    const capture=JSON.stringify({publicGETAttempts:used,previousPublicGETs:previous.witnessGETs,newPublicGETs:1,developmentBaseline:c.publicGETBaseline},null,2)+"\n",capturePath=join(c.output,"capture.json");await writeFile(capturePath,capture,{flag:"wx"});
    const evidence={...template,reviewed:receipt.exists===true,reviewedAt:new Date().toISOString(),publicGETAttempts:used,captureRef:capturePath,captureSHA256:hash(capture),certificates:[receipt],getRecords:[...template.getRecords,{path:receipt.vacancy!.ref,sha256:receipt.responseSHA256}]};
    const bytes=JSON.stringify(evidence,null,2)+"\n";await writeFile(join(c.output,"execution-evidence.json"),bytes,{flag:"wx"});
    const result={status:receipt.exists?"CERTIFIED":"SLOT_NOT_RETURNED_STOP",exists:receipt.exists,publicGETAttempts:used,executionEvidenceSHA256:hash(bytes),realModel:0,live:0};await writeFile(join(c.output,"result.json"),JSON.stringify(result,null,2)+"\n",{flag:"wx"});return result;
  }catch(error){await writeFile(join(c.output,"failure.json"),JSON.stringify({detail:publicGETError(error),publicGETAttempts:used,noRetry:true},null,2)+"\n",{flag:"wx"});throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const [path,sha]=process.argv.slice(2);if(!path||!sha)throw Error("Usage recertify-w2 <config> <SHA>; after W1 only");recertifyW2(path,sha).then(r=>{console.log(JSON.stringify(r));if(!r.exists)process.exitCode=1;}).catch(()=>{console.error("W2 certification stopped; inspect saved cause; no retry.");process.exitCode=1;});}
