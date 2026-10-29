# Group08 public selected state: implementation green, A baseline pending

2026-10-29T08:40:20.100639+01:00, Vienna CET. Status **IMPLEMENTED_VALIDATION_PENDING_A_SEN_BASELINE**. The user explicitly authorizes continuing G3c without waiting for A. This is not a claim of five green gates or strict G2 acceptance.

## Changes

Private selected/current/active/checked classes and the unused selectedClass hint path are removed. Browser observation uses ARIA or live native checked state; visible native values are serialized from the real DOM without cloning nodes. Group labels come from visible text/standard labels, not label/title classes. Calendar selected-state observation no longer requires a p child.

Tabelog query confirmation uses public native labels/values, ARIA plus public calendar captions, or the latest exactly bound source response. Public date/party contradictions reject a matching earlier response; selected controls alone never establish inventory. Missing evidence remains unconfirmed. Same-outlet, latest reply, date/party/time binding, invalid-row/clock behaviour and SOURCE_STRUCTURE_CHANGED stay in place. `tabelog-vacancy-response.ts` and its C-facing output format are byte-identical; no State/TaskDefinition/Prompt/Schema version change.

## Red and green

Primary old-product red commit `41cec356`: shared/native controls fail their target assertions, and actual Chromium reports the class-only selected observation directly. The initial red used an assertion inside the fixture model and is retained as diagnostic history, not the primary browser oracle; its assertion was moved outside model error handling before the primary red.

New targeted controls pass on `32a9d16c`: public native/ARIA confirmation, class-only unknown, response-only success, wrong date/party rejection and actual Chromium public group/native/ARIA/calendar observations. Full corresponding regressions and typecheck pass at `12f5dd0d`; receipts in related/. Native wrapped-label handling was repaired using the actual fallback composition failure, without changing its actions or offer assertions.

## Corresponding test changes

- Existing Matsumoto and synthetic Tabelog positive pages receive public ARIA selection and update it on their existing click handlers; all action/loop/date/party/stock assertions remain.
- Generic state test now asserts 8 class-only examples remain unknown, while 4 ARIA states and independent same-label groups remain positive. Native checked and nested calendar state have an actual Chromium control.
- Contradictory hidden-party/private data-field controls become contradictory public native/visible controls; missing ARIA without a response stays unconfirmed. Latest wrong-outlet/date/party/time responses are still rejected.
- C2a retains requested-disabled/other-day action rejection. Without public party selection, its final reason no longer pretends a combined date/party confirmation.
- Sen's product regression stays UNKNOWN, now first blocked at REQUEST_SELECTION_UNCONFIRMED rather than generic extraction.
- 19 archived rows have zero positive ARIA states, no native date input or select, and no matching retained response. The old 17 class-derived confirmations remain archived as an index, not current public evidence. Their current tests require unconfirmed query and no inventory. Original HTML, snapshots and historical oracle unchanged; see archived-query-public-evidence.json.
- C protected test blocks and code stay unchanged except the already approved single response input. See preservation.json.

## Full verification so far

Frozen candidate `12f5dd0d23c4b5be4450d9a8ff7af7703c058af7`, 696 paths, freeze SHA `b9f3e56c7ed277af0ab8f88c82e670e9bbdf657113f707bf137c04822e209a0d`. Typecheck, architecture, default tests **1216/1216**, build pass. Full Chromium **178/179**, 117.548 seconds. Every before/after clean, no skips/restorations. The sole failure is frozen Sen requestConfirmed=true: original and renamed pages now both correctly lack public confirmation. A owns the approved change to UNKNOWN; main was still b2a3cbd3 at the remote check. Raw failed gate retained; no test/expectation was bypassed.

All other browser assertions passed, including public-selection and the existing source/identity/Guard controls. This dependency is not repaired by reintroducing private state. Sync A's main when available, rerun five gates and strict G2; do not report this pending gate as green. Continue G3c under the user's explicit non-wait instruction.

Ledger adds one zero-call row, preserving all prior rows. Real model/Google/site/Live/GET/environment calls 0; no .env or private QA answers read. HARD byte comparison is still required at final validation; no HARD fact implementation changed in this group.
