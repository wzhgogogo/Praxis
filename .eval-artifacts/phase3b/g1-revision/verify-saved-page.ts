import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
import {ModelRestaurantPageQuestion} from '../../../src/integrations/restaurant-facts/model-page-question.js';
const output=resolve(process.argv[2]!);if(output.startsWith(resolve('.')+'/'))throw Error('outside output required');
const control=process.argv[3]!;const baseline=process.argv.includes('--baseline-format');
const path='src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.html';const bytes=await readFile(path);const provenance=JSON.parse(await readFile(path+'.provenance.json','utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');assert.equal(sha(bytes),provenance.fixtureSha256);await mkdir(output,{recursive:false});
const browser=await chromium.launch({headless:true});
const late="The sushi toppings are carefully selected by the chef himself, who visits the market every day to choose seasonal ingredients. The perfectly cooked rice uses red vinegar, which is characteristic of Edomae sushi, enhancing the flavor of the toppings. Additionally, the chef's dedication is evident in everything that customers taste, including the wasabi, soy sauce, and high-quality, aromatic seaweed that elevate the flavor of the sushi.";
const review='Incredible sushi lunch for this price!';
try {
 const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});let blocked=0;
 await context.route('**/*',async route=>{blocked++;await route.abort();});const page=await context.newPage();await page.setContent(bytes.toString(),{waitUntil:'domcontentloaded'});
 const wholeText=await page.locator('body').innerText();assert.ok(wholeText.indexOf(late)>6000);assert.ok(wholeText.includes(review));
 const reviewStart=wholeText.indexOf('\nReview？\n'),reviewEnd=wholeText.indexOf('\nRestaurant information\n',reviewStart);assert.ok(reviewEnd>reviewStart);
 // The review control uses an unchanged source excerpt so the old 50-line cap
 // cannot accidentally hide the very review whose admission is under test.
 const text=control==='review'?wholeText.slice(reviewStart,reviewEnd+'\nRestaurant information\n'.length):wholeText;
 const readAt=new Date().toISOString();const candidateId='saved-sen-coverage-fixture';let sawLate=false;
 const model={async complete(input:any){const documents=JSON.parse(input.messages[1].content).sourceDocuments;sawLate=documents.some((d:any)=>d.statements.some((s:any)=>s.text===late));
  const quoted=control==='review'?review:late;let citations:any[]=[];
  if(control!=='not-stated')for(const d of documents){const statement=d.statements.find((s:any)=>s.text===quoted);if(statement){citations=[{documentId:d.id,statementId:statement.id,quote:quoted}];break;}}
  const body:any={status:control==='not-stated'?'NOT_STATED':'ANSWERED',citations};
  if(!baseline){body.answer=control==='not-stated'?null:'The page describes the chef selecting seasonal ingredients at the market each day.';body.sensitiveCategory='NONE';}
  return{invocationId:'fixture',provider:'FIXTURE' as const,model:'fixture',finishReason:'TOOL_CALLS' as const,latencyMs:0,outputText:JSON.stringify(body)};}};
 // Synthetic bound envelope isolates full-page and source-role contracts, NOT live outlet identity.
 const result=await new ModelRestaurantPageQuestion(model,undefined,()=>readAt).answer({question:control==='review'?'What does the restaurant say about lunch value?':'What does the chef say about selecting ingredients?',displayedOutlet:{candidateId,sourceUrl:provenance.sourceUrl},readContext:{runId:'saved-local',startedAt:readAt},cachedPages:[{readRunId:'saved-local',requestedSourceUrl:provenance.sourceUrl,candidateId,observedAt:readAt,identity:{evidenceId:'fixture-bound-identity',kind:'ENTITY_MATCH',provider:'TABELOG',candidateId,sourceEntityId:'tokyo/A1303/A130301/13275802',sourceUrl:provenance.sourceUrl,observedAt:readAt,requestFingerprint:'fixture',claims:{outletName:'Shibuya Sushi Sen'},entityMatch:{confidence:'HIGH',matchedBy:['SYNTHETIC_ENVELOPE_NOT_IDENTITY_PROOF']}},snapshot:{url:provenance.sourceUrl,title:'Saved page',text,html:bytes.toString(),settlement:'SETTLED'}}]},new AbortController().signal);
 await writeFile(output+'/result.json',JSON.stringify({mode:'REAL_LOCAL_CHROMIUM_SAVED_PAGE_FIXTURE_MODEL',source:path,sourceSha256:sha(bytes),capturedOn:provenance.capturedOn,control,baselineFormat:baseline,wholePageCharacters:wholeText.length,reviewExcerpt:control==='review',visibleCharacters:text.length,nonblankLines:text.split('\n').filter(l=>l.trim()).length,lateOffset:wholeText.indexOf(late),sawLate,blockedRequests:blocked,externalRequestsSent:0,readingTimeCET:new Date(readAt).toLocaleString('sv-SE',{timeZone:'Europe/Vienna'}),result},null,2)+'\n');
 if(control==='coverage'){assert.ok(sawLate,'the actual saved-page fact after character 6000 must reach the model');assert.equal(result.status,'ANSWERED');}
 else if(control==='review'){assert.equal(result.status,'UNVERIFIED','a known visible review section must not supply merchant facts');}
 else assert.equal(result.status,'NOT_STATED','complete saved page must allow a scoped not-stated result');
 console.log(JSON.stringify({control,status:result.status,visibleCharacters:text.length,lateOffset:wholeText.indexOf(late),sawLate,externalRequestsSent:0}));
}finally{await browser.close();}
