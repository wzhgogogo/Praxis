# 第二阶段 c：停止记录

Evidence status: exposed development / frozen regression；未完成本批验收，不是新留出集结论。

**主线集成已完成并推送；阶段 c 停在语义验收失败与额度边界，修复分支未推送。** 不追加模型调用，不继续 Goya 的产品修改。原 `e2042b7a` 基线阻断记录与 `baseline-evidence.json` 保留；该阻断已由用户明确批准的集成解除，本页记录新的停止原因。

## 1. 主线集成

- 精确合并 `06287b6f` 到 `06703ba1`，双亲提交为 `6cbf43c85146ad1b3c99560aaf126eba9a6daf3f`；没有人工冲突。主线 Playbook 的 5,000 次模型额度、第二阶段 b 决定和两边历史正文都保留。
- 集成结果包含 331 个源码、测试、skill、脚本和构建配置文件，与 `1a715325` 逐字节一致，例外 **0**。State20、Evaluator33、rubric29。
- 实际五门禁通过：默认 1024/1024、Chromium 136/136；缓存翻月 69/69、选店 5/5；独立校准结果类型 22/22、正常样本 S0 声明 20/20。两份中断样本仍为未评价。
- 主线远端已核验为 `8ba0c54a06189c03fd3f7366a865cf705f314aab`，见 [推送收据](mainline-push-receipt.json) 和 [完整集成报告](../phase2c-mainline-integration-20261023/report.md)。集成段新增模型、Google、餐厅网站、完整 Live 均为 **0**。
- 原主工作树的 HEAD 和 9 份用户已有改动都未触动。阶段 c 在独立工作树继续；原阻断记录重放为 `97163865`，其正文未被覆盖。

## 2. 地点解析：实现候选与验证边界

实现提交：`56ade9e8`。删除 `sameNamedLocation`、NFKD 归一化、行政／站点后缀推断。地名只作为观察和展示事实，不再是 admission gate；未加别名表、拼写规则、包含／前缀匹配或生产地名常量。

取来源排序中第一个具有有效 ID、名称、合法有限坐标和既有 geographicLocation 类型的结果。保留原 **100 km** 背景距离上限；只比较前 **3** 个有效地理结果，彼此相隔超过同一 100 km 区域尺度才因结果分离判歧义，近距离的站点／街区表示保持来源顺序。仅商家、缺少有效地理结果仍未解析。沿用已有地理类型集合，未把 `route` 加入白名单。

用户会看到实际采用的来源地名。Web 回答、页面区域提示和导出产物共用 durable continuation 中的 label／center；用户 AREA 原文不改。生产 `createLiveReadAssembly` → Web → 导出产物的本地组合验证了三处名称和坐标相同，不用另一次查询代替展示证据。没有改评测器或资格规则。

有效红灯：[保存的名称反例](location/red.log)、[Web 实际组装展示缺失](location/display-red-valid.log)。绿灯：[Google 24 项](location/green.log)、[Web 组合](location/display-green.log)、类型／架构／默认 1021 项／构建日志均在 location/。`display-red.log` 因沙箱拒绝 localhost listen 而失败，**不算有效检错证据**；已另在宿主机取得正确断言红灯。五个仅验证旧拼写／后缀机制的测试退役，替换为排名、类型、距离及近距离多表示规则；没有 skip 或放宽库存资格。

### Ebisu

三次旧运行均保存一次 namedPlaceResolution、0 次发现／详情、0 浏览器；SEARCH_FAILED 记录 `no returned places`。按保存 AREA 和当时未变代码可重建 Text Search POST：`textQuery=Ebisu`、pageSize10，无 locationBias、regionCode 或 languageCode。命名 NEAR 没有坐标，不使用仅对 nearby 生效的评测点回退。

这是**代码和保存状态的确定性重建，不是原始 HTTP 请求／响应**。客户端会传播非 2xx、网络、超时和 JSON 错误，没有把这些错误吞成空列表；成功 JSON 中 `places` 缺失和 `places=[]` 则都会得到空列表。原始 body/status 未保存，无法继续判断服务端为何返回空／缺字段；不归因拼写、VPN、配额或覆盖，也未据此补硬编码城市／别名。见 [完整诊断](ebisu-diagnosis.md) 和 [原事件及 SHA](ebisu-diagnosis.json)。

### 已保存响应逐条比较

