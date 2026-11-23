import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const queue:Array<{name:string;run:()=>Promise<void>}>=[];let checks:Array<{method:string;args:unknown[]}>=[];
export const test=(name:string,_options:unknown,run:()=>Promise<void>)=>queue.push({name,run});
export const assert=Object.fromEntries(['equal','deepEqual','ok','match','doesNotMatch'].map(method=>[method,(...args:unknown[])=>checks.push({method,args:args.map(x=>x instanceof RegExp?{regex:x.source,flags:x.flags}:x)})]));
export async function collect(label:string){const root=process.env.PRAXIS_ROUND24_OBSERVATIONS!;mkdirSync(root,{recursive:true});const rows=[];for(const item of queue){checks=[];await item.run();rows.push({name:item.name,checks});writeFileSync(join(root,label+'.json'),JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'OFFLINE_HTTP_PGLITE_SHARED_JOURNEY_OBSERVATIONS',rows},null,2)+'\n');console.log(item.name,checks.length);} }
