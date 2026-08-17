import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(repositoryRoot, "src");

async function typescriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return typescriptFiles(path);
      return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

function sourcePath(path: string): string {
  return relative(sourceRoot, path).split(sep).join("/");
}

function importedSourcePath(importer: string, specifier: string): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
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
    importer === "domains/restaurant/decision-kernel.ts" &&
    (imported.startsWith("infrastructure/") ||
      imported.startsWith("integrations/") ||
      imported.startsWith("core/model/"))
  ) {
    return "Restaurant Decision Kernel must not depend on model, tool, or adapter implementations";
  }
  return undefined;
}

const failures: string[] = [];
for (const file of await typescriptFiles(sourceRoot)) {
  const importer = sourcePath(file);
  const source = await readFile(file, "utf8");
  const imports = source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g);
  for (const match of imports) {
    const imported = importedSourcePath(file, match[1]!);
    if (!imported) continue;
    const reason = violation(importer, imported);
    if (reason) failures.push(`${importer} -> ${imported}: ${reason}`);
  }
}

if (failures.length > 0) {
  console.error(["Architecture check failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("Architecture check passed: 0 forbidden source dependencies");
}
