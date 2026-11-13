# 人数进度与分类下钻最小修复

- 时间：2026-11-13 CET；状态：draft / not integrated，开发录制已暴露，不是 Clean Holdout。
- 基线：`1ee8c3303457fe83498c3a54515518f5cc27f9c9`；净树全门禁源码冻结：`ea93f6c4b0d140769ea381a413b9c23708db6b47`。本报告及日志为后续仅文档/证据提交；不合 main。

## 修改与红绿

1. **人数进度**：原逻辑把人数确认与目标日期整组绑定，真实两店默认当天的200响应已确认请求人数仍不计进度。`red-party.log`保留修前失败；修后从相同有效店页的最新合法响应独立确认人数，校验查询、店铺、members、合法日历日、selection及可见公开选态冲突。空selection只确认查询人数生效，不声明有位。`tabelog-query-controls.ts`仅把原日期/人数公开选态解析逐字提为纯函数导出，已获用户批准，不复制或新增正则词表。
2. **分类引导**：仅调整发现objective：当前无精确筛选/关键词输入时允许沿观察到的相关父分类下钻，新页重开分类菜单；无用弹层先用自身可见关闭控件退出。`red-objective.log`保留修前请求输入失败，修后同一请求端口断言通过；未改变列表范围完成规则。
3. **范围**：仅四个产品文件：`native-restaurant-search.ts`、`tabelog-browser-availability.ts`、`tabelog-vacancy-response.ts`、获批追加的`tabelog-query-controls.ts`。其余产品代码零差异。`behavior-preservation.json`确认原可见选态解析、CapturedSlots、observedDate、最终complete表达式、availability后续ground路径、sourceListingCompletion不变；禁改浏览器、Guard、G1、S0、TableCheck、评价器、45/90秒不变。

## 验证与证据边界

| 模式 | 结果与限制 |
|---|---|
| Mock / LOCAL_CONSTRUCTION | 空selection仍仅PARTY进度；冲突/错误人数/重复参数/损坏selection/非法日期/PENDING/错店/失败响应拒绝。现有公开选态与库存行为回归保持。 |
| 真实录制组件 | `69bc00eb02573420c705e43b702cc3711e8076bb`的两店原DOM与HAR，真实点击人数后通过未修改执行器清pendingParty并转向日历；2/2。metadata合成部分在fixture manifest中明确标注。未捕获后续日历状态，不构造未来月份或库存。原5/3次重复人数提议只作诊断，不报告Live节省。 |
| 既有录制回归 | r2-scope四层、03/07、D4/D8、D02-V及同店合并保持通过；包含于默认/Chromium/G6矩阵。 |
| Live Read-only / 模型 | 本轮未运行。objective入参通过不等于真实模型遵循；本轮不产生新的查位、日期/时间或交付验收结论。 |

净树同一源码SHA：typecheck、arch:check、build PASS；默认1632/1632、Chromium286/286、G6 159/159，定向26/26。执行命令与日志哈希见`gate-audit.json`；Chromium使用`npm run test:browser:fixture`（本分支package中的真实命令，含G6）。双完整SHA `ead289450092ccc30798b754d1e0771462bf08bd` / `32b97ed812be10e80a683ad1f2be8caba5608bf0`及增量`1ee8c3303457fe83498c3a54515518f5cc27f9c9`扫描均0新增产品命中。原产品红灯及开发中的fixture断言/类型修正日志全部保留；`query-controls-reuse-proposal.patch`为获批前的已弃用提案，不是实际实现。

## 保护与停止

主工作区HEAD/草稿diff/status及6份账本（要求的5份，另保护前次失败单次账本）前后SHA完全一致，详见`protected-before.json`、`protected-after.json`、`protection-audit.json`。未修改旧评价或录制。本轮实际消耗 **0 Full-Live / 0 网站GET / 0 真实模型调用**；仅localhost Chromium，不访问真实来源。不合main、不跑Live、不碰held-out，推送工作分支后停止待复核。
