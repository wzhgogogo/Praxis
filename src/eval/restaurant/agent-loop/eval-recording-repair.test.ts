import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { BrowserReadRecording } from "./runners/browser-read-recording.js";

// Minimal synthetic inputs, 2026-10-24; CODEX-3A-PRIME section 4.
// No historical run or production state builder supplies the expected result.
test("Gold fidelity allows additional UNSPECIFIED context and retains original requirements", () => {
  const gold = { value: "oden", polarity: "POSITIVE", strength: "HARD" };
  const extra = { text: "anniversary dinner", polarity: "POSITIVE", strength: "UNSPECIFIED" };
  const base = { target: { goal: "AVAILABILITY" }, date: { value: "2026-10-30" }, time: { start: "18:00", end: "20:00" }, party_size: 2, location: { value: "Tokyo", relation: "NEAR" }, criteria: [gold] };
  const authority = { target: base.target, date: "2026-10-30", timeWindow: { earliest: "18:00", latest: "20:00" }, partySize: 2, area: { query: "Tokyo" } };
  const assess = (criteria: unknown[]) => evaluateRestaurantHybridLiveArtifact({ materializedCase: { semantic: base }, finalSnapshot: { domainState: { phase: "INVESTIGATING", intentDraft: { ...authority, criteria } } }, events: [], trajectories: [] }, { path: "minimal-user-context.json", sha256: "1".repeat(64) }).findings.find(row => row.dimension === "AUTHORITATIVE_CONDITIONS")!.status;
  const actualGold = { text: "oden", polarity: "POSITIVE", strength: "HARD" };
  assert.equal(assess([actualGold, extra]), "SATISFIED");
  for (const strength of ["HARD", "SOFT"]) assert.equal(assess([actualGold, { ...extra, strength }]), "NOT_SATISFIED", strength);
  assert.equal(assess([extra]), "NOT_SATISFIED", "extra context cannot replace missing Gold");
  assert.equal(assess([{ ...actualGold, strength: "UNSPECIFIED" }, extra]), "NOT_SATISFIED");
  assert.equal(assess([{ ...actualGold, polarity: "NEGATIVE" }, extra]), "NOT_SATISFIED");
});

test("page qualification isolates omitted DOM and missing dependencies", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-page-qualification-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "mixed-pages" });
    recording.recordSnapshot({ url: "https://public.example/good", title: "Good", text: "", html: "<h1>Public</h1>" });
    recording.recordSnapshot({ url: "https://public.example/private?token=never-retain", title: "Private", text: "", html: "<h1>Unsafe URL</h1>" });
    recording.recordSnapshot({ url: "https://public.example/incomplete", title: "Incomplete", text: "", html: "<h1>Incomplete</h1>", networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/v2/slots", method: "GET", resourceType: "fetch", queryKeys: [] }] });
    recording.recordSnapshot({ url: "https://public.example/another", title: "Another", text: "", html: "<h1>Another public page</h1>" });
    recording.recordSnapshot({ url: "https://www.tablecheck.com/en/challenge", title: "Just a moment", text: "Verify you are human", html: '<form method="post" action="/challenge"><input name="cf-token" value="challenge-private"></form>' });
    const result = await recording.finish();
    assert.equal(result.replay.status, "PARTIALLY_REPLAYABLE");
    const manifest = JSON.parse(await readFile(join(result.path, "recording.json"), "utf8"));
    assert.deepEqual(manifest.pages.map((row: any) => [row.snapshot, row.status, row.reason]), [[1, "REPLAYABLE", "SANITIZED_NETWORK_AND_DOM_CAPTURE"], [2, "NOT_REPLAYABLE", "UNSAFE_DOCUMENT"], [3, "NOT_REPLAYABLE", "UNCAPTURED_DYNAMIC_RESPONSE"], [4, "REPLAYABLE", "SANITIZED_NETWORK_AND_DOM_CAPTURE"], [5, "NOT_REPLAYABLE", "CHALLENGE_DOCUMENT"]]);
    const har = JSON.parse(await readFile(join(result.path, "replay.har"), "utf8"));
    assert.deepEqual(har.log.entries.map((row: any) => row.request.url), ["https://public.example/good", "https://public.example/another"]);
    assert.doesNotMatch(JSON.stringify(manifest), /never-retain/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("page cap admits observed 430KB and 743KB documents and checks UTF-8 byte size", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-page-size-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "measured-size" });
    for (const size of [430_000, 743_000]) recording.recordSnapshot({ url: `https://public.example/size-${size}`, title: "Public", text: "", html: `<main>${"x".repeat(size)}</main>` });
    recording.recordSnapshot({ url: "https://public.example/oversized", title: "Public", text: "", html: `<main>${"\u3042".repeat(340_000)}</main>` });
    const result = await recording.finish();
    const manifest = JSON.parse(await readFile(join(result.path, "recording.json"), "utf8"));
    assert.equal(result.replay.status, "PARTIALLY_REPLAYABLE");
    assert.deepEqual(manifest.pages.map((row: any) => row.reason), ["SANITIZED_NETWORK_AND_DOM_CAPTURE", "SANITIZED_NETWORK_AND_DOM_CAPTURE", "DOCUMENT_SIZE_LIMIT"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
