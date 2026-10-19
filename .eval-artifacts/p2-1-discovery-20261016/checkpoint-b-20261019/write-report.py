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
lines=['# P2-1 checkpoint B — HARD retrieval correction and search availability hints','',f"Status **{audit['status']}**: {audit['formalProbes']}/10 recorded; stop={audit['stop']}. Exposed development **discovery probes only**. No availability investigation, delivery or full Live.",'', '## Commits, gates and freeze','',
 '- Independent review38b058e was read and fast-forwarded before work.',
 '- HARD retrieval correction/ADR append: `884c56b1a9998d350f7af666d71a8da43697e247`; Prompt@4, Schema@1. Old H002 controlled transport sent first-date text with one shared planning call; new production assembly sends Nearby with zero shared planning calls. SOFT/UNSPECIFIED remain inputs for observed category selection.',
 '- P2-1b production: `4975f9f26120b01996e9e5157022ef95a5fd2c70`; five gates PASS: typecheck, architecture,948/948 default tests, build,119/119 local Chromium. [Gate hashes/red/green](search-hints/verification.json); [HARD red/green](hard-only/verification.json). Intermediate failures remain saved; final green files are explicit.',
 '- Outer freeze commit: `c20001ab13b7d123d63642955b8f615a3ace631d`. [Freeze](freeze.json) binds315 source/config/script files; source worktree clean. [13 offline controls](offline-controls.json), [six zero-network/model parses](plan-only.json). No mid-batch configuration edits.',
 f"- Outer SHA-256 `{freeze['outerSha256']}`; independent reviewed reads `{freeze['reviewedReadsSha256']}`; witness bytes `{freeze['witnessesSha256']}`. Earliest witness expiry `{freeze['earliestWitnessExpiry']}`; certification reused without extra requests.",
 '- Same ten A inputs, dates, center/radius, model configuration, source preflight and15-model/180-second ceilings. New GET filter shapes are independently frozen in [reviewed-reads.json](reviewed-reads.json). Filter/fallback consume original source pages and90seconds; values come only from authoritative intent.',
 '- Source-owned production lines from884c56b: source-packs +53/-1, Tabelog query +2/-1, TableCheck query +3/-2, net **+54**. They encode source syntax and selected-value observation. No unrelated deletion for offset; phase-wide net-zero source-code exit condition is not certified.',
 '', '## Comparison scope and four-layer evaluation','',
 '- End-to-end: this is the promised discovery first-batch slice; full user delivery is NOT_EVALUATED. No inventory/Offer is created from listing slots.',
 '- Stages: source-specific listing/first-batch hits use frozen witness IDs; Google credit requires exact website source ID. Similar names remain separate. Radius counts are parsed coordinate candidates, not qualified or deduplicated restaurants. Raw-listing hits include broad region-navigation observations.',
 '- Severity: recorded requests are checked by the independent frozen network rules, not production Guard verdicts. A clean recorded boundary is not universal proof against unknown GET effects; ADR-0036 limitations remain.',
 '- Attribution: H002 is grouped under the approved HARD-keyword correction; other cases under P2-1b. Live fluctuations are recorded, not treated as statistical causal proof. Local L0/L1 tests and these real-model discovery observations are separate; no new offline paid-model replay in this batch.',
 '', '## Aggregate observations (partial B; common rows separated)','', 'Only completed pairs are comparable. Seven unstarted rows are NOT_REACHED, not failures or zeros. H002 has offline proof only; its checkpoint B website/Google behavior is NOT_REACHED.','', '| Metric | A all10 | A comparable rows | B recorded rows |','| --- | --- | --- | --- |']
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
lines += ['',f"New formal probes **{audit['formalProbes']}**, models **{audit['modelCalls']}**, Google formal/preflight **{audit['googleFormal']}/{audit['googlePreflight']}**. Cumulative **{audit['cumulativeProbes']}/52 probes**, **{audit['cumulativeModels']}/450 models**, **{audit['cumulativeGoogle']} Google**. Full Live added **0**.",f"New countable preflight failures {audit['preflightFailures']}; origin1 retained; stop={audit['stop']}. No completed formal probe rerun. Decision outcomes `{audit['decisionOutcomes']}`; rows equal calls for every saved probe. {audit['frozenFilesChecked']} frozen hashes and {audit['historicalFilesUnchanged']} historical hashes verified; worktree clean. Compressed artifact estimate {ledger.get('compressedBytesEstimate')} bytes, limit60000000.",'','H002 before/after actual request contexts and observed counts are separate from P2-1b effects on the other nine rows. All product/source limitations, including missing selected-date observations and region-navigation budget failures, remain in the raw record. No repair, full Live or witness refresh during this batch. Stop for independent review.','']
(root/'report.md').write_text('\n'.join(lines))
print('Wrote report.md and aggregate.json')
