import sharp from "sharp";
import { ProxyAgent } from "undici";
import { PhotoReadError } from "./public-photo-http.js";

export interface GooglePhotoReference { name:string; authors:Array<{displayName:string;uri?:string}>; }
export interface GooglePhotoTransport {
  list(placeId:string,signal:AbortSignal,charge:()=>void):Promise<GooglePhotoReference[]>;
  image(photo:GooglePhotoReference,signal:AbortSignal,charge:()=>void):Promise<{body:Uint8Array;contentType:"image/jpeg"|"image/png"|"image/webp";width:number;height:number}>;
}
export interface GooglePhotosOptions { apiKey:string; proxyServer?:string|undefined; fetchImplementation?:typeof fetch; }
const API='https://places.googleapis.com';
function publicLink(value:unknown):string|undefined {
  if(typeof value!=='string')return;
  try{const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}return;
}
function cdn(value:string):URL {
  let u:URL;try{u=new URL(value);}catch{throw new PhotoReadError('GOOGLE_PHOTO_LOCATION_INVALID');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||!['googleusercontent.com','ggpht.com','gstatic.com'].some(host=>u.hostname===host||u.hostname.endsWith('.'+host)))throw new PhotoReadError('GOOGLE_PHOTO_LOCATION_BLOCKED');
  // Never propagate a credential, even if returned in an unexpected redirect.
  if([...u.searchParams.keys()].some(k=>/^(?:key|api_?key|token|access_token)$/i.test(k)))throw new PhotoReadError('GOOGLE_PHOTO_CREDENTIAL_REDIRECT');
  return u;
}
async function bytes(response:Response,max:number):Promise<Uint8Array> {
  if(Number(response.headers.get('content-length')??0)>max)throw new PhotoReadError('RESPONSE_TOO_LARGE');
  const reader=response.body?.getReader();if(!reader)throw new PhotoReadError('EMPTY_RESPONSE');
  const parts:Uint8Array[]=[];let length=0;
  try{for(;;){const next=await reader.read();if(next.done)break;length+=next.value.length;if(length>max)throw new PhotoReadError('RESPONSE_TOO_LARGE');parts.push(next.value);}}catch(e){await reader.cancel();throw e;}
  return Buffer.concat(parts);
}
async function json(response:Response):Promise<Record<string,unknown>> {
  if(response.status!==200||!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??''))throw new PhotoReadError('GOOGLE_PHOTO_HTTP_'+response.status);
  const value:unknown=JSON.parse(new TextDecoder().decode(await bytes(response,1_000_000)));
  if(!value||typeof value!=='object'||Array.isArray(value))throw new PhotoReadError('GOOGLE_PHOTO_INVALID_JSON');return value as Record<string,unknown>;
}
/** Separate from search: IDs-only details and sized media, no credentials on CDN hops. */
export class GooglePlacesPhotos implements GooglePhotoTransport {
  private readonly get:typeof fetch;
  constructor(private readonly options:GooglePhotosOptions){
    let get=fetch;
    if(options.proxyServer?.trim()){
      const proxy=new URL(options.proxyServer);if(!['http:','https:'].includes(proxy.protocol))throw new PhotoReadError('GOOGLE_PHOTO_PROXY_INVALID');
      const agent=new ProxyAgent(proxy.href);get=(url,init)=>fetch(url,{...init,dispatcher:agent} as RequestInit);
    }
    this.get=options.fetchImplementation??get;
  }
  async list(placeId:string,signal:AbortSignal,charge:()=>void):Promise<GooglePhotoReference[]> {
    if(!/^[A-Za-z0-9_-]+$/.test(placeId)||!this.options.apiKey)throw new PhotoReadError('GOOGLE_PHOTO_ID_OR_KEY_MISSING');
    charge();const response=await this.get(API+'/v1/places/'+encodeURIComponent(placeId),{method:'GET',redirect:'manual',credentials:'omit',signal:AbortSignal.any([signal,AbortSignal.timeout(8_000)]),headers:{'X-Goog-Api-Key':this.options.apiKey,'X-Goog-FieldMask':'id,photos'}});
    const value=await json(response);if(value.id!==placeId)throw new PhotoReadError('GOOGLE_PHOTO_PLACE_MISMATCH');
    if(value.photos===undefined)return [];if(!Array.isArray(value.photos))throw new PhotoReadError('GOOGLE_PHOTO_INVALID_LIST');
    const result:GooglePhotoReference[]=[];
    for(const raw of value.photos){
      if(!raw||typeof raw!=='object')continue;const row=raw as Record<string,unknown>,name=row.name;
      if(typeof name!=='string'||!name.startsWith('places/'+placeId+'/photos/')||!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)||result.some(p=>p.name===name))continue;
      const authors:GooglePhotoReference['authors']=[];
      if(Array.isArray(row.authorAttributions))for(const author of row.authorAttributions){
        if(author&&typeof author==='object'&&typeof author.displayName==='string'&&author.displayName.trim()){
          const uri=publicLink(author.uri);authors.push({displayName:author.displayName,...(uri?{uri}:{})});
        }
      }
      result.push({name,authors});if(result.length===8)break;
    }
    return result;
  }
  async image(photo:GooglePhotoReference,signal:AbortSignal,charge:()=>void){
    const bounded=AbortSignal.any([signal,AbortSignal.timeout(8_000)]);
    charge();let response=await this.get(API+'/v1/'+photo.name+'/media?maxWidthPx=1600&skipHttpRedirect=true',{method:'GET',redirect:'manual',credentials:'omit',signal:bounded,headers:{'X-Goog-Api-Key':this.options.apiKey}});
    let location:string;
    if([301,302,303,307,308].includes(response.status)){location=response.headers.get('location')??'';await response.body?.cancel();}
    else{const value=await json(response);if(typeof value.photoUri!=='string')throw new PhotoReadError('GOOGLE_PHOTO_MEDIA_MISSING');location=value.photoUri;}
    for(let hop=0;;hop++){
      const url=cdn(location);charge();response=await this.get(url,{method:'GET',redirect:'manual',credentials:'omit',signal:bounded,headers:{accept:'image/jpeg,image/png,image/webp'}});
      if(![301,302,303,307,308].includes(response.status))break;
      if(hop===3)throw new PhotoReadError('GOOGLE_PHOTO_REDIRECT_LIMIT');location=new URL(response.headers.get('location')??'',url).href;await response.body?.cancel();
    }
    const contentType=(response.headers.get('content-type')??'').split(';')[0];
    if(response.status!==200)throw new PhotoReadError('GOOGLE_PHOTO_HTTP_'+response.status);
    if(!['image/jpeg','image/png','image/webp'].includes(contentType!))throw new PhotoReadError('GOOGLE_PHOTO_IMAGE_REJECTED');
    const body=await bytes(response,8_000_000),image=sharp(body,{limitInputPixels:20_000_000,failOn:'warning',animated:false});
    const meta=await image.metadata().catch(()=>{throw new PhotoReadError('GOOGLE_PHOTO_DECODE_FAILED');});
    if(!['jpeg','png','webp'].includes(meta.format??'')||(meta.pages??1)>1||!meta.width||!meta.height)throw new PhotoReadError('GOOGLE_PHOTO_DECODE_FAILED');
    await image.raw().toBuffer().catch(()=>{throw new PhotoReadError('GOOGLE_PHOTO_DECODE_FAILED');});bounded.throwIfAborted();
    // Validate in memory, return the original sized bytes; no Google transcoding/storage.
    return {body,contentType:contentType as 'image/jpeg'|'image/png'|'image/webp',width:meta.width,height:meta.height};
  }
}
