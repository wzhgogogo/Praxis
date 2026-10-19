from pathlib import Path
from collections import Counter
import json, os, hashlib

root=Path('.eval-artifacts/p2-1-discovery-20261016');out=root/'checkpoint-a-dom-20261019'
load=lambda p:json.loads(p.read_text())
audit=load(out/'audit.json');comparison=load(out/'comparison.json');ledger=load(out/'ledger.json')
recovery=audit['recovery']
phases={name:[p[key] for p in comparison['pairs'] if 'resources' in p[key]]
  for name,key in [('Baseline','baseline'),('Previous A','previousA'),('New A','checkpointA')]}
totals={name:{'models':sum(r['resources']['modelCalls'] for r in rows),
  'elapsedMs':sum(r['resources']['elapsedMs'] for r in rows),
  'planningCalls':sum(r['planningCallCount'] for r in rows),
  'planningMs':sum(r['planningLatencyMs'] for r in rows),
  'planningTimeouts':sum(r['planningTimeouts'] for r in rows),
  'tabelogListing':sum(r['witnessInListingBySource'].get('tabelog',False) for r in rows),
  'tabelogFirstBatch':sum(r['witnessInFirstBatchBySource'].get('tabelog',False) for r in rows),
  'tablecheckListing':sum(r['witnessInListingBySource'].get('tablecheck',False) for r in rows),
  'tablecheckFirstBatch':sum(r['witnessInFirstBatchBySource'].get('tablecheck',False) for r in rows),
  'googleExactListing':sum(r['witnessInListingBySource'].get('google-places',False) for r in rows)} for name,rows in phases.items()}
flags=lambda r,s:str(int(r['witnessInListingBySource'].get(s,False)))+','+str(int(r['witnessInFirstBatchBySource'].get(s,False)))
yn=lambda v:str(int(bool(v)))
text=['# P2-1a DOM-corrected checkpoint A','',
 'Evidence: exposed development discovery only; no full Live, availability, qualification or delivery acceptance.','',
 f"Status **{audit['status']}**: {audit['formalProbes']}/10 recorded; stop={audit['stop']}. Production `{comparison['checkpointAHead']}`; baseline `{comparison['baselineHead']}` unchanged. Previous A209ac42 is retained separately. Correction ba20b8a; replay preparation4017981; outer freeze recorded in Git and freeze.json.",
 '', '## Fixed controls and proof scope','',
 'The 14 single-decision offline model replays passed the predeclared gate: h001, Kichijoji and Nakameguro selected related supplied categories (3 distinct cases; required2). Only6 had exact recorded DOM;7 used later same-region DOM and1 had a DOM evidence gap. Those are counterfactual inputs, not faithful browser session replay. See ../p21a-dom-replay-20261019/report.md.',
 '', 'This new A uses the same ten ordered inputs, center/radius, source preflight and witness bytes as baseline. Existing certification remains valid through at least2026-10-20T03:12:46.141Z;0 recertification requests. Six plan-only runs and external stop/resume controls passed with0 network/models. Initial318 source/config/script SHA hashes were frozen before requests. The approved outer-only recovery below is the sole mid-batch configuration change; production is unchanged and no formal probe was retried. Each probe15 models/180s, source90s; plan and raw config are authoritative.',
 '', 'The source ancestry contains the prior separately committed Google-only nearby fix ea7113a; this ten-case plan uses the native three-source assembly. Original A raw trace already had Google text queries; URL placeholders in retrieval metrics are not transport evidence and do not establish the alleged nearby regression. See raw googleActualTransport in comparison.json.',
 '', 'Five source gates: typecheck/arch/build PASS,943/943 default tests,117/117 actual local Chromium. Effective changes are DOM category exposure (same Pack grammar and region), Prompt@3/attempt history and bounded duplicate rejection. Schema@1, Guard permissions and qualification remain unchanged. L0/L1 fixture proof, offline L3 decision feasibility, and live read-only discovery are separate.',
 '', '## Aggregate observations','',
 '| Metric | Baseline | Previous A | New A |','| --- | --- | --- | --- |',
 *['| '+key+' | '+' | '.join(str(totals[name][key]) for name in phases)+' |' for key in totals['Baseline']],
 '', 'These are exposed paired development observations, not causal labels or delivery rates. Tabelog first-batch witness hits increase from3 to5 against the previous A; TableCheck remains0. KF-H005 still has no native first-batch witness, and both Kagurazaka runs retain READ_BUDGET_EXCEEDED. H002 has fewer in-radius parsed candidates (baseline30 -> new10). New A formal wall time is below the previous A but above baseline; preflight and approval pause are excluded. All deficits remain visible for independent review.',
 '', '## Paired source/list/radius facts','',
 'Cells show **baseline -> previous A -> new A**. Native cells are listing,first-batch booleans. Google listing requires an exact observed website source ID; similar names do not count. Listing includes broad region-navigation observations, so listing hits do not by themselves prove effective final retrieval. Radius counts are parsed coordinates, including Google candidates, not qualified/deduplicated restaurants.','',
 '| Case / repeat | Tabelog list,first | TableCheck list,first | Google exact listing | In-radius count |',
 '| --- | --- | --- | --- | --- |']
