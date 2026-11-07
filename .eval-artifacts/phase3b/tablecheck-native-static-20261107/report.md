# TableCheck reviewed static transport

Status: draft / not integrated. Current slice: user-approved static transport only. No source read has run in this slice yet. Gate/source findings will be appended after the frozen run.

Planning/Test/Eval/Post-change apply. STATUS/DEVLOG/TEST-LOG publication remains deferred to the separately approved main integration, per the earlier user instruction.

Approval provenance: previous GET463→464 was the human message “新额度批准。可以直接重跑” in this chat (2026-11-07; exact message timestamp unavailable). Its run was2026-11-07 13:36:22.089 CET. Current GET464→465 comes from the user’s dated static-resource handoff; exact message timestamp unavailable. Neither time is inferred from a run timestamp.

Local evidence: static-red.log records the intended default-transport assertion failing under the old Node default. static-full-green.log retains a later fixture defect (font not requested without visible text); visible text correction retains the font/body assertions. static-green-final.log passes8 targeted tests. The first full gate at3c7c8e1e retains default1483 PASS and Chromium240/242: two canonical-origin fixtures injected bodies only at route.fetch. No assertion was removed. They now explicitly select NODE_FETCH as their source-response control; separate native-static receiver tests exercise the production default, body parity, authority-bearing static URLs and redirects. seams-green.log passes6, including the admitted redirect final body. The D8 frozen fixture keeps its loopback dead proxy. No source read ran during these failures.
