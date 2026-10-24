# F2④a 补丁：诊断 DOM

- 状态：frozen regression；已暴露离线证据，用户已授权本项门禁后合入 main。
- 时间：2026-10-24T11:51:00.063345+02:00（Europe/Vienna）。
- 分支：`codex/fix-phase3a-prime-f2a`；受测提交 `3ab2a874a3e840f327a453b66c62299c14161f85`。

每个安全快照另存 `diagnostic/snapshot-NNNN.html`，pages.diagnostic 登记文件或原因，复用同一次脱敏的 HTML 字节。缺脚本与 OPTIONS 只影响回放资格；挑战页、危险 URL／脱敏失败、超大页不留诊断 DOM。诊断文件不加入 documents、responses 或 HAR，不改回放资格、Guard、Prompt 或产品 Schema；录制 pages 的附加元数据是本项明确要求。

## 红绿与字节控制

最小六页 fixture 来源／日期在源码注释；补丁前回放文件摘要先冻结提交，再重采相同字节。旧实现的诊断字段断言失败，回放字节断言已通过：[红灯](red.log)。补丁后 18/18：[绿灯](green.log)。安全缺脚本/OPTIONS 两页保存并去除 token、个人邮箱和未审核 form action；挑战页、含 token 的危险 URL 页、1,000,001 字节页只记原因。回放文件和 HAR 与补丁前逐字节摘要一致。未访问真实页面，不恢复第二阶段已经丢失的数据。

## 五门禁

| 门禁 | 结果 | 通过数 | 单次秒 |
| --- | --- | ---: | ---: |
| typecheck | PASS | — | 0.445701 |
| arch-check | PASS | — | 0.187201 |
| npm-test | PASS | 1028 | 20.633655 |
| build | PASS | — | 0.399269 |
| browser-fixture | PASS | 141 | 84.746425 |

[门禁日志](gates/gates.json)：每项前后 Git status 为空，恢复 0，冻结摘要前后匹配。不是三次中位数。输入与脚本：[冻结](freeze.json)。

## 范围、调用与合入

Application/Core/Domain/Adapter/Server/web-skills 与共享 Browser/restaurant-search 非测试文件零改动。站点 3864 行、pack 473 行不变。新增真实模型、Google、餐厅网站、Live、环境重跑全部 0。旧 F2a 的分页判定和独立评价保留，F2①②依用户本条复核通过。

本报告随本项交付提交后快进 main 并推送；精确新 main SHA 与 ls-remote 证据写入 [合入记录](main-integration.json)，由后续工作分支归档，避免自指提交。随后直接开始 F2③，不等待复核。
