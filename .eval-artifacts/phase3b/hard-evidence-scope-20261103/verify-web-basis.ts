import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {chromium} from 'playwright-core';
import {LOCAL_WORKSPACE_PAGE} from '../../../src/web/local-workspace-page.js';
import {assessRestaurantConditions} from '../../../src/domains/restaurant/condition-states.js';
import {restaurantCurrentFactEvidence} from '../../../src/domains/restaurant/read-assessment.js';
const fixtureRoot=new URL('../../../src/application/fixtures/restaurant-presentation-evidence/',import.meta.url);
const saved=JSON.parse(gunzipSync(readFileSync(new URL('checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.result.json.gz',fixtureRoot))).toString());
const state=saved.finalSnapshot.domainState,cid='tabelog:en/tokyo/A1309/A130905/13048623';
const roles=JSON.parse(readFileSync(new URL('hard-source-roles-20261103.json',fixtureRoot),'utf8'));
for(const fact of state.readEvidence){const role=roles.rows.find((r:any)=>r.evidenceId===fact.evidenceId&&r.sourceUrl===fact.sourceUrl);if(role&&!fact.sourceFieldQuotes?.length)fact.sourceFieldQuotes=role.sourceFieldQuotes;}
const name=assessRestaurantConditions(state.intentDraft,restaurantCurrentFactEvidence(state,cid),state.presentedResults.presentedAt)[0]!;
assert.equal(name.status,'MET');assert.ok(name.sources.some(q=>q.field==='NAME'));
// A source-owned category claim need not have a textual quote; this renderer
// component control does not claim the synthetic venue is a live restaurant.
const category=assessRestaurantConditions({criteria:[{text:'cafe',polarity:'POSITIVE',strength:'HARD'}]},[{evidenceId:'category',kind:'RESTAURANT_FACT',provider:'GOOGLE_PLACES',candidateId:'a',observedAt:'2026-11-03T09:00:00Z',requestFingerprint:'fixture',claims:{verifiedHardCriteria:['cafe']}}])[0]!;
assert.equal(category.status,'MET');assert.deepEqual(category.sources,[]);
const results:any[]=[];const browser=await chromium.launch({headless:true});let intercepted=0;
try{for(const [label,condition,expected]of [['observed-name',name,/Based on outlet name:.*Kaiseki/],['category-without-quote',category,/Based on Google category/]]as const){
 const page=await browser.newPage();page.setDefaultTimeout(8000);
 const view={mode:'FIXTURE',case:{caseId:'case',title:'HARD basis',status:'ACTIVE',phase:'PRESENT_RESULTS',taskVersion:1},conversation:{id:'conversation',messages:[]},activities:[],restaurant:{intentDraft:{target:{goal:'RECOMMENDATION'}},missingRequiredFields:[],requestRevision:1,readyCandidateIds:['a'],progress:{active:false,stopped:false},candidates:[{restaurant:{id:'a',outletName:'Saved source / renderer fixture',address:'Tokyo'}}],presentedCandidateIds:['a'],availability:{},availabilityChecks:{},readEvidence:[],currentFactEvidence:[],conditionStates:{a:[condition]}}};
 await page.route('**/*',async route=>{intercepted++;const url=new URL(route.request().url());assert.equal(url.hostname,'workspace.test','all browser requests remain local fulfilled fixtures');const path=url.pathname;if(path==='/')return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});if(path.endsWith('/events')||path.startsWith('/assets/'))return route.abort();return route.fulfill({json:path==='/api/cases'?{cases:[view.case]}:path==='/api/session'?{user:{id:'fixture'}}:{view}});});
 await page.goto('https://workspace.test/');await page.getByRole('button',{name:'HARD basis',exact:true}).click();await page.locator('#candidate-panel').waitFor({state:'visible'});await page.locator('#details-button').click();
 const text=await page.locator('#details-content').innerText();results.push({label,text,status:condition.status,sources:condition.sources});
 if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify({mode:'LOCAL_CHROMIUM_RENDERER_COMPONENT',interceptedRequests:intercepted,realNetworkRequests:0,results},null,2)+'\n');
 assert.match(text,expected);assert.match(text,/— met/);if(label==='category-without-quote')assert.ok(!text.includes('Observed cafe'),'do not invent quotation text');await page.close();
}}finally{await browser.close();}
console.log(JSON.stringify({mode:'LOCAL_CHROMIUM_RENDERER_COMPONENT',interceptedRequests:intercepted,realNetworkRequests:0,results},null,2));
