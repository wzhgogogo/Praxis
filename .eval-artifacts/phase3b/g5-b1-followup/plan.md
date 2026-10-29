# G5 B1 approved follow-up

- Evidence status: draft / not integrated; exposed offline fixtures. Prior 6b867b34 evidence stays unchanged.
- Time basis: Vienna CET UTC+1, 2026-10-29.
- Main synchronized:50a0836148c5b026240a770de89c5d5357091355; merge4342c989 preserves both logs and A scheduling. No shared ledger conflict.
- Authorized: Accepted ADR0049 (renumber prior proposed0048), persistent Case/departure USER_REPORTED Yes/No/Skip, parallel Japanese/English cancellation statements with confirm hint, Tabelog English fee evidence/config, Live checklist only. G3 source connection deferred until B merges; protected three files untouched.
- Versions: new transient B1 handoff contract changes1→2; existing Agent/Semantic/G1 Prompt and schemas, State24/TaskDefinition22 unchanged. Separate feedback SQL table/migration is an interaction receipt, never a booking outcome.
- Resources: models0/Google0/Live0; public GET≤2 INCLUDING robots (shared242/257 before). No.env. Direct HTTPS, no Cookie, no redirect/retry,20s timeout,≥30s between GETs; rate limit or robots restriction stops fee work.
- Help URL observed in saved nr010 HTML: https://tabelog.com/en/help (not synthesized; reservation_rules/help links also present, not requested). First fetch https://tabelog.com/robots.txt, examine rules and write explicit permission decision before exactly one help GET. Save original bytes/headers/decoded text/URL/time/SHA, append shared ledger per attempt.
- Red/green: existing page hides language conflicts; new fixture demands two quotes/summaries plus exact conflict notice and website confirmation. Persistent HTTP tests start at createCase, prepare/departure, atomic prompt claim, response; restart/concurrency/idempotency/cross-user/late/invalid controls. No Task state/Outcome change.
- UI: source links record a validated departure on explicit click; return (focus/pageshow) atomically claims one question per Case. Duplicate deliveries/reloads do not re-ask; responses durable and never BOOKED_VERIFIED. Return confirmation not polled from provider.
- Verify: freeze source/inputs/scripts, five gates+ordinaryG2 with clean trees before/after; local Chromium frontend and independent literal quote/query checks. Model/Live quality not inferred. Push work branch, stop review, no main merge.
