# User-message booking selection

- Status: draft / not integrated; one remaining legacy HTTP expectation awaits narrow approval before final gates.
- Branch: codex/fix-phase3b-user-booking-selection. No main merge is authorized.
- Initial base main: efeab25483cf58011b7505c32d6da857e41c2533. Latest main549061e8392bfb6224d1ac9ca78671714d330e2c was synchronized in ad2ee3a8; four documentation conflicts retain both sides, upstream diagnosis source/config bytes are unchanged.
- Green product: 4413e4ffea10ba844dc59d9efc25977b18b873e5.
- Mode: saved real-model response Replay plus locally constructed source I/O, actual createLiveReadAssembly, persistent application/Compiler/Router/Reducer and PGlite. New real model/Google/website GET/Live calls: 0. No .env loading or private Holdout access.

## Implemented behavior

An accepted SPECIFIC_OUTLET target with BOOKING_WORDING basis produces a code-admitted choice request. Full-name equality uses NFKC, case and whitespace normalization only; no prefix, token, similarity, translation or branch stripping. All matching authoritative candidates must be unique. An already displayed outlet can bind its candidate ID before the normal semantic reset; a newly named outlet also requires existing HIGH ENTITY_MATCH evidence. This resolves a reference, never relaxes source identity. Descriptive queries without a unique full-name reference stay with the ordinary Agent.

Normal semantic changes still reset candidates, selected fields and availability. The existing compiled message event retains only userBookingSelection and an optional displayed candidate ID, never raw goalBasis/reason/quotes or a new State field. A party-only reply can carry the original authoritative choice request. A new target without another admitted booking choice, semantic failure or conflict clears the pending request. The application reuses the event history already read for message idempotency; selection does not add a per-step history query.

Before an ordinary Agent decision, code rechecks the current authoritative target and candidate and dispatches the existing CANDIDATE_SELECTED. USER trace/causation identifies the original accepted message event. A USER_MESSAGE trajectory has no invented Agent action or modelAttempt. Code selection uses no model call or additional Agent decision slot. Agent SELECT_CANDIDATE remains valid; the same candidate/offer repeats as a successful no-op without another selection event.

Missing guests are asked first. Selection skips no current availability read and creates no BOOKING_PROPOSED, authorization or submission. A valid same-channel B1 then receives the unchanged optional G1 terms in that turn. Terms acquisition, same-page citations, budgets, cancellation, reuse and the 20-second reserve remain byte-identical. Open recommendations, a non-booking basis, explicit G1 questions and Book-on departures do not record user selection. The original Agent-internal-selection counterexample remains unchanged.

## Red and green evidence

A49e37c55 P1-0-8 and P2-0-10 files were copied byte-for-byte into C fixtures with original SHA provenance. Their complete response is returned unchanged at the model transport boundary; candidateIds, decisionSummary and other bytes are not rewritten. Original check/FAIL labels are not an oracle.

faeada24 kept main product bytes and produced four valid contract reds among nine tests. P1/P2 had the correct B1 link, no selectedCandidateId and empty terms. The fresh named path also lacked selection; duplicate Agent selection lacked USER provenance. Raw logs and all nine compositions are in red/, independently summarized by red-observations.json and preserved in 0fc82ceb.

The same nine assertions pass at 4413e4ff. P1/P2 still return PRESENT_RESULTS, now with one USER selection and two terms. P2 has no handoff before party completion or before current availability starts; its party-only reply creates no new TARGET, then fresh availability produces B1. The ordinary choosing turn uses two existing G1 questions; code selection adds zero model calls. Raw green outputs are preserved separately in green/.

## Legacy test contracts and narrow approvals

The first full default suite was 1335/1336. An old HTTP assertion required no selection for the explicit Book Fixture Sushi message with SPECIFIC_OUTLET/BOOKING_WORDING. The user approved changing only line1844 to fixture:outlet; d26af10a records it separately. That rerun then reached a second old expectation at line1883, after feedback/restarts, also requiring undefined. Its invariant should compare the post-feedback selection with the selection before feedback. Approval for only that comparison is pending. Other assertions and business inputs remain unchanged.

The first Chromium suite was 185/187. Both failures were the same mobile/desktop Workspace reference test: Check this one was expected to leave selection empty, but its model double supplied BOOKING_WORDING. The user approved only changing the refer branch basis to JUDGMENT in src/harness/workspace-fixture-server.ts. d5483bec changes that tag alone; goal/scope/query/reason/quotes and every browser assertion remain unchanged. The original six Chromium Workspace tests then pass 6/6. A src/eval and src/harness/browser files and B's three G3 files remain byte-identical.

First gate results, including failures, are preserved under first-gates-legacy-contracts/. The partial HTTP-contract rerun is under http-assertion-retest/; the Workspace green is under workspace-fixture-retest/. These historical results are not replaced by a later pass. Strict G2 separately passed 5/5 with all12 pages PASS, under strict-g2-retest/.

## Independent audit, versions and budget

The independent evaluate.py reconstructs nine actual compositions: message-to-selection causation, no fabricated Agent action, exact saved model responses, exact same-outlet source links and both quotations on the actual read page, no booking/authorization event, and no choice for the negative controls. It imports no production selection/identity/eligibility function. All nine currently pass. This is local mechanism evidence, not a new G6/Live signoff or a real-model semantic success rate.

State24 and TaskDefinition22, Agent/G1/Semantic Prompts and Schemas are unchanged. contracts.ts adds only an optional code-admitted marker to the existing SEMANTIC_PROPOSAL_COMPILED event; Task State, Reducer and migrations do not change. ADR0049 revision0.5 appends the user decision of 2026-11-02 CET; previous decisions are retained.

The shared ledger unions all main510 entries with A49e37c55's 58 additional entries, without common-ID conflicts, then appends one zero-call C record:569 entries. Cumulative model228 includes A's57 already-recorded calls; website GET255/290, Google12, Live0. C adds none. Both original ledger snapshots and the preservation audit are retained.

## Final gate and delivery status

After the last approved legacy expectation is synchronized, freeze the final inputs and finish five green gates plus strict G2 with clean status before/after each. Push only the work branch, verify ls-remote and notify A. Do not merge main. Final gate results and delivery SHA will be recorded here after completion.
