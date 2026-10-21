// The only subset authorized here is the separate three-run quick validation.
export function executionRuns(plan,{runIds,offline=false,resume}={}){
 if(runIds===undefined)return offline?plan.runs.slice(0,1):resume?resume.runs:plan.runs;
 if(resume)throw Error('RUN_IDS_CANNOT_COMBINE_WITH_RESUME');
 const ids=runIds.split(',').map(id=>id.trim());
 if(ids.some(id=>!id))throw Error('EMPTY_RUN_ID');
 if(new Set(ids).size!==ids.length)throw Error('DUPLICATE_RUN_ID');
 for(const id of ids)if(!plan.runs.some(run=>run.runId===id))throw Error('UNKNOWN_RUN_ID:'+id);
 const selected=plan.runs.filter(run=>ids.includes(run.runId));
 if(JSON.stringify(selected.map(run=>run.runId))!==JSON.stringify(['c-01','c-02','c-05']))throw Error('ONLY_APPROVED_QUICK_VALIDATION_RUN_IDS_ALLOWED');
 return selected; // Original plan order, objects, case parameters and budgets remain authoritative.
}
