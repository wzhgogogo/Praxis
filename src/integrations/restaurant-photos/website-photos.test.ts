import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {RestaurantCaseView} from '../../application/agent-workspace.js';
import {createPhotoSourceFixture} from '../../harness/restaurant-photo-fixtures.js';
import {RestaurantWebsitePhotos} from './website-photos.js';

// Component-only cache/diagnostic controls. Actual auth/state/HTTP/UI coverage
// lives in harness/browser/restaurant-photos.test.ts and uses the real app.
function view(root='case-one'):RestaurantCaseView{return {case:{caseId:root,rootTaskId:root},restaurant:{candidates:[{restaurant:{id:'fixture:outlet',outletName:'Fixture Sushi',address:'1-2-3 Tokyo (synthetic)',sourceIds:{googleWebsiteUri:'https://photos.example.org/fixture-sushi/'},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH'}],currentFactEvidence:[],readEvidence:[]}} as unknown as RestaurantCaseView;}

test('Photo cache isolates Cases, deduplicates concurrent content, expires and refuses an old source binding',async()=>{
  const source=await createPhotoSourceFixture();let now=Date.parse('2026-11-02T00:00:00Z');const reader=new RestaurantWebsitePhotos(source.http,()=>new Date(now).toISOString()),signal=new AbortController().signal,one=view();
  const cover=await reader.read(one,'fixture:outlet','cover',signal),gallery=await reader.read(one,'fixture:outlet','gallery',signal);assert.equal(cover.status,'READY');assert.equal(gallery.photos.length,3);
  const second=gallery.photos[1]!;
  const results=await Promise.all([reader.content(one,'fixture:outlet',second.id,signal),reader.content(one,'fixture:outlet',second.id,signal)]);assert.ok(results.every(Boolean));assert.equal(source.calls.filter(c=>c.kind==='image').length,2);
  const two=view('case-two');assert.equal(await reader.content(two,'fixture:outlet',cover.photos[0]!.id,signal),undefined);assert.equal(source.calls.filter(c=>c.kind==='html').length,1);
  const changed=structuredClone(one);changed.restaurant.candidates[0]!.restaurant.sourceIds.googleWebsiteUri='https://photos.example.org/different/';assert.equal(await reader.content(changed,'fixture:outlet',cover.photos[0]!.id,signal),undefined);
  now+=600_001;assert.equal(await reader.content(one,'fixture:outlet',cover.photos[0]!.id,signal),undefined);assert.equal((await reader.read(one,'fixture:outlet','cover',signal)).status,'READY');assert.equal(source.calls.filter(c=>c.kind==='html').length,2,'expired cache can obtain a fresh normal image');
});

test('Photo failures retain safe transport name/cause code and never expose the original message',async()=>{
  const error=new TypeError('Do not leak a provider URL or credential',{cause:{code:'ECONNRESET'}});
  const reader=new RestaurantWebsitePhotos({async get(){throw error;}}),result=await reader.read(view(),'fixture:outlet','cover',new AbortController().signal);
  assert.equal(result.status,'UNAVAILABLE');assert.equal(result.reasonCode,'TypeError:ECONNRESET');assert.equal(JSON.stringify(result).includes('Do not leak'),false);
});
