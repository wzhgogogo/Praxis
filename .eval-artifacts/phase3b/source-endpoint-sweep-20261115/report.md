# Tabelog / TableCheck 已用路径连通检查
2026-11-15 CET。冻结产品a66a2edc保持净树。用户要求将两个网站之前用到的路径都试一遍，按公开录制去重测试。

**本轮实际页面的关键链路均返回200，之前的403未再出现。** 首轮原生页面检查：Tabelog主文档和commons.js 4.029秒完成；TableCheck主文档、主脚本、catalog、geolocation 3.624秒完成。直接打开店页时页面标题已正确且SETTLED，但没有捕获shop API请求，所以保留该次等待超时，未把它认定为网络403。

## 覆盖与结果
从公开D02-V与成功D8录制提取23项去重路径，保存具体URL、原HAR位置和SHA。重复店铺ID或历史脚本版本合并；没有穷举所有曾出现的资源URL。

| 类别 | 本轮结果 |
|---|---|
| Tabelog首页、JS、CSS | 原生加载200；历史静态路径200 |
| Tabelog地区、分类、店页、菜单、help条款页 | 200；其中1条旧目录URL正常301 |
| reserve_date_status_list、initial_vacancy、find_vacancy、find_vacancy_member_by_date | 所有测试GET均200 |
| Tabelog关键词联想 | 直接重放历史URL为400；实际页面填写后，网站原生请求200 |
| TableCheck主站、主JS、字体CSS、地图sprite | 200 |
| catalog、geolocation | 200 |
| search四种文字投影及其他已审核查询 | 实际页面生成的搜索GET共10次200，预检204 |
| shop详情 | 实际点击唯一精确联想后，shop GET 200，正确店页SETTLED |
| availability_calendar_v2 | 页面自然触发已有审核合同的只读POST 200，预检204 |

23项URL直接检查中19项200、1项301、1项400、2项未取得HTTP状态。对3个上下文缺项又按实际页面操作核对：Tabelog关键词框、TableCheck Destination与唯一精确联想。实际来源生成的联想、搜索、店铺请求均200。TableCheck最终URL为/en/nakamata-nodoguro-ginza，标题“Specializing in Nodoguro Ginza Nakamata - Restaurant Guide - TableCheck”，SETTLED。日历原始查询未保留，没有补造参数，改用本次页面自然生成的已审核只读请求验证。没有进入预约表单或做外部写操作。

## 方法与异常
全部沿原createG6LiveBrowser、网络分流和Guard。单请求20秒、补查来源窗口45秒，明确GET间隔至少5秒。URL重放的资源类型/浏览器上下文可与原生交互不同，不能把其400或Guard限制直接当成网站断连。原始URL重放和实际页面结果分别保存。本轮只验证HTTP及加载连通，不证明目标日期库存、身份、B1或整单交付。

独立驱动首次误导入另一份Playwright依赖，无法取得page句柄，15条检查意图在本地失败，尚未发出请求。它们不是网站失败。驱动已停止，原记录与原账本保留；仅修正外层依赖路径，about:blank零外网预检通过后冻结f3462105，才继续真实检查，产品代码未改。

## 记账与完整性
0完整Live、0真实模型调用。四份本批诊断账本分别计3、17、19、2个评估GET意图，共41；其中首次驱动的15条为本地未发送错误，实际发送的明确入口/检查操作26次，页面后台资源请求另见响应元数据。没有静默删除这15条旧记账，也没有将其记为15次远端失败。旧任务预算账本未使用。

全批只保存响应状态、大小和SHA，不保存正文或请求头；当前凭据扫描结果见privacy-scan.json。原先20秒等待、400、未发出的检查、本地驱动异常均原样保留。源码仍a66a2edc，未改代理规则、主工作区或产品代码。

[实际页面与API证据](ui-context/result.json) · [23项URL原始检查](corrected/result.json) · [去重清单及来源](corrected/manifest.json) · [原生首轮加载](../three-path-connectivity-20261115/result.json) · [原失败驱动记录](result.json)。
