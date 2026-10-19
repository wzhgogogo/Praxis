"""Format frozen post-run comparison metrics; never participates in execution."""
from pathlib import Path
from collections import Counter
import json, hashlib, subprocess

root=Path(__file__).resolve().parent
load=lambda path:json.loads(path.read_text())
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
audit=load(root/'audit.json');compare=load(root/'comparison.json');plan=load(root/'plan.json');freeze=load(root/'freeze.json');ledger=load(root/'ledger.json')
prior=load(root.parent/'checkpoint-a-dom-20261019/audit.json')
def aggregate(rows):
 return {'runs':len(rows),'models':sum(r['resources']['modelCalls'] for r in rows),'elapsedMs':sum(r['resources']['elapsedMs'] for r in rows),'planningCalls':sum(r['planningCallCount'] for r in rows),'planningMs':sum(r['planningLatencyMs'] for r in rows),'planningTimeouts':sum(r['planningTimeouts'] for r in rows),'listing':{s:sum(r['witnessInListingBySource'][s] for r in rows) for s in ['tabelog','tablecheck','google-places']},'firstBatch':{s:sum(r['witnessInFirstBatchBySource'][s] for r in rows) for s in ['tabelog','tablecheck']},'failures':dict(Counter(f for r in rows for f in r['failureCodes']))}
current=aggregate(audit['rows']);previous=aggregate(prior['rows']);common=aggregate([r for r in prior['rows'] if r['index'] in {row['index'] for row in audit['rows']}])
(root/'aggregate.json').write_text(json.dumps({'checkpointAAllTen':previous,'checkpointAComparable':common,'checkpointB':current},indent=2)+'\n')
lines=['# P2-1 corrected checkpoint B — discovery only','',f"Status **{audit['status']}**: {audit['formalProbes']}/10 recorded; stop={audit['stop']}. Exposed development inputs; no availability investigation, delivery or full Live.",'','## Changes, gates and freeze','',
 '- Review4592a1e read before work; approved scope is the three corrections and checkpoint-local outer recovery only. [B 第一版 exclusion](superseded-b-first.json) preserves its3 runs/17 calls and all historical bytes; none enter this comparison. Its h001 repeat2 was QUERY_NOT_REPRESENTABLE, correcting the old report sentence.',
 f"- Production freeze `{plan['productionHead']}`; comparison A `{plan['comparisonA']}`. Prior HARD correction `884c56b`, original P2-1b `4975f9f` retained. Prompt restaurant-discovery-retrieval-prompt@5; Schema restaurant_discovery_retrieval@2. [Five gates/red-green](fixes/verification.json). [Offline TableCheck diagnosis](fixes/tablecheck-diagnosis.json) used0 network/models.",
 '- Homepage filters use the already observed same-region list root; no guessed or foreign root. Sparse (<5) with categories and rewrites remaining excludes KEEP in Schema, Domain and executor. No categories or two rewrites exhausted still permit it. Invalid proposals retain the bounded general-list fallback, without additional model retries.',
 '- TableCheck original3 filter pages displayed Search is unavailable right now, not a normal empty list. Filter OPTIONS contained unreviewed open_from/open_until; selected labels omit the year as a secondary gap. Search filtering is now SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED; ordinary discovery remains. No network permission expansion.',
 f"- [Freeze](freeze.json) binds{len(freeze['files'])} files; outer SHA-256 `{freeze['outerSha256']}`; reviewed reads `{freeze['reviewedReadsSha256']}`; witness `{freeze['witnessesSha256']}` valid until `{freeze['earliestWitnessExpiry']}`. Clean host worktree. Freeze commit is recorded in [freeze-commit.json](freeze-commit.json). [17 offline outer controls](offline-controls.json); [six plan-only parses](plan-only.json). No in-batch edits.",
 '- Preflight failure count resets to0 for this checkpoint. TableCheck503 waits at least10 minutes before the one preflight-only retry. If it remains503 the batch stops, with no second retry; a recovery window beyond30 minutes also stops. Other S0/budget/size stops unchanged.',
 '- Source-owned production delta from4592a1e: source-packs +10/-32, net-22 lines. No unrelated deletions to offset shared changes. Full source/net-zero phase exit is not certified.',
 '', '## Evaluation and comparison scope','',
 '- End-to-end: only the promised discovery first-batch slice is measured. Full user delivery/slot inventory NOT_EVALUATED. Listing filters never produce an Offer or availability evidence.',
 '- Stages: source-specific witness listing/first-batch IDs; Google requires exact website-derived source ID. Similar names separate. Radius counts are parsed coordinate candidates, not qualified/deduplicated restaurants; listing hits may come from region navigation.',
 '- Severity: independent frozen network rules audit recorded requests, separately from production Guard. ABSENT in these traces does not prove all public GETs safe; ADR-0036 residual limitations remain.',
 '- Attribution: H002 is the approved HARD-keyword correction group; the other nine rows are P2-1b including these approved homepage/sparse-KEEP/TableCheck corrections. Source/model/live-result fluctuation prevents a statistical or single-factor causal claim. L0/L1 local evidence and real-model discovery probes are separate; no paid offline replay added.',
 '', '## Aggregate (complete/common rows separated)','', '| Metric | A all10 | A comparable rows | B recorded rows |','| --- | --- | --- | --- |']
for key in ['runs','models','elapsedMs','planningCalls','planningMs','planningTimeouts','listing','firstBatch','failures']:
 lines.append(f'| {key} | {previous[key]} | {common[key]} | {current[key]} |')
