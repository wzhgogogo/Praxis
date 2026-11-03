import {AsyncLocalStorage} from "node:async_hooks";
import type {RestaurantReadEvidence} from "../../domains/restaurant/contracts.js";
import type {BrowserRuntime,BrowserSnapshot} from "../../infrastructure/browser/browser-runtime.js";
import {parseTabelogOutletIdentityWithEvidence} from "../tabelog/tabelog-page-parser.js";
import {parseTableCheckOutletIdentityWithEvidence} from "../tablecheck/tablecheck-page-parser.js";

/** Names only from pages already read. Identity remains the existing adapter's verdict. */
export class ObservedOutletNames {
  readonly runtime:BrowserRuntime;
  private readonly pages=new AsyncLocalStorage<Map<string,BrowserSnapshot>>();
  constructor(runtime:BrowserRuntime){
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
      const page=pages.get(e.sourceUrl);if(!page)return e;
      const parsed=e.provider==="TABELOG"?parseTabelogOutletIdentityWithEvidence(page,{sourceEntityId:e.sourceEntityId,sourceUrl:e.sourceUrl,outletName:""})
        :e.provider==="TABLECHECK"?parseTableCheckOutletIdentityWithEvidence(page,e.sourceUrl):undefined;
      const name=parsed?.fields.outletName;
      if(!parsed||!name||name.source==="ABSENT"||name.source==="SEARCH_RESULT"||!parsed.outlet.outletName.trim())return e;
      return {...e,claims:{...e.claims,observedOutletName:parsed.outlet.outletName},sourceFieldQuotes:[...e.sourceFieldQuotes??[],{field:"NAME" as const,quote:parsed.outlet.outletName,sourceUrl:page.url}]};
    })};
  }
}
