# 3C unified round-2: projection repair, offline acceptance and one Live Case

- Date: 2026-11-17
- Status: current work-branch offline acceptance PASS; bounded public-development Live execution observed; independent qualification NOT_EVALUATED. Not a Clean Holdout baseline.
- Worktree: `/private/tmp/praxis-3c-unified`
- Branch: `codex/feat-web-photos-unified`
- Sole frozen candidate SHA: `ea7b20c6eaf842a3d365784f529b543f23218ed2`
- Business baseline: `727b8a812b805fb836612e077ba4f97a802506b9`, retaining main `dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0`.
- Projection source: `872785522d85f39e2bbb72989f62f7eb06f2fc0f`, byte-identical to the two files in `f134cb75057adaadc990cba2d6f9470fb94fbf1e`.
- All five gates, formal16 visual cases and Live used this same clean SHA. Frozen source/outer-script hashes stayed unchanged. The final evidence/document commit does not alter product code or orchestration.

## Repair and preservation

Copied workspace-read-projection.ts and its existing unit contracts verbatim. Requirement revisions now compare the complete applied draft, replaying accepted location binding. Equivalent reaffirmations retain presentation and the last real diff; real values/provenance changes remain revisions. Only the matching architecture/User Flows paragraphs were synchronized.

727 restaurant Domain, restaurant-execution-router.ts, Google search implementation/field mask and existing browser assertions remain unchanged. Preflight: projection12 + outer-contract10 =22/22; the four original browser failures4/4. All four also pass within the formal Chromium gate. No assertion weakening. See [integration audit](integration-audit.json). Every original file under previous gates/failures retains its original hash.

The three outer scripts share round-2. Live checks actual severity.S0/S0_DECLARATION/S0_BOUNDARY PRESENT and records NOT_EVALUATED unchanged. It awaits page-owned photo JSON/content completion, sends no controller gallery GET after a missing cover or About, distinguishes list versus HTTP200 image counts, and preserves phase/readStatus-specific blockers. The contract checks exercise real script functions and delayed/reordered captures, without env/provider calls or a new golden oracle.

## Five clean-commit offline gates

No .env loaded. git status --porcelain was empty before/after every gate. Browser entry has no outer sandbox, preserving runner-replay's own OS denial; other gates use one OS outbound-denial layer with loopback allowed.

| Command | Exit | Seconds | Result |
|---|---:|---:|---|
| npm run typecheck | 0 | 0.587 | PASS |
| npm run arch:check | 0 | 0.193 | PASS; 0 forbidden dependencies |
| npm test | 0 | 60.866 | 1689/1689 |
| npm run test:browser:fixture | 0 | 371.003 | G2 5/5; Chromium392/392; G6 159/159 |
| npm run build | 0 | 0.520 | PASS |

Groups: G2 24.176s; remaining Chromium309.843s; combined browser397/397 at334.073s (not G6); actual G6 assembly159/159 at36.678s. Entry total371.003s.

[Raw manifest](gates/manifest.json), [browser log](gates/browser-fixture.log), [group summary](gate-summary.json), [freeze record](freeze-record.json).

## Formal HTTP/SSE Fixture visual acceptance

Same frozen SHA:16/16 PASS, exit0, 32.549s, clean before/after. OS outbound denied except loopback; context routing blocks all nonlocal requests and popups from creation.

| Viewport | Cases | Scope |
|---|---:|---|
| 390x844 | 7/7 | Google short/long credit, cover HTTP failure, cover decode failure, noID, corrupt gallery item, both sources fail |
| 1440x900 | 7/7 | Same cases and full demand/SSE/edit/G1/B1 path |
| 960x900 | 2/2 | Short/long credit, two-line address with distance/price, Let's book hit test and B1 |

Main paths prove real loopback HTTP/SSE, inline /messages with draft preserved, single detail composer /questions with current-candidate citations, second-slot B1 and reload recovery, departure201 matched to PGlite SQL, and blocked external navigation. Fault cases preserve search/G1/B1 and isolate one corrupt gallery image. Breakpoint cases focus on layout/B1 and omit G1.

Actual formal screenshots were inspected: full long credits move below images; About retains credit and raw address; only card address clamps to two lines; distance/price remain; primary controls are clickable. Expected initial401, injected410 and blocked navigation are classified separately. No pageerror or unexpected HTTP/console errors.

[16-case manifest](visual/manifest.json), [timing](visual-execution.json), [raw log](visual.log). Durable deterministic baseline images:

- [390 long credit/address](visual/mobile-google-long-cover-long-credit-address.png)
- [1440 About credit](visual/desktop-google-about.png)
- [960 address/distance/price/button](visual/breakpoint-google-short-credit-address.png)
- [Both-source failure with G1](visual/mobile-both-fail-g1.png)

Old development preflight evidence remains historical and is not substituted for this clean-commit run.

## Single public-development Live execution

- Case: `restaurant:c79a5c9bceb6a284eaa879e4`. Exactly one appended; all three prior Cases preserved, task/Case IDs3->4.
- Request: Find a yakiniku restaurant in Shinjuku, Tokyo, for 2 guests on 2026-11-20 at 19:30, around 5,000 yen per person.
- Actual phase: `PRESENT_RESULTS`; readStatus.kind=`RESULTS`; no partial source failure.
- Displayed outlet: Wagyu Yakiniku & Meat Sushi Gaen Shinjuku Kabukicho. Google structured discovery/photos; Tabelog availability, question page and B1.
- Three candidates were presented, but only the current single outlet was viewed/photographed; no card switching.
- Search: modelCallsStarted=15; Google=3 (discovery2, namedPlaceResolution1); resourceUsage.elapsedMs=94610. Whole controlled run=100.681s. Search, G1 and photo accounting are separate.
- Demand1, question1, departure1, refresh0; no continuation, changed demand, rerun or actual reservation submission.
- Actual SSE events=8. No pageerror; only expected pre-login /api/session401 console/HTTP error.

