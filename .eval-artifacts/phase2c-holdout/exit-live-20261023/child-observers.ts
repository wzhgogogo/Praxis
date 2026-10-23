// Eval-only passive instrumentation. No request, decision, timeout or source parsing is changed.
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.ts';
const dir=process.env.CHECKPOINT_C_ATTEMPT!;
const log=(name:string,value:any)=>appendFileSync(resolve(dir,name),JSON.stringify({at:new Date().toISOString(),...value})+'\n');
const complete=DeepSeekModelGateway.prototype.complete;
DeepSeekModelGateway.prototype.complete=async function(request:any){
 log('provider-calls.jsonl',{event:'START',purpose:request.purpose,timeoutMs:request.timeoutMs});
 try{return await complete.call(this,request);}catch(error:any){if(error?.code==='RATE_LIMIT'||/429|rate.?limit|too many requests/i.test(error?.message??''))log('parallel-signals.jsonl',{reason:'DEEPSEEK_RATE_LIMIT'});throw error;}
};
const originalFetch=globalThis.fetch;
globalThis.fetch=async(...args:Parameters<typeof fetch>)=>{
 const r=await originalFetch(...args);if([403,503,429].includes(r.status))log('parallel-signals.jsonl',{reason:String(args[0]).includes('deepseek')&&r.status===429?'DEEPSEEK_RATE_LIMIT':'SOURCE_HTTP_403_503_429',status:r.status});return r;
};
const open=LocalPlaywrightChromium.prototype.openSession;
LocalPlaywrightChromium.prototype.openSession=async function(options:any){
 let session;try{session=await open.call(this,options);}catch(error:any){if(/EADDRINUSE|SingletonLock|profile.*in use|already.*browser|EEXIST/i.test(error.message))log('parallel-signals.jsonl',{reason:'PARALLEL_RESOURCE_CONFLICT'});throw error;}
 const snapshot=session.snapshot.bind(session);session.snapshot=async()=>{const s=await snapshot();
  if(/verify (?:you are|that you are) human|checking your browser|verify.*not a robot|人間であること|ロボットではない|アクセス制限|complete the captcha/i.test(s.title+'\n'+s.text))log('parallel-signals.jsonl',{reason:'SOURCE_CHALLENGE',url:s.url});return s;
 };return session;
};
