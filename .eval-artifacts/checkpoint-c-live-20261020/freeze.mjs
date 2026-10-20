import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
export const base='.eval-artifacts/checkpoint-c-live-20261020';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
export function createFreeze(output,extra=[]){
 const files=git('ls-files','src','web-skills','scripts','package.json','package-lock.json',base,'.eval-artifacts/p2-live-set-20261019/variants.yaml','.eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json','.eval-artifacts/p2-1-discovery-20261016/witness-certification-plan.json','.eval-artifacts/p2-1-discovery-20261016/outer/post-delivery.mjs').split('\n').filter(p=>!p.startsWith(base+'/')||/\.(mjs|ts)$/.test(p)||['plan.json','witness-plan.json','runner-relocation.json','reviewed-reads.json','runner-input.yaml'].some(n=>p===base+'/'+n));
 for(const p of extra)if(!files.includes(p))files.push(p);
 for(const p of files){if(git('status','--porcelain','--untracked-files=all','--',p))throw Error('UNCOMMITTED_FROZEN_FILE:'+p);git('ls-files','--error-unmatch',p);}
 const manifest={schemaVersion:1,createdAt:new Date().toISOString(),commit:git('rev-parse','HEAD'),productionBase:'3998076',files:Object.fromEntries(files.sort().map(p=>[p,sha(readFileSync(p))]))};
 writeFileSync(output,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});return manifest;
}
export function verifyFreeze(path){const bytes=readFileSync(path),m=JSON.parse(bytes);for(const [p,hash]of Object.entries(m.files)){if(sha(readFileSync(p))!==hash||git('status','--porcelain','--',p))throw Error('FROZEN_FILE_CHANGED:'+p);}return {...m,manifestSha256:sha(bytes)};}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){const output=process.argv[2];if(!output||!relative(resolve(base),resolve(output))||relative(resolve(base),resolve(output)).startsWith('..'))throw Error('OUTPUT_MUST_STAY_IN_BATCH');const frozen=createFreeze(output,process.argv.slice(3));console.log(JSON.stringify({commit:frozen.commit,files:Object.keys(frozen.files).length,manifestSha256:sha(readFileSync(output)),network:0,models:0}));}
