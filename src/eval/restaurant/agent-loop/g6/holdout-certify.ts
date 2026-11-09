import {mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import {dirname,join,resolve,relative} from 'node:path';
import {randomUUID} from 'node:crypto';
import {holdoutHash,privateInputRedactor,type PrivateHoldoutManifest} from '../holdout-protocol.js';
import {createWitnessReader,witnessURL} from './witness.js';
import {holdoutLock,atomicJSON,type HoldoutRunAudit} from './holdout-checkpoint.js';
import {sanitizePublicJson} from '../runners/browser-read-recording.js';
import {GooglePlacesHarCapture} from '../runners/google-places-recording.js';
const prefix='holdout-certify:';
type Ledger={entries:Array<{id:string;evaluationPublicGET?:number;recordedAtUTC?:string}>;limits:{evaluationPublicGET:number};cumulative:{evaluationPublicGET:number}};
export interface HoldoutCertificate {id:string;exists:boolean|null;checkedAt:string;responseSHA256:string|null;status:number|null;bodyRef:string|null;recording:'SAVED'|'OMITTED'|'NO_RESPONSE';failure:'SOURCE_UNVERIFIED'|null;}
/** Pre-freeze, serial vacancy-only observation. Neither this path nor its ledger
 * rows bind a formal run directory/manifest or create product/model clients. */
export async function certifyPrivateHoldout(manifest:PrivateHoldoutManifest,audit:HoldoutRunAudit,directory:string,deps:{budgetPath:string;fetch:typeof fetch;now?:()=>number;wait?:(ms:number)=>Promise<void>;ownCredentials?:readonly string[]}){
 if(!manifest.cases.length||manifest.cases.length>6||new Set(manifest.cases.map(c=>c.id)).size!==manifest.cases.length)throw Error('HOLDOUT_CERTIFICATION_CASE_LIMIT');
 for(const item of manifest.cases){if(item.witness.provider!=='TABELOG')throw Error('HOLDOUT_CERTIFICATION_WITNESS_INVALID');witnessURL(item.witness);}
 const budgetPath=await realpath(deps.budgetPath),unlock=await holdoutLock(dirname(budgetPath),'holdout-certify-'+holdoutHash(budgetPath).slice(0,16)+'.lock');
 try{
  const ledger=()=>readFile(budgetPath,'utf8').then(t=>JSON.parse(t)as Ledger);
  const beforeGET=async(needed=1)=>{const l=await ledger(),used=l.entries.filter(e=>e.id.startsWith(prefix)&&e.evaluationPublicGET===1).length;
   if(used+needed>12||l.cumulative.evaluationPublicGET+needed>l.limits.evaluationPublicGET)throw Error('HOLDOUT_CERTIFICATION_GET_LIMIT');};
  await beforeGET(manifest.cases.length);
  const root=resolve(directory);await mkdir(root,{recursive:false});
  const privacy=privateInputRedactor(manifest.cases.flatMap(c=>[c.request,...c.followups.map(f=>f.text)]));
  await writeFile(join(root,'certification-hashes.json'),JSON.stringify({...audit,budgetPath},null,2)+'\n',{flag:'wx',mode:0o600});
  const now=deps.now??Date.now,l=await ledger(),timing={last:Math.max(-Infinity,...l.entries.filter(e=>e.evaluationPublicGET===1).map(e=>Date.parse(e.recordedAtUTC??'')).filter(Number.isFinite))};
  const capture=new GooglePlacesHarCapture(()=>{});capture.registerCredentials(deps.ownCredentials??[]);
  const results:HoldoutCertificate[]=[],runId=prefix+randomUUID();
  for(const [index,item]of manifest.cases.entries()){
   let started=false;
   const reader=createWitnessReader({directory:join(root,String(index+1).padStart(2,'0')),budgetPath,runId:runId+':'+index,now,requestTiming:timing,beforeGET:()=>beforeGET(),...(deps.wait?{wait:deps.wait}:{}),
    fetch:async(...args)=>{started=true;return deps.fetch(...args);},sanitizeResponse:text=>{
     if(!capture.accept(text,'RESPONSE')||capture.rejectsRecording)return;
     const safe=sanitizePublicJson(text);if(safe===undefined)return;
     const redacted=JSON.stringify(privacy(JSON.parse(safe)));return capture.accept(redacted)?redacted:undefined;
    }});
   let exists:boolean|null=null,failure:HoldoutCertificate['failure']=null;
   try{exists=(await reader.read(item.witness,'BEFORE',false)).exists;}
   catch{if(!started)throw Error('HOLDOUT_CERTIFICATION_NOT_STARTED');failure='SOURCE_UNVERIFIED';}
   const response=reader.lastResponse;
   results.push({id:item.id,exists,checkedAt:response?.checkedAt??new Date(now()).toISOString(),responseSHA256:response?.responseSHA256??null,status:response?.status??null,
    bodyRef:response?.bodyRef?relative(root,response.bodyRef):null,recording:response?.recording??'NO_RESPONSE',failure});
   await atomicJSON(join(root,'certificates.json'),privacy({schema:'phase3b-holdout-certificates@1',results,GETs:results.length,models:0,fullLive:0}));
  }
  return {results,GETs:results.length,models:0,fullLive:0};
 }finally{await unlock();}
}
