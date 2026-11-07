# 网络修复后：原 Live 路径读取，destination 停止点

Status: **draft / not integrated — STOP_DESTINATION_OTHER_REVIEW**。时间 CET（UTC+1）。本轮没有合入 main、运行 D8 或启动 held-out。最新用户确认网络已修复并明确批准1次来源页，取代此前“无确定修复不读取”的条件；原 B 候选和离线对比证据完整保留，当前等待的是 destination 决定。

## 实际结果

冻结`1c57b13ede163625c3d87e92d2ffa41dc65e880b`后，**2026-11-07 12:22:59.182–12:23:14.106 CET**执行唯一一次来源检查：

`run-c-closeout-live.ts TC_SEARCH` → **D8原有browser()工厂** → 原LocalPlaywrightChromium默认NODE_FETCH → 原`discoveryPackNetworkPolicy()` → Guard → 公开搜索页。没有使用旧独立probe程序。该模式只调用来源浏览器，不运行G6整单、语义/决策模型或Google。

| 事实 | 证据 |
| --- | --- |
| catalog连通 | 浏览器`/catalog.json` GET200/FINISHED；Node响应200，响应头名称包含`access-control-allow-origin` |
| 权威全名 | Destination按`SPECIFIC_OUTLET`一次填写冻结全名；未换词、加别名或改名 |
| q路径 | `country,hits,q,queryProfile`的OPTIONS和GET放行；q=EQUALS_AUTHORITATIVE_INPUT，country/queryProfile=SHORT_TOKEN，hits=NUMERIC；该GET在浏览器与Node都200 |
| destination路径 | `destination,hits,name,queryProfile`预检拒绝；name=EQUALS_AUTHORITATIVE_INPUT、hits=NUMERIC、queryProfile=SHORT_TOKEN；destination=OTHER |
| destination字符描述 | 长度1–16；字母=true、冒号=true；数字/空白/逗号/句点/括号/引号/其他标点=false；未匹配缓存的已观察页面值哈希。未保存原文，也不推测其内容 |
| CORS | 本次trace的NETWORK_CORS_ERROR事件0；不能把先前的CORS错误复制到本次 |
| 联想/选店 | 符合冻结全名匹配条件的可选联想0；没有选店、提交或新文档导航。不是认定店不存在或API正文结果为零 |
| 其他来源请求 | 同页实际catalog200×1、search200×7，包含既有地区/门店id读取；不把自动页面请求计成新增页面访问 |
| 停止 | 发现destination需放宽即停，不选择店、不用条件文档GET，不增加规则或请求 |

这证明本次环境与原Live路径可以接收catalog和权威q响应；网络修复、传输/策略对齐同时发生，不把恢复唯一归因于VPN。最早阻断从连通性移到了明确的destination值合同。

[不可改写的原回执](runtime/source-read/receipt.json)、[原时间线](runtime/source-read/events.json)、[头名称](runtime/source-read/header-names.json)、[独立摘要](independent-source-evaluation.json)、[原控制台](run.log)。请求头只保存名称，没有x-api-key等值；没有新增代理、证书、请求头、超时或重试策略。

## 快速配置核对与代码边界

D8原运行器使用headless临时Chromium；没有显式代理、UA、locale、时区覆盖；有Guard时serviceWorkers:block；默认NODE_FETCH；完整发现Pack策略的genericPublicRead=true。前两次独立probe显式用了BROWSER_GET_HEAD，第三次恢复Node但仍使用TableCheck较窄策略。此次直接复用原运行器的工厂和完整策略，不再复制构造。见[配置对照](configuration-comparison.json)。

新增TC_SEARCH模式复用该工厂、现有Recorder/trace/账本；浏览器catalog200终态是FILL前置条件；只诊断文字请求，不作身份或完成判定。诊断额外禁止POST；仅实际选店后的主文档请求可以在继续前记条件页账，间隔至少5秒。此次未走该分支。所有生产Guard/身份、源站/方法/路径/预检合同及数值预算不变。

