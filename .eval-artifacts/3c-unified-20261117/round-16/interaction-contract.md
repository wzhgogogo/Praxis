# Round 16 interaction contract

Draft / not integrated. Baseline 2248c1d1e8d393163df836fd2e6092c68269e268. Retains the Round 15 layout, English copy, keyboard/touch actions and source-bound read/booking rules.

Stop belongs to the initiating request, not just its task ID. Preparation registers its own cancellable handle before semantic interpretation. Only that exact handle may cross into execution. Cancellation retries a bounded number of competing writes after proving the same run, investigation revision and absence of a newer user read-start event. A replaced read rejects late Stop; a cancelled preparation performs no source work. Pending About questions complete as UNVERIFIED / CANCELLED without terminating PRESENT_RESULTS.

Explicit time selection belongs to one tab, user, plan, requirement revision and restaurant. sessionStorage holds dateTime and partySize independently of navigation. Current inventory derives offerId. A disappeared selection locks handoff until explicit reselection; refresh failure/retry, reload, Back and incoming SSE cannot erase that intent. A new offer for the same time rebinds automatically. Deliberate card/Saved navigation clears only this tab's previous choice. Other tabs' choices or navigation never alter it. The Round 15 localStorage storage-event selection synchronization is retired.

Navigation remains per tab; drafts and B1 claimed feedback remain per Case in this page session. Optional conditions still submit through messages, displayed-place questions through questions. Saved is not booking selection; exhausted batches stay empty. Google photos remain demand-loaded. Handoff requires fresh server-projected B1 and explicit departure; feedback remains USER_REPORTED only. Historical Mikkeller snapshots remain unmodified.

Acceptance: five new reported counterexamples plus existing controls; strict browser TypeScript with no any or suppressions; a static import DAG; five clean frozen offline gates, formal 16, Style 1 six and state regressions. Offline Fixture evidence makes no Live, real PostgreSQL, real model/source quality or device claim.
