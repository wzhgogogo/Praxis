import {parse,type DefaultTreeAdapterMap} from 'parse5';
import type {BrowserSnapshot} from '../../../../infrastructure/browser/browser-runtime.js';
type Node=DefaultTreeAdapterMap['node'];
type Element=DefaultTreeAdapterMap['element'];
const isElement=(n:Node):n is Element=>'tagName' in n;
const attr=(n:Node,k:string)=>isElement(n)?n.attrs.find(a=>a.name===k)?.value:undefined;
const children=(n:Node):Node[]=>'childNodes'in n?n.childNodes:[];
const text=(n:Node):string=>'value'in n?n.value:children(n).map(text).join(' ');
const norm=(s:string)=>s.normalize('NFKC').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const obj=(v:unknown):Record<string,unknown>|undefined=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
function http(s:string,base?:string){try{const u=new URL(s,base);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u:undefined;}catch{return undefined;}}
export function sourceEntity(url:string):{provider:'TABLECHECK'|'TABELOG';id:string}|undefined{
 const u=http(url);if(!u)return;
 if(['www.tablecheck.com','tablecheck.com'].includes(u.hostname)){
  const m=/^\/(?:en|ja)\/(?:shops\/)?([a-z0-9-]+)(?:\/reserve(?:\/landing)?)?\/?$/iu.exec(u.pathname);
  if(m&&m[1]!=='japan')return{provider:'TABLECHECK',id:m[1]!};
 }
 if(u.hostname==='tabelog.com'){const m=/\/(\d+)\/?$/u.exec(u.pathname);if(m)return{provider:'TABELOG',id:m[1]!};}
}
export interface IndependentSourceIdentity {name:string;address:string;phone?:string;canonicalUrl:string;sourceEntityId:string;provider:'TABLECHECK'|'TABELOG';street?:string;locality?:string;region?:string;postalCode?:string;}
export interface IndependentWidget {date:string;partySize:number;slots:string[];}
export function civicAddress(value:string){
 const s=value.normalize('NFKC').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[−‐‑–—]/gu,'-').replace(/-?chome|丁目/gu,'-').replace(/番地?|号/gu,'-').replace(/-+/gu,'-');
 const street=s.match(/\d{1,3}\s*-\s*\d{1,3}\s*-\s*\d{1,3}/u)?.[0].replace(/\s/gu,'');
 const floors=[...s.matchAll(/\b(b\d{1,2})(?:f)?\b|\b(\d{1,2})f\b|(\d{1,2})階/gu)].map(m=>m[1]??m[2]??m[3]!);
 return {street,floors:[...new Set(floors)].sort()};
}
export function sameCivicAddress(a:string,b:string){const x=civicAddress(a),y=civicAddress(b);return Boolean(x.street&&x.street===y.street&&JSON.stringify(x.floors)===JSON.stringify(y.floors));}
export function sourceAddressMatches(identity:IndependentSourceIdentity,address:string,pointer?:string){
 if(norm(identity.address)===norm(address)||identity.postalCode&&[identity.postalCode+' '+identity.address,identity.address+' '+identity.postalCode].some(a=>norm(a)===norm(address)))return true;
 if(!sameCivicAddress(identity.address,address))return false;
 const words=[identity.region,identity.locality?.split(/[-\s]/u)[0]].filter((s):s is string=>Boolean(s&&/[a-z]{3}/iu.test(s)));
 if(words.length>=2&&/[a-z]{3}/iu.test(address))return words.every(w=>(' '+norm(address)+' ').includes(' '+norm(w)+' '));
 const a=pointer&&sourceEntity(pointer);return Boolean(a&&a.provider===identity.provider&&a.id===identity.sourceEntityId);
}
export function readIndependentSource(page:Pick<BrowserSnapshot,'url'|'html'|'visibleHtml'>){
 const root=parse(page.html),identities:IndependentSourceIdentity[]=[],location=sourceEntity(page.url),links=new Set<string>();
 const nodes:Node[]=[];const visit=(n:Node)=>{nodes.push(n);children(n).forEach(visit);};visit(root);
 for(const n of nodes){
  if(!isElement(n)||n.tagName!=='script'||attr(n,'type')!=='application/ld+json')continue;
  let pending:unknown[];try{pending=[JSON.parse(text(n))];}catch{continue;}
  while(pending.length){const v=pending.pop();if(Array.isArray(v)){pending.push(...v);continue;}const o=obj(v);if(!o)continue;
   if(o['@graph'])pending.push(o['@graph']);
   const types=Array.isArray(o['@type'])?o['@type']:[o['@type']];if(!types.includes('Restaurant')||typeof o.name!=='string')continue;
   const own=typeof o['@id']==='string'?o['@id']:typeof o.url==='string'?o.url:page.url,e=sourceEntity(own);
   if(!location||!e||e.provider!==location.provider||e.id!==location.id)continue;
   const a=obj(o.address),address=typeof o.address==='string'?o.address:a?[a.streetAddress,a.addressLocality,a.addressRegion,a.postalCode].filter(v=>typeof v==='string').join(' '):'';
   if(!address)continue;
   const phone=typeof o.telephone==='string'&&!o.telephone.includes('[REDACTED]')?o.telephone:undefined;
   const identity:IndependentSourceIdentity={name:o.name,address,canonicalUrl:own,sourceEntityId:e.id,provider:e.provider,...(phone?{phone}:{})};
   for(const [key,field]of [['street','streetAddress'],['locality','addressLocality'],['region','addressRegion'],['postalCode','postalCode']]as const)if(typeof a?.[field]==='string')identity[key]=a[field] as string;
   identities.push(identity);
   const reserve=typeof o.acceptsReservations==='string'?http(o.acceptsReservations):undefined;
   if(reserve&&sourceEntity(reserve.href)?.id===e.id&&/\/reserve(?:\/landing)?\/?$/u.test(reserve.pathname))links.add(reserve.href);
  }
 }
 // Source-owned semantic address rows supplement incomplete JSON-LD street fields.
 // Exactly one address row is required; unrelated footer/map text is excluded.
 const addressRows=nodes.filter(n=>isElement(n)&&n.tagName==='tr').flatMap(n=>{
  const cells=children(n).filter(isElement),label=cells.find(c=>c.tagName==='th'),value=cells.find(c=>c.tagName==='td');
  if(!label||!value||!['address','住所','所在地'].includes(norm(text(label))))return [];
  const paragraphs:Node[]=[];const walk=(v:Node)=>{if(isElement(v)&&v.tagName==='p')paragraphs.push(v);else children(v).forEach(walk);};walk(value);
  return paragraphs.length?[text(paragraphs[0]!).replace(/\s+/gu,' ').trim()]:[];
 });
 if(addressRows.length===1&&civicAddress(addressRows[0]!).street)for(const identity of identities)if(!identity.street)identity.address=addressRows[0]!;
 const distinct=new Map(identities.map(i=>[JSON.stringify([i.name,i.address,i.phone]),i]));
 const ui=parse(page.visibleHtml??page.html);
 type Aggregate={dates:Set<string>;parties:Set<number>;slots:Set<string>;size:number};
 const widgets:Array<Aggregate>=[];
 const scan=(n:Node,hidden=false,disabled=false):Aggregate=>{
  hidden ||=attr(n,'hidden')!==undefined||attr(n,'aria-hidden')==='true'||/(?:display\s*:\s*none|visibility\s*:\s*hidden)/iu.test(attr(n,'style')??'')||isElement(n)&&['script','style','template','noscript'].includes(n.tagName);
  disabled ||=attr(n,'disabled')!==undefined||attr(n,'aria-disabled')==='true'||attr(n,'data-is-disabled')==='true'||attr(n,'data-disabled')==='true';
  const result:Aggregate={dates:new Set(),parties:new Set(),slots:new Set(),size:1};if(hidden)return result;
  const date=attr(n,'data-date');if(date&&/^\d{4}-\d{2}-\d{2}$/u.test(date)&&attr(n,'aria-selected')==='true')result.dates.add(date);
  if(isElement(n)&&!disabled){
   const t=text(n).replace(/\s+/gu,' ').trim(),party=/^(\d{1,2}) guests?$/iu.exec(t);
   if(party)result.parties.add(Number(party[1]));
   if(n.tagName==='button'&&/^([01]\d|2[0-3]):[0-5]\d$/u.test(t))result.slots.add(t);
   if(n.tagName==='a'){const href=attr(n,'href'),u=href&&http(href,page.url);if(u&&location&&sourceEntity(u.href)?.provider===location.provider&&sourceEntity(u.href)?.id===location.id)links.add(u.href);}
  }
  for(const c of children(n)){const child=scan(c,hidden,disabled);result.size+=child.size;for(const d of child.dates)result.dates.add(d);for(const p of child.parties)result.parties.add(p);for(const s of child.slots)result.slots.add(s);}
  if(isElement(n)&&(n.tagName==='form'||attr(n,'role')==='form')&&result.dates.size===1&&result.parties.size===1&&result.slots.size)widgets.push(result);
  return result;
 };
 scan(ui);widgets.sort((a,b)=>a.size-b.size);const best=widgets[0];
 const widget:IndependentWidget|undefined=best?{date:[...best.dates][0]!,partySize:[...best.parties][0]!,slots:[...best.slots].sort()}:undefined;
 return {identity:distinct.size===1?[...distinct.values()][0]:undefined,identities:[...distinct.values()],links:[...links],widget};
}

export function independentVisibleText(html:string):string{
 const visit=(n:Node):string=>{
  if(attr(n,'hidden')!==undefined||attr(n,'aria-hidden')==='true'||isElement(n)&&['script','style','template','noscript'].includes(n.tagName))return '';
  return 'value'in n?n.value:children(n).map(visit).join(' ');
 };
 return visit(parse(html)).replace(/\s+/gu,' ').trim();
}
