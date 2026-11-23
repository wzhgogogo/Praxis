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
      await host.waitForCheck();
      const active=(await(await context.request.get(path)).json()).view;assert.equal(active.restaurant.progress.active,true);
      await page.waitForFunction(()=>document.querySelector('.case-link.active small')?.textContent==='In progress');
      assert.equal(await page.locator('#progress').isVisible(),false,'Details keeps search progress isolated from the open gallery');
      assert.equal(await page.locator('#details').isVisible(),true);assert.equal(await page.locator('#refresh').isVisible(),false,'refresh is only offered for presented results');assert.equal(await page.locator('#details-refresh-status').innerText(),'Refreshing…');assert.equal(await page.locator('#photo-viewer').isVisible(),true);assert.equal(await page.locator('#photo-counter').innerText(),'3 of 3');
      host.release();await page.waitForFunction(()=>document.querySelector('.case-link.active small')?.textContent==='Ready');
      assert.equal((await(await context.request.get(path)).json()).view.restaurant.progress.active,false);
      assert.equal(await page.locator('#progress').isVisible(),false);
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

async function assertCurrentPhoto(page:Page,imageId:string,counterId:string,photo:{id:string;contentUrl:string},n:number,total:number){
  await page.waitForFunction(({imageId,path})=>{const image=document.getElementById(imageId) as HTMLImageElement|null;return !!image?.complete&&image.naturalWidth>0&&new URL(image.currentSrc).pathname===path;},{imageId,path:photo.contentUrl});
  assert.equal(await page.locator('#'+counterId).innerText(),n+' of '+total);
  assert.equal(await page.locator('#'+imageId).evaluate((image:HTMLImageElement)=>new URL(image.currentSrc).pathname),photo.contentUrl);
}
async function photoUiSettled(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}

test('Google photos: eight of eight through About and viewer, with exact demand-only downloads and no lookahead',{timeout:40_000},async()=>{
  const {createGooglePhotoFixture}=await import('../google-photo-fixtures.js');const google=await createGooglePhotoFixture(),source=await createPhotoSourceFixture(),host=await startWorkspaceFixture({photoHttp:source.http,photoGoogle:google.transport});
  const browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:1280,height:900}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===host.baseUrl?route.continue():route.abort('blockedbyclient'));
  const page=await context.newPage(),photoRequests:string[]=[];page.on('request',r=>{if(r.url().includes('/photos'))photoRequests.push(r.url());});
  const media=()=>google.calls.filter(c=>!c.headers['x-goog-fieldmask']);
  try{
    const coverResponse=page.waitForResponse(r=>r.url().endsWith('/photos?scope=cover'));await start(page,host);await photoLoaded(page);await coverResponse;await photoUiSettled(page);
    assert.equal(media().length,2);assert.equal(photoRequests.some(url=>url.includes('scope=gallery')),false,'ordinary cards only request cover');
    const galleryResponse=page.waitForResponse(r=>r.url().endsWith('/photos?scope=gallery'));await page.locator('#details-button').click();const gallery=await(await galleryResponse).json();assert.equal(gallery.photos.length,8);
    await assertCurrentPhoto(page,'detail-photo','detail-photo-counter',gallery.photos[0],1,8);await photoUiSettled(page);
    assert.equal(media().length,2,'opening About must not fetch photo[1]');assert.equal(photoRequests.some(url=>url.includes('/'+gallery.photos[1].id+'/content')),false);
    for(let i=1;i<4;i++){await page.locator('#detail-photo-next').click();await assertCurrentPhoto(page,'detail-photo','detail-photo-counter',gallery.photos[i],i+1,8);await photoUiSettled(page);assert.equal(media().length,2*(i+1));}
    await page.locator('#detail-photo-open').click();await page.locator('#photo-viewer').waitFor({state:'visible'});await assertCurrentPhoto(page,'large-photo','photo-counter',gallery.photos[3],4,8);assert.equal(await page.locator('#detail-photo-counter').innerText(),'4 of 8');
    for(let i=4;i<8;i++){await page.keyboard.press('ArrowRight');await assertCurrentPhoto(page,'large-photo','photo-counter',gallery.photos[i],i+1,8);assert.equal(await page.locator('#detail-photo-counter').innerText(),(i+1)+' of 8');await photoUiSettled(page);assert.equal(media().length,2*(i+1));}
    await capture(page,'google-eight-of-eight-viewer');
    const again=await(await context.request.get(new URL(gallery.photos[0].contentUrl,host.baseUrl).pathname.replace(/\/[a-f0-9]{32}\/content$/,'')+'?scope=gallery')).json();
    assert.equal(again.photos.length,8);assert.equal(again.requests.googleDetails,1);assert.equal(again.requests.googleMedia,16);assert.equal(media().length,16);assert.equal(source.calls.length,0);
  }finally{await browser.close();await host.close();}
});

