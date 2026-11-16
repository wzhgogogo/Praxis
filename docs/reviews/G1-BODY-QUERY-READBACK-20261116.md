# G1 正文与查询控件回读：离线修复

- Status: draft / not integrated；本地分支 `codex/fix-g1-body-and-query-selection`，基线 `ccdce4703`。
- 本轮边界：0 Live / 0 网站 GET / 0 真实模型调用；不推远端、不合 main。两项修复独立验证，未升级线上能力声明。

## G1 当前正文完整性

LOCAL / Cloudflare 每次快照刷新 Guard 的实时诊断，G1 初读与一次重新观察均执行 500ms 正文稳定核对，并检查全部在途 document/xhr/fetch（含超过 3 秒者）。通用 Guard 的 3 秒规则不变。装饰过滤在完整 DOM 上先执行再截断：淡出骨架与可证明不覆盖商家正文的局部媒体预览不阻断 G1；真实正文忙、变化正文、缺诊断的 PENDING 和在途正文请求仍拒答，问答模型调用为零。

保存的 Nakamata snapshot-0005 与同场 CSS 提供真实结构；本机服务器与问答替身为构造。原版对稳定真实 DOM 的拒答与老 SETTLED / aged-fetch 错误回答均有红灯。正反例覆盖初读、重新观察、LOCAL / Cloudflare、12 个装饰后第 13 个正文忙、超过 3 秒 fetch 以及变化正文；既有 waits / snapshots 契约保留。

## 同控件回读与时段归属

不改原生 `.value`，仅从菜单关闭后的同一 DOM 控件获取唯一公开展示值；播报区、冲突值、替换节点与未关闭菜单均不能确认。缺 `aria-expanded` 必须另有自身 listbox 已关闭证据。`advanceAvailabilityTime` 只接受本次实际 CHOOSE_OPTION 后经同控件回读的时段，并由 Adapter 独立核对店铺查询日期、人数和时段；不再扫描全页选值，也不要求同一 form。

真实录制 DOM + 构造交互/库存，经生产 `createLiveReadAssembly`、Domain availability 事件及 B1 两次校验验证：2→4 人、19:00 无位后宽窗推进到 20:30。顶栏控件反例须先实际成功读回新值，店铺查询保持旧值，仍不得贡献库存/覆盖。原生 select 在结果 form 外的既有回归保留。一个旧 staleness Fixture 只补齐选后关闭菜单的交互，没有删除原断言。

## 证据与限制

原始 snapshot SHA256：`48b3763e8827c3a45c44257dcbad84ca9f91c8ffed33390f76d2beb0804a0770`。没有留存 shop JSON；4 人和 20:30 库存为明确标注的 LOCAL_CONSTRUCTION，绝非线上库存或完整网站 Replay。

五门禁在最终本地提交的净树执行：typecheck、arch:check、默认测试、build、test:browser:fixture（含 G2 / Chromium / G6）。逐项结果、红绿原始日志、保护哈希与最终提交号保存在证据树 `/private/tmp/praxis-category-guidance-live-evidence/.eval-artifacts/phase3b/g1-query-selection-offline-20261116/`。主工作区、旧账本、历史证据只读；Guard、S0、评价器、Prompt/Skill/Schema、45s/90s、Confirm/预约导航黑名单、问答限额及电话规则不变。
