# Time-chain proposal — no values changed

CET UTC+1; draft for user decision, not implemented. Source: frozen D4 run7a73ba84, boundary-observation.json and scope endings.

| Existing limit | Meaning / current observed cost |
|---|---|
| Navigation20s | Search click20s stalled before forwarding, repeated3 times. Atomic proof fix targets that mechanism, not slow source response. Source navigation limit remains20s. |
| Provider45s | Applies to named source investigation; TableCheck45.003/43.243/28.301s, no accepted inventory. Native source discovery currently uses its candidate90s scope (TableCheck90.004s), not45s; do not pretend all source activity was45s bounded. |
| Candidate90s | Shared across fallback; Kushiman77.334s, Yamasho73.484s, izakaya31.367s, all UNKNOWN. |
| Total500s, reserve20s | D4 execution332.274s; no new source/terms work started in reserve. Still47 model calls before delivery. |

TableCheck total206.551s, Tabelog99.050s across native discovery plus three candidate paths. Those305.601s are sequential scope costs, not added a second time to candidate totals. About26.7s remains for orchestration/other model work. TableCheck did not spend206s fetching inventory: recorded decisions repeatedly changed Destination/cuisine after explicit no-match text. Native phase used15 browser model calls; three named paths8/8/4. These costs are a failed search sample, not normal identity+availability latency.

Option1 (recommended for the already-approved next validation): retain20/45/90/500+20. First remove the reproduced pre-forwarding wait and the model's repeated no-match actions; then measure one completed identity+availability trace. This keeps fallback room (a nominal45s provider leaves45s for the other source) and does not attribute a search bug to insufficient time. No successful completion measurement exists yet; do not promise that45s suffices for the new model-calendar path.

Option2, only after user/reviewer approval and a successful measured sample: raise the provider ceiling45→90, still min(provider ceiling, candidate remaining, total remaining minus20s); candidate90, navigation20, total500/reserve20 unchanged. This lets one source finish a measured45–90s path but can consume all candidate time and eliminate fallback. With five90s candidates only30s remains outside reserve for discovery/other work, so it cannot be justified from the current UNKNOWN-only trace. No provider-specific ordering, automatic retry or new source allocation is proposed.

Decision data still needed: source startup/search, identity, calendar choices, selected-state verification, response/inventory binding, presentation/terms costs for at least one real successful source path. Record both actual model count and time per step. The next Live is gated on review; no run here, no time or quota changes.
