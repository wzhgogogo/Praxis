import {mkdtemp,writeFile,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createLiveReadAssembly} from "../../live-read-assembly.js";
import {tabelogDiscoveryPack} from "../../source-packs.js";
import {LocalPlaywrightChromium} from "../../../../infrastructure/browser/local-playwright-chromium.js";
import type {BrowserRuntime,BrowserSession} from "../../../../infrastructure/browser/browser-runtime.js";
import {GooglePlacesClient} from "../../../google/google-places-client.js";
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET} from "../../../../application/live-read-investigation-budget.js";
import type {RestaurantSearchIntent} from "../../../../domains/restaurant/contracts.js";
import type {ModelGateway,ModelRequest} from "../../../../core/model/contracts.js";
import {replayHarPages} from "../../../../harness/browser/browser-read-test-fixtures.js";

export type Mode="LINK"|"OPTION"|"NONE"|"AMBIGUOUS"|"OUTSIDE"|"MERCHANT_ONLY";
export async function locationSuggestionAssembly(mode:Mode){
  const saved=JSON.parse(await readFile(new URL("./d4-menu.json",import.meta.url),"utf8"));
  const origin="https://tabelog.com",home=origin+"/en/",root=origin+"/en/tokyo/rstLst/",menu=origin+"/en/tokyo/";
  const result=origin+"/en/tokyo/A1323/A132305/rstLst/?sw=kushikatsu",wrong=origin+"/en/tokyo/A1322/";
  const station="Akabane Sta. (Tokyo)";
  const optionResult=origin+"/en/tokyo/A1323/A132305/rstLst/?location=Akabane+Sta.+%28Tokyo%29&sw=kushikatsu";
  const menuHtml=`<title>Tokyo restaurants</title><a href="${home}"><img alt="Tabelog"></a><main>${saved.regions.map((r:{label:string;href:string})=>`<a href="${r.href}">${r.label}</a>`).join(" ")}</main>`;
  const locationChoices=mode==="NONE"||mode==="MERCHANT_ONLY"?[]:[{name:station,href:result},...(mode==="AMBIGUOUS"?[{name:"Akabane Station (Tokyo)",href:origin+"/en/tokyo/R99999/rstLst/"}]:[])];
  const locationHtml=locationChoices.map(c=>mode==="OPTION"?`<button type="button" role="option" aria-selected="false" class="unused-option-private">${c.name}</button>`:`<a href="${c.href}">${c.name}</a>`).join("");
  const suggestions=`<section role="group" aria-label="Locations">${locationHtml}<a href="${origin}/en/aichi/R88888/rstLst/">Michi no Eki Akabane Roko Station [Aichi]</a></section><section role="group" aria-label="Restaurants"><a href="${origin}/en/tokyo/A1323/A132305/13999999/">Akabane</a><a href="${origin}/en/tokyo/A1323/A132305/13999998/">Akabane Sta. (Tokyo)</a></section>`;
  const homeHtml=`<title>Tabelog public search</title><a href="${menu}">Tokyo</a><form aria-label="Public restaurant search" method="GET" action="${origin}/en/tokyo/A1323/A132305/rstLst/"><label>Area / Station<input role="combobox" aria-label="Area / Station" type="search" name="location" aria-expanded="false" aria-controls="choices"></label><input type="hidden" name="sw" value="kushikatsu"><div id="choices" role="listbox" aria-label="Search suggestions"></div><button type="submit">Search</button></form><script>
    const field=document.querySelector('input[type=search]'),list=document.getElementById('choices');
    field.addEventListener('input',()=>{field.setAttribute('aria-expanded','true');setTimeout(()=>{list.innerHTML=${JSON.stringify(suggestions)};for(const option of list.querySelectorAll('[role=option]'))option.addEventListener('click',()=>{field.value=option.textContent;option.setAttribute('aria-selected','true');field.setAttribute('aria-expanded','false');list.hidden=true;});},80);});
  </script>`;
  const pages:Record<string,string>={[home]:homeHtml,[root]:menuHtml,[root+"?sw=kushikatsu"]:menuHtml,[menu]:menuHtml};
  const urls:string[]=[];
  for(let i=0;i<5;i++){
    const url=origin+`/en/tokyo/A1323/A132305/${13123450+i}/`;urls.push(url);
    const point=mode==="OUTSIDE"?{latitude:35.4,longitude:139.4}:saved.goal.location;
    pages[url]=`<title>Controlled restaurant ${i}</title><script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name:"Controlled restaurant "+i,address:"東京都北区赤羽1-1-1",geo:{latitude:point.latitude,longitude:point.longitude}})}</script><h1>Controlled restaurant ${i}</h1><address>東京都北区赤羽1-1-1</address>`;
  }
  const list=urls.map((url,i)=>`<a class="list-rst__rst-name-target" href="${url}">Controlled restaurant ${i}</a>`).join("");
  pages[result]=list;pages[optionResult]=list;
  const wrongLinks=[];
  for(let i=0;i<5;i++){
    const url=origin+`/en/tokyo/A1322/A132201/${13123550+i}/`;wrongLinks.push(`<a class="list-rst__rst-name-target" href="${url}">Outside restaurant ${i}</a>`);
    pages[url]=`<script type="application/ld+json">${JSON.stringify({"@type":"Restaurant",name:"Outside restaurant "+i,address:"東京都板橋区",geo:{latitude:35.74,longitude:139.72}})}</script><h1>Outside restaurant ${i}</h1>`;
  }
  pages[wrong]=wrongLinks.join("");
  const folder=await mkdtemp(join(tmpdir(),"praxis-location-suggestions-")),har=join(folder,"source.har");await writeFile(har,replayHarPages(pages));
  const actual=new LocalPlaywrightChromium(),sessions:BrowserSession[]=[],actions:Array<{operation:string;args:unknown[]}>=[],models:ModelRequest[]=[],diagnostics:unknown[]=[];
  const browser:BrowserRuntime={readNetworkBoundaryCapability:actual.readNetworkBoundaryCapability,async openSession(input){
    const raw=await actual.openSession({...input,replayHarPath:har});sessions.push(raw);
    return new Proxy(raw,{get(target,key){const value=Reflect.get(target,key,target);if(typeof value!=="function")return value;
      return (...args:unknown[])=>{if(["navigate","openLink","fill","click","select"].includes(String(key)))actions.push({operation:String(key),args:args.slice(0,2)});return value.apply(target,args);};}});
  }};
  const model:ModelGateway={async complete(request){
    models.push(request);const context=JSON.parse(request.messages.find(m=>m.role==="user")!.content);
    let body:unknown;
    if(request.purpose==="restaurant_discovery_retrieval")body={choice:context.current?"KEEP":"KEYWORD",keyword:context.current?"":"kushikatsu",criterionRef:context.current?"":"criterion:0",categoryUrl:"",generalRef:"",reason:"Constructed fixed retrieval, not a real model"};
    else if(request.purpose==="browser_read_decide"){
      const target=context.observation.targets.find((t:{href?:string})=>t.href===wrong);
      body=target?{action:"OPEN_LINK",targetRef:target.ref,authoritativeField:"NONE",requestedState:"NONE",reason:"Original D4 wrong parent choice"}:{action:"REQUEST_HUMAN_HELP",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"No unique observed path"};
    }else throw Error("Unexpected model purpose "+request.purpose);
    return {invocationId:"fixture:"+models.length,latencyMs:0,provider:"FIXTURE",model:"fixture",outputText:JSON.stringify(body),finishReason:"STOP"};
  }};
  const now="2026-11-04T08:00:00.000Z";
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:[tabelogDiscoveryPack]}, {model,browser,clock:{now:()=>new Date(now)},google:new GooglePlacesClient({apiKey:"fixture-unused",fetchImplementation:async()=>{throw Error("No external Google request permitted");}}),onBrowserDiagnostic:d=>diagnostics.push(d)});
  const intent:RestaurantSearchIntent={timezone:"Asia/Tokyo",target:{goal:"RECOMMENDATION",selectionScope:"OPEN_ENDED",query:"Restaurants near Akabane"},area:{query:"near Akabane",radiusMeters:1000},criteria:[{text:"kushikatsu",strength:"HARD",polarity:"POSITIVE"}]};
  const locationContext={latitude:saved.goal.location.latitude,longitude:saved.goal.location.longitude,radiusMeters:1000,label:"Akabane",areaMatchBasis:"NAMED_PLACE_RADIUS" as const,addressComponents:saved.goal.location.addressComponents};
  return {saved,actions,models,diagnostics,result,root,home,async search(){return assembly.search.search({intent,readRunId:"location-fixture",continuation:{intentFingerprint:JSON.stringify(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext}},new AbortController().signal);},async close(){for(const s of sessions)await s.close();await rm(folder,{recursive:true,force:true});}};
}
