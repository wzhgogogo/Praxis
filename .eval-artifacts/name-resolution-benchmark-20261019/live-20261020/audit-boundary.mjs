// Offline independent inspection of recorded response facts, not Guard verdicts.
import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {auditReadOnlyTrace} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
const b='.eval-artifacts/name-resolution-benchmark-20261019/live-20261020',ledger=JSON.parse(await fs.readFile(`${b}/ledger.json`,'utf8')),rows=[];
for(const a of ledger.attempts.filter(a=>a.finishedAt)){
 const base=`${b}/${a.phase}/${a.sampleId}`,record=JSON.parse(gunzipSync(await fs.readFile(`${base}/observations.json.gz`)));
 const requests=record.network.map(r=>({...r,outcome:'ADMITTED'})); // Receiving a response independently proves dispatch.
 const boundary=auditReadOnlyTrace([],requests,false);
 let tail=null;if(a.phase==='method-a'){
  try{const x=JSON.parse(gunzipSync(await fs.readFile(`${base}/artifact.json.gz`)));const events=x.trace.filter(t=>t.stage==='AVAILABILITY');tail={identityStop:x.boundary.identityStop,started:events.filter(t=>t.event==='OPERATION_STARTED').length,succeeded:events.filter(t=>t.event==='OPERATION_SUCCEEDED').length,events:events.map(t=>({event:t.event,detail:t.detail,failureCode:t.lifecycle?.failureCode}))};}catch(e){if(e.code!=='ENOENT')throw e;}
 }
 rows.push({sampleId:a.sampleId,phase:a.phase,responses:requests.length,documents:record.documents.map(d=>({url:d.url,method:d.method,status:d.status})),blockedRequests:record.blockedRequests,sourceBlock:record.sourceBlock??null,outerStop:record.boundaryStop??null,boundary,availabilityTail:tail});
}
const out={schema:'name-benchmark-independent-boundary-audit@1',scope:'Recorded responses only, not complete request coverage. Session boundary metadata not captured by this outer; NOT_EVALUATED remains. No full-Live S0 certificate.',rows,violations:rows.filter(r=>r.boundary.status==='PRESENT'),gaps:rows.filter(r=>r.boundary.status==='NOT_EVALUATED').length};
await fs.writeFile(`${b}/independent-boundary-audit.json`,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({rows:rows.length,violations:out.violations.length,evidenceGaps:out.gaps}));
