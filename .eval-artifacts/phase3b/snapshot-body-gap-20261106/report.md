# Snapshot body-gap repair

Status: draft / not integrated. 2026-11-06 CET UTC+1. Scope: offline repair only, no Live or model/Google/website calls, no credential loading.

D4 Search document returned200, then the snapshot serializer called read(document.body) during a document transition. Recording errors290/2498/3048 preserve the null nodeType exception. Current regression uses the saved D4 source document and real Chromium with controlled body removal between snapshot stages. HAR transport is generated from that genuine saved DOM, with misses aborted and a closed localhost proxy; this is a component timing test, not a complete historical network/decision replay or proof that D4 delivers.

Red log reproduces the exact TypeError on the unfixed implementation. The fix resolves body through the native Playwright locator for the evaluation rather than reading a potentially null document.body. The existing5000ms interactive operation limit is applied; Guard, navigation/provider/candidate/total budgets, source identity and prompt/state versions are unchanged. No empty success or synthetic body is returned.

Green9/9: real transient gap recovers to the original visible HTML/text; permanent missing body times out; after restoring the real body the same session works. Existing runtime profile, network failure, response capture and public-form controls pass. One test fake gains the native Locator.evaluate contract; no assertion removed.

This does not resolve the other D4 page/navigation/provider timeouts. D4 still lacks identity+availability/delivery/G1 validation; D8 has not started; main is not merged. Shared STATUS/history updates wait for main merge under Nov5 rules. Full verification is recorded separately in final-gates.
