# H001 native downstream unique Live Read-only — 2026-09-29

- Status: current exposed-development Live diagnostic; **CANCELLED at the 300-second deadline**, qualified result NO. No new Live retry.
- Scope: frozen H001 raw request, materialized to Tokyo `2026-09-29` at `19:00`, 2 people, near Shibuya, omakase positive HARD and `OPEN_ENDED`. No explicit coordinate, radius or proxy override; intended source order Tabelog then TableCheck. Temporary local Chromium profile, default network, read-only code path.
- Ceilings: 300,000 ms from before Semantic, 50 total model calls, 30 Agent steps, existing 60,000 ms candidate / 30,000 ms provider and browser/session limits.

## One invocation and deepest observed failure

The runner wrote [STARTED](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-29T08-10-13-247Z-1f8a9087-b998-46ef-b543-7e58d35dde79.started.json) at `2026-09-29T08:10:13.247Z` and [result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-29T08-10-13-247Z-1f8a9087-b998-46ef-b543-7e58d35dde79.result.json) at the 300,019 ms limit. [Independent Eval](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-29T08-10-13-247Z-1f8a9087-b998-46ef-b543-7e58d35dde79.result.evaluation.21-1790669713244.json) is a separate sidecar. Command log: `/private/tmp/praxis-h001-native-downstream-live-20260929.log`.

Semantic interpretation preserved the frozen H001 conditions. The first native SEARCH never reached Tabelog: its required Google named-place resolution for Shibuya returned `GOOGLE_NETWORK_FAILED`. All 25 completed Agent SEARCH actions repeated that same failure on the unchanged source-less state. The 26th Google named-place request was counted when the outer deadline cancelled the run. The Google client deliberately records only the stable network failure code; this artifact does not distinguish DNS, proxy, TLS or another fetch failure. No source page or DOM snapshot was observed in this run.

Resource use: 27 model calls / 96,854 tokens (1 Semantic, 26 Agent decisions), 25 completed Agent steps, 26 Google named-place requests, zero Google restaurant discovery/details, zero browser runtime operations and browser model actions. There were zero candidates, fact checks, availability checks, offers or `PRESENT_RESULTS`. Tabelog and TableCheck discovery funnels were not reached; neither source's coverage, latency, controls, HARD omakase evidence or current inventory can be assessed from this run. No booking, payment or other external write was attempted; the Runner's external side-effect audit remains `NOT_MEASURED` by contract.

The independent Eval records qualified result `NO`, execution `CANCELLED`, authoritative conditions `SATISFIED`, investigation behavior and completion outcome `SATISFIED` under its current rubric, required evidence and final claim `NOT_EVALUATED`, resources `NOT_SATISFIED`. These labels do not make the user goal successful. The repeated no-progress Google resolution calls consumed the 300-second budget without source progress; this is a distinct control-path deficiency to review before another Live. Source access failure does not change the product target or justify a wider radius, Google restaurant discovery, a new provider fallback, or an automatic rerun.

## Stop point

The single approved Live was consumed. No additional paid model, Google or real source call follows automatically. Preserve this failure artifact and independently review the Google network cause and repeated-search behavior offline before considering a separately bounded next experiment. The previous 39,515 ms Live reached one Tabelog candidate under a different observed run; this new cancellation neither invalidates that history nor proves the downstream fix on live pages.