[56 行旧／新结果](location/saved-location-results.json) 列出全部选定保存运行，并保留输入 SHA、范围与请求重建。六份有坐标和类型的旧拒绝观察（Ningyocho、Shimbashi 各三次）均由旧拒绝变为新解析成功；三份 Ebisu 的旧空列表仍未解析。七份没有相应命名解析观察，保持 NOT_OBSERVED。

**40 份旧成功运行只保存了最终采用地点的 projection，没有原始排名列表／types。** 本批没有伪造缺失响应，逐项新结果保留 NOT_EVALUATED。因此不能声称所有历史成功响应都已完整反事实验证不变。既有成功坐标 Fixture 仍通过；这不能代替缺少的历史完整响应。下表也明确区别结果变化与证据缺失。

| 原运行 | 请求 | 旧结果 | 新结果／范围 |
|---|---|---|---|
| [DEVELOPMENT / c-01-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-01-attempt-1/runner/2026-10-21T12-47-47-598Z-40c9b8e2-b564-4617-a3cd-735bbdd3411e.result.json) | near Shibuya | RECORDED_RESOLVED Shibuya (35.6619707, 139.70379499999999) | NOT_EVALUATED |
| [DEVELOPMENT / c-02-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-02-attempt-1/runner/2026-10-21T12-57-13-534Z-14de2d12-6432-4b5e-a6a6-1a25ec212133.result.json) | near Higashi-Ginza | RECORDED_RESOLVED Higashi-ginza Sta. (35.669700299999995, 139.7671399) | NOT_EVALUATED |
| [DEVELOPMENT / c-03-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-03-attempt-1/runner/2026-10-21T13-11-19-020Z-b2899a23-d1a9-4df0-ab03-25cde45fb695.result.json) | nearby | NOT_OBSERVED | NOT_OBSERVED |
| [DEVELOPMENT / c-04-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-04-attempt-1/runner/2026-10-21T13-22-13-597Z-fe19189c-0a9c-4609-9ed5-18c8026a36bf.result.json) | nearby | NOT_OBSERVED | NOT_OBSERVED |
| [DEVELOPMENT / c-05-attempt-2](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-05-attempt-2/runner/2026-10-21T13-37-08-280Z-2c2fb95a-15fc-4e30-9fd3-7783cb7bc448.result.json) | near Kagurazaka | RECORDED_RESOLVED Kagurazaka (35.701459799999995, 139.7402946) | NOT_EVALUATED |
| [DEVELOPMENT / c-06-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-06-attempt-1/runner/2026-10-21T13-48-10-020Z-f752f89d-0914-4aeb-a554-1f3059a7de8c.result.json) | near Kichijoji | RECORDED_RESOLVED Kichijōji (35.704096, 139.58020539999998) | NOT_EVALUATED |
| [DEVELOPMENT / c-07-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-07-attempt-1/runner/2026-10-21T13-57-40-634Z-6e36c4e3-20fa-47a8-b876-bb2686395420.result.json) | nearby | NOT_OBSERVED | NOT_OBSERVED |
| [DEVELOPMENT / c-08-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-08-attempt-1/runner/2026-10-21T14-08-00-597Z-3bea8ed5-8aa6-4539-9207-9cc9ba56fd4f.result.json) | nearby | NOT_OBSERVED | NOT_OBSERVED |
| [DEVELOPMENT / c-09-attempt-2](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-09-attempt-2/runner/2026-10-21T15-00-33-940Z-b06907f5-4bfb-4b4d-8955-6dd0e36bdf84.result.json) | near Kagurazaka | RECORDED_RESOLVED Kagurazaka (35.701459799999995, 139.7402946) | NOT_EVALUATED |
| [DEVELOPMENT / c-10-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-10-attempt-1/runner/2026-10-21T15-10-45-956Z-4defd7fb-f630-4c2e-bae4-25d96b810fd4.result.json) | near Kichijoji | RECORDED_RESOLVED Kichijōji (35.704096, 139.58020539999998) | NOT_EVALUATED |
| [DEVELOPMENT / c-11-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-11-attempt-1/runner/2026-10-21T15-19-14-115Z-156996bf-a4f8-4de3-b49c-31c3d1f49ea2.result.json) | near Shibuya | RECORDED_RESOLVED Shibuya (35.6619707, 139.70379499999999) | NOT_EVALUATED |
| [DEVELOPMENT / c-12-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-12-attempt-1/runner/2026-10-21T15-28-02-025Z-eb39a133-af3a-432b-8b6c-bf8f302e1259.result.json) | near Higashi-Ginza | RECORDED_RESOLVED Higashi-ginza Sta. (35.669700299999995, 139.7671399) | NOT_EVALUATED |
| [DEVELOPMENT / c-13-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-13-attempt-1/runner/2026-10-21T15-35-55-215Z-b2e5a034-fd12-458e-8b14-4aff760fb0cb.result.json) | near Kagurazaka | RECORDED_RESOLVED Kagurazaka (35.701459799999995, 139.7402946) | NOT_EVALUATED |
| [DEVELOPMENT / c-14-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-14-attempt-1/runner/2026-10-21T15-47-10-051Z-cec31da2-fe2f-4736-9989-d1a8ed6c09d6.result.json) | near Kichijoji | RECORDED_RESOLVED Kichijōji (35.704096, 139.58020539999998) | NOT_EVALUATED |
| [DEVELOPMENT / c-15-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-15-attempt-1/runner/2026-10-21T15-57-09-191Z-272c5bc7-0d15-4815-b442-a27c9ce9c855.result.json) | near Shibuya | RECORDED_RESOLVED Shibuya (35.6619707, 139.70379499999999) | NOT_EVALUATED |
| [DEVELOPMENT / c-16-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-16-attempt-1/runner/2026-10-21T16-06-19-744Z-e6e7993a-8f3c-44fe-ab62-79071727a3e3.result.json) | near Higashi-Ginza | RECORDED_RESOLVED Higashi-ginza Sta. (35.669700299999995, 139.7671399) | NOT_EVALUATED |
| [DEVELOPMENT / c-17-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-17-attempt-1/runner/2026-10-21T16-14-48-371Z-98d62455-7189-4e2b-a6d8-5e94cc81f551.result.json) | nearby | NOT_OBSERVED | NOT_OBSERVED |
| [DEVELOPMENT / c-18-attempt-1](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/runner/2026-10-21T16-23-52-862Z-cb6b94a5-2e3c-4053-aa07-6973db7433e7.result.json) | nearby | NOT_OBSERVED | NOT_OBSERVED |
| [DEVELOPMENT / c-17-attempt-3](../checkpoint-c-live-20261020/c17-timeout-retry-20261022/live-results/c-17-attempt-3/runner/2026-10-22T05-51-48-298Z-85a96a74-eb98-47d8-8873-fdfc14c1ecc7.result.json) | nearby | NOT_OBSERVED | NOT_OBSERVED |
| [DEVELOPMENT / c-01-attempt-1](../checkpoint-c-live-20261020/c17-timeout-retry-20261022/offline-rehearsal/c-01-attempt-1/runner/2026-10-22T05-48-54-198Z-3a5d6968-3c0e-4513-8361-ee26b5c92fa4.result.json) | near Shibuya | RECORDED_RESOLVED Shibuya (35.6619707, 139.703795) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-01-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-01-attempt-1/runner/2026-10-22T08-25-14-355Z-73b46e0c-e5e4-4fdb-a5d0-92e96ea8dd7b.result.json) | near Ueno | RECORDED_RESOLVED Ueno (35.7087296, 139.7741538) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-02-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-02-attempt-1/runner/2026-10-22T08-33-27-412Z-91a9440a-8622-41cd-96f2-526be579345b.result.json) | near Sangenjaya | RECORDED_RESOLVED Sangenjaya (35.641253899999995, 139.667531) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-03-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-03-attempt-1/runner/2026-10-22T08-42-01-645Z-8a1e9abe-a8ba-4eed-9d7d-4e9388d374c0.result.json) | near Akasaka | RECORDED_RESOLVED Akasaka (35.6710403, 139.7345469) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-04-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-04-attempt-1/runner/2026-10-22T08-55-33-055Z-52866809-a474-4ee5-a11a-bdeecf2fc251.result.json) | near Ningyocho | GOOGLE_LOCATION_UNRESOLVED | RESOLVED Nihonbashiningyocho (35.6852807, 139.7843792) |
| [EXPOSED_HOLDOUT1 / h-05-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-05-attempt-1/runner/2026-10-22T09-01-13-202Z-28d5e06b-c9ab-4000-8edc-5f66376d9866.result.json) | near Gotanda | RECORDED_RESOLVED Gotanda (35.62651880000001, 139.7233535) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-06-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-06-attempt-1/runner/2026-10-22T09-09-26-737Z-26fa6d0e-0c30-431c-a5ba-2393eb7d8422.result.json) | near Shimokitazawa | RECORDED_RESOLVED Shimokitazawa (35.665786, 139.66986269999998) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-07-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-07-attempt-1/runner/2026-10-22T09-19-53-736Z-8bed4854-5d97-4cce-89b2-8e44e62976aa.result.json) | near Ueno | RECORDED_RESOLVED Ueno (35.7087296, 139.7741538) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-08-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-08-attempt-1/runner/2026-10-22T09-33-41-137Z-69525c1d-a9d3-4354-9f87-45a855ea7adc.result.json) | near Sangenjaya | RECORDED_RESOLVED Sangenjaya (35.641253899999995, 139.667531) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-09-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-09-attempt-1/runner/2026-10-22T09-43-42-240Z-1fe7a835-0915-4fc1-9603-87143341155d.result.json) | near Akasaka | RECORDED_RESOLVED Akasaka (35.6710403, 139.7345469) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-10-attempt-2](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-10-attempt-2/runner/2026-10-22T10-02-38-844Z-601cd4b1-fabb-4d6f-ab5e-cc6fb4d7ce51.result.json) | near Ningyocho | GOOGLE_LOCATION_UNRESOLVED | RESOLVED Nihonbashiningyocho (35.6852807, 139.7843792) |
| [EXPOSED_HOLDOUT1 / h-11-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-11-attempt-1/runner/2026-10-22T10-08-08-592Z-7cea80fb-c1d8-46b7-9404-b2351e024565.result.json) | near Gotanda | RECORDED_RESOLVED Gotanda (35.62651880000001, 139.7233535) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-12-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-12-attempt-1/runner/2026-10-22T10-16-23-617Z-0cdaea8f-0db2-4085-b1f0-52b5abd4496a.result.json) | near Shimokitazawa | RECORDED_RESOLVED Shimokitazawa (35.665786, 139.66986269999998) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-13-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-13-attempt-1/runner/2026-10-22T10-24-28-216Z-3d45a76b-f3f7-4084-aec5-3ae45a846370.result.json) | near Ueno | RECORDED_RESOLVED Ueno (35.7087296, 139.7741538) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-14-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-14-attempt-1/runner/2026-10-22T10-34-03-531Z-73b364ae-f896-4535-a739-1d560e245acd.result.json) | near Sangenjaya | RECORDED_RESOLVED Sangenjaya (35.641253899999995, 139.667531) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-15-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-15-attempt-1/runner/2026-10-22T10-42-02-863Z-88cea1d7-adf7-49ac-ba2d-480dd1f199fc.result.json) | near Akasaka | RECORDED_RESOLVED Akasaka (35.6710403, 139.7345469) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-16-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-16-attempt-1/runner/2026-10-22T10-54-22-004Z-0404d30f-447d-4362-ab68-148bb7da5b3d.result.json) | near Ningyocho | GOOGLE_LOCATION_UNRESOLVED | RESOLVED Nihonbashiningyocho (35.6852807, 139.7843792) |
| [EXPOSED_HOLDOUT1 / h-17-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-17-attempt-1/runner/2026-10-22T11-00-05-204Z-c57bbc4a-28c6-40f0-9c49-b8df7f71801b.result.json) | near Gotanda | RECORDED_RESOLVED Gotanda (35.62651880000001, 139.7233535) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT1 / h-18-attempt-1](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-18-attempt-1/runner/2026-10-22T11-09-39-059Z-dd57f6be-315c-48a0-942a-01c2c92fcfde.result.json) | near Shimokitazawa | RECORDED_RESOLVED Shimokitazawa (35.665786, 139.66986269999998) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-01-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-01-attempt-1/runner/2026-10-22T20-13-00-252Z-526b2b8c-342f-4a01-a8e2-b807ed5efe0f.result.json) | near Asakusa | RECORDED_RESOLVED Asakusa (35.7185858, 139.7958849) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-02-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-02-attempt-1/runner/2026-10-22T20-21-53-560Z-f819f475-1c9b-477f-97f8-5a894c201a33.result.json) | near Kachidoki | RECORDED_RESOLVED Kachidoki (35.658221999999995, 139.7741538) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-03-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-03-attempt-1/runner/2026-10-22T20-30-45-800Z-b9a978ac-8482-454e-88db-6755dc9b684c.result.json) | near Ebisu | GOOGLE_LOCATION_UNRESOLVED | GOOGLE_LOCATION_UNRESOLVED |
| [EXPOSED_HOLDOUT2 / h-04-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-04-attempt-1/runner/2026-10-22T20-36-12-235Z-f9feab56-b5b3-4be4-8a3e-4a38d648a51b.result.json) | near Ikebukuro | RECORDED_RESOLVED Ikebukuro (35.734831400000004, 139.7077314) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-05-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-05-attempt-1/runner/2026-10-22T20-43-38-839Z-2e52f0d5-3b06-4ffa-9d79-39441e048cf6.result.json) | near Azabu-Juban | RECORDED_RESOLVED Azabujuban (35.6546541, 139.7351855) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-06-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-06-attempt-1/runner/2026-10-22T20-55-22-196Z-f6df6ee3-8afe-4ac1-9e72-dac007be4ff6.result.json) | near Shimbashi | GOOGLE_LOCATION_UNRESOLVED | RESOLVED Shinbashi (35.6648291, 139.7562635) |
| [EXPOSED_HOLDOUT2 / h-07-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-07-attempt-1/runner/2026-10-22T21-00-48-996Z-5bda4130-c758-4325-9937-95ca0a8a0490.result.json) | near Asakusa | RECORDED_RESOLVED Asakusa (35.7185858, 139.7958849) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-08-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-08-attempt-1/runner/2026-10-22T21-08-48-119Z-7c5b19c9-1ab5-4a97-b408-706286ea0e27.result.json) | near Kachidoki | RECORDED_RESOLVED Kachidoki (35.658221999999995, 139.7741538) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-09-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-09-attempt-1/runner/2026-10-22T21-17-21-383Z-60c026f8-95d7-4d54-902c-dc8c55d6ec43.result.json) | near Ebisu | GOOGLE_LOCATION_UNRESOLVED | GOOGLE_LOCATION_UNRESOLVED |
| [EXPOSED_HOLDOUT2 / h-10-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-10-attempt-1/runner/2026-10-22T21-22-46-248Z-739fc177-ba6b-4435-8008-122fb6f27dfb.result.json) | near Ikebukuro | RECORDED_RESOLVED Ikebukuro (35.734831400000004, 139.7077314) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-11-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-11-attempt-1/runner/2026-10-22T21-30-21-586Z-4e926f5b-c6ca-4fc3-9975-e3caa5735295.result.json) | near Azabu-Juban | RECORDED_RESOLVED Azabujuban (35.6546541, 139.7351855) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-12-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-12-attempt-1/runner/2026-10-22T21-38-48-616Z-5c215285-e59c-479a-b6ef-39a8a128bce2.result.json) | near Shimbashi | GOOGLE_LOCATION_UNRESOLVED | RESOLVED Shinbashi (35.6648291, 139.7562635) |
| [EXPOSED_HOLDOUT2 / h-13-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-13-attempt-1/runner/2026-10-22T21-44-15-315Z-be6e05c4-5456-4289-b12a-386a949a0dfe.result.json) | near Asakusa | RECORDED_RESOLVED Asakusa (35.7185858, 139.7958849) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-14-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-14-attempt-1/runner/2026-10-22T21-53-04-891Z-c79d2b8b-c204-4881-85cf-14df3498cc6a.result.json) | near Kachidoki | RECORDED_RESOLVED Kachidoki (35.658221999999995, 139.7741538) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-15-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-15-attempt-1/runner/2026-10-22T22-01-57-482Z-a45bf287-2aff-4872-bfbe-62acfa11a0d2.result.json) | near Ebisu | GOOGLE_LOCATION_UNRESOLVED | GOOGLE_LOCATION_UNRESOLVED |
| [EXPOSED_HOLDOUT2 / h-16-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-16-attempt-1/runner/2026-10-22T22-07-25-660Z-8409f1aa-6cc4-40c8-8575-9fae22abc43b.result.json) | near Ikebukuro | RECORDED_RESOLVED Ikebukuro (35.734831400000004, 139.7077314) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-17-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-17-attempt-1/runner/2026-10-22T22-14-57-225Z-c8dcfdd4-7041-44a0-b3ac-3572bd4484b2.result.json) | near Azabu-Juban | RECORDED_RESOLVED Azabujuban (35.6546541, 139.7351855) | NOT_EVALUATED |
| [EXPOSED_HOLDOUT2 / h-18-attempt-1](../checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/h-18-attempt-1/runner/2026-10-22T22-23-30-930Z-8eac6ea7-3217-4bef-92a3-3d963636f225.result.json) | near Shimbashi | GOOGLE_LOCATION_UNRESOLVED | RESOLVED Shinbashi (35.6648291, 139.7562635) |

