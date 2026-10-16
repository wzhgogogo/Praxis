import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {discoveryProbeMetrics} from '../../../src/eval/restaurant/agent-loop/discovery-probe.js';
const base=resolve('.eval-artifacts/p2-1-discovery-20261016');
const ledger=JSON.parse(await readFile(resolve(base,'baseline-ledger.json'),'utf8'));
const reviewer=JSON.parse(await readFile(resolve(base,'reviewer-rerun-20261017/google-witness-name-matches.json'),'utf8'));
const rows=[];
for(const attempt of ledger.attempts.filter((a:any)=>a.summary)){
 const original=await readFile(attempt.summary,'utf8'),summary=JSON.parse(original);
 const trace=(await readFile(resolve(attempt.directory,'trace.jsonl'),'utf8')).trim().split('\n').map(l=>JSON.parse(l));
 const reads=summary.sources.map((source:any)=>({sourceId:source.sourceId,read:trace.find((r:any)=>r.kind==='SOURCE_FIRST_BATCH'&&r.detail.sourceId===source.sourceId)?.detail.read,failedFunnel:source.funnel}));
 const input=JSON.parse(await readFile(resolve(base,'inputs',`${summary.caseId}.json`),'utf8'));
 const metrics=discoveryProbeMetrics(input,summary.witnessMatches,summary.listings,summary.firstBatchDetails,reads);
 const proposals=reviewer.rows.find((r:any)=>r.case===summary.caseId&&r.attempt===`attempt-${attempt.repeat}`)?.nameMatches??[];
 const nameOnly=proposals.filter((p:any)=>!summary.witnessMatches.some((w:any)=>{try{const u=new URL(p.website);return u.hostname.replace(/^www\./,'')==='tabelog.com'&&u.pathname.replace(/^\/(?:en|ja)\//,'/').replace(/\/$/,'')==='/'+w.sourceEntityId.replace(/^(?:en|ja)\//,'');}catch{return false;}}));
 const environment={sourceId:'tablecheck',classification:'ENV_FAILURE',basis:'independent-review.md supplemental user VPN comparison 2026-10-17 00:25 Beijing',originalFailureCode:summary.sources.find((s:any)=>s.sourceId==='tablecheck')?.failureCode,downstreamUnattempted:summary.unattemptedSourceIds};
 rows.push({caseId:summary.caseId,repeat:attempt.repeat,originalSummary:attempt.summary,originalSha256:createHash('sha256').update(original).digest('hex'),oldWitnessInListing:summary.witnessInListing,witnessInListing:metrics.witnessInListing,witnessInListingBySource:metrics.witnessInListingBySource,witnessWebsiteMatches:metrics.witnessWebsiteMatches,witnessNameOnlyMatches:[...metrics.witnessNameOnlyMatches,...nameOnly.map((p:any)=>({...p,origin:"INDEPENDENT_REVIEW_UNCONFIRMED_PROPOSAL",credited:false}))],environment});
}
await writeFile(resolve(base,'followup/baseline-recomputed.json'),JSON.stringify({status:'exposed development diagnosis; original artifacts unchanged',metricsVersion:'discovery-probe-metrics@2',modelCalls:0,networkRequests:0,rows},null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({caseId:r.caseId,repeat:r.repeat,bySource:r.witnessInListingBySource,exactWebsites:r.witnessWebsiteMatches.length}))));
