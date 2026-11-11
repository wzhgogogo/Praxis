// Offline component projection of original recorded DOM; all requests aborted.
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright-core';
import {PlaywrightControlRegistry} from '../../../src/infrastructure/browser/playwright-browser-controls.js';
const all=JSON.parse(await readFile(new URL('./seven-run-diagnosis.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true});
try {const page=await browser.newPage();await page.route('**/*',r=>r.abort());
 for(const name of ['p3b-holdout-01-r1-retry1','p3b-holdout-02-r2']){
  const run=all.find((d:any)=>d.run===name);const decisions=(await readFile(join(run.path,'execution.decisions.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
  const {readdir}=await import('node:fs/promises');const recroot=join(run.path,'recordings');const dir=join(recroot,(await readdir(recroot))[0]!);const rec=JSON.parse(await readFile(join(dir,'recording.json'),'utf8'));
  const rows=[];
  for(const v of decisions.filter((x:any)=>x.purpose==='browser_read_decide'&&x.browser?.url?.startsWith('https://tabelog.com/en/')&&x.sequence<(name.includes('01')?15:23))){
   const snapshot=v.browser.recordingSnapshot;const doc=rec.pages.find((d:any)=>d.snapshot===snapshot);const file=doc?.diagnostic?.status==='SAVED'?doc.diagnostic.file:undefined;
   if(!file){rows.push({sequence:v.sequence,recordingSnapshot:snapshot,url:v.browser.url,unavailable:doc?.reason??'NO_DOM'});continue;}
   const html=await readFile(join(dir,file),'utf8');await page.setContent('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'">'+html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''));
   const registry=new PlaywrightControlRegistry();const controls=await registry.observe(page);await registry.dispose();const action=JSON.parse(v.outputText);
   // Original refs are indexes in the projected target array; retain actual
   // control identity if the recorded index is present, never guess a new label.
   const idx=Number(action.targetRef?.split(':').at(-1))-1;
   rows.push({sequence:v.sequence,recordingSnapshot:snapshot,url:v.browser.url,controls,action:action.action,target:controls[idx]??null,field:action.authoritativeField});
  }
  await writeFile(`src/harness/browser/fixtures/discovery-visible-progress/${name}.json`,JSON.stringify({evidence:'Component projection from real sanitized DOM; no source scripts/responses replayed; target indexes may differ without recorded CSS; fingerprint-only scope.',sourcePath:run.path,rows},null,2));
 }
}finally{await browser.close();}
