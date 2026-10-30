# B1 wiring rebase after G3 main publication

- Date: 2026-10-30 Vienna CET (UTC+1).
- Evidence status: draft / not integrated; C branch only, no main merge authorization.
- Main base: 7c83e02ee78ccb18c9ddf6670a64823bb18a2c95, verified after B's publication notice.
- Previous remote C delivery: 20ff1466bf191e1ff5dff5b99128eb82c79aca11; keep its original artifacts unchanged.

User-authorized slice: rebase C's existing B1 wiring onto G3-integrated main, preserve main's frontend slice/ADR-0050, freeze the combined inputs, rerun five gates and strict G2, push only C for review. No source/API/model/Google/Live/real-Postgres calls and no.env. No new product behavior or version change is requested.

Eight C commits replayed onto main. There were only documentation conflicts; both histories were retained and revision metadata resolved. Source wiring needed no conflict resolution. B's protected three files, A eval/harness and frontend files must remain byte-identical to the new main. The cache, root-Task scope getter and read-assembly wiring remain byte-identical to the previous C delivery. Main's structured two-line hint fields and source/context checks are retained.

The old Chromium observer targets the previous UI. A separate observer in this evidence directory follows current visible My plans → Choose this → handoff, using the generated production HTTP projection and the unchanged main frontend. It validates both real href attributes and carried-field text, with no source navigation or Task selection mutation. The UI observer is C-owned evidence; no A/harness/frontend edit. Old UI output is historical, not a current pass.

New main's font packages were absent in this checkout, so npm ci --offline --ignore-scripts --no-audit --no-fund restored only local dependencies from the host npm cache; no network or lifecycle script. Freeze the two font files used by the observer alongside package-lock and source inputs.

Run integrity → typecheck → arch:check → npm test → build → browser fixture → strict G2 → current-UI observer → integrity. Each step requires empty git status before/after; outputs use exclusive new directories, no restoration/overwrite of committed evidence. Stop/report any protected-file requirement, persistent gate failure, S0 or real-call requirement. Complete by documenting actual results, force-with-lease push of only C's rebased branch against the known old remote SHA, ls-remote verification, then stop for review.
