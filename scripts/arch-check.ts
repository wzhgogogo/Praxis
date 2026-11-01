import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { assemblyCoreValueImport, evaluatorImportViolation, parseAssemblyBypassAllowlist } from "../src/eval/shared/evaluator-import-rule.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(repositoryRoot, "src");

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return entry.isFile() && (entry.name.endsWith(".ts") || sourcePath(path).startsWith("eval/") && entry.name.endsWith(".mjs")) ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

function sourcePath(path: string): string {
  return relative(sourceRoot, path).split(sep).join("/");
}

function importedSourcePath(importer: string, specifier: string): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  // TS sources use .js specifiers; literal .mjs and .ts targets retain their identity.
  const resolved = resolve(dirname(importer), specifier).replace(/\.js$/, ".ts");
  const path = sourcePath(resolved);
  return path.startsWith("../") ? undefined : path;
}

function violation(importer: string, imported: string): string | undefined {
  if (importer.startsWith("core/") && !imported.startsWith("core/")) {
    return "core must not depend on concrete application, domain, infrastructure, web, harness, or eval code";
  }

  const domainMatch = /^domains\/([^/]+)\//.exec(importer);
  const importedDomainMatch = /^domains\/([^/]+)\//.exec(imported);
  if (domainMatch && importedDomainMatch && domainMatch[1] !== importedDomainMatch[1]) {
    return "one domain must not depend on another domain";
  }

  if (
    importer.startsWith("web/") &&
    (imported.startsWith("infrastructure/") || imported.startsWith("integrations/"))
  ) {
    return "web/client code must not import provider or adapter implementations";
  }

  if (
    importer === "domains/restaurant/semantic-compiler.ts" &&
    (imported.startsWith("infrastructure/") ||
      imported.startsWith("integrations/") ||
      imported.startsWith("core/model/"))
  ) {
    return "Restaurant Semantic Compiler must remain deterministic and provider-independent";
  }

  if (
    importer === "domains/restaurant/action-validator.ts" &&
    (imported.startsWith("infrastructure/") ||
      imported.startsWith("integrations/") ||
      imported.startsWith("core/model/"))
  ) {
    return "Restaurant Action Validator must not depend on model, tool, or adapter implementations";
  }
  return undefined;
}

const failures: string[] = [];
let allowlist: ReturnType<typeof parseAssemblyBypassAllowlist>;
try {
  allowlist = parseAssemblyBypassAllowlist(JSON.parse(await readFile(resolve(sourceRoot, "eval/assembly-bypass-allowlist.json"), "utf8")));
} catch (error) {
  console.error(`Architecture check failed: invalid src/eval/assembly-bypass-allowlist.json: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
const observedAssemblyImports = new Set<string>();
for (const file of await sourceFiles(sourceRoot)) {
  const importer = sourcePath(file);
  const source = await readFile(file, "utf8");
  const imports = source.matchAll(/((?:import|export)\s+(?:(?:type\s+)?[\w*{},\s]+\s+from\s*)?|(?:import|require)\s*\(\s*)["']([^"']+)["']/g);
  for (const match of imports) {
    const imported = importedSourcePath(file, match[2]!);
    if (imported && assemblyCoreValueImport(importer, imported, match[0])) observedAssemblyImports.add(`src/${importer} -> src/${imported}`);
    const probeBoundary = evaluatorImportViolation(importer, imported ?? match[2]!, match[0], allowlist);
    if (probeBoundary) { failures.push(`${importer} -> ${imported ?? match[2]!}: ${probeBoundary}`); continue; }
    if (!imported) continue;
    const reason = violation(importer, imported);
    if (reason) failures.push(`${importer} -> ${imported}: ${reason}`);
  }
}
for (const entry of allowlist) {
  const pair = `${entry.file} -> ${entry.core}`;
  if (!observedAssemblyImports.has(pair)) failures.push(`${pair}: stale assembly component exception; no matching value import remains`);
}

if (failures.length > 0) {
  console.error(["Architecture check failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("Architecture check passed: 0 forbidden source dependencies");
}
