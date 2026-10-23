# Phase2c continuation — complete, pending independent review

Evidence status: exposed development regression; independently reviewable / not integrated. Branch codex/fix-phase2c-location-semantic, base8ba0c54a. No main merge.

Initial5b2ea9bf was pushed and remote SHA verified before the continuation. The previous150-cap stop is historical and retained in stop.json; the new user decision permits220 total, only one final prompt revision.

## Location, previously completed

Implementation56ade9e8 remains unchanged: ranked valid geographic results, no spelling gate; existing100km context check and separation among leading3 geographic results preserved. Google30 committed names:29/30 success,30 Google calls. **The sole failure is Omotesando: HTTP200 returned Omote-Sando Avenue, type route, outside the unchanged geographic whitelist.** No new Google calls or type expansion in this continuation. Six recorded rejected observations resolve;40 successful historical selected projections lack full ranked response/types, remain NOT_EVALUATED rather than fabricated complete regression. Ebisu's old zero-result source cause remains unknown; a later explicit-context check succeeds but does not establish that missing bias caused the old empty response. Detailed56 and30 tables remain in progress-report.md.

## One final semantic revision

Code/freeze7e4d6032, replay recorde446272b. Semantic promptv23/schema3; compiler, State20, Evaluator33/rubric29 and delivery rules unchanged. Only a general user-word qualifier rule is added; no production rules for tables, soba or individual words.54 after trials reuse the existing54 v21 controls, with the same captured clocks, model, schema and sampling parameters. New calls54, no retries; chain108+54=162/220,58 unused. All54 PROPOSED/COMPILED. Every original, v21, v22 and v23 condition list and all30 changed full patches are retained in semantic-followup-220/comparison.json and comparison.md. Implementer review of54 pairs observed no further criterion regression; independent review pending.

| User expression | Earlier recorded problem / fresh v21 control | Final v23 |
| --- | --- | --- |
| sit-down … not a standing soba counter | Fresh v21 and v22 each3/3 add HARD with tables |3/3 retain sit-down restaurant; no with tables; NEGATIVE HARD standing soba counter |
| ideally under4,000 yen | Historical proposal around4,000 or less; fresh v21 controls already under3/3 | SOFT under4,000,3/3 |
| ideally under6,000 yen | Fresh v21 already SOFT under3/3 | SOFT under6,000,3/3 |
| under8,000 yen | Existing structured HARD maximum8000,3/3 | Same maximum8000,3/3; original request text retained |
| at most15,000 yen | Existing structured HARD maximum15000,3/3 | Same maximum15000,3/3 |
| no more than / below | Absent from the frozen18 requests | General prompt rule applies; no separate sampled claim |

The numeric after rows12/12 pass for upper-bound direction/strength, but fresh v21 controls also pass; no sampled numeric improvement claim. The existing structured budget max field does not encode a separate strict-vs-inclusive operator; this schema was not changed. Harmless compact cuisine wording/singular/plural and ordering vary; all differences are listed. No further prompt tuning or model calls.

## Goya bound collection repair

Three saved pages confirm selected2026-11-03/3people and19:00. Each response projection contains54 rows;41 supported clock alternatives,13 unrepresentable alternatives beginning with link visit_time2400. The old parser rejects the complete collection. The repaired existing collection parser keeps independently bound supported slots. It introduces no source/domain/place/merchant branch or new path permission and does not map unsupported hours to a different date. Every row keeps merchant/date/people binding. Missing supported-clock time, conflicting time/link, wrong identity/query and newer failed response remain rejected; no supported slots remains UNKNOWN, never EMPTY. Source production physical line delta0.

Valid saved-page red, unit red and real Chromium Live-composition red retained. Initial fixture cleanup/missing-marker failures are explicitly excluded from failure-detection evidence. Three saved full-HTML replays now complete and retain19:00, each41 supported slots. The actual Live assembly/installed Guard/passive capture/Adapter/grounding control returns AVAILABLE at19:00 without a model or Google request. No reservation navigation. Raw HTTP time strings were not preserved in the historical trace: only recorded safe URL fields are rehydrated; missing strings are not invented. This is saved projection plus independent local source control, not present website stock or full delivery.

