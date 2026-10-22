// Eval-only Runner hook. The normal path delegates unchanged; holdout grading waits for wording review.
import {evaluateArtifactAfterFinish as original} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';
export const evaluateArtifactAfterFinish:typeof original=async (...args)=>process.env.CHECKPOINT_C_DEFER_EVALUATION==='1'?{}:original(...args);
