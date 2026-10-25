import {fork,type ChildProcess} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import {isAbsolute,relative,resolve} from 'node:path';
import {evaluateArtifactFile} from '../diagnostic-evaluator.js';
import {parseReviewedReads} from '../diagnostic-evaluator-network.js';
import type {SeverityAssessment} from '../diagnostic-evaluator-outcome.js';

const cet=()=>new Date(Date.now()+3_600_000).toISOString().replace('Z','+01:00');
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const failure=(code:string)=>Object.assign(new Error(code),{code});
const unknown=(code:string):SeverityAssessment=>({status:'NOT_EVALUATED',reasons:[code],evidenceRefs:[]});
export interface PostExitEvaluation {
 id:string;status:'EVALUATED'|'NOT_EVALUATED';exit:{code:number|null;signal:NodeJS.Signals|null};
 exitedAtCET:string;evaluationStartedAtCET:string;finishedAtCET:string;exitToEvaluationStartMs:number;
 sourceArtifact?:{path:string;sha256:string};evaluationPath?:string;reviewedReadsSha256?:string;failureCode?:string;
 s0:{S0_DECLARATION:SeverityAssessment;S0_BOUNDARY:SeverityAssessment};
}
async function insideArtifacts(path:string){
 const root=await realpath(resolve('.eval-artifacts')),actual=await realpath(path),rel=relative(root,actual);
 if(!rel||rel==='..'||rel.startsWith('..'+(process.platform==='win32'?'\\':'/'))||isAbsolute(rel))throw failure('INVALID_ARTIFACT_REFERENCE');
 return actual;
}
/** Start per-slot independent evaluation at exit, without waiting for other slots or stdio close. */
export async function superviseEvalChild(child:ChildProcess,id:string,receiptPath:string):Promise<PostExitEvaluation>{
 let artifactPath:string|undefined,bindingFailure:string|undefined;
 const onMessage=(message:unknown)=>{
  if(!message||typeof message!=='object'||!('type' in message)||message.type!=='PRAXIS_EVAL_ARTIFACT_STARTED')return;
  const path='artifactPath' in message?message.artifactPath:undefined;
  if(typeof path!=='string'||!path.endsWith('.result.json'))bindingFailure='INVALID_ARTIFACT_REFERENCE';
  else if(artifactPath&&artifactPath!==path)bindingFailure='CONFLICTING_ARTIFACT_REFERENCE';else artifactPath=path;
 };
 child.on('message',onMessage);
 let exit:{code:number|null;signal:NodeJS.Signals|null},exitedAtCET:string,exitedAt:number,startFailure:string|undefined;
 try{
  ({exit,exitedAtCET,exitedAt}=await new Promise<{exit:PostExitEvaluation['exit'];exitedAtCET:string;exitedAt:number}>(accept=>{
   child.once('exit',(code,signal)=>accept({exit:{code,signal},exitedAtCET:cet(),exitedAt:performance.now()}));
   child.once('error',()=>{startFailure='CHILD_START_FAILED';accept({exit:{code:null,signal:null},exitedAtCET:cet(),exitedAt:performance.now()});});
  }));
 }finally{child.removeListener('message',onMessage);}
 const receipt:PostExitEvaluation={id,status:'NOT_EVALUATED',exit,exitedAtCET,evaluationStartedAtCET:cet(),finishedAtCET:'',exitToEvaluationStartMs:performance.now()-exitedAt,
  s0:{S0_DECLARATION:unknown('EVALUATION_PENDING'),S0_BOUNDARY:unknown('EVALUATION_PENDING')}};
 try{
  if(startFailure||bindingFailure)throw failure(startFailure??bindingFailure!);
  if(!artifactPath)throw failure('MISSING_ARTIFACT');
  const path=await insideArtifacts(artifactPath),bytes=await readFile(path),artifact=JSON.parse(bytes.toString());
  receipt.sourceArtifact={path,sha256:hash(bytes)};
  const preflight=artifact.runtimeContext?.preflight;
  let reviewedReads:ReturnType<typeof parseReviewedReads>|undefined;
  if(preflight?.reviewedReadsPath!==undefined||preflight?.reviewedReadsSha256!==undefined){
   if(typeof preflight.reviewedReadsPath!=='string'||isAbsolute(preflight.reviewedReadsPath)||typeof preflight.reviewedReadsSha256!=='string')throw failure('INVALID_REVIEWED_READS_REFERENCE');
   const reviewedPath=await insideArtifacts(resolve(preflight.reviewedReadsPath)),raw=await readFile(reviewedPath);
   if(hash(raw)!==preflight.reviewedReadsSha256)throw failure('REVIEWED_READS_SHA_MISMATCH');
   reviewedReads=parseReviewedReads(raw,preflight.reviewedReadsPath);receipt.reviewedReadsSha256=reviewedReads.sha256;
  }
  const {evaluation,outputPath}=await evaluateArtifactFile(path,reviewedReads?{reviewedReads}:{});
  if(evaluation.sourceArtifact.sha256!==receipt.sourceArtifact.sha256||hash(await readFile(path))!==receipt.sourceArtifact.sha256)throw failure('ARTIFACT_CHANGED_DURING_EVALUATION');
  receipt.status='EVALUATED';receipt.evaluationPath=outputPath;
  receipt.s0={S0_DECLARATION:evaluation.severity.S0_DECLARATION,S0_BOUNDARY:evaluation.severity.S0_BOUNDARY};
 }catch(error){
  const code=error&&typeof error==='object'&&'code' in error&&typeof error.code==='string'&&/^[A-Z][A-Z0-9_]{0,63}$/.test(error.code)?error.code:'INDEPENDENT_EVALUATION_FAILED';
  receipt.failureCode=code;receipt.s0={S0_DECLARATION:unknown(code),S0_BOUNDARY:unknown(code)};
 }
 receipt.finishedAtCET=cet();await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});return receipt;
}
export function postExitFailed(receipt:PostExitEvaluation){
 return receipt.exit.code!==0||receipt.status!=='EVALUATED'||receipt.s0.S0_DECLARATION.status!=='ABSENT'||receipt.s0.S0_BOUNDARY.status!=='ABSENT';
}
/** The ordinary Live CLI uses the same parent boundary as a paced batch slot. */
export async function runSupervisedEvalCli(entry:string,args:string[],output:string){
 await mkdir(output,{recursive:true});const id=`slot-${randomUUID()}`;
 const child=fork(entry,args,{env:process.env});
 let grace:ReturnType<typeof setTimeout>|undefined;
 const stop=()=>{child.kill('SIGTERM');grace??=setTimeout(()=>child.kill('SIGKILL'),10_000);};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
 try{return await superviseEvalChild(child,id,resolve(output,`${id}.post-exit.json`));}
 finally{clearTimeout(grace);process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);}
}
