# 详情身份采集：修改前具体范围

2026-10-27 CET，draft / not integrated。18次公开GET已因网络超时停止，不再发起真实请求；新8家配对已完整保存。以下离线实现基于先前已保存的 nr-002 真页（JSON-LD仅03店铺号/粗地址，联系表另有050预约号/完整地址）及两站既有fixture，处理复核明确批准的采集缺口。

原parser范围和SHA仍与[执行计划](plan.md)相同：Tabelog61–65、113–162；TableCheck273–295、357–389。额外的C身份解析位置（修改前）：`tabelog-entity-resolver.ts`的`inspectTabelogEntity`约58–150，`tablecheck-entity-resolver.ts`的`inspectTableCheckEntity`约30–72。只让同店本次联系区的另一原文号码参与既有EXACT_PHONE核对；不模糊匹配、不建立050→03映射，不降低name/address门槛，楼层/门牌冲突仍拒绝。

新增C身份范围的小模块`src/integrations/restaurant-identity/detail-identity-fields.ts`，供Tabelog和TableCheck两个实际详情提取使用者复用：按可见Restaurant information/店舗情報标题及Address/Phone标签取原文，排除aside/footer/nav和地图操作文案；保留号码角色、原文引用、来源URL。完整日文地址可与同一JSON-LD公开邮编组合，分开保留两段来源；显式地址冲突不静默覆盖。无私有class/testid依赖，字段归属或结构歧义明确UNKNOWN/告警。

多号码与原文只进入parser本地的临时`detailIdentity`提取对象和评测诊断，使用局部结构类型；不改两站共享contracts.ts、Domain State、Proposal/TaskDefinition版本。resolver仍按原有电话精确相等或强名字＋完整地址接纳，返回的标准outlet不携带临时多号码对象。不编辑Browser层、查位/列表、query controls、Guard或Prompt。原单号码字段继续标明主展示号码；多号码的实际匹配依据另保存在临时证据中。

先提交测试和源片段SHA，以旧parser有效AssertionError取得红灯，再实施。正常控制覆盖nr-002同店预约号；反例覆盖其他店卡片电话、门牌/楼层冲突、非精确电话、含糊身份区。两站同一行为复用具名参数化，不为代码分支堆测试。旧29份保存页另用原代码链离线复算，nr-029差一位不得藉模糊匹配接纳；任何身份规则需要放宽时停下，不在本批决定。

完成后保存独立核验和新冻结源码，五门禁及固定G2。新helper的物理行数单列，不借迁移代码声称G3行数达标；G3仍由B后续实施。
