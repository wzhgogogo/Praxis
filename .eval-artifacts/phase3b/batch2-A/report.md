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

### 回放已合入

main与工作分支已推送f465ada03f9dd19ec5e71698843d2f63b4735fa6，ls-remote一致。

## 第2节：G1复核包

见g1-qa/report.md末章：25确认、9候选；34题英文/中文对照、5自然错页/run场景、3日文题和1评论陷阱，原候选文件保持。两映射红绿完成；0d26174d五门禁1110/168全绿、逐项前后净树，源页56摘录与22输入SHA通过。Runner另按用户答复基于B/0a466bcd单独集成，核心调用集中适配文件，不随QA合main。

### QA已合入

main与工作分支已推送daba2ef03451ed8e54f152b1c8387a6d329d9f20，ls-remote一致。五门禁受测提交0d26174d，后续只归档回执与文档，源码未变。

## 第3节：阳性TableCheck日历缺证停止

固定main/daba2ef0中3408个输入已在d8e8626e冻结后离线检索。3388保存HTML＋20归档968页中，171时间动作候选去重4份：3份是Map Search的已选Date Field，1份为340字节Fixture restaurant本地构造（168重复）。没有符合原始真实DOM、同店、日期、人数和可用时段绑定的页，未加入G2固定集。完整源路径、SHA、字符偏移、范围与限制见../tablecheck-calendar-evidence/report.md及candidate-review.json。现有TC两页PASS仍仅未知保持未知，不代表查位已覆盖。

用户要求“找不到合适的保存页就停下报告”，故停止后续工作，只归档推送。缺的是既存真实阳性日历DOM及该次请求/观察的日期、人数和身份绑定。真实调用仍全部0。

## 第4节：Runner未开始

NOT_STARTED，fixture NOT_RUN。用户已批准基于B/0a466bcd的独立集成分支、产品原字节、单适配文件及新输出评分映射；该安排保留待第3节缺口解决后的后续工作，本批不把未执行项写成完成。Runner不合main。旧F5整包停止决定已经写入STATUS，方案(c)留首次3b Live新录制验收。
