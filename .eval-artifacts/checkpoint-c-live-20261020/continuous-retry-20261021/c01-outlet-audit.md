# 快速验证逐家查询绑定与独立 GET 对照

仅解析已保存材料，0新增网络/模型；未覆盖的 GET 保持 NOT_COVERED。每个快照与响应明细见 JSON。

| 运行 | 门店 | 查位选中确认 | 捕获 find_vacancy | base_date / members | 解析时段 | 独立 GET 比较 |
| --- | --- | --- | --- | --- | --- | --- |
| c-01-attempt-1 | Sushi Tokyo Ten、 Shibuya ten | True | True | {'year': 2026, 'month': 11, 'day': 3} / 2 | None | NOT_COVERED |
| c-01-attempt-1 | Shibuya Sushi Matsumoto | True | True | {'year': 2026, 'month': 11, 'day': 3} / 2 | None | NOT_COMPARABLE |
| c-01-attempt-1 | Edomae Sushi Sushi Fuku | True | True | {'year': 2026, 'month': 11, 'day': 3} / 2 | None | NOT_COVERED |
| c-01-attempt-1 | Shibuya Sushi Sen | True | True | {'year': 2026, 'month': 11, 'day': 3} / 2 | None | NOT_COMPARABLE |
| c-01-attempt-1 | Sushi Sho Issekisanchou | True | True | {'year': 2026, 'month': 11, 'day': 3} / 2 | None | NOT_COMPARABLE |
