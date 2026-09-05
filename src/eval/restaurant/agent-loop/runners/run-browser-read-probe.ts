import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { browserRuntimeFromEnvironment } from "../../../../infrastructure/browser/browser-runtime-factory.js";
import { diagnosticFailureCode, diagnosticUrl, startDiagnosticRun } from "../../../shared/diagnostic-run.js";
import { probeProvider, runBrowserReadProbe, type BrowserReadProbeInput } from "../browser-read-probe.js";

if (process.env.PRAXIS_ALLOW_LIVE_RESTAURANT_READ !== "1" || process.env.PRAXIS_ALLOW_BROWSER_RUN !== "1") {
  throw new Error("Enable PRAXIS_ALLOW_LIVE_RESTAURANT_READ and PRAXIS_ALLOW_BROWSER_RUN for an authorized read-only probe");
}
const { values } = parseArgs({ options: {
  url: { type: "string" }, "ready-selector": { type: "string" }, "timeout-ms": { type: "string", default: "20000" },
  "outlet-name": { type: "string" }, address: { type: "string" }, phone: { type: "string" },
  date: { type: "string" }, "party-size": { type: "string" },
  "network-path": { type: "string", default: "UNKNOWN" },
} });
if (!values.url) throw new Error("--url is required");
const provider = probeProvider(values.url);
if (!["DIRECT", "PROXY", "UNKNOWN"].includes(values["network-path"])) throw new Error("--network-path must be DIRECT, PROXY or UNKNOWN (operator-reported only)");
const timeoutMs = Number(values["timeout-ms"]);
if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new Error("--timeout-ms must be 1–60000");
const hasSchedule = values.date !== undefined || values["party-size"] !== undefined;
const partySize = Number(values["party-size"]);
if (hasSchedule && (!values.date || !/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !Number.isInteger(partySize) || partySize < 1 || partySize > 100)) {
  throw new Error("Provide --date YYYY-MM-DD and --party-size 1–100 together");
}
const input: BrowserReadProbeInput = {
  url: values.url,
  timeoutMs,
  ...(values["ready-selector"] ? { readySelector: values["ready-selector"] } : {}),
  ...(values.date ? { schedule: { date: values.date, partySize } } : {}),
  ...(values["outlet-name"] ? { expectedCandidate: {
    restaurant: {
      id: "operator-probe", outletName: values["outlet-name"], address: values.address ?? "",
      sourceIds: values.phone ? { phone: values.phone } : {}, provenance: { input: "OPERATOR_SUPPLIED" },
    }, matchReasons: [], warnings: [], executionConfidence: "LOW" as const,
  } } : {}),
};
const journal = await startDiagnosticRun(resolve(".eval-artifacts", "restaurant-browser-probe"), {
  mode: "LIVE_READ_ONLY_BROWSER_PROBE", provider, requestedUrl: diagnosticUrl(input.url),
  inputSource: "OPERATOR_SUPPLIED_NOT_DISCOVERY", timeoutMs,
  network: { path: values["network-path"], evidence: "OPERATOR_REPORTED_NOT_VERIFIED" },
  browserSelection: process.env.PRAXIS_BROWSER_ENGINE ?? "AUTO",
  profileMode: process.env.PRAXIS_BROWSER_ENGINE === "LOCAL_CHROMIUM"
    ? process.env.PRAXIS_LOCAL_CHROMIUM_INTERACTIVE === "1" && process.env.PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION === "1" ? "PERSISTENT_EVAL" : "TEMPORARY"
    : "REMOTE_SESSION",
  safety: { allowedOperations: ["NAVIGATE", "SNAPSHOT", "WAIT_FOR"], externalSideEffectCount: "NOT_MEASURED" },
});
try {
  const result = await runBrowserReadProbe(browserRuntimeFromEnvironment(), input);
  await journal.finish({ status: result.pageState === "CONTENT_OBSERVED" ? "SUCCEEDED" : "FAILED", stage: "PAGE_OBSERVATION", result });
  console.log(JSON.stringify({ artifactPath: journal.resultPath, result }));
  if (result.pageState !== "CONTENT_OBSERVED") process.exitCode = 1;
} catch (error) {
  await journal.finish({ status: "FAILED", stage: "PAGE_OBSERVATION", failureCode: diagnosticFailureCode(error) });
  console.error(JSON.stringify({ artifactPath: journal.resultPath, failureCode: diagnosticFailureCode(error) }));
  process.exitCode = 1;
}
