import { mkdir,readFile,writeFile,realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join,resolve,relative } from "node:path";
import { pathToFileURL } from "node:url";
import type { G6Pack,G6Case } from "./runner.js";
import { loadG6Pack } from "./runner.js";
import { createWitnessReader,type WitnessReceipt } from "./witness.js";
import { assertDevelopmentDates } from "./development-pack.js";
import { chargeG6 } from "./budget.js";
import { independentVacancy } from "./evaluator.js";
const hash=(b:Buffer|string)=>createHash("sha256").update(b).digest("hex");
export function publicGETError(error:unknown){
  return error instanceof Error ? JSON.parse(JSON.stringify(error,["name","message","code","cause","errors"])) : {name:"UnknownError",message:String(error)};
}
type Oracle=Omit<G6Case["oracle"],"request">;
export interface DevelopmentEvidence {schemaVersion:"g6-development-evidence@1";packSHA256:string;reviewed:boolean;reviewer:string;reviewedAt:string;identityChecks:{name:boolean;address:boolean;phone:boolean};w2ConfirmedNoOnline:boolean;publicGETAttempts:number;captureRef:string;captureSHA256:string;getRecords:Array<{path:string;sha256:string}>;certificates:WitnessReceipt[];oracles:Record<string,Oracle>;}

/** Authorization is supplied by the human outside this tool; this command is
 * prepared now but must only be invoked after the user approves development Live. */
