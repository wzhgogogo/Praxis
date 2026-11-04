import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createWitnessReader} from '../../../../src/eval/restaurant/agent-loop/g6/witness.js';
import {publicGETError} from '../../../../src/eval/restaurant/agent-loop/g6/development-evidence.js';
const root=resolve('.eval-artifacts/phase3b/g6-rerun-20261104/next-two'),out=root;
const load=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
async function main(){
 execFileSync('python3',[join(root,'readiness.py')],{stdio:'inherit'});
 for(const revision of ['de2b7ecc','aba06e16','a96f4d4e'])for(const tip of ['origin/main','HEAD'])execFileSync('git',['merge-base','--is-ancestor',revision,tip],{stdio:'ignore'});
 const [id,packSHA]=process.argv.slice(2);if(!['W1','W2'].includes(id!))throw Error('Expected W1/W2');
 const path=join(root,id==='W1'?'D4.pack.json':'D8.pack.json'),bytes=await readFile(path);
 if(createHash('sha256').update(bytes).digest('hex')!==packSHA)throw Error('Pack SHA mismatch');
 const pack=JSON.parse(bytes.toString()),target=pack.cases[0].witness;
 const day=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Vienna'}),delta=(Date.parse(target.date+'T00:00:00Z')-Date.parse(day+'T00:00:00Z'))/86400000;
 if(delta<7||delta>14||new Date(target.date+'T00:00:00Z').getUTCDay()!==3)throw Error('Re-freeze actual Wednesday visit date before certification');
 const budgetPath=resolve('.eval-artifacts/phase3b/budget.json'),ledger=await load(budgetPath);let used=ledger.cumulative.evaluationPublicGET;
 if(ledger.limits.fullLive!==34||ledger.limits.evaluationPublicGET!==425)throw Error('Approved quota configuration mismatch');
 const directory=join(out,'certificates',id!);await mkdir(join(out,'certificates'),{recursive:true});await mkdir(directory,{recursive:false});
 const last=ledger.entries.filter((e:{evaluationPublicGET?:number})=>e.evaluationPublicGET===1).at(-1);
 const reader=createWitnessReader({directory,budgetPath,runId:'g6-two-slot-cert-'+id+'-'+Date.now(),fetch,requestTiming:{last:last?Date.parse(last.recordedAtUTC):-Infinity},beforeGET(){if(used>=425)throw Error('Shared425 GET ceiling');used++;}});
 try{const receipt=await reader.read(target,'BEFORE',true);
 await writeFile(join(directory,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({exists:receipt.exists,publicGETs:used,newGETs:reader.count}));if(!receipt.exists)process.exitCode=1;
 }catch(error){await writeFile(join(directory,'failure.json'),JSON.stringify({error:publicGETError(error),used,noRetry:true},null,2)+'\n',{flag:'wx'});throw error;}
}
main().catch(()=>{console.error('Witness stopped; inspect recorded cause; no retry');process.exitCode=1;});
