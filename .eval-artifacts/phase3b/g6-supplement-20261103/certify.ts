import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createWitnessReader} from '../../../src/eval/restaurant/agent-loop/g6/witness.js';
import {publicGETError} from '../../../src/eval/restaurant/agent-loop/g6/development-evidence.js';
const root=resolve('.eval-artifacts/phase3b/g6-supplement-20261103');
const load=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
async function main(){
 const id=process.argv[2];if(!['W1','W2'].includes(id!))throw Error('Expected W1/W2');
 const pack=await load(join(root,id==='W1'?'D6.pack.json':'D8.pack.json')),target=pack.cases[0].witness;
 if(new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Vienna'})>'2026-11-04')throw Error('Re-freeze visit date before certification');
 const old=resolve('.eval-artifacts/phase3b/g6-development-live/84f4c1f9-certification',target.sourceEntityId,'001-detail.body'),meta=await load(old+'.json'),detail=await readFile(old);
 if(createHash('sha256').update(detail).digest('hex')!==meta.sha256)throw Error('Historical detail changed');
 const budgetPath=resolve('.eval-artifacts/phase3b/budget.json'),b=await load(budgetPath);let used=b.cumulative.evaluationPublicGET-255;
 const directory=join(root,'certificates',id!);await mkdir(directory,{recursive:true});
 const last=b.entries.filter((e:{evaluationPublicGET?:number})=>e.evaluationPublicGET===1).at(-1);
 const reader=createWitnessReader({directory,budgetPath,runId:'g6-supplement-cert-'+id+'-'+Date.now(),fetch,requestTiming:{last:last?Date.parse(last.recordedAtUTC):-Infinity},beforeGET(){if(used>=35)throw Error('Development35 GET ceiling');used++;}});
 try{const refresh=id==='W1'||Date.now()-Date.parse(meta.checkedAt)>=86400000;
 const receipt=await reader.read(target,'BEFORE',refresh);
 if(!refresh){receipt.detailRef=old;receipt.detailSHA256=meta.sha256;}
 await writeFile(join(directory,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({exists:receipt.exists,publicGETs:used,newGETs:reader.count}));if(!receipt.exists)process.exitCode=1;
 }catch(error){await writeFile(join(directory,'failure.json'),JSON.stringify({error:publicGETError(error),used,noRetry:true},null,2)+'\n',{flag:'wx'});throw error;}
}
main().catch(()=>{console.error('Witness stopped; inspect recorded cause; no retry');process.exitCode=1;});
