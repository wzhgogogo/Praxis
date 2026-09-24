# MARUNOUCHI BASE source discovery — B1 bounded experiment

- Status: current executable / exposed development diagnostic
- Document revision: 0.2
- Baseline: `027bb25`
- Scope: Tabelog search entrance only; identity thresholds, other providers, retries and inventory unchanged

## Frozen input and independent expectation

The [H003 result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-24T04-15-48-109Z-b953c40e-e0ec-4aa2-b87e-8ae324794859.result.json) preserves candidate MARUNOUCHI BASE at Tokyo Chiyoda Marunouchi 1-3-4, phone `050-2018-8952`. Tabelog discovery requested `https://tabelog.com/en/rstLst/?sw=MARUNOUCHI%20BASE` and returned a page titled `Best Restaurants near Marunouchi Sta.(Aichi)` with three Aichi outlets; the matcher correctly rejected them. The independently existing [Tabelog Tokyo outlet](https://tabelog.com/en/tokyo/A1302/A130201/13251017/) lists the same name, Tokyo 1-3-4 and `050-2018-8952`. The wrong-region result is therefore a discovery failure, not a reason to loosen identity.

Hypothesis: Tabelog's unscoped `sw` search interpreted Marunouchi as the Aichi station because the candidate's Tokyo region never entered the source query. First probe the source-supported Tokyo search entrance `https://tabelog.com/en/tokyo/rstLst/?sw=MARUNOUCHI%20BASE` in one temporary Chromium session (15 seconds, zero model calls, no extra retries). If it returns a valid Tokyo search with the independently verified outlet, change only the generic Tabelog search URL construction to retain the candidate's observed Tokyo prefecture and run existing Adapter tests. If it narrows geography but omits the outlet, report only geographic improvement; if it is unsupported or inaccessible, leave code unchanged and mark this hypothesis uncovered. A synthetic link fixture cannot establish current Tabelog search behavior.

Acceptance: the real Tokyo outlet enters the comparison set without accepting Aichi or another branch, or a narrower conclusion is reported. Evaluator reuses Tabelog identity diagnostics and a manual independent stage verdict. No general model/Live evaluator is appropriate for this one-source discovery probe; inventory and final task completion remain out of scope.

## Observation, change and verdict

The first read of the Tokyo URL returned `Best Restaurants in Tokyo | Tabelog`, but its limited link extraction did not establish the target result. A second, still bounded read of the same URL used the production `parseTabelogSearchOutlets` parser: [saved artifact](../../.eval-artifacts/restaurant-source-targeted/marunouchi-2026-09-24T07-54-22-129Z.json) contains the real `MARUNOUCHI BASE` link `https://tabelog.com/en/tokyo/A1302/A130201/13251017/`. This was Live Read-only, one source query, zero model calls, and no booking action. The earlier extraction artifact remains unchanged and is not counted as confirmation.

Changed only Tabelog's search entrance: when the candidate's saved address explicitly says `Tokyo` or `東京都`, both normal and observed-alias searches use `/en/tokyo/rstLst/`; other addresses retain the prior unscoped entrance. The existing detail-page identity resolver and inventory gate remain authoritative. The same search URL is retained in sanitized diagnostics without challenge tokens.

The pre-change target assertion failed on the unscoped search URL; after the change the existing Adapter test passes. A source-field-derived fixture then drives the Tokyo query through search parsing, detail reading and the existing identity diagnostic to HIGH, while no inventory is accepted without a current availability observation. The non-Tokyo control still uses the old entrance. This fixture is synthetic, not a replay of the full Tabelog response. The real read independently establishes that today's correct outlet enters the parser's comparison set; it does not prove that the production execution will reach a credible reservation result.

**B1 verdict: supported for the Tokyo source-discovery mechanism and local Adapter wiring.** The earlier H003 Aichi result is a new source-geography behavior missed by the old tests: they fixed the search response and checked identity rejection, but never varied the candidate's region against the source search entrance. Other prefectures, current detail-page identity and inventory, and full H003 delivery remain unverified. No identity threshold, retry policy, other provider, budget or Evaluator was changed. The evaluator is **reused** as the Tabelog identity diagnostic plus this independently reviewed stage verdict; a whole-task evaluator is **not applicable** to this bounded source-discovery experiment.
