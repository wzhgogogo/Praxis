import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { BlockList, isIP } from "node:net";
import { request as requestHttp, type RequestOptions } from "node:http";
import { request as requestHttps } from "node:https";
import { isSensitiveGenericReadUrl } from "../../infrastructure/browser/browser-read-policy.js";
import { reviewedPublicRestaurantImage } from "./source-image-policy.js";

export class PhotoReadError extends Error {
  constructor(readonly code: string) { super(code); this.name = "PhotoReadError"; }
}

const blocked = new BlockList();
for (const [ip, bits] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",4],["240.0.0.0",4]] as const) blocked.addSubnet(ip,bits,"ipv4");
for (const [ip,bits] of [["2001::",23],["2001:db8::",32],["2002::",16]] as const) blocked.addSubnet(ip,bits,"ipv6");
const globalV6 = new BlockList(); globalV6.addSubnet("2000::",3,"ipv6");
export function publicPhotoAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address,"ipv4") : family === 6 && globalV6.check(address,"ipv6") && !blocked.check(address,"ipv6");
}

export function publicPhotoUrl(value: string, base?: string, kind: "html" | "image" = "html"): URL {
  let url: URL; try { url = new URL(value, base); } catch { throw new PhotoReadError("INVALID_URL"); }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || (url.port && !["80","443"].includes(url.port))
    || /(?:^|\.)(?:localhost|local|internal|invalid)$/.test(host) || (isIP(host) && !publicPhotoAddress(host))) throw new PhotoReadError("NON_PUBLIC_URL");
  if(isSensitiveGenericReadUrl(url)&&!(kind==='image'&&reviewedPublicRestaurantImage(url))) throw new PhotoReadError("SENSITIVE_URL");
  url.hash = ""; return url;
}

export interface PhotoHttpResponse { url: string; status: number; contentType: string; cacheControl: string; body: Uint8Array; }
export interface PhotoHttpPort {
  get(url: string, input: { signal: AbortSignal; maxBytes: number; allowedOrigins: readonly string[]; accept: "html" | "image"; onDispatch?: () => void }): Promise<PhotoHttpResponse>;
}

/** No ambient proxy, credentials, cookie jar or automatic redirect/DNS lookup. */
export class PublicPhotoHttp implements PhotoHttpPort {
  constructor(private readonly dns: (host:string,options:{all:true;verbatim:true})=>Promise<LookupAddress[]> = lookup, private readonly request: typeof requestHttp = requestHttp) {}

  async get(value: string, input: Parameters<PhotoHttpPort["get"]>[1]): Promise<PhotoHttpResponse> {
    const signal = AbortSignal.any([input.signal, AbortSignal.timeout(5_000)]);
    let url = publicPhotoUrl(value,undefined,input.accept);
    for (let hop = 0; hop <= 3; hop++) {
      signal.throwIfAborted();
      if (!input.allowedOrigins.includes(url.origin)) throw new PhotoReadError("REDIRECT_ORIGIN_BLOCKED");
      const host = url.hostname.replace(/^\[|\]$/g, "");
      const resolve = isIP(host) ? Promise.resolve([{address:host,family:isIP(host)}]) : this.dns(host,{all:true,verbatim:true});
      let stop: () => void = () => {};
      const aborted = new Promise<never>((_,reject) => { stop=()=>reject(signal.reason);signal.addEventListener("abort",stop,{once:true}); });
      const addresses = await Promise.race([resolve,aborted]).finally(()=>signal.removeEventListener("abort",stop));
      if (!addresses.length || addresses.some(item=>!publicPhotoAddress(item.address))) throw new PhotoReadError("NON_PUBLIC_ADDRESS");
      const address = addresses[0]!;
      input.onDispatch?.();
      const result = await new Promise<PhotoHttpResponse & { location?: string }>((resolve,reject) => {
        const options: RequestOptions = { method:"GET",signal,agent:false,
          headers:{accept:input.accept==="html"?"text/html,application/xhtml+xml":"image/jpeg,image/png,image/webp", "user-agent":"Praxis/0.1 public restaurant photos"},
          lookup: (_hostname, options, callback) => {
            // The real socket connects to exactly the address validated above.
            if (options.all) callback(null,[{address:address.address,family:address.family}]);
            else callback(null,address.address,address.family);
          },
        };
        const send = this.request === requestHttp && url.protocol === "https:" ? requestHttps : this.request;
        const req = send(url,options,response=>{
          const status=response.statusCode??0, location=response.headers.location;
          if ([301,302,303,307,308].includes(status)) {
            response.destroy(); resolve({url:url.href,status,contentType:"",cacheControl:"",body:new Uint8Array(),...(location?{location}:{})}); return;
          }
          const type=String(response.headers["content-type"]??""), valid=input.accept==="html"?/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(type):/^image\/(?:jpeg|png|webp)(?:;|$)/i.test(type);
          if (status!==200 || !valid || Number(response.headers["content-length"]??0)>input.maxBytes) { response.destroy();reject(new PhotoReadError(status!==200?"SOURCE_HTTP_"+status:!valid?"CONTENT_TYPE_REJECTED":"RESPONSE_TOO_LARGE"));return; }
          const parts:Buffer[]=[];let length=0;
          response.on("data",(part:Buffer)=>{length+=part.length;if(length>input.maxBytes){response.destroy(new PhotoReadError("RESPONSE_TOO_LARGE"));return;}parts.push(part);});
          response.on("error",reject);
          response.on("end",()=>resolve({url:url.href,status,contentType:type,cacheControl:String(response.headers["cache-control"]??""),body:Buffer.concat(parts)}));
        });
        req.on("error",reject);req.end();
      });
      if (![301,302,303,307,308].includes(result.status)) return result;
      if (!result.location || hop===3) throw new PhotoReadError("REDIRECT_LIMIT");
      url=publicPhotoUrl(result.location,url.href,input.accept);
    }
    throw new PhotoReadError("REDIRECT_LIMIT");
  }
}
