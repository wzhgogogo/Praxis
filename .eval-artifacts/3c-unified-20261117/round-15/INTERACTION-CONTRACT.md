# Round 15 interaction contract

Draft / not integrated. Baseline 35d0523f83bd5fd34904eb1409cdf66ce1b0b77c.

Navigation belongs to one tab. Home, Candidates, Details, Saved and Handoff retain their current markup, keyboard controls and responsive layout. Position stores only view, candidate and batch-end position. A render derives visible controls without deleting durable choices.

Explicit time selection belongs to authenticated user, Case, requirement revision and candidate. Its independent storage holds dateTime and partySize. Inventory projects the current offer ID. Missing inventory retains the choice, replacement inventory requires explicit reselection when the chosen time disappears. Back and another tab's position never overwrite it. An explicit cross-tab choice exits an open Handoff before another departure.

The composer retains a separate in-memory draft per Case. Clarification and condition edits use messages. Optional chip removal preserves the composer. Saved does not select a booking. Find more retains its current batch and empty-state rules. About questions use the current candidate and questions endpoint, retain rewritten drafts, and display identity-bound citations. Photos and Viewer preserve current demand-loading and keyboard/touch behavior.

B1 departure requires current server-projected handoff. Return prompts are server-claimed at most once and cached by Case for this page session. Answer success clears that cache. Hard reload does not repeat a claimed prompt.

Stop carries source read ID and observed task version. Preparation and execution share cancellation ownership. Same-read concurrent saves may advance task version without changing ownership. Cancellation rechecks current state before persistence. Replacement reads reject stale Stop with 409. A stopped preparation makes no provider call.

Acceptance covers the four reported counterexamples and two controls, existing condition/clarification/navigation/question/feedback/batch flows, all five offline gates and the three visual suites at one clean frozen SHA.

## Module responsibilities

- runtime owns page-session state and DOM helpers.
- navigation stores only tab position and opens plans.
- slot-selection contains typed pure storage keys and inventory projection. selected-slot binds that projection to the page and independent localStorage.
- transport owns authenticated Case requests, version handling and SSE.
- session owns per-plan drafts and once-claimed B1 feedback.
- photos owns demand-loaded cover/gallery and Viewer behavior.
- views renders the existing DOM. entry installs interaction handlers.
- workspace-assets serves emitted same-origin ES modules. tsx uses the repository TypeScript compiler once at process startup, while build emits the same modules under dist/web/browser.

The migrated DOM wiring keeps permissive parameter inference during this extraction. The new slot storage and inventory contracts have explicit types and regression tests in npm test. Every browser module is included in the independent DOM tsconfig and checked without suppression directives.
