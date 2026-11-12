# D02-V r2：首个失败机制与修复边界

2026-11-12 CET；offline / draft, not integrated；开发暴露录制，不是 clean holdout。

- 原运行证据 `codex/chore-seed-post-fix-evidence-04@d81bdd8d`，目录 `seed-d02v-final-r2-20261112`，其 `trajectory-audit.json`、`report.md` 与 `D02V-r2` 三类录制保留。#4 填权威 LOCATION，#6 到地点目录，#7 打开分类，#8 就 COMPLETE。`snapshot-0005.html` 标题只证明地点，列表首20家没有目标来源实体，故旧路径原生详情没有产出该店直达 URI。
- 旧 `sourceListingCompletion` 的 `query===undefined` 自动通过，以及整页文本包含检索词就通过，混淆了地点/单卡/可点菜单与整列表范围。随后 Google 候选 #10–12 重新按名称查找；该候选 AVAILABILITY 进入时已经用去 28.702s，最终45s provider期限停下。原 r2 是 CAPABILITY_MISS，不能被本轮离线测试改写。
- B探查 `601573bc` 已有真实页面证明可行的来源链接路径：父类、相邻类、Other、精确类。逐字副本与元数据存于 `src/harness/browser/fixtures/r2-scope/manifest.json`；测试核对 SHA-256，不改原始DOM。父类/相邻类/菜单/某卡片提及检索词均不能证明整列表范围；精确页标题能证明范围，并只含同一来源实体。路径仅作为录制证据，不写入产品逻辑。
- 产品现在只认当前来源 query 或文档标题/已捕获可见h1的检索词范围证据。无检索词的地点目录保持原行为。Prompt27说明通用列表范围，不指定分类、店名、URL或点击顺序；与父分支通用权威值推进一起使用。45/90s、候选/页数/模型预算、身份/HARD/Guard/G1及评价器均未改。
- 新边界组件把B精确列表、旧同实体详情/Google候选接入原 NativeSearch / 原身份 / 来源直达 / 原Availability，验证不会再派发同店别名名称搜索。它跨两次暴露录制，首页端口为 LOCAL_CONSTRUCTION，不能称为整网站回放、同次库存或真实模型决策验证。原同店候选池03/07回归保留。
- 旧纯构造组合测试的匹配结果需显式提供列表范围标题；将“较宽分类也能完成请求”的测试改为拒绝，原红灯不删。未改真实录制，未改评测、未放宽完成判定。
- 未覆盖：真实模型能否稳定逐层走到精确筛选，以及新增发现操作与省去盲搜之间的净成本。原28.702s不能整段记为节省。通用推进已有Manten组件投影44.508→41.870s、5→4次模型，仅组件结果。此轮不自动应用原生空位目录表单，不追加Live或模型验证。
