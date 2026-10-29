import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, resolve, basename } from "node:path";
import { performance } from "node:perf_hooks";

const root = fileURLToPath(new URL("..", import.meta.url));
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
  const result = spawnSync(process.execPath, ["--import", "./scripts/test-filesystem-guard.mjs", "--import", "tsx", "--test", "--test-reporter=spec", `--test-concurrency=${phase.concurrency}`, ...phase.files],
    { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 600_000 });
  process.stdout.write(result.stdout ?? ""); process.stderr.write(result.stderr ?? "");
  // Child summaries remain verbatim; the final summary is the whole command.
  // Missing/aborted summaries fail closed and cannot look like a zero-test PASS.
  for (const key of keys) {
    const matches = [...(result.stdout ?? "").matchAll(new RegExp(`^ℹ ${key} (\\d+)\\s*$`, "gm"))];
    if (!matches.length) { console.error(`[browser fixtures] missing ${key} summary in ${phase.name}`); code = 1; break; }
    totals[key] += Number(matches.at(-1)[1]);
  }
  if (result.error) { console.error(result.error.message); code = 1; }
  if (code || result.status !== 0) { code = 1; break; }
}
console.log("[browser fixtures] combined summary");
for (const key of keys) console.log(`ℹ ${key} ${totals[key]}`);
console.log(`ℹ duration_ms ${(performance.now() - start).toFixed(3)}`);
process.exitCode = code;
