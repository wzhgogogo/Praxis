# Round 17 interaction contract

Draft / not integrated. Baseline 138d35d3b8b915e3279220036066b96d7acf292c. Retains the Round 15 layout, English copy, keyboard/touch actions and source-bound read/booking rules.

Stop belongs to the initiating request, not just its task ID. Preparation registers its own cancellable handle before semantic interpretation. Only that exact handle may cross into execution. Cancellation retries a bounded number of competing writes after proving the same run, investigation revision and absence of a newer user read-start event. A replaced read rejects late Stop; a cancelled preparation performs no source work. Pending About questions complete as UNVERIFIED / CANCELLED without terminating PRESENT_RESULTS.

Explicit time selection belongs to one tab, user, plan, requirement revision and restaurant. sessionStorage holds dateTime and partySize independently of navigation. Current inventory derives offerId. A disappeared selection locks handoff until explicit reselection; refresh failure/retry, reload, Back and incoming SSE cannot erase that intent. A new offer for the same time rebinds automatically. Deliberate card/Saved navigation clears only this tab's previous choice. Other tabs' choices or navigation never alter it. The Round 15 localStorage storage-event selection synchronization is retired.

Navigation remains per tab; drafts and B1 claimed feedback remain per Case in this page session. Optional conditions still submit through messages, displayed-place questions through questions. Saved is not booking selection; exhausted batches stay empty. Google photos remain demand-loaded. Handoff requires fresh server-projected B1 and explicit departure; feedback remains USER_REPORTED only. Historical Mikkeller snapshots remain unmodified.

Acceptance: three new reported issues plus existing controls; strict browser TypeScript with no any or suppressions; a static import DAG; five clean frozen offline gates, formal 16, Style 1 six and state regressions. Offline Fixture evidence makes no Live, real PostgreSQL, real model/source quality or device claim.

## Browser module layering

entry alone assembles callbacks and registers events. actions and view-contracts define data-only contracts. runtime owns strictly typed page-session state and typed DOM access. slot-selection stays pure; selected-slot projects tab-local intent over current inventory. queries, format, position and composer supply lower-level helpers. photos and session use injected API callbacks. preview uses injected render/sidebar callbacks. navigation and transport cannot import each other or views; they invoke entry-wired callbacks. views reads these lower-level modules and invokes injected edit/navigation actions. Static imports, including type edges, must form a DAG.


## Round 17 revision and preparation boundaries

Only explicit slot selection is tab-local. Plan conditions and requirementRevision are server-authoritative and shared. A newer revision cancels pending preparation, clears the old slot projection, exits an open Handoff to Candidates and reports that the time needs confirmation. Position records carry revision too, so restoring/reloading an old Handoff cannot auto-select the new revision's first offer. A same-revision choice made in B still leaves A's own Handoff unchanged. No shared localStorage selection listener is restored.

A preparation-owned Stop accepts the exact current handle, an observed version between its start and the current persisted snapshot, and either its handle read ID or the just-persisted current read ID. Cancellation retries repeat that identity check. An aborted semantic dispatch stops before appendMessage or source work. A nonaborted request that loses preparation ownership throws StaleTaskVersionError unless its own event is already persisted (idempotent); the UI must retain its draft, reconcile the latest state and visibly report 409. Old Stop/new-read conflict protection stays unchanged.

Acceptance uses first/edit semantic dispatch latches, actual desktop and mobile two-tab HTTP/SSE/Chromium journeys, SQL departure identity before/after explicit reconfirmation, all retained controls and the same strict DAG/five-gate/visual requirements. No Live/real PostgreSQL/4312.

A handle that moves from preparation into activeReads during Stop's identity re-read remains cancellable only when it is the exact same object and still matches the observed read identity/version. Stop then awaits that active read’s cancellation instead of mistaking the ownership handoff for a replacement request.
