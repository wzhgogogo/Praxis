import { createHash } from "node:crypto";
import { load } from "cheerio";
import sharp from "sharp";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import type { RestaurantPhoto, RestaurantPhotos, RestaurantPhotosPort } from "../../application/restaurant-photos.js";
import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantFactPageObserver } from "../restaurant-facts/fact-source-document.js";
import { isRestaurantFactPageBound } from "../restaurant-facts/fact-page-binding.js";
import { candidateStructuredObservation, candidateVisibleObservation } from "../restaurant-facts/google-listed-website-facts.js";
import { inspectNativeOutletContinuity, sameNativeOutletUrl } from "../restaurant-availability/native-outlet-continuity.js";
import { parseTabelogOutletIdentityWithEvidence } from "../tabelog/tabelog-page-parser.js";
import { parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";
import { extractRestaurantPhotos, type ExtractedPhotos, type SourcePhoto } from "./extract-photos.js";
import { PhotoReadError, PublicPhotoHttp, publicPhotoUrl, type PhotoHttpPort } from "./public-photo-http.js";

const TTL=600_000, MAX_BYTES=8_000_000, MAX_PIXELS=20_000_000;
interface Image extends SourcePhoto { id:string; sourcePageUrl:string; width?:number; height?:number; body?:Uint8Array; failed?:boolean; pending?:Promise<void>; }
interface Entry { signature:string; expires:number; images:Image[]; galleryUrl?:string; galleryRead:boolean; error?:string; pending?:Promise<void>; }
interface Observed extends ExtractedPhotos { sourceUrl:string; evidenceId:string; observedAt:number; }
const digest=(value:string)=>createHash("sha256").update(value).digest("hex").slice(0,32);
function code(error:unknown):string {
  if(error instanceof PhotoReadError)return error.code;
  const row=error&&typeof error==='object'?error as {name?:unknown;code?:unknown;cause?:{code?:unknown}}:{};
  return [row.name,row.code,row.cause?.code].filter((v):v is string=>typeof v==='string'&&/^[A-Za-z0-9_]{1,60}$/.test(v)).join(':')||'PHOTO_READ_FAILED';
}
const candidateSignature=(item:RestaurantCandidate)=>JSON.stringify([item.restaurant.outletName,item.restaurant.address,item.restaurant.sourceIds]);
function candidate(view:RestaurantCaseView,id:string):RestaurantCandidate {
  const item=view.restaurant.candidates.find(c=>c.restaurant.id===id);
  if(!item)throw new PhotoReadError('CANDIDATE_NOT_FOUND');return item;
}
function sourceUrl(view:RestaurantCaseView,item:RestaurantCandidate):string|undefined {
  const ids=item.restaurant.sourceIds;
  const official=view.restaurant.currentFactEvidence.find(e=>e.candidateId===item.restaurant.id&&e.provider==='RESTAURANT_WEBSITE'&&e.sourceUrl)?.sourceUrl;
  return official??ids.googleWebsiteUri??ids.tabelogNativeDetailUri??ids.tablecheckNativeGuideUri;
}
function pageBinds(page:BrowserSnapshot,item:RestaurantCandidate,source:string):boolean {
  const ids=item.restaurant.sourceIds;
  const provider=ids.tabelogNativeDetailUri&&new URL(source).origin==='https://tabelog.com'?'TABELOG':ids.tablecheckNativeGuideUri&&new URL(source).origin==='https://www.tablecheck.com'?'TABLECHECK':undefined;
  if(provider) {
    const native=provider==='TABELOG'?ids.tabelogNativeDetailUri!:ids.tablecheckNativeGuideUri!,id=provider==='TABELOG'?ids.tabelog:ids.tablecheck;
    if(!id)return false;
    const extraction=provider==='TABELOG'?parseTabelogOutletIdentityWithEvidence(page,{sourceEntityId:id,sourceUrl:native,outletName:item.restaurant.outletName}):parseTableCheckOutletIdentityWithEvidence(page,native);
    if(!extraction)return false;
    const fields={sourceEntityId:extraction.outlet.sourceEntityId,sourceUrl:extraction.outlet.sourceUrl,canonicalUrl:extraction.canonicalUrl,
      pageOwnedName:!['ABSENT','SEARCH_RESULT'].includes(extraction.fields.outletName.source),pageOwnedAddress:!['ABSENT','SEARCH_RESULT'].includes(extraction.fields.address.source)};
    if(inspectNativeOutletContinuity({provider,sourceEntityId:id,sourceUrl:native},page,fields).confirmed)return true;
    // A source-owned album must retain the detail canonical and page identity.
    return fields.pageOwnedName&&fields.pageOwnedAddress&&!!fields.canonicalUrl&&sameNativeOutletUrl(provider,native,fields.canonicalUrl)
      &&new URL(page.url).origin===new URL(native).origin&&new URL(page.url).pathname.startsWith(new URL(native).pathname.replace(/\/$/,'')+'/');
  }
  return new URL(source).origin===new URL(page.url).origin&&!!(candidateStructuredObservation(item,page.url,'2000-01-01T00:00:00Z',page.html)
    ??candidateVisibleObservation(item,page.url,'2000-01-01T00:00:00Z',page.text,page.html,{allowExactSourcePhone:false}));
}

/** Case-scoped, disposable presentation material. No Task events or model calls. */
export class RestaurantWebsitePhotos implements RestaurantPhotosPort {
  private readonly entries=new Map<string,Entry>();
  private readonly observed=new Map<string,Observed>();
  constructor(private readonly http:PhotoHttpPort=new PublicPhotoHttp(),private readonly now:()=>string=()=>new Date().toISOString(),private readonly currentTaskId:()=>string|undefined=()=>undefined) {}

  readonly observe:RestaurantFactPageObserver=page=>{
    const task=this.currentTaskId(),identity=page.identity;
    if(!task||identity.entityMatch?.confidence!=='HIGH'||identity.candidateId!==page.candidateId||identity.sourceUrl!==page.snapshot.url||typeof identity.claims.outletName!=='string'||typeof identity.claims.address!=='string')return;
    if(!page.readRunId||!isRestaurantFactPageBound(page,{candidateId:page.candidateId,sourceUrl:page.requestedSourceUrl,readRunId:page.readRunId,startedAt:identity.observedAt},this.now()))return;
    this.prune();
    const item:RestaurantCandidate={restaurant:{id:page.candidateId,outletName:identity.claims.outletName,address:identity.claims.address,sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH'};
    let extracted:ExtractedPhotos;try {extracted=extractRestaurantPhotos(page.snapshot,item);}catch{return;}
    this.observed.set(JSON.stringify([task,page.candidateId,page.snapshot.url]),{...extracted,sourceUrl:page.snapshot.url,evidenceId:identity.evidenceId,observedAt:Date.parse(page.observedAt)});
    const key=JSON.stringify([task,page.candidateId]),entry=this.entries.get(key);
    if(entry&&!entry.images.length&&extracted.photos.length)this.entries.delete(key);
  };

  async read(view:RestaurantCaseView,id:string,scope:'cover'|'gallery',signal:AbortSignal):Promise<RestaurantPhotos> {
    const item=candidate(view,id);this.prune();signal.throwIfAborted();
    const key=JSON.stringify([view.case.rootTaskId,id]),signature=candidateSignature(item);
    let entry=this.entries.get(key);
    if(!entry||entry.signature!==signature) {
      const observed=[...this.observed.entries()].filter(([key,value])=>key.startsWith(JSON.stringify([view.case.rootTaskId,id]).slice(0,-1)+',')
        &&view.restaurant.readEvidence.some(e=>e.evidenceId===value.evidenceId&&e.candidateId===id&&e.entityMatch?.confidence==='HIGH')).map(([,value])=>value).at(-1);
      const source=observed?.sourceUrl??sourceUrl(view,item);
      entry={signature,expires:Date.parse(this.now())+TTL,images:[],galleryRead:false};this.entries.set(key,entry);
      const target=entry;
      const fillSignal=AbortSignal.timeout(12_000);
      target.pending=(async()=>{
        if(!source)return;
        try {
          const extracted=observed??await this.page(source,item,fillSignal);
          this.addImages(target,extracted,source);
          // Validate a real cover before returning READY. A broken first image
          // does not conceal a distinct valid image already in this same album.
          for(const image of target.images.slice(0,3)){try{await this.image(target,image,fillSignal);break;}catch(error){target.error=code(error);}}
        }catch(error){target.error=code(error);}
      })().finally(()=>{delete target.pending;});
    }
    if(entry.pending)await entry.pending;
    if(scope==='gallery'&&!entry.galleryRead&&entry.galleryUrl&&entry.images.length<8) {
      const target=entry;target.galleryRead=true;
      const fillSignal=AbortSignal.timeout(12_000);
      target.pending=(async()=>{try{this.addImages(target,await this.page(target.galleryUrl!,item,fillSignal),target.galleryUrl!);}catch(error){target.error=code(error);}})().finally(()=>{delete target.pending;});
      await target.pending;
    }
    signal.throwIfAborted();
    const good=entry.images.filter(image=>!image.failed),hasCover=good.some(image=>!!image.body);
    const listed=(scope==='cover'?good.filter(image=>!!image.body).slice(0,1):good).slice(0,8);
    return {candidateId:id,status:hasCover?'READY':entry.error?'UNAVAILABLE':'EMPTY',photos:hasCover?listed.map(image=>this.projection(view,id,image)):[],expiresAt:new Date(entry.expires).toISOString(),...(entry.error?{reasonCode:entry.error}:{})};
  }

  async content(view:RestaurantCaseView,id:string,photoId:string,signal:AbortSignal) {
    const item=candidate(view,id);this.prune();
    const entry=this.entries.get(JSON.stringify([view.case.rootTaskId,id])),image=entry?.images.find(image=>image.id===photoId);
    if(!entry||entry.signature!==candidateSignature(item)||!image||image.failed)return undefined;
    signal.throwIfAborted();
    await this.image(entry,image,AbortSignal.timeout(5_000));
    signal.throwIfAborted();
    return image.body?{body:image.body,contentType:'image/webp' as const}:undefined;
  }

  private projection(view:RestaurantCaseView,id:string,image:Image):RestaurantPhoto {
    return {id:image.id,contentUrl:'/api/cases/'+encodeURIComponent(view.case.caseId)+'/candidates/'+encodeURIComponent(id)+'/photos/'+image.id+'/content',sourcePageUrl:image.sourcePageUrl,
      sourceLabel:new URL(image.sourcePageUrl).hostname.replace(/^www\./,''),...(image.attribution?{attribution:image.attribution}:{}),...(image.width?{width:image.width,height:image.height!}:{})};
  }
  private addImages(entry:Entry,extracted:ExtractedPhotos,source:string):void {
    for(const image of extracted.photos)if(entry.images.length<8&&!entry.images.some(existing=>existing.url===image.url))entry.images.push({...image,id:digest(source+'\0'+image.url),sourcePageUrl:source});
    if(extracted.galleryUrl&&!entry.galleryUrl)entry.galleryUrl=extracted.galleryUrl;
  }
  private async page(url:string,item:RestaurantCandidate,signal:AbortSignal):Promise<ExtractedPhotos> {
    const safe=publicPhotoUrl(url),response=await this.http.get(safe.href,{signal,maxBytes:2_000_000,allowedOrigins:[safe.origin],accept:'html'});
    if(/\bno-store\b/i.test(response.cacheControl))throw new PhotoReadError('SOURCE_CACHE_RESTRICTED');
    const html=new TextDecoder().decode(response.body),$=load(html);$('script,style,template,noscript').remove();
    const page:BrowserSnapshot={url:response.url,html,text:$('body').text(),title:$('title').text()};
    if(!pageBinds(page,item,url))throw new PhotoReadError('OUTLET_IDENTITY_UNCONFIRMED');
    return extractRestaurantPhotos(page,item);
  }
  private async image(entry:Entry,image:Image,signal:AbortSignal):Promise<void> {
    if(image.body)return;if(image.failed)throw new PhotoReadError('IMAGE_UNAVAILABLE');if(image.pending)return image.pending;
    signal.throwIfAborted();
    const readSignal=AbortSignal.any([signal,AbortSignal.timeout(5_000)]);
    image.pending=(async()=>{
      try {
        const allowedOrigins=[...new Set(entry.images.map(item=>new URL(item.url).origin))];
        const response=await this.http.get(image.url,{signal:readSignal,maxBytes:MAX_BYTES,allowedOrigins,accept:'image'});
        if(/\b(?:no-store|no-cache|private)\b/i.test(response.cacheControl))throw new PhotoReadError('IMAGE_CACHE_RESTRICTED');
        const input=sharp(response.body,{limitInputPixels:MAX_PIXELS,failOn:'warning',animated:false}),meta=await input.metadata();
        if(!['jpeg','png','webp'].includes(meta.format??'')||(meta.pages??1)>1||!meta.width||!meta.height||meta.width<320||meta.height<160)throw new PhotoReadError('IMAGE_FORMAT_OR_SIZE_REJECTED');
        const output=await input.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer({resolveWithObject:true});
        readSignal.throwIfAborted();image.body=output.data;image.width=output.info.width;image.height=output.info.height;
        this.prune();
        const age=/\bmax-age=(\d+)/i.exec(response.cacheControl);
        if(age)entry.expires=Math.min(entry.expires,Date.parse(this.now())+Number(age[1])*1000);
      }catch(error){image.failed=true;throw error;}
    })().finally(()=>{delete image.pending;});
    return image.pending;
  }
  private prune():void {
    const now=Date.parse(this.now());
    for(const [key,value]of this.entries)if(value.expires<=now)this.entries.delete(key);
    for(const [key,value]of this.observed)if(value.observedAt+TTL<=now)this.observed.delete(key);
    while(this.entries.size>=32)this.entries.delete(this.entries.keys().next().value!);
    while(this.observed.size>=64)this.observed.delete(this.observed.keys().next().value!);
    let bytes=0;for(const value of this.entries.values())for(const image of value.images)bytes+=image.body?.byteLength??0;
    while(bytes>64_000_000&&this.entries.size){const key=this.entries.keys().next().value!,entry=this.entries.get(key)!;for(const image of entry.images)bytes-=image.body?.byteLength??0;this.entries.delete(key);}
  }
}
