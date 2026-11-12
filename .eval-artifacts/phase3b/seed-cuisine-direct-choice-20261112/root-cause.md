# 第0步：两项实现均停止，未修改产品

2026-11-12 CET。基线 `32b97ed812be10e80a683ad1f2be8caba5608bf0`；已暴露开发录制，非 clean holdout。本次只读取既有文件，0 Live / 0 网站 GET / 0 真实模型调用。以下 DOM 标记仅用于定位录制证据，未加入产品或 Prompt。

## 1. 菜系范围：有分类导航，但未证明请求菜系的可走通路径

证据根目录：

- r1：证据提交 `53d651854158d5b7666f0f9dec15d02840d41a24` 的 `.eval-artifacts/phase3b/seed-d02v-r4-pathfix-20261112/D02V-r1/runtime/dev-d02v-paging-r1/recordings/g6-dev-d02v-paging-r1-1794455620241-0/`。
- r2：证据提交 `d81bdd8d46a1e004a6fa654eefa56824cc1b3724` 的 `.eval-artifacts/phase3b/seed-d02v-final-r2-20261112/D02V-r2/runtime/dev-d02v-paging-r2/recordings/g6-dev-d02v-paging-r2-1794463124565-0/`。

两次 `snapshot-0004.html` / `snapshot-0005.html` 的具体位置相同：

| 位置（行/零基列） | 来源事实 | 能否证明请求菜系已作用于结果范围 |
| --- | --- | --- |
| 31:14、1216:16 | `Best Restaurants in Nakano`、`Restaurants in Nakano` | 仅地点，不能 |
| 178:24 起的分类面板，195:34 起的链接 | 已有 `Washoku (Japanese cuisine)` 等同地区分类链接，指向同地点目录下的分类路径 | 证明有分类导航，不证明当前请求 `robatayaki` 的完整筛选路径；录下的分类链接中无该词 |
| 428:12 起的 GET 表单 | 隐藏字段 `utf8/lid/svd/vac_net`，可见 select 为 `svps/svt` | 只有日期、人数、时段；没有文本检索输入或携带菜系的字段 |

`execution.decisions.jsonl`（在各自 runtime 根目录）第7行/sequence 7 打开分类面板，第8行/sequence 8 即 COMPLETE；两次都只引用地点范围。未录到继续选择菜系后的 DOM 或筛选提交后的 URL/标题/面包屑。r1 单卡片出现的 `Robatayaki` 只证明那家店的分类，不能证明整个列表范围。

因此：**存在同地区分类入口，但现有录制没有证明能将请求检索词应用到整个地点列表的完整路径，也没有提交后的范围证据。** 这不等于断言真实网站不存在该能力。未访问网站、未拼接分类网址、未用宽泛分类代替请求菜系。按用户第0步停止条件，**不实施修复1**。

代码问题仍成立：`src/integrations/restaurant-search/native-restaurant-search.ts:117` 的 `query===undefined` 允许地点目录直接完成；同一表达式读取整个 `current.text`，也不能排除来自单卡片的分类文字。但在要求的来源路径前提未证实之前，本轮不改完成条件或 Prompt；避免把“缺菜系范围证据”修成无法走通且未经验证的流程。

## 2. 人数：DOM 窗口更新，不是只被 overflow 裁剪

| 录制 | 文件、人数容器位置（行/零基列） | 该容器 DOM 的全部按钮值 |
| --- | --- | --- |
| r1 | snapshot-0014.html，1500:13193 | 1、2、3、4、5、6 |
| r1 | snapshot-0015.html，1500:13169 | 2、3、4、5、6、7 |
| r1 | snapshot-0016.html，1500:13169 | 3、4、5、6、7、8 |
| r1 | snapshot-0017.html，1500:13169 | 5、6、7、8、9、10，8已带选中状态 |
| r2 | snapshot-0017.html，1500:13193 | 1、2、3、4、5、6 |
| r2 | snapshot-0018.html，1500:13169 | 2、3、4、5、6、7 |

这些是完整来源 HTML 中人数容器的按钮集合，不是执行器已经过滤过的 targets。初始容器里不存在7/8按钮，因而不是 `display:none`、`aria-hidden` 或 overflow 造成“已有按钮未暴露”。

r1 决策 #12（snapshot14）和 #13（snapshot15）是两次 Next；#14（snapshot16）才对已出现的8执行 `CLICK_AUTHORITATIVE PARTY_SIZE`。r2 #15（snapshot17）先 Next，snapshot18才出现7，没有8。可确认按 Next 会改变/窗口化渲染 DOM；不能据此断言每次 Next 都新增网站请求，故不将其笼统称为网络懒加载。

**修复2所需“目标一开始已在同组 DOM 中，仅被裁剪”的前提被真实录制否定。按用户停止条件，不实施修复2，也不加入直选 Prompt。** 仅暴露裁剪控件无法省掉这里尚未渲染的两次 Next；不改为固定点击序列或虚构8按钮。

## 验证与边界

- [inspect-recordings.py](inspect-recordings.py) 用 Python 标准库离线读取两次记录，输出含原文件 SHA-256、行/列、分类链接、表单和人数按钮属性的 [recording-audit.json](recording-audit.json)；[inspection.log](inspection.log) PASS。不执行页面脚本，不访问原站，不创建模型请求。
- 这是**原始 DOM 证据检查**，不是完整 Replay，也不是产品红绿测试或修后 Live。实现前提不满足，未编写假想前提的测试来冒充修复，不报告节省的轮数/耗时。
- 产品、Prompt、Adapter、评价器、Fixture 均与基线完全一致；未运行03/07、D4/D8及D02-V“修后”回归，不声称这些未实施修复已通过。原main完整门禁仅作为未改源码的历史基线。
- 原录制、评价、主工作区和四份账本不变；哈希见保护审计。没有新增运行路径、重试、兼容层或站点规则。

停止后的最小待决定事项：菜系需要已有录制中更后续的可观察筛选链证据，或另行批准探查；人数需要针对实际 DOM 窗口化控件重新确定通用改进方案。两者都不在本轮自动扩展。
