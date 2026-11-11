# 已保存站点页面 fixture 索引

- Evidence status: frozen regression；已暴露开发页面，不是Clean Baseline。
- 检查日期：2026-10-25。只补来源，不更新页面、不访问网站。物理HTML/保存JSON原字节保持。
- `capturedOn` 是采集日；旧provenance中的请求日期不作为采集日期。精确时间未保留的标明日期精度与依据。
- 本表含13份HTML和2份保存的页面/控件JSON；其余合成内联HTML不是站点采集页，编译fixture不是页面。
- 每份页面旁的 `*.provenance.json` 记录URL、采集日、来源版本/投影限制及SHA。历史eval录制由原始recording/started/输入manifest按snapshot序号追溯，不复制原文或改写冻结清单。

| fixture | 采集日 | 来源URL | provenance |
| --- | --- | --- | --- |
| [tablecheck-search-control-20260929.html](tablecheck-search-control-20260929.html) | 2026-09-29 | https://www.tablecheck.com/en/japan | [来源与版本](tablecheck-search-control-20260929.html.provenance.json) |
| [tablecheck-ginza-card-20260929.html](tablecheck-ginza-card-20260929.html) | 2026-09-29 | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.65860374437126&geo_longitude=139.74541383382513&search_text=omakase+ginza | [来源与版本](tablecheck-ginza-card-20260929.html.provenance.json) |
| [tabelog-teppen-calendar-20260929.html](tabelog-teppen-calendar-20260929.html) | 2026-09-29 | https://tabelog.com/en/tokyo/A1303/A130301/13308491/ | [来源与版本](tabelog-teppen-calendar-20260929.html.provenance.json) |
| [calendar-yuu-20261010.html](calendar-yuu-20261010.html) | 2026-10-10 | https://tabelog.com/en/tokyo/A1301/A130101/13291436/ | [来源与版本](calendar-yuu-20261010.html.provenance.json) |
| [calendar-labo-20261010.html](calendar-labo-20261010.html) | 2026-10-10 | https://tabelog.com/en/tokyo/A1303/A130301/13284556/ | [来源与版本](calendar-labo-20261010.html.provenance.json) |
| [tabelog-sen-no-slots-20261010.html](tabelog-sen-no-slots-20261010.html) | 2026-10-10 | https://tabelog.com/en/tokyo/A1303/A130301/13275802/ | [来源与版本](tabelog-sen-no-slots-20261010.html.provenance.json) |
| [tabelog-sen-no-slots-20261010.snapshot.json](tabelog-sen-no-slots-20261010.snapshot.json) | 2026-10-10 | https://tabelog.com/en/tokyo/A1303/A130301/13275802/ | [来源与版本](tabelog-sen-no-slots-20261010.snapshot.json.provenance.json) |
| [ginza-sushi-sendou.html](restaurant-prices/ginza-sushi-sendou.html) | 2026-10-11 | https://tabelog.com/en/tokyo/A1301/A130101/13295658/ | [来源与版本](restaurant-prices/ginza-sushi-sendou.html.provenance.json) |
| [ginza-outlet-13292459.html](restaurant-prices/ginza-outlet-13292459.html) | 2026-10-11 | https://tabelog.com/en/tokyo/A1301/A130103/13292459/ | [来源与版本](restaurant-prices/ginza-outlet-13292459.html.provenance.json) |
| [ginza-outlet-13277198.html](restaurant-prices/ginza-outlet-13277198.html) | 2026-10-11 | https://tabelog.com/en/tokyo/A1301/A130101/13277198/ | [来源与版本](restaurant-prices/ginza-outlet-13277198.html.provenance.json) |
| [tablecheck-recorded-menu.html](restaurant-prices/tablecheck-recorded-menu.html) | 2026-10-12 | https://www.tablecheck.com/en/alaska-asahi | [来源与版本](restaurant-prices/tablecheck-recorded-menu.html.provenance.json) |
| [aloft-public-20261019.html](restaurant-prices/aloft-public-20261019.html) | 2026-10-19 | https://www.tablecheck.com/en/aloft-tokyo-ginza | [来源与版本](restaurant-prices/aloft-public-20261019.html.provenance.json) |
| [empty-kaiseki.html](../../../integrations/tabelog/fixtures/empty-kaiseki.html) | 2026-10-16 | https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant | [来源与版本](../../../integrations/tabelog/fixtures/empty-kaiseki.html.provenance.json) |
| [p21-region-homepage-categories.html](../../../integrations/tabelog/fixtures/p21-region-homepage-categories.html) | 2026-10-19 | https://tabelog.com/en/tokyo/A1303/?sw=omakase | [来源与版本](../../../integrations/tabelog/fixtures/p21-region-homepage-categories.html.provenance.json) |
| [ginza-bistro-empty.json](../../../integrations/tablecheck/fixtures/ginza-bistro-empty.json) | 2026-10-09 | https://www.tablecheck.com/en/0711-ginzabistro | [来源与版本](../../../integrations/tablecheck/fixtures/ginza-bistro-empty.json.provenance.json) |

