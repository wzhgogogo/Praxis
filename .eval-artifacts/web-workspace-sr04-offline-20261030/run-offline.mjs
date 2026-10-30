import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync, spawnSync} from "node:child_process";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const folder = resolve(".eval-artifacts/web-workspace-sr04-offline-20261030");
const output = resolve(folder, "execution");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(readFileSync(resolve(folder, "freeze.json"), "utf8"));
for (const file of manifest.files) assert.equal(hash(readFileSync(file.path)), file.sha256, file.path);
assert.equal(execFileSync("git", ["status", "--porcelain"], {encoding:"utf8"}), "", "Run only on a committed clean tree");
mkdirSync(output, {recursive:true});
writeFileSync(resolve(output, "started.json"), JSON.stringify({
  sourceCommit:execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim(),
  at:new Date().toISOString(), mode:"OFFLINE_SAVED_BODY_REPLAY", plannedFakeFetchCalls:20,
  maximumAPIRequests:0, manifestSHA256:hash(readFileSync(resolve(folder, "freeze.json"))),
}, null, 2) + "\n", {flag:"wx"});
// Explicit environment contains no provider secret; no .env loading option.
const env = {PATH:process.env.PATH, TMPDIR:process.env.TMPDIR, LANG:"en_US.UTF-8"};
for (const [script, ...args] of [["replay.mjs", "unguarded"], ["replay.mjs", "guarded"], ["score.mjs"]]) {
  const run = spawnSync(process.execPath, ["--import", "tsx", resolve(folder, script), ...args], {env, encoding:"utf8", timeout:60000});
  writeFileSync(resolve(output, (args[0] ?? "score") + ".log"), run.stdout + run.stderr, {flag:"wx"});
  process.stdout.write(run.stdout);
  process.stderr.write(run.stderr);
  assert.equal(run.status, 0, script + ": stop on parse or target failure");
}
for (const file of manifest.files) assert.equal(hash(readFileSync(file.path)), file.sha256, file.path);
writeFileSync(resolve(output, "finished.json"), JSON.stringify({
  at:new Date().toISOString(), completedFakeFetchCalls:20, realAPIRequests:0,
  Google:0, sourceGET:0, Live:0, Holdout:0, frozenFilesUnchanged:manifest.files.length,
}, null, 2) + "\n", {flag:"wx"});
