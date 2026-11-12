# D02-V r2 离线修复

2026-11-12 CET · draft / not integrated · 0 Live / 0 网站GET / 0 真实模型。

分支 `codex/fix-seed-request-bound-discovery`，源码冻结 `e4cfacac1bbc9734810a19b029a9e49f21c9403f`。承接未合main的通用推进分支a9b1fad8；本分支不是只含本轮改动的main补丁。

**根因与修复。** r2 #7–8只到地点目录便COMPLETE；原生首20没有目标店，随后Google候选#10–12名称检索，28.702s才进入查位，最终45s超时。删除“无query自动通过”和“整页含词即可”的范围判定，只接受当前来源query、文档title或捕获到的可见h1。无菜系目录行为不变。Prompt27说明整列表范围，不指定站点、分类、店铺、URL或点击顺序。父分支的通用推进继续减少人数/日历的中间模型决策。身份/HARD/Guard/G1、45/90s、预算和评价器均未改。

**真实录制红绿。** `red.log`保留修前失败。逐字SHA核对r2地点目录及B探查的父/相邻/Other/精确页：前四者不能完成精确菜系，精确页能完成并产出来源直达URI。NativeSearch→原身份→直达查位组件不再名称盲搜；同店合并仍只保留一个候选。它跨多次已暴露录制，首页/模型端口是LOCAL_CONSTRUCTION，不是完整网站回放。旧宽分类完成断言改为拒绝；纯构造匹配列表显式声明范围标题，真实DOM未改。初轮夹具失败、卡住的诊断与原r2评价全部保留。

| 同一净树源码SHA门禁 | 结果 |
|---|---|
| typecheck / arch / build | PASS |
| 默认全量 | 1627 PASS / 0 FAIL |
| 本地Chromium | 284 PASS / 0 FAIL |
| G6 | 159 PASS / 0 FAIL |
| D4/D8、D02V推进/计时、同店合并 | 均包含于上述门禁，PASS |
| ead28945 / main32完整SHA新增产品扫描 | 0 / 0 |

**成本与限制。** 父分支实际DOM/HAR组件投影：44.508→41.870s、5→4次调用；r1人数减少一次原4.698s/17,215token调用，日历原本单步不减少调用。本轮没有净成本实测，不把旧28.702s整段记作节省。真实模型能否稳定走到精确筛选仍待验证；目录原生空位表单接线不在本切片。原r2仍是历史CAPABILITY_MISS，不能用组件结果改写为Live通过。

主工作区HEAD/草稿diff/status和四份账本前后哈希相同。只推工作分支，不合main、不追加运行。详细定位见`root-cause.md`，录制清单见`src/harness/browser/fixtures/r2-scope/manifest.json`，净树与日志哈希见`gate-audit.json`。