### Google 30 项只读检查

清单先在 `e04e9700` 提交，SHA-256：`206c368b15133eea1204ca82af026c043336ae66911e83bec9f78a34605b435d`。代码和脚本再随 `56ade9e8` 冻结，先空跑，再每项只调用一次既有 Text Search；没有重试、模型或餐厅网页请求。结果 **29/30**，Google 实际请求 **30**，达到 ≥29 的门槛。

该控制清单使用已有明确东京评测点的 locationBias，不是历史无 bias 的 Ebisu 调用。Ebisu 在此控制下成功，不能据此倒推历史空结果原因。Omotesando 的 HTTP200 返回 `Omote-Sando Avenue`，类型 `route`；因既有白名单不含 route 保持未解析，没有新增例外。原始公共字段、HTTP 状态、请求参数和响应 body SHA 见 [结果](location/google-30-read.json)。

| 输入地名 | 实际采用地点 | 来源类型 | 坐标 | HTTP／结果 |
|---|---|---|---|---|
| Shibuya | Shibuya | locality, political | 35.6619707, 139.70379499999999 | 200 / RESOLVED |
| Shinjuku | Shinjuku City | locality, political | 35.6938253, 139.7033559 | 200 / RESOLVED |
| Ikebukuro | Ikebukuro | sublocality_level_2, sublocality, political | 35.734831400000004, 139.7077314 | 200 / RESOLVED |
| Ueno | Ueno | sublocality_level_2, sublocality, political | 35.7087296, 139.7741538 | 200 / RESOLVED |
| Asakusa | Asakusa | sublocality_level_2, sublocality, political | 35.7185858, 139.7958849 | 200 / RESOLVED |
| Akihabara | Akihabara Electric Town | colloquial_area, political | 35.699647299999995, 139.7713703 | 200 / RESOLVED |
| Kanda | Kanda Station | transit_station, train_station, subway_station, transportation_service, point_of_interest, establishment | 35.6918216, 139.7709318 | 200 / RESOLVED |
| Tokyo Station | Tokyo Station | transit_station, train_station, subway_station, transportation_service, point_of_interest, establishment | 35.681299599999996, 139.76706579999998 | 200 / RESOLVED |
| Ginza | Ginza | sublocality_level_2, sublocality, political | 35.671222799999995, 139.7664859 | 200 / RESOLVED |
| Higashi-Ginza | Higashi-ginza Sta. | subway_station, transit_station, transportation_service, point_of_interest, establishment | 35.669700299999995, 139.7671399 | 200 / RESOLVED |
| Ningyocho | Nihonbashiningyocho | sublocality_level_2, sublocality, political | 35.6852807, 139.7843792 | 200 / RESOLVED |
| Nihonbashi | Nihonbashi | sublocality_level_2, sublocality, political | 35.6811836, 139.7741538 | 200 / RESOLVED |
| Shimbashi | Shinbashi | sublocality_level_2, sublocality, political | 35.6648291, 139.7562635 | 200 / RESOLVED |
| Shinbashi | Shinbashi | sublocality_level_2, sublocality, political | 35.6648291, 139.7562635 | 200 / RESOLVED |
| Ebisu | Ebisu | sublocality_level_2, sublocality, political | 35.6461371, 139.7153917 | 200 / RESOLVED |
| Nakameguro | Nakameguro | sublocality_level_2, sublocality, political | 35.638716099999996, 139.7026251 | 200 / RESOLVED |
| Kagurazaka | Kagurazaka | sublocality_level_2, sublocality, political | 35.701459799999995, 139.7402946 | 200 / RESOLVED |
| Kichijoji | Kichijōji | colloquial_area, political | 35.704096, 139.58020539999998 | 200 / RESOLVED |
| Jiyugaoka | Jiyugaoka | sublocality_level_2, sublocality, political | 35.6105884, 139.66689309999998 | 200 / RESOLVED |
| Koenji | Koenjikita | sublocality_level_2, sublocality, political | 35.7078984, 139.64648449999999 | 200 / RESOLVED |
| Shimokitazawa | Shimokitazawa | neighborhood, political | 35.665786, 139.66986269999998 | 200 / RESOLVED |
| Sangenjaya | Sangenjaya | sublocality_level_2, sublocality, political | 35.641253899999995, 139.667531 | 200 / RESOLVED |
| Gotanda | Gotanda | neighborhood, political | 35.62651880000001, 139.7233535 | 200 / RESOLVED |
| Meguro | Meguro City | locality, political | 35.6414529, 139.6980773 | 200 / RESOLVED |
| Yotsuya | Yotsuya | sublocality_level_2, sublocality, political | 35.685372699999995, 139.7287997 | 200 / RESOLVED |
| Akasaka | Akasaka | sublocality_level_2, sublocality, political | 35.6710403, 139.7345469 | 200 / RESOLVED |
| Ochanomizu | Ochanomizu Station | train_station, transit_station, transportation_service, point_of_interest, establishment | 35.6997175, 139.76444039999998 | 200 / RESOLVED |
| Aoyama-itchome | Aoyama-Itchome Station | subway_station, transit_station, transportation_service, point_of_interest, establishment | 35.6727759, 139.7239663 | 200 / RESOLVED |
| Aoyama Itchome | Aoyama-Itchome Station | subway_station, transit_station, transportation_service, point_of_interest, establishment | 35.6727759, 139.7239663 | 200 / RESOLVED |
| Omotesando | Omote-Sando Avenue | route | 35.667355, 139.707743 | 200 / UNRESOLVED |

