import assert from 'node:assert/strict';
import {fork,type ChildProcess} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {runPacedHybridBatch} from '../../eval/restaurant/agent-loop/runners/run-paced-hybrid-read.js';

test('each exited slot is independently evaluated before another slot exits, including nonzero and missing artifacts',{timeout:45_000},async t=>{
 const root=await mkdtemp(resolve('.eval-artifacts','post-exit-batch-')),output=join(root,'batch'),children:ChildProcess[]=[],messages:Array<{id:string;message:any}>=[];
 const fixture=fileURLToPath(new URL('./fixtures/run-interruption.ts',import.meta.url));
 const logs:Record<string,Buffer[]>={};
 try{
  const summary:any=await runPacedHybridBatch({runs:[
   {id:'first',args:['complete',join(root,'first'),'--fixture-exit-code=7']},
   {id:'second',args:['complete',join(root,'second'),`--wait-for-receipt=${join(output,'first.post-exit.json')}`,'--contradict-displayed-party']},
   {id:'missing',args:['complete',join(root,'missing'),'--exit-before-artifact']},
  ]},output,{forkChild:(_entry,args,options)=>{
   const id=args[1]!.split('/').at(-1)!,chunks:Buffer[]=[];logs[id]=chunks;
   const child=fork(fixture,args,{...options,execArgv:['--import',resolve('scripts/test-filesystem-guard.mjs'),'--import','tsx'],silent:true,
    env:Object.fromEntries(Object.entries(options.env??{}).filter(([key])=>['PATH','HOME','TMPDIR','LANG','PLAYWRIGHT_BROWSERS_PATH'].includes(key)||key.startsWith('PRAXIS_EVAL_PACING_')))});
   children.push(child);child.stdout!.on('data',data=>chunks.push(Buffer.from(data)));child.stderr!.on('data',data=>chunks.push(Buffer.from(data)));child.on('message',message=>messages.push({id,message}));return child;
  }});
  assert.equal(summary.exits.find((row:any)=>row.id==='first').code,7);
  assert.equal(summary.exits.find((row:any)=>row.id==='second').code,0,'first receipt must be saved while second is still running; '+Buffer.concat(logs.second!).toString().slice(-1200));
  assert.equal(summary.exits.find((row:any)=>row.id==='missing').code,9);
  const first=JSON.parse(await readFile(join(output,'first.post-exit.json'),'utf8')),second=JSON.parse(await readFile(join(output,'second.post-exit.json'),'utf8')),missing=JSON.parse(await readFile(join(output,'missing.post-exit.json'),'utf8'));
  assert.equal(first.status,'EVALUATED');assert.equal(first.exit.code,7);assert.equal(first.s0.S0_DECLARATION.status,'ABSENT');assert.equal(first.s0.S0_BOUNDARY.status,'ABSENT');
  assert.equal(second.status,'EVALUATED');assert.equal(second.s0.S0_DECLARATION.status,'PRESENT','independent evaluation must catch the controlled displayed-party contradiction despite child evaluation');
  assert.equal(missing.status,'NOT_EVALUATED');assert.equal(missing.failureCode,'MISSING_ARTIFACT');assert.equal(missing.s0.S0_DECLARATION.status,'NOT_EVALUATED');assert.equal(missing.s0.S0_BOUNDARY.status,'NOT_EVALUATED');
  for(const receipt of [first,second]){
   assert.ok(receipt.exitToEvaluationStartMs>=0);assert.equal(receipt.sourceArtifact.sha256,createHash('sha256').update(await readFile(receipt.sourceArtifact.path)).digest('hex'));
   const notices=messages.filter(row=>row.id===receipt.id),notice=notices.findIndex(row=>row.message.type==='PRAXIS_EVAL_ARTIFACT_STARTED'),finished=notices.findIndex(row=>row.message.stage==='FINISHED');assert.ok(notice>=0&&finished>notice);
  }
  const secondRoot=join(root,'second',(await readdir(join(root,'second'))).find(name=>name.startsWith('run-'))!);
  assert.deepEqual(JSON.parse(await readFile(join(secondRoot,'observed-first-receipt.json'),'utf8')),first,'causal evidence: second sees the complete first receipt before exiting');
  const evaluationFiles=await readdir(join(secondRoot,'.eval-artifacts/restaurant-hybrid-live-read'));
  const inline=JSON.parse(await readFile(join(secondRoot,'.eval-artifacts/restaurant-hybrid-live-read',evaluationFiles.find(name=>name.includes('.evaluation.'))!),'utf8'));
  assert.equal(inline.severity.S0_DECLARATION.status,'ABSENT','child evaluation precedes the controlled contradiction; parent must independently reevaluate');
  assert.equal(summary.exits.find((row:any)=>row.id==='second').independentEvaluation.s0.S0_DECLARATION.status,'PRESENT');
  t.diagnostic(JSON.stringify({first,second,missing,realCalls:0}));
 }finally{
  for(const child of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
  for(const [id,chunks] of Object.entries(logs))await writeFile(join(root,`${id}.log`),Buffer.concat(chunks));
  if(process.env.PRAXIS_KEEP_POST_EXIT_FIXTURE!=='1')await rm(root,{recursive:true,force:true});else console.log(JSON.stringify({postExitFixture:root}));
 }
});
