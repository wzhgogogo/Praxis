# D8 observed-query receipt slice

Status: draft / not integrated. User review985f456e; CET UTC+1.

Promise: a current, guarded GET search submission binds the observed result list even when a visible search box has no name and the page copies its value to a hidden field. The observation loop stops at that list; existing adapters alone inspect identity (shared5-detail cap). Explicit empty-query results permit the next already authorized retrieval term within unchanged deadlines. No source requests/Google/Live in this slice.

Evidence: original D8 snapshots7/8 and decisions7–9; real source scripts and responses, original D3 directed replay and latest D4 recording. Red/green must demonstrate result-list binding, not infer identity from a successful query. Original D4 assessment stays immutable; additional identity evidence is a separately scoped sidecar. Diagnose G1 completeness without weakening it.

Validation: related executor/adapter/real-Chromium replay tests; up to30 actual-model calls on frozen original observations only; stronger same-provider model only on steps that current model still misses, with price/model reported. No new credential access mechanism. Full five gates + strictG2 + G6 once at final candidate; no merge or Live. Product changes must be generic, scanned against985f456e. Versioned prompts/State/contracts are not silently changed; per-read objectives remain runtime guidance.

Post3b followup retained: insertion value provenance copied by page JS is currently classified PAGE; hash-based origin tracking deferred by user.
