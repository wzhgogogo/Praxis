# Stop2 review fixes — 2026-10-25

Status: draft / not integrated; exposed synthetic regression. Report timezone is
CET UTC+01:00 as explicitly instructed by the user. No real model, Google,
restaurant website, Live or environment rerun calls. Git transport is separate.

1. On f2c, freeze two real Chromium processes and20 same-origin CSS/JS resources.
   Obtain valid old-path red, exempt static resource leases while retaining all
   source request counts and existing output shape. Pace admitted documents,
   dynamic reads/preflights and Google API only. Recompute estimate with explicit
   eligible/static assumptions. Five gates clean, report and merge/push main.
2. Reapply f2d-only work onto that reviewed new main, preserve old commit evidence.
   Add eval-owned Google Places capture at the Runner transport boundary, exact
   request body/JSON response into the same HAR. Drop API key headers/key query;
   scan before and after serialization, reject unsafe writes with safe reasons.
   Retire fixture-only HAR append. Capture-disabled red must stop at the first
   missing structured response; captured fixture must replay completely under
   blocked network. Five gates clean, report and merge/push main. Stop.

Products, shared Browser/restaurant-search non-test files, Prompt, Schema and
Guard rules remain unchanged. Tests use minimal synthetic sources; no new private
holdout reads. Existing evaluation and independent S0 rules are reused. The user's
self-contained review governs; do not invent the project-only review file.
