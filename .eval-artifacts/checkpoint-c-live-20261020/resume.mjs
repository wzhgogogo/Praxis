// Current C18 continuation only. Historical c03 resume@1 remains in Git history.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {base,sha} from './freeze.mjs';
export function loadResume(path,frozen,plan){
 const read=p=>{const key=relative(process.cwd(),resolve(p));if(!key.startsWith(base+'/')||!existsSync(key)||frozen.files[key]!==sha(readFileSync(key)))throw Error('RESUME_EVIDENCE_NOT_FROZEN:'+p);return JSON.parse(readFileSync(key,'utf8'));};
 const config=read(path);
 if(config.schema!=='checkpoint-c-resume@2'||config.approvedBy!=='USER'||config.authorizingMessage!=='正常应该就是抖动，你继续跑剩下的live不'||config.resumeFromRunId!=='c-09'||config.extraAttempt.runId!=='c-09'||config.extraAttempt.caseId!=='p2l-kagurazaka-kaiseki-20261105'||config.extraAttempt.count!==1)throw Error('INVALID_RESUME_AUTHORIZATION');
 const registry=read(config.registryPath),priorFreeze=read(config.priorFreezePath),manifest=read(config.priorManifestPath);
 if(config.hardDeadline!==registry.validUntil||!Number.isFinite(Date.parse(config.hardDeadline)))throw Error('RESUME_CANNOT_EXTEND_DEADLINE');
 if(sha(readFileSync(config.priorFreezePath))!==config.priorFreezeSha256||manifest.freezeSha256!==config.priorFreezeSha256)throw Error('PRIOR_FREEZE_MISMATCH');
 const prior=p=>{const value=read(p),key=relative(process.cwd(),resolve(p));if(manifest.files[key]?.sha256!==sha(readFileSync(key)))throw Error('PRIOR_RAW_EVIDENCE_CHANGED:'+p);return value;};
 const started=prior(config.priorDirectory+'/started.json'),finish=prior(config.priorDirectory+'/finish.json');
 if(started.freezeSha256!==config.priorFreezeSha256||!priorFreeze.files)throw Error('PRIOR_FREEZE_MISMATCH');
 if(finish.status!=='STOPPED'||finish.stop?.reason!=='RETRY_EXHAUSTED')throw Error('RESUME_REQUIRES_RETRY_EXHAUSTED');
 const rows=config.priorReports.map(p=>prior(p));
 const expected=[['c-01','QUALIFIED_DELIVERY'],['c-02','NOT_EVALUATED'],['c-03','CAPABILITY_MISS'],['c-04','NOT_EVALUATED'],['c-05','ENV_FAILURE'],['c-05','NOT_EVALUATED'],['c-06','NOT_EVALUATED'],['c-07','QUALIFIED_DELIVERY'],['c-08','NOT_EVALUATED'],['c-09','ENV_FAILURE']];
 if(finish.attempts!==10||rows.length!==10||JSON.stringify(rows.map(r=>[r.run.runId,r.layers.endToEnd.outcome.type]))!==JSON.stringify(expected)||rows.some(r=>r.freezeSha256!==config.priorFreezeSha256||JSON.stringify(r.run)!==JSON.stringify(plan.runs.find(p=>p.runId===r.run.runId))))throw Error('UNEXPECTED_PRIOR_ATTEMPTS');
 const evaluations=rows.map(r=>prior(r.evaluationPath));
 if(rows.some(r=>['S0','S0_DECLARATION','S0_BOUNDARY'].some(k=>r.layers.severity[k]?.status==='PRESENT'))||evaluations.some(e=>['S0','S0_DECLARATION','S0_BOUNDARY'].some(k=>e.severity[k]?.status==='PRESENT')))throw Error('S0_CANNOT_RESUME');
 const f=prior(config.priorDirectory+'/c-09-attempt-1/finish.json');
 if(f.orchestration.finish.formalRunStarted||f.orchestration.finish.preflight.status!=='FAILED')throw Error('EXTRA_ATTEMPT_ONLY_FOR_PRE_RUN_ENV_FAILURE');
 const start=plan.runs.findIndex(r=>r.runId===config.resumeFromRunId);
 if(start!==8||plan.runs[start].caseId!==config.extraAttempt.caseId||finish.totalReruns!==1)throw Error('RESUME_ORDER_OR_RETRY_COUNT_MISMATCH');
 return {config,sha256:sha(readFileSync(path)),rows,runs:plan.runs.slice(start),attemptCounts:{'c-09':1},caseRetries:new Map([[config.extraAttempt.caseId,1]]),totalReruns:finish.totalReruns+1,lastFinish:Date.parse(finish.at),hardDeadline:Date.parse(config.hardDeadline)};
}
