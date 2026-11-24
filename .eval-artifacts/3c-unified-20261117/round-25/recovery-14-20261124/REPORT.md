# Round 25 authorized recovery of 14 historical paths - 2026-11-24

**14/14 RESTORED; 137 STILL MISSING; BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS.** This is historical-byte recovery and evidence only, with no product changes or new functional test claims.

- Starting archive HEAD: `3261ba6cc6afe6c306f0fec8566eac90c827b56f`, branch `codex/feat-web-photos-unified`, clean tree; local sparse check passed.
- Functional frozen SHA remains `6202c1164aab14bec1a7353eadc8e5a522a3d259`; src tree `6453345249c5a2ebea1c6d5af3b2d2f14b283944`. Default1932/G2 5/Chromium576/G6 159, source/dist C1 4/4 each and visual16/6/157 refer to those actual frozen runs. No gates rerun for this evidence-only update.
- Authorized same-worktree sources only: six Round9 .mjs/.log files in full-round-audit-6VU93V, and six images in round-10/states matching eight Round10 target paths. Matching uses the original missing-list baselineSHA256, not filename inference. The handoff-reselect image restores three distinct paths with the same original hash.
- Every target was absent before writing; O_CREAT|O_EXCL created regular files without overwriting or linking. Source and target hashes were rechecked afterward; all match baseline, all sources unchanged. `restoration-receipt.json` records every source, target, hash and byte count. No historical scripts executed, no screenshots regenerated, no other missing paths restored. Recovered originals remain ignored/untracked.
- Original 151-item gap list, midnight interruption logs, original protection failure logs and baseline remain unchanged. `remaining-missing.json` independently records the current137.
- The frozen verify-protection.py is hash-checked and run with only its output destination redirected here; all checker logic and assertions remain unchanged. Exit1 is retained: 12501/12638 matching,137 missing,0 existing historical content changes. Main/env, closeout950 and sparse unchanged; no unauthorized protected changes.
- Original Round25 artifact-sha256.json remains the immutable3261 archive snapshot. Of its698 files only REPORT.md is authorized to gain this addendum; other697 are byte-identical. This directory's separate manifest records new outputs, sources/targets, updated report and ledgers.
- No src/test/frozen-input edits, external services, real PostgreSQL,4312, push or main merge. Real remoteCDP, native keyboard/zoom and Live remain NOT_EVALUATED.

Evidence: preflight.json, restoration-receipt.json, remaining-missing.json, protection-verification.json/.log, verification.json and artifact-sha256.json.
