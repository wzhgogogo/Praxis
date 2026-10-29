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
    for (const name of ["run-browser-fixtures.mjs", "test-filesystem-guard.mjs"])
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