## Four-layer proof boundary

1. End-to-end live outcome: NOT_RUN. No restaurant website, current stock check, full Live or production merge.
2. Components: saved-location results and Google checks above; semantic54 real-model fixed-text trials; saved Goya3 and local Live-assembly query binding. Final zero-call regression: calendar69/69, selection5/5, calibration outcomes22/22 and normal declarations20/20; two interrupted calibration cases remain NOT_EVALUATED for declarations.
3. Severity: local negative tests retain UNKNOWN/rejection boundaries; independent22 calibration remains the scoring regression, not general S0 certification. Historical S0 and unavailable raw evidence remain unchanged.
4. Attribution: saved Goya collection failure is reproduced and locally repaired; semantic extra qualifier disappears in this exposed sample. Google Omotesando rejected by unchanged type contract; old Ebisu cause and40 historical ranked-response gaps remain unresolved.

## Final gates and source counts

Product16e91940, replay configuration8ad2d118 (4182 source/input hashes, plus calibration812). Five gates all PASS: typecheck, arch:check, npm test1022/1022, build, Chromium137/137. The browser-generated historical metric file is restored byte-for-byte. Final cached real-response calendar69/69 and selection5/5 PASS, zero new model calls; model request messages/schema unchanged, only the previously authorized timeout10s→30s differs for calendar. Independent Evaluator33/rubric29 calibration22/22 outcomes, normal S0 declarations20/20 PASS; two interrupted declarations and missing boundary evidence retain unknown status.

| Same06287b6f counting scope | Baseline025940c5 | Before this repair | Final | This-chain change |
| --- | ---: | ---: | ---: | ---: |
| Provider directories, physical |3591|3863|3863|0|
| Provider and whole mixed files, physical |5638|6359|6359|0|
| Provider directories, nonblank |3399|3658|3658|0|
| Provider and whole mixed files, nonblank |5375|6074|6074|0|

Shared-layer new site/place/cuisine/coordinate constant candidates0 under the same bounded static audit. Historical phase-two +272/+721 physical lines remain, so overall historical exit6 is still NOT_SATISFIED. This chain adds none; no result is relabeled to erase history.

## Commits and evidence

- Initial5b2ea9bf push: remote hash verified before work.
- Location repair:56ade9e8 (previous batch, unchanged).
- Final semantic rule/request freeze:7e4d6032;54-call outcome record:e446272b.
- Goya repair and five gates:16e91940.
- Final offline regression freeze/source count:8ad2d118; final report/evidence commit follows, with product bytes unchanged.
- [Original location56/Google30 tables and Ebisu diagnosis](progress-report.md) (historical stop report; current continuation above supersedes its150-cap stop).
- [Semantic54 paired comparisons](semantic-followup-220/comparison.md), [all structured conditions/proposals](semantic-followup-220/comparison.json), [frozen-call verification](semantic-followup-220/execution-verification.json), [prepared request/audit](semantic-followup-220/payload-audit.json).
- [Goya scope and raw-response limitation](goya-followup/scope.md), [saved replay red](goya-followup/red.log), [saved replay green](goya-followup/green.log), [valid Live-assembly red](goya-followup/composition-red-bound.log), [local composition green](goya-followup/composition-green.log), [valid/excluded evidence classification](goya-followup/verification.json).
- [Five gate commands/exits](final-gates/results.json), [Chromium137 log](final-gates/browser-fixtures.log), [default1022 log](final-gates/default-tests.log).
- [Calendar69 and selection5](final-regressions/regression-results.json), [independent22 calibration](final-regressions/calibration/comparison.json).
- [Source line comparison](final-audit/source-line-comparison.json), [full same-scope audit](final-audit/generality-audit.json), [final integrity](final-integrity.json).

Usage: this continuation54 real model calls; chain162/220,58 unused. Based on the recorded chain start3634, cumulative3796/5000 (not an audit of other concurrent chats). Google unchanged30; restaurant websites0, complete Live0. No new holdout access. Main integration8ba0c54a is unchanged. Only the repair branch is authorized for final push; remote receipt is verified after submission. Stop for independent review; no main merge, further prompt changes, websites or Live.
