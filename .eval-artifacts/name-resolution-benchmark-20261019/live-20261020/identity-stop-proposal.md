# Eval-only identity stop correction (proposed, not active)

The existing methodA assumes throwing from BrowserTaskExecutor.onDiagnostic cancels execution. Executor.record explicitly catches diagnostics exceptions. The old helper can therefore record identityStop=true while actually selecting party/date controls.

Independent local regression boundary-red.mjs supplies a source page with HIGH identity and live-style date/party selectors. Under the current frozen code it records2 underlying SELECT calls and fails the identity-only assertion. boundary-red.log is the effective red. The earlier missing-availability-label probe and temporary import failure are separately retained debugging evidence.

identity-stop.proposed.patch modifies only src/eval/restaurant/agent-loop/name-resolution-method-a.ts: after the diagnostic sets identityStop, the eval-owned BrowserSession proxy refuses every further runtime method except close. The existing production Adapter and Executor are unchanged. A temporary copy outside src passes the same assertion:0 underlying SELECT calls, HIGH identity retained; diagnostic OPERATION_STARTED/FAILED is a boundary rejection, not an executed SELECT.

Gold verification continues with2260cc8 and its unchanged321 SHA inputs. The proposed module is not imported by it and no active frozen source has been edited. MethodA has not started. Request approval before applying the eval patch between Gold and methodA, run the relevant tests/gates, and issue a new methodA freeze. Preserve all Gold reads and the five completed selection replays; do not repeat them.
