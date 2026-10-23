import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("offline test file reads reject an existing external file and allow repository inputs and self-created temporary files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-external-read-control-"));
  const external = join(directory, "existing.txt");
  await writeFile(external, "outside the child test's repository and temporary files");
  try {
    const child = spawnSync(process.execPath, ["--import", "./scripts/test-filesystem-guard.mjs", "--input-type=module", "-e", `
      import assert from 'node:assert/strict';
      import fs from 'node:fs';
      import fsp from 'node:fs/promises';
      import {tmpdir} from 'node:os';
      import {join} from 'node:path';
      const external=process.argv[1], denied={code:'ERR_TEST_READ_OUTSIDE_REPOSITORY'};
      assert.ok(fs.existsSync(external), 'negative control must really exist');
      assert.throws(()=>fs.readFileSync(external),denied);
      await assert.rejects(fsp.readFile(external),denied);
      assert.throws(()=>fs.createReadStream(external),denied);
      assert.throws(()=>fs.openSync(external,'r'),denied);
      await assert.rejects(fsp.open(external,'r'),denied);
      assert.match(fs.readFileSync('package.json','utf8'),/praxis-zhixing/);
      const own=await fsp.mkdtemp(join(tmpdir(),'praxis-owned-read-control-'));
      try { const path=join(own,'generated.txt');await assert.rejects(fsp.readFile(path),{code:'ENOENT'});await fsp.writeFile(path,'generated');assert.equal(await fsp.readFile(path,'utf8'),'generated'); }
      finally { await fsp.rm(own,{recursive:true,force:true}); }
      console.log('file-read boundary controls passed');
    `, external], { encoding: "utf8" });
    assert.equal(child.status, 0, child.stdout + child.stderr);
    assert.match(child.stdout, /file-read boundary controls passed/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
