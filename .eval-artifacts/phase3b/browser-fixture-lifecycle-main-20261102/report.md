# 浏览器 fixture 生命周期修复独立发布

2026-11-02，Vienna CET（UTC+1）。用户已批准本修复全绿后直接合main，原G6其余代码仍待复核，不随本次进入。以正常推送和ls-remote回执确定最终发布SHA。

## 修复与证据

从最新main549061e8创建codex/fix-phase3b-browser-fixture-lifecycle。只提取49e37c55中两文件原字节：browser-read-test-fixtures.ts与browser-read-tabelog.test.ts；逐文件Git blob/SHA见extraction-proof.json。Runner、评价器、G6能力测试、产品、站点、Prompt/Schema/State、scripts/package均未带入或改动，budget.json与main原字节一致。

旧fixture.finished只在route处理finally完成。导航超时且会话已退休时，如果请求还没进入route，永远没有该回调；已进入route而仍等待release时也应随会话关闭退出。修复使真实context.close幂等地完成finished，并让route等待release或context.close先到者；仍检查关闭后不操作旧route。原LOCAL/CLOUDFLARE测试的行为断言全部保留，另加LOCAL晚调度回归。30ms导航、G2 180秒、浏览器外层600秒均未增大。

本轮在af11c443（新晚调度测试+main旧helper）取得有效受控红灯：真实旧会话已退休标记、等待旧fixture.finished标记均出现，8秒诊断保护退出124。红灯原字节gzip与输入SHA见red.log.gz、red-result.json、red-inputs.json。提取helper后，完全相同受控测试在0.888秒内1/1通过，全部原断言不改。

复核者在C ec93c249上自然482秒未完成、随后重跑187/187，是用户本次提供的独立观察；本机没有重演那次原始现场。旧49e37c55中受控红灯和2核90/90修后证据仍由Git保留。本轮关闭的是已证fixture生命周期等待缺口，未扩大为产品浏览器修复。

## 净树完整验证

候选b0285800，737份源/配置SHA全程不变。7项命令各一次，各项前后git status为空，无过滤全套、重试、跳过、断言降低或门禁例外。受控绿灯是第一项单目标诊断，不替代随后完整浏览器套件。

| 检查 | 结果 | 秒 |
|---|---|---:|
| 同一受控晚调度窗口 | 1/1 | 0.888 |
| typecheck | PASS | 0.457 |
| arch:check（含组装门禁） | PASS | 0.234 |
| npm test | 1342/1342 | 35.301 |
| build | PASS | 0.466 |
| test:browser:fixture | 188/188 | 149.341 |
| 严格G2 | 5/5测试，12/12页PASS | 30.355 |

Chromium 188为G2独占5+其余183，未重复计数；比main增加的一项是已批准晚调度回归，不包含G6固定组。命令、开始时间、净树与原始SHA见gate-results.json；原始输出无损压缩在gates，logs-sha256.json可验证原始/压缩字节。scope-proof.json记录精确范围和本机环境。

真实模型、Google、网站、公开GET、Live均0，未读取或加载.env，没有新建VM或下载。原共享账本保持main原字节；G6分支的57次历史计费仍在该分支，随后同步main时按id并集保留。

## 发布与后续

按用户授权先推工作分支，再正常fast-forward发布origin/main并ls-remote核对，不强推、不删除分支、不修改B/C工作树。发布完成通知B/C同步已发布main。A随后把main合入原G6分支，文档两边保留、budget并集；如果源/配置与已全绿G6候选86720163逐字相同，复用该完整验证，不无谓重跑。C产品修复仍待其获批合入后才执行冻结的≤20次补回放；本次不启动Live或见证GET。
