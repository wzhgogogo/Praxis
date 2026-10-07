import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import test from "node:test";



const execFileAsync = promisify(execFile);

const manifest = {
  stage: "DISCOVERY", mode: "LIVE_READ_ONLY",
  samples: [{ id: "tabelog-shibuya-omakase", sourcePackId: "tabelog", input: { queryFingerprint: "a" } }],
  budget: { sampleMaxElapsedMs: 60_000, sampleMaxModelCalls: 2, matrixMaxModelCalls: 50, matrixMaxElapsedMs: 1_800_000, matrixRepairRoundsMax: 3, stageActualModelCallsMax: 150 },
  sourceDataset: { path: "cases/e2e-cases.yaml", sha256: "00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6", contamination: "PROMPT_AND_RESULT_EXPOSED" },
  network: { proxyMode: "ENVIRONMENT", preflightTargets: ["TABELOG"] },
  runtime: { browserEngine: "LOCAL_CHROMIUM" },
};

test("source-stage plan runner freezes a no-proxy plan without external or downstream execution", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-plan-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-plan-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest));
    const runner = resolve("src/eval/restaurant/agent-loop/runners/run-source-stage-probe.ts");
    const loader = resolve("node_modules/tsx/dist/loader.mjs");
    const { stdout } = await execFileAsync(process.execPath, ["--import", loader, runner, "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--no-proxy"], { cwd: process.cwd() });
    const output = JSON.parse(stdout) as { artifactPath: string; status: string };
    assert.equal(output.status, "PLAN_FROZEN");
    const result = JSON.parse(await readFile(output.artifactPath, "utf8")) as Record<string, unknown>;
    assert.equal(result.status, "SUCCEEDED");
    assert.equal(result.actualModelCalls, 0);
    assert.equal(result.externalRequests, 0);
    assert.equal(result.downstreamTaskStarts, 0);
    assert.equal((result.effectiveNetwork as { proxyMode: string }).proxyMode, "DISABLED_BY_CLI");
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
  }
});

test("source-stage outer failure keeps a started preflight measurable instead of writing zero external work", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-preflight-ledger-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-preflight-ledger-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({ ...manifest, network: { ...manifest.network, preflightTargets: ["DEEPSEEK"] } }));
    const result = await rejectedRunnerResult([
      "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute", "--no-proxy",
    ], artifactDirectory, {
      PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1",
      PRAXIS_ALLOW_BROWSER_RUN: "1",
      DEEPSEEK_API_KEY: "",
    });
    assert.equal(result.stage, "PREFLIGHT");
    assert.equal(result.actualModelCalls, 0);
    assert.equal((result.externalRequests as { status?: string }).status, "NOT_MEASURED");
    const preflightPath = (result.externalRequests as { preflightArtifactPath?: string }).preflightArtifactPath;
    assert.ok(preflightPath, "the failed preflight artifact remains the external-attempt record");
    await Promise.all([
      rm(preflightPath!, { force: true }),
      rm(preflightPath!.replace(/\.result\.json$/, ".started.json"), { force: true }),
    ]);
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
  }
});


async function rejectedRunnerResult(
  args: readonly string[],
  artifactDirectory: string,
  extraEnvironment: NodeJS.ProcessEnv = {},
): Promise<Record<string, unknown>> {
  const runner = resolve("src/eval/restaurant/agent-loop/runners/run-source-stage-probe.ts");
  const loader = resolve("node_modules/tsx/dist/loader.mjs");
  const trapDirectory = await mkdtemp(join(tmpdir(), "praxis-source-stage-fetch-trap-"));
  try {
    const counterPath = join(trapDirectory, "fetch-attempts.log");
    const preloadPath = join(trapDirectory, "fetch-trap.mjs");
    await writeFile(preloadPath, [
      'import { appendFileSync, writeFileSync } from "node:fs";',
      'const counter = process.env.PRAXIS_SOURCE_STAGE_FETCH_COUNTER;',
      'if (!counter) throw new Error("missing source-stage fetch counter");',
      'writeFileSync(counter, "");',
      'globalThis.fetch = async () => { appendFileSync(counter, "fetch\\n"); throw new Error("unexpected fetch during rejected source-stage command"); };',
    ].join("\n"));
    await assert.rejects(() => execFileAsync(process.execPath, ["--import", preloadPath, "--import", loader, runner, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...extraEnvironment, PRAXIS_SOURCE_STAGE_FETCH_COUNTER: counterPath },
    }));
    assert.equal(await readFile(counterPath, "utf8"), "", "rejected command must not attempt fetch before its journal settles");
    const files = (await readdir(artifactDirectory)).filter(file => file.endsWith(".result.json"));
    const results = await Promise.all(files.map(async (file) =>
      JSON.parse(await readFile(resolve(artifactDirectory, file), "utf8")) as Record<string, unknown>));
    const result = results.find(value => Array.isArray(value.attempts)) ?? results[0];
    assert.ok(result, "rejected execution must retain its failed journal");
    return result;
  } finally {
    await rm(trapDirectory, { recursive: true, force: true });
  }
}

