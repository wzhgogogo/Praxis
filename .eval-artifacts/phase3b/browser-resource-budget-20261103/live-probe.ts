import {chromium} from 'playwright-core';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {PlaywrightReadNetworkGuard} from '../../../src/infrastructure/browser/playwright-read-network-guard.js';
import {tabelogPublicReadNetworkPolicy} from '../../../src/integrations/tabelog/tabelog-public-query.js';
const mode=process.argv[2];if(!['before','after'].includes(mode!))throw Error('MODE');
const url='https://tabelog.com/en/tokyo/A1323/A132305/13108466/';
const out=new URL(`./live-${mode}.json`,import.meta.url),ledger=new URL('../budget.json',import.meta.url);const rows:any[]=[];
const stamp=()=>new Date().toLocaleString('sv-SE',{timeZone:'Europe/Vienna'}).replace(' ','T')+'+01:00';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
for(let i=0;i<3;i++){
 const b=JSON.parse(readFileSync(ledger,'utf8')),id=`phase3b-B-resource-${mode}-get-${i+1}-20261103`;
 if(b.entries.some((e:any)=>e.id===id))throw Error('ALREADY_SPENT_NO_RETRY');
 if(b.cumulative.evaluationPublicGET+1>b.limits.evaluationPublicGET)throw Error('GLOBAL_GET_LIMIT');
 const entry={id,conversation:'B',timeCET:stamp(),mode:'PUBLIC_DETAIL_LOAD_COMPARISON',url,fullLive:0,realModelCalls:0,environmentReruns:0,evaluationPublicGET:1,googleRequests:0,restaurantWebsiteRequests:0};
 b.entries.push(entry);b.cumulative.evaluationPublicGET++;writeFileSync(ledger,JSON.stringify(b,null,2)+'\n');
 const browser=await chromium.launch({headless:true,proxy:{server:'http://127.0.0.1:10808'}});const context=await browser.newContext({serviceWorkers:'block'});const page=await context.newPage();
 const guard=new PlaywrightReadNetworkGuard(tabelogPublicReadNetworkPolicy);await guard.install(context);await guard.preparePage(context,page);guard.prepareNavigation(url,20000);
 let dclMs:number|undefined;const start=performance.now();page.once('domcontentloaded',()=>{dclMs=performance.now()-start});let error:string|undefined,status:number|undefined,bodyText='';
 try{const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});status=response?.status();bodyText=await page.locator('body').innerText({timeout:1000});}catch(e){error=(e instanceof Error?e.message:String(e)).replace(/https?:\/\/[^\s"<>]+/g,'[URL]');}
 await new Promise(r=>setTimeout(r,500));const requests=guard.snapshotRequests(),diagnostics=guard.snapshotDiagnostics();await browser.close();
 const actual=requests.filter(r=>r.outcome==='ADMITTED').length;
 const current=JSON.parse(readFileSync(ledger,'utf8'));const stored=current.entries.find((e:any)=>e.id===id);stored.restaurantWebsiteRequests=actual;current.cumulative.restaurantWebsiteRequests+=actual;writeFileSync(ledger,JSON.stringify(current,null,2)+'\n');
 rows.push({id,sha,timeCET:stamp(),dclMs:dclMs??null,status:status??null,error:error??null,observationWindow:'DCL/20s timeout + 500ms; new ephemeral browser per read',bodyTextSha256:createHash('sha256').update(bodyText).digest('hex'),bodyTextLength:bodyText.length,busy:/アクセスが集中|access.*busy/i.test(bodyText),attemptedRequests:requests.length,admittedRequests:actual,policyBlocked:requests.filter(r=>r.outcome==='BLOCKED').length,resourceCounts:Object.fromEntries([...new Set(requests.map(r=>r.resourceType))].map(t=>[t,requests.filter(r=>r.resourceType===t&&r.outcome==='ADMITTED').length])),diagnostics});
 writeFileSync(out,JSON.stringify({mode,url,rows},null,2)+'\n');console.log(JSON.stringify(rows.at(-1)));
 if(i<2)await new Promise(r=>setTimeout(r,5500));
}
