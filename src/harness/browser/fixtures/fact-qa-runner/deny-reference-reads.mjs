// Execution-phase canary: reference answers belong only to the later scorer.
import fs from "node:fs";
import fsp from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
function check(path) {
  if (/(?:evaluator-only|answers\.(?:reviewed|candidate)\.json|references\.json)/.test(String(path))) throw new Error("RUNNER_REFERENCE_READ_FORBIDDEN");
}
for (const name of ["readFile", "readFileSync", "createReadStream", "open", "openSync"]) {
  const original = fs[name]; fs[name] = function(path, ...args) { check(path); return original.call(this, path, ...args); };
}
for (const name of ["readFile", "open"]) {
  const original = fsp[name]; fsp[name] = function(path, ...args) { check(path); return original.call(this, path, ...args); };
}
syncBuiltinESMExports();
