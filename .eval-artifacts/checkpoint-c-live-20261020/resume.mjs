// Execution-only continuation. Prior attempts, S0 findings and retry charges are never reset.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {base,sha} from './freeze.mjs';
export function loadResume(path,frozen,plan){
 const read=p=>{const key=relative(process.cwd(),resolve(p));if(!key.startsWith(base+'/')||!existsSync(key)||frozen.files[key]!==sha(readFileSync(key)))throw Error('RESUME_EVIDENCE_NOT_FROZEN:'+p);return JSON.parse(readFileSync(key,'utf8'));};
 const config=read(path);
 if(config.schema!=='checkpoint-c-resume@1'||config.approvedBy!=='USER'||config.authorizingMessage!=='重试'||config.resumeFromRunId!=='c-03'||config.extraAttempt.caseId!=='p2l-kf-h005-20261105'||config.extraAttempt.count!==1)throw Error('INVALID_RESUME_AUTHORIZATION');
 if(config.hardDeadline!=='2026-10-21T12:26:00Z')throw Error('RESUME_CANNOT_EXTEND_DEADLINE');
 const finish=read(config.priorDirectory+'/finish.json');
 if(finish.status!=='STOPPED'||finish.stop?.reason!=='RETRY_EXHAUSTED')throw Error('RESUME_REQUIRES_RETRY_EXHAUSTED');
 const rows=config.priorReports.map(p=>read(p));
 const prior=rows.map(r=>({runId:r.run.runId,caseId:r.run.caseId,outcome:r.layers.endToEnd.outcome.type}));
 if(JSON.stringify(prior.map(r=>[r.runId,r.outcome]))!==JSON.stringify([['c-01','CAPABILITY_MISS'],['c-02','HONEST_NO_RESULT'],['c-03','ENV_FAILURE'],['c-03','ENV_FAILURE']]))throw Error('UNEXPECTED_PRIOR_ATTEMPTS');
 if(rows.some(r=>['S0','S0_DECLARATION','S0_BOUNDARY'].some(k=>r.layers.severity[k]?.status==='PRESENT')))throw Error('S0_CANNOT_RESUME');
 for(const n of [1,2]){const f=read(config.priorDirectory+`/c-03-attempt-${n}/finish.json`);if(f.orchestration.finish.formalRunStarted||f.orchestration.finish.preflight.status!=='FAILED')throw Error('EXTRA_ATTEMPT_ONLY_FOR_PRE_RUN_ENV_FAILURE');}
 const start=plan.runs.findIndex(r=>r.runId===config.resumeFromRunId);
 if(start!==2||plan.runs[start].caseId!==config.extraAttempt.caseId||finish.totalReruns!==1)throw Error('RESUME_ORDER_OR_RETRY_COUNT_MISMATCH');
 return {config,sha256:sha(readFileSync(path)),rows,runs:plan.runs.slice(start),attemptCounts:{'c-03':2},caseRetries:new Map([[config.extraAttempt.caseId,1]]),totalReruns:finish.totalReruns+1,lastFinish:Date.parse(finish.at),hardDeadline:Date.parse(config.hardDeadline)};
}
