# Screenshot feedback — focus outline and existing-state diagnosis

Source SHA: `59b1f26ce7b91bdd016044e46bb88aafee177eb3`.

## Implemented

Remove only the global blue textarea focus CSS rule. Composer focus shadow/caret, Adjust focus and draft preservation remain. Typecheck, architecture check and build pass. Actual local Chromium Fixture checks pass2/2 at390x844 and1440x900: pointer and keyboard focus have no outline, Adjust still focuses the input, and an existing draft is retained. Browser/server/PGlite teardown was awaited. See checks.json, focus-results.json and the four PNGs.

This is a targeted style follow-up, not a fresh full five-gate/16-scenario acceptance. The prior round-5 results remain tied to their original frozen SHA. No backend, condition qualification, refresh flow or revision-diff logic changed. No existing user preview restart was performed; a running process that does not reload the page module still needs its normal restart to load the new style.

## Screenshot2: Dec9 update versus failed refresh

Existing local Case restaurant:3897d6b73c1b942e1ef58f1d,07:45:00Z snapshot (15:45 Shanghai) has date2026-12-09, goalRECOMMENDATION and phasePRESENT_RESULTS with3 restaurants, including Sushi Ayatsuki Osaka Umeda-ten. Thus the changed-date recommendation completed by that snapshot; this is not proof of7-person inventory or booking.

The07:47:44Z snapshot has CANDIDATE_FACTS_REFRESH_REQUESTED followed by EXECUTION_FAILURE: `A browser read run is already active`; phaseFAILED and no presented result IDs. The UI retains the old Details card and still offers Refresh. A subsequent refresh hits `Refresh requires currently presented read-only results`. This is a stale/error-state presentation and read-run concurrency problem, not evidence that the date edit itself never completed. No new request was made to reproduce it.

## Screenshot3: availability versus beer condition

Existing Case restaurant:d851345f47bb12e554341400 is a fact-only recommendation for serves beer inShibuya. Mikkeller has no availability check and0 offers, explaining Not checked: it refers to inventory. The independent condition row met refers to the model's positive HARD-condition judgment.

However, the cited Google fact contains generic bar/liquor-store/restaurant categories, no explicit beer assertion or source quotation. The model judgment promotes serves beer from that record. These two UI labels are conceptually different, but this particular met is insufficiently grounded and must not be described as explicit confirmation. This does not claim the venue does not serve beer; it diagnoses the evidence used by the system.

## Screenshot4: revision comparison

0 places no longer match /3 new means0 removed and3 added compared with the preceding requirement revision, not0 total results. Here the first revision lacked a location and asked for clarification, so it had no presented batch. AddingShibuya produces the first3 results, yet the projection compares them against the empty earlier group and displays a confusing diff. Empty-prior comparisons and zero-count prose should be suppressed/reworded; this is diagnosis only, not an implemented change in this follow-up.

## Boundaries and source integrity

existing-artifact-diagnosis.json records exact local input paths, SHA256 and narrowed snapshot fields. Original user Live outputs were read-only and were neither rewritten nor cleared. No new Live, paid model, Google/real-website request, PostgreSQL query, main merge or push. Other three screenshot findings remain unfixed. No private Holdout or scoring changes.
