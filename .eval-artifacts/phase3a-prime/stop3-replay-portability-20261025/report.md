# 停止点3补充：Runner 回放系统断网可移植修复

- 完成：2026-10-25T09:59:24.815399+01:00（CET UTC+1，以宿主/clock工具时间为报告时钟）。current executable / 已暴露离线fixture；不是Live能力或Clean Baseline。
- 分支：codex/fix-phase3a-prime-replay-portability。已复核main/b5db5700；期间仅4份robots证据进入远端main，已保留并基于7165f8a20fd86e105ea3219100061699c03197a1实施。
- 未修Linux输入：0c1f75d9；实现：c721088289e97a5a0f1953d132bede54a5498199；最终五门禁候选：b1573c5a8b31627cfa9bc9edcb11d1a8219e0dd6。

## 改善

回放子进程按真实process.platform选择：macOS使用原 /usr/bin/sandbox-exec 策略，Linux使用非特权 unshare -rn --。Chromium继承系统断网边界；stdin/stdout IPC、原30秒子进程上限和回放行为保持。工具缺失时报 OS network isolation unavailable，工具拒绝/异常退出附命令、退出码和stderr；不支持的平台也明确失败。没有skip或联网回退；stdin关闭错误不覆盖实际启动失败原因。

[runner-replay.test.ts](../../../src/harness/browser/runner-replay.test.ts)的4项原断言文件逐字不变，SHA-256为 `2f44c1aeecde529c09fb6bd131566f92af74e8299b248a582711e34f19bb6c76`，见[基线](baseline.json)。测试仍覆盖原样非空候选/交付、缺Google响应、部分页面停止及fixture模型接线，未减少断言。

## Linux：先红后绿

本机无Docker/VM。CI工作流推送因现有PAT缺workflow权限被GitHub拒绝，Actions读取也403，未启动CI；原始计划、配置与阻断记录保留在[ci-attempt/](ci-attempt/rejection.json)，现工作分支未保留活动workflow或CI认证脚本。

随后按[官方Lima安装说明](https://lima-vm.io/docs/installation/)下载并校验Lima2.2.1临时二进制，使用[原生VZ方式](https://lima-vm.io/docs/config/vmtype/vz/)启动Ubuntu22.04 ARM64。配置2核/4GB，plain模式，无宿主目录挂载、SSH agent或代理转发；只复制冻结仓库归档，无.git/.env/宿主home。环境为Linux5.15.0-194、glibc2.35、Node24.4.1、util-linux2.37.2、真实Chromium151.0.7922.34，父进程UID501。隔离命令无需sudo，未修改Linux userns sysctl。安装依赖发生在一次性VM内。配置、安装/执行脚本、归档SHA、源文件清单及环境见[linux-vm/](linux-vm/runtime-provenance.json)与[源归档回执](linux-red/archive-receipt.json)。

- [Linux红灯](linux-red/runner-replay.log)：旧helper的原4项均为 spawn /usr/bin/sandbox-exec ENOENT，0pass/4fail；不是用模拟process.platform代替Linux。
- [Linux绿灯](linux-green/runner-replay.log)：同一VM、同样4项断言，4pass/0fail/0skip，14.397503秒。仅更新冻结helper及其源文件清单，其他源文件逐SHA核对，[校验](linux-green/source-check.json)。
- [系统断网独立见证](linux-green/isolation.json)：普通UID501启动真实父HTTP服务，父命名空间访问200；unshare -rn创建不同net namespace，隔离curl退出7、服务新增命中0。不是访问不存在端口的空检查。
- [缺工具控制](linux-green/missing-isolator.json)：正常生成fixture后，把PATH换为测试创建的空目录；新helper明确以unshare ENOENT失败，回放未回退到直接Node/联网运行。原4项不改，控制单列。
- Guest墙钟比宿主约快6小时，原始Linux时间戳不改写；本报告时间按宿主CET，运行先后由冻结SHA、源文件核对与命令结束码关联。这些fixture不作Live时效/库存判断。
- [清理完成](linux-vm/cleanup.json)：VM停止/删除，临时运行时、源归档、SSH密钥及精确匹配本次URL/SHA的镜像缓存项均移除；无全局软件安装。证据已取回仓库。

## macOS 五门禁

原4项回放测试包含在真实Chromium套件中，使用sandbox-exec。单次样本，不是中位数。[冻结](linux-green/freeze.json)、[原始门禁](mac-gates/gates.json)。

| 门禁 | 结果 | 通过项 | 秒 | 每项后git status |
| --- | --- | --- | --- | --- |
| typecheck | PASS | — | 0.397647 | 空 |
| arch-check | PASS | — | 0.184798 | 空 |
| npm-test | PASS | 1037 | 21.725409 | 空 |
| build | PASS | — | 0.449371 | 空 |
| browser-fixture | PASS | 154 | 94.521591 | 空 |

恢复次数0，冻结SHA前后相同，无端口或浏览器资源冲突。最终交付只追加报告/证据/导航，已测实现与断言不变。

## 结论、范围与停止

端到端：原四回放契约在macOS和真实Linux均通过。逐环节：系统launcher、源输入校验、真实Chromium/Guard、原决策/fixture模型、停止位置与分母边界均由原断言覆盖。严重程度：完整fixture的独立evaluator@34声明/边界S0原断言ABSENT；缺响应与未回放部分保持NOT_EVALUATED、排除Live分母。归因：测试基础设施把macOS启动器硬编码到Linux，非产品能力变化。

新增真实模型/Google/餐厅网站/Live/环境重跑调用全0；fixture模型/Google传输、localhost、HAR与环境依赖下载单列，不计真实调用。产品层、Prompt、Schema、Guard、站点目录、source-packs.ts均未改；适配器3864/pack473不增加。Linux证明限定本次Ubuntu22.04 ARM64环境；没有冒称CI或其他发行版运行过。

两平台、红绿、五门禁与净工作树要求满足。按授权合入、推送main后以ls-remote核对精确SHA，记录在最终回复及push-receipt.local.json，随后停止等复核。
