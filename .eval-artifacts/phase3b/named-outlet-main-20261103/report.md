# 名称匹配main合入验证

Status: draft / not integrated；离线，不是Live。

复核通过源码 ca18d02b5b2b443027fb0759b63b6aeefa44c376，最新远端main d4d8ea33a4cf32b01601474f02ad89c538bf3f69，代码同步无冲突/无变化；A/B保护文件无新增改动，State25/TaskDefinition23不再递增。保留D1/D3、原八控制及来源名规则。

从origin/main合入候选，先冻结再执行五门禁、严格G2、原9帧及新7帧独立核验，每项前后净树。真实调用0、不读.env。结果待gates.json。

共享账本保留原628行，并集A5912的67条新增及C零调用记录，现696行；A390额度快照另存、main290上限不变，不覆盖任何已有行。累计数含A新Live/模型/GET，不是C新增调用。D6 S0由用户另行指令在下一分支修复，不能把本合入报告当作其修复。

全绿后按用户批准推远端main并ls-remote核对；不动其他主检出。
