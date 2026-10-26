# 决策与来源 flow 快照关联

- 独立分支 codex/fix-phase3a-prime-decision-snapshot-binding，从回放修复合入的新 main 开始。
- 三槽各一次告警对应 revision0/url空/无DOM 的 regionCorrection 入口选择。ADR0043 有意使用同来源 flow 内收集的多个旧观察入口；它不是一次当前 DOM 决策。原 capture 错把它与最后一张 DOM 比较。
- 仅 eval capture 增加明确 SOURCE_FLOW_ENTRANCE_SELECTION 关联，记录 sourceId、flowId、每入口原 observationRevision、originalTargetRef、observedOn 和 ref；不伪造 DOM 序号。正常 DOM 决策必须继续严格匹配，不屏蔽错误。
- 在已有完整 F5c 离线 Interpreter→Router→Reducer 流程上加 capture 断言，先红后绿；最小负例证明真实 DOM 不匹配仍报错。三份原决策各一行作为 eval 审计输入，不整包复制。
- 五门禁、每门禁净树、冻结输入/脚本 SHA、同步 STATUS/DEVLOG/TEST-LOG/月度索引；产品层、Schema、Prompt、Guard、站点不改，真实调用0。通过后按授权合 main 推送，再做退出后即时独立评价。