## 3. 语义忠实：真实回放未通过

实现候选提交：`b8c705ca`，Semantic Prompt **v21 → v22**，Schema3／Compiler／State／Evaluator 不变。只补通用规则：比较方向和严格性独立于强弱；tradeable ceiling 仍是 SOFT ceiling；否定不能变成额外正向前提，也不补用户未要求的实现细节／附属设施。没有词语映射表。

准备了开发集 6 例、已暴露第一留出 6 例、已暴露第二阶段 b 留出 6 例，分别改前／改后各 3 次，共 **108 次真实调用**，没有 Schema 重试或 Provider 重跑，全部 PROPOSED／COMPILED。新私有留出未寻找或读取。只向仓库既有 DeepSeek API 发送 [冻结请求](semantic/prepared-requests.json) 中的语义消息和 Schema，见 [载荷审计](semantic/payload-audit.json)，不发送 Gold、标签、原回答或网页数据。

原产物的用例参考时刻与实际捕获的语义时刻不同；本批保留原输入，另做明确派生，让改前改后都采用捕获时刻。54 份 before 系统消息与原调用逐字一致。初次 materialized-time 准备稿保留为 preflight 文件，**未发送**；没有静默修订历史样本或用不同时刻解释效果。

- 预算方向：相关改后 **6/6** 保留 SOFT `under` 上限，没有改成 around 或 HARD cap。但该轮 before 也正确，故**没有证明方向问题的模型采样改善**；历史错误原 Proposal 另留 [红灯记录](semantic/known-red-observations.json)。
- 未说的 HARD：soba 例的三个 before、三个 after 都产生 `sit-down restaurant with tables`。**改后 3/3 仍违背本批要求，v22 未通过。** 31 项线下契约／Prompt 绿灯不能代替真实模型表现。
- 全部 54 对条件列表和全部 Compiler patch 变化均已列出：[可读比较](semantic/comparison.md)、[逐字段 JSON](semantic/comparison.json)、[108 份结果](semantic/results.json)。25 对 patch 有变化；不能由总门禁通过推导“其他例子全部不变差”，该验收没有被标为整体通过。

