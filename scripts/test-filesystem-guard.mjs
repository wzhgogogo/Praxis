// Loaded before tsx in both offline test commands. This checks actual data I/O,
// including paths obtained from saved JSON, rather than just source literals.
import fs from "node:fs";
import fsp from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = fs.realpathSync.native;
const inside = (path, directory) => path === directory || path.startsWith(directory + sep);
const dependencyRoots = [];
for (const entry of fs.readdirSync(resolve(root, "node_modules"))) {
  if (entry.startsWith(".")) continue;
  const path = resolve(root, "node_modules", entry);
  if (entry.startsWith("@")) {
    for (const name of fs.readdirSync(path)) dependencyRoots.push(canonical(resolve(path, name)));
  } else dependencyRoots.push(canonical(path));
}
const temporaryRoots = new Set();
const productTest = process.argv.some(arg => /src\/(?:integrations\/(?:tabelog|restaurant-search)\/|application\/restaurant-presentation-evidence\.test|infrastructure\/browser\/local-playwright-chromium\.test)/.test(arg));
// tsx's optional shared cache is outside the repository and is not fixture input.
process.env.TSX_DISABLE_CACHE = "1";

function checked(path) {
  if (typeof path === "number") return path; // The descriptor's open was checked.
  const value = path instanceof URL ? fileURLToPath(path) : Buffer.isBuffer(path) ? path.toString() : path;
  if (typeof value !== "string") return path; // Let Node report invalid arguments.
  const absolute = resolve(value);
  let real;
  try { real = canonical(absolute); } catch { real = absolute; }
  if (productTest && (inside(absolute, resolve(root, ".eval-artifacts")) || inside(real, resolve(root, ".eval-artifacts")))) {
    throw Object.assign(new Error(`Product tests must use module fixtures, not eval artifacts: ${absolute}`), { code: "ERR_TEST_PRODUCT_EVAL_ARTIFACT" });
  }
  if (inside(real, root) || dependencyRoots.some(directory => inside(real, directory)) || [...temporaryRoots].some(directory => inside(real, directory))) return path;
  throw Object.assign(new Error(`Test data read outside repository or a test-created temporary directory: ${absolute}`), { code: "ERR_TEST_READ_OUTSIDE_REPOSITORY" });
}

for (const name of ["readFile", "readFileSync", "createReadStream"]) {
  const original = fs[name];
  fs[name] = function(path, ...args) { return original.call(this, checked(path), ...args); };
}
for (const name of ["readFile"]) {
  const original = fsp[name];
  fsp[name] = async function(path, ...args) { return original.call(this, checked(path), ...args); };
}
// Opening files covers read streams/FileHandles and numeric-descriptor reads.
for (const name of ["open", "openSync"]) {
  const original = fs[name];
  fs[name] = function(path, ...args) {
    const flags = args[0];
    if (typeof flags !== "string" || flags.includes("r") || flags.includes("+")) checked(path);
    return original.call(this, path, ...args);
  };
}
const open = fsp.open;
fsp.open = async function(path, flags, ...args) {
  if (typeof flags !== "string" || flags.includes("r") || flags.includes("+")) checked(path);
  return open.call(this, path, flags, ...args);
};

const mkdtempSync = fs.mkdtempSync;
fs.mkdtempSync = function(...args) {
  const path = mkdtempSync.apply(this, args);
  temporaryRoots.add(canonical(path));
  return path;
};
const mkdtemp = fsp.mkdtemp;
fsp.mkdtemp = async function(...args) {
  const path = await mkdtemp.apply(this, args);
  temporaryRoots.add(canonical(path));
  return path;
};
const mkdtempCallback = fs.mkdtemp;
fs.mkdtemp = function(...args) {
  const callback = args.pop();
  args.push((error, path) => {
    if (!error) temporaryRoots.add(canonical(path));
    callback(error, path);
  });
  return mkdtempCallback.apply(this, args);
};
syncBuiltinESMExports();
