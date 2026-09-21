/**
 * Shared ceiling for an explicitly authorized Live Read-only debugging run.
 *
 * The local Web path and frozen H001 are both real consumers. Keeping this
 * in one place prevents a Web acceptance run from silently receiving a
 * smaller search budget than the diagnostic it is meant to reproduce. This is
 * not a product-default quota or an open-ended cost authorization.
 */
export const LIVE_READ_DEBUG_INVESTIGATION_BUDGET = {
  /** One cumulative run ceiling: named-place resolution, discovery, and Details all count. */
  maxGoogleRequests: 100,
  /** One bounded Google/structured read; separate from the 20-minute whole investigation cap. */
  maxStructuredReadMs: 30_000,
  maxTableCheckBrowserSessions: 3,
  maxTabelogBrowserSessions: 3,
  maxTabelogCandidateMatches: 3,
  maxAvailabilityReads: 20,
  maxBrowserRuntimeFallbacks: 1,
  maxBrowserModelCallsPerCandidate: 20,
  maxBrowserModelCallsTotal: 120,
  maxBrowserOperationsPerCandidate: 80,
  /** Keeps one outlet/provider path from consuming the entire Live deadline. */
  maxCandidateBrowserMs: 60_000,
  /** A single provider must leave time for a source-supported alternate. */
  maxProviderBrowserMs: 30_000,
  maxAutomaticBrowserMs: 20 * 60_000,
  maxAgentSteps: 30,
  maxRejectedActions: 5,
} as const;
