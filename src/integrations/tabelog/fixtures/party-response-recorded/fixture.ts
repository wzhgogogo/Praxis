import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import type {BrowserSnapshot} from "../../../../infrastructure/browser/browser-runtime.js";
const folder=new URL('./',import.meta.url);
export const cases=JSON.parse(await readFile(new URL('manifest.json',folder),'utf8'));
export async function recordedPartyPage(meta:typeof cases[number]):Promise<BrowserSnapshot>{
 const html=await readFile(new URL(meta.dom.after.file,folder),'utf8');const body=await readFile(new URL(meta.response.file,folder),'utf8');
 for(const [bytes,hash]of [[html,meta.dom.after.sha256],[body,meta.response.sha256]])assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 return {url:meta.pageURL,title:meta.title,html,text:'Recorded source calendar',settlement:'SETTLED',responses:[{sequence:meta.componentMetadata.sequence,observedAt:meta.componentMetadata.observedAt,url:meta.response.url,status:meta.response.status,body:JSON.parse(body)}]};
}
