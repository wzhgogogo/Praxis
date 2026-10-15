# 第一阶段校准标签（E1 用）

- 状态：draft / not integrated。标签由用户在 claude.ai 页面 "Phase 1 Run Labels" 中填写，复核者读回后写入本目录的 `labels.yaml`（尚未生成）。
- `run-inventory.json`：已提交产物中全部 31 次第一阶段 Live 尝试的事实摘要，由 `extract_runs.py` 从 summary/finish 文件生成（`python3 -I extract_runs.py <repo> <out>`）。
- `label-sheet.html`：标签页面源文件。20 次实际启动的运行进入标签集；11 次在网络预检或启动时失败，未进入。
- 复核者建议的标签依据 P1-F 签收复核、P1-G 复核和第一阶段签收记录，并按 Eval Skill 2.0 的结果类型改写；其中 5 项口径未定，由用户决定。
- 用途：E1 评测器离线重评第一阶段运行，与这里的人工标签逐次比对，报告一致率与全部分歧。原始 result.json 在实施者本机冻结工作树中，未提交；E1 需要它们。
