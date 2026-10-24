import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { diagnosticRecording } from "./fixtures/recording-diagnostic.js";

test("diagnostic DOM preserves safe rejected pages without changing replay bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-diagnostic-dom-"));
  try {
    const baseline = JSON.parse(await readFile(new URL("./fixtures/recording-diagnostic-baseline.json", import.meta.url), "utf8"));
    const result = await diagnosticRecording(root);
    const manifest = JSON.parse(await readFile(join(result.path, "recording.json"), "utf8"));
    assert.deepEqual(manifest.pages.map(({ diagnostic: _diagnostic, ...page }: any) => page), baseline.pages);
    for (const [file, hash] of Object.entries(baseline.files)) assert.equal(createHash("sha256").update(await readFile(join(result.path, file))).digest("hex"), hash, file);
    assert.deepEqual(manifest.pages.map((page: any) => page.diagnostic), [
      ...[1, 2, 3].map(snapshot => ({ status: "SAVED", file: `diagnostic/snapshot-${String(snapshot).padStart(4, "0")}.html` })),
      { status: "OMITTED", reason: "CHALLENGE_DOCUMENT" },
      { status: "OMITTED", reason: "UNSAFE_DOCUMENT" },
      { status: "OMITTED", reason: "DOCUMENT_SIZE_LIMIT" },
    ]);
    assert.deepEqual((await readdir(join(result.path, "diagnostic"))).sort(), ["snapshot-0001.html", "snapshot-0002.html", "snapshot-0003.html"]);
    const missingScript = await readFile(join(result.path, "diagnostic/snapshot-0002.html"), "utf8");
    assert.match(missingScript, /Region menu/);
    assert.match(missingScript, /method="post"/);
    assert.doesNotMatch(missingScript, /fixture-session|fixture-private|action=/);
    assert.doesNotMatch(await readFile(join(result.path, "diagnostic/snapshot-0003.html"), "utf8"), /fixture@example/);
    assert.doesNotMatch(await readFile(join(result.path, "replay.har"), "utf8"), /Region menu|Regions|diagnostic\//);
  } finally { await rm(root, { recursive: true, force: true }); }
});
