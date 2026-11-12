# 菜系范围与人数直选：第0步停止报告

2026-11-12 CET；draft / not integrated。基线main `32b97ed812be10e80a683ad1f2be8caba5608bf0`，分支 `codex/fix-seed-cuisine-scope-and-direct-choice`。**两项均未实施；src、Prompt、评价器和Fixture零改动。**

| 第0步问题 | 录制结论 | 按用户指令处理 |
| --- | --- | --- |
| 地点目录能否应用请求菜系 | r1/r2 snapshot4/5有同地区分类导航，但没有文本检索框、请求菜系的匹配分类链接或后续筛选成功范围证据；分类面板后即COMPLETE。不能用单卡片分类证明列表范围 | 不实施修复1，不拼网址或把宽分类冒充请求菜系 |
| 8人是否只是被裁剪 | r1 snapshot14只有1–6；Next后snapshot15为2–7，再Next后snapshot16才有3–8。r2 snapshot17/18同样是1–6→2–7。初始DOM没有8按钮 | 不实施修复2；改观察层不能直接选一个尚不存在的节点 |

详细文件位置、决策序号、原始片段的属性与SHA见 [root-cause.md](root-cause.md)、[recording-audit.json](recording-audit.json)。断言脚本PASS只证明既有DOM事实，**不算产品红绿或Live验收**。人数机制为DOM窗口化更新，现有证据不证明需要网络懒加载。

没有修改产品，因此未制造“修后”组件、未给出决策或耗时节省投影，完整产品门禁未重新执行；未改源码的main原门禁仍是历史基线。文档/diff/保护哈希核验另存。本分支新增产品写死为0（产品增量为空）；相对ead28945的历史产品差异未改变，既有扫描证据不冒充本次新扫描。

本轮 **0Live / 0网站GET / 0真实模型调用**。主工作区、三旧账本与r4哈希前后一致。仅推送诊断证据和文档，不合main；停下待复核，不自行追加探查、模型调用、Live或其他修复。
