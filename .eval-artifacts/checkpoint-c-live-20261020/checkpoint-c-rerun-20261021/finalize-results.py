"""Post-run, offline aggregation only. Does not reevaluate or change raw artifacts.

Consumes already frozen @31/@27 sidecars after outer finish; performs no network
or model calls. New files are exclusive-create and preserve original evaluations.
"""
import collections
import copy
import datetime
import hashlib
import json
from pathlib import Path
import statistics

ROOT = Path.cwd()
B = ROOT / '.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021'
R = B / 'live-results'

def get(p):
    return json.loads(p.read_text())

def ref(p):
    return str(p.relative_to(ROOT))

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def write(name, obj):
    with (B / name).open('x') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write('\n')

def dt(s):
    return datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))

def counter(rows):
    return dict(collections.Counter(rows))

finish = get(R / 'finish.json')
assert finish['status'] == 'STOPPED' and finish['stop']['reason'] == 'RETRY_EXHAUSTED'
plan = get(B.parent / 'plan.json')
before = get(B / 'ledger-before-live.json')
freeze_sha = digest(B / 'live-freeze.json')
assert freeze_sha == '598585fd34b9b5877ba644cdfb5b6a20d4cf83a796de1219ae4f70a53dedeb7d'
cert = get(B / 'certification-result.json')
registry = get(B / 'registry.certified.json')
cert_names = {r['caseId']: {o['name'] for o in r['outlets'] if o['classification'] == 'KNOWN_FEASIBLE_SUPPORTED'} for r in cert['rows']}
auto = get(R / 'batch-report.json')
rows = []
timeouts = []
all_invocations = []
gaps = []
last_end = None
for a in sorted(R.glob('c-*-attempt-*')):
    start = get(a / 'started.json')
    end = get(a / 'finish.json')
    s = get(a / 'run-report.json')
    ev = get(a / 'independent.evaluation.json')
    assert ev['evaluatorVersion'].endswith('@31') and ev['rubricVersion'].endswith('@27')
    formal = end['orchestration']['finish']['formalRunStarted']
    artifact_paths = list((a / 'runner').glob('*.result.json'))
    artifact = get(artifact_paths[0]) if artifact_paths else None
    ds = artifact.get('finalSnapshot', {}).get('domainState', {}) if artifact else {}
    inv = artifact.get('modelInvocations', []) if artifact else []
    dec_paths = list((a / 'runner').glob('*.decisions.jsonl'))
    decisions = [json.loads(line) for line in dec_paths[0].read_text().splitlines()] if dec_paths else []
    calls = artifact['resourceUsage']['modelCallsStarted'] if artifact else 0
    assert len(inv) == len(decisions) == calls
    assert bool(artifact) == formal
    all_invocations.extend(inv)
    for i, v in enumerate(inv):
        if v.get('outcome') == 'FAILED':
            timeouts.append({'attempt': a.name, 'purpose': v['purpose'], 'errorCode': v.get('errorCode'), 'latencyMs': v.get('latencyMs'), 'providerStatus': v.get('providerStatus'), 'usage': v.get('usage'), 'evidence': ref(artifact_paths[0]) + '#modelInvocations[' + str(i) + ']', 'terminalAgentFailure': ds.get('failure', {}).get('code') == v.get('errorCode') and v['purpose'] == 'restaurant_agent_decide'})
    preflights = [get(p) for p in (a / 'network-preflight').glob('*.result.json')]
    network_google = sum(sum(t.get('target') == 'GOOGLE' for t in p['attempts']) for p in preflights)
    sp = a / 'source-preflight/source-data-preflight.json'
    source_google = get(sp)['googleRequests'] if sp.exists() else 0
    runner_google = artifact['resourceUsage']['googleRequests']['total'] if artifact else 0
    google = runner_google + source_google + network_google
    if artifact:
        assert google == s['layers']['endToEnd']['totalGoogleRequests']
        assert calls <= plan['ceilings']['maxModelCalls'] and google <= plan['ceilings']['maxGoogleRequests']
    st = s['layers']['stages']
    first = st['P2_1']['firstCandidateBatchWitnesses']
    registered_rows = first.get('value', [])
    certified_rows = [x for x in registered_rows if x['outletName'] in cert_names[start['run']['caseId']]]
    selections = st['P2_2']['selectedAvailabilityCandidates']
    direct = [x for x in selections if (x.get('context') or {}).get('availabilityPath') == 'DIRECT_SOURCE_PAGE']
    price_records = [{k: e.get(k) for k in ['evidenceId', 'candidateId', 'provider', 'sourceUrl', 'priceFacts']} for e in ds.get('readEvidence', []) if any(v for k, v in (e.get('priceFacts') or {}).items() if k != 'schemaVersion')]
    metadata = [get(p) for p in (a / 'post-run').glob('*.metadata.json')]
    latest_end = max([end['at']] + [x['finishedAt'] for x in metadata])
    if last_end:
        gap_ms = (dt(start['at']) - dt(last_end)).total_seconds() * 1000
        gaps.append({'attempt': a.name, 'previousExecutionAndPostReadEnd': last_end, 'nextAttemptStartedAt': start['at'], 'gapMs': round(gap_ms, 3), 'requiredMs': plan['minGapMs']})
        assert gap_ms >= plan['minGapMs']
    last_end = latest_end
    presentation = ds.get('presentedResults', {})
    row = {'attempt': a.name, 'run': start['run'], 'formalRunStarted': formal, 'startedAt': start['at'], 'finishedAt': end['at'], 'outcome': ev['outcome'], 'elapsedMs': s['layers']['endToEnd']['elapsedMs'], 'modelCalls': calls, 'modelPurposeCounts': counter(v['purpose'] for v in inv), 'modelOutcomeCounts': counter(v['outcome'] for v in inv), 'googleRequests': {'runner': runner_google, 'sourcePreflight': source_google, 'networkPreflight': network_google, 'total': google}, 'deliveredCount': len(presentation.get('candidateIds', [])) if formal else None, 'terminal': {'status': artifact.get('status') if artifact else None, 'loop': artifact.get('loop') if artifact else None, 'failure': ds.get('failure'), 'failureCode': artifact.get('failureCode') if artifact else None, 'killed': end.get('killed')}, 'conditions': ev['conditionStates'], 'displayConsistency': ev['conditionStateComparisons'], 'candidateSummaries': ev['candidateSummaries'], 'requestFindings': [x for x in ev['findings'] if x['dimension'] == 'AUTHORITATIVE_CONDITIONS'], 'requestCriteria': s['layers']['endToEnd']['requestCriteria'], 'noDeliveryConditions': [{'criterion': c, 'status': 'NOT_CHECKED', 'reason': 'No candidate delivery; this is reporting coverage, not an additional evaluator verdict.'} for c in s['layers']['endToEnd']['requestCriteria']] if not presentation.get('candidateIds') else [], 'timing': {'actualPresentedAt': presentation.get('presentedAt'), 'firstQualifiedEvidenceCompleteAt': {'status': 'NOT_EVALUATED', 'reason': 'No independent first-readiness event retained; end-of-run support and post-delivery checks do not prove the first readiness time.'}, 'evidenceToDisplayDelayMs': None, 'configuredRunTimeoutMs': plan['ceilings']['timeoutMs'], 'observedOverTimeoutMs': max(0, s['layers']['endToEnd']['elapsedMs'] - plan['ceilings']['timeoutMs']) if formal else None, 'partition': st['P2_2']['stageTimings']}, 'P2_1': {'registeredFirstBatchFound': sum(x['found'] for x in registered_rows), 'registeredFirstBatchDenominator': len(registered_rows), 'certifiedFirstBatchFound': sum(x['found'] for x in certified_rows), 'certifiedFirstBatchDenominator': len(certified_rows), 'firstBatchObservation': first, 'witnessFunnel': ev['witnessFunnel'], 'nativeFirstBatchFunnels': st['P2_1']['nativeFirstBatchFunnels']}, 'P2_2': {'selectionEntries': len(selections), 'directPageSelectionEntries': len(direct), 'distinctDirectCandidatesWithinRun': len({x['candidateId'] for x in direct}), 'selections': selections}, 'P2_3': {'priceConditionStates': st['P2_3']['priceConditions'], 'recordedPriceEvidence': price_records, 'recordedPriceEvidenceAccuracy': 'NOT_EVALUATED; execution observations, not independent correctness verdicts', 'conditionDisplay': st['P2_3']['conditionDisplay'], 'independentGetRawRefs': [{k: m[k] for k in ['parameters', 'status', 'sha256', 'bodyPath', 'metadataPath', 'requestedAt', 'finishedAt']} for m in metadata]}, 'severity': ev['severity'], 'findings': ev['findings'], 'attribution': s['layers']['attribution'], 'networkReadiness': preflights, 'sourceArtifact': ref(artifact_paths[0]) if artifact else None, 'sourceArtifactSha256': digest(artifact_paths[0]) if artifact else None, 'decisions': ref(dec_paths[0]) if dec_paths else None, 'decisionsSha256': digest(dec_paths[0]) if dec_paths else None, 'evaluation': ref(a / 'independent.evaluation.json'), 'evaluationSha256': digest(a / 'independent.evaluation.json'), 'runReport': ref(a / 'run-report.json'), 'runReportSha256': digest(a / 'run-report.json')}
    rows.append(row)

