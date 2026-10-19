# P2-1 checkpoint A — current executable / exposed development

用户批准进行检查点A。复用刚完成的0模型有/无Guard各20家对照、有效至10/20东京12:12后的同一见证认证、acfaaffa的10次基线；S0为0、基线预检ENV1次、4 TARGET原生来源命中0例，未触发新停止条件。A仅在干净39fc15e工作树执行，输入/见证/预检/指标与基线同字节；每次15模型/180秒/40Google，外层与计划先提交冻结，6份离线空跑0网络/模型。累计起点20/40探测、141/450模型、45Google；预检失败与基线合计超过2即停。A之后才单独修Google-only nearby，P2-1b/完整Live不启动。

Frozen production: `39fc15e5127f4283a24dd4abb4fc10e13636b876`; common baseline: `acfaaffa73db97413f6538f161c4e837ec64316e`. Outer SHA-256: `391923243bacebadd6775e65d03a18cf85c8cca6ad9f45c2ab2739b013bf8bb2`. [Prerequisites](prerequisites.json), [plan](plan.json), [freeze](freeze.json), [offline verification](dry-run.json).

Planning call durations/timeouts will be derived from captured real model calls and source-bound observations, without modifying the frozen Runner or filling unknown source observations. Four-layer evaluation and paired per-case/source metrics follow after execution.


## STOPPED — preflight failure limit

Current exposed-development evidence, **partial1/10 A formal probes**. H001 #2 failed TableCheck source preflight twice with0 models and no formal start. Including the1 restored-baseline failure, total3 exceeds approved maximum2. Stop triggered2026-10-19T04:01:52.592577Z; no further probes or network diagnostics. Remaining9 A probes are NOT_STARTED. The Google-only nearby fix is NOT_STARTED: it is ordered after A and the batch must stop. P2-1b and complete Live remain unstarted.

A production `39fc15e5127f4283a24dd4abb4fc10e13636b876`, baseline `acfaaffa73db97413f6538f161c4e837ec64316e`. Outer/plan frozen before execution in `e7e6913`. Same input, witness, source preflight and raw metrics;0 product/Prompt/Schema/config/Gold/variant/witness changes. [Audit](audit.json), [paired data](comparison.json), [ledger](ledger.json), [freeze](freeze.json).

### Preflight failures

