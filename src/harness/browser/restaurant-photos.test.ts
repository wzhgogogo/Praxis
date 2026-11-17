import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { chromium, type Page } from "playwright-core";
import sharp from "sharp";
import { startWorkspaceFixture } from "../workspace-fixture-server.js";
import { createPhotoSourceFixture } from "../restaurant-photo-fixtures.js";
import { observePageImages } from "../../infrastructure/browser/observe-page-images.js";
import { extractRestaurantPhotos } from "../../integrations/restaurant-photos/extract-photos.js";

const sizes=[{name:'mobile',width:390,height:844},{name:'desktop',width:1280,height:900}];
async function start(page:Page,host:Awaited<ReturnType<typeof startWorkspaceFixture>>) {
  page.setDefaultTimeout(10_000);await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);
  await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('#message').fill('Dinner with photos');await page.getByRole('button',{name:'Send',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3');
}
async function capture(page:Page,name:string){const root=process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if(!root)return;await mkdir(root,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:join(root,name+'.png'),animations:'disabled'});}
async function photoLoaded(page:Page,id='cover-image'){await page.waitForFunction(id=>{const image=document.getElementById(id) as HTMLImageElement|null;return !!image?.complete&&image.naturalWidth>0;},id);}

for(const size of sizes){
  test('Restaurant photos '+size.name+': production assembly/HTTP renders a source cover and gallery without changing the plan, input or current card',{timeout:45_000},async()=>{
    const source=await createPhotoSourceFixture(),host=await startWorkspaceFixture({photoHttp:source.http});
    const browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      await start(page,host);await photoLoaded(page);
      const chooseBox=await page.locator('#choose').boundingBox(),composerBox=await page.locator('#workspace-composer').boundingBox();assert.ok(chooseBox&&composerBox&&chooseBox.y+chooseBox.height<=composerBox.y,'the photo credit must not put Choose this behind the fixed composer');
      assert.equal(await page.locator('#no-photo').isVisible(),false);assert.equal(await page.locator('#cover-open').isVisible(),true);
      const card=await page.locator('#candidate-card').elementHandle(),cover=await page.locator('#cover-image').getAttribute('src'),modelCount=host.requests.length;
      assert.ok(cover?.startsWith(host.baseUrl+'/api/cases/'));
      const response=await context.request.get(cover!);assert.equal(response.status(),200);assert.equal(response.headers()['content-type'],'image/webp');assert.equal(response.headers()['cache-control'],'private, no-store');
      const bytes=await response.body(),metadata=await sharp(bytes).metadata(),pixel=await sharp(bytes).resize(1,1).raw().toBuffer();assert.equal(metadata.width,1000);assert.equal(metadata.exif,undefined);assert.ok(pixel[0]!>pixel[2]!,'first outlet is the independent terracotta fixture');
      await page.locator('#message').fill('Keep this draft');await capture(page,size.name+'-photos-cover');
      await page.locator('#cover-open').click();await page.locator('#photo-viewer').waitFor({state:'visible'});await page.waitForFunction(()=>document.getElementById('photo-counter')?.textContent==='1 of 3');
      await page.locator('#photo-next').click();await photoLoaded(page,'large-photo');assert.equal(await page.locator('#photo-counter').innerText(),'2 of 3');
      await capture(page,size.name+'-photos-viewer');await page.getByRole('button',{name:'Close photos',exact:true}).click();
      assert.equal(await page.locator('#message').inputValue(),'Keep this draft');assert.equal(await card!.evaluate(n=>n===document.getElementById('candidate-card')),true);
      await page.locator('#details-button').click();await photoLoaded(page,'detail-photo');assert.equal(await page.locator('#detail-photo-counter').innerText(),'2 of 3');
      assert.equal(await page.locator('#detail-photo-source').innerText(),'Source: photos.example.org');assert.equal(await page.locator('#message').inputValue(),'Keep this draft');
      await page.locator('#detail-photo-next').click();assert.equal(await page.locator('#detail-photo-counter').innerText(),'3 of 3');await capture(page,size.name+'-photos-details');
      await page.reload();await page.locator('#details').waitFor({state:'visible'});await photoLoaded(page,'detail-photo');assert.equal(await page.locator('#detail-photo-counter').innerText(),'3 of 3','photo position restores in this Case and outlet');
      await page.locator('#details-back').click();await page.locator('#message').fill('SSE keeps this draft');const before=await page.locator('#cover-image').getAttribute('src');await page.locator('#bookmark').click();await page.waitForFunction(()=>document.getElementById('bookmark')?.getAttribute('aria-pressed')==='true');
      assert.equal(await page.locator('#cover-image').getAttribute('src'),before);assert.equal(await page.locator('#message').inputValue(),'SSE keeps this draft');assert.equal(await page.locator('#restaurant-name').innerText(),'Fixture Sushi');assert.equal(host.requests.length,modelCount);
      assert.equal(source.calls.filter(call=>call.kind==='html').length,1,'cover/gallery/reload reuse one bound source read');
      const apiPath=new URL(cover!).pathname,photoPath=apiPath.replace(/\/[a-f0-9]{32}\/content$/,'');
      const calls=source.calls.length,other=await browser.newContext({baseURL:host.baseUrl});await other.request.post('/api/session',{data:{accessToken:'workspace-other'}});assert.equal((await other.request.get(apiPath)).status(),404);await other.close();
      assert.equal((await context.request.get(photoPath+'?url=https://elsewhere.example.org/a.jpg')).status(),400);assert.equal(source.calls.length,calls,'unauthorised and arbitrary-URL attempts cannot reach the source');
      const versionBefore=(await (await context.request.get(photoPath.split('/candidates/')[0]!)).json()).view.case.taskVersion;
      await context.request.get(photoPath+'?scope=gallery');const versionAfter=(await (await context.request.get(photoPath.split('/candidates/')[0]!)).json()).view.case.taskVersion;assert.equal(versionAfter,versionBefore,'image reads do not mutate Task State');
    }finally{await browser.close();await host.close();}
  });

  test('Restaurant photos '+size.name+': availability SSE keeps the open gallery, current photo and draft', {timeout:35_000},async()=>{
    const source=await createPhotoSourceFixture(),host=await startWorkspaceFixture({photoHttp:source.http});
    const browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      await start(page,host);await photoLoaded(page);await page.locator('#details-button').click();await page.waitForFunction(()=>document.getElementById('detail-photo-counter')?.textContent==='1 of 3');
      await page.locator('#detail-photo-next').click();await page.locator('#detail-photo-next').click();await photoLoaded(page,'detail-photo');await page.locator('#message').fill('Keep this question draft');await page.locator('#detail-photo-open').click();
      const original=await page.locator('#large-photo').getAttribute('src'),path=new URL(original!).pathname.split('/candidates/')[0]!,before=(await (await context.request.get(path)).json()).view;
      host.hold();host.clock.advance(60_000);
      const refreshed=await context.request.post(path+'/refresh',{data:{taskVersion:before.case.taskVersion,requestId:'photos-sse-'+size.name}});assert.equal(refreshed.status(),200);
      await host.waitForCheck();await page.locator('#progress').waitFor({state:'visible'});host.release();await page.locator('#progress').waitFor({state:'hidden'});
      assert.equal(await page.locator('#photo-viewer').isVisible(),true,'a changed identity observation must not dismiss the current gallery');assert.equal(await page.locator('#photo-counter').innerText(),'3 of 3');assert.equal(await page.locator('#large-photo').getAttribute('src'),original);
      await page.locator('#photo-close').click();assert.equal(await page.locator('#message').inputValue(),'Keep this question draft');assert.equal(await page.locator('#detail-photo-counter').innerText(),'3 of 3');assert.equal(source.calls.filter(call=>call.kind==='html').length,1);
      await capture(page,size.name+'-photos-sse-preserved');
    }finally{host.release();await browser.close();await host.close();}
  });

  test('Restaurant photos '+size.name+': a late first-outlet photo cannot overwrite the current outlet or typed text',{timeout:35_000},async()=>{
    const source=await createPhotoSourceFixture();source.holdFirst();const host=await startWorkspaceFixture({photoHttp:source.http});
    const browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      const firstPhoto=page.waitForResponse(response=>decodeURIComponent(response.url()).includes('/candidates/fixture:outlet/photos?scope=cover'));
      await start(page,host);assert.equal(await page.locator('#no-photo').isVisible(),true);assert.equal(await page.locator('#choose').isEnabled(),true);
      await page.locator('#message').fill('Stay on this card');await page.locator('#next').click();await photoLoaded(page);
      const second=await page.locator('#cover-image').getAttribute('src');source.release();
      await firstPhoto;
      assert.equal(await page.locator('#restaurant-name').innerText(),'Fixture Yakiniku Shinjuku 2');assert.equal(await page.locator('#message').inputValue(),'Stay on this card');assert.equal(await page.locator('#cover-image').getAttribute('src'),second);
      const pixels=await sharp(await (await context.request.get(second!)).body()).resize(1,1).raw().toBuffer();assert.ok(pixels[2]!>pixels[0]!,'second outlet retains the independent blue fixture');
      await capture(page,size.name+'-photos-late-isolated');
    }finally{source.release();await browser.close();await host.close();}
  });

  test('Restaurant photos '+size.name+': empty, wrong-outlet and corrupt-image sources retain No photo and usable actions',{timeout:45_000},async()=>{
    const browser=await chromium.launch({headless:true});
    try{for(const mode of ['empty','wrong-outlet','bad-image'] as const){
      const source=await createPhotoSourceFixture(mode),host=await startWorkspaceFixture({photoHttp:source.http}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
      try{const finished=page.waitForResponse(response=>decodeURIComponent(response.url()).includes('/candidates/fixture:outlet/photos?scope=cover'));await start(page,host);const result=await (await finished).json();assert.equal(result.status,mode==='empty'?'EMPTY':'UNAVAILABLE');assert.equal(result.photos.length,0);
        assert.equal(await page.locator('#no-photo').isVisible(),true);assert.equal(await page.locator('#cover-open').isVisible(),false);assert.equal(await page.locator('#choose').isEnabled(),true);
        await page.locator('#message').fill('Still editable');await page.locator('#details-button').click();assert.equal(await page.locator('#place-photos').isVisible(),false);assert.equal(await page.locator('#message').inputValue(),'Still editable');
        await page.locator('#details-back').click();assert.equal(await page.locator('#restaurant-name').innerText(),'Fixture Sushi');if(mode==='empty')await capture(page,size.name+'-photos-unavailable');
      }finally{await context.close();await host.close();}
    }}finally{await browser.close();}
  });
}

