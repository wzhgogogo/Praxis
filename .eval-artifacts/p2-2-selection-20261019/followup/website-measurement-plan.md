# 官网链接：离线测量与以后抓取方案

Status: approved offline measurement / future fetch not authorized in this batch。

## 本轮范围与独立预期

历史依据为复核c816e74补充：部分Google候选只有网站字段，尚不知道该页面是否含已支持的门店预约入口。没有相应访问录制，不能把未抓取样本计为“找不到链接”。

复用原52产物的冻结 `../timing-inputs.json`，不引入新Gold、预算或平台。官网统计脚本 `measure-website-links.mjs` 先提交，再运行一次原产物测量；源文件/每个输入SHA校验失败即停止，不漏掉坏输入来降低分母。完整Live取SEARCH_COMPLETED原始事件，P21仅发现取SOURCE_FIRST_BATCH原trace；不用后续补全过的最终状态。

每run按Google place ID首见去重。计DIRECT_SOURCE_PAGE、WEBSITE_FIELD_ONLY、NO_WEBSITE_FIELD、UNUSABLE_WEBSITE_FIELD。路径使用现有Pack，统计层不增加站点名分支。Google网站字段合法但没有支持入口，只是“待查网站字段”的代理量，可能是餐厅官网、社交页、不支持的平台或总店；真实官网归属和出链命中率均未评估。

同时给每run出现数和跨run唯一place ID；跨run分类变化单列OBSERVATION_VARIANT，不选最有利的一次。缺Google候选记录时分母为空，比例null；不推断成功空结果。检查点C不在冻结manifest中，C未评估。

控制采用预先固定的字面预期：8次候选观察/7个ID，2直达、2网站字段待查、1无网站、2不可用；后续同ID富化不能改写首见，跨run冲突保留variant；凭据URL不输出，SHA错即拒绝。脚本只读本地与写报告，fetch显式拒绝，0模型，不加载.env。Evaluator仅补诊断计数，不评价当前网站成功率、来源身份或S0。

## 可复现命令

```sh
node --import tsx .eval-artifacts/p2-2-selection-20261019/followup/measure-website-links.mjs --self-test
node --import tsx .eval-artifacts/p2-2-selection-20261019/followup/measure-website-links.mjs
```

输出website-link-statistics.json；来源/每run/分组/跨run唯一计数保留。沿用第4段生产五门禁，本段仅离线诊断脚本与文档，无生产行为修改；增加上述有独立字面预期的控制。

## 以后网络恢复且用户授权后的最小抓取

1. 冻结待查place ID、原Google网站URL和原观察引用，按门店/URL去重；不把社交或不支持平台预先认作官网。优先复核本轮WEBSITE_FIELD_ONLY子集，不增加Google查询。
2. 每家一次公开GET，0模型，不登录、不填表；同origin建议2秒间隔。保留状态码、最终/重定向URL、HTML与SHA、耗时。重定向若需额外请求，先按原响应记录为未读取，不在“一次”预算里隐式增加访问。
3. 只解析已收到HTML的链接；由来源Pack确认是否为其支持的具体门店入口，不按共享层域名表猜路径。未支持平台/表单只分类，不访问下一步，不执行预约。
4. 分别报告可读率、明确官网率、已支持门店链接命中数，以及未读取/繁忙/不支持/归属未明分母；命中不等于同店或有位，后续名称加地址或电话、请求指纹/新鲜度/HARD规则仍完整执行。
5. 在固定预算内给出入口解析省时与有效产出对照，再由用户决定是否接线；未取得真实数据前不承诺收益，也不临时用命中比例修改本轮通过门槛。

本文件只描述以后方案；没有实现或执行抓取器。
