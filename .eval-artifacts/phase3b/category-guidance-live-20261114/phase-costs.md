# Per-provider recorded phase costs

Post-run derivation only. Stages allocated using adjacent diagnostic monotonic timestamps; sums include model/settle time inside the labelled stage. Closure bookkeeping is retained rather than redistributed. HAR timestamps are privacy placeholders, not a latency clock.

| Provider / candidate | Discovery ms | Identity ms | Availability ms | Facts ms | Total ms | Model calls | Scope result |
|---|---:|---:|---:|---:|---:|---:|---|
| DIRECTORY | 68453 | 14310 | 0 | 0 | 82763 | 10 | EXECUTOR_CLOSED |
| Oka Joki | 125 | 8454 | 2815 | 0 | 11394 | 2 | ADAPTER_RETURNED |
| sumika | 1 | 2824 | 28161 | 0 | 30986 | 4 | ADAPTER_RETURNED |
| Saigyo no Bansan ~ Sushi to Kaki to Nihonshu no Uragiri ~ | 0 | 2699 | 31307 | 0 | 34006 | 3 | ADAPTER_RETURNED |
| Oka Joki | 0 | 0 | 0 | 10193 | 10193 | 1 | ADAPTER_RETURNED |
| Saigyo no Bansan ~ Sushi to Kaki to Nihonshu no Uragiri ~ | 0 | 0 | 0 | 24534 | 24534 | 2 | ADAPTER_RETURNED |
| Sanuki no Udon Hana wa Saku Shin nakano honten | 0 | 3026 | 19049 | 0 | 22075 | 4 | ADAPTER_RETURNED |
| Gempin Nakano Fugu Unagi Ryouri | 0 | 2763 | 24351 | 0 | 27114 | 4 | ADAPTER_RETURNED |
| 中野製作所 まんてん別館 | 22636 | 2807 | 11708 | 0 | 37151 | 6 | ADAPTER_RETURNED |

Browser scopes exclude outer Agent, locality Google calls and standalone source fact-judgment latency; see run-audit.json purposeCosts for those. Native DIRECTORY scope contains five detail reads in its Identity subtotal, not a single availability lookup.

The Google-origin Manten candidate remains inside the frozen45s window:37.151s observed (name Discovery22.636s, Identity2.807s, Availability11.708s). Its final reason is RESERVE_REACHED, not a45s deadline. No per-merchant45s timeout occurred this run. Saigyo stopped at ADVANCE_OPERATION_BUDGET (80 operations) before the deadline.

Sumika direct identity started immediately (diagnostic212); Availability began at2.825s. There is no Sumika name-search fill/submit/complete sequence. Prior9cb Sumika reached Availability at28.185s; this is a single-run path comparison, not a controlled latency/stability estimate.
