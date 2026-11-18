import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {startWorkspaceFixture} from '../../../src/harness/workspace-fixture-server.ts';
const out=new URL('./',import.meta.url),sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results=[];
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),'');
for(const size of [{width:390,height:844},{width:1440,height:900}]){
 const host=await startWorkspaceFixture({outcome:'empty'}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size});
 const blocked=[];await context.route('**/*',r=>{if(new URL(r.request().url()).origin===host.baseUrl)return r.continue();blocked.push(r.request().url());return r.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 const noOutline=async()=>{const style=await page.locator('#message').evaluate(n=>{const s=getComputedStyle(n);return {outline:s.outlineStyle,width:s.outlineWidth,focused:n===document.activeElement};});assert.equal(style.focused,true);assert.ok(style.outline==='none'||parseFloat(style.width)===0,JSON.stringify(style));return style;};
 try{
  await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('#message').click();const pointer=await noOutline();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');const keyboard=await noOutline();
  await page.screenshot({path:new URL(size.width+'-home-focus.png',out).pathname,animations:'disabled'});
  await page.locator('#message').fill('Dinner in Tokyo');await page.locator('#send').click();await page.locator('#empty-state').waitFor({state:'visible'});await page.locator('#empty-adjust').click();const adjust=await noOutline();assert.match(await page.locator('#message').getAttribute('placeholder'),/Try another area/);
  await page.locator('#message').fill('Keep my draft');await page.locator('#case-title').click();await page.locator('#empty-adjust').click();assert.equal(await page.locator('#message').inputValue(),'Keep my draft');await noOutline();
  await page.screenshot({path:new URL(size.width+'-workspace-adjust.png',out).pathname,animations:'disabled'});assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
  results.push({sha,size,status:'PASS',pointer,keyboard,adjust,draftPreserved:true,pageErrors:errors,nonlocalRequests:blocked,newLive:0});
 }finally{await context.close();await browser.close();await host.close();}
}
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),'');await writeFile(new URL('focus-results.json',out),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({sha,pass:results.length,tests:2,newLive:0}));
