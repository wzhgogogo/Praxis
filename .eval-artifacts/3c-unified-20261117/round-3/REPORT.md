# 3C unified round-3: offline eight-photo demand loading and website Lookahead 1

- Date: 2026-11-17
- Worktree: `/private/tmp/praxis-3c-unified`
- Branch: `codex/feat-web-photos-unified`
- Sole frozen candidate SHA: `98a6dc4b1d449880af6f92fdb098f3364299c75a`
- Prior Live frozen SHA: `ea7b20c6eaf842a3d365784f529b543f23218ed2` (historical round-2 only).
- Result: five clean-commit offline gates PASS; formal three-size16/16 PASS; strict eight-photo/budget/lookahead regressions PASS.
- Current round mode: OFFLINE ONLY. No Live rerun, .env configuration load, PostgreSQL connection/query/write, production model/Google/restaurant calls, main merge or remote push.

## Implementation

Google media ceiling is20; Details1/website pages2/images10 remain unchanged. Eight normal Google photos require exactly16 Media API+CDN dispatches, leaving4 for redirects/failure isolation. The Live controller's check is synchronized to20 and its output base to round-3, but it was not executed.

Website projection now explicitly returns provider=WEBSITE. Ordinary cards request cover only and do not warm images. After the current main image loads in About or an open viewer, only the next explicitly WEBSITE photo may warm once, deduplicated by photo.id in entry.prefetched. GOOGLE_PLACES and unknown providers never warm. Visible img src formatting is unchanged.

Warm-up callbacks only clear handlers: no chained warm-up, failed-set mutation, counter refresh or visible image replacement. A failed warm-up leaves current image and n-of-N unchanged; actual selection then invokes existing failure isolation. Current candidate/cache/view/position guards prevent stale or closed views from starting a new warm-up. No changes to restaurant Domain, execution router, search, projector repair, existing slice2 assertions, dependencies or evaluator scoring.

Capability Matrix and the slice plan contain the20 cap and strict Google-demand/website-only-lookahead rules. Old gates/failures and every round-2 file remain byte-identical.

## Exact contract evidence

Pre-freeze photo contracts18/18 and the two new Chromium journeys2/2 passed. The same contracts are included again in the formal gates below.

| Contract | Exact verified result |
|---|---|
| Normal Google gallery | 8 listed;8/8 content calls return nonempty decoded bytes; reread8; Details1; media16; actual synthetic transport dispatches16 |
| CDN redirect boundary | First6 images complete within18 sends; seventh reaches20 then its required21st send is refused before transport; later sends stay refused at20; all6 earlier images remain readable from memory |
| Corrupt Google third item | Bad item isolated,7 good items remain; media16; website source calls0 |
| Both sources fail | Honest UNAVAILABLE/empty result retained |
| Google browser demand-only | Card and newly opened About at1-of-8 have media2 and no photo1 content request; About1-4 and viewer4-8 check each n-of-8, matching currentSrc/photo.id, complete/naturalWidth; reread8, Details1/media16 exactly |
| Website browser lookahead | Card does not request photo1; About first image warms photo1 once; viewer entrance deduplicates; actual photo1 selection downloads it from the synthetic source only once |
| Failed website warm-up | 410/corrupt photo1 leaves current photo0 and1-of-3 unchanged, no cascade to photo2; actual Next skips bad photo1 and shows good photo2 at2-of-2; bad source image downloaded once |
| Unknown provider | No warm-up; photo1 is downloaded only after actual selection |

The redirect rejection is not a post-send accounting correction: the transport receives20 media calls, never the required21st final-CDN request. Successful previously loaded images remain available after exhaustion. Tests use the production Google/website adapter and real decoder with synthetic fetch/source inputs, not a live provider.

The two new browser regressions are in restaurant-photos.test.ts, which has11 tests total and runs within the normal Chromium gate. The eight-image journey is not repeated through the16-case visual matrix.

## Five offline gates on the same clean SHA

No .env loaded. git status --porcelain was empty before/after each gate. Browser entry has no outer sandbox; runner-replay retains its own OS denial. Other gates use one OS outbound-denial layer allowing loopback.

| Command | Exit | Seconds | Result |
|---|---:|---:|---|
| npm run typecheck | 0 | 0.565 | PASS |
| npm run arch:check | 0 | 0.197 | PASS;0 forbidden dependencies |
| npm test | 0 | 59.715 | 1691/1691 |
| npm run test:browser:fixture | 0 | 379.000 | G2 5/5;remaining Chromium394/394;G6 assembly159/159 |
| npm run build | 0 | 0.536 | PASS |

