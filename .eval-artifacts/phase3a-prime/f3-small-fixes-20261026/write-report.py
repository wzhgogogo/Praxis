# coding: utf-8
from pathlib import Path
import json,hashlib,subprocess,statistics,datetime,shutil
r=Path('.eval-artifacts/phase3a-prime/f3-small-fixes-20261026')
current=r/'integrated'
mac=json.loads((current/'macos-gates/gates.json').read_text())
linux=[json.loads((current/f'linux-results/sample-{n}/gates.json').read_text()) for n in [1,2,3]]
for result in [mac,*linux]:
 assert result['acceptance']=='SATISFIED'
 assert len(result['runs'])==5
 assert all(x['exitCode']==0 and x['outcome']=='PASS' and not x['gitStatusBefore'] and not x['gitStatusAfter'] for x in result['runs'])
 assert next(x for x in result['runs'] if x['gate']=='npm-test')['summary']['pass']==1075
 assert next(x for x in result['runs'] if x['gate']=='browser-fixture')['summary']['pass']==162
old=json.loads((r/'linux-results/w12-before.json').read_text());assert old['knownFailureReproduced'] and old['exitCode']==1
busy=json.loads((current/'busy-red/summary.json').read_text());assert busy['allValid']
assert 'Missing expected rejection' in (current/'busy-red/busy-results-cannot-short-circuit-health-window/test.log').read_text()
w12=json.loads((current/'timing-red/W12-shared-semantic-deadline-not-held/result.json').read_text());assert w12['validContractRed']
assert 'semantic time must consume the same deadline' in (current/'timing-red/W12-shared-semantic-deadline-not-held/test.log').read_text()
assert "actual: 'NOT_EVALUATED'" in (r/'catalog-red.log').read_text()
env=json.loads((current/'linux-results/environment.json').read_text());assert env['cpus']==2
durations=[next(x for x in j['runs'] if x['gate']=='browser-fixture')['elapsedSeconds'] for j in linux]
median=statistics.median(durations)
now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
summary={'status':'COMPLETED_STOPPED_FOR_REVIEW','timeCET':now,'sourceTestedCommit':mac['testedCommit'],'sourceUnchangedAfterGates':True,'macos':{'defaultTests':1075,'browserTests':162,'browserSeconds':mac['browserMedianSeconds']},'linux':{'cpus':2,'fullFiveGateRounds':3,'defaultPassEachRound':1075,'browserPassEachRound':162,'browserSeconds':durations,'browserMedianSeconds':median,'network':'unprivileged network namespace, lo only, no external route'},'siteLines':3847,'packLines':473,'exitCondition6':'NOT_MET_ACCEPTED_CARRY_TO_3B','realCalls':{'model':0,'googleApi':0,'restaurantWebsite':0,'live':0}}
(r/'results.json').write_text(json.dumps(summary,indent=2)+'\n')
code=mac['testedCommit']
catalog='src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json'
catalog_sha=hashlib.sha256(subprocess.check_output(['git','show','HEAD:'+catalog])).hexdigest()
lines=['# F3复核后三项小修','',f'状态：completed / frozen regression，{now}（维也纳CET，UTC+1）。完成后停止，等待复核。分支 codex/fix-phase3a-prime-review-small-fixes；门禁源码 {code}，后续提交仅补证据与状态记录，源码逐字相同。','',
'## 1 退出后独立评价的目录接线','',
'原错误已在未修源码 f7c0ea51 保存：实际子进程完成后的产物被错误判为NOT_EVALUATED，目标断言期望EVALUATED，见catalog-red.log。修后原批次正反例、非零退出、缺产物、父评价重新检出人数矛盾均通过。','',
'只接受固定 src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json。评价器用本地 git show HEAD:<固定路径> 读取已提交blob，并把字节SHA与产物preflight的SHA比较；产物不能提供任意文件或Git revision。执行产物仍受insideArtifacts限制，没有放宽文件边界。历史artifact目录catalog路径不再作为自动评价成功路径，所有测试调用方改用当前固定catalog。独立评分算法/Evaluator36未变。','',
f'当前catalog SHA256：{catalog_sha}。错误SHA继续NOT_EVALUATED/REVIEWED_READS_SHA_MISMATCH；未提交的其他catalog即使SHA匹配也INVALID_REVIEWED_READS_REFERENCE，S0两类均NOT_EVALUATED。没有把未评估伪装为S0缺失。自动评价环境需要本地Git及该已提交blob，缺失则REVIEWED_READS_NOT_COMMITTED并fail closed。','',
'## 2 时序补强','',
'W12：withinTestTimeout默认墙钟观察余量1秒→10秒，仍有界，且独立于被测虚拟时钟。保留真实HTTP、PGlite、持久应用和RunBoundedModelGateway。用Node注入Date/setTimeout，语义耗20ms，来源开始后推进34ms仍未取消，再推进1ms必须由原55ms截止中断；未改变生产预算。原20ms物理延迟helper已退役。原所有终态/诊断/独立评价断言保留。','',
'2核Linux在打补丁前已复现同一原始错误Timed out waiting for W12 source search to start，见linux-results/w12-before.log/json。另隔离移除hold的故障模型，准确失败在“语义耗时必须计入同一截止”断言；修复后的同测试及三轮默认全套均绿。','',
'健康fixture：生产仍固定10秒，默认使用墙钟；只给eval注入每来源/每次检查独立的时钟。正常healthy/busy/forbidden/challenge按完成观察推进时间，启动CPU耗时不吞掉fixture窗口。真实Chromium页面使用Playwright时钟，先保存确有结果且没有busy的真实首快照，再推进页面300ms，必须检出晚到busy；Guard和源规则不变。slow-last-snapshot保留原真实1000/800/220ms控制。','',
'late-busy专属红灯只让TableCheck提前接纳首结果，先经过未修改的slow控制，再在busy断言得到Missing expected rejection。其他红灯中两来源均提前返回的变体命中了slow控制，仅作为slow检错证据，不冒充busy证据。403/challenge仍不启动正式Live，等待/次数断言全部保留。','',
'早期W12把逻辑55ms错误放大到55秒，触发既有30秒结构化读取超时；该准备运行和相应W12变异不计有效红绿。现保留20/55ms逻辑比例。原始准备日志和preparation-note.json保留，不隐去失败。','',
'## 3 STATUS与跨阶段决定','',
'用户已复核L7/L10/时序卫生并接受九项延期。3a′退出条件6记录NOT_MET：3847，目标3591仍差256，Pack473；不再在本批继续减行。L1/L4/L5进入3b“基于证据的查位核对 / 页面结构变化告警”，L2/L3/L6/L8/L9a/L9b保留清单。原历史计划、估算、红绿与延期证据未改写，见accepted-review-decision.json。','',
'## 五门禁与2核三轮验证','',
'| 环境/轮次 | typecheck | arch:check | 默认 | build | 4路真实Chromium |','| --- | --- | --- | --- | --- | --- |']
for name,result in [('macOS',mac),*[(f'Linux 2核/{n}',x) for n,x in enumerate(linux,1)]]:
 seconds=next(x for x in result['runs'] if x['gate']=='browser-fixture')['elapsedSeconds']
 lines.append(f'| {name} | PASS | PASS | 1075/1075 | PASS | 162/162，{seconds:.3f}秒 |')
