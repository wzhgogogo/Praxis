// Eval outer only. The frozen production runtime and source-data preflight are unchanged.
import {runLivePreflight} from 'file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/live-preflight.ts';

export const networkTargets = ['DEEPSEEK', 'GOOGLE', 'TABELOG'];
export function runOuterNetworkPreflight(input, dependencies = {}) {
  return runLivePreflight({runner:'SOURCE_STAGE_PROBE', targets:networkTargets, network:input.network},
    input.environment, {...dependencies, artifactDirectory:input.artifactDirectory});
}
