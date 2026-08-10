import { LocalRestaurantSearchApplication } from "../application/local-restaurant-search.js";

const COMPLETE_REQUEST =
  "Tonight at 7pm near Shinjuku for two, yakiniku, around 5000 yen each.";

export interface LocalSearchFixtureEvalResult {
  mode: "FIXTURE";
  cases: number;
  passed: number;
  failedCaseIds: string[];
  assertions: {
    completeRequestReturnsThreeCandidates: boolean;
    incompleteRequestRequestsOnlyMissingFields: boolean;
    selectionStopsBeforeAuthorization: boolean;
  };
}

export async function runLocalSearchFixtureEval(): Promise<LocalSearchFixtureEvalResult> {
  const fullSearch = new LocalRestaurantSearchApplication();
  const fullView = await fullSearch.createTask(COMPLETE_REQUEST);
  const completeRequestReturnsThreeCandidates =
    fullView.phase === "AWAITING_SELECTION" && fullView.candidates.length === 3;

  const incompleteSearch = new LocalRestaurantSearchApplication();
  const incompleteView = await incompleteSearch.createTask("Find yakiniku in Shinjuku.");
  const incompleteRequestRequestsOnlyMissingFields =
    incompleteView.phase === "NEEDS_INPUT" &&
    incompleteView.missingRequiredFields.join(",") === "date,timeWindow,partySize";

  const selectionView = await fullSearch.selectCandidate(
    fullView.taskId,
    fullView.candidates[0]!.restaurant.id,
    fullView.taskVersion,
  );
  const selectionStopsBeforeAuthorization =
    selectionView.phase === "AWAITING_AUTHORIZATION" &&
    selectionView.selectedCandidateId === fullView.candidates[0]!.restaurant.id;

  const assertions = {
    completeRequestReturnsThreeCandidates,
    incompleteRequestRequestsOnlyMissingFields,
    selectionStopsBeforeAuthorization,
  };
  const failedCaseIds = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([id]) => id);
  return {
    mode: "FIXTURE",
    cases: Object.keys(assertions).length,
    passed: Object.keys(assertions).length - failedCaseIds.length,
    failedCaseIds,
    assertions,
  };
}
