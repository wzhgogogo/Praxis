# G1 real model evaluation — frozen slice

Status: current executable / exposed reviewed development set. Vienna CET, 2026-10-28.

Use main 6fa60cda after B dc486430 integration; keep G1 core, Prompt, questions, references and scorer unchanged. One existing Runner process per question/repetition, 34 × 3 trials, serial. Identity and read-clock metadata are explicitly local construction; pages are saved website HTML, not live site reads. Five mismatch questions should bypass the model, so 102 trials need at most 87 normal provider calls, within 120.

Only Node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env may load credentials. No credential inspection, copy, log or staging. Exact original model request parameters (including 8-second timeout) remain unchanged. No schema retries. Before each provider dispatch append one unique shared-ledger entry. Save request (no secret), response, core output and scorer sidecar. Model fetch is restricted to the existing DeepSeek endpoint; saved-page Chromium has scripts and all transport disabled. Execution preload denies answer files; scoring runs later in a separate process without credentials.

Before running freeze and commit all inputs/orchestration. Fixture control and five gates precede the first paid call. After each trial invoke independent scorer, inspect unknown paraphrases against saved sources, retain provisional independent-review sidecar without changing rubric. Any wrong-outlet, fabricated or sensitive-guarantee assertion stops immediately. Noncanonical wording remains NOT_EVALUATED for reviewer decision. No real-site calls, Google or Live.

Report per question/repetition, missing/failed trials, not-stated denominator, category/confirmation, UNVERIFIED reasons, independent claim check and attribution. Do not declare G1 accepted; reviewer/user decide. Test-suite review is a separate offline slice after C integration / B G3 start: per-test rationale, replacements and protected boundaries; no deletion before review.
