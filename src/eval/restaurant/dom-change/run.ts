import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { replayHarPages } from "../../../harness/browser/browser-read-test-fixtures.js";
import { chromium, type Browser, type Page } from "playwright-core";
import { LocalPlaywrightChromium } from "../../../infrastructure/browser/local-playwright-chromium.js";
import type { BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { hasTabelogSelectedQuery, tabelogQueryControlHints, tabelogRequestedDateState } from "../../../integrations/tabelog/tabelog-query-controls.js";
import { parseTabelogAvailabilitySlots, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets } from "../../../integrations/tabelog/tabelog-page-parser.js";
import { tabelogAvailabilityCompletion, tabelogNameSearchCompletion } from "../../../integrations/tabelog/tabelog-browser-availability.js";
import { hasTableCheckDiscoveryNoResult, hasTableCheckSelectedRequest, parseTableCheckAvailabilitySlots, parseTableCheckDiscoveryOutletUrls, parseTableCheckOutletIdentityWithEvidence } from "../../../integrations/tablecheck/tablecheck-page-parser.js";
import { tableCheckNameSearchCompletion } from "../../../integrations/tablecheck/tablecheck-browser-availability.js";
import { classifyDomChange } from "./classification.js";
import { DOM_MUTATION_RULE, renamePrivateMarkers } from "./mutation.js";

export interface DomPage {
  id: string; site: "TABELOG" | "TABLECHECK"; kind: "LIST" | "DETAIL" | "CALENDAR";
  path: string; sha256: string; sourceUrl: string; provenancePath: string; dates: string[];
  request: { date: string; partySize: number; timeWindow: { earliest: string; latest: string } };
}
export const DOM_CHANGE_MANIFEST = fileURLToPath(new URL("../../../harness/browser/fixtures/dom-change/manifest.json", import.meta.url));
const sha = (body: string | Buffer) => createHash("sha256").update(body).digest("hex");

function observations(spec: DomPage, snapshot: BrowserSnapshot, controls: Awaited<ReturnType<NonNullable<import("../../../infrastructure/browser/browser-runtime.js").BrowserSession["observeControls"]>>>) {
  const facts: Record<string, unknown> = {};
  if (spec.kind === "LIST") {
    if (spec.site === "TABELOG") for (const outlet of parseTabelogSearchOutlets(snapshot)) {
      facts["outlet:" + outlet.sourceUrl + ":name"] = outlet.outletName;
      if (outlet.address) facts["outlet:" + outlet.sourceUrl + ":address"] = outlet.address;
    } else {
      for (const url of parseTableCheckDiscoveryOutletUrls(snapshot, "")) facts["outlet:" + url] = true;
      if (hasTableCheckDiscoveryNoResult(snapshot)) facts.explicitlyEmpty = true;
    }
  }
  if (spec.kind === "DETAIL") {
    const identity = spec.site === "TABELOG" ? parseTabelogOutletIdentityWithEvidence(snapshot, { sourceEntityId: spec.id, sourceUrl: spec.sourceUrl, outletName: "" })
      : parseTableCheckOutletIdentityWithEvidence(snapshot, spec.sourceUrl);
    for (const [name, field] of Object.entries(identity?.fields ?? {})) {
      if (field.value && field.source !== "SEARCH_RESULT" && field.source !== "ABSENT") facts["identity:" + name] = field.value;
    }
  }
  const selected = spec.site === "TABELOG" ? hasTabelogSelectedQuery(snapshot, spec.request.date, spec.request.partySize)
    : hasTableCheckSelectedRequest(snapshot, spec.request.date, spec.request.partySize, controls);
  const availability = spec.site === "TABELOG" ? parseTabelogAvailabilitySlots(snapshot, spec.request) : parseTableCheckAvailabilitySlots(snapshot, spec.request);
  const completion = spec.site === "TABELOG" ? { name: tabelogNameSearchCompletion(snapshot), availability: tabelogAvailabilityCompletion(snapshot, spec.request) }
    : { name: tableCheckNameSearchCompletion(snapshot, ""), availability };
  if (spec.kind === "CALENDAR") {
    if (spec.site === "TABELOG") for (const date of spec.dates) {
      const state = tabelogRequestedDateState(snapshot, date); if (state !== "UNOBSERVED") facts["day:" + date] = state;
    }
    if (selected) facts.requestConfirmed = true;
    const bound = spec.site === "TABLECHECK" ? "queryComplete" in availability && availability.queryComplete
      : selected && "availability" in completion && "complete" in completion.availability && completion.availability.complete;
    if (bound && availability.availableSlots.length) facts.availability = { status: "AVAILABLE", slots: availability.availableSlots };
    else if (bound && "explicitlyEmpty" in availability && availability.explicitlyEmpty) facts.availability = { status: "UNAVAILABLE" };
  }
  return { facts, selected, completion, controls: controls.map(control => ({ kind: control.kind, label: control.label, value: control.value, selected: control.selected, disabled: control.disabled })) };
}

/** Actual Chromium + production snapshots/controls/completion, with no source transport. */
export async function runDomChange(output?: string) {
  const manifestBytes = await readFile(DOM_CHANGE_MANIFEST);
  const manifest = JSON.parse(manifestBytes.toString()) as { seed: string; mutationRule: string; pages: DomPage[] };
  if (manifest.mutationRule !== DOM_MUTATION_RULE) throw new Error("DOM_MUTATION_RULE_MISMATCH");
  for (const site of ["TABELOG", "TABLECHECK"]) for (const kind of ["LIST", "DETAIL", "CALENDAR"]) {
    if (manifest.pages.filter(page => page.site === site && page.kind === kind).length < 2) throw new Error("MISSING_TWO_SAVED_PAGES_PER_SOURCE_KIND");
  }
  if (output) await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, proxy: { server: "http://127.0.0.1:9" } });
  const cases = [];
  const fixtureHarDirectory = await mkdtemp(resolve(tmpdir(), "phase3b-g2-fixture-har-"));
  try {
    for (const spec of manifest.pages) {
      if (!/^[a-z0-9-]+$/.test(spec.id)) throw new Error("INVALID_DOM_CASE_ID");
      const bytes = await readFile(resolve(spec.path));
      if (sha(bytes) !== spec.sha256) throw new Error("SAVED_PAGE_SHA_MISMATCH");
      let page: Page | undefined;
      const intercepted: Array<{ url: string; result: "FIXTURE" | "BLOCKED_NO_TRANSPORT" }> = [];
      const browserType = { async launch() {
        return new Proxy(browser, { get(target, key) {
          if (key === "close") return async () => undefined;
          if (key === "newContext") return async (options: Parameters<Browser["newContext"]>[0]) => {
            const context = await target.newContext({ ...options, javaScriptEnabled: false, serviceWorkers: "block" });
            context.on("page", current => { page = current; });
            context.on("request", request => {
              intercepted.push({ url: request.url(), result: request.url() === spec.sourceUrl ? "FIXTURE" : "BLOCKED_NO_TRANSPORT" });
            });
            return context;
          };
          const value = Reflect.get(target, key, target); return typeof value === "function" ? value.bind(target) : value;
        } });
      } };
      const runtime = new LocalPlaywrightChromium({ browserType: browserType as unknown as typeof chromium });
      const fixtureHarPath = resolve(fixtureHarDirectory, spec.id + ".har");
      await writeFile(fixtureHarPath, replayHarPages({ [spec.sourceUrl]: bytes.toString() }), { flag: "wx" });
      const session = await runtime.openSession({ replayHarPath: fixtureHarPath, signal: AbortSignal.timeout(30_000), networkPolicy: { documentOrigins: [new URL(spec.sourceUrl).origin], genericPublicRead: true, staticResources: [], dynamicReads: [] } });
      try {
        if (session.metadata.readNetworkBoundary !== "INSTALLED") throw new Error("MISSING_REAL_GUARD");
        await session.prepareNavigation!(spec.sourceUrl, { timeoutMs: 10_000 });
        await session.navigate(spec.sourceUrl);
        // Same declared visibility shim as F3; no original external CSS is invented.
        await page!.evaluate(() => { const style = document.createElement("style"); style.textContent = ".is-hidden{display:none}"; document.head.append(style); });
        const beforeSnapshot = await session.snapshot();
        const beforeControls = await session.observeControls!(spec.site === "TABELOG" ? tabelogQueryControlHints(beforeSnapshot) : []);
        const before = observations(spec, beforeSnapshot, beforeControls);
        const mutation = await renamePrivateMarkers(page!, manifest.seed + ":" + spec.id);
        const afterSnapshot = await session.snapshot();
        const afterControls = await session.observeControls!(spec.site === "TABELOG" ? tabelogQueryControlHints(afterSnapshot) : []);
        const after = observations(spec, afterSnapshot, afterControls);
        const result = { id: spec.id, site: spec.site, kind: spec.kind, sourceUrl: spec.sourceUrl, originalSha256: spec.sha256,
          mutatedSha256: sha(await page!.content()), sourceTransport: "LOCAL_CONSTRUCTED_HAR_FROM_SAVED_DOM", intercepted, before, after, classification: classifyDomChange(before.facts, after.facts, mutation.integrity.valid), mutation };
        cases.push(result);
        if (output) {
          await writeFile(resolve(output, spec.id + ".mapping.json"), JSON.stringify(mutation, null, 2) + "\n", { flag: "wx" });
          await writeFile(resolve(output, spec.id + ".mutated.html"), await page!.content(), { flag: "wx" });
        }
        if (result.classification.verdict === "FAIL") break; // User's immediate stop rule.
      } finally { await session.close(); }
    }
  } finally { await browser.close(); await rm(fixtureHarDirectory, { recursive: true, force: true }); }
  const result = { schema: "dom-change-observations@1", rule: DOM_MUTATION_RULE, manifestSha256: sha(manifestBytes), mode: "OFFLINE_SAVED_PAGE_DOM_NOT_WEBSITE_REPLAY", inlineScriptsExecuted: false, sourceTransportCalls: 0, cases };
  if (output) await writeFile(resolve(output, "observations.json"), JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out"); if (at < 0 || !process.argv[at + 1]) throw new Error("Explicit --out required");
  const result = await runDomChange(process.argv[at + 1]);
  console.log(JSON.stringify({ rule: result.rule, cases: result.cases.map(row => ({ id: row.id, classification: row.classification, valid: row.mutation.integrity.valid })), sourceTransportCalls: result.sourceTransportCalls }));
  if (result.cases.some(row => row.classification.verdict === "FAIL" || row.classification.verdict === "INVALID_MUTATION")) process.exitCode = 1;
}
