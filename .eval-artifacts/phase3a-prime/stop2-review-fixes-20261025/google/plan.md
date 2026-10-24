# Google recording repair

Status: draft / not integrated; fixture and exposed regression only. CET UTC+1.
Retire fixture-only manual HAR append first; unchanged uncaptured Runner must
stop complete Replay at MISSING_STRUCTURED_RESPONSE (valid red). Then capture
actual Google Places transport bytes in the eval Runner, preserving proxy/body/
response behavior and one original provider call. Use standard HAR entries and
existing recording version. Remove every request header and key-class query.
Scan candidate and reread written HAR; reject/depublish unsafe HAR with safe
reason only. Late responses after finalization are ignored.

Full fixture recording must replay under OS-denied network without manual HAR
append. Reuse current evaluator and assert original nonempty delivery and S0.
Minimal unit controls cover raw-body/Unicode fidelity, key-bearing URL/header
removal, hidden key rejection and actual post-write corruption rejection.
No product/shared Browser/restaurant-search/Prompt/Schema/Guard changes. Freeze
seed/scripts before formal Replay, clean five gates, then merge/push main and stop.
