# H001 result delivery E1 contract diagnostic

- Status: current diagnostic / exposed development data
- Document revision: 0.1
- Baseline: `93914d8`
- Scope: default result target and bounded delivery, no change to eligibility, evidence or full Live budget

## Frozen input, expectation and budget

The [saved H001 Live result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-24T03-56-54-360Z-31020bc5-a3c3-45bb-ae39-9c4cdb138093.result.json) has a 300,000 ms deadline and two independently eligible candidates in the Agent Context by step 5. At step 7, recorded at 04:01:09 UTC with the run ending at 04:01:54 UTC, both remained eligible, 22 candidates remained checkable, and the Agent chose another three-candidate `CHECK_AVAILABILITY`. The task ended `CANCELLED` with no presentation. The saved context does not assert an explicit user-requested result count; its target is the default three.

Independent expected behavior for a **future** budget-aware contract: when the default batch has one or two currently eligible, supported results, present them before the hard read deadline once the reserved delivery window begins; persist `resultBatchTarget.met:false`. An explicit user count, expired/incomplete evidence or cancellation cannot use that exception. The user-goal metric is an actual `PRESENT_RESULTS` transition before the deadline, not a post-run artifact extraction. The original 300,000 ms/50-call ceilings stay fixed. A candidate threshold for a first controlled experiment is a 45,000 ms delivery reserve, chosen from the historical 45-second remaining observation before any code or new result; it is diagnostic and must be checked against normal third-result completion in a controlled case.

Evaluator reuse: the existing result presentation/claim evaluator applies to any shown candidates; a manual budget and stage verdict supplements it. No evaluator changes are needed for the contract diagnosis. A later controlled execution must separately evaluate unsupported claim prevention, default short-batch delivery, explicit-count preservation, cancellation, elapsed time and actual resource use.

## First failure layer and stop

[ADR-0028](../decisions/0028-open-ended-result-targets-for-availability.md) and the current [Restaurant Domain contract](../domains/RESTAURANT-BOOKING.md) require a default batch of three and permit a smaller batch only after no ordinary bounded read remains. `resultTargetCannotBeMetWithFurtherRead` in the Domain Validator implements precisely this condition; the Agent prompt also tells the model to continue while a legal read exists. H001 therefore has both a decision-level instruction to continue and a validator-level rejection of a two-result presentation while checkable candidates remain. Existing `action-validator.test.ts` explicitly covers this behavior; the historical miss is a **contract gap**, not an implementation regression or an untested branch of that old contract.

**E1 verdict: the proposed budget-window behavior fails under the current accepted contract.** A local test that only scripts `PRESENT_RESULTS` would be rejected and could not meet the experiment's completion requirement. The next step is a new ADR that narrows ADR-0028's continue-until-exhausted rule for the default batch at a durable, run-scoped delivery deadline, followed by a controlled Router/Runtime test that actually executes presentation. This diagnosis does not change or claim acceptance of the product behavior.
