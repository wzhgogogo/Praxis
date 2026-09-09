/**
 * Shared ceiling for an authorized, full Live Read-only investigation.
 *
 * The local Web path and frozen H001 are both real consumers. Keeping this
 * in one place prevents a Web acceptance run from silently receiving a
 * smaller search budget than the diagnostic it is meant to reproduce.
 */
export const LIVE_READ_INVESTIGATION_BUDGET = {
  maxGoogleSearches: 3,
  maxGooglePlaceDetails: 0,
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
  maxAutomaticBrowserMs: 20 * 60_000,
  maxAgentSteps: 30,
  maxRejectedActions: 5,
} as const;
