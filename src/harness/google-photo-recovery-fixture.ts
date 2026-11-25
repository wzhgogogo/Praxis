import sharp from 'sharp';
import {GooglePlacesPhotos} from '../integrations/restaurant-photos/google-photos.js';
/** Real adapter/decoder; only transport is synthetic. No network fallback exists. */
export async function googlePhotoRecoveryFixture(mode:'normal'|'transient'|'persistent'|'404'|'invalid'|'details'){
 const bytes=await sharp({create:{width:800,height:600,channels:3,background:'#457b91'}}).jpeg().toBuffer();
 const calls:string[]=[];let failures=0;
 const transport=new GooglePlacesPhotos({apiKey:'offline-photo-key',fetchImplementation:async(input)=>{
  const url=new URL(String(input));calls.push(url.href);
  if(url.hostname==='places.googleapis.com'&&!url.pathname.endsWith('/media')){
   if(mode==='details')throw new TypeError('Controlled Details interruption');
   const id=url.pathname.split('/').at(-1)!;return Response.json({id,photos:Array.from({length:8},(_,i)=>({name:`places/${id}/photos/p${i}`,authorAttributions:[{displayName:'Synthetic photographer',uri:'https://authors.example.org/offline'}]}))});
  }
  if(url.hostname==='places.googleapis.com')return Response.json({photoUri:'https://fixture.googleusercontent.com/'+url.pathname.split('/').at(-2)+'.jpg'});
  if(url.pathname==='/p1.jpg'){
   failures++;
   if(mode==='persistent'||mode==='transient'&&failures===1)return new Response('Controlled transient failure',{status:502});
   if(mode==='404')return new Response('Controlled missing photo',{status:404});
   if(mode==='invalid')return new Response('Not an image',{headers:{'content-type':'text/html'}});
  }
  return new Response(new Uint8Array(bytes),{headers:{'content-type':'image/jpeg'}});
 }});
 return {transport,calls};
}
