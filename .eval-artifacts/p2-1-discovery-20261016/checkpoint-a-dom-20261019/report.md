# P2-1a DOM-corrected checkpoint A

Status: FROZEN, not started. Development-only discovery probes; no availability, delivery, P2-1b or full Live.

Production `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`, clean managed worktree p21-checkpoint-a-dom, baseline acfaaffa unchanged. The fixed offline replay gate passed (3 distinct relevant-category cases; required2). Same ten ordered inputs, same witness bytes, radius and budgets; witnesses still valid through at least 2026-10-20T03:12:46.141Z. No recertification requests needed.

318 source/config/script hashes in freeze.json; freeze SHA256 `c83684d0c1effb5c5b6e25c3b8e6cc33c6bbb93e6463675084a5a727b01e4916`. Six Runner plan-only runs and preflight-only resume controls passed offline (runner-dry-run.json, outer-dry-run.json),0 model/network. Models origin212/450, probes31/42, Google79; ten new probes at most15 models/180s each. Preflight each planned source before every probe; count only evidence-backed NO_RESPONSE/EMPTY_RESULT, stop after cumulative failures>2, immediate S0 stop. No formal/capability retry.

Reuse five green source gates943/943 and local Chromium117/117 from p21a-dom-replay-20261019/gates/. Existing Google-only nearby correction ea7113a is present in the production ancestry; this ten-case plan uses the three-source native assembly, not the Google-only path. The suspected Google shared-keyword regression was not reproduced in the original raw A10 trace; do not infer a causal fix from placeholder retrieval metrics.
