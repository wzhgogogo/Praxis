C1 baseline input commit5be21ac28886d875d1a35b588ab369d3fd576755: real duplicate root CDP event crashes the old HTTP host (Duplicate target stack retained). Earlier PENDING-only assertion was an invalid timing oracle and is retained as a diagnostic, not product-failure proof.

Production remote connections now always use isolated workers; the inner session implementation moved without duplicated code. Old component tests subclass only the transport seam, retain all seven tests/assertions, while actual worker/CDP behavior is proved by independent real local protocol cases. Guard preparation must occur before navigation. Root events must not be confused with nested Guard CDP notifications; the fixture fixes one original packet before parallel activity.

Automatic approval rejected an attempted whole-file unit-test rewrite as coverage weakening. That command did not execute. Safer incremental adaptation retained every old test and assertion; seven component tests pass. No uncaughtException handler was added in the host.

HTTP Case delivery is not the same oracle as one page read: the normal Case loop can subsequently recover. The read failure is separately recorded as BrowserRuntimeError and a direct-operation test must reject BROWSER_RUNTIME_FAILED; healthy parallel and next reads must succeed.

Both source and dist hosts use createLocalWebServer + PGlite. The single source.json fixture is copied exactly into gitignored dist after build; no CLI dev, env load, native PG or4312. Built host and worker import dist production modules without tsx. Real remote CDP NOT_EVALUATED.
