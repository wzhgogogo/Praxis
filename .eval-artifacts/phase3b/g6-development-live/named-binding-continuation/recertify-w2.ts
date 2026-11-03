/** Frozen evaluation-only continuation: exactly one credential-free GET, no retry. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,join} from "node:path";
import {createHash} from "node:crypto";
import {createWitnessReader} from "../../../../src/eval/restaurant/agent-loop/g6/witness.js";
import {publicGETError} from "../../../../src/eval/restaurant/agent-loop/g6/development-evidence.js";
import {loadG6Pack} from "../../../../src/eval/restaurant/agent-loop/g6/runner.js";
const base=resolve(".eval-artifacts/phase3b/g6-development-live/named-binding-continuation");
const load=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const hash=(b:Uint8Array)=>createHash("sha256").update(b).digest("hex");
async function main(){
 const today=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Vienna"});if(today>"2026-11-04")throw Error("Approved visit date window expired");
 for(const id of ["D3","D5"]){const batch=await load(join(base,"runs",id,"batch.json"));if(batch.stopReason||batch.slots.length!==1||batch.slots[0].id!==id||!['EVALUATED','RECORDED_NOT_EVALUATED'].includes(batch.slots[0].status))throw Error("W1 continuation safety not cleared");}
 const packPath=join(base,"D2.pack.json"),pack=await loadG6Pack(packPath,"43dec1efed5353a16ce23e393a284ec5790d4365a686c5fba170215da335d530");
 const target=pack.cases[0]!.witness!;if(target.sourceEntityId!=="13186922"||target.time!=="20:00")throw Error("Wrong W2 target");
 const detailRef=".eval-artifacts/phase3b/g6-development-live/84f4c1f9-certification/13186922/001-detail.body",detailSHA256="3b8da386780aa4533a11861f72a1d433f0fb5d30db5e6f9fd53fce27d2e00a99";
 const detail=await readFile(detailRef),metadata=await load(detailRef+".json"),age=Date.now()-Date.parse(metadata.checkedAt);
 if(hash(detail)!==detailSHA256||age<0||age>=86400000)throw Error("W2 detail expired or changed; stop without GET");
 const budgetPath=resolve(".eval-artifacts/phase3b/budget.json"),ledger=await load(budgetPath);let used=ledger.cumulative.evaluationPublicGET-255;if(used>=25)throw Error("Development25 GET ceiling");
 const previous=ledger.entries.filter((e:{evaluationPublicGET?:number})=>e.evaluationPublicGET===1).at(-1),directory=join(base,"w2-certification");await mkdir(directory,{recursive:false});
 const reader=createWitnessReader({directory,budgetPath,runId:"g6-w2-named-continuation-"+Date.now(),fetch,requestTiming:{last:previous?Date.parse(previous.recordedAtUTC):-Infinity},beforeGET(){if(used>=25)throw Error("Development25 GET ceiling before transmission");used++;}});
 try{const receipt=await reader.read(target,"BEFORE",false);receipt.detailRef=detailRef;receipt.detailSHA256=detailSHA256;
  await writeFile(join(directory,"receipt.json"),JSON.stringify(receipt,null,2)+"\n",{flag:"wx"});
  await writeFile(join(directory,"result.json"),JSON.stringify({status:receipt.exists?"CERTIFIED":"SLOT_NOT_RETURNED_STOP",publicGETAttempts:used,identity:"User manual cross-channel name/address/phone confirmed2026-11-02; original public detail reused within24h",cookies:false,model:0,live:0},null,2)+"\n",{flag:"wx"});
  if(!receipt.exists)process.exitCode=1;console.log(JSON.stringify({exists:receipt.exists,publicGETAttempts:used}));
 }catch(error){await writeFile(join(directory,"failure.json"),JSON.stringify({detail:publicGETError(error),publicGETAttempts:used,noRetry:true},null,2)+"\n",{flag:"wx"});throw error;}
}
main().catch(()=>{console.error("W2 certification stopped; inspect saved cause; no retry");process.exitCode=1;});
