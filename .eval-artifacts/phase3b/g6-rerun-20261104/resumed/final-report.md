# Final report: three approved G6 supplemental runs

2026-11-04 Vienna CET (UTC+1). Exposed development inputs, not holdout. All three approved slots completed; no further calls, reruns, automation or main merge. Business delivery objectives remain unmet; the original automatic scores are unchanged.

## Inputs and verification

Source main be84674e, frozen gate candidate a77d79bf. All838 source/input SHA values remain unchanged through the final run. Clean gates: typecheck/arch/build PASS, default1425/1425, Chromium189/189 plus completeG6 66/66, strictG2 5/5 and12 pages PASS. Metadata/results commits do not change tested executable files.

## Outcomes

| Slot | Initial turn JST | Initial turn CET | Read elapsed s | Turns | Models / Google | Final result | S0 | Recording pages |
|---|---|---|---:|---:|---:|---|---:|---:|
| D4 | 2026-11-04T13:33:50.296000+09:00 | 2026-11-04T05:33:50.296000+01:00 | 82.475 | 1 | 10 / 2 | CAPABILITY_MISS;0delivery;G1 NOT_SENT | 0 | 12/12 |
| D6 | 2026-11-04T14:07:59.801000+09:00 | 2026-11-04T06:07:59.801000+01:00 | 178.567 | 3 | 16 / 5 | NOT_EVALUATED;Ito retained;availability UNKNOWN;noB1 | 0 | 22/28 |
| D8 | 2026-11-04T14:18:01.098000+09:00 | 2026-11-04T06:18:01.098000+01:00 | 87.413 | 1 | 5 / 2 | NOT_EVALUATED;branch clarification;noB1 | 0 | 8/25 |

Times above identify the first user turn. Every user turn had an independent500s/50model/40Google budget; D6 turn durations102.833/4.944/69.981s. Read elapsed excludes subsequent independent witness checks and recording finalization. No turn exceeded500s; no source read or terms work started in reserve. The20s reserve was not reached in this batch, so this is no-violation observation rather than a new reserve-pressure demonstration.

## Four-layer findings

- D4 end-to-end: no qualified delivery. Semantic date/time/party retained; native Tabelog selects Itabashi, then replaces it with Kita-Ikebukuro after two coordinate samples. Replacement samples remain about4.04km south/outside, code closes source. TableCheck separately fails net::ERR_FAILED; Google restricted query returns no candidates. Independent W1 before/after still available. S0=0 with160 request-boundary checks PASS; independently witnessed miss supportsS2. G1 never triggered.
- D6 end-to-end: initial recommendation actually displays Ito Akabane. Both scripted follow-ups run; authoritative named identity stays Ito (GooglePlaceID and phone03-3598-2992), no replacement is displayed after naming. Final availability UNKNOWN/BROWSER_TIMEOUT and noB1. Source timeout is CANDIDATE scope at60.008s cumulative (Tabelog37.105s), not a reproduced fixed20s page.goto timeout. S0=0 with386 request-boundary checks PASS. W1 is regional admission only, not an Ito availability witness; do not turn it into an independently certified Ito miss. Original NOT_EVALUATED and wording failure remain unchanged.
- D8 end-to-end: asks which branch, no delivery/stock check/handoff; follow-up not sent. Full semantic query is preserved. First TableCheck identity binds observed full name Specializing in Nodoguro Ginza Nakamata exactly; Hanare has a different full name; third candidate UNKNOWN. namedOutletCandidateResolved at src/domains/restaurant/named-outlet-resolution.ts:122 requires native HIGH identity for all three prefix candidates before exact-name counting. It returnsfalse despite one exact bound full name. D8-resolution-probe.json captures this current-code blocker without regrading; intended UNKNOWN handling belongs to reviewer/C. W2 remains independently available before/after. S0=0 with221 request-boundary checks PASS; no wrong branch delivered. Original NOT_EVALUATED retained.

No automatic result was relabeled. No new incorrect store/date/party/slot/HARD declaration was observed. The old historical D6 reviewer S0 remains in its original records; this zero is only the present three-run batch.

## Requested network observations

| Slot | BROWSER_TIMEOUT | BROWSER_BUDGET_EXHAUSTED | Search-entry GOTO | All explicit GOTO | Slowest known CDP terminal s | Independent Guard transport s | Unknown wire ends |
|---|---:|---:|---:|---:|---:|---:|---:|
| D4 | 0 | 0 | 2 | 11 | 3.728 | 3.669 | 0 |
| D6 | 1 | 0 | 5 | 23 | 10.969 | 10.896 | 9 |
| D8 | 0 | 0 | 6 | 15 | 8.370 | 8.228 | 9 |

