import type {RestaurantFactPageObserver} from "../restaurant-facts/fact-source-document.js";
import {publicPriceText} from "../restaurant-availability/source-price-facts.js";
import {AsyncLocalStorage} from "node:async_hooks";
import type {RestaurantReadEvidence} from "../../domains/restaurant/contracts.js";
import type {BrowserRuntime,BrowserSnapshot} from "../../infrastructure/browser/browser-runtime.js";
import {parseTabelogOutletIdentityWithEvidence} from "../tabelog/tabelog-page-parser.js";
import {parseTableCheckOutletIdentityWithEvidence} from "../tablecheck/tablecheck-page-parser.js";

/** Names only from pages already read. Identity remains the existing adapter's verdict. */
export class ObservedOutletNames {
  readonly runtime:BrowserRuntime;
  private readonly pages=new AsyncLocalStorage<Map<string,BrowserSnapshot>>();
  private readonly categoryProofs=new Map<string,{candidateId:string;provider:string;sourceEntityId:string;sourceUrl:string;observedAt:string;quotes:string[]}>();
  constructor(runtime:BrowserRuntime,private readonly now:()=>string=()=>new Date().toISOString()){
    this.runtime={...(runtime.readNetworkBoundaryCapability?{readNetworkBoundaryCapability:runtime.readNetworkBoundaryCapability}:{}),openSession:async input=>{
      const session=await runtime.openSession(input);
      return new Proxy(session,{get:(target,key)=>{
        if(key==="snapshot")return async()=>{const page=await target.snapshot();this.pages.getStore()?.set(page.url,page);return page;};
        const value=Reflect.get(target,key,target) as unknown;return typeof value==="function"?value.bind(target):value;
      }});
    }};
  }
  /** Only same-read, HIGH-bound, actually captured merchant CATEGORY text. */
  categoryQuotes(e:RestaurantReadEvidence):string[]{
    const p=this.categoryProofs.get(e.evidenceId);
    if(!p||e.entityMatch?.confidence!=="HIGH"||p.candidateId!==e.candidateId||p.provider!==e.provider||p.sourceEntityId!==e.sourceEntityId||p.sourceUrl!==e.sourceUrl||p.observedAt!==e.observedAt||Date.parse(p.observedAt)<Date.parse(this.now())-500_000)return [];
    return (e.sourceFieldQuotes??[]).filter(q=>q.field==="CATEGORY"&&q.sourceUrl===p.sourceUrl&&p.quotes.includes(q.quote)).map(q=>q.quote);
  }
  async capture<T extends {evidence:RestaurantReadEvidence[]}>(read:()=>Promise<T>, boundPages?:{readRunId:string|undefined;observe:RestaurantFactPageObserver}):Promise<T>{
    const pages=new Map<string,BrowserSnapshot>(),result=await this.pages.run(pages,read);
    const cutoff=Date.parse(this.now())-500_000;
    for(const [id,proof] of this.categoryProofs)if(Date.parse(proof.observedAt)<cutoff)this.categoryProofs.delete(id);
    for(const e of result.evidence){
      if(e.kind!=="RESTAURANT_FACT"||e.entityMatch?.confidence!=="HIGH"||!e.candidateId||!e.sourceUrl||!e.sourceEntityId)continue;
      const entities=new Set(result.evidence.filter(i=>i.kind==="ENTITY_MATCH"&&i.candidateId===e.candidateId&&i.provider===e.provider&&i.entityMatch?.confidence==="HIGH").map(i=>i.sourceEntityId));
      if(entities.size!==1)continue;
      const identity=result.evidence.find(i=>i.kind==="ENTITY_MATCH"&&i.candidateId===e.candidateId&&i.provider===e.provider&&i.sourceEntityId===e.sourceEntityId&&i.sourceUrl===e.sourceUrl&&i.entityMatch?.confidence==="HIGH");
      const page=pages.get(e.sourceUrl);
      if(!identity||!page)continue;
      const text=publicPriceText(page.html);
      const quotes=(e.sourceFieldQuotes??[]).filter(q=>q.field==="CATEGORY"&&q.sourceUrl===e.sourceUrl&&q.quote.trim()&&text.includes(q.quote)).map(q=>q.quote);
      if(quotes.length)this.categoryProofs.set(e.evidenceId,{candidateId:e.candidateId,provider:e.provider,sourceEntityId:e.sourceEntityId,sourceUrl:e.sourceUrl,observedAt:e.observedAt,quotes});
    }
    return {...result,evidence:result.evidence.map(e=>{
      if(e.kind!=="ENTITY_MATCH"||e.entityMatch?.confidence!=="HIGH"||!e.candidateId||!e.sourceUrl||!e.sourceEntityId)return e;
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
      const {parsed}=bound;
      const name=parsed?.fields.outletName;
      if(!parsed||!name||name.source==="ABSENT"||name.source==="SEARCH_RESULT"||!parsed.outlet.outletName.trim())return e;
      const enriched={...e,claims:{...e.claims,observedOutletName:parsed.outlet.outletName},sourceFieldQuotes:[...e.sourceFieldQuotes??[],{field:"NAME" as const,quote:parsed.outlet.outletName,sourceUrl:e.sourceUrl}]};
      const identities=new Set(result.evidence.filter(i=>i.kind==="ENTITY_MATCH"&&i.candidateId===e.candidateId&&i.provider===e.provider&&i.entityMatch?.confidence==="HIGH").map(i=>i.sourceEntityId));
      if(boundPages?.readRunId&&identities.size===1&&bound.page.url===e.sourceUrl)boundPages.observe(structuredClone({readRunId:boundPages.readRunId,candidateId:e.candidateId,requestedSourceUrl:e.sourceUrl,identity:enriched,snapshot:bound.page,observedAt:this.now()}));
      return enriched;
    })};
  }
}
