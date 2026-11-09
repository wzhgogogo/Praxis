import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,symlink,lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {holdoutHash,type PrivateHoldoutManifest} from './holdout-protocol.js';
import {runPrivateHoldout} from './g6/holdout-runner.js';
import {chargeG6} from './g6/budget.js';
// LOCAL_CONSTRUCTION. No private cases or live transports. The actual journal,
// quota charging, rule injection and serial orchestrator remain in the chain.
async function control(){
 const base=resolve('.eval-artifacts');await mkdir(base,{recursive:true});const root=await mkdtemp(join(base,'fictional-resume-')),budgetPath=join(root,'budget.json'),output=join(root,'runs');
 await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:126,fullLive:22,environmentReruns:4,realModelCalls:2500},cumulative:{evaluationPublicGET:0,fullLive:0,environmentReruns:0,realModelCalls:849,restaurantWebsiteRequests:0}}));
 const manifest:PrivateHoldoutManifest={schema:'phase3b-private-run-manifest@1',cases:[{id:'fictional',fillings:{},request:'LOCAL_CONSTRUCTION initial request',followups:[],oracle:{request:{dates:['2030-01-01']},pages:[]},witness:{provider:'TABELOG',candidateId:'local',sourceEntityId:'10000001',name:'Fictional source',date:'2030-01-01',time:'19:00',partySize:2,detailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',identityText:['Fictional source']}}]};
 const audit={sourceSHA:holdoutHash('fictional source'),originalSHA256:holdoutHash('fictional original'),manifestSHA256:holdoutHash(JSON.stringify(manifest))};
 let healthFail=false,mode:'PASS'|'ENV'|'S0'|'CRASH_AFTER_EVALUATION'|'CHARGED_UNKNOWN'|'CRASH_AFTER_TICKET'='PASS',healths=0,execs=0;
 let selector:((n:number)=>typeof mode)|undefined;
 const seen:string[]=[];
 const deps={g6:{budgetPath,witnessFetch:async()=>{throw Error('No live transport');},transports:async()=>{throw Error('No live transport');}},wait:async()=>{},health:async(_spec:unknown,beforeGET:(s:string,r:number)=>Promise<void>)=>{healths++;for(const round of [1,2])for(const source of ['tablecheck','tabelog'])await beforeGET(source,round);return {passed:!healthFail,observations:[]};},
  execute:async(pack:Parameters<NonNullable<import('./g6/holdout-runner.js').HoldoutDependencies['execute']>>[0],d:import('./g6/runner.js').G6RunnerDependencies,out:string)=>{
   execs++;if(selector)mode=selector(execs);const spec=pack.cases[0]!;seen.push(spec.id);assert.equal(spec.oracle.reviewedReadRules?.length,21);
   await d.beforeLive?.();if(mode==='CRASH_AFTER_TICKET')throw Error('LOCAL_CRASH_AFTER_TICKET');await chargeG6(d.budgetPath,`g6-${spec.id}-fixture:LIVE`,'fullLive','LOCAL_CONSTRUCTION only');
   const path=join(out,spec.id);await mkdir(path);await writeFile(join(path,'unchanged-original.txt'),'ORIGINAL_FAILURE_OR_RESULT');
   if(mode==='ENV')await writeFile(join(path,'failure.json'),JSON.stringify({transportError:{code:'ENOTFOUND'}}));
   else if(mode==='CHARGED_UNKNOWN')throw Error('LOCAL_UNKNOWN_FAILURE');
   else await writeFile(join(path,'evaluation.json'),JSON.stringify({verdict:{s0:mode==='S0'?1:0,stopBatch:mode==='S0',qualified:true}}));
   if(mode==='CRASH_AFTER_EVALUATION')throw Error('LOCAL_CRASH_AFTER_EVALUATION');
   return {schemaVersion:'phase3b-g6-batch@1',serial:true,witnessGETs:0,stopReason:mode==='ENV'?'net::ERR_NAME_NOT_RESOLVED':mode==='S0'?'S0_STOP':null,slots:[{id:spec.id,status:'EVALUATED',path}]};
  }};
 return {root,budgetPath,output,manifest,audit,deps,get healths(){return healths;},get execs(){return execs;},seen,setSelector(v:(n:number)=>typeof mode){selector=v;},setHealthFail(v:boolean){healthFail=v;},setMode(v:typeof mode){mode=v;},async run(resume=false,overrides:Partial<typeof audit>={}){return runPrivateHoldout(manifest,{...audit,...overrides},output,deps,{resume});},async ledger(){return JSON.parse(await readFile(budgetPath,'utf8'));},async close(){await rm(root,{recursive:true,force:true});}};
}
test('resume preserves evaluated slots, only one health per case, and refuses original/manifest/source/ledger mismatches',async()=>{
 const c=await control();try{
  await c.run();assert.equal(c.execs,3);assert.equal(c.healths,1);await c.run(true);assert.equal(c.execs,3);assert.equal(c.healths,1);
  await assert.rejects(runPrivateHoldout(c.manifest,c.audit,join(c.root,'another-output'),c.deps),/HOLDOUT_LEDGER_ALREADY_BOUND/);
  for(const key of ['originalSHA256','manifestSHA256','sourceSHA']as const)await assert.rejects(c.run(true,{[key]:'changed'}),/HOLDOUT_RESUME_INPUT_MISMATCH/);
  const ledger=await c.ledger();ledger.ledgerId='different-ledger';await writeFile(c.budgetPath,JSON.stringify(ledger));await assert.rejects(c.run(true),/HOLDOUT_RESUME_INPUT_MISMATCH/);assert.equal(c.execs,3);
 }finally{await c.close();}
});
test('health cancellation resumes the same planned slot with fresh health, no duplicate Live, original health evidence retained',async()=>{
 const c=await control();try{
  c.setHealthFail(true);const first=await c.run();assert.equal(first.receipts[0]!.status,'CANCELLED_BEFORE_LIVE');assert.equal((await c.ledger()).cumulative.fullLive,0);
  const old=join(first.receipts[0]!.path,'network-health.json'),raw=await readFile(old,'utf8');c.setHealthFail(false);const next=await c.run(true);
  assert.equal(next.stopReason,null);assert.equal(c.execs,3);assert.equal(c.healths,2);assert.ok(c.seen[0]!.startsWith('fictional-r1-retry'));assert.equal(await readFile(old,'utf8'),raw);assert.equal((await c.ledger()).cumulative.environmentReruns,0);
 }finally{await c.close();}
});
test('environment failure replacement is charged on resumed Live only, stored separately and stops before a fifth replacement',async()=>{
 const c=await control();try{
  c.setMode('ENV');const first=await c.run();const original=join(first.receipts[0]!.path,first.receipts[0]!.key,'failure.json'),bytes=await readFile(original,'utf8');assert.equal((await c.ledger()).cumulative.environmentReruns,0);
  for(let n=1;n<=4;n++){await c.run(true);assert.equal((await c.ledger()).cumulative.environmentReruns,n);}
  const before=c.execs;await assert.rejects(c.run(true),/HOLDOUT_ENVIRONMENT_RETRY_LIMIT/);assert.equal(c.execs,before);assert.equal((await c.ledger()).cumulative.fullLive,5);assert.equal(await readFile(original,'utf8'),bytes);assert.ok(c.seen.includes('fictional-r1-env1'));
 }finally{await c.close();}
});
test('successful environment replacement completes later slots, without rerunning prior Live or repeating case health',async()=>{
 const c=await control();try{c.setMode('ENV');await c.run();c.setMode('PASS');const done=await c.run(true);assert.equal(done.stopReason,null);assert.equal(c.execs,4);assert.equal(c.healths,2);assert.equal((await c.ledger()).cumulative.environmentReruns,1);await c.run(true);assert.equal(c.execs,4);assert.equal(c.healths,2);}finally{await c.close();}
});
test('S0 forbids resume even if a checkpoint did not record the stop; evaluation after a crash is recovered without another Live',async()=>{
 for(const mode of ['S0','CRASH_AFTER_EVALUATION']as const){const c=await control();try{
  c.setMode(mode);if(mode==='S0')await c.run();else await assert.rejects(c.run(),/LOCAL_CRASH_AFTER_EVALUATION/);
  const before=c.execs;c.setMode('PASS');if(mode==='S0'){await assert.rejects(c.run(true),/HOLDOUT_S0_RESUME_FORBIDDEN/);assert.equal(c.execs,before);}else{await c.run(true);assert.equal(c.execs,3);assert.equal(c.seen.filter(id=>id==='fictional-r1').length,1);}
 }finally{await c.close();}}
});
test('already charged unknown interruption cannot silently spend another Live; plan and append-only ledger guards reject before transmission',async()=>{
 const c=await control();try{c.setMode('CHARGED_UNKNOWN');await assert.rejects(c.run(),/LOCAL_UNKNOWN_FAILURE/);await assert.rejects(c.run(true),/HOLDOUT_CHARGED_ATTEMPT_NEEDS_REVIEW/);assert.equal(c.execs,1);
  const ledger=await c.ledger();ledger.entries=[];ledger.cumulative.fullLive=0;await writeFile(c.budgetPath,JSON.stringify(ledger));await assert.rejects(c.run(true),/HOLDOUT_LEDGER_ROLLED_BACK/);
  const huge={...c.manifest,cases:Array.from({length:7},(_,i)=>({...c.manifest.cases[0]!,id:'local-'+i}))};await assert.rejects(runPrivateHoldout(huge,c.audit,c.output,c.deps),/HOLDOUT_PLANNED_SLOT_LIMIT/);
 }finally{await c.close();}
});

test('resume denies simultaneous writers; independent cases each get one health, and rules cannot be supplied privately',async()=>{
 const c=await control();try{
  const duplicate=structuredClone(c.manifest);Object.assign(duplicate.cases[0]!.oracle,{reviewedReadRules:[]});await assert.rejects(runPrivateHoldout(duplicate,c.audit,c.output,c.deps),/HOLDOUT_MANIFEST_READ_RULES_FORBIDDEN/);
  const m={...c.manifest,cases:[c.manifest.cases[0]!,{...c.manifest.cases[0]!,id:'fictional-second'}]};await runPrivateHoldout(m,c.audit,c.output,c.deps);assert.equal(c.execs,6);assert.equal(c.healths,2);
  await writeFile(join(c.output,'run.lock'),JSON.stringify({pid:process.pid,token:'local-active-control'}));await assert.rejects(runPrivateHoldout(m,c.audit,c.output,c.deps,{resume:true}),/HOLDOUT_ALREADY_RUNNING/);await rm(join(c.output,'run.lock'));
 }finally{await c.close();}
});

test('a prepaid environment ticket survives interruption before Live without being charged twice',async()=>{
 const c=await control();try{
  c.setMode('ENV');await c.run();c.setMode('CRASH_AFTER_TICKET');await assert.rejects(c.run(true),/LOCAL_CRASH_AFTER_TICKET/);assert.equal((await c.ledger()).cumulative.environmentReruns,1);assert.equal((await c.ledger()).cumulative.fullLive,1);
  c.setMode('PASS');await c.run(true);assert.equal((await c.ledger()).cumulative.environmentReruns,1);assert.equal((await c.ledger()).cumulative.fullLive,4);
 }finally{await c.close();}
});
test('six cases keep eighteen planned slots and admit four replacements within fullLive22 and GET126',async()=>{
 const c=await control();try{
  const source=c.manifest.cases[0]!;c.manifest.cases=Array.from({length:6},(_,i)=>({...source,id:'fictional-'+i}));c.audit.manifestSHA256=holdoutHash(JSON.stringify(c.manifest));
  c.setSelector(n=>n<=4?'ENV':'PASS');await c.run();for(let i=0;i<4;i++)await c.run(true);
  const budget=await c.ledger();assert.equal(budget.cumulative.fullLive,22);assert.equal(budget.cumulative.environmentReruns,4);assert.equal(c.execs,22);assert.equal(c.healths,10);assert.ok(budget.cumulative.evaluationPublicGET<=126);
  await c.run(true);assert.equal(c.execs,22);
 }finally{await c.close();}
});

test('a ledger symlink resolves to one canonical file for health, Live charges and resume',async()=>{
 const c=await control();try{
  const alias=join(c.root,'budget-link.json');await symlink(c.budgetPath,alias);c.deps.g6.budgetPath=alias;
  await c.run();assert.equal((await c.ledger()).cumulative.fullLive,3);assert.equal((await lstat(alias)).isSymbolicLink(),true);await c.run(true);assert.equal(c.execs,3);
 }finally{await c.close();}
});

test('resume restores the last charged GET time before sending its first health request',async()=>{
 const c=await control();try{
  c.setHealthFail(true);await c.run();const events:string[]=[];
  c.deps.wait=async ms=>{assert.ok(ms>0);events.push('WAIT');};
  c.deps.health=async(_spec,beforeGET)=>{events.push('BEFORE');await beforeGET('tablecheck',1);events.push('GET_SENT');return {passed:true,observations:[]};};
  await c.run(true);assert.ok(events.indexOf('WAIT')>=0&&events.indexOf('WAIT')<events.indexOf('GET_SENT'));
 }finally{await c.close();}
});
