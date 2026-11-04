# Approved D8 main integration

- Current offline integration verification, exposed development; no new Live/clean evaluation.
- Verified 2026-11-04T09:57:54.012224+01:00 (Vienna CET UTC+1).
- User-approved reviewed branch: `codex/fix-phase3b-named-and-region-resolution` @ `aba06e165eedbb1d0b65023be17932d4c6a78dab`.
- Main synchronized: `de2b7ecc3ca6f54cf362883c61e2fb342c4e7f61`; actual merge `f791378c` has main first parent and the reviewed commit second parent.
- Final gate candidate: `1980ed01e601c8ee7fa8b0ff9582daddca3a1a72`,895 source/input SHA entries (`freeze.json`). Final archival commits change only reports/history, with tested source/inputs unchanged.

## Integrated behavior and retained boundary

Exactly one HIGH identity-bound full-name match resolves when remaining UNKNOWN peers have no equal known Google full name (including same-Place-ID Japanese names). UNKNOWN exact names and two verified homonyms remain ambiguous. Investigation prefix, source identity thresholds, versions, Guard, reserve and B's existing90-second candidate budget remain unchanged.

The approved full original A G6 corpus now joins main:8 original test files,66 cases, and their original helpers/source evidence are byte-identical to the reviewed files. `npm run test:browser:fixture` automatically runs ordinary Chromium and `test:g6:assembly`; all conversations' five-gate runs therefore include the full group. Default unit/integration tests remain a separate denominator.

`merge-proof.json` independently preserves118 source/original-artifact rows from the reviewed branch and current main. Only STATUS and the monthly index had append conflicts, resolved by retaining both sides; other history merged without loss. All prior budget entries from both sides are identical and preserved; one zero-call integration row yields881 rows. No .env read/load; model/Google/website/Live calls0. The separate location-suggestion branch is not included; Native search remains main-exact.

## Fresh verification

| Gate | Result | Seconds | git status before/after |
|---|---|---:|---|
| typecheck | PASS | 0.559 | empty/empty |
| architecture | PASS | 0.238 | empty/empty |
| default | 1430/1430 | 55.276 | empty/empty |
| build | PASS | 0.616 | empty/empty |
| chromium | 189/189 ordinary Chromium +66/66 original G6 | 181.436 | empty/empty |
| strict-g2 | 5/5;12 valid pages PASS | 24.762 | empty/empty |

All six commands passed on the first integration attempt, with no skip, assertion change or gate retry. The five additional default cases versus reviewed1425 come from main's previously approved candidate-budget controls. Default output also captures the7 existing D8 literal expectations and the ordinary persistent-assembly UNKNOWN-peer control. No new test fixture or oracle was introduced for this merge.

Independent `audit.json` passes171 checks: every frozen source/input, original A bytes, unchanged main contracts, approved/main ancestry, all7 D8 result expectations, ordinary composition, full G6 entrypoint and totals, strictG2, clean-tree receipts and exact immutable ledger sums. Historical raw D8/D4/Google and evaluator scores are unchanged; former real-site limitations remain as previously reported.

## Publication

User explicitly approved main publication after green checks. Reconfirm origin/main remains the synchronized ancestor, publish this descendant without force and verify with ls-remote. The final main SHA and the two requested notification results are reported in the delivery message. No new external evaluation is authorized by the notification.
