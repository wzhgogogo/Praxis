# 3b C 批次3：结构化地址与有界具名检索

- Evidence status: draft / not integrated；已暴露开发数据，非Clean Baseline。
- Timezone: Vienna CET UTC+01:00。
- Base: branch bf12aaf0；开始前以9181eee9整合main/90b464d8，保留双方原提交与文档、88条账本；同ID的C批次1准备快照仅由C自己的已完成记录承接，计数和共同字段相同，main原账本由sourceSnapshot和Git保留。

## 切片与验收

用户可观察结果：Google候选的原名检索未确认同店时，只增加一种经逐字核对的替代检索；完整日文地址不再把建筑数字、缺失楼层或B1拼写误当门牌冲突。身份仍由既有resolver接纳，邮编/明确门牌/明确楼层冲突拒绝，名称或检索命中不构成身份。

完成证据：有效红灯→绿灯；29份原保存页复算；批次2保存检索响应离线组合；两项获批G2原页基线更新、独立G2与五门禁全部绿，逐项前后净树；输入和脚本先提交并冻结SHA。Mock/Replay/真实调用单列，具名Prompt26真实24/24沿用批次2，不添加代码保名。

停止：门禁两次修复仍红、S0、身份规则放宽或未获批跨归属/版本冲突、额度/基础设施失败。可选旧样本GET超时仅停可选阶段，不影响本批离线工作。完成后推工作分支供复核，不合main。

### 数量去重（用户已确认，需复核者知晓）

旧12家已经包含nr-004/016/024，不能再加三次；nr-020因邮编冲突明确保持UNKNOWN。用户确认按“三家恢复、nr-002接纳、nr-020/029拒绝、错认0且无新增退化”验收；冻结29份已访问页的正确接纳预期至少12/29，而非16/29。未访问的详情和认证页不进入此分母。

## 修改前范围（9181eee9行号）

- `src/integrations/restaurant-availability/outlet-identity.ts`：postalCode/withoutPostal 8–15、UNIT_PATTERN及unitTokens/withoutUnits 17–43、streetNumbers/tokens/sameSequence 45–56、possibleFloorPostalVariation/hasSufficientAddress 58–77、compareCompleteOutletAddress/sameCompleteOutletAddress 79–109。按字段比较，只把可比字段的明确矛盾作为CONFLICT；楼层规范化、结构门牌、建筑辅助，不新增电话或名称豁免。
- G2例外仅`src/harness/browser/fixtures/dom-change/baseline.json`中tabelog-detail-01/02原页identity:address：分别改为`1710021 東京都豊島区西池袋5-8-9`、`1730014 東京都板橋区大山東町60-15 クルーズ大山`；其他字段/页、变异期望、评分器和变异规则不改。
- Review record: independent reviewer (Claude), 2026-10-28；用户转达已核对两地址在对应原保存页，与Q21/Q22原文位置一致。实施方不读取G1答案文件。
- 生产接线范围：两站具名发现/身份解析、source-pack构造上下文、LiveBrowserAvailability中同一模型预算，替代检索独立对象，不改B的Agent Prompt/State或G3日历读取。

## 授权与输入隔离

本批最多模型20、Google10、公开GET12（仅可选旧15例），Live0；共享3b仍为模型1000/GET40/Live18/环境重跑4，批次开始累计40/18/0/0，Google11。实际逐次记账、按ID并集，不占用3a′。

必须离线验证可用已保存响应完成，新增调用只在必要且预算许可时使用。凭据若需使用，仅Node runner `--env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env`注入；不独立读取、打印、复制、哈希或暂存该文件。Gold rst_id只用于事后核对，不进入检索提议/Prompt。

## 结果

待实施与验证。检索Prompt/Schema的对象及版本将在修改前补记；全局“两站合计/每来源两次”的范围已向用户澄清，先继续独立的地址工作。
