import { createHash } from "node:crypto";
import { readFile, writeFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../../../infrastructure/browser/local-playwright-chromium.js";
import type { BrowserRuntime, BrowserSession } from "../../../../infrastructure/browser/browser-runtime.js";

export interface ReplayStop { snapshot: number | null; origin: string; pathname: string; reason: string; }
export async function loadReplayRecording(directory: string, outputHar: string) {
  const root = await realpath(directory);
  async function inside(file: string) {
    if (isAbsolute(file)) throw new Error("Recording reference must be relative");
    const path = await realpath(resolve(root,file));const rel=relative(root,path);
    if (!rel || rel.startsWith("..")) throw new Error("Recording reference escapes root");return path;
  }
  const bytes=await readFile(resolve(root,"recording.json")),manifest=JSON.parse(bytes.toString());
  const pages: Array<{snapshot:number;url?:string;status:string;reason:string}> = manifest.pages;
  if (!Array.isArray(pages) || !Array.isArray(manifest.documents)) throw new Error("Missing per-page replay qualification");
  const allowed=new Set<string>();
  for(const document of manifest.documents){
    if(!pages.some(p=>p.snapshot===document.snapshot&&p.url===document.url&&p.status==="REPLAYABLE"))continue;
    await inside(document.file);allowed.add(document.url);
  }
  // Structured source responses remain in the canonical HAR even if every
  // browser page is unqualified. No diagnostic DOM is used to fill that gap.
  let har: any;
  try { har=JSON.parse(await readFile(await inside(manifest.replay?.harPath ?? "replay.har"),"utf8")); }
  catch(error) {
    if(manifest.replay?.status!=="NOT_REPLAYABLE"||!(error&&typeof error==='object'&&'code' in error&&error.code==='ENOENT'))throw error;
    har={log:{version:"1.2",creator:{name:"Praxis replay",version:"1"},entries:[]}};
  }
  har.log.entries=har.log.entries.filter((entry:any)=> !/html/i.test(entry.response.content.mimeType)||allowed.has(entry.request.url));
  const filtered=JSON.stringify(har);
  await writeFile(outputHar,filtered,{flag:"wx"});
  return {pages,entries:har.log.entries as any[],harPath:outputHar,sha256:createHash("sha256").update(bytes).digest("hex"),harSha256:createHash("sha256").update(filtered).digest("hex"),allowed};
}
export type ReplayRecording=Awaited<ReturnType<typeof loadReplayRecording>>;
function bodyKey(body: unknown) {return typeof body === "string" ? body : "";}
export function recordedResponse(recording: ReplayRecording,url: string,method: string,body?: unknown) {
  return recording.entries.find(entry=>entry.request.url===url&&entry.request.method===method&&bodyKey(entry.request.postData?.text)===bodyKey(body));
}
export function createRecordedBrowser(recording: ReplayRecording, stop: (reason: ReplayStop)=>void) {
  let cursor=0;
  const locate=(url:string,reason:string,snapshot:number|null=recording.pages[cursor]?.snapshot??null)=>{const parsed=new URL(url);stop({snapshot,origin:parsed.origin,pathname:parsed.pathname,reason});};
  const runtime = new LocalPlaywrightChromium({ proxyServer: "http://127.0.0.1:9", browserType: { async launch(options) {
    const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
    browser.newContext=async options=>{
      const context=await newContext(options);
      context.on("request",request=>{
        const reason=request.resourceType()==="document"&&!recording.allowed.has(request.url())?"DOCUMENT_NOT_QUALIFIED"
          :!recordedResponse(recording,request.url(),request.method(),request.postData()??undefined)?"MISSING_RESPONSE":undefined;
        if(reason){locate(request.url(),reason);void context.close().catch(()=>{});}
      });
      return context;
    };return browser;
  } } });
  const browser:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",async openSession(input){
    const session=await runtime.openSession({...input,replayHarPath:recording.harPath});
    const checkNext=(url?:string)=>{
      const page=recording.pages[cursor];if(page&&page.status!=="REPLAYABLE") {locate(page.url??url??"https://replay.invalid/",page.reason,page.snapshot);throw new Error("REPLAY_INCOMPLETE");}
    };
    return new Proxy(session,{get(target,property){
      if(property==="navigate")return async(...args:Parameters<BrowserSession["navigate"]>)=>{checkNext(args[0]);return target.navigate(...args);};
      if(property==="snapshot")return async()=>{
        checkNext();const result=await target.snapshot();const page=recording.pages[cursor++];
        if(!page||page.url!==result.url){locate(result.url,"SNAPSHOT_SEQUENCE_DIVERGED",page?.snapshot??null);throw new Error("REPLAY_INCOMPLETE");}return result;
      };
      const value=Reflect.get(target,property);return typeof value==="function"?value.bind(target):value;
    }});
  }};
  return {browser,consumedPages:()=>cursor};
}
