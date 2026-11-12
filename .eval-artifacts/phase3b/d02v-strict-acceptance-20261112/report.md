# Schema修复后的单次D02-V Live

2026-11-12 CET。源码`1ee8c330`，配置`4b17d641`；固定原请求12-10/8人/20:30，单次Live Read-only，无重跑、未现场改码、未合main。

**结果：格式修复成立，D02-V尚未通过。** 47/47模型调用成功，PROVIDER_REJECTED=0；新schema16输出valueGroupRef已在真实调用返回。原自动评价EVALUATED / qualified=false / CAPABILITY_MISS，0交付、无B1；不覆盖旧评价。回合193.930s；独立来源边界226/226 PASS，S0=0，500s/50调用未超限。47次中37次浏览器决策，输入751,235 / 输出7,495 token；不能据此宣称调用成本已改善。

**首个偏离与轨迹。** #4权威LOCATION写入Nakano City（来源提交sw可核对）；#6通过来源可见链接到东京中野目录`https://tabelog.com/en/tokyo/A1319/A131902/`，没有进入错误行政区。#7–10在分类/More filters/All之间反复，记录ACTION_OBSTRUCTED；菜系未作用于整列表，完成检查没有误放行。原生7次浏览器模型/46.552s，0候选；3家候选来自Google。因此没有原生Sumika直达URI，#12–14仍按名称检索；不能把这次写作已消除盲搜。

**D02-V四点。** ① 未完成12月/12-10确认；②未到20:30确认；③#16、#35实际采用通用ADVANCE人数动作，#17/18/21/22和#36/37反复选8。HAR确有两家店的200 find_vacancy请求：`svps=8`，但都是`svd=20261113&svt=1900`，没有与目标日期/时间绑定，不作为8人目标时段完成。④本次未出现确切“no actionable target”错误；仍有PARTY_SIZE_NOT_CONFIRMED/REQUEST_SELECTION_UNCONFIRMED。Sumika的11次浏览器调用在45.110s provider窗口超时，单独归因到这家店的名称核对/AVAILABILITY共享窗口；满天9次/34.841s结束为选择未确认，不笼统归为发现失败。#47在储备线诚实结束。

**证据与额度。** BEFORE/AFTER见证仍有位；四体检3.942/5.686/2.853/4.671s全部通过。三录制开启，47/47决策有记录；页面35/41通过录制准入，6份拒录原因详见run-audit.json，不冒充完整网站Replay。修前红灯、Mock gateway合同、真实DOM组件和本次Live分开，组件通过不转成Live成功。原失败、主工作区、四旧账本及上一轮独立账本均不变，源码/编排/env哈希不变。实际1Live/6评估GET/47模型/0环境重跑，新账本余0Live/1GET/3模型。到此停止，不追加运行。完整原件在live/，逐字哈希在copy-manifest.json。
