# Fixed-source rerun semantic comparison — 2026-09-20

- Status: bounded independent review of exposed synthetic-source artifacts; not Live or a Clean Baseline
- Document revision: 1.1
- Scope: user-requested H001–H005 batch in worktree 1135, 2026-09-20 12:50 UTC

The task `2026-09-20｜H005 优化：Terra 后续验收` ran the five cases after the user explicitly requested that batch. This review did not run a model or modify execution artifacts. These are separate worktree results, not a merge into the original checkout or a retrospective change to the earlier Prompt@7 failed matrix.

All five executions reached SUCCEEDED/TERMINAL/PRESENT_RESULTS with three distinct candidates and met batch targets. The existing evaluator was independently rerun read-only against each saved artifact: H001/H005 have all six dimensions SATISFIED; H002/H003/H004 have REQUIRED_EVIDENCE, INVESTIGATION_BEHAVIOR and RESOURCES SATISFIED, while semantic wording remains NOT_EVALUATED and propagates into FINAL_CLAIM/COMPLETION_OUTCOME and strict automatic FAIL.

## Comparison with the accepted 2026-09-18 runs

For each of H002–H004, the current raw-user SHA, materialized semantic Gold, complete criteria array (including wording, polarity and strength), date, time window, party size/provenance, timezone, target goal and area query match the corresponding 2026-09-18 manually accepted run exactly. Current request/evidence grounding is independently SATISFIED. Semantic Interpreter, evaluator, source scenario and current YAML files also match between the worktree and original checkout.

| Case | Exact previously reviewed wording difference | Current bounded conclusion |
| --- | --- | --- |
| H002 | good for a first date → suitable for a first date; hot pot restaurant → hot-pot restaurants; Sichuan/Hunan cuisine → Sichuan/Hunan-style cuisine where spicy food is the main focus | Same previously accepted semantic scope, polarity and strengths; current evidence checks pass. Manual acceptance retained for this run. |
| H003 | team dinner → suitable for a team dinner | Same previously accepted semantic scope; 10 people and Friday 17:30–22:00 preserved. Manual acceptance retained for this run. |
| H004 | good for meeting a friend → suitable for meeting up with a friend | Same previously accepted semantic scope; cafe HARD and afternoon recommendation preserved. Manual acceptance retained for this run. |

The previous runs also had raw automatic FAIL; their closure came from separate independent semantic review, not an automatic scorer change. The new summary omitted that distinction and appeared to report three regressions. These three flags do not demonstrate a new semantic or evidence regression. No score is rewritten and no general synonym whitelist is introduced.

Report the modes separately: **H001/H005 automatic PASS; H002–H004 automatic FAIL / semantic review required, with this bounded manual review accepted.** This does not establish real website capability, general semantic quality or the unreviewed Prompt@8 entity matrix.

Evidence: [machine comparison and current independent findings](../../.eval-artifacts/fixed-source-comparison-2026-09-20/comparison.json); [prior independent acceptance](SEMANTIC-CONTRACT-V6-INDEPENDENT-ACCEPTANCE-2026-09-18.md). Original worktree artifacts are referenced by absolute paths and SHA256 in the comparison file and remain unchanged.


## Commit integration addendum

The earlier review did not inspect Prompt@8's successful matrix. Subsequent independent artifact inspection confirmed that its unchanged 16-call matrix passed at 12:37 UTC, before H005 at 12:47 UTC and this five-case batch at 12:50 UTC. That closes the matrix gate; the earlier network failure and Prompt@7 semantic failure remain historical records. The final implementation is now integrated into the original checkout; the opening worktree-only and unreviewed-matrix statements record this document's original review boundary. See [Prompt@8 integration evidence](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md#prompt8-follow-up-and-commit-integration).

The following immutable execution artifacts are retained locally (Git-ignored), with hashes recorded here for audit. Automatic scores remain unchanged.

| Case | Run ID | Execution artifact SHA256 | Accepted by |
| --- | --- | --- | --- |
| h001 | 8bbb9559-ab76-4aff-8431-a731194c8220 | `c988e960e43e6470529eec50021d5308869d0ab5ad1341516fbd4745edca517e` | automatic PASS |
| h002 | 1b793a59-811c-4537-b2b2-14cd7f9d822c | `79333c198dc199819e4d978d06a8f68cb5f9211b9d93f12b7079a656159c50da` | independent manual review; automatic FAIL retained |
| h003 | 3bf164fb-d939-4f04-bac2-4e1824906596 | `e40a96c730cec80dc4fcaf1b4da39f8d5591b26238c4e788bd0900f512c137f9` | independent manual review; automatic FAIL retained |
| h004 | 2eb9c3f5-b7b9-4bd7-adf9-f035a9c92c21 | `3c2eb87032538997e19a4ae024def9e2e1568874ce9082eb0c88f82deb37b38c` | independent manual review; automatic FAIL retained |
| h005 | 689fd4e2-5f87-4555-b03b-c85993f8dda2 | `772d7d1ec872632a26b0fb382d0fecc189b54db2cfd58674d5c85790ee8e25a8` | automatic PASS |
