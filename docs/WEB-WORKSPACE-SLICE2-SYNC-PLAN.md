# 前端slice2同步与3c收尾

- Status: draft / not integrated
- Document revision: 0.1
- Last updated: 2026-11-11 CET (UTC+1)
- Source of truth for: 本切片范围、分支、验收和停止条件

## 切片承诺

从slice2 c2e5cf6e开codex/feat-web-workspace-slice2-sync，把main 249826cc合进分支；保留main后端、身份、Guard、G1和TaskDefinition@24/State@25，前端适配多时段B1、逐条件来源/读取时间、单输入框G1及NO_VERIFIED_RESULT。照片分支不并入本轮。slice1已在main中，不重复合并。

## 验收与边界

1. 13处冲突逐项核对：main正文保留，slice2只追加；代码main行为保留，前端适配。
2. 70447893单列触发条件、显式用户操作、幂等/版本/Stop/迟到、原预算/冷却/TC证据门槛。先保存有效反例，修复后同断言变绿；既有slice2测试只证明历史，不冒充3b held-out覆盖。
3. 五门禁、strict G2与现有写死扫描；两尺寸slice1/slice2回归，多时段B1和逐条件展示。
4. D01、D02、R2录制回放：单/多时段、G1有答案/NOT_STATED、无结果、Stop。录制和运行输入先冻结SHA；只能替换外部传输，不能捏造证据/链接，不读私有题目或改Gold，不使用Live。缺录制或记录不足时明确阻断，不以合成数据叫Replay。
5. 390px和桌面逐场景截图；本机只用回放数据起服务并给局域网地址。用户在iPhone Safari/Android Chrome实测，打开来源页、不提交；用户设备结果须用户确认。
6. A修复合入后再同步main，重复第4项与适用门禁。全部通过和复核者确认才合main；当前不推送或合main。

## 进度（CET）

2026-11-11：已新建分支，main进分支产生指定13冲突；首轮typecheck抓到旧投影测试State24，按main更新为25。尚未完成全门禁、录制回放、截图和设备实测，不作通过声明。

## 停止条件

不得放宽身份、Guard/G1、预算、冷却或TC证据。原录制无法驱动某验收时报告具体缺口；不拼URL、不新增站点/餐厅/菜系写死，不做真实模型/来源GET。凭据只能由显式--env-file加载，本轮离线验证不加载凭据。
