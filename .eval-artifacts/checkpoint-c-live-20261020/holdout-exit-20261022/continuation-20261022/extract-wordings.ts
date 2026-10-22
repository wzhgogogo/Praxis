// Only criterion strings/identities are inspected. No evaluator, outcome, source truth or delivery fields.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {loadCriterionCorrespondences,matchCriteria} from '../../../../src/eval/restaurant/agent-loop/criterion-correspondence.ts';
const sha=(b:any)=>createHash('sha256').update(b).digest('hex');
export function extractWordings(artifact:any,artifactPath:string,artifactSha256:string){
 const gold=artifact.materializedCase?.semantic?.criteria??[],actual=artifact.finalSnapshot?.domainState?.intentDraft?.criteria??[];
 const existing=loadCriterionCorrespondences().entries.find(e=>e.artifactSha256===artifactSha256),matches=matchCriteria(gold,actual,existing?.pairs??[]);
 const select=(v:any,index:number)=>({index,text:v.text??v.value,polarity:v.polarity,strength:v.strength,...(v.criterionRef?{criterionRef:v.criterionRef}:{}),...(v.semanticId?{semanticId:v.semanticId}:{})});
 const left=gold.flatMap((v:any,i:number)=>matches.some(m=>m.goldIndex===i)?[]:[select(v,i)]),right=actual.flatMap((v:any,i:number)=>matches.some(m=>m.actualIndex===i)?[]:[select(v,i)]);
 if(!left.length&&!right.length)return null;
 return {artifactPath,artifactSha256,caseId:artifact.materializedCase?.id,unmatchedRequestCriteria:left,unmatchedProductCriteria:right,candidateWordingPairs:left.flatMap((g:any)=>right.map((a:any)=>({goldIndex:g.index,actualIndex:a.index,goldText:g.text,actualText:a.text,goldPolarity:g.polarity,actualPolarity:a.polarity,goldStrength:g.strength,actualStrength:a.strength,goldTextSha256:sha(g.text),actualTextSha256:sha(a.text)})))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [directory,output]=process.argv.slice(2);if(!directory||!output)throw Error('DIRECTORY_OUTPUT_REQUIRED');const rows:any[]=[];
 for(const a of readdirSync(directory,{withFileTypes:true}).filter(e=>e.isDirectory()&&/^h-\d\d-attempt-\d+$/.test(e.name))){const root=resolve(directory,a.name,'runner');let files:string[];try{files=readdirSync(root).filter(f=>f.endsWith('.result.json'));}catch{continue;}for(const f of files){const p=resolve(root,f),bytes=readFileSync(p),row=extractWordings(JSON.parse(bytes.toString()),p,sha(bytes));if(row)rows.push(row);}}
 const result={schema:'holdout-pending-criterion-wordings@1',status:'PENDING_INDEPENDENT_WORDING_REVIEW',rule:'Candidate Cartesian pairs are questions only; no identity is implied by array order or polarity. Indices are zero-based and bound to the exact original artifact SHA. No run outcomes or condition assessments are included.',entries:rows};
 writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({wordingReviewPath:output,entries:rows.length,candidatePairs:rows.reduce((n,r)=>n+r.candidateWordingPairs.length,0),evaluation:'DEFERRED'}));
}
