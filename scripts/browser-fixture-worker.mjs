import { writeSync } from "node:fs";
import { run } from "node:test";
import { spec } from "node:test/reporters";
import { pipeline } from "node:stream/promises";

const controller = new AbortController();
// Await stream completion after abort rather than process.exit(), which can
// discard output ordered behind the unfinished file.
process.on("SIGTERM", () => controller.abort(new Error("Browser phase outer guard reached")));
const tests = run({ files: process.argv.slice(3), concurrency: Number(process.argv[2]), signal: controller.signal,
  execArgv: ["--import", "./scripts/test-filesystem-guard.mjs", "--import", "tsx"] });
for (const type of ["test:dequeue", "test:complete"]) tests.on(type, data => {
  if (!data.file) return;
  const file = data.nesting === 0 && data.name === data.file;
  const start = type === "test:dequeue";
  writeSync(3, JSON.stringify({ event: file ? (start ? "FILE_START" : "FILE_END") : (start ? "TEST_START" : "TEST_END"),
    file: data.file, id: `${data.line}:${data.column}:${data.name}`, name: data.name,
    ...(file && !start ? { passed: data.details.passed } : {}) }) + "\n");
});
let summary;
tests.on("test:summary", data => { if (!data.file) summary = data; });
await pipeline(tests, new spec(), process.stdout);
process.exitCode = summary?.success ? 0 : 1;
