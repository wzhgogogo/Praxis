# 决策快照关联

状态：completed / frozen regression；2026-10-25 CET（UTC+1）。基线 main `5aa9394c`，分支 `codex/fix-phase3a-prime-decision-snapshot-binding`，验证源码 `5e073ae6a993ac82e6804098c7da0ed251141879`。

三槽每槽一次告警分别在决策序列6、7、6，都是 ADR0043 的无当前 DOM 来源入口选择：revision0、url空、targets/pageActions空，regionCorrection 包含同来源 flow 收集的35个入口及原观察引用。原 capture 错把它与最近一张 DOM 比较。它并非漏录当前 DOM，也不能把 executor revision 当全局 snapshot 计数。

仅 eval capture 为这种明确输入记录 SOURCE_FLOW_ENTRANCE_SELECTION，保留 sourceId、flowId、每入口的 ref、originalTargetRef、observationRevision、observedOn；recordingSnapshot 为 null，不伪造当前 DOM。只有完整同 flow 引用的无 DOM 输入使用这种关联；正常 DOM 输入仍按 URL、title、visibleText 严格匹配，空观察但无 flow 也继续报错。模型消息原样保存，产品 Schema/Prompt/Guard 不变。

- 红灯：冻结提交 `0ef2808b` 的完整 F5c Interpreter→Router→Reducer 流程误报 DECISION_SNAPSHOT_MISMATCH；正常 DOM 不匹配和无 flow 空观察负例通过。三槽原始单行复验的首条同样红灯。
- 绿灯：相同 F5c 流程、正常 DOM 链接 WP-A 回归和负例全部通过；三槽原始决策各一行全部通过，原消息逐字不改，35条入口引用完整保留，每槽0个伪造 DOM，模型传输0。原始记录保持不变，新复验结果另写 sidecar。
- 五门禁：macOS 默认1054/1054、Chromium159/159（104.839900秒）；Linux 默认1054/1054、Chromium158/159（104.595121秒），唯一失败仍为已登记 E1 Failed to fetch，原始exit1保留，按用户例外交 F3。其余 typecheck、arch:check、build 全绿，无其他失败、跳过或取消，各门禁后 git status 为空。
- 615个输入/脚本 SHA 冻结并核对；站点非测试 TypeScript 3864、source-packs473 不增加。新增真实模型、Google、网站、Live、环境重跑调用全部0。Fixture/Replay不进入Live分母，已暴露原决策不作为Clean Holdout。

来源和采集记录见 inputs/provenance.json；验证输入及外层脚本 SHA 见 green-inputs/freeze.json；全部证据 SHA 见 evidence-manifest.json。Linux 复用同一专用 VM，回合末清理。按授权提交本报告后合入、推送 main，再进入独立评价分支。
