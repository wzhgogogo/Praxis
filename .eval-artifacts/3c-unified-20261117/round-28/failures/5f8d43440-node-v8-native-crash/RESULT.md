# Same-SHA runtime crash

Frozen 5f8d4344018b9acae8352cd3fa0757f6dad10d2d. Typecheck, Arch and Build passed. The default gate stopped with Node 24.4.1 V8 Fatal Check failed: end > addr in UnregisterWasmAllocation / WasmCodeAllocator::FreeCode inside local-web-server.test.ts. 1931 of 1932 observed tests passed before the worker crash. Chromium/G6/dist were not run. No assertion, source, toolchain, scope or environment was changed before the same-SHA full retry.
