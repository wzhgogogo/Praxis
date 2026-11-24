# Independent review P1 continuation

On5969f8a59, 后天我没空，改成11月28日晚上七点 still queried11/26 despite correct modeled11/28, and 后天还是11月28日我还没定，晚上七点 queried11/26 with omittedDATE instead of NEEDS_INPUT/0calls. Original6-row probe source: /private/tmp/praxis-round27-review.HNjA55/date-probe-coverage.mjs. Source SHA256 is recorded in failures/5969f8a59-incomplete-selection-boundary/coverage-red.json; archived raw probe bytes are unchanged.

The current slice remains one date-selection P1. No UI/backend-loop/scoring/prompt/config edits. Require selected-calendar priority and explicit uncertainty/competition guard, original relative correction/omission/time-only controls, new real-message regressions and all6 independent P1 probe rows. Only offline loopback/PGlite. Preserve previous raw logs and originalRound27 evidence.


Same-P1 weekday continuation: preserve correct weekday DATE for 后天我没空，改成周六晚上七点; 后天还是周六 and 周六还是后天 must clarify with0availability even if modelDATE is absent. Centralize the choice relation check over original-text date mentions, existing Chinese/English weekdays, and both orderings. Current independent weekday probe source is /private/tmp/praxis-round27-review.HNjA55/date-probe-weekday.mjs,5rows; its exact frozen bytes are reviewer-weekday-probe.mjs. No new round, language interpretation, UI edits or external scope.
