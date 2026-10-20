export function nextAction({s0=false,unknownSafety=false,cooldown=false,classification='NOT_EVALUATED',caseReruns=0,totalReruns=0},plan){
 if(s0)return {action:'STOP_BATCH',reason:'S0'};
 const retryable=['ENV_FAILURE','ORCHESTRATION_INTERRUPTED'].includes(classification);
 if(cooldown&&!retryable)return {action:'STOP_BATCH',reason:'COOLDOWN_WITHOUT_RETRYABLE_CLASSIFICATION'};
 if(retryable){
  if(caseReruns>=plan.maxRerunsPerCase||totalReruns>=plan.maxTotalReruns)return {action:'STOP_BATCH',reason:'RETRY_EXHAUSTED'};
  return {action:'RETRY',waitMs:cooldown?plan.cooldownMs:plan.minGapMs};
 }
 // Missing evaluation blocks final safety acceptance, not the remaining batch.
 // Only a positive S0 finding stops the batch under the approved playbook.
 return {action:'CONTINUE',waitMs:plan.minGapMs};
}
export function gateWitness(registry,caseId,now,horizonMs=0){
 const matches=registry.variants.filter(v=>v.variantId===caseId);if(matches.length!==1)throw Error('UNIQUE_WITNESS_CASE_REQUIRED');const row=matches[0];
 if(!row||!row.witnesses?.length||!row.certifiedWitnesses?.length||!Number.isFinite(Date.parse(row.certifiedAt))||!Number.isFinite(Date.parse(row.validUntil))||!Number.isFinite(Date.parse(registry.validUntil))||row.classification!=='KNOWN_FEASIBLE_SUPPORTED'||Date.parse(row.certifiedAt)>now||now-Date.parse(row.certifiedAt)>86400000||Date.parse(row.validUntil)<=now+horizonMs||Date.parse(registry.validUntil)<=now+horizonMs)throw Error('VALID_WITNESS_REQUIRED:'+caseId);
 return row;
}

// Consume one authorization once across restarts and alternate output directories.
// Re-authorization is an explicit user/reviewer step, never a hidden batch resume.
export async function consumeAuthorization(batchDirectory,approvalSha256,record){
 if(!/^[a-f0-9]{64}$/.test(approvalSha256))throw Error('INVALID_APPROVAL_SHA');
 const {mkdir,writeFile}=await import('node:fs/promises');const {resolve}=await import('node:path');
 const directory=resolve(batchDirectory,'authorization-receipts');await mkdir(directory,{recursive:true});
 await writeFile(resolve(directory,approvalSha256+'.json'),JSON.stringify({...record,at:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
}

export function checkStageBudget(ledger,plan){
 const counts=['totalFullLiveRuns','phase2ModelCalls','priorPhaseModelCalls','totalModelCalls','environmentReruns'];
 if(ledger.status!=='RECONCILED'||!counts.every(k=>Number.isSafeInteger(ledger[k])&&ledger[k]>=0)||ledger.totalModelCalls!==ledger.phase2ModelCalls+ledger.priorPhaseModelCalls)throw Error('INVALID_STAGE_LEDGER');
 const models=ledger.sources.filter(s=>s.scope==='PHASE2').reduce((n,s)=>n+s.models,0),carry=ledger.sources.filter(s=>s.scope==='PRIOR_PHASE_MODEL_CARRY').reduce((n,s)=>n+s.models,0),live=ledger.sources.reduce((n,s)=>n+s.fullLiveRuns,0);
 if(models!==ledger.phase2ModelCalls||carry!==ledger.priorPhaseModelCalls||live!==ledger.totalFullLiveRuns)throw Error('STAGE_LEDGER_RECONCILIATION_MISMATCH');
 const remaining={fullLiveRuns:100-live,modelCalls:4000-ledger.totalModelCalls,environmentReruns:10-ledger.environmentReruns};
 const reservedRetries=Math.min(new Set(plan.runs.map(r=>r.caseId)).size,remaining.environmentReruns,plan.maxTotalReruns);
 if(reservedRetries<0||remaining.fullLiveRuns<plan.runs.length+reservedRetries||remaining.modelCalls<(plan.runs.length+reservedRetries)*plan.ceilings.maxModelCalls)throw Error('GLOBAL_BUDGET_NOT_AVAILABLE');
 return {remaining,reservedRetries,reservedRuns:plan.runs.length+reservedRetries,reservedModelCalls:(plan.runs.length+reservedRetries)*plan.ceilings.maxModelCalls};
}