| Attempt | Start / end UTC | Tabelog | TableCheck | Google | Model / formal start |
|---|---|---|---|---|---|
| [H001 #2 first](runs/p2-kf-h001-20261027/attempt-2/source-data-preflight.json) | 2026-10-19T04:00:21.325555+00:00 / 2026-10-19T04:01:03.606634+00:00 | 20 | count0 / EMPTY_RESULT / 28688ms | 1 | 0 / false |
| [H001 #2 retry](runs/p2-kf-h001-20261027/attempt-2-preflight-2/source-data-preflight.json) | 2026-10-19T04:01:13.502667+00:00 / 2026-10-19T04:01:52.592577+00:00 | 20 | count0 / EMPTY_RESULT / 25947ms | 1 | 0 / false |

Both attempts retain started/preflight-failure/source-data-preflight metadata and outer logs. No formal summary/decisions/recording is manufactured. TableCheck count0 is observed; API HTTP status and full request-level Guard trace were not retained by this preflight, so VPN/provider/Guard/parser root cause remains unconfirmed. The one retry was permitted while cumulative failures were2; the frozen outer refuses resuming the resulting limit stop.

### Baseline → A per-case comparison

Triplets: Tabelog / TableCheck / Google. First batch refers to exact-ID native detail attempts; Google N/A. NE means no formal A execution, not false or no restaurants.

| Case / repeat | B listing | A listing | B first | A first | Radius B→A* | Pages B→A | Models B→A | Formal ms B→A | A status |
|---|---|---|---|---|---|---|---|---|---|
| p2-kf-h001-20261027 #1 | false / false / true | true / false / false | false / false / N/A | false / false / N/A | 39→39 | 5→6 | 1→4 | 42541→64061 | RECORDED |
| p2-kf-h001-20261027 #2 | false / false / true | NE | false / false / N/A | NE | 39→NE | 5→NE | 1→NE | 44102→NE | ENV_FAILURE_PREFLIGHT_ONLY |
| p2-kagurazaka-kaiseki-20261029 #1 | false / false / false | NE | false / false / N/A | NE | 45→NE | 6→NE | 11→NE | 93505→NE | NOT_STARTED_STOP_RULE |
| p2-kagurazaka-kaiseki-20261029 #2 | false / false / false | NE | false / false / N/A | NE | 45→NE | 6→NE | 12→NE | 103353→NE | NOT_STARTED_STOP_RULE |
| p2-kf-h005-20261029 #1 | false / false / false | NE | false / false / N/A | NE | 45→NE | 4→NE | 3→NE | 51088→NE | NOT_STARTED_STOP_RULE |
| p2-kf-h005-20261029 #2 | false / false / false | NE | false / false / N/A | NE | 45→NE | 4→NE | 3→NE | 47689→NE | NOT_STARTED_STOP_RULE |
| p2-kichijoji-tempura-20261027 #1 | false / false / true | NE | false / false / N/A | NE | 50→NE | 9→NE | 6→NE | 108903→NE | NOT_STARTED_STOP_RULE |
| p2-kichijoji-tempura-20261027 #2 | false / false / true | NE | false / false / N/A | NE | 50→NE | 9→NE | 6→NE | 100411→NE | NOT_STARTED_STOP_RULE |
| p2-kf-h002-20261031 #1 | true / false / false | NE | false / false / N/A | NE | 30→NE | 6→NE | 3→NE | 88656→NE | NOT_STARTED_STOP_RULE |
| p2-nakameguro-yakiniku-20261030 #1 | false / false / true | NE | false / false / N/A | NE | 39→NE | 10→NE | 9→NE | 108105→NE | NOT_STARTED_STOP_RULE |

*Frozen inRadiusParsed includes Google coordinate candidates and is not a deduped count of identity/HARD/inventory-verified businesses. Raw source funnels retain native details separately. Unknown/unbound retrieval observations are not relabeled complete.

**H001 scope warning:** Sen13275802 and Matsumoto13261619 were observed in broad Tokyo/Shibuya navigation lists before keyword retrieval. The Agent then chose omakase, observed3 outlets and KEEP. Final keyword results and first native details are the same3 outlets as baseline, with0 certified witness details. Thus listing true alone does not prove a successful rewrite or improved downstream investigation. Google website-ID credit changed true→false for this one pair; no overall causal effect or CONTROL regression can be judged from1/10 A runs.

### Planning calls and timeouts

Baseline10 captures:0 restaurant_discovery_retrieval calls/0ms/0 timeouts (verified actual purposes). A H001 #1:3 planning calls,5940ms,0 timeouts; all SUCCEEDED, each bounded10000ms.

| Decision sequence | Scope | Observation / parsed count | Proposal | Latency ms | % source90s | Timeout |
|---|---|---|---|---:|---:|---|
| 2 | tabelog | https://tabelog.com/en/tokyo/A1303/ / 20 | KEYWORD omakase | 2305 | 2.561% | false |
| 3 | tabelog | https://tabelog.com/en/tokyo/A1303/?sw=omakase / 3 | KEEP | 1347 | 1.497% | false |
| 4 | SHARED_TEXT_RETRIEVAL | shared no-page plan / None | KEYWORD omakase | 2288 | N/A | false |

Tabelog planning3652ms=4.058% of its90000ms cap,10.405% of actual source35097ms. Shared text plan2288ms is reused across TableCheck/Google, counted once, not fully charged to both sources. Retrieval history elapsedMs is cumulative source time, not model latency; decisions.jsonl supplies actual call latency. Unstarted A planning metrics remain NE.

### Retrieval sequences and artifacts

- **p2-kf-h001-20261027 #1**: [baseline summary](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-1/probe-summary.json); A RECORDED.
  - B tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `20`, displayed `36`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=omakase`.
  - B tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `3`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - B tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `3`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - B tablecheck: KEYWORD; keyword `omakase`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase`.
  - B google-places: KEYWORD; keyword `omakase`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
  - A tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `139481`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/`.
  - A tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `5618`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/`.
  - A tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `5618`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/`.
  - A tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `3`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/?sw=omakase`.
  - A tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `3`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/?sw=omakase`.
  - A tablecheck: KEYWORD; keyword `omakase`, category `None`; parsed `20`, displayed `None`; `OBSERVED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase`.
  - A google-places: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:nearby-search`.
  - A [summary](runs/p2-kf-h001-20261027/attempt-1/probe-summary.json).
  - A [decisions](runs/p2-kf-h001-20261027/attempt-1/probe.decisions.jsonl).
  - A [trace](runs/p2-kf-h001-20261027/attempt-1/trace.jsonl).
  - A [recording](runs/p2-kf-h001-20261027/attempt-1/recording/p2-kf-h001-20261027/recording.json).
- **p2-kf-h001-20261027 #2**: [baseline summary](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-2/probe-summary.json); A ENV_FAILURE_PREFLIGHT_ONLY.
  - B tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `20`, displayed `36`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=omakase`.
  - B tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `3`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - B tabelog: KEYWORD; keyword `omakase`, category `None`; parsed `3`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - B tablecheck: KEYWORD; keyword `omakase`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase`.
  - B google-places: KEYWORD; keyword `omakase`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
- **p2-kagurazaka-kaiseki-20261029 #1**: [baseline summary](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant`.
  - B tabelog: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant`.
  - B tabelog: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `20`, displayed `10367`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/C13104/rstLst/`.
  - B tablecheck: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki+restaurant`.
  - B google-places: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
- **p2-kagurazaka-kaiseki-20261029 #2**: [baseline summary](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant`.
  - B tabelog: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant`.
  - B tabelog: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `20`, displayed `10367`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/C13104/rstLst/`.
  - B tablecheck: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki+restaurant`.
  - B google-places: KEYWORD; keyword `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
- **p2-kf-h005-20261029 #1**: [baseline summary](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-1/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: KEYWORD; keyword `local food`, category `None`; parsed `2`, displayed `2`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=local+food`.
  - B tablecheck: KEYWORD; keyword `local food`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food`.
  - B google-places: KEYWORD; keyword `local food`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
- **p2-kf-h005-20261029 #2**: [baseline summary](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-2/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: KEYWORD; keyword `local food`, category `None`; parsed `2`, displayed `2`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=local+food`.
  - B tablecheck: KEYWORD; keyword `local food`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food`.
  - B google-places: KEYWORD; keyword `local food`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
- **p2-kichijoji-tempura-20261027 #1**: [baseline summary](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-1/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `0`, displayed `None`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=tempura+restaurant`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `0`, displayed `42`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/rstLst/?sw=tempura+restaurant`.
  - B tabelog: KEYWORD; keyword `restaurant`, category `None`; parsed `0`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/tempura/?sw=restaurant`.
  - B tabelog: KEYWORD; keyword `restaurant`, category `English`; parsed `1`, displayed `1`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1328/rstLst/tempura/?sw=restaurant`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `0`, displayed `139480`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `20`, displayed `2819`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1320/`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `20`, displayed `2819`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1320/`.
  - B tablecheck: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura+restaurant`.
  - B google-places: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
- **p2-kichijoji-tempura-20261027 #2**: [baseline summary](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-2/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `0`, displayed `None`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=tempura+restaurant`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `0`, displayed `42`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/rstLst/?sw=tempura+restaurant`.
  - B tabelog: KEYWORD; keyword `restaurant`, category `None`; parsed `0`, displayed `3`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/tempura/?sw=restaurant`.
  - B tabelog: KEYWORD; keyword `restaurant`, category `English`; parsed `1`, displayed `1`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1328/rstLst/tempura/?sw=restaurant`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `0`, displayed `139480`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `20`, displayed `2819`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1320/`.
  - B tabelog: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `20`, displayed `2819`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1320/`.
  - B tablecheck: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura+restaurant`.
  - B google-places: KEYWORD; keyword `tempura restaurant`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.
- **p2-kf-h002-20261031 #1**: [baseline summary](../network-restored-20261019/baseline/p2-kf-h002-20261031/attempt-1/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `139480`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/`.
  - B tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `6252`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1301/`.
  - B tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `2658`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1301/A130101/`.
  - B tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `5034`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/`.
  - B tabelog: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `20`, displayed `5034`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/`.
  - B tablecheck: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false`.
  - B google-places: CATEGORY_OR_GENERAL_LIST; keyword `None`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:nearby-search`.
- **p2-nakameguro-yakiniku-20261030 #1**: [baseline summary](../network-restored-20261019/baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe-summary.json); A NOT_STARTED_STOP_RULE.
  - B tabelog: KEYWORD; keyword `yakiniku`, category `None`; parsed `20`, displayed `2870`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=yakiniku`.
  - B tabelog: KEYWORD; keyword `yakiniku`, category `None`; parsed `20`, displayed `51`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1316/rstLst/?sw=yakiniku`.
  - B tabelog: KEYWORD; keyword `yakiniku`, category `None`; parsed `15`, displayed `15`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1316/A131601/rstLst/?sw=yakiniku`.
  - B tabelog: KEYWORD; keyword `yakiniku`, category `None`; parsed `15`, displayed `15`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/?sw=yakiniku`.
  - B tabelog: KEYWORD; keyword `yakiniku`, category `None`; parsed `0`, displayed `605`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1316/A131601/`.
  - B tabelog: KEYWORD; keyword `yakiniku`, category `None`; parsed `0`, displayed `628`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/`.
  - B tabelog: KEYWORD; keyword `yakiniku`, category `None`; parsed `0`, displayed `605`; `OBSERVED_LISTING`; URL `https://tabelog.com/en/tokyo/A1316/A131601/`.
  - B tablecheck: KEYWORD; keyword `yakiniku`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku`.
  - B google-places: KEYWORD; keyword `yakiniku`, category `None`; parsed `None`, displayed `None`; `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; URL `google-places:text-search`.

Full accepted retrieval histories, reasons, source counts, source IDs and raw URLs remain in comparison.json and original summaries; no A sequence is imputed for9 unstarted runs.

### Four-layer evaluation and proof scope

1. **End-to-end:** NOT_EVALUATED; discovery only, no inventory/qualification/delivery. A denominator1 formal/10 planned,9 unstarted. No A-wide pass/failure or TARGET improvement conclusion.
2. **Stages:** frozen semantics and observed listing/native-detail metrics above. Broad navigation-list hits differ from selected keyword hits; exact Google website-source IDs alone earn Google credit. Metric binding/scope gaps retained, no synthetic unknown values or independent causal labels. CONTROL comparison remains NOT_EVALUATED.
3. **Severity:** actual completed A trace independent S0_BOUNDARY ABSENT; preflight-only attempts lack formal trace and remain NOT_EVALUATED. No S0 observed. S0 declaration/S1–S4/full business correctness remain NOT_EVALUATED. Unknown GET side effects are outside network-shape proof. Recording NOT_REPLAYABLE/UNSAFE_DOCUMENT; no faithful Replay pass.
4. **Attribution:** ENV stage/count/EMPTY_RESULT observed, underlying cause unconfirmed. Runtime codes/proposals do not establish causation; no repair made during frozen execution.

### Verification, usage, and next gate

- A preparation: same6 inputs, zero-network/model offline plans and state/stop predicate tests PASS; outer SHA in freeze, production worktree clean, all frozen source/input hashes PASS. Source equals combined-gate39fc15e; reuse typecheck/arch/build PASS,940/940 and real Chromium116/116. Completed run4 calls=4 captured rows (all successful), SHA/trace/recording and paired input hashes checked. Final changes are docs/artifacts only; verify links/diff/authority and preserve user drafts.
- Reused prerequisites: common GET/CORS fix and five gates, zero-model unguarded/guarded20/20 TableCheck verification,32-GET witness recertification valid for all actual starts, restored10 baselines. No repeated certification/connection checks or extra diagnostics.
- New A batch:1 formal probe,4 successful models,2 formal+3 preflight Google=5,2 preflight-only ENV,0 formal retries,0 complete Live. **Cumulative21/40 probes,145/450 models,50 Google**; fresh baseline+A preflight failures3. Older superseded baseline failures are historical, excluded from this fresh-cycle count.
- Stop and push partial evidence. Remaining9 A and after-A Google-only nearby fix require a later continuation after the environment recovers; P2-1b remains unstarted.
