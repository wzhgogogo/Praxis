# cd7b4ae51 — offline archive orchestration failure, not final signoff

All5codegates pass (default1981, G2 5, Chromium593, G6 159), distC1 4 and independent22 pass. Assets comparison exit0, but cleanAfter=false: copied verification script hardcoded previousbatch build-assets.json. Only that old artifact SHA field changed; assetvalues identical. Scheduler immediately stopped; graph/protection NOT_RUN. Preserve every raw output and misplacedartifact. Prior file restored byte-for-byte from frozen Git blob, baselineSHA256 verified; receipt and exactdiff retained. No source/input changed during this run. All test processes naturally finished.

Fix only newbatch assetoutput to import.meta.url sibling, freeze again (same src tree), and rerun all acceptance on clean newSHA. This run is not final acceptance, and historical file is not falsely claimed neverwritten. All other historical inputs remain protected.
