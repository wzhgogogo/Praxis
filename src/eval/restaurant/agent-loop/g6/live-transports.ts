import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../../../infrastructure/browser/local-playwright-chromium.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import { createEvalGooglePlacesClient } from "../runners/google-places-recording.js";
import type { G6RunnerDependencies,G6TransportHooks } from "./runner.js";

function shape(body:string|undefined):Record<string,string>{
  if(!body)return {};try{const parsed=JSON.parse(body);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return {UNCLASSIFIED:"non-object"};
    return Object.fromEntries(Object.entries(parsed).map(([k,v])=>[k,v===null?"null":Array.isArray(v)?"array":typeof v]));
  }catch{return {UNCLASSIFIED:"non-JSON"};}
}
function observer(hooks:G6TransportHooks,namespace:string){let n=0;return (url:string,method:string,body?:string)=>{
  const u=new URL(url);hooks.observeRequest({ref:`${namespace}:wire:${++n}`,url:u.origin+u.pathname,method,reachedSource:true,queryKeys:[...u.searchParams.keys()],bodyFields:shape(body)});
};}

/** No env file loader: only an authorized Node --env-file invocation supplies credentials. */
export function liveG6Dependencies(environment:NodeJS.ProcessEnv,budgetPath:string):G6RunnerDependencies{
  const apiKey=environment.GOOGLE_MAPS_API_KEY;if(!apiKey)throw Error("GOOGLE_MAPS_API_KEY must be configured on the server");
  const model=DeepSeekModelGateway.fromEnvironment(environment);
  return {budgetPath,witnessFetch:fetch,ownCredentials:[apiKey,environment.DEEPSEEK_API_KEY??""],
    async transports(_spec,_recording,hooks){
      const googleObserved=observer(hooks,"google"),browserObserved=observer(hooks,"browser");
      const google=createEvalGooglePlacesClient({apiKey,fetchImplementation:async(url,init)=>{
        googleObserved(String(url),init?.method??"GET",typeof init?.body==="string"?init.body:undefined);return fetch(url,init);
      }},hooks.googleFetch);
      const browser=new LocalPlaywrightChromium({headless:true,browserType:{async launch(options){
        const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
        browser.newContext=async opts=>{const context=await newContext(opts),route=context.route.bind(context);
          context.route=async(pattern,handler,options)=>route(pattern,async(original,request)=>{
            const wrapped=new Proxy(original,{get(target,key){
              if(key==="fetch")return (options:Parameters<typeof original.fetch>[0])=>{
                browserObserved(options?.url??target.request().url(),options?.method??target.request().method(),typeof options?.postData==="string"?options.postData:target.request().postData()??undefined);
                return target.fetch(options);
              };
              const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
            }});await handler(wrapped,request);
          },options);return context;};return browser;
      }}});
      return {model,google,browser,clock:{now:()=>new Date()}};
    }};
}
