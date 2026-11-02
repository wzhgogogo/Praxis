/** Reviewer-confirmed capability modules, relative to src. Transports and pure page parsers are excluded. */
export const ASSEMBLY_CAPABILITY_CORES = [
  "integrations/restaurant-facts/model-page-question.ts",
  "integrations/restaurant-facts/page-question-reader.ts",
  "integrations/restaurant-facts/page-question-read-budget.ts",
  "integrations/restaurant-facts/fact-page-binding.ts",
  "integrations/restaurant-facts/live-restaurant-facts.ts",
  "integrations/restaurant-facts/google-then-website-facts.ts",
  "integrations/restaurant-facts/google-listed-website-facts.ts",
  "integrations/restaurant-facts/native-source-facts.ts",
  "integrations/restaurant-facts/model-fact-judgment.ts",
  "integrations/restaurant-facts/model-source-facts.ts",
  "integrations/google/google-places-restaurant-search.ts",
  "integrations/restaurant-search/native-restaurant-search.ts",
  "integrations/restaurant-search/native-read-composition.ts",
  "integrations/restaurant-search/discovery-retrieval-planner.ts",
  "integrations/restaurant-search/named-source-query.ts",
  "integrations/restaurant-availability/live-browser-availability.ts",
  "integrations/restaurant-availability/availability-source-resolver.ts",
  "integrations/restaurant-availability/native-outlet-continuity.ts",
  "integrations/tabelog/tabelog-browser-availability.ts",
  "integrations/tablecheck/tablecheck-browser-availability.ts",
  "integrations/restaurant-availability/outlet-identity.ts",
  "integrations/restaurant-identity/detail-identity-fields.ts",
  "integrations/tabelog/tabelog-entity-resolver.ts",
  "integrations/tablecheck/tablecheck-entity-resolver.ts",
  "integrations/tabelog/tabelog-booking-handoff-reader.ts",
] as const;
const assemblyCores: ReadonlySet<string> = new Set(ASSEMBLY_CAPABILITY_CORES);

export interface AssemblyBypassAllowance {
  file: string;
  core: string;
  category: "组件评测";
  proves: string;
  cannotSignOff: string;
}

/** This is test configuration, never a production capability or lifecycle policy. */
export function parseAssemblyBypassAllowlist(value: unknown): readonly AssemblyBypassAllowance[] {
  function object(input: unknown, keys: readonly string[], context: string): Record<string, unknown> {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError(`${context}: expected object`);
    const row = input as Record<string, unknown>;
    const unknown = Object.keys(row).filter(key => !keys.includes(key));
    if (unknown.length) throw new TypeError(`${context}: unknown keys ${unknown.join(", ")}`);
    if (keys.some(key => !Object.hasOwn(row, key))) throw new TypeError(`${context}: missing required keys`);
    return row;
  }
  const root = object(value, ["revision", "entries"], "assembly allowlist");
  if (root.revision !== 1 || !Array.isArray(root.entries)) throw new TypeError("assembly allowlist: revision 1 and entries array required");
  const pairs = new Set<string>();
  return root.entries.map((value, index) => {
    const context = `assembly allowlist entry ${index}`;
    const row = object(value, ["file", "core", "category", "proves", "cannotSignOff"], context);
    if (typeof row.file !== "string" || !/^src\/eval\/(?:[\w.-]+\/)*[\w.-]+\.(?:ts|mjs)$/.test(row.file)
      || row.file.split("/").some(part => part === "." || part === "..")) {
      throw new TypeError(`${context}: file must be a canonical src/eval TS or MJS path`);
    }
    if (typeof row.core !== "string" || !row.core.startsWith("src/") || !assemblyCores.has(row.core.slice(4))) {
      throw new TypeError(`${context}: core must be a reviewer-confirmed capability module`);
    }
    if (row.category !== "组件评测") throw new TypeError(`${context}: category must be 组件评测`);
    if (typeof row.proves !== "string" || !row.proves.trim() || typeof row.cannotSignOff !== "string" || !row.cannotSignOff.trim()) {
      throw new TypeError(`${context}: proves and cannotSignOff must be nonempty strings`);
    }
    const key = `${row.file} -> ${row.core}`;
    if (pairs.has(key)) throw new TypeError(`${context}: duplicate file/core pair ${key}`);
    pairs.add(key);
    return { file: row.file, core: row.core, category: row.category, proves: row.proves, cannotSignOff: row.cannotSignOff };
  });
}

function typeOnlyImport(statement: string): boolean {
  // A default value binding may itself be named "type" (import type from "x").
  if (/^(?:import|export)\s+type\b\s*(?:\{|\*(?:\s+as\s+\w+)?\s+from\b|\w+\s+from\b)/.test(statement.trim())) return true;
  const named = statement.match(/^(?:import|export)\s*\{([^}]+)\}\s*from/);
  const names = named?.[1]!.split(",").filter(part => part.trim());
  return Boolean(names?.length && names.every(part => /^\s*type\s+\w+(?:\s+as\s+\w+)?\s*$/.test(part)));
}

export function assemblyCoreValueImport(importer: string, imported: string, statement: string): boolean {
  return importer.startsWith("eval/") && assemblyCores.has(imported) && !(importer.endsWith(".ts") && typeOnlyImport(statement));
}

/** Deterministic guard shared by arch:check and its import-form regression. */
export function evaluatorImportViolation(importer: string, imported: string, statement: string,
  allowlist: readonly AssemblyBypassAllowance[] = []): string | undefined {
  if (assemblyCoreValueImport(importer, imported, statement)
    && !allowlist.some(entry => entry.file === `src/${importer}` && entry.core === `src/${imported}`)) {
    return "eval assembly gate: value-import capability only through live-read-assembly; a file/core component exception is required for component evaluation";
  }
  if (/^(?:core|application|domains|infrastructure|integrations|server|web)\//.test(importer) && !importer.endsWith(".test.ts")
    && (/^eval\/.*(?:discovery-probe|witness)[^/]*\.(?:ts|json)$/.test(imported) || /(?:\.eval-artifacts|\.eval-private)\/.*witness/i.test(imported))) {
    return "production must not depend on eval witnesses, probe metrics or other evaluation modules";
  }
  const productionJudgment = /^domains\/restaurant\/(?:read-grounding|read-assessment|action-validator|condition-states|price-facts)\.ts$/.test(imported)
    || /^integrations\/.*(?:page-parser|source-price-facts)\.ts$/.test(imported)
    || imported === "infrastructure/browser/playwright-read-network-guard.ts"
    || /^integrations\/.*(?:public-query|read-network-policy)\.ts$/.test(imported);
  if (!/^eval\/restaurant\/agent-loop\/diagnostic-evaluator[^/]*\.ts$/.test(importer) || !productionJudgment) return undefined;
  if (typeOnlyImport(statement)) return undefined;
  return "diagnostic evaluator must independently judge grounding/eligibility/network boundaries, not value-import production judgment modules";
}