test('Website photos: one deduplicated lookahead, fail-closed provider and failed warm-up leave current image/counter untouched',{timeout:45_000},async()=>{
  const browser=await chromium.launch({headless:true});
  try{for(const mode of ['normal','bad-second','unknown-provider'] as const){
    const source=await createPhotoSourceFixture(mode==='unknown-provider'?'normal':mode),host=await startWorkspaceFixture({photoHttp:source.http}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:1280,height:900}});
    await context.route('**/*',async route=>{
      if(new URL(route.request().url()).origin!==host.baseUrl)return route.abort('blockedbyclient');
      if(mode==='unknown-provider'&&route.request().url().endsWith('/photos?scope=gallery')){const response=await route.fetch(),result=await response.json();for(const photo of result.photos)delete photo.provider;return route.fulfill({response,json:result});}
      return route.continue();
    });
    const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const calls=(i:number)=>source.calls.filter(c=>c.kind==='image'&&new URL(c.url).pathname==='/fixture-sushi/image-'+i+'.jpg').length;
    try{
      await start(page,host);await photoLoaded(page);await photoUiSettled(page);assert.equal(calls(0),1);assert.equal(calls(1),0,'card view must not look ahead');assert.equal(calls(2),0);
      const cover=await page.locator('#cover-image').getAttribute('src');const warmed=mode==='unknown-provider'?undefined:page.waitForResponse(r=>r.url()!==cover&&/\/photos\/[a-f0-9]{32}\/content$/.test(new URL(r.url()).pathname)&&r.status()===(mode==='bad-second'?410:200));
      const response=page.waitForResponse(r=>r.url().endsWith('/photos?scope=gallery'));await page.locator('#details-button').click();const gallery=await(await response).json();assert.equal(gallery.photos.length,3);
      const photos=gallery.photos;await assertCurrentPhoto(page,'detail-photo','detail-photo-counter',photos[0],1,3);
      if(mode!=='unknown-provider'){
        const warmReply=await warmed;assert.ok(warmReply);assert.ok(warmReply.url().endsWith('/'+photos[1].id+'/content'));
      }
      await photoUiSettled(page);assert.equal(calls(1),mode==='unknown-provider'?0:1);assert.equal(calls(2),0,'warm-up completion cannot cascade');await assertCurrentPhoto(page,'detail-photo','detail-photo-counter',photos[0],1,3);
      await page.locator('#detail-photo-open').click();await assertCurrentPhoto(page,'large-photo','photo-counter',photos[0],1,3);await photoUiSettled(page);assert.equal(calls(1),mode==='unknown-provider'?0:1,'the second entrance must deduplicate lookahead');assert.equal(calls(2),0);
      await page.locator('#photo-next').click();
      if(mode==='bad-second'){
        await assertCurrentPhoto(page,'large-photo','photo-counter',photos[2],2,2);assert.equal(await page.locator('#detail-photo-counter').innerText(),'2 of 2');assert.equal(calls(1),1,'failed prefetch is remembered server-side, not redownloaded from source');
      }else{
        await assertCurrentPhoto(page,'large-photo','photo-counter',photos[1],2,3);assert.equal(await page.locator('#detail-photo-counter').innerText(),'2 of 3');assert.equal(calls(1),1,'visible next image reuses the single source download');
      }
      assert.deepEqual(errors,[]);await capture(page,'website-lookahead-'+mode);
    }finally{await context.close();await host.close();}
  }}finally{await browser.close();}
});