本地真实Chromium两项控制：catalog503不会填词；catalog200才填权威q，destination含标点仍拒绝。实际录制还暴露了诊断列表混入旧地区参数的OTHER/SENSITIVE_FORMAT类别：旧规则没有新文字值合同，这些分类没有拒绝其请求，也不证明个人信息。独立destination拒绝已经足够触发停止。原回执保持不动；之后本地有效红灯→绿，只把诊断范围限定到origin/path/完整键集合匹配的queryValueClasses规则。见[诊断更正](diagnostic-correction.md)、[红灯](legacy-diagnostic-red.log)、[绿灯](legacy-diagnostic-green.log)。没有再次来源读取。

## 录制与能力限制

三通道接线开启；浏览器有3份清洗诊断DOM、3张内容遮盖截图，decision/Google响应文件是空数组，表示本次0调用，不是补造模型输出。记录：[recording.json](runtime/source-read/recording/recording.json)。

**完整Replay仍不可用：`NOT_REPLAYABLE / UNCAPTURED_DYNAMIC_RESPONSE`。** 页面依赖的动态响应未形成可回放数据；没有把内存中已丢弃的正文、清洗HAR或合成响应补写为真录制。此处无法由现存产物恢复具体被清洗掉的原字段，不猜测原因、不放宽隐私规则。真实主脚本响应和页面执行已走过，不等于已得到可完整回放的脚本/数据包。

没有实现动态/联想交接绑定，没有进入代码身份核对、查位或B1。TableCheck文字搜索和B1仍未验证；能力矩阵已把本次catalog/q恢复与当前destination停止点分开记载，旧“当前接口全无响应”判断被本次事实取代。此前10月/11-06差异报告及Playwright本地204的层次更正保留在[离线对比](../tablecheck-final-comparison-20261107/report.md)。旧D8中的21个GET200也未被覆盖。

## 门禁、候选与冻结

Final complete offline matrix: typecheck, arch:check and build PASS; default **1458/1458**; local Chromium **237/237** plus complete G6 **75/75**; strict G2 **5/5** and all12 page pairs PASS. Final failed/cancelled/skipped/todo0. [Clean status/SHA receipts](gates/results.json), raw logs in gates/.

最终源码冻结`00540f1891393a4fdcd8efb578006c9ddc653f04`。该候选比真实读取冻结版只多诊断范围修正和本地回归；原读取并未使用事后修正版本。完整门禁逐项检查前后净树和同一SHA，原始失败不删、不断言反转、不跳过。

分支`codex/chore-tablecheck-safety-integration`由本轮刷新并ls-remote核对的main`f324f17b`建立，保留72b18bee系列、4511476a评测产物和cfe3aa87安全改进、所有原始失败。新增内容只有来源诊断运行器模式、相关本地测试与证据；没有产品Guard或身份修补。STATUS/DEVLOG/TEST-LOG按用户先前要求留到获准合入main时更新，当前能力矩阵和本报告是候选状态，不能报告为已发布main。

四层：整单/交付NOT_EVALUATED（D8、held-out未跑）；步骤可证明catalog与q真实200和destination拒绝；无身份、交付或S0成功宣称；归因只到现有配置/观察，连通改善的单一因果未证实。离线门禁不能替代当前文字搜索/B1现实签收。

Pre-push scan: cfe3aa87..HEAD **0 new hits**. Since72b18bee:10 previously reviewed hits (4 generic format/character/line regexes and6 exact-contract rows). Full main f324f17b scope:48 hits retained in scan-f324f17b.log; not claimed zero, all precede this slice. Eval is excluded by the scanner; manual review of new diagnostic code found only configured full-name input, observed controls and existing policy, no task/alias shortcut.

## 额度与停止

本次页面GET1、模型0、Google0、完整Live0；3份DOM是同页快照，非3次页面读取。累计公开GET351/463、模型653/1600（余947）、Live23/42。原条件文档GET1未用，D8 Live1及见证/后验GET3不动；held-out18Live/108GET保留。

按最新指令，**停在destination需要放宽的位置，交用户/复核者决定**。未擅自套用PAGE、允许冒号、选择其他店、增加API权限、修改网络或重读页面；不执行D8或held-out。
