# 3b 对话A批次2交付记录

Evidence status：current executable / exposed offline regression；不代表Live验收。开始时间2026-10-27T02:31:15.166850+01:00（Europe/Vienna CET）。全部真实调用0，不读取.env。

## 第1节：ADR去重与合入

用户明确ADR由B统一维护为Proposed。本分支删除A的0046文件与Accepted说法，Validation由B按用户安排合并；不改产品或共享版本。G2从origin/main cc127320重放，干净候选ee0c391d五门禁全绿：typecheck0.522s、arch0.202s、默认1101/1101 28.980s、build0.454s、Chromium166/166 105.689s；额外test:dom-change 4/4通过、逐项前后净树。原36份冻结输入SHA一致。已具备合入main条件，实际推送SHA由后续回执补记。其余阶段随执行追加。

## 旧F5回放状态

用户结束旧整包回放：只在旧版本重放旧决策证明旧代码。原始记录/失败评价原样保留；3b第一次Live改用当前版本新录制，届时落实严格网络回放＋独立DOM诊断模式(c)，本批不继续旧整包。

### G2已合入

工作分支与main已推送并由ls-remote核对为5f621be3185ef784a7b5bfc142465ccd9d725023；五门禁/额外G2收据见g2-integration。

### 回放重放

回放分支已重放到main/5f621be3，文档两边记录保留、预算按id并集（去重后4条，新增本批条目后5条），源码四文件与独立复核b7e8af14原字节一致。重复ADR删除。6995ebcd五门禁全绿：typecheck 0.460s、arch 0.199s、默认1104/1104 28.521s、build 0.402s、Chromium167/167 106.661s；逐项前后status为空。G2 36份与回放43份冻结输入SHA全部一致；四份源码与b7e8af14相同。收据及压缩原始日志见replay-integration/gates。旧F5仅保留既有严格合同负例随默认测试，不追加整包研究或额外原始回放运行。
