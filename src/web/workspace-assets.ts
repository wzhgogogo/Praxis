import { LANDING_BACKGROUND_SCRIPT } from "./landing-background.js";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const source = fileURLToPath(new URL("./browser/", import.meta.url));
const assets = new Map<string, string>([["/assets/landing.js", LANDING_BACKGROUND_SCRIPT]]);
// Built servers serve emitted ES modules. tsx entry points compile the same
// modules once with the repository's existing TypeScript compiler.
const temporary = existsSync(join(source, "entry.js")) ? undefined : mkdtempSync(join(tmpdir(), "praxis-web-"));
try {
  if (temporary) {
    const config = fileURLToPath(new URL("../../tsconfig.web.json", import.meta.url));
    execFileSync(process.execPath, [join(require.resolve("typescript/package.json"), "../lib/tsc.js"), "-p", config, "--noEmit", "false", "--outDir", temporary]);
  }
  for (const file of readdirSync(temporary ?? source)) {
    if (file.endsWith(".js")) assets.set("/assets/workspace/" + file, readFileSync(join(temporary ?? source, file), "utf8"));
  }
} finally {
  if (temporary) rmSync(temporary, { recursive: true });
}
export function workspaceAsset(path: string): string | undefined {
  return assets.get(path);
}
