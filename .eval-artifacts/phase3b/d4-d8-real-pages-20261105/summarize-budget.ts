import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
const baseline=JSON.parse(await readFile(new URL('budget-baseline.json',root),'utf8'));
const session=JSON.parse(await readFile(new URL('budget-C.json',root),'utf8'));
const totals={...baseline.cumulative};
for(const row of session.entries)for(const key of Object.keys(totals))totals[key]+=(row[key]??0);
for(const [key,limit]of Object.entries(session.approvedLimits))if(totals[key]>(limit as number))throw Error(`GLOBAL_LIMIT:${key}`);
const summary={baseline:baseline.cumulative,session:session.entries.reduce((n:any,r:any)=>{for(const key of Object.keys(totals))n[key]=(n[key]??0)+(r[key]??0);return n},{}),cumulative:totals,limits:session.approvedLimits,reserved:session.reserved,holdoutOriginalsRead:false};
await writeFile(new URL('budget-summary.json',root),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
