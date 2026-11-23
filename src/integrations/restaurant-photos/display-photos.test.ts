import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {RestaurantCaseView} from '../../application/agent-workspace.js';
import {createGooglePhotoFixture,LONG_PHOTO_CREDIT} from '../../harness/google-photo-fixtures.js';
import {createPhotoSourceFixture} from '../../harness/restaurant-photo-fixtures.js';
import {RestaurantDisplayPhotos} from './display-photos.js';
const signal=new AbortController().signal;
function view(google=true):RestaurantCaseView{return {case:{caseId:'case',rootTaskId:'task'},restaurant:{candidates:[{restaurant:{id:'fixture:outlet',outletName:'Fixture Sushi',address:'1-2-3 Tokyo (synthetic)',sourceIds:{googleWebsiteUri:'https://photos.example.org/fixture-sushi/',...(google?{googlePlaces:'fixture_0',googleMapsUri:'https://maps.google.com/?cid=fixture0'}:{})},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH'}],currentFactEvidence:[],readEvidence:[]}} as unknown as RestaurantCaseView;}
test('Google display uses IDs-only details once, original decoded bytes and complete authors, with no credentials on CDN or DTO',async()=>{
 const google=await createGooglePhotoFixture(),source=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,source.http),v=view();
 const before=JSON.stringify(v),cover=await reader.read(v,'fixture:outlet','cover',signal),gallery=await reader.read(v,'fixture:outlet','gallery',signal);
 assert.equal(cover.status,'READY');assert.equal(gallery.photos.length,8);assert.equal(gallery.photos[1]!.authors![0]!.displayName,LONG_PHOTO_CREDIT);assert.equal(gallery.photos[1]!.authors!.length,2);
 assert.equal(google.calls[0]!.headers['x-goog-fieldmask'],'id,photos');assert.equal(google.calls.filter(c=>!c.url.includes('/media')&&c.url.includes('places.googleapis.com')).length,1);
 for(const call of google.calls.filter(c=>c.url.includes('googleusercontent.com'))){assert.equal(call.headers['x-goog-api-key'],undefined);assert.equal(new URL(call.url).searchParams.has('key'),false);}
 const content=await reader.content(v,'fixture:outlet',cover.photos[0]!.id,signal);assert.equal(content?.contentType,'image/jpeg');assert.equal(source.calls.length,0);
 assert.doesNotMatch(JSON.stringify(gallery),/fixture-photo-key|places\/fixture_0\/photos|googleusercontent/);assert.equal(JSON.stringify(v),before);
 const other=structuredClone(v);other.case.rootTaskId='other';assert.equal(await reader.content(other,'fixture:outlet',cover.photos[0]!.id,signal),undefined);
});
test('All eight Google gallery images load exactly once: one Details and sixteen media/CDN dispatches',async()=>{
 const google=await createGooglePhotoFixture(),reader=new RestaurantDisplayPhotos(google.transport),v=view();
 const gallery=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(gallery.photos.length,8);
 for(const photo of gallery.photos){const image=await reader.content(v,'fixture:outlet',photo.id,signal);assert.ok(image&&image.body.byteLength>0,photo.id+' must have actual decoded image bytes');}
 const again=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(again.photos.length,8);assert.equal(again.requests?.googleDetails,1);assert.equal(again.requests?.googleMedia,16);
 assert.equal(google.calls.filter(c=>c.headers['x-goog-fieldmask']).length,1);assert.equal(google.calls.filter(c=>!c.headers['x-goog-fieldmask']).length,16);
});
test('Google CDN redirects consume the twenty-dispatch budget; the twenty-first send is refused while prior images stay readable',async()=>{
 const google=await createGooglePhotoFixture('redirect-budget'),reader=new RestaurantDisplayPhotos(google.transport),v=view();
 const gallery=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(gallery.photos.length,8);
 for(const photo of gallery.photos.slice(0,6)){const image=await reader.content(v,'fixture:outlet',photo.id,signal);assert.ok(image&&image.body.byteLength>0);}
 const media=()=>google.calls.filter(c=>!c.headers['x-goog-fieldmask']);assert.equal(media().length,18);
 assert.equal(await reader.content(v,'fixture:outlet',gallery.photos[6]!.id,signal),undefined);
 assert.equal(media().length,20);assert.ok(media().at(-1)!.url.endsWith('/photo_6.jpg'));
 assert.equal(media().some(c=>c.url.endsWith('/photo_6.jpg?final=1')),false,'the required twenty-first HTTP dispatch never reaches transport');
 assert.equal(await reader.content(v,'fixture:outlet',gallery.photos[7]!.id,signal),undefined);assert.equal(media().length,20,'no later API request may bypass the exhausted budget');
 for(const photo of gallery.photos.slice(0,6)){const image=await reader.content(v,'fixture:outlet',photo.id,signal);assert.ok(image&&image.body.byteLength>0);}
 const remaining=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(remaining.photos.length,6);assert.equal(remaining.requests?.googleDetails,1);assert.equal(remaining.requests?.googleMedia,20);assert.equal(media().length,20);
});
for(const mode of ['cover-download-fails','cover-decode-fails','empty','unavailable','no-id'] as const)test('Google '+mode+' falls back through the existing bound website source',async()=>{
 const google=await createGooglePhotoFixture(mode==='no-id'?'google':mode),source=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,source.http),v=view(mode!=='no-id');
 const cover=await reader.read(v,'fixture:outlet','cover',signal);assert.equal(cover.status,'READY');assert.equal(cover.photos[0]!.sourceLabel,'photos.example.org');assert.equal(cover.photos[0]!.provider,'WEBSITE');assert.equal(source.calls.filter(c=>c.kind==='html').length,1);assert.equal(cover.requests?.websitePages,1);
 if(mode==='no-id')assert.equal(google.calls.length,0);const image=await reader.content(v,'fixture:outlet',cover.photos[0]!.id,signal);assert.equal(image?.contentType,'image/webp');
});
test('Individual gallery corruption is isolated, budgets include media/CDN hops and both-source failure is honest',async()=>{
 const google=await createGooglePhotoFixture('partial-gallery'),source=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,source.http),v=view();
 const gallery=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(await reader.content(v,'fixture:outlet',gallery.photos[2]!.id,signal),undefined);assert.ok(await reader.content(v,'fixture:outlet',gallery.photos[3]!.id,signal));
 for(const photo of gallery.photos)await reader.content(v,'fixture:outlet',photo.id,signal);
 assert.equal(google.calls.filter(c=>c.url.includes('/media')||c.url.includes('googleusercontent.com')).length,16);const remaining=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(remaining.photos.length,7);assert.equal(remaining.requests?.googleMedia,16);assert.equal(remaining.photos.some(p=>p.id===gallery.photos[2]!.id),false);assert.equal(source.calls.length,0);
 const bad=await createGooglePhotoFixture('cover-decode-fails'),website=await createPhotoSourceFixture('bad-image'),empty=new RestaurantDisplayPhotos(bad.transport,website.http);const result=await empty.read(v,'fixture:outlet','cover',signal);assert.equal(result.status,'UNAVAILABLE');assert.equal(result.photos.length,0);
});

test('A changed candidate binding cannot reset the one-Details budget',async()=>{
 const google=await createGooglePhotoFixture(),source=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,source.http),v=view();await reader.read(v,'fixture:outlet','cover',signal);
 v.restaurant.candidates[0]!.restaurant.address='A different address';const changed=await reader.read(v,'fixture:outlet','cover',signal);assert.equal(changed.requests?.googleDetails,1);assert.equal(google.calls.filter(c=>c.headers['x-goog-fieldmask']).length,1);assert.notEqual(changed.status,'READY','the old photo cannot donate a changed outlet binding');
});

import {googlePhotoRecoveryFixture} from '../../harness/google-photo-recovery-fixture.js';
for(const mode of ['transient','404','invalid','persistent'] as const)test('Round25 M2 real Google adapter '+mode+' obeys recovery and media budget',async()=>{
 const source=await googlePhotoRecoveryFixture(mode),reader=new RestaurantDisplayPhotos(source.transport),v=view(),gallery=await reader.read(v,'fixture:outlet','gallery',signal),second=gallery.photos[1]!;
 const successful=await reader.content(v,'fixture:outlet',gallery.photos[0]!.id,signal);assert.ok(successful?.body.length);
 if(mode==='transient'||mode==='persistent'){
  await assert.rejects(reader.content(v,'fixture:outlet',second.id,signal),{code:'GOOGLE_PHOTO_HTTP_502'});
  assert.equal((await reader.read(v,'fixture:outlet','gallery',signal)).photos.length,8);
  if(mode==='transient'){
   for(const photo of gallery.photos)assert.ok((await reader.content(v,'fixture:outlet',photo.id,signal))?.body.length);
   const final=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(final.photos.length,8);assert.equal(final.requests!.googleDetails,1);assert.equal(final.requests!.googleMedia,18);
  }else{
   for(let i=0;i<12;i++)await reader.content(v,'fixture:outlet',second.id,signal).catch(()=>{});
   const final=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(final.requests!.googleMedia,20);assert.equal(source.calls.filter(u=>u.includes('/media')||u.includes('googleusercontent')).length,20);
   assert.ok((await reader.content(v,'fixture:outlet',gallery.photos[0]!.id,signal))?.body.length);assert.equal(final.photos.length,7);
  }
 }else{
  assert.equal(await reader.content(v,'fixture:outlet',second.id,signal),undefined);const final=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(final.photos.length,7);assert.equal(final.requests!.googleMedia,4);assert.equal(await reader.content(v,'fixture:outlet',second.id,signal),undefined);
 }
});
test('Round25 M2 an interrupted sole Details allowance cannot promise a complete Google album on reconnect',async()=>{
 const google=await googlePhotoRecoveryFixture('details'),website=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,website.http),v=view();
 for(let n=0;n<3;n++){const result=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(result.photos.length,3);assert.equal(result.photos[0]!.provider,'WEBSITE');assert.equal(result.requests!.googleDetails,1);assert.equal(result.requests!.googleMedia,0);}
 assert.equal(google.calls.length,1,'reconnect cannot reset/re-spend Details budget');
});