for pair in comparison['pairs']:
    records=[pair['baseline'],pair['previousA'],pair['checkpointA']]
    if 'resources' not in records[-1]:
        text.append(f"| {pair['caseId']} / {pair['repeat']} | NE | NE | NE | NE |");continue
    cells=[' -> '.join(flags(r,s) for r in records) for s in ['tabelog','tablecheck']]
    cells+=[' -> '.join(yn(r['witnessInListingBySource'].get('google-places')) for r in records),' -> '.join(str(r['inRadiusParsed']) for r in records)]
    text.append('| '+f"{pair['caseId']} / {pair['repeat']}"+' | '+' | '.join(cells)+' |')
text+=['','## Paired resource facts','',
 'Time is formal wall time; preflight is separate. Planning uses actual captured model latencies, including failures. Shared initial text planning is counted once.','',
 '| Case / repeat | Models B / old A / new A | Elapsed ms | Pages | Planning calls / ms | Planning timeouts |',
 '| --- | --- | --- | --- | --- | --- |']
for pair in comparison['pairs']:
    rs=[pair['baseline'],pair['previousA'],pair['checkpointA']]
    if 'resources' not in rs[-1]:continue
    cells=[' / '.join(str(r['resources']['modelCalls']) for r in rs),' / '.join(str(r['resources']['elapsedMs']) for r in rs),
      ' / '.join(str(r['pages']) for r in rs),' ; '.join(f"{r['planningCallCount']}/{r['planningLatencyMs']}" for r in rs),
      ' / '.join(str(r['planningTimeouts']) for r in rs)]
    text.append('| '+f"{pair['caseId']} / {pair['repeat']}"+' | '+' | '.join(cells)+' |')
text+=['','## Per-run retrieval and raw artifacts','',
 'Full accepted/rejected selection history, all source sequences (keyword/category/count), planning input category counts and reasons, actual Google continuation transport and precise hashes are in comparison.json. Old parser metric nulls are retained beside actual source funnel records. No old artifact is overwritten.']
for row in audit['rows']:
    text+=['',f"### {row['index']}: {row['caseId']}",'',
      f"Failures {json.dumps(row['failureCodes'])}; termination `{row['terminationReason']}`; unattempted {json.dumps(row['unattemptedSourceIds'])}; per-source parsed radius counts {json.dumps(row['inRadiusBySource'])}.",'']
    for source,data in row['sourceRetrieval'].items():
        history=(data.get('retrieval') or {}).get('history',[])
        sequence=[{'url':r.get('url'),'keyword':r.get('keyword'),'category':r.get('categoryLabel'),'parsed':r.get('parsedCount'),'total':r.get('displayedTotal')}
          for r in row['retrievalAttempts'] if r['sourceId']==source]
        text.append(f"- {source}: planning {data['callCount']} calls / {data['latencyMs']}ms / {data['timeouts']} timeouts; source elapsed {data['sourceElapsedMs']}ms; accepted/rejected history {json.dumps(history,ensure_ascii=False)}")
        text.append(f"  Retrieval observations: {json.dumps(sequence,ensure_ascii=False)}")
    for call in row['planningCalls']:
        text.append(f"- Decision#{call['sequence']} {call['source']}: parsed={call['parsedCount']}, categories={call['categoryCount']}; {json.dumps(call['proposal'],ensure_ascii=False)}")
    for key in ['summary','decisions','trace','recording']:
        path=Path(row[key]);text.append(f"- {key}: [{path.name}]({os.path.relpath(path,out)}), SHA-256 `{row[key+'Sha256']}`")
text+=['','## Preflight, safety and usage','',
 '| Index | Start UTC | Status | Counted preflight failure | Preflight Google |',
 '| --- | --- | --- | --- | --- |']
for item in ledger['attempts']:
    reclassified=next((c for c in ledger.get('reclassifications',[]) if str(Path(c['rawResult']).parent)==item['directory']),None)
    counted='True (approved NO_RESPONSE/503)' if reclassified else str(item.get('countsTowardStop',False))
    text.append(f"| {item['index']} | {item['startedAt']} | {item['status']} | {counted} | {item.get('preflightGoogle',0)} |")