### 停止原因

150 次上限已用 108，剩 42。若继续改一版 Prompt，要对全部 18 例各采样 3 次，至少再需 54 次，总量 **162**。未擅自扩大到 162，也不挑少量样本代替要求的全量回归。按用户“需要决定就记录并停下”，此处停止；未改下一版 Prompt／Schema、未追加真实调用。见 [停止账本](stop.json)。

## 4. Goya：保存数据的第一卡点，未修复

三次均为同店原生身份 HIGH，用户的 2026-11-03、3 人已被页面选中。保存的 `find_vacancy` HTTP200 body 的 base_date／members 匹配，54 行中有 19:00。最后观察不是“人数未选中”或“没有收到结果”。

在原 HTML 与被动响应投影的离线重放中，`hasTabelogSelectedQuery=true`，但 `tabelogCapturedSlots` 返回 undefined、完成判定 false。第一条不符合当前时钟语法的行是索引 41，其公共链接带 `visit_time=2400`；后面共 13 行没有保留合法的 00:00–23:59 time 字段。现有循环只要任意一行不是合法时钟／链接就把整份响应作废，因此同请求 19:00 没被采纳，随后两次 COMPLETE 被拒，最终 EXTRACTION_FAILED。

录制会把 URL 变成允许字段投影；诊断仅按保存的这些字段重建原链接，没有点击或打开预订页面。缺失的原 time 文本没有伪造。原始完整 HTTP JSON 未存，因此不能把投影中被去掉的 time 字段当作其原始字面值。没有为了接受 19:00 而放宽全店、日期、人数或时刻绑定。

