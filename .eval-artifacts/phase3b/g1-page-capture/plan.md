# G1追问页面获取修复

2026-11-01，维也纳CET（UTC+1）；draft / not integrated。用户批准本修复，工作分支codex/fix-phase3b-g1-page-capture，从main6db445ea开始，不合main。

纵向承诺：真实生产组合在已展示门店的显式追问中，capturePagesOnly要求复用现有Google→官网、Tabelog和TableCheck reader获取并发出同店、本run页面，不以原搜索HARD/营业/商业条件缺口决定是否访问。无该标志时行为不变。缓存、HIGH身份、Guard、独立60秒/3模型/2页/每会话20题及取消规则保持，不新增reader、条件或手填页面。不改A评测输入、State、TaskDefinition或Prompt；如需版本变化先报告。

先运行A冻结27cf175c的原命令P4，取得NO_BOUND_PAGE和未调用问答模型的有效红灯；隔离clone只包含src/scripts/web-skills和依赖清单，不materialize .env或QA答案。绿灯仅覆盖与本分支提交SHA一致的产品文件，A五个新增评测/fixture文件逐字不变，产品覆盖在临时clone独立提交后再运行同一命令。原始执行和结果分开归档。

补现有页面捕获生产组合控制：Google没有原条件缺口仍读取；Tabelog/TC路径同样产出同店本run页面；不匹配分店/旧run/Guard拒绝不产生可问页面；预算耗尽、取消保持未知或原取消语义。正常事实读取及既有测试不改；固定旧HARD44,197字节逐字相同。按项目Planning/Test/Post-change规程验收，复用已有身份/run/取消与真实Chromium Guard反例，不用测试数量替代链路。

输入/外层脚本先提交冻结，红绿和五门禁/严格G2每项记录git status。真实模型、Google、网站、Live、公开GET、环境重跑全部0；不用.env或QA answers。门禁修两次仍红、S0、跨归属或版本/范围变化时停下报告。全绿后更新STATUS/DEVLOG/TEST-LOG/本月索引，账本按id保留追加0，推工作分支、通知A，停下复核。