for (const mode of ["REPLAY", "PLAN_ONLY"] as const) {
  test(`source-stage execute rejects ${mode}${mode === "REPLAY" ? " outside the REPLAY stage" : ""} before preflight or downstream work and retains zero-attempt journal`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-mode-"));
    const artifactDirectory = resolve(".eval-artifacts", `source-stage-mode-test-${mode}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    try {
      const manifestPath = join(directory, "manifest.json");
      await writeFile(manifestPath, JSON.stringify({ ...manifest, mode }));
      const result = await rejectedRunnerResult(["--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute", "--no-proxy"], artifactDirectory);
      assert.equal(result.status, "FAILED");
      assert.equal(result.failureCode, "SOURCE_STAGE_MODE_NOT_EXECUTABLE");
      assert.equal(result.externalRequests, 0);
      assert.equal(result.actualModelCalls, 0);
      assert.equal(result.downstreamTaskStarts, 0);
    } finally {
      await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
    }
  });
}

test("source-stage execute rejects LIVE_READ_ONLY paired with REPLAY before preflight or downstream work", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-replay-mode-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-replay-mode-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({ ...manifest, stage: "REPLAY", mode: "LIVE_READ_ONLY" }));
    const result = await rejectedRunnerResult(["--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute", "--no-proxy"], artifactDirectory);
    assert.equal(result.failureCode, "SOURCE_STAGE_MODE_NOT_EXECUTABLE");
    assert.equal(result.externalRequests, 0);
    assert.equal(result.downstreamTaskStarts, 0);
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
  }
});

test("source-stage offline Replay uses a frozen HAR contract and aborts without a frozen action trace or network fallback", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-replay-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-replay-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const harPath = resolve(".eval-artifacts", `source-stage-replay-fixture-${Date.now()}-${Math.random().toString(16).slice(2)}.har`);
  try {
    await writeFile(harPath, JSON.stringify({ log: { version: "1.2", creator: { name: "fixture", version: "1" }, entries: [] } }));
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({
      ...manifest,
      stage: "REPLAY", mode: "REPLAY",
      samples: [{ id: "tabelog-replay", sourcePackId: "tabelog", input: {
        replayHarPath: harPath,
        request: { candidateIds: [], candidates: [], date: "2026-10-22", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      } }],
    }));
    const result = await rejectedRunnerResult([
      "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute", "--no-proxy",
    ], artifactDirectory);
    assert.equal(result.stage, "REPLAY_MATRIX");
    assert.equal(result.replayTransport, "OFFLINE_HAR_NO_PREFLIGHT");
    const attempts = result.attempts as Array<{ status: string; failureCode?: string }>;
    assert.deepEqual(attempts.map(({ status, failureCode }) => ({ status, failureCode })), [
      { status: "NO_COVERAGE", failureCode: "REPLAY_ACTION_NO_COVERAGE" },
    ]);
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true }), rm(harPath, { force: true })]);
  }
});

test("source-stage Replay rejects a changed frozen location context before any browser or model work", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-replay-location-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-replay-location-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const harPath = resolve(".eval-artifacts", `source-stage-replay-location-${Date.now()}-${Math.random().toString(16).slice(2)}.har`);
  const tracePath = resolve(".eval-artifacts", `source-stage-replay-location-${Date.now()}-${Math.random().toString(16).slice(2)}.trace.json`);
  try {
    await writeFile(harPath, JSON.stringify({ log: { version: "1.2", creator: { name: "fixture", version: "1" }, entries: [] } }));
    const intent = { timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "dining" }, area: { query: "Shibuya", radiusMeters: 1000 }, criteria: [] };
    const originalLocationContext = { latitude: 35.6619707, longitude: 139.703795, radiusMeters: 1000, label: "Shibuya", areaMatchBasis: "NAMED_PLACE_RADIUS" };
    await writeFile(tracePath, JSON.stringify({
      stage: "DISCOVERY",
      sample: { sourcePackId: "tabelog", input: { intent, locationContext: originalLocationContext } },
      result: { browserTrace: [] },
    }));
    const manifestPath = join(directory, "manifest.json");
    const digest = async (path: string) => (await import("node:crypto")).createHash("sha256").update(await readFile(path)).digest("hex");
    await writeFile(manifestPath, JSON.stringify({
      ...manifest,
      stage: "REPLAY", mode: "REPLAY",
      samples: [{ id: "tabelog-replay-location", sourcePackId: "tabelog", input: {
        replayHarPath: harPath,
        replayHarSha256: await digest(harPath),
        replayTraceArtifactPath: tracePath,
        replayTraceSha256: await digest(tracePath),
        intent,
        locationContext: { ...originalLocationContext, radiusMeters: 3000 },
      } }],
    }));
    const result = await rejectedRunnerResult([
      "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute", "--no-proxy",
    ], artifactDirectory);
    const attempts = result.attempts as Array<{ status: string; failureCode?: string; modelCallsStarted: number }>;
    assert.deepEqual(attempts.map(({ status, failureCode, modelCallsStarted }) => ({ status, failureCode, modelCallsStarted })), [
      { status: "NO_COVERAGE", failureCode: "REPLAY_ACTION_NO_COVERAGE", modelCallsStarted: 0 },
    ]);
    assert.equal(result.replayTransport, "OFFLINE_HAR_NO_PREFLIGHT");
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true }), rm(harPath, { force: true }), rm(tracePath, { force: true })]);
  }
});


test("source-stage named-location label must match the frozen sample input before preflight", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-label-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-label-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({ ...manifest, samples: [{ ...manifest.samples[0], input: { label: "Shibuya" } }] }));
    const result = await rejectedRunnerResult([
      "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute",
      "--resolve-named-location", "Ginza", "--sample-id", manifest.samples[0]!.id, "--no-proxy",
    ], artifactDirectory, { PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1" });
    assert.equal(result.failureCode, "LOCATION_LABEL_NOT_FROZEN");
    assert.equal(result.externalRequests, 0);
    assert.equal(result.downstreamTaskStarts, 0);
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
  }
});

test("source-stage named-location rejects an ambiguous frozen label before preflight", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-ambiguous-label-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-ambiguous-label-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({ ...manifest, samples: [{ ...manifest.samples[0], input: {
      label: "Shibuya",
      intent: { timezone: "Asia/Tokyo", target: { goal: "AVAILABILITY", query: "omakase" }, area: { query: "Ginza" }, criteria: [] },
    } }] }));
    const result = await rejectedRunnerResult([
      "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute",
      "--resolve-named-location", "Shibuya", "--sample-id", manifest.samples[0]!.id, "--no-proxy",
    ], artifactDirectory, { PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1" });
    assert.equal(result.failureCode, "LOCATION_LABEL_NOT_FROZEN");
    assert.equal(result.externalRequests, 0);
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
  }
});

test("source-stage named-location rejects a sample with no frozen label before preflight", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-missing-label-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-missing-label-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({ ...manifest, samples: [{ ...manifest.samples[0], input: { purpose: "PRE_DISCOVERY_NAMED_LOCATION_RESOLUTION" } }] }));
    const result = await rejectedRunnerResult([
      "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute",
      "--resolve-named-location", "Shibuya", "--sample-id", manifest.samples[0]!.id, "--no-proxy",
    ], artifactDirectory, { PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1" });
    assert.equal(result.failureCode, "LOCATION_LABEL_NOT_FROZEN");
    assert.equal(result.externalRequests, 0);
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
  }
});

test("source-stage named-location rejects an invalid frozen radius before preflight", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-source-stage-invalid-radius-"));
  const artifactDirectory = resolve(".eval-artifacts", `source-stage-invalid-radius-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({ ...manifest, samples: [{ ...manifest.samples[0], input: { label: "Shinjuku", radiusMeters: 0 } }] }));
    const result = await rejectedRunnerResult([
      "--manifest", manifestPath, "--artifact-dir", artifactDirectory, "--execute",
      "--resolve-named-location", "Shinjuku", "--sample-id", manifest.samples[0]!.id, "--no-proxy",
    ], artifactDirectory, { PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1" });
    assert.equal(result.failureCode, "LOCATION_RADIUS_NOT_FROZEN");
    assert.equal(result.externalRequests, 0);
    assert.equal(result.downstreamTaskStarts, 0);
  } finally {
    await Promise.all([rm(directory, { recursive: true, force: true }), rm(artifactDirectory, { recursive: true, force: true })]);
  }
});
