import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { BrowserReadRecording } from "./runners/browser-read-recording.js";

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

test("browser recording refuses replay when a dynamic response was admitted without a safe captured body", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-unsafe" });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: "<h1>Public</h1>", networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/v2/results", method: "GET", resourceType: "fetch", queryKeys: [] }] });
    const result = await recording.finish();
    assert.deepEqual(result.replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_DYNAMIC_RESPONSE" });
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
