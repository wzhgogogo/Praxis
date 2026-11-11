import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {LOCAL_WORKSPACE_PAGE} from '../../../../src/web/local-workspace-page.ts';

const root=new URL('./web/',import.meta.url);await mkdir(root);
const run=spawnSync(process.execPath,['--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-reporter=tap','--test-name-pattern=B1 ordinary assembly','src/server/local-web-server.test.ts'],{
  env:{...process.env,PRAXIS_B1_UI_SNAPSHOT:'1'},encoding:'utf8',maxBuffer:4*1024*1024,timeout:60_000,
});
await writeFile(new URL('http-ui.log',root),run.stdout+run.stderr);
assert.equal(run.status,0,'same production HTTP composition must pass after rebase');
const prefix='# B1_G3_HTTP_VIEW ',line=run.stdout.split('\n').find(line=>line.startsWith(prefix));assert.ok(line);
const view=JSON.parse(Buffer.from(line.slice(prefix.length),'base64').toString('utf8'));
await writeFile(new URL('http-view.json',root),JSON.stringify(view,null,2)+'\n');
const expected='https://tabelog.com/en/booking/form_course/new?visit_time=%31%39%30%30&member=2&rcd=13123456&visit_date=20260809';
assert.equal(view.restaurant.bookingHandoffs[0].url,expected);
assert.equal(view.restaurant.selectedCandidateId,undefined);
const fontFiles={
  '/assets/geist.woff2':new URL('../../../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',import.meta.url),
  '/assets/geist-mono.woff2':new URL('../../../../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',import.meta.url),
};
const blocked=[],errors=[],writes=[];const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!=='https://b1-g3-workspace.invalid'){blocked.push(url.toString());return route.abort();}
    if(request.method()!=='GET')writes.push({path:url.pathname,method:request.method()});
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});
    if(fontFiles[url.pathname])return route.fulfill({contentType:'font/woff2',body:await readFile(fontFiles[url.pathname])});
    if(url.pathname.endsWith('/events'))return route.abort();
    if(url.pathname==='/api/session')return route.fulfill({json:{user:{id:'user-a',displayName:'Fixture owner'}}});
    if(url.pathname==='/api/cases')return route.fulfill({json:{cases:[view.case]}});
    if(url.pathname.endsWith('/booking-feedback/claim'))return route.fulfill({json:{prompt:null}});
    return route.fulfill({json:{view}});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
  await page.clock.install({time:new Date(view.restaurant.bookingHandoffs[0].checkedAt)});
  await page.goto('https://b1-g3-workspace.invalid/');
  await page.getByRole('button').filter({hasText:view.case.title}).click({timeout:5000});
  await page.getByRole('button',{name:'Choose this',exact:true}).click({timeout:5000});
  const direct=page.getByRole('link',{name:'Go to source website ↗',exact:true});
  const continuation=page.getByRole('link',{name:/Continue on Tabelog/});
  for(const [label,width,height] of [['desktop',1280,900],['mobile',390,844]]){
    await page.setViewportSize({width,height});await direct.waitFor({timeout:5000});
    assert.equal(await direct.getAttribute('href'),expected);assert.equal(await continuation.getAttribute('href'),expected);
    assert.match(await continuation.innerText(),/Date, time, 2 guests filled in/u);
    assert.doesNotMatch(await continuation.innerText(),/\bselected\b|\bbooked\b/iu);
    await page.screenshot({path:new URL('web-'+label+'.png',root).pathname,fullPage:true});
  }
  assert.deepEqual(blocked,[]);assert.deepEqual(errors,[]);assert.deepEqual(writes,[],'Choose this only changes current view, not Task selection or booking');
  await context.close();
  await writeFile(new URL('web.json',root),JSON.stringify({status:'PASS',mode:'REAL_HTTP_ARTIFACT_THEN_CURRENT_MAIN_CHROMIUM_RENDER',mainBase:'7c83e02e',url:expected,buttons:2,sizes:2,sourceSelection:'UNKNOWN',blocked,pageErrors:errors,writes,realSourceRequests:0,realModelCalls:0},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',buttons:2,sizes:2,realSourceRequests:0,realModelCalls:0}));
}finally{await browser.close();}
