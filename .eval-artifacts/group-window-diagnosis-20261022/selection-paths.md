# 六次选店与读取路径

Evidence status: superseded retrospective / exposed diagnostic. Only the six authorized runs are summarized; no original holdout prompt or Gold is reproduced.

Each row is an existing candidate record and Agent proposal. Direct URLs are source-owned discovered outlet links; they do not establish HARD or inventory. Full SHA references are in [sources.json](sources.json), structured observations in [evidence.json](evidence.json).

## c-04

Original [result](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-04-attempt-1/runner/2026-10-21T13-22-13-597Z-fe19189c-0a9c-4609-9ed5-18c8026a36bf.result.json); [decisions](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-04-attempt-1/runner/2026-10-21T13-22-13-597Z-fe19189c-0a9c-4609-9ed5-18c8026a36bf.decisions.jsonl).

| 顺序 | 门店 | 原生直接门店页 | 查位提议 | 最终查位记录 |
| --- | --- | --- | --- | --- |
| 1 | Specializing in Nodoguro Ginza Nakamata | [tablecheck](https://www.tablecheck.com/en/nakamata-nodoguro-ginza) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 2 | Ginza Yondaime Takahashiya | [tablecheck](https://www.tablecheck.com/en/takahashiya-ginza) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 3 | Kobikicho Tounai | [tablecheck](https://www.tablecheck.com/en/tounai) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 4 | M3 FELICE | [tablecheck](https://www.tablecheck.com/en/m3-felice) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 5 | Kinri Ginza store | [tablecheck](https://www.tablecheck.com/en/kanaike-kinri) | YES | UNKNOWN / REQUEST_SELECTION_UNCONFIRMED |
| 6 | Magdalena/ Grand Bach Tokyo Ginza | [tablecheck](https://www.tablecheck.com/en/grandbach-ginza-magdalena) | NO | NOT_REACHED |
| 7 | Modern Satoyama Cuisine ZEN HOUSE / Millennium Mitsui Garden Hotel Tokyo | [tablecheck](https://www.tablecheck.com/en/satoyama-zenhouse) | NO | NOT_REACHED |
| 8 | Fugu Specialist: Fugu Nakamata | [tablecheck](https://www.tablecheck.com/en/fugu-nakamata) | NO | NOT_REACHED |
| 9 | Ginza Masaki | [tablecheck](https://www.tablecheck.com/en/ginza-masaki) | NO | NOT_REACHED |
| 10 | Sumibiyakiniku GInza Teki | [tablecheck](https://www.tablecheck.com/en/teki) | NO | NOT_REACHED |

| 模型调用序号 | 动作 | 候选 ID | 已返回 trajectory |
| --- | --- | --- | --- |
| 2 | SEARCH_RESTAURANTS |  | YES |
| 3 | CHECK_AVAILABILITY | tablecheck:nakamata-nodoguro-ginza, tablecheck:takahashiya-ginza, tablecheck:tounai | YES |
| 12 | CHECK_AVAILABILITY | tablecheck:m3-felice, tablecheck:kanaike-kinri | YES |
| 15 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:nakamata-nodoguro-ginza, tablecheck:tounai, tablecheck:m3-felice | YES |
| 16 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:takahashiya-ginza, tablecheck:kanaike-kinri | YES |
| 17 | END_READ |  | YES |
| 18 | SEARCH_RESTAURANTS |  | YES |
| 19 | TIMEOUT |  | YES |

## c-08

Original [result](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-08-attempt-1/runner/2026-10-21T14-08-00-597Z-3bea8ed5-8aa6-4539-9207-9cc9ba56fd4f.result.json); [decisions](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-08-attempt-1/runner/2026-10-21T14-08-00-597Z-3bea8ed5-8aa6-4539-9207-9cc9ba56fd4f.decisions.jsonl).

| 顺序 | 门店 | 原生直接门店页 | 查位提议 | 最终查位记录 |
| --- | --- | --- | --- | --- |
| 1 | Specializing in Nodoguro Ginza Nakamata | [tablecheck](https://www.tablecheck.com/en/nakamata-nodoguro-ginza) | YES | UNKNOWN / REQUEST_SELECTION_UNCONFIRMED |
| 2 | Ginza Yondaime Takahashiya | [tablecheck](https://www.tablecheck.com/en/takahashiya-ginza) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 3 | Kobikicho Tounai | [tablecheck](https://www.tablecheck.com/en/tounai) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 4 | M3 FELICE | [tablecheck](https://www.tablecheck.com/en/m3-felice) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 5 | Kinri Ginza store | [tablecheck](https://www.tablecheck.com/en/kanaike-kinri) | YES | UNKNOWN / REQUEST_SELECTION_UNCONFIRMED |

| 模型调用序号 | 动作 | 候选 ID | 已返回 trajectory |
| --- | --- | --- | --- |
| 2 | SEARCH_RESTAURANTS |  | YES |
| 4 | CHECK_AVAILABILITY | tablecheck:nakamata-nodoguro-ginza, tablecheck:takahashiya-ginza, tablecheck:tounai | YES |
| 10 | CHECK_AVAILABILITY | tablecheck:m3-felice, tablecheck:kanaike-kinri | YES |
| 14 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:nakamata-nodoguro-ginza, tablecheck:takahashiya-ginza, tablecheck:tounai | YES |
| 15 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:m3-felice, tablecheck:kanaike-kinri | YES |
| 16 | TIMEOUT |  | YES |

## c-18

Original [result](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/runner/2026-10-21T16-23-52-862Z-cb6b94a5-2e3c-4053-aa07-6973db7433e7.result.json); [decisions](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/runner/2026-10-21T16-23-52-862Z-cb6b94a5-2e3c-4053-aa07-6973db7433e7.decisions.jsonl).

| 顺序 | 门店 | 原生直接门店页 | 查位提议 | 最终查位记录 |
| --- | --- | --- | --- | --- |
| 1 | Specializing in Nodoguro Ginza Nakamata | [tablecheck](https://www.tablecheck.com/en/nakamata-nodoguro-ginza) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 2 | Ginza Yondaime Takahashiya | [tablecheck](https://www.tablecheck.com/en/takahashiya-ginza) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 3 | Kobikicho Tounai | [tablecheck](https://www.tablecheck.com/en/tounai) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 4 | M3 FELICE | [tablecheck](https://www.tablecheck.com/en/m3-felice) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 5 | Kinri Ginza store | [tablecheck](https://www.tablecheck.com/en/kanaike-kinri) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 6 | Magdalena/ Grand Bach Tokyo Ginza | [tablecheck](https://www.tablecheck.com/en/grandbach-ginza-magdalena) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 7 | Modern Satoyama Cuisine ZEN HOUSE / Millennium Mitsui Garden Hotel Tokyo | [tablecheck](https://www.tablecheck.com/en/satoyama-zenhouse) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 8 | Fugu Specialist: Fugu Nakamata | [tablecheck](https://www.tablecheck.com/en/fugu-nakamata) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 9 | Ginza Masaki | [tablecheck](https://www.tablecheck.com/en/ginza-masaki) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 10 | Sumibiyakiniku GInza Teki | [tablecheck](https://www.tablecheck.com/en/teki) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 11 | Seafood Buffet Dining Ginza Happo | [tabelog](https://tabelog.com/en/tokyo/A1301/A130103/13292459/) | YES | UNKNOWN / RESERVE_REACHED |
| 12 | Kushiyaki Bistro Fukumimi Ginza koridō ten | [tabelog](https://tabelog.com/en/tokyo/A1301/A130101/13255508/) | NO | NOT_REACHED |
| 13 | YAKINIKU MARUUSHI Ginza honten | [tabelog](https://tabelog.com/en/tokyo/A1301/A130101/13138388/) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 14 | Vampire Café | [tabelog](https://tabelog.com/en/tokyo/A1301/A130101/13011570/) | YES | UNKNOWN / RESERVE_REACHED |

| 模型调用序号 | 动作 | 候选 ID | 已返回 trajectory |
| --- | --- | --- | --- |
| 2 | SEARCH_RESTAURANTS |  | YES |
| 3 | CHECK_AVAILABILITY | tablecheck:nakamata-nodoguro-ginza, tablecheck:takahashiya-ginza, tablecheck:tounai | YES |
| 13 | CHECK_AVAILABILITY | tablecheck:m3-felice, tablecheck:kanaike-kinri | YES |
| 18 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:nakamata-nodoguro-ginza, tablecheck:takahashiya-ginza, tablecheck:tounai | YES |
| 19 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:m3-felice, tablecheck:kanaike-kinri | YES |
| 20 | END_READ |  | YES |
| 21 | SEARCH_RESTAURANTS |  | YES |
| 22 | CHECK_AVAILABILITY | tablecheck:grandbach-ginza-magdalena, tablecheck:satoyama-zenhouse, tablecheck:fugu-nakamata | YES |
| 27 | CHECK_AVAILABILITY | tablecheck:ginza-masaki, tablecheck:teki | YES |
| 32 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:grandbach-ginza-magdalena, tablecheck:satoyama-zenhouse, tablecheck:fugu-nakamata | YES |
| 33 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:ginza-masaki, tablecheck:teki | YES |
| 34 | SEARCH_RESTAURANTS |  | YES |
| 37 | CHECK_AVAILABILITY | tabelog:en/tokyo/A1301/A130101/13138388, tabelog:en/tokyo/A1301/A130101/13011570, tabelog:en/tokyo/A1301/A130103/13292459 | YES |
| 47 | END_READ |  | YES |

## h-03

Original [result](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-03-attempt-1/runner/2026-10-22T08-42-01-645Z-8a1e9abe-a8ba-4eed-9d7d-4e9388d374c0.result.json); [decisions](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-03-attempt-1/runner/2026-10-22T08-42-01-645Z-8a1e9abe-a8ba-4eed-9d7d-4e9388d374c0.decisions.jsonl).

| 顺序 | 门店 | 原生直接门店页 | 查位提议 | 最终查位记录 |
| --- | --- | --- | --- | --- |
| 1 | Akasaka Yakiniku Hachimenroppi | [tablecheck](https://www.tablecheck.com/en/hachimenroppi) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 2 | Samjo Akasaka | [tablecheck](https://www.tablecheck.com/en/1seki3cho-akasaka-samjo) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 3 | Akasaka Obanzai Yoshiko | [tablecheck](https://www.tablecheck.com/en/obanzai-yoshiko) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 4 | KurogewagyuYakiniku Satsuma Ushinokura Akasaka | [tablecheck](https://www.tablecheck.com/en/ushinokura-akasaka) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 5 | Sushi Koshikawa | [tablecheck](https://www.tablecheck.com/en/sushi-koshikawa) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 6 | Ryusaika | [tablecheck](https://www.tablecheck.com/en/ryusaika) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 7 | Sumibi Kappo Shirosaka | [tablecheck](https://www.tablecheck.com/en/shirosaka) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 8 | aniko | [tablecheck](https://www.tablecheck.com/en/aniko) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 9 | Takashonabe Akahane | [tablecheck](https://www.tablecheck.com/en/kamo-akahane) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 10 | Wakiya Ichiemi Charou | [tablecheck](https://www.tablecheck.com/en/wakiya-ichiemi) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |

| 模型调用序号 | 动作 | 候选 ID | 已返回 trajectory |
| --- | --- | --- | --- |
| 2 | SEARCH_RESTAURANTS |  | YES |
| 4 | CHECK_AVAILABILITY | tablecheck:hachimenroppi, tablecheck:1seki3cho-akasaka-samjo, tablecheck:obanzai-yoshiko | YES |
| 8 | CHECK_AVAILABILITY | tablecheck:ushinokura-akasaka, tablecheck:sushi-koshikawa | YES |
| 12 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:hachimenroppi, tablecheck:1seki3cho-akasaka-samjo, tablecheck:ushinokura-akasaka | YES |
| 16 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:obanzai-yoshiko, tablecheck:sushi-koshikawa | YES |
| 23 | SEARCH_RESTAURANTS |  | YES |
| 24 | CHECK_AVAILABILITY | tablecheck:ryusaika, tablecheck:shirosaka, tablecheck:aniko | YES |
| 31 | CHECK_AVAILABILITY | tablecheck:kamo-akahane, tablecheck:wakiya-ichiemi | YES |
| 35 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:shirosaka, tablecheck:kamo-akahane, tablecheck:wakiya-ichiemi | YES |
| 41 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:ryusaika, tablecheck:aniko | YES |
| 46 | SEARCH_RESTAURANTS |  | YES |
| 47 | END_READ |  | YES |

## h-09

Original [result](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-09-attempt-1/runner/2026-10-22T09-43-42-240Z-1fe7a835-0915-4fc1-9603-87143341155d.result.json); [decisions](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-09-attempt-1/runner/2026-10-22T09-43-42-240Z-1fe7a835-0915-4fc1-9603-87143341155d.decisions.jsonl).

| 顺序 | 门店 | 原生直接门店页 | 查位提议 | 最终查位记录 |
| --- | --- | --- | --- | --- |
| 1 | Akasaka Yakiniku Hachimenroppi | [tablecheck](https://www.tablecheck.com/en/hachimenroppi) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 2 | Samjo Akasaka | [tablecheck](https://www.tablecheck.com/en/1seki3cho-akasaka-samjo) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 3 | Akasaka Obanzai Yoshiko | [tablecheck](https://www.tablecheck.com/en/obanzai-yoshiko) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 4 | KurogewagyuYakiniku Satsuma Ushinokura Akasaka | [tablecheck](https://www.tablecheck.com/en/ushinokura-akasaka) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 5 | Sushi Koshikawa | [tablecheck](https://www.tablecheck.com/en/sushi-koshikawa) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 6 | Ryusaika | [tablecheck](https://www.tablecheck.com/en/ryusaika) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 7 | Sumibi Kappo Shirosaka | [tablecheck](https://www.tablecheck.com/en/shirosaka) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 8 | aniko | [tablecheck](https://www.tablecheck.com/en/aniko) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 9 | Takashonabe Akahane | [tablecheck](https://www.tablecheck.com/en/kamo-akahane) | YES | UNKNOWN / BROWSER_TIMEOUT |
| 10 | Wakiya Ichiemi Charou | [tablecheck](https://www.tablecheck.com/en/wakiya-ichiemi) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |

| 模型调用序号 | 动作 | 候选 ID | 已返回 trajectory |
| --- | --- | --- | --- |
| 2 | SEARCH_RESTAURANTS |  | YES |
| 4 | CHECK_AVAILABILITY | tablecheck:hachimenroppi, tablecheck:1seki3cho-akasaka-samjo, tablecheck:obanzai-yoshiko | YES |
| 7 | CHECK_AVAILABILITY | tablecheck:ushinokura-akasaka, tablecheck:sushi-koshikawa | YES |
| 11 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:hachimenroppi, tablecheck:1seki3cho-akasaka-samjo, tablecheck:obanzai-yoshiko | YES |
| 18 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:ushinokura-akasaka, tablecheck:sushi-koshikawa | YES |
| 24 | SEARCH_RESTAURANTS |  | YES |
| 25 | CHECK_AVAILABILITY | tablecheck:ryusaika, tablecheck:shirosaka, tablecheck:aniko | YES |
| 32 | CHECK_AVAILABILITY | tablecheck:kamo-akahane, tablecheck:wakiya-ichiemi | YES |
| 36 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:ryusaika, tablecheck:shirosaka, tablecheck:aniko | NO; interrupted/in-flight |

## h-15

Original [result](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-15-attempt-1/runner/2026-10-22T10-42-02-863Z-88cea1d7-adf7-49ac-ba2d-480dd1f199fc.result.json); [decisions](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-15-attempt-1/runner/2026-10-22T10-42-02-863Z-88cea1d7-adf7-49ac-ba2d-480dd1f199fc.decisions.jsonl).

| 顺序 | 门店 | 原生直接门店页 | 查位提议 | 最终查位记录 |
| --- | --- | --- | --- | --- |
| 1 | Akasaka Yakiniku Hachimenroppi | [tablecheck](https://www.tablecheck.com/en/hachimenroppi) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 2 | Samjo Akasaka | [tablecheck](https://www.tablecheck.com/en/1seki3cho-akasaka-samjo) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 3 | Akasaka Obanzai Yoshiko | [tablecheck](https://www.tablecheck.com/en/obanzai-yoshiko) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 4 | KurogewagyuYakiniku Satsuma Ushinokura Akasaka | [tablecheck](https://www.tablecheck.com/en/ushinokura-akasaka) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 5 | Sushi Koshikawa | [tablecheck](https://www.tablecheck.com/en/sushi-koshikawa) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 6 | Ryusaika | [tablecheck](https://www.tablecheck.com/en/ryusaika) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 7 | Sumibi Kappo Shirosaka | [tablecheck](https://www.tablecheck.com/en/shirosaka) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |
| 8 | aniko | [tablecheck](https://www.tablecheck.com/en/aniko) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 9 | Takashonabe Akahane | [tablecheck](https://www.tablecheck.com/en/kamo-akahane) | YES | UNKNOWN / SELECTED_MEALTIME_EMPTY |
| 10 | Wakiya Ichiemi Charou | [tablecheck](https://www.tablecheck.com/en/wakiya-ichiemi) | YES | UNKNOWN / BROWSER_RUNTIME_FAILED |

| 模型调用序号 | 动作 | 候选 ID | 已返回 trajectory |
| --- | --- | --- | --- |
| 2 | SEARCH_RESTAURANTS |  | YES |
| 4 | CHECK_AVAILABILITY | tablecheck:hachimenroppi, tablecheck:1seki3cho-akasaka-samjo, tablecheck:obanzai-yoshiko | YES |
| 8 | CHECK_AVAILABILITY | tablecheck:ushinokura-akasaka, tablecheck:sushi-koshikawa | YES |
| 12 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:hachimenroppi, tablecheck:1seki3cho-akasaka-samjo, tablecheck:ushinokura-akasaka | YES |
| 16 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:obanzai-yoshiko, tablecheck:sushi-koshikawa | YES |
| 25 | SEARCH_RESTAURANTS |  | YES |
| 26 | CHECK_AVAILABILITY | tablecheck:ryusaika, tablecheck:shirosaka, tablecheck:aniko | YES |
| 33 | CHECK_AVAILABILITY | tablecheck:kamo-akahane, tablecheck:wakiya-ichiemi | YES |
| 37 | INVESTIGATE_CANDIDATE_FACTS | tablecheck:ryusaika, tablecheck:shirosaka, tablecheck:aniko | YES |
| 47 | END_READ |  | YES |
