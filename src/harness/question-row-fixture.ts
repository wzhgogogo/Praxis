import type {RestaurantCandidate} from '../domains/restaurant/contracts.js';
import type {RestaurantPageAnswer} from '../domains/restaurant/page-question.js';
import {ModelRestaurantPageQuestion} from '../integrations/restaurant-facts/model-page-question.js';
import type {RestaurantFactPageObservation} from '../integrations/restaurant-facts/fact-source-document.js';
export async function questionRowFixture(candidate:RestaurantCandidate,mode:'same-row'|'crossed'|'repeated'|'legacy'):Promise<RestaurantPageAnswer>{
 const url='https://tabelog.com/en/tokyo/fixture/',readAt='2026-11-21T08:04:00Z';
 const other=mode==='repeated'?'Available':'Unavailable';
 const page:RestaurantFactPageObservation={readRunId:'row-read',requestedSourceUrl:url,candidateId:candidate.restaurant.id,observedAt:readAt,
  identity:{evidenceId:'row-identity',kind:'ENTITY_MATCH',provider:'TABELOG',sourceEntityId:'fixture-row-source',candidateId:candidate.restaurant.id,sourceUrl:url,observedAt:readAt,requestFingerprint:'row-fixture',entityMatch:{confidence:'HIGH',matchedBy:['EXACT_NAME_AND_ADDRESS']},claims:{outletName:candidate.restaurant.outletName,address:candidate.restaurant.address}},
  snapshot:{url,title:candidate.restaurant.outletName,settlement:'SETTLED',text:`${candidate.restaurant.outletName}\n${candidate.restaurant.address}\nPrivate rooms\nAvailable\nFor 2 people or more.\nPrivate hire\n${other}`,
   html:`<table><tr><th>Private rooms</th><td><p>Available</p><p>For 2 people or more.</p></td></tr><tr><th>Private hire</th><td>${other}</td></tr></table>`}};
 const desired=mode==='crossed'?['Private rooms','Unavailable']:['Private rooms','Available','For 2 people or more.'];
 const core=new ModelRestaurantPageQuestion({async complete(input){
  const documents=JSON.parse(input.messages[1]!.content).sourceDocuments as Array<{id:string;statements:Array<{id:string;text:string}>}>;
  const citations=desired.map(quote=>{for(const document of documents){const statement=document.statements.find(row=>row.text===quote);if(statement)return {documentId:document.id,statementId:statement.id,quote};}throw new Error('Row fixture statement missing: '+quote);});
  return {invocationId:'row-fixture',provider:'FIXTURE',model:'fixture',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify({status:'ANSWERED',answer:'The page lists private-room information. Please check the quoted rows.',citations,sensitiveCategory:'NONE',sourceConflict:false})};
 }},async()=>[page],()=>readAt);
 const answer=await core.answer({question:'Does this restaurant have private rooms?',displayedOutlet:{candidateId:candidate.restaurant.id,sourceUrl:url},readContext:{runId:'row-read',startedAt:'2026-11-21T08:00:00Z'},cachedPages:[page]},new AbortController().signal);
 if(mode==='legacy'&&answer.status==='ANSWERED')for(const citation of answer.citations)delete citation.sourceRow;
 return answer;
}
