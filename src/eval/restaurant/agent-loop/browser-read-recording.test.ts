import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { BrowserReadRecording } from "./runners/browser-read-recording.js";

const reviewedStaticScript = [{ origin: "https://cdn.public.example", pathnamePrefix: "/assets/", resourceTypes: ["script"] as const,
  queryKeyRules: { required: [], allowedPatterns: ["^rst-v1-[A-Za-z0-9._-]+$"] } }] as const;
const reviewedDirectoryDocument = [{ origin: "https://directory.public.example", pathname: "/en/tokyo/A1303/A130301/rstLst/", resourceTypes: ["document"] as const,
  queryKeyRules: { required: [], allowed: ["sw"] } }] as const;

test("browser recording writes only an in-memory sanitized public document HAR", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-1" });
    recording.record("MODEL_WIRE", { action: "CLICK", targetRef: "observation:1:target:1", reason: "private source prose", authorization: "secret-marker-do-not-log" });
    recording.recordSnapshot({ url: "https://public.example/menu?date=2026-10-08&party=2", title: "Public", text: "", html: '<h1>Public</h1><script>token="secret-marker-do-not-log"</script><meta name="csrf-token" content="meta-private"><input type="hidden" name="csrf-token" value="csrf-private"><input type="password" name="password" value="password-private"><textarea name="g-recaptcha-response">challenge-private</textarea><div data-csrf-token="data-private">Public restaurant</div><a href="/reserve?start_date=2026-10-08&amp;num_people=2&amp;start_time=19:00">19:00</a><p>a@b.example +86 138 1234 5678</p>' });
    const result = await recording.finish();
    assert.equal(result.screenshot, "NOT_CAPTURED_NO_SANITIZER");
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected replayable recording");
    const har = await readFile(result.replay.harPath, "utf8");
    const persisted = await readFile(join(root, "run-1", "recording.json"), "utf8");
    assert.equal(har.includes("secret-marker-do-not-log"), false);
    assert.equal(har.includes("<script"), false);
    assert.equal(/csrf-private|password-private|challenge-private|meta-private|data-private/.test(har), false);
    assert.match(har, /Public restaurant/);
    assert.match(har, /start_date=2026-10-08/);
    assert.equal(persisted.includes("authorization"), false);
    assert.match(har, /\[REDACTED\]/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording retains a Pack-reviewed public query document within the measured bounded size", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-reviewed-document", reviewedReads: reviewedDirectoryDocument });
    const html = `<main>${"<p>Public result</p>".repeat(16_000)}</main>`;
    assert.ok(html.length > 300_000 && html.length < 400_000);
    recording.recordSnapshot({
      url: "https://directory.public.example/en/tokyo/A1303/A130301/rstLst/?sw=omakase",
      title: "Public directory", text: "", html,
    });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording preserves valid JSON-LD geo numbers while redacting its telephone", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "json-ld-geo" });
    recording.recordSnapshot({
      url: "https://public.example/restaurant", title: "Restaurant", text: "",
      html: '<script type="application/ld+json">{"@type":"Restaurant","name":"Public Restaurant","geo":{"@type":"GeoCoordinates","latitude":35.6697003123,"longitude":139.7671399123},"telephone":3123456789,"apiKey":12345,"metadata":{"sessionId":67890}}</script>',
    });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected JSON-LD recording");
    const har = JSON.parse(await readFile(result.replay.harPath, "utf8")) as { log: { entries: Array<{ response: { content: { text: string } } }> } };
    const html = har.log.entries[0]!.response.content.text;
    const json = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i)?.[1];
    assert.ok(json, "JSON-LD remains available to the production exact-radius parser");
    const structured = JSON.parse(json!);
    assert.equal(structured.geo.latitude, 35.6697003123);
    assert.equal(structured.geo.longitude, 139.7671399123);
    assert.equal(structured.telephone, "[REDACTED]");
    assert.equal(structured.apiKey, "[REDACTED]");
    assert.equal(structured.metadata.sessionId, "[REDACTED]");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording keeps a Pack-reviewed public GET form action but rejects an unreviewed query action", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const reviewed = new BrowserReadRecording({ directory: root, runId: "reviewed-query-form", reviewedReads: reviewedDirectoryDocument });
    reviewed.recordSnapshot({
      url: "https://directory.public.example/en/tokyo/A1303/A130301/rstLst/?sw=omakase",
      title: "Directory", text: "",
      html: '<form method="get" action="/en/tokyo/A1303/A130301/rstLst/?sw=omakase"><input name="sw"></form>',
    });
    const recorded = await reviewed.finish();
    assert.equal(recorded.replay.status, "REPLAYABLE");
    if (recorded.replay.status !== "REPLAYABLE") throw new Error("expected reviewed public form to replay");
    const reviewedHar = JSON.parse(await readFile(recorded.replay.harPath, "utf8")) as { log: { entries: Array<{ response: { content: { text: string } } }> } };
    assert.match(reviewedHar.log.entries[0]!.response.content.text, /action="https:\/\/directory\.public\.example\/en\/tokyo\/A1303\/A130301\/rstLst\/\?sw=omakase"/);

    const unreviewed = new BrowserReadRecording({ directory: root, runId: "unreviewed-query-form", reviewedReads: reviewedDirectoryDocument });
    unreviewed.recordSnapshot({
      url: "https://directory.public.example/en/tokyo/A1303/A130301/rstLst/?sw=omakase",
      title: "Directory", text: "",
      html: '<form method="get" action="/en/tokyo/A1303/A130301/rstLst/?unknown=omakase"><input name="sw"></form>',
    });
    assert.deepEqual((await unreviewed.finish()).replay, { status: "NOT_REPLAYABLE", reason: "UNSAFE_DOCUMENT" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording refuses replay when a dynamic response was admitted without a safe captured body", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-unsafe" });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: "<h1>Public</h1>", networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/v2/results", method: "GET", resourceType: "fetch", queryKeys: [] }] });
    const result = await recording.finish();
    assert.deepEqual(result.replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_DYNAMIC_RESPONSE" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording refuses a snapshot-only replay when an admitted external script was not captured", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-static-missing" });
    recording.recordSnapshot({
      url: "https://public.example/menu", title: "Public", text: "", html: '<div id="calendar"></div>',
      networkRequests: [{ outcome: "ADMITTED", origin: "https://cdn.public.example/", pathname: "/assets/calendar.js", method: "GET", resourceType: "script", queryKeys: ["rst-v1-public"] }],
    });
    assert.deepEqual((await recording.finish()).replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_STATIC_DEPENDENCY" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording keeps a captured safe external script in the replay HAR", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-static-captured", reviewedStaticResources: reviewedStaticScript });
    recording.recordSnapshot({
      url: "https://public.example/menu", title: "Public", text: "", html: '<script src="https://cdn.public.example/assets/calendar.js?rst-v1-202610071750-public"></script><div id="calendar"></div>',
      networkRequests: [{ outcome: "ADMITTED", origin: "https://cdn.public.example/", pathname: "/assets/calendar.js", method: "GET", resourceType: "script", queryKeys: ["rst-v1-202610071750-public"] }],
    });
    await recording.recordResponse({ url: "https://cdn.public.example/assets/calendar.js?rst-v1-202610071750-public", method: "GET", status: 200, contentType: "text/javascript", body: new TextEncoder().encode('document.cookie;document.getElementById("calendar").textContent="ready";') });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected captured script to be replayable");
    assert.match(await readFile(result.replay.harPath, "utf8"), /calendar\.js/);
    assert.match(await readFile(result.replay.harPath, "utf8"), /rst-v1-202610071750-public/, "a reviewed public release key survives the general text scrub unchanged");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording refuses a reviewed script response containing a literal credential", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-static-secret", reviewedStaticResources: reviewedStaticScript });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<div></div>',
      networkRequests: [{ outcome: "ADMITTED", origin: "https://cdn.public.example/", pathname: "/assets/calendar.js", method: "GET", resourceType: "script", queryKeys: ["rst-v1-public"] }] });
    await recording.recordResponse({ url: "https://cdn.public.example/assets/calendar.js?rst-v1-public", method: "GET", status: 200, contentType: "application/javascript", body: new TextEncoder().encode('const key = "Bearer secretvalue";') });
    assert.deepEqual((await recording.finish()).replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_STATIC_DEPENDENCY" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording persists each runtime-masked screenshot with its snapshot", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-2" });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: "<h1>Public</h1>" });
    await recording.captureScreenshot(new Uint8Array([137, 80, 78, 71]), "LAYOUT_ONLY_CONTENT_MASKED");
    recording.recordSnapshot({ url: "https://public.example/menu?date=2026-10-08", title: "Public", text: "", html: "<h1>Public</h1>" });
    await recording.captureScreenshot(new Uint8Array([137, 80, 78, 72]), "LAYOUT_ONLY_CONTENT_MASKED");
    const result = await recording.finish();
    assert.equal(result.screenshot, "LAYOUT_ONLY_CONTENT_MASKED");
    assert.deepEqual([...await readFile(join(root, "run-2", "screenshot-0001.png"))], [137, 80, 78, 71]);
    assert.deepEqual([...await readFile(join(root, "run-2", "screenshot-0002.png"))], [137, 80, 78, 72]);
    const metadata = JSON.parse(await readFile(join(root, "run-2", "recording.json"), "utf8"));
    assert.deepEqual(metadata.screenshots, [
      { snapshot: 1, status: "LAYOUT_ONLY_CONTENT_MASKED", file: "screenshot-0001.png" },
      { snapshot: 2, status: "LAYOUT_ONLY_CONTENT_MASKED", file: "screenshot-0002.png" },
    ]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording adds a sanitized admitted public dynamic response to replay only in memory", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-dynamic" });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: "<h1>Public</h1>", networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/v2/results", method: "GET", resourceType: "fetch", queryKeys: [] }] });
    await recording.recordResponse({ url: "https://public.example/v2/results", method: "GET", status: 200, contentType: "application/json", body: new TextEncoder().encode('{"available":true,"slots":[19]}') });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected recorded response replay");
    assert.match(await readFile(result.replay.harPath, "utf8"), /\\"available\\":true/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording rejects HTTP failures and preserves safe CSS visibility in replay documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const failure = new BrowserReadRecording({ directory: root, runId: "failure" });
    await failure.recordResponse({ url: "https://public.example/v2/result", method: "GET", status: 503, contentType: "application/json", body: new TextEncoder().encode('{"error":"unavailable"}') });
    failure.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<style>#hidden-slot{display:none}</style><a id="hidden-slot" href="/reserve?start_date=2026-10-08&amp;num_people=2&amp;start_time=19:00">19:00</a>' });
    const result = await failure.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("503 public JSON must replay");
    assert.match(await readFile(result.replay.harPath, "utf8"), /"status": 503/);
    const visible = new BrowserReadRecording({ directory: root, runId: "visible" });
    visible.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<style>#hidden-slot{display:none}</style><a id="hidden-slot" href="/reserve?start_date=2026-10-08&amp;num_people=2&amp;start_time=19:00">19:00</a>' });
    const replay = await visible.finish(); assert.equal(replay.replay.status, "REPLAYABLE"); if (replay.replay.status !== "REPLAYABLE") throw new Error("expected safe CSS replay");
    assert.match(await readFile(replay.replay.harPath, "utf8"), /#hidden-slot\{display:none\}/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording preserves safe form semantics and rejects unsafe form actions", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const safe = new BrowserReadRecording({ directory: root, runId: "forms" });
    safe.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<form id="public-search" class="search" data-widget="query" method="post" action="/reserve/public-query?date=2026-10-08&amp;party=2"><input name="search_text"></form>' });
    const recorded = await safe.finish();
    assert.equal(recorded.replay.status, "REPLAYABLE");
    if (recorded.replay.status !== "REPLAYABLE") throw new Error("expected safe form recording");
    const har = JSON.parse(await readFile(recorded.replay.harPath, "utf8")) as { log: { entries: Array<{ response: { content: { text: string } } }> } };
    const html = har.log.entries[0]!.response.content.text;
    assert.match(html, /id="public-search"/);
    assert.match(html, /class="search"/);
    assert.match(html, /data-widget="query"/);
    assert.match(html, /method="post"/);
    const unsafe = new BrowserReadRecording({ directory: root, runId: "unsafe-form" });
    unsafe.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<form method="post" action="/cancel?token=private"><input name="search_text"></form>' });
    assert.deepEqual((await unsafe.finish()).replay, { status: "NOT_REPLAYABLE", reason: "UNSAFE_DOCUMENT" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording preserves an admitted public document redirect for replay", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-redirect" });
    await recording.recordResponse({
      url: "https://public.example/directory", method: "GET", status: 302, contentType: "text/html",
      body: new TextEncoder().encode(""), redirectLocation: "https://public.example/directory/current",
    });
    await recording.recordResponse({
      url: "https://public.example/directory/current", method: "GET", status: 200, contentType: "text/html",
      body: new TextEncoder().encode("<main>Public directory</main>"),
    });
    recording.recordSnapshot({ url: "https://public.example/directory/current", title: "Directory", text: "", html: "<main>Public directory</main>" });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected replayable redirect");
    const har = JSON.parse(await readFile(result.replay.harPath, "utf8"));
    const first = har.log.entries.find((entry: { request: { url: string } }) => entry.request.url === "https://public.example/directory");
    assert.equal(first.response.status, 302);
    assert.equal(first.response.redirectURL, "https://public.example/directory/current");
    assert.deepEqual(first.response.headers.find((header: { name: string }) => header.name === "location"), {
      name: "location", value: "https://public.example/directory/current",
    });
  } finally { await rm(root, { recursive: true, force: true }); }
});
