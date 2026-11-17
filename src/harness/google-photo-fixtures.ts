import sharp from 'sharp';
import { GooglePlacesPhotos } from '../integrations/restaurant-photos/google-photos.js';
export type PhotoScenario='google'|'cover-download-fails'|'cover-decode-fails'|'partial-gallery'|'empty'|'unavailable';
export const LONG_PHOTO_CREDIT='The complete synthetic restaurant photography collective, with the east dining room team and all contributing photographers';
/** Synthetic transport, real decoder and production Google adapter; zero external requests. */
export async function createGooglePhotoFixture(mode:PhotoScenario='google',longCover=false){
  const calls:Array<{url:string;headers:Record<string,string>}>=[];
  const images=await Promise.all(['#b87a5a','#3d6d72','#927a51','#634d72','#ba796e','#52683c','#7b819a','#8b634e'].map((color,index)=>sharp(Buffer.from(`<svg width="1200" height="760" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="760" fill="${color}"/><path d="M0 490H1200V760H0" fill="#322f32"/><rect x="120" y="80" width="340" height="340" rx="130" fill="#d6c4a7"/><rect x="510" y="80" width="500" height="340" rx="4" fill="#2e464a"/><path d="M760 80V420M510 250H1010" stroke="#d6c4a7" stroke-width="10"/><ellipse cx="600" cy="540" rx="300" ry="65" fill="#af714d"/><path d="M440 550V740M760 550V740" stroke="#201e22" stroke-width="20"/><circle cx="560" cy="520" r="24" fill="#f0e6d6"/><circle cx="690" cy="520" r="24" fill="#f0e6d6"/><text x="35" y="720" font-size="26" fill="#e8ddd2">SYNTHETIC FIXTURE · DINING ROOM ${index+1}</text></svg>`)).jpeg().toBuffer()));
  const transport=new GooglePlacesPhotos({apiKey:'fixture-photo-key',fetchImplementation:async(input,init)=>{
    const url=new URL(String(input)),headers=Object.fromEntries(new Headers(init?.headers));calls.push({url:url.href,headers});
    if(url.hostname==='places.googleapis.com'&&!url.pathname.endsWith('/media')){
      if(mode==='unavailable')throw new TypeError('Synthetic details failure');
      const place=url.pathname.split('/').at(-1)!;
      return Response.json({id:place,photos:mode==='empty'?[]:images.map((_,i)=>({name:'places/'+place+'/photos/photo_'+i,authorAttributions:[{displayName:i===1||i===0&&longCover?LONG_PHOTO_CREDIT:'Fixture photographer '+(i+1),uri:'https://authors.example.org/'+i},...(i===1?[{displayName:'Additional credited contributor',uri:'https://authors.example.org/team'}]:[])]}))});
    }
    if(url.hostname==='places.googleapis.com'){
      const ref=url.pathname.split('/').at(-2)!;return Response.json({photoUri:'https://fixture.googleusercontent.com/'+ref+'.jpg'});
    }
    const index=Number(url.pathname.match(/photo_(\d+)/)?.[1]??0);
    if(index===0&&mode==='cover-download-fails')return new Response('Not found',{status:404});
    const bad=index===0&&mode==='cover-decode-fails'||index===2&&mode==='partial-gallery';
    return new Response(bad?new TextEncoder().encode('synthetic corrupt image'):new Uint8Array(images[index]!),{headers:{'content-type':'image/jpeg'}});
  }});
  return {transport,calls};
}
