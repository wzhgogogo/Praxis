from pathlib import Path
import json,hashlib,gzip
from urllib.parse import urlparse,parse_qs
from datetime import datetime
b=Path('.eval-artifacts/p2-1-discovery-20261016'); ledger=json.loads((b/'baseline-ledger.json').read_text()); rows=[]; details=[]; checks=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for a in ledger['attempts']:
 if not a.get('summary'):continue
 p=Path(a['summary']);s=json.loads(p.read_text());d=p.parent/'probe.decisions.jsonl';dec=[json.loads(l) for l in d.read_text().splitlines() if l.strip()]
 assert len(dec)==s['resources']['modelCalls']==s['decisionCapture']['callsStarted']==s['decisionCapture']['rowsWritten']
 assert sha(p)==a['summarySha256'];assert sha(d)==s['decisionCapture']['sha256'];assert s['mode']=='LIVE_READ_ONLY_DISCOVERY_PROBE';assert s['head']=='0a25cae7d53cffc5ad71c07ce221f149aa2ce450'
 native=sum(c['sourceId']!='google-places' for c in s['inRadiusCandidates']);google=sum(c['sourceId']=='google-places' for c in s['inRadiusCandidates']);r=s['resources']; seq=[]
 for t in s['retrievalAttempts']:
  u=urlparse(t['url']);q=parse_qs(u.query);actual=q.get('sw',q.get('search_text',[None]))[0]
  if u.scheme in ['http','https']:label=actual if actual is not None else '无关键词（类别/通用列表，按URL）'
  else:label=t['keyword'] or '通用'
  seq.append(f"{t['sourceId']}: {label} [{t['parsedCount'] if t['parsedCount'] is not None else '未知'}/{t['displayedTotal'] if t['displayedTotal'] is not None else '未知'}]")
 wall_ms=round((datetime.fromisoformat(s['finishedAt'].replace('Z','+00:00'))-datetime.fromisoformat(s['startedAt'].replace('Z','+00:00'))).total_seconds()*1000)
 name=f"{s['caseId']} #{a['repeat']}";link=str(p.relative_to(b))
 rows.append(f"| {name} | {str(s['witnessInListing']).lower()} / {str(s['witnessInFirstBatch']).lower()} | {s['inRadiusParsed']}（原生{native}/Google{google}）{' 下界' if s['inRadiusParsedIsLowerBound'] else ''} | {s['pages']} | {r['modelCalls']} / {r['google']['total']} | {r['elapsedMs']} / {wall_ms} | {s['terminationReason']} / {','.join(s['failureCodes']) or '无'} | [{p.parent.name}]({link}) |")
 details.append(f"### {name}\n\n- 检索序列："+' → '.join(seq)+f"。\n- 未到达来源：{', '.join(s['unattemptedSourceIds']) or '无'}；独立只读审计：{s['boundary']['status']}，gaps={len(s['boundary']['gaps'])}；录制：{s['recording']['replay']['status']}。\n- 原始指标完整保留于 [{p.name}]({link})，决策 [{d.name}]({d.relative_to(b)})；trace与recording同目录。\n")
 checks.append({'caseId':s['caseId'],'repeat':a['repeat'],'summary':str(p),'summarySha256':sha(p),'decisionsSha256':sha(d),'decisionRows':len(dec),'failedModelCalls':sum(x['outcome']!='SUCCEEDED' for x in dec),'models':r['modelCalls'],'google':r['google']['total'],'nativeInRadius':native,'googleInRadius':google,'elapsedMs':r['elapsedMs'],'wallMsIncludingPreflight':wall_ms,'traceSha256':sha(p.parent/'trace.jsonl'),'recordingFiles':len(list((p.parent/'recording').rglob('*'))),'boundary':s['boundary']})
assert sum(c['models'] for c in checks)==ledger['models'];assert sum(c['google'] for c in checks)==ledger['google']
verification={'evidenceStatus':'exposed development diagnosis; not clean baseline','mode':'DISCOVERY_PROBE_ONLY','planned':10,'recorded':len(checks),'models':ledger['models'],'google':ledger['google'],'formalLiveRuns':0,'checks':checks,'stop':ledger['stop']}
(b/'baseline-verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2)+'\n')
fragment='''## 基线逐次结果（发现探测）\n\n列中的原生为列表后详情读取确认坐标的候选，Google为结构化搜索返回坐标后独立算距的候选；没有新增Google Place Details调用，后者不能声称完成了门店页面详情/身份读取。跨来源不合并身份，不把Google候选名称推断为Tabelog认证ID。\n\n| 探测 | 见证进列表 / 进首批详情 | 半径内计数 | 页数 | 模型 / Google | 探测 / 含预检墙钟ms | 终止 / 来源失败 | 原始指标 |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n'''+ '\n'.join(rows)+'\n\n'+ '\n'.join(details)
fragment+='''\n### 指标与证据限制\n\n- `retrievalAttempts.keyword` 在原关键词被移除时会回填计划关键词；表中检索序列另按原始URL参数解码明确写为无关键词，原JSON不覆盖。Google没有浏览器listingObservations，原JSON解析数量为null；来源返回候选数与独立半径计数另列，不能把null说成零。\n- 原生结果页的解析数/页面总数完整保留；未知、超时或未到达不等于明确空状态或来源穷尽。受控Fixture证明组装和指标路径，不能替代本表当前网站证据。\n- 页数沿用生产来源漏斗；Google按生产continuation页数记录，浏览器导航/快照原始trace另存，不把页数当完整网络请求数。\n- 超时取消点配置180000ms；耗时包括取消与回收开销，超过的毫秒数按实际保留，不声称墙钟严格小于180秒。\n- 录制按既有安全策略最小化，NOT_REPLAYABLE的具体原因保留；不能据此声称可静态重建。\n- 四层口径：端到端交付NOT_APPLICABLE（未运行）；逐环节只评发现见证与坐标观测，语义/查位/事实/HARD/交付未评；S0声明NOT_APPLICABLE（无展示），S0越界按独立规则审计逐次报告，未知GET副作用仍为既有证明限制；归因仅记录可观察的检索与超时卡点，不把系统原因码升级为已确认根因。\n'''
(b/'baseline-results.md').write_text(fragment)
print(json.dumps({'recorded':len(checks),'models':ledger['models'],'google':ledger['google'],'formalLiveRuns':0,'stop':ledger['stop']},ensure_ascii=False))
