# 第一轮冻结校准输出

状态：superseded calibration diagnostic / exposed development evidence，非 Clean Baseline。

源码 `355de64`；22份自动输出全部保存并核对SHA后，才首次读取人工标签。`comparison/`为实际首次比对：结果类型17/22、交付7/8、正常S0 7/20、4个评测器分类遗漏，退出码1。标签没有进入Evaluator。

终态原因和如实有界范围的4个评测器遗漏随后以真实产物红绿回归修复；本目录保留，不重标、不覆盖。后续corrected目录才是修复后重评。KF-H002损坏Gold和S0证明缺口未被改成通过。
