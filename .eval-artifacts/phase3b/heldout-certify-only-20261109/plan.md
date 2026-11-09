# Certify-only slice

Status: verified integration candidate, source 7d6880d2; full gates PASS. No private original and no real source/model/Live calls in this change.

Promise: a validated private manifest can get one vacancy-only witness GET per case before formal output/manifest binding. Report true/false/null, time, original response SHA and sanitized response artifact; a source failure does not stop later cases. Never create product sessions or model clients, never charge Live. Reuse createWitnessReader(detail=false), original GET contract and 20s/8MB/no-retry bounds; preserve private turn redaction, existing public JSON and own-credential checks. Do not cache these certificates for formal runs.

Limits: same activated ledger/clean fixed SHA/env-file/commitment/manifest checks as formal CLI. At most six cases per invocation, twelve certification GET charges per canonical ledger across output folders; all also count within existing126. Source attempts at least5s apart, including last ledger GET. No formal ledger/output-root binding or immutable formal input hash creation. Immutable certification output gets its own hash audit. Quota exhaustion refuses before another request.

Acceptance: fictional manifests drive actual witness parser/writer/ledger through available/unavailable/network-failure cases, continue after unknown, verify exactly one GET each, response SHA, sanitized-copy privacy, zero Live/model, no formal binding; two changed-manifest outputs share twelve cap, third refused; CLI mode conflicts fail before clients. Full offline gates and scan, main fast-forward/push/ls-remote, stop for reviewer. Missing response has null SHA, unsafe body is explicitly omitted under unchanged recording policy.
