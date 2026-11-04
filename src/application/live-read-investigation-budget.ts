/**
 * Shared ceiling for an explicitly authorized Live Read-only debugging run.
 *
 * The local Web path and frozen H001 are both real consumers. Keeping this
 * in one place prevents a Web acceptance run from silently receiving a
 * smaller search budget than the diagnostic it is meant to reproduce. This is
 * not a product-default quota or an open-ended cost authorization.
 */
export const LIVE_READ_DEBUG_INVESTIGATION_BUDGET = {
  maxModelCalls: 50,
  maxDiscoveryCandidates: 10,
  /** One cumulative run ceiling: named-place resolution, discovery, and Details all count. */
  maxGoogleRequests: 100,
  /** One bounded Google/structured read; separate from the 20-minute whole investigation cap. */
  maxStructuredReadMs: 30_000,
  /** Per source-pack browser session ceiling; source selection belongs to the Pack plan. */
  maxAvailabilitySourceBrowserSessions: 3,
  /** Per source-pack candidate-match ceiling; adapters apply it to their observed list. */
  maxAvailabilitySourceCandidateMatches: 3,
  maxAvailabilityReads: 20,
  maxBrowserRuntimeFallbacks: 1,
  maxBrowserModelCallsPerCandidate: 20,
  /** Browser-only sublimit; the outer run-scoped gateway separately caps all model purposes at fifty. */
  maxBrowserModelCallsTotal: 120,
  maxBrowserOperationsPerCandidate: 80,
  maxFactModelCallsPerCandidate: 4,
  maxFactBrowserOperationsPerCandidate: 24,
  maxFactBrowserMs: 45_000,
  maxFactProviderMs: 30_000,
  /** Keeps one outlet/provider path from consuming the entire Live deadline. */
  maxCandidateBrowserMs: 90_000,
  /** Independent provider window within the cumulative candidate ceiling. */
  maxProviderBrowserMs: 45_000,
  /** Whole read budget. Candidate/provider limits retain time for a legal alternate. */
  maxAutomaticBrowserMs: 500_000,
  maxAgentSteps: 30,
  maxRejectedActions: 5,
} as const;

/** Overrides are explicit run/test configuration, never a second default. */
export type LiveReadInvestigationBudget = { [Key in keyof typeof LIVE_READ_DEBUG_INVESTIGATION_BUDGET]: number };
