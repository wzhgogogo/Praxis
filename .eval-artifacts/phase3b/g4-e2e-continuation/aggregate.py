# -*- coding: utf-8 -*-
"""Post-run mechanical aggregation only; all verdicts reuse frozen original score()."""
import collections,csv,datetime,hashlib,io,json,subprocess,sys
from pathlib import Path
old=Path('.eval-artifacts/phase3b/g4-e2e');new=Path('.eval-artifacts/phase3b/g4-e2e-continuation')
def load(p):return json.loads(Path(p).read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def put(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def moment(s):return datetime.datetime.fromisoformat(s)
assert (new/'execution-summary.json').exists(),'Wait for runner completion before reporting'
executionSummary=load(new/'execution-summary.json');started=load(new/'started.json')
assert started['sourceCommit']=='3a7770e7fa247012be1c59701cfe63b304ce4f52'
frozen=load(new/'freeze.json')
for f in frozen['files']:assert sha(f['path'])==f['sha256'],f['path']
assert subprocess.check_output(['git','diff','6dee2479','--',str(old)])==b''
assert subprocess.check_output(['git','diff','b250bb17','--','src','scripts','package.json','package-lock.json'])==b''
namespace={};source=(old/'score.py').read_text(encoding='utf8').split('\ngold=',1)[0];exec(compile(source,str(old/'score.py'),'exec'),namespace)
gold={r['id']:r for r in load(old/'gold.json')['rows']};score=namespace['score']
for base in [old,new]:
 for p in (base/'execution').glob('*.json'):
  expected=score(load(p),gold);actual=load(base/'evaluation'/p.name)
  assert all(actual[k]==v for k,v in expected.items()),p
inputs=load(old/'inputs.json')['rows'];newinputs=load(new/'inputs.json')['rows'];continuationIds={r['id'] for r in newinputs if r['attemptKind']=='CONTINUATION'}
def evaluated(i,base,cohort):
 p=base/'evaluation'/f'{i}.json'
 return dict(load(p),evidencePath=str(p),executionPath=str(base/'execution'/p.name)) if p.exists() else {'id':i,'cohort':cohort,'verdict':'NOT_RUN','failureStage':None,'evidencePath':None,'executionPath':None,'searches':[],'openedDetails':[]}
main=[]
for s in inputs:
 base=new if s['id'] in continuationIds and (new/'evaluation'/f"{s['id']}.json").exists() else old
 main.append(evaluated(s['id'],base,s['cohort']))
reruns=[evaluated(s['id'],new,s['cohort']) for s in newinputs if s['attemptKind']=='RERUN_FIRST4']
def group(rows):
 return {'planned':len(rows),'verdicts':dict(collections.Counter(r['verdict'] for r in rows)),'notAcceptedStages':dict(collections.Counter(r.get('failureStage') for r in rows if r['verdict']=='NOT_ACCEPTED'))}
ledger=load('.eval-artifacts/phase3b/budget.json');entries=ledger['entries'];prior=json.loads(subprocess.check_output(['git','show','6dee2479:.eval-artifacts/phase3b/budget.json']))
assert entries[:len(prior['entries'])]==prior['entries']
assert len({e['id'] for e in entries})==len(entries)
continuationEntries=[e for e in entries if e['id'].startswith('phase3b-c-g4-cont-')]
originalEntries=[e for e in entries if e['id'].startswith('phase3b-c-g4-e2e-')]
allEntries=originalEntries+continuationEntries
def amount(rows,kind):return sum(e.get('kind')==kind for e in rows)
newget=amount(continuationEntries,'GET');newmodel=amount(continuationEntries,'MODEL');allget=amount(allEntries,'GET');allmodel=amount(allEntries,'MODEL')
assert newget<=112 and allmodel<=40 and ledger['cumulative']['evaluationPublicGET']<=257
assert all(n<=1 for n in collections.Counter(e['subjectId'] for e in allEntries if e.get('kind')=='MODEL').values())
receipts=[]
for base in [old,new]:
 for p in (base/'responses').glob('*.json'):
  if p.name.endswith('.started.json') or not p.name.startswith('phase3b-'):continue
  r=load(p);assert any(e['id']==r['ledgerId'] for e in allEntries)
  if r.get('bodyPath'):assert sha(r['bodyPath'])==r['sha256']
  receipts.append(r)
assert len(receipts)==allget,(len(receipts),allget)
receipts.sort(key=lambda r:moment(r['startedAtCET']))
gaps=[(moment(b['startedAtCET'])-moment(a['finishedAtCET'])).total_seconds() for a,b in zip(receipts,receipts[1:])]
assert all(g>=30 for g in gaps),min(gaps)
newexec=[load(p) for p in (new/'execution').glob('*.json')]
for r in newexec:
 assert r['bounds']['searches']<=2 and r['bounds']['details']<=5 and r['bounds']['model']<=1
 assert r['bounds']['google']==0 and r['bounds']['live']==0
 assert sum(not m.get('replayed',False) for m in r['modelRecords'])==r['bounds']['realModelCalls']
replayed=sum(m.get('replayed',False) for r in newexec for m in r['modelRecords'])
assert sum(r['bounds']['realModelCalls'] for r in newexec)==newmodel
totals={k:sum(e.get(k,e.get('publicGET',0) if k=='evaluationPublicGET' else 0) for e in entries) for k in ledger['cumulative']}
assert totals==ledger['cumulative']
now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
summary={'schema':'g4-e2e-combined-report@1','atCET':now,'productionCommit':started['productionCommit'],'continuationSourceCommit':started['sourceCommit'],'stop':executionSummary['stop'],'mode':'PUBLIC_GET_IDENTITY_PREFIX_OFFLINE_JS_DISABLED_DOM','main37Policy':'Original first-four failures retained. Replace only quota-interrupted nr027 with its authorized fresh attempt; add 11 initially unrun inputs. Original partial remains separately archived. First-four authorized reruns are separately scored.','cohorts':{c:group([r for r in main if r['cohort']==c]) for c in ['OLD29','NEW8']},'main37':main,'rerunFirst4':{'summary':group(reruns),'rows':reruns},'resources':{'originalGET':amount(originalEntries,'GET'),'continuationGET':newget,'benchmarkGET':allget,'originalRealModels':amount(originalEntries,'MODEL'),'continuationRealModels':newmodel,'benchmarkRealModels':allmodel,'continuationReplayedModelResponses':replayed,'google':0,'live':0,'shared':ledger['cumulative'],'sharedGETLimit':257},'attempts':{'original':len(list((old/'execution').glob('*.json'))),'continuationIncludingFourReruns':len(newexec)},'limits':'Not a full browser/availability run. Frozen exposed data, no clean-holdout/generalization claim; HTTP/environment excluded from identity miss rate. Historical 12/29 and first-page hit rates are separate.'}
allExec=[load(p) for base in [old,new] for p in (base/'execution').glob('*.json')]
paidRecords=[m for r in allExec for m in r['modelRecords'] if not m.get('replayed',False)]
assert len(paidRecords)==allmodel
summary['resources'].update({'GETKinds':dict(collections.Counter(r['kind'] for r in receipts)),'GETFailures':dict(collections.Counter(r['failure']['code'] for r in receipts if r.get('failure'))),'sourceRequestElapsedMs':sum(r['elapsedMs'] for r in receipts),'continuationElapsedSeconds':(moment(executionSummary['finishedAtCET'])-moment(started['startedAtCET'])).total_seconds(),'modelUsage':{k:sum(m.get('response',{}).get('usage',{}).get(k,0) for m in paidRecords) for k in ['inputTokens','outputTokens','totalTokens']},'modelElapsedMs':sum(m.get('response',{}).get('latencyMs',0) for m in paidRecords),'modelFailures':sum(bool(m.get('failure')) for m in paidRecords),'price':'NOT_EVALUATED: no additional price lookup or estimate','rendererBlockedRequests':executionSummary['blockedRendererRequests'],'rendererSourceNetworkRequests':0})
verifyOnly='--verify-only' in sys.argv
if verifyOnly:
 saved=load(new/'combined-evaluation-summary.json');saved.pop('atCET');current=dict(summary);current.pop('atCET');assert saved==current,'Combined summary must match unchanged original scoring and all attempts'
else:put(new/'combined-evaluation-summary.json',summary)
integrity={'status':'PASS','atCET':now,'frozenSHA':len(frozen['files']),'sourceCommit':started['sourceCommit'],'originalEvidenceUnchanged':True,'productionUnchanged':True,'originalLedgerEntriesPreserved':len(prior['entries']),'allLedgerIdsUnique':True,'ledgerCountersRecomputed':True,'perCallReceiptsAndRawSHA':len(receipts),'minInterRequestGapSeconds':min(gaps),'limitsVerified':True,'onePaidFragmentPerStore':True,'verdictsRecomputedWithOriginalScorer':True,'independentWrongAcceptedMain37':sum(r['verdict']=='WRONG_ACCEPTED' for r in main),'independentWrongAcceptedRerun4':sum(r['verdict']=='WRONG_ACCEPTED' for r in reruns),'rendererSourceNetworkRequests':executionSummary['rendererSourceNetworkRequests']}
if verifyOnly:
 saved=load(new/'integrity.json');saved.pop('atCET');current=dict(integrity);current.pop('atCET');assert saved==current
 print(json.dumps({'status':'PASS','originalScorerAndOracleUnchanged':True,'originalLedgerAndEvidencePreserved':True,'allVerdictsRecomputed':True,'GETReceiptsAndSHA':len(receipts),'frozenSHA':len(frozen['files']),'minGapSeconds':min(gaps),'additionalGET':newget,'benchmarkRealModels':allmodel,'firstFourRerunsSeparate':True}));raise SystemExit(0)
put(new/'integrity.json',integrity)
with (new/'results.csv').open('w',newline='',encoding='utf8') as f:
 w=csv.writer(f);w.writerow(['view','id','cohort','googleName','verdict','queriesAndCertifiedFirstPage','openedDetails','acceptedUrl','productionReason','environmentFailure','failureStage','elapsedSeconds','executionPath','evaluationPath'])
 names={r['id']:r['subject']['name'] for r in inputs}
 for view,rows in [('MAIN37',main),('RERUN_FIRST4',reruns)]:
  for r in rows:
   x=load(r['executionPath']) if r['executionPath'] else None
   elapsed=(moment(x['finishedAtCET'])-moment(x['startedAtCET'])).total_seconds() if x else None
   w.writerow([view,r['id'],r['cohort'],names[r['id']],r['verdict'],json.dumps(r['searches'],ensure_ascii=False),json.dumps(r['openedDetails'],ensure_ascii=False),r.get('acceptedUrl'),r.get('reason'),r.get('environmentFailure'),r.get('failureStage'),elapsed,r['executionPath'],r['evidencePath']])
def txt(g):return '；'.join(f'{k} {v}' for k,v in g['verdicts'].items())
report=(new/'report.md').read_text(encoding='utf8')
assert '\n## 执行结果' not in report
report+=f'''\n## 执行结果（{now}）

冻结提交 `{started['sourceCommit']}`。停止原因 `{executionSummary['stop'] or 'PLANNED_ATTEMPTS_COMPLETE'}`。新增{newget}/112 GET、{newmodel}真实模型、{replayed}份同输入模型响应Replay；本基准累计{allget} GET、{allmodel}/40真实模型，Google/Live0。3b共享GET {ledger['cumulative']['evaluationPublicGET']}/257、真实模型{ledger['cumulative']['realModelCalls']}/1000。资源包含所有原始、额度中断与复跑尝试，不因环境失败扣除。

37家主视图：旧29 {txt(summary['cohorts']['OLD29'])}；新8 {txt(summary['cohorts']['NEW8'])}。首次前四家环境失败原样保留；只用获批续跑补齐nr027的额度中断和11家原未运行输入。原nr027部分尝试另存不删除。前四家复跑独立分母4：{txt(summary['rerunFirst4']['summary'])}，不得混为37家首次结果或挑最好一次。

这是Tabelog生产身份前缀的HTTP评测，页面由JS禁用、网络全阻断的本地Chromium读取；不代表完整浏览器Agent/查位任务，也没有Google新检索、TableCheck或库存结论。旧保存页12/29、新8首屏7/8与旧样本11/12不参与本次端到端计分。环境失败不算身份未接纳，未运行与中断各自保留。所有输入已暴露，不能推断Clean Holdout或长期成功率。

## 逐家结果

完整检索词、认证店首屏是否出现、每个打开的详情URL、身份结论和失败阶段见[CSV](results.csv)及[汇总JSON](combined-evaluation-summary.json)。每行独立评分均重新用原冻结score函数核对；查询与详情绑定原响应SHA。

|视图|ID|Google名|结论|查询 / 首屏认证店|原因/阶段|执行与评分|
|---|---|---|---|---|---|---|
'''
for view,rs in [('37家',main),('前四复跑',reruns)]:
 for r in rs:
  queries='; '.join(s['query']+' / '+('HIT' if s['certifiedPresentInFirstPage'] is True else 'MISS' if s['certifiedPresentInFirstPage'] is False else 'UNKNOWN') for s in r['searches']) or 'NOT_RUN'
  links='—'
  if r['executionPath']:links=f"[执行](../../../{r['executionPath']}) / [评分](../../../{r['evidencePath']})"
  values=[view,r['id'],names[r['id']],r['verdict'],queries,r.get('environmentFailure') or r.get('failureStage') or r.get('reason') or 'NOT_RUN',links]
  report+='|'+'|'.join(str(v).replace('|','\\|').replace('\n',' ') for v in values)+'|\n'
report+='\n## 四层评价与边界\n\n端到端：只评价同店身份前缀，按旧29/新8/复跑4分母分别报告；完整用户预约目标未评。环节：查询、独立首屏命中、实际详情、生产比较器与拒绝理由逐家可复查。独立核验：认证rst_id只在事后评分进程使用，接纳必须对上认证ID，原文SHA与请求节奏全部核对。归因：未接纳按原冻结阶段口径统计，生产原因与独立到达阶段分开，不把环境连接失败算模型或身份错误。\n\n'
report+='未接纳阶段：'+json.dumps({c:g['notAcceptedStages'] for c,g in summary['cohorts'].items()},ensure_ascii=False)+'。\n\n'
report+='阶段说明：EMPTY_OR_TARGET_ABSENT_FIRST_PAGE＝本轮首屏未核实到认证店（空结果或未出现）；TARGET_OUTSIDE_DETAIL_CAP＝首屏有认证店，但它未进入实际打开的至多五个详情；MODEL_FRAGMENT_REJECTED＝模型未给出通过既有片段校验的不同检索词（可能返回原名、空片段或非逐字片段），未发起替代请求；IDENTITY_FIELDS_CONFLICT＝认证店详情已读，但同字段身份信息明确冲突；IDENTITY_NOT_ACCEPTED＝已到认证店详情，身份仍未达到接纳门槛。生产原因码如KNOWN_PHONE_CONFLICT或AMBIGUOUS_TOP_MATCH描述当前已比较候选，不必然说明认证店详情已到达，必须与独立阶段一起读。\n\n'
sen=new/'execution/G4-ND-005.json'
if sen.exists():
 sx=load(sen);report+='Sen本次模型原文输出：'+json.dumps([m.get('response',{}).get('outputText') for m in sx['modelRecords']],ensure_ascii=False)+'。返回的片段等于原Google全名，生产代码拒绝重复查询；这不是片段不在原文，也没有为了命中改成其他词。\n\n'
report+=f'完整性：{len(frozen["files"])}个冻结SHA一致、原证据原账本保留、{len(receipts)}次GET回执齐全，有响应的原文SHA均通过；连接失败没有响应原文。最短间隔{min(gaps):.3f}秒、每店两查询/五详情及全局额度通过。产品/src/scripts/package不变，复用此前六项门禁证据，不冒称本次重跑产品门禁。停止在证据复核，后续身份/策略取舍由用户和复核者决定。\n'
(new/'report.md').write_text(report,encoding='utf8')
brief=f'2026-10-28 CET：G4续跑收尾，旧29 {txt(summary["cohorts"]["OLD29"])}；新8 {txt(summary["cohorts"]["NEW8"])}；前四家独立复跑 {txt(summary["rerunFirst4"]["summary"])}。新增GET{newget}/112、模型{newmodel}，基准累计GET{allget}/模型{allmodel}/40，Google/Live0；共享GET{ledger["cumulative"]["evaluationPublicGET"]}/257。生产b250bb17与原证据未改，完整性PASS；结果交复核，不调整规则。'
for name in ['docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-10.md','docs/history/monthly/2026-10-index.md']:
 path=Path(name);text=path.read_text();pos=text.index('\n')+1;text=text[:pos]+'\n'+brief+' 报告 `.eval-artifacts/phase3b/g4-e2e-continuation/report.md`。\n'+text[pos:]
 # Revisions are document-specific; increment only the existing document revision.
 import re
 text=re.sub(r'(Document revision: \d+\.)(\d+)',lambda m:m[1]+str(int(m[2])+1),text,count=1);path.write_text(text,encoding='utf8')
print(json.dumps({k:v for k,v in summary.items() if k not in ['main37','rerunFirst4']},ensure_ascii=False));print('RERUN4',json.dumps(summary['rerunFirst4']['summary'],ensure_ascii=False))