Failure counts use leaf executor failure events, not duplicated provider/close text. D4 additionally has one BROWSER_RUNTIME_FAILED. Search entries are explicitGOTO to observed Tabelog rstLst or /en/tokyo/ or /en/ and TableCheck /en/japan/search; region/detail links have a separate full navigation table. Different query variants are distinguished by full URL SHA in navigation-hashes-and-pending.json.

D4/D6 slowest completed browser request is tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/commons.js. D8 is www.tablecheck.com/portal/assets/index-KCcaxOlR.js. CDP and Guard durations are different observation points, not added and not labeled physicalTTFB. Unknown/cancelled wire ends are excluded from completed ranking; their longest observed pending lifetimes are separately saved. Last completion does not prove causality. This batch does not close the historical W1 timeout root cause or establish stable speed-up.

## Time decomposition (seconds, proxy spans)

| Slot | Page operations | Structure reads | Waits | Models total | Other / unattributed |
|---|---:|---:|---:|---:|---:|
| D4 | 32.932 | 4.012 | 8.437 | 30.157 | 6.937 |
| D6 | 93.113 | 8.240 | 21.613 | 44.101 | 11.500 |
| D8 | 46.106 | 4.906 | 15.204 | 15.581 | 5.616 |

Overlapping spans use model-first exclusive attribution; setup/clock offsets remain unattributed. These are not pure network time. Detailed method spans, first presentation timestamps (not qualification) and each model purpose latency are in observations.json. No first complete qualified booking timestamp exists.

| Model purpose | D4 count / seconds | D6 count / seconds | D8 count / seconds |
|---|---:|---:|---:|
| browser_read_decide | 2 / 7.061 | 2 / 9.296 | 0 / 0.000 |
| restaurant_agent_decide | 4 / 9.519 | 9 / 25.150 | 3 / 8.394 |
| restaurant_discovery_retrieval | 3 / 8.372 | 0 / 0.000 | 0 / 0.000 |
| restaurant_named_source_query | 0 / 0.000 | 1 / 2.165 | 1 / 2.378 |
| restaurant_party_size_supplement | 0 / 0.000 | 1 / 1.070 | 0 / 0.000 |
| restaurant_semantic_interpret | 1 / 5.205 | 3 / 6.420 | 1 / 4.809 |

## Recording, calendars and links

Browser, decisions and Google structured capture stayed on for all runs. Decisions31/31, Google structured responses9/9. Recorder page admission42/65 (64.6%): D4 12/12, D6 22/28, D8 8/25. All23 rejected-page primary reason codes are UNCAPTURED_STATIC_DEPENDENCY; per-page rows and uncaptured script origin/path-only lists are in observations.json and original recording-observation.json files. This primary reason does not prove there are no other missing dynamic dependencies. No Recorder rule was loosened. Full multi-turn replay NOT_RUN; admission is not replay execution.

Tabelog:11 initial_vacancy GET response bodies and same-run page candidates indexed in calendar-materials.json, not yet imported intoG2 or certified as a new baseline. Standalone witness bodies were never paired to a browser snapshot as if same-run browser data.

TableCheck: D8 Hanare diagnostic snapshots10/11 visibly show a Nov4/November2026 calendar and time labels17:00 through21:00. This is Hanare, not W2. It is a candidate only: controls include blank combobox values and the six observed calendar POST200 response bodies were not persisted. Existing Recorder recordResponse acceptsGET/HEAD only; snapshot response bodies are empty. No certified date/party/slot data-bound G3b positive was manufactured from testid presence. All protocol observations and limitations are indexed in calendar-materials.json.

No productB1 was produced in any slot; terms diagnostics: D4 NOT_SELECTED, D6 NOT_SELECTED/PHASE, D8 NOT_SELECTED. G1 private-room question and B1 fee/terms handoff remain unexercised here. D8-user-link-checklist.md explicitly says NOT_PRODUCED for both channels; independent witness slot URLs are not substituted as product handoffs and no form was opened.

## Budget and scope

All832 prior rows preserved byid/value; final879 rows. Increment:3Live,31 real models,10 publicGET,9Google,767 source transport attempts (+10 witnessGET =777 website counter),0 environment reruns. Global14/32Live,432/1600models,308/425GET; development14/14Live,191/400models,53/58GET. Holdout18Live/108GET reservation unchanged. No new holdout text read. See final-budget-audit.json.

User latest exact steering was "直接跑" after the timed-delegation prompt. Remaining slots ran immediately; all three are non-peak. Earlier requirement of at least one19:00-23:00JST run is NOT_COVERED, not marked waived or passed. The rejected timed automation was never created; no workaround/background execution was used. No further developmentLive is authorized or run.

The source/Runner inputs remain the clean tested838 hashes; this final change contains raw outputs and documentation only. No product/site/Prompt/Schema/State or scoring changes after freezing. Work branch only, not main. Stop here for review.
