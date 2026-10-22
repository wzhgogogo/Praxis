# 地点解析诊断（仅报告）

- Evidence status: frozen regression / old exposed holdout；不构成修复或新能力验收。
- 分支：`codex/chore-location-resolution-diagnosis`；起点 `17415d1c`。
- 切片与预算：仅旧产物和代码只读分析；网站 0、模型 0、Live 0，产品代码不改。
- 验收：逐次绑定请求来源、返回观察、拒绝规则，并与成功地点对照。Evaluator 不适用：没有新的执行或交付；复用原始事件作诊断证据，不重新评分。

## 结论

**三次均是地点名称对应失败。Google 返回了带坐标的东京地理候选，生产名称规则未接纳 `Ningyocho` → `Nihonbashiningyocho`。** 不是空结果、非东京结果、浏览器失败或日期/预算问题。

| 运行 | 正式运行耗时 | 首次 SEARCH 耗时 | Google / 浏览器 | 保存观察 |
|---|---:|---:|---|---|
| h-04 attempt1 | 5.901 秒 | 1.125 秒 | 1 / 0 | Nihonbashiningyocho，东京中央区 |
| h-10 attempt2 | 6.935 秒 | 1.449 秒 | 1 / 0 | 同上 |
| h-16 attempt1 | 15.077 秒 | 2.756 秒 | 1 / 0 | 同上 |

h-10 attempt1 为独立预检失败，没有正式 Runner result，不与 attempt2 混算。上表是正式运行，不含外层预检/等待。三次生产提交均为 `597f1a8b`；诊断基线与当时 resolver、Google client、contracts 和 evaluation-location-selection 四份文件逐字 SHA 相同，未发生相关实现回归。

## 发给 Google 的文字与证据强度

权威 AREA 为 `near Ningyocho`。`namedNearbyQuery` 去掉 `near` 后，地点解析调用 `GooglePlacesClient.textSearch({textQuery: "Ningyocho", pageSize: 10})`，请求 `POST https://places.googleapis.com/v1/places:searchText`。本例为 NEAR 而非 NEAR_USER，没有 Runner 评测坐标，intent 也没有坐标；没有地点 bias，没有显式 Tokyo / Japan、regionCode 或 languageCode。餐厅搜索提示中的 `unagi ...` **不是这次地点请求**。

这部分请求体是固定代码与保存意图的可确定重建，**不是保存的原始 HTTP 请求体**。三次原始 HTTP body/status/addressComponents 均未留存；保存的 SEARCH_FAILED.reason 原文列出一个观察：

```text
name="Nihonbashiningyocho"
address="Nihonbashiningyocho, Chuo City, Tokyo 103-0013, Japan"
types="sublocality_level_2,sublocality,political"
placeId="ChIJk_FY1k-JGGARn-QTt8Cz_8E"
coordinate="35.6852807,139.7843792"
```

这足以排除“没有返回候选”和“非东京候选”，不能借此声称恢复了完整原始响应。另有**独立见证查询**保存 HTTP 200 和完整 body：`Ningyocho, Tokyo, Japan`（pageSize3），返回相同 placeId、名称和坐标。它支持同一来源表现，但不是这三次生产调用，不替代其缺失证据。

## 生产拒绝规则

`google-places-restaurant-search.ts`：

1. 名称经 NFKD、去音调、小写、去非字母数字后，首先要求 displayName 精确相等。
2. 有限 civic 后缀 city/ward/district/ku 仅在类型和行政 addressComponent 相互支持时接纳。
3. station/airport/park/terminal 等后缀须有来源对应类型与独立地理背景，不能把行政区替换成站点。
4. 地理候选还必须有 id、displayName、坐标。多个精确地理候选为 AMBIGUOUS，仅商家命中也为 AMBIGUOUS；没有可接纳地理候选为 UNRESOLVED。
5. 100 公里背景距离限制在名称接纳之后执行，本例既无背景坐标，也没有到达该判断。

`ningyocho != nihonbashiningyocho`，且返回名称不满足上述有限后缀规则，所以 exactMatches 为空，得到 GOOGLE_LOCATION_UNRESOLVED。地址写 Tokyo、排第一、有坐标，都不会绕过名称规则。

## 对照

| 地点 | 保存证据 | 名称表现与结论 |
|---|---|---|
| Shimokitazawa | h-06 正式运行 DISCOVERY.evidence | 查询和 resolvedPlaceName 均 Shimokitazawa，后续发现5家，生产解析成功 |
| Kagurazaka | Checkpoint C c-05 正式运行 DISCOVERY.evidence | 两者均 Kagurazaka，生产解析成功 |
| Jiyugaoka | 旧见证 centers 的 HTTP200/body | 查询 Jiyugaoka, Tokyo, Japan，返回 Jiyugaoka，来源查询成功；正式 h-02/08/14 已用获批后备 Sangenjaya，不能报作 Jiyugaoka 的生产成功 |
| Ningyocho | 同批独立 centers HTTP200/body | 加 Tokyo, Japan 仍返回 Nihonbashiningyocho；单纯加地区词不能证明解决名称对应 |

每份原始路径、SHA、事件指针、对照 claims 和代码 SHA 见 [evidence.json](evidence.json)。复核命令：`python3 .eval-artifacts/location-resolution-diagnosis-20261022/diagnose.py`。

## 为什么已有回归没抓住、建议怎么修

现有 Google 行为回归已覆盖错误后缀、商家冒充地理地点、行政区/站点冲突、多个精确地点及 civic/station 的有效表示。它们保护“不得把排名或地址当作地点身份”，**没有覆盖俗称与来源完整行政地名的对应**。这是旧覆盖遗漏暴露出的来源表示缺口；不能称为刚发生的实现回归，也不能未经独立地点证据就宣称同一地点已获确定证明。

后续最小通用修复建议（本分支不实施）：

- 先固定来源自身别名/地址层级/站点关联等独立地点对应证据，验证请求简称与来源正式地名是否确指同一范围。若只有当前 body，完整别名关系仍缺证；不能用 contains、删任意前缀、地名常量表放行。
- 地区上下文可以缩小检索歧义，但本例见证说明加 Tokyo 仍产生同一全称，因此只加关键词不足以闭环。
- 在既有 Google 主回归补同一机制：真实名称表示反例、正常同名、真实不同地名、多个合法对应候选、商家/站点误替换；保持原请求范围、预算和 UNKNOWN 边界。
- 保存有界的公开候选名称、placeId、类型、地址成分与逐候选拒绝依据，区分零结果/别名未证/歧义/范围冲突。保持脱敏，不保存凭据。

## 验证与边界

证据提取脚本通过：3次失败、4份对照、4个当时/当前源码SHA相同；规范化差异独立核对。仅文档/诊断产物，未更改产品、测试或Evaluator，不运行五门禁和任何网络/模型。未修复故障，不宣称人形町可解析或阶段退出通过。预算修复与例03诊断工作树未改。
