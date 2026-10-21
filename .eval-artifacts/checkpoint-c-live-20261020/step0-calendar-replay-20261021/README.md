# 检查点 C 第0步回放材料

Evidence status: exposed development / draft, not integrated。已完成69点×四变体，0网站／浏览器动作／Live；等待复核者和用户选择，不自动采用变体。

- [四层报告：结果、耗时、token、失败与限制](comparison/four-layer-report.md)
- [完整机器汇总与全部API来源索引](comparison/comparison.json)
- [276个逐点评分](comparison/evaluations.json)；[每试次原始结构化结果](comparison/results/)
- [第二阶段累计账本：1995/4000](comparison/phase2-ledger-after.json)
- [104点清单及69点选样](inventory.json)、[独立DOM答案与绑定](oracle.json)、[来源SHA](source-manifest.json)
- [原276请求顺序](schedule.json)、[请求SHA](request-manifest.json)、[原冻结](freeze.json)
- [原3次API尝试及400停批](model-replay/)、[批准的V2兼容补充](compatibility-plan.md)、[补充冻结](compat-freeze.json)
- [兼容后274次请求、响应、实际线上payload SHA](model-replay-compat-auto/)
- [7项原离线控制](preflight-verification.json)、[3项兼容控制](compat-controls.json)、[0模型脚本化流程报告](offline-smoke/report.md)
- [运行后独立哈希／分母／传输核对](independent-verification.json)、[结果文件SHA清单](result-manifest.json)

原冻结提交ee9ac1a，兼容冻结提交15e7716；运行未修改被冻结脚本或输入。V2包含用户批准的auto工具选择差异和放宽的预算，不是纯thinking因果实验；V3同时补控件语义、组及月份。原位置规则被DOM证据纠正；原review及五次Live原始结果保留，不回写历史结论。