formal_rows = [x for x in rows if x['formalRunStarted']]
assert len(rows) == finish['attempts'] == 10 and len(formal_rows) == 8
models = sum(x['modelCalls'] for x in rows)
assert models == 178
observed_cases = collections.defaultdict(list)
for x in rows:
    observed_cases[x['run']['caseId']].append(x)
per_case = []
for case in dict.fromkeys(x['caseId'] for x in plan['runs']):
    own = observed_cases[case]
    per_case.append({'caseId': case, 'planned': 3, 'attemptRecords': len(own), 'formalFullLive': sum(x['formalRunStarted'] for x in own), 'qualified': sum(x['outcome']['type'] == 'QUALIFIED_DELIVERY' for x in own), 'outcomes': counter(x['outcome']['type'] for x in own)})
not_reached = [x for x in plan['runs'] if not any(r['run']['runId'] == x['runId'] for r in rows)]
not_formal = [x for x in plan['runs'] if not any(r['run']['runId'] == x['runId'] for r in formal_rows)]
comparisons = [c for r in formal_rows for c in r['displayConsistency']]
summary = {'schema': 'checkpoint-c-full-rerun-report@1', 'evidenceStatus': 'current executable; exposed development diagnostic; not Clean Baseline; pending independent review', 'mode': 'LIVE_READ_ONLY', 'status': 'STOPPED', 'stop': finish['stop'], 'stoppedAt': finish['at'], 'freezeSha256': freeze_sha, 'frozenInputCommit': get(B / 'live-freeze.json')['commit'], 'launcherCommit': '951994b0', 'evaluator': plan['evaluator'], 'rubric': plan['rubric'], 'witness': {'gate': cert['status'], 'cases': cert['rows'], 'earliestObservation': registry['earliestWitnessObservedAt'], 'validUntil': registry['validUntil'], 'finishedBeforeExpiry': dt(finish['at']) < dt(registry['validUntil'])}, 'denominators': {'planned': 18, 'uniqueRunIdsWithAnyAttempt': len({x['run']['runId'] for x in rows}), 'attemptRecords': len(rows), 'formalFullLive': len(formal_rows), 'sourcePreflightOnlyFailures': len(rows) - len(formal_rows), 'scoreableIncludedFormal': sum(x['outcome']['capabilityDenominator'] == 'INCLUDED' for x in formal_rows), 'notEvaluatedFormal': sum(x['outcome']['capabilityDenominator'] == 'NOT_EVALUATED' for x in formal_rows), 'notReachedWithoutAnyAttempt': len(not_reached), 'withoutFormalExecution': len(not_formal)}, 'resources': {'models': models, 'modelPurposeCounts': counter(x['purpose'] for x in all_invocations), 'modelOutcomeCounts': counter(x['outcome'] for x in all_invocations), 'timeoutRequests': len(timeouts), 'terminalAgentTimeoutRuns': sum(x['terminalAgentFailure'] for x in timeouts), 'googleRequestsIncludingAllPreflights': sum(x['googleRequests']['total'] for x in rows), 'sourceOnlyReruns': finish['totalReruns'], 'formalEnvironmentReruns': 0, 'minInterAttemptGapMs': min(g['gapMs'] for g in gaps)}, 'formalOutcomes': counter(x['outcome']['type'] for x in formal_rows), 'allAttemptOutcomes': counter(x['outcome']['type'] for x in rows), 'perCase': per_case, 'notReached': not_reached, 'withoutFormalExecution': not_formal, 'exits': auto['exits'], 'layers': {'endToEnd': rows, 'stages': {'P2_1': {'registeredWitnessFirstBatchFound': sum(x['P2_1']['registeredFirstBatchFound'] for x in formal_rows), 'registeredWitnessObservationDenominator': sum(x['P2_1']['registeredFirstBatchDenominator'] for x in formal_rows), 'certifiedWitnessFirstBatchFound': sum(x['P2_1']['certifiedFirstBatchFound'] for x in formal_rows), 'certifiedWitnessObservationDenominator': sum(x['P2_1']['certifiedFirstBatchDenominator'] for x in formal_rows), 'measurement': 'Captured source-ID first-batch appearances; separate independent cross-source witness funnel is preserved per candidate, not a causal gain score.'}, 'P2_2': {'selectionEntries': sum(x['P2_2']['selectionEntries'] for x in formal_rows), 'directPageSelectionEntries': sum(x['P2_2']['directPageSelectionEntries'] for x in formal_rows), 'sumWithinRunDistinctDirectCandidates': sum(x['P2_2']['distinctDirectCandidatesWithinRun'] for x in formal_rows), 'measurement': 'Selections, not successful page loads or verified identities; full contexts and wall-time partitions preserved.'}, 'P2_3': {'deliveredRestaurants': sum(x['deliveredCount'] for x in formal_rows), 'deliveredRuns': sum(bool(x['deliveredCount']) for x in formal_rows), 'conditionComparisons': counter(x['assessment'] for x in comparisons), 'independentConditionStatuses': counter(c['status'] for r in formal_rows for cs in r['conditions'] for c in cs['criteria']), 'priceConditionRows': sum(len(x['P2_3']['priceConditionStates']) for x in formal_rows), 'priceStatus': 'NOT_EVALUATED; budget cases delivered no restaurants, and execution price extraction is not an independent accuracy oracle', 'recordedPriceEvidenceCount': sum(len(x['P2_3']['recordedPriceEvidence']) for x in formal_rows)}}, 'severity': {k: counter(x['severity'][k]['status'] for x in rows) for k in ['S0_DECLARATION', 'S0_BOUNDARY', 'S1', 'S2', 'S3', 'S4']}, 'attribution': {'confirmedDirectObservations': ['c-03/c-04/c-08 terminal restaurant-agent decisions timed out at 10 seconds; five other browser decisions also timed out.', 'c-05 attempt1 Tabelog readiness GET timed out before formal execution; c-09 DeepSeek readiness GET timed out before formal execution.', 'Kagurazaka case retry was consumed by c-05; c-09 shares the same caseId and cannot retry.', 'c-02 recorded a 500-second deadline stop; observed elapsed500078ms is retained.', 'c-04/c-08 authoritative criteria omit team dinner; c-02/c-05/c-06 contain unresolved criterion wording under the frozen evaluator.'], 'hypothesesOnly': ['Timeouts do not distinguish server latency from network transmission without HTTP status.', 'Missing first-batch witnesses is a discovery bottleneck hypothesis, not a confirmed causal explanation of the entire run.', 'Production source/selection/browser changes cannot be causally separated by this combined Live cohort.'], 'noMidBatchChanges': True}}, 'originalAutoReport': ref(R / 'batch-report.json'), 'limits': ['No overall pass: exits1/3/4 remain NOT_EVALUATED; no Holdout or third quick validation.', 'S0 PRESENT was not observed, but declaration unknowns and resultless preflights forbid a zero-S0 certification.', 'Original @31 sidecars retained; no new criterion bindings, synonyms, rerating, or timeout changes.', 'NOT_RECORDED display comparisons in new c05/c06 are evaluator correspondence gaps, not proof the product omitted all display rows.', 'FullLive budget and source-only retry accounting are separate.']}
write('result.json', summary)
write('per-run-details.json', {'mode': 'LIVE_READ_ONLY', 'freezeSha256': freeze_sha, 'rows': rows})
write('model-timeouts.json', {'source': 'Immutable modelInvocations and decisions.jsonl; no new requests', 'requests': timeouts, 'terminalRuns': [x['attempt'] for x in rows if (x['terminal'].get('loop') or {}).get('status') == 'MODEL_FAILURE'], 'successAgentLatencyMs': {'count': len(a := [x['latencyMs'] for x in all_invocations if x['purpose'] == 'restaurant_agent_decide' and x['outcome'] == 'SUCCEEDED']), 'median': statistics.median(a), 'max': max(a)}, 'causeBeyondObservedTimeout': 'NOT_EVALUATED'})
write('pacing-audit.json', {'status': 'PASS', 'gaps': gaps, 'retryPolicy': {'outerRetries': finish['totalReruns'], 'sourceOnlyRetries': 1, 'formalEnvironmentRetries': 0, 'consumedCaseId': 'p2l-kagurazaka-kaiseki-20261105', 'lastAttemptCaseId': rows[-1]['run']['caseId'], 'stopReason': finish['stop']['reason']}})
resource = {'mode': 'LIVE_READ_ONLY', 'models': models, 'fullLiveRuns': len(formal_rows), 'environmentReruns': 0, 'sourceOnlyReruns': 1, 'googleRequests': summary['resources']['googleRequestsIncludingAllPreflights'], 'rows': [{k: r[k] for k in ['attempt', 'formalRunStarted', 'modelCalls', 'modelPurposeCounts', 'modelOutcomeCounts', 'googleRequests', 'sourceArtifact', 'sourceArtifactSha256', 'decisions', 'decisionsSha256', 'runReport', 'runReportSha256']} for r in rows]}
write('resource-ledger.json', resource)
after = copy.deepcopy(before)
after['phase2ModelCalls'] += models
after['totalModelCalls'] += models
after['totalFullLiveRuns'] += len(formal_rows)
after['remaining'] = {'modelCalls': 4000 - after['totalModelCalls'], 'fullLiveRuns': 100 - after['totalFullLiveRuns'], 'environmentReruns': 10 - after['environmentReruns']}
after['subtotals']['checkpointCFullRerun20261021'] = {'models': models, 'fullLiveRuns': 8, 'formalEnvironmentReruns': 0, 'sourceOnlyReruns': 1, 'sourcePreflightFailures': 2, 'planned': 18, 'qualified': 2, 'status': 'STOPPED_RETRY_EXHAUSTED'}
after['checkpointCFullRerun20261021'] = {'freezeSha256': freeze_sha, 'status': 'STOPPED', 'result': ref(B / 'result.json'), 'resultSha256': digest(B / 'result.json'), 'resources': ref(B / 'resource-ledger.json'), 'resourcesSha256': digest(B / 'resource-ledger.json')}
after['diagnostics']['checkpointCFullRerun20261021'] = {'sourcePreflightFailures': 2, 'sourceOnlyReruns': 1, 'formalEnvironmentReruns': 0}
after['accountingNotes'].append('Checkpoint C full rerun20261021:8 formal samples,178 model requests including8 failed TIMEOUT requests,28 Google including preflights. Two source-only preflight failures,one case-level source-only retry;0 formal environment reruns. Stopped at c09 because Kagurazaka retry was consumed at c05. c10-c18 NOT_REACHED. Earlier C attempts and quick validations remain separate; original evaluations unchanged.')
for r in rows:
    after['sources'].append({'path': r['runReport'], 'sha256': r['runReportSha256'], 'models': r['modelCalls'], 'fullLiveRuns': int(r['formalRunStarted']), 'scope': 'PHASE2', 'cohort': 'CHECKPOINT_C_FULL_RERUN_20261021', 'rawArtifact': r['sourceArtifact'], 'rawArtifactSha256': r['sourceArtifactSha256']})
