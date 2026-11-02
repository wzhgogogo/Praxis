# 运行诊断报告：获批合入 main

- 用户批准的复核版本：`8bc20f8a554f981b2a9fff13900ab21d1d327202`。
- 最新远端main：`efeab25483cf58011b7505c32d6da857e41c2533`，已在复核版本祖先中；`git merge --ff-only origin/main`确认无新改动。
- 五门禁通过后，本地main普通合并为 `814dfa6cf2499c9086ce59afb65281b8ab392b1b`，父提交为上述main与复核版本。合并树与获批8bc20f8a的完整Git树完全相同。
- 本轮只追加验证及发布记录；不改源码、配置、Gold、见证、Prompt或判断，不重跑历史运行/评测器，真实模型/Google/网站/Live调用0，不读取.env。
- 当前阶段：本地main合并已完成；正常推送和最终`ls-remote` SHA以本任务发布回执为准。发布后待命，不新增工作。

## 同步与合并证据

[plan.json](plan.json)记录获批版本、远端SHA与五条固定命令；[pre-merge-readiness.json](pre-merge-readiness.json)确认既有main工作树干净、472个新增路径无异字节的忽略文件冲突；[local-merge.json](local-merge.json)保存同步与普通合并命令、输出及树相等断言。没有重置、强推、删除历史分支或覆盖工作区。

main工作树先从本地旧fceecaad快进至最新远端efeab254，再普通合入获批版本。当前诊断工作树仅快进到该实际main合并；随后只追加本文、状态和历史证据，执行源码保持已验证字节。

## 净树五门禁

执行对象8bc20f8a，既有 [862项冻结清单](../review-followup/code-and-inputs-freeze.json)全部匹配。2026-11-02 09:51–09:53 CET；Node v24.4.1/npm11.4.2，未联网安装依赖。

| 实际命令 | 结果 | 完整原始日志 |
| --- | --- | --- |
| `npm run typecheck` | exit0，0.457秒 | [typecheck](typecheck.log.gz) |
| `npm run arch:check` | exit0，0.186秒 | [arch](arch-check.log.gz) |
| `npm test` | 1342/1342，失败/取消/跳过/todo均0，35.751秒 | [默认测试](npm-test.log.gz) |
| `npm run build` | exit0，0.466秒 | [build](build.log.gz) |
| `npm run test:browser:fixture` | 187/187，失败/取消/跳过/todo均0；外层129.876秒，Runner129.779秒 | [本地Chromium](browser-fixture.log.gz) |

[execution.json](execution.json)逐项保存开始/结束CET、退出码、前后status为空、相同HEAD及862项SHA不变、原始/压缩日志SHA。五项各一次，不过滤、不重试、不豁免。本地合并发生在五项完成之后；合并及其后文档提交没有改变任何执行源码/输入，因此不重复运行门禁。

## 本轮继承的已签收行为与边界

实现及反例见 [复核补充报告](../review-followup/report.md)：报告前27行摘要、附录原记录、已交付覆盖分层及未确认归因。44条登记/27店无合格独立身份补全，按用户追加决定不改见证、不重评；Konya仍为疑似匹配、缺证未确认。原始校准2/5与旧标签保留，不宣称本次重新校准。

A真实逐环节grader及B1/条款/取页红灯对接仍按已批准决定延期；真实模型理解和当前网站兼容性不由离线门禁证明。合入不改变这些未完成范围，也不启动Live或后续修复。

最终main发布使用正常`git push origin main`，再独立`git ls-remote --heads origin refs/heads/main`核对实际提交。最终SHA由Git回执给出，不在本文件中预填成功值。
