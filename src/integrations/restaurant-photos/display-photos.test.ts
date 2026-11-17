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
for(const mode of ['cover-download-fails','cover-decode-fails','empty','unavailable','no-id'] as const)test('Google '+mode+' falls back through the existing bound website source',async()=>{
 const google=await createGooglePhotoFixture(mode==='no-id'?'google':mode),source=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,source.http),v=view(mode!=='no-id');
 const cover=await reader.read(v,'fixture:outlet','cover',signal);assert.equal(cover.status,'READY');assert.equal(cover.photos[0]!.sourceLabel,'photos.example.org');assert.equal(source.calls.filter(c=>c.kind==='html').length,1);assert.equal(cover.requests?.websitePages,1);
 if(mode==='no-id')assert.equal(google.calls.length,0);const image=await reader.content(v,'fixture:outlet',cover.photos[0]!.id,signal);assert.equal(image?.contentType,'image/webp');
});
test('Individual gallery corruption is isolated, budgets include media/CDN hops and both-source failure is honest',async()=>{
 const google=await createGooglePhotoFixture('partial-gallery'),source=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,source.http),v=view();
 const gallery=await reader.read(v,'fixture:outlet','gallery',signal);assert.equal(await reader.content(v,'fixture:outlet',gallery.photos[2]!.id,signal),undefined);assert.ok(await reader.content(v,'fixture:outlet',gallery.photos[3]!.id,signal));
 for(const photo of gallery.photos)await reader.content(v,'fixture:outlet',photo.id,signal);
 assert.equal(google.calls.filter(c=>c.url.includes('/media')||c.url.includes('googleusercontent.com')).length,10);assert.equal(source.calls.length,0);
 const bad=await createGooglePhotoFixture('cover-decode-fails'),website=await createPhotoSourceFixture('bad-image'),empty=new RestaurantDisplayPhotos(bad.transport,website.http);const result=await empty.read(v,'fixture:outlet','cover',signal);assert.equal(result.status,'UNAVAILABLE');assert.equal(result.photos.length,0);
});

test('A changed candidate binding cannot reset the one-Details budget',async()=>{
 const google=await createGooglePhotoFixture(),source=await createPhotoSourceFixture(),reader=new RestaurantDisplayPhotos(google.transport,source.http),v=view();await reader.read(v,'fixture:outlet','cover',signal);
 v.restaurant.candidates[0]!.restaurant.address='A different address';const changed=await reader.read(v,'fixture:outlet','cover',signal);assert.equal(changed.requests?.googleDetails,1);assert.equal(google.calls.filter(c=>c.headers['x-goog-fieldmask']).length,1);assert.notEqual(changed.status,'READY','the old photo cannot donate a changed outlet binding');
});
