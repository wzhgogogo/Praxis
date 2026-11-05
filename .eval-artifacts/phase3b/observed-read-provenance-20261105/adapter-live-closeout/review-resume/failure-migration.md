# Original failure map

Status: draft / not integrated; exposed development fixtures. The original full run counted 96 failures: 89 independently listed leaf failures plus 7 failed parent summaries. Do not count the parents as seven additional product defects. Full original log is retained in ../gates/test.log.

| File | Leaves | Product fix | Fixture migration | Deferred |
|---|---:|---:|---:|---:|
| `src/application/restaurant-booking-terms-composition.test.ts` | 2 | 0 | 2 | 0 |
| `src/application/restaurant-message-handler.test.ts` | 1 | 0 | 1 | 0 |
| `src/application/restaurant-named-identity-prefix.test.ts` | 3 | 0 | 3 | 0 |
| `src/application/restaurant-named-outlet-source-names.test.ts` | 3 | 0 | 3 | 0 |
| `src/application/restaurant-named-unknown-peer.test.ts` | 1 | 0 | 1 | 0 |
| `src/application/restaurant-saved-booking-terms.test.ts` | 2 | 0 | 2 | 0 |
| `src/application/restaurant-user-booking-selection.test.ts` | 2 | 1 | 1 | 0 |
| `src/eval/restaurant/agent-loop/current-development-fixed-sources.test.ts` | 3 | 0 | 3 | 0 |
| `src/eval/restaurant/agent-loop/current-development-offline.test.ts` | 10 | 0 | 10 | 0 |
| `src/eval/restaurant/agent-loop/fixed-source-case-execution.test.ts` | 1 | 0 | 1 | 0 |
| `src/eval/restaurant/agent-loop/g6-booking-terms-composition.test.ts` | 1 | 0 | 1 | 0 |
| `src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts` | 7 | 0 | 6 | 1 |
| `src/eval/restaurant/agent-loop/name-resolution-benchmark.test.ts` | 2 | 0 | 2 | 0 |
| `src/eval/restaurant/agent-loop/native-discovery-components.test.ts` | 2 | 0 | 2 | 0 |
| `src/eval/restaurant/agent-loop/source-stage-probe.test.ts` | 2 | 0 | 0 | 2 |
| `src/harness/restaurant-execution-router.test.ts` | 2 | 0 | 2 | 0 |
| `src/infrastructure/browser/browser-candidate-budget.test.ts` | 2 | 0 | 2 | 0 |
| `src/infrastructure/browser/local-playwright-chromium.test.ts` | 1 | 0 | 1 | 0 |
| `src/integrations/restaurant-availability/live-browser-availability.test.ts` | 3 | 1 | 2 | 0 |
| `src/integrations/restaurant-availability/named-search-session-reuse.test.ts` | 4 | 0 | 4 | 0 |
| `src/integrations/restaurant-facts/google-listed-website-facts.test.ts` | 13 | 13 | 0 | 0 |
| `src/integrations/restaurant-facts/model-page-question.test.ts` | 2 | 2 | 0 | 0 |
| `src/integrations/restaurant-facts/page-question-capture.test.ts` | 3 | 3 | 0 | 0 |
| `src/integrations/restaurant-search/location-suggestion-discovery.test.ts` | 6 | 0 | 6 | 0 |
| `src/integrations/tabelog/tabelog-public-query.test.ts` | 1 | 0 | 1 | 0 |
| `src/server/local-web-server.test.ts` | 10 | 9 | 1 | 0 |

Counts are primary failure-mechanism categories, not changed-file or added-test counts. Seven parent summaries belong to the same nested controls and all passed in the 327-test related run. Per-test names and categories are in original-failure-classification.json.
