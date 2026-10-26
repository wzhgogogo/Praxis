# 3b A批次1工作分支

不合main。各项均从最新main cc127320独立开分支，公共ADR0046原字节相同；共享账本并集合并。

- G2：codex/feat-phase3b-dom-change，42dc6ef1d93ccdb3b83bff6a5717c2791d4a786c。[报告](https://github.com/wzhgogogo/Praxis/blob/42dc6ef1d93ccdb3b83bff6a5717c2791d4a786c/.eval-artifacts/phase3b/g2-dom-change/report.md)。
- G1：codex/feat-phase3b-qa-candidates，8bd6bb8ce07bbed5b6b4f06b60b4e93772729c41。[问题](https://github.com/wzhgogogo/Praxis/blob/8bd6bb8ce07bbed5b6b4f06b60b4e93772729c41/.eval-artifacts/phase3b/g1-qa/questions.json)；answers.candidate.json仅复核者看，B在实现期间不得读取，包括内含答案的prepare-candidates.py。全部CANDIDATE，复核前非验收Gold。
- 回放：codex/fix-phase3b-recorded-reference-replay。临时ref机制已修，整份旧录制版本阻断仍未解除；本分支最终SHA以推送ls-remote回执为准。
