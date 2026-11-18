# Second frozen gate failure

Frozen SHA:39a26bb9d32e13e7e03ff5c5fdc413e0abd3fe0a.
Typecheck/arch/default1750 pass. G2 5/5, remaining Chromium413/415 (combined418/420), two sizes of slice2 first test fail at the newly changed static added-only summary assertion. G6/build/formal visuals NOT_RUN.

A native summary does not have HTML disabled semantics, so Playwright isEnabled is not the contract oracle. The corrected regression checks aria-disabled=true, tabindex=-1 and actual programmatic click leaves the details closed, in addition to hidden zero removal/empty list and visible3 new. Product code and existing pre-Round6 assertions are unchanged. Original logs, exit codes, elapsed times and immutable frozen Git source SHA retained; a fresh freeze reruns the complete five gates.