export async function captureDevelopmentWitnesses(pack:G6Pack,packSHA256:string,out:string,transport:typeof fetch=fetch,budgetPath=resolve(".eval-artifacts/phase3b/budget.json"),timingControls:{now?:()=>number;wait?:(ms:number)=>Promise<void>}={}){
  assertDevelopmentDates(new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Vienna"}),pack.cases[0]?.witness?.date);
  const now=timingControls.now??Date.now,wait=timingControls.wait??(ms=>new Promise<void>(r=>setTimeout(r,ms))),ceiling=pack.witnessGETLimit??0;
  await mkdir(out,{recursive:false});let count=0;const timing={last:-Infinity},certificates:WitnessReceipt[]=[],failures:unknown[]=[];
  const targets=[...new Map(pack.cases.flatMap(c=>c.witness?[[c.witness.sourceEntityId,c.witness] as const]:[])).values()];
  for(const w of targets){const directory=join(out,w.sourceEntityId),reader=createWitnessReader({directory,budgetPath,runId:"g6-development-cert-"+Date.now()+"-"+w.sourceEntityId,fetch:transport,now,wait,requestTiming:timing,beforeGET:()=>{if(count>=ceiling)throw Error("Development GET limit before transmission");count++;}});
    try{const receipt=await reader.read(w,"BEFORE",true);certificates.push(receipt);if(receipt.exists===false)failures.push({sourceEntityId:w.sourceEntityId,reason:"SLOT_NOT_AVAILABLE"});}
    catch(error){failures.push({sourceEntityId:w.sourceEntityId,reason:error instanceof Error?error.name:"CERTIFICATION_FAILED",detail:publicGETError(error),directory});}
  }
  // A fresh public TableCheck guide (never reserve/form) lets the operator
  // compare W2 phone as well as the already-reviewed bilingual address.
  const tablecheckURL="https://www.tablecheck.com/en/nakamata-nodoguro-ginza",tablecheckPath=join(out,"tablecheck-identity.body");
  try{
    const delay=5000-(now()-timing.last);if(delay>0)await wait(delay);
    if(count>=ceiling)throw Error("Development GET ceiling");count++;
    await chargeG6(budgetPath,"g6-development-tablecheck-identity-"+Date.now(),"evaluationPublicGET","W2 public guide identity/phone only; no cookie/form/retry");timing.last=now();
    const response=await transport(tablecheckURL,{method:"GET",credentials:"omit",redirect:"manual",signal:AbortSignal.timeout(20_000)}),body=Buffer.from(await response.arrayBuffer());if(body.length>8_000_000)throw Error("Public identity response too large");
    await writeFile(tablecheckPath,body,{flag:"wx"});await writeFile(tablecheckPath+".json",JSON.stringify({url:tablecheckURL,status:response.status,checkedAt:new Date().toISOString(),sha256:hash(body),cookiesSent:false,retried:false},null,2)+"\n",{flag:"wx"});
    if(response.status!==200)failures.push({source:"TABLECHECK_IDENTITY",status:response.status});
  }catch(error){failures.push({source:"TABLECHECK_IDENTITY",reason:error instanceof Error?error.name:"PUBLIC_GET_FAILED",detail:publicGETError(error)});}
  // Review is deliberately not auto-confirmed from mere pointer/address matches.
  // The reviewer must inspect raw pages (including phone and online block),
  // attach complete-request oracles, and explicitly confirm any W2 detail-only
  // finding. No additional GET is sent by the review/import step.
  const {readdir}=await import("node:fs/promises");const records:Array<{path:string;sha256:string}>=[];
  for(const w of targets){const dir=join(out,w.sourceEntityId);for(const name of await readdir(dir).catch(()=>[]))if(name.endsWith(".body")){const path=join(dir,name);records.push({path,sha256:hash(await readFile(path))});}}
  if(await readFile(tablecheckPath).then(()=>true,()=>false))records.push({path:tablecheckPath,sha256:hash(await readFile(tablecheckPath))});
  const capturePath=join(out,"capture.json"),captureRaw=JSON.stringify({status:"REVIEW_REQUIRED",publicGETAttempts:count,failures,live:0,realModel:0},null,2)+"\n";await writeFile(capturePath,captureRaw,{flag:"wx"});
  const draft:DevelopmentEvidence={schemaVersion:"g6-development-evidence@1",packSHA256,reviewed:false,reviewer:"",reviewedAt:"",identityChecks:{name:false,address:false,phone:false},w2ConfirmedNoOnline:false,publicGETAttempts:count,captureRef:capturePath,captureSHA256:hash(captureRaw),getRecords:records,certificates,oracles:{}};
  await writeFile(join(out,"execution-evidence.json"),JSON.stringify(draft,null,2)+"\n",{flag:"wx"});return {publicGETAttempts:count,failures,evidence:join(out,"execution-evidence.json")};
}
async function artifact(path:string){const actual=await realpath(path),root=await realpath(resolve(".eval-artifacts"));if(relative(root,actual).startsWith("..")||!relative(root,actual))throw Error("Witness evidence must stay inside artifacts");return readFile(actual);}
export async function importDevelopmentEvidence(pack:G6Pack,packSHA256:string,path:string,sha256:string,now=Date.now()){
  const bytes=await artifact(path);if(hash(bytes)!==sha256)throw Error("Development evidence SHA mismatch");const input=JSON.parse(bytes.toString()) as DevelopmentEvidence;
  if(input.schemaVersion!=="g6-development-evidence@1"||input.packSHA256!==packSHA256||!input.reviewed||!input.reviewer||!input.identityChecks.name||!input.identityChecks.address||!input.identityChecks.phone)throw Error("Fresh witness name/address/phone review is required; no Live started");
  const capture=await artifact(input.captureRef);if(hash(capture)!==input.captureSHA256||JSON.parse(capture.toString()).publicGETAttempts!==input.publicGETAttempts)throw Error("Witness attempt count binding mismatch");
  const ceiling=pack.witnessGETLimit??0;
  if(!Number.isSafeInteger(input.publicGETAttempts)||input.publicGETAttempts<input.getRecords.length||input.publicGETAttempts>ceiling||!input.getRecords.length||input.getRecords.length>ceiling)throw Error("Unexpected publicGET evidence count");for(const r of input.getRecords)if(hash(await artifact(r.path))!==r.sha256)throw Error("Witness raw response changed");
  const expected=[...new Map(pack.cases.flatMap(c=>c.witness?[[c.witness.sourceEntityId,c.witness] as const]:[])).values()];
  for(const target of expected){const r=input.certificates.find(r=>r.target.sourceEntityId===target.sourceEntityId);if(!r||r.target.detailUrl!==target.detailUrl||r.target.date!==target.date||r.target.time!==target.time||r.target.partySize!==target.partySize||!r.detailRef||!r.detailSHA256||hash(await artifact(r.detailRef))!==r.detailSHA256)throw Error("Certificate target/body binding mismatch");
    const age=now-Date.parse(r.checkedAt);if(!Number.isFinite(age)||age<0||age>=86_400_000)throw Error("Certificate outside24h");
    if(r.exists===null){if(target.sourceEntityId!=="13186922"||!target.allowDetailOnlyCertificate||!input.w2ConfirmedNoOnline||r.vacancy)throw Error("Detail-only applies only to reviewed W2 without online booking");}
    else {
      if(!r.vacancy||r.exists!==true||!input.getRecords.some(v=>v.path===r.vacancy!.ref&&v.sha256===r.responseSHA256))throw Error("Required witness raw vacancy binding missing");
      const vacancy=await artifact(r.vacancy.ref);if(hash(vacancy)!==r.responseSHA256||JSON.stringify(JSON.parse(vacancy.toString()))!==JSON.stringify(r.vacancy.body)||!independentVacancy(r.vacancy,target).slots.includes(target.time))throw Error("Required witness is not available");
    }
  }
  const merged:G6Pack={...pack,cases:pack.cases.map(c=>{const o=input.oracles[c.id];if(!o||Object.keys(o).some(k=>!["pages","qualificationOracles","questions","priceOracles","reviewedReadRules"].includes(k))||!o.qualificationOracles?.some(q=>q.hardCriteriaMet===true&&q.withinArea===true))throw Error("Complete independent case oracle required; request edits forbidden");
    const certificate=input.certificates.find(r=>r.target.sourceEntityId===c.witness?.sourceEntityId);
    for(const q of o.qualificationOracles??[])if(!q.name?.trim()||!q.address?.trim()||!q.phone||q.phone.replace(/\D/gu,"").length<8||/PENDING|UNVERIFIED|TO_BE/iu.test(q.address)||!certificate?.detailRef||!q.evidenceRefs.includes(certificate.detailRef))throw Error("Qualification requires reviewed name/address/phone and this witness raw detail reference");
    return {...c,oracle:{...c.oracle,...o}};})};
  return {pack:merged,initialWitnesses:input.certificates,initialWitnessGETs:input.publicGETAttempts};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const [path,sha,out]=process.argv.slice(2);if(!path||!sha||!out)throw Error("Usage: development-evidence.ts <pack> <SHA> <new-output>; ONLY AFTER USER LIVE APPROVAL");loadG6Pack(resolve(path),sha).then(p=>captureDevelopmentWitnesses(p,sha,resolve(out))).then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error("Witness certification stopped; inspect saved responses; no retry");process.exitCode=1;});}
