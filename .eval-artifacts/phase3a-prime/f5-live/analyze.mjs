// Frozen eval-only analysis. Actual observations remain immutable; no network.
import fs from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {evaluateArtifactFile} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';
import {loadPostDeliveryTabelogObservation} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-grounding.ts';
import {parseReviewedReads} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
import {restaurantRunStageTimings} from '../../../src/eval/restaurant/agent-loop/run-stage-timings.ts';
import {loadFrozenLiveCases} from '../../../src/eval/restaurant/agent-loop/live-case-materializer.ts';
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET} from '../../../src/application/live-read-investigation-budget.ts';
import {restaurantDiscoveryPacks} from '../../../src/integrations/restaurant-search/source-packs.ts';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const put=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const lines=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(x=>JSON.parse(x)):[];
const time=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?Date.parse(v):undefined;
if(process.argv[2]==='--check'){console.log(JSON.stringify({status:'ANALYSIS_IMPORTS_PASS',requests:0,models:0}));process.exit(0);}
const slot=Number(process.argv[2]);assert.ok(slot>=1&&slot<=6);
const directory=resolve(here,'slots',String(slot)),summary=read(resolve(directory,'summary.json'));assert.ok(summary.artifactPath);
const bytes=fs.readFileSync(summary.artifactPath);assert.equal(sha(bytes),summary.artifactSha256);
const artifact=JSON.parse(bytes),domain=artifact.finalSnapshot?.domainState??{},post=read(resolve(directory,'post/post-check.json'));
const observations=[];
for(const [i,row]of post.rows.entries())if(row.bodyPath&&row.httpStatus===200&&!row.error){
 const meta=resolve(directory,'post',`normalized-${i}.json`);put(meta,{method:'GET',url:row.url,status:row.httpStatus,finishedAt:row.finishedAtCET,sha256:row.sha256});
 observations.push(loadPostDeliveryTabelogObservation(meta,row.bodyPath));
}
const cert=read(resolve(here,'certification-prelive/certificate.json'));
const proof=cert.results.find(r=>r.status==='CERTIFIED_PRELIVE');assert.ok(proof);
const own=proof.vacancy,normalized=resolve(directory,'witness-normalized.json');put(normalized,{method:'GET',url:own.url,status:own.status,finishedAt:own.finishedAtVienna,sha256:own.sha256});
const witnessObservation=loadPostDeliveryTabelogObservation(normalized,resolve(root,own.bodyPath));
const approvedText=fs.readFileSync(resolve(here,'p2c-holdout-01.content.txt'),'utf8');
const witnessOracle={applicableArtifactSha256:sha(bytes),radiusMeters:1000,validUntil:new Date(Date.parse(cert.certifiedAtVienna)+86400000).toISOString(),rows:artifact.caseId==='p2c-holdout-01'?[{outletName:proof.identityGeographyCategory.name,sourceId:proof.rst_id,distanceMeters:proof.identityGeographyCategory.distanceMeters,hardEvidence:[{criterion:'kushikatsu',quote:proof.identityGeographyCategory.categoryQuotes.join('\n')}],observation:witnessObservation,certifiedRequest:{date:cert.date,time:'19:00',partySize:2,text:approvedText},refs:[resolve(here,'certification-prelive/certificate.json'),own.bodyPath]}]:[],sourceRef:resolve(here,'certification-prelive/certificate.json')};
const reviewedPath=resolve(root,'.eval-artifacts/tablecheck-guard-preflight-20261023/reviewed-reads.json');
const result=await evaluateArtifactFile(summary.artifactPath,{postDeliveryTabelog:observations,witnessOracle,reviewedReads:parseReviewedReads(fs.readFileSync(reviewedPath),reviewedPath)});
put(resolve(directory,'independent-evaluation.json'),{evaluationPath:result.outputPath,artifactSha256:sha(bytes),outcome:result.evaluation.outcome,severity:result.evaluation.severity,witnessFunnel:result.evaluation.witnessFunnel,findings:result.evaluation.findings,candidateSummaries:result.evaluation.candidateSummaries,unassessedDimensions:result.evaluation.unassessedDimensions});
const decisions=lines(artifact.decisionCapture?.path??''),trace=artifact.diagnostics?.browserTrace??[],start=time(artifact.startedAt),end=time(artifact.finishedAt),spans=[];
const stack=[];
for(const row of trace){if(row.kind==='SESSION_CALL')stack.push(row);if(row.kind==='SESSION_RETURN'){
 const call=stack.pop();if(!call)continue;const a=time(call.at),b=time(row.at),method=call.detail?.method;
 if(a!==undefined&&b!==undefined)spans.push({a,b,stage:/navigate|openLink/.test(method)?'PAGE_LOAD':/snapshot|observeControls/.test(method)?'READ_PAGE':/wait/i.test(method)?'WAIT':'OTHER_BROWSER',priority:1});
}}
const purposes={};
for(const row of decisions){const latency=Number(row.latencyMs);purposes[row.purpose]=(purposes[row.purpose]??0)+(Number.isFinite(latency)?latency:0);const a=time(row.startedAt),b=time(row.settledAt??row.finishedAt)??(a!==undefined&&Number.isFinite(latency)?a+latency:undefined);if(a!==undefined&&b!==undefined)spans.push({a,b,stage:'MODEL:'+row.purpose,priority:2});}
const totals={};if(start!==undefined&&end!==undefined){const points=[...new Set([start,end,...spans.flatMap(s=>[Math.max(start,s.a),Math.min(end,s.b)]).filter(t=>t>=start&&t<=end)])].sort((a,b)=>a-b);for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],active=spans.filter(s=>s.a<=a&&s.b>=b).sort((x,y)=>y.priority-x.priority||y.a-x.a)[0];const key=active?.stage??'UNATTRIBUTED';totals[key]=(totals[key]??0)+b-a;}}
const shownAt=domain.presentedResults?.presentedAt??null,shownIds=domain.presentedResults?.candidateIds??[],cited=new Set(domain.presentedResults?.evidenceIds??[]);
let firstQualified=null;
if(result.evaluation.outcome.type==='QUALIFIED_DELIVERY'){
 const candidates=shownIds.map(id=>{const times=(domain.readEvidence??[]).filter(e=>e.candidateId===id&&cited.has(e.evidenceId)).map(e=>time(e.observedAt));for(const map of [domain.factChecks,domain.availabilityChecks,domain.identityAssessments]){const r=map?.[id];times.push(time(r?.checkedAt??r?.observedAt));}const valid=times.filter(t=>t!==undefined&&(!shownAt||t<=Date.parse(shownAt)));return valid.length?Math.max(...valid):undefined;}).filter(x=>x!==undefined);
 if(candidates.length)firstQualified=new Date(Math.min(...candidates)).toISOString();
}
const recordingDirectory=artifact.browserRecording?.path;let recording=null,har=null,omitted=[],controls=[];
if(recordingDirectory){
 recording=read(resolve(recordingDirectory,'recording.json'));try{har=read(resolve(recordingDirectory,'replay.har'));}catch{}
 const captured=new Set((har?.log?.entries??[]).map(e=>{const u=new URL(e.request.url);return u.origin+u.pathname;}));const seen=new Set();
 const walk=v=>{if(!v||typeof v!=='object')return;if(v.resourceType==='script'){try{const u=v.url?new URL(v.url):new URL(v.pathname,v.origin);if(!captured.has(u.origin+u.pathname))seen.add(u.origin+u.pathname);}catch{}}for(const value of Object.values(v))if(value&&typeof value==='object')Array.isArray(value)?value.forEach(walk):walk(value);};walk(recording.entries);omitted=[...seen];
 const attempts=new Map();
 for(const row of decisions){let input=row.input??row.request;try{const m=input?.messages?.find(m=>m.role==='user');if(m)input=JSON.parse(m.content);}catch{}
  const targets=input?.observation?.targets??[];let action;try{action=JSON.parse(row.outputText);}catch{}
  for(const target of targets){const location=String(input?.goal?.location?.name??'');const bind=location.includes('Akabane')&&target.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION');const station=/Akabane\s*(?:Sta\.?|Station)/i.test(target.label??'')&&target.availableActions?.includes('OPEN_LINK');if(!bind&&!station)continue;
   const key=[target.label,target.href??'',bind?'LOCATION':'STATION'].join('|');const previous=attempts.get(key)??{kind:bind?'LOCATION':'STATION',label:target.label,href:target.href??null,observationUrl:input.observation.url,revision:input.observation.revision,proposedUse:false,diagnosticDOM:recording.pages.filter(p=>p.url===input.observation.url&&p.diagnostic?.status==='SAVED').map(p=>resolve(recordingDirectory,p.diagnostic.file))};if(action?.targetRef===target.ref&&((bind&&action.authoritativeField==='LOCATION')||(station&&action.action==='OPEN_LINK')))previous.proposedUse=true;attempts.set(key,previous);
  }
 }
 controls=[...attempts.values()];
}
const metrics={schema:'f5-slot-metrics@1',method:'Timestamped span partition; models override nested browser intervals. UNATTRIBUTED is not invented.',elapsedMs:start!==undefined&&end!==undefined?end-start:null,wallTimePartitionMs:totals,modelPurposeLatencyMs:purposes,stageTimings:restaurantRunStageTimings(artifact,decisions),firstQualifiedEvidenceAt:firstQualified,firstQualifiedDefinition:'Earliest completion of independently supported presented proof set; not a claim about unpresented candidates. Raw supported truth checked independently; timestamps only locate observations.',presentedAt:shownAt,witnessFunnel:result.evaluation.witnessFunnel,replayability:recording?{total:recording.pages.length,replayable:recording.pages.filter(p=>p.status==='REPLAYABLE').length,ratio:recording.pages.length?recording.pages.filter(p=>p.status==='REPLAYABLE').length/recording.pages.length:null,reasonDistribution:recording.pages.reduce((m,p)=>(m[p.reason]=(m[p.reason]??0)+1,m),{})}:null,uncapturedScriptOriginPaths:omitted,akabaneControls:controls,unusedAkabaneControls:controls.filter(c=>!c.proposedUse)};
put(resolve(directory,'metrics.json'),metrics);
if(recordingDirectory&&artifact.decisionCapture?.path){const cfg=read(resolve(here,'config.json')),frozen=(await loadFrozenLiveCases(resolve(root,cfg.runnerInput))).find(c=>c.id===artifact.caseId);put(resolve(directory,'replay-config.json'),{recordingDirectory,decisionsPath:artifact.decisionCapture.path,input:{frozen,runtimeContext:artifact.runtimeContext??{},limits:{...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:50,maxGoogleRequests:40,maxAutomaticBrowserMs:500000},recordBrowser:false,recordDecisions:false,startedAt:artifact.startedAt,reviewedReads:parseReviewedReads(fs.readFileSync(reviewedPath),reviewedPath),packIds:restaurantDiscoveryPacks.map(p=>p.meta.id)},modelMode:'ORIGINAL'});}
const safety=result.evaluation.severity;
if(!fs.existsSync(resolve(here,'STOP-S0.json'))&&(safety.S0_DECLARATION?.status==='PRESENT'||safety.S0_BOUNDARY?.status==='PRESENT'||post.rows.some(r=>r.S0==='PRESENT')))put(resolve(here,'STOP-S0.json'),{slot,reason:'IndependentS0 present',evaluationPath:result.outputPath});
console.log(JSON.stringify({outcome:result.evaluation.outcome.type,severity:safety,metricsPath:resolve(directory,'metrics.json'),evaluationPath:result.outputPath}));
