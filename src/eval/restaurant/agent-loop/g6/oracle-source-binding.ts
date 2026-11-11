import {readFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {parse,type DefaultTreeAdapterMap} from 'parse5';
import {readIndependentSource} from './source-document.js';
import type {G6EvaluationInput} from './evaluator.js';
/** Bind frozen qualification Gold to independently saved public source identity.
 * The source's own name + phone/full address must match Gold; neither the
 * product's HIGH nor the user-reference identity supplies this association. */
export async function bindFrozenOracleSources(oracles:NonNullable<G6EvaluationInput['qualificationOracles']>){
 const phone=(s:string|undefined)=>s?.replace(/\D/gu,'').replace(/^81/u,'0');
 for(const q of oracles){
  delete q.nativeIdentity;
  for(const ref of q.evidenceRefs){
   const file=resolve(ref),within=relative(resolve('.eval-artifacts'),file);if(!within||within.startsWith('..'))continue;
   let html:string;try{html=await readFile(file,'utf8');}catch{continue;}
   const urls:string[]=[];const walk=(n:DefaultTreeAdapterMap['node']):void=>{
    if('tagName'in n&&n.tagName==='script'&&n.attrs.some(a=>a.name==='type'&&a.value==='application/ld+json')){
     try{const queue:unknown[]=[JSON.parse(n.childNodes.map(c=>'value'in c?c.value:'').join(''))];
      while(queue.length){const v=queue.pop();if(Array.isArray(v)){queue.push(...v);continue;}if(!v||typeof v!=='object')continue;
       const o=v as Record<string,unknown>;if(o['@graph'])queue.push(o['@graph']);if(o['@type']==='Restaurant'&&typeof o['@id']==='string')urls.push(o['@id']);
      }
     }catch{/* malformed raw source cannot bind Gold */}
    }
    if('childNodes'in n)for(const c of n.childNodes)walk(c);
   };for(const n of parse(html).childNodes)walk(n);
   for(const url of urls){const identity=readIndependentSource({url,html}).identity;
    if(identity?.name===q.name&&Boolean(q.phone&&identity.phone&&phone(q.phone)===phone(identity.phone)||q.address&&q.address===identity.address)){q.nativeIdentity=identity;break;}
   }
   if(q.nativeIdentity)break;
  }
 }
 return oracles;
}
