# 推送前产品写死逻辑扫描

2026-11-05 CET。使用用户原样 scan-hardcoded.sh，范围 `f8c99318..HEAD`，排除测试、fixtures、src/eval。代码树已在f0f976cc提交；随后只补本审计与原始输出，不再改代码。

唯一命中：

```text
src/integrations/tablecheck/tablecheck-browser-availability.ts:489 [ SITE-BRANCH ] handoff = searched.status === "COMPLETED" ? undefined : { reason: "TABLECHECK_DISCOVERY_HAS_NO_EXTRACTABLE_OUTLET_LINK", outcome: searched.status };
```

归属为用户允许的“结果核对/诊断”：条件只检查通用观察循环的COMPLETED状态，站点字样仅存在于旧诊断枚举中。它保留搜索未完成的原因，不选择链接、不生成网址、不执行站点动作，不放宽身份或Guard。没有新增具体网站字段名特例。其余产品增加行未命中；仍人工核对了四个产品文件的完整差异，详见adapter-migration.md。

范围中的产品文件恰为：browser-task-executor.ts、google-listed-website-facts.ts、tabelog-browser-availability.ts、tablecheck-browser-availability.ts。fixture中的假网站查询URL与模型动作没有进入产品。

扫描是辅助检查，不将“未命中”称作安全证明。当前全套门禁仍红；这份扫描不授权Live或main合入。
