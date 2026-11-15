import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [sourceRoot, destination] = process.argv.slice(2);
const archive = 'ac980ef2afe99c0ae735280dc7fcf2d7bd0fefa5';
const signed = '249826cc330544f732b8316bf853983ed63d31a0';
const release = 'a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d';
const git = (...args) => execFileSync('git', ['--no-optional-locks','-C',sourceRoot, ...args], {maxBuffer:180*1024*1024});
const source = git('rev-parse','HEAD').toString().trim();
if (![signed,release].includes(source) || git('status','--porcelain').length) throw Error('Dirty or unexpected source');
const load = name => import(pathToFileURL(resolve(sourceRoot,'src',name)));
const {InMemoryTaskRuntime} = await load('core/task-runtime/in-memory-task-runtime.ts');
const {restaurantBookingTaskDefinition} = await load('domains/restaurant/task-definition.ts');
const {evaluateG6} = await load('eval/restaurant/agent-loop/g6/evaluator.ts');
const {assessRestaurantRead} = await load('domains/restaurant/read-assessment.ts');
const get = file => JSON.parse(git('show',archive+':'+file));
const hash = data => createHash('sha256').update(data).digest('hex');
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])) : value;
const digest = value => hash(JSON.stringify(stable(value)) ?? 'undefined');
const summarize = state => Object.fromEntries(Object.entries({
  phase:state.phase, presented:state.presentedResults?.candidateIds??[], selection:state.selectedCandidateId??null,
  entities:state.candidates.map(c=>c.restaurant.id), inventory:state.availability, checks:state.availabilityChecks, facts:state.factChecks,
  provenance:state.readEvidence, pageQuestion:state.pageQuestion?.result??null,
  conditions:state.presentedResults?.conditionStates??null
}).map(([k,v])=>[k,digest(v)]));
const rows=get('.eval-artifacts/phase3b/heldout-r2-final-09/attempt-summary.json');
const root='.eval-artifacts/phase3b/heldout-r2-run/';
const result=[];
for (const row of rows){
  const attempt=root+row.key+'/'+row.key+'/';
  const eventFile=attempt+'execution.result.json';
  const eventsRaw=git('show',archive+':'+eventFile);
  const cap=JSON.parse(eventsRaw), ex=cap.execution, snap=ex.finalSnapshot;
  const evalFile=root+row.evaluationFile;
  const inputFile=attempt+(evalFile.endsWith('/evaluation.supplement.json')?'evaluation.supplement.input.json':'evaluation.input.json');
  const inputBytes=git('show',archive+':'+inputFile);
  const original=get(evalFile), score=evaluateG6(JSON.parse(inputBytes));
  let id=0;
  const runtime=new InMemoryTaskRuntime(restaurantBookingTaskDefinition,{now:()=>new Date(snap.createdAt)},()=> 'command:'+ ++id);
  runtime.createTask(snap.id,{}, {runId:snap.runId});
  const frames=[], reordered=[];
  let stopped=null;
  for(const envelope of ex.events){
    // Archives serialized through JSONB can reorder the object's keys. Preserve the original
    // stringified request order only if its entire JSON value equals the archived object.
    const event=envelope.event, fingerprint=event.continuation?.intentFingerprint;
    if (event.type==='SEARCH_COMPLETED' && typeof fingerprint==='string' && event.request?.intent
        && fingerprint!==JSON.stringify(event.request.intent)) {
      let originalOrder;
      try { originalOrder=JSON.parse(fingerprint); } catch {}
      if (originalOrder && digest(originalOrder)===digest(event.request.intent)) {
        event.request={...event.request,intent:originalOrder};
        reordered.push(frames.length+1);
      }
    }
    let snapshot;
    try { ({snapshot}=runtime.dispatch(envelope)); }
    catch(error) { stopped={index:frames.length+1,event:event.type,reason:String(error.message).slice(0,130)};break; }
    const state=snapshot.domainState;
    const presentation=assessRestaurantRead(state,envelope.occurredAt).presentation;
    frames.push({event:envelope.event.type,at:envelope.occurredAt,fields:summarize(state),presentation:digest(presentation),ready:presentation});
  }
  const actual=summarize(runtime.snapshot(snap.id).domainState),expected=summarize(snap.domainState);
  const mismatch=Object.keys(expected).filter(k=>actual[k]!==expected[k]);
  const projection=frames.map(({ready,...rest})=>rest);
  result.push({key:row.key,sourceResultSHA256:hash(eventsRaw),evaluationInputSHA256:hash(inputBytes),eventCount:frames.length,frames:projection,
    capturedTerminalMismatch:mismatch,eventTotal:ex.events.length,orderOnlyFromRecordedFingerprint:reordered,eventStop:stopped,originalTerminalPresentation:assessRestaurantRead(snap.domainState,snap.updatedAt).presentation,
    delivered:cap.view.restaurant.presentedCandidateIds?.length??0,links:cap.view.restaurant.bookingHandoffs?.length??0,
    question:snap.domainState.pageQuestion?.result?.status??null,
    verdict:score.verdict,checkCount:score.checks.length,
    historicalScoreMatches:digest(score.verdict)===digest(original.verdict)&&digest(score.checks)===digest(original.checks),
    checksSHA256:digest(score.checks)});
}
writeFileSync(destination,JSON.stringify({source,archive,rows:result},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source,attempts:result.length,events:result.reduce((n,r)=>n+r.eventCount,0),terminalMismatches:result.filter(r=>r.capturedTerminalMismatch.length).map(r=>[r.key,r.capturedTerminalMismatch]),scoringMismatches:result.filter(r=>!r.historicalScoreMatches).map(r=>r.key)}));
