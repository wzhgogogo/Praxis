# G1 正文与查询控件回读：独立离线验收

**状态：完成离线修复，等待复核；未推送、未合 main、未运行 Live。**

本地产品分支 `codex/fix-g1-body-and-query-selection`，最终净树 SHA `6adbeeb287d7731183fd2c5ba48538a56d24e49d`。G1 修复提交 `87b2843f4`；控件回读/时段归属修复提交 `731b73879`；范围文档冻结 `6adbeeb28`。

## 1. 两项独立结果

| 修复 | 有效红灯 | 最终验收 |
|---|---|---|
| G1 当前正文完整性 | 原版拒绝真实稳定 DOM；旧 SETTLED/aged-fetch 与缺诊断 PENDING 会错误调用问答模型 | 真实 DOM/CSS 的 12 项 Chromium 用例 PASS，覆盖初读/重新观察、LOCAL/Cloudflare、12+1 截断、超过 3 秒 fetch、变化正文；相关单元/刷新回归保留 |
| 同控件回读与时段归属 | 关闭菜单、可见 4 guests、原生 value 为空时，原版仍无法确认 | 7 项真实结构回读 + 4 项生产组装组合 PASS；两个原有按钮形态新增未关闭菜单反例 PASS |

G1 每次快照刷新实时网络诊断；采集复检 500ms 当前正文，并检查全部 document/xhr/fetch。在途超过 3 秒也拒答。完整 DOM 过滤装饰后才截断；原有 Guard 3 秒计数与通用 settlement 谓词不变。

控件回读要求同一实际 DOM 节点、菜单显式关闭或独立 own-listbox 关闭证据、唯一公开展示值。播报、冲突、被替换节点、未收起列表均拒绝；不改变原生 `.value`。advance 只认本次实际选项回读，并由 Adapter 独立核对店铺查询。原生 select 在结果 form 外的回归保持。

两个正向组合经 `createLiveReadAssembly` → 实际 Domain `AVAILABILITY_CHECKED` → B1 两次校验：2→4 人生成 `num_people=4`；宽窗 19:00 无位后实际进入 advance，改 20:30 并生成对应 B1。两个顶栏反例先实际成功读回 20:00/4 人，店铺仍为 19:00/2 人，不产生错误库存、覆盖或 B1。

## 2. 五项净树门禁

全部在 `6adbeeb287d7731183fd2c5ba48538a56d24e49d` 执行，每项完成后净树不变：

| 命令 | 结果 |
|---|---|
| npm run typecheck | PASS |
| npm run arch:check | PASS，0 禁止依赖 |
| npm test | PASS，1656/1656，0 skip |
| npm run build | PASS |
| npm run test:browser:fixture | PASS，G2/Chromium 315/315 + G6 159/159，0 skip |

原始输出：`gate-1.log`～`gate-5.log`，冻结/耗时/净树记录：`gates.json`。有效原版失败：`g1-red.log`、`g1-recorded-baseline-red.log`、`combobox-portal-red.log`。其他中间失败按 `independent-results.json` 标明测试驱动接线原因，不冒充产品反例。旧 legal-replacement Fixture 只补选后关闭菜单，原行为断言保留。

## 3. 证据边界与保护

保存的 Nakamata snapshot-0005（SHA256 `48b3763e8827c3a45c44257dcbad84ca9f91c8ffed33390f76d2beb0804a0770`）与原 CSS 是真实捕获；菜单交互、网络延迟、问答替身与库存响应是 **LOCAL_CONSTRUCTION**。shop JSON 未留存；本轮不宣称线上 4 人库存、完整网站 Replay 或 Live 合格交付，Live S0/结果不作评价。

`scope-audit.json`：新增私有选择器/禁止字面量命中 0。Guard、S0/评价器、Prompt/Skill/Schema、B1 校验、Confirm/预约导航黑名单、问答限额、exactSourcePhone 与生产时限未改。`protection-comparison.json`：主工作区 HEAD/索引/草稿/状态/131 个未跟踪文件、22 份历史账本、分流配置哈希全部一致；源码树净树。凭据模式扫描无命中。

**实际外部消耗：0 Live / 0 网站 GET / 0 真实模型调用。** 仅本地保存代码和证据提交，等待复核。
