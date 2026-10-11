# Factual artifact report only; no model calls or network access.
from pathlib import Path
import json,sys,datetime
root=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');batch=root/'.eval-artifacts/p1-f-20261011';prep=batch/'prep-20261012';mode=sys.argv[1]
base=batch/('continuation-20261012-part2' if mode=='A' else 'part-b')
report=batch/('part-a-report.md' if mode=='A' else 'part-b-report.md');tag=sys.argv[2]
rows=[];attempts=[]
for d in sorted(base.glob('*/attempt-*')):
 if not (d/'finish.json').exists():continue
 f=json.loads((d/'finish.json').read_text());p=f.get('preflight')
 if not p and (d/'preflight.recovered.json').exists():p=json.loads((d/'preflight.recovered.json').read_text())
 attempts.append({'id':f['id'],'dir':str(d),'attempt':f['attempt'],'preflight':p,'finish':f})
 if (d/'summary.json').exists():rows.append(json.loads((d/'summary.json').read_text()))
ledger=json.loads((prep/'ledger.json').read_text());freeze=json.loads((prep/'scripts/freeze.json').read_text())
summary={'mode':mode,'tag':tag,'frozenProductionHead':freeze['frozenProductionHead'],'outerExecuteSha256':freeze['files'][str(prep/'scripts/execute.mjs')],'rows':rows,'attempts':attempts,'ledger':ledger,'modelsBaseline':602,'googleBaselineConfirmed':7,'liveBaseline':24,'environmentReserveBaseline':2,'manualSignoff':'PENDING_INDEPENDENT_REVIEW','guardBoundary':'multi-hop redirects unobservable to frozen guard; known gap, not full read-only verification'}
(base/(tag+'.summary.json')).write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
s='\n\n## '+tag+'（事实记录，待独立复核）\n\n生产冻结 `73bfca5`／干净宿主机工作树；原文与semantic使用批准rev2（B用正式Gold@7），500秒／50模型／40Google，record-browser、record-decisions、no-proxy，原生发现。复核原文949b86f、加载526fab6、外层准备947b8e3、批准时窗bde135a、批准输入路径8180082；已记录四门禁849/849及空跑。最终共享execute SHA `'+summary['outerExecuteSha256']+'`，入口及其余依赖见prep-20261012/scripts/freeze.json。已知Guard多跳重定向缺口保留，不声称完整只读边界已验证。\n\n### Preflight尝试\n\n| 用例 | 尝试 | 东京时间 | 状态 | TableCheck HTTP | 路径 |\n| --- | --- | --- | --- | --- | --- |\n'
for a in attempts:
 p=a['preflight'] or {};when=p.get('startedAt',a['finish']['startedAt']);tokyo=datetime.datetime.fromisoformat(when.replace('Z','+00:00')).astimezone(datetime.timezone(datetime.timedelta(hours=9))).isoformat();http=next((x.get('status') for x in p.get('attempts',[]) if x.get('target')=='TABLECHECK'),None);s+=f"| {a['id']} | {a['attempt']} | {tokyo} | {p.get('status','NOT_RETAINED')} | {http} | {a['dir']} |\n"
s+='\n### 运行逐行表\n\n| 用例 | 执行／阶段 | 交付家数 | evaluator@27 | 秒 | 模型 | Google | 等待ms／占比 | 浏览器超时 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n'
for r in rows:
 e=r.get('evaluation',{});sec=round(r.get('elapsedMs',0)/1000,3);s+=f"| {r['caseId']} | {r.get('status')} / {r.get('phase',r.get('stage','N/A'))} | {r.get('deliveryCount')} | {e.get('taskProducedQualifiedResult','NOT_APPLICABLE')} / {e.get('completion','NOT_STARTED')} / {e.get('systemBehavior','NOT_EVALUATED')} | {sec} | {r.get('models')} | {r.get('google')} | {r.get('waitMs','N/A')} / {r.get('waitPercent','N/A')}% | {r.get('browserTimeout','N/A')} |\n"
for r in rows:
 s+='\n### '+r['caseId']+'\n\n'
 for d in r.get('deliveries',[]):s+=f"- {d.get('name')}；来源 {', '.join(d.get('providers',[]))}；距圆心 {d.get('distanceMeters')} m。\n"
 if not r.get('deliveries'):s+='- 未交付。\n'
 s+='- 地点解析／圆心：'+json.dumps(r.get('locationContext'),ensure_ascii=False)+'。原始Googleplace types未被冻结Runner保留时不补造，addressComponents.types原样在summary。\n'
 s+='- result：'+str(r.get('resultPath'))+'\n- decisions：'+str((r.get('decisionCapture') or {}).get('path'))+f"；{r.get('decisionCount')}条，等于模型调用：{r.get('decisionCountMatchesModelCalls')}。\n"
 s+='- recording：'+str((r.get('recording') or {}).get('path'))+'\n- evaluator：'+str(r.get('evaluationPath'))+'\n- 本例summary：'+str(Path(r['finishPath']).parent/'summary.json')+'\n'
 for x in (r.get('postDelivery') or {}).get('rows',[]):
  if x.get('raw'):s+=f"- 交付后Tabelog四参数GET：{x['raw'].get('requestedAt')}，HTTP{x['raw'].get('status')}；{x['raw'].get('bodyPath')}；selection核对状态 {x.get('comparison',{}).get('status')}，不归因。\n"
  else:s+=f"- 后置核验：{x.get('candidateId')} / {x.get('status')}；TableCheck交付沿用原始trace。\n"
 for x in r.get('witnessRaw',[]):s+=f"- 零交付见证四参数GET：{x.get('requestedAt')}，HTTP{x.get('status')}；{x.get('bodyPath')}；原始响应未判读。\n"
 s+='- stop：'+json.dumps(r.get('stop'),ensure_ascii=False)+'。\n'
s+=f"\n本次累计账本：模型{ledger['models']}/1500（本轮基线602，新增{ledger['models']-602}）；Google已确认{ledger['googleConfirmed']}（基线7，新增{ledger['googleConfirmed']-7}），历史两次中断缺计数，完整累计UNKNOWN；整单Live{ledger['live']}/33（基线24，新增{ledger['live']-24}）；环境预留{ledger['environmentReserveRemaining']}（基线2）。preflight未正式启动不计Live或环境重跑；启动后只有证据明确的环境失败可重跑一次。UNKNOWN/NO不自行改签收分类，留给独立复核按Playbook§10逐条判定。\n\n完整逐例和逐尝试证据：{base/(tag+'.summary.json')}。后续未运行例不冒充完成。\n"
if '## '+tag+'（' in report.read_text():raise RuntimeError('REPORT_SECTION_ALREADY_EXISTS')
with report.open('a') as out:out.write(s)
print(json.dumps({'mode':mode,'rows':len(rows),'attempts':len(attempts),'report':str(report),'ledger':ledger},ensure_ascii=False))
