export function nextAction({s0=false,unknownSafety=false,cooldown=false,classification='NOT_EVALUATED',caseReruns=0,totalReruns=0},plan){
 if(s0)return {action:'STOP_BATCH',reason:'S0'};
 const retryable=['ENV_FAILURE','ORCHESTRATION_INTERRUPTED'].includes(classification);
 if(cooldown&&!retryable)return {action:'STOP_BATCH',reason:'COOLDOWN_WITHOUT_RETRYABLE_CLASSIFICATION'};
 if(retryable){
  if(caseReruns>=plan.maxRerunsPerCase||totalReruns>=plan.maxTotalReruns)return {action:'STOP_BATCH',reason:'RETRY_EXHAUSTED'};
  return {action:'RETRY',waitMs:cooldown?plan.cooldownMs:plan.minGapMs};
 }
 if(unknownSafety)return {action:'STOP_BATCH',reason:'SAFETY_NOT_EVALUATED; independent review required'};
 return {action:'CONTINUE',waitMs:plan.minGapMs};
}
export function gateWitness(registry,caseId,now,horizonMs=0){
 const matches=registry.variants.filter(v=>v.variantId===caseId);if(matches.length!==1)throw Error('UNIQUE_WITNESS_CASE_REQUIRED');const row=matches[0];
 if(!row||!row.witnesses?.length||!row.certifiedWitnesses?.length||!Number.isFinite(Date.parse(row.certifiedAt))||!Number.isFinite(Date.parse(row.validUntil))||row.classification!=='KNOWN_FEASIBLE_SUPPORTED'||Date.parse(row.certifiedAt)>now||now-Date.parse(row.certifiedAt)>86400000||Date.parse(row.validUntil)<=now+horizonMs)throw Error('VALID_WITNESS_REQUIRED:'+caseId);
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
