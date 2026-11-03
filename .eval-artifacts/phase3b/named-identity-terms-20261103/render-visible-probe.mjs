import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const root=dirname(fileURLToPath(import.meta.url));
const original=join(root,'raw/runs/D3/D3/recordings/g6-D3-1793681527903-0');
const har=JSON.parse(await readFile(join(original,'replay.har'),'utf8'));
const manifest=JSON.parse(await readFile(join(original,'recording.json'),'utf8'));
const output=join(root,'render-visible-probe');await mkdir(output);
const browser=await chromium.launch({headless:true,proxy:{server:'http://127.0.0.1:9'}});
const results=[];
try{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:1280,height:720}});
  let current;const routes=[];
  await context.route('**/*',async route=>{
    const request=route.request();
    const entry=har.log.entries.find(e=>e.request.url===request.url()&&e.request.method===request.method());
    if(request.url()===current.url){await route.fulfill({status:200,contentType:'text/html',body:current.html});routes.push({kind:'RECORDED_DOM',url:request.url()});}
    else if(entry&&request.resourceType()==='stylesheet'){
      await route.fulfill({status:entry.response.status,contentType:entry.response.content.mimeType,body:entry.response.content.text});routes.push({kind:'RECORDED_STYLESHEET',url:request.url()});
    }else{await route.abort('blockedbyclient');routes.push({kind:'BLOCKED',origin:new URL(request.url()).origin,resourceType:request.resourceType()});}
  });
  for(const number of [23,24]){
    const descriptor=manifest.pages.find(p=>p.snapshot===number);
    current={url:descriptor.url,html:await readFile(number===23?join(root,'english-visible-original.html'):join(original,`snapshot-${String(number).padStart(4,'0')}.html`),'utf8')};
    const page=await context.newPage();
    await page.goto(current.url,{waitUntil:'load',timeout:20000});
    const text=await page.locator('body').innerText();
    const title=await page.title();
    const expected=manifest.entries.filter(e=>e.kind==='SNAPSHOT')[number-1].detail;
    const sha256=createHash('sha256').update(text).digest('hex');
    const snapshot={url:current.url,html:current.html,title,text};
    await writeFile(join(output,`snapshot-${number}.json`),JSON.stringify(snapshot,null,2)+'\n');
    results.push({snapshot:number,url:current.url,textSha256:sha256,expectedTextSha256:expected.textSha256,textLength:text.length,expectedTextLength:expected.textLength,exact:sha256===expected.textSha256});
    await page.close();
  }
  await context.close();
  const result={mode:'OFFLINE_DOM_RECONSTRUCTION_ONLY',results,routes,externalRequests:0,realModels:0,google:0,envFileLoaded:false};
  await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
  process.stdout.write(JSON.stringify({results,externalRequests:0})+'\n');
}finally{await browser.close();}
