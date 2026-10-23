export function nextDecision({near,environment,safety,delivered,artifact,terminalPhase,systemFailure,modelCalls}){
 if(safety)return 'STOP_SAFETY';
 if(near)return 'STOP_KNOWN_NEAR_DEFECT_NOT_CAPABILITY';
 if(environment)return 'STOP_ENV_FAILURE';
 if(delivered>0)return 'STOP_DELIVERED_PENDING_WORDING_REVIEW';
 if(!artifact||systemFailure)return 'STOP_INTERNAL_OR_INTERRUPTED';
 if(terminalPhase==='NO_VERIFIED_RESULT'||modelCalls>=47)return 'CAPABILITY_NO_DELIVERY_SECOND_ALLOWED';
 return 'STOP_UNRESOLVED_NOT_AUTO_RETRY';
}
export function blockedMethods(artifact){
 const rows=[];function walk(v){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'){if(v.code==='BLOCKED_METHOD')rows.push(v);Object.values(v).forEach(walk);}}
 walk(artifact?.diagnostics?.browserTrace??[]);
 const own=rows.filter(v=>{try{return /(^|\.)tablecheck\.(com|net)$/.test(new URL(v.origin).hostname);}catch{return false;}});
 const byOrigin={};for(const v of own)byOrigin[v.origin]=(byOrigin[v.origin]??0)+1;
 return {allDiagnosticOccurrences:rows.length,tablecheckDiagnosticOccurrences:own.length,tablecheckByOrigin:byOrigin,tablecheckDistinctDiagnosticShapes:new Set(own.map(r=>JSON.stringify(r))).size,rule:'Recursive code=BLOCKED_METHOD in diagnostics.browserTrace, same as original h07=867 all/76 TableCheck; cumulative snapshot copies may repeat. Distinct shapes are not distinct network request counts.'};
}
