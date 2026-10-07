import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { browserRuntimeFromEnvironment } from "../../../../infrastructure/browser/browser-runtime-factory.js";
import { tabelogQueryControlHints, TABELOG_QUERY_SETTLED_SELECTOR, TABELOG_VACANCY_RESPONSES } from "../../../../integrations/tabelog/tabelog-query-controls.js";
import { diagnosticFailureCode, diagnosticUrl, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { probeProvider, runBrowserReadProbe, type BrowserReadProbeInput } from "../browser-read-probe.js";
import { safeObservedControls, safeRecord, snapshotRecord } from "./browser-case-slice-evidence.js";
import { environmentWithEffectiveLiveNetwork, resolveEffectiveLiveNetworkConfiguration, runLivePreflight } from "../live-preflight.js";

if (process.env.PRAXIS_ALLOW_LIVE_RESTAURANT_READ !== "1" || process.env.PRAXIS_ALLOW_BROWSER_RUN !== "1") {
  throw new Error("Enable PRAXIS_ALLOW_LIVE_RESTAURANT_READ and PRAXIS_ALLOW_BROWSER_RUN for an authorized read-only probe");
}
const { values } = parseArgs({ options: {
  url: { type: "string" }, "ready-selector": { type: "string" }, "timeout-ms": { type: "string", default: "20000" },
  "outlet-name": { type: "string" }, address: { type: "string" }, phone: { type: "string" },
  date: { type: "string" }, "party-size": { type: "string" },
  "network-path": { type: "string", default: "UNKNOWN" },
  "capture-query-state": { type: "boolean", default: false },
  "no-proxy": { type: "boolean", default: false },
} });
if (!values.url) throw new Error("--url is required");
const provider = probeProvider(values.url);
if (values["capture-query-state"] && provider !== "TABELOG") throw new Error("--capture-query-state currently applies only to Tabelog");
const effectiveNetwork = resolveEffectiveLiveNetworkConfiguration(process.env);
const effectiveEnvironment = environmentWithEffectiveLiveNetwork(process.env, effectiveNetwork);
if (values["capture-query-state"] && (effectiveEnvironment.PRAXIS_BROWSER_ENGINE !== "LOCAL_CHROMIUM" || effectiveEnvironment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER)) {
  throw new Error("Tabelog query-state capture requires LOCAL_CHROMIUM on the default browser network");
}
if (!["DIRECT", "PROXY", "UNKNOWN"].includes(values["network-path"])) throw new Error("--network-path must be DIRECT, PROXY or UNKNOWN (operator-reported only)");
const timeoutMs = Number(values["timeout-ms"]);
if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new Error("--timeout-ms must be 1–60000");
if (values["capture-query-state"] && timeoutMs > 30_000) throw new Error("Tabelog query-state capture is limited to 30000ms");
const hasSchedule = values.date !== undefined || values["party-size"] !== undefined;
const partySize = Number(values["party-size"]);
if (hasSchedule && (!values.date || !/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !Number.isInteger(partySize) || partySize < 1 || partySize > 100)) {
  throw new Error("Provide --date YYYY-MM-DD and --party-size 1–100 together");
}
const queryTrace: Array<Record<string, unknown>> = [];
const preflight = await runLivePreflight({
  runner: "BROWSER_READ_PROBE",
  targets: [provider],
  network: effectiveNetwork,
  timeoutMs: Math.min(timeoutMs, 10_000),
});
const input: BrowserReadProbeInput = {
  url: values.url,
  timeoutMs,
  ...(values["ready-selector"] || values["capture-query-state"] ? { readySelector: values["ready-selector"] ?? TABELOG_QUERY_SETTLED_SELECTOR } : {}),
  ...(values.date ? { schedule: { date: values.date, partySize } } : {}),
  ...(values["outlet-name"] ? { expectedCandidate: {
    restaurant: {
      id: "operator-probe", outletName: values["outlet-name"], address: values.address ?? "",
      sourceIds: values.phone ? { phone: values.phone } : {}, provenance: { input: "OPERATOR_SUPPLIED" },
    }, matchReasons: [], warnings: [], executionConfidence: "LOW" as const,
  } } : {}),
  ...(values["capture-query-state"] ? { queryObservation: {
    hints: tabelogQueryControlHints, responses: TABELOG_VACANCY_RESPONSES,
    record(snapshot, controls) {
      queryTrace.push({ sequence: queryTrace.length + 1, snapshot: safeRecord(snapshotRecord(snapshot)), totalObservedControls: controls.length,
        controls: safeObservedControls(controls) });
    },
  } } : {}),
};
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "restaurant-browser-probe"), {
  mode: "LIVE_READ_ONLY_BROWSER_PROBE", provider, requestedUrl: diagnosticUrl(input.url),
  inputSource: "OPERATOR_SUPPLIED_NOT_DISCOVERY", timeoutMs,
  network: { path: values["network-path"], evidence: "OPERATOR_REPORTED_NOT_VERIFIED" },
  browserSelection: effectiveEnvironment.PRAXIS_BROWSER_ENGINE ?? "AUTO",
  preflight: { artifactPath: preflight.artifactPath, elapsedMs: preflight.elapsedMs },
  profileMode: effectiveEnvironment.PRAXIS_BROWSER_ENGINE === "LOCAL_CHROMIUM"
    ? effectiveEnvironment.PRAXIS_LOCAL_CHROMIUM_INTERACTIVE === "1" && effectiveEnvironment.PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION === "1" ? "PERSISTENT_EVAL" : "TEMPORARY"
    : "REMOTE_SESSION",
  safety: { allowedOperations: ["NAVIGATE", "SNAPSHOT", "WAIT_FOR"], externalSideEffectCount: "NOT_MEASURED" },
  ...(values["capture-query-state"] ? { queryCapture: "SANITIZED_BOOKING_REGION_AND_PASSIVE_VACANCY_RESPONSE" } : {}),
});
try {
  const result = await runBrowserReadProbe(browserRuntimeFromEnvironment(effectiveEnvironment), input);
  await journal.finish({ status: result.pageState === "CONTENT_OBSERVED" ? "SUCCEEDED" : "FAILED", stage: "PAGE_OBSERVATION", result, queryTrace });
  console.log(JSON.stringify({ artifactPath: journal.resultPath, result }));
  if (result.pageState !== "CONTENT_OBSERVED") process.exitCode = 1;
} catch (error) {
  await journal.finish({ status: "FAILED", stage: "PAGE_OBSERVATION", failureCode: diagnosticFailureCode(error), queryTrace });
  console.error(JSON.stringify({ artifactPath: journal.resultPath, failureCode: diagnosticFailureCode(error) }));
  process.exitCode = 1;
}