lines+=['','## Source and radius comparison','', '| Case / repeat | Variable group | Tabelog list,first A→B | TableCheck list,first A→B | Google exact A→B | Radius A→B |','| --- | --- | --- | --- | --- | --- |']
bit=lambda value:int(bool(value))
for pair in compare['pairs']:
 a,b=pair['checkpointA'],pair['checkpointB']
 if 'resources' not in b:
  lines.append(f"| {pair['caseId']} / {pair['repeat']} | {pair['approvedVariable']} | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |")
  continue
 cell=lambda source:f"{bit(a['witnessInListingBySource'][source])},{bit(a['witnessInFirstBatchBySource'][source])} → {bit(b['witnessInListingBySource'][source])},{bit(b['witnessInFirstBatchBySource'][source])}"
 lines.append(f"| {pair['caseId']} / {pair['repeat']} | {pair['approvedVariable']} | {cell('tabelog')} | {cell('tablecheck')} | {bit(a['witnessInListingBySource']['google-places'])} → {bit(b['witnessInListingBySource']['google-places'])} | {a['inRadiusParsed']} → {b['inRadiusParsed']} |")
lines+=['','## Resources A → B','', 'Elapsed is formal probe wall time, excluding external preflight. Shared text planning is counted once.','', '| Case / repeat | Models | Elapsed ms | Pages | Planning calls/ms | Planning timeouts | B Google formal |','| --- | --- | --- | --- | --- | --- | --- |']
for pair in compare['pairs']:
 a,b=pair['checkpointA'],pair['checkpointB']
 if 'resources' not in b:continue
 lines.append(f"| {pair['caseId']} / {pair['repeat']} | {a['resources']['modelCalls']} → {b['resources']['modelCalls']} | {a['resources']['elapsedMs']} → {b['resources']['elapsedMs']} | {a['pages']} → {b['pages']} | {a['planningCallCount']}/{a['planningLatencyMs']} → {b['planningCallCount']}/{b['planningLatencyMs']} | {a['planningTimeouts']} → {b['planningTimeouts']} | {b['resources']['google']['total']} |")
lines+=['','## Search-filter observations and raw paths','', 'APPLIED is an executor diagnostic, not an independent availability verdict. Inspect the linked recording for source-selected values. Empty or unconfirmed hints do not imply no tables.','']
for row in audit['rows']:
 index=row['index'];item=plan['planned'][index]
 lines += [f"### {item['caseId']} / {item['repeat']}",'',f"Boundary **{row['boundary']['status']}**; failures `{row['failureCodes']}`; termination `{row['terminationReason']}`.",'']
 for source,hint in row['searchAvailabilityHints'].items():
  lines.append(f"- {source}: `{json.dumps(hint,ensure_ascii=False)}`" if hint else f'- {source}: no hint reached/applicable.')
 lines+=['',f"Source timing/planning: `{json.dumps(row['sourceRetrieval'],ensure_ascii=False)}`",'',f"Google recorded request context: `{json.dumps(row['googleActualTransport'],ensure_ascii=False)}`",'']
 for key in ['summary','decisions','recording','trace']:
  path=Path(row[key]);relative=path.relative_to(root.relative_to(Path.cwd())) if not path.is_absolute() else path
  lines.append(f"- [{key}]({relative}) — SHA-256 `{row[key+'Sha256']}`")
 lines+=['','Retrieval attempts (original order; repeated observations retained):','', '| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |','| --- | --- | --- | --- | --- | --- |']
 for attempt in row['retrievalAttempts']:
  safe=lambda value:str(value).replace('|','\\|').replace('\n',' ')
  lines.append('| '+' | '.join(safe(value) for value in [attempt['sourceId'],attempt['type'],attempt.get('keyword')or attempt.get('categoryLabel'),str(attempt['parsedCount'])+'/'+str(attempt['displayedTotal']),attempt['url'],attempt['decidedBy']+': '+attempt['reason']])+' |')
 lines+=['']
lines+=['## Preflight, integrity and cumulative usage','', '| Index | Status | Formal started | Models | Preflight evidence |','| --- | --- | --- | --- | --- |']
for a in ledger['attempts']:
 lines.append(f"| {a['index']} | {a['status']} | {a.get('formalProbeStarted')} | {a.get('models',a.get('modelsUpperBoundCharged'))} | {a.get('preflightEvidence','SOURCE_DATA_NONEMPTY; see per-attempt source-data-preflight.json')} |")
lines += ['',f"New formal probes **{audit['formalProbes']}**, models **{audit['modelCalls']}**, Google formal/preflight **{audit['googleFormal']}/{audit['googlePreflight']}**. Cumulative **{audit['cumulativeProbes']}/55 probes**, **{audit['cumulativeModels']}/450 models**, **{audit['cumulativeGoogle']} Google**. Full Live added **0**.",f"New countable preflight failures {audit['preflightFailures']}; checkpoint origin0; stop={audit['stop']}. No completed formal probe rerun. Decision outcomes `{audit['decisionOutcomes']}`; rows equal calls for every saved probe. {audit['frozenFilesChecked']} frozen hashes and {audit['historicalFilesUnchanged']} historical hashes verified; worktree clean. Compressed artifact estimate {ledger.get('compressedBytesEstimate')} bytes, limit60000000.",'','H002 before/after actual request contexts and observed counts are separate from P2-1b effects on the other nine rows. All product/source limitations, including disabled TableCheck filtering and region-navigation budget failures, remain in the raw record. No repair, full Live or witness refresh during this batch. Stop for independent review.','']
(root/'report.md').write_text('\n'.join(lines))
print('Wrote report.md and aggregate.json')
