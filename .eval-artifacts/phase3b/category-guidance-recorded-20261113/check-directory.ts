// Recorded-DOM component inspection only; no source access, identity acceptance or delivery.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tabelogDiscoveryPack} from '../../../src/integrations/restaurant-search/source-packs.js';
const base=new URL('../../../src/harness/browser/fixtures/r2-scope/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
const results=[];
for(const name of ['parent','other','exact']){
 const m=manifest.find((v:any)=>v.name===name);const html=await readFile(new URL(m.file,base),'utf8');const sha=createHash('sha256').update(html).digest('hex');if(sha!==m.sha256)throw Error('RECORDING_HASH_MISMATCH');
 const listing=tabelogDiscoveryPack.parseListing({url:m.url,title:m.title,html,text:''});
 results.push({name,url:m.url,title:m.title,sha256:sha,sourceCommit:m.sourceCommit,outlets:listing.outlets,scope:'Recorded DOM parser component; no identity or current inventory conclusion'});
}
await writeFile(new URL('./directory-evidence.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results.map(r=>({name:r.name,candidates:r.outlets.length,first:r.outlets[0]}))));
