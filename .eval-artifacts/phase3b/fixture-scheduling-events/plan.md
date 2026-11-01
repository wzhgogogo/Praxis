# Browser scheduling fixture event synchronization

- Status: draft / not integrated, offline local construction only.
- Date: 2026-11-01, Europe/Vienna CET (UTC+1).
- Base: B `a7860924b8630a34318811b477af54e0f007d0b6`; main `6db445ea` remains unchanged.
- Work branch: `codex/fix-phase3b-fixture-scheduling-events` (contains B's complete page-capture repair, without importing A's unreviewed G6 branch).

## Slice commitment

Fix only the synchronization in A's `src/harness/browser-fixture-scheduling.test.ts`. Preserve every existing assertion, both existing test cases, the 60-second subprocess deadline, G2's 180-second assertion and the 600-second browser phase guard. Do not change production code, worker/outer scripts, B/C tests or G1 contracts. The observable improvement is that a delayed real held-test lifecycle notification cannot cause the test to expire before its own diagnostic precondition has been observed.

## Evidence and execution order

1. Preserve B's original complete-suite 1287/1288 failure and subsequent main/B isolated 5+5 passes. The isolated passes do not establish a repair.
2. Freeze before execution. Run exactly one unfiltered `npm test` on unchanged B as a natural reproduction attempt; do not repeatedly run until a failure or pass appears.
3. Reproduce the suspected race in a minimal isolated copy: hold only the actual a-held TEST_START pipe write until the driver has observed the three old prerequisites (stdout, b-finished FILE_END, c-held FILE_START). A filesystem event releases the original message; do not create fake events, change assertions, increase limits or alter production scripts in the checkout. Run the entire two-test file. This is a controlled event-order reproduction, not a claim to reproduce the entire original Linux environment or the historic 600-second hang.
4. After a matching red at the unchanged target assertion, make the driver await that actual lifecycle event as well; check only after the parent event listener has consumed the same chunk. Repeat the identical controlled schedule, then three independent ordinary complete-file runs, keeping all assertions unchanged.
5. Freeze the final candidate and run five unfiltered gates plus strict G2 on B plus the A-only test change. Every gate starts/ends clean and frozen hashes must stay unchanged. No new real calls or .env access. A gate green does not erase prior failure logs.

Stop for a product/worker change, weakened assertion/longer deadline, two unsuccessful gate repairs, real calls, or a first-deviation outside this owned test. Append zero usage to the shared ledger while preserving B's original records. Push work branch only; no main merge.
