"""Run once from the repository root after the outer process exits.

Offline aggregation only: no reevaluation, source requests or models. Existing
derived outputs are never overwritten.
"""
from pathlib import Path
import collections, copy, hashlib, json, datetime, statistics
ROOT=Path.cwd()
POST_SCRIPT=Path(__file__).resolve()
BASE=ROOT/'.eval-artifacts/checkpoint-c-live-20261020'
OLD=BASE/'checkpoint-c-rerun-20261021'
B=BASE/'checkpoint-c-continuation-20261021'
R=B/'live-results'
def get(p): return json.loads(p.read_text())
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p): return str(p.relative_to(ROOT))
def write(n,d):
 with (B/n).open('x') as f: json.dump(d,f,ensure_ascii=False,indent=2);f.write('\n')
def dt(s): return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
def count(xs): return dict(collections.Counter(xs))
finish=get(R/'finish.json'); auto=get(R/'batch-report.json'); launch=get(B/'launch.json'); plan=get(BASE/'plan.json')
assert finish['status'] in ['STOPPED','COMPLETED']
before=get(B/'ledger-before.json'); frozen=get(B/'live-freeze.json')
assert sha(B/'live-freeze.json')==launch['freezeSha256']
assert all(sha(ROOT/p)==s for p,s in frozen['files'].items())
old_manifest=get(OLD/'raw-results-manifest.json')
assert all(sha(ROOT/p)==v['sha256'] for p,v in old_manifest['files'].items())
all_rows=[];invocations=[];old_calls=0;new_calls=0;new_formal=0;formal_reruns=0;auto_retries=0;source_reentries=0;previous={};raw_files=[];gaps=[];last_end=None
for root,is_new in [(OLD/'live-results',False),(R,True)]:
 raw_files += [p for p in root.rglob('*') if p.is_file()]
 for p in sorted(root.glob('c-*-attempt-*')):
  s=get(p/'run-report.json');e=get(p/'independent.evaluation.json');end=get(p/'finish.json');start=get(p/'started.json');formal=end['orchestration']['finish']['formalRunStarted']
  assert e['evaluatorVersion'].endswith('@31') and e['rubricVersion'].endswith('@27')
  paths=list((p/'runner').glob('*.result.json'));a=get(paths[0]) if paths else None
  assert bool(a)==formal
  decisions=list((p/'runner').glob('*.decisions.jsonl'));dec=[json.loads(x) for x in decisions[0].read_text().splitlines()] if decisions else []
  model=a['resourceUsage']['modelCallsStarted'] if a else 0; inv=a.get('modelInvocations',[]) if a else []
  assert model==len(dec)==len(inv)
  for i,v in enumerate(inv): invocations.append({'attempt':p.name,'isContinuation':is_new,'evidence':ref(paths[0])+'#modelInvocations['+str(i)+']',**{k:v.get(k) for k in ['purpose','outcome','latencyMs','errorCode','providerStatus','usage']}})
  ready=[get(q) for q in (p/'network-preflight').glob('*.result.json')]
  ng=sum(sum(t.get('target')=='GOOGLE' for t in q['attempts']) for q in ready)
  sp=p/'source-preflight/source-data-preflight.json';sg=get(sp)['googleRequests'] if sp.exists() else 0;rg=a['resourceUsage']['googleRequests']['total'] if a else 0
  google=ng+sg+rg
  if formal: assert model<=50 and google<=40
  run=s['run'];same=previous.get(run['runId']);manual=is_new and p.name=='c-09-attempt-2'
  formal_retry=False
  if is_new:
   new_calls+=model;new_formal+=int(formal)
   if same:
    if not manual: auto_retries+=1
    if same['formal']:
     assert same['outcome'] in ['ENV_FAILURE','ORCHESTRATION_INTERRUPTED']
     if formal:formal_reruns+=1;formal_retry=True
    else:source_reentries+=1
  else:old_calls+=model
  previous[run['runId']]={'formal':formal,'outcome':e['outcome']['type']}
  metadata=[get(q) for q in (p/'post-run').glob('*.metadata.json')]
  for m in metadata:
   if 'error' in m:
    assert not any(k in m for k in ['status','bodyPath','sha256'])
   else: assert sha(Path(m['bodyPath']))==m['sha256']
  ended=max([end['at']]+[m['finishedAt'] for m in metadata])
  if last_end:
   ms=round((dt(start['at'])-dt(last_end)).total_seconds()*1000,3);assert ms>=300000;gaps.append({'nextAttempt':p.name,'gapMs':ms})
  last_end=ended
  presented=(a or {}).get('finalSnapshot',{}).get('domainState',{}).get('presentedResults',{})
  row={'attempt':p.name,'isContinuation':is_new,'run':run,'formalRunStarted':formal,'formalEnvironmentRestart':formal_retry,'explicitUserReentry':manual,'outcome':e['outcome'],'elapsedMs':s['layers']['endToEnd']['elapsedMs'],'modelCalls':model,'googleRequests':{'networkReadiness':ng,'sourcePreflight':sg,'runner':rg,'total':google},'deliveredCount':len(presented.get('candidateIds',[])) if formal else None,'presentedAt':presented.get('presentedAt'),'sourceArtifact':ref(paths[0]) if a else None,'sourceArtifactSha256':sha(paths[0]) if a else None,'decisions':ref(decisions[0]) if decisions else None,'decisionsSha256':sha(decisions[0]) if decisions else None,'evaluation':ref(p/'independent.evaluation.json'),'evaluationSha256':sha(p/'independent.evaluation.json'),'runReport':ref(p/'run-report.json'),'runReportSha256':sha(p/'run-report.json'),'severity':e['severity'],'conditions':e['conditionStates'],'displayComparisons':e['conditionStateComparisons'],'requestCriteria':s['layers']['endToEnd']['requestCriteria'],'stages':s['layers']['stages'],'findings':e['findings'],'timingReadiness':{'firstIndependentlyQualifiedEvidenceCompleteAt':'NOT_EVALUATED','evidenceToDisplayDelayMs':None,'reason':'First independent readiness event not retained; source timestamps/postchecks do not prove it.'}}
  row['postChecks']=metadata
  all_rows.append(row)
