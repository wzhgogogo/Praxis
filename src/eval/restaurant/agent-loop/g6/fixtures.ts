import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, type Page } from "playwright-core";
import type { ModelGateway, ModelRequest, ModelResponse } from "../../../../core/model/contracts.js";
import type { RestaurantAgentContext } from "../../../../domains/restaurant/agent-context.js";
import type { RestaurantSemanticProposal } from "../../../../domains/restaurant/semantic-proposal.js";
import type { BrowserPageControl, BrowserRuntime, BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import { LocalPlaywrightChromium } from "../../../../infrastructure/browser/local-playwright-chromium.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { FakeClock } from "../../../../harness/fake-clock.js";
import { strictAction } from "../../../../harness/restaurant-read-test-fixtures.js";
import { renamePrivateMarkers } from "../../dom-change/mutation.js";

export type G6FixtureKind="RESPONSE_MISSING"|"RESPONSE_CHANGED"|"NORMAL"|"RENAMED"|"CONTROL_FALLBACK"|"PRICE_MATCH"|"PRICE_PARTY"|"PRICE_DATE"|"PRICE_MEAL"|"JAPANESE_NAME";
export interface G6SourceEvent {kind:string;url:string;method:string;at:string;detail?:unknown;}

/** LOCAL_CONSTRUCTION, never site replay. No business Port/accepted evidence injection. */
export async function g6Fixture(kind:G6FixtureKind="NORMAL") {
  const source=JSON.parse(await readFile(new URL("../cases/g6-development/source.json",import.meta.url),"utf8")) as {
    referenceTime:string;outlet:{id:string;name:string;address:string;phone:string;latitude:number;longitude:number};pageUrl:string;date:string;time:string;partySize:number;merchantQuote:string;question:string;
    vacancy:{url:string;body:unknown};initialRequest:string;
  };
  const clock=new FakeClock(source.referenceTime),events:G6SourceEvent[]=[],snapshots:BrowserSnapshot[]=[];
  const observed=(k:string,url:string,method="GET",detail?:unknown)=>events.push({kind:k,url,method,at:clock.now().toISOString(),...(detail!==undefined?{detail}:{})});
  const prices=kind.startsWith("PRICE_");
  const course=prices?`${kind==="PRICE_MEAL"?"Lunch":"Dinner"} course\nJPY 5,000 tax included\nnumber of people ${kind==="PRICE_PARTY"?"4 - 4":"2 - 2"}\nAvailable on ${kind==="PRICE_DATE"?"2026-11-12":source.date} only.`:"";
  const paragraphs=[source.merchantQuote,...course.split("\n").filter(Boolean)];
  const request=source.initialRequest+(prices?" The price must be at most 6000 yen per person.":"");
  const identity=`<h1 class="merchant-name" id="merchant-title">${source.outlet.name}</h1><p>${source.outlet.address}</p><a href="tel:${source.outlet.phone}">${source.outlet.phone}</a><script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name:source.outlet.name,address:source.outlet.address,telephone:source.outlet.phone})}</script>`;
  const endpoint=source.vacancy.url;
  const accessible=kind==="CONTROL_FALLBACK"||kind==="RENAMED";
  const controls=accessible?`<select hidden name="party"><option value="1">Old template</option></select><select hidden name="date"><option value="1970-01-01">Old template</option></select>
    <label>Date<input name="new-day" type="date" value="2026-11-10" onchange="update()"></label>
    <label>Guests<select name="new-count" onchange="update()"><option value="1" selected>1 guest</option><option value="2">2 guests</option></select></label>
    <script>let sent=false;function update(){const date=document.querySelector('[name=new-day]').value,party=document.querySelector('[name=new-count]').value;if(date==='${source.date}'&&party==='2'&&!sent){sent=true;fetch(${JSON.stringify(endpoint)}).then(r=>r.json())}}</script>`
    :`<label>Date<select name="date"><option selected value="${source.date}">${source.date}</option></select></label><label>Guests<select name="party"><option selected value="2">2 guests</option></select></label>`;
  const html=`<!doctype html><html lang="en"><head><title>${source.outlet.name}</title><style>.merchant-name{font-weight:bold}</style></head><body><main aria-labelledby="merchant-title">${identity}<h2>Restaurant information</h2>${paragraphs.map(p=>`<p class="public-copy" data-testid="merchant-copy">${p}</p>`).join("")}<h2>Availability</h2>${controls}</main></body></html>`;
  const text=[source.outlet.name,source.outlet.address,source.outlet.phone,...paragraphs,"Availability",`${source.date}. 2 guests. 19:00.`].join("\n");
  let realPage:Page|undefined;
  const markerMaps:Array<Awaited<ReturnType<typeof renamePrivateMarkers>>> = [];
  const fake:BrowserRuntime={async openSession(){let current=source.pageUrl;return {
    metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:clock.now().toISOString()},
    async navigate(url){observed("NAVIGATE",url);if(url!==source.pageUrl&&!(kind==="JAPANESE_NAME"&&new URL(url).origin==="https://tabelog.com"&&new URL(url).pathname==="/en/tokyo/rstLst/"))throw Error("Constructed source has no response for this public entrance");current=url;},
    async snapshot(){
      const search=new URL(current).pathname.includes("rstLst"),found=new URL(current).searchParams.get("sw")==="すし本店";
      const page:BrowserSnapshot=search?{url:current,title:"Search",text:found?"すし本店":"No restaurants were found that match your search criteria",html:found?`<a href="${source.pageUrl}">すし本店</a>`:""}
        :{url:current,title:source.outlet.name,text,html,responses:kind==="RESPONSE_MISSING"?[]:[{url:endpoint,status:200,sequence:1,observedAt:clock.now().toISOString(),body:kind==="RESPONSE_CHANGED"?{base_date:{year:2026,month:11,day:11},members:2,selection:"changed-wire-shape"}:source.vacancy.body}]};
      snapshots.push(structuredClone(page));return page;
    },async observeControls(){const controls:BrowserPageControl[]=[];
      if(new URL(current).searchParams.get("sw")==="すし本店")controls.push({id:"source-link",stableKey:"source-link",kind:"LINK",role:"link",label:"すし本店",href:source.pageUrl,visible:true,disabled:false});return controls;
    },async select(_selector,value){return [value];},async click(){assert.fail("No submission transport");},async fill(){assert.fail("No form transport");},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){},
  };}};
  const real:BrowserRuntime=new LocalPlaywrightChromium({browserType:{async launch(options){
    const browser=await chromium.launch(options),original=browser.newContext.bind(browser);
    browser.newContext=async opts=>{const context=await original(opts),newPage=context.newPage.bind(context);
      context.newPage=async()=>{realPage=await newPage();return realPage;};
      await context.route("**/*",async route=>{const url=route.request().url();observed("SOURCE_HTTP",url,route.request().method());
        if(url===source.pageUrl)return route.fulfill({contentType:"text/html",body:html});
        if(url===endpoint)return route.fulfill({contentType:"application/json",body:JSON.stringify(source.vacancy.body)});
        return route.abort();});return context;};return browser;
  }}});
  const raw=accessible?real:fake;
  // Fixed transport owns all HTTP. Do not add a second route.fetch that could
  // bypass interception. The Guard acceptance case uses a dedicated guarded I/O.
  const browser:BrowserRuntime={async openSession(input){const session=await raw.openSession(input);return new Proxy(session,{get(target,key){
    if(key==="navigate")return async(...args:Parameters<typeof session.navigate>)=>{await target.navigate(...args);if(kind==="RENAMED"&&realPage){
      const mutation=await renamePrivateMarkers(realPage,"g6-whole-assembly@1");
      // Saved-page G2 disables scripts. This constructed control page instead
      // executes its name-based event handlers; record that distinction.
      markerMaps.push({...mutation,inlineScriptsExecuted:true});
    }};
    if(key==="snapshot")return async()=>{const page=await target.snapshot();snapshots.push(structuredClone(page));return page;};
    const v=Reflect.get(target,key,target);return typeof v==="function"?v.bind(target):v;
  }});}};
  const googleFetch:typeof fetch=async(url,init)=>{
    observed("GOOGLE_IO",String(url),init?.method??"GET");
    const place={id:source.outlet.id,displayName:{text:kind==="JAPANESE_NAME"?"G6 Development Sushi Tokyo":source.outlet.name},formattedAddress:source.outlet.address,nationalPhoneNumber:source.outlet.phone,
      location:{latitude:source.outlet.latitude,longitude:source.outlet.longitude},types:["restaurant"],...(kind!=="JAPANESE_NAME"?{websiteUri:source.pageUrl}:{})};
    const query=init?.body?JSON.parse(String(init.body)).textQuery:undefined;
    const body=init?.method==="POST"?{places:query==="Shibuya"?[{id:"g6-station",displayName:{text:"Shibuya"},types:["train_station"],location:place.location}]:[place]}
      :{...place,...(kind==="JAPANESE_NAME"?{displayName:{text:"すし本店"}}:{})};
    return new Response(JSON.stringify(body),{status:200});
  };
  const google=new GooglePlacesClient({apiKey:"local-g6-source-key",fetchImplementation:googleFetch});
  const factAttempts=new Set<string>();
  const model:ModelGateway={async complete(input){let body:unknown;
    const data=()=>JSON.parse(input.messages.find(m=>m.role==="user")!.content);
    if(input.purpose==="restaurant_semantic_interpret"){
      const message=JSON.parse(input.messages.find(m=>m.role==="user")!.content.slice("User restaurant message as JSON string: ".length));
      const proposal:RestaurantSemanticProposal={schemaVersion:"4",facts:[
        {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:"restaurant in Shibuya",selectionScope:"OPEN_ENDED",requestedResultCount:1,goalBasis:{type:"BOOKING_WORDING",reason:"Frozen development source request",quotes:[message]}}},
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:source.date,raw:"November 11, 2026"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:source.time,latest:source.time,raw:"7 PM"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:2,source:"EXPLICIT"}},{field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Shibuya"}},
        ...(prices?[{field:"BUDGET_PER_PERSON" as const,operation:"ASSERT" as const,value:{kind:"BUDGET_PER_PERSON" as const,max:6000,currency:"JPY" as const}}]:[]),
      ]};body=proposal;
    }else if(input.purpose==="restaurant_agent_decide"){
      const c=data().context as RestaurantAgentContext,eligible=c.presentation.filter(p=>p.eligible).map(p=>p.candidateId);
      if(!c.candidates.length&&c.searchAvailability?.available)body=strictAction("SEARCH_RESTAURANTS");
      else if((prices||kind==="RESPONSE_MISSING"||kind==="RESPONSE_CHANGED")&&c.factInvestigableCandidateIds?.some(id=>!factAttempts.has(id))){
        const id=c.factInvestigableCandidateIds.find(id=>!factAttempts.has(id))!;factAttempts.add(id);body=strictAction("INVESTIGATE_CANDIDATE_FACTS",[id]);
      }
      else if(c.checkableCandidateIds?.length)body=strictAction("CHECK_AVAILABILITY",c.checkableCandidateIds.slice(0,1));
      else if(eligible.length)body=strictAction("PRESENT_RESULTS",eligible);
      else if(c.readCompletion?.allowed)body=strictAction("END_READ");
      else if(c.searchAvailability?.available)body=strictAction("SEARCH_RESTAURANTS");
      else body={...strictAction("ASK_USER"),question:"I could not verify a qualifying result. Would you like to change the request?"};
    }else if(input.purpose==="restaurant_source_facts"){
      const statements=data().sourceDocument.statements as Array<{id:string;text:string;sourceRole:string}>;
      const start=statements.findIndex(s=>/^(?:Dinner|Lunch) course/u.test(s.text)),price=statements.find(s=>/JPY 5,000/u.test(s.text));
      const end=statements.findIndex((s,i)=>i>=start&&s.text.startsWith("Available on "));
      body={selections:start>=0&&price&&end>=start?[{firstStatementId:statements[start]!.id,lastStatementId:statements[end]!.id,role:"COURSE",priceStatementId:price.id}]:[]};
    }else if(input.purpose==="restaurant_named_source_query"){
      const name=String(data().name);body={field:"name",fragment:name.slice(0,name.lastIndexOf(" "))};
    }else if(input.purpose==="restaurant_fact_judgment")body={sourceSelections:[],judgments:[]};
    else if(input.purpose==="restaurant_page_question"){
      const p=data(),question=String(p.question??"");
      const doc=p.sourceDocuments.find((d:{statements:Array<{text:string}>})=>d.statements.some(s=>s.text===source.merchantQuote));
      const statement=doc?.statements.find((s:{text:string})=>s.text===source.merchantQuote);
      body=/private room/iu.test(question)&&doc&&statement?{status:"ANSWERED",answer:"A private room is available for groups of four or more.",citations:[{documentId:doc.id,statementId:statement.id,quote:statement.text}],sensitiveCategory:"NONE",sourceConflict:false}
        :{status:"NOT_STATED",answer:null,citations:[],sensitiveCategory:"NONE",sourceConflict:false};
    }else if(input.purpose==="browser_read_decide"){
      const p=data(),targets=p.observation.targets;
      const date=targets.find((t:{kind:string;label:string;value?:string})=>t.kind==="INPUT"&&t.label==="Date"&&t.value!==source.date);
      const party=targets.find((t:{kind:string;label:string;selected?:boolean})=>t.kind==="OPTION"&&t.label==="2 guests"&&!t.selected);
      body=date?{action:"FILL_AUTHORITATIVE",targetRef:date.ref,authoritativeField:"DATE",requestedState:"NONE",reason:"Observed public Date input"}
        :party?{action:"CHOOSE_OPTION",targetRef:party.ref,authoritativeField:"PARTY_SIZE",requestedState:"NONE",reason:"Observed public Guests option"}
        :{action:"COMPLETE",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"Source response is the completion evidence"};
    }else if(input.purpose==="restaurant_party_size_supplement")body={status:"UNKNOWN",partySize:0};
    else throw Error("Unconfigured G6 model transport purpose "+input.purpose);
    return {invocationId:"g6-source:"+input.purpose,provider:"FIXTURE",model:"g6-public-source-controls",outputText:JSON.stringify(body),latencyMs:0,finishReason:"TOOL_CALLS"} satisfies ModelResponse;
  }};
  return {kind,source,request,clock,model,google,googleFetch,browser,events,snapshots,markerMaps,html,text,course};
}