| 运行 | 原快照／全局 trace | 已选请求 | 响应日期／人数 | 库存行数／19:00 | 第一不支持行 | 完成 |
|---|---|---|---|---|---|---|
| h-05 | 27 / 389 | True | 2026-11-3 / 3 | 54 / True | 41 (visit_time=2400) | False |
| h-11 | 27 / 389 | True | 2026-11-3 / 3 | 54 / True | 41 (visit_time=2400) | False |
| h-17 | 27 / 388 | True | 2026-11-3 / 3 | 54 / True | 41 (visit_time=2400) | False |

证据：[三次 JSON](goya-diagnosis.json)、[诊断程序](goya-diagnose.mjs)。这定位了集合解析的卡点，尚未完成通用修复与反例验证，也未把它认定为已关闭；不加 Goya／站点专用分支。可能的后续方向是只依据完全绑定且可表示的当前请求行作结论，并对可能覆盖请求但无法解释的行继续 UNKNOWN；不能简单丢弃所有坏行后声称整窗无位。本批在语义额度决策处已停止，未实施该方向。

## 5. 门禁、代码行数与证明范围

当前停止候选的零外部调用检查也已完成：

| 检查 | 结果 | 范围 |
|---|---|---|
| typecheck / arch:check / npm test / build / test:browser:fixture | 全 PASS；默认1021/1021、Chromium136/136 | [完整门禁日志](gates/results.json)，不能替代真实语义验收 |
| 翻月／选店 | 69/69、5/5 | [缓存回归](regressions/regression-results.json)；相同固定请求内容，复用历史真实响应，0新模型 |
| Evaluator33/rubric29 校准 | 结果类型22/22、正常声明20/20 | [独立比较](regressions/calibration/comparison.json)；自动输出先于标签读取，两份中断继续未评 |

