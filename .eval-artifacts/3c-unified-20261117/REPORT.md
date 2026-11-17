# 3C unified photos — offline acceptance stopped

- Status: draft / not integrated; acceptance BLOCKED
- Date: 2026-11-17
- Worktree: `/private/tmp/praxis-3c-unified`
- Branch: `codex/feat-web-photos-unified`
- Business baseline: `727b8a812b805fb836612e077ba4f97a802506b9`
- Integrated main baseline: `dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0`
- Visual source: `f134cb75057adaadc990cba2d6f9470fb94fbf1e`
- Website photo source: `bf8046ae98fe64024c382c0a99ed274f872e2c93`, selected feature delta from `127d1aa14`
- Product commit: `3c86d5b3059e5d803651d4443efe72f3c05457e6`
- Frozen product/Fixture/outer-orchestration acceptance commit: `53bbbdc8f6b0a243a44e9c65cf31901e528104ae`

## Result and stop

The selective integration is implemented locally. The formal browser gate failed in four new visual-branch interaction scenarios. Per the user's explicit stop condition, no product or assertion changes were made after the failure; G6, build, formal visual acceptance and Live were not executed. This is not an accepted release or a Clean Baseline.

## Integration

727 Domain/Core, State/CaseView/B1/G1, Google search implementation and search field mask remain byte-identical. `read-assessment.ts` preserves same-fingerprint PARTY_SIZE_NOT_SELECTABLE filtering and explicit-continuation exclusion of delivered plus investigated candidate IDs. Dynamic strict-query and workflow admission in Guard remain equivalent; only the shared sensitive-URL predicate was extracted. Passive DOM image observation does not establish restaurant facts. See [integration audit](integration-audit.json).

DM Sans, transparent navigation, time tiles, frosted bookmark, Let's book, orb/cursor transitions, native condition editors and keyboard navigation come from the visual delta. No legacy persistent RestaurantOutlet.photo, photo injection in search or /api/photo route/caller was imported; active-path scan has zero matches. Website photos retain bound source selection, observed pages, safe public HTTP, sharp validation/WebP, eight-photo carousel and full-screen viewer.

The one authenticated Case/candidate photo API owns both cover and gallery. Google requests only id,photos on display demand, uses existing Maps URI and complete returned authors, sizes media to maxWidthPx=1600 through the configured Google proxy, and sends no API key to CDN hops or front-end DTOs. Google images remain original validated bytes in disposable per-display memory; no State/PG/disk writes or shared cross-candidate photo cache. Missing ID, empty list, fetch error or actual cover decode/download failure invokes the existing website reader. Individual gallery failures remain isolated. Per-display dispatch ceilings (redirects included): Details1/media10/website pages2/images10.

Credits use Google Maps plus all applicable authors, or explicit website credit / Source: domain. Actual measured overflow moves complete credit below the image; compact wrapping preserves names. Card address alone clamps to two lines, distance/price remain visible, About retains raw address including ※ and 【. Dependencies retain exact branch lock versions: DM Sans5.3.0, cheerio1.2.0, sharp0.35.5, srcset5.0.3; Geist removed. [Current visual rules](../../docs/product/VISUAL-DIRECTION.md) replace the old specification, archived once in docs/history. [Capability matrix](../../docs/integrations/CAPABILITY-MATRIX.md) and contract Harness are updated.

## Formal five gates

All executed gates ran on the same clean frozen SHA above, without loading .env. Other gates use one OS outbound-denial layer with loopback allowed; the browser entry has no outer sandbox so runner-replay children can apply their own OS isolation.

| Gate | Exit | Elapsed | Result |
|---|---:|---:|---|
| npm run typecheck | 0 | 0.547s | PASS |
| npm run arch:check | 0 | 0.194s | PASS, zero forbidden dependencies |
| npm test | 0 | 61.525s | 1679/1679 |
| npm run test:browser:fixture | 1 | 339.296s | FAIL; G2 5/5, Chromium 388/392 |
| npm run build | — | — | NOT_RUN after preceding gate failure |

G2:5/5,24.932s. Remaining Chromium:388/392,314.187s. Combined worker summary:393/397,339.175s; this combined summary is **not G6**. `test:g6:assembly` did not run because the `&&` browser phase failed. Original output and exit/timing records: [manifest](gates/manifest.json), [browser raw log](gates/browser-fixture.log), [acceptance classification](acceptance-status.json). Exact54 current-HEAD sparse materials were restored and SHA256-verified; no full history checkout or assertion relaxation.

