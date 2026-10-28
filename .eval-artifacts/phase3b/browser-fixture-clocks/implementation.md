# Fixture clock implementation

Status: current candidate, not integrated. Four A-owned eval/harness files change; product runtime/browser/Guard, site adapters/Pack, Prompt/Schema/State unchanged.

G2 now inherits the owning test AbortSignal. Actual operations are awaited through completion and existing navigation timeouts remain10s. The test-wide180s bound is unchanged and shared by all12 pages; no larger per-page timeout is introduced. CLI gets one total180s bound instead of up to12 independent30s lifetimes. The source content/completion assertions and fixed baseline are untouched.

Health exposes sourceId to its existing fixture-only clock factory. All modes now use their own injected clock; browser startup and snapshot CPU work do not advance it. Real browser Clock still produces the300ms busy mutation after a visible first snapshot. Late mode first obtains real complete snapshots, then holds a later snapshot delivery across the unchanged1000ms logical window by220ms. Added assertions require prior completed evidence, last snapshot pending at cutoff and elapsed1000–1100ms. Original healthy/busy/403/challenge/Guard/GET/no-reserve/backoff assertions remain. Production10s health window unchanged.

Local two-target Chromium control2/2 PASS, zero source/model calls. User-reported errors captured before code change under2CPU quota stress; ordinary2CPU/one-CPU full controls passed. Gate success below must be demonstrated by three consecutive full2CPU suites, not inferred from local targets.
