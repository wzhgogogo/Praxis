/** Deterministic guard shared by arch:check and its import-form regression. */
export function evaluatorImportViolation(importer: string, imported: string, statement: string): string | undefined {
  const productionJudgment = /^domains\/restaurant\/(?:read-grounding|read-assessment|action-validator)\.ts$/.test(imported)
    || imported === "infrastructure/browser/playwright-read-network-guard.ts"
    || /^integrations\/.*(?:public-query|read-network-policy)\.ts$/.test(imported);
  if (!/^eval\/restaurant\/agent-loop\/diagnostic-evaluator[^/]*\.ts$/.test(importer) || !productionJudgment) return undefined;
  if (/^(?:import|export)\s+type\b/.test(statement.trim())) return undefined;
  const named = statement.match(/^(?:import|export)\s*\{([^}]+)\}\s*from/);
  if (named && named[1]!.split(",").filter(part => part.trim()).every(part => /^\s*type\s+\w+(?:\s+as\s+\w+)?\s*$/.test(part))) return undefined;
  return "diagnostic evaluator must independently judge grounding/eligibility/network boundaries, not value-import production judgment modules";
}
