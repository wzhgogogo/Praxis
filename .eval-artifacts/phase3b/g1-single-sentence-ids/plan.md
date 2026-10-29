# G1 single-sentence ID repair

2026-10-29, Vienna CET (UTC+1). Draft until green integration. Base main: `795d35d3660cb8d3bb3b0579f85d6d6bc42926ab`. User approves a separate G1 commit and main merge after all five gates; G3 stays on its own branch.

Observable promise: a fixture response using the original parent ID for a complete unsplit statement is answered, while partial quotations and split-paragraph parent IDs still fail closed. Choose to add sentence suffixes only to genuinely split lines; do not introduce an alias/compatibility lookup. Keep Prompt/Schema 3, Agent, State and TaskDefinition unchanged. Shared HARD segmentation and selection remain untouched.

Use a minimal synthetic already-bound page and fixture model, not private QA answers or paid reruns. Literal parent IDs are independent of the IDs emitted by production. Existing whole-sentence/identity/review/cancellation tests stay in place. Record the old complete HARD result before source modification and compare every byte afterward.

Freeze tests, source and outer scripts before red and green. Save output outside the repository, require clean git before/after, then archive receipts. Five gates plus ordinary G2; strict G3 acceptance remains separately unfinished. Real model/Google/site/Live/GET/environment calls 0. No .env or answers*.json access. Stop for two failed repairs, changed scope, protected-file conflict or an existing safety stop. Publish the approved main integration only after green; then return to G3 and preserve C's exact authorized input patch.