## 超过30天的页面

无。最早采集日2026-09-29，至检查日26天；日期来自现有fixture/捕获目录及登记证据，没有重新采集。

## 证明范围

片段/DOM转录会明确标明裁剪、测试脚本和布局注入；不把合成控件补丁称为原始录制。不以旧页面证明当前网站结构、库存或可预约。

## F1b 模块 fixtures（2026-10-24）

以下保存页面来自已提交的暴露开发记录；原始字节（或解压后字节）和 SHA 保留，来源/采集日期依据见相邻 provenance。地区链接片段仅为观察投影，不是完整页面 Replay。

| Fixture | 采集日 | 来源 |
| --- | --- | --- |
| [snapshot-0019.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-09-attempt-2/recordings/hybrid-1792594833872/snapshot-0019.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13300814/ |
| [snapshot-0025.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-10-attempt-1/recordings/hybrid-1792595445891/snapshot-0025.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1320/A132001/13282321/ |
| [snapshot-0032.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-10-attempt-1/recordings/hybrid-1792595445891/snapshot-0032.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1320/A132001/13320287/ |
| [snapshot-0016.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-12-attempt-1/recordings/hybrid-1792596481976/snapshot-0016.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130103/13292459/ |
| [snapshot-0019.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-13-attempt-1/recordings/hybrid-1792596955148/snapshot-0019.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13300814/ |
| [snapshot-0029.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-14-attempt-1/recordings/hybrid-1792597629982/snapshot-0029.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1320/A132001/13192886/ |
| [snapshot-0017.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-16-attempt-1/recordings/hybrid-1792598779679/snapshot-0017.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130101/13295658/ |
| [snapshot-0024.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-16-attempt-1/recordings/hybrid-1792598779679/snapshot-0024.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130103/13292459/ |
| [snapshot-0019.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-05-attempt-2/recordings/hybrid-1792589828211/snapshot-0019.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13300814/ |
| [snapshot-0032.html](../../../application/fixtures/restaurant-presentation-evidence/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-06-attempt-1/recordings/hybrid-1792590489941/snapshot-0032.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1320/A132001/13320287/ |
| [child.html](../../../integrations/restaurant-search/fixtures/p2-2-selection-20261019/followup/region-inputs/child.html) | 2026-10-19 | https://tabelog.com/en/tokyo/A1304/A130401/ |
| [parent.html](../../../integrations/restaurant-search/fixtures/p2-2-selection-20261019/followup/region-inputs/parent.html) | 2026-10-19 | https://tabelog.com/en/tokyo/A1304/ |
| [root.html](../../../integrations/restaurant-search/fixtures/p2-2-selection-20261019/followup/region-inputs/root.html) | 2026-10-19 | https://tabelog.com/en/tokyo/ |
| [snapshot-0033.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/recordings/hybrid-1792581432961/snapshot-0033.html) | 2026-10-21 | https://tabelog.com/cn/tokyo/A1309/A130905/13300814/ |
| [snapshot-0034.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/recordings/hybrid-1792581432961/snapshot-0034.html) | 2026-10-21 | https://tabelog.com/cn/tokyo/A1309/A130905/13048623/ |
| [c-01-13225919.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-01-13225919.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1303/A130301/13225919/ |
| [c-01-13261619.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-01-13261619.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1303/A130301/13261619/ |
| [c-01-13274777.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-01-13274777.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1303/A130301/13274777/ |
| [c-01-13275802.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-01-13275802.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1303/A130301/13275802/ |
| [c-01-13298154.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-01-13298154.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1303/A130301/13298154/ |
| [c-01-13307953.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-01-13307953.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1303/A130301/13307953/ |
| [c-01-13319616.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-01-13319616.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1303/A130301/13319616/ |
| [c-02-13189458.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-02-13189458.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130101/13189458/ |
| [c-02-13228975.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-02-13228975.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130101/13228975/ |
| [c-02-13280412.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-02-13280412.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130101/13280412/ |
| [c-02-13291473.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-02-13291473.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130101/13291473/ |
| [c-02-13292459.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-02-13292459.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130103/13292459/ |
| [c-02-13295658.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-02-13295658.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130101/13295658/ |
| [c-02-13323643.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-02-13323643.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1301/A130101/13323643/ |
| [c-05-13048623.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-05-13048623.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13048623/ |
| [c-05-13180712.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-05-13180712.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13180712/ |
| [c-05-13218101.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-05-13218101.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13218101/ |
| [c-05-13281152.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-05-13281152.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13281152/ |
| [c-05-13300814.html](../../../integrations/tabelog/fixtures/availability/checkpoint-c-live-20261020/tabelog-query-binding-20261021/inputs/c-05-13300814.html) | 2026-10-21 | https://tabelog.com/en/tokyo/A1309/A130905/13300814/ |
| [p1fB-h001-a1.snapshot-0045.html](../../../integrations/tabelog/fixtures/availability/p2-2-selection-20261019/followup/busy-inputs/p1fB-h001-a1.snapshot-0045.html) | 2026-10-11 | https://tabelog.com/tokyo/A1303/A130301/13293469/ |
| [p1g-h001-a1.snapshot-0044.html](../../../integrations/tabelog/fixtures/availability/p2-2-selection-20261019/followup/busy-inputs/p1g-h001-a1.snapshot-0044.html) | 2026-10-12 | https://tabelog.com/tokyo/A1303/A130301/13293469/ |
| [p20-h001-a1.snapshot-0033.html](../../../integrations/tabelog/fixtures/availability/p2-2-selection-20261019/followup/busy-inputs/p20-h001-a1.snapshot-0033.html) | 2026-10-15 | https://tabelog.com/tokyo/A1303/A130301/13293469/ |

## 2026-10-25：Eval 最小摘录

以下2份为已保存页面的必要元素摘录，含明确合成替值与页面外壳，不是完整站点回放。原始来源及SHA保留在各自provenance中。

| fixture | 采集日 | 来源URL | provenance |
| --- | --- | --- | --- |
| [health-deadline-listing.html](../../../eval/restaurant/agent-loop/fixtures/health-deadline-listing.html) | 2026-10-25 | https://tabelog.com/en/tokyo/A1301/ | [来源与最小提取](../../../eval/restaurant/agent-loop/fixtures/health-deadline-listing.provenance.json) |
| [slot1-public-map.html](../../../eval/restaurant/agent-loop/fixtures/slot1-public-map.html) | 2026-10-25 | https://tabelog.com/en/tokyo/A1322/A132202/13155817/ | [槽1最小提取与合成替值](../../../eval/restaurant/agent-loop/fixtures/slot1-public-map.provenance.json) |

## 2026-11-09：D8已绑定店页查位组件

20份真实清洗DOM，原字节与决策投影保留；缺动态店铺JSON，只有组件回归，不是完整Replay。已暴露开发页，不是Clean Baseline。

| fixture | 采集日 | 来源URL | provenance |
| --- | --- | --- | --- |
| [snapshot-0005.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0005.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0005.html.provenance.json) |
| [snapshot-0006.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0006.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0006.html.provenance.json) |
| [snapshot-0007.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0007.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0007.html.provenance.json) |
| [snapshot-0008.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0008.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0008.html.provenance.json) |
| [snapshot-0019.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0019.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0019.html.provenance.json) |
| [snapshot-0020.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0020.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0020.html.provenance.json) |
| [snapshot-0021.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0021.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0021.html.provenance.json) |
| [snapshot-0022.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0022.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0022.html.provenance.json) |
| [snapshot-0023.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0023.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0023.html.provenance.json) |
| [snapshot-0024.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0024.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0024.html.provenance.json) |
| [snapshot-0025.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0025.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0025.html.provenance.json) |
| [snapshot-0026.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0026.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0026.html.provenance.json) |
| [snapshot-0027.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0027.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0027.html.provenance.json) |
| [snapshot-0028.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0028.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0028.html.provenance.json) |
| [snapshot-0029.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0029.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0029.html.provenance.json) |
| [snapshot-0030.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0030.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0030.html.provenance.json) |
| [snapshot-0041.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0041.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0041.html.provenance.json) |
| [snapshot-0042.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0042.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0042.html.provenance.json) |
| [snapshot-0043.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0043.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0043.html.provenance.json) |
| [snapshot-0044.html](../../fixtures/d8-direct-outlet-20261109/snapshot-0044.html) | 2026-11-09 | https://www.tablecheck.com/en/nakamata-nodoguro-ginza | [来源与限制](../../fixtures/d8-direct-outlet-20261109/snapshot-0044.html.provenance.json) |