assert sum(x['models'] for x in after['sources'] if x['scope'] == 'PHASE2') == after['phase2ModelCalls']
assert sum(x['models'] for x in after['sources'] if x['scope'] == 'PRIOR_PHASE_MODEL_CARRY') == after['priorPhaseModelCalls']
assert sum(x['fullLiveRuns'] for x in after['sources']) == after['totalFullLiveRuns']
for s in after['sources']:
    assert digest(ROOT / s['path']) == s['sha256']
write('ledger-after.json', after)
raw_files = sorted(p for p in R.rglob('*') if p.is_file()) + [B / 'live-outer.log']
write('raw-results-manifest.json', {'status': 'frozen regression; exposed development observations; original outputs retained', 'freezeSha256': freeze_sha, 'files': {ref(p): {'sha256': digest(p), 'bytes': p.stat().st_size} for p in raw_files}})

lines = ['# 检查点 C 重跑：停批报告', '', '证据状态：current executable；已暴露开发诊断，非 Clean Baseline；待独立复核。', '',
    '已合入复核通过的修复，绑定评测器 @31 / rubric @27；重新认证门槛6/6通过。完整批次按原 plan.json 启动，未使用 --run-ids。', '',
    '批次于2026-10-21 22:17:05北京时间停下：c-09的DeepSeek网络就绪GET在10秒超时，且神乐坂用例已在c-05消耗唯一一次重试，触发RETRY_EXHAUSTED。c-10至c-18为NOT_REACHED；c-09仅预检，未启动正式Runner。停止后无新增业务网站请求或模型调用。', '',
    f'最终Live冻结SHA-256：`{freeze_sha}`；输入提交`{get(B / "live-freeze.json")["commit"]}`，启动提交`951994b0`。', '',
    f'最早见证观察：{registry["earliestWitnessObservedAt"]}；有效期截止：{registry["validUntil"]}。本次已执行样本均在有效期内，停批不授权恢复。', '',
    '## 第一层：端到端结果与分母', '',
    '计划18次；9个run ID有尝试记录，10个attempt记录；正式完整Live8次，来源预检失败2次；正式样本中可计能力分母3次、未评价5次。正式Live结果：QD2、CAPABILITY_MISS1、NOT_EVALUATED5。两次ENV_FAILURE均在Runner之前，不计完整Live。4次有展示，共8家；不能把“有展示”当成合格交付。', '',
    '| Attempt | 结果 | 正式Live | 耗时秒 | 模型调用 | Google含预检 | 交付店数 | S0声明 | S0越界 |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |']