test('Photo DOM observation uses the real browser currentSrc for responsive/lazy source images',{timeout:20_000},async()=>{
  const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1}),page=await context.newPage();
  const bytes=await sharp({create:{width:700,height:450,channels:3,background:'#B65437'}}).jpeg().toBuffer();
  try{
    await context.route('**/*',async route=>{if(route.request().url().endsWith('/shop/'))await route.fulfill({contentType:'text/html',body:'<main><h1>Browser Test</h1><p>1-2 Shibuya Tokyo</p><img id="responsive" src="/small.jpg" srcset="/small.jpg 400w, /large.jpg 1000w" sizes="350px"><img id="lazy" src="/placeholder.jpg" data-src="/lazy.jpg"><script>document.getElementById("lazy").src="/lazy.jpg";</script></main>'});else await route.fulfill({contentType:'image/jpeg',body:bytes});});
    await page.goto('https://restaurant.example.org/shop/');await page.locator('#responsive').evaluate((image:HTMLImageElement)=>image.decode());
    const images=await observePageImages(page);assert.equal(images[0]!.currentSrc,'https://restaurant.example.org/small.jpg');assert.equal(images[1]!.currentSrc,'https://restaurant.example.org/lazy.jpg');
    const result=extractRestaurantPhotos({url:page.url(),html:await page.content(),text:await page.locator('body').innerText(),title:'Browser Test',images},{restaurant:{id:'browser-shop',outletName:'Browser Test',address:'1-2 Shibuya Tokyo',sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH'});
    assert.deepEqual(result.photos.map(photo=>photo.url),['https://restaurant.example.org/large.jpg','https://restaurant.example.org/lazy.jpg']);
  }finally{await browser.close();}
});
