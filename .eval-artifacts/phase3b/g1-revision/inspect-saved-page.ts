import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
const target='src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.html';
const bytes=await readFile(target);const metadata=JSON.parse(await readFile(target+'.provenance.json','utf8'));
const digest=createHash('sha256').update(bytes).digest('hex');if(digest!==metadata.fixtureSha256)throw Error('source SHA mismatch');
const output=resolve(process.argv[2]!);if(output.startsWith(resolve('.')+'/'))throw Error('output must be outside repository');
await mkdir(output,{recursive:false});
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
 let attempted=0;await context.route('**/*',async route=>{attempted++;await route.abort();});
 const page=await context.newPage();await page.setContent(bytes.toString(),{waitUntil:'domcontentloaded'});
 const text=await page.locator('body').innerText();
 const headings=await page.locator('h1,h2,h3,h4,h5,h6,[role=heading]').evaluateAll(nodes=>nodes.filter(node=>(node as HTMLElement).getClientRects().length).map(node=>({tag:node.tagName,text:(node as HTMLElement).innerText})));
 await writeFile(output+'/visible-text.txt',text);
 await writeFile(output+'/inspection.json',JSON.stringify({source:target,sourceSha256:digest,sourceUrl:metadata.sourceUrl,capturedOn:metadata.capturedOn,mode:'LOCAL_CHROMIUM_JAVASCRIPT_DISABLED_ALL_REQUESTS_ABORTED',visibleCharacters:text.length,visibleLines:text.split('\n').length,blockedRequests:attempted,externalRequestsSent:0,headings},null,2)+'\n');
 console.log(JSON.stringify({characters:text.length,lines:text.split('\n').length,headings,tail:text.slice(6000,10500)},null,2));
} finally {await browser.close();}
