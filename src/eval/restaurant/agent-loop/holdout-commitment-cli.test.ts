import test from 'node:test';import assert from 'node:assert/strict';import{mkdtemp,writeFile,rm}from'node:fs/promises';import{join}from'node:path';import{tmpdir}from'node:os';import{holdoutHash}from'./holdout-protocol.js';import{main}from'./g6/run-holdout.js';
test('CLI custom fictional commitment uses unchanged file/preamble/case hashes, default still refuses different original',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fictional-commitment-'));const text='# fictional only\n---\nrequest: Find Fiction on {DATE}.\n',commitment={fileSha256:holdoutHash(text),cases:[{id:'fiction',sha256:holdoutHash('request: Find Fiction on {DATE}.\n')}]};
 const manifest={schema:'phase3b-private-run-manifest@1',cases:[{id:'fiction',fillings:{'{DATE}':'2030-01-01'},request:'Find Fiction on 2030-01-01.',followups:[],oracle:{request:{dates:['2030-01-01']},pages:[]},witness:{provider:'TABELOG',candidateId:'local',name:'Fiction',sourceEntityId:'10000001',date:'2030-01-01',time:'19:00',partySize:2,detailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',identityText:['Fiction']}}]};const bytes=JSON.stringify(manifest),raw=join(dir,'original.yaml'),file=join(dir,'manifest.json'),commit=join(dir,'commitment.json');const args=['--original',raw,'--manifest',file,'--manifest-sha256',holdoutHash(bytes),'--validate-only'];
 try{await writeFile(raw,text);await writeFile(file,bytes);await writeFile(commit,JSON.stringify(commitment));let audit:any;const log=console.log;console.log=(x:unknown)=>{audit=JSON.parse(String(x));};try{await main([...args,'--commitment',commit]);}finally{console.log=log;}assert.equal(audit.originalSHA256,holdoutHash(text));assert.equal(audit.commitmentSHA256,holdoutHash(JSON.stringify(commitment)));await assert.rejects(main(args),/HOLDOUT_FILE_SHA_MISMATCH/);await writeFile(raw,text+' ');await assert.rejects(main([...args,'--commitment',commit]),/HOLDOUT_FILE_SHA_MISMATCH/);}finally{await rm(dir,{recursive:true,force:true});}
});

test('CLI validates the entire fictional commitment before selecting cases/repetitions and audits only hashes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fictional-dev-plan-'));
 const documents=['alpha','beta'].map(id=>`request: Find ${id} on {DATE}.\n`),text='# LOCAL_CONSTRUCTION\n---\n'+documents.join('---\n');
 const commitment={fileSha256:holdoutHash(text),cases:['alpha','beta'].map((id,i)=>({id,sha256:holdoutHash(documents[i]!)}))};
 const cases=['alpha','beta'].map(id=>({id,fillings:{'{DATE}':'2030-01-01'},request:`Find ${id} on 2030-01-01.`,followups:[],oracle:{request:{dates:['2030-01-01']},pages:[]},witness:{provider:'TABELOG',candidateId:'local',name:'Fiction',sourceEntityId:'10000001',date:'2030-01-01',time:'19:00',partySize:2,detailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',identityText:['Fiction']}}));
 const original=join(dir,'original.yaml'),manifest=join(dir,'manifest.json'),file=join(dir,'commitment.json');
 try{
  await writeFile(original,text);await writeFile(file,JSON.stringify(commitment));
  const run=async(extra:string[]=[],tamper=false)=>{const m={schema:'phase3b-private-run-manifest@1',cases:structuredClone(cases)};if(tamper)m.cases[1]!.request='Not committed excluded text';const bytes=JSON.stringify(m);await writeFile(manifest,bytes);return main(['--original',original,'--manifest',manifest,'--manifest-sha256',holdoutHash(bytes),'--commitment',file,'--validate-only','--cases','alpha','--repetitions','2',...extra]);};
  let audit:any;const log=console.log;console.log=(v:unknown)=>{audit=JSON.parse(String(v));};try{await run();}finally{console.log=log;}
  assert.deepEqual(audit.executionPlan,{caseIds:['alpha'],repetitions:2});assert.equal(audit.cases.length,2);assert.equal(audit.originalSHA256,holdoutHash(text));
  await assert.rejects(run([],true),/HOLDOUT_TURN_NOT_COMMITTED/);
  await assert.rejects(run(['--repetitions','3']),/HOLDOUT_RUN_SELECTION_INVALID/);
  await assert.rejects(run(['--cases','beta']),/HOLDOUT_CERTIFICATION_CASES_MODE_INVALID/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
