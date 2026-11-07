# First gate failures and bounded offline repair

Status: draft / not integrated. Source stop destination OTHER remains unchanged; no further website/model/Live.

First cd935f5a matrix: typecheck/arch PASS, default1452/1456 with4FAIL. Build/browser/G6/strictG2 NOT_RUN after failure. All original logs remain in gates/.

The actual production-composition LINK/SCRIPT saved-source tests failed after~21s. Query logging had evaluated a document handle while that document navigation was paused at the network boundary. Logging now reads only runtime-owned current-read input memory; it never evaluates page JS at admission. Authority is scoped to the current read on that Page and cleared by beginReadScope; normal navigation within that read does not create authority. Existing real Chromium old-read/prefix/unauthorized tests remain intact. This corrects the observational regression rather than loosening a source rule.

The retired ten-field permission unit port had no Frame. It receives no input authority, and the original permission rejection assertions are retained. The old recording diagnostic test also caught overbroad retention when the source URL itself was sensitive/unreviewed. Restore whole-page omission for those URLs; public partial SPA routes remain accepted only under the declared document fields and sensitive-value checks. No privacy assertion is removed or inverted. Current fresh-probe public routes remain eligible; no claim of a new source read under the repaired candidate.

Targeted original tests + new value tests14/14 PASS, including actual assembly LINK/SCRIPT, all fallback/foreign-name/radius controls, both homepage non-submission cases, old ten-field refusal and diagnostic byte/privacy invariants. No test-only skips, retries or new fixtures granted permission. Second full matrix will use a new source checkpoint and its own log directory. Raw log whitespace is preserved as audit evidence; source/doc diff checks exclude raw logs.
