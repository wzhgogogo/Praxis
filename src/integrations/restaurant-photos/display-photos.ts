import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import type { RestaurantPhoto, RestaurantPhotos, RestaurantPhotosPort } from "../../application/restaurant-photos.js";
import type { GooglePhotoReference, GooglePhotoTransport } from "./google-photos.js";
import { RestaurantWebsitePhotos, recoverablePhotoFailure } from "./website-photos.js";
import { PhotoReadError, PublicPhotoHttp, type PhotoHttpPort } from "./public-photo-http.js";
type Counts=NonNullable<RestaurantPhotos['requests']>;
type Image=Awaited<ReturnType<GooglePhotoTransport['image']>>;
interface Display {signature:string;expires:number;counts:Counts;references:GooglePhotoReference[];images:Map<string,Image>;imagePending:Map<string,Promise<Image|undefined>>;failed:Set<string>;website:boolean;pending?:Promise<void>;}
const limits:Counts={googleDetails:1,googleMedia:20,websitePages:2,websiteImages:10};
const digest=(name:string)=>createHash('sha256').update(name).digest('hex').slice(0,32);
/** Ephemeral display scope. One list serves cover/gallery; nothing enters State or disk. */
export class RestaurantDisplayPhotos implements RestaurantPhotosPort {
  private readonly displays=new Map<string,Display>();
  private readonly scope=new AsyncLocalStorage<Display>();
  private readonly website:RestaurantWebsitePhotos;
  readonly observe;
  constructor(private readonly google?:GooglePhotoTransport,http:PhotoHttpPort=new PublicPhotoHttp(),private readonly now:()=>string=()=>new Date().toISOString(),currentTaskId:()=>string|undefined=()=>undefined){
    this.website=new RestaurantWebsitePhotos({get:(url,input)=>http.get(url,{...input,onDispatch:()=>{const display=this.scope.getStore();if(!display)throw new PhotoReadError('PHOTO_SCOPE_MISSING');this.charge(display,input.accept==='html'?'websitePages':'websiteImages');input.onDispatch?.();}})},now,currentTaskId);
    this.observe=this.website.observe;
  }
  private charge(display:Display,key:keyof Counts):void {if(display.counts[key]>=limits[key])throw new PhotoReadError('PHOTO_BUDGET_'+key);display.counts[key]++;}
  private key(view:RestaurantCaseView,id:string){return JSON.stringify([view.case.rootTaskId,id]);}
  private item(view:RestaurantCaseView,id:string){const item=view.restaurant.candidates.find(c=>c.restaurant.id===id);if(!item)throw new PhotoReadError('CANDIDATE_NOT_FOUND');return item;}
  private signature(view:RestaurantCaseView,id:string){return JSON.stringify(this.item(view,id).restaurant);}
  async read(view:RestaurantCaseView,id:string,scope:'cover'|'gallery',signal:AbortSignal,failedCoverId?:string):Promise<RestaurantPhotos>{
    const item=this.item(view,id),key=this.key(view,id),signature=this.signature(view,id);let display=this.displays.get(key);
    if(!display||display.signature!==signature||display.expires<=Date.parse(this.now())){
      for(const [k,v]of this.displays)if(v.expires<=Date.parse(this.now()))this.displays.delete(k);
      while(this.displays.size>=16)this.displays.delete(this.displays.keys().next().value!);
      const priorCounts=display&&display.expires>Date.parse(this.now())?display.counts:undefined;
      display={signature,expires:Date.parse(this.now())+600_000,counts:priorCounts??{googleDetails:0,googleMedia:0,websitePages:0,websiteImages:0},references:[],images:new Map(),imagePending:new Map(),failed:new Set(),website:false};this.displays.set(key,display);
      const target=display;target.pending=(async()=>{
        try{
          const placeId=item.restaurant.sourceIds.googlePlaces;
          if(!placeId||!this.google||target.counts.googleDetails>0){target.website=true;return;}
          target.references=await this.google.list(placeId,signal,()=>this.charge(target,'googleDetails'));
          const first=target.references[0];if(!first){target.website=true;return;}
          target.images.set(digest(first.name),await this.google.image(first,signal,()=>this.charge(target,'googleMedia')));
        }catch(error){if(target.references.length&&recoverablePhotoFailure(error))throw error;target.website=true;target.images.clear();}
      })().finally(()=>{delete target.pending;});
    }
    if(display.pending)await display.pending;signal.throwIfAborted();
    if(failedCoverId&&display.references[0]&&digest(display.references[0].name)===failedCoverId){display.website=true;display.images.clear();}
    if(display.website){const target=display;const result=await this.scope.run(target,()=>this.website.read(view,id,scope,signal));return {...result,requests:{...target.counts}};}
    const photos=(scope==='cover'?display.references.slice(0,1):display.references).filter(p=>!display!.failed.has(digest(p.name))).map(p=>{
      const photoId=digest(p.name),image=display!.images.get(photoId),uri=item.restaurant.sourceIds.googleMapsUri;
      return {id:photoId,contentUrl:'/api/cases/'+encodeURIComponent(view.case.caseId)+'/candidates/'+encodeURIComponent(id)+'/photos/'+photoId+'/content',provider:'GOOGLE_PLACES',sourceLabel:'Google Maps',authors:p.authors,...(uri?{sourcePageUrl:uri}:{}),...(image?{width:image.width,height:image.height}:{})} satisfies RestaurantPhoto;
    });
    return {candidateId:id,status:photos.length?'READY':'EMPTY',photos,expiresAt:new Date(display.expires).toISOString(),requests:{...display.counts}};
  }
  async content(view:RestaurantCaseView,id:string,photoId:string,signal:AbortSignal){
    const display=this.displays.get(this.key(view,id));if(!display||display.signature!==this.signature(view,id)||display.expires<=Date.parse(this.now()))return;
    if(display.website)return this.scope.run(display,()=>this.website.content(view,id,photoId,signal));
    if(display.failed.has(photoId))return;
    let image=display.images.get(photoId);
    if(!image){const ref=display.references.find(p=>digest(p.name)===photoId);if(!ref||!this.google)return;
      let pending=display.imagePending.get(photoId);
      if(!pending){pending=this.google.image(ref,signal,()=>this.charge(display,'googleMedia')).then(value=>{display.images.set(photoId,value);return value;}).catch(error=>{if(recoverablePhotoFailure(error))throw error;display.failed.add(photoId);return undefined;}).finally(()=>{display.imagePending.delete(photoId);});display.imagePending.set(photoId,pending);}
      image=await pending;if(!image)return;}
    return {body:image.body,contentType:image.contentType};
  }
}