冻结4180项输入在提交后执行；精确数量见 regression-freeze.json。该回归只验证固定决策上下文／解码／旧结果评价，不评价v22对新请求的理解，也不能掩盖3/3未说HARD问题。历史region-composition指标已备份、另存新生成物、恢复原字节；没有清洗旧HTML、改Gold或覆盖旧录制。

代码行数采用 `06287b6f` 同一个程序、同一 `025940c5` 基线和排除规则，见 [审计程序](audit-generality.mjs)、[完整审计](generality-audit.json) 和 [本批对照](source-line-comparison.json)。窄口径仍为 3,863 行，混合文件口径仍为 6,359 行：**本批两者净增均为 0**。相对历史基线的 +272／+721 仍保留，整体历史退出 6 仍是 NOT_SATISFIED，没有把本批不增加改写成历史已经达标。共享层新增扫描命中 0 是有界静态证据，不是任意动态常量的证明。

按四层报告：端到端目标 NOT_EVALUATED（0 新完整任务）；逐环节为地点有限响应／Google 控制与语义成对回放；语义新增 HARD 的失败明确保留；Goya 仅诊断。没有新的现实库存、QUALIFIED_DELIVERY 或总体 S0 清除结论。缓存回归、合成 Fixture、真实模型固定文本、Google 只读 API 分开报告，均不代替 Live。

本批累计：真实模型 **108/150**，Google **30**，餐厅网站 **0**，完整 Live **0**。本链路原模型累计 3,634 加本批后为 **3,742/5,000**；全局余额不自动扩大本批 150 次许可。当前修复分支只本地提交，未推送、未合入主线；主线只收到已通过的前置集成。等待用户／复核者决定后续语义方案和额度。
