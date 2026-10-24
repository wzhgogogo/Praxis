# F2④b slice

Status: frozen regression / draft not integrated; synthetic fixture, no Live.
Replay only per-page qualified documents and HAR; ignore diagnostic DOM. Keep
production Chromium/Guard and Runtime pipeline. Missing response, decision
sequence or rejected page stops at first unavailable input, REPLAY_INCOMPLETE;
exclude unexecuted remainder, label REPLAY and exclude Live denominator.
Original decisions are replayed as outputs through the same model gateway;
real-model mode is implemented by injection and tested with fixture transport only.

Existing browser-only recordings may lack structured Google responses. Never
reconstruct them from projected state or decisions. Missing raw responses stop.
The complete synthetic fixture additionally retains its actual synthetic Google
transport response in the fixture HAR; no new production recording/sanitizer or
Schema/Guard change. Real F5 recording replay remains deferred as instructed.

Valid red: remove one CSS HAR response and allow fallback; local source receives
an unrecorded request, assertion catches it. Green: strict HAR abort plus missing
request diagnostic and cancellation. Complete control uses original recorded
nonempty candidate/delivery through real Chromium and the formal Runner. A child
with OS-denied network outbound proves no fallback; partial and missing controls
never score remaining stages. Freeze inputs and orchestration before running.
