# F2③ slice

Frozen regression / draft not integrated. Two-process local coordinator on loopback,
fixed two run slots with FIFO admission. Per-origin request leases; while an origin
has only one participating run, leases grant concurrently with waitMs zero. With
multiple participating runs, serialize dispatch and wait the configured interval
after the preceding response settles. No filesystem locks; disconnect removes all
queued/held ownership. Default 1000ms is conservative eval courtesy spacing, not a
site limit claim. Per-origin overrides are explicit configuration; fixture uses200ms.

Use the existing Chromium browserType injection boundary in eval-only bootstrap:
wrap admitted route.fetch and native redirect/preflight CDP sends, preserving Guard
admission. Google/source fetch transport uses same coordinator. No product edits.
At most2 formal runs; a third process waits before preflight/budgets start. Normal
one-run command remains unchanged when no coordinator endpoint is configured.

Real subprocess/local HTTP controls prove spacing, single zero wait, third FIFO,
SIGTERM/deadline/outer-stop cleanup. Initial implementation intentionally lacks
interval enforcement for the valid red, then implement it and obtain green.
Freeze sources, tests and outer scripts before each formal run. No external calls.
