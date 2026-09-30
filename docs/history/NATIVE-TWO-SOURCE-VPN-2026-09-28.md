# Two-source native mini-live after VPN change — 2026-09-28

- Status: diagnostic / not integrated; exposed next-day H001 variant, not Clean Baseline or full H001 acceptance.
- Latest user instruction supersedes the prior10808 preference: **use default browser networking**. Removed `PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER` from local `.env`, preserving other settings. Both run commands also set it empty; scripts reject a nonempty override and launch without Playwright proxy options. SystemVPN/TUN unchanged by the agent.
- Frozen request: September29,2026,19:00 Asia/Tokyo, two guests, omakase within1km of the previously resolved Shibuya locality. Google restaurant discovery/matching omitted; observed locality reused, not fabricated.
- Each source: one run,300seconds/50modelcalls/five details/three availability checks max. No automatic rerun, external booking, upstream semantic or production source edit.

## Tabelog

Total17,411ms; two model calls34,950tokens (fact24,847; browser10,103), both successful. Native Tokyo keyword search → observed Shibuya region → observed Shibuya subregion → two details all returned200. Sources discovered, not preselected names:

- Shinsen Kappou Sanoya:1,032m from the fixed locality; outside the strict1km limit, no availability attempt.
- Sushi Teppen:748m; original page lists Seasonal Delicacies and Omakase Nigiri Course. Existing fact judgmentPrompt12/schema4 returnedomakase support, citing three supplied original source observations; independent saved-text review confirms the course and criterion. No fakeHIGH cross-provider entity evidence supplied.

The existing shared browser executor then requested human help after its first action-model decision. It performed observation but no date/party action. Independent HTML/control review: September29 has no selectable date control and carries`p-booking-calendar__day-num--tel`; currently visible guest buttons are disabled, including selected2. Selectable date elements exist in later months, which explains why the existing ready-selector can pass while the requested month has no actionable date. They do not authorize shifting the date. No captured requested-date vacancy response, so inventory staysUNCONFIRMED. The model's broad explanation “no date/party controls” is less precise than the source evidence: controls exist, but no applicable enabled target-date/party action was observed. The`--tel`class suggests a telephone-related state but lacks an independently verified visible legend/accepted meaning in this observation; do not report confirmed no seats or initiate a call.

This is substantive native discovery → geographical qualification → cited HARD fact progress without Google restaurant matching, but not a bookable result or production integration acceptance.

## TableCheck

Total13,061ms,0modelcalls. The source search returned19venues. Under the frozen five-detail limit, the current discovery parser selected the firstfive in Best match order. All five details loaded; distances were4,864m,3,237m,4,732m,2,745m and1,995m. All failed the unchanged1km constraint, so no fact model or availability read ran. No TableCheck403/search-data failure appeared in this run's reached path.

Important experimental limitation: broad5km recall plus firstfive Best match truncation spends the sample on out-of-area candidates. The remaining14 were not inspected; this is not evidence of no suitable restaurants, no inventory, or native-first inability. Improve regional/distance candidate selection within the same detail budget before a future comparison; do not expand to all19 retrospectively or change the1km requirement to declare success.

## Independent verdict and next slice

Both source searches and reached detail pages were accessible under this user-selected environment. That is progress relative to previous blocked runs, not proof the VPN alone caused every earlier failure or guarantees future stability. Zero Google calls; two model calls total; no Offers or bookings. Runs are parallel and their17.411s/13.061s should be reported separately, not summed as wall-clock latency.

Native-first can advance to a narrow implementation/design review because candidate discovery and one geographically eligible, citedomakase venue were obtained without Google restaurant matching. Complete request-bound availability and production Router/Runtime/Evaluator integration remain open. Keep Google locality/nearby/group-location capability; do not delete it or silently change production route based on these diagnostics. Next concrete gaps are source-state-aware online-unavailable/handoff reporting and TableCheck regional candidate selection, rather than repeating unchanged whole Live runs.

Artifacts: `.eval-artifacts/tabelog-vpn-default-mini-2026-09-28/` and `.eval-artifacts/tablecheck-vpn-default-mini-2026-09-28/` contain independent start/result/source snapshots/model metadata and`evaluation.json`. Both scripts passed syntax checks; production source hashes unchanged. Existing536/536/code checks reused, no unrelated test expansion. Temporary sessions closed; no commit/push.
