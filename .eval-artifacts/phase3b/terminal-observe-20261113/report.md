# 终端观察与 Skill 引导：离线修复复核简报

- **draft / not integrated**；2026-11-13 CET；基线8b7afec86d0830376a01945c5b6561a46d38447e，净树门禁源码冻结 **67a949d702f17a4f6ed10e9b869882d707711cc7**。后续提交仅文档/证据；不合main。素材9856dc67已暴露开发录制，不是Clean Holdout。
- **复核Gemini建议：核心方向接受。** 原snapshot33/HAR45在未改完成谓词下确实complete=true，随后终端observe从41.961秒等到45.045秒被取消。旧skill与动作能力提示不一致可以澄清；“keyword-removal措辞导致误点”仍是归因假设，未用0模型的文案测试冒充模型行为验证。

## 实现（仅四个产品/Skill文件）

| 文件 | 改动 |
|---|---|
| [executor](../../../src/infrastructure/browser/browser-task-executor.ts) | 代码调用方显式completionUsesControls=false且无未确认option/radio/calendar时，动作后先用本次snapshot评估；满足原完成谓词、pendingParty有来源确认才返回，终端控件为空。未完成仍完整观察并检查禁用人数，同行不重复assess；PENDING仍按原500ms稳定性验证。默认/true与初始控件检查不变。稳定性跳过控件仅限已允许的snapshot-only预检，未确认控件守卫保留原路径。 |
| [availability](../../../src/integrations/tabelog/tabelog-browser-availability.ts) | 唯一适配器调用显式接入（query后续不读controls）；objective按availableActions区分精确直选与推进，不指定动作序列。最终complete、身份/库存/ground未改。 |
| [source Skill](../../../web-skills/tabelog/SKILL.md) | 清除无条件CLICK与旧keyword-removal指令；按已观察能力选择动作，泛化/兜底分类仅作模型语义引导，无类别词表、URL或选择器。 |
| [discovery objective](../../../src/integrations/restaurant-search/native-restaurant-search.ts) | 展开的分类菜单中优先探索尚未探索的泛化分类，避免无关辅助开关；整列表范围完成谓词逐字不变。 |

## 红绿与门禁

- **真实组件红→绿**：`red-recorded.log`原实现仍调用已取消终端控件扫描而失败；同一真实DOM32→33、原HAR44→45，经本地Chromium实际点击后，`green-recorded.log`完成并提取20:30，终端扫描**1→0**、模型替身1次、真实调用0。**取消观察器是LOCAL_CONSTRUCTION失败注入，DOM/JSON原字节及SHA保留；不是完整网站Replay或Live成功。** 原扫描取消前已等待3084ms，仅计组件成本投影，不声明完整扫描耗时或新Live节省。
- 反例：缺省/true照旧扫控件；未完成/禁用人数/忙碌回退、pendingOption/pendingRadio/calendar/pendingParty不跳过；PENDING同key稳定才完成、轮换结果拒绝。定向84/84；原skill加载与objective实际入参断言通过，不声明模型下次必然选对分类。
- **同SHA净树全绿**：typecheck、arch:check、build；默认**1644/1644**、Chromium**287/287**、G6**159/159**，全部0跳过。包含D4/D8、03/07已有录制、D02-V与同店合并回归。首次全量因继承稀疏检出缺录制而65项ENOENT，原`default-missing-fixtures.log`保留；仅恢复同提交已跟踪材料后重跑，无测试/断言放宽。`boundary-green.log`/`type-targeted.log`保留开发中测试预算/类型诊断，非正式产品红灯。
- **扫描**：恢复历史扫描器，规则不变，仅增加web-skills范围；双完整SHA ead289450092ccc30798b754d1e0771462bf08bd、32b97ed812be10e80a683ad1f2be8caba5608bf0及增量8b7afec86d0830376a01945c5b6561a46d38447e，新增命中均**0**。原/扩展脚本、空扫描原日志与哈希在本目录；人工scope-audit确认只四文件，无新业务硬编码。

## 保护、证据边界与停止

TableCheck代码/Skill、通用决定Prompt、选态/控件提取、Guard、G1、S0/评价器及45/90秒均零改动；默认完成调用方回归保持。主工作区HEAD/diff/status、三旧种子账本+本轮前重试账本、9856dc67完整已检出证据目录（473文件）before/after完全一致。旧Live原评价不改。最终能力仍待用户另批单次Live确认；本轮 **0 Live /0 网站GET /0真实模型**。推送本工作分支后停止，不合main、不跑Held-out、不自动复测。
