
import {startWorkspaceFixture} from './src/harness/workspace-fixture-server.ts';
import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
const host=await startWorkspaceFixture({multiSlot:true,questions:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844}}),blocked=[];
await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():(blocked.push(r.request().url()),r.abort()));
const page=await context.newPage();page.setDefaultTimeout(10000);
const visibleHit=async selector=>page.locator(selector).evaluate(n=>{const b=n.getBoundingClientRect(),e=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {box:{x:b.x,y:b.y,width:b.width,height:b.height},hit:n===e||n.contains(e),viewport:{width:innerWidth,height:innerHeight},composer:document.getElementById('workspace-composer').getBoundingClientRect().toJSON()};});
try{
await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#message').fill('Dinner for two');await page.locator('#send').click();await page.waitForFunction(()=>document.querySelector('#card-counter')?.textContent==='1 of 3');await page.locator('#progress').waitFor({state:'hidden'});
await page.locator('#choose').click({trial:true});const choose=await visibleHit('#choose');await page.screenshot({path:'.eval-artifacts/3c-closeout-20261117/smoke/mobile-choose-actionable.png',animations:'disabled'});
await page.locator('#choose').click();await page.locator('#verification-hint').scrollIntoViewIfNeeded();const footer=await visibleHit('#verification-hint'),departure=await visibleHit('#departure');await page.screenshot({path:'.eval-artifacts/3c-closeout-20261117/smoke/mobile-handoff-footer.png',animations:'disabled'});
await writeFile('.eval-artifacts/3c-closeout-20261117/smoke/mobile-layout-probe.json',JSON.stringify({purpose:'Verify native action scrolling clears the fixed composer; supplement existing same-SHA two-size smoke, not a new product evaluation',choose,footer,departure,blocked},null,2));
}finally{await context.close();await browser.close();await host.close();}