for(const width of [390,1440])test(`Round23 UI: R8 ${width} About and fullscreen native swipes preserve taps scroll and attribution`,{timeout:45000},async()=>{
 const {createGooglePhotoFixture}=await import('../google-photo-fixtures.js');const google=await createGooglePhotoFixture(),source=await createPhotoSourceFixture();
 const host=await startWorkspaceFixture({photoHttp:source.http,photoGoogle:google.transport,provider:'TABELOG',cuisineDisagreement:'Original category prose for a long About page. '.repeat(150)}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:true,reducedMotion:'reduce'});
 const destinations:string[]=[];await context.route('**/*',r=>{const url=r.request().url();if(new URL(url).origin===host.baseUrl)return r.continue();if(r.request().isNavigationRequest()){destinations.push(url);return r.fulfill({contentType:'text/html',body:'<title>Offline attribution target</title>'});}return r.abort();});const page=await context.newPage(),cdp=await context.newCDPSession(page);
 const swipe=async(selector:string,dx:number,dy=0)=>{const box=await page.locator(selector).boundingBox();assert.ok(box);const x=box.x+box.width*.5,y=box.y+box.height*.5;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const credits=async(selector:string)=>{for(const index of [0,1]){const a=page.locator(selector+' a').nth(index),href=await a.getAttribute('href');assert.ok(href?.startsWith('https:'));const popup=context.waitForEvent('page');await a.tap();const opened=await popup;await opened.waitForLoadState('domcontentloaded');assert.equal(opened.url(),href);assert.ok(destinations.includes(href));await opened.close();}};
 try{await start(page,host);await photoLoaded(page);const galleryResponse=page.waitForResponse(r=>r.url().endsWith('/photos?scope=gallery'));await page.locator('#details-button').click();const gallery=await(await galleryResponse).json();await assertCurrentPhoto(page,'detail-photo','detail-photo-counter',gallery.photos[0],1,8);
  await swipe('#detail-photo',-90);await assertCurrentPhoto(page,'detail-photo','detail-photo-counter',gallery.photos[1],2,8);assert.equal(await page.locator('#details').isVisible(),true);assert.equal(await page.locator('#photo-viewer').isVisible(),false);await capture(page,`round23-r8-${width}-about-swiped`);
  await swipe('#detail-photo',90);await assertCurrentPhoto(page,'detail-photo','detail-photo-counter',gallery.photos[0],1,8);assert.equal(await page.locator('#photo-viewer').isVisible(),false);await page.locator('#detail-photo-open').tap();await page.locator('#photo-viewer').waitFor();
  await swipe('#large-photo',-90);await assertCurrentPhoto(page,'large-photo','photo-counter',gallery.photos[1],2,8);assert.equal(await page.locator('#photo-viewer').evaluate(n=>(n as HTMLDialogElement).open),true);await capture(page,`round23-r8-${width}-viewer-swiped`);
  await swipe('#large-photo',90);await assertCurrentPhoto(page,'large-photo','photo-counter',gallery.photos[0],1,8);assert.equal(await page.locator('#photo-viewer').evaluate(n=>(n as HTMLDialogElement).open),true);await credits('#photo-source');await page.locator('#photo-close').tap();assert.equal(await page.locator('#details').isVisible(),true);
  const before=await page.locator('#case-workspace').evaluate(n=>n.scrollTop);await swipe('#detail-photo',0,-100);await page.waitForFunction(y=>document.getElementById('case-workspace')!.scrollTop>y,before);assert.equal(await page.locator('#photo-viewer').isVisible(),false);await capture(page,`round23-r8-${width}-about-vertical-scroll`);await page.locator('#case-workspace').evaluate(n=>n.scrollTop=0);await credits('#detail-photo-source');assert.equal(await page.locator('#details').isVisible(),true);
 }finally{await context.close();await browser.close();await host.close();}
});
