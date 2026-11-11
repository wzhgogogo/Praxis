# B1 G3 wiring preflight: protected output dependency

- Evidence status: draft / not integrated; no product wiring implemented.
- Date: 2026-10-30 Vienna CET (UTC+1).
- Branch: codex/feat-phase3b-b1-g3-wiring.
- G3 base: 8c66921aa09f4c020732e3bea3d3241383e25689, matching B's local HEAD and fetched origin branch.
- Current main: 404a766e300668230d23c75ee7486bb3dc7a1d43.

Requested slice: ordinary startup consumes only G3-admitted original form_course links; existing B1 creation/display validation remains authoritative. No new source parser, URL construction, protected B/A/frontend edits or real calls.

Preflight found a stopping dependency: inspectTabelogVacancyResponse validates each row URL but its OBSERVED result contains only status, availableSlots and hasExplicitSlotUi. The original link and response provenance are discarded. The browser provider also forwards visibleSlots rather than links. The approved ADR-0049 requires that exact source URL, which cannot be recovered from those outputs without reconstructing or independently parsing it.

Honor the user's stop condition before product edits. Freeze a constructed, network-free source snapshot and a probe importing the unchanged real G3 parser. A valid response must first be OBSERVED; then assert that the output contains its exact original URL. Different source query ordering demonstrates that identical slot outputs cannot reconstruct the original bytes. This is an interface-contract red, not an ordinary-startup/button red and not a green implementation.

Preserve the red result and requested minimal B-owned output dependency in report.md; verify all src/scripts/package/site-skill bytes remain equal to the G3 base. No model, website, Google, Live, database or .env access. Push this preparation branch and stop. Ordinary-startup/button positives and negatives, later rebase to G3-integrated main, five gates and strict G2 remain NOT_RUN until the dependency is resolved. Do not change B's parser or duplicate it elsewhere.
