# near 规则与条件展示修复：独立复核

对象：`codex/fix-near-and-condition-display` @ `f4bcdadc`。复核时间：2026-10-23 19:25 北京。

## 结论：可以合并主线。合并时间放在例 01 诊断运行结束之后，以免诊断运行中途换了产品。

- **near（44724106）：** 删除了"文本里必须出现 near/nearby 才解析地名"的条件；只有不带地名的 "nearby" 仍需要坐标上下文。h-06 红绿回归和 "near X / X" 单元测试通过。行为变化：所有具名地点（包括 "in Shinjuku" 这类不带 near 的写法）现在都用 Google 解析成半径搜索，每次运行多一个 Google 请求。复核者认为可以接受，而且与用户的理解一致。
- **展示（53ac158c）：** 例 02 的产品条件是 "Korean food"，旧代码只去掉 restaurant/cuisine 后缀，所以 "korean food" 在商家分类 "Korean" 中找不到。现在后缀表多了 food，4 条 MISSED 回放后一致，其余 9 份展示不变。可以合并，但这仍是一张小词表（restaurant|cuisine|food）。像 "kushikatsu place"、"Thai dishes" 这样的写法下次还会漏。列入第三阶段 F3 僵硬代码审计：改为由模型指出支持该条件的商家字段，代码逐字核对字段存在且属于同一家店，不再依赖后缀词表。
- 门禁：默认 1025/1025、Chromium 137/137；69/69、5/5；校准 22/22。模型调用 0，Live 0。
