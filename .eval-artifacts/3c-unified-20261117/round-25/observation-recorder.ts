import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const queue:Array<{name:string;run:()=>Promise<void>}>=[];let checks:Array<{method:string;args:unknown[]}>=[];
export const test=(name:string,_options:unknown,run:()=>Promise<void>)=>{if(name.startsWith('Round25')||process.env.PRAXIS_ROUND25_COLLECT_ALL==='1')queue.push({name,run});};
function serialize(value:unknown):unknown{if(value instanceof RegExp)return {regex:value.source,flags:value.flags};if(typeof value==='function')return value.name;return value;}
export const assert={...Object.fromEntries(['equal','notEqual','deepEqual','ok','match','doesNotMatch'].map(method=>[method,(...args:unknown[])=>checks.push({method,args:args.map(serialize)})])),
 async rejects(work:Promise<unknown>|(()=>Promise<unknown>),expected?:{name?:string}){let error:unknown;try{await(typeof work==='function'?work():work);}catch(e){error=e;}checks.push({method:'equal',args:[error instanceof Error?error.constructor.name:null,expected?.name??'Error','request rejection class']});}};
export async function collect(label:string){const root=process.env.PRAXIS_ROUND25_OBSERVATIONS!;mkdirSync(root,{recursive:true});const rows=[];for(const item of queue){checks=[];await item.run();rows.push({name:item.name,checks});writeFileSync(join(root,label+'.json'),JSON.stringify({sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'OFFLINE_OBSERVATIONS_BEFORE_SEPARATE_ORACLE',rows},null,2)+'\n');console.log(item.name,checks.length);}}
