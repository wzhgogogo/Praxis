# G4 日文名检索主线发布验证

- Status: verified release candidate / user-approved main publication。
- 时间：2026-10-31，维也纳 CET（UTC+1）。
- 用户复核通过：`efee5a81b669dc43fc1cc559072a04f07f0b9295`。
- 同步 main：`90559cc956d5288d52c1762cdaa85aeb6c3fb8d7`。
- 已测候选：`19263da47617265fdf78a99122f530cea0af97d7`。

## 合入内容与保留范围

Tabelog 原名→合法片段→同 Place ID 日文全文、去重与4+1名额，以及已批准的一行实际 sourceProvider 标记修正。排名、身份门槛、响应绑定和两次B1 URL检查保持已复核实现。Prompt/Schema/State/TaskDefinition不变，TableCheck不启用第三词。

同步提交 `6e0f134a` 无产品冲突。只处理共享账本及四份状态/历史文档冲突：相同ID记录逐字相同，500条全部保留；双方文档冲突块完整保留，未删除历史。`merge-review.json` 保存依据。相对已复核C，产品/测试/脚本只继承A的三个文件，均逐字等于main：`scripts/browser-fixture-worker.mjs`、`scripts/run-browser-fixtures.mjs`、`src/harness/browser-fixture-scheduling.test.ts`。默认套件较旧C多1项即来自该main同步。

Domain与Capability Matrix补齐当前已批准实现及证据边界，旧candidate说明明确归为superseded retrospective；不覆写历史评测。285份C原产物和500账目保留，累计GET255/260、模型171、Google12无新增。T的第6位缺口和缺历史片段限制不改变。

## 冻结与门禁

727项产品、Fixture、配置与本次控制输入在19263da4提交冻结后执行。所有门禁顺序运行，一次通过，无修复、跳过或复跑；每项前后git status为空。完整原输出与SHA见 `gates/`、`gates.json`，机器摘要见 `verification.json`。

| 检查 | 结果 | 耗时（秒） |
|---|---|---|
| 冻结与原件前核对 | PASS，前后净树 | 0.138 |
| typecheck | PASS，前后净树 | 0.524 |
| arch:check | PASS，前后净树 | 0.213 |
| npm test（1272/1272） | PASS，前后净树 | 30.198 |
| build | PASS，前后净树 | 0.491 |
| 完整 Chromium fixture（186/186） | PASS，前后净树 | 129.772 |
| 严格 G2（5/5、12页全部PASS） | PASS，前后净树 | 24.120 |
| 冻结与原件后核对 | PASS，前后净树 | 0.179 |

标准G2已在完整fixture入口首组独占执行，5/5；严格G2使用PRAXIS_G2_REQUIRE_PASS=1另行运行，5/5且12个有效页面全PASS。没有以默认套件替代Chromium，没有放宽时间或修改评分。Node24.4.1/npm11.4.2；未加载.env或provider凭据。

## 证明边界与发布

本次仅验证同步后主线兼容性，真实模型/Google/网站GET/Live/真实数据库调用0；共享账本未增加条目。未重新采集四家或37家，也未重新跑模型。已签收的四家定向证据仍为Beef、Kappo、Sumi正确接纳（日文词下首次HIGH，电话精确、认证ID与原件相符），T观察路径没有错认但完整回归未评；错认0。它不是新的37家通过率，也不证明库存或预约成功。

全部门禁通过后再次fetch核对main仍为90559cc9。按用户授权，在本工作树创建以该main为第一父的发布合并；其树须等于已验证、仅补本次报告与记录后的C交付树，产品及冻结输入保持19263da4原SHA。正常快进推main，不修改被其他对话占用的本地main工作树、不force push。最终发布SHA由Git合并及ls-remote独立核对，不自引用写入本提交。发布后净树、待命，下一项另行授权。
