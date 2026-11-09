# Held-out resume review slice

Status: draft / not integrated. 2026-11-09. Baseline ab521b9f/source5bb04c63. Exposed D4/D8 development recordings only; no private holdout text, websites, models or Live this step.

Acceptance: --resume binds original/manifest/source SHA and the same ledger. Never rerun a completed evaluated slot; recover persisted evaluation after interruption; cancelled health retry consumes no Live; explicit environment failure replacement gets a new immutable attempt and charges one of four environmentReruns before replacement, with a fresh health check. S0 blocks resume. An already charged Live without evaluation or explicit environment evidence stops for human review rather than duplicate expenditure. Journal and attempt evidence persist, exclusive run lock avoids concurrent resumes.

Health: once per case before r1, plus after health/environment interruption; two sources/two rounds, <=10s each and >=5s GET spacing. Planned slots <=18, fullLive cap22, GET126, model2500 unchanged. Frozen D8 pack supplies exactly21 independent contracts; private manifests containing reviewedReadRules are refused.

Question diagnosis: one bounded offline pass. D4 fact navigation's 700ms initial sample reports PAGE_STILL_LOADING_WITHIN_BOUND, and the retained question page is INCOMPLETE_PAGE. D8 capture retries reject COMPLETION_RESULT_BUSY and produce NO_PAGES. Existing snapshot cache already replaces by run/candidate/source/currentURL; recorded artifacts omit precise settlement diagnostics and cannot establish the cause of busy state. Do not invent SETTLED or an answer. If no safely evidenced small fix emerges, preserve a documented nonblocking gap, no product relaxation or new reading.

Validation: fictional manifest/resume controls, real ordinary G6 fixture composition, S0/failure/crash/budget/identity mismatches; no Clean text. Full five gates and strictG2, hardcode scan; then synchronize main without behavior changes, merge/push/ls-remote, freeze on main, one-page report and stop. User explicitly authorizes merge/push in this request. Repository Planning/Test/Eval/Post-change skills apply; no new agents or real calls.