- G2: 5/5, 24.611s.
- remaining Chromium: 394/394, 316.371s.
- combined browser (not G6): 399/399, 341.037s.
- G6 assembly: 159/159, 37.704s.

Combined browser399 is G2+Chromium, not G6. G6 was actually reached through test:browser:fixture and completed. New Google8/8 and website Lookahead1 tests both appear PASS in the formal browser raw log.

[Raw gate manifest](gates/manifest.json), [browser log](gates/browser-fixture.log), [group summary](gate-summary.json), [freeze record](freeze-record.json).

## Formal original three-size visual acceptance

16/16 PASS, exit0, 32.393s; same frozen SHA, clean before/after. OS outbound denial plus context-wide nonlocal request interception, covering popups.

| Viewport | Cases | Coverage |
|---|---:|---|
| 390x844 | 7/7 | Google short/long credit; cover HTTP/decode failure; no ID; corrupt gallery item; both sources fail |
| 1440x900 | 7/7 | Same original seven scenarios and complete main flow |
| 960x900 | 2/2 | Short/long credit, long-address clamp with distance/price, Let's book hit testing and B1 |

Original flow checks remain: actual loopback HTTP/SSE, inline /messages with draft retained, current-candidate G1/citations, second-slot B1/reload, local departure201 matched to PGlite SQL, external navigation blocked. Breakpoint cases focus on layout/B1 and omit G1. Fault cases preserve normal result/G1/B1 controls. Expected login401/injected410/blocked navigation are separate; no unexpected application console/HTTP errors or pageerrors.

Current frozen screenshots were visually checked: full long attribution below the image, full About address, address-only two-line card clamp, distance/price retained, clickable main control. The matrix remains16; eight-of-eight flipping is exercised only by the dedicated browser regression.

[16-case manifest](visual/manifest.json), [raw output](visual.log), [timing](visual-execution.json). Key images:

- [390 long credit/address](visual/mobile-google-long-cover-long-credit-address.png)
- [1440 About full attribution](visual/desktop-google-about.png)
- [960 address/distance/price/button](visual/breakpoint-google-short-credit-address.png)
- [Both-source failure G1 remains usable](visual/mobile-both-fail-g1.png)

## Historical Live citation correction - round-2 is not modified

The single historical Live at ea7b20c6e returned G1 status ANSWERED. Its answer included the clause **"up to 20 people"**. The three returned citation texts were exactly:

- Private rooms
- Unavailable
- Available

That clause is absent from all three citation texts and is **NOT_VERIFIED_BY_THE_THREE_RETURNED_CITATIONS**. The ANSWERED status is not proof of citation support for the numeric clause. We did not reopen the original site or judge whether another part of the underlying page supported it; this is a bounded citation-coverage correction, not a new truth/S0 oracle or scorer change.

[Literal citation review](prior-live-citation-review.json), [original round-2 report](../round-2/REPORT.md), [unchanged original Live record](../round-2/live/run.json). Round-2 outcome/S0 remain their original NOT_EVALUATED and S1 PRESENT; nothing was silently upgraded or rewritten.

## Boundaries and preservation

This new frozen SHA was not Live-tested. Google eight-image success, redirects and website Lookahead1 are offline unit/Chromium/Fixture evidence only. No new real eight-photo download, website fallback Live, G1 quality signoff, device test or Clean Holdout claim. Real mobile Safari/Android Chrome remain unverified.

No .env configuration load or credential probe, no PostgreSQL connection or writes, and no Live process were started. praxis_smoke was not queried or changed by this work; PGlite is used only by offline fixtures. No round-3/live output exists. Actual production model/Google/website calls this round:0.

Main/original3C tree HEAD/branch/status/staged+unstaged hashes and main.env hash are unchanged. The125 protected original gates/failures/round-2 evidence files retain their exact bytes. All fixture commands exited successfully and close their browser/server/PGlite handles in finally blocks. See [preservation](protected-after.json) and [offline boundary](execution-boundary.json).

Source and outer-script hashes still match the frozen record after all runs. Evidence/document commits that follow do not alter the tested code or scripts. Only local commits; no main merge or push.


## Evidence interpretation

1. End-to-end: this candidate passes the offline Fixture product path; no new Live user-goal result is claimed.
2. Stages: exact adapter dispatch counts, real Chromium image identity/counters and unchanged16 HTTP/SSE paths provide separate contract evidence.
3. Severity: no current Live S0/qualification evaluation; the prior numeric clause is only marked as unverified by its returned citations, without rewriting old severity results.
4. Attribution: the former media ceiling10 could not complete8 normal images requiring16 sends. The20 ceiling closes that concrete gap while provider/view/current-image guards constrain website-only lookahead and prevent Google prefetch.
