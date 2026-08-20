import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { CloudflareBrowserRun } from "../../../../infrastructure/browser/cloudflare-browser-run.js";
import {
  detectExternalReservationRedirect,
  hasBotChallenge,
  hasReservationControls,
  parseVisibleTimeSlots,
} from "../../../../integrations/tabelog/tabelog-page-parser.js";

if (process.env.PRAXIS_ALLOW_LIVE_RESTAURANT_READ !== "1" || process.env.PRAXIS_ALLOW_BROWSER_RUN !== "1") {
  throw new Error("Set PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 and PRAXIS_ALLOW_BROWSER_RUN=1 before the browser compatibility probe");
}
const urls = (process.env.PRAXIS_TABELOG_PROBE_URLS ?? "").split(",").map((url) => url.trim()).filter(Boolean);
if (urls.length < 3 || urls.length > 5) {
  throw new Error("Set PRAXIS_TABELOG_PROBE_URLS to three to five comma-separated public Tabelog restaurant or reservation URLs");
}
const runtime = CloudflareBrowserRun.fromEnvironment();
const results = [] as Array<Record<string, unknown>>;
for (const engineMode of ["KITESURF_ONLY", "CHROMIUM_ONLY"] as const) {
  for (const url of urls) {
    const startedAt = Date.now();
    let session: Awaited<ReturnType<typeof runtime.openSession>> | undefined;
    try {
      session = await runtime.openSession({ signal: new AbortController().signal, engineMode });
      await session.navigate(url, { timeoutMs: 20_000 });
      const snapshot = await session.snapshot();
      const controls = hasReservationControls(snapshot);
      results.push({
        engine: session.metadata.engine,
        requestedEngine: engineMode,
        url,
        pageLoadSuccess: true,
        domAvailable: snapshot.html.length > 0,
        jsExecution: true,
        bookingControlsDetectable: controls,
        dateSelectorUsable: controls && /(?:date|日付)/i.test(snapshot.html),
        partySizeSelectorUsable: controls && /(?:party|person|人数|guest)/i.test(snapshot.html),
        timeSlotsReadable: parseVisibleTimeSlots(snapshot).length > 0,
        redirected: snapshot.url !== url,
        botChallenge: hasBotChallenge(snapshot),
        unexpectedPage: detectExternalReservationRedirect(snapshot),
        latencyMs: Date.now() - startedAt,
      });
    } catch (error) {
      results.push({
        requestedEngine: engineMode,
        url,
        pageLoadSuccess: false,
        latencyMs: Date.now() - startedAt,
        failureCode: error instanceof Error && "code" in error ? (error as { code: unknown }).code : "BROWSER_RUNTIME_FAILED",
        failure: error instanceof Error ? error.message : "Unknown runtime failure",
      });
    } finally {
      await session?.close();
    }
  }
}
const artifact = { schemaVersion: "1", mode: "LIVE_READ_ONLY_BROWSER_PROBE", startedAt: new Date().toISOString(), results };
const directory = resolve(".eval-artifacts", "restaurant-browser-probe");
await mkdir(directory, { recursive: true });
const path = resolve(directory, `${artifact.startedAt.replace(/[:.]/g, "-")}-tabelog.json`);
await writeFile(path, JSON.stringify(artifact, null, 2), "utf8");
console.log(JSON.stringify({ artifactPath: path, results }, null, 2));
