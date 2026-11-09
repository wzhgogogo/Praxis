import {AsyncLocalStorage} from "node:async_hooks";
import {parse,type DefaultTreeAdapterMap} from 'parse5';
import {hasSensitiveBrowserReadQuery} from '../../infrastructure/browser/browser-read-policy.js';
import {observeQueryValues} from '../../infrastructure/browser/browser-query-values.js';
import type {RestaurantReadEvidence} from "../../domains/restaurant/contracts.js";
import type {BrowserRuntime,BrowserSnapshot} from "../../infrastructure/browser/browser-runtime.js";
import {parseTabelogOutletIdentityWithEvidence} from "../tabelog/tabelog-page-parser.js";
import {parseTableCheckOutletIdentityWithEvidence} from "../tablecheck/tablecheck-page-parser.js";

function observedLinks(page:BrowserSnapshot,origins:readonly string[]):string[]{
 const result=new Set<string>();
 const visit=(node:DefaultTreeAdapterMap['node'])=>{
  if('tagName'in node){
   if(node.tagName==='script'||node.tagName==='template'||node.attrs.some(a=>a.name==='hidden'||a.name==='aria-hidden'&&a.value==='true'))return;
   const href=node.tagName==='a'?node.attrs.find(a=>a.name==='href')?.value:undefined;
   if(href)try{const u=new URL(href,page.url);if(origins.includes(u.origin)&&u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!hasSensitiveBrowserReadQuery(u)&&!observeQueryValues(u,[]).some(f=>f.valueClass==='SENSITIVE_FORMAT'))result.add(u.href);}catch{/* Invalid links confer no navigation hint. */}
  }
  if('childNodes'in node)node.childNodes.forEach(visit);
 };visit(parse(page.visibleHtml??page.html));return [...result];
}

/** Names only from pages already read. Identity remains the existing adapter's verdict. */
export class ObservedOutletNames {
  readonly runtime:BrowserRuntime;
  private readonly pages=new AsyncLocalStorage<Map<string,BrowserSnapshot>>();
  constructor(runtime:BrowserRuntime,private readonly linkOrigins:readonly string[]=[]){
    this.runtime={...(runtime.readNetworkBoundaryCapability?{readNetworkBoundaryCapability:runtime.readNetworkBoundaryCapability}:{}),openSession:async input=>{
      const session=await runtime.openSession(input);
      return new Proxy(session,{get:(target,key)=>{
        if(key==="snapshot")return async()=>{const page=await target.snapshot();this.pages.getStore()?.set(page.url,page);return page;};
        const value=Reflect.get(target,key,target) as unknown;return typeof value==="function"?value.bind(target):value;
      }});
    }};
  }
  async capture<T extends {evidence:RestaurantReadEvidence[]}>(read:()=>Promise<T>):Promise<T>{
    const pages=new Map<string,BrowserSnapshot>(),result=await this.pages.run(pages,read);
    return {...result,evidence:result.evidence.map(e=>{
      if(e.kind!=="ENTITY_MATCH"||e.entityMatch?.confidence!=="HIGH"||!e.sourceUrl||!e.sourceEntityId)return e;
      const websitePage=pages.get(e.sourceUrl);
      if(websitePage&&e.provider!=="TABELOG"&&e.provider!=="TABLECHECK"&&e.provider!=="MODEL_JUDGMENT")return {...e,claims:{...e.claims,observedSourceLinks:observedLinks(websitePage,this.linkOrigins)}};
      // A settled SPA page may retain routing parameters while its native
      // identity uses the source canonical URL. Parse the observed page itself;
      // do not assign the evidence URL as a fallback to an unrelated document.
      const candidates=e.provider==="TABLECHECK"?[...pages.values()].reverse():[pages.get(e.sourceUrl)];
      const bound=candidates.flatMap(page=>{
        if(!page)return [];
        if(e.provider==="TABLECHECK"){
          const actual=new URL(page.url),source=new URL(e.sourceUrl!);
          if(actual.origin!==source.origin||actual.pathname!==source.pathname)return [];
        }
        const parsed=e.provider==="TABELOG"?parseTabelogOutletIdentityWithEvidence(page,{sourceEntityId:e.sourceEntityId!,sourceUrl:e.sourceUrl!,outletName:""})
          :e.provider==="TABLECHECK"?parseTableCheckOutletIdentityWithEvidence(page,page.url):undefined;
        return parsed&&parsed.outlet.sourceEntityId===e.sourceEntityId&&parsed.outlet.sourceUrl===e.sourceUrl?[{page,parsed}]:[];
      })[0];
      if(!bound)return e;
      const {parsed,page}=bound;
      const name=parsed?.fields.outletName;
      if(!parsed||!name||name.source==="ABSENT"||name.source==="SEARCH_RESULT"||!parsed.outlet.outletName.trim())return e;
      return {...e,claims:{...e.claims,observedOutletName:parsed.outlet.outletName,observedSourceLinks:observedLinks(page,this.linkOrigins)},sourceFieldQuotes:[...e.sourceFieldQuotes??[],{field:"NAME" as const,quote:parsed.outlet.outletName,sourceUrl:e.sourceUrl}]};
    })};
  }
}
