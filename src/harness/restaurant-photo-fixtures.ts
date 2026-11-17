import sharp from "sharp";
import type { PhotoHttpPort } from "../integrations/restaurant-photos/public-photo-http.js";
import { PhotoReadError } from "../integrations/restaurant-photos/public-photo-http.js";

/** Independent, synthetic source inputs; no real restaurant/photo claims. */
export const photoOutlets=[
  {path:'/fixture-sushi/',name:'Fixture Sushi',address:'1-2-3 Tokyo (synthetic)',color:'#B65437'},
  {path:'/shinjuku-2/',name:'Fixture Yakiniku Shinjuku 2',address:'2-1 Shinjuku, Tokyo',color:'#457B91'},
  {path:'/shinjuku-3/',name:'Fixture Yakiniku Shinjuku 3',address:'3-1 Shinjuku, Tokyo',color:'#817244'},
] as const;

export async function createPhotoSourceFixture(mode:'normal'|'empty'|'wrong-outlet'|'bad-image'='normal') {
  const calls:Array<{url:string;kind:'html'|'image'}>=[],images=new Map<string,Uint8Array>();
  for(const outlet of photoOutlets)for(let i=0;i<3;i++)images.set(outlet.path+'image-'+i+'.jpg',await sharp({create:{width:1000,height:650,channels:3,background:outlet.color}}).jpeg().toBuffer());
  let hold=false,release=()=>{};const gate=new Promise<void>(resolve=>{release=()=>{hold=false;resolve();};});
  const http:PhotoHttpPort={async get(url,input){
    input.onDispatch?.();const parsed=new URL(url);calls.push({url,kind:input.accept});input.signal.throwIfAborted();
    const outlet=photoOutlets.find(item=>parsed.pathname.startsWith(item.path));
    if(!outlet)throw new PhotoReadError('FIXTURE_SOURCE_MISSING');
    if(input.accept==='image') {
      if(mode==='bad-image')return {url,status:200,contentType:'image/jpeg',cacheControl:'public,max-age=600',body:new TextEncoder().encode('broken JPEG')};
      const body=images.get(parsed.pathname);if(!body)throw new PhotoReadError('SOURCE_HTTP_404');
      return {url,status:200,contentType:'image/jpeg',cacheControl:'public,max-age=600',body};
    }
    if(hold&&outlet===photoOutlets[0])await gate;
    const imageUrls=mode==='empty'?[]:[0,1,2].map(i=>'https://photos.example.org'+outlet.path+'image-'+i+'.jpg');
    const record={'@context':'https://schema.org','@type':'Restaurant',name:mode==='wrong-outlet'?'A different branch':outlet.name,address:mode==='wrong-outlet'?'99-99 Osaka':outlet.address,image:imageUrls};
    const html='<!doctype html><html><head><script type="application/ld+json">'+JSON.stringify(record)+'</script></head><body><main><h1>'+record.name+'</h1><p>'+record.address+'</p>'+imageUrls.map(url=>'<img src="'+url+'" width="1000" height="650" alt="Restaurant photo">').join('')+'<aside aria-label="Other restaurants"><img src="https://photos.example.org/other-shop.jpg"></aside></main></body></html>';
    return {url,status:200,contentType:'text/html',cacheControl:'public,max-age=600',body:new TextEncoder().encode(html)};
  }};
  return {http,calls,holdFirst(){hold=true;},release};
}
