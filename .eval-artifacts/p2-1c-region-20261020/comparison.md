# 离线地区证据比较

Evidence status: exposed development / frozen regression. 54 条，网络与真实模型调用均为 0。

逐例结论是来源证据的机械路由对照，不是模型回放通过率。无 Google 链接/未执行到 Google 的轨迹保留原路径，不计新增成功。

| 用例 | n | 旧正确/错误 | URL 支持正确/错误 | 无证据保持 | 提前等待估计中位/最长(ms) |
|---|---:|---|---|---:|---|
| p2-kagurazaka-kaiseki-20261029 | 11 | 0/10 | 7/0 | 4 | 4161/4597 |
| p2-nakameguro-yakiniku-20261030 | 5 | 2/3 | 5/0 | 0 | 3229/4378 |
| p2-kf-h001-20261027 | 13 | 13/0 | 12/0 | 1 | 4244.5/5186 |
| p2-kf-h005-20261029 | 10 | 6/2 | 6/0 | 4 | 3802/6065 |
| p2-kichijoji-tempura-20261027 | 10 | 9/0 | 8/0 | 2 | 4196/5754 |
| p2-kf-h002-20261031 | 5 | 5/0 | 0/0 | 5 | 2562/3316 |

等待是原有串行 Google 阶段的时间间隔，加上提前移动的共享文本规划实际延迟；不是新路径的实测耗时。没有新增 Google 发现批次；这部分移到地区选择前，仍计原 90 秒来源预算。无法从旧轨迹推断网络并发收益。

方案 B：表中 JSON 保留原地点名称、来源实际给出的街区/车站字段及可匹配标签。神乐坂/中目黑缺少可独立核实的新车站推理；没有调用模型补写依据，故新模型行为为 NOT_EVALUATED。选择已有真实 URL 依据的 A，不同时上线 B。

