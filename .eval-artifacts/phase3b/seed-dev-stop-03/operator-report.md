# Seed development stop-03（2026-11-11 CET）

03-r2补评1fcdcf44…已核对：另存evaluation.supplement.json，QUALIFIED_DELIVERY / qualified=true / s0=0。03两次合格，A2成立；原评价未改。

|运行|结果|首回合耗时 / 模型|
|---|---|---|
|07-r1|CAPABILITY_MISS，未交付；421/421边界PASS，s0=0|180.8s /47|
|07-r2|CAPABILITY_MISS，未交付；316/316边界PASS，s0=0|195.8s /47|
|D02-V r1|见证12-10 20:30 JST/8人exists=true；随后体检失败，CANCELLED_BEFORE_LIVE|Live0 /模型0，GET2|
|D02-V r2|环境失败后未启动|—|

**07名称核对。** 以下按TABELOG/TABLECHECK的DISCOVERY候选provider作用域及实际模型记录计数，不用预增预算计数；逐候选/录制序号见metricsJSON。R2修前三次：21/24/27家、共27/30/31次调用，平均1.29/1.25/1.15次及4.74/4.43/4.58s，无搜索框求助15/18/20次。本次两次：各5家，共31/35次，平均**6.2次/26.80s**和**7.0次/29.02s**，无搜索框求助均**0**。旧路径大量早退，新路径实际核对，不能据此声称提速。范围和方法见附表，不将上轮03求助统计用于07。

**10人及见证店。** 两次都有来源find_vacancy的svps=10成功响应及来源返回member=10链接（HAR索引另附），人数路径可以完成，仍有部分候选REQUEST_SELECTION_UNCONFIRMED。三宝苑r1被发现但未轮到核对、店页没打开；r2已打开13306197，HIGH/EXACT_PHONE，并取得11-18 19:00/10人AVAILABLE。仍未展示：r1有位候选facts NOT_CHECKED；r2三宝苑facts NOT_CHECKED，另外两家有位候选facts UNKNOWN(GOOGLE_NETWORK_FAILED)。不改产品，不追加Live。

**D02-V环境停止。** 07:04:35.985 CET认证有位，随后TableCheck第一轮体检文档200；SCRIPT_WAIT阶段20.036s，合计21.985s，报page.goto Target page/context/browser has been closed。外层windowMs仍60000，不是60s上限到期；仅凭此不能认定限流。保留原healthJSON，不改窗口、不重试。尚未进入产品，因此翻12月的数据响应、20:30翻页、8人确认、no actionable target四项均**未验证**。

**冻结与验证。** 07保持净树ead28945；D02-V公开调用入口冻结ddae611a，只新增src/eval两个文件，评测/产品diff0；相关2/2、type/arch/build、默认1588/1588通过，写死扫描产品新增0。以独立单例批次/开发收据处理缺注释，evaluation.json原样保留。本次在环境失败处停下，无自动续跑。

**额度。** 本轮用2Live/10GET/94模型；累计34/36、172/220、2282/2800，剩**2Live/48GET/518模型**，环境0/4。完整录制/评价/补评/体检和当前账本快照随本分支导出，逐文件哈希一致；原R2账本和原4256303d工作区不动。等待复核。