## First failure and impact

1. `Workspace equivalent intent mobile/desktop` at `src/harness/browser/web-workspace-slice2.test.ts:464`: after Keep the same dinner conditions / Same dinner, please, the identical authoritative intent and still-present batch have three unexpected revisionDiff.removed entries, all NO_LONGER_MATCHES. This can show a phantom removal diff for unchanged conditions.
2. `Workspace inline Save end to end mobile/desktop` at line527: after area/date/time/guest edits, a final equivalent reaffirmation increments requirementRevision from5 to6; the contract expects it to stay5. Prior edit steps and the fresh-source/chip assertions reached this final check.

Both sizes fail the same two semantic scenarios. The new visual-branch contracts exposed an incompatibility with the retained727 business baseline; root cause is not yet independently established. No backend fix, test weakening or extra rerun was performed after the formal failure.

Reproduction (offline, no .env):

```sh
cd /private/tmp/praxis-3c-unified
/usr/bin/sandbox-exec -f .eval-artifacts/3c-unified-20261117/offline.sb \
  /usr/bin/env -i PATH="$PATH" HOME="$HOME" TMPDIR="$TMPDIR" \
  node --import tsx --test \
  --test-name-pattern='Workspace equivalent intent|Workspace inline Save end to end' \
  src/harness/browser/web-workspace-slice2.test.ts
```

All four original failure directories (PNG, trace.zip, JSON diagnostics) are durably archived under [failures](failures/), with paths in [failure-artifacts.json](failure-artifacts.json). The first failure appears at raw log line759; detailed assertion starts at804.

## Development visual evidence, separate from formal acceptance

The pre-freeze development checks passed: photo contracts15/15 at that stage; website-photo Chromium9/9; full three-size HTTP/SSE synthetic preflight16/16. Formal npm test subsequently includes16 photo contracts, including the added binding-budget invariant.

The16 visual preflight records and screenshots are preserved in [development-complete](development-complete/manifest.json):390×844 and1440×900 each run seven deterministic cases (Google short credit, long cover credit, cover HTTP failure, cover decode failure, no ID, partial corrupt gallery, both sources fail);960×900 runs both Google credit variants with long address, distance/price and button hit testing. Main paths include real loopback HTTP/SSE, inline /messages with draft preservation, current-candidate /questions and citations, second-slot B1/reload, SQL departure row and browser-context external navigation interception. The breakpoint cases focus on layout and B1, omitting G1. Expected initial session401, injected corrupt-gallery410 and blocked external navigation are classified separately; page errors and unexpected HTTP/console errors are absent in the preflight records.

These runs recorded HEAD727 with uncommitted development code, before final freeze, and must **not** be represented as formal53bbbdc8 acceptance. Long credit overflow found during development was corrected and the full16-case preflight repeated successfully. Screenshots are durable provisional Fixture references, not an approved regression baseline. Formal visual smoke was not run after the failed gate. iPhone Safari / Android Chrome devices remain unverified.

## Live / PostgreSQL / environment

NOT_RUN: no .env loaded, no credential validity probes, no PostgreSQL connection or write, no new Case, no test:postgres:live /2A / database clearing. Production DeepSeek, Google and restaurant website requests in this task:0. The prepared single-case driver is blocked by the failed acceptance manifest and has not executed. Its local target is system account at127.0.0.1:5432/praxis_smoke, LOCAL_CHROMIUM, port4312; configuration values are not currently verified.

Live source, displayed photo count, photo request counts, actual attribution/address quality, search resource counts and departure persistence are all NOT_RUN. `externalSideEffectCount: NOT_MEASURED`, total backend website requests:NOT_MEASURED, independent S0:NOT_EVALUATED. Offline Fixture evidence does not establish real source availability or independent user-goal qualification.

## Preservation and pending work

Main and original3C tree HEAD/branch/status/staged+unstaged diff hashes are unchanged: [before](protected-before.json), [after](protected-after.json). Main .env was never loaded or edited. No main merge or remote push. Only this new work branch has local commits.

Next required work is to resolve the two equivalent-condition contract failures without weakening backend checks or assertions, freeze a new candidate and rerun the five gates plus formal three-size acceptance. Only an all-green candidate may enter the previously authorized one-Case Live smoke. This round stops here.