### Listed photos versus actual image loads

Cover list1; page-owned About gallery list8. Actual completed /content HTTP200 requests=1; distinct successfully loaded photos=1. Cover/About/viewer reuse that one image. Eight listed items are not eight loaded images. No controller gallery GET was added.

| Photo dispatch category, redirects included, one outlet | Actual | Cap |
|---|---:|---:|
| Google Details (id,photos) | 1 | 1 |
| Google media (Media API1 + CDN1 in this run) | 2 | 10 |
| Website fallback pages | 0 | 2 |
| Website fallback image GETs | 0 | 10 |

Cover/About/viewer each show the complete `Google Maps · 和牛焼肉 肉寿司 雅苑 新宿歌舞伎町店`, matching all authors returned for the displayed image. The small translucent corner label fits; full-screen caption also remains complete. Card removes the leading Japan/postal prefix; About retains the original `Japan, 〒160-0021 Tokyo, Shinjuku City, Kabukichō, 2-chōme−45−７ 石井ビル 1F`. This real address is not a long-address stress case; formal synthetic fixtures provide that boundary evidence.

### G1 and B1

G1 HTTP200 and `ANSWERED` for the current candidate, modelUsage.calls=1, checkedPages1 from the already-read Tabelog page. Answer distinguishes unavailable private rooms from available private use, retaining citations. No extra independent answer scoring was performed; HTTP acceptance latency is not treated as complete answer latency.

Valid B1 target:2026-11-20 19:30 JST /2guests. Departure POST201; receipt and independent SQL match candidateId/offerId/provider. URL: `https://tabelog.com/en/booking/form_course/new?member=2&rcd=13311569&visit_date=20261120&visit_time=1930`. Context routing intercepted navigation before a real reservation GET; no booking page was opened or booking submitted.

### Evaluation layers and limitations

1. End-to-end: workspace/photo execution chain completed and actual phase is PRESENT_RESULTS. Both CLI evaluator outcomes/userGoalComplete remain NOT_EVALUATED; this is not independent qualified-delivery signoff.
2. Steps: search, actual one-image load, current-candidate G1, local B1 departure/SQL and navigation block have HTTP/persistence evidence beyond UI copy. No new golden source-qualification review.
3. Severity: both CLI sidecars retain S0/S0_DECLARATION/S0_BOUNDARY NOT_EVALUATED; S1 PRESENT because displayed MET lacks independent source-qualification support. S2/S3/S4 remain NOT_EVALUATED. These are not rewritten as S0=0 or qualification PASS.
4. Attribution: the prior four failures came from the omitted equivalent-draft projector and are closed by its original patch/unit/browser contracts. Current Live execution evidence does not remove the independent-support gap.

externalSideEffectCount=NOT_MEASURED; backend total website requests=NOT_MEASURED; independentS0=NOT_EVALUATED. No additional golden review, credential probe or second Live. Actual website-photo fallback, all eight real gallery downloads, mobile Live, iPhone Safari and Android Chrome devices remain unverified; corresponding failure behavior is offline Fixture evidence.

## Local database, environment and cleanup

Effective config verified before startup:postgresql:/127.0.0.1:5432/praxis_smoke; PRAXIS_TEST_DATABASE_URL same; LOCAL_CHROMIUM; PORT4312. Uses local OS account; main.env's nonlocal https database target and credentials were not connected/reused. PG connection success is separate from variable configuration.

Main.env was read only after offline acceptance, not copied/edited. No2A, test:postgres:live or database clearing. Static configuration:DEEPSEEK_API_KEY/MODEL, GOOGLE_MAPS_API_KEY and PRAXIS_GOOGLE_API_PROXY_SERVER configured; optional LOCAL_CHROMIUM_PROXY missing; Cloudflare variables configured but unused here. DB URLs/engine/port explicitly overridden by parent. No secret values printed or credential-validity preprobe. [Static status](live/environment-static.json), [effective target](live/effective-target.log).

All10 CLI artifacts archived:search5 and post-G1 5, including both diagnosis.md files. Raw/sanitized SHA256 receipts retained and archived hashes verified. Configured-secret literal scan of20 text evidence files found0 matches. Temporary restaurant-web-read directory empty. Final GET Case and SQL departure records saved.

Browser/database connections closed; Web service exit0; port4312 has no listener; no remaining Node/Chromium processes with this worktree cwd. Main/original3C tree HEAD/branch/status/staged+unstaged hashes, main.env and all old gates/failures unchanged. Local commits only, no main merge/push.

## Key artifacts

- [Live run](live/run.json), [server log](live/server.log), [final Case](live/final-view.json)
- [SQL verification](live/postgres-final.json), [final departure rows](live/final-departures.json)
- [Live cover](live/04-cover.png), [About](live/05-about.png), [viewer](live/06-viewer.png), [G1](live/07-g1.png), [departure](live/08-departure.png)
- [Execution contract audit](execution-audit.json), [cleanup](cleanup.json), [preservation](protected-after.json), [redaction check](redaction-check.json)

Stopped after the single authorized Live; only local evidence/document commits follow.
