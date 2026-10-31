import { readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, resolve, basename, relative } from "node:path";
import { performance } from "node:perf_hooks";

const root = fileURLToPath(new URL("..", import.meta.url));

// Same Node test-file isolation/concurrency as before. Lifecycle events use a separate pipe so
// Node's ordered spec output cannot hide a later file that is still running.
export async function runBrowserFixturePhase(phase, clock = { now: () => performance.now(), setTimeout, clearTimeout }) {
  const child = spawn(process.execPath, ["scripts/browser-fixture-worker.mjs", String(phase.concurrency), ...phase.files],
  { cwd: root, stdio: ["ignore", "pipe", "pipe", "pipe"], detached: process.platform !== "win32" });
  const active = new Map(), started = new Set(), ended = new Set();
  let stdout = "", stdoutBytes = 0, progress = "", error, timedOut = false, stopping = false, forceKill;
  const emit = data => console.error(`[browser fixtures] ${JSON.stringify({ phase: phase.name, ...data })}`);
  const stop = reason => {
    if (stopping) return;
    stopping = true;
    const now = clock.now();
    emit({ event: reason, limitMs: 600_000, pid: child.pid });
    for (const [file, state] of active) emit({ event: "UNFINISHED", file: relative(root, file),
      elapsedMs: Math.max(0, now - state.startedAt), lastObservedTests: [...state.tests.values()] });
    emit({ event: "PHASE_PROGRESS", started: started.size, ended: ended.size,
      notStarted: phase.files.filter(file => !started.has(file)).map(file => relative(root, file)),
      note: "Test events can be buffered; lastObservedTests are observations, not proof of the currently blocked test." });
    child.kill("SIGTERM"); // Worker aborts Node's run and awaits the output pipeline.
    forceKill = setTimeout(() => {
      emit({ event: "FORCED_PROCESS_GROUP_CLEANUP", pid: child.pid });
      try { if (process.platform === "win32") child.kill("SIGKILL"); else process.kill(-child.pid, "SIGKILL"); }
      catch (failure) { if (failure.code !== "ESRCH") console.error(failure.message); }
    }, 5_000);
  };
  const cancel = () => { error = new Error("Browser fixture entry interrupted"); stop("EXTERNAL_CANCEL"); };
  process.once("SIGINT", cancel); process.once("SIGTERM", cancel);
  const deadline = clock.setTimeout(() => { timedOut = true; stop("OUTER_TIMEOUT"); }, 600_000);
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", chunk => {
    process.stdout.write(chunk);
    stdoutBytes += Buffer.byteLength(chunk);
    if (stdoutBytes > 32 * 1024 * 1024) { error = new Error("Browser fixture output exceeded 32 MiB"); stop("OUTPUT_LIMIT"); }
    else stdout += chunk;
  });
  child.stderr.on("data", chunk => process.stderr.write(chunk));
  child.stdio[3].setEncoding("utf8");
  child.stdio[3].on("data", chunk => {
    progress += chunk;
    let newline;
    while ((newline = progress.indexOf("\n")) >= 0) {
      const line = progress.slice(0, newline); progress = progress.slice(newline + 1);
      let row;
      try { row = JSON.parse(line); }
      catch { error = new Error("Invalid browser lifecycle event"); stop("LIFECYCLE_ERROR"); continue; }
      if (!phase.files.includes(row.file)) {
        if (row.event === "FILE_START" || row.event === "FILE_END") { error = new Error("Unknown browser lifecycle file"); stop("LIFECYCLE_ERROR"); }
        continue; // A subtest may be declared by an imported helper module.
      }
      if (row.event === "FILE_START") {
        started.add(row.file); active.set(row.file, { startedAt: clock.now(), tests: new Map() });
        emit({ event: row.event, file: relative(root, row.file) });
      } else if (row.event === "FILE_END") {
        const state = active.get(row.file);
        emit({ event: row.event, file: relative(root, row.file), elapsedMs: state ? clock.now() - state.startedAt : null, passed: row.passed });
        ended.add(row.file); active.delete(row.file);
      } else if (active.has(row.file)) {
        const tests = active.get(row.file).tests;
        if (row.event === "TEST_START") tests.set(row.id, row.name);
        if (row.event === "TEST_END") tests.delete(row.id);
      }
    }
  });
  child.on("error", failure => { error = failure; });
  const status = await new Promise(resolve => child.on("close", resolve));
  clock.clearTimeout(deadline); clearTimeout(forceKill);
  process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel);
  if (!timedOut && !error && (started.size !== phase.files.length || ended.size !== phase.files.length || progress)) {
    error = new Error("Incomplete browser lifecycle report"); stop("INCOMPLETE_LIFECYCLE"); clearTimeout(forceKill);
  }
  return { stdout, status, error, timedOut };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = join(root, "src/harness/browser");
  const all = readdirSync(directory).filter(name => name.endsWith(".test.ts")).sort().map(name => join(directory, name));
  // Explicit files serve bounded contention diagnostics; npm's default is the
  // complete corpus. Reject duplicates/unknown files rather than silently omit one.
  const files = process.argv.length > 2 ? process.argv.slice(2).map(name => resolve(root, name)) : all;
  if (!files.length || new Set(files).size !== files.length || files.some(file => !all.includes(file))) throw new Error("Unknown or duplicated browser fixture file");
  const g2 = file => basename(file).startsWith("dom-change");
  const phases = [
    { name: "G2 (exclusive)", concurrency: 1, files: files.filter(g2) },
    { name: "remaining fixtures", concurrency: 4, files: files.filter(file => !g2(file)) },
  ];
  const keys = ["tests", "suites", "pass", "fail", "cancelled", "skipped", "todo"];
  const totals = Object.fromEntries(keys.map(key => [key, 0]));
  const start = performance.now();
  console.log(`[browser fixtures] ${files.length}/${all.length} files; G2 never overlaps the remaining fixtures`);
  let code = 0;
  for (const phase of phases) {
    if (!phase.files.length) continue;
    console.log(`[browser fixtures] ${phase.name}: ${phase.files.length} files, concurrency ${phase.concurrency}`);
    const result = await runBrowserFixturePhase(phase);
    // Child summaries remain verbatim; the final summary is the whole command.
    // Missing/aborted summaries fail closed and cannot look like a zero-test PASS.
    for (const key of keys) {
      const matches = [...(result.stdout ?? "").matchAll(new RegExp(`^ℹ ${key} (\\d+)\\s*$`, "gm"))];
      if (!matches.length) { console.error(`[browser fixtures] missing ${key} summary in ${phase.name}`); code = 1; break; }
      totals[key] += Number(matches.at(-1)[1]);
    }
    if (result.error) { console.error(result.error.message); code = 1; }
    if (code || result.timedOut || result.status !== 0) { code = 1; break; }
  }
  console.log("[browser fixtures] combined summary");
  for (const key of keys) console.log(`ℹ ${key} ${totals[key]}`);
  console.log(`ℹ duration_ms ${(performance.now() - start).toFixed(3)}`);
  process.exitCode = code;
}
