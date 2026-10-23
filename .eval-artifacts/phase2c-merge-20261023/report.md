# Phase2c reviewed mainline merge

Evidence status: reviewed integration, current source baseline; exposed offline regressions, no new holdout or Live.

- Mainline input: `8ba0c54a06189c03fd3f7366a865cf705f314aab`.
- Approved repair/review: `ae2235b6a9d9f76529da0e5ffbd4004b04453a6e`; [original independent review](../phase2c-location-semantic-20261023/independent-review.md) preserved unchanged.
- Merge commit: **`03f585a23c8501264e8dddc0ee2cae1d043c786e`**, parents exactly the two commits above, no conflicts/manual resolutions.
- Regression input freeze: `9ba840d7`; [4184-file freeze](replay-freeze.json), [812-file independent calibration freeze](regressions/calibration-freeze.json).
- Product reference: `16e91940f3cb503be15d968df219d18a9d473875`.

## Product equality

[Byte comparison](product-byte-comparison.json): **337/337 identical, exceptions0**. Includes all tracked `src`, `web-skills`, `scripts`, `docs/skills`, package/lock and TypeScript build configurations; tests/fixtures are included, not only runtime modules. No product, Prompt, Schema, State, evaluator, input or qualification edits during integration. State20, semantic promptv23/schema3, Evaluator33/rubric29 retained. Only merge evidence, current status and history documentation are added.

## Fresh post-merge verification

| Verification | Result | Evidence |
| --- | --- | --- |
| typecheck | PASS | [log](gates/typecheck.log) |
| arch:check | PASS | [log](gates/arch-check.log) |
| npm test |1022/1022 PASS| [log](gates/default-tests.log) |
| build |PASS| [log](gates/build.log) |
| test:browser:fixture |137/137 PASS| [log](gates/browser-fixtures.log) |
| Calendar cached real-response replay |69/69 PASS| [result](regressions/regression-results.json) |
| Selection cached real-response replay |5/5 PASS| [result](regressions/regression-results.json) |
| Independent evaluator calibration |22/22 outcomes,20/20 normal declarations PASS| [comparison](regressions/calibration/comparison.json) |

Five gates are fresh executions after merge, not reused old gate logs. Browser tests use local Chromium/HAR only. Generated tracked region metrics are saved separately and original bytes restored by the gate wrapper; [restoration verification](gates/side-effect-verification.json). Calendar and selection replay unchanged frozen model responses through current production decoders with identical messages/schema; calendar retains only the previously authorized10s→30s transport timeout difference. Calibration saves automatic outputs before reading frozen comparison labels; two interrupted cases retain declaration NOT_EVALUATED, and missing network evidence stays unknown.

## Proof boundary and unchanged facts

- End-to-end current restaurant outcome: NOT_RUN; no new Live or capability/exit signoff claimed.
- Components: fresh local suite and69/5 cached-response regression; product-byte equivalence to reviewed code.
- Severity: independent22 calibration remains stable; no new general S0 certification. Old incomplete evidence remains incomplete.
- Attribution/limits: no new behavior, conflict fix or Prompt tuning. Independent review's Omotesando type-contract gap, old Ebisu zero-result uncertainty and40 missing historical ranked responses remain. This merge does not erase historical source-code growth or change exit6.

Incremental model0, Google0, source websites0, full Live0. Model chain remains162/220, recorded stage total3796/5000; no new budget consumption. New holdout commitment/questions were not searched for or opened.

Primary worktree contains the preexisting9 user-modified/untracked files and an older local main ref. They are not stashed, copied into the merge or overwritten. The clean integration checkout is the staging copy of remote main; push is `HEAD:refs/heads/codex/feat-live-restaurant-read-path`, with normal fast-forward protection, no force. [Before snapshot](main-worktree-before.json) and final integrity comparison document preservation. Final delivery/evidence commit follows verification; authorized push and exact remote receipt are checked last, then work stops.

Final [integrity receipt](final-integrity.json) verifies product bytes, both replay freezes, reviewer blob, test results, current log/index links and all9 primary-worktree files. All requested offline verification passed; stop after the authorized mainline push.