assert old_calls==178
assert finish['attempts']==len(all_rows) and finish['totalReruns']==2+auto_retries
fresh=[r for r in all_rows if r['isContinuation']]
final=[next((r for r in reversed(all_rows) if r['run']['runId']==q['runId']),None) for q in plan['runs']]
final=[r for r in final if r]
not_reached=[q for q in plan['runs'] if not any(r['run']['runId']==q['runId'] for r in all_rows)]
formal=[r for r in all_rows if r['formalRunStarted']]
comparisons=[x for r in final for x in r['displayComparisons']]
first=[r['stages']['P2_1']['firstCandidateBatchWitnesses'] for r in final if r['formalRunStarted']]
first_observed=[r for r in first if r['status']=='OBSERVED']
direct=[r['stages']['P2_2']['selectedDirectPageCount'] for r in final if r['formalRunStarted']]
price=[x for r in final for x in r['stages']['P2_3']['priceConditions']]
summary={'status':finish['status'],'stop':finish['stop'],'finishedAt':finish['at'],'mode':'LIVE_READ_ONLY','evidenceStatus':'current executable; exposed development diagnostic, not Clean Baseline; pending independent review','evaluator':'restaurant-hybrid-read-diagnostic-evaluator@31','rubric':'restaurant-hybrid-read-diagnostic-rubric@27','executionFreezes':{'original':get(B/'resume.json')['priorFreezeSha256'],'continuation':launch['freezeSha256']},'denominators':{'planned':18,'allAttemptRecords':len(all_rows),'formalFullLiveAttempts':len(formal),'planSlotsWithFinalFormalResult':sum(r['formalRunStarted'] for r in final),'preflightOnlyAttempts':len(all_rows)-len(formal),'finalOutcomeCounts':count(r['outcome']['type'] for r in final),'scoreableFinalIncluded':sum(r['outcome']['capabilityDenominator']=='INCLUDED' for r in final),'finalNotEvaluated':sum(r['outcome']['capabilityDenominator']=='NOT_EVALUATED' for r in final),'notReached':not_reached},'continuationResources':{'models':new_calls,'fullLiveRuns':new_formal,'formalEnvironmentReruns':formal_reruns,'automaticRetries':auto_retries,'sourceOnlyReentriesIncludingExplicit':source_reentries,'explicitUserReentry':1,'googleRequests':sum(r['googleRequests']['total'] for r in fresh)},'combinedResources':{'models':old_calls+new_calls,'fullLiveRuns':len(formal),'googleRequests':sum(r['googleRequests']['total'] for r in all_rows),'outerTotalRerunsIncludingExplicit':finish['totalReruns'],'minGapMs':min(x['gapMs'] for x in gaps)},'exits':auto['exits'],'layers':{'endToEnd':all_rows,'stages':{'P2_1':{'observedRuns':len(first_observed),'unassessedRuns':len(first)-len(first_observed),'firstBatchRegisteredWitnessesFound':sum(x['found'] for r in first_observed for x in r['value']),'witnessObservationDenominator':sum(len(r['value']) for r in first_observed),'interpretation':'Source-ID first-batch appearances; includes registered uncertified Komuro; independent per-outlet witness funnels preserved in each stage report.'},'P2_2':{'directSelectionCount':sum(r['value'] for r in direct if r['status']=='OBSERVED'),'observedRuns':sum(r['status']=='OBSERVED' for r in direct),'unassessedRuns':sum(r['status']!='OBSERVED' for r in direct),'interpretation':'Selected entries, not successful source reads or independent identity judgments; full contexts/timings retained.'},'P2_3':{'deliveredRestaurants':sum(r['deliveredCount'] or 0 for r in final),'conditionComparisons':count(r['assessment'] for r in comparisons),'independentConditionStatuses':count(x['status'] for r in final for c in r['conditions'] for x in c['criteria']),'priceConditions':price,'priceConditionStatuses':count(r['status'] for r in price),'priceAccuracyOutsideExistingIndependentRows':'NOT_EVALUATED'}},'severity':{'allAttempts':{k:count(r['severity'][k]['status'] for r in all_rows) for k in ['S0_DECLARATION','S0_BOUNDARY','S1','S2','S3','S4']},'formalAttempts':{k:count(r['severity'][k]['status'] for r in formal) for k in ['S0_DECLARATION','S0_BOUNDARY']}},'attribution':{'status':'OBSERVATIONS_AND_HYPOTHESES_SEPARATED','failedModelRequests':[v for v in invocations if v['outcome']!='SUCCEEDED'],'requestCorrespondenceFindings':[{'attempt':r['attempt'],'findings':[x for x in r['findings'] if x['dimension']=='AUTHORITATIVE_CONDITIONS' and x['status']!='SATISFIED']} for r in final],'limitations':['No counterfactual intervention or independent causal effect of P2-1/P2-2/P2-3 is established.','Connection jitter and model/server latency are not distinguished retrospectively by a TIMEOUT label.','No missing criterion binding or source truth is inferred; original evaluations remain immutable.']}},'automaticReport':ref(R/'batch-report.json'),'limitations':['Original8 results and10 attempt records preserved; only c09-c18 entered.','Old S0 history retained; missing declaration/boundary evidence is not zero S0.','Outer liveCompleted counts run IDs with records, not formal attempts; use the explicit denominators here.','Calendar/selection/calibration/gates reused from unchanged accepted production; no new model regression.','No third quick validation, witness recertification, date changes or production timeout changes.']}
case_rows=[]
for case_id in dict.fromkeys(q['caseId'] for q in plan['runs']):
 planned=[q for q in plan['runs'] if q['caseId']==case_id];slots=[r for r in final if r['run']['caseId']==case_id]
 valid=sum(r['outcome']['capabilityDenominator']=='INCLUDED' for r in slots);qualified=sum(r['outcome']['type']=='QUALIFIED_DELIVERY' for r in slots);role=planned[0]['role']
 case_rows.append({'caseId':case_id,'role':role,'planned':len(planned),'finalRecordedSlots':len(slots),'formalSlots':sum(r['formalRunStarted'] for r in slots),'validFinalSlots':valid,'qualified':qualified,'outcomes':count(r['outcome']['type'] for r in slots),'targetCondition1':'NOT_APPLICABLE' if role!='TARGET' else ('NOT_EVALUATED' if valid!=len(planned) else ('PASS' if qualified>=2 else 'FAIL'))})