text+=['',f"New A: **{audit['modelCalls']} models**, {audit['googleFormal']} formal + {audit['googlePreflight']} preflight Google; {audit['formalProbes']} discovery probes; {audit['effectiveCountedPreflightFailures']} counted preflight failures. Captured outcomes {json.dumps(audit['decisionOutcomes'])}. Cumulative **{audit['cumulativeModels']}/450 models, {audit['cumulativeProbes']}/42 probes, {audit['cumulativeGoogle']} Google,0 full Live**. Offline replay14 calls is already included in the212-model origin.",
 '',f"All recorded source/capture counters and frozen hashes verified; clean worktree verified; {audit['historicalImmutableFilesChecked']} historical files byte-identical. Raw independent boundary assessment by run: {json.dumps({r['index']:r['boundary']['status'] for r in audit['rows']})}. Unknown GET side effects are not inferred safe; missing independent evidence remains NOT_EVALUATED.",
 '', '## Approved outer recovery and unchanged completed probes','',
 'The first attempt for index5 (KF-H005 repeat2) failed before any model/formal probe: the early network-readiness GET to the TableCheck homepage returned HTTP503/TLS established. The source-result preflight had not run. The original outer looked only for the later source preflight and stopped as PREFLIGHT_EVIDENCE_GAP. The original response and ledger are preserved. This is not a claim that a restaurant search returned an empty result, or a VPN root-cause diagnosis.',
 '',f"The human approved the exact outer-only patch.13/13 offline controls reran PASS,0 model/network calls. Recovery freeze commit `b0d15d3`; outer SHA256 `{recovery['outerSha256']}`; freeze SHA256 `{recovery['freezeSha256']}`. {recovery['frozenFilesChecked']} frozen files verified, including all {recovery['firstFiveFilesUnchanged']} original files of completed indices0-4. Those five formal probes were not rerun.",
 '',f"The recorded503 is appended as1 countable NO_RESPONSE with original SHA, and the existing one preflight-only retry is used. Remaining completed indices: {recovery['completedRemainingIndices']}. New resource use since approval: {recovery['newModelsAfterApproval']} model calls and {recovery['newGoogleAfterApproval']} Google requests. Source ba20b8a, plan/input/witness bytes, budgets, network policy and S0/stop thresholds are unchanged.",
 '', 'Evidence: [approved application](recovery/approval-and-application.json), [13 controls](recovery/offline-controls.approved.json), [new freeze](recovery/freeze.json), [old ledger snapshot](recovery/ledger.before.json), [raw503](recovery/network-preflight.raw.json). The earlier partial report is preserved byte-for-byte in recovery/partial-report.before-resume.md. Its relative links retain their original report context.',
 '', '## Evaluation layers and next decision','',
 '1. End-to-end outcome: NOT_EVALUATED, because this is discovery-only. No availability/qualification/delivery claim.',
 '2. Component: exact source witness funnel and raw region/retrieval/radius/performance records above. Broad navigation hits and final retrieval hits are distinct.',
 '3. Severity: independent frozen network rule assessment retained per run. S0 declaration and task-level S1-S4 are not evaluated by the discovery probe.',
 '4. Attribution: raw inputs/proposals/history/failure codes are supplied for independent review, not a causal success label. Single-step replay proves only supplied-category choice. Two repeats per TARGET and exposed fixtures do not establish generalization.',
 '', 'Stop here after reporting and authorized push; do not begin P2-1b, additional probes or full Live. If this A still has no improvement, the user decides the next scope under the existing stopping rule.','']
(out/'report.md').write_text('\n'.join(text))
aggregate={'runs':len(audit['rows']),'models':audit['modelCalls'],'elapsedMs':sum(r['resources']['elapsedMs'] for r in audit['rows']),
 'planningCalls':sum(r['planningCallCount'] for r in audit['rows']),'planningMs':sum(r['planningLatencyMs'] for r in audit['rows']),
 'planningTimeouts':sum(r['planningTimeouts'] for r in audit['rows']),
 'pageBoundCategoryCounts':[c['categoryCount'] for r in audit['rows'] for c in r['planningCalls'] if c['url']],
 'listing':{s:sum(r['witnessInListingBySource'].get(s,False) for r in audit['rows']) for s in ['tabelog','tablecheck','google-places']},
 'firstBatch':{s:sum(r['witnessInFirstBatchBySource'].get(s,False) for r in audit['rows']) for s in ['tabelog','tablecheck']},
 'failures':dict(Counter(code for r in audit['rows'] for code in r['failureCodes']))}
(out/'aggregate.json').write_text(json.dumps(aggregate,indent=2)+'\n')
print(json.dumps(aggregate))
