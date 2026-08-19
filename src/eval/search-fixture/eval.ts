import { FixtureRestaurantSearchApplication } from "./fixture-application.js";

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
    agentReachesAuthorizationCheckpoint: boolean;
  };
}

export async function runLocalSearchFixtureEval(): Promise<LocalSearchFixtureEvalResult> {
  const fullSearch = new FixtureRestaurantSearchApplication();
  const fullView = await fullSearch.createTask(COMPLETE_REQUEST);
  const completeRequestReturnsThreeCandidates =
    fullView.phase === "AWAITING_AUTHORIZATION" && fullView.candidates.length === 3;

  const incompleteSearch = new FixtureRestaurantSearchApplication();
  const incompleteView = await incompleteSearch.createTask("Find yakiniku in Shinjuku.");
  const incompleteRequestRequestsOnlyMissingFields =
    incompleteView.phase === "NEEDS_INPUT" &&
    incompleteView.missingRequiredFields.join(",") === "date,timeWindow,partySize";

  const agentReachesAuthorizationCheckpoint =
    fullView.selectedCandidateId === fullView.candidates[0]!.restaurant.id &&
    fullView.availability[fullView.selectedCandidateId]?.length === 1;

  const assertions = {
    completeRequestReturnsThreeCandidates,
    incompleteRequestRequestsOnlyMissingFields,
    agentReachesAuthorizationCheckpoint,
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
