import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("browser fixture entry keeps G2 exclusive, retains every test and propagates a child failure", async () => {
  // Local construction, not website replay. A bounded held read makes overlap
  // observable. The oracle awaits process completion, not a machine-speed window.
  const directory = await mkdtemp(join(tmpdir(), "browser-fixture-order-"));
  const fixture = join(directory, "src/harness/browser");
  try {
    await mkdir(fixture, { recursive: true }); await mkdir(join(directory, "scripts"));
    await symlink(resolve("node_modules"), join(directory, "node_modules"), "dir");
    await writeFile(join(directory, "package.json"), '{"type":"module"}\n');
    for (const name of ["run-browser-fixtures.mjs", "browser-fixture-worker.mjs", "test-filesystem-guard.mjs"])
      await writeFile(join(directory, "scripts", name), await readFile(join("scripts", name)));
    const source = (name: string, fail: boolean) => `
      import test from 'node:test'; import assert from 'node:assert/strict';
      import {appendFileSync} from 'node:fs';
      const trace=new URL('../../../trace.jsonl',import.meta.url), name=${JSON.stringify(name)};
      test(name,async()=>{
        appendFileSync(trace,JSON.stringify({name,event:'start'})+'\\n');
        if(name==='G2')await new Promise(resolve=>setTimeout(resolve,1000));
        appendFileSync(trace,JSON.stringify({name,event:'end'})+'\\n');
        ${fail ? "assert.fail('constructed child failure');" : ""}
      });`;
    await writeFile(join(fixture, "dom-change.test.ts"), source("G2", false));
    await writeFile(join(fixture, "other-two.test.ts"), source("other-two", false));
    for (const fail of [false, true]) {
      await writeFile(join(fixture, "other-one.test.ts"), source("other-one", fail));
      await writeFile(join(directory, "trace.jsonl"), "");
      const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; // A real top-level test entry, not Node's recursive-test sentinel.
      const result = spawnSync(process.execPath, ["scripts/run-browser-fixtures.mjs"], { cwd: directory, env, encoding: "utf8", timeout: 60_000 });
      assert.equal(result.status, fail ? 1 : 0, result.stdout + result.stderr);
      const events = (await readFile(join(directory, "trace.jsonl"), "utf8")).trim().split("\n").map(line => JSON.parse(line) as { name: string; event: string });
      const end = events.findIndex(event => event.name === "G2" && event.event === "end");
      assert.ok(end >= 0);
      for (const name of ["other-one", "other-two"]) {
        assert.ok(events.findIndex(event => event.name === name && event.event === "start") > end, "remaining tests must not start during G2's held read");
        assert.equal(events.filter(event => event.name === name && event.event === "end").length, 1);
      }
      const count = [...result.stdout.matchAll(/^ℹ tests (\d+)$/gm)].at(-1)?.[1];
      assert.equal(count, "3", "the final summary includes both phases exactly once");
      assert.equal([...result.stdout.matchAll(/^ℹ pass (\d+)$/gm)].at(-1)?.[1], fail ? "2" : "3");
      assert.equal([...result.stdout.matchAll(/^ℹ fail (\d+)$/gm)].at(-1)?.[1], fail ? "1" : "0");
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("browser outer guard identifies unfinished files and retains buffered output", async t => {
  // Local construction, not the intermittent Linux failure or website replay.
  // Advance only the outer clock after genuine started/finished/output events;
  // neither browser deadlines nor a machine-speed wait defines this oracle.
  const directory = await mkdtemp(join(tmpdir(), "browser-fixture-timeout-"));
  try {
    const fixture = join(directory, "src/harness/browser");
    await mkdir(fixture, { recursive: true }); await mkdir(join(directory, "scripts"));
    await symlink(resolve("node_modules"), join(directory, "node_modules"), "dir");
    await writeFile(join(directory, "package.json"), '{"type":"module"}\n');
    for (const name of ["run-browser-fixtures.mjs", "browser-fixture-worker.mjs", "test-filesystem-guard.mjs"])
      await writeFile(join(directory, "scripts", name), await readFile(join("scripts", name)));
    const names = ["a-held", "b-finished", "c-held", "d-queued"];
    for (const name of names) await writeFile(join(fixture, name + ".test.ts"), `
      import test from 'node:test';
      test(${JSON.stringify(name + " lifecycle step")}, async t => {
        console.log(${JSON.stringify(name + " partial output")});
        ${name === "b-finished" ? "" : `await new Promise(resolve => {
          const timer = setInterval(() => {}, 1000);
          t.signal.addEventListener('abort', () => { clearInterval(timer); resolve(); }, {once:true});
        });`}
      });`);
    await writeFile(join(directory, "driver.mjs"), `
      import assert from 'node:assert/strict';
      import {runBrowserFixturePhase} from './scripts/run-browser-fixtures.mjs';
      const files=${JSON.stringify(names)}.map(name=>new URL('./src/harness/browser/'+name+'.test.ts',import.meta.url).pathname);
      let now=0, expire, output=false, finished=false, nextStarted=false, fired=false;
      const check=()=>{if(output&&finished&&nextStarted&&!fired){fired=true;now=600000;expire()}};
      const writeOut=process.stdout.write.bind(process.stdout), writeErr=process.stderr.write.bind(process.stderr);
      process.stdout.write=(chunk,...args)=>{const result=writeOut(chunk,...args);if(String(chunk).includes('a-held partial output'))output=true;queueMicrotask(check);return result};
      process.stderr.write=(chunk,...args)=>{
        const result=writeErr(chunk,...args), line=String(chunk);
        if(line.startsWith('[browser fixtures] {')) {
          const event=JSON.parse(line.slice('[browser fixtures] '.length));
          if(event.event==='FILE_END'&&event.file.endsWith('b-finished.test.ts'))finished=true;
          if(event.event==='FILE_START'&&event.file.endsWith('c-held.test.ts'))nextStarted=true;
        }
        queueMicrotask(check);return result;
      };
      const result=await runBrowserFixturePhase({name:'constructed timeout',concurrency:2,files},{
        now:()=>now,setTimeout:(callback,ms)=>{assert.equal(ms,600000);expire=callback;return 1},clearTimeout:()=>{},
      });
      assert.equal(fired,true);assert.equal(result.timedOut,true);process.exitCode=1;
    `);
    const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(process.execPath, ["driver.mjs"], { cwd: directory, env, encoding: "utf8", timeout: 60_000 });
    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /a-held partial output/);
    assert.match(result.stdout, /b-finished partial output/, "ordered output behind the held file must survive timeout cleanup");
    const rows = result.stderr.split("\n").filter(line => line.startsWith("[browser fixtures] {"))
      .map(line => JSON.parse(line.slice("[browser fixtures] ".length)) as { event: string; file?: string; elapsedMs?: number; limitMs?: number; lastObservedTests?: string[]; notStarted?: string[] });
    assert.equal(rows.filter(row => row.event === "OUTER_TIMEOUT").length, 1);
    assert.equal(rows.find(row => row.event === "OUTER_TIMEOUT")?.limitMs, 600_000);
    const unfinished = rows.filter(row => row.event === "UNFINISHED");
    assert.deepEqual(unfinished.map(row => row.file).sort(), ["src/harness/browser/a-held.test.ts", "src/harness/browser/c-held.test.ts"]);
    assert.ok(unfinished.every(row => row.elapsedMs === 600_000));
    assert.ok(unfinished.find(row => row.file?.endsWith("a-held.test.ts"))?.lastObservedTests?.includes("a-held lifecycle step"));
    assert.deepEqual(rows.find(row => row.event === "PHASE_PROGRESS")?.notStarted, ["src/harness/browser/d-queued.test.ts"]);
    t.diagnostic(JSON.stringify({ mode: "LOCAL_CONSTRUCTION_INJECTED_OUTER_CLOCK", unfinished,
      progress: rows.find(row => row.event === "PHASE_PROGRESS"), heldAndBufferedFinishedOutputRetained: true }));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
