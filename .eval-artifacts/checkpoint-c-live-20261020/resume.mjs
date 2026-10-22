// Current authorized c17 environment retry. Earlier continuations remain in Git history.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {base,sha} from './freeze.mjs';
export function loadResume(path,frozen,plan){
 const bytes=p=>{const key=relative(process.cwd(),resolve(p));if(!key.startsWith(base+'/')||!existsSync(key)||frozen.files[key]!==sha(readFileSync(key)))throw Error('RESUME_EVIDENCE_NOT_FROZEN:'+p);return readFileSync(key);};
 const read=p=>JSON.parse(bytes(p));
 const config=read(path);
 if(config.schema!=='checkpoint-c-resume@3'||config.approvedBy!=='USER'||config.action!=='C17_POST_RECHECK_ENVIRONMENT_RETRY'||config.resumeFromRunId!=='c-17'||config.extraAttempt?.runId!=='c-17'||config.extraAttempt.caseId!=='p2l-kf-h005-20261105'||config.extraAttempt.count!==1)throw Error('INVALID_RESUME_AUTHORIZATION');
 const registry=read(config.registryPath),manifest=read(config.priorManifestPath),inputs=read(config.priorInputsPath),gates=read(config.acceptanceGatesPath),display=read(config.acceptanceDisplayGatePath);
 if(config.hardDeadline!=='2026-10-22T12:23:00.000Z'||Date.parse(config.hardDeadline)>Date.parse(registry.validUntil))throw Error('RESUME_CANNOT_EXTEND_DEADLINE');
 if(sha(bytes(config.priorManifestPath))!==config.priorManifestSha256||sha(bytes(config.reviewPath))!==config.reviewSha256||!bytes(config.reviewPath).toString().includes('独立复查失败属于评测侧环境失败'))throw Error('ELIGIBILITY_REVIEW_MISMATCH');
 if(gates.status!=='PASS'||gates.gates.length!==5||gates.gates.some(g=>g.status!=='PASS')||gates.calibration.matched!==22||display.status!=='PASS'||display.tempura.length!==4||display.utou.length!==3||[...display.tempura,...display.utou].some(r=>r.after.assessment!=='CONSISTENT')||display.unsupported!==0||display.missed!==0)throw Error('OFFLINE_ACCEPTANCE_REQUIRED');
 const prior=p=>{const value=read(p),key=relative(process.cwd(),resolve(p));if(manifest.files[key]?.sha256!==sha(bytes(p)))throw Error('PRIOR_RAW_EVIDENCE_CHANGED:'+p);return value;};
 const rows=config.priorReports.map(p=>prior(p));
 if(rows.length!==18||JSON.stringify(rows.map(r=>r.run))!==JSON.stringify(plan.runs)||inputs.runs.length!==18)throw Error('UNEXPECTED_PRIOR_ATTEMPTS');
 for(const r of rows){const input=inputs.runs.find(i=>i.runId===r.run.runId);if(!input||r.artifactSha256!==input.artifactSha256||sha(bytes(r.artifact))!==input.artifactSha256)throw Error('PRIOR_ARTIFACT_BINDING_MISMATCH');const e=prior(r.evaluationPath);if(['S0','S0_DECLARATION','S0_BOUNDARY'].some(k=>r.layers.severity[k]?.status==='PRESENT'||e.severity[k]?.status==='PRESENT'))throw Error('S0_CANNOT_RESUME');}
 const post=prior(config.originalPostCheckPath),failed=post.rows.find(r=>r.candidateId==='tabelog:en/tokyo/A1301/A130103/13292459');
 const metadata=prior(config.originalFailureMetadataPath);
 if(!failed?.raw?.error||failed.raw.status!==undefined||failed.raw.bodyPath!==undefined||metadata.error!=='TypeError'||metadata.status!==undefined||failed.raw.metadataPath!==resolve(config.originalFailureMetadataPath))throw Error('ONLY_REVIEWED_POST_RECHECK_TRANSPORT_FAILURE_CAN_RETRY');
 const finish=prior(config.priorFinishPath);
 if(finish.status!=='COMPLETED'||finish.totalReruns!==2)throw Error('PRIOR_RETRY_COUNT_MISMATCH');
 const run=plan.runs.find(r=>r.runId==='c-17');if(run?.caseId!==config.extraAttempt.caseId)throw Error('RESUME_PLAN_MISMATCH');
 return{config,sha256:sha(bytes(path)),rows,runs:[run],attemptCounts:{'c-17':1},caseRetries:new Map([[run.caseId,1]]),totalReruns:finish.totalReruns+1,lastFinish:Date.parse(finish.at),hardDeadline:Date.parse(config.hardDeadline)};
}
