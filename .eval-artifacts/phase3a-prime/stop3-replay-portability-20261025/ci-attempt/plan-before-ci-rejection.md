# 停止点3补充：回放测试跨平台系统断网

- 状态：current executable / 已暴露离线fixture；不是Live能力或Clean Baseline。
- 基线main：b5db5700fa4c868a5c94f245bc3ef9689eecb4e4。CET UTC+1。
- 切片承诺：现有4项Runner回放断言在macOS/Linux均通过，仍由系统强制断网，工具缺失/拒绝必须明确失败，不skip、不降为仅拦fetch。
- 只改测试Harness与必要CI；macOS选sandbox-exec，Linux选非特权unshare -rn，其他平台或所需工具不可用时说明原因并失败。
- 本机无Docker/VM，以GitHub Actions Linux VM（ubuntu-22.04）验证。先提交CI和输入，在未修helper上取得真实Linux ENOENT红灯，再同一CI流程取绿灯。
- CI先安装锁定依赖和Playwright Chromium，然后以普通runner用户调用unshare；来源只用localhost/fixture/HAR，新增真实模型/Google/餐厅网站/Live/环境重跑全部0。
- 独立断网见证：在父命名空间启动临时本地HTTP服务器，外部正常访问200，隔离子进程访问失败且服务器没有新增命中，证明不是对不存在端口的空检查。
- 保持runner-replay.test.ts的字节/SHA不变。回放完整/缺响应/部分/fixture模型接线4种原断言不改。缺工具失败单独验证。
- Mac五门禁全绿且每项后git status空；Linux原四项绿灯及隔离见证通过。输入、CI、外层脚本先提交、冻结SHA，日志/平台/内核/UID/提交SHA保留。
- 产品层、Prompt、Schema、Guard、站点与source-packs不改。同步STATUS/DEVLOG/TEST-LOG/月度索引，授权合入并推送main后停止。
- 若CI工具/权限无法提供真实Linux验证，先完成可独立工作，保留阻断证据，不把模拟平台或本机绿灯冒充Linux通过。
