import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
const root='src/integrations/restaurant-identity/fixtures',htmlPath=root+'/nr010-20261028.html';
const html=readFileSync(htmlPath,'utf8'),sha=b=>createHash('sha256').update(b).digest('hex');
const original=JSON.parse(readFileSync('.eval-artifacts/phase3b/g4-e2e/inputs.json','utf8')).rows.find(r=>r.id==='nr-010');
const provenance=JSON.parse(readFileSync(htmlPath+'.provenance.json','utf8'));
globalThis.fetch=async()=>{throw Error('NETWORK_FORBIDDEN');};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});let blocked=0;await context.route('**/*',r=>{blocked++;return r.abort();});const page=await context.newPage();
try{
 await page.setContent(html,{waitUntil:'domcontentloaded'});
 const result={snapshot:{url:provenance.sourceUrl,title:await page.title(),text:await page.locator('body').innerText()},googleSubject:original.subject};
 const path=root+'/nr010-20261028.snapshot.json';writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 writeFileSync(path+'.provenance.json',JSON.stringify({...provenance,kind:'OFFLINE_DOM_PROJECTION',htmlSha256:sha(Buffer.from(html)),sha256:sha(readFileSync(path)),renderedAtCET:new Date(Date.now()+3600000).toISOString().replace('Z','+01:00'),javaScript:false,blockedRendererRequests:blocked,realNetworkRequests:0},null,2)+'\n',{flag:'wx'});
 writeFileSync(root+'/manifest.json',JSON.stringify({evidenceStatus:'frozen exposed regression',entries:[{html:'nr010-20261028.html',snapshot:'nr010-20261028.snapshot.json',sourceUrl:provenance.sourceUrl,capturedAtCET:provenance.capturedAtCET,htmlSha256:sha(Buffer.from(html)),snapshotSha256:sha(readFileSync(path))}]},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({htmlSHA:sha(Buffer.from(html)),snapshotSHA:sha(readFileSync(path)),GET:0,model:0}));
}finally{await browser.close();}