summary['perCase']=case_rows
summary['layers']['attribution']['independentPostcheckTransportFailures']=[{'attempt':r['attempt'],'metadata':m,'metadataSha256':sha(Path(m['metadataPath']))} for r in all_rows for m in r['postChecks'] if 'error' in m]
summary['layers']['attribution']['independentEvidenceGaps']=[{'attempt':r['attempt'],'evaluation':r['evaluation'],'findings':[x for x in r['findings'] if x['dimension']=='REQUIRED_EVIDENCE' and x['status']!='SATISFIED']} for r in final if any(x['dimension']=='REQUIRED_EVIDENCE' and x['status']!='SATISFIED' for x in r['findings'])]
summary['layers']['attribution']['modelRequestOutcomes']={name:count(v['outcome'] for v in invocations if v['isContinuation']==is_new) for name,is_new in [('original',False),('continuation',True)]}
summary['runCeilingMeasurements']={'modelCallsAbove50':[],'googleRequestsAbove40':[],'elapsedAbove500000Ms':[{'attempt':r['attempt'],'elapsedMs':r['elapsedMs'],'excessMs':r['elapsedMs']-500000} for r in formal if r['elapsedMs']>500000],'interpretation':'Recorded executor elapsed time is preserved exactly; deadline signalling and finalisation can overshoot the nominal wall-time ceiling. No excess is rounded away.'}
resource={'mode':'LIVE_READ_ONLY','models':new_calls,'fullLiveRuns':new_formal,'environmentReruns':formal_reruns,'rows':fresh,'modelInvocations':invocations}
after=copy.deepcopy(before);after['phase2ModelCalls']+=new_calls;after['totalModelCalls']+=new_calls;after['totalFullLiveRuns']+=new_formal;after['environmentReruns']+=formal_reruns
after['remaining']={'modelCalls':4000-after['totalModelCalls'],'fullLiveRuns':100-after['totalFullLiveRuns'],'environmentReruns':10-after['environmentReruns']};assert all(v>=0 for v in after['remaining'].values())
after['subtotals']['checkpointCContinuation20261021']=summary['continuationResources']
after['checkpointCContinuation20261021']={'status':finish['status'],'freezeSha256':launch['freezeSha256'],'combinedC18':summary['denominators'],'currentResult':ref(B/'result.json')}
after['accountingNotes'].append('User-directed current C18 continuation: preserve original8 formal samples/178 calls already charged. Add only fresh continuation calls and formal starts. Explicit c09 extra pre-run entry and automatic retries retain outer charges; source-only reentries remain separate from restarts of a formally started sample. Original @31 evaluations remain immutable.')
for r in fresh: after['sources'].append({'path':r['runReport'],'sha256':r['runReportSha256'],'models':r['modelCalls'],'fullLiveRuns':int(r['formalRunStarted']),'environmentReruns':int(r['formalEnvironmentRestart']),'scope':'PHASE2','cohort':'CHECKPOINT_C_CONTINUATION_20261021','rawArtifact':r['sourceArtifact'],'rawArtifactSha256':r['sourceArtifactSha256']})
assert sum(x['models'] for x in after['sources'] if x['scope']=='PHASE2')==after['phase2ModelCalls']
assert sum(x['models'] for x in after['sources'] if x['scope']=='PRIOR_PHASE_MODEL_CARRY')==after['priorPhaseModelCalls']
assert sum(x['fullLiveRuns'] for x in after['sources'])==after['totalFullLiveRuns']
for s in after['sources']: assert sha(ROOT/s['path'])==s['sha256']
raw_files += [OLD/'live-outer.log',B/'live-outer.log']
manifest={ref(p):{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(set(raw_files))}
assert max(v['bytes'] for v in manifest.values())<100*1024*1024
write('result.json',summary);write('resource-ledger.json',resource);write('ledger-after.json',after);write('pacing-audit.json',{'status':'PASS','gaps':gaps});write('raw-results-manifest.json',{'executionFreezes':summary['executionFreezes'],'files':manifest})
write('verification-after.json',{'status':'PASS_WITH_RECORDED_EVAL_LIMITATIONS','frozenFilesUnchanged':len(frozen['files']),'priorRawFilesUnchanged':len(old_manifest['files']),'rawFilesShaVerified':len(manifest),'ledgerSourcesShaVerified':len(after['sources']),'modelsAddedByAudit':0,'sourceRequestsAddedByAudit':0,'stoppedOrFinishedBeforeWitnessExpiry':dt(finish['at'])<dt(launch['hardDeadline']),'initialProductionVerification':ref(B/'offline-validation.json'),'postFinishAggregator':ref(POST_SCRIPT),'postFinishAggregatorSha256':sha(POST_SCRIPT)})
lines=['# 检查点 C 续跑：四层报告','','证据状态：current executable；已暴露开发诊断，非 Clean Baseline；待独立复核。','',f'用户明确要求继续剩余Live；从c-09唯一一次用户恢复进入后，按原序运行后续。状态：{finish["status"]}；停止原因：{json.dumps(finish["stop"],ensure_ascii=False)}。',f'旧执行冻结：`{summary["executionFreezes"]["original"]}`；续跑冻结：`{launch["freezeSha256"]}`。唯一执行配置变化为恢复入口及当前证据/账本绑定；生产、@31/rubric@27、原plan与每次行为不变。没有--run-ids，没有重跑前8次正式样本。',f'见证截止：{launch["hardDeadline"]}；结束：{finish["at"]}。未到达：'+(', '.join(r['runId'] for r in not_reached) or '无')+'。','','## 第一层：端到端结果','',json.dumps(summary['denominators'],ensure_ascii=False),'','| Attempt | 结果 | 正式Live | 秒 | 模型 | Google含预检 | 交付 | S0声明 | S0越界 |','| --- | --- | --- | --- | --- | --- | --- | --- | --- |']
for r in all_rows:
 elapsed='未启动' if r['elapsedMs'] is None else f'{r["elapsedMs"]/1000:.3f}'
 lines.append(f'| {r["attempt"]} | {r["outcome"]["type"]} | {r["formalRunStarted"]} | {elapsed} | {r["modelCalls"]} | {r["googleRequests"]["total"]} | {r["deliveredCount"] if r["deliveredCount"] is not None else "未启动"} | {r["severity"]["S0_DECLARATION"]["status"]} | {r["severity"]["S0_BOUNDARY"]["status"]} |')
lines+=['','以下按原计划槽位统计，每个槽位只取最后一条记录；预检尝试不冒充额外正式样本。自动汇总里的 completed 为尝试记录数，其分母与本表分开。','','| 用例 | 角色 | 正式槽位/计划 | 可评分槽位 | QUALIFIED_DELIVERY | 最终结果 | 条件1 |','| --- | --- | --- | --- | --- | --- | --- |']
for c in case_rows: lines.append(f'| {c["caseId"]} | {c["role"]} | {c["formalSlots"]}/{c["planned"]} | {c["validFinalSlots"]} | {c["qualified"]} | {json.dumps(c["outcomes"],ensure_ascii=False)} | {c["targetCondition1"]} |')
lines+=['','每次逐店条件MET/NOT_MET/NOT_CHECKED、展示对应、实际展示时刻、候选漏斗和原始引用保存在[result.json](result.json)与逐次run-report/evaluation中。无交付没有可评价的展示行，保留原请求条件与未核对状态；独立首次证据齐全时刻缺失为NOT_EVALUATED，不编造等待差值。旧c-02实测500.078秒，保留78ms越过名义deadline的测量。','','## 第二层：逐环节 / P2-1、P2-2、P2-3','',json.dumps(summary['layers']['stages'],ensure_ascii=False),'','首批统计为已登记见证出现次数，含未认证Komuro，不能冒充认证召回率；独立跨来源身份/事实/库存漏斗另列逐店。直接门店页为选中路径计数，不是成功读取。价格与其他条件按冻结独立评价分别汇报，不从生产priceFacts或模型自述推导正确性。页面加载、等待、模型用途与stageTimings的缺口保留在每次原始记录。','','## 第三层：严重程度与退出条件','',json.dumps(summary['layers']['severity'],ensure_ascii=False),'','S0声明与越界分开，不把NOT_EVALUATED记为零；原历史H003 S0及第一次C尝试/快速验证仍保留。旧或新条件措辞未绑定、S1_UNSUPPORTED及展示未对应继续照原@31记录，不添加同义词或新对应表，不回写旧评价。','','| 退出条件 | 冻结评价 |','| --- | --- |']
for n in ['1','3','4','5']: lines.append(f'| {n} | {json.dumps(auto["exits"]["condition"+n],ensure_ascii=False)} |')
lines+=['','条件5仅耗时指标；不因本轮观察临时调整门槛。条件2 Holdout未运行；生产实现未在本轮改动。','','## 第四层：归因、资源、边界','',json.dumps(summary['layers']['attribution'],ensure_ascii=False),'','可确认的仅为请求超时、程序终态、实际展示及独立对应缺口；夜间网络与服务排队/生成耗时不能由TIMEOUT标签直接区分。旧后端服务预检失败、用户要求的恢复进入与正式运行重启分别计账；不把单一阶段的计数当成端到端因果证明。',f'续跑新增模型{new_calls}、正式Live{new_formal}、正式环境重跑{formal_reruns}；当前全阶段累计模型{after["totalModelCalls"]}/4000、正式Live{after["totalFullLiveRuns"]}/100、正式环境重跑{after["environmentReruns"]}/10。原8次/178调用不重复计入。',f'外层累计重试记录{finish["totalReruns"]}，含旧来源重试与本次用户额外进入；自动续跑新增重试{auto_retries}，本次来源级进入{source_reentries}。完整逐项账本见[ledger-after.json](ledger-after.json)、[resource-ledger.json](resource-ledger.json)。','',f'完整原始SHA清单{len(manifest)}文件；原先{len(old_manifest["files"])}文件未变、续跑{len(frozen["files"])}冻结文件未变。停止后审计0网络/模型。不同冻结区间已分开标注，原始执行、decisions、@31评价与自动四层汇总均不覆盖。提交推送后停下等复核。','']
with (B/'four-layer-report.md').open('x') as f:f.write('\n'.join(lines))
print(json.dumps({'status':finish['status'],'stop':finish['stop'],'newModels':new_calls,'newFullLive':new_formal,'combined':summary['denominators'],'cumulativeModels':after['totalModelCalls'],'cumulativeLive':after['totalFullLiveRuns'],'files':len(manifest)},ensure_ascii=False))