| 批次/用例/attempt | 旧入口 | 旧判定 | URL 对照入口 | URL 判定 |
|---|---|---|---|---|
| baseline/p2-kagurazaka-kaiseki-20261029/attempt-1 | https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant | INCORRECT | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| baseline/p2-kagurazaka-kaiseki-20261029/attempt-2 | 未到达 | NOT_REACHED | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| baseline/p2-kf-h001-20261027/attempt-1-after-config-fix | https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase | CORRECT | 无可用证据，保持原路径 | UNCHANGED_NO_REFERENCE |
| baseline/p2-kf-h001-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase | CORRECT | https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase | CORRECT |
| baseline/p2-kf-h002-20261031/attempt-1 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | 无可用证据，保持原路径 | UNCHANGED_NO_REFERENCE |
| baseline/p2-kf-h005-20261029/attempt-1 | https://tabelog.com/en/tokyo/C13102/rstLst/?sw=local%20food | INCORRECT | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| baseline/p2-kf-h005-20261029/attempt-2 | https://tabelog.com/en/tokyo/C13102/rstLst/?sw=local%20food | INCORRECT | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| baseline/p2-kichijoji-tempura-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | 无可用证据，保持原路径 | UNCHANGED_NO_REFERENCE |
| baseline/p2-kichijoji-tempura-20261027/attempt-2 | 未到达 | NOT_REACHED | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| baseline/p2-nakameguro-yakiniku-20261030/attempt-1 | https://tabelog.com/en/tokyo/A1316/rstLst/?sw=yakiniku | INCORRECT | https://tabelog.com/en/tokyo/A1317/rstLst/?sw=yakiniku | CORRECT |
| checkpoint-a-20261019/runs/p2-kf-h001-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1 | https://tabelog.com/en/tokyo/A1304/ | INCORRECT | https://tabelog.com/en/tokyo/A1309/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2 | https://tabelog.com/en/tokyo/A1304/ | INCORRECT | https://tabelog.com/en/tokyo/A1309/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kf-h002-20261031/attempt-1 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | 无可用证据，保持原路径 | UNCHANGED_NO_REFERENCE |
| checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-1 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | https://tabelog.com/en/tokyo/A1301/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-2 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | https://tabelog.com/en/tokyo/A1301/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| checkpoint-a-corrected-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1 | https://tabelog.com/en/tokyo/A1317/ | CORRECT | https://tabelog.com/en/tokyo/A1317/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1 | https://tabelog.com/en/tokyo/A1304/ | INCORRECT | https://tabelog.com/en/tokyo/A1309/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2 | https://tabelog.com/en/tokyo/A1304/ | INCORRECT | https://tabelog.com/en/tokyo/A1309/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kf-h001-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kf-h001-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kf-h002-20261031/attempt-1 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | 无可用证据，保持原路径 | UNCHANGED_NO_REFERENCE |
| checkpoint-a-dom-20261019/runs/p2-kf-h005-20261029/attempt-1 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | https://tabelog.com/en/tokyo/A1301/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kf-h005-20261029/attempt-2-preflight-2 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | https://tabelog.com/en/tokyo/A1301/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| checkpoint-a-dom-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1 | https://tabelog.com/en/tokyo/A1317/ | CORRECT | https://tabelog.com/en/tokyo/A1317/ | CORRECT |
| checkpoint-b-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1 | https://tabelog.com/en/tokyo/A1304/ | INCORRECT | https://tabelog.com/en/tokyo/A1309/ | CORRECT |
| checkpoint-b-20261019/runs/p2-kf-h001-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-b-20261019/runs/p2-kf-h001-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1 | https://tabelog.com/en/tokyo/A1304/ | INCORRECT | https://tabelog.com/en/tokyo/A1309/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2 | https://tabelog.com/en/tokyo/A1304/ | INCORRECT | https://tabelog.com/en/tokyo/A1309/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kf-h001-20261027/attempt-1-start-b-20261020 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kf-h001-20261027/attempt-2-network-fixed-20261020 | https://tabelog.com/en/tokyo/A1303/ | CORRECT | https://tabelog.com/en/tokyo/A1303/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kf-h002-20261031/attempt-1-browser-ready-20261020 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | 无可用证据，保持原路径 | UNCHANGED_NO_REFERENCE |
| checkpoint-b-corrected-20261019/runs/p2-kf-h005-20261029/attempt-1 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | https://tabelog.com/en/tokyo/A1301/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kf-h005-20261029/attempt-2-user-seventh-20261020 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | https://tabelog.com/en/tokyo/A1301/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1-user-seventh-20261020 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2-user-seventh-20261020 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| checkpoint-b-corrected-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1-user-seventh-20261020 | https://tabelog.com/en/tokyo/A1316/ | INCORRECT | https://tabelog.com/en/tokyo/A1317/ | CORRECT |
| network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-1 | https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant | INCORRECT | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2 | https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant | INCORRECT | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase | CORRECT | https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase | CORRECT |
| network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase | CORRECT | https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase | CORRECT |
| network-restored-20261019/baseline/p2-kf-h002-20261031/attempt-1 | https://tabelog.com/en/tokyo/A1301/ | CORRECT | 无可用证据，保持原路径 | UNCHANGED_NO_REFERENCE |
| network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-1 | 未到达 | NOT_REACHED | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-2 | 未到达 | NOT_REACHED | 无可用证据，保持原路径 | NO_OBSERVED_MATCH |
| network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-1 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-2 | https://tabelog.com/en/tokyo/A1320/ | CORRECT | https://tabelog.com/en/tokyo/A1320/ | CORRECT |
| network-restored-20261019/baseline/p2-nakameguro-yakiniku-20261030/attempt-1 | https://tabelog.com/en/tokyo/A1316/rstLst/?sw=yakiniku | INCORRECT | https://tabelog.com/en/tokyo/A1317/rstLst/?sw=yakiniku | CORRECT |
