# -*- coding: utf-8 -*-
from pathlib import Path
import subprocess,json,hashlib,re,datetime
root=Path('/private/tmp/praxis-phase2c-mainline-integration');d=root/'.eval-artifacts/near-and-condition-display-merge-20261023'
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:json.loads((root/p).read_text())
put=lambda p,v:(d/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
checks=read(str((d/'gates/results.json').relative_to(root)));assert len(checks)==5 and all(x['exitCode']==0 for x in checks)
counts={}
for name in ['default-tests','browser-fixtures']:
 s=(d/'gates'/f'{name}.log').read_text();v={k:int(re.search(r'(?:ℹ|#) '+k+r' (\d+)',s)[1]) for k in ['tests','pass','fail','cancelled','skipped','todo']};assert v['tests']==v['pass'] and not any(v[k] for k in ['fail','cancelled','skipped','todo']);counts[name]=v
assert counts['default-tests']['pass']==1029 and counts['browser-fixtures']['pass']==138
reg=read(str((d/'regressions/regression-results.json').relative_to(root)));cal=read(str((d/'regressions/calibration/comparison.json').relative_to(root)))
assert reg['status']==cal['status']=='PASS';assert reg['calendar']['passed']>=68 and reg['selection']['passed']==5 and cal['outcomeMatches']==22
freezeBindings=[]
for p in ['replay-freeze.json','regressions/calibration-freeze.json']:
 b=(d/p).read_bytes();m=json.loads(b)
 for f,h in m['files'].items():assert sha((root/f).read_bytes())==h,('FROZEN_CHANGED',f)
 freezeBindings.append({'path':str((d/p).relative_to(root)),'sha256':sha(b),'files':len(m['files'])})
source=read(str((d/'merged-source-verification.json').relative_to(root)))
for row in source['files']:assert sha((root/row['path']).read_bytes())==row['sha256'],row['path']
side=read(str((d/'gates/side-effect-verification.json').relative_to(root)));assert side['restored'];assert sha((root/'.eval-artifacts/checkpoint-c-p21c-integration-20261020/region-composition-results.json').read_bytes())==side['originalSha256']
primary=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing');before=read(str((d/'primary-worktree-all-files-before-gates.json').relative_to(root)));head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=primary,text=True).strip();status=subprocess.check_output(['git','status','--porcelain','-z','-uall'],cwd=primary)
assert head==before['head'] and status.hex()==before['statusZHex']
for p,h in before['files'].items():assert sha((primary/p).read_bytes())==h,p
old=read(str((d/'primary-worktree-before.json').relative_to(root)));assert head==old['head'];assert subprocess.check_output(['git','status','--porcelain','-uall'],cwd=primary,text=True)==old['status']
put('primary-worktree-preserved.json',{'status':'PASS','head':head,'files':before['files'],'protectedFiles':len(before['files']),'statusUnchanged':True,'headUnchanged':True,'note':'All nine paths include the filename with spaces; the earlier initial snapshot also matches its eight hashed files and full status.'})
prereq=read(str((d/'merge-prerequisites.json').relative_to(root)));diag=prereq['diagnostic'];assert sha(subprocess.check_output(['git','show',diag['commit']+':'+diag['path']],cwd=root))==diag['sha256']
assert subprocess.check_output(['git','show','-s','--format=%P','09b5d353'],cwd=root,text=True).strip()==prereq['mainBefore']+' '+prereq['approvedReviewCommit']
new={'modelProviderCalls':0,'Google':0,'restaurantWebsites':0,'fullLive':0,'environmentReruns':0,'cachedCalendarResponses':69,'cachedSelectionResponses':5,'offlineCalibrationArtifacts':22}
put('resource-ledger.json',{'schema':'reviewed-merge-resource-ledger@1','taskIncrement':new,'rule':'Cached model responses and historical source files are offline reads, not new provider or source calls; no env-file loaded. Existing diagnostic usage is outside this merge slice and not recounted.'})
verification={'schema':'near-display-merge-final-verification@1','status':'PASS_OFFLINE_READY_FOR_AUTHORIZED_MAIN_PUSH','verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mainBefore':prereq['mainBefore'],'reviewedFix':prereq['approvedReviewCommit'],'mergeCommit':subprocess.check_output(['git','rev-parse','09b5d353'],cwd=root,text=True).strip(),'freezeCommit':subprocess.check_output(['git','rev-parse','00ff1fa5'],cwd=root,text=True).strip(),'gates':checks,'counts':counts,'calendar':{'passed':reg['calendar']['passed'],'total':69,'required':68},'selection':{'passed':5,'total':5},'calibration':{'passed':22,'total':22,'normalDeclaration':cal['normalS0Declaration'],'boundary':cal['boundary']},'freezes':freezeBindings,'sourceFileCount':len(source['files']),'sourceMismatches':0,'codeChangedBeyondReviewedBranches':0,'primaryProtectedFiles':len(before['files']),'historicalMetricRestored':True,'newResources':new,'limitations':['Offline cached responses are not new model-quality sampling or Live validation.','Original diagnostic/holdout outputs and scores remain unchanged.','Approved small generic descriptor suffix list remains an F3 follow-up; no extra repair in this merge.']}
put('final-verification.json',verification)
report=f'''# 已复核 near 与条件展示修复：主线合并验证

Evidence status: current merged executable + exposed frozen regression；不是 Clean Baseline，也不代表新 Live 验收。

例01诊断已结束并停下后，已将复核提交 `{prereq['approvedReviewCommit']}` 合入主线 `{prereq['mainBefore']}`，合并提交 **`{verification['mergeCommit']}`**。五门禁及69/5/22全部通过，满足本次授权的主线推送门槛。完成最终证据提交后仅推送 `codex/feat-live-restaurant-read-path`，核对远端SHA后停下；最终推送提交号记录于交付消息。

[诊断完成依据及SHA](merge-prerequisites.json) 绑定诊断分支 `{diag['commit']}` 的最终报告；两次诊断均已结束，不因本次合并重跑、改分或覆盖。合并只发生5份历史文档冲突，双方记录及索引均保留；源码无冲突。

## 1. 端到端结果与证据边界

本轮没有启动端到端 Live，端到端交付、当前库存与新 S0 声明核验均 **NOT_RUN**，不能从离线全绿推出合格交付。原11份退出产物及例01诊断结果不变。本次可交付结果是经过回归的主线合并，未新增生产改动。

## 2. 逐环节验证

| 验证 | 模式与结果 | 证据 |
| --- | --- | --- |
| 合并内容 | 335份源码/Runner/包配置逐字节核对；修复的6份文件等于复核版本，其余等于原主线，差异0 | [逐文件SHA](merged-source-verification.json) |
| 具名地点与条件展示 | 默认门禁包含保存h-06的真实Native→Google-pack定位交接、near X / X，以及11份Router→Reducer展示回放：原4条菜系支持展示修正，其余9份展示不变；沿用原@33真值 | [默认测试日志](gates/default-tests.log)、[已复核红绿和展示证据](../near-and-condition-display-20261023/report.md) |
| 五门禁 | typecheck、arch:check、npm test **1029/1029**、build、本机Chromium Fixture **138/138**，全部PASS，无skip/todo | [命令与耗时](gates/results.json)、[本机浏览器日志](gates/browser-fixtures.log) |
| 翻月决策 | **69/69**，门槛≥68/69；当前生产解码器读取原缓存真实模型响应，非新模型采样 | [回放结果](regressions/regression-results.json) |
| 选店种子 | **5/5**，当前严格解码与既有独立可接受动作oracle | [同一回放结果](regressions/regression-results.json) |
| 评价校准 | **22/22**，正常声明20/20；两个历史中断声明仍NOT_EVALUATED，越界未知保持未知 | [自动输出先保存](regressions/calibration/summary.json)、[标签后比较](regressions/calibration/comparison.json) |

正式回放冻结提交 **`{verification['freezeCommit']}`**：4297项合并代码/既有输入/脚本，SHA-256 **`{freezeBindings[0]['sha256']}`**；独立22校准另冻结815项，SHA **`{freezeBindings[1]['sha256']}`**。两份先提交再运行，结束时逐文件复核未变。旧冻结清单不覆盖；[新冻结](replay-freeze.json) 逐项记录两条已复核分支的代码差异，Gold、缓存响应和评价oracle未变。

## 3. 严重程度与边界

无新生产网站/模型/Live操作，S0–S4不作新Live判定；Fixture和默认套件覆盖既有/新增只读边界。主线TableCheck Guard、source-health与 `/reserve` 拒绝实现逐字节保留，评测器@33/rubric@29、Prompt及Schema未改。校准未评价的维度不冒充ABSENT。

主工作区HEAD、完整dirty状态及9份用户文件字节均保留：[保护核对](primary-worktree-preserved.json)。浏览器套件产生的历史region指标另存并恢复原字节：[恢复证据](gates/side-effect-verification.json)。原始日志保留原样，不为排版删除运行输出。

## 4. 归因与后续边界

本次只合并已复核修复：具名地点不再依赖near字面词；已观察商家菜系字段可与通用food描述相接。原始红绿、来源投影、Router→Reducer及独立@33对照保留于修复证据目录。本轮未发现新的合并回归。已接受行为变化是具名地点进入现有Google半径解析，每次运行多一次Google请求（本轮没有执行）。复核指出的小描述词表仍列作第三阶段F3后续，未扩展本轮范围。

资源增量：[账本](resource-ledger.json)：新模型0、Google0、真实餐厅网站0、完整Live0、环境重跑0；69+5次为缓存响应回放，22次为离线产物校准。没有重启诊断、留出集或预约操作。

## 交付核对

[机器核对](final-verification.json) 汇总门禁、冻结与代码一致性。提交最终报告和原始日志后，以非强制方式推送授权主线，核对远端ref等于最终本地提交，再停下。
'''
(d/'report.md').write_text(report)
entry='2026-10-23-NEAR-DISPLAY-REVIEWED-MERGE'
summary='例01诊断已结束并停下后，将复核9de09404合入主线4d953731，合并09b5d353；5份历史文档冲突保留双方，335份源码/Runner/配置逐字节匹配两条已复核分支，生产额外改动0。新五门禁1029默认/138本机Chromium/typecheck/arch/build全绿；先提交00ff1fa5冻结后，翻月69/69、选店5/5、校准22/22（正常声明20/20）通过。原主线TableCheck修复不变；主工作区9份文件/HEAD/状态、历史生成指标恢复核对通过。新增模型/Google/餐厅网站/Live/重跑0。最终证据提交后按用户授权推送主线，核对远端SHA后停下；原Live结果不改。'
for p,marker,content in [('docs/STATUS.md','\n- **2026-10-23 TABLECHECK-GUARD-REVIEWED-MERGE:',f'\n- **{entry}:** {summary} [报告](../.eval-artifacts/near-and-condition-display-merge-20261023/report.md).\n'),('docs/history/DEVLOG.md','\n## DEV-2026-10-23-TABLECHECK-GUARD-REVIEWED-MERGE',f'\n## DEV-{entry}\n\n{summary} [报告](../../.eval-artifacts/near-and-condition-display-merge-20261023/report.md).\n'),('docs/history/TEST-LOG.md','\n## TEST-2026-10-23-TABLECHECK-GUARD-REVIEWED-MERGE',f'\n## TEST-{entry}\n\n{summary} [报告](../../.eval-artifacts/near-and-condition-display-merge-20261023/report.md).\n'),('docs/history/monthly/2026-10.md','\n- 10/23 TABLECHECK-GUARD-REVIEWED-MERGE:',f'\n- 10/23 near/display reviewed mainline merge: {summary} [报告](../../../.eval-artifacts/near-and-condition-display-merge-20261023/report.md).\n')]:
 f=root/p;s=f.read_text();assert marker in s,p;s=s.replace(marker,content+marker,1);s=re.sub(r'Document revision: (\d+)\.(\d+)',lambda m:f'Document revision: {m[1]}.{int(m[2])+1}',s,count=1);f.write_text(s)
p=root/'docs/history/monthly/2026-10-index.md';s=p.read_text()
for kind,log in [('DEV','DEVLOG.md'),('TEST','TEST-LOG.md')]:
 marker=f'| 2026-10-23 | [{kind}-2026-10-23-NEAR-CONDITION-DISPLAY-ACCEPTANCE]';row=f'| 2026-10-23 | [{kind}-{entry}](../{log}#{kind.lower()}-{entry.lower()}) |\n';assert marker in s;s=s.replace(marker,row+marker,1)
for heading,log in [('开发','DEVLOG.md'),('验证','TEST-LOG.md')]:
 count=len(re.findall(r'^\| 2026-10-\d+ \| .*?\(../'+re.escape(log)+r'#',s,re.M));s=re.sub('## '+heading+r'记录（\d+条）','## '+heading+f'记录（{count}条）',s,count=1)
s=re.sub(r'Document revision: (\d+)\.(\d+)',lambda m:f'Document revision: {m[1]}.{int(m[2])+1}',s,count=1);p.write_text(s)
p=root/'docs/integrations/CAPABILITY-MATRIX.md';s=p.read_text();s=s.replace('Document revision: 1.84','Document revision: 1.85',1);p.write_text(s)
files={str(p.relative_to(root)):sha(p.read_bytes()) for p in sorted(d.rglob('*')) if p.is_file() and p.name!='delivery-integrity.json'}
put('delivery-integrity.json',{'schema':'reviewed-merge-delivery-integrity@1','sourceVerificationCommit':verification['mergeCommit'],'freezeCommit':verification['freezeCommit'],'status':'ALL_OFFLINE_ACCEPTANCE_PASS','files':files,'scope':'New merge evidence only; prior branch raw inputs and reviews remain byte-identical.'})
print(json.dumps({'status':'PASS','merge':verification['mergeCommit'],'defaultTests':1029,'browserFixtures':138,'calendar':reg['calendar']['passed'],'selection':5,'calibration':22,'newModelCalls':0,'integrityFiles':len(files)},ensure_ascii=False))