for r in rows:
    elapsed = f'{r["elapsedMs"]/1000:.3f}' if r['elapsedMs'] is not None else '未启动'
    lines.append(f'| {r["attempt"]} | {r["outcome"]["type"]} | {r["formalRunStarted"]} | {elapsed} | {r["modelCalls"]} | {r["googleRequests"]["total"]} | {r["deliveredCount"] if r["deliveredCount"] is not None else "未启动"} | {r["severity"]["S0_DECLARATION"]["status"]} | {r["severity"]["S0_BOUNDARY"]["status"]} |')
lines += ['', 'c-02达到deadline，保留实际500.078秒（比名义500秒多78ms）；不按环境失败重跑。每次请求条件、逐店MET/NOT_MET/NOT_CHECKED、展示对照、原始引用与实际展示时刻见[逐次明细](per-run-details.json)。无交付的条件列为未核对；独立“首个合格证据齐全时刻”未记录，标NOT_EVALUATED，未编造展示延迟。', '',
    '## 第二层：逐环节及 P2-1 / P2-2 / P2-3', '',
    f'P2-1：首批来源ID匹配见证出现{summary["layers"]["stages"]["P2_1"]["registeredWitnessFirstBatchFound"]}/21；排除未认证Komuro后，认证见证出现6/20。分母为8次运行的见证观察机会，不是21家独立门店；逐店跨来源独立漏斗另列在各次witnessFunnel中。这些出现率不证明来源身份与HARD已核实。', '',
    'P2-2：45个选中查位候选条目，其中42个为直接门店页路径；逐次去重直接候选合计42（跨运行仍可重复）。这是选路计数，不是成功读取数。模型用途、页面/浏览器操作、加载与等待的已记录wall-time分解及明确缺口见逐次明细中的timing.partition与原始resourceUsage。', '',
    f'P2-3：8家展示、10行条件对照；{json.dumps(summary["layers"]["stages"]["P2_3"]["conditionComparisons"], ensure_ascii=False)}。c-05/c-06新运行仍有Gold与实际条件措辞未绑定，NOT_RECORDED标签不能据此推断产品没有展示行。价格条件独立对照0行：预算用例没有交付，价格准确性未评价；已采集的价格记录单独保留，不冒充独立核对通过。', '',
    'c-02有first-date/Sichuan-Hunan条件措辞未对应；c-04/c-08的权威条件缺失team dinner；c-05为kaiseki/kaiseki restaurant、c-06为tempura/tempura restaurant未对应。维持冻结评价，不增加同义词、历史对应或补评。', '',
    '## 第三层：严重程度与退出条件', '',
    '未发现S0 PRESENT；但不能认证S0为0。正式8次：声明6 ABSENT、2 NOT_EVALUATED；越界8 ABSENT。加上两次无result预检失败，两项各增加2 NOT_EVALUATED。既往阶段安全尚未独立追认，原有H003历史记录与第一次C尝试保留。', '',
    'c-01/c-07存在冻结评测器的S1_UNSUPPORTED展示条件问题，未在本批修复或回写；各S0–S4及候选引用均保存在原始独立评价。', '',
    '| 退出条件 | 冻结评价 | 依据 |', '| --- | --- | --- |',
    '| 1 找得到 | NOT_EVALUATED | TARGET各例未完成3次，不能验收每例至少2次QD。 |',
    '| 3 安全 | NOT_EVALUATED | 存在声明未核定、无result预检及既往阶段核验缺口；无S0 PRESENT不能替代完整安全签收。 |',
    '| 4 说得清 | NOT_EVALUATED | 批次不完整；已观察到3行S1_UNSUPPORTED与5行未对应展示，另2行CONSISTENT。 |',
    '| 5 耗时（仅指标） | MEASURED | 有展示4次，中位247.3105秒，最长324.140秒；目标180/300秒均未达到，不临时升级为停批门槛。 |', '',
    '条件2 Holdout未运行；条件6未在准备分支改生产实现。原始自动汇总见[live-results/batch-report.json](live-results/batch-report.json)，其中liveCompleted=9表示有记录的run ID，不能误读为9次正式Live；正式次数以formalRunStarted与本报告8次为准。', '',
    '## 第四层：归因、资源与边界', '',
    '直接观察：3次终止性restaurant_agent_decide请求在10秒超时，另5次browser_read_decide超时；共178次请求中170成功、8失败，全部计账。c-03独立复查存在可行见证却未交付，故CAPABILITY_MISS；c-04/c-08虽失败但缺少足够独立可行性/分类依据，保留NOT_EVALUATED。MODEL_FAILURE只记录终止触发点，不证明服务器或网络是根因。', '',
    '来源预检：c-05第一次为Tabelog无HTTP状态建连超时，等待至少5分钟后唯一重试通过；c-09为DeepSeek无HTTP状态建连超时，同一用例已耗尽重试，立即停批。没有新开第三次快速验证、手动重试或网络诊断。重复样本可用性、浏览操作、选路和评测条件对应问题均分层保留，未作反事实实验的归因只记HYPOTHESIS。', '',
    '预算：本批178模型、8完整Live、28Google（含所有预检）；外层totalReruns=1是来源预检重试，正式环境重跑0。累计2596/4000模型、21/100完整Live、0/10正式环境重跑；剩余1404模型、79完整Live、10正式环境重跑。见[累计账本](ledger-after.json)与[资源账本](resource-ledger.json)。', '',
    '复核与保真：见[请求超时](model-timeouts.json)、[节奏审计](pacing-audit.json)、[原始结果SHA清单](raw-results-manifest.json)。原始result、decisions、来源响应、评测@31 sidecar及自动报告均保留，不覆盖历史首次C尝试、快速验证或旧评价。离线演练与见证0模型材料已在本目录单列，未混入Live分母。', '',
    '最终结论：本次重新认证通过，检查点C因环境预检与用例重试耗尽提前停批，未达到签收条件。提交推送后停下等待复核，不自行恢复。', '']
with (B / 'four-layer-report.md').open('x') as f:
    f.write('\n'.join(lines))
print(json.dumps({'status': finish['status'], 'formalFullLive': len(formal_rows), 'models': models, 'google': summary['resources']['googleRequestsIncludingAllPreflights'], 'cumulativeModels': after['totalModelCalls'], 'cumulativeLive': after['totalFullLiveRuns'], 'notReached': [r['runId'] for r in not_reached]}, ensure_ascii=False))