lines+=['','已合入获批并行main70a7eb1f（ADR-0044、Semantic Proposal4和相关fixture）。自动合并无冲突；A源码仍仅五个授权文件。初次0dcf150c的1060/162及三轮数据保留为旧组合冻结回归，不代替本轮1075/162验收。新VM首次误在Chrome安装收尾前启动，静态DOM明确缺Chrome的前置失败已保留并排除；确认就绪后从头跑三轮，无代码修复或放宽。','',f'同一修复源码Linux三轮Chromium中位数 **{median:.3f}秒**，无skip/todo/已知失败豁免。每个门禁前后git status --porcelain为空，冻结文件前后校验相同。完整原始日志分别在integrated/macos-gates/、integrated/linux-results/sample-1..3/。Mac为单轮，不混入Linux中位数。','',
'VM为临时Lima2.2.1原生VZ、Debian12 ARM64、2vCPU/6GiB、Node24.4.1、真实Chromium151.0.7922.34。默认测试既有chrome channel在Guest中显式指向已安装headless Chromium，不声称验证品牌Google Chrome。没有宿主挂载、SSH agent/代理转发、.env或个人profile；只复制已提交归档及冻结补丁。依赖安装阶段仅公开工具/包下载；正式测试在非特权unshare -rn中仅启用lo，没有外部路由。VM时钟仅在测试前与宿主对齐并关闭NTP，未修改宿主或产品时钟。完整环境、归档/差异SHA、源602项一致性及网络记录均保存。','',
'新增真实模型、Google API、餐厅网站、Live调用均0。固定来源/fixture模型传输与本地HTTP不冒充Live。没有运行新的Live验收；本批只关闭确定性接线/测试问题。','',
'## 冻结、边界与交付','',
'path红灯、修复源码/输入、Linux安装/外层三轮脚本和各次隔离变异均在运行前提交并记录SHA。各freeze.json、before-execution.json与linux-transfer-receipt.json可追溯。产品层、站点两目录、source-packs、Prompt、产品Schema、Guard字节不变，详见boundaries.json。新组合的对比基线为70a7eb1f；历史调用/评测账本原样继承，本批新增真实调用0。','',
'最终组合的执行artifact、子进程内评价和父进程独立评价原字节保存在integrated/composition-files，原路径→保留路径及SHA映射在integrated/composition-provenance.json；复制前后核对执行SHA与独立评价sourceArtifact.sha一致，受控第二槽的人数矛盾只由父独立评价检出。','',
'原未修代码的反例、修复后的真实组合调用链产物及独立评价/S0正常和矛盾控制在runner-post-exit测试中通过；执行产物和评价分开。门禁后目录干净，随后按授权合main。合入/远端核对SHA见integration.local.json和答复，避免自引用；若该收据在Git外，则报告中的代码SHA与各历史日志仍可独立复现。']
(r/'report.md').write_text('\n'.join(lines)+'\n')
spec={'date':'2026-10-26','key':'F3-REVIEW-SMALL-FIXES','item':'f3-small-fixes-20261026','text':f'F3复核后三项小修完成：退出后评价固定已提交catalog并按SHA绑定，W12/健康fixture注入时钟，Mac与2核Linux三轮五门禁全绿（1075/162；Linux Chromium中位{median:.3f}秒）。退出条件6在3a′记未达成：3847，转3b；L1/L4/L5并入基于证据查位核对/页面结构变化告警，其余延期保留。新增真实调用0。','development':'与批准main70a7eb1f集成无冲突，A仅修改两个eval基础设施实现及三份所属测试；目录引用不再允许任意artifact路径，读取固定HEAD catalog blob并核对SHA。W12保留20/55ms逻辑截止，真实DB/HTTP条件等待有界；健康普通状态以独立时钟推进，slow精确真实时序保留。用户复核通过L7/L10/前轮时序卫生，行数目标不再本批继续；退出条件6 NOT_MET，3847/3591、Pack473，L1/L4/L5转3b，其他六项延期保留。','verification':f'未修路径反例NOT_EVALUATED、2核旧W12原始超时红灯、丢hold和晚busy专属故障红灯均有效；修后原正负及独立评价通过。Mac五门禁1075/162；2核Linux三轮完整五门禁均1075/162，真实Chromium耗时{durations}秒，中位{median:.3f}秒，每门前后净树、冻结输入SHA一致、无跳过或豁免。loopback-only测试网络，无生产外部调用；维也纳CET。'}
(r/'completion-docs.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary))
