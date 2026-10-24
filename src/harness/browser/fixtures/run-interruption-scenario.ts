import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function runInterruptionScenario(mode: "complete" | "signal" | "deadline" | "external", root: string) {
  await mkdir(root, { recursive: true });
  const messages: any[] = [];
  const logs: Buffer[] = [];
  const child = fork(fileURLToPath(new URL("./run-interruption.ts", import.meta.url)), [mode, root], {
    execArgv: ["--import", "tsx"], silent: true,
    env: Object.fromEntries(Object.entries(process.env).filter(([key]) => ["PATH", "HOME", "TMPDIR", "LANG", "PLAYWRIGHT_BROWSERS_PATH"].includes(key))),
  });
  child.stdout!.on("data", data => logs.push(Buffer.from(data)));
  child.stderr!.on("data", data => logs.push(Buffer.from(data)));
  const timeout = setTimeout(() => child.kill("SIGKILL"), 60_000);
  let stopGrace: ReturnType<typeof setTimeout> | undefined;
  child.on("message", (message: any) => {
    messages.push(message);
    if (message.stage === "AVAILABILITY_READING") {
      stopGrace = setTimeout(() => child.kill("SIGKILL"), 10_000);
      if (mode === "signal") child.kill("SIGTERM");
      if (mode === "deadline") child.send("advance-deadline-500000");
      if (mode === "external") child.send("external-stop");
    }
  });
  const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((accept, reject) => {
    child.on("error", reject);
    child.on("close", (code, signal) => accept({ code, signal }));
  }).finally(() => { clearTimeout(timeout); clearTimeout(stopGrace); });
  await writeFile(join(root, "child.log"), Buffer.concat(logs));
  await writeFile(join(root, "process.json"), JSON.stringify({ mode, exit, messages }, null, 2));
  const directory = join(root, ".eval-artifacts/restaurant-hybrid-live-read");
  const files = await readdir(directory).catch(() => []);
  const results = files.filter(file => file.endsWith(".result.json"));
  assert.equal(results.length, 1, `expected a flushed result after ${mode}; exit=${JSON.stringify(exit)}; log=${Buffer.concat(logs).toString().slice(-1500)}`);
  const resultPath = resolve(directory, results[0]!);
  const artifact = JSON.parse(await readFile(resultPath, "utf8"));
  const finished = JSON.parse(await readFile(join(root, "fixture-finished.json"), "utf8"));
  assert.equal(finished.externalCalls, 0);
  assert.equal(finished.realModelCalls, 0);
  assert.ok(artifact.finalSnapshot);
  assert.ok(artifact.diagnostics.browserTrace.length > 0);
  assert.ok(artifact.events.length > 0);
  assert.ok(artifact.trajectories.length > 0);
  const decisions = await readFile(artifact.decisionCapture.path, "utf8");
  assert.ok(decisions.trim().split("\n").length >= 3);
  const recording = JSON.parse(await readFile(join(artifact.browserRecording.path, "recording.json"), "utf8"));
  assert.ok(recording.entries.length > 0);
  assert.ok(recording.documents.length > 0);
  assert.ok(artifact.diagnostics.browserExecution.some((row: any) => row.stage === "AVAILABILITY"));
  if (mode === "complete") {
    assert.equal(artifact.finalSnapshot.domainState.phase, "PRESENT_RESULTS", Buffer.concat(logs).toString().slice(-2000));
    assert.equal(artifact.status, "SUCCEEDED");
  } else {
    assert.ok(messages.some(row => row.stage === "AVAILABILITY_READING"));
    assert.equal(artifact.interruption.reason, mode === "signal" ? "SIGNAL" : mode === "deadline" ? "TIMEOUT" : "EXTERNAL_STOP");
    assert.equal(artifact.interruption.timeoutMs, 500_000);
    if (mode === "signal") assert.equal(artifact.interruption.signal, "SIGTERM");
    if (mode === "deadline") assert.ok(messages.some(row => row.stage === "SIMULATED_TIME" && row.elapsedMs === 500_000));
  }
  return { artifact, resultPath, recording, exit, messages };
}
