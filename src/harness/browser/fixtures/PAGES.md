# 已保存站点页面 fixture 索引

- Evidence status: frozen regression；已暴露开发页面，不是Clean Baseline。
- 检查日期：2026-10-24。只补来源，不更新页面、不访问网站。物理HTML/保存JSON原字节保持。
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

无。最早采集日2026-09-29，至检查日25天；日期来自现有fixture/捕获目录及登记证据，没有重新采集。

## 证明范围

片段/DOM转录会明确标明裁剪、测试脚本和布局注入；不把合成控件补丁称为原始录制。不以旧页面证明当前网站结构、库存或可预约。
