# G3c evaluation fixture synchronization

Status: draft / not integrated; exposed development fixtures, not clean holdout.

2026-10-29 CET (UTC+1). Base: `51b0d3deaae837e4b8063f1a10a159675a6fc9e7`.
Branch: `codex/chore-phase3b-g3c-eval-fixtures`.

This slice restores the existing evaluated result contracts through production composition after Source facts Prompt/Schema 2 replaced private menu/price shortcuts. Only the four user-named evaluation source/test files may change executable behavior. Source facts proposals choose complete current-page statement IDs and roles; they neither consume Agent actions nor supply facts. Constructed page snapshots must expose identity and merchant prose as public text, with saved-page provenance. Explicit fact-investigation actions replace dependence on deleted shortcuts when needed.

Before edits, freeze the four files, the handoff and failed inventory, and record the complete unmodified `npm test` output. Inspect and reuse the existing assertions and independent evaluator, Gold and expectations without changing them. Record each old/new scripted sequence and each source-material path and SHA. Stop if real-page evidence exposes a product defect; do not repair product files or manufacture guide-page evidence.

Acceptance: the 13 previously failing Node cases (12 leaves plus a parent) pass unchanged; all five gates and `PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` pass with clean Git status before/after. Freeze final executable inputs before gates. Logs/artifacts are written outside the worktree during execution, then copied as evidence. Production budgets/deadlines, delayed/cancelled/budget counterexamples, Gold/scorer/expectations, production source and Prompt/Schema/State remain unchanged. All real model/Google/website/Live calls are zero; do not read or stage `.env`. Commit and push this branch, do not merge main, then notify B as authorized by the user.

Red command: `npm test` (no environment-file loading).
Targeted command: `node --import ./scripts/test-filesystem-guard.mjs --import tsx --test src/eval/restaurant/agent-loop/native-discovery-composition.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts src/eval/restaurant/agent-loop/fixed-source-case-execution.test.ts`.

This validates scripted offline wiring and independently asserted outcomes, not real-model adherence or current website availability. Four-layer judgments already exercised by these tests remain authoritative; no new quality scorer or acceptance rule is introduced.
