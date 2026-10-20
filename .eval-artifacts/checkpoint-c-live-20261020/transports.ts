// Eval-only transport boundary; Live retains production factories and preflight implementations.
import {appendFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runLivePreflight} from '../../src/eval/restaurant/agent-loop/live-preflight.ts';
import {runSourceDataPreflight} from '../../src/eval/restaurant/agent-loop/source-data-preflight.ts';
import {DeepSeekModelGateway} from '../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {GooglePlacesClient} from '../../src/integrations/google/google-places-client.ts';
import {browserRuntimeFromEnvironment} from '../../src/infrastructure/browser/browser-runtime-factory.ts';
import {LocalPlaywrightChromium} from '../../src/infrastructure/browser/local-playwright-chromium.ts';
import {PlaywrightReadNetworkGuard} from '../../src/infrastructure/browser/playwright-read-network-guard.ts';
import {installReviewedPostObserver,postBodyStop} from '../../src/eval/restaurant/agent-loop/post-body-audit.mjs';
import {response,strictAction,scriptedRetrieval} from '../../src/harness/restaurant-read-test-fixtures.ts';
const offline=process.env.CHECKPOINT_C_MODE==='OFFLINE_REHEARSAL';
const dir=()=>process.env.CHECKPOINT_C_ATTEMPT!;
function record(value:unknown){appendFileSync(resolve(dir(),'outer-observations.jsonl'),JSON.stringify({at:new Date().toISOString(),...value as object})+'\n');}
export function busyQuote(text:string){return text.match(/アクセスが集中[^。\n]{0,180}|ただいま[^。\n]{0,60}混み合[^。\n]{0,100}|Search is unavailable right now\.\s*Please try again\.|temporarily unavailable due to (?:high traffic|heavy traffic)/i)?.[0]??null;}
export function httpSignal(status:number){return [403,503,429].includes(status);}
export function observeTrace(row:any){
 const failure=postBodyStop(row,readFileSync(process.env.CHECKPOINT_C_REVIEWED_READS!));
 if(failure)record({kind:'SAFETY_STOP',failure});
}
export async function networkPreflight(input:any,environment:any){
 return runLivePreflight({...input,targets:['DEEPSEEK','GOOGLE','TABELOG']},environment,{artifactDirectory:resolve(dir(),'network-preflight'),...(offline?{fetchImplementation:async()=>new Response('',{status:200}),connectProxy:async()=>{}}:{fetchImplementation:async(...args:Parameters<typeof fetch>)=>{const r=await fetch(...args);if(httpSignal(r.status))record({kind:'COOLDOWN_SIGNAL',status:r.status});return r;}})});
}
export async function sourcePreflight(input:any){
 try{return await runSourceDataPreflight(input,offline?{read:async()=>({count:1,responseStatus:200,reason:null})}:{});}
 catch(e){const saved=JSON.parse(readFileSync(resolve(input.artifactDirectory,'source-data-preflight.json'),'utf8'));for(const a of saved.attempts)if(httpSignal(a.responseStatus)||a.detail==='RESULT_UNOBSERVED')record({kind:'COOLDOWN_SIGNAL',sourceId:a.sourceId,status:a.responseStatus,detail:a.detail});throw e;}
}
class ScriptedTransport {
 private decisions=0;
 async complete(request:any){
  if(request.purpose==='restaurant_semantic_interpret')return response(JSON.stringify({schemaVersion:'3',facts:[
   {field:'TARGET',operation:'ASSERT',value:{kind:'TARGET',goal:'AVAILABILITY',query:'omakase'}},
   {field:'AREA',operation:'ASSERT',value:{kind:'AREA',query:'near Shibuya'}},
   {field:'DATE',operation:'ASSERT',value:{kind:'DATE',value:'2026-11-03',raw:'Tuesday, November 3'}},
   {field:'TIME_WINDOW',operation:'ASSERT',value:{kind:'TIME_WINDOW',earliest:'19:00',latest:'19:00',raw:'7 PM'}},
   {field:'PARTY_SIZE',operation:'ASSERT',value:{kind:'PARTY_SIZE',value:2}},
   {field:'CRITERION',operation:'ASSERT',value:{kind:'CRITERION',text:'omakase',polarity:'POSITIVE',strength:'HARD'}}
  ]}),'scripted-semantic');
  if(request.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(request)!;
  if(request.purpose==='restaurant_agent_decide'){const context=JSON.parse(request.messages.find((m:any)=>m.role==='user').content).context;if(this.decisions++>12)throw Error('SCRIPTED_DECISION_CEILING');return response(JSON.stringify(strictAction(context.readCompletion?.allowed?'END_READ':context.searchAvailability?.available?'SEARCH_RESTAURANTS':'END_READ')),'scripted-decision');}
  if(request.purpose==='browser_read_decide')return response(JSON.stringify({action:'REQUEST_HUMAN_HELP',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'Scripted empty fixture has no safe observed action.'}),'scripted-browser');
  throw Error(`UNSCRIPTED_TRANSPORT:${request.purpose}`);
 }
}
export function modelTransport(environment:any,options:any){return offline?new ScriptedTransport():DeepSeekModelGateway.fromEnvironment(environment,options);}
export function googleTransport(options:any){return new GooglePlacesClient({...options,...(offline?{fetchImplementation:async(url:string,init:any)=>new Response(JSON.stringify(init?.method==='POST'&&JSON.parse(String(init.body)).textQuery==='Shibuya'?{places:[{id:'shibuya-landmark',displayName:{text:'Shibuya'},formattedAddress:'Shibuya, Tokyo',location:{latitude:35.6619707,longitude:139.703795},types:['locality','political'],addressComponents:[{longText:'Shibuya',types:['locality','political']}]}]}:String(url).includes('geocode')?{status:'OK',results:[{formatted_address:'Shibuya, Tokyo',geometry:{location:{lat:35.6619707,lng:139.703795}},address_components:[{long_name:'Shibuya',short_name:'Shibuya',types:['locality','political']}]}]}:{places:[]}),{status:200})}: {})});}
function fixtureBrowser(){return {readNetworkBoundaryCapability:'ISOLATED_CONTEXT',async openSession(){let url='https://tabelog.com/en/';return {metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',readNetworkBoundary:'INSTALLED',startedAt:new Date().toISOString()},async prepareNavigation(){},async navigate(next:string){url=next;},async snapshot(){return {url,title:'Offline empty listing',text:'No matching restaurants found.',html:'<main>No matching restaurants found.</main>',links:[],controls:[],networkRequests:[]};},async observeControls(){return [];},async waitForSettled(){return true;},async close(){},async captureResponses(){},async screenshot(){return new Uint8Array();},async click(){throw Error('UNSCRIPTED_CLICK');},async fill(){throw Error('UNSCRIPTED_FILL');},async select(){throw Error('UNSCRIPTED_SELECT');},async waitFor(){}};}};}
let installed=false;
export function installObservers(){
 if(installed||offline)return;installed=true;
 const reviewed=readFileSync(process.env.CHECKPOINT_C_REVIEWED_READS!);
 installReviewedPostObserver(PlaywrightReadNetworkGuard,reviewed,(row:any)=>{record(row);observeTrace(row);});
 const original=LocalPlaywrightChromium.prototype.openSession;
 LocalPlaywrightChromium.prototype.openSession=async function(options:any={}){
  const session=await original.call(this,{...options,recordResponse:async(r:any)=>{await options.recordResponse?.(r);if(httpSignal(r.status))record({kind:'COOLDOWN_SIGNAL',url:r.url,status:r.status});}});
  const snapshot=session.snapshot.bind(session);session.snapshot=async()=>{const page=await snapshot();const quote=busyQuote(page.text);if(quote)record({kind:'COOLDOWN_SIGNAL',url:page.url,quote});return page;};return session;
 };
}
export function browserTransport(environment:any){installObservers();return offline?fixtureBrowser():browserRuntimeFromEnvironment(environment);}

// Eval-only adapter for the already-approved variant@3 metadata; the same retained parent SHA is mandatory.
export async function checkpointCaseCohort(source:any){
 const {customLiveCaseCohort,validDevelopmentVariantParent}=await import('../../src/eval/restaurant/agent-loop/live-case-materializer.ts');
 if(source.dataset==='restaurant-read-development-variant@3'&&await validDevelopmentVariantParent(source.parent))return 'DEVELOPMENT_DIAGNOSTIC';
 return customLiveCaseCohort(source);
}
