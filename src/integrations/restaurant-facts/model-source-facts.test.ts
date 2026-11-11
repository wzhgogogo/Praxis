import assert from "node:assert/strict";
import { test } from "node:test";
import type { ModelGateway, ModelRequest } from "../../core/model/contracts.js";
import { readQuotedRestaurantSourceFacts, type RestaurantSourceFactsInput } from "./model-source-facts.js";
const url="https://merchant.example/venue",time="2026-10-29T09:00:00Z";
const quote="Dinner course: JPY 8,000, tax included; dinner only.";
function input(text=quote):RestaurantSourceFactsInput{return {candidate:{restaurant:{id:"source-facts",outletName:"Public Venue",address:"Tokyo",sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH"},identity:{evidenceId:"source-id",kind:"ENTITY_MATCH",provider:"RESTAURANT_WEBSITE",candidateId:"source-facts",sourceEntityId:"venue",sourceUrl:url,observedAt:time,requestFingerprint:"identity",claims:{outletName:"Public Venue"},entityMatch:{confidence:"HIGH",matchedBy:["EXACT_NAME_AND_ADDRESS"]}},page:{url,title:"Public Venue",text,html:`<main>${text}</main>`,settlement:"SETTLED"},readAt:time};}
const signal=()=>new AbortController().signal;
function model(output:(request:ModelRequest)=>unknown):ModelGateway{return {async complete(request){return {invocationId:"fixture",provider:"FIXTURE",model:"fixture",finishReason:"TOOL_CALLS",latencyMs:0,outputText:JSON.stringify(output(request))};}};}
function selection(request:ModelRequest,first=0,last=first,role="COURSE"){
 const rows=JSON.parse(request.messages[1]!.content).sourceDocument.statements;
 return {selections:[{firstStatementId:rows[first].id,lastStatementId:rows[last].id,role,priceStatementId:role==="CATEGORY"?"":rows.slice(first,last+1).find((s:{text:string})=>/JPY|[¥￥円]/u.test(s.text))?.id??""}]};
}
test("source category selection preserves an observed H1 role and rejects trailing review prose",async()=>{
 const page=input("Public Omakase Venue\nReviews\nWonderful omakase.");page.criteria=["omakase"];
 page.page.html='<h1>Public Omakase Venue</h1><h2>Reviews</h2><p>Wonderful omakase.</p>';
 const name=await readQuotedRestaurantSourceFacts(model(request=>selection(request,0,0,"CATEGORY")),page,()=>time,signal());
 assert.deepEqual(name?.sourceFieldQuotes,[{field:"NAME",quote:"Public Omakase Venue",sourceUrl:url}]);
 assert.equal(await readQuotedRestaurantSourceFacts(model(request=>selection(request,2,2,"CATEGORY")),page,()=>time,signal()),undefined);
});
test("source facts freeze the page and quote metadata before awaiting the model",async()=>{
 const cached=input();const result=await readQuotedRestaurantSourceFacts(model(request=>{const output=selection(request);cached.page.url="https://merchant.example/other-outlet";cached.page.text="Other menu";cached.readAt="2026-10-29T10:00:00Z";return output;}),cached,()=>time,signal());
 assert.equal(result?.sourceUrl,url,"a refreshed mutable cache cannot retarget an older quotation");
 assert.equal(result?.readAt,time);assert.equal(result?.priceFacts?.listedCoursePricesYen[0]?.sourceUrl,url);assert.equal(result?.priceFacts?.listedCoursePricesYen[0]?.quote,quote);
});
test("source selection rejects model numbers, invented IDs, overlapping ranges and customer reviews",async()=>{
 for(const mutate of [
  (body:any)=>{body.selections[0].amount=1;},(body:any)=>{body.selections[0].firstStatementId="other:statement:0";},
  (body:any)=>{body.selections[0].priceStatementId="other:statement:99";},
  (body:any)=>{body.selections.push({...body.selections[0]});},(body:any)=>{body.url="https://other.example";},
 ]){
  const result=await readQuotedRestaurantSourceFacts(model(request=>{const output=selection(request);mutate(output);return output;}),input(),()=>time,signal());assert.equal(result,undefined);
 }
 const reviewed=input(`Reviews\n${quote}\nRestaurant information\nCash only.`);reviewed.page.html=`<h2>Reviews</h2><p>${quote}</p><h2>Restaurant information</h2><p>Cash only.</p>`;
 assert.equal(await readQuotedRestaurantSourceFacts(model(request=>selection(request,1)),reviewed,()=>time,signal()),undefined);
});
test("source price ranges require quoted or public ARIA meal context; ambiguous amounts remain unknown",async()=>{
 const noLabel=input("JPY 6,000 - JPY 7,999");
 const missing=await readQuotedRestaurantSourceFacts(model(request=>selection(request,0,0,"DINNER_BUDGET")),noLabel,()=>time,signal());assert.equal(missing?.priceFacts,undefined);
 noLabel.page.html='<section aria-label="Dinner">JPY 6,000 - JPY 7,999</section>';
 const bound=await readQuotedRestaurantSourceFacts(model(request=>selection(request,0,0,"DINNER_BUDGET")),noLabel,()=>time,signal());assert.deepEqual(bound?.priceFacts?.dinnerBudgetRangeYen,{min:6000,max:7999,quote:noLabel.page.text,sourceUrl:url});
 const fee=input("Dinner course\nJPY 8,000 tax included\nAdditional service fee JPY 2,000.");
 for(const catalogueElsewhere of [false,true]){
  const current=structuredClone(fee);
  if(catalogueElsewhere){current.page.text+="\nJPY 2,000";current.page.html+="<del>JPY 2,000</del>";}
  const ambiguous=await readQuotedRestaurantSourceFacts(model(request=>selection(request,0,2)),current,()=>time,signal());
  assert.equal(ambiguous?.priceFacts,undefined,"a selected base-price ID cannot hide a current fee, including when an unrelated catalog has the same amount");
 }
 const multiple=await readQuotedRestaurantSourceFacts(model(request=>selection(request)),input("Dinner course: JPY 8,000, service fee JPY 2,000."),()=>time,signal());assert.equal(multiple?.priceFacts,undefined,"do not select a cheap amount from an ambiguous complete quote");
});
test("source range preserves every intervening restriction and cancellation rejects a late response",async()=>{
 const text="Dinner course\nJPY 8,000 tax included\nLunch only; number of people 2 - 4.";
 const detached=await readQuotedRestaurantSourceFacts(model(request=>selection(request,0,1)),input(text),()=>time,signal());assert.equal(detached,undefined,"a selected range cannot detach adjacent meal/party restrictions");
 const result=await readQuotedRestaurantSourceFacts(model(request=>selection(request,0,2)),input(text),()=>time,signal());assert.equal(result?.listedCourseDetails[0],text);assert.equal(result?.priceFacts,undefined,"contradictory dinner/lunch-only scope is not an unrestricted comparable price");
 const controller=new AbortController();await assert.rejects(readQuotedRestaurantSourceFacts(model(request=>{controller.abort();return selection(request);}),input(),()=>time,controller.signal),{name:"AbortError"});
});


test("source facts select the actual quoted price line without detaching its complete conditions", async () => {
 const text="Dinner course\nJPY 5,000 old catalog price\nJPY 8,000 tax included\nAvailable only for parties of 4 or more.";
 const current=input(text);current.page.html='<h3>Dinner course</h3><del>JPY 5,000 old catalog price</del><p>JPY 8,000 tax included</p><p>Available only for parties of 4 or more.</p>';
 const gateway=model(request=>{const body=selection(request,0,3);const rows=JSON.parse(request.messages[1]!.content).sourceDocument.statements;return {selections:[{...body.selections[0],priceStatementId:rows[2].id}]};});
 const result=await readQuotedRestaurantSourceFacts(gateway,current,()=>time,signal());
 assert.equal(result?.priceFacts?.listedCoursePricesYen[0]?.amount,8000,"current price comes from a selected original line, never the cheapest amount");
 assert.equal(result?.listedCourseDetails[0],text,"all tax, catalog and party context remains verbatim");
});

test("source facts can cite unstructured merchant type prose with no private fields or menu prices", async () => {
 const text="We serve sushi cuisine.";
 const result=await readQuotedRestaurantSourceFacts(model(request=>{const rows=JSON.parse(request.messages[1]!.content).sourceDocument.statements;return {selections:[{firstStatementId:rows[0].id,lastStatementId:rows[0].id,role:"CATEGORY",priceStatementId:""}]};}),{...input(text),criteria:["sushi"]},()=>time,signal());
 assert.deepEqual(result?.sourceFieldQuotes,[{field:"CATEGORY",quote:text,sourceUrl:url}],"same-page verbatim merchant prose remains available to the existing fact judgment");
});

test("source selection preserves a shared model budget failure instead of swallowing it as missing facts",async()=>{
 const gateway:ModelGateway={async complete(){throw Object.assign(new Error("budget"),{code:"BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"});}};
 await assert.rejects(readQuotedRestaurantSourceFacts(gateway,input(),()=>time,signal()),{code:"BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"});
});
