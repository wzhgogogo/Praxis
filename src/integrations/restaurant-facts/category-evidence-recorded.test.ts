import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {ObservedOutletNames} from '../restaurant-identity/observed-outlet-names.js';
import {SourceAwareFactRead} from './native-source-facts.js';
import {ModelRestaurantFactJudgment} from './model-fact-judgment.js';
import {assessRestaurantConditions} from '../../domains/restaurant/condition-states.js';
import {observedQualificationEvidence} from '../../eval/restaurant/agent-loop/g6/qualification-evidence.js';
import type {RestaurantCaseView} from '../../application/agent-workspace.js';
import {acceptedPositiveHardEvidence} from '../../domains/restaurant/positive-hard-evidence.js';
import {publicPriceText} from '../restaurant-availability/source-price-facts.js';
import type {BrowserRuntime,BrowserSnapshot} from '../../infrastructure/browser/browser-runtime.js';
import type {RestaurantCandidate,RestaurantReadEvidence,RestaurantSearchIntent} from '../../domains/restaurant/contracts.js';

const data=JSON.parse(await readFile(new URL('./fixtures/category-from-d02/input.json',import.meta.url),'utf8')) as {candidate:RestaurantCandidate;intent:RestaurantSearchIntent;evidence:RestaurantReadEvidence[];originalDecision:any};
const original=new URL('./fixtures/category-from-d02/snapshot-0014.html',import.meta.url);
const html=await readFile(original,'utf8');
const fact=data.evidence.find(e=>e.kind==='RESTAURANT_FACT')!;
const now=()=>fact.observedAt;

for(const mode of ['REAL_CATEGORY','LOW','WRONG_QUOTE','REVIEW','PARENT_UNKNOWN','BAD_CITATION'] as const)test(`D02 decision30 CATEGORY component, replacement judgment LOCAL_CONSTRUCTION: ${mode}`,async()=>{
 const evidence=structuredClone(data.evidence);const source=evidence.find(e=>e.kind==='RESTAURANT_FACT')!;
 if(mode==='LOW')source.entityMatch={confidence:'LOW',matchedBy:[]};
 if(mode==='WRONG_QUOTE')source.sourceFieldQuotes![0]!.quote='This sentence was never on the captured page';
 if(mode==='REVIEW')source.sourceFieldQuotes![0]!.field='CUSTOMER_REVIEW';
 const page:BrowserSnapshot={url:fact.sourceUrl!,title:'Actual recorded Sumika',html,text:publicPriceText(html)};
 if(mode==='PARENT_UNKNOWN'){source.sourceFieldQuotes![0]!.quote='Izakaya';page.html='<h1>Constructed parent-only control</h1><p>Izakaya</p>';page.text='Izakaya';}
 const runtime={async openSession(){return {async snapshot(){return page;}};}} as unknown as BrowserRuntime;
 const capture=new ObservedOutletNames(runtime,now);
 await capture.capture(async()=>{const session=await capture.runtime.openSession({signal:new AbortController().signal});await session.snapshot();return {evidence};});
 let calls=0;
 const judge=new ModelRestaurantFactJudgment({async complete(request){calls++;const input=JSON.parse(request.messages[1]!.content);const obs=input.observations.find((o:any)=>o.evidenceId===source.evidenceId);assert.ok(obs);assert.equal(obs.provider,'TABELOG');assert.equal(obs.sourceUrl,source.sourceUrl);assert.ok(obs.groundedEntity);assert.deepEqual(obs.restaurantTypeFacts,[source.sourceFieldQuotes![0]!.quote]);return {invocationId:'constructed-response-not-recorded',provider:'FIXTURE',model:'LOCAL_CONSTRUCTION',outputText:JSON.stringify({sourceSelections:[],judgments:[{criterion:'robatayaki',scope:'RESTAURANT_CATEGORY_TYPE',outcome:mode==='PARENT_UNKNOWN'?'UNKNOWN':'SUPPORTED',evidenceIds:[mode==='BAD_CITATION'?'not-the-source-evidence':source.evidenceId]}]}),finishReason:'TOOL_CALLS',latencyMs:0};}},now,capture.categoryQuotes.bind(capture));
 const result=await judge.judge({candidate:data.candidate,intent:data.intent,evidence});
 const support=acceptedPositiveHardEvidence('robatayaki',[...evidence,...result.evidence]);
 assert.equal(Boolean(support),mode==='REAL_CATEGORY');assert.equal(calls,['REAL_CATEGORY','PARENT_UNKNOWN','BAD_CITATION'].includes(mode)?1:0);
 if(support){
  assert.ok(support.evidenceIds.includes(source.evidenceId));
  let fallbackReads=0;
  const fallback={executionRoute:"GENERIC_BROWSER" as const,async inspectFacts(){fallbackReads++;throw Error('No repeat page read for already captured, cited category');}};
  const reader=new SourceAwareFactRead(fallback,fallback,judge);
  const read=await reader.inspectFacts({candidateIds:[data.candidate.restaurant.id],candidates:[data.candidate],intent:data.intent,sourceEvidence:evidence},new AbortController().signal);
  assert.equal(fallbackReads,0);assert.equal(read.metadata.modelUsage?.calls,1);assert.equal(read.factChecks[data.candidate.restaurant.id]?.status,'COMPLETED');

  const facts=[...evidence,...result.evidence];
  const view={restaurant:{presentedCandidateIds:[data.candidate.restaurant.id],candidates:[data.candidate],currentFactEvidence:facts,conditionStates:{[data.candidate.restaurant.id]:assessRestaurantConditions(data.intent,facts)}}} as unknown as RestaurantCaseView;
  const q=observedQualificationEvidence(view,'actual-recorded-component',[{page,at:source.observedAt}],[]);
  assert.ok(q.claims[0]!.quotes.some(v=>v.text===source.sourceFieldQuotes![0]!.quote&&v.evidenceId===source.evidenceId));
  assert.ok(q.pages.some(p=>p.merchantText.includes(source.sourceFieldQuotes![0]!.quote)),"Independent page text, not product HIGH, verifies occurrence");
 }
 const before=JSON.parse(data.originalDecision.messages.find((m:any)=>m.role==='user').content);assert.equal(before.sourceDocuments.length,0);assert.ok(!before.observations.some((o:any)=>o.evidenceId===source.evidenceId),'Original recording red: CATEGORY absent; old UNKNOWN retained');
});
