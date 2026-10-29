import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {independentPageText} from '../../../src/eval/restaurant/fact-qa/independent-text.js';
const [id,path]=process.argv.slice(2);if(!id||!path)throw Error('SLOT_REQUIRED');
const raw=JSON.parse(await readFile(resolve(path,'execution/core-results.json'),'utf8'))[0];const answer=raw.answer;
let output:any;try{output=JSON.parse(JSON.parse(await readFile(resolve(path,'model-response.json'),'utf8')).outputText);}catch{}
const latin=(answer.answer.match(/\p{Script=Latin}/gu)||[]).length,cjk=(answer.answer.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)||[]).length;
const checks:Record<string,boolean>={};const evidence:Record<string,unknown>={status:answer.status,answer:answer.answer,latinLetters:latin,japaneseCharacters:cjk};
if(id==='Q07'||id==='Q33')checks.englishAnswer=answer.status==='ANSWERED'&&latin>=10&&latin>2*cjk;
if(id==='Q14')checks.categoryNone=raw.raw.status!=='UNVERIFIED'&&raw.raw.sensitiveCategory==='NONE';
if(id==='Q26'){checks.sourceConflict=output?.sourceConflict===true;checks.confirmationRequired=raw.raw.status!=='UNVERIFIED'&&raw.raw.confirmationRequired===true;evidence.rawSourceConflict=output?.sourceConflict??null;evidence.coreConfirmationRequired=raw.raw.confirmationRequired??null;}
if(id==='Q27'){checks.notStated=answer.status==='NOT_STATED';checks.noCommentCitations=answer.citations.length===0;}
if(id==='Q31'){
 const q=JSON.parse(await readFile('.eval-artifacts/phase3b/g1-qa/questions.json','utf8'));const question=q.questions.find((q:any)=>q.id==='G1-Q31');const page=q.pages.find((p:any)=>p.id===question.pageId);const stored=await readFile(page.pagePath);const bytes=page.storageEncoding==='gzip'?gunzipSync(stored):stored;const text=await independentPageText(bytes.toString());
 const boundaries=answer.citations.map((c:any)=>{let at=text.indexOf(c.text),valid=false;while(at>=0){const before=text.slice(0,at).trimEnd().slice(-1);valid=/[。．！？.!?]$/u.test(c.text.trim())&&(!before||/[。．！？.!?]/u.test(before));if(valid)break;at=text.indexOf(c.text,at+1);}return{quote:c.text,foundAt:at,completeSentence:valid};});
 checks.completeOriginalSentences=answer.status==='ANSWERED'&&boundaries.length>0&&boundaries.every((q:any)=>q.completeSentence);evidence.sentenceBoundaries=boundaries;
}
await writeFile(resolve(path,'supplemental-checks.json'),JSON.stringify({scope:'User2026-10-28 explicit per-question checks; separate from unchanged scorer',question:id,checks,pass:Object.values(checks).every(Boolean),evidence},null,2)+'\n',{flag:'wx'});
