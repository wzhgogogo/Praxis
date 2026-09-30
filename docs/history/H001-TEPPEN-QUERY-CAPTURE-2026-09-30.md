# H001 Teppen query evidence capture repair

- Status: earlier offline diagnostic-path repair / exposed development evidence; **no new source or model run in this phase**. The subsequently authorized one-page read and target-date follow-up are [recorded separately](H001-TEPPEN-TARGET-DATE-2026-09-30.md). No H001 stock acceptance.
- Scope: one saved Teppen query-state failure, the existing browser case-slice trace and the existing one-page read probe. Native identity, original Gold, business query, stock-grounding and booking permissions remain unchanged.

## Failure and change

The immutable Sep 30 H001 browser-slice result (`a28db7af-18a2-4bc9-935e-29d96c99149f`) contains a settled snapshot but only a full-page hash, selected opening tags and controls. It cannot reconstruct the current calendar cell ownership, hidden ancestors or selected query. An offline assertion for `queryRegions` against that old artifact fails and is retained in `/private/tmp/praxis-h001-query-recorder-old-artifact-red.log`; this demonstrates the **recording defect**, not a production availability false-negative.

The case-slice Runner now uses one trace wrapper that records every observed control, including disabled and otherwise unlabeled controls, with profile/review labels and URL queries redacted. Each snapshot records only the booking widget's allowlisted markup: date cell classes and `data-year/month/day`, guest/time selected and disabled markers, safe hidden guest/time values, no-seat text, and markup-level hidden state on the widget and ancestors. `computedVisibility: UNKNOWN` explicitly prevents static HTML from claiming actual visibility. Loading and settled snapshots remain separate. Full page text is replaced by hash/length; scripts, styles, links, unrelated form values, cookies, headers and review/profile content are not saved. Captured Tabelog vacancy responses keep only status, source URL without query, base date, members, time and the outlet/date/party/time link parameters needed for later independent binding; no active inventory API request was added.

The existing read-only browser probe accepts `--capture-query-state` for Tabelog. It uses the same snapshot recorder, source control hints and passive `find_vacancy` response allowlist. It records an initial observation and a second observation after the existing settled-state wait, including when the wait fails. Its per-run cap is 30 seconds on default local Chromium, and it cannot click, fill, submit or call a model.

## Offline verification and source-path limit

The existing saved Teppen HTML, through the actual browser-slice `BrowserSession` trace wrapper, durable journal and local Chromium Fixture, now preserves the September 30 `day-num--closed` cell and all observed controls; an independent unit scenario preserves an `is-current` date and guest value when those markers exist. A loading-to-settled probe test uses the same saved DOM and captures both states without an active inventory request. The saved Teppen DOM has no selected date and shows September 29 telephone and September 30 closed; these are **Sep 29 observations**, not a reconstruction of the Sep 30 Live DOM. The only observed `Reserve` link in that saved document is `href="#"` inside the widget and hidden in the restricted state. The independently working Isseki Sanchou widget belongs to another outlet, so it is not a Teppen alternate route. No evidence justifies changing `UNKNOWN` into request-bound `UNAVAILABLE` or opening the booking form.

Validation: targeted recorder/probe tests 6/6, saved-DOM local Chromium test 1/1, default offline `npm test` 564/564 after the local-server sandbox `listen EPERM` rerun, typecheck, architecture check and build pass. The saved old artifact stays immutable. No external read, Google, DeepSeek or booking write followed this repair.

## Prepared one-page evidence run — later executed under separate authorization

The following command was prepared for separate review/authorization and a same-day request check. Its single authorized execution is documented in the [follow-up](H001-TEPPEN-TARGET-DATE-2026-09-30.md):

```bash
PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 PRAXIS_ALLOW_BROWSER_RUN=1 PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM node --env-file-if-exists=.env --import tsx src/eval/restaurant/agent-loop/runners/run-browser-read-probe.ts --url 'https://tabelog.com/en/tokyo/A1303/A130301/13308491/' --timeout-ms 30000 --date 2026-09-30 --party-size 2 --capture-query-state
```

The CLI rejects a browser proxy or nonlocal engine in this mode. It opens **one** public detail URL, passively observes only the site's own vacancy responses, and writes immutable `.started.json`/`.result.json` under `.eval-artifacts/restaurant-browser-probe/`; the result's `queryTrace` contains initial and settled sanitized snapshots plus complete redacted control arrays and their snapshot sequence. It does not run Google, a model, the full H001 Case, or any reservation action. If the authorized date is already elapsed, this command must be reconsidered rather than silently advancing the Gold. A source timeout or absent widget remains a recorded limit, never zero availability.

## 主chat授权后实际单页采证

用户回复“你跑一下试试”后，主chat执行上述命令一次。Run `5a3d7214-3ecc-4835-9c5f-ffb4edea9d9c`，2026-09-30 03:10:02.966–03:10:11.866 UTC，8.900秒，CONTENT_OBSERVED/readyMarker OBSERVED；零模型、无点击填写提交。原始脱敏产物：`.eval-artifacts/restaurant-browser-probe/2026-09-30T03-10-02-966Z-5a3d7214-3ecc-4835-9c5f-ffb4edea9d9c.result.json`。

两次观察记录加载→稳定。稳定查询区域caption Sep2026，30日日格为day-num--closed且无可选择日期节点；无is-current。Guests1–6可见且disabled，2为selected，hidden guest value=2；时段区域无选项，显示No available seats for 2 guests。后续月份位于is-hidden区域；Reserve祖先标记隐藏。允许被动vacancy响应为空。此次证明当前页面目标日期处于不可选状态，不能据此宣称完成Sep30/19:00/2的请求绑定库存查询，也不能将closed类直接解释为实体餐厅停业。computedVisibility仍UNKNOWN，不将静态结构冒充完整渲染快照。

当前浏览器能到达并读出稳定页面，问题收敛为目标日期受限状态的读取/归因。已将新证据交回同Sol最小离线修复，使调用方读到目标日closed及尚缺时间绑定，而非笼统restricted；保持UNKNOWN库存边界，无追加来源/模型授权。
