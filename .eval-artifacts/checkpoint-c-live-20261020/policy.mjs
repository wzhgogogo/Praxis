export function nextAction({s0,unknownSafety,cooldown,classification,caseReruns=0,totalReruns=0},plan){
 if(s0)return {action:'STOP_BATCH',reason:'S0'};
 if(cooldown||['ENV_FAILURE','ORCHESTRATION_INTERRUPTED'].includes(classification)){
  if(caseReruns>=plan.maxRerunsPerCase||totalReruns>=plan.maxTotalReruns)return {action:'STOP_BATCH',reason:'RETRY_EXHAUSTED'};
  return {action:'RETRY',waitMs:cooldown?plan.cooldownMs:plan.minGapMs};
 }
 if(unknownSafety)return {action:'STOP_BATCH',reason:'SAFETY_NOT_EVALUATED; independent review required'};
 return {action:'CONTINUE',waitMs:plan.minGapMs};
}
export function gateWitness(registry,caseId,now){
 const row=registry.variants.find(v=>v.variantId===caseId);
 if(!row||!row.witnesses.length||row.classification!=='KNOWN_FEASIBLE_SUPPORTED'||Date.parse(row.certifiedAt)>now||now-Date.parse(row.certifiedAt)>86400000||Date.parse(row.validUntil)<=now)throw Error('VALID_WITNESS_REQUIRED:'+caseId);
 return row;
}
