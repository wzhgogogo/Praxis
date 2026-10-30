import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {LOCAL_WORKSPACE_PAGE} from '../../../../src/web/local-workspace-page.ts';

// First produce a real persistent HTTP/assembly result; only the fixture transports
// inside that test replace provider I/O. Then render that artifact in real Chromium.
const root=new URL('./web-delivery/',import.meta.url);
await mkdir(root);
const run=spawnSync(process.execPath,['--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-reporter=tap','--test-name-pattern=B1 ordinary assembly','src/server/local-web-server.test.ts'],{
  env:{...process.env,PRAXIS_B1_UI_SNAPSHOT:'1'},encoding:'utf8',maxBuffer:4*1024*1024,timeout:60_000,
});
await writeFile(new URL('http-ui.log',root),run.stdout+run.stderr);
assert.equal(run.status,0,'HTTP composition must pass before UI verification');
const prefix='# B1_G3_HTTP_VIEW ';
const line=run.stdout.split('\n').find(line=>line.startsWith(prefix));
assert.ok(line,'capture an actually generated HTTP projection, never a hand-prepared B1 record');
const view=JSON.parse(Buffer.from(line.slice(prefix.length),'base64').toString('utf8'));
await writeFile(new URL('http-view.json',root),JSON.stringify(view,null,2)+'\n');
const expected='https://tabelog.com/en/booking/form_course/new?visit_time=%31%39%30%30&member=2&rcd=13123456&visit_date=20260809';
assert.equal(view.restaurant.bookingHandoffs[0].url,expected);
const blocked=[],errors=[];
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1120,height:900}});
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!=='https://b1-g3-workspace.invalid'){blocked.push(url.toString());return route.abort();}
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});
    if(url.pathname.endsWith('/events'))return route.abort();
    if(url.pathname==='/api/session')return route.fulfill({json:{user:{id:'fixture-owner'}}});
    if(url.pathname==='/api/cases')return route.fulfill({json:{cases:[view.case]}});
    if(url.pathname.endsWith('/booking-feedback/claim'))return route.fulfill({json:{prompt:null}});
    return route.fulfill({json:{view}});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
  await page.clock.install({time:new Date(view.restaurant.bookingHandoffs[0].checkedAt)});
  await page.goto('https://b1-g3-workspace.invalid/');
  const direct=page.getByRole('link',{name:'Book on Tabelog',exact:true});
  await direct.waitFor({timeout:5000});
  assert.equal(await direct.getAttribute('href'),expected);
  const continuation=page.getByRole('link',{name:'Continue on Tabelog — date, time, 2 guests filled in',exact:true});
  assert.equal(await continuation.getAttribute('href'),expected);
  assert.doesNotMatch(await page.locator('.booking-handoff').innerText(),/\bselected\b|\bbooked\b/iu);
  await page.screenshot({path:new URL('web-desktop.png',root).pathname,fullPage:true});
  assert.deepEqual(blocked,[],'no automatic visit to a link or any website');assert.deepEqual(errors,[]);
  await context.close();
  await writeFile(new URL('web.json',root),JSON.stringify({status:'PASS',mode:'REAL_HTTP_ARTIFACT_THEN_LOCAL_CHROMIUM_RENDER',url:expected,
    sourceSelection:'UNKNOWN',blocked,pageErrors:errors,realSourceRequests:0,realModelCalls:0},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',buttons:2,realSourceRequests:0,realModelCalls:0}));
}finally{await browser.close();}
