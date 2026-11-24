import type { PhotoHttpPort } from "../integrations/restaurant-photos/public-photo-http.js";
import type { GooglePhotoTransport } from "../integrations/restaurant-photos/google-photos.js";
import { createLiveReadAssembly } from "../integrations/restaurant-search/live-read-assembly.js";
import { GooglePlacesClient } from "../integrations/google/google-places-client.js";
import { photoOutlets } from "./restaurant-photo-fixtures.js";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";
import { PersistentRestaurantAgentApplication, PilotSessionService } from "../application/persistent-restaurant-agent.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET as readLimits } from "../application/live-read-investigation-budget.js";
import type { SqlDatabase, SqlExecutor, SqlQueryResult } from "../infrastructure/postgres/sql-database.js";
import { applyPostgresMigrations } from "../infrastructure/postgres/migrations.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";
import { RestaurantSemanticInterpreter } from "../domains/restaurant/semantic-interpreter.js";
import { RestaurantAgentDecision } from "../domains/restaurant/agent-decision.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import { ModelGatewayError } from "../core/model/errors.js";
import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import type { RestaurantCandidate, RestaurantSearchRequest, RestaurantAvailabilityRequest } from "../domains/restaurant/contracts.js";
import { restaurantAvailabilityRequestFingerprint, restaurantSearchIntentFingerprint } from "../domains/restaurant/contracts.js";
import { groundTabelogAvailability, groundTableCheckAvailability } from "../domains/restaurant/read-grounding.js";
import { prepareBookingHandoff, type BookingHandoffContext, type BookingHandoffSource, type PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";
import { createLocalWebServer } from "../server/local-web-server.js";
import { FakeClock } from "./fake-clock.js";
import { strictAction } from "./restaurant-read-test-fixtures.js";
import type { RestaurantPageAnswer, RestaurantPageQuestionRequest } from "../domains/restaurant/page-question.js";
import type { ServerResponse } from "node:http";

class Database implements SqlDatabase {
  constructor(readonly pglite: PGlite) {}
  async query<Row>(sql:string, parameters:readonly unknown[]=[]):Promise<SqlQueryResult<Row>> {
    const r=await this.pglite.query<Row>(sql,[...parameters]);return {rows:r.rows,affectedRows:r.affectedRows??0};
  }
  transaction<T>(callback:(tx:SqlExecutor)=>Promise<T>):Promise<T> {
    return this.pglite.transaction((tx:Transaction)=>callback({async query<Row>(sql:string,parameters:readonly unknown[]=[]):Promise<SqlQueryResult<Row>>{
      const r=await tx.query<Row>(sql,[...parameters]);return {rows:r.rows,affectedRows:r.affectedRows??0};
    }}));
  }
}

/** Uses the existing B1 source fixture and restaurant fixture candidates. No external transport exists. */
export async function startWorkspaceFixture(options:{semanticProposal?:(message:string)=>RestaurantSemanticProposal|undefined;photoHttp?:PhotoHttpPort;photoGoogle?:GooglePhotoTransport;photoLongAddress?:boolean;revisionCuisine?:boolean;questionCitations?:boolean;naturalRecommendation?:boolean;matchReasons?:string[];staged?:boolean;multiSlot?:boolean|string[];offerRevision?:string;cuisineDisagreement?:boolean|string;provider?:"TABELOG"|"TABLECHECK";cancellationConflict?:boolean;questions?:boolean|{beforeAnswer:(input:RestaurantPageQuestionRequest,signal:AbortSignal)=>Promise<void>;answer?:(input:RestaurantPageQuestionRequest)=>Promise<RestaurantPageAnswer>};inferredParty?:boolean;extraCandidates?:boolean;checkWholePool?:boolean;laterBatchFirstOnRevision?:boolean;cachedCrossSourceDuplicate?:boolean|{newCandidates:number;beforeDecision?:()=>Promise<void>};sourceValidityMs?:number;revisionScenario?:"structured"|"missing";outcome?:"empty"|"all-sources-failed"|"partial";continuation?:"pool"|"search";beerDiscoveryQuery?:string;discoveryCriterion?:string;beforeSemantic?:(message:string)=>Promise<void>;beforeSearch?:(signal:AbortSignal)=>Promise<void>;semanticFailureMessage?:string}={}) {
  const raw=JSON.parse(await readFile(new URL("../domains/restaurant/fixtures/booking-handoff/source.json",import.meta.url),"utf8")) as {context:BookingHandoffContext;source:BookingHandoffSource};
  const pglite=await PGlite.create(),database=new Database(pglite),clock=new FakeClock(raw.context.now);
  await applyPostgresMigrations(database);
  let held=options.staged??false,release:()=>void=()=>{},gate=Promise.resolve(),checkStarted:()=>void=()=>{};
  let checking=new Promise<void>(resolve=>{checkStarted=resolve});
  const requests:ModelRequest[]=[], providerCalls:Array<{candidateId:string;date:string;timeWindow:RestaurantAvailabilityRequest["timeWindow"];partySize:number;aborted:boolean;completed:boolean}>=[];
  const searches:RestaurantSearchRequest[]=[];
  let failuresRecovered=false, reserveUsed=false;
  let candidates:RestaurantCandidate[]=[];
  const cache=new Map<string,PreparedBookingHandoff>();
  const questionRequests:RestaurantPageQuestionRequest[]=[],answers=new Map<string,RestaurantPageAnswer>();
  const base=new FixtureRestaurantSearch(), provider=options.provider??"TABLECHECK";
  const batchPool=typeof options.cachedCrossSourceDuplicate==="object"?options.cachedCrossSourceDuplicate:undefined;
  const resetGate=()=>{held=true;gate=new Promise<void>(resolve=>{release=resolve});checking=new Promise<void>(resolve=>{checkStarted=resolve});};
  if(held)resetGate();
  const model:ModelGateway={async complete(request):Promise<ModelResponse>{
    requests.push(structuredClone(request));
    let body:unknown;
    if(request.purpose==="restaurant_semantic_interpret"){
      const text=JSON.parse(request.messages.find(m=>m.role==="user")!.content.slice("User restaurant message as JSON string: ".length)) as string;
      await options.beforeSemantic?.(text);
      if(text===options.semanticFailureMessage)throw new ModelGatewayError("Fixture semantic transport failure","NETWORK",false);
      const lines=request.messages[0]!.content.split("\n"),contextLine=lines[lines.findIndex(line=>line.startsWith("Current authoritative context"))+1];
      const semanticContext=contextLine?JSON.parse(contextLine):{},viewed=semanticContext.viewingContext?.candidate;
      const inlineParty=text.match(/^Change \d+ guests to (\d+)(?: guests)?$/i);
      const edit=Object.keys(semanticContext).some(key=>key!=="viewingContext")&&(/three|3 guests/i.test(text)||!!inlineParty);
      const editedParty=inlineParty?Number(inlineParty[1]):3;
      const refer=/this one/i.test(text),inline=text.match(/^Change (.+) to (.+)$/);
      const removed=text.startsWith("Remove ")?text.slice("Remove ".length):undefined;
      const criterion=removed&&semanticContext.criteria?.find((item:{text:string})=>item.text===removed);
      const budget=semanticContext.budgetPerPerson;
      let inlineFacts:RestaurantSemanticProposal["facts"]|undefined;
      if (options.beerDiscoveryQuery && (text === "Find me a restaurant that serves beer" || text === options.beerDiscoveryQuery)) {
        inlineFacts = [
          { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: options.beerDiscoveryQuery, selectionScope: "OPEN_ENDED", goalBasis: {type:"JUDGMENT",reason:"Fixture discovery",quotes:[text]} } },
          { field: "DATE", operation: "ASSERT", value: {kind:"DATE",value:"2026-11-02",raw:"2026-11-02"} },
          { field: "TIME_WINDOW", operation: "ASSERT", value: {kind:"TIME_WINDOW",earliest:"19:00",latest:"19:30",raw:"19:00"} },
          { field: "PARTY_SIZE", operation: "ASSERT", value: {kind:"PARTY_SIZE",value:2,source:"EXPLICIT"} },
          { field: "CRITERION", operation: "ASSERT", value: {kind:"CRITERION",text:options.discoveryCriterion ?? "serves beer",polarity:"POSITIVE",strength:"SOFT"} },
        ];
      } else if (options.beerDiscoveryQuery && /^(Shibuya|Ginza|銀座|渋谷)$/.test(text)) {
        inlineFacts = [{field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:text}}];
      } else if(criterion){
        inlineFacts=[{field:"CRITERION",operation:"NEGATE",value:{kind:"CRITERION",...criterion}}];
      }else if(budget&&removed==="¥"+Number(budget.max).toLocaleString("en-US")+" per guest"){
        inlineFacts=[{field:"BUDGET_PER_PERSON",operation:"NEGATE"}];
      }else if(/^(Keep the same dinner conditions|Same dinner, please)$/i.test(text)&&semanticContext.partySize){
        inlineFacts=[{field:"PARTY_SIZE",operation:"CORRECT",value:{kind:"PARTY_SIZE",value:semanticContext.partySize,source:semanticContext.partySizeSource??"EXPLICIT"}}];
      }else if(text==="Higashi-Ginza"&&semanticContext.area?.query==="nearby"){
        inlineFacts=[{field:"AREA",operation:"CORRECT",value:{kind:"AREA",query:text}}];
      }else if(inline&&semanticContext.area&&inline[1]===semanticContext.area.query){
        inlineFacts=[{field:"AREA",operation:"CORRECT",value:{kind:"AREA",query:inline[2]!}}];
      }else if(inline&&/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), [A-Za-z]{3} \d{1,2}$/.test(inline[1]!)&&/^\d{4}-\d{2}-\d{2}$/.test(inline[2]!)){
        inlineFacts=[{field:"DATE",operation:"CORRECT",value:{kind:"DATE",value:inline[2]!,raw:inline[2]!}}];
      }else if(inline&&/^\d{2}:\d{2}(?:–\d{2}:\d{2})?$/.test(inline[1]!)){
        const times=inline[2]!.match(/^(\d{2}:\d{2})(?:–(\d{2}:\d{2}))?$/);
        if(times)inlineFacts=[{field:"TIME_WINDOW",operation:"CORRECT",value:{kind:"TIME_WINDOW",earliest:times[1]!,latest:times[2]??times[1]!,raw:inline[2]!}}];
      }
      const facts:RestaurantSemanticProposal["facts"]=inlineFacts??(edit?[
        ...(options.revisionCuisine?[{field:"CRITERION" as const,operation:"ASSERT" as const,value:{kind:"CRITERION" as const,text:"tempura",polarity:"POSITIVE" as const,strength:"SOFT" as const}}]:[]),
        {field:"PARTY_SIZE",operation:"CORRECT",value:{kind:"PARTY_SIZE",value:editedParty,source:"EXPLICIT"}},
        ...(options.revisionScenario?[
          {field:"TARGET",operation:"CORRECT",value:{kind:"TARGET",goal:"AVAILABILITY",query:"sushi in Tokyo",selectionScope:"OPEN_ENDED",requestedResultCount:2,goalBasis:{type:"BOOKING_WORDING",reason:"Fixed updated request",quotes:[text]}}},
          {field:"TIME_WINDOW",operation:"CORRECT",value:{kind:"TIME_WINDOW",earliest:"20:00",latest:"20:30",raw:"20:00"}},
          {field:"BUDGET_PER_PERSON",operation:"ASSERT",value:{kind:"BUDGET_PER_PERSON",max:10_000,currency:"JPY"}},
        ] as RestaurantSemanticProposal["facts"]:[]),
      ]:refer?[
        {field:"TARGET",operation:"CORRECT",value:{kind:"TARGET",goal:"AVAILABILITY",query:viewed?.outletName??"UNRESOLVED",selectionScope:"SPECIFIC_OUTLET",goalBasis:{type:"JUDGMENT",reason:"Fixture current reference",quotes:[text]}}},
      ]:[
        {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:"sushi in Tokyo",selectionScope:"OPEN_ENDED",...(options.outcome==="partial"?{requestedResultCount:2}:{}),goalBasis:{type:"BOOKING_WORDING",reason:"Fixture booking wording",quotes:[text]}}},
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:"2026-11-02",raw:"2026-11-02"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:"19:00",latest:"19:30",raw:"19:00"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:options.inferredParty?4:2,source:options.inferredParty?"INFERRED_CLOSED_PARTY":"EXPLICIT"}},
        {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Tokyo"}},
      ]);
      body=options.semanticProposal?.(text)??{schemaVersion:"4",facts};
    } else if(request.purpose==="restaurant_agent_decide"){
      const {context}=JSON.parse(request.messages.find(m=>m.role==="user")!.content) as {context:{missingBlockingFields?:string[];candidates?:Array<{id:string}>;checkableCandidateIds?:string[];legalActions?:{search:boolean;presentResults:string[]};searchAvailability?:{available:boolean};presentation?:Array<{candidateId:string;eligible:boolean}>;resultBatchTarget?:{excludeCandidateIds:string[]}}};
      await batchPool?.beforeDecision?.();
      const ready=batchPool?context.legalActions?.presentResults??[]:context.presentation?.filter(item=>item.eligible&&!context.resultBatchTarget?.excludeCandidateIds.includes(item.candidateId)).map(item=>item.candidateId)??[];
      body=options.beerDiscoveryQuery && context.missingBlockingFields?.includes("area")
        ? {...strictAction("ASK_USER"),question:"Which area works for you?",relatedFields:["area"]}
        : (options.checkWholePool||options.cachedCrossSourceDuplicate)&&context.checkableCandidateIds?.length
        ?strictAction("CHECK_AVAILABILITY",[context.checkableCandidateIds[0]!]):ready.length>=3?strictAction("PRESENT_RESULTS",ready.slice(0,3)):!context.candidates?.length?strictAction("SEARCH_RESTAURANTS"):context.checkableCandidateIds?.length?
        strictAction("CHECK_AVAILABILITY",[context.checkableCandidateIds[0]!]):ready.length?strictAction("PRESENT_RESULTS",ready):options.continuation==="search"&&context.legalActions?.search?strictAction("SEARCH_RESTAURANTS"):strictAction("END_READ");
    } else throw new Error("No external model or unsupported fixture purpose: "+request.purpose);
    return {invocationId:"workspace-fixture:"+requests.length,provider:"FIXTURE",model:"workspace-fixed-boundary",outputText:JSON.stringify(body),finishReason:"TOOL_CALLS",latencyMs:0};
  }};
  const restaurant={
    executionRoute:"STRUCTURED_ADAPTER" as const,
    async search(request:RestaurantSearchRequest,signal:AbortSignal){
      await options.beforeSearch?.(signal);
      searches.push(structuredClone(request));
      const fixture=await base.search(request,signal);
      candidates=[structuredClone(raw.context.candidate),...fixture.candidates.slice(1)];
      candidates[0]!.matchReasons=[...fixture.candidates[0]!.matchReasons];
      if(options.revisionScenario&&request.intent.partySize===3){
        const added={...structuredClone(fixture.candidates[2]!),restaurant:{...structuredClone(fixture.candidates[2]!.restaurant),id:"fixture-revision-added",outletName:"Fixture new option"}};
        candidates=options.revisionScenario==="missing"?[candidates[0]!,added]:[...candidates,added];
      }
      if(options.extraCandidates||options.continuation==="pool")candidates.push(...fixture.candidates.map((item,index)=>({...structuredClone(item),restaurant:{...structuredClone(item.restaurant),id:"fixture-later-"+index,outletName:"Fixture later restaurant "+(index+1)}})));
      if(options.continuation==="search")candidates=searches.length===1?candidates.slice(0,1):fixture.candidates.map((item,index)=>({...structuredClone(item),restaurant:{...structuredClone(item.restaurant),id:"fixture-continuation-"+index,outletName:"Fixture continued restaurant "+(index+1)}}));
      if(options.cachedCrossSourceDuplicate){
        const first=candidates[0]!;
        const cached=fixture.candidates.slice(0,batchPool?.newCandidates??fixture.candidates.length).map((item,index)=>({...structuredClone(item),restaurant:{
          ...structuredClone(item.restaurant),id:"fixture-cache-"+index,outletName:"Fixture cached restaurant "+(index+1),address:"Fixture cache address "+(index+1),
        }}));
        candidates.push({...structuredClone(first),restaurant:{...structuredClone(first.restaurant),id:"fixture-cache-alias"}},...cached);
      }
      candidates.forEach((c,i)=>{const serial=c.restaurant.id==="fixture-revision-added"?99:c.restaurant.id.startsWith("fixture-continuation-")?100+i:i;c.restaurant.sourceIds={tabelog:String(13123456+serial),...(provider==="TABLECHECK"?{tablecheck:serial===99?"fixture-revision-new":"fixture-sushi"+(serial||"")}:{})};c.executionConfidence="HIGH";});
      if(options.cachedCrossSourceDuplicate)for(const [index,candidate] of candidates.entries()){
        candidate.restaurant.sourceIds.discoverySourceId=index<3?"tabelog":"tablecheck";
      }
      if(options.photoHttp||options.photoGoogle)for(const [index,item]of candidates.entries())if(photoOutlets[index]){
        item.restaurant.sourceIds.googleWebsiteUri='https://photos.example.org'+photoOutlets[index]!.path;
        if(options.photoGoogle){item.restaurant.sourceIds.googlePlaces='fixture_'+index;item.restaurant.sourceIds.googleMapsUri='https://maps.google.com/?cid=fixture'+index;}
        if(options.photoLongAddress){item.restaurant.address='Japan, 〒160-0022 '+photoOutlets[index]!.address+' ※ East entrance, 【annex building, level 8】 '+('Very long building and entrance description, '.repeat(10));}
      }
      if(options.laterBatchFirstOnRevision&&request.intent.partySize===3)candidates.push(...candidates.splice(0,3));
      const found=request.intent.target?.selectionScope==="SPECIFIC_OUTLET"?candidates.filter(c=>c.restaurant.outletName===request.intent.target!.query):candidates;
      if(options.matchReasons)for(const candidate of found)candidate.matchReasons=[...options.matchReasons];
      if(options.naturalRecommendation)for(const candidate of found)candidate.matchReasons=["A good fit for your dinner plans in this area."];
      return {candidates:found,evidence:found.map(c=>({evidenceId:"area:"+c.restaurant.id,kind:"DISCOVERY" as const,provider:"GOOGLE_PLACES" as const,candidateId:c.restaurant.id,sourceEntityId:"fixture-place:"+c.restaurant.id,observedAt:clock.now().toISOString(),requestFingerprint:"workspace-fixture-search",claims:{areaQuery:request.intent.area?.query??"Tokyo",areaMatch:true,...(options.photoLongAddress?{distanceMeters:450,areaMatchBasis:"TASK_LOCATION_RADIUS"}:{})}})),...(options.continuation==="search"?{continuation:{intentFingerprint:restaurantSearchIntentFingerprint(request.intent),usedPageTokens:searches.length===1?[]:["workspace-next"],pagesRead:searches.length,exhausted:searches.length>1,...(searches.length===1?{nextPageToken:"workspace-next"}:{})}}:batchPool?{continuation:{intentFingerprint:restaurantSearchIntentFingerprint(request.intent),usedPageTokens:[],pagesRead:1,exhausted:true}}:{}),metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};
    },
    async check(request:RestaurantAvailabilityRequest,signal:AbortSignal){
      const id=request.candidateIds[0]!,index=candidates.findIndex(c=>c.restaurant.id===id);
      const call={candidateId:id,date:request.date,timeWindow:structuredClone(request.timeWindow),partySize:request.partySize,aborted:false,completed:false};providerCalls.push(call);
      signal.addEventListener("abort",()=>{call.aborted=true;},{once:true});
      if(held&&index===1){checkStarted();await gate;}
      // Deliberately deliver a late fixture response even after abort. The real Router/Runtime must discard it.
      const candidate=candidates[index]!;
      const sourceEntityId=provider==="TABLECHECK"?candidate.restaurant.sourceIds.tablecheck!:candidate.restaurant.sourceIds.tabelog!;
      const sourceUrl=provider==="TABLECHECK"?"https://www.tablecheck.com/en/shops/"+sourceEntityId+"/reserve":"https://tabelog.com/en/tokyo/A1301/A130101/"+sourceEntityId+"/";
      const ground=provider==="TABLECHECK"?groundTableCheckAvailability:groundTabelogAvailability;
      const changed=!!options.revisionScenario&&request.partySize===3;
      const reserve=!!options.continuation&&!reserveUsed;
      const failed=!failuresRecovered&&(options.outcome==="all-sources-failed"||(options.outcome==="partial"&&index===1)||(reserve&&options.continuation==="pool"));
      const noSlot=reserve||options.outcome==="empty"||(changed&&id==="fixture-restaurant-3");
      const amount=changed&&id==="fixture-restaurant-2"?20_000:5_000;
      const result=ground(candidate,request,{candidateId:id,sourceEntityId,sourceUrl,observedAt:clock.now().toISOString(),...(options.sourceValidityMs?{sourceExpiresAt:new Date(clock.now().valueOf()+options.sourceValidityMs).toISOString()}:{}),requestedDate:request.date,requestedPartySize:request.partySize,visibleSlots:noSlot||failed?[]:options.multiSlot===true?[request.timeWindow.earliest,request.timeWindow.latest]:options.multiSlot||[request.timeWindow.earliest],pageState:failed?"BOT_CHALLENGE":noSlot?"NO_MATCHING_SLOT":"AVAILABLE",entityMatch:{confidence:"HIGH",matchedBy:["SYNTHETIC_SAME_OUTLET"]},
        ...(options.revisionScenario||options.photoLongAddress?{priceFacts:{schemaVersion:"restaurant-price-facts@1" as const,listedCoursePricesYen:[{amount,kind:"MEAL" as const,meal:"DINNER" as const,tax:"INCLUDED" as const,quote:"Dinner course ¥"+amount,sourceUrl}]}}:{})},clock.now().toISOString());
      if(options.cuisineDisagreement){
        const at=clock.now().toISOString(),placeId='fixture-place:'+id;
        result.evidence.push({evidenceId:'google-identity:'+id,kind:'ENTITY_MATCH',provider:'GOOGLE_PLACES',candidateId:id,sourceEntityId:placeId,observedAt:at,requestFingerprint:'fixture',claims:{},entityMatch:{confidence:'HIGH',matchedBy:['SYNTHETIC_SAME_OUTLET']}},
          {evidenceId:'google-category:'+id,kind:'RESTAURANT_FACT',provider:'GOOGLE_PLACES',candidateId:id,sourceEntityId:placeId,sourceUrl:'https://maps.google.com/?cid=123',observedAt:at,requestFingerprint:'fixture',claims:{restaurantTypeFacts:['cantonese restaurant','dim sum restaurant']}},
          {evidenceId:'source-category:'+id,kind:'RESTAURANT_FACT',provider,candidateId:id,sourceEntityId,sourceUrl,observedAt:at,requestFingerprint:'fixture',claims:{},sourceFieldQuotes:[{field:'CATEGORY',quote:typeof options.cuisineDisagreement==='string'?options.cuisineDisagreement:'Chinese, Dumpling, Izakaya',sourceUrl}]});
      }
      const check={...result.check,sourceProvider:provider,requestFingerprint:restaurantAvailabilityRequestFingerprint(request),...(failed?{sourceAttempts:[{source:provider,outcome:"FAILED" as const,reasonCode:"BOT_CHALLENGE"}]}:{})};
      if(!result.offers.length){if(reserve){reserveUsed=true;clock.advance(readLimits.maxAutomaticBrowserMs-19_000);}call.completed=true;return {...result,availabilityChecks:{[id]:check},metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};}
      const entity=result.evidence.find(e=>e.kind==="ENTITY_MATCH")!,availability=result.evidence.find(e=>e.kind==="AVAILABILITY")!;
      for(const offer of result.offers){
      if(options.offerRevision)offer.id+=":"+options.offerRevision;
      if(options.photoLongAddress)offer.price={amount,currency:"JPY",basis:"PER_PERSON"};
      let source:BookingHandoffSource={...structuredClone(raw.source),observedAt:clock.now().toISOString(),candidateId:id,sourceEntityId,offerId:offer.id,availabilityEvidenceId:availability.evidenceId,
        url:index===0&&request.partySize===raw.context.request.partySize&&request.date===raw.context.request.date&&offer.dateTime===raw.context.offer.dateTime?raw.source.url:"https://tabelog.com/en/booking/form_course/new?rcd="+sourceEntityId+"&member="+request.partySize+"&visit_date="+request.date.replaceAll("-","")+"&visit_time="+offer.dateTime.slice(11,16).replace(":","")};
      // The source-cache preparation uses the same request binding that the
      // real reducer will independently attach to the returned availability event.
      if(index!==0)delete source.terms;
      if(provider==="TABLECHECK"){
        const shop=sourceEntityId,entrance="https://www.tablecheck.com/en/shops/"+shop+"/reserve";
        source={...source,provider:"TABLECHECK",linkBasis:"VERIFIED_PARAMETERS",sourceEntityId:shop,observedEntranceUrl:entrance,url:entrance+"?start_date="+request.date+"&start_time="+encodeURIComponent(offer.dateTime.slice(11,16))+"&num_people="+request.partySize};
      }
      if(source.terms){
        if(options.cancellationConflict&&provider==="TABELOG"){
          const english=structuredClone(source.terms.cancellation!),japanese=structuredClone(english);
          if(japanese.status!=="ANSWERED")throw new Error("Expected existing B1 answer fixture");
          const url="https://tabelog.com/tokyo/A1301/A130101/13123456/",quote="前日キャンセルは50％、当日は100％です。";
          japanese.answer="Cancellation costs 50% the day before and 100% on the day.";
          japanese.citations=[{...japanese.citations[0]!,url,text:quote}];japanese.checkedPages=[{url,readAt:clock.now().toISOString()}];
          source.terms.pages=[...source.terms.pages,{...source.terms.pages[0]!,url,text:quote}];
          source.terms.cancellationConflict={japanese,english};
        }
        for(const page of source.terms.pages){page.identityEvidenceId=entity.evidenceId;page.readAt=clock.now().toISOString();if(provider==="TABLECHECK"){page.provider="TABLECHECK";page.sourceEntityId=source.sourceEntityId;page.url="https://www.tablecheck.com/en/shops/"+source.sourceEntityId+"/reserve";}}
        for(const answer of [source.terms.cancellation,source.terms.card?.answer,source.terms.cancellationConflict?.japanese,source.terms.cancellationConflict?.english])if(answer){answer.candidateId=id;for(const p of answer.checkedPages){p.readAt=clock.now().toISOString();if(provider==="TABLECHECK")p.url=source.terms.pages[0]!.url;}if("citations" in answer)for(const c of answer.citations){c.readAt=clock.now().toISOString();c.identityEvidenceId=entity.evidenceId;if(provider==="TABLECHECK")c.url=source.terms.pages[0]!.url;}}
        if(source.terms.plan)source.terms.plan.readAt=clock.now().toISOString();
        if(source.terms.plan){source.terms.plan.identityEvidenceId=entity.evidenceId;if(provider==="TABLECHECK")source.terms.plan.url=source.terms.pages[0]!.url;}
      }
      const prepared=prepareBookingHandoff(source,{candidate,offer:offer,check,request:{...raw.context.request,date:request.date,timeWindow:request.timeWindow,partySize:request.partySize},evidence:result.evidence,now:clock.now().toISOString()});
      if(source.terms?.card?.answer){const answer=structuredClone(source.terms.card.answer);
        if(options.questionCitations&&answer.status==="ANSWERED")answer.citations=[0,1,2].map(i=>({...answer.citations[0]!,text:["Private rooms","Unavailable","Available"][i]!,readAt:new Date(clock.now().valueOf()-i*1000).toISOString()}));
        answers.set(id,answer);
      }
      if(prepared)cache.set(id+":"+offer.id,prepared);
      else throw new Error("Fixture B1 source was not admitted for "+id);
      }
      call.completed=true;
      return {...result,availabilityChecks:{[id]:check},metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};
    },
    async inspectFacts(){throw new Error("No fixture fact read was planned");},
  };
  const application=new PersistentRestaurantAgentApplication({database,clock,semanticInterpreter:new RestaurantSemanticInterpreter(model),agentDecision:new RestaurantAgentDecision(model),restaurantSearch:restaurant,restaurantAvailability:restaurant,restaurantFacts:restaurant,
    ...(options.questions?{restaurantQuestions:{executionRoute:"STRUCTURED_ADAPTER" as const,async answerQuestion(input:RestaurantPageQuestionRequest,signal:AbortSignal):Promise<RestaurantPageAnswer>{questionRequests.push(structuredClone(input));if(typeof options.questions==="object"){await options.questions.beforeAnswer(input,signal);if(options.questions.answer)return options.questions.answer(input);}return structuredClone(answers.get(input.candidate.restaurant.id)??{status:"UNVERIFIED",candidateId:input.candidate.restaurant.id,reason:"NO_BOUND_PAGE",checkedPages:[]});}}}:{}),
    workspaceMode:"LIVE_READ",executionRouterOptions:{structuredReadTimeoutMs:readLimits.maxStructuredReadMs,browserReadTimeoutMs:readLimits.maxAutomaticBrowserMs},agentLoopOptions:{maxSteps:readLimits.maxAgentSteps,maxRejectedActions:readLimits.maxRejectedActions,timeoutMs:readLimits.maxAutomaticBrowserMs}});
  const sessions=new PilotSessionService(application.store,[{accessToken:"workspace-fixture",id:"workspace-user",displayName:"Fixture account"},{accessToken:"workspace-other",id:"other-user",displayName:"Other account"}],clock);
  const readAssembly=options.photoHttp||options.photoGoogle?createLiveReadAssembly(readLimits,{model,clock,google:new GooglePlacesClient({apiKey:'fixture-not-a-secret',fetchImplementation:async()=>{throw new Error('Photo fixture must not call Google');}}),browser:{async openSession(){throw new Error('Photo fixture must not launch a model browser');}},...(options.photoHttp?{photoHttp:options.photoHttp}:{}),...(options.photoGoogle?{googlePhotos:options.photoGoogle}:{})}):undefined;
  const server=createLocalWebServer({application,sessions,...(readAssembly?{readAssembly}:{}),bookingHandoffs:{readPrepared:()=>[...cache.values()],now:()=>clock.now().toISOString()}});
  const streams=new Set<ServerResponse>();server.on("request",(request,response)=>{if(request.url?.endsWith("/events")){streams.add(response);response.on("close",()=>streams.delete(response));}});
  server.listen(0,"127.0.0.1");await once(server,"listening");
  return {database,server,baseUrl:"http://127.0.0.1:"+(server.address() as AddressInfo).port,application,clock,requests,providerCalls,questionRequests,searches,
    forgetPrepared(candidateId:string,offerId:string){return cache.delete(candidateId+":"+offerId);},
    recoverSources(){failuresRecovered=true;},
    disconnectStreams(){for(const stream of streams)stream.end();},
    activeStreamCount(){return streams.size;},
    release(){held=false;release();},hold(){resetGate();},waitForCheck(){return checking;},
    async close(){held=false;release();await application.stopActiveReads();server.close();server.closeAllConnections();await once(server,"close");await pglite.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const host=await startWorkspaceFixture();process.stdout.write(JSON.stringify({mode:"LOCAL_CHROMIUM_FIXTURE",url:host.baseUrl,accessToken:"workspace-fixture",realProviderCalls:0})+"\n");
  process.on("SIGINT",()=>{void host.close().then(()=>process.exit(0));});
}
